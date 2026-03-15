# Mike Tyson's Punch-Out!! - Game Design Requirements

## Overview
An NES-style boxing game where the player controls Little Mac (viewed from behind, third-person over-the-shoulder). The opponent faces toward the camera. Gameplay is pattern-based: learn each opponent's tells, dodge/block, then counter-punch during openings.

## Technical Requirements
- **Platform**: HTML5 Canvas + vanilla JavaScript (ES modules)
- **Resolution**: 256x240 (NES native), scaled with nearest-neighbor interpolation
- **Frame Rate**: Fixed 60 FPS timestep
- **Deployment**: Static files only, works by opening index.html in a browser, deployable to GitHub Pages
- **Assets**: All sprites drawn programmatically, all sounds via Web Audio API -- zero external files

## Controls
| Key | Action |
|-----|--------|
| Left Arrow | Dodge left |
| Right Arrow | Dodge right |
| Down Arrow | Duck / Block (hold) |
| Up Arrow | Star punch (when stars > 0) |
| Z | Left punch (body by default, face if holding Up) |
| X | Right punch (body by default, face if holding Up) |
| Enter | Start / Select / Continue |
| Escape | Pause |

## Game States
1. **TITLE** - Main menu: New Career, Continue, Select Fight
2. **FIGHT_SELECT** - Choose opponent from unlocked roster
3. **FIGHT_CARD** - VS screen showing fighter profiles and Doc Louis advice
4. **FIGHTING** - Active gameplay
5. **RESULT** - Win/Loss screen with stats
6. **CHAMPION** - Final victory screen after defeating Mike Tyson

## Fight Rules
- 3 rounds per fight, 3 minutes per round
- Knockdown rules:
  - 3 knockdowns in one round = TKO
  - 3 total knockdowns across fight = TKO
  - Count reaches 10 while down = KO
  - Time expires = Decision (higher HP wins)
- Player can button-mash Z/X to get up faster when knocked down
- Stars (0-3) earned by counter-punching; used for powerful star punches
- Stamina (hearts) depleted by punching, recovers when idle

## Opponents (11 total)

### Minor Circuit
1. **Glass Joe** (France, 1-99) - Very slow, obvious tells, goes down easy
2. **Von Kaiser** (Germany, 23-13) - Head shakes before hooks, moderate speed
3. **Piston Honda** (Japan, 26-1) - Steps back before Honda Rush special, title fight

### Major Circuit
4. **Don Flamenco** (Spain, 22-3) - Flamenco spin before uppercuts
5. **King Hippo** (Hippo Island, 18-9) - Hit face when mouth opens, pummel body, cannot get up once knocked down
6. **Great Tiger** (India, 24-5) - Gem flashes before magic uppercut, Tiger Spin special, title fight

### World Circuit
7. **Bald Bull** (Turkey, 34-4) - Bull Charge must be counter-punched to stop
8. **Soda Popinski** (Russia, 33-2) - Drinks soda to power up, hit during drink
9. **Mr. Sandman** (USA, 31-2) - Dreamland Express special, very fast
10. **Super Macho Man** (Hollywood, 35-0) - Super Spin Punch, title fight

### Dream Fight
11. **Mike Tyson** (USA, 31-0) - First 90 seconds: instant-KO uppercuts only. After that: extremely fast mixed attacks

## Opponent AI Pattern Cycle
IDLE (random delay) -> TELEGRAPHING (show tell animation) -> ATTACKING (throw punch) -> RECOVERING (vulnerable window) -> repeat

## Player Mechanics
- **Punch**: Left/Right, body/face targeting, costs stamina (hearts)
- **Dodge**: Brief invincibility, move to side
- **Duck**: Avoid high attacks (jabs, hooks)
- **Block**: Hold Down, reduces damage by 75%, costs stamina
- **Star Punch**: Up arrow when stars > 0, powerful uppercut, guaranteed stun
- **Counter-punch**: Hitting opponent during recovery = bonus damage + chance to earn star

## Visual Design
- Pixel art drawn with canvas primitives (rectangles, circles)
- Boxing ring with perspective, ropes, corner posts
- Crowd silhouettes in background
- Hit flash effects (white burst)
- Screen shake on big hits
- Star sparkle effects
- Distinct visual tells for each opponent's attacks

## Audio Design
All sounds generated procedurally with Web Audio API oscillators and noise:
- Punch throw / hit / miss
- Dodge swoosh
- Block thud
- Knockdown impact + crowd gasp
- Boxing bell (3 dings)
- Crowd cheer / boo
- Star earned (ascending tones)
- KO dramatic tone
- Menu select blip
- Count sound
- Round announcement

## Career Progression
- Linear progression through circuits
- Unlocked opponents persist (localStorage)
- Win/Loss/KO/TKO tracking
- Can retry lost fights
- Fight Select screen shows full roster with lock/unlock status
- Champion celebration after beating Mike Tyson

## File Structure
```
punchout/
  index.html          - Entry point
  css/style.css       - Black background, centered canvas, pixelated rendering
  js/
    main.js           - Game loop, state management, entry point (ES module)
    input.js          - Keyboard input handler
    audio.js          - Web Audio API procedural sounds
    sprites.js        - Programmatic pixel art + text rendering
    opponents.js      - All opponent definitions (stats, patterns, colors)
    littlemac.js      - Player character state machine
    opponent.js       - Opponent AI state machine
    fight.js          - Fight/match state management
    career.js         - Career mode / circuit progression
    ui.js             - UI screens (title, fight card, HUD, results)
    renderer.js       - Main renderer, canvas scaling
  assets/             - (empty, all assets are programmatic)
  requirements.md     - This file
```
