/* =========================================================================
 * Recycling Waste Fall — v0.2.0-experimental
 * Falling-waste puzzle game (Tetris-inspired, NOT a clone).
 *
 * Experimental branch of the Recycling Card Game.
 * The stable card game (v0.1.0-stable-core) is unchanged.
 *
 * Vanilla JS, no frameworks, no build tools, no backend.
 * ========================================================================= */

'use strict';

/* ================================ CONFIG ================================= */

const CONFIG = {
    cols: 12,                 // well width in cells
    rows: 16,                 // well height in cells
    topZoneRows: 2,           // fixing a block here ends the game
    baseDropMs: 700,          // base interval between falls (level 1, speed 1.0)
    levelUpEverySec: 30,      // level increases every N seconds
    levelSpeedFactor: 0.15,   // each level makes drops this much faster
    minDropMs: 90,            // hard floor for drop interval
    mismatchPenalty: 5,       // small penalty for selecting two different types
    pairBaseScore: 10,        // flat score for any valid pair
    maxHighScores: 10,
    storageKey: 'wasteFallHighScores'
};

/* Waste catalogue: name, CSS class (color/visual), shape (w x h in cells),
 * relative fall speed, score value, penalty value (applied once when a
 * dangerous block becomes fixed in the well). */
const WASTE_TYPES = [
    { id: 'paper',       name: 'Paper',       css: 'w-paper',       w: 1, h: 1, speed: 0.7,  score: 5,  penalty: 0   },
    { id: 'glass',       name: 'Glass',       css: 'w-glass',       w: 1, h: 1, speed: 1.0,  score: 8,  penalty: 0   },
    { id: 'plastic',     name: 'Plastic',     css: 'w-plastic',     w: 2, h: 1, speed: 1.0,  score: 8,  penalty: 0   },
    { id: 'metal',       name: 'Metal',       css: 'w-metal',       w: 1, h: 2, speed: 1.2,  score: 10, penalty: 0   },
    { id: 'bio',         name: 'Bio Waste',   css: 'w-bio',         w: 1, h: 1, speed: 0.7,  score: 5,  penalty: 0   },
    { id: 'electronics', name: 'Electronics', css: 'w-electronics', w: 2, h: 2, speed: 1.4,  score: 14, penalty: 0   },
    { id: 'nuclear',     name: 'Nuclear',     css: 'w-nuclear',     w: 2, h: 1, speed: 1.6,  score: 20, penalty: 50  },
    { id: 'hazardous',   name: 'Hazardous',   css: 'w-hazardous',   w: 1, h: 2, speed: 1.4,  score: 16, penalty: 30  },
    { id: 'mixed',       name: 'Mixed',       css: 'w-mixed',       w: 1, h: 1, speed: 1.2,  score: 6,  penalty: 15  },
    { id: 'wood',        name: 'Wood',        css: 'w-wood',        w: 3, h: 1, speed: 0.7,  score: 9,  penalty: 0   },
    { id: 'textiles',    name: 'Textiles',    css: 'w-textiles',    w: 2, h: 1, speed: 1.0,  score: 8,  penalty: 0   },
    { id: 'ceramics',    name: 'Ceramics',    css: 'w-ceramics',    w: 1, h: 1, speed: 1.4,  score: 12, penalty: 0   }
];

/* ================================ STATE ================================== */

const STATE = {
    running: false,
    gameOver: false,
    grid: [],            // rows x cols, each cell = block id or null
    blocks: new Map(),   // id -> block object
    falling: null,       // block id currently falling (or null)
    nextBlockId: 1,
    score: 0,
    elapsedSec: 0,
    level: 1,
    selected: [],        // up to 2 selected block ids
    rafId: null,         // single requestAnimationFrame handle
    lastTs: null,
    dropAcc: 0,          // ms accumulated toward next drop step
    secAcc: 0            // ms accumulated toward next elapsed second
};

/* ============================== DOM handles ============================== */

const $ = (id) => document.getElementById(id);
let wellEl, scoreEl, timerEl, levelEl, selectedEl, messageEl, startBtn, scoreListEl;

