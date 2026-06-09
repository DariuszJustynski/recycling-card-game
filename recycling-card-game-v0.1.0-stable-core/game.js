/* =========================================================================
 * Gra karciana – Recykling (Hanafuda-inspired)
 * Stable v1.0 — single, static, vanilla-JS build.
 *
 * Mechanics base : "Gra - wersje/Gra 2"
 * Features added : "Gra - wersje/Ostatnia wersja do poprawy"
 *                  (playerName, startGame, endGame, saveScore, high scores)
 * ========================================================================= */

'use strict';

/* ----------------------------- Configuration ---------------------------- */

const START_TIME = 60;            // seconds
const PAIR_POINTS = 10;           // points for a valid pair removal
const PAIR_TIME_BONUS = 5;        // +seconds for a valid pair removal
const MISSED_PAIR_PENALTY = 300;  // points lost when a 3rd same-type card lands

// Draw-streak bonuses (look-back distance in draw history -> points)
const STREAK_BONUS = {
    backToBack: 100, // same type one after another
    gap1: 70,        // one card between
    gap2: 50,        // 1:3 relation
    gap3: 40,        // 1:4 relation
    gap4: 10         // 1:5 relation
};

// Dangerous waste: geometric point penalty (base * 2^(n-1)) + one-off time loss.
const DANGEROUS = {
    'Odpady Nuklearne':   { base: 5, time: 10 },
    'Odpady Niebezpieczne': { base: 2, time: 5 },
    'Odpady Zmieszane':   { base: 1, time: 1 }
};

const HIGH_SCORES_KEY = 'recyklingHighScores';
const MAX_HIGH_SCORES = 10;

/* ------------------------------- Game state ------------------------------ */

let deck = [];
let playerHand = [];
let recycleBin = [];
let selectedCards = [];          // indices into recycleBin
let points = 0;
let lastCard = null;
let cardHistory = [];            // every drawn card, in order
let recycleBinCounts = {};       // name -> count currently in the bin
let dangerousSeen = {};          // name -> how many of this dangerous type entered the bin
let timeLeft = START_TIME;
let timer = null;                // the single interval handle
let playerName = '';
let gameOver = false;

/* ------------------------------ DOM helpers ------------------------------ */

const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    $('startGame').addEventListener('click', startGame);
    $('drawCard').addEventListener('click', drawCard);
    $('playAgain').addEventListener('click', () => location.reload());
    $('saveScoreBtn').addEventListener('click', () => {
        saveScore();
        $('saveScoreBtn').disabled = true;
        $('saveScoreBtn').innerText = 'Zapisano ✔';
        displayHighScores();
    });

    // Allow Enter in the name field to start.
    $('playerName').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') startGame();
    });

    displayHighScores(); // show any previously saved scores on the setup screen
});

/* ------------------------------ Deck building ---------------------------- */
/* Preserved from "Gra 2": 12 categories x 4 = 48 cards. */

function generateDeck() {
    const categories = [
        { month: 1,  name: 'Papier',              difficulty: 'easy',   weight: 1,  points: 1 },
        { month: 2,  name: 'Szkło',               difficulty: 'medium', weight: 2,  points: 2 },
        { month: 3,  name: 'Odpady Nuklearne',    difficulty: 'hard',   weight: 10, points: 5 },
        { month: 4,  name: 'Plastik',             difficulty: 'easy',   weight: 3,  points: 3 },
        { month: 5,  name: 'Metal',               difficulty: 'medium', weight: 4,  points: 4 },
        { month: 6,  name: 'Bioodpady',           difficulty: 'easy',   weight: 2,  points: 2 },
        { month: 7,  name: 'Elektronika',         difficulty: 'medium', weight: 5,  points: 4 },
        { month: 8,  name: 'Odpady Niebezpieczne', difficulty: 'hard',  weight: 7,  points: 4 },
        { month: 9,  name: 'Odpady Zmieszane',    difficulty: 'hard',   weight: 5,  points: 3 },
        { month: 10, name: 'Drewno',              difficulty: 'easy',   weight: 2,  points: 2 },
        { month: 11, name: 'Tekstylia',           difficulty: 'medium', weight: 3,  points: 3 },
        { month: 12, name: 'Ceramika',            difficulty: 'hard',   weight: 6,  points: 5 }
    ];

    const cards = [];
    categories.forEach((category) => {
        for (let i = 0; i < 4; i++) {
            cards.push({ ...category });
        }
    });

    return shuffle(cards);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/* --------------------------------- Flow ---------------------------------- */

function startGame() {
    const name = $('playerName').value.trim();
    if (name === '') {
        alert('Proszę wprowadzić swoje imię.');
        return;
    }
    playerName = name;

    // Fresh state
    deck = generateDeck();
    playerHand = [];
    recycleBin = [];
    selectedCards = [];
    points = 0;
    lastCard = null;
    cardHistory = [];
    recycleBinCounts = {};
    dangerousSeen = {};
    timeLeft = START_TIME;
    gameOver = false;

    $('setupSection').style.display = 'none';
    $('endSection').style.display = 'none';
    $('gameSection').style.display = 'block';

    renderHand();
    renderRecycleBin();
    updatePoints();
    updateTimer();

    startTimer(); // exactly one interval, only after Start
}

/* Only ONE interval is ever created. */
function startTimer() {
    if (timer !== null) return; // guard against a second interval
    timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 0;
            updateTimer();
            endGame();
            return;
        }
        updateTimer();
    }, 1000);
}

