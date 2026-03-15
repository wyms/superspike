// sprites.js — Programmatic pixel art rendering

// Utility to draw a filled rect
function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

// Utility to draw a circle
function circle(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(Math.floor(x), Math.floor(y), r, 0, Math.PI * 2);
    ctx.fill();
}

// ===== RING DRAWING =====
export function drawRing(ctx, shake) {
    const sx = shake ? shake.x : 0;
    const sy = shake ? shake.y : 0;

    // Crowd background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 256, 240);

    // Crowd silhouettes
    for (let i = 0; i < 64; i++) {
        const cx = (i * 4.1) % 256;
        const cy = 20 + Math.sin(i * 1.3) * 8;
        const shade = 30 + (i * 7 % 20);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 10})`;
        circle(ctx, cx + sx, cy + sy, 3, ctx.fillStyle);
        rect(ctx, cx - 2 + sx, cy + 2 + sy, 4, 4, ctx.fillStyle);
    }
    // Second row
    for (let i = 0; i < 56; i++) {
        const cx = (i * 4.7 + 2) % 256;
        const cy = 34 + Math.sin(i * 0.9) * 5;
        const shade = 25 + (i * 5 % 15);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 8})`;
        circle(ctx, cx + sx, cy + sy, 3, ctx.fillStyle);
        rect(ctx, cx - 2 + sx, cy + 2 + sy, 4, 5, ctx.fillStyle);
    }

    // Ring floor (perspective trapezoid)
    ctx.fillStyle = '#4466aa';
    ctx.beginPath();
    ctx.moveTo(40 + sx, 50 + sy);
    ctx.lineTo(216 + sx, 50 + sy);
    ctx.lineTo(256 + sx, 200 + sy);
    ctx.lineTo(0 + sx, 200 + sy);
    ctx.closePath();
    ctx.fill();

    // Ring mat (lighter inner area)
    ctx.fillStyle = '#5577bb';
    ctx.beginPath();
    ctx.moveTo(55 + sx, 55 + sy);
    ctx.lineTo(201 + sx, 55 + sy);
    ctx.lineTo(235 + sx, 190 + sy);
    ctx.lineTo(21 + sx, 190 + sy);
    ctx.closePath();
    ctx.fill();

    // Ring mat center circle/design
    ctx.fillStyle = '#4466aa';
    ctx.beginPath();
    ctx.ellipse(128 + sx, 120 + sy, 40, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Corner posts
    const posts = [
        [42, 48], [214, 48], [0, 198], [254, 198]
    ];
    for (const [px, py] of posts) {
        rect(ctx, px - 2 + sx, py - 4 + sy, 5, 8, '#cccccc');
        rect(ctx, px - 1 + sx, py - 6 + sy, 3, 3, '#ff3333');
    }

    // Ropes
    const ropeColors = ['#ffffff', '#ff3333', '#ffffff'];
    for (let r = 0; r < 3; r++) {
        const ropeY1 = 46 - r * 5;
        const ropeY2 = 196 - r * 8;
        ctx.strokeStyle = ropeColors[r];
        ctx.lineWidth = 1;

        // Left ropes
        ctx.beginPath();
        ctx.moveTo(42 + sx, ropeY1 + sy);
        ctx.lineTo(0 + sx, ropeY2 + sy);
        ctx.stroke();

        // Right ropes
        ctx.beginPath();
        ctx.moveTo(214 + sx, ropeY1 + sy);
        ctx.lineTo(254 + sx, ropeY2 + sy);
        ctx.stroke();

        // Top rope
        ctx.beginPath();
        ctx.moveTo(42 + sx, ropeY1 + sy);
        ctx.lineTo(214 + sx, ropeY1 + sy);
        ctx.stroke();
    }
}

