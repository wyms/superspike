// sprites.js — Kunio-kun style super-deformed pixel-art sprite system
// Characters are ~16x20px, stocky/chibi proportioned: big heads, thick bodies, short legs
// All drawn procedurally to canvas.

// Default skin/hair (overridden per-team)
const DEF_SKIN = '#FFCC88';
const DEF_SKIN_SHADOW = '#DD9944';
const DEF_HAIR = '#442200';
const SHOE_COLOR = '#FCFCFC';
const EYE_COLOR = '#000000';
const OUTLINE = '#282828';

// ---- Helper: draw a single pixel ----
function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

// ---- Helper: draw a rectangle of pixels ----
function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// ---- Darken a color slightly ----
function darken(hex, amt = 40) {
    const r = Math.max(0, parseInt(hex.slice(1,3),16) - amt);
    const g = Math.max(0, parseInt(hex.slice(3,5),16) - amt);
    const b = Math.max(0, parseInt(hex.slice(5,7),16) - amt);
    return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}

// =============================================
// DRAW HEAD (Kunio-kun style big head)
// Head is 8x7 pixels - big for chibi style
// ox, oy = top-left of head area
// =============================================
function drawHead(ctx, ox, oy, skin, hairColor, hairStyle, facingRight, mouthOpen) {
    const sk = skin || DEF_SKIN;
    const skShad = darken(sk, 50);
    const hr = hairColor || DEF_HAIR;

    // Face base (6 wide, 5 tall for face)
    rect(ctx, ox + 1, oy + 2, 6, 5, sk);
    // Wider jaw
    rect(ctx, ox + 2, oy + 6, 4, 1, sk);

    // Hair styles
    switch (hairStyle) {
        case 'spiky':
            rect(ctx, ox + 1, oy, 6, 2, hr);
            rect(ctx, ox + 2, oy - 1, 1, 1, hr);
            rect(ctx, ox + 4, oy - 1, 1, 1, hr);
            rect(ctx, ox + 6, oy - 1, 1, 1, hr);
            rect(ctx, ox, oy + 2, 1, 2, hr);
            break;
        case 'tall':
            rect(ctx, ox + 1, oy - 1, 6, 1, hr);
            rect(ctx, ox + 1, oy, 6, 2, hr);
            rect(ctx, ox + 2, oy - 2, 4, 1, hr);
            rect(ctx, ox, oy + 2, 1, 2, hr);
            break;
        case 'headband':
            rect(ctx, ox + 1, oy, 6, 2, hr);
            rect(ctx, ox, oy + 2, 8, 1, '#DD2222'); // red headband
            rect(ctx, ox, oy + 2, 1, 1, hr);
            break;
        case 'curly':
            rect(ctx, ox + 1, oy, 6, 2, hr);
            rect(ctx, ox, oy + 1, 1, 2, hr);
            rect(ctx, ox + 7, oy + 1, 1, 2, hr);
            px(ctx, ox + 1, oy - 1, hr);
            px(ctx, ox + 3, oy - 1, hr);
            px(ctx, ox + 5, oy - 1, hr);
            break;
        case 'flat':
            rect(ctx, ox + 1, oy, 6, 2, hr);
            rect(ctx, ox, oy + 2, 1, 2, hr);
            break;
        case 'short':
        default:
            rect(ctx, ox + 1, oy, 6, 2, hr);
            rect(ctx, ox, oy + 2, 1, 2, hr);
            rect(ctx, ox + 7, oy + 1, 1, 1, hr);
            break;
    }

    // Eyes
    if (facingRight) {
        px(ctx, ox + 4, oy + 3, EYE_COLOR);
        px(ctx, ox + 6, oy + 3, EYE_COLOR);
        // Eye whites
        px(ctx, ox + 4, oy + 3, EYE_COLOR);
        px(ctx, ox + 6, oy + 3, EYE_COLOR);
    } else {
        px(ctx, ox + 1, oy + 3, EYE_COLOR);
        px(ctx, ox + 3, oy + 3, EYE_COLOR);
    }

    // Mouth
    if (mouthOpen) {
        if (facingRight) {
            px(ctx, ox + 5, oy + 5, '#CC4444');
        } else {
            px(ctx, ox + 2, oy + 5, '#CC4444');
        }
    } else {
        if (facingRight) {
            px(ctx, ox + 5, oy + 5, skShad);
        } else {
            px(ctx, ox + 2, oy + 5, skShad);
        }
    }

    // Skin shadow under chin
    rect(ctx, ox + 2, oy + 6, 4, 1, skShad);
}

