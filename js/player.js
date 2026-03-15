// player.js — Player entity with state machine
// Adapted for horizontal net. Side 0 = near (bottom), Side 1 = far (top).
// Players face UP (toward net) by default on near side, DOWN on far side.

import { COURT } from './court.js';

export const PLAYER_STATES = {
    IDLE: 'idle',
    RUNNING: 'running',
    JUMPING: 'jumping',
    BUMPING: 'bumping',
    SETTING: 'setting',
    SPIKING: 'spiking',
    DIVING: 'diving',
    BLOCKING: 'blocking',
    SERVING: 'serving',
    CELEBRATING: 'celebrating',
    DEFEATED: 'defeated'
};

const STATE_DURATIONS = {
    idle: Infinity,
    running: Infinity,
    jumping: 30,
    bumping: 15,
    setting: 15,
    spiking: 18,
    diving: 30,
    blocking: 24,
    serving: 20,
    celebrating: Infinity,
    defeated: Infinity
};

export class Player {
    constructor(teamIndex, playerIndex, side, isHuman, stats) {
        this.teamIndex = teamIndex;
        this.playerIndex = playerIndex;
        this.side = side;           // 0 = near (bottom), 1 = far (top)
        this.isHuman = isHuman;
        this.stats = stats || { speed: 5, power: 5, technique: 5, defense: 5 };

        // Position on court
        this.x = 0;
        this.y = 0;
        this.z = 0;                 // height above ground
        this.vz = 0;                // vertical velocity

        // State
        this.state = PLAYER_STATES.IDLE;
        this.stateTimer = 0;
        this.animFrame = 0;
        // Near side players face up (toward net), far side face down
        this.facingRight = true;
        this.facingUp = side === 0;  // near side looks up

        // Width/height for collision (sprite bounds)
        this.width = 12;
        this.height = 18;

        // Dive velocity
        this.diveVx = 0;
        this.diveVy = 0;

        // Hit tracking
        this.justHitBall = false;
        this.hitCooldown = 0;

        // Team appearance (set externally)
        this.color1 = '#3355DD';
        this.color2 = '#DD3333';
        this.skin = '#FFCC88';
        this.hairColor = '#442200';
        this.hairStyle = 'short';

        // Power meter for special spikes (0-100)
        this.powerMeter = 0;

        // Visual indicator
        this.indicator = null; // 'ready', 'target', or null
        this.indicatorTimer = 0;
    }

    get speed() {
        return 1.0 + (this.stats.speed * 0.12);
    }

    get screenX() {
        return this.x;
    }

    get screenY() {
        return this.y - this.z * 0.7;
    }

    setDefaultPosition(side, isServer, playerIdx) {
        if (side === 0) {
            // Near side (bottom half, y > 140)
            if (isServer) {
                this.x = 110;
                this.y = 200;
            } else if (playerIdx === 0) {
                this.x = 90;
                this.y = 170;
            } else {
                this.x = 150;
                this.y = 175;
            }
        } else {
            // Far side (top half, y < 140)
            if (isServer) {
                this.x = 146;
                this.y = 90;
            } else if (playerIdx === 0) {
                this.x = 110;
                this.y = 108;
            } else {
                this.x = 160;
                this.y = 112;
            }
        }
        this.z = 0;
        this.vz = 0;
        this.state = PLAYER_STATES.IDLE;
        this.stateTimer = 0;
        this.facingUp = side === 0;
        this.facingRight = true;
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.animFrame = 0;
    }

    isActionable() {
        return this.state === PLAYER_STATES.IDLE ||
               this.state === PLAYER_STATES.RUNNING;
    }

    isInAir() {
        return this.z > 0 || this.state === PLAYER_STATES.JUMPING ||
               this.state === PLAYER_STATES.SPIKING ||
               this.state === PLAYER_STATES.BLOCKING;
    }