// ===== LITTLE MAC (viewed from behind) =====
export function drawLittleMac(ctx, state, frame, shake) {
    const sx = (shake ? shake.x : 0);
    const sy = (shake ? shake.y : 0);

    // Base position (centered at bottom)
    let bx = 116 + sx;
    let by = 155 + sy;
    let leftArmX = -12, leftArmY = -10;
    let rightArmX = 12, rightArmY = -10;
    let bodyOffsetX = 0;
    let bodySquish = 0;

    const bob = Math.sin(frame * 0.15) * 1;

    switch (state) {
        case 'IDLE':
            by += bob;
            break;
        case 'PUNCHING_LEFT':
            leftArmX = -4;
            leftArmY = -35;
            break;
        case 'PUNCHING_RIGHT':
            rightArmX = 4;
            rightArmY = -35;
            break;
        case 'DODGING_LEFT':
            bodyOffsetX = -16;
            break;
        case 'DODGING_RIGHT':
            bodyOffsetX = 16;
            break;
        case 'DUCKING':
        case 'BLOCKING':
            by += 10;
            bodySquish = 4;
            leftArmY = -4;
            rightArmY = -4;
            break;
        case 'STAR_PUNCH':
            rightArmX = 2;
            rightArmY = -42;
            leftArmX = -6;
            leftArmY = -8;
            break;
        case 'HIT':
            bodyOffsetX = (frame % 4 < 2) ? -3 : 3;
            break;
        case 'KNOCKED_DOWN':
            by += 20;
            bodySquish = 10;
            break;
        case 'GETTING_UP':
            by += 10 - (frame % 30) * 0.3;
            bodySquish = Math.max(0, 5 - (frame % 30) * 0.2);
            break;
    }

    bx += bodyOffsetX;

    // Hair (dark, from behind)
    rect(ctx, bx - 5, by - 25 + bodySquish, 10, 8, '#222222');

    // Head (from behind - skin)
    rect(ctx, bx - 6, by - 22 + bodySquish, 12, 10, '#e8b888');

    // Neck
    rect(ctx, bx - 3, by - 13 + bodySquish, 6, 4, '#e8b888');

    // Tank top (green)
    rect(ctx, bx - 8, by - 10 + bodySquish, 16, 14, '#22aa44');

    // Shorts (black)
    rect(ctx, bx - 8, by + 4 + bodySquish, 16, 8, '#222222');

    // Left arm
    rect(ctx, bx + leftArmX - 4, by + leftArmY + bodySquish, 5, 10, '#e8b888');
    // Left glove (green)
    circle(ctx, bx + leftArmX - 1, by + leftArmY - 2 + bodySquish, 4, '#22aa44');

    // Right arm
    rect(ctx, bx + rightArmX - 1, by + rightArmY + bodySquish, 5, 10, '#e8b888');
    // Right glove (green)
    circle(ctx, bx + rightArmX + 1, by + rightArmY - 2 + bodySquish, 4, '#22aa44');

    // Star punch glow effect
    if (state === 'STAR_PUNCH') {
        ctx.fillStyle = `rgba(255,255,0,${0.3 + Math.sin(frame * 0.5) * 0.2})`;
        circle(ctx, bx + rightArmX + 1, by + rightArmY - 4 + bodySquish, 7, ctx.fillStyle);
    }
}

