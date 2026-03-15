# Super Spike V'Ball — Requirements Document

## 1. Overview

A browser-based recreation of **Super Spike V'Ball** (Technos Japan, 1990), the classic NES 2-on-2 beach volleyball game. Built with HTML5 Canvas and vanilla JavaScript — no build tools, no server — deployable directly to GitHub Pages as static files.

---

## 2. Target Platform & Deployment

| Aspect | Decision |
|--------|----------|
| Runtime | Modern browsers (Chrome, Firefox, Edge, Safari) |
| Rendering | HTML5 Canvas 2D |
| Language | Vanilla JavaScript (ES2020+), no framework |
| Assets | Pixel-art sprites, hand-drawn or NES-faithful |
| Audio | Web Audio API for SFX + chiptune music |
| Hosting | GitHub Pages (static files only — `index.html` at repo root) |
| Build | **None.** Open `index.html` locally or serve via GitHub Pages |
| Python (optional) | Helper scripts only (asset conversion, sprite-sheet packing) |

---

## 3. Game Modes

### 3.1 Exercise Mode (MVP)
- Single match, 1 human player (+ CPU partner) vs. CPU opponent team.
- Player chooses a team; CPU opponent is assigned.
- Practice-oriented; good for learning controls.
- First to 15 points wins (must win by 2, cap at 21).

### 3.2 American Circuit (Post-MVP)
- Progress through U.S.-based tournament bracket.
- Increasing difficulty as you advance.
- Victory screen after winning the circuit.

### 3.3 World Cup (Post-MVP)
- International tournament bracket — the ultimate challenge.
- Toughest AI opponents, longer bracket.
- Ending sequence / credits after winning.

### 3.4 Versus Mode (Post-MVP)
- Two human players on the same keyboard (up to 4 players with NES Four Score spirit).
- Split control schemes (WASD + keys vs. Arrow keys + keys).

---

## 4. Teams & Characters

Six teams of two players, each with distinct stat profiles. Stats are on a 1–10 scale.

| Team | Player A | Player B | Speed | Power | Technique | Defense |
|------|----------|----------|-------|-------|-----------|---------|
| USA | Billy | Jimmy | 7 | 8 | 6 | 5 |
| Japan | Kunio | Riki | 6 | 6 | 8 | 8 |
| Mexico | Carlos | Jorge | 8 | 5 | 7 | 6 |
| Russia | Ivan | Sergei | 5 | 9 | 5 | 7 |
| Kenya | Abdi | Mwangi | 9 | 6 | 6 | 5 |
| Brazil | Lucas | Rafael | 7 | 7 | 7 | 7 |

### Stat Effects
- **Speed** — movement velocity, dive recovery time.
- **Power** — spike velocity, serve speed, chance to break through a block.
- **Technique** — set accuracy, spike angle control, serve targeting.
- **Defense** — block success rate, dig range, bump accuracy.

---

## 5. Court & Camera

### 5.1 Court Layout
- Standard beach volleyball court (16m x 8m game-world units).
- Net divides the court in half.
- Out-of-bounds lines clearly visible.
- Antennas on the net at sideline edges.

### 5.2 Camera
- **Side-view**, slightly elevated angle (NES-faithful perspective).
- Camera pans horizontally to follow the ball.
- Court fits roughly within the viewport; minimal scrolling.

### 5.3 Visual Style
- NES-era pixel art at a logical resolution of **256 x 240** (NES native).
- Rendered to canvas and scaled up to fit the browser window (integer scaling, nearest-neighbor).
- Aspect ratio preserved; black bars (letterbox/pillarbox) if needed.

---

## 6. Gameplay Mechanics

### 6.1 Core Loop
```
Serve → Rally (bump → set → spike / return) → Point scored → Repeat
```

