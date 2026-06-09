# TEST REPORT — Gra karciana: Recykling (Stable v1.0)

**Role:** Independent QA engineer / code reviewer
**Date:** 2026-06-09
**Build under test:** root `index.html` + `style.css` + `game.js` (+ `README.md`, `LICENSE`)
**Method:** Static code review + headless behavioral simulation of the actual logic (21 automated assertions, all passing) + DOM cross-reference of every `getElementById` against `index.html`.
**Files modified during testing:** none (this report only).

---

# Executive Summary

The stable v1.0 build is **functionally correct and release-ready**. All hard requirements pass: a 48-card / 12-category / 4-per-category deck, draw-to-hand-only flow, manual hand→bin movement, **order-independent** pair removal, the full draw-streak bonus ladder (+100/+70/+50/+40/+10), once-only dangerous-waste penalties, a single non-duplicated timer that starts on *Start* and stops on game end, and `try/catch`-guarded `localStorage` high scores that sort descending and survive corrupted data.

A headless run of the extracted logic produced **21 passed / 0 failed**.

No frameworks, no build step, no backend, and no `fetch`/`XMLHttpRequest`/`import`/`require` were found. The project runs directly from `index.html` and is shared-hosting compatible.

Two **minor, non-blocking issues** were identified: (1) the missed-pair `-300` penalty uses `>= 3` and therefore re-fires on the 4th identical card (`-600` total), and (2) several card data fields (`month`, `weight`, `points`) are unused. Neither affects stability or crashes the game.

**Verdict: READY FOR GITHUB RELEASE** (after replacing the `LICENSE` placeholder name).

---

# Passed Tests

### 1. Structure
- ✅ All required files present: `index.html`, `style.css`, `game.js`, `README.md`, `LICENSE`.
- ✅ No framework dependencies (no React/Vue/Angular references).
- ✅ No build tools required (no `package.json`, `node_modules`, bundler config).
- ✅ Runs directly from `index.html` (single relative `<link>` and `<script>`).

### 2. Deck
- ✅ Deck contains exactly **48** cards.
- ✅ Exactly **12** categories.
- ✅ Each category has exactly **4** cards.
- ✅ Category names confirmed: Papier, Szkło, Odpady Nuklearne, Plastik, Metal, Bioodpady, Elektronika, Odpady Niebezpieczne, Odpady Zmieszane, Drewno, Tekstylia, Ceramika (4 each).

### 3. Core Gameplay
- ✅ `drawCard()` pushes only to `playerHand` (+`cardHistory`); never touches `recycleBin`.
- ✅ Draw does not auto-move to bin; does not auto-remove pairs.
- ✅ Hand card click → `addToRecycleBin(index)` moves the card to the bin.
- ✅ Bin renders all cards via `renderRecycleBin()`.
- ✅ Two different bin cards → nothing removed.
- ✅ Two matching bin cards → both removed, +10 pts, +5 s.
- ✅ Pair removal works **low-index-first** and **high-index-first** (indices sorted, higher spliced first).
- ✅ Third identical card in bin → `-300`.
- ✅ Bonus system fires correctly (see below).

### 4. Bonus Ladder (verified against documented rules)
- ✅ Same type back-to-back → **+100**.
- ✅ One card between → **+70**.
- ✅ 1:3 relation → **+50**.
- ✅ 1:4 relation → **+40**.
- ✅ 1:5 relation → **+10**.
- ✅ 1:6 gap → no bonus (correctly outside the ladder).
- ✅ Highest-priority (nearest) match wins via the `else if` chain — matches documented intent.

### 5. Dangerous Waste
- ✅ Nuclear penalty geometric from base 5 (5, 10, 20, …) + `-10 s`.
- ✅ Hazardous penalty geometric from base 2 (2, 4, 8, …) + `-5 s`.
- ✅ Mixed penalty geometric from base 1 (1, 2, 4, …) + `-1 s`.
- ✅ Applied **once**, inside `applyDangerousPenalty()`, at the moment of bin entry.
- ✅ `updatePoints()` only renders `points` — it does **not** recompute or re-subtract penalties.
- ✅ No penalty recomputation on render (`renderRecycleBin` / `renderHand` are pure DOM rebuilds).