// ===== OPPONENT DRAWING =====
export function drawOpponent(ctx, opp, state, frame, shake, animData) {
    const sx = (shake ? shake.x : 0);
    const sy = (shake ? shake.y : 0);

    let bx = 128 + sx;
    let by = 80 + sy;
    const w = opp.bodyWidth || 40;
    const h = opp.bodyHeight || 58;
    let bodyOffsetX = 0;
    let bodyOffsetY = 0;
    let mouthOpen = false;
    let mouthWide = false;
    let isFlashing = false;
    let leftArmExtend = 0;
    let rightArmExtend = 0;
    let bodyScale = 1.0;
    let headShake = 0;
    let spin = 0;

    const animFrame = animData ? animData.frame : 0;
    const tellAnim = animData ? animData.tellAnim : '';

    switch (state) {
        case 'IDLE':
            bodyOffsetY = Math.sin(frame * 0.1) * 1;
            break;
        case 'TELEGRAPHING':
            switch (tellAnim) {
                case 'pullBackRight':
                    rightArmExtend = -10 - animFrame * 0.3;
                    bodyOffsetX = 2;
                    break;
                case 'pullBackLeft':
                    leftArmExtend = -10 - animFrame * 0.3;
                    bodyOffsetX = -2;
                    break;
                case 'windUpRight':
                    rightArmExtend = -8;
                    bodyOffsetX = 5 + animFrame * 0.2;
                    break;
                case 'windUpLeft':
                    leftArmExtend = -8;
                    bodyOffsetX = -5 - animFrame * 0.2;
                    break;
                case 'shakeHead':
                    headShake = Math.sin(animFrame * 0.5) * 4;
                    break;
                case 'crouchDown':
                    bodyOffsetY = animFrame * 0.4;
                    bodyScale = 1.0 - animFrame * 0.005;
                    break;
                case 'stepBack':
                    bodyScale = 1.0 - animFrame * 0.008;
                    bodyOffsetY = -animFrame * 0.3;
                    break;
                case 'openMouth':
                    mouthOpen = true;
                    break;
                case 'openMouthWide':
                    mouthOpen = true;
                    mouthWide = true;
                    break;
                case 'flamencoSpin':
                    bodyOffsetX = Math.sin(animFrame * 0.3) * 6;
                    break;
                case 'gemFlash':
                    isFlashing = animFrame % 8 < 4;
                    break;
                case 'tigerSpin':
                    spin = animFrame * 0.2;
                    bodyOffsetX = Math.sin(spin) * 10;
                    break;
                case 'bullCharge':
                    bodyScale = 1.0 + animFrame * 0.01;
                    bodyOffsetY = -animFrame * 0.3;
                    break;
                case 'drinkSoda':
                    rightArmExtend = -15;
                    bodyOffsetX = 3;
                    break;
                case 'dreamcatcher':
                    bodyOffsetY = animFrame * 0.3;
                    headShake = Math.sin(animFrame * 0.8) * 3;
                    break;
                case 'flexRight':
                    rightArmExtend = -5;
                    bodyOffsetX = 4;
                    break;
                case 'spinPunch':
                    spin = animFrame * 0.15;
                    bodyOffsetX = Math.sin(spin) * 12;
                    break;
                case 'wink':
                    // Subtle - just slight lean
                    bodyOffsetX = 2;
                    break;
            }
            break;
        case 'ATTACKING':
            {
                const pat = animData ? animData.pattern : null;
                if (pat) {
                    if (pat.hand === 'right' || pat.hand === 'both') {
                        rightArmExtend = 25 + animFrame * 1.5;
                        bodyOffsetX = -3;
                    }
                    if (pat.hand === 'left' || pat.hand === 'both') {
                        leftArmExtend = 25 + animFrame * 1.5;
                        bodyOffsetX = 3;
                    }
                    if (pat.type === 'uppercut') {
                        bodyOffsetY = -animFrame * 0.8;
                    }
                    if (pat.type === 'special') {
                        bodyScale = 1.0 + animFrame * 0.008;
                    }
                }
            }
            break;
        case 'RECOVERING':
            bodyOffsetX = Math.sin(animFrame * 0.3) * 3;
            break;
        case 'HIT':
            bodyOffsetX = (animFrame % 4 < 2) ? -4 : 4;
            isFlashing = animFrame % 4 < 2;
            break;
        case 'STUNNED':
            bodyOffsetX = Math.sin(animFrame * 0.4) * 6;
            headShake = Math.sin(animFrame * 0.6) * 5;
            break;
        case 'KNOCKED_DOWN':
            bodyOffsetY = Math.min(animFrame * 2, 30);
            bodyScale = Math.max(0.7, 1.0 - animFrame * 0.01);
            break;
        case 'GETTING_UP':
            bodyOffsetY = Math.max(0, 30 - animFrame * 1);
            bodyScale = Math.min(1.0, 0.7 + animFrame * 0.01);
            break;
    }

    bx += bodyOffsetX;
    by += bodyOffsetY;

    const sw = w * bodyScale;
    const sh = h * bodyScale;

    // Flash effect
    if (isFlashing) {
        ctx.fillStyle = '#ffffff';
        rect(ctx, bx - sw / 2 - 2, by - sh / 2 - 2, sw + 4, sh + 4, '#ffffff');
    }

    // Body (torso)
    const torsoColor = opp.shortsColor || '#666666';
    rect(ctx, bx - sw / 4, by - 5, sw / 2, sh * 0.35, torsoColor);

    // Skin upper body
    rect(ctx, bx - sw / 3, by - sh * 0.25, sw * 0.66, sh * 0.25, opp.skinColor);

    // Head
    const headW = sw * 0.4;
    const headH = sh * 0.28;
    const headX = bx - headW / 2 + headShake;
    const headY = by - sh * 0.5;
    rect(ctx, headX, headY, headW, headH, opp.skinColor);

    // Hair
    rect(ctx, headX, headY - 2, headW, headH * 0.3, opp.hairColor);

    // Eyes
    const eyeY = headY + headH * 0.35;
    rect(ctx, headX + headW * 0.2, eyeY, 3, 2, '#111111');
    rect(ctx, headX + headW * 0.6, eyeY, 3, 2, '#111111');

    // Mouth
    if (mouthOpen) {
        const mw = mouthWide ? headW * 0.5 : headW * 0.3;
        const mh = mouthWide ? 5 : 3;
        rect(ctx, headX + (headW - mw) / 2, headY + headH * 0.7, mw, mh, '#440000');
    } else {
        rect(ctx, headX + headW * 0.3, headY + headH * 0.75, headW * 0.4, 1, '#884444');
    }

    // Opponent-specific features
    if (opp.headgearColor) {
        rect(ctx, headX - 1, headY - 3, headW + 2, headH * 0.4, opp.headgearColor);
    }
    if (opp.headband) {
        rect(ctx, headX - 2, headY + 2, headW + 4, 3, opp.headband);
    }
    if (opp.crown) {
        // Crown for King Hippo
        rect(ctx, headX + 2, headY - 6, headW - 4, 5, opp.crown);
        rect(ctx, headX + 4, headY - 9, 3, 4, opp.crown);
        rect(ctx, headX + headW / 2 - 1, headY - 10, 3, 5, opp.crown);
        rect(ctx, headX + headW - 7, headY - 9, 3, 4, opp.crown);
    }
    if (opp.turban) {
        circle(ctx, headX + headW / 2, headY - 2, headW * 0.35, opp.turban);
        // Gem
        if (isFlashing) {
            circle(ctx, headX + headW / 2, headY - 2, 3, '#ff0000');
        } else {
            circle(ctx, headX + headW / 2, headY - 2, 2, '#ffcc00');
        }
    }
    if (opp.sunglasses) {
        rect(ctx, headX + 1, eyeY - 1, headW - 2, 4, opp.sunglasses);
    }

    // King Hippo big belly
    if (opp.isKingHippo) {
        circle(ctx, bx, by + 5, sw * 0.35, opp.skinColor);
        // Belly button / bandage target
        rect(ctx, bx - 2, by + 5, 4, 3, '#cc9966');
    }

    // Left arm + glove
    const lArmX = bx - sw / 2 - 5;
    const lArmY = by - sh * 0.15 + leftArmExtend * (leftArmExtend > 0 ? 1 : 0.3);
    const lArmEndX = lArmX + (leftArmExtend > 0 ? -leftArmExtend * 0.3 : 0);
    const lArmEndY = lArmY + (leftArmExtend > 0 ? leftArmExtend : 0);
    rect(ctx, lArmX, lArmY, 6, 12 + Math.abs(leftArmExtend) * 0.5, opp.skinColor);
    circle(ctx, lArmX + 3, lArmEndY + 12 + Math.abs(leftArmExtend) * 0.5, 5, opp.glovesColor);

    // Right arm + glove
    const rArmX = bx + sw / 2;
    const rArmY = by - sh * 0.15 + rightArmExtend * (rightArmExtend > 0 ? 1 : 0.3);
    const rArmEndX = rArmX + (rightArmExtend > 0 ? rightArmExtend * 0.3 : 0);
    const rArmEndY = rArmY + (rightArmExtend > 0 ? rightArmExtend : 0);
    rect(ctx, rArmX, rArmY, 6, 12 + Math.abs(rightArmExtend) * 0.5, opp.skinColor);
    circle(ctx, rArmX + 3, rArmEndY + 12 + Math.abs(rightArmExtend) * 0.5, 5, opp.glovesColor);

    // Shorts
    rect(ctx, bx - sw / 3, by + sh * 0.08, sw * 0.66, sh * 0.2, opp.shortsColor);

    // Soda bottle when drinking
    if (tellAnim === 'drinkSoda' && state === 'TELEGRAPHING') {
        rect(ctx, bx + sw / 2 + 4, by - sh * 0.3, 4, 12, '#00aa00');
        rect(ctx, bx + sw / 2 + 5, by - sh * 0.3 - 3, 2, 4, '#00aa00');
    }

    // Tyson specific - more muscular look
    if (opp.isTyson) {
        // Broader shoulders
        rect(ctx, bx - sw / 2.5, by - sh * 0.22, sw * 0.8, 4, opp.skinColor);
    }
}

