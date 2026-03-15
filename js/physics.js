// physics.js — Collision detection and physics helpers

import { COURT } from './court.js';
import { GRAVITY } from './ball.js';

export function checkBallPlayerCollision(ball, player) {
    if (ball.hitCooldown > 0) return false;
    if (player.hitCooldown > 0) return false;
    if (!ball.active) return false;
    if (player.state === 'celebrating' || player.state === 'defeated') return false;

    const hitbox = player.getHitbox();

    // Ball center
    const bx = ball.x + 3;
    const by = ball.y + 3;
    const bz = ball.z;

    // Check horizontal overlap
    const horizontalOverlap = bx >= hitbox.x && bx <= hitbox.x + hitbox.w &&
                               by >= hitbox.y && by <= hitbox.y + hitbox.h;

    // Check vertical overlap (z-axis)
    const verticalOverlap = bz >= hitbox.zBottom && bz <= hitbox.zTop;

    return horizontalOverlap && verticalOverlap;
}

export function checkBallNet(ball) {
    // Check if ball is crossing the net
    const prevX = ball.x - ball.vx;
    const crossingRight = prevX < COURT.NET_X && ball.x >= COURT.NET_X;
    const crossingLeft = prevX > COURT.NET_X && ball.x <= COURT.NET_X;

    if (crossingRight || crossingLeft) {
        // Check if ball is below net height
        if (ball.z < COURT.NET_HEIGHT) {
            return true;
        }
    }
    return false;
}

export function checkBallOutOfBounds(ball) {
    if (ball.z > 0) return false; // Still in air
    if (!ball.landed) return false;

    const bx = ball.x + 3;
    const by = ball.y + 3;

    return bx < COURT.LEFT || bx > COURT.RIGHT ||
           by < COURT.TOP || by > COURT.BOTTOM;
}

export function checkBallLanded(ball) {
    if (!ball.landed) return null;

    const bx = ball.x + 3;
    const by = ball.y + 3;

    // Check out of bounds first
    if (bx < COURT.LEFT || bx > COURT.RIGHT ||
        by < COURT.TOP || by > COURT.BOTTOM) {
        // Out of bounds — which side was last touch?
        if (bx < COURT.NET_X) {
            return 'out-left';
        } else {
            return 'out-right';
        }
    }

    // In bounds — which side did it land on?
    if (bx < COURT.NET_X) {
        return 'left';
    } else {
        return 'right';
    }
}

export function predictBallLanding(ball) {
    if (!ball.active) return { x: ball.x, y: ball.y };

    // Simulate ball trajectory
    let x = ball.x;
    let y = ball.y;
    let z = ball.z;
    let vx = ball.vx;
    let vy = ball.vy;
    let vz = ball.vz;

    // Simulate up to 200 frames
    for (let i = 0; i < 200; i++) {
        vz -= GRAVITY;
        x += vx;
        y += vy;
        z += vz;
        if (z <= 0) {
            return { x, y };
        }
    }
    return { x, y };
}

export function distanceBetween(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function ballApproachingSide(ball, side) {
    if (!ball.active) return false;
    if (side === 0) {
        return ball.vx < 0; // Moving left
    } else {
        return ball.vx > 0; // Moving right
    }
}
