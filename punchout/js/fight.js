// fight.js — Fight / match state management

import { LittleMac, MAC_STATES } from './littlemac.js';
import { Opponent, OPP_STATES } from './opponent.js';
import { isDown, isJustPressed, mashCount } from './input.js';
import * as Audio from './audio.js';

export const FIGHT_STATES = {
    INTRO: 'INTRO',
    FIGHTING: 'FIGHTING',
    KNOCKDOWN_MAC: 'KNOCKDOWN_MAC',
    KNOCKDOWN_OPP: 'KNOCKDOWN_OPP',
    COUNT: 'COUNT',
    BETWEEN_ROUNDS: 'BETWEEN_ROUNDS',
    TKO: 'TKO',
    DECISION: 'DECISION',
    WIN: 'WIN',
    LOSE: 'LOSE',
    PAUSED: 'PAUSED'
};

export class Fight {
    constructor(opponentData) {
        this.opponentData = opponentData;
        this.mac = new LittleMac();
        this.opponent = new Opponent(opponentData);
        this.reset();
    }

    reset() {
        this.mac.reset();
        this.opponent.reset();
        this.state = FIGHT_STATES.INTRO;
        this.stateTimer = 0;
        this.round = 1;
        this.maxRounds = 3;
        this.roundTimeFrames = 0;
        this.roundMaxFrames = 3 * 60 * 60; // 3 minutes at 60fps
        this.fightTimeFrames = 0;

        this.countNumber = 0;
        this.countTimer = 0;
        this.countTarget = null; // 'mac' or 'opp'
        this.bellRung = false;

        // Hit effects
        this.hitEffects = [];
        this.starEffects = [];
        this.screenShake = null;

        // Messages
        this.message = '';
        this.messageTimer = 0;

        // For tracking counter-punch timing
        this.counterWindow = false;
        this.counterTimer = 0;

        // Between rounds
        this.betweenRoundsTimer = 0;
        this.docAdvice = '';

        // Result
        this.result = null; // 'win' | 'lose'
        this.resultType = ''; // 'TKO' | 'KO' | 'Decision'

        // Pre-fight pause state
        this.prePauseState = null;

        // TKO delay
        this.pendingTKO = null;
        this.tkoDelay = 0;
        this.oppGettingUpDelay = 0;

        // Intro tracking
        this.introPhase = 0;
    }

    start() {
        this.state = FIGHT_STATES.INTRO;
        this.stateTimer = 0;
        this.introPhase = 0;
    }

    pause() {
        if (this.state !== FIGHT_STATES.PAUSED && this.state !== FIGHT_STATES.WIN && this.state !== FIGHT_STATES.LOSE) {
            this.prePauseState = this.state;
            this.state = FIGHT_STATES.PAUSED;
        }
    }

    unpause() {
        if (this.state === FIGHT_STATES.PAUSED && this.prePauseState) {
            this.state = this.prePauseState;
            this.prePauseState = null;
        }
    }

    addHitEffect(x, y) {
        this.hitEffects.push({ x, y, frame: 0 });
    }

    addStarEffect(x, y) {
        this.starEffects.push({ x, y, frame: 0 });
    }

    shakeScreen(intensity, duration) {
        this.screenShake = { intensity, duration, frame: 0 };
    }

    showMessage(msg, duration = 90) {
        this.message = msg;
        this.messageTimer = duration;
    }

    getShake() {
        if (!this.screenShake) return null;
        const s = this.screenShake;
        const t = 1 - s.frame / s.duration;
        return {
            x: Math.sin(s.frame * 1.5) * s.intensity * t,
            y: Math.cos(s.frame * 2.1) * s.intensity * t * 0.5
        };
    }

