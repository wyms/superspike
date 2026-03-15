// ai.js — AI controller for CPU-controlled players

import { COURT } from './court.js';
import { predictBallLanding, distanceBetween } from './physics.js';
import { PLAYER_STATES } from './player.js';

export class AIController {
    constructor(difficulty = 1) {
        // difficulty: 0 = easy, 1 = normal, 2 = hard
        this.difficulty = difficulty;
        this.reactionDelay = [20, 10, 4][difficulty];
        this.framesSinceBallActive = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lastDecision = { dx: 0, dy: 0, action: false, dive: false };
        this.decisionTimer = 0;
    }

    update(player, ball, partner, matchState) {
        const result = { dx: 0, dy: 0, action: false, dive: false };

        // Can't do anything during celebration/defeat
        if (player.state === PLAYER_STATES.CELEBRATING ||
            player.state === PLAYER_STATES.DEFEATED) {
            return result;
        }

        // During diving or action states, don't override
        if (player.state === PLAYER_STATES.DIVING ||
            player.state === PLAYER_STATES.BUMPING ||
            player.state === PLAYER_STATES.SETTING ||
            player.state === PLAYER_STATES.SPIKING ||
            player.state === PLAYER_STATES.SERVING) {
            return result;
        }

        // Track how long ball has been active
        if (ball.active) {
            this.framesSinceBallActive++;
        } else {
            this.framesSinceBallActive = 0;
        }

        // Reaction delay
        if (this.framesSinceBallActive < this.reactionDelay && ball.active) {
            // During reaction delay, just hold position
            return this.moveToward(player, this.getDefaultPosition(player), result);
        }

        // Decide what to do based on ball state
        if (!ball.active && !ball.landed) {
            // Ball not in play — go to default position
            return this.moveToward(player, this.getDefaultPosition(player), result);
        }

        // Serving
        if (matchState === 'READY_TO_SERVE' || matchState === 'SERVE_TOSS') {
            if (player.state === PLAYER_STATES.IDLE || player.state === PLAYER_STATES.RUNNING) {
                // If this player is the server
                if (this.isServer(player)) {
                    if (matchState === 'READY_TO_SERVE') {
                        result.action = true;
                    } else if (matchState === 'SERVE_TOSS') {
                        // Wait for good timing then hit
                        result.action = true;
                    }
                } else {
                    // Partner of server — go to ready position
                    return this.moveToward(player, this.getDefaultPosition(player), result);
                }
            }
            return result;
        }

        if (ball.active) {
            const landing = predictBallLanding(ball);
            const isOnMySide = this.isBallOnMySide(ball, player);
            const isComingToMe = this.isBallComingToMySide(ball, player);
            const ballDist = distanceBetween(player, { x: ball.x, y: ball.y });

            // Decide which player should go for the ball
            const partnerDist = partner ? distanceBetween(partner, { x: ball.x, y: ball.y }) : Infinity;
            const iAmCloser = ballDist <= partnerDist;
            const partnerJustHit = partner && partner.justHitBall;

            if ((isOnMySide || isComingToMe) && (iAmCloser || partnerJustHit)) {
                // I should go for the ball
                this.targetX = landing.x;
                this.targetY = landing.y;

                // Clamp target to my side
                if (player.side === 0) {
                    this.targetX = Math.max(COURT.LEFT, Math.min(COURT.LEFT_SIDE_MAX, this.targetX));
                } else {
                    this.targetX = Math.max(COURT.RIGHT_SIDE_MIN, Math.min(COURT.RIGHT, this.targetX));
                }
                this.targetY = Math.max(COURT.TOP, Math.min(COURT.BOTTOM - 4, this.targetY));

                this.moveToward(player, { x: this.targetX, y: this.targetY }, result);

                // Close enough to act?
                const distToBall = distanceBetween(player, { x: ball.x, y: ball.y });

                if (distToBall < 22) {
                    // Determine action based on touch count and ball height
                    const touchCount = ball.touchCount;

                    if (touchCount === 0 && ball.lastTeam !== player.side) {
                        // First touch on our side — bump
                        result.action = true;
                    } else if (touchCount === 1) {
                        // Second touch — set
                        result.action = true;
                    } else if (touchCount >= 2) {
                        // Third touch — spike if near net
                        if (this.isNearNet(player)) {
                            // Jump and spike
                            if (player.z === 0) {
                                result.action = true;
                            } else {
                                result.action = true;
                            }
                        } else {
                            result.action = true;
                        }
                    } else {
                        result.action = true;
                    }
                } else if (distToBall < 35 && distToBall > 22) {
                    // Might need to dive
                    if (ball.z < 15 && ball.vz < 0 && this.difficulty >= 1) {
                        result.dive = true;
                    }
                }
            } else if (isOnMySide || isComingToMe) {
                // Partner is going for it — I should position for set/spike
                if (ball.touchCount === 0 || (ball.touchCount === 1 && !partnerJustHit)) {
                    // Position near net for potential spike
                    const netPos = this.getSpikePosition(player);
                    this.moveToward(player, netPos, result);
                } else {
                    // Position for coverage
                    const coverPos = this.getCoveragePosition(player);
                    this.moveToward(player, coverPos, result);
                }
            } else {
                // Ball on opponent's side — position defensively
                const defPos = this.getDefensivePosition(player, ball);
                this.moveToward(player, defPos, result);
            }
        } else {
            // Ball not active — return to default position
            this.moveToward(player, this.getDefaultPosition(player), result);
        }

        return result;
    }

    moveToward(player, target, result) {
        const dx = target.x - player.x;
        const dy = target.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 3) {
            result.dx = dx / dist;
            result.dy = dy / dist;
        }
        return result;
    }

    getDefaultPosition(player) {
        if (player.side === 0) {
            if (player.playerIndex === 0) {
                return { x: 60, y: 140 };
            } else {
                return { x: 80, y: 170 };
            }
        } else {
            if (player.playerIndex === 0) {
                return { x: 196, y: 140 };
            } else {
                return { x: 176, y: 170 };
            }
        }
    }

    getSpikePosition(player) {
        if (player.side === 0) {
            return { x: COURT.NET_X - 18, y: 145 };
        } else {
            return { x: COURT.NET_X + 18, y: 145 };
        }
    }

    getCoveragePosition(player) {
        if (player.side === 0) {
            return { x: 70, y: 160 };
        } else {
            return { x: 186, y: 160 };
        }
    }

    getDefensivePosition(player, ball) {
        // Position based on where ball might come
        let targetY = Math.max(COURT.TOP + 10, Math.min(COURT.BOTTOM - 10, ball.y));
        let targetX;
        if (player.side === 0) {
            targetX = player.playerIndex === 0 ? 60 : 90;
        } else {
            targetX = player.playerIndex === 0 ? 196 : 166;
        }
        return { x: targetX, y: targetY };
    }

    isBallOnMySide(ball, player) {
        if (player.side === 0) {
            return ball.x < COURT.NET_X;
        } else {
            return ball.x >= COURT.NET_X;
        }
    }

    isBallComingToMySide(ball, player) {
        if (player.side === 0) {
            return ball.vx < 0;
        } else {
            return ball.vx > 0;
        }
    }

    isNearNet(player) {
        if (player.side === 0) {
            return player.x > COURT.NET_X - 30;
        } else {
            return player.x < COURT.NET_X + 30;
        }
    }

    isServer(player) {
        // Server is typically player index 0
        return player.playerIndex === 0;
    }
}