// =============================================
// DRAW BODY (torso + shorts)
// =============================================
function drawTorso(ctx, ox, oy, jersey, w, h) {
    rect(ctx, ox, oy, w, h, jersey);
    // Jersey detail - collar
    rect(ctx, ox + 1, oy, w - 2, 1, darken(jersey, 20));
}

function drawShorts(ctx, ox, oy, color, w, h) {
    rect(ctx, ox, oy, w, h, color);
}

// =============================================
// DRAW LEGS
// =============================================
function drawLeg(ctx, x, y, h, skin, shoeH) {
    rect(ctx, x, y, 2, h, skin);
    rect(ctx, x, y + h, 2, shoeH || 1, SHOE_COLOR);
}

// =============================================
// DRAW ARM
// =============================================
function drawArmPx(ctx, x, y, len, dirX, dirY, skin) {
    // Simple arm drawn as a line of 2px wide
    for (let i = 0; i < len; i++) {
        const ax = Math.round(x + dirX * i);
        const ay = Math.round(y + dirY * i);
        px(ctx, ax, ay, skin);
        px(ctx, ax, ay + 1, skin);
    }
}

// =============================================
// MAIN DRAW PLAYER FUNCTION
// =============================================
export function drawPlayer(ctx, x, y, state, frame, facingRight,
                           color1, color2, skin, hairColor, hairStyle) {
    ctx.save();

    const sk = skin || DEF_SKIN;
    const hr = hairColor || DEF_HAIR;
    const hs = hairStyle || 'short';

    // Flip for facing direction
    if (!facingRight) {
        ctx.translate(x + 8, y);
        ctx.scale(-1, 1);
        ctx.translate(-8, 0);
    } else {
        ctx.translate(x, y);
    }

    const f = Math.floor(frame) % 8;

    switch (state) {
        case 'idle':       drawIdle(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'running':    drawRunning(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'jumping':    drawJumping(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'spiking':    drawSpiking(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'bumping':    drawBumping(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'setting':    drawSetting(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'diving':     drawDiving(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'blocking':   drawBlocking(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'serving':    drawServing(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'celebrating':drawCelebrating(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        case 'defeated':   drawDefeated(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
        default:           drawIdle(ctx, f, color1, color2, sk, hr, hs, facingRight); break;
    }

    ctx.restore();
}

// === IDLE (ready stance, slight bob) ===
function drawIdle(ctx, f, c1, c2, sk, hr, hs, fr) {
    const bob = (f % 4) < 2 ? 0 : 1;
    // Head
    drawHead(ctx, 0, bob, sk, hr, hs, true, false);
    // Torso
    drawTorso(ctx, 1, 8 + bob, c1, 6, 4);
    // Shorts
    drawShorts(ctx, 1, 12 + bob, c2, 6, 2);
    // Legs
    drawLeg(ctx, 1, 14 + bob, 3, sk, 1);
    drawLeg(ctx, 5, 14 + bob, 3, sk, 1);
    // Arms at sides
    drawArmPx(ctx, 0, 9 + bob, 3, 0, 1, sk);
    drawArmPx(ctx, 7, 9 + bob, 3, 0, 1, sk);
}

// === RUNNING (4-frame leg cycle) ===
function drawRunning(ctx, f, c1, c2, sk, hr, hs, fr) {
    const phase = f % 4;
    drawHead(ctx, 0, -1, sk, hr, hs, true, false);
    // Leaning torso
    drawTorso(ctx, 2, 6, c1, 6, 4);
    drawShorts(ctx, 2, 10, c2, 6, 2);

    // Leg animation - 4 distinct phases
    const legData = [
        [[2, 12, 3], [6, 13, 2]],  // phase 0: left forward, right back
        [[3, 12, 2], [5, 12, 3]],  // phase 1: crossing
        [[6, 13, 2], [2, 12, 3]],  // phase 2: right forward, left back
        [[5, 12, 3], [3, 12, 2]],  // phase 3: crossing back
    ];
    const [l1, l2] = legData[phase];
    drawLeg(ctx, l1[0], l1[1], l1[2], sk, 1);
    drawLeg(ctx, l2[0], l2[1], l2[2], sk, 1);

    // Arms pumping
    const armUp = phase < 2;
    drawArmPx(ctx, 1, 7, 3, 0, armUp ? 1 : 0, sk);
    drawArmPx(ctx, 8, 7, 3, 0, armUp ? 0 : 1, sk);
}

// === BUMPING (low crouch, arms extended forward) ===
function drawBumping(ctx, f, c1, c2, sk, hr, hs, fr) {
    const phase = Math.min(f % 4, 2);
    const crouch = 2;
    drawHead(ctx, 0, crouch + 1, sk, hr, hs, true, true);
    drawTorso(ctx, 1, 8 + crouch, c1, 6, 3);
    drawShorts(ctx, 1, 11 + crouch, c2, 6, 2);
    // Wide stance legs
    drawLeg(ctx, 0, 13 + crouch, 2, sk, 1);
    drawLeg(ctx, 6, 13 + crouch, 2, sk, 1);
    // Both arms forward together (platform position)
    if (phase < 2) {
        rect(ctx, 7, 9 + crouch, 4, 2, sk); // arms extended forward
    } else {
        rect(ctx, 7, 10 + crouch, 3, 2, sk); // follow through
    }
}

// === SETTING (hands raised above head) ===
function drawSetting(ctx, f, c1, c2, sk, hr, hs, fr) {
    const phase = Math.min(f % 4, 2);
    const lift = phase === 1 ? -1 : 0;
    drawHead(ctx, 0, lift, sk, hr, hs, true, false);
    drawTorso(ctx, 1, 7 + lift, c1, 6, 4);
    drawShorts(ctx, 1, 11 + lift, c2, 6, 2);
    drawLeg(ctx, 1, 13 + lift, 3, sk, 1);
    drawLeg(ctx, 5, 13 + lift, 3, sk, 1);
    // Arms up above head
    drawArmPx(ctx, 1, 7 + lift, 3, 0, -1, sk);
    drawArmPx(ctx, 7, 7 + lift, 3, 0, -1, sk);
    // Fingertips (hands above head)
    px(ctx, 1, 4 + lift, sk);
    px(ctx, 2, 4 + lift, sk);
    px(ctx, 6, 4 + lift, sk);
    px(ctx, 7, 4 + lift, sk);
}

// === SPIKING (4-frame: jump, wind up, strike, follow through) ===
function drawSpiking(ctx, f, c1, c2, sk, hr, hs, fr) {
    const phase = Math.min(f % 5, 3);
    drawHead(ctx, 0, 0, sk, hr, hs, true, phase >= 2);

    drawTorso(ctx, 1, 7, c1, 6, 4);
    drawShorts(ctx, 1, 11, c2, 6, 2);
    // Tucked legs
    drawLeg(ctx, 1, 13, 2, sk, 1);
    drawLeg(ctx, 5, 13, 2, sk, 1);

    switch (phase) {
        case 0: // Wind up - arm back
            drawArmPx(ctx, 1, 7, 3, 0, -1, sk);  // left arm forward balance
            drawArmPx(ctx, 7, 6, 4, 0, -1, sk);   // right arm up high
            break;
        case 1: // Peak - arm cocked back
            drawArmPx(ctx, 2, 7, 3, -1, -1, sk);
            rect(ctx, 6, 2, 2, 2, sk); // hand way up
            drawArmPx(ctx, 7, 4, 3, 0, 1, sk);
            break;
        case 2: // Strike!
            drawArmPx(ctx, 1, 8, 3, 0, 1, sk);
            drawArmPx(ctx, 7, 7, 4, 1, 1, sk);  // arm swinging down-forward
            break;
        case 3: // Follow through
            drawArmPx(ctx, 1, 9, 2, 0, 1, sk);
            drawArmPx(ctx, 7, 9, 4, 1, 0, sk);  // arm extended forward
            break;
    }
}

// === DIVING (horizontal lunge) ===
function drawDiving(ctx, f, c1, c2, sk, hr, hs, fr) {
    // Body mostly horizontal
    const phase = Math.min(f % 4, 2);
    // Head
    rect(ctx, 10, 4 + phase, 6, 5, sk);
    rect(ctx, 10, 4 + phase, 6, 2, hr || DEF_HAIR);
    px(ctx, 14, 6 + phase, EYE_COLOR);
    // Body horizontal
    rect(ctx, 2, 8 + phase, 9, 4, c1);
    // Shorts
    rect(ctx, 0, 9 + phase, 3, 3, c2);
    // Legs trailing
    drawLeg(ctx, -2, 10 + phase, 2, sk, 1);
    // Arms reaching forward
    rect(ctx, 14, 7 + phase, 3, 2, sk);
}

// === BLOCKING (jump at net, arms straight up) ===
function drawBlocking(ctx, f, c1, c2, sk, hr, hs, fr) {
    const phase = Math.min(f % 4, 2);
    drawHead(ctx, 0, 0, sk, hr, hs, true, false);
    drawTorso(ctx, 1, 7, c1, 6, 4);
    drawShorts(ctx, 1, 11, c2, 6, 2);
    drawLeg(ctx, 1, 13, 2, sk, 1);
    drawLeg(ctx, 5, 13, 2, sk, 1);
    // Both arms straight up
    drawArmPx(ctx, 1, 7, 5, 0, -1, sk);
    drawArmPx(ctx, 7, 7, 5, 0, -1, sk);
    // Hands at top
    rect(ctx, 0, 1, 3, 2, sk);
    rect(ctx, 6, 1, 3, 2, sk);
}

// === SERVING (4 frames: hold, toss, wind up, strike) ===
function drawServing(ctx, f, c1, c2, sk, hr, hs, fr) {
    const phase = Math.min(f % 5, 3);
    drawHead(ctx, 0, 0, sk, hr, hs, true, phase >= 2);
    drawTorso(ctx, 1, 7, c1, 6, 4);
    drawShorts(ctx, 1, 11, c2, 6, 2);
    drawLeg(ctx, 1, 13, 3, sk, 1);
    drawLeg(ctx, 5, 13, 3, sk, 1);

    switch (phase) {
        case 0: // Hold ball
            drawArmPx(ctx, 1, 8, 3, -1, -1, sk);  // left arm out
            drawArmPx(ctx, 7, 7, 3, 0, -1, sk);    // right arm up (toss)
            break;
        case 1: // Toss - right arm high
            drawArmPx(ctx, 1, 8, 3, 0, 1, sk);
            drawArmPx(ctx, 7, 5, 4, 0, -1, sk);
            break;
        case 2: // Wind up
            drawArmPx(ctx, 2, 8, 3, -1, 0, sk);
            rect(ctx, 6, 3, 2, 2, sk);
            drawArmPx(ctx, 7, 5, 3, 0, 1, sk);
            break;
        case 3: // Strike
            drawArmPx(ctx, 1, 9, 2, 0, 1, sk);
            drawArmPx(ctx, 7, 7, 5, 1, 0, sk);
            break;
    }
}

// === CELEBRATING (jump + fist pump) ===
function drawCelebrating(ctx, f, c1, c2, sk, hr, hs, fr) {
    const jump = (f % 4) < 2 ? -2 : 0;
    drawHead(ctx, 0, jump, sk, hr, hs, true, true);
    drawTorso(ctx, 1, 7 + jump, c1, 6, 4);
    drawShorts(ctx, 1, 11 + jump, c2, 6, 2);
    if (jump < 0) {
        drawLeg(ctx, 1, 13, 2, sk, 1);
        drawLeg(ctx, 5, 13, 2, sk, 1);
    } else {
        drawLeg(ctx, 1, 13, 3, sk, 1);
        drawLeg(ctx, 5, 13, 3, sk, 1);
    }
    // Fist pump - one arm up in V
    drawArmPx(ctx, 1, 7 + jump, 4, -1, -1, sk);
    drawArmPx(ctx, 7, 7 + jump, 5, 1, -1, sk);
    // Fist
    px(ctx, 11, 3 + jump, sk);
    px(ctx, 12, 3 + jump, sk);
}

// === DEFEATED (slumped, head down) ===
function drawDefeated(ctx, f, c1, c2, sk, hr, hs, fr) {
    // Head hanging down
    drawHead(ctx, 0, 4, sk, hr, hs, true, false);
    drawTorso(ctx, 1, 11, c1, 6, 3);
    drawShorts(ctx, 1, 14, c2, 6, 2);
    // Kneeling
    rect(ctx, 0, 16, 3, 2, sk);
    rect(ctx, 5, 16, 3, 2, sk);
    rect(ctx, 0, 18, 3, 1, SHOE_COLOR);
    rect(ctx, 5, 18, 3, 1, SHOE_COLOR);
    // Arms hanging
    drawArmPx(ctx, 0, 12, 3, 0, 1, sk);
    drawArmPx(ctx, 7, 12, 3, 0, 1, sk);
}

// === JUMPING (transitional) ===
function drawJumping(ctx, f, c1, c2, sk, hr, hs, fr) {
    drawHead(ctx, 0, 0, sk, hr, hs, true, false);
    drawTorso(ctx, 1, 7, c1, 6, 4);
    drawShorts(ctx, 1, 11, c2, 6, 2);
    // Tucked legs
    drawLeg(ctx, 1, 13, 2, sk, 1);
    drawLeg(ctx, 5, 13, 2, sk, 1);
    // Arms up
    drawArmPx(ctx, 1, 7, 4, -1, -1, sk);
    drawArmPx(ctx, 7, 7, 4, 1, -1, sk);
}


// =============================================
// BALL SPRITE
// =============================================
export function drawBall(ctx, x, y, frame) {
    const f = Math.floor(frame) % 4;

    // Main ball body (6x6 circle approximation)
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(x + 1, y, 4, 1);
    ctx.fillRect(x, y + 1, 6, 4);
    ctx.fillRect(x + 1, y + 5, 4, 1);

    // Red stripe pattern (rotates)
    ctx.fillStyle = '#DD4444';
    switch (f) {
        case 0:
            ctx.fillRect(x + 1, y + 2, 4, 1);
            ctx.fillRect(x + 2, y + 1, 1, 4);
            break;
        case 1:
            px(ctx, x + 1, y + 1);
            px(ctx, x + 2, y + 2);
            px(ctx, x + 3, y + 3);
            px(ctx, x + 4, y + 4);
            break;
        case 2:
            ctx.fillRect(x + 1, y + 3, 4, 1);
            ctx.fillRect(x + 3, y + 1, 1, 4);
            break;
        case 3:
            px(ctx, x + 4, y + 1);
            px(ctx, x + 3, y + 2);
            px(ctx, x + 2, y + 3);
            px(ctx, x + 1, y + 4);
            break;
    }

    // Blue accent
    ctx.fillStyle = '#4444DD';
    switch (f) {
        case 0: px(ctx, x + 4, y + 3); px(ctx, x + 1, y + 4); break;
        case 1: px(ctx, x + 3, y + 1); px(ctx, x + 4, y + 3); break;
        case 2: px(ctx, x + 1, y + 1); px(ctx, x + 4, y + 2); break;
        case 3: px(ctx, x + 1, y + 1); px(ctx, x + 2, y + 4); break;
    }
}

// =============================================
// BALL SHADOW
// =============================================
export function drawBallShadow(ctx, x, y, height) {
    const scale = Math.max(0.3, 1 - height / 80);
    const w = Math.max(2, Math.floor(6 * scale));
    const h = Math.max(1, Math.floor(3 * scale));
    const alpha = Math.max(0.08, 0.35 * scale);

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 3, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
}

// =============================================
// SPIKE TRAIL EFFECT
// =============================================
export function drawSpikeTrail(ctx, x, y, frame) {
    const alpha = Math.max(0, 0.4 - frame * 0.1);
    if (alpha <= 0) return;
    ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
    ctx.fillRect(x, y + 1, 4, 4);
    ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.6})`;
    ctx.fillRect(x - 2, y + 2, 2, 2);
    ctx.fillRect(x + 4, y + 2, 2, 2);
}

// =============================================
// POWER SPIKE BALL EFFECT
// =============================================
export function drawPowerBall(ctx, x, y, frame) {
    // Draw the normal ball first (caller does this)
    // Then draw glow
    const alpha = 0.3 + Math.sin(frame * 0.5) * 0.15;
    ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
    ctx.fillRect(x - 1, y - 1, 8, 8);
    ctx.fillStyle = `rgba(255, 100, 50, ${alpha * 0.5})`;
    ctx.fillRect(x - 2, y - 2, 10, 10);
}

// =============================================
// INDICATOR (exclamation mark above player)
// =============================================
export function drawIndicator(ctx, x, y, type) {
    if (type === 'ready') {
        // Small arrow or "!" above head
        ctx.fillStyle = '#FFDD44';
        ctx.fillRect(x + 3, y - 6, 2, 3);
        ctx.fillRect(x + 3, y - 2, 2, 1);
    } else if (type === 'target') {
        // Small down arrow
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(x + 2, y - 7, 4, 1);
        ctx.fillRect(x + 3, y - 6, 2, 2);
    }
}