document.addEventListener('DOMContentLoaded', () => {
    wellEl = $('well');
    scoreEl = $('score');
    timerEl = $('timer');
    levelEl = $('level');
    selectedEl = $('selectedPanel');
    messageEl = $('messageContainer');
    startBtn = $('startBtn');
    scoreListEl = $('scoreList');

    // Size the well from CONFIG so CSS and JS stay in sync.
    wellEl.style.setProperty('--cols', CONFIG.cols);
    wellEl.style.setProperty('--rows', CONFIG.rows);

    // ONE delegated click listener for every waste block, bound once.
    wellEl.addEventListener('click', (e) => {
        const blockEl = e.target.closest('.waste');
        if (!blockEl) return;
        selectWaste(Number(blockEl.dataset.id));
    });

    startBtn.addEventListener('click', restartGame);

    $('saveBtn').addEventListener('click', () => {
        const name = $('saveName').value.trim();
        if (name === '') { showMessage('Enter a name to save your score.', 'bad'); return; }
        saveScore(name);
        $('saveBtn').disabled = true;
        renderHighScores();
        showMessage('Score saved!', 'good');
    });

    loadScores();
    renderHighScores();
});

/* ============================ Waste lifecycle ============================ */

function createWaste(type, x, y) {
    const block = {
        id: STATE.nextBlockId++,
        type: type,
        x: x,
        y: y,
        fixed: false,
        el: null
    };
    STATE.blocks.set(block.id, block);

    // Create its DOM element once; positions update in render().
    const el = document.createElement('div');
    el.className = `waste ${type.css} shape-${type.w}x${type.h}`;
    el.dataset.id = block.id;
    el.title = type.name;
    el.innerHTML = `<span class="waste-label">${type.name}</span>`;
    block.el = el;
    wellEl.appendChild(el);

    return block;
}

function spawnWaste() {
    const type = WASTE_TYPES[Math.floor(Math.random() * WASTE_TYPES.length)];
    const maxX = CONFIG.cols - type.w;
    const x = Math.floor(Math.random() * (maxX + 1));
    const block = createWaste(type, x, 0);

    // If the spawn position is already blocked, the well is full → game over.
    if (!areaFree(block.x, block.y, type.w, type.h, block.id)) {
        fixBlock(block); // will overlap the top zone and end the game
        return;
    }
    STATE.falling = block.id;
}

/* ============================== Grid helpers ============================= */

function emptyGrid() {
    return Array.from({ length: CONFIG.rows }, () => Array(CONFIG.cols).fill(null));
}

function areaFree(x, y, w, h, ignoreId) {
    for (let r = y; r < y + h; r++) {
        for (let c = x; c < x + w; c++) {
            if (r < 0 || r >= CONFIG.rows || c < 0 || c >= CONFIG.cols) return false;
            const cell = STATE.grid[r][c];
            if (cell !== null && cell !== ignoreId) return false;
        }
    }
    return true;
}

function stampBlock(block, value) {
    const { w, h } = block.type;
    for (let r = block.y; r < block.y + h; r++) {
        for (let c = block.x; c < block.x + w; c++) {
            if (r >= 0 && r < CONFIG.rows && c >= 0 && c < CONFIG.cols) {
                STATE.grid[r][c] = value;
            }
        }
    }
}

function fixBlock(block) {
    block.fixed = true;
    stampBlock(block, block.id);
    STATE.falling = null;

    // Dangerous waste: one-off penalty the moment it settles.
    if (block.type.penalty > 0) {
        STATE.score -= block.type.penalty;
        showMessage(`⚠ ${block.type.name} settled: -${block.type.penalty} points!`, 'bad');
        updateScore();
    }

    // Game over: the fixed block overlaps the top zone.
    if (block.y < CONFIG.topZoneRows) {
        endGame();
    }
}

/* ============================== Game loop ================================ */
/* ONE requestAnimationFrame loop. No other timers exist. */

function loop(ts) {
    if (!STATE.running) return;

    if (STATE.lastTs === null) STATE.lastTs = ts;
    const dt = ts - STATE.lastTs;
    STATE.lastTs = ts;

    updateGame(dt);
    render();

    STATE.rafId = requestAnimationFrame(loop);
}

