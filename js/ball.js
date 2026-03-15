// ball.js — Ball entity with physics tuned for NES-authentic feel
// Horizontal net at y=140. Ball has x, y (court position) and z (height above ground).
// On screen, ball renders at (x, y - z * 0.7) for perspective.

export const GRAVITY = 0.12;  // Slightly less floaty than before

export class Ball {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;        // height above ground (0 = on sand)
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.active = false;
        this.lastTeam = -1;    // 0 = near (bottom) team, 1 = far (top) team
        this.touchCount = 0;
        this.landed = false;
        this.animFrame = 0;
        this.hitCooldown = 0;

        // Visual effects
        this.isPowerSpike = false;
        this.spikeTrail = false;
        this.trailPositions = [];  // [{x,y,age}] for trail effect
        this.screenFlash = 0;      // frames of white flash after spike
    }

    reset(servingSide) {
        // servingSide: 0 = near (bottom), 1 = far (top)
        if (servingSide === 0) {
            this.x = 100;
            this.y = 195;
        } else {
            this.x = 156;
            this.y = 95;
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
        this.isPowerSpike = false;
        this.spikeTrail = false;
        this.trailPositions = [];
        this.screenFlash = 0;
    }

    update() {
        if (!this.active) return;

        // Apply gravity
        this.vz -= GRAVITY;

        // Clamp velocities
        this.vx = Math.max(-5, Math.min(5, this.vx));
        this.vy = Math.max(-3, Math.min(3, this.vy));

        // Update position
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Animate ball rotation
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
        this.animFrame += 0.1 + speed * 0.03;

        // Hit cooldown
        if (this.hitCooldown > 0) {
            this.hitCooldown--;
        }

        // Screen flash countdown
        if (this.screenFlash > 0) {
            this.screenFlash--;
        }

        // Spike trail
        if (this.spikeTrail) {
            this.trailPositions.push({ x: this.x, y: this.y - this.z * 0.7, age: 0 });
            if (this.trailPositions.length > 5) {
                this.trailPositions.shift();
            }
        }
        // Age trail
        for (let i = this.trailPositions.length - 1; i >= 0; i--) {
            this.trailPositions[i].age++;
            if (this.trailPositions[i].age > 4) {
                this.trailPositions.splice(i, 1);
            }
        }

        // Ball landed on ground
        if (this.z <= 0) {
            this.z = 0;
            this.vz = 0;
            this.vx = 0;
            this.vy = 0;
            this.landed = true;
            this.active = false;
            this.spikeTrail = false;
            this.isPowerSpike = false;
        }
    }

    // Screen position for rendering (perspective projection)
    get screenX() {
        return this.x;
    }

    get screenY() {
        return this.y - this.z * 0.7;
    }
}
