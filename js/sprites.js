// sprites.js — Programmatic pixel-art sprite system

// Player sprite: ~16x24 pixels
// Drawing origin is top-left of the bounding box

export function drawPlayer(ctx, x, y, state, frame, facingRight, color1, color2) {
    ctx.save();

    // Flip horizontally if facing left
    if (!facingRight) {
        ctx.translate(x + 8, y);
        ctx.scale(-1, 1);
        ctx.translate(-8, 0);
    } else {
        ctx.translate(x, y);
    }

    const f = Math.floor(frame) % 4;

    switch (state) {
        case 'idle': drawIdle(ctx, f, color1, color2); break;
        case 'running': drawRunning(ctx, f, color1, color2); break;
        case 'jumping': drawJumping(ctx, f, color1, color2); break;
        case 'spiking': drawSpiking(ctx, f, color1, color2); break;
        case 'bumping': drawBumping(ctx, f, color1, color2); break;
        case 'setting': drawSetting(ctx, f, color1, color2); break;
        case 'diving': drawDiving(ctx, f, color1, color2); break;
        case 'blocking': drawBlocking(ctx, f, color1, color2); break;
        case 'serving': drawServing(ctx, f, color1, color2); break;
        case 'celebrating': drawCelebrating(ctx, f, color1, color2); break;
        case 'defeated': drawDefeated(ctx, f, color1, color2); break;
        default: drawIdle(ctx, f, color1, color2); break;
    }

    ctx.restore();
}

// Skin color
const SKIN = '#FFCC88';
const SKIN_DARK = '#DD9944';
const HAIR = '#442200';

function drawHead(ctx, ox, oy) {
    // Head (6x6)
    ctx.fillStyle = SKIN;
    ctx.fillRect(ox + 5, oy, 6, 6);
    // Hair
    ctx.fillStyle = HAIR;
    ctx.fillRect(ox + 5, oy, 6, 2);
    ctx.fillRect(ox + 5, oy + 2, 1, 1);
    // Eye
    ctx.fillStyle = '#000000';
    ctx.fillRect(ox + 9, oy + 3, 1, 1);
}

function drawBody(ctx, oy, color1) {
    // Torso (8x6)
    ctx.fillStyle = color1;
    ctx.fillRect(4, oy, 8, 6);
}

function drawShorts(ctx, oy, color2) {
    ctx.fillStyle = color2;
    ctx.fillRect(4, oy, 8, 4);
}

function drawLegs(ctx, oy, lx1, ly1, lx2, ly2) {
    // Two legs as small rectangles
    ctx.fillStyle = SKIN;
    ctx.fillRect(lx1, oy + ly1, 3, 5);
    ctx.fillRect(lx2, oy + ly2, 3, 5);
    // Shoes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(lx1, oy + ly1 + 5, 3, 2);
    ctx.fillRect(lx2, oy + ly2 + 5, 3, 2);
}