    // Check if Mac's punch connects
    checkMacPunch() {
        const mac = this.mac;
        const opp = this.opponent;

        if (!mac.isPunching()) return;
        if (mac.stateTimer !== 3) return; // Connect on frame 3 of punch

        // Use a heart for each punch attempt
        mac.consumeHeart();

        if (!opp.canBeHit()) {
            Audio.punchMiss();
            return;
        }

        // Determine damage
        let baseDamage = 8;
        let isStarPunch = mac.state === MAC_STATES.STAR_PUNCH;
        let isCounter = false;

        if (isStarPunch) {
            baseDamage = 30;
        } else if (mac.punchHigh) {
            baseDamage = 10;
        }

        // Check if this is a counter-punch (opponent is recovering or telegraphing)
        if (opp.isRecovering() || (opp.isTelegraphing() && opp.stateTimer > opp.currentPattern.telegraph * 0.6)) {
            isCounter = true;
        }

        // If opponent is guarding and not star punch, reduced damage
        const actualDamage = opp.takeHit(baseDamage, isStarPunch, isCounter);

        if (actualDamage > 0) {
            Audio.punchHit();
            this.addHitEffect(128, 80);

            // Screen shake for big hits
            if (isStarPunch || actualDamage > 20) {
                this.shakeScreen(4, 12);
            } else {
                this.shakeScreen(1, 6);
            }

            // Earn star for well-timed counter
            if (isCounter && !isStarPunch) {
                if (mac.earnStar()) {
                    Audio.starEarned();
                    this.addStarEffect(128, 80);
                }
            }

            // Check for knockdown
            if (opp.hp <= 0) {
                this.startKnockdown('opp');
            }
        } else {
            Audio.punchMiss();
            // Extra heart cost for missing
            mac.consumeHeart();
        }
    }

    // Check if opponent's punch connects
    checkOppPunch() {
        const mac = this.mac;
        const opp = this.opponent;

        if (!opp.isAttacking()) return;
        if (opp.attackFrame !== 3) return; // Connect on frame 3

        const pattern = opp.currentPattern;
        if (!pattern) return;

        // Check if Mac dodged correctly
        const dodgeDir = pattern.dodgeDirection;
        let dodged = false;

        if (dodgeDir === 'left' && mac.isDodgingLeft()) dodged = true;
        if (dodgeDir === 'right' && mac.isDodgingRight()) dodged = true;
        if (dodgeDir === 'duck' && mac.isDucking()) dodged = true;
        if (dodgeDir === 'counter') {
            // Must counter-punch to avoid (like Bull Charge)
            if (mac.isPunching() && mac.stateTimer <= 4) {
                dodged = true;
                // Counter the charge!
                const damage = opp.takeHit(25, false, true);
                if (damage > 0) {
                    Audio.punchHit();
                    this.addHitEffect(128, 80);
                    this.shakeScreen(5, 15);
                    if (mac.earnStar()) {
                        Audio.starEarned();
                        this.addStarEffect(128, 80);
                    }
                }
                return;
            }
        }

        // Also dodged if ducking any high attack (jab, hook)
        if (!dodged && mac.isDucking() && (pattern.type === 'jab' || pattern.type === 'hook')) {
            dodged = true;
        }

        // Also dodged if dodging in any direction (gives partial credit)
        if (!dodged && (mac.isDodgingLeft() || mac.isDodgingRight()) && pattern.type !== 'special') {
            dodged = true;
        }

        if (dodged) {
            Audio.dodge();
            // Counter window opens
            this.counterWindow = true;
            this.counterTimer = 15;
            return;
        }

        // Mac got hit
        if (mac.isBlocking()) {
            Audio.block();
            mac.takeHit(pattern.damage);
            this.shakeScreen(1, 4);
        } else if (mac.isVulnerable()) {
            Audio.punchHit();
            mac.takeHit(pattern.damage);
            this.shakeScreen(2, 8);
            this.addHitEffect(128, 170);

            // Check for knockdown
            if (mac.hp <= 0) {
                this.startKnockdown('mac');
            }
        }
    }

    startKnockdown(target) {
        Audio.knockdown();
        this.shakeScreen(6, 20);
        this.tkoDelay = 0;
        this.pendingTKO = null;

        if (target === 'mac') {
            this.mac.knockDown();
            this.state = FIGHT_STATES.KNOCKDOWN_MAC;
            this.stateTimer = 0;
            this.countNumber = 0;
            this.countTimer = 0;
            this.countTarget = 'mac';

            // Check for TKO (3 knockdowns in round or total)
            if (this.mac.roundKnockdowns >= 3 || this.mac.totalKnockdowns >= 3) {
                this.pendingTKO = 'lose';
                this.tkoDelay = 60; // 1 second at 60fps
                return;
            }
        } else {
            this.opponent.knockDown();
            this.state = FIGHT_STATES.KNOCKDOWN_OPP;
            this.stateTimer = 0;
            this.countNumber = 0;
            this.countTimer = 0;
            this.countTarget = 'opp';

            // Check for TKO
            if (this.opponent.roundKnockdowns >= 3 || this.opponent.totalKnockdowns >= 3) {
                this.pendingTKO = 'win';
                this.tkoDelay = 60;
                return;
            }
        }
    }

