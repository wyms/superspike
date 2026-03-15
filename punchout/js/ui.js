// ui.js — All UI drawn to canvas

import {
    drawText, drawTextCentered, drawBigText, drawBigTextCentered,
    drawPortrait, drawMacPortrait, drawStar, drawHeart, drawDocLouis,
    bigTextWidth
} from './sprites.js';
import { OPPONENTS } from './opponents.js';
import { CIRCUITS } from './career.js';

// ===== TITLE SCREEN =====
export function drawTitleScreen(ctx, frame, menuIndex) {
    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 240);

    // Stars twinkling in background
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) {
        const sx = (i * 37 + frame * 0.3) % 256;
        const sy = (i * 23 + Math.sin(i + frame * 0.02) * 3) % 100;
        if ((i + Math.floor(frame * 0.05)) % 3 === 0) {
            ctx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
        }
    }

    // Title
    const titleY = 40;
    const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;
    const r = Math.floor(255 * pulse);
    const g = Math.floor(200 * pulse);

    drawBigTextCentered(ctx, 'PUNCH-OUT!!', titleY, `rgb(${r},${g},0)`);

    // Subtitle
    drawTextCentered(ctx, 'FEATURING', titleY + 20, '#aaaaaa');
    drawTextCentered(ctx, 'MIKE TYSON', titleY + 30, '#ff4444');

    // Boxing gloves decoration
    const gx = 80;
    const gy = 80;
    ctx.fillStyle = '#cc2222';
    ctx.beginPath();
    ctx.arc(gx, gy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(256 - gx, gy, 10, 0, Math.PI * 2);
    ctx.fill();

    // Ring ropes decoration
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, 100);
    ctx.lineTo(236, 100);
    ctx.stroke();
    ctx.strokeStyle = '#ff3333';
    ctx.beginPath();
    ctx.moveTo(20, 105);
    ctx.lineTo(236, 105);
    ctx.stroke();

    // Menu options
    const menuItems = ['NEW CAREER', 'CONTINUE', 'SELECT FIGHT'];
    const menuY = 130;
    const menuSpacing = 18;

    for (let i = 0; i < menuItems.length; i++) {
        const y = menuY + i * menuSpacing;
        const selected = i === menuIndex;
        const color = selected ? '#ffcc00' : '#888888';

        if (selected) {
            // Selection indicator
            const blink = frame % 30 < 20;
            if (blink) {
                drawText(ctx, '>', 60, y, '#ffcc00');
            }
        }

        drawTextCentered(ctx, menuItems[i], y, color);
    }

    // Controls
    drawTextCentered(ctx, 'Z/X PUNCH  ARROWS MOVE', 205, '#555555');
    drawTextCentered(ctx, 'ENTER TO SELECT', 215, '#555555');
    drawTextCentered(ctx, 'UP+Z/X FACE PUNCH', 225, '#555555');
}

// ===== FIGHT SELECT SCREEN =====
export function drawFightSelect(ctx, frame, career, selectedIndex) {
    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, 256, 240);

    drawBigTextCentered(ctx, 'SELECT FIGHT', 8, '#ffcc00');

    // Draw opponent list
    const startY = 30;
    const rowHeight = 18;

    for (let i = 0; i < OPPONENTS.length; i++) {
        const opp = OPPONENTS[i];
        const y = startY + i * rowHeight;
        const unlocked = career.canSelectOpponent(i);
        const defeated = career.defeatedOpponents.includes(i);
        const selected = i === selectedIndex;

        let color = '#444444';
        if (unlocked) color = '#aaaaaa';
        if (defeated) color = '#66aa66';
        if (selected) color = '#ffcc00';

        if (selected && frame % 30 < 20) {
            drawText(ctx, '>', 8, y, '#ffcc00');
        }

        const name = unlocked ? opp.name : '???';
        drawText(ctx, name, 16, y, color);

        if (unlocked) {
            drawText(ctx, opp.record, 120, y, color);
            drawText(ctx, opp.circuit, 170, y, '#666666');
        }

        if (defeated) {
            drawText(ctx, 'W', 210, y, '#44ff44');
        }
    }

    drawTextCentered(ctx, 'ENTER TO FIGHT  ESC BACK', 228, '#555555');
}