function drawArm(ctx, ax, ay, length, angle, color) {
    ctx.fillStyle = color;
    // Simple arm as a rectangle at given position
    const rad = angle * Math.PI / 180;
    const ex = ax + Math.cos(rad) * length;
    const ey = ay + Math.sin(rad) * length;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// === IDLE ===
function drawIdle(ctx, f, c1, c2) {
    const bob = f % 2 === 0 ? 0 : 1;
    drawHead(ctx, 0, bob);
    drawBody(ctx, 6 + bob, c1);
    drawShorts(ctx, 12 + bob, c2);
    drawLegs(ctx, 12 + bob, 4, 4, 9, 4);
    // Arms at sides
    drawArm(ctx, 4, 8 + bob, 6, 90, SKIN);
    drawArm(ctx, 12, 8 + bob, 6, 90, SKIN);
}

// === RUNNING ===
function drawRunning(ctx, f, c1, c2) {
    drawHead(ctx, 0, 0);
    drawBody(ctx, 6, c1);
    drawShorts(ctx, 12, c2);
    // Animated legs
    const legPhase = f % 4;
    const offsets = [
        [4, 4, 9, 6],
        [3, 5, 10, 3],
        [4, 6, 9, 4],
        [5, 3, 8, 5]
    ];
    const [lx1, ly1, lx2, ly2] = offsets[legPhase];
    drawLegs(ctx, 12, lx1, ly1, lx2, ly2);
    // Arms swinging
    const armAngle1 = 70 + Math.sin(legPhase * 1.5) * 30;
    const armAngle2 = 70 - Math.sin(legPhase * 1.5) * 30;
    drawArm(ctx, 4, 8, 5, armAngle1, SKIN);
    drawArm(ctx, 12, 8, 5, armAngle2, SKIN);
}

// === JUMPING ===
function drawJumping(ctx, f, c1, c2) {
    drawHead(ctx, 0, 0);
    drawBody(ctx, 6, c1);
    drawShorts(ctx, 12, c2);
    // Legs tucked
    ctx.fillStyle = SKIN;
    ctx.fillRect(4, 16, 3, 4);
    ctx.fillRect(9, 16, 3, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(4, 20, 3, 2);
    ctx.fillRect(9, 20, 3, 2);
    // Arms up
    drawArm(ctx, 4, 8, 6, -60, SKIN);
    drawArm(ctx, 12, 8, 6, -60, SKIN);
}

// === SPIKING ===
function drawSpiking(ctx, f, c1, c2) {
    drawHead(ctx, 0, 0);
    drawBody(ctx, 6, c1);
    drawShorts(ctx, 12, c2);
    ctx.fillStyle = SKIN;
    ctx.fillRect(4, 16, 3, 4);
    ctx.fillRect(9, 16, 3, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(4, 20, 3, 2);
    ctx.fillRect(9, 20, 3, 2);
    // Spike arm raised high then swinging down
    if (f < 2) {
        drawArm(ctx, 12, 7, 8, -80, SKIN);
        drawArm(ctx, 4, 8, 5, -30, SKIN);
    } else {
        drawArm(ctx, 12, 7, 8, -20, SKIN);
        drawArm(ctx, 4, 8, 5, 30, SKIN);
    }
}

// === BUMPING ===
function drawBumping(ctx, f, c1, c2) {
    const crouch = 2;
    drawHead(ctx, 0, crouch);
    drawBody(ctx, 6 + crouch, c1);
    drawShorts(ctx, 12 + crouch, c2);
    drawLegs(ctx, 12 + crouch, 3, 2, 9, 2);
    // Arms forward and together (platform)
    drawArm(ctx, 5, 10 + crouch, 8, 10, SKIN);
    drawArm(ctx, 5, 12 + crouch, 8, 10, SKIN);
}

// === SETTING ===
function drawSetting(ctx, f, c1, c2) {
    drawHead(ctx, 0, 0);
    drawBody(ctx, 6, c1);
    drawShorts(ctx, 12, c2);
    drawLegs(ctx, 12, 4, 4, 9, 4);
    // Arms up and out (setting position)
    drawArm(ctx, 5, 7, 6, -70, SKIN);
    drawArm(ctx, 11, 7, 6, -70, SKIN);
    // Hands up
    ctx.fillStyle = SKIN;
    ctx.fillRect(3, 1, 2, 2);
    ctx.fillRect(11, 1, 2, 2);
}

// === DIVING ===
function drawDiving(ctx, f, c1, c2) {
    // Player horizontal / lunging
    ctx.save();
    ctx.translate(0, 8);
    // Body horizontal
    ctx.fillStyle = c1;
    ctx.fillRect(0, 6, 14, 5);
    // Head
    ctx.fillStyle = SKIN;
    ctx.fillRect(12, 3, 5, 5);
    ctx.fillStyle = HAIR;
    ctx.fillRect(12, 3, 5, 2);
    // Shorts
    ctx.fillStyle = c2;
    ctx.fillRect(0, 6, 4, 5);
    // Legs back
    ctx.fillStyle = SKIN;
    ctx.fillRect(-2, 8, 4, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-4, 8, 2, 3);
    // Arms forward
    drawArm(ctx, 14, 8, 6, 0, SKIN);
    ctx.restore();
}

// === BLOCKING ===
function drawBlocking(ctx, f, c1, c2) {
    drawHead(ctx, 0, 0);
    drawBody(ctx, 6, c1);
    drawShorts(ctx, 12, c2);
    ctx.fillStyle = SKIN;
    ctx.fillRect(4, 16, 3, 4);
    ctx.fillRect(9, 16, 3, 4);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(4, 20, 3, 2);
    ctx.fillRect(9, 20, 3, 2);
    // Both arms straight up
    drawArm(ctx, 5, 7, 8, -90, SKIN);
    drawArm(ctx, 11, 7, 8, -90, SKIN);
    // Hands
    ctx.fillStyle = SKIN;
    ctx.fillRect(4, -1, 3, 3);
    ctx.fillRect(10, -1, 3, 3);
}

// === SERVING ===
function drawServing(ctx, f, c1, c2) {
    drawHead(ctx, 0, 0);
    drawBody(ctx, 6, c1);
    drawShorts(ctx, 12, c2);
    drawLegs(ctx, 12, 4, 4, 9, 4);
    if (f < 2) {
        // Toss phase — one arm up holding ball area
        drawArm(ctx, 5, 8, 7, -80, SKIN);
        drawArm(ctx, 11, 8, 5, 60, SKIN);
    } else {
        // Strike phase — arm swings
        drawArm(ctx, 11, 7, 8, -30, SKIN);
        drawArm(ctx, 5, 8, 5, 30, SKIN);
    }
}

// === CELEBRATING ===
function drawCelebrating(ctx, f, c1, c2) {
    const jump = f % 2 === 0 ? 0 : -3;
    drawHead(ctx, 0, jump);
    drawBody(ctx, 6 + jump, c1);
    drawShorts(ctx, 12 + jump, c2);
    if (jump < 0) {
        ctx.fillStyle = SKIN;
        ctx.fillRect(4, 16, 3, 4);
        ctx.fillRect(9, 16, 3, 4);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(4, 20, 3, 2);
        ctx.fillRect(9, 20, 3, 2);
    } else {
        drawLegs(ctx, 12 + jump, 4, 4, 9, 4);
    }
    // Arms up in V shape
    drawArm(ctx, 5, 7 + jump, 7, -110, SKIN);
    drawArm(ctx, 11, 7 + jump, 7, -70, SKIN);
}

// === DEFEATED ===
function drawDefeated(ctx, f, c1, c2) {
    // Kneeling / slumped
    drawHead(ctx, 0, 4);
    drawBody(ctx, 10, c1);
    drawShorts(ctx, 16, c2);
    // Kneeling legs
    ctx.fillStyle = SKIN;
    ctx.fillRect(3, 20, 4, 2);
    ctx.fillRect(9, 20, 4, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(3, 22, 4, 1);
    ctx.fillRect(9, 22, 4, 1);
    // Arms down
    drawArm(ctx, 4, 12, 5, 100, SKIN);
    drawArm(ctx, 12, 12, 5, 80, SKIN);
}

// === BALL ===
export function drawBall(ctx, x, y, frame) {
    const f = Math.floor(frame) % 4;
    ctx.fillStyle = '#FFFFFF';
    // Main ball body (6x6 circle approximation)
    ctx.fillRect(x + 1, y, 4, 1);
    ctx.fillRect(x, y + 1, 6, 4);
    ctx.fillRect(x + 1, y + 5, 4, 1);

    // Cross pattern (rotates with frame)
    ctx.fillStyle = '#DD4444';
    if (f < 2) {
        // Horizontal and vertical lines
        ctx.fillRect(x + 1, y + 2, 4, 1);
        ctx.fillRect(x + 2, y + 1, 1, 4);
    } else {
        // Diagonal lines
        ctx.fillRect(x + 1, y + 1, 1, 1);
        ctx.fillRect(x + 2, y + 2, 1, 1);
        ctx.fillRect(x + 3, y + 3, 1, 1);
        ctx.fillRect(x + 4, y + 4, 1, 1);
        ctx.fillRect(x + 4, y + 1, 1, 1);
        ctx.fillRect(x + 1, y + 4, 1, 1);
    }

    // Blue lines
    ctx.fillStyle = '#4444DD';
    if (f < 2) {
        ctx.fillRect(x + 2, y + 4, 2, 1);
        ctx.fillRect(x + 4, y + 2, 1, 2);
    } else {
        ctx.fillRect(x + 2, y + 1, 2, 1);
        ctx.fillRect(x + 1, y + 2, 1, 2);
    }
}

export function drawBallShadow(ctx, x, y, height) {
    // Shadow gets smaller/lighter as ball gets higher
    const scale = Math.max(0.3, 1 - height / 80);
    const w = Math.floor(6 * scale);
    const h = Math.floor(3 * scale);
    const alpha = Math.max(0.1, 0.4 * scale);

    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    // Oval shadow
    const cx = x + 3;
    const cy = y + 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
}
