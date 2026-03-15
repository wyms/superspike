// ai.js — AI controller for CPU-controlled players
// Improved for proper volleyball flow: bump -> set -> spike
// Works with horizontal net at COURT.NET_Y

import { COURT } from './court.js';
import { predictBallLanding, distanceBetween } from './physics.js';
import { PLAYER_STATES } from './player.js';

export class AIController {
    constructor(difficulty = 1) {
        // difficulty: 0 = easy (exercise), 1 = normal (circuit), 2 = hard (world cup)
        this.difficulty = difficulty;
        this.reactionDelay = [18, 8, 3][difficulty];
        this.accuracy = [0.6, 0.8, 0.95][difficulty];   // how often they make good decisions
        this.diveProbability = [0.1, 0.4, 0.8][difficulty];
        this.framesSinceBallActive = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lastDecision = { dx: 0, dy: 0, action: false, dive: false };
        this.decisionTimer = 0;
        this.role = 'none'; // 'receiver', 'setter', 'spiker', 'blocker'
    }

    update(player, ball, partner, matchState, touchCount) {
        const result = { dx: 0, dy: 0, action: false, dive: false };

        // Can't act during celebration/defeat
        if (player.state === PLAYER_STATES.CELEBRATING ||
            player.state === PLAYER_STATES.DEFEATED) {
            return result;
        }

        // Don't override active action states
        if (player.state === PLAYER_STATES.DIVING ||
            player.state === PLAYER_STATES.BUMPING ||
            player.state === PLAYER_STATES.SETTING ||
            player.state === PLAYER_STATES.SPIKING ||
            player.state === PLAYER_STATES.SERVING) {
            return result;
        }

        // Track ball activity
        if (ball.active) {
            this.framesSinceBallActive++;
        } else {
            this.framesSinceBallActive = 0;
        }

        // Reaction delay (harder AI reacts faster)
        if (this.framesSinceBallActive < this.reactionDelay && ball.active) {
            return this.moveToward(player, this.getDefaultPosition(player), result);
        }

        // Serving
        if (matchState === 'READY_TO_SERVE' || matchState === 'SERVE_TOSS') {
            return this.handleServe(player, ball, matchState, result);
        }

        // Ball not in play
        if (!ball.active && !ball.landed) {
            return this.moveToward(player, this.getDefaultPosition(player), result);
        }

        // Ball in play
        if (ball.active) {
            return this.handleBallInPlay(player, ball, partner, touchCount, result);
        }

        // Default: go to position
        return this.moveToward(player, this.getDefaultPosition(player), result);
    }

    handleServe(player, ball, matchState, result) {
        if (this.isServer(player)) {
            if (matchState === 'READY_TO_SERVE') {
                result.action = true;
            } else if (matchState === 'SERVE_TOSS') {
                result.action = true;
            }
        } else {
            this.moveToward(player, this.getDefaultPosition(player), result);
        }
        return result;
    }

    handleBallInPlay(player, ball, partner, touchCount, result) {
        const landing = predictBallLanding(ball);
        const isOnMySide = this.isBallOnMySide(ball, player);
        const isComingToMe = this.isBallComingToMySide(ball, player);
        const ballDist = distanceBetween(player, { x: ball.x, y: ball.y });
        const partnerDist = partner ? distanceBetween(partner, { x: ball.x, y: ball.y }) : Infinity;
        const iAmCloser = ballDist <= partnerDist;
        const partnerJustHit = partner && partner.justHitBall;
        const tc = touchCount || 0;

        // Determine role
        this.determineRole(player, ball, partner, tc, isOnMySide, isComingToMe, iAmCloser, partnerJustHit);

        switch (this.role) {
            case 'receiver':
                return this.playReceiver(player, ball, partner, landing, ballDist, tc, result);
            case 'setter':
                return this.playSetter(player, ball, partner, landing, ballDist, tc, result);
            case 'spiker':
                return this.playSpiker(player, ball, partner, landing, ballDist, tc, result);
            case 'blocker':
                return this.playBlocker(player, ball, landing, ballDist, result);
            default:
                return this.playDefense(player, ball, partner, landing, result);
        }
    }

    determineRole(player, ball, partner, tc, isOnMySide, isComingToMe, iAmCloser, partnerJustHit) {
        // Ball coming from opponent
        if (!isOnMySide && isComingToMe) {
            if (iAmCloser || partnerJustHit) {
                this.role = 'receiver';
            } else {
                // Partner receives, I prepare to set or spike
                this.role = tc === 0 ? 'setter' : 'spiker';
            }
            return;
        }

        // Ball on my side
        if (isOnMySide) {
            if (tc === 0) {
                // First touch needed - receive
                if (iAmCloser || partnerJustHit) {
                    this.role = 'receiver';
                } else {
                    this.role = 'setter'; // prepare to set
                }
            } else if (tc === 1) {
                // Need a set
                if (!partnerJustHit && iAmCloser) {
                    this.role = 'setter';
                } else if (partnerJustHit) {
                    this.role = 'setter';
                } else {
                    this.role = 'spiker';
                }
            } else if (tc >= 2) {
                // Need a spike
                if (iAmCloser || partnerJustHit) {
                    this.role = 'spiker';
                } else {
                    this.role = 'spiker';
                }
            }
            return;
        }

        // Ball on opponent side - could block or defend
        if (ball.vy !== 0 && !isComingToMe) {
            // Ball moving away from us - position defensively
            this.role = 'defense';
        } else {
            // Ball might come our way
            if (player.isNearNet() && ball.z > 20) {
                this.role = 'blocker';
            } else {
                this.role = 'defense';
            }
        }
    }