// ===== DRAW OPPONENT PORTRAIT (for VS screen, fight card) =====
export function drawPortrait(ctx, opp, x, y, size) {
    const s = size || 40;

    // Background
    rect(ctx, x, y, s, s, '#333355');

    // Face
    const faceW = s * 0.6;
    const faceH = s * 0.7;
    rect(ctx, x + (s - faceW) / 2, y + s * 0.15, faceW, faceH, opp.skinColor);

    // Hair
    rect(ctx, x + (s - faceW) / 2, y + s * 0.1, faceW, faceH * 0.25, opp.hairColor);

    // Eyes
    const ey = y + s * 0.45;
    rect(ctx, x + s * 0.3, ey, 2, 2, '#111');
    rect(ctx, x + s * 0.6, ey, 2, 2, '#111');

    // Mouth
    rect(ctx, x + s * 0.35, y + s * 0.65, s * 0.3, 1, '#884444');

    // Special features
    if (opp.crown) {
        rect(ctx, x + s * 0.25, y + 1, s * 0.5, 4, opp.crown);
    }
    if (opp.headband) {
        rect(ctx, x + s * 0.15, y + s * 0.2, s * 0.7, 2, opp.headband);
    }
    if (opp.turban) {
        circle(ctx, x + s / 2, y + s * 0.15, s * 0.2, opp.turban);
    }
    if (opp.sunglasses) {
        rect(ctx, x + s * 0.2, ey - 1, s * 0.6, 4, opp.sunglasses);
    }
    if (opp.headgearColor) {
        rect(ctx, x + (s - faceW) / 2 - 1, y + s * 0.08, faceW + 2, faceH * 0.3, opp.headgearColor);
    }

    // Border
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, s, s);
}