// ===== FIGHT CARD / VS SCREEN =====
export function drawFightCard(ctx, frame, opponentData, career) {
    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, 256, 240);

    // Circuit name
    drawTextCentered(ctx, career.getCurrentCircuitName().toUpperCase(), 10, '#ffcc00');

    if (career.isTitleFight()) {
        drawTextCentered(ctx, 'TITLE FIGHT!', 20, '#ff4444');
    }

    // VS
    drawBigTextCentered(ctx, 'VS', 55, '#ff4444');

    // Little Mac side
    drawMacPortrait(ctx, 30, 40, 50);
    drawText(ctx, 'LITTLE MAC', 25, 95, '#ffffff');
    drawText(ctx, career.getRecord(), 40, 105, '#aaaaaa');
    drawText(ctx, 'BRONX, NY', 30, 115, '#888888');

    // Opponent side
    drawPortrait(ctx, opponentData, 176, 40, 50);
    drawText(ctx, opponentData.name.toUpperCase(), 165, 95, '#ffffff');
    drawText(ctx, opponentData.record, 185, 105, '#aaaaaa');
    drawText(ctx, opponentData.nationality.toUpperCase(), 170, 115, '#888888');

    // Dividing line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(128, 35);
    ctx.lineTo(128, 125);
    ctx.stroke();

    // Fight info
    drawTextCentered(ctx, '3 ROUNDS  3 MINUTES EACH', 140, '#aaaaaa');

    // Doc Louis advice
    drawDocLouis(ctx, 128, 180, true, frame);
    drawTextCentered(ctx, '"' + (opponentData.advice || 'GO GET HIM MAC!') + '"', 195, '#88ff88');

    // Press start
    if (frame % 60 < 40) {
        drawTextCentered(ctx, 'PRESS ENTER TO FIGHT!', 220, '#ffffff');
    }
}

// ===== FIGHT HUD =====
export function drawFightHUD(ctx, fight) {
    const mac = fight.mac;
    const opp = fight.opponent;

    // Opponent HP bar (top)
    drawText(ctx, opp.data.name.toUpperCase(), 4, 4, '#ffffff');

    // HP bar background
    ctx.fillStyle = '#222222';
    ctx.fillRect(4, 12, 120, 6);

    // HP bar fill
    const oppHpPct = opp.hp / opp.maxHp;
    let hpColor = '#22cc22';
    if (oppHpPct < 0.3) hpColor = '#cc2222';
    else if (oppHpPct < 0.6) hpColor = '#cccc22';
    ctx.fillStyle = hpColor;
    ctx.fillRect(4, 12, Math.floor(120 * oppHpPct), 6);

    // HP bar border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 12, 120, 6);

    // Round and Timer (top right)
    drawText(ctx, 'RND ' + fight.round, 180, 4, '#ffffff');
    drawText(ctx, fight.getRoundTimeString(), 210, 12, '#ffcc00');

    // KD counts (top center area)
    drawText(ctx, 'KD', 136, 4, '#888888');
    drawText(ctx, String(opp.roundKnockdowns), 150, 4, '#ff4444');

    // Mac HP (hearts) at bottom
    drawText(ctx, 'MAC', 4, 222, '#ffffff');
    const heartsPerRow = 10;
    for (let i = 0; i < mac.maxHearts; i++) {
        const row = Math.floor(i / heartsPerRow);
        const col = i % heartsPerRow;
        drawHeart(ctx, 28 + col * 8, 220 + row * 8, i < mac.hearts);
    }

    // Mac HP bar
    ctx.fillStyle = '#222222';
    ctx.fillRect(4, 232, 120, 5);
    const macHpPct = mac.hp / mac.maxHp;
    let macHpColor = '#22cc22';
    if (macHpPct < 0.3) macHpColor = '#cc2222';
    else if (macHpPct < 0.6) macHpColor = '#cccc22';
    ctx.fillStyle = macHpColor;
    ctx.fillRect(4, 232, Math.floor(120 * macHpPct), 5);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(4, 232, 120, 5);

    // Stars
    for (let i = 0; i < 3; i++) {
        if (i < mac.stars) {
            drawStar(ctx, 140 + i * 14, 230, 4, '#ffcc00');
        } else {
            drawStar(ctx, 140 + i * 14, 230, 4, '#333333');
        }
    }

    // Mac KD
    drawText(ctx, 'KD', 200, 222, '#888888');
    drawText(ctx, String(mac.roundKnockdowns), 214, 222, '#ff4444');

    // Message
    if (fight.messageTimer > 0 && fight.message) {
        const flashRate = fight.messageTimer < 30 ? 4 : 8;
        if (fight.stateTimer % flashRate < flashRate - 1) {
            drawBigTextCentered(ctx, fight.message, 110, '#ffffff');
        }
    }
}