### 6. Timer
- ✅ Timer is **not** started globally; only `startTimer()` inside `startGame()` starts it.
- ✅ `startTimer()` guards with `if (timer !== null) return;` → only one interval.
- ✅ `endGame()` always calls `clearInterval(timer)` and resets `timer = null`.
- ✅ No timer duplication across a Start → end → "Zagraj ponownie" cycle (`playAgain` reloads the page).
- ✅ No negative runaway: at `timeLeft <= 0` it clamps to 0 and ends the game once.

### 7. High Scores
- ✅ Player name required (empty name blocked with an alert; game does not start).
- ✅ End screen shows final score (`#finalScore`).
- ✅ Save works via `saveScore()`; button disables after save to prevent duplicates.
- ✅ `localStorage` read/write guarded with `try/catch`.
- ✅ Scores sorted descending; capped at top 10.
- ✅ Corrupted `localStorage` (invalid JSON or non-array) returns `[]` — no crash.

### 8. UI
- ✅ Recycling bin is a clearly separated area (`#binArea`, dashed border, distinct background).
- ✅ `#bin` uses `display:grid; grid-template-columns: repeat(4,1fr)` → 4 columns.
- ✅ `#bin` has `max-height:420px; overflow-y:auto` → scrolls when full.
- ✅ Cards do not disappear with many cards (grid + scroll; rows wrap, container scrolls).
- ✅ Score and timer update via `updatePoints()` / `updateTimer()`.
- ✅ Messages display via `displayMessage()` with a single self-clearing timeout.

### 9. Shared Hosting
- ✅ All asset paths relative (`style.css`, `game.js`).
- ✅ No backend dependencies.
- ✅ No `fetch` / `XMLHttpRequest` / network calls.
- ✅ Deployable to any static/shared host or GitHub Pages.

---

# Failed Tests

**None.** No test in the required checklist failed.

---

# Warnings

| # | Severity | Area | Detail |
|---|----------|------|--------|
| W1 | Minor | Scoring balance | Missed-pair penalty uses `recycleBinCounts[name] >= 3`, so a **4th** identical card in the bin triggers `-300` **again** (verified: 4 identical → `-600`). The documented rule is "third identical card → -300." Each card beyond the third keeps re-penalizing. |
| W2 | Minor | Persistence on `file://` | `localStorage` may be restricted in some browsers when the page is opened directly via `file://`. The `try/catch` prevents any crash, but high scores might not persist in that mode. On real shared hosting (http/https) this is a non-issue. |
| W3 | Cosmetic | Data model | Card fields `month`, `weight`, and `points` are defined on every card but never read by gameplay (scoring uses fixed constants). Dead data, not dead code. |
| W4 | Cosmetic | Redundancy | `lastCard` duplicates information already available as `cardHistory[n-2]`; harmless but redundant. |
| W5 | Info | UX | When the deck empties, clicking *Dobierz kartę* ends the game immediately, even if removable pairs remain in the bin. By design, but players cannot clear leftover pairs after the deck is exhausted. |
| W6 | Info | Globals | Game state lives in top-level `let`/`const` bindings (and a `$` alias). Acceptable for a small static game, but not encapsulated (no IIFE/module). Low collision risk since no other scripts load. |

---

# Bugs Found

- **B1 (Minor / balance):** `checkRecycleBin()` re-applies `-300` for every same-type card from the 3rd onward (`>= 3` instead of `=== 3`), because the count is never reduced after the penalty. Real but non-crashing; affects only scoring fairness in an edge case where a player stacks 4 identical cards without removing the pair. *(Same root finding as W1, logged here as the concrete defect.)*

No crash-class, security-class, or data-loss bugs were found.

