// opponent.js — Opponent AI state machine

export const OPP_STATES = {
    IDLE: 'IDLE',
    TELEGRAPHING: 'TELEGRAPHING',
    ATTACKING: 'ATTACKING',
    RECOVERING: 'RECOVERING',
    HIT: 'HIT',
    STUNNED: 'STUNNED',
    KNOCKED_DOWN: 'KNOCKED_DOWN',
    GETTING_UP: 'GETTING_UP',
    GUARDING: 'GUARDING'
};

export class Opponent {
    constructor(data) {
        this.data = data;
        this.reset();
    }

    reset() {
        this.hp = this.data.hp;
        this.maxHp = this.data.hp;
        this.state = OPP_STATES.IDLE;
        this.stateTimer = 0;
        this.frame = 0;
        this.idleCountdown = this.randomIdleTime();
        this.currentPatternIndex = 0;
        this.currentPattern = null;
        this.knockdowns = 0;
        this.roundKnockdowns = 0;
        this.totalKnockdowns = 0;
        this.stunTimer = 0;
        this.hitTimer = 0;
        this.isVulnerable = false;
        this.guardTimer = 0;
        this.attackFrame = 0;
        this.telegraphFrame = 0;
        this.comboCount = 0;
        this.consecutiveHits = 0;
        this.patternCycleCount = 0;
        this.tysonPhase = 1; // For Tyson's first 90 seconds
        this.animData = { frame: 0, tellAnim: '', pattern: null };
    }

    newRound() {
        this.hp = this.maxHp;
        this.state = OPP_STATES.IDLE;
        this.stateTimer = 0;
        this.idleCountdown = this.randomIdleTime();
        this.roundKnockdowns = 0;
        this.currentPatternIndex = 0;
        this.isVulnerable = false;
        this.comboCount = 0;
    }

    randomIdleTime() {
        return this.data.idleMinFrames +
            Math.floor(Math.random() * (this.data.idleMaxFrames - this.data.idleMinFrames));
    }

    getActivePatterns() {
        let patterns = this.data.patterns;
        // Tyson phase 1: only instant KO uppercuts
        if (this.data.isTyson && this.tysonPhase === 1) {
            patterns = patterns.filter(p => p.firstPhaseOnly);
        } else if (this.data.isTyson && this.tysonPhase > 1) {
            patterns = patterns.filter(p => !p.firstPhaseOnly);
        }
        return patterns;
    }

    nextPattern() {
        const patterns = this.getActivePatterns();
        if (patterns.length === 0) return this.data.patterns[0];

        // Mix it up a bit
        if (Math.random() < 0.3) {
            return patterns[Math.floor(Math.random() * patterns.length)];
        }

        this.currentPatternIndex = (this.currentPatternIndex + 1) % patterns.length;
        return patterns[this.currentPatternIndex];
    }

    startAttack() {
        this.currentPattern = this.nextPattern();
        this.state = OPP_STATES.TELEGRAPHING;
        this.stateTimer = 0;
        this.telegraphFrame = 0;
        this.isVulnerable = false;
        this.animData = {
            frame: 0,
            tellAnim: this.currentPattern.tellAnim,
            pattern: this.currentPattern
        };
    }

    canBeHit() {
        // Can be hit in most states except when knocked down or getting up
        if (this.state === OPP_STATES.KNOCKED_DOWN) return false;
        if (this.state === OPP_STATES.GETTING_UP) return false;
        return true;
    }

    isRecovering() {
        return this.state === OPP_STATES.RECOVERING;
    }

    isStunned() {
        return this.state === OPP_STATES.STUNNED;
    }

    isAttacking() {
        return this.state === OPP_STATES.ATTACKING;
    }

    isTelegraphing() {
        return this.state === OPP_STATES.TELEGRAPHING;
    }

    isDown() {
        return this.state === OPP_STATES.KNOCKED_DOWN;
    }

    isGuarding() {
        return this.state === OPP_STATES.GUARDING;
    }

    takeHit(damage, isStarPunch = false, isCounter = false) {
        if (!this.canBeHit()) return 0;

        let actualDamage = damage;

        // More damage during recovery
        if (this.isRecovering()) {
            actualDamage = Math.floor(damage * 1.5);
        }

        // More damage when stunned
        if (this.isStunned()) {
            actualDamage = Math.floor(damage * 1.5);
        }

        // Star punch guaranteed stun
        if (isStarPunch) {
            actualDamage = Math.floor(damage * 2.5);
            if (this.state !== OPP_STATES.STUNNED) {
                this.stun();
            }
        }

        // Counter bonus
        if (isCounter) {
            actualDamage = Math.floor(actualDamage * (this.data.counterWindowBonus || 1.2));
        }

        // King Hippo special: only vulnerable when mouth is open or body after face hit
        if (this.data.isKingHippo) {
            if (this.state === OPP_STATES.IDLE || this.state === OPP_STATES.GUARDING) {
                return 0; // Can't hit King Hippo normally
            }
        }

        // Guarding reduces damage
        if (this.isGuarding() && !isStarPunch) {
            actualDamage = Math.floor(damage * 0.2);
            this.state = OPP_STATES.HIT;
            this.stateTimer = 0;
            this.hitTimer = 8;
            this.hp -= actualDamage;
            return actualDamage;
        }

        this.hp -= actualDamage;
        this.consecutiveHits++;

        if (this.hp <= 0) {
            this.hp = 0;
            this.knockDown();
        } else if (isStarPunch) {
            this.stun();
        } else {
            this.state = OPP_STATES.HIT;
            this.stateTimer = 0;
            this.hitTimer = 10;
        }

        this.animData.frame = 0;
        return actualDamage;
    }