// ===== KNOCKDOWN / COUNT DISPLAY =====
export function drawKnockdownCount(ctx, countNumber, countTarget) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, 256, 240);

    // Count number (big)
    if (countNumber > 0) {
        drawBigTextCentered(ctx, String(countNumber), 100, '#ffcc00');
    }

    // Instructions for Mac
    if (countTarget === 'mac') {
        drawTextCentered(ctx, 'MASH Z AND X TO GET UP!', 130, '#ff4444');
    }
}

// ===== BETWEEN ROUNDS =====
export function drawBetweenRounds(ctx, frame, round, docAdvice, mac) {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 256, 240);

    // Corner scene
    // Stool
    ctx.fillStyle = '#666666';
    ctx.fillRect(100, 160, 56, 8);
    ctx.fillRect(110, 168, 4, 20);
    ctx.fillRect(142, 168, 4, 20);

    // Mac sitting (simplified)
    ctx.fillStyle = '#e8b888'; // skin
    ctx.fillRect(118, 130, 20, 16); // head from front
    ctx.fillStyle = '#222222';
    ctx.fillRect(118, 124, 20, 8); // hair
    ctx.fillStyle = '#22aa44'; // tank top
    ctx.fillRect(114, 146, 28, 16);

    // Doc Louis
    drawDocLouis(ctx, 75, 155, true, frame);

    // Stats
    drawBigTextCentered(ctx, 'END OF ROUND ' + round, 10, '#ffcc00');

    drawText(ctx, 'HP: ' + mac.hp + '/' + mac.maxHp, 20, 35, '#22cc22');
    drawText(ctx, 'STARS: ' + mac.stars, 20, 47, '#ffcc00');

    // Doc advice
    drawTextCentered(ctx, '"' + docAdvice + '"', 200, '#88ff88');

    // Continue prompt
    if (frame % 60 < 40) {
        drawTextCentered(ctx, 'PRESS ENTER FOR ROUND ' + (round + 1), 220, '#ffffff');
    }
}

// ===== RESULT SCREEN =====
export function drawResultScreen(ctx, frame, fight, career) {
    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, 256, 240);

    const isWin = fight.result === 'win';

    if (isWin) {
        // Victory!
        const pulse = Math.sin(frame * 0.1) * 0.3 + 0.7;
        const r = Math.floor(255 * pulse);
        const g = Math.floor(255 * pulse);
        drawBigTextCentered(ctx, 'WINNER!', 30, `rgb(${r},${g},0)`);

        drawTextCentered(ctx, fight.resultType + '!', 50, '#ffffff');

        drawTextCentered(ctx, 'LITTLE MAC WINS!', 70, '#22cc22');

        // Check if title fight won
        if (career.isTitleFight()) {
            drawTextCentered(ctx, career.getCurrentCircuitName().toUpperCase(), 90, '#ffcc00');
            drawTextCentered(ctx, 'CHAMPION!', 100, '#ffcc00');
        }

        // Celebration Mac
        // Simple victory pose
        const by = 150;
        const bob = Math.sin(frame * 0.2) * 3;
        ctx.fillStyle = '#e8b888';
        ctx.fillRect(120, by - 25 + bob, 16, 12); // head
        ctx.fillStyle = '#222222';
        ctx.fillRect(120, by - 30 + bob, 16, 6); // hair
        ctx.fillStyle = '#22aa44';
        ctx.fillRect(116, by - 13 + bob, 24, 18); // body
        // Arms up!
        ctx.fillStyle = '#e8b888';
        ctx.fillRect(108, by - 35 + bob, 6, 15);
        ctx.fillRect(142, by - 35 + bob, 6, 15);
        // Gloves up
        ctx.fillStyle = '#22aa44';
        ctx.beginPath();
        ctx.arc(111, by - 38 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(145, by - 38 + bob, 5, 0, Math.PI * 2);
        ctx.fill();
    } else {
        // Defeat
        drawBigTextCentered(ctx, 'DEFEAT', 30, '#cc2222');
        drawTextCentered(ctx, fight.resultType, 50, '#ffffff');
        drawTextCentered(ctx, fight.opponentData.name.toUpperCase() + ' WINS', 70, '#ff4444');

        // Defeated Mac
        const by = 160;
        ctx.fillStyle = '#e8b888';
        ctx.fillRect(110, by, 16, 10);
        ctx.fillStyle = '#22aa44';
        ctx.fillRect(106, by + 8, 24, 14);
        // Lying down
    }

    // Record
    drawText(ctx, 'RECORD: ' + career.getRecord(), 80, 195, '#aaaaaa');
    drawText(ctx, 'KOS: ' + career.kos + '  TKOS: ' + career.tkos, 60, 207, '#aaaaaa');

    if (frame % 60 < 40) {
        drawTextCentered(ctx, 'PRESS ENTER TO CONTINUE', 225, '#ffffff');
    }
}

