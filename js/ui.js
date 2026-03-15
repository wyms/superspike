// ui.js — UI/menu system (all drawn to canvas)

import { TEAMS } from './teams.js';
import { COURT } from './court.js';

// Simple pixel font drawing
function drawText(ctx, text, x, y, size = 1, color = '#FFFFFF', align = 'left') {
    ctx.fillStyle = color;
    ctx.font = `bold ${Math.round(8 * size)}px "Courier New", Courier, monospace`;
    ctx.textBaseline = 'top';

    if (align === 'center') {
        const w = ctx.measureText(text).width;
        x -= w / 2;
    } else if (align === 'right') {
        const w = ctx.measureText(text).width;
        x -= w;
    }

    ctx.fillText(text, x, y);
}

// Draw a filled rectangle with optional border
function drawPanel(ctx, x, y, w, h, fillColor, borderColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, w, h);
    if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
}

// Draw a stat bar
function drawStatBar(ctx, x, y, label, value, maxValue = 10) {
    drawText(ctx, label, x, y, 0.8, '#CCCCCC');
    const barX = x + 40;
    const barW = 40;
    const barH = 5;

    // Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, y + 1, barW, barH);

    // Filled portion
    const fillW = (value / maxValue) * barW;
    const color = value >= 8 ? '#44DD44' : value >= 5 ? '#DDDD44' : '#DD4444';
    ctx.fillStyle = color;
    ctx.fillRect(barX, y + 1, fillW, barH);
}

export class UI {
    constructor() {
        this.blinkTimer = 0;
        this.selectedMenuItem = 0;
        this.menuItems = ['Exercise', 'Am. Circuit', 'World Cup'];
        this.pauseSelectedItem = 0;
        this.pauseItems = ['Resume', 'Quit'];
    }

    update() {
        this.blinkTimer++;
    }

