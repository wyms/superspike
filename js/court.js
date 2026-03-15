// court.js — Court constants and drawing (NES-authentic top-down angled view)
// The court is viewed from above at ~45 degrees. The net runs HORIZONTALLY
// across the screen. Near side (bottom) = player's team, Far side (top) = opponent.

export const COURT = {
    WIDTH: 256,
    HEIGHT: 240,

    // Court boundaries (the white lines on sand)
    LEFT: 40,
    RIGHT: 216,
    TOP: 80,        // far baseline (top of court)
    BOTTOM: 208,    // near baseline (bottom of court)

    // Net runs horizontally at this Y
    NET_Y: 140,
    NET_HEIGHT: 30, // ball must have z > this to clear the net

    // Net posts at sidelines
    NET_POST_LEFT: 36,
    NET_POST_RIGHT: 220,

    // Team sides (side 0 = near/bottom, side 1 = far/top)
    NEAR_MIN_Y: 142,
    NEAR_MAX_Y: 208,
    FAR_MIN_Y: 80,
    FAR_MAX_Y: 138,

    // HUD area
    HUD_HEIGHT: 16,

    // Sky/background zones
    HORIZON_Y: 52,
    OCEAN_Y: 44,
};

export function drawCourt(ctx) {
    // === SKY ===
    const skyGrad = ctx.createLinearGradient(0, 0, 0, COURT.OCEAN_Y);
    skyGrad.addColorStop(0, '#68A8FC');
    skyGrad.addColorStop(1, '#3CBCFC');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 256, COURT.OCEAN_Y);

    // Clouds
    drawCloud(ctx, 30, 12, 24);
    drawCloud(ctx, 120, 8, 20);
    drawCloud(ctx, 200, 18, 18);

    // === OCEAN ===
    const oceanGrad = ctx.createLinearGradient(0, COURT.OCEAN_Y, 0, COURT.HORIZON_Y + 12);
    oceanGrad.addColorStop(0, '#0078F8');
    oceanGrad.addColorStop(1, '#3CBCFC');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, COURT.OCEAN_Y, 256, COURT.HORIZON_Y - COURT.OCEAN_Y + 12);

    // Ocean shimmer
    ctx.fillStyle = '#58D0FC';
    for (let i = 0; i < 8; i++) {
        const sx = 15 + i * 32 + Math.sin(i * 2.7) * 8;
        const sy = COURT.OCEAN_Y + 2 + (i % 3) * 3;
        ctx.fillRect(sx, sy, 12 + (i % 3) * 4, 1);
    }

    // === BEACH / SAND (fills everything below ocean) ===
    const sandGrad = ctx.createLinearGradient(0, COURT.HORIZON_Y, 0, 240);
    sandGrad.addColorStop(0, '#D8B068');
    sandGrad.addColorStop(0.3, '#D4AC58');
    sandGrad.addColorStop(1, '#C8A048');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, COURT.HORIZON_Y, 256, 240 - COURT.HORIZON_Y);

    // === CROWD behind far baseline ===
    drawCrowd(ctx);

    // === PALM TREES on sides ===
    drawPalmTree(ctx, 14, COURT.HORIZON_Y + 6);
    drawPalmTree(ctx, 242, COURT.HORIZON_Y + 4);

    // === COURT SAND (slightly different shade) ===
    ctx.fillStyle = '#DEC07A';
    ctx.fillRect(COURT.LEFT, COURT.TOP, COURT.RIGHT - COURT.LEFT, COURT.BOTTOM - COURT.TOP);

    // Sand texture dots
    ctx.fillStyle = '#D4B46A';
    for (let gy = COURT.TOP + 3; gy < COURT.BOTTOM; gy += 8) {
        for (let gx = COURT.LEFT + 3; gx < COURT.RIGHT; gx += 12) {
            const ox = (gy * 7 + gx * 3) % 5;
            ctx.fillRect(gx + ox, gy, 1, 1);
        }
    }

    // === COURT BOUNDARY LINES (white) ===
    ctx.strokeStyle = '#FCFCFC';
    ctx.lineWidth = 1;

    // Outer boundary
    ctx.strokeRect(COURT.LEFT + 0.5, COURT.TOP + 0.5,
                   COURT.RIGHT - COURT.LEFT - 1, COURT.BOTTOM - COURT.TOP - 1);

    // Center line (under the net, horizontal)
    ctx.beginPath();
    ctx.moveTo(COURT.LEFT, COURT.NET_Y + 0.5);
    ctx.lineTo(COURT.RIGHT, COURT.NET_Y + 0.5);
    ctx.stroke();

    // === NET (horizontal band across court) ===
    drawNet(ctx);
}

