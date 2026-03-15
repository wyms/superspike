// input.js — Keyboard input handler

const keys = {};
const justPressed = {};

function onKeyDown(e) {
    if (!keys[e.code]) {
        justPressed[e.code] = true;
    }
    keys[e.code] = true;
    // Prevent default for game keys
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyZ','KeyX','Enter','Escape','Space'].includes(e.code)) {
        e.preventDefault();
    }
}

function onKeyUp(e) {
    keys[e.code] = false;
}

export function initInput() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
}

export function isDown(code) {
    return !!keys[code];
}

export function isJustPressed(code) {
    return !!justPressed[code];
}

export function clearFrame() {
    for (const k in justPressed) {
        delete justPressed[k];
    }
}

export function anyKeyJustPressed() {
    for (const k in justPressed) {
        if (justPressed[k]) return true;
    }
    return false;
}

// For button mashing detection
export function mashCount() {
    let count = 0;
    if (justPressed['KeyZ']) count++;
    if (justPressed['KeyX']) count++;
    if (justPressed['ArrowLeft']) count++;
    if (justPressed['ArrowRight']) count++;
    return count;
}
