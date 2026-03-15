// renderer.js — Main rendering coordinator
// Handles drawing order (painter's algorithm by y-position),
// ball shadow/height rendering, screen flash effects, etc.

import { drawCourt, COURT } from './court.js';
import { drawPlayer, drawBall, drawBallShadow, drawSpikeTrail, drawPowerBall, drawIndicator } from './sprites.js';
import { TEAMS } from './teams.js';

const LOGICAL_WIDTH = 256;
const LOGICAL_HEIGHT = 240;

export class Renderer {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = LOGICAL_WIDTH;
        this.canvas.height = LOGICAL_HEIGHT;

        this.ctx.imageSmoothingEnabled = false;

        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const windowW = window.innerWidth;
        const windowH = window.innerHeight;

        const scaleX = Math.floor(windowW / LOGICAL_WIDTH) || 1;
        const scaleY = Math.floor(windowH / LOGICAL_HEIGHT) || 1;
        let scale = Math.min(scaleX, scaleY);
        if (scale < 1) {
            scale = Math.min(windowW / LOGICAL_WIDTH, windowH / LOGICAL_HEIGHT);
        }

        const displayW = Math.floor(LOGICAL_WIDTH * scale);
        const displayH = Math.floor(LOGICAL_HEIGHT * scale);

        this.canvas.style.width = displayW + 'px';
        this.canvas.style.height = displayH + 'px';
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = Math.floor((windowW - displayW) / 2) + 'px';
        this.canvas.style.top = Math.floor((windowH - displayH) / 2) + 'px';
    }

    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }

    drawGameplay(players, ball, match, ui) {
        const ctx = this.ctx;

        // Draw court background
        drawCourt(ctx);

        // Collect all drawable entities for y-sorting
        const entities = [];

        // Add players
        for (const p of players) {
            entities.push({
                type: 'player',
                data: p,
                sortY: p.y // sort by foot position on court
            });
        }

        // Ball visibility
        const showBall = ball.active || ball.z > 0 || (!ball.landed && ball.z >= 0);

        if (showBall) {
            // Ball shadow (drawn on ground at ball's x, y)
            entities.push({
                type: 'ballShadow',
                data: ball,
                sortY: ball.y - 0.5 // slightly before ball position
            });

            // Ball sprite (drawn at elevated position)
            entities.push({
                type: 'ball',
                data: ball,
                sortY: ball.y // same y for sorting, but rendered higher
            });
        }

        // Sort by y (smaller y = farther away = drawn first)
        entities.sort((a, b) => a.sortY - b.sortY);

        // Draw spike trail behind ball
        if (ball.spikeTrail && ball.trailPositions.length > 0) {
            for (const tp of ball.trailPositions) {
                drawSpikeTrail(ctx, tp.x, tp.y, tp.age);
            }
        }

        // Draw all entities
        for (const entity of entities) {
            switch (entity.type) {
                case 'player':
                    this.drawPlayerEntity(ctx, entity.data);
                    break;
                case 'ball':
                    this.drawBallEntity(ctx, entity.data);
                    break;
                case 'ballShadow':
                    drawBallShadow(ctx,
                        Math.floor(entity.data.x),
                        Math.floor(entity.data.y),
                        entity.data.z);
                    break;
            }
        }

        // Screen flash effect (after spike)
        if (ball.screenFlash > 0) {
            const alpha = ball.screenFlash * 0.15;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        }

        // Draw HUD
        ui.drawHUD(ctx, match);
    }

    drawPlayerEntity(ctx, player) {
        const team = TEAMS[player.teamIndex];
        const pData = team ? team.players[player.playerIndex] : null;

        const screenX = Math.floor(player.x);
        const screenY = Math.floor(player.y - player.z * 0.7);

        drawPlayer(ctx, screenX, screenY,
                   player.state, player.animFrame, player.facingRight,
                   player.color1 || '#3355DD',
                   player.color2 || '#DD3333',
                   pData ? pData.skin : player.skin,
                   pData ? pData.hair : player.hairColor,
                   pData ? pData.hairStyle : player.hairStyle);

        // Player shadow on ground (when in air)
        if (player.z > 2) {
            const shadowScale = Math.max(0.3, 1 - player.z / 50);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * shadowScale})`;
            ctx.beginPath();
            ctx.ellipse(player.x + 4, player.y + 18, 5 * shadowScale, 2 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Indicator above player
        if (player.indicator && player.indicatorTimer > 0) {
            drawIndicator(ctx, screenX, screenY, player.indicator);
        }

        // Power meter (small bar under player when > 0)
        if (player.powerMeter > 0 && player.state !== 'celebrating' && player.state !== 'defeated') {
            const meterW = 12;
            const meterH = 2;
            const mx = screenX;
            const my = player.y + 20;
            ctx.fillStyle = '#333333';
            ctx.fillRect(mx, my, meterW, meterH);
            const fillW = (player.powerMeter / 100) * meterW;
            ctx.fillStyle = player.powerMeter >= 100 ? '#FFDD44' : '#44DD44';
            ctx.fillRect(mx, my, fillW, meterH);
        }
    }

    drawBallEntity(ctx, ball) {
        const sx = Math.floor(ball.x);
        const sy = Math.floor(ball.y - ball.z * 0.7);

        // Power ball glow
        if (ball.isPowerSpike) {
            drawPowerBall(ctx, sx, sy, ball.animFrame);
        }

        drawBall(ctx, sx, sy, ball.animFrame);
    }
}
