// renderer.js — Main rendering coordinator

import { drawCourt, COURT } from './court.js';
import { drawPlayer, drawBall, drawBallShadow } from './sprites.js';

const LOGICAL_WIDTH = 256;
const LOGICAL_HEIGHT = 240;

export class Renderer {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');

        // Set logical size
        this.canvas.width = LOGICAL_WIDTH;
        this.canvas.height = LOGICAL_HEIGHT;

        // Disable smoothing for pixel-perfect rendering
        this.ctx.imageSmoothingEnabled = false;

        // Handle window resizing
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    handleResize() {
        const windowW = window.innerWidth;
        const windowH = window.innerHeight;

        // Calculate integer scale that fits
        const scaleX = Math.floor(windowW / LOGICAL_WIDTH) || 1;
        const scaleY = Math.floor(windowH / LOGICAL_HEIGHT) || 1;
        const scale = Math.min(scaleX, scaleY);

        // If integer scaling is too small, use fractional
        let finalScale = scale;
        if (scale < 1) {
            finalScale = Math.min(windowW / LOGICAL_WIDTH, windowH / LOGICAL_HEIGHT);
        }

        const displayW = Math.floor(LOGICAL_WIDTH * finalScale);
        const displayH = Math.floor(LOGICAL_HEIGHT * finalScale);

        this.canvas.style.width = displayW + 'px';
        this.canvas.style.height = displayH + 'px';

        // Center the canvas
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

        // Collect all entities to sort by y position (painter's algorithm)
        const entities = [];

        // Add players
        for (const p of players) {
            entities.push({
                type: 'player',
                data: p,
                sortY: p.y
            });
        }

        // Determine if ball should be drawn
        const showBall = ball.active || ball.z > 0 || (!ball.landed && ball.z >= 0);

        if (showBall) {
            // Add ball shadow (on ground at ball's x, y)
            entities.push({
                type: 'ballShadow',
                data: ball,
                sortY: ball.y
            });

            // Add ball sprite
            entities.push({
                type: 'ball',
                data: ball,
                sortY: ball.y - ball.z
            });
        }

        // Sort by y (farther = drawn first)
        entities.sort((a, b) => a.sortY - b.sortY);

        // Draw entities
        for (const entity of entities) {
            switch (entity.type) {
                case 'player':
                    this.drawPlayerEntity(ctx, entity.data);
                    break;
                case 'ball':
                    drawBall(ctx,
                        Math.floor(entity.data.x),
                        Math.floor(entity.data.y - entity.data.z),
                        entity.data.animFrame);
                    break;
                case 'ballShadow':
                    drawBallShadow(ctx,
                        Math.floor(entity.data.x),
                        Math.floor(entity.data.y),
                        entity.data.z);
                    break;
            }
        }

        // Draw net in front of everything on the far side, behind near side
        this.drawNetOverlay(ctx);

        // Draw HUD
        ui.drawHUD(ctx, match);
    }

    drawPlayerEntity(ctx, player) {
        // Get team colors from the teams data
        const { color1, color2, state, animFrame, facingRight, x, y, z } = player;

        const screenX = Math.floor(x);
        const screenY = Math.floor(y - z);

        drawPlayer(ctx, screenX, screenY, state, animFrame, facingRight,
                   player.color1 || '#3355DD', player.color2 || '#DD3333');

        // Draw player shadow on ground
        if (z > 2) {
            const shadowScale = Math.max(0.4, 1 - z / 60);
            ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * shadowScale})`;
            ctx.beginPath();
            ctx.ellipse(x + 8, y + 22, 6 * shadowScale, 2 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawNetOverlay(ctx) {
        // Draw net "in front" for near-side depth
        // The net should appear in front of players near the bottom
        // We achieve this by drawing semi-transparent net posts at bottom
        ctx.fillStyle = 'rgba(60, 60, 60, 0.3)';
        ctx.fillRect(COURT.NET_X - 1, COURT.BOTTOM - 10, 3, 14);
    }
}
