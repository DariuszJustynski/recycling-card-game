# Recycling Waste Fall

> ⚠️ **EXPERIMENTAL BRANCH — v0.2.0-experimental**
>
> This is an experimental spin-off of the **Recycling Card Game**. It is **not**
> part of the stable release. The stable card game
> (`recycling-card-game-v0.1.0-stable-core`) **remains completely unchanged**
> and continues to be the official release.

---

## What is this?

**Recycling Waste Fall** explores a **falling-waste gameplay** inspired by
puzzle games such as Tetris — but it is *not* a Tetris clone. Instead of
drawing cards into a hand, waste objects tumble from the top of a vertical
**waste well** and stack up at the bottom. The player recycles waste by
clicking **two blocks of the same waste type**, which removes both from the
well. If the pile reaches the top of the well, the waste overflows and the
game ends.

It reuses the educational theme, the twelve waste categories, and the
pair-matching core of the stable card game, transplanted into a real-time
arcade setting.

## Gameplay

1. Press **Start**. Waste blocks begin falling into the well, one at a time.
2. Each block settles when it lands on the floor or on other waste.
3. Click **two blocks of the same waste type** (falling or settled) to recycle
   them — both disappear and you score points.
4. Clicking two **different** types removes nothing and costs a small penalty (−5).
5. Clicking the same block twice **deselects** it.
6. **Dangerous waste** (Nuclear −50, Hazardous −30, Mixed −15) costs points the
   moment it settles — recycle it mid-air or quickly after landing!
7. Every 30 seconds the **level** rises and waste falls faster.
8. The game ends when a block settles in the marked **danger zone** at the top.
9. Save your score to the local high-score table (browser `localStorage`).

### Waste types

| Type | Shape | Speed | Pair score | Settle penalty |
|------|-------|-------|-----------:|---------------:|
| Paper | 1×1 | slow | 5 | — |
| Glass | 1×1 (diamond) | medium | 8 | — |
| Plastic | 2×1 | medium | 8 | — |
| Metal | 1×2 | medium-fast | 10 | — |
| Bio Waste | 1×1 | slow | 5 | — |
| Electronics | 2×2 | fast | 14 | — |
| Nuclear | 2×1 (black/yellow) | very fast | 20 | **−50** |
| Hazardous | 1×2 (red/orange) | fast | 16 | **−30** |
| Mixed | 1×1 (dark) | medium-fast | 6 | **−15** |
| Wood | 3×1 | slow | 9 | — |
| Textiles | 2×1 | medium | 8 | — |
| Ceramics | 1×1 | fast | 12 | — |

Pair score awarded = 10 + 2 × type score.

## Controls

- **Mouse / tap only**: click a waste block to select it, click a second block
  to attempt a match. Click a selected block again to deselect.
- **Start / Restart** button restarts the game at any time.

## Technology

- **HTML5 + CSS3 + Vanilla JavaScript** — no frameworks, no build tools, no backend.
- One `requestAnimationFrame` game loop (no stacked timers).
- One delegated click listener (no per-block listener buildup).
- `localStorage` high scores (own key — does not touch the card game's scores),
  guarded with `try/catch`.
- Runs from `index.html`; fully shared-hosting compatible.

## How is this different from the stable card game?

| | Stable card game (v0.1.0) | Waste Fall (v0.2.0-experimental) |
|---|---|---|
| Genre | Turn-based card game (Hanafuda-inspired) | Real-time falling-block puzzle |
| Cards/blocks | 48-card deck, hand, recycling bin | Endless falling waste blocks in a well |
| Pace | Player-driven, 60 s doom timer | Continuous, speed scales with level |
| Loss condition | Timer reaches zero | Waste overflows the top of the well |
| Shared DNA | 12 waste categories, click-two-to-match pairing, dangerous-waste penalties, localStorage high scores | same |

## Future roadmap

- Column-targeted drops (player steers where waste falls)
- Combo chains and multi-pair bonuses
- Sound effects and settle animations
- Keyboard controls and accessibility pass
- Educational pop-ups about each waste type
- Merge back the best mechanics into the main project as an optional game mode

## Running it

Open `index.html` in any modern browser — nothing to install. Or upload the
folder to any static hosting.

## License

MIT — see [`LICENSE`](LICENSE). Same license and copyright holder as the
stable project.
