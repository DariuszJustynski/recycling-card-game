# Recycling Card Game

An educational, browser-based card game that makes waste sorting fun.

---

## Project Overview

**Recycling Card Game** is an educational card game inspired by the Japanese game
**Hanafuda**, reimagined around the theme of **waste sorting, recycling awareness
and environmental education**. Players draw cards representing different types of
waste, move them into a recycling bin, and remove matching pairs to score points
before time runs out.

The game is designed to teach players to recognise waste categories, to think
about which materials belong together, and to be mindful of dangerous waste — all
through simple, fast-paced card play. It is built entirely as a static front-end,
so it runs in any modern browser with no installation, no backend and no setup.

---

## Features

- **48-card deck** — a full deck built from twelve waste categories.
- **12 waste categories** — four cards each, echoing Hanafuda's twelve-month structure.
- **Recycling bin mechanics** — a dedicated, scrollable recycling area where cards are collected.
- **Pair matching system** — remove two cards of the same waste type; selection order does not matter.
- **Bonus point system** — rewards drawing the same waste type in close succession.
- **Dangerous waste penalties** — nuclear, hazardous and mixed waste cost points and time.
- **Doom timer** — a countdown that ends the game when it reaches zero.
- **High-score table** — keeps the top results, sorted from highest to lowest.
- **LocalStorage support** — high scores persist between sessions in the browser.
- **Shared hosting compatibility** — pure static files, deployable anywhere.

---

## Technology Stack

- **HTML5** — page structure and game layout.
- **CSS3** — styling, the 4-column scrollable recycling bin grid, and responsive sizing.
- **Vanilla JavaScript** — all game logic, with no frameworks or libraries.
- **LocalStorage** — client-side persistence of the high-score table.

---

## Gameplay Rules

### Drawing cards
Click **"Dobierz kartę" (Draw a card)** to draw the top card from the deck.
A drawn card goes **into your hand only** — it is never placed in the recycling
bin automatically.

### Moving cards to the recycling bin
Click a card in your hand to move it into the **recycling bin**. The bin displays
all collected cards in a scrollable four-column grid.

### Removing matching pairs
Click **two cards in the recycling bin**:
- If both cards are the **same waste type**, they are removed together.
- If they are **different**, nothing is removed.
- The **order of selection does not matter** — selecting the higher card first or
  the lower card first produces the same result.

Each valid pair removal awards **+10 points** and **+5 seconds**.

### Bonus scoring
Drawing the same waste type in close succession awards bonus points:

| Pattern | Bonus |
|--------|------:|
| Same type drawn one after another | **+100** |
| Same type with one card in between | **+70** |
| Same type in a 1:3 relation | **+50** |
| Same type in a 1:4 relation | **+40** |
| Same type in a 1:5 relation | **+10** |

### Dangerous waste penalties
Three waste types are dangerous. When such a card **enters the recycling bin**,
a penalty is applied **once** (points and time), increasing geometrically each
time that type is added:

| Waste type | Point penalty | Time penalty |
|-----------|--------------|-------------:|
| Nuclear waste | 5, 10, 20, 40, … | −10 s |
| Hazardous waste | 2, 4, 8, 16, … | −5 s |
| Mixed waste | 1, 2, 4, 8, … | −1 s |

### Missed pair penalty
If you let a **third card of the same waste type** reach the recycling bin without
removing the earlier pair, you lose **−300 points**.

### Time management
- The timer starts at **60 seconds** when you press **Start**.
- It counts down once per second.
- Removing a valid pair adds **+5 seconds**.
- Dangerous waste subtracts time as it enters the bin.
- When the timer reaches zero, the game ends and your final score is shown.

---

## Installation

### Local

Simply open:

```
index.html
```

in any modern web browser (double-click the file). There is nothing to install
and no build step.

### Shared Hosting

Upload all files to your hosting's public directory (keeping them together in the
same folder), then open `index.html` in a browser. The game works on, for example:

- **Apache Hosting**
- **cPanel Hosting**
- **GitHub Pages**
- **Netlify**

**No backend configuration is required.** All paths are relative and there are no
server-side dependencies.

---

## Project Status

Current version:

```
v0.1.0-stable-core
```

Status:

```
Stable Demonstration Release
```

This release contains the stable core game loop and has passed an internal QA
review. High scores best persist when the game is served over HTTP/HTTPS
(some browsers restrict `localStorage` for pages opened directly via `file://`).

---

## Planned Development

Roadmap for future versions:

- More accurate Hanafuda-inspired deck structure
- Additional game modes
- Improved graphics and card artwork
- Online leaderboards
- Multiplayer support
- Educational recycling encyclopedia
- Waste management simulation mode
- Citizen-science experiments
- Community-driven environmental challenges

---

## Contributing

Contributions are warmly welcomed from **developers, educators, environmental
researchers and game designers**. Whether you want to refine the gameplay, add
waste categories, improve accessibility, translate the interface, or shape the
educational content, your input is valued.

To keep the project easy to host and maintain, please preserve its core
principles: **vanilla front-end only — no frameworks, no build tools and no
backend.** Open an issue to discuss ideas, or submit a pull request with your
changes.

---

## License

This project is released under the **MIT License**. See the [`LICENSE`](LICENSE)
file for the full text and copyright notice.