// ===== PAUSE SCREEN =====
export function drawPauseOverlay(ctx, frame) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 256, 240);

    if (frame % 40 < 30) {
        drawBigTextCentered(ctx, 'PAUSED', 100, '#ffffff');
    }

    drawTextCentered(ctx, 'PRESS ESC TO RESUME', 130, '#aaaaaa');
    drawTextCentered(ctx, 'CONTROLS:', 155, '#ffcc00');
    drawTextCentered(ctx, 'Z/X  LEFT/RIGHT PUNCH', 168, '#888888');
    drawTextCentered(ctx, 'ARROWS  DODGE/DUCK', 178, '#888888');
    drawTextCentered(ctx, 'UP+Z/X  FACE PUNCH', 188, '#888888');
    drawTextCentered(ctx, 'UP  STAR PUNCH', 198, '#888888');
    drawTextCentered(ctx, 'DOWN  BLOCK', 208, '#888888');
}

// ===== INTRO SEQUENCE =====
export function drawFightIntro(ctx, frame, phase, opponentData) {
    ctx.fillStyle = '#0a0a2a';
    ctx.fillRect(0, 0, 256, 240);

    if (phase === 0) {
        // Opponent enters
        drawBigTextCentered(ctx, opponentData.name.toUpperCase(), 60, '#ffffff');
        drawTextCentered(ctx, opponentData.nationality.toUpperCase(), 80, '#aaaaaa');
        drawTextCentered(ctx, opponentData.record, 92, '#888888');

        drawPortrait(ctx, opponentData, 103, 110, 50);
    } else if (phase === 1) {
        // Round announcement
        drawBigTextCentered(ctx, 'ROUND 1', 80, '#ffcc00');
    } else if (phase === 2) {
        drawBigTextCentered(ctx, 'FIGHT!', 80, '#ff4444');
    }
}

// ===== GAME OVER / CHAMPION SCREEN =====
export function drawChampionScreen(ctx, frame) {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 240);

    const pulse = Math.sin(frame * 0.08) * 0.3 + 0.7;
    const r = Math.floor(255 * pulse);
    const g = Math.floor(215 * pulse);

    drawBigTextCentered(ctx, 'CHAMPION!', 40, `rgb(${r},${g},0)`);
    drawTextCentered(ctx, 'YOU DEFEATED MIKE TYSON!', 65, '#ffffff');
    drawTextCentered(ctx, 'LITTLE MAC IS THE', 85, '#aaaaaa');
    drawTextCentered(ctx, 'WORLD CHAMPION!', 97, '#ffcc00');

    // Trophy
    const tx = 118;
    const ty = 120;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(tx, ty, 20, 5);
    ctx.fillRect(tx + 5, ty + 5, 10, 15);
    ctx.fillRect(tx + 3, ty + 20, 14, 4);
    ctx.fillRect(tx - 5, ty - 5, 8, 8);
    ctx.fillRect(tx + 17, ty - 5, 8, 8);

    // Stars around trophy
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + frame * 0.03;
        const dist = 30 + Math.sin(frame * 0.05 + i) * 5;
        const sx = tx + 10 + Math.cos(angle) * dist;
        const sy = ty + 10 + Math.sin(angle) * dist;
        drawStar(ctx, sx, sy, 3, '#ffcc00');
    }

    if (frame % 60 < 40) {
        drawTextCentered(ctx, 'PRESS ENTER', 210, '#ffffff');
    }
}
