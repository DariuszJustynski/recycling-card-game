# AUDIT REPORT — Card Game "Recykling" (Hanafuda-inspired)

**Date:** 2026-06-09
**Auditor role:** Senior JavaScript code auditor / refactoring assistant
**Scope:** Static front-end audit only. No files were modified, deleted, or rewritten. No frameworks introduced.

---

## 1. Executive summary

The project currently contains **six independent, partially-overlapping copies** of the same game, stored side-by-side in folders. None of them is simultaneously *complete* and *correct*:

- The **most mechanically correct** version is **`Gra - wersje/Gra 2`** (and its byte-identical twin `Gra - kolory`, which only differs by a broken stylesheet). Its pair-matching, bonus, and `-300` penalty logic is the only logic in the project that is order-independent and not self-corrupting.
- The **most feature-complete** version is **`Gra - wersje/Ostatnia wersja do poprawy`** ("last version to fix"): it is the only one with a player name, timer, end-game screen, and `localStorage` high-score table. Unfortunately it also has the **most severe logic bugs** (a double timer, compounding penalties, an auto-bin flow that removes player agency, and a bonus calculation that never fires).

The intended game loop — **draw → hand → player moves a card to the bin → player selects two matching cards to remove them** — only *partially* exists in any single file, and is actively broken in the newest version.

**Recommended strategy:** do **not** continue any one folder. Instead, build one new clean version by taking **`Gra 2`'s mechanics core** and **`Ostatnia wersja`'s feature shell** (name / timer / localStorage), fixing the specific bugs catalogued below. This is a *merge-and-repair*, not a rewrite from zero.

There are also **no images, no README, and no LICENSE** anywhere in the project.

---

## 2. Current project structure

```
Gra karciana/
├── Gra - kolory/
│   ├── script.js          (179 lines) — logic IDENTICAL to "Gra 2"
│   ├── style.css          (165 lines) — POLLUTED: game CSS + unrelated landing-page CSS
│   └── szablon.html       (50 lines)  — same markup as "Gra 2"
└── Gra - wersje/
    ├── Komentarz do gry.docx          — design notes (not a web asset)
    ├── Gra/
    │   ├── script.js      (99 lines)  — earliest: move + pair only, no scoring
    │   ├── styles.css     (101 lines) — duplicated body/#game blocks
    │   └── szablon.html   (41 lines)
    ├── Gra 2/
    │   ├── script.js      (179 lines) — CLEANEST mechanics core
    │   ├── style.css      (68 lines)
    │   └── szablon.html   (50 lines)
    ├── Gra 3/
    │   ├── game.js        (230 lines) — adds timer + penalties (timer is broken)
    │   ├── style.css      (88 lines)
    │   └── szablon.html   (45 lines)
    ├── Gra 4/
    │   ├── game.js        (220 lines) — duplicate functions, single-click bin removal
    │   ├── index.html     (52 lines)  — DUPLICATE element IDs
    │   └── style.css      (102 lines) — only one with a 4-column bin grid
    └── Ostatnia wersja do poprawy/
        ├── game.js        (205 lines) — MOST FEATURES, MOST BUGS
        ├── index.html     (54 lines)
        └── style.css      (108 lines)
```

Naming is inconsistent: the entry file is sometimes `script.js`, sometimes `game.js`; the HTML is sometimes `szablon.html` ("template"), sometimes `index.html`; the stylesheet is sometimes `style.css`, sometimes `styles.css`.

---

## 3. Detected versions / conflicting variants

| # | Folder | Entry HTML | JS | Scoring | Timer | Name + localStorage | Verdict |
|---|--------|-----------|----|---------|-------|---------------------|---------|
| V1 | `Gra` | `szablon.html` | `script.js` | ❌ | ❌ | ❌ | Earliest skeleton |
| V2 | `Gra 2` | `szablon.html` | `script.js` | ✅ | ❌ | ❌ | **Best mechanics** |
| V2b | `Gra - kolory` | `szablon.html` | `script.js` (= V2) | ✅ | ❌ | ❌ | V2 clone + broken CSS |
| V3 | `Gra 3` | `szablon.html` | `game.js` | ✅ | ⚠️ broken | ❌ | Timer experiment |
| V4 | `Gra 4` | `index.html` | `game.js` | ✅ | ⚠️ | ❌ | Dead-end branch |
| V5 | `Ostatnia wersja do poprawy` | `index.html` | `game.js` | ⚠️ broken | ⚠️ broken | ✅ | **Most features** |