function endGame() {
    clearInterval(timer);  // always stop the timer
    timer = null;
    gameOver = true;

    $('gameSection').style.display = 'none';
    $('endSection').style.display = 'block';
    $('finalScore').innerText = `${playerName}, Twój wynik: ${points} punktów.`;
    $('saveScoreBtn').disabled = false;
    $('saveScoreBtn').innerText = 'Zapisz wynik';
    displayHighScores();
}

/* --------------------------------- Draw ---------------------------------- */
/* drawCard ONLY puts the card into the hand. No auto-bin, no auto-pairing. */

function drawCard() {
    if (gameOver) return;
    if (deck.length === 0) {
        displayMessage('Brak więcej kart w talii.');
        endGame();
        return;
    }
    const card = deck.pop();
    playerHand.push(card);
    cardHistory.push(card);
    checkForBonus(card);
    renderHand();
}

/* Draw-streak bonuses, preserved from "Gra 2". */
function checkForBonus(card) {
    let bonus = 0;
    let message = '';
    const h = cardHistory;
    const n = h.length;

    if (lastCard && lastCard.name === card.name) {
        bonus = STREAK_BONUS.backToBack;
        message = `Bonus +${bonus}: dwie takie same karty jedna po drugiej!`;
    } else if (n >= 3 && h[n - 3].name === card.name) {
        bonus = STREAK_BONUS.gap1;
        message = `Bonus +${bonus}: te same karty co druga!`;
    } else if (n >= 4 && h[n - 4].name === card.name) {
        bonus = STREAK_BONUS.gap2;
        message = `Bonus +${bonus}: te same karty w relacji 1:3!`;
    } else if (n >= 5 && h[n - 5].name === card.name) {
        bonus = STREAK_BONUS.gap3;
        message = `Bonus +${bonus}: te same karty w relacji 1:4!`;
    } else if (n >= 6 && h[n - 6].name === card.name) {
        bonus = STREAK_BONUS.gap4;
        message = `Bonus +${bonus}: te same karty w relacji 1:5!`;
    }

    if (bonus > 0) {
        points += bonus;
        updatePoints();
        displayMessage(message);
    }

    lastCard = card;
}

/* ------------------------------- Hand → Bin ------------------------------ */

function renderHand() {
    const handEl = $('hand');
    handEl.innerHTML = '';
    playerHand.forEach((card, index) => {
        const el = document.createElement('div');
        el.className = `card ${card.difficulty}`;
        el.innerText = card.name;
        el.addEventListener('click', () => addToRecycleBin(index));
        handEl.appendChild(el);
    });
}

/* Move one card from the hand to the bin.
 * Dangerous-waste penalties are applied EXACTLY ONCE here, on entry. */
function addToRecycleBin(index) {
    if (gameOver) return;

    const card = playerHand.splice(index, 1)[0];
    recycleBin.push(card);

    recycleBinCounts[card.name] = (recycleBinCounts[card.name] || 0) + 1;

    applyDangerousPenalty(card);

    // Missed-pair rule: a 3rd same-type card in the bin costs 300 points.
    checkRecycleBin();

    renderHand();
    renderRecycleBin();
    updatePoints();
}

/* One-off penalty (points + time) the moment a dangerous card enters the bin. */
function applyDangerousPenalty(card) {
    const rule = DANGEROUS[card.name];
    if (!rule) return;

    dangerousSeen[card.name] = (dangerousSeen[card.name] || 0) + 1;
    const n = dangerousSeen[card.name];

    const penalty = rule.base * Math.pow(2, n - 1); // geometric: base, base*2, base*4, ...
    points -= penalty;
    timeLeft -= rule.time;
    if (timeLeft < 0) timeLeft = 0;
    updateTimer();

    displayMessage(`Kara -${penalty} pkt i -${rule.time}s za: ${card.name}.`);
}

