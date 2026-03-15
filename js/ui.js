// ui.js — UI/menu system (NES-authentic style, all drawn to canvas)
// Title screen, team select, HUD, pause, results, tournament brackets

import { TEAMS } from './teams.js';
import { COURT } from './court.js';
import { drawPlayer } from './sprites.js';

// ---- NES-style pixel font ----
function drawText(ctx, text, x, y, size = 1, color = '#FCFCFC', align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(8 * size)}px "Courier New", Courier, monospace`;
    ctx.textBaseline = 'top';

    if (align === 'center') {
        x -= ctx.measureText(text).width / 2;
    } else if (align === 'right') {
        x -= ctx.measureText(text).width;
    }

    ctx.fillText(text, Math.floor(x), Math.floor(y));
}

// Draw text with a shadow (NES style)
function drawTextShadow(ctx, text, x, y, size, color, shadowColor, align) {
    drawText(ctx, text, x + 1, y + 1, size, shadowColor || '#000000', align);
    drawText(ctx, text, x, y, size, color, align);
}

function drawPanel(ctx, x, y, w, h, fillColor, borderColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
    if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
}

function drawStatBar(ctx, x, y, label, value, maxValue = 10) {
    drawText(ctx, label, x, y, 0.7, '#AAAAAA');
    const barX = x + 28;
    const barW = 36;
    const barH = 4;
    ctx.fillStyle = '#222222';
    ctx.fillRect(barX, y + 2, barW, barH);
    const fillW = Math.floor((value / maxValue) * barW);
    ctx.fillStyle = value >= 8 ? '#44DD44' : value >= 5 ? '#DDDD44' : '#DD4444';
    ctx.fillRect(barX, y + 2, fillW, barH);
    // Notches
    ctx.fillStyle = '#111111';
    for (let i = 1; i < maxValue; i++) {
        const nx = barX + Math.floor((i / maxValue) * barW);
        ctx.fillRect(nx, y + 2, 1, barH);
    }
}

export class UI {
    constructor() {
        this.blinkTimer = 0;
        this.selectedMenuItem = 0;
        this.menuItems = ['EXERCISE', 'AM. CIRCUIT', 'WORLD CUP'];
        this.pauseSelectedItem = 0;
        this.pauseItems = ['RESUME', 'QUIT'];
        this.starPositions = [];
        // Generate star field for title
        for (let i = 0; i < 30; i++) {
            this.starPositions.push({
                x: Math.random() * 256,
                y: Math.random() * 100,
                speed: 0.5 + Math.random() * 2
            });
        }
    }

    update() {
        this.blinkTimer++;
    }

    // ===========================
    // TITLE SCREEN
    // ===========================
    drawTitle(ctx) {
        // Dark blue starfield background
        ctx.fillStyle = '#080820';
        ctx.fillRect(0, 0, 256, 240);

        // Stars (twinkling)
        for (const star of this.starPositions) {
            const brightness = Math.sin(this.blinkTimer * 0.03 * star.speed + star.x) > 0;
            if (brightness) {
                ctx.fillStyle = star.speed > 1.5 ? '#FFFFFF' : '#8888CC';
                ctx.fillRect(Math.floor(star.x), Math.floor(star.y), 1, 1);
            }
        }

        // Title banner background
        drawPanel(ctx, 16, 40, 224, 50, '#CC2222', '#FFDD44');
        // Inner border
        ctx.strokeStyle = '#FF6644';
        ctx.lineWidth = 1;
        ctx.strokeRect(18.5, 42.5, 219, 45);

        // Title text with shadow
        drawTextShadow(ctx, 'SUPER SPIKE', 128, 48, 1.6, '#FCFCFC', '#880000', 'center');
        drawTextShadow(ctx, "V'BALL", 128, 68, 1.6, '#FFDD44', '#884400', 'center');

        // Volleyball graphic
        ctx.fillStyle = '#FCFCFC';
        ctx.beginPath();
        ctx.arc(128, 106, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CC4444';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(128, 106, 10, 0, Math.PI * 2); ctx.stroke();
        // Cross lines on ball
        ctx.beginPath(); ctx.moveTo(118, 106); ctx.lineTo(138, 106); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(128, 96); ctx.lineTo(128, 116); ctx.stroke();
        ctx.strokeStyle = '#4444CC';
        ctx.beginPath(); ctx.arc(128, 106, 7, 0.5, 2); ctx.stroke();

        // Credits
        drawText(ctx, '1990 TECHNOS JAPAN', 128, 120, 0.6, '#666688', 'center');

        // Menu items
        for (let i = 0; i < this.menuItems.length; i++) {
            const yPos = 140 + i * 18;
            const selected = i === this.selectedMenuItem;

            if (selected) {
                // Flashing cursor
                if (Math.floor(this.blinkTimer / 8) % 2 === 0) {
                    drawText(ctx, '\u25B6', 48, yPos, 0.9, '#FFDD44');
                }
                // Highlight bar
                ctx.fillStyle = 'rgba(255, 221, 68, 0.08)';
                ctx.fillRect(56, yPos - 1, 144, 13);
            }

            const color = selected ? '#FCFCFC' : '#888888';
            drawTextShadow(ctx, this.menuItems[i], 128, yPos, 1, color, '#222222', 'center');
        }

        // Blinking "press start"
        if (Math.floor(this.blinkTimer / 25) % 2 === 0) {
            drawText(ctx, 'PRESS ENTER', 128, 204, 0.8, '#888888', 'center');
        }

        // Controls
        drawText(ctx, 'Z:HIT  X:DIVE  ARROWS:MOVE', 128, 222, 0.55, '#444466', 'center');
        drawText(ctx, 'M:MUTE  ESC:PAUSE', 128, 232, 0.55, '#444466', 'center');
    }

    // ===========================
    // TEAM SELECT
    // ===========================
    drawTeamSelect(ctx, selectedIndex) {
        ctx.fillStyle = '#181838';
        ctx.fillRect(0, 0, 256, 240);

        // Header
        drawPanel(ctx, 0, 0, 256, 18, '#222244');
        drawTextShadow(ctx, 'SELECT YOUR TEAM', 128, 3, 1, '#FFDD44', '#222222', 'center');

        // Team grid: 3 columns x 2 rows
        for (let i = 0; i < TEAMS.length; i++) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const tx = 6 + col * 84;
            const ty = 24 + row * 102;
            const team = TEAMS[i];
            const selected = i === selectedIndex;

            // Panel
            const bgColor = selected ? 'rgba(255, 221, 68, 0.12)' : 'rgba(0, 0, 20, 0.5)';
            const borderColor = selected ? '#FFDD44' : '#444466';
            drawPanel(ctx, tx, ty, 78, 96, bgColor, borderColor);

            // Team color strip
            ctx.fillStyle = team.color;
            ctx.fillRect(tx + 2, ty + 2, 74, 3);

            // Team name
            drawTextShadow(ctx, team.name, tx + 39, ty + 8, 0.9,
                selected ? '#FCFCFC' : '#AAAAAA', '#111111', 'center');

            // Player sprites (small)
            const p0 = team.players[0];
            const p1 = team.players[1];
            drawPlayer(ctx, tx + 14, ty + 20, 'idle', this.blinkTimer * 0.05, true,
                       team.color, team.color2, p0.skin, p0.hair, p0.hairStyle);
            drawPlayer(ctx, tx + 48, ty + 20, 'idle', this.blinkTimer * 0.05 + 2, true,
                       team.color, team.color2, p1.skin, p1.hair, p1.hairStyle);

            // Player names
            drawText(ctx, p0.name, tx + 4, ty + 42, 0.55, '#BBBBBB');
            drawText(ctx, p1.name, tx + 42, ty + 42, 0.55, '#BBBBBB');

            // Stats
            const stats = team.stats;
            drawStatBar(ctx, tx + 4, ty + 52, 'SPD', stats.speed);
            drawStatBar(ctx, tx + 4, ty + 62, 'POW', stats.power);
            drawStatBar(ctx, tx + 4, ty + 72, 'TEC', stats.technique);
            drawStatBar(ctx, tx + 4, ty + 82, 'DEF', stats.defense);

            // Flashing selection border
            if (selected && Math.floor(this.blinkTimer / 10) % 2 === 0) {
                ctx.strokeStyle = '#FFDD44';
                ctx.lineWidth = 2;
                ctx.strokeRect(tx - 1, ty - 1, 80, 98);
            }
        }

        // Instructions
        drawText(ctx, 'ARROWS:SELECT  Z/ENTER:CONFIRM  ESC:BACK', 128, 230, 0.5, '#666688', 'center');
    }

    // ===========================
    // IN-GAME HUD
    // ===========================
    drawHUD(ctx, match) {
        // HUD bar at top
        drawPanel(ctx, 0, 0, 256, 16, 'rgba(0, 0, 0, 0.75)');

        // Near team (player's team) on left
        drawText(ctx, match.nearTeamName, 4, 3, 0.8, '#88BBFF');

        // Score
        const scoreStr = `${match.scoreNear}  -  ${match.scoreFar}`;
        drawTextShadow(ctx, scoreStr, 128, 2, 1.1, '#FCFCFC', '#222222', 'center');

        // Far team on right
        drawText(ctx, match.farTeamName, 252, 3, 0.8, '#FF8888', 'right');

        // Serving indicator (small ball icon)
        const servX = match.servingTeam === 0 ? 85 : 168;
        if (Math.floor(this.blinkTimer / 15) % 2 === 0 || match.rallyState !== 'READY_TO_SERVE') {
            ctx.fillStyle = '#FFDD44';
            ctx.beginPath();
            ctx.arc(servX, 8, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Touch counter
        if (match.rallyState === 'BALL_IN_PLAY' && match.touchCount > 0) {
            const touchX = match.currentSide === 0 ? 60 : 196;
            const touchColor = match.touchCount >= 3 ? '#FF4444' : '#FFDD44';
            drawText(ctx, `${match.touchCount}/3`, touchX, 3, 0.6, touchColor, 'center');
        }

        // Match point flash
        if (match.matchPointFlash > 0 && Math.floor(match.matchPointFlash / 6) % 2 === 0) {
            drawPanel(ctx, 64, 18, 128, 14, 'rgba(200, 0, 0, 0.8)');
            drawTextShadow(ctx, 'MATCH POINT!', 128, 20, 0.9, '#FFDD44', '#440000', 'center');
        }

        // Rally state messages
        if (match.message && match.messageTimer > 0) {
            drawPanel(ctx, 56, 20, 144, 16, 'rgba(0, 0, 0, 0.8)', '#FFDD44');
            drawTextShadow(ctx, match.message, 128, 23, 0.9, '#FCFCFC', '#222222', 'center');
        }

        // Serve prompt
        if (match.rallyState === 'READY_TO_SERVE') {
            if (Math.floor(this.blinkTimer / 20) % 2 === 0) {
                if (match.servingTeam === 0) {
                    drawText(ctx, 'PRESS Z TO SERVE', 128, COURT.BOTTOM + 8, 0.7, '#FCFCFC', 'center');
                } else {
                    drawText(ctx, 'GET READY...', 128, COURT.BOTTOM + 8, 0.7, '#AAAAAA', 'center');
                }
            }
        }
    }

    // ===========================
    // PAUSE MENU
    // ===========================
    drawPause(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 256, 240);

        drawPanel(ctx, 72, 80, 112, 72, '#181838', '#FFDD44');

        drawTextShadow(ctx, 'PAUSED', 128, 88, 1.1, '#FFDD44', '#222222', 'center');

        for (let i = 0; i < this.pauseItems.length; i++) {
            const yPos = 110 + i * 16;
            const selected = i === this.pauseSelectedItem;
            const color = selected ? '#FCFCFC' : '#666688';

            if (selected && Math.floor(this.blinkTimer / 8) % 2 === 0) {
                drawText(ctx, '\u25B6', 84, yPos, 0.8, '#FFDD44');
            }

            drawText(ctx, this.pauseItems[i], 128, yPos, 0.9, color, 'center');
        }
    }

    // ===========================
    // MATCH RESULT
    // ===========================
    drawResult(ctx, match) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, 256, 240);

        drawPanel(ctx, 28, 40, 200, 150, '#181838', '#FFDD44');

        // "GAME SET" header
        drawTextShadow(ctx, 'GAME SET', 128, 48, 1.4, '#FFDD44', '#444400', 'center');

        // Winner
        const winnerName = match.winner === 0 ? match.nearTeamName : match.farTeamName;
        drawTextShadow(ctx, winnerName + ' WINS!', 128, 75, 1.1, '#FCFCFC', '#222222', 'center');

        // Final score (large)
        const scoreStr = `${match.scoreNear} - ${match.scoreFar}`;
        drawTextShadow(ctx, scoreStr, 128, 100, 1.8, '#FCFCFC', '#222222', 'center');

        // Team names under score
        drawText(ctx, match.nearTeamName, 85, 125, 0.7, '#88BBFF', 'center');
        drawText(ctx, match.farTeamName, 171, 125, 0.7, '#FF8888', 'center');

        // Animated winner sprites
        const winTeamIdx = match.winner === 0 ? match.nearTeamIndex : match.farTeamIndex;
        const winTeam = TEAMS[winTeamIdx];
        if (winTeam) {
            drawPlayer(ctx, 90, 140, 'celebrating', this.blinkTimer * 0.1, true,
                       winTeam.color, winTeam.color2,
                       winTeam.players[0].skin, winTeam.players[0].hair, winTeam.players[0].hairStyle);
            drawPlayer(ctx, 150, 140, 'celebrating', this.blinkTimer * 0.1 + 2, true,
                       winTeam.color, winTeam.color2,
                       winTeam.players[1].skin, winTeam.players[1].hair, winTeam.players[1].hairStyle);
        }

        // Prompt
        if (Math.floor(this.blinkTimer / 25) % 2 === 0) {
            drawText(ctx, 'PRESS ENTER', 128, 172, 0.8, '#888888', 'center');
        }
    }

    // ===========================
    // TOURNAMENT BRACKET (Circuit / World Cup)
    // ===========================
    drawTournamentBracket(ctx, mode, round, opponents, wins) {
        ctx.fillStyle = '#101030';
        ctx.fillRect(0, 0, 256, 240);

        const title = mode === 1 ? 'AMERICAN CIRCUIT' : 'WORLD CUP';
        drawTextShadow(ctx, title, 128, 8, 1, '#FFDD44', '#222222', 'center');

        const totalRounds = mode === 1 ? 4 : 6;

        for (let i = 0; i < totalRounds; i++) {
            const yPos = 30 + i * 28;
            const isCompleted = i < round;
            const isCurrent = i === round;

            // Round label
            drawText(ctx, `ROUND ${i + 1}`, 20, yPos, 0.7, isCurrent ? '#FFDD44' : '#666688');

            // Opponent name
            if (opponents && opponents[i]) {
                const opp = opponents[i];
                drawText(ctx, `VS ${opp}`, 90, yPos, 0.7, isCurrent ? '#FCFCFC' : '#888888');
            } else if (!isCompleted) {
                drawText(ctx, '???', 90, yPos, 0.7, '#444444');
            }

            // Result
            if (isCompleted) {
                drawText(ctx, 'WIN!', 200, yPos, 0.7, '#44DD44');
            } else if (isCurrent) {
                drawText(ctx, '\u25B6', 180, yPos, 0.7, '#FFDD44');
            }
        }

        if (Math.floor(this.blinkTimer / 25) % 2 === 0) {
            drawText(ctx, 'PRESS ENTER TO CONTINUE', 128, 220, 0.7, '#888888', 'center');
        }
    }
}
