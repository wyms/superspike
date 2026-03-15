// match.js — Match state management

export const RALLY_STATES = {
    READY_TO_SERVE: 'READY_TO_SERVE',
    SERVE_TOSS: 'SERVE_TOSS',
    SERVE_HIT: 'SERVE_HIT',
    BALL_IN_PLAY: 'BALL_IN_PLAY',
    POINT_SCORED: 'POINT_SCORED',
    MATCH_OVER: 'MATCH_OVER'
};

export class Match {
    constructor() {
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.servingTeam = 0;         // 0 = left, 1 = right
        this.servingPlayer = 0;       // which player on the serving team
        this.rallyState = RALLY_STATES.READY_TO_SERVE;
        this.touchCount = 0;          // touches on current side
        this.currentSide = -1;        // which side currently has touches (0/1)
        this.stateTimer = 0;
        this.pointDelay = 0;
        this.lastPointWinner = -1;
        this.serveTossTimer = 0;
        this.matchPointFlash = 0;

        // Teams
        this.leftTeamName = '';
        this.rightTeamName = '';
        this.leftTeamIndex = 0;
        this.rightTeamIndex = 1;

        this.winner = -1;             // -1 = no winner yet
        this.winScore = 15;
        this.maxScore = 21;

        this.message = '';
        this.messageTimer = 0;
    }

    reset() {
        this.scoreLeft = 0;
        this.scoreRight = 0;
        this.servingTeam = 0;
        this.servingPlayer = 0;
        this.rallyState = RALLY_STATES.READY_TO_SERVE;
        this.touchCount = 0;
        this.currentSide = -1;
        this.stateTimer = 0;
        this.pointDelay = 0;
        this.lastPointWinner = -1;
        this.winner = -1;
        this.message = '';
        this.messageTimer = 0;
    }

    update() {
        this.stateTimer++;

        if (this.messageTimer > 0) {
            this.messageTimer--;
            if (this.messageTimer === 0) {
                this.message = '';
            }
        }

        if (this.matchPointFlash > 0) {
            this.matchPointFlash--;
        }
    }

    setMessage(msg, duration = 90) {
        this.message = msg;
        this.messageTimer = duration;
    }

    // Called when ball is touched by a player on a given side
    registerTouch(side) {
        if (side !== this.currentSide) {
            // Ball switched sides
            this.currentSide = side;
            this.touchCount = 1;
        } else {
            this.touchCount++;
        }

        if (this.touchCount > 3) {
            // Too many touches — point for other team
            return this.scorePoint(side === 0 ? 1 : 0);
        }
        return false;
    }

    // Determine who scores based on ball landing
    handleBallLanded(landResult) {
        // landResult: 'left', 'right', 'out-left', 'out-right', 'net', or null
        if (!landResult) return false;

        switch (landResult) {
            case 'left':
                // Ball landed on left side — right team scores
                return this.scorePoint(1);
            case 'right':
                // Ball landed on right side — left team scores
                return this.scorePoint(0);
            case 'out-left':
                // Ball went out on left side — depends on last touch
                // If last touch was left team, right scores (they hit it out)
                // If last touch was right team, left scores (opponent hit it out)
                // Actually: out-left means ball is out of bounds on left side
                // The team that last touched it is responsible
                return this.scorePoint(this.currentSide === 0 ? 1 : 0);
            case 'out-right':
                return this.scorePoint(this.currentSide === 1 ? 0 : 1);
            case 'net':
                // Hit the net — point for the team that DIDN'T hit it
                return this.scorePoint(this.currentSide === 0 ? 1 : 0);
            default:
                return false;
        }
    }

    handleNetHit(lastTouchSide) {
        // Ball hit the net — point for the opposing team
        return this.scorePoint(lastTouchSide === 0 ? 1 : 0);
    }

    scorePoint(winningSide) {
        if (winningSide === 0) {
            this.scoreLeft++;
        } else {
            this.scoreRight++;
        }

        this.lastPointWinner = winningSide;
        this.rallyState = RALLY_STATES.POINT_SCORED;
        this.stateTimer = 0;
        this.pointDelay = 90; // frames before next serve

        // Update serving team
        this.servingTeam = winningSide;

        // Check for match point
        if (this.isMatchPoint()) {
            this.matchPointFlash = 120;
            this.setMessage('MATCH POINT!', 90);
        }

        // Check for match over
        if (this.isMatchOver()) {
            this.winner = winningSide;
            this.rallyState = RALLY_STATES.MATCH_OVER;
            this.setMessage(winningSide === 0 ? this.leftTeamName + ' WINS!' :
                           this.rightTeamName + ' WINS!', 300);
            return true;
        }

        this.setMessage(winningSide === 0 ? this.leftTeamName + ' SCORES!' :
                       this.rightTeamName + ' SCORES!', 60);
        return false;
    }

    isMatchPoint() {
        // Check if either team is one point from winning
        return (this.scoreLeft >= this.winScore - 1 && this.scoreLeft > this.scoreRight) ||
               (this.scoreRight >= this.winScore - 1 && this.scoreRight > this.scoreLeft);
    }

    isMatchOver() {
        // First to 15, win by 2, cap at 21
        if (this.scoreLeft >= this.winScore && this.scoreLeft - this.scoreRight >= 2) return true;
        if (this.scoreRight >= this.winScore && this.scoreRight - this.scoreLeft >= 2) return true;
        if (this.scoreLeft >= this.maxScore) return true;
        if (this.scoreRight >= this.maxScore) return true;
        return false;
    }

    startNextRally() {
        this.rallyState = RALLY_STATES.READY_TO_SERVE;
        this.stateTimer = 0;
        this.touchCount = 0;
        this.currentSide = -1;
    }
}