function updateGame(dt) {
    // Elapsed time + level scaling
    STATE.secAcc += dt;
    while (STATE.secAcc >= 1000) {
        STATE.secAcc -= 1000;
        STATE.elapsedSec++;
        const newLevel = 1 + Math.floor(STATE.elapsedSec / CONFIG.levelUpEverySec);
        if (newLevel !== STATE.level) {
            STATE.level = newLevel;
            showMessage(`Level ${STATE.level} — waste falls faster!`, 'good');
        }
    }

    // Falling logic
    if (STATE.falling === null) {
        if (!STATE.gameOver) spawnWaste();
        return;
    }

    const block = STATE.blocks.get(STATE.falling);
    if (!block) { STATE.falling = null; return; }

    const speed = block.type.speed * (1 + (STATE.level - 1) * CONFIG.levelSpeedFactor);
    const dropMs = Math.max(CONFIG.minDropMs, CONFIG.baseDropMs / speed);

    STATE.dropAcc += dt;
    while (STATE.dropAcc >= dropMs) {
        STATE.dropAcc -= dropMs;
        const { w, h } = block.type;
        if (areaFree(block.x, block.y + 1, w, h, block.id)) {
            block.y += 1;
        } else {
            fixBlock(block);
            STATE.dropAcc = 0;
            break;
        }
    }
}

/* ================================ Render ================================= */

function render() {
    // Position every live block; DOM nodes are reused, never re-created.
    STATE.blocks.forEach((block) => {
        const el = block.el;
        el.style.left = `calc(${block.x} * var(--cell))`;
        el.style.top = `calc(${block.y} * var(--cell))`;
        el.classList.toggle('selected', STATE.selected.includes(block.id));
        el.classList.toggle('falling', STATE.falling === block.id);
    });

    timerEl.innerText = formatTime(STATE.elapsedSec);
    levelEl.innerText = `Level ${STATE.level}`;
    renderSelectedPanel();
}

function renderSelectedPanel() {
    const names = STATE.selected
        .map((id) => STATE.blocks.get(id))
        .filter(Boolean)
        .map((b) => `<span class="chip ${b.type.css}">${b.type.name}</span>`);
    selectedEl.innerHTML = names.length
        ? `Selected: ${names.join(' + ')}`
        : 'Selected: <em>none — click two matching waste blocks</em>';
}

function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
}

/* ============================ Pair selection ============================= */

function selectWaste(id) {
    if (!STATE.running || STATE.gameOver) return;
    const block = STATE.blocks.get(id);
    if (!block) return;

    // Clicking an already-selected block DESELECTS it (never removes it).
    if (STATE.selected.includes(id)) {
        STATE.selected = STATE.selected.filter((s) => s !== id);
        render();
        return;
    }

    // Only two blocks may ever be selected/compared.
    if (STATE.selected.length >= 2) return;

    STATE.selected.push(id);

    if (STATE.selected.length === 2) {
        checkSelectedPair();
    }
    render();
}

/* Order-independent: comparison is by type id, selection order irrelevant. */
function checkSelectedPair() {
    const [a, b] = STATE.selected.map((id) => STATE.blocks.get(id));

    if (a && b && a.type.id === b.type.id) {
        removeWastePair(a, b);
    } else if (a && b) {
        applyPenalty(a, b);
    }

    // Selection is always cleared after a comparison.
    STATE.selected = [];
}

function removeWastePair(a, b) {
    const gained = CONFIG.pairBaseScore + a.type.score * 2;
    STATE.score += gained;

    [a, b].forEach((block) => {
        if (block.fixed) stampBlock(block, null);
        if (STATE.falling === block.id) STATE.falling = null; // removed mid-fall
        block.el.remove();
        STATE.blocks.delete(block.id);
    });

    settleFloatingBlocks();
    updateScore();
    showMessage(`♻ Recycled a ${a.type.name} pair: +${gained} points!`, 'good');
}

function applyPenalty(a, b) {
    STATE.score -= CONFIG.mismatchPenalty;
    updateScore();
    showMessage(`✖ ${a.type.name} ≠ ${b.type.name}: -${CONFIG.mismatchPenalty} points.`, 'bad');
}

