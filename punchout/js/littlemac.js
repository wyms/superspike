// littlemac.js — Player character

export const MAC_STATES = {
    IDLE: 'IDLE',
    PUNCHING_LEFT: 'PUNCHING_LEFT',
    PUNCHING_RIGHT: 'PUNCHING_RIGHT',
    DODGING_LEFT: 'DODGING_LEFT',
    DODGING_RIGHT: 'DODGING_RIGHT',
    DUCKING: 'DUCKING',
    BLOCKING: 'BLOCKING',
    STAR_PUNCH: 'STAR_PUNCH',
    HIT: 'HIT',
    KNOCKED_DOWN: 'KNOCKED_DOWN',
    GETTING_UP: 'GETTING_UP'
};

// Duration in frames for each state before returning to IDLE
const STATE_DURATION = {
    IDLE: Infinity,
    PUNCHING_LEFT: 10,
    PUNCHING_RIGHT: 10,
    DODGING_LEFT: 14,
    DODGING_RIGHT: 14,
    DUCKING: 8,
    BLOCKING: -1, // Held
    STAR_PUNCH: 18,
    HIT: 12,
    KNOCKED_DOWN: 600, // 10 seconds
    GETTING_UP: 30
};

export class LittleMac {
    constructor() {
        this.reset();
    }

    reset() {
        this.hp = 96;
        this.maxHp = 96;
        this.stars = 0;
        this.state = MAC_STATES.IDLE;
        this.stateTimer = 0;
        this.hearts = 20; // Stamina
        this.maxHearts = 20;
        this.heartRegenTimer = 0;
        this.knockdowns = 0;
        this.totalKnockdowns = 0;
        this.roundKnockdowns = 0;
        this.mashProgress = 0;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.punchHigh = false; // Is punching at face level
        this.lastPunchFrame = 0;
        this.frame = 0;
    }

    newRound() {
        this.hp = this.maxHp;
        this.hearts = this.maxHearts;
        this.state = MAC_STATES.IDLE;
        this.stateTimer = 0;
        this.roundKnockdowns = 0;
        this.mashProgress = 0;
    }

    canAct() {
        return this.state === MAC_STATES.IDLE;
    }

    isVulnerable() {
        if (this.isInvincible) return false;
        if (this.state === MAC_STATES.DODGING_LEFT || this.state === MAC_STATES.DODGING_RIGHT) return false;
        if (this.state === MAC_STATES.DUCKING) return false; // Duck avoids high attacks
        return this.state !== MAC_STATES.KNOCKED_DOWN && this.state !== MAC_STATES.GETTING_UP;
    }

    isDucking() {
        return this.state === MAC_STATES.DUCKING;
    }

    isDodgingLeft() {
        return this.state === MAC_STATES.DODGING_LEFT;
    }

    isDodgingRight() {
        return this.state === MAC_STATES.DODGING_RIGHT;
    }

    isBlocking() {
        return this.state === MAC_STATES.BLOCKING;
    }

    isPunching() {
        return this.state === MAC_STATES.PUNCHING_LEFT ||
               this.state === MAC_STATES.PUNCHING_RIGHT ||
               this.state === MAC_STATES.STAR_PUNCH;
    }

    isDown() {
        return this.state === MAC_STATES.KNOCKED_DOWN;
    }