**Key divergences between variants:**

1. **Deck categories differ.** V1–V4 use months 10–12 = `Drewno / Tekstylia / Ceramika`. V5 uses `Drewno / Odpady Chemiczne / Złom` and also bumps `Drewno` points from 2→3. There is **no single canonical category list.**
2. **Deck-build method differs.** V1–V4 build 48 cards via `for i in 0..47: months[i % 12]`. V5 builds via `months.forEach → push 4 copies`. Both yield 48, but only V5's method is self-documenting (4 per category by construction).
3. **Game flow differs.** V1–V4: player clicks a hand card to move it to the bin (correct, manual). V5: drawing a card **auto-dumps it into both hand and bin** and **auto-removes pairs** — the player has no agency (violates spec rules 6 & 8).
4. **Pair removal differs.** V1: filter by selected indices. V2/V2b: `checkForPair` with **sorted indices** (correct). V3: `checkForPair` **without** sorting (order-dependent bug). V4: no pair logic at all — single-click removes one card. V5: pair removal is automatic on draw, not by selection.

---

## 4. List of working features (somewhere in the project)

- ✅ 48-card deck, 12 categories × 4 cards — **all six versions produce 48 cards** (verified by construction; see §5).
- ✅ Draw card from deck (`deck.pop()`), with empty-deck guard.
- ✅ Render hand as colored cards by difficulty (`easy` / `medium` / `hard`).
- ✅ Move card hand → bin on click (V1, V2, V2b, V3).
- ✅ Order-independent pair removal (**only V2 / V2b**).
- ✅ Draw-streak bonus +100/+70/+50/+40/+10 (V2, V2b, V3, V4, V5 — V2/V2b/V3/V4 share the same correct `checkForBonus`).
- ✅ `-300` penalty when a 3rd same-type card reaches the bin (V2, V2b, V3 via `checkRecycleBin`).
- ✅ Dangerous-waste penalties for nuclear / hazardous / mixed (V3, V4, V5 — geometric).
- ✅ Countdown timer rendered (V3, V4, V5).
- ✅ Player name input + `localStorage` high-score table + end-game screen (**only V5**).
- ✅ 4-column scrollable bin grid in CSS (**only V4**: `flex-wrap` + `flex: 0 0 calc(25% - 10px)` + `overflow-y:auto`).

No single file contains all of the above working together.

---

## 5. List of broken or risky features

### Critical
1. **V5 — double timer / two intervals.** `startTimer()` is called at top-level (`game.js:18`) **and** again inside `startGame()` (`game.js:28`). Two `setInterval`s run at once → the clock counts down ~2× speed and `timer` only holds the second handle, so the first is never cleared. *(Violates audit requirement 9.)*
2. **V5 — compounding penalty in `updatePoints()`.** `updatePoints()` (`game.js:150`) subtracts `5*nuclearWasteCount + 2*hazardousWasteCount + 1*mixedWasteCount` **every time it is called**, and it is called on every draw and every pair. Penalties are re-applied repeatedly against the running total, so the score collapses far faster than the rules intend. Penalty math must be applied **once per event**, not inside the render/update function.
3. **V5 — auto-bin + auto-pair removes player agency.** `drawCard()` calls `addCardToRecycleBin()` immediately (`game.js:70`), and pairs are spliced automatically when a count hits 2. The player never moves cards from hand to bin and never selects pairs. *(Violates spec rules 6, 8, 10, 11.)* `selectedCards` is declared but never used.
4. **V5 — bonus never awarded.** In `addCardToRecycleBin`, the pair is spliced out **before** `addPointsForPair(key)` runs; `addPointsForPair` then maps the *already-emptied* `recycleBin` for that name, so `positions` is empty, `distance` is `NaN`, and `bonus` is always `0` (`game.js:134-148`).
5. **V3 — runaway timer.** `updateTimer()` subtracts an *extra* 10/5/1 seconds **every tick** for as long as any nuclear/hazardous/mixed card has *ever* entered the bin (the counts are never reset) (`game.js:197-218`). The clock plunges to negative within seconds.
6. **V3 — order-dependent pair removal.** `checkForPair` does `const [firstIndex, secondIndex] = selectedCards;` (no sort) then `splice(secondIndex)` then `splice(firstIndex)` (`game.js:161-168`). If the player selects the higher index first, removing it shifts the lower index and the wrong card is deleted. *(Violates spec rule 11.)*
7. **V4 — bin removal is single-click, not pair-based.** `removeFromBin(index)` removes one card and awards points with no matching check (`game.js:133-146`). *(Violates spec rules 8 & 10.)*