    playReceiver(player, ball, partner, landing, ballDist, tc, result) {
        // Move to where ball will land
        const target = this.clampToMySide(player, landing.x, landing.y);
        this.moveToward(player, target, result);

        if (ballDist < 22 && player.hitCooldown === 0) {
            result.action = true;
            // Show ready indicator on partner
            if (partner) partner.showIndicator('ready', 20);
        } else if (ballDist < 35 && ball.z < 12 && ball.vz < 0) {
            // Ball about to hit ground - dive!
            if (Math.random() < this.diveProbability) {
                result.dive = true;
            }
        }
        return result;
    }

    playSetter(player, ball, partner, landing, ballDist, tc, result) {
        // Position for setting (slightly forward, ready for second touch)
        let targetX, targetY;
        if (player.side === 0) {
            targetX = ball.x + (partner && partner.x > COURT.WIDTH / 2 ? -15 : 15);
            targetY = COURT.NET_Y + 15;
        } else {
            targetX = ball.x + (partner && partner.x > COURT.WIDTH / 2 ? -15 : 15);
            targetY = COURT.NET_Y - 15;
        }
        const target = this.clampToMySide(player, targetX, targetY);
        this.moveToward(player, target, result);

        if (ballDist < 22 && player.hitCooldown === 0 && tc >= 1) {
            result.action = true;
        }
        return result;
    }

    playSpiker(player, ball, partner, landing, ballDist, tc, result) {
        // Move to net for spike position
        const spikePos = this.getSpikePosition(player);
        this.moveToward(player, spikePos, result);

        if (ballDist < 22 && player.hitCooldown === 0) {
            if (player.isNearNet() && tc >= 2) {
                // Jump to spike
                if (player.z === 0 && ball.z > 15) {
                    result.action = true; // will jump
                } else if (player.z > 0) {
                    result.action = true; // in air, spike!
                }
            } else {
                result.action = true;
            }
        } else if (ballDist < 30 && player.isNearNet() && ball.z > 20 && tc >= 2) {
            // Close and ball is high - jump for it
            result.action = true;
        }
        return result;
    }

    playBlocker(player, ball, landing, ballDist, result) {
        // Position at net directly across from ball
        let targetX = Math.max(COURT.LEFT + 10, Math.min(COURT.RIGHT - 10, ball.x));
        let targetY = player.side === 0 ? COURT.NET_Y + 3 : COURT.NET_Y - 3;
        this.moveToward(player, { x: targetX, y: targetY }, result);

        // Jump to block when ball is approaching
        if (player.isNearNet() && ball.z > 20 && ballDist < 30) {
            result.action = true;
        }
        return result;
    }

    playDefense(player, ball, partner, landing, result) {
        const defPos = this.getDefensivePosition(player, ball);
        this.moveToward(player, defPos, result);
        return result;
    }

    moveToward(player, target, result) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 3) {
            result.dx = dx / dist;
            result.dy = dy / dist;

            // Easy AI is slower to move
            if (this.difficulty === 0) {
                result.dx *= 0.7;
                result.dy *= 0.7;
            }
        }
        return result;
    }

    clampToMySide(player, x, y) {
        x = Math.max(COURT.LEFT + 4, Math.min(COURT.RIGHT - 14, x));
        if (player.side === 0) {
            y = Math.max(COURT.NET_Y + 3, Math.min(COURT.BOTTOM - 4, y));
        } else {
            y = Math.max(COURT.TOP + 3, Math.min(COURT.NET_Y - 3, y));
        }
        return { x, y };
    }

    getDefaultPosition(player) {
        if (player.side === 0) {
            // Near side
            return player.playerIndex === 0
                ? { x: 100, y: 172 }
                : { x: 156, y: 180 };
        } else {
            // Far side
            return player.playerIndex === 0
                ? { x: 110, y: 108 }
                : { x: 160, y: 115 };
        }
    }

    getSpikePosition(player) {
        if (player.side === 0) {
            return { x: player.x, y: COURT.NET_Y + 8 };
        } else {
            return { x: player.x, y: COURT.NET_Y - 8 };
        }
    }

    getDefensivePosition(player, ball) {
        let targetX = Math.max(COURT.LEFT + 15, Math.min(COURT.RIGHT - 15, ball.x));
        let targetY;
        if (player.side === 0) {
            targetY = player.playerIndex === 0 ? 170 : 185;
        } else {
            targetY = player.playerIndex === 0 ? 108 : 96;
        }
        return this.clampToMySide(player, targetX, targetY);
    }

    isBallOnMySide(ball, player) {
        if (player.side === 0) {
            return ball.y > COURT.NET_Y;
        } else {
            return ball.y < COURT.NET_Y;
        }
    }

    isBallComingToMySide(ball, player) {
        if (player.side === 0) {
            return ball.vy > 0; // moving downward toward near side
        } else {
            return ball.vy < 0; // moving upward toward far side
        }
    }

    isServer(player) {
        return player.playerIndex === 0;
    }
}