    movement(dx, dy) {
        if (!this.isActionable() && this.state !== PLAYER_STATES.JUMPING &&
            this.state !== PLAYER_STATES.SPIKING) return;

        let spd = this.speed;
        if (this.isInAir()) {
            spd *= 0.3;
        }

        if (this.state === PLAYER_STATES.DIVING) return;

        let newX = this.x + dx * spd;
        let newY = this.y + dy * spd;

        // Boundary constraints - can't cross the net
        newX = Math.max(COURT.LEFT + 2, Math.min(COURT.RIGHT - 14, newX));
        if (this.side === 0) {
            // Near side: stay below net
            newY = Math.max(COURT.NET_Y + 2, Math.min(COURT.BOTTOM - 4, newY));
        } else {
            // Far side: stay above net
            newY = Math.max(COURT.TOP + 2, Math.min(COURT.NET_Y - 2, newY));
        }

        this.x = newX;
        this.y = newY;

        // Update facing direction
        if (dx !== 0) {
            this.facingRight = dx > 0;
        }

        // Update state
        if (dx !== 0 || dy !== 0) {
            if (this.state === PLAYER_STATES.IDLE) {
                this.setState(PLAYER_STATES.RUNNING);
            }
        } else {
            if (this.state === PLAYER_STATES.RUNNING) {
                this.setState(PLAYER_STATES.IDLE);
            }
        }
    }

    jump() {
        if (!this.isActionable()) return;
        this.setState(PLAYER_STATES.JUMPING);
        this.vz = 3.5;
    }

    spike(ball) {
        if (this.state !== PLAYER_STATES.JUMPING && !this.isActionable()) return;
        this.setState(PLAYER_STATES.SPIKING);

        const power = this.stats.power;
        const technique = this.stats.technique;
        const isPower = this.powerMeter >= 100;

        // Spike goes OVER the net toward opponent's side
        // Side 0 spikes upward (vy < 0), side 1 spikes downward (vy > 0)
        if (this.side === 0) {
            ball.vy = -(2.5 + power * 0.25);
        } else {
            ball.vy = (2.5 + power * 0.25);
        }

        // Slight x spread based on technique
        ball.vx = (Math.random() - 0.5) * (2 - technique * 0.12);
        // Ball slams down hard
        ball.vz = -2.5 - power * 0.15;

        if (isPower) {
            // Power spike: faster, screen flash, trail
            ball.vy *= 1.4;
            ball.vz *= 1.3;
            ball.isPowerSpike = true;
            ball.spikeTrail = true;
            ball.screenFlash = 3;
            this.powerMeter = 0;
        } else {
            ball.spikeTrail = true;
            ball.screenFlash = 2;
        }

        ball.active = true;
        ball.lastTeam = this.side;
        ball.hitCooldown = 10;

        this.justHitBall = true;
        this.hitCooldown = 10;
    }

    bump(ball, partnerX, partnerY) {
        if (!this.isActionable() && this.state !== PLAYER_STATES.DIVING) return;
        this.setState(PLAYER_STATES.BUMPING);

        // Pop ball up toward partner
        const dx = partnerX - ball.x;
        const dy = partnerY - ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        ball.vx = (dx / dist) * 1.0;
        ball.vy = (dy / dist) * 0.8;
        ball.vz = 3.5;  // high pop
        ball.active = true;
        ball.lastTeam = this.side;
        ball.hitCooldown = 8;
        ball.spikeTrail = false;
        ball.isPowerSpike = false;

        this.justHitBall = true;
        this.hitCooldown = 10;

        // Build power meter on successful receives
        this.powerMeter = Math.min(100, this.powerMeter + 15);
    }

    set(ball) {
        if (!this.isActionable() && this.state !== PLAYER_STATES.JUMPING) return;
        this.setState(PLAYER_STATES.SETTING);

        // Loft ball high near the net for spiking
        let targetX = this.x + (this.facingRight ? 15 : -15);
        let targetY;
        if (this.side === 0) {
            targetY = COURT.NET_Y + 8;  // just past the net on our side
        } else {
            targetY = COURT.NET_Y - 8;
        }

        const dx = targetX - ball.x;
        const dy = targetY - ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        ball.vx = (dx / dist) * 1.2;
        ball.vy = (dy / dist) * 0.6;
        ball.vz = 4.0;  // high loft
        ball.active = true;
        ball.lastTeam = this.side;
        ball.hitCooldown = 8;
        ball.spikeTrail = false;
        ball.isPowerSpike = false;

        this.justHitBall = true;
        this.hitCooldown = 10;

        // Build power meter on sets
        this.powerMeter = Math.min(100, this.powerMeter + 10);
    }

