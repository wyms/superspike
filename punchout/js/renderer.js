// renderer.js — Main renderer

import {
    drawRing, drawLittleMac, drawOpponent,
    drawHitFlash, drawStarSparkle, drawRef,
    drawBigTextCentered, drawTextCentered
} from './sprites.js';
import {
    drawFightHUD, drawKnockdownCount, drawBetweenRounds,
    drawPauseOverlay, drawFightIntro
} from './ui.js';
import { FIGHT_STATES } from './fight.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const scale = Math.max(1, Math.min(
            Math.floor(w / 256),
            Math.floor(h / 240)
        ));
        this.canvas.style.width = (256 * scale) + 'px';
        this.canvas.style.height = (240 * scale) + 'px';
        this.scale = scale;
    }

    clear() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, 256, 240);
    }

    drawFight(fight, frame) {
        const ctx = this.ctx;
        const shake = fight.getShake();

        // Draw based on fight state
        switch (fight.state) {
            case FIGHT_STATES.INTRO:
                drawFightIntro(ctx, frame, fight.introPhase, fight.opponentData);
                break;

            case FIGHT_STATES.FIGHTING:
            case FIGHT_STATES.KNOCKDOWN_MAC:
            case FIGHT_STATES.KNOCKDOWN_OPP:
            case FIGHT_STATES.COUNT:
            case FIGHT_STATES.TKO:
            case FIGHT_STATES.DECISION:
                this.drawFightScene(fight, frame, shake);
                break;

            case FIGHT_STATES.BETWEEN_ROUNDS:
                drawBetweenRounds(ctx, frame, fight.round, fight.docAdvice, fight.mac);
                break;

            case FIGHT_STATES.WIN:
            case FIGHT_STATES.LOSE:
                // Result screen handled by main.js
                break;

            case FIGHT_STATES.PAUSED:
                this.drawFightScene(fight, frame, null); // No shake when paused
                drawPauseOverlay(ctx, frame);
                break;
        }
    }

    drawFightScene(fight, frame, shake) {
        const ctx = this.ctx;
        const mac = fight.mac;
        const opp = fight.opponent;

        // Draw ring
        drawRing(ctx, shake);

        // Draw referee (behind fighters)
        if (fight.state === FIGHT_STATES.COUNT) {
            drawRef(ctx, 200 + (shake ? shake.x : 0), 100 + (shake ? shake.y : 0),
                true, fight.countNumber);
        }

        // Draw opponent
        drawOpponent(ctx, opp.data, opp.state, frame, shake, opp.animData);

        // Draw Little Mac
        drawLittleMac(ctx, mac.state, frame, shake);

        // Draw hit effects
        for (const effect of fight.hitEffects) {
            drawHitFlash(ctx, effect.x + (shake ? shake.x : 0),
                effect.y + (shake ? shake.y : 0), effect.frame);
        }

        // Draw star sparkle effects
        for (const effect of fight.starEffects) {
            drawStarSparkle(ctx, effect.x + (shake ? shake.x : 0),
                effect.y + (shake ? shake.y : 0), effect.frame);
        }

        // Draw HUD (no shake on HUD)
        drawFightHUD(ctx, fight);

        // Draw count overlay
        if (fight.state === FIGHT_STATES.COUNT) {
            drawKnockdownCount(ctx, fight.countNumber, fight.countTarget);
        }

        // TKO/Decision announcement
        if (fight.state === FIGHT_STATES.TKO) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, 256, 240);
            drawBigTextCentered(ctx, fight.resultType + '!', 100, '#ff4444');
            if (fight.result === 'win') {
                drawTextCentered(ctx, 'LITTLE MAC WINS!', 120, '#ffffff');
            } else {
                drawTextCentered(ctx, fight.opponentData.name.toUpperCase() + ' WINS!', 120, '#ffffff');
            }
        }

        if (fight.state === FIGHT_STATES.DECISION) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, 256, 240);
            drawBigTextCentered(ctx, 'DECISION', 90, '#ffcc00');
            if (fight.result === 'win') {
                drawTextCentered(ctx, 'LITTLE MAC WINS!', 115, '#22cc22');
            } else {
                drawTextCentered(ctx, fight.opponentData.name.toUpperCase() + ' WINS!', 115, '#ff4444');
            }
        }
    }
}