### High
8. **V4 — duplicate function definition.** `removeFromBin` is defined twice (`game.js:133` and `game.js:208`); `renderHand` also renders the bin, and a separate `renderBin` exists — three render paths fight over `#bin`.
9. **V4 — duplicate element IDs.** `index.html` contains `#hand`, `#bin`, and `#messageContainer` **twice each** (lines 36/45, 39/46, 41/47). `getElementById` only ever sees the first; the second set is dead DOM.
10. **V1 — wrong `.selected` highlight target.** `selectCard` uses `document.getElementsByClassName('card')[index]` (`script.js:85-88`), which indexes across **all** cards on the page (hand + bin), so the highlight lands on the wrong element.
11. **V3/V4 — `checkForBonus` look-back is off by one relative to the spec.** "One card between" should compare against `history[len-3]`, "1:3" against `history[len-4]`, etc. The shared implementation needs re-checking against the intended definitions in spec rule 13 (the branches look plausible but were never verified against the worded rules).

### Medium / risky
12. **`localStorage` reads are unguarded.** V5's `saveScore` / `updateScoreList` use `JSON.parse(localStorage.getItem('scores'))` with no `try/catch`. A corrupted/legacy value throws and breaks the page. *(Audit requirement 10.)*
13. **No scrollable bin in 4 of 6 versions.** Only V4 has the 4-column grid + scroll. V1/V2/V2b/V3/V5 lay cards out as `inline-block` with no wrap discipline or `overflow`. *(Violates spec rule 7.)*
14. **`Gra - kolory/style.css` is polluted.** It concatenates the game stylesheet with an **unrelated landing-page stylesheet** (`.tile`, `.newsletter`, `.form-container`, `.ad-info`, a second `body{}` with a pink gradient). Dead, confusing CSS.
15. **`Gra/styles.css` has the `body{}`/`#game{}`/`.card{}` block duplicated** (lines 1-50 then 51-101).
16. **V5 — no replay / no game reset.** After `endGame`, the draw button stays live and nothing re-initializes state.
17. **V3/V4 — `alert()` + `location.reload()` as "end game".** Crude, loses score, no save.

---

## 6. List of duplicated / conflicting functions

| Function | Where it appears | Conflict |
|----------|------------------|----------|
| `generateDeck` | all 6 | Two different category lists + two build strategies (see §3.1–3.2) |
| `shuffle` | V1–V4 (V5 inlines it) | Identical Fisher–Yates; just not shared |
| `drawCard` | all 6 | V5 also auto-bins; others only push to hand |
| `renderHand` / `updateHand` | all 6 | Named `renderHand` (V1–V4), `updateHand` (V5); V4's also renders the bin |
| `renderRecycleBin` / `renderBin` / `updateRecycleBin` | V1–V5 | **Three different names** for the same job; V4 has both `renderHand`(bin part) **and** `renderBin` |
| `checkForPair` | V2, V2b, V3 | V2/V2b sort indices (correct); V3 does not (bug) |
| `selectCard` | V1, V2, V2b, V3 | V1 highlights wrong element; others differ in signature |
| `checkForBonus` | V2, V2b, V3, V4 | Byte-identical logic copy-pasted 4× |
| `checkRecycleBin` (the −300 rule) | V2, V2b, V3 | Identical |
| `calculatePenalties` / inline penalty | V3, V4, V5 | Three different formulas & call sites |
| `startTimer` | V3, V4, V5 | V5 calls it twice; V3 bleeds time every tick |
| `removeFromBin` | V4 (×2) | **Defined twice in the same file** |
| `endGame` / `saveScore` / `updateScoreList` | V5 only | Not duplicated, but unguarded `localStorage` |
| `displayMessage` / `showMessage` | all | Two names; V2/V2b never clear messages (DOM grows unbounded) |

---

## 7. Files that should be KEPT (as reference donors — not as the final game)

- **`Gra - wersje/Gra 2/script.js`** — donor for the **mechanics core**: `generateDeck`, `shuffle`, `checkForBonus`, `checkForPair` (sorted/correct), `checkRecycleBin` (−300 rule), `selectCard`.
- **`Gra - wersje/Ostatnia wersja do poprawy/game.js`** — donor for the **feature shell**: player name, `startGame`, `endGame`, `saveScore`, `updateScoreList`, timer scaffolding (to be de-bugged).
- **`Gra - wersje/Gra 4/style.css`** — donor for the **4-column scrollable bin grid**.
- **`Gra - wersje/Ostatnia wersja do poprawy/index.html`** — donor for the **markup** (name input, sections, score list) — after removing the duplicate-ID problem pattern.
- **`Gra - wersje/Komentarz do gry.docx`** — keep as design documentation.