    stun() {
        this.state = OPP_STATES.STUNNED;
        this.stateTimer = 0;
        this.stunTimer = 90; // Vulnerable for 90 frames
        this.animData = { frame: 0, tellAnim: '', pattern: null };
    }

    knockDown() {
        this.state = OPP_STATES.KNOCKED_DOWN;
        this.stateTimer = 0;
        this.knockdowns++;
        this.roundKnockdowns++;
        this.totalKnockdowns++;
        this.consecutiveHits = 0;
        this.animData = { frame: 0, tellAnim: '', pattern: null };
    }

    tryGetUp() {
        if (this.state !== OPP_STATES.KNOCKED_DOWN) return false;

        // King Hippo never gets up
        if (this.data.isKingHippo) return false;

        // Check get-up chance
        const chance = this.data.knockdownGetUpChance;
        const willGetUp = Math.random() < chance;

        if (willGetUp && this.knockdowns <= this.data.maxKnockdowns) {
            this.state = OPP_STATES.GETTING_UP;
            this.stateTimer = 0;
            this.hp = Math.floor(this.maxHp * (0.3 + Math.random() * 0.2));
            return true;
        }
        return false;
    }

    finishGettingUp() {
        this.state = OPP_STATES.IDLE;
        this.stateTimer = 0;
        this.idleCountdown = 60; // Brief pause after getting up
    }

    update(fightTimeFrames) {
        this.frame++;
        this.stateTimer++;

        // Update Tyson phase based on fight time
        if (this.data.isTyson) {
            // First 90 seconds (5400 frames) = phase 1 (instant KO uppercuts)
            if (fightTimeFrames < 5400) {
                this.tysonPhase = 1;
            } else {
                this.tysonPhase = 2;
            }
        }

        this.animData.frame = this.stateTimer;

        switch (this.state) {
            case OPP_STATES.IDLE:
                this.idleCountdown--;
                this.consecutiveHits = 0;

                // Occasionally guard
                if (Math.random() < 0.005 * this.data.defense) {
                    this.state = OPP_STATES.GUARDING;
                    this.guardTimer = 30 + Math.floor(Math.random() * 30);
                    this.stateTimer = 0;
                    break;
                }

                if (this.idleCountdown <= 0) {
                    this.startAttack();
                }
                break;

            case OPP_STATES.GUARDING:
                this.guardTimer--;
                if (this.guardTimer <= 0) {
                    this.state = OPP_STATES.IDLE;
                    this.stateTimer = 0;
                    this.idleCountdown = this.randomIdleTime();
                }
                break;

            case OPP_STATES.TELEGRAPHING:
                this.telegraphFrame++;
                if (this.currentPattern && this.telegraphFrame >= this.currentPattern.telegraph) {
                    this.state = OPP_STATES.ATTACKING;
                    this.stateTimer = 0;
                    this.attackFrame = 0;
                    this.animData.frame = 0;
                }
                break;

            case OPP_STATES.ATTACKING:
                this.attackFrame++;
                // Attack lasts about 8-12 frames
                const attackDuration = Math.max(6, 12 - (this.currentPattern ? this.currentPattern.speed : 5));
                if (this.attackFrame >= attackDuration) {
                    this.state = OPP_STATES.RECOVERING;
                    this.stateTimer = 0;
                    this.isVulnerable = true;
                    this.animData = { frame: 0, tellAnim: '', pattern: this.currentPattern };
                }
                break;

            case OPP_STATES.RECOVERING:
                if (this.currentPattern && this.stateTimer >= this.currentPattern.recovery) {
                    this.state = OPP_STATES.IDLE;
                    this.stateTimer = 0;
                    this.isVulnerable = false;
                    this.idleCountdown = this.randomIdleTime();
                    this.currentPattern = null;
                    this.patternCycleCount++;
                }
                break;

            case OPP_STATES.HIT:
                if (this.stateTimer >= this.hitTimer) {
                    this.state = OPP_STATES.IDLE;
                    this.stateTimer = 0;
                    this.idleCountdown = Math.floor(this.randomIdleTime() * 0.5);
                }
                break;

            case OPP_STATES.STUNNED:
                this.stunTimer--;
                if (this.stunTimer <= 0) {
                    this.state = OPP_STATES.IDLE;
                    this.stateTimer = 0;
                    this.idleCountdown = this.randomIdleTime();
                }
                break;

            case OPP_STATES.KNOCKED_DOWN:
                // Managed by fight.js (count system)
                break;

            case OPP_STATES.GETTING_UP:
                if (this.stateTimer >= 40) {
                    this.finishGettingUp();
                }
                break;
        }
    }
}