    drawTitle(ctx) {
        // Dark background
        ctx.fillStyle = '#111133';
        ctx.fillRect(0, 0, 256, 240);

        // Stars
        ctx.fillStyle = '#FFFFFF';
        const stars = [[20, 10], [50, 25], [90, 8], [140, 20], [180, 15],
                       [210, 30], [30, 40], [120, 5], [240, 12], [170, 38]];
        for (const [sx, sy] of stars) {
            const twinkle = Math.sin(this.blinkTimer * 0.05 + sx) > 0 ? 1 : 0;
            if (twinkle) ctx.fillRect(sx, sy, 1, 1);
        }

        // Title background banner
        drawPanel(ctx, 20, 50, 216, 44, '#CC2222', '#FFDD44');

        // Title text
        drawText(ctx, 'SUPER SPIKE', 128, 55, 1.5, '#FFFFFF', 'center');
        drawText(ctx, "V'BALL", 128, 75, 1.5, '#FFDD44', 'center');

        // Volleyball icon
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(128, 110, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CC4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(128, 110, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(118, 110);
        ctx.lineTo(138, 110);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(128, 100);
        ctx.lineTo(128, 120);
        ctx.stroke();

        // Menu items
        for (let i = 0; i < this.menuItems.length; i++) {
            const yPos = 135 + i * 18;
            const selected = i === this.selectedMenuItem;
            const color = selected ? '#FFDD44' : '#AAAAAA';

            if (selected) {
                // Cursor
                drawText(ctx, '>', 55, yPos, 1, '#FFDD44');
                // Highlight background
                drawPanel(ctx, 62, yPos - 1, 132, 12, 'rgba(255, 221, 68, 0.15)');
            }

            drawText(ctx, this.menuItems[i], 128, yPos, 1, color, 'center');
        }

        // Blinking press enter
        if (Math.floor(this.blinkTimer / 30) % 2 === 0) {
            drawText(ctx, 'PRESS ENTER', 128, 200, 0.9, '#888888', 'center');
        }

        // Controls hint
        drawText(ctx, 'Z:Action X:Dive Arrows:Move', 128, 220, 0.6, '#555555', 'center');
        drawText(ctx, 'M:Mute  ESC:Pause', 128, 230, 0.6, '#555555', 'center');
    }

    drawTeamSelect(ctx, selectedIndex) {
        // Background
        ctx.fillStyle = '#222244';
        ctx.fillRect(0, 0, 256, 240);

        // Title
        drawText(ctx, 'SELECT YOUR TEAM', 128, 8, 1, '#FFDD44', 'center');

        // Draw team grid (2 rows x 3 columns)
        for (let i = 0; i < TEAMS.length; i++) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const tx = 12 + col * 82;
            const ty = 28 + row * 95;

            const team = TEAMS[i];
            const selected = i === selectedIndex;

            // Panel
            const borderColor = selected ? '#FFDD44' : '#555555';
            const bgColor = selected ? 'rgba(255, 221, 68, 0.1)' : 'rgba(0, 0, 0, 0.3)';
            drawPanel(ctx, tx, ty, 76, 88, bgColor, borderColor);

            // Team color indicator
            ctx.fillStyle = team.color;
            ctx.fillRect(tx + 2, ty + 2, 72, 4);

            // Team name
            drawText(ctx, team.name, tx + 38, ty + 10, 1, selected ? '#FFFFFF' : '#AAAAAA', 'center');

            // Player names
            drawText(ctx, team.players[0].name, tx + 38, ty + 22, 0.7, '#CCCCCC', 'center');
            drawText(ctx, team.players[1].name, tx + 38, ty + 32, 0.7, '#CCCCCC', 'center');

            // Stats
            const stats = team.stats;
            drawStatBar(ctx, tx + 4, ty + 44, 'SPD', stats.speed);
            drawStatBar(ctx, tx + 4, ty + 54, 'POW', stats.power);
            drawStatBar(ctx, tx + 4, ty + 64, 'TEC', stats.technique);
            drawStatBar(ctx, tx + 4, ty + 74, 'DEF', stats.defense);

            // Selection indicator
            if (selected) {
                // Animated border
                if (Math.floor(this.blinkTimer / 15) % 2 === 0) {
                    ctx.strokeStyle = '#FFDD44';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(tx - 1, ty - 1, 78, 90);
                }
            }
        }

        // Instructions
        drawText(ctx, 'Arrows:Select  Enter:Confirm', 128, 225, 0.7, '#888888', 'center');
    }

    drawHUD(ctx, match) {
        // HUD background
        drawPanel(ctx, 0, 0, 256, 20, 'rgba(0, 0, 0, 0.7)');

        // Left team name and score
        drawText(ctx, match.leftTeamName, 8, 4, 0.9, '#88BBFF');
        drawText(ctx, String(match.scoreLeft), 75, 3, 1.1, '#FFFFFF');

        // Dash
        drawText(ctx, '-', 128, 3, 1.1, '#AAAAAA', 'center');

        // Right team name and score
        drawText(ctx, String(match.scoreRight), 172, 3, 1.1, '#FFFFFF');
        drawText(ctx, match.rightTeamName, 248, 4, 0.9, '#FF8888', 'right');

        // Serving indicator
        const servX = match.servingTeam === 0 ? 90 : 158;
        if (Math.floor(this.blinkTimer / 20) % 2 === 0 || match.rallyState !== 'READY_TO_SERVE') {
            ctx.fillStyle = '#FFDD44';
            ctx.beginPath();
            ctx.arc(servX, 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Touch counter during rally
        if (match.rallyState === 'BALL_IN_PLAY' && match.touchCount > 0) {
            const touchSide = match.currentSide;
            const touchX = touchSide === 0 ? 64 : 192;
            drawText(ctx, `${match.touchCount}/3`, touchX, 13, 0.6, '#FFDD44', 'center');
        }

        // Match point flash
        if (match.matchPointFlash > 0 && Math.floor(match.matchPointFlash / 8) % 2 === 0) {
            drawText(ctx, 'MATCH POINT!', 128, 26, 1, '#FF4444', 'center');
        }

        // Rally state messages
        if (match.message && match.messageTimer > 0) {
            // Message background
            drawPanel(ctx, 48, 30, 160, 18, 'rgba(0, 0, 0, 0.7)', '#FFDD44');
            drawText(ctx, match.message, 128, 33, 0.9, '#FFFFFF', 'center');
        }

        // Serve prompt
        if (match.rallyState === 'READY_TO_SERVE') {
            if (Math.floor(this.blinkTimer / 25) % 2 === 0) {
                if (match.servingTeam === 0) {
                    drawText(ctx, 'Press Z to serve', 128, 82, 0.8, '#FFFFFF', 'center');
                } else {
                    drawText(ctx, 'Get ready...', 128, 82, 0.8, '#AAAAAA', 'center');
                }
            }
        }
    }

    drawPause(ctx) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 256, 240);

        // Pause panel
        drawPanel(ctx, 68, 80, 120, 80, '#222244', '#FFDD44');

        drawText(ctx, 'PAUSED', 128, 88, 1.2, '#FFDD44', 'center');

        for (let i = 0; i < this.pauseItems.length; i++) {
            const yPos = 112 + i * 18;
            const selected = i === this.pauseSelectedItem;
            const color = selected ? '#FFFFFF' : '#888888';

            if (selected) {
                drawText(ctx, '>', 82, yPos, 1, '#FFDD44');
            }

            drawText(ctx, this.pauseItems[i], 128, yPos, 1, color, 'center');
        }
    }

    drawResult(ctx, match) {
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, 256, 240);

        // Result panel
        drawPanel(ctx, 28, 50, 200, 130, '#222244', '#FFDD44');

        // Winner text
        const winnerName = match.winner === 0 ? match.leftTeamName : match.rightTeamName;
        drawText(ctx, 'MATCH OVER!', 128, 58, 1.2, '#FFDD44', 'center');

        drawText(ctx, winnerName + ' WINS!', 128, 80, 1.3, '#FFFFFF', 'center');

        // Final score
        drawText(ctx, `${match.scoreLeft} - ${match.scoreRight}`, 128, 105, 1.5, '#FFFFFF', 'center');

        // Team names under score
        drawText(ctx, match.leftTeamName, 80, 125, 0.8, '#88BBFF', 'center');
        drawText(ctx, match.rightTeamName, 176, 125, 0.8, '#FF8888', 'center');

        // Prompt
        if (Math.floor(this.blinkTimer / 30) % 2 === 0) {
            drawText(ctx, 'PRESS ENTER', 128, 155, 0.9, '#AAAAAA', 'center');
        }
    }

    drawModeSelect(ctx) {
        // Not needed for MVP but placeholder
    }
}