## 8. Files that should be REMOVED or ARCHIVED (after the new version is built and verified)

> Do **not** delete yet (per instructions). Move into an `_archive/` folder once the unified version passes the testing checklist.

- `Gra - wersje/Gra/` (V1) — superseded skeleton.
- `Gra - kolory/` (V2b) — duplicate of V2 with a polluted stylesheet; no unique value.
- `Gra - wersje/Gra 3/` (V3) — superseded by donor extraction.
- `Gra - wersje/Gra 4/` (V4) — dead-end; only its CSS grid is worth keeping (copy it out first).
- `Gra - wersje/Gra 2/` (V2) — archive **after** its logic is merged into the new version.
- `Gra - wersje/Ostatnia wersja do poprawy/` (V5) — archive **after** its features are merged.

---

## 9. Recommended final file structure

```
Gra karciana/
├── index.html          # single entry point (open directly or upload to host)
├── style.css           # one clean stylesheet (4-col scrollable bin)
├── game.js             # one game module, no duplicate functions
├── README.md           # how to play, how to run, rules
├── LICENSE             # e.g. MIT
└── assets/             # (optional, future) card icons / images
    └── .gitkeep
└── _archive/           # all six legacy versions, untouched, for reference
    ├── v1-gra/
    ├── v2-gra2/
    ├── v2b-kolory/
    ├── v3/
    ├── v4/
    └── v5-ostatnia/
```

Flat, no build step, no Node, no backend — `index.html` references `style.css` and `game.js` by relative path and runs by double-click or by upload to any shared host.

---

## 10. Recommended final mechanics (the single canonical ruleset)

