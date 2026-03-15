// court.js — Court constants and drawing

export const COURT = {
    WIDTH: 256,
    HEIGHT: 240,
    LEFT: 24,
    RIGHT: 232,
    TOP: 100,       // far court line (top of play area)
    BOTTOM: 200,    // near court line (bottom of play area)
    NET_X: 128,     // net horizontal position
    NET_TOP: 64,    // net visual top
    NET_BOTTOM: 200,// net visual bottom
    NET_HEIGHT: 40, // ball must be above z=40 to clear
    HUD_BOTTOM: 56, // HUD area
    // Team sides
    LEFT_SIDE_MIN: 24,
    LEFT_SIDE_MAX: 126,
    RIGHT_SIDE_MIN: 130,
    RIGHT_SIDE_MAX: 232,
};

export function drawCourt(ctx) {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 70);
    skyGrad.addColorStop(0, '#4488DD');
    skyGrad.addColorStop(1, '#88BBFF');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 256, 70);

    // Ocean
    ctx.fillStyle = '#2266AA';
    ctx.fillRect(0, 56, 256, 14);

    // Ocean shimmer
    ctx.fillStyle = '#3388CC';
    ctx.fillRect(20, 60, 30, 1);
    ctx.fillRect(80, 62, 20, 1);
    ctx.fillRect(140, 59, 25, 1);
    ctx.fillRect(200, 63, 15, 1);

    // Beach / sand background
    const sandGrad = ctx.createLinearGradient(0, 70, 0, 240);
    sandGrad.addColorStop(0, '#E8CC88');
    sandGrad.addColorStop(1, '#D4B870');
    ctx.fillStyle = sandGrad;
    ctx.fillRect(0, 70, 256, 170);

    // Court sand (slightly different shade)
    ctx.fillStyle = '#DEC07A';
    ctx.fillRect(COURT.LEFT, COURT.TOP, COURT.RIGHT - COURT.LEFT, COURT.BOTTOM - COURT.TOP);

    // Court boundary lines (white)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;

    // Outer boundary
    ctx.strokeRect(COURT.LEFT + 0.5, COURT.TOP + 0.5,
                   COURT.RIGHT - COURT.LEFT - 1, COURT.BOTTOM - COURT.TOP - 1);

    // Center line (under net)
    ctx.beginPath();
    ctx.moveTo(COURT.NET_X + 0.5, COURT.TOP);
    ctx.lineTo(COURT.NET_X + 0.5, COURT.BOTTOM);
    ctx.stroke();

    // Net posts
    ctx.fillStyle = '#666666';
    ctx.fillRect(COURT.NET_X - 1, COURT.NET_TOP - 4, 3, 4);   // top post cap
    ctx.fillRect(COURT.NET_X - 1, COURT.BOTTOM - 2, 3, 6);     // bottom post base
    ctx.fillRect(COURT.NET_X, COURT.NET_TOP, 1, COURT.BOTTOM - COURT.NET_TOP); // post line

    // Net mesh
    ctx.fillStyle = 'rgba(40, 40, 40, 0.5)';
    ctx.fillRect(COURT.NET_X - 1, COURT.NET_TOP, 3, COURT.BOTTOM - COURT.NET_TOP);

    // Net top band (white tape)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(COURT.NET_X - 1, COURT.NET_TOP, 3, 2);

    // Net mesh lines (horizontal)
    ctx.strokeStyle = 'rgba(80, 80, 80, 0.4)';
    ctx.lineWidth = 1;
    for (let ny = COURT.NET_TOP + 8; ny < COURT.BOTTOM; ny += 8) {
        ctx.beginPath();
        ctx.moveTo(COURT.NET_X - 1, ny + 0.5);
        ctx.lineTo(COURT.NET_X + 2, ny + 0.5);
        ctx.stroke();
    }

    // Simple palm trees in background
    drawPalmTree(ctx, 12, 68);
    drawPalmTree(ctx, 244, 66);

    // Crowd silhouettes in far background
    drawCrowd(ctx);
}

function drawPalmTree(ctx, x, baseY) {
    // Trunk
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(x - 1, baseY - 20, 2, 20);

    // Leaves
    ctx.fillStyle = '#228822';
    ctx.fillRect(x - 5, baseY - 24, 10, 3);
    ctx.fillRect(x - 4, baseY - 26, 8, 2);
    ctx.fillRect(x - 3, baseY - 22, 6, 2);
    ctx.fillRect(x - 6, baseY - 23, 3, 2);
    ctx.fillRect(x + 3, baseY - 23, 3, 2);
}

function drawCrowd(ctx) {
    ctx.fillStyle = 'rgba(100, 80, 60, 0.3)';
    for (let cx = 30; cx < 120; cx += 6) {
        const h = 3 + Math.sin(cx * 0.5) * 2;
        ctx.fillRect(cx, 70 - h, 4, h);
    }
    for (let cx = 136; cx < 226; cx += 6) {
        const h = 3 + Math.cos(cx * 0.3) * 2;
        ctx.fillRect(cx, 70 - h, 4, h);
    }
}