/* After a pair disappears, fixed blocks above the gap drop straight down. */
function settleFloatingBlocks() {
    let moved = true;
    while (moved) {
        moved = false;
        // Bottom-up so lower blocks settle first.
        const fixedBlocks = [...STATE.blocks.values()]
            .filter((b) => b.fixed)
            .sort((x, y) => y.y - x.y);
        for (const block of fixedBlocks) {
            const { w, h } = block.type;
            if (areaFree(block.x, block.y + 1, w, h, block.id)) {
                stampBlock(block, null);
                block.y += 1;
                stampBlock(block, block.id);
                moved = true;
            }
        }
    }
}

/* ============================== Score / HUD ============================== */

function updateScore() {
    scoreEl.innerText = `Score: ${STATE.score}`;
}

let messageTimeout = null;
function showMessage(text, kind) {
    messageEl.innerText = text;
    messageEl.className = kind === 'bad' ? 'msg-bad' : 'msg-good';
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => { messageEl.innerText = ''; }, 2600);
}

/* ============================ Start / End ================================ */

function startGame() {
    if (STATE.running) return; // guard: never two loops

    STATE.running = true;
    STATE.gameOver = false;
    STATE.lastTs = null;
    STATE.dropAcc = 0;
    STATE.secAcc = 0;

    startBtn.innerText = 'Restart';
    showMessage('Waste incoming — match pairs before the well fills up!', 'good');
    STATE.rafId = requestAnimationFrame(loop);
}

function endGame() {
    STATE.running = false;
    STATE.gameOver = true;
    if (STATE.rafId !== null) {
        cancelAnimationFrame(STATE.rafId);
        STATE.rafId = null;
    }

    showMessage(`Game over! The well overflowed. Final score: ${STATE.score}`, 'bad');
    wellEl.classList.add('game-over');

    // Non-blocking inline save form (never a native modal).
    $('finalScoreText').innerText = `Final score: ${STATE.score} —`;
    $('saveBtn').disabled = false;
    $('saveRow').style.display = 'block';
    renderHighScores();
}

function restartGame() {
    // Full teardown of any previous run.
    if (STATE.rafId !== null) {
        cancelAnimationFrame(STATE.rafId);
        STATE.rafId = null;
    }
    STATE.blocks.forEach((b) => b.el.remove());
    STATE.blocks.clear();
    STATE.grid = emptyGrid();
    STATE.falling = null;
    STATE.nextBlockId = 1;
    STATE.score = 0;
    STATE.elapsedSec = 0;
    STATE.level = 1;
    STATE.selected = [];
    STATE.running = false;
    STATE.gameOver = false;
    wellEl.classList.remove('game-over');
    $('saveRow').style.display = 'none';

    updateScore();
    render();
    startGame();
}

/* ============================ High scores ================================ */
/* Separate localStorage key from the stable card game; guarded throughout. */

let highScores = [];

function loadScores() {
    try {
        const raw = localStorage.getItem(CONFIG.storageKey);
        if (!raw) { highScores = []; return; }
        const parsed = JSON.parse(raw);
        highScores = Array.isArray(parsed)
            ? parsed.filter((s) => s && typeof s.name === 'string' && typeof s.score === 'number')
            : [];
    } catch (e) {
        highScores = []; // corrupted storage never breaks the game
    }
}

function saveScore(name) {
    loadScores();
    highScores.push({ name: name, score: STATE.score, date: new Date().toISOString() });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, CONFIG.maxHighScores);
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(highScores));
    } catch (e) {
        showMessage('Could not save score (storage unavailable).', 'bad');
    }
}

function renderHighScores() {
    scoreListEl.innerHTML = '';
    if (highScores.length === 0) {
        const li = document.createElement('li');
        li.innerText = 'No scores yet.';
        scoreListEl.appendChild(li);
        return;
    }
    highScores.forEach((s) => {
        const li = document.createElement('li');
        li.innerText = `${s.name}: ${s.score}`;
        scoreListEl.appendChild(li);
    });
}