1. **Deck:** 48 cards = 12 categories × 4. Build via `forEach → push 4 copies` (self-documenting, like V5). **Pick ONE canonical category list** and freeze it (recommend V1–V4's `Drewno / Tekstylia / Ceramika` set, since it appears in 4/6 versions — but this is a content decision for you to confirm).
2. **Flow (manual, with player agency):** draw → card goes to **hand only** → player clicks a hand card to move it to the **bin** → player clicks **two bin cards**; remove them **only if `name` matches**.
3. **Pair removal:** sort the two selected indices, splice the higher first, then the lower (V2's correct approach). Order of selection must not matter.
4. **Draw-streak bonus** (on draw, from `cardHistory`): same type back-to-back **+100**; one between **+70**; 1:3 **+50**; 1:4 **+40**; 1:5 **+10**. Each valid pair removal also **+5 s**.
5. **−300 penalty:** when a **3rd** card of one type sits in the bin (player missed the pair).
6. **Dangerous-waste penalties:** nuclear / hazardous / mixed apply their point + time penalty **once, at the moment the card enters the bin** (never inside a render/update loop).
7. **Timer:** a **single** `setInterval`, started exactly once, cleared on game end.
8. **End game:** on time-out or empty deck → show final score → `saveScore()` → render high-score table.
9. **Persistence:** player name + scores in `localStorage`, **wrapped in `try/catch`**.

---

## 11. Step-by-step refactoring plan

1. **Freeze the spec.** Lock the canonical 12-category list and confirm the bonus look-back definitions (rule 13) against worded examples. Write them into `README.md` first so code follows a fixed target.
2. **Scaffold the clean folder.** Create root `index.html`, `style.css`, `game.js`, `README.md`, `LICENSE`. Move all six existing folders into `_archive/` (do this only after the new version works — for now, build alongside).
3. **Markup.** Start from V5's `index.html`; keep name input, `#hand`, `#bin`, `#points`, `#timer`, `#messageContainer`, `#scoreList`. **Remove the duplicate-ID pattern** seen in V4. Give the bin a wrapper for scrolling.
4. **CSS.** Start from a clean base; graft in V4's 4-column scrollable bin (`#bin{display:flex;flex-wrap:wrap}`, `.card{flex:0 0 calc(25% - 10px)}`, wrapper `overflow-y:auto;max-height:…`). Drop all polluted/duplicated rules (kolory landing-page CSS, Gra's doubled blocks).
5. **Mechanics core.** Copy V2's `generateDeck` (switch to the `forEach×4` build), `shuffle`, `checkForBonus`, `checkForPair` (sorted), `checkRecycleBin`, `selectCard`. This is the trustworthy base.
6. **Feature shell.** Add V5's `startGame`, `endGame`, `saveScore`, `updateScoreList` — but fix: **call `startTimer()` exactly once**, and remove the top-level pre-game `startTimer()` call.
7. **Fix the flow.** Make draw → hand only. Add manual hand-click → bin. Keep pair removal on explicit 2-card selection. Delete all auto-bin / auto-pair code from V5.
8. **Fix penalties.** Apply nuclear/hazardous/mixed point & time penalties **once on bin-entry**; remove penalty math from `updatePoints()`/`updateTimer()`.
9. **Harden persistence.** Wrap every `localStorage` read in `try/catch`; default to `[]` on failure.
10. **Single source of names.** One `renderHand` + one `renderBin`; one `displayMessage` that clears itself; delete every duplicate.
11. **Manual QA** against §13 checklist; then move legacy folders to `_archive/`.

---

## 12. Minimal safe implementation plan (smallest viable correct game)

If you want the shortest path to one *correct, publishable* build:

1. Take **`Gra 2`** as the literal starting file (it has the only correct pair logic).
2. Add a **timer**: one `setInterval`, started once on first draw or on "Start"; clear on 0.
3. Add **`endGame()`** that stops the timer and shows the final score.
4. Add **`saveScore()` + high-score list** with `try/catch` around `localStorage`.
5. Add **dangerous-waste penalties** applied **once on bin-entry** (lift the formulas from V3/V5 but call them from `moveToRecycleBin`, not from a render loop).
6. Replace the stylesheet's bin block with **V4's 4-column scrollable grid**.
7. Add a **player-name input** (copy V5's markup) and a **Start** button.

This reuses ~80% of V2 unchanged and avoids every critical bug in V3/V4/V5.

---

## 13. Suggested testing checklist

**Deck & setup**
- [ ] Deck has exactly **48** cards on load (`console.log(deck.length)`).
- [ ] Exactly **12** distinct category names, **4** of each.
- [ ] Empty deck → draw button triggers end-game, no crash.

**Flow**
- [ ] Drawing puts a card in the **hand only** (not the bin).
- [ ] Clicking a hand card moves it to the bin and removes it from the hand.

**Pairs (spec rules 8–11)**
- [ ] Selecting two **different** types removes nothing.
- [ ] Selecting two **same** types removes both and scores.
- [ ] Works selecting **low-then-high** index.
- [ ] Works selecting **high-then-low** index (order independence).

**Bonuses (rule 13)**
- [ ] Same type twice in a row → **+100** and **+5 s**.
- [ ] One card between → **+70**; 1:3 → **+50**; 1:4 → **+40**; 1:5 → **+10**.

**Penalties**
- [ ] 3rd same-type card in bin without removing the pair → **−300** once.
- [ ] Nuclear / hazardous / mixed penalty applied **once per card**, not compounding on every update.

**Timer (rule 9)**
- [ ] Exactly **one** interval (timer counts at real 1 s/s, not 2×).
- [ ] Reaching 0 ends the game and clears the interval (no negative runaway).

**End / persistence**
- [ ] End screen shows final score.
- [ ] Score saved to `localStorage`; survives reload; sorted descending.
- [ ] Corrupting the `scores` key manually does **not** break the page (try/catch).

**Hosting**
- [ ] Opens correctly via `file://` (double-click `index.html`).
- [ ] Works when uploaded to plain shared hosting (relative paths, no backend, no fetch).

**Layout (rule 7)**
- [ ] Bin shows ~4 columns and scrolls when full.

---

## 14. Notes for future expansion

- **Card art:** introduce `assets/` with one image per category; today cards are text + difficulty color only. Keep paths relative for shared hosting.
- **Difficulty / levels:** the `weight` and `difficulty` fields already exist on every card but are barely used — a future mode could weight penalties or starting time by total deck weight.
- **Configurable rules:** move bonus values, penalties, and starting time into a single `CONFIG` object at the top of `game.js` so balance changes don't touch logic.
- **Accessibility:** add `aria-pressed` to selected bin cards and keyboard support for selection.
- **i18n:** all UI strings are Polish and inline; a small `strings` map would ease translation.
- **Do NOT** migrate to React/Vue/TypeScript/Node or add a backend — the static-hosting constraint is well served by the current vanilla approach.

---

*End of audit. No source files were modified.*