    isGettingUp() {
        return this.state === MAC_STATES.GETTING_UP;
    }

    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
    }

    punchLeft(high) {
        if (!this.canAct()) return false;
        if (this.hearts <= 0) return false;
        this.setState(MAC_STATES.PUNCHING_LEFT);
        this.punchHigh = high;
        this.lastPunchFrame = this.frame;
        return true;
    }

    punchRight(high) {
        if (!this.canAct()) return false;
        if (this.hearts <= 0) return false;
        this.setState(MAC_STATES.PUNCHING_RIGHT);
        this.punchHigh = high;
        this.lastPunchFrame = this.frame;
        return true;
    }

    starPunch() {
        if (!this.canAct()) return false;
        if (this.stars <= 0) return false;
        this.stars--;
        this.setState(MAC_STATES.STAR_PUNCH);
        this.punchHigh = true;
        this.lastPunchFrame = this.frame;
        return true;
    }

    dodgeLeft() {
        if (!this.canAct()) return false;
        this.setState(MAC_STATES.DODGING_LEFT);
        this.isInvincible = true;
        this.invincibleTimer = 10;
        return true;
    }

    dodgeRight() {
        if (!this.canAct()) return false;
        this.setState(MAC_STATES.DODGING_RIGHT);
        this.isInvincible = true;
        this.invincibleTimer = 10;
        return true;
    }

    duck() {
        if (!this.canAct()) return false;
        this.setState(MAC_STATES.DUCKING);
        this.isInvincible = true;
        this.invincibleTimer = 10;
        return true;
    }

    startBlock() {
        if (!this.canAct()) return false;
        this.setState(MAC_STATES.BLOCKING);
        return true;
    }

    stopBlock() {
        if (this.state === MAC_STATES.BLOCKING) {
            this.setState(MAC_STATES.IDLE);
        }
    }

    takeHit(damage) {
        if (this.state === MAC_STATES.KNOCKED_DOWN || this.state === MAC_STATES.GETTING_UP) return;

        let actualDamage = damage;
        if (this.isBlocking()) {
            actualDamage = Math.ceil(damage * 0.25);
            this.hearts = Math.max(0, this.hearts - 2);
        }

        this.hp -= actualDamage;

        if (this.hp <= 0) {
            this.hp = 0;
            this.knockDown();
        } else if (!this.isBlocking()) {
            this.setState(MAC_STATES.HIT);
        }
    }

    knockDown() {
        this.setState(MAC_STATES.KNOCKED_DOWN);
        this.knockdowns++;
        this.roundKnockdowns++;
        this.totalKnockdowns++;
        this.mashProgress = 0;
        this.stars = 0; // Lose stars on knockdown
    }

    addMash(amount) {
        if (this.state !== MAC_STATES.KNOCKED_DOWN) return;
        this.mashProgress += amount;
    }

    tryGetUp(countFrame) {
        // Can get up if mash progress is enough or count hasn't reached 10
        if (this.state !== MAC_STATES.KNOCKED_DOWN) return false;
        if (this.mashProgress >= 10 || countFrame >= 4) {
            // Get up with partial HP
            this.setState(MAC_STATES.GETTING_UP);
            this.hp = Math.max(24, Math.floor(this.maxHp * 0.25));
            this.hearts = Math.floor(this.maxHearts * 0.5);
            return true;
        }
        return false;
    }

    earnStar() {
        if (this.stars < 3) {
            this.stars++;
            return true;
        }
        return false;
    }

    consumeHeart() {
        if (this.hearts > 0) {
            this.hearts--;
            return true;
        }
        return false;
    }

    update() {
        this.frame++;
        this.stateTimer++;

        // Invincibility timer
        if (this.isInvincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }

        // Heart regen when idle
        if (this.state === MAC_STATES.IDLE) {
            this.heartRegenTimer++;
            if (this.heartRegenTimer >= 30) { // Every 0.5 seconds
                this.heartRegenTimer = 0;
                if (this.hearts < this.maxHearts) {
                    this.hearts++;
                }
            }
        } else {
            this.heartRegenTimer = 0;
        }

        // State transitions
        const duration = STATE_DURATION[this.state];
        if (duration > 0 && duration !== Infinity && this.stateTimer >= duration) {
            if (this.state === MAC_STATES.GETTING_UP) {
                this.setState(MAC_STATES.IDLE);
            } else if (this.state !== MAC_STATES.KNOCKED_DOWN) {
                this.setState(MAC_STATES.IDLE);
            }
        }
    }
}