    updateCount() {
        // Handle opponent getting up delay
        if (this.oppGettingUpDelay > 0) {
            this.oppGettingUpDelay--;
            if (this.oppGettingUpDelay <= 0) {
                this.resumeFight();
                return;
            }
            return;
        }

        this.countTimer++;

        // Count every 60 frames (1 second)
        if (this.countTimer >= 60) {
            this.countTimer = 0;
            this.countNumber++;
            Audio.countSound();

            if (this.countNumber >= 10) {
                // KO!
                if (this.countTarget === 'mac') {
                    this.state = FIGHT_STATES.LOSE;
                    this.result = 'lose';
                    this.resultType = 'KO';
                    Audio.ko();
                    Audio.crowdBoo();
                } else {
                    this.state = FIGHT_STATES.WIN;
                    this.result = 'win';
                    this.resultType = 'KO';
                    Audio.ko();
                    Audio.crowdCheer();
                }
                return;
            }

            // Try to get up
            if (this.countTarget === 'mac') {
                if (this.countNumber >= 3) {
                    if (this.mac.tryGetUp(this.countNumber)) {
                        Audio.getUp();
                        this.resumeFight();
                        return;
                    }
                }
            } else {
                if (this.countNumber >= 3) {
                    if (this.opponent.tryGetUp()) {
                        Audio.getUp();
                        // Pause briefly then resume
                        this.oppGettingUpDelay = 30; // Brief pause
                        return;
                    }
                }
            }
        }

        // Mac button mashing to get up faster
        if (this.countTarget === 'mac') {
            const mash = mashCount();
            if (mash > 0) {
                this.mac.addMash(mash * 0.5);
                if (this.mac.mashProgress >= 8 && this.countNumber >= 2) {
                    if (this.mac.tryGetUp(this.countNumber)) {
                        Audio.getUp();
                        this.resumeFight();
                    }
                }
            }
        }
    }

    resumeFight() {
        this.state = FIGHT_STATES.FIGHTING;
        this.stateTimer = 0;
        this.countTarget = null;
    }

    endRound() {
        Audio.bellRing();

        if (this.round >= this.maxRounds) {
            // Decision
            this.state = FIGHT_STATES.DECISION;
            if (this.mac.hp > this.opponent.hp) {
                this.result = 'win';
                this.resultType = 'Decision';
                Audio.crowdCheer();
            } else {
                this.result = 'lose';
                this.resultType = 'Decision';
                Audio.crowdBoo();
            }
        } else {
            this.state = FIGHT_STATES.BETWEEN_ROUNDS;
            this.stateTimer = 0;
            this.betweenRoundsTimer = 0;
            this.docAdvice = this.opponentData.advice || "Keep punching, Mac!";
        }
    }

    startNextRound() {
        this.round++;
        this.roundTimeFrames = 0;
        this.mac.newRound();
        this.opponent.newRound();
        this.state = FIGHT_STATES.FIGHTING;
        this.stateTimer = 0;
        this.bellRung = false;
        Audio.bellRing();
        this.showMessage('ROUND ' + this.round, 90);
    }

    handleInput() {
        const mac = this.mac;

        if (this.state === FIGHT_STATES.PAUSED) {
            if (isJustPressed('Escape') || isJustPressed('Enter')) {
                this.unpause();
            }
            return;
        }

        if (isJustPressed('Escape')) {
            this.pause();
            return;
        }

        if (this.state !== FIGHT_STATES.FIGHTING) return;

        // Blocking (hold down)
        if (isDown('ArrowDown') && !isDown('ArrowLeft') && !isDown('ArrowRight') && !isDown('ArrowUp')) {
            if (mac.canAct()) {
                mac.startBlock();
            }
        } else if (mac.isBlocking() && !isDown('ArrowDown')) {
            mac.stopBlock();
        }

        // Dodge left
        if (isJustPressed('ArrowLeft')) {
            if (mac.dodgeLeft()) {
                Audio.dodge();
            }
        }

        // Dodge right
        if (isJustPressed('ArrowRight')) {
            if (mac.dodgeRight()) {
                Audio.dodge();
            }
        }

        // Duck
        if (isJustPressed('ArrowDown') && (isDown('ArrowLeft') || isDown('ArrowRight'))) {
            // Down + direction = still dodge
        } else if (isJustPressed('ArrowDown')) {
            if (mac.duck()) {
                Audio.dodge();
            }
        }

        // Star punch (Up arrow)
        if (isJustPressed('ArrowUp') && mac.stars > 0 && !isDown('KeyZ') && !isDown('KeyX')) {
            if (mac.starPunch()) {
                Audio.punch();
            }
        }

        // Left punch (Z)
        if (isJustPressed('KeyZ')) {
            const high = isDown('ArrowUp');
            if (mac.punchLeft(high)) {
                Audio.punch();
            }
        }

        // Right punch (X)
        if (isJustPressed('KeyX')) {
            const high = isDown('ArrowUp');
            if (mac.punchRight(high)) {
                Audio.punch();
            }
        }
    }

