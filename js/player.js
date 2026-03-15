// player.js — Player entity with state machine

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
        this.side = side;           // 0 = left, 1 = right
        this.isHuman = isHuman;
        this.stats = stats || { speed: 5, power: 5, technique: 5, defense: 5 };

        // Position
        this.x = 0;
        this.y = 0;
        this.z = 0;                 // height above ground (for jumps)
        this.vz = 0;                // vertical velocity

        // State
        this.state = PLAYER_STATES.IDLE;
        this.stateTimer = 0;
        this.animFrame = 0;
        this.facingRight = side === 0; // Left team faces right, right team faces left

        // Width/height for collision
        this.width = 16;
        this.height = 24;

        // Dive velocity
        this.diveVx = 0;
        this.diveVy = 0;

        // Track if this player just hit the ball (to prevent double-hits)
        this.justHitBall = false;
        this.hitCooldown = 0;
    }

    get speed() {
        return 1.0 + (this.stats.speed * 0.1);
    }

    get screenX() {
        return this.x;
    }

    get screenY() {
        return this.y - this.z;
    }

    setDefaultPosition(side, isServer, playerIdx) {
        if (side === 0) {
            // Left team
            if (isServer) {
                this.x = 50;
                this.y = 180;
            } else if (playerIdx === 0) {
                this.x = 60;
                this.y = 140;
            } else {
                this.x = 90;
                this.y = 160;
            }
        } else {
            // Right team
            if (isServer) {
                this.x = 196;
                this.y = 180;
            } else if (playerIdx === 0) {
                this.x = 196;
                this.y = 140;
            } else {
                this.x = 166;
                this.y = 160;
            }
        }
        this.z = 0;
        this.vz = 0;
        this.state = PLAYER_STATES.IDLE;
        this.stateTimer = 0;
        this.facingRight = side === 0;
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        this.stateTimer = 0;
        this.animFrame = 0;
    }

    isActionable() {
        // Can the player perform a new action?
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

        // During jump/spike, allow slight air control
        let spd = this.speed;
        if (this.isInAir()) {
            spd *= 0.3;
        }

        if (this.state === PLAYER_STATES.DIVING) return;

        let newX = this.x + dx * spd;
        let newY = this.y + dy * spd;

        // Boundary constraints
        if (this.side === 0) {
            // Left side: can't cross net
            newX = Math.max(COURT.LEFT, Math.min(COURT.LEFT_SIDE_MAX, newX));
        } else {
            // Right side: can't cross net
            newX = Math.max(COURT.RIGHT_SIDE_MIN, Math.min(COURT.RIGHT, newX));
        }
        newY = Math.max(COURT.TOP, Math.min(COURT.BOTTOM - 4, newY));

        this.x = newX;
        this.y = newY;

        // Update facing direction based on movement
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

        // Hit ball hard toward opponent's side
        const power = this.stats.power;
        const technique = this.stats.technique;

        if (this.side === 0) {
            ball.vx = 2.5 + power * 0.3;
        } else {
            ball.vx = -(2.5 + power * 0.3);
        }

        // Slight y spread based on technique (less spread = better)
        ball.vy = (Math.random() - 0.5) * (2 - technique * 0.15);
        ball.vz = -1.5 - power * 0.1;
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

        ball.vx = (dx / dist) * 1.2;
        ball.vy = (dy / dist) * 0.5;
        ball.vz = 3.0;
        ball.active = true;
        ball.lastTeam = this.side;
        ball.hitCooldown = 8;

        this.justHitBall = true;
        this.hitCooldown = 10;
    }

    set(ball) {
        if (!this.isActionable() && this.state !== PLAYER_STATES.JUMPING) return;
        this.setState(PLAYER_STATES.SETTING);

        // Loft ball to net area on their side
        let targetX;
        if (this.side === 0) {
            targetX = COURT.NET_X - 15; // Near net on left side
        } else {
            targetX = COURT.NET_X + 15; // Near net on right side
        }
        const targetY = 150; // Center of court depth

        const dx = targetX - ball.x;
        const dy = targetY - ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        ball.vx = (dx / dist) * 1.5;
        ball.vy = (dy / dist) * 0.4;
        ball.vz = 3.5;
        ball.active = true;
        ball.lastTeam = this.side;
        ball.hitCooldown = 8;

        this.justHitBall = true;
        this.hitCooldown = 10;
    }

    dive() {
        if (!this.isActionable()) return;
        this.setState(PLAYER_STATES.DIVING);

        // Lunge in facing direction
        this.diveVx = this.facingRight ? 3.0 : -3.0;
        this.diveVy = 0;
    }

    block() {
        if (!this.isActionable()) return;
        this.setState(PLAYER_STATES.BLOCKING);
        this.vz = 3.0;
    }

    serve(ball) {
        this.setState(PLAYER_STATES.SERVING);

        // Hit ball toward opponent's side
        const power = this.stats.power;
        if (this.side === 0) {
            ball.vx = 1.5 + power * 0.15;
        } else {
            ball.vx = -(1.5 + power * 0.15);
        }
        ball.vy = (Math.random() - 0.5) * 0.5;
        ball.vz = 1.8;
        ball.active = true;
        ball.landed = false;
        ball.lastTeam = this.side;
        ball.touchCount = 0;
        ball.hitCooldown = 15;

        this.justHitBall = true;
        this.hitCooldown = 15;
    }

    update() {
        this.stateTimer++;
        this.animFrame += 0.1;

        // Hit cooldown
        if (this.hitCooldown > 0) {
            this.hitCooldown--;
            if (this.hitCooldown === 0) {
                this.justHitBall = false;
            }
        }

        // Handle jump physics
        if (this.z > 0 || this.vz > 0) {
            this.vz -= 0.15;
            this.z += this.vz;
            if (this.z <= 0) {
                this.z = 0;
                this.vz = 0;
                // Land from jump
                if (this.state === PLAYER_STATES.JUMPING ||
                    this.state === PLAYER_STATES.SPIKING ||
                    this.state === PLAYER_STATES.BLOCKING) {
                    this.setState(PLAYER_STATES.IDLE);
                }
            }
        }

        // Handle dive movement
        if (this.state === PLAYER_STATES.DIVING) {
            if (this.stateTimer < 10) {
                let newX = this.x + this.diveVx;
                let newY = this.y + this.diveVy;
                // Boundary check
                if (this.side === 0) {
                    newX = Math.max(COURT.LEFT, Math.min(COURT.LEFT_SIDE_MAX, newX));
                } else {
                    newX = Math.max(COURT.RIGHT_SIDE_MIN, Math.min(COURT.RIGHT, newX));
                }
                newY = Math.max(COURT.TOP, Math.min(COURT.BOTTOM - 4, newY));
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

    // Get vertical reach (for collision with ball)
    getReach() {
        let reach = 24; // standing reach above feet
        if (this.state === PLAYER_STATES.JUMPING ||
            this.state === PLAYER_STATES.SPIKING) {
            reach = 32 + this.z;
        }
        if (this.state === PLAYER_STATES.BLOCKING) {
            reach = 36 + this.z;
        }
        return reach;
    }

    // Get the hitbox for ball collision
    getHitbox() {
        let w = this.width;
        let h = this.height;
        if (this.state === PLAYER_STATES.DIVING) {
            w = 24;
            h = 12;
        }
        return {
            x: this.x - 2,
            y: this.y - 4,
            w: w + 4,
            h: h + 4,
            zBottom: this.z,
            zTop: this.z + this.getReach()
        };
    }
}
