# Super Spike V'Ball — Claude Code Guidelines

## Project Context

This is a browser-based recreation of the classic NES game **Super Spike V'Ball** (Technos Japan, 1990). The game is a 2-on-2 beach volleyball arcade game built with HTML5 Canvas and vanilla JavaScript, targeting GitHub Pages deployment.

- Pure client-side — no server, no build tools, no frameworks
- NES-faithful pixel art aesthetic (256x240 logical resolution)
- Gameplay first: physics and controls must feel right before anything else
- All design decisions documented in `requirements.md`

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Open `index.html` in a browser or describe how to verify visually
- Run through the gameplay loop manually: serve → rally → point → repeat
- Ask yourself: "Does this feel like the NES original?"

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- Game code tends toward spaghetti — fight that with clear state machines
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Visual bugs: describe what you see vs. what's expected, then fix

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Vanilla JS, no dependencies. Make every change as simple as possible.
- **No Laziness**: Find root causes. No temporary fixes. The game loop must be solid.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
- **Gameplay Over Graphics**: A fun game with rectangles beats a pretty game that plays badly.

## Tech Stack

- **Rendering**: HTML5 Canvas 2D API
- **Language**: Vanilla JavaScript (ES modules)
- **Audio**: Web Audio API
- **Resolution**: 256x240 logical pixels, integer-scaled to viewport
- **Frame Rate**: Fixed 60 FPS timestep (matching NES)
- **Hosting**: GitHub Pages (static `index.html` at repo root)

## Development Commands

```bash
# No build step — just open in browser
# Option 1: File system
open index.html

# Option 2: Local server (avoids CORS issues with ES modules)
python -m http.server 8000
# Then visit http://localhost:8000

# Option 3: VS Code Live Server extension
```

## Code Standards

- ES modules (`import`/`export`) for file separation
- Clear state machines for player states and game states
- Consistent coordinate system: origin top-left, y increases downward
- All magic numbers as named constants in the relevant module
- Game units (court meters) separate from pixel coordinates
- Comments only where logic isn't self-evident (physics formulas, AI heuristics)

## Game-Specific Guidelines

- **Physics must be deterministic**: same inputs = same outputs, every frame
- **Input must feel responsive**: zero perceptible lag between keypress and action
- **AI must be beatable but challenging**: telegraph moves slightly so the player can read them
- **Ball shadow is critical**: without it, players can't judge depth/height
- **Context-sensitive controls**: A button does the right thing based on game state — don't make players think about which button to press
- **Frame-perfect animations**: each sprite state needs clean transitions, no popping

## File Structure Reference

See `requirements.md` Section 12 for the full file tree. Key paths:
- `js/main.js` — game loop and state management
- `js/player.js` — player entity and state machine
- `js/ball.js` — ball entity and physics
- `js/ai.js` — CPU opponent logic
- `js/match.js` — scoring, serving, rally state
- `assets/sprites/` — all sprite sheets