// ===== DRAW MAC PORTRAIT =====
export function drawMacPortrait(ctx, x, y, size) {
    const s = size || 40;

    rect(ctx, x, y, s, s, '#335533');

    // Face (from front for portrait)
    const faceW = s * 0.55;
    const faceH = s * 0.65;
    rect(ctx, x + (s - faceW) / 2, y + s * 0.2, faceW, faceH, '#e8b888');

    // Hair
    rect(ctx, x + (s - faceW) / 2, y + s * 0.12, faceW, faceH * 0.25, '#222222');

    // Eyes
    const ey = y + s * 0.42;
    rect(ctx, x + s * 0.32, ey, 2, 2, '#111');
    rect(ctx, x + s * 0.58, ey, 2, 2, '#111');

    // Mouth (determined grin)
    rect(ctx, x + s * 0.35, y + s * 0.62, s * 0.3, 1, '#884444');

    // Border
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, s, s);
}

// ===== EFFECTS =====
export function drawHitFlash(ctx, x, y, frame) {
    const alpha = Math.max(0, 1.0 - frame * 0.15);
    if (alpha <= 0) return;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    const r = 8 + frame * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Star burst
    ctx.fillStyle = `rgba(255,255,0,${alpha * 0.6})`;
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + frame * 0.2;
        const dist = 5 + frame * 3;
        rect(ctx, x + Math.cos(angle) * dist - 1, y + Math.sin(angle) * dist - 1, 3, 3, ctx.fillStyle);
    }
}

export function drawStarSparkle(ctx, x, y, frame) {
    const points = 5;
    const alpha = Math.max(0, 1.0 - frame * 0.05);
    if (alpha <= 0) return;
    const r = 6 + Math.sin(frame * 0.3) * 2;

    ctx.fillStyle = `rgba(255,255,0,${alpha})`;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2 + frame * 0.1;
        const dist = r + frame * 0.5;
        rect(ctx, x + Math.cos(angle) * dist - 1, y + Math.sin(angle) * dist - 1, 2, 2, ctx.fillStyle);
    }
    // Center star
    rect(ctx, x - 2, y - 2, 4, 4, `rgba(255,255,200,${alpha})`);
}

