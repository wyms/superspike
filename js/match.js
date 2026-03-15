// match.js — Match state management
// Updated for horizontal net: 'near' = side 0 (bottom), 'far' = side 1 (top)
// Supports tournament modes: exercise, circuit, world cup

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
        this.scoreNear = 0;      // player's team (side 0)
        this.scoreFar = 0;       // opponent team (side 1)
        this.servingTeam = 0;    // 0 = near, 1 = far
        this.servingPlayer = 0;
        this.rallyState = RALLY_STATES.READY_TO_SERVE;
        this.touchCount = 0;
        this.currentSide = -1;
        this.stateTimer = 0;
        this.pointDelay = 0;
        this.lastPointWinner = -1;
        this.serveTossTimer = 0;
        this.matchPointFlash = 0;

        // Teams
        this.nearTeamName = '';
        this.farTeamName = '';
        this.nearTeamIndex = 0;
        this.farTeamIndex = 1;

        this.winner = -1;
        this.winScore = 15;
        this.maxScore = 21;

        this.message = '';
        this.messageTimer = 0;

        // Tournament tracking
        this.gameMode = 0;         // 0=exercise, 1=circuit, 2=world cup
        this.tournamentRound = 0;  // current round in tournament
        this.tournamentWins = 0;   // wins so far
    }

    reset() {
        this.scoreNear = 0;
        this.scoreFar = 0;
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

    // Register a touch on a given side
    registerTouch(side) {
        if (side !== this.currentSide) {
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

    // Handle ball landing
    handleBallLanded(landResult) {
        if (!landResult) return false;

        switch (landResult) {
            case 'near':
                // Ball landed on near side — far team scores
                return this.scorePoint(1);
            case 'far':
                // Ball landed on far side — near team scores
                return this.scorePoint(0);
            case 'out-near':
                // Out of bounds on near side - last toucher's fault
                return this.scorePoint(this.currentSide === 0 ? 1 : 0);
            case 'out-far':
                // Out of bounds on far side
                return this.scorePoint(this.currentSide === 1 ? 0 : 1);
            case 'net':
                return this.scorePoint(this.currentSide === 0 ? 1 : 0);
            default:
                return false;
        }
    }

    handleNetHit(lastTouchSide) {
        return this.scorePoint(lastTouchSide === 0 ? 1 : 0);
    }

    scorePoint(winningSide) {
        if (winningSide === 0) {
            this.scoreNear++;
        } else {
            this.scoreFar++;
        }

        this.lastPointWinner = winningSide;
        this.rallyState = RALLY_STATES.POINT_SCORED;
        this.stateTimer = 0;
        this.pointDelay = 90;

        // Serving goes to winner
        this.servingTeam = winningSide;

        // Check match point
        if (this.isMatchPoint()) {
            this.matchPointFlash = 120;
            this.setMessage('MATCH POINT!', 90);
        }

        // Check match over
        if (this.isMatchOver()) {
            this.winner = winningSide;
            this.rallyState = RALLY_STATES.MATCH_OVER;
            const winName = winningSide === 0 ? this.nearTeamName : this.farTeamName;
            this.setMessage('GAME SET!', 300);
            return true;
        }

        const scorerName = winningSide === 0 ? this.nearTeamName : this.farTeamName;
        this.setMessage('POINT!', 50);
        return false;
    }

    isMatchPoint() {
        return (this.scoreNear >= this.winScore - 1 && this.scoreNear > this.scoreFar) ||
               (this.scoreFar >= this.winScore - 1 && this.scoreFar > this.scoreNear);
    }

    isMatchOver() {
        if (this.scoreNear >= this.winScore && this.scoreNear - this.scoreFar >= 2) return true;
        if (this.scoreFar >= this.winScore && this.scoreFar - this.scoreNear >= 2) return true;
        if (this.scoreNear >= this.maxScore) return true;
        if (this.scoreFar >= this.maxScore) return true;
        return false;
    }

    startNextRally() {
        this.rallyState = RALLY_STATES.READY_TO_SERVE;
        this.stateTimer = 0;
        this.touchCount = 0;
        this.currentSide = -1;
    }

    // For backward compatibility aliases
    get scoreLeft() { return this.scoreNear; }
    get scoreRight() { return this.scoreFar; }
    get leftTeamName() { return this.nearTeamName; }
    get rightTeamName() { return this.farTeamName; }
}