    dive() {
        if (!this.isActionable()) return;
        this.setState(PLAYER_STATES.DIVING);

        // Lunge in facing direction
        this.diveVx = this.facingRight ? 2.8 : -2.8;
        // Also dive toward net or ball direction
        this.diveVy = this.side === 0 ? -1.5 : 1.5;
    }

    block() {
        if (!this.isActionable()) return;
        this.setState(PLAYER_STATES.BLOCKING);
        this.vz = 3.0;
    }

    serve(ball) {
        this.setState(PLAYER_STATES.SERVING);

        const power = this.stats.power;
        // Serve goes toward opponent's side
        if (this.side === 0) {
            ball.vy = -(1.5 + power * 0.12);
        } else {
            ball.vy = (1.5 + power * 0.12);
        }
        ball.vx = (Math.random() - 0.5) * 0.8;
        ball.vz = 2.0;
        ball.active = true;
        ball.landed = false;
        ball.lastTeam = this.side;
        ball.touchCount = 0;
        ball.hitCooldown = 15;
        ball.spikeTrail = false;
        ball.isPowerSpike = false;

        this.justHitBall = true;
        this.hitCooldown = 15;
    }

    update() {
        this.stateTimer++;
        this.animFrame += 0.12;

        // Hit cooldown
        if (this.hitCooldown > 0) {
            this.hitCooldown--;
            if (this.hitCooldown === 0) {
                this.justHitBall = false;
            }
        }

        // Indicator timer
        if (this.indicatorTimer > 0) {
            this.indicatorTimer--;
            if (this.indicatorTimer === 0) {
                this.indicator = null;
            }
        }

        // Jump physics
        if (this.z > 0 || this.vz > 0) {
            this.vz -= 0.15;
            this.z += this.vz;
            if (this.z <= 0) {
                this.z = 0;
                this.vz = 0;
                if (this.state === PLAYER_STATES.JUMPING ||
                    this.state === PLAYER_STATES.SPIKING ||
                    this.state === PLAYER_STATES.BLOCKING) {
                    this.setState(PLAYER_STATES.IDLE);
                }
            }
        }

        // Dive movement
        if (this.state === PLAYER_STATES.DIVING) {
            if (this.stateTimer < 10) {
                let newX = this.x + this.diveVx;
                let newY = this.y + this.diveVy;
                // Clamp to boundaries
                newX = Math.max(COURT.LEFT + 2, Math.min(COURT.RIGHT - 14, newX));
                if (this.side === 0) {
                    newY = Math.max(COURT.NET_Y + 2, Math.min(COURT.BOTTOM - 4, newY));
                } else {
                    newY = Math.max(COURT.TOP + 2, Math.min(COURT.NET_Y - 2, newY));
                }
                this.x = newX;
                this.y = newY;
            }
        }

        // State timeout
        const dur = STATE_DURATIONS[this.state];
        if (dur !== Infinity && this.stateTimer >= dur) {
            this.setState(PLAYER_STATES.IDLE);
        }
    }

    // Vertical reach for collision
    getReach() {
        let reach = 22;
        if (this.state === PLAYER_STATES.JUMPING ||
            this.state === PLAYER_STATES.SPIKING) {
            reach = 30 + this.z;
        }
        if (this.state === PLAYER_STATES.BLOCKING) {
            reach = 34 + this.z;
        }
        return reach;
    }

    // Hitbox for ball collision
    getHitbox() {
        let w = this.width;
        let h = this.height;
        if (this.state === PLAYER_STATES.DIVING) {
            w = 20;
            h = 10;
        }
        return {
            x: this.x - 2,
            y: this.y - 6,
            w: w + 4,
            h: h + 6,
            zBottom: this.z,
            zTop: this.z + this.getReach()
        };
    }

    // Whether player is near the net
    isNearNet() {
        if (this.side === 0) {
            return this.y < COURT.NET_Y + 25;
        } else {
            return this.y > COURT.NET_Y - 25;
        }
    }

    showIndicator(type, duration = 30) {
        this.indicator = type;
        this.indicatorTimer = duration;
    }
}