// ===== REF (simple) =====
export function drawRef(ctx, x, y, counting, countNum) {
    // Simple referee figure
    rect(ctx, x - 4, y - 15, 8, 10, '#ffffff'); // shirt
    rect(ctx, x - 3, y - 20, 6, 6, '#e8b888'); // head
    rect(ctx, x - 3, y - 5, 6, 8, '#222222'); // pants

    if (counting) {
        // Arm up with count
        rect(ctx, x + 4, y - 20, 4, 12, '#ffffff'); // arm up
        // Count number above
        if (countNum !== undefined) {
            drawText(ctx, String(countNum), x + 2, y - 26, '#ffffff', 'small');
        }
    }
}

// ===== TEXT DRAWING (pixel font) =====
const CHAR_MAP = {
    'A': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    'B': [[1,1,0],[1,0,1],[1,1,0],[1,0,1],[1,1,0]],
    'C': [[1,1,1],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    'D': [[1,1,0],[1,0,1],[1,0,1],[1,0,1],[1,1,0]],
    'E': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,1,1]],
    'F': [[1,1,1],[1,0,0],[1,1,0],[1,0,0],[1,0,0]],
    'G': [[1,1,1],[1,0,0],[1,0,1],[1,0,1],[1,1,1]],
    'H': [[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1]],
    'I': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    'J': [[0,0,1],[0,0,1],[0,0,1],[1,0,1],[1,1,1]],
    'K': [[1,0,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
    'L': [[1,0,0],[1,0,0],[1,0,0],[1,0,0],[1,1,1]],
    'M': [[1,0,1],[1,1,1],[1,1,1],[1,0,1],[1,0,1]],
    'N': [[1,0,1],[1,1,1],[1,1,1],[1,1,1],[1,0,1]],
    'O': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    'P': [[1,1,1],[1,0,1],[1,1,1],[1,0,0],[1,0,0]],
    'Q': [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1]],
    'R': [[1,1,1],[1,0,1],[1,1,0],[1,0,1],[1,0,1]],
    'S': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    'T': [[1,1,1],[0,1,0],[0,1,0],[0,1,0],[0,1,0]],
    'U': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    'V': [[1,0,1],[1,0,1],[1,0,1],[1,0,1],[0,1,0]],
    'W': [[1,0,1],[1,0,1],[1,1,1],[1,1,1],[1,0,1]],
    'X': [[1,0,1],[1,0,1],[0,1,0],[1,0,1],[1,0,1]],
    'Y': [[1,0,1],[1,0,1],[0,1,0],[0,1,0],[0,1,0]],
    'Z': [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,1,1]],
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
    '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '-': [[0,0,0],[0,0,0],[1,1,1],[0,0,0],[0,0,0]],
    ':': [[0,0,0],[0,1,0],[0,0,0],[0,1,0],[0,0,0]],
    '.': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,1,0]],
    '!': [[0,1,0],[0,1,0],[0,1,0],[0,0,0],[0,1,0]],
    '?': [[1,1,1],[0,0,1],[0,1,1],[0,0,0],[0,1,0]],
    ' ': [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]],
    '(': [[0,1,0],[1,0,0],[1,0,0],[1,0,0],[0,1,0]],
    ')': [[0,1,0],[0,0,1],[0,0,1],[0,0,1],[0,1,0]],
    ',': [[0,0,0],[0,0,0],[0,0,0],[0,1,0],[1,0,0]],
    "'": [[0,1,0],[0,1,0],[0,0,0],[0,0,0],[0,0,0]],
    '/': [[0,0,1],[0,0,1],[0,1,0],[1,0,0],[1,0,0]],
    '#': [[1,0,1],[1,1,1],[1,0,1],[1,1,1],[1,0,1]],
    '*': [[1,0,1],[0,1,0],[1,1,1],[0,1,0],[1,0,1]],
};

