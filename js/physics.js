// physics.js — Collision detection and physics helpers
// Adapted for horizontal net at COURT.NET_Y.
// Side 0 = near (y > NET_Y), Side 1 = far (y < NET_Y).

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
    const by = ball.y;
    const bz = ball.z;

    // Check horizontal overlap (x and y on court)
    const horizontalOverlap = bx >= hitbox.x && bx <= hitbox.x + hitbox.w &&
                               by >= hitbox.y && by <= hitbox.y + hitbox.h;

    // Check vertical overlap (z-axis / height)
    const verticalOverlap = bz >= hitbox.zBottom && bz <= hitbox.zTop;

    return horizontalOverlap && verticalOverlap;
}

export function checkBallNet(ball) {
    // Ball crosses the net line (horizontal at NET_Y)
    const prevY = ball.y - ball.vy;
    const crossingDown = prevY < COURT.NET_Y && ball.y >= COURT.NET_Y;  // moving from far to near
    const crossingUp = prevY > COURT.NET_Y && ball.y <= COURT.NET_Y;    // moving from near to far

    if (crossingDown || crossingUp) {
        // Ball must be above net height to clear
        if (ball.z < COURT.NET_HEIGHT) {
            return true; // hit the net
        }
    }

    // Also check if ball is right at the net and below net height
    if (Math.abs(ball.y - COURT.NET_Y) < 3 && ball.z < COURT.NET_HEIGHT && ball.z > 0) {
        if ((ball.vy > 0 && ball.y <= COURT.NET_Y + 2) ||
            (ball.vy < 0 && ball.y >= COURT.NET_Y - 2)) {
            return true;
        }
    }

    return false;
}

export function checkBallOutOfBounds(ball) {
    if (ball.z > 0) return false;
    if (!ball.landed) return false;

    const bx = ball.x + 3;
    const by = ball.y;

    return bx < COURT.LEFT || bx > COURT.RIGHT ||
           by < COURT.TOP || by > COURT.BOTTOM;
}

export function checkBallLanded(ball) {
    if (!ball.landed) return null;

    const bx = ball.x + 3;
    const by = ball.y;

    // Out of bounds
    if (bx < COURT.LEFT || bx > COURT.RIGHT ||
        by < COURT.TOP || by > COURT.BOTTOM) {
        // Which side of net is it closer to?
        if (by <= COURT.NET_Y) {
            return 'out-far';   // out on far side
        } else {
            return 'out-near';  // out on near side
        }
    }

    // In bounds — which side did it land on?
    if (by <= COURT.NET_Y) {
        return 'far';   // landed on far side (side 1's territory)
    } else {
        return 'near';  // landed on near side (side 0's territory)
    }
}

export function predictBallLanding(ball) {
    if (!ball.active) return { x: ball.x, y: ball.y };

    // Simulate ball trajectory to find landing spot
    let x = ball.x;
    let y = ball.y;
    let z = ball.z;
    let vx = ball.vx;
    let vy = ball.vy;
    let vz = ball.vz;

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
    // Side 0 = near (bottom, y > NET_Y). Ball approaches when vy > 0 (moving down).
    // Side 1 = far (top, y < NET_Y). Ball approaches when vy < 0 (moving up).
    if (side === 0) {
        return ball.vy > 0;
    } else {
        return ball.vy < 0;
    }
}

// Predict time until ball reaches a given y coordinate
export function timeToReachY(ball, targetY) {
    if (!ball.active) return 999;
    if (ball.vy === 0) return 999;
    return (targetY - ball.y) / ball.vy;
}
