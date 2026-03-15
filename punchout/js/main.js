// main.js — Game loop and state management

import { initInput, isJustPressed, isDown, clearFrame, anyKeyJustPressed } from './input.js';
import { initAudio, resumeAudio, menuSelect, menuMove, bellRing, crowdCheer } from './audio.js';
import { OPPONENTS } from './opponents.js';
import { Fight, FIGHT_STATES } from './fight.js';
import { Career } from './career.js';
import { Renderer } from './renderer.js';
import {
    drawTitleScreen, drawFightCard, drawResultScreen,
    drawFightSelect, drawChampionScreen
} from './ui.js';

// ===== GAME STATES =====
const GAME_STATES = {
    TITLE: 'TITLE',
    FIGHT_SELECT: 'FIGHT_SELECT',
    FIGHT_CARD: 'FIGHT_CARD',
    FIGHTING: 'FIGHTING',
    RESULT: 'RESULT',
    CHAMPION: 'CHAMPION'
};

// ===== GAME CLASS =====
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.renderer = new Renderer(this.canvas);
        this.career = new Career();
        this.fight = null;

        this.state = GAME_STATES.TITLE;
        this.frame = 0;
        this.menuIndex = 0;
        this.selectIndex = 0;

        this.lastTime = 0;
        this.accumulator = 0;
        this.frameTime = 1000 / 60; // 60 FPS

        initInput();
        initAudio();

        // Start game loop
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.accumulator += dt;

        // Fixed timestep
        while (this.accumulator >= this.frameTime) {
            this.update();
            this.accumulator -= this.frameTime;
        }

        this.render();
        clearFrame();

        requestAnimationFrame(this.loop);
    }

    update() {
        this.frame++;
        resumeAudio(); // Resume audio context on user interaction

        switch (this.state) {
            case GAME_STATES.TITLE:
                this.updateTitle();
                break;
            case GAME_STATES.FIGHT_SELECT:
                this.updateFightSelect();
                break;
            case GAME_STATES.FIGHT_CARD:
                this.updateFightCard();
                break;
            case GAME_STATES.FIGHTING:
                this.updateFighting();
                break;
            case GAME_STATES.RESULT:
                this.updateResult();
                break;
            case GAME_STATES.CHAMPION:
                this.updateChampion();
                break;
        }
    }

    render() {
        const ctx = this.renderer.ctx;
        this.renderer.clear();

        switch (this.state) {
            case GAME_STATES.TITLE:
                drawTitleScreen(ctx, this.frame, this.menuIndex);
                break;
            case GAME_STATES.FIGHT_SELECT:
                drawFightSelect(ctx, this.frame, this.career, this.selectIndex);
                break;
            case GAME_STATES.FIGHT_CARD:
                drawFightCard(ctx, this.frame, this.career.getCurrentOpponent(), this.career);
                break;
            case GAME_STATES.FIGHTING:
                if (this.fight) {
                    this.renderer.drawFight(this.fight, this.frame);
                    // Handle win/lose states at the renderer level too
                    if (this.fight.state === FIGHT_STATES.WIN || this.fight.state === FIGHT_STATES.LOSE) {
                        drawResultScreen(ctx, this.frame, this.fight, this.career);
                    }
                }
                break;
            case GAME_STATES.RESULT:
                if (this.fight) {
                    drawResultScreen(ctx, this.frame, this.fight, this.career);
                }
                break;
            case GAME_STATES.CHAMPION:
                drawChampionScreen(ctx, this.frame);
                break;
        }
    }

    // ===== TITLE SCREEN =====
    updateTitle() {
        const hasSave = this.career.hasSave();

        if (isJustPressed('ArrowUp')) {
            this.menuIndex = (this.menuIndex - 1 + 3) % 3;
            menuMove();
        }
        if (isJustPressed('ArrowDown')) {
            this.menuIndex = (this.menuIndex + 1) % 3;
            menuMove();
        }

        if (isJustPressed('Enter') || isJustPressed('KeyZ') || isJustPressed('KeyX')) {
            menuSelect();
            switch (this.menuIndex) {
                case 0: // New Career
                    this.career.reset();
                    this.startFightCard();
                    break;
                case 1: // Continue
                    if (this.career.load()) {
                        this.startFightCard();
                    } else {
                        // No save, start new
                        this.career.reset();
                        this.startFightCard();
                    }
                    break;
                case 2: // Select Fight
                    this.state = GAME_STATES.FIGHT_SELECT;
                    this.selectIndex = this.career.currentOpponentIndex;
                    break;
            }
        }
    }

    // ===== FIGHT SELECT =====
    updateFightSelect() {
        if (isJustPressed('ArrowUp')) {
            this.selectIndex = (this.selectIndex - 1 + OPPONENTS.length) % OPPONENTS.length;
            menuMove();
        }
        if (isJustPressed('ArrowDown')) {
            this.selectIndex = (this.selectIndex + 1) % OPPONENTS.length;
            menuMove();
        }

        if (isJustPressed('Enter') || isJustPressed('KeyZ') || isJustPressed('KeyX')) {
            if (this.career.canSelectOpponent(this.selectIndex)) {
                this.career.selectOpponent(this.selectIndex);
                menuSelect();
                this.startFightCard();
            }
        }

        if (isJustPressed('Escape')) {
            this.state = GAME_STATES.TITLE;
        }
    }

    // ===== FIGHT CARD =====
    startFightCard() {
        this.state = GAME_STATES.FIGHT_CARD;
        this.frame = 0;
    }

    updateFightCard() {
        if (isJustPressed('Enter') || isJustPressed('KeyZ') || isJustPressed('KeyX')) {
            menuSelect();
            this.startFight();
        }
        if (isJustPressed('Escape')) {
            this.state = GAME_STATES.TITLE;
        }
    }

    // ===== FIGHTING =====
    startFight() {
        const oppData = this.career.getCurrentOpponent();
        this.fight = new Fight(oppData);
        this.fight.start();
        this.state = GAME_STATES.FIGHTING;
    }

    updateFighting() {
        if (!this.fight) return;

        this.fight.handleInput();
        this.fight.update();

        if (this.fight.isOver()) {
            // Transition to result
            if (this.fight.result === 'win') {
                this.career.recordWin(this.fight.resultType);
                this.career.save();
            } else {
                this.career.recordLoss();
                this.career.save();
            }
            this.state = GAME_STATES.RESULT;
            this.frame = 0;
        }
    }

    // ===== RESULT =====
    updateResult() {
        if (this.frame > 60 && (isJustPressed('Enter') || isJustPressed('KeyZ') || isJustPressed('KeyX'))) {
            menuSelect();

            if (this.fight && this.fight.result === 'win') {
                // Check if champion
                if (this.career.hasWonGame()) {
                    this.state = GAME_STATES.CHAMPION;
                    this.frame = 0;
                    crowdCheer();
                } else {
                    // Next fight
                    this.startFightCard();
                }
            } else {
                // Can retry or go back to title
                this.startFightCard(); // Retry same opponent
            }
        }
    }

    // ===== CHAMPION =====
    updateChampion() {
        if (this.frame > 60 && (isJustPressed('Enter') || isJustPressed('KeyZ') || isJustPressed('KeyX'))) {
            this.state = GAME_STATES.TITLE;
            this.menuIndex = 0;
        }
    }
}

// ===== ENTRY POINT =====
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
