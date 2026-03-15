// ball.js — Ball entity

export const GRAVITY = 0.15;

export class Ball {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;        // height above ground
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.active = false;
        this.lastTeam = -1;    // 0 = left team, 1 = right team
        this.touchCount = 0;   // touches on current side
        this.landed = false;
        this.animFrame = 0;
        this.hitCooldown = 0;  // frames until ball can be hit again
    }

    reset(servingSide) {
        // Place ball at serving position
        if (servingSide === 0) {
            // Left team serves
            this.x = 60;
            this.y = 170;
        } else {
            // Right team serves
            this.x = 196;
            this.y = 170;
        }
        this.z = 20;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.active = false;
        this.landed = false;
        this.lastTeam = servingSide;
        this.touchCount = 0;
        this.hitCooldown = 0;
    }

    update() {
        if (!this.active) return;

        // Apply gravity
        this.vz -= GRAVITY;

        // Update position
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Animate ball rotation
        this.animFrame += 0.15;

        // Decrease hit cooldown
        if (this.hitCooldown > 0) {
            this.hitCooldown--;
        }

        // Check if ball landed
        if (this.z <= 0) {
            this.z = 0;
            this.vz = 0;
            this.vx = 0;
            this.vy = 0;
            this.landed = true;
            this.active = false;
        }
    }

    // Screen position for rendering
    get screenX() {
        return this.x;
    }

    get screenY() {
        return this.y - this.z;
    }
}