    update() {
        this.stateTimer++;

        // Update effects
        this.hitEffects = this.hitEffects.filter(e => {
            e.frame++;
            return e.frame < 15;
        });
        this.starEffects = this.starEffects.filter(e => {
            e.frame++;
            return e.frame < 30;
        });
        if (this.screenShake) {
            this.screenShake.frame++;
            if (this.screenShake.frame >= this.screenShake.duration) {
                this.screenShake = null;
            }
        }
        if (this.messageTimer > 0) {
            this.messageTimer--;
        }

        // Counter window
        if (this.counterWindow) {
            this.counterTimer--;
            if (this.counterTimer <= 0) {
                this.counterWindow = false;
            }
        }

        switch (this.state) {
            case FIGHT_STATES.INTRO:
                if (this.stateTimer === 1) {
                    this.introPhase = 0;
                }
                if (this.stateTimer === 60) {
                    this.introPhase = 1;
                    Audio.roundAnnounce();
                }
                if (this.stateTimer === 120) {
                    this.introPhase = 2;
                }
                if (this.stateTimer === 180) {
                    Audio.bellRing();
                    this.state = FIGHT_STATES.FIGHTING;
                    this.stateTimer = 0;
                    this.showMessage('FIGHT!', 60);
                }
                break;

            case FIGHT_STATES.FIGHTING:
                this.roundTimeFrames++;
                this.fightTimeFrames++;

                this.mac.update();
                this.opponent.update(this.fightTimeFrames);

                // Check punches
                this.checkMacPunch();
                this.checkOppPunch();

                // Round timer
                if (this.roundTimeFrames >= this.roundMaxFrames) {
                    this.endRound();
                }

                // Check if either fighter is down
                if (this.mac.isDown() && this.state === FIGHT_STATES.FIGHTING) {
                    this.startKnockdown('mac');
                }
                if (this.opponent.isDown() && this.state === FIGHT_STATES.FIGHTING) {
                    this.startKnockdown('opp');
                }
                break;

            case FIGHT_STATES.KNOCKDOWN_MAC:
            case FIGHT_STATES.KNOCKDOWN_OPP:
                // Check for pending TKO
                if (this.pendingTKO) {
                    if (this.tkoDelay > 0) {
                        this.tkoDelay--;
                    } else {
                        this.state = FIGHT_STATES.TKO;
                        this.stateTimer = 0;
                        this.result = this.pendingTKO;
                        this.resultType = 'TKO';
                        Audio.ko();
                        if (this.pendingTKO === 'win') {
                            Audio.crowdCheer();
                        }
                        this.pendingTKO = null;
                    }
                    break;
                }
                // Wait a moment then start count
                if (this.stateTimer >= 60) {
                    this.state = FIGHT_STATES.COUNT;
                    this.stateTimer = 0;
                }
                break;

            case FIGHT_STATES.COUNT:
                this.updateCount();
                break;

            case FIGHT_STATES.BETWEEN_ROUNDS:
                this.betweenRoundsTimer++;
                if (this.betweenRoundsTimer >= 300 || isJustPressed('Enter') || isJustPressed('KeyZ') || isJustPressed('KeyX')) {
                    this.startNextRound();
                }
                break;

            case FIGHT_STATES.TKO:
            case FIGHT_STATES.DECISION:
                if (this.stateTimer >= 120) {
                    if (this.result === 'win') {
                        this.state = FIGHT_STATES.WIN;
                    } else {
                        this.state = FIGHT_STATES.LOSE;
                    }
                    this.stateTimer = 0;
                }
                break;

            case FIGHT_STATES.WIN:
            case FIGHT_STATES.LOSE:
                // Handled by career.js
                break;

            case FIGHT_STATES.PAUSED:
                break;
        }
    }

    getRoundTimeString() {
        const remaining = Math.max(0, this.roundMaxFrames - this.roundTimeFrames);
        const totalSeconds = Math.ceil(remaining / 60);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    isOver() {
        return this.state === FIGHT_STATES.WIN || this.state === FIGHT_STATES.LOSE;
    }
}