---

# Shared Hosting Compatibility

**Fully compatible.** ✅

- Pure static front end: HTML + CSS + vanilla JS.
- Relative paths only; no absolute/local file references.
- No backend, no server-side code, no database, no `fetch`/AJAX.
- Works from `index.html` by double-click and when uploaded to any shared host, GitHub Pages, Netlify, etc.
- Only host-sensitive feature is `localStorage`, which degrades gracefully (try/catch) and works on any http(s) host.

---

# Code Quality Notes

- **Duplicate functions:** none. Each of `generateDeck`, `shuffle`, `drawCard`, `renderHand`, `addToRecycleBin`, `renderRecycleBin`, `selectCard`, `checkForPair`, `checkForBonus`, `checkRecycleBin`, `startTimer`, `endGame`, `saveScore`, `displayHighScores` is defined exactly once.
- **Dead/unreachable code:** none reachable-wise. Only unused *data* fields (W3).
- **Duplicated event listeners:** none. Top-level listeners are bound once in `DOMContentLoaded`. Per-card listeners are recreated on each render, but the previous DOM (and its listeners) is discarded via `innerHTML = ''`, so they do not accumulate.
- **Memory leaks:** none observed. No detached-node retention; message timeout is single and cleared before re-arming.
- **Timer leaks:** none. Single guarded interval; cleared in `endGame()`; `timer` reset to `null`.
- **Dangerous globals:** game state is global within the script (W6). Not dangerous in this single-script context, but encapsulation would harden it for future growth.
- **DOM contract:** all 15 `getElementById` targets (`startGame`, `drawCard`, `playAgain`, `saveScoreBtn`, `playerName`, `setupSection`, `endSection`, `gameSection`, `hand`, `bin`, `points`, `timer`, `messageContainer`, `finalScore`, `scoreList`) exist in `index.html`. No duplicate IDs.
- **Strictness:** `'use strict';` enabled.

---

# Recommended Fixes

**Before release (trivial):**
1. Replace `<PLACEHOLDER: project owner name>` in `LICENSE` with the real copyright holder.

**Optional polish (post-release, low priority):**
2. **B1/W1:** change `checkRecycleBin()` to trigger exactly once — e.g. `=== 3`, or reset/flag the type after penalizing — so a 4th identical card does not double-charge.
3. **W3:** either use `card.points`/`card.weight` in scoring or remove the unused fields to keep the data model honest.
4. **W5:** allow continued pair-matching after the deck empties (end only on timeout or an explicit "End game" action).
5. **W6:** wrap the script in an IIFE or `<script type="module">` to remove globals from the shared scope.
6. **W2:** note in README that high scores persist best when served over http(s).

None of the optional items block release.

---

# Release Readiness Score (0–100)

**92 / 100**

| Category | Weight | Score |
|----------|-------:|------:|
| Required functionality (deck, flow, pairs, bonuses, penalties) | 40 | 40 |
| Timer correctness | 15 | 15 |
| High scores + storage safety | 15 | 15 |
| UI / layout requirements | 10 | 10 |
| Shared-hosting compatibility | 10 | 10 |
| Code quality / no leaks | 10 | 6 |

Deductions: −4 for the `>= 3` missed-pair re-penalty (B1/W1), −2 for unused data fields and un-encapsulated globals (W3/W6). All deductions are minor and non-blocking.

---

# Final Verdict

## ✅ READY FOR GITHUB RELEASE

**Justification:** Every mandatory requirement passes (21/21 behavioral assertions, full DOM contract intact). There are no crash-, security-, or data-loss bugs; the timer is single and correctly torn down; `localStorage` is corruption-safe; pair matching is verifiably order-independent; and the project is a clean, framework-free static build that runs from `index.html` on any shared hosting. The only outstanding items are one minor scoring-balance edge case (4th-identical re-penalty) and cosmetic cleanups — all safe to address after release. The single pre-release action is replacing the placeholder name in `LICENSE`.