export function drawText(ctx, text, x, y, color = '#ffffff', size = 'normal') {
    const scale = size === 'large' ? 2 : size === 'small' ? 1 : 1;
    const pixSize = scale;
    const charWidth = 3 * pixSize + pixSize; // 3 cols + spacing
    const str = text.toUpperCase();

    ctx.fillStyle = color;
    for (let c = 0; c < str.length; c++) {
        const ch = CHAR_MAP[str[c]];
        if (!ch) continue;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 3; col++) {
                if (ch[row][col]) {
                    ctx.fillRect(
                        Math.floor(x + c * charWidth + col * pixSize),
                        Math.floor(y + row * pixSize),
                        pixSize, pixSize
                    );
                }
            }
        }
    }
}

export function drawTextCentered(ctx, text, y, color = '#ffffff', size = 'normal') {
    const scale = size === 'large' ? 2 : size === 'small' ? 1 : 1;
    const pixSize = scale;
    const charWidth = 3 * pixSize + pixSize;
    const totalWidth = text.length * charWidth;
    drawText(ctx, text, Math.floor(128 - totalWidth / 2), y, color, size);
}

// Big text for titles (double-size pixels)
export function drawBigText(ctx, text, x, y, color = '#ffffff') {
    const pixSize = 2;
    const charWidth = 3 * pixSize + pixSize * 1;
    const str = text.toUpperCase();

    ctx.fillStyle = color;
    for (let c = 0; c < str.length; c++) {
        const ch = CHAR_MAP[str[c]];
        if (!ch) continue;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 3; col++) {
                if (ch[row][col]) {
                    ctx.fillRect(
                        Math.floor(x + c * charWidth + col * pixSize),
                        Math.floor(y + row * pixSize),
                        pixSize, pixSize
                    );
                }
            }
        }
    }
}

export function drawBigTextCentered(ctx, text, y, color = '#ffffff') {
    const pixSize = 2;
    const charWidth = 3 * pixSize + pixSize;
    const totalWidth = text.length * charWidth;
    drawBigText(ctx, text, Math.floor(128 - totalWidth / 2), y, color);
}

// Measure text width
export function textWidth(text, size = 'normal') {
    const scale = size === 'large' ? 2 : 1;
    const pixSize = scale;
    const charWidth = 3 * pixSize + pixSize;
    return text.length * charWidth;
}

export function bigTextWidth(text) {
    const charWidth = 3 * 2 + 2;
    return text.length * charWidth;
}

// ===== STARS =====
export function drawStar(ctx, x, y, size, color = '#ffcc00') {
    ctx.fillStyle = color;
    const s = size;
    // Simple star shape
    rect(ctx, x - s, y - s/3, s*2, s*0.66, color);
    rect(ctx, x - s/3, y - s, s*0.66, s*2, color);
    rect(ctx, x - s*0.66, y - s*0.66, s*1.33, s*1.33, color);
}

// ===== HEARTS (HP) =====
export function drawHeart(ctx, x, y, filled) {
    if (filled) {
        ctx.fillStyle = '#ff4444';
    } else {
        ctx.fillStyle = '#442222';
    }
    // Simple heart: two bumps on top, point at bottom
    rect(ctx, x, y, 2, 2, ctx.fillStyle);
    rect(ctx, x + 3, y, 2, 2, ctx.fillStyle);
    rect(ctx, x - 1, y + 1, 7, 2, ctx.fillStyle);
    rect(ctx, x, y + 3, 5, 1, ctx.fillStyle);
    rect(ctx, x + 1, y + 4, 3, 1, ctx.fillStyle);
    rect(ctx, x + 2, y + 5, 1, 1, ctx.fillStyle);
}

// ===== DOC LOUIS (corner man) =====
export function drawDocLouis(ctx, x, y, talking, frame) {
    // Simple character facing camera
    // Head
    rect(ctx, x - 5, y - 18, 10, 10, '#6B4226');
    // Sunglasses
    rect(ctx, x - 4, y - 15, 8, 3, '#222222');
    // Smile
    if (talking && frame % 20 < 10) {
        rect(ctx, x - 2, y - 10, 4, 2, '#ffffff');
    } else {
        rect(ctx, x - 2, y - 10, 4, 1, '#884444');
    }
    // Body (jacket)
    rect(ctx, x - 7, y - 8, 14, 14, '#4444aa');
    // Hat
    rect(ctx, x - 6, y - 22, 12, 4, '#222222');
    rect(ctx, x - 8, y - 19, 16, 2, '#222222');
}