/* -300 when a third same-type card lands without the pair being removed. */
function checkRecycleBin() {
    for (const name in recycleBinCounts) {
        if (recycleBinCounts[name] >= 3) {
            points -= MISSED_PAIR_PENALTY;
            displayMessage(`Przeoczono parę: ${name}. -${MISSED_PAIR_PENALTY} punktów.`);
            // Count stays as-is; the player still holds the cards in the bin.
            break;
        }
    }
}

/* ------------------------------- Bin & pairs ----------------------------- */

function renderRecycleBin() {
    const binEl = $('bin');
    binEl.innerHTML = '';
    recycleBin.forEach((card, index) => {
        const el = document.createElement('div');
        el.className = `card ${card.difficulty}`;
        el.innerText = card.name;
        if (selectedCards.includes(index)) {
            el.classList.add('selected');
        }
        el.addEventListener('click', () => selectCard(index));
        binEl.appendChild(el);
    });
}

function selectCard(index) {
    if (gameOver) return;

    if (selectedCards.includes(index)) {
        selectedCards = selectedCards.filter((i) => i !== index);
    } else {
        selectedCards.push(index);
    }

    if (selectedCards.length === 2) {
        checkForPair();
    }

    renderRecycleBin();
}

/* ORDER-INDEPENDENT pair removal:
 * sort the selected indices, then splice the HIGHER index first so the
 * lower index is not shifted before it is removed. */
function checkForPair() {
    const [firstIndex, secondIndex] = [...selectedCards].sort((a, b) => a - b);
    const firstCard = recycleBin[firstIndex];
    const secondCard = recycleBin[secondIndex];

    if (firstCard && secondCard && firstCard.name === secondCard.name) {
        recycleBin.splice(secondIndex, 1); // higher index first
        recycleBin.splice(firstIndex, 1);  // then lower index

        recycleBinCounts[firstCard.name] -= 2;
        if (recycleBinCounts[firstCard.name] <= 0) {
            delete recycleBinCounts[firstCard.name];
        }

        points += PAIR_POINTS;
        timeLeft += PAIR_TIME_BONUS;
        updatePoints();
        updateTimer();
        displayMessage(`Usunięto parę: ${firstCard.name}. +${PAIR_POINTS} pkt, +${PAIR_TIME_BONUS}s.`);
    }
    // If names differ, nothing is removed.

    selectedCards = [];
    renderRecycleBin();
}

/* ------------------------------- Rendering ------------------------------- */

/* updatePoints ONLY renders the current score. It never recomputes penalties. */
function updatePoints() {
    $('points').innerText = `Punkty: ${points}`;
}

function updateTimer() {
    $('timer').innerText = `Czas: ${timeLeft}s`;
}

let messageTimeout = null;
function displayMessage(message) {
    const el = $('messageContainer');
    el.innerText = message;
    if (messageTimeout) clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => { el.innerText = ''; }, 3000);
}

/* ------------------------------ High scores ------------------------------ */
/* All localStorage access is guarded with try/catch so corrupted or
 * unavailable storage never breaks the game. */

function readHighScores() {
    try {
        const raw = localStorage.getItem(HIGH_SCORES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(
            (s) => s && typeof s.name === 'string' && typeof s.points === 'number'
        );
    } catch (e) {
        return []; // corrupted data -> behave as if there are no scores
    }
}

function saveScore() {
    const scores = readHighScores();
    scores.push({ name: playerName, points: points, date: new Date().toISOString() });
    scores.sort((a, b) => b.points - a.points);
    const top = scores.slice(0, MAX_HIGH_SCORES);
    try {
        localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(top));
    } catch (e) {
        displayMessage('Nie udało się zapisać wyniku (localStorage niedostępny).');
    }
}

function displayHighScores() {
    const list = $('scoreList');
    list.innerHTML = '';
    const scores = readHighScores();
    if (scores.length === 0) {
        const li = document.createElement('li');
        li.innerText = 'Brak zapisanych wyników.';
        list.appendChild(li);
        return;
    }
    scores.forEach((score, i) => {
        const li = document.createElement('li');
        li.innerText = `${i + 1}. ${score.name}: ${score.points}`;
        list.appendChild(li);
    });
}