### 6.2 Ball Physics
- Ball follows a simplified parabolic arc (gravity + initial velocity vector).
- No wind (NES original had none).
- Ball speed determined by the action that last touched it.
- Ball can hit the net (falls back on hitter's side — point for opponent).

### 6.3 Player Actions

| Action | Input (P1) | Condition | Description |
|--------|-----------|-----------|-------------|
| Move | Arrow keys | Always | 8-directional movement |
| Bump / Receive | A | Ball incoming, player in range | Pops ball up near the setter position |
| Set | A | Ball is high, teammate nearby | Lofts ball to the hitter at the net |
| Spike | A | At net, ball set high | Powerful downward hit over the net |
| Dive | B | Ball out of reach | Lunge in facing direction to save the ball |
| Serve | A | Serving phase | Toss and hit; timing affects serve quality |
| Block | A (at net) | Opponent spiking | Jump to block at the net |

**Input simplicity:** Like the NES original, context determines the action. The A button does bump/set/spike/block depending on game state and player position.

### 6.4 Serving
1. Press A to toss the ball.
2. Press A again to strike — timing determines:
   - **Early:** weak float serve.
   - **On-time:** strong targeted serve.
   - **Late:** fault (ball into net or out).
3. Directional input during strike aims the serve.

### 6.5 Scoring
- **Rally scoring** (every rally = 1 point, regardless of who served).
- First to **15 points**, must win by 2, hard cap at **21**.
- Side-out rotation: serving team switches server each time they regain serve.

### 6.6 Collisions & Hit Detection
- Circular hitbox on the ball.
- Rectangular hitboxes on players (wider during dive).
- Ball-to-player proximity triggers the context-sensitive action.
- Net collision: vertical plane check at the net's x-position.
- Out-of-bounds: ball lands outside court lines.

---

## 7. AI (CPU Opponent)

### 7.1 Difficulty Tiers

| Tier | Behavior |
|------|----------|
| Easy | Slow reactions, poor positioning, rarely dives, weak spikes |
| Normal | Decent positioning, occasional dives, moderate spike aim |
| Hard | Fast reactions, good reads, frequent dives, targeted spikes |

### 7.2 AI Architecture
- **State machine** per AI player: Idle → Move-to-ball → Action → Recovery.
- AI reads ball trajectory and moves toward predicted landing spot.
- Reaction delay (in frames) varies by difficulty.
- AI partner auto-sets when the first player bumps.
- Difficulty scales up through tournament rounds.

---

## 8. Animation & Sprites

### 8.1 Player Sprite States
- Idle (2 frames)
- Run (4 frames, 8 directions or mirrored from 4)
- Jump / Spike (4 frames)
- Bump / Receive (3 frames)
- Set (3 frames)
- Dive (4 frames + recovery)
- Block (3 frames)
- Serve toss + strike (4 frames)
- Celebrate (3 frames)
- Defeated (2 frames)

### 8.2 Ball
- Standard volleyball sprite (2 frames, rotating).
- Shadow sprite on the ground beneath the ball (scales with height).

### 8.3 Court & Environment
- Sand court with lines.
- Net (with posts and antennas).
- Background: sky, ocean, palm trees, crowd silhouettes.
- Scoreboard overlay.

---

## 9. Audio

### 9.1 Sound Effects
- Ball hit (bump, set, spike — distinct sounds)
- Whistle (point scored, fault)
- Crowd cheer / groan
- Dive thud
- Net hit
- Menu select / confirm

### 9.2 Music
- Title screen theme (chiptune loop)
- In-game BGM (upbeat chiptune, looping)
- Victory jingle
- Defeat jingle

### 9.3 Implementation
- Web Audio API with `AudioContext`.
- Procedurally generated chiptune via oscillators, or short `.ogg`/`.mp3` clips.
- Mute toggle in UI.

---

## 10. UI & Screens

### 10.1 Screen Flow
```
Title Screen → Team Select → Match → Result → (next match or Title)
                                  ↕
                              Pause Menu
```

### 10.2 Title Screen
- Game logo (pixel art).
- Menu: Exhibition / Tournament / Versus / Options.
- "Press Start" prompt with blink animation.

### 10.3 Team Select Screen
- Grid of 6 teams with stat bars.
- Highlight and confirm with keyboard.
- Show player names and sprites.

### 10.4 In-Game HUD
- Score: `TEAM A [score] — [score] TEAM B`.
- Serving indicator.
- Set counter (1st / 2nd / 3rd touch).
- Match point flash.

### 10.5 Pause Menu
- Resume / Restart / Quit to Title.
- Triggered by `Escape` or `P`.

### 10.6 Result Screen
- Winning team celebration animation.
- Final score display.
- "Play Again" / "Back to Title" options.

---

## 11. Controls

### Player 1
| Key | Action |
|-----|--------|
| Arrow Keys | Move (8-directional) |
| Z | A button (context action: bump/set/spike/serve/block) |
| X | B button (dive) |
| Enter | Start (pause) |

### Player 2 (Versus mode)
| Key | Action |
|-----|--------|
| WASD | Move |
| V | A button |
| B | B button |

### General
| Key | Action |
|-----|--------|
| Escape / P | Pause |
| M | Mute audio |
| F | Toggle fullscreen |

---

## 12. File Structure

```
superspike/
├── index.html              # Entry point — loads everything
├── css/
│   └── style.css           # Minimal layout, canvas centering, UI overlays
├── js/
│   ├── main.js             # Boot, game loop, state management
│   ├── input.js            # Keyboard input handler
│   ├── renderer.js         # Canvas drawing, camera, scaling
│   ├── physics.js          # Ball trajectory, collision detection
│   ├── player.js           # Player entity, state machine, animation
│   ├── ai.js               # CPU opponent logic
│   ├── ball.js             # Ball entity
│   ├── court.js            # Court layout, net, boundaries
│   ├── match.js            # Match state, scoring, serving logic
│   ├── teams.js            # Team/character data and stats
│   ├── audio.js            # Sound effects and music
│   ├── ui.js               # Menus, HUD, screen transitions
│   └── sprites.js          # Sprite sheet loader and animator
├── assets/
│   ├── sprites/            # Character and object sprite sheets (.png)
│   ├── backgrounds/        # Court, sky, environment (.png)
│   ├── audio/              # SFX and music files (.ogg / .mp3)
│   └── fonts/              # Pixel font (optional .ttf or bitmap font)
├── tools/                  # Optional Python helper scripts
│   ├── pack_sprites.py     # Sprite sheet packer
│   └── generate_audio.py   # Procedural chiptune generator
├── requirements.md         # This document
├── claude.md               # Claude Code guidelines
└── tasks/
    ├── todo.md             # Implementation task tracker
    └── lessons.md          # Lessons learned log
```

---

## 13. Implementation Phases

### Phase 1 — Skeleton (Get something on screen)
- [ ] `index.html` + canvas setup with integer scaling
- [ ] Game loop (`requestAnimationFrame`, fixed timestep at 60 FPS)
- [ ] Keyboard input system
- [ ] Placeholder rectangles: court, net, 4 players, ball
- [ ] Basic player movement (arrow keys move a rectangle)

### Phase 2 — Core Volleyball
- [ ] Ball physics (parabolic arc, gravity, velocity)
- [ ] Serving mechanic (toss + strike timing)
- [ ] Bump / set / spike action chain
- [ ] Net collision and out-of-bounds detection
- [ ] Point scoring and score display
- [ ] Side switching on score

### Phase 3 — AI Opponent
- [ ] AI state machine (idle, chase, action, recover)
- [ ] Ball trajectory prediction
- [ ] Difficulty-based reaction delay
- [ ] AI partner auto-positioning and setting

### Phase 4 — Art & Animation
- [ ] Pixel-art sprite sheets for all player states
- [ ] Ball sprite + shadow
- [ ] Court background and net artwork
- [ ] Sprite animation system (frame cycling)
- [ ] Camera panning

### Phase 5 — Menus & UI
- [ ] Title screen with menu
- [ ] Team select screen with stat display
- [ ] In-game HUD (score, serving indicator)
- [ ] Pause menu
- [ ] Result / game-over screen

### Phase 6 — Audio
- [ ] Sound effects (hits, whistle, crowd)
- [ ] Background music (chiptune)
- [ ] Mute toggle

### Phase 7 — Polish & Modes
- [ ] Tournament mode bracket
- [ ] Versus mode (2-player)
- [ ] Difficulty selection
- [ ] Screen transitions / fade effects
- [ ] Celebration / defeat animations
- [ ] Mobile touch controls (stretch goal)

### Phase 8 — Deploy
- [ ] GitHub Pages deployment
- [ ] README with instructions and screenshots
- [ ] Performance testing across browsers

---

## 14. Technical Constraints & Decisions

| Decision | Rationale |
|----------|-----------|
| No build tools | GitHub Pages serves static files; zero-config deploys |
| Vanilla JS, no framework | Minimal overhead; game loop doesn't benefit from React/Vue |
| Canvas 2D, not WebGL | Simpler for 2D pixel art; sufficient performance for NES-era game |
| Fixed 60 FPS timestep | Deterministic physics; matches NES frame rate |
| Integer scaling | Preserves pixel-art crispness at any window size |
| No server-side code | GitHub Pages is static-only; all logic runs client-side |
| ES modules (`type="module"`) | Clean file separation without bundling |

---

## 15. Stretch Goals

- **Online multiplayer** via WebRTC (peer-to-peer, no server).
- **Mobile touch controls** (virtual d-pad + buttons).
- **Replay system** (record inputs per frame, play back).
- **Custom teams** (name your players, allocate stat points).
- **CRT shader** (scanlines + slight curvature via Canvas filter or WebGL overlay).
- **Gamepad support** via the Gamepad API.

---

## 16. References

- Super Spike V'Ball (NES, 1990) — gameplay videos and manuals for mechanics reference.
- NES resolution: 256 x 240 pixels, 52-color palette.
- FIVB beach volleyball rules (simplified for arcade feel).

---

*This document is the single source of truth for what to build. Update it as decisions evolve.*