function drawNet(ctx) {
    const netTop = COURT.NET_Y - 5;
    const netBot = COURT.NET_Y + 3;
    const netW = COURT.RIGHT - COURT.LEFT;

    // Net posts (left and right)
    // Left post
    ctx.fillStyle = '#666666';
    ctx.fillRect(COURT.NET_POST_LEFT, netTop - 6, 3, netBot - netTop + 8);
    ctx.fillStyle = '#AAAAAA';
    ctx.fillRect(COURT.NET_POST_LEFT, netTop - 8, 3, 3); // cap

    // Right post
    ctx.fillStyle = '#666666';
    ctx.fillRect(COURT.NET_POST_RIGHT - 1, netTop - 6, 3, netBot - netTop + 8);
    ctx.fillStyle = '#AAAAAA';
    ctx.fillRect(COURT.NET_POST_RIGHT - 1, netTop - 8, 3, 3); // cap

    // Net mesh background
    ctx.fillStyle = 'rgba(40, 40, 40, 0.45)';
    ctx.fillRect(COURT.LEFT, netTop, netW, netBot - netTop);

    // Net mesh pattern (vertical lines for hatching)
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.4)';
    ctx.lineWidth = 1;
    for (let nx = COURT.LEFT + 4; nx < COURT.RIGHT; nx += 4) {
        ctx.beginPath();
        ctx.moveTo(nx + 0.5, netTop);
        ctx.lineTo(nx + 0.5, netBot);
        ctx.stroke();
    }
    // Horizontal mesh lines
    ctx.beginPath();
    ctx.moveTo(COURT.LEFT, netTop + 3.5);
    ctx.lineTo(COURT.RIGHT, netTop + 3.5);
    ctx.stroke();

    // Net top tape (white line)
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(COURT.LEFT, netTop, netW, 2);
}

export function drawNetForeground(ctx) {
    // This draws the net portion that should appear IN FRONT of players
    // on the far side of the court (y < NET_Y).
    // Not strictly needed since we use y-sorting, but can add subtle depth.
}

function drawCloud(ctx, x, y, w) {
    ctx.fillStyle = '#E8E8FC';
    const h = Math.floor(w / 4);
    ctx.fillRect(x, y, w, h);
    ctx.fillRect(x + 2, y - 1, w - 4, 1);
    ctx.fillRect(x + 4, y - 2, w - 8, 1);
    ctx.fillRect(x + 2, y + h, w - 4, 1);
}

function drawPalmTree(ctx, x, baseY) {
    // Trunk
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x - 1, baseY - 24, 3, 24);
    ctx.fillStyle = '#A07818';
    ctx.fillRect(x, baseY - 24, 1, 24);

    // Leaves
    ctx.fillStyle = '#005800';
    ctx.fillRect(x - 8, baseY - 28, 17, 2);
    ctx.fillRect(x - 6, baseY - 30, 13, 2);
    ctx.fillStyle = '#00A800';
    ctx.fillRect(x - 7, baseY - 27, 15, 2);
    ctx.fillRect(x - 5, baseY - 29, 11, 1);
    ctx.fillRect(x - 9, baseY - 26, 5, 2);
    ctx.fillRect(x + 5, baseY - 26, 5, 2);
    // Drooping fronds
    ctx.fillStyle = '#00A800';
    ctx.fillRect(x - 10, baseY - 24, 3, 3);
    ctx.fillRect(x + 8, baseY - 24, 3, 3);
}

function drawCrowd(ctx) {
    // Spectators behind far baseline - varied colors
    const colors = ['#C06040', '#8060A0', '#60A060', '#A0A040', '#A06040', '#6080C0'];
    for (let cx = COURT.LEFT - 4; cx < COURT.RIGHT + 4; cx += 5) {
        const ci = Math.floor((cx * 7 + 13) % colors.length);
        const h = 4 + Math.floor(Math.sin(cx * 0.8) * 2);
        ctx.fillStyle = colors[ci];
        ctx.fillRect(cx, COURT.TOP - h - 2, 4, h);
        // Head
        ctx.fillStyle = '#FFCC88';
        ctx.fillRect(cx + 1, COURT.TOP - h - 4, 2, 2);
    }
}
