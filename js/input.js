// input.js — Keyboard input manager
// Supports both arrow keys (P1) and WASD (P2, for future 2-player)

const keysDown = new Set();
const keysJustPressed = new Set();
const keysJustReleased = new Set();

function init() {
    window.addEventListener('keydown', (e) => {
        if (!keysDown.has(e.code)) {
            keysJustPressed.add(e.code);
        }
        keysDown.add(e.code);
        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
             'KeyZ', 'KeyX', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
             'KeyV', 'KeyB', 'KeyM', 'KeyP', 'KeyF',
             'Enter', 'Escape', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', (e) => {
        keysDown.delete(e.code);
        keysJustReleased.add(e.code);
    });

    window.addEventListener('blur', () => {
        keysDown.clear();
    });
}

export function isDown(code) {
    return keysDown.has(code);
}

export function isJustPressed(code) {
    return keysJustPressed.has(code);
}

export function isJustReleased(code) {
    return keysJustReleased.has(code);
}

export function clearFrame() {
    keysJustPressed.clear();
    keysJustReleased.clear();
}

// P1 movement (arrows)
export function getP1Direction() {
    let dx = 0, dy = 0;
    if (isDown('ArrowLeft')) dx -= 1;
    if (isDown('ArrowRight')) dx += 1;
    if (isDown('ArrowUp')) dy -= 1;
    if (isDown('ArrowDown')) dy += 1;
    return { dx, dy };
}

// P2 movement (WASD, for future use)
export function getP2Direction() {
    let dx = 0, dy = 0;
    if (isDown('KeyA')) dx -= 1;
    if (isDown('KeyD')) dx += 1;
    if (isDown('KeyW')) dy -= 1;
    if (isDown('KeyS')) dy += 1;
    return { dx, dy };
}

// Initialize on module load
init();
