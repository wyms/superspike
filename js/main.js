// main.js — Game loop, state machine, entry point

import { TEAMS } from './teams.js';
import * as Input from './input.js';
import { COURT } from './court.js';
import { Ball } from './ball.js';
import { Player, PLAYER_STATES } from './player.js';
import { checkBallPlayerCollision, checkBallNet, checkBallLanded } from './physics.js';
import { AIController } from './ai.js';
import { Match, RALLY_STATES } from './match.js';
import { audio } from './audio.js';
import { UI } from './ui.js';
import { Renderer } from './renderer.js';

// ===== GAME STATES =====
const GAME_STATES = {
    TITLE: 'TITLE',
    TEAM_SELECT: 'TEAM_SELECT',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    RESULT: 'RESULT'
};

// ===== GLOBALS =====
let gameState = GAME_STATES.TITLE;
let renderer;
let ui;
let match;
let ball;
let players = [];          // All 4 players [left0, left1, right0, right1]
let aiControllers = [];    // AI for each player (null if human-controlled)
let selectedTeamIndex = 0;
let opponentTeamIndex = 1;
let playerTeamSide = 0;    // 0 = left, 1 = right
let gameMode = 0;          // 0 = exercise, 1 = circuit, 2 = world cup
let difficulty = 1;        // 0 = easy, 1 = normal, 2 = hard

// Serve state
let serveTossTimer = 0;
let serveTossActive = false;
let serveReady = false;
let serveDelayTimer = 0;

// ===== INITIALIZATION =====
function init() {
    renderer = new Renderer();
    ui = new UI();
    match = new Match();
    ball = new Ball();

    // Start game loop
    let lastTime = performance.now();
    const FRAME_TIME = 1000 / 60;
    let accumulator = 0;

    function gameLoop(currentTime) {
        const deltaTime = Math.min(currentTime - lastTime, 200); // Cap at 200ms
        lastTime = currentTime;
        accumulator += deltaTime;

        // Fixed timestep updates (max 4 per frame to prevent spiral)
        let steps = 0;
        while (accumulator >= FRAME_TIME && steps < 4) {
            update();
            Input.clearFrame();
            accumulator -= FRAME_TIME;
            steps++;
        }
        if (steps >= 4) accumulator = 0;

        render();
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
}

// ===== UPDATE =====
function update() {
    ui.update();

    // Handle mute toggle
    if (Input.isJustPressed('KeyM')) {
        audio.toggleMute();
    }

    switch (gameState) {
        case GAME_STATES.TITLE:
            updateTitle();
            break;
        case GAME_STATES.TEAM_SELECT:
            updateTeamSelect();
            break;
        case GAME_STATES.PLAYING:
            updatePlaying();
            break;
        case GAME_STATES.PAUSED:
            updatePaused();
            break;
        case GAME_STATES.RESULT:
            updateResult();
            break;
    }
}

// ===== TITLE SCREEN =====
function updateTitle() {
    if (Input.isJustPressed('ArrowUp')) {
        ui.selectedMenuItem = (ui.selectedMenuItem - 1 + ui.menuItems.length) % ui.menuItems.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('ArrowDown')) {
        ui.selectedMenuItem = (ui.selectedMenuItem + 1) % ui.menuItems.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('Enter') || Input.isJustPressed('KeyZ')) {
        audio.ensureContext();
        audio.menuConfirm();
        gameMode = ui.selectedMenuItem;
        // Set difficulty based on mode
        if (gameMode === 0) difficulty = 0;       // Exercise = easy
        else if (gameMode === 1) difficulty = 1;  // Circuit = normal
        else difficulty = 2;                       // World Cup = hard

        gameState = GAME_STATES.TEAM_SELECT;
        selectedTeamIndex = 0;
    }
}

// ===== TEAM SELECT =====
function updateTeamSelect() {
    if (Input.isJustPressed('ArrowRight')) {
        selectedTeamIndex = (selectedTeamIndex + 1) % TEAMS.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('ArrowLeft')) {
        selectedTeamIndex = (selectedTeamIndex - 1 + TEAMS.length) % TEAMS.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('ArrowDown')) {
        selectedTeamIndex = (selectedTeamIndex + 3) % TEAMS.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('ArrowUp')) {
        selectedTeamIndex = (selectedTeamIndex - 3 + TEAMS.length) % TEAMS.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('Enter') || Input.isJustPressed('KeyZ')) {
        audio.menuConfirm();
        startMatch(selectedTeamIndex);
    }
    if (Input.isJustPressed('Escape')) {
        gameState = GAME_STATES.TITLE;
    }
}

// ===== START MATCH =====
function startMatch(humanTeamIdx) {
    // Pick an opponent (different from human team)
    opponentTeamIndex = (humanTeamIdx + 1 + Math.floor(Math.random() * (TEAMS.length - 1))) % TEAMS.length;

    const humanTeam = TEAMS[humanTeamIdx];
    const cpuTeam = TEAMS[opponentTeamIndex];

    // Human is always on left side
    playerTeamSide = 0;

    // Create players
    players = [];
    aiControllers = [];

    // Left team (human + AI partner)
    const p0 = new Player(humanTeamIdx, 0, 0, true, humanTeam.stats);
    p0.color1 = humanTeam.color;
    p0.color2 = humanTeam.color2;
    p0.setDefaultPosition(0, true, 0);

    const p1 = new Player(humanTeamIdx, 1, 0, false, humanTeam.stats);
    p1.color1 = humanTeam.color;
    p1.color2 = humanTeam.color2;
    p1.setDefaultPosition(0, false, 1);

    // Right team (CPU)
    const p2 = new Player(opponentTeamIndex, 0, 1, false, cpuTeam.stats);
    p2.color1 = cpuTeam.color;
    p2.color2 = cpuTeam.color2;
    p2.setDefaultPosition(1, false, 0);

    const p3 = new Player(opponentTeamIndex, 1, 1, false, cpuTeam.stats);
    p3.color1 = cpuTeam.color;
    p3.color2 = cpuTeam.color2;
    p3.setDefaultPosition(1, false, 1);

    players = [p0, p1, p2, p3];

    // AI controllers (null for human player)
    aiControllers = [
        null,                              // Human player
        new AIController(Math.min(2, difficulty + 1)),  // Partner AI (slightly better)
        new AIController(difficulty),      // CPU player 1
        new AIController(difficulty)       // CPU player 2
    ];

    // Reset match
    match.reset();
    match.leftTeamName = humanTeam.name;
    match.rightTeamName = cpuTeam.name;
    match.leftTeamIndex = humanTeamIdx;
    match.rightTeamIndex = opponentTeamIndex;
    match.servingTeam = 0;

    // Reset ball
    ball.reset(0);
    serveReady = false;
    serveTossActive = false;
    serveTossTimer = 0;
    serveDelayTimer = 60;

    gameState = GAME_STATES.PLAYING;
}

// ===== PLAYING STATE =====
function updatePlaying() {
    // Pause
    if (Input.isJustPressed('Escape') || Input.isJustPressed('KeyP')) {
        gameState = GAME_STATES.PAUSED;
        ui.pauseSelectedItem = 0;
        return;
    }

    match.update();

    // Handle different rally states
    switch (match.rallyState) {
        case RALLY_STATES.READY_TO_SERVE:
            updateReadyToServe();
            break;
        case RALLY_STATES.SERVE_TOSS:
            updateServeToss();
            break;
        case RALLY_STATES.BALL_IN_PLAY:
            updateBallInPlay();
            break;
        case RALLY_STATES.POINT_SCORED:
            updatePointScored();
            break;
        case RALLY_STATES.MATCH_OVER:
            updateMatchOver();
            break;
    }

    // Update all players
    for (const p of players) {
        p.update();
    }
}

function updateReadyToServe() {
    serveDelayTimer--;
    if (serveDelayTimer > 0) return;

    // Position players for serve
    const servingSide = match.servingTeam;
    const server = getServer(servingSide);

    // Keep ball at server position
    ball.reset(servingSide);

    // Always allow human player to move during serve ready
    for (const p of players) {
        if (p.isHuman) {
            handleHumanInput(p);
        }
    }

    // Human serve: wait for Z press
    if (server.isHuman) {
        if (Input.isJustPressed('KeyZ')) {
            audio.ensureContext();
            startServeToss(server);
        }
    } else {
        // AI auto-serve after delay
        const aiIdx = players.indexOf(server);
        const ai = aiControllers[aiIdx];
        if (ai) {
            const decision = ai.update(server, ball, getPartner(server), match.rallyState);
            if (decision.action || serveDelayTimer <= -30) {
                startServeToss(server);
            }
        }
    }

    // Update AI for non-serving players
    updateAllAI();
}

function startServeToss(server) {
    match.rallyState = RALLY_STATES.SERVE_TOSS;
    serveTossTimer = 0;
    serveTossActive = true;
    audio.serveToss();

    // Ball goes up near server
    ball.x = server.x + (server.facingRight ? 10 : -10);
    ball.y = server.y - 5;
    ball.z = 20;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 2.0;
    ball.active = true;
    ball.landed = false;
}

function updateServeToss() {
    serveTossTimer++;

    // Ball rises during toss
    ball.update();

    // Human input
    const server = getServer(match.servingTeam);

    if (server.isHuman) {
        if (Input.isJustPressed('KeyZ') && serveTossTimer > 5) {
            executeServe(server);
        }
    } else {
        // AI serves at decent timing
        const goodTiming = 20 + Math.floor(Math.random() * 15);
        if (serveTossTimer >= goodTiming) {
            executeServe(server);
        }
    }

    // Ball falls too low — fault
    if (ball.z <= 5 && serveTossTimer > 10) {
        // Fault — point for opponent
        audio.whistle();
        ball.active = false;
        ball.landed = true;
        const servingSide = match.servingTeam;
        match.handleBallLanded(servingSide === 0 ? 'left' : 'right');
        if (match.rallyState === RALLY_STATES.MATCH_OVER) {
            handleMatchEnd();
        }
        return;
    }

    updateAllAI();
}

function executeServe(server) {
    // Determine serve quality based on timing
    const quality = getServeQuality(serveTossTimer);

    server.serve(ball);
    audio.spike();

    if (quality === 'late') {
        // Fault — ball goes into net or out
        ball.vz = 0.5;
        if (server.side === 0) {
            ball.vx = 0.5;
        } else {
            ball.vx = -0.5;
        }
    } else if (quality === 'early') {
        // Weak float serve
        ball.vz = 2.5;
        if (server.side === 0) {
            ball.vx = 1.0;
        } else {
            ball.vx = -1.0;
        }
    }
    // Good timing uses default serve velocities

    match.rallyState = RALLY_STATES.BALL_IN_PLAY;
    match.touchCount = 0;
    match.currentSide = server.side;
    ball.touchCount = 0;
    serveTossActive = false;
}

function getServeQuality(tossTimer) {
    // Good window: 15-35 frames
    if (tossTimer >= 15 && tossTimer <= 35) return 'good';
    if (tossTimer < 15) return 'early';
    return 'late';
}

function updateBallInPlay() {
    // Update ball physics
    ball.update();

    // Check net collision
    if (checkBallNet(ball)) {
        audio.netHit();
        // Stop the ball at the net
        ball.vx = 0;
        ball.vy = 0;
        ball.vz = -1;
        ball.active = false;

        // Ball hit net — point for opponent
        audio.whistle();
        const hitSide = ball.lastTeam;
        match.handleNetHit(hitSide);
        if (match.rallyState === RALLY_STATES.MATCH_OVER) {
            handleMatchEnd();
        }
        return;
    }

    // Check if ball landed
    if (ball.landed) {
        const landResult = checkBallLanded(ball);
        if (landResult) {
            audio.whistle();
            match.handleBallLanded(landResult);
            if (match.rallyState === RALLY_STATES.MATCH_OVER) {
                handleMatchEnd();
            }
            return;
        }
    }

    // Handle human input
    for (const p of players) {
        if (p.isHuman) {
            handleHumanInput(p);
            handleHumanAction(p);
        }
    }

    // Handle AI
    updateAllAI();

    // Check ball-player collisions
    checkCollisions();
}

function handleHumanInput(player) {
    const dir = Input.getP1Direction();
    player.movement(dir.dx, dir.dy);
}

function handleHumanAction(player) {
    if (Input.isJustPressed('KeyZ')) {
        performAction(player);
    }
    if (Input.isJustPressed('KeyX')) {
        player.dive();
    }
}

function performAction(player) {
    if (!ball.active) return;
    if (player.hitCooldown > 0) return;

    const dist = Math.sqrt(
        Math.pow(player.x + 8 - ball.x - 3, 2) +
        Math.pow(player.y - ball.y, 2)
    );

    // Determine context action
    const nearNet = (player.side === 0 && player.x > COURT.NET_X - 30) ||
                    (player.side === 1 && player.x < COURT.NET_X + 30);

    if (dist > 30) {
        // Too far to hit — just jump
        if (nearNet && ball.z > 25) {
            player.block();
        } else {
            player.jump();
        }
        return;
    }

    const partner = getPartner(player);
    const touchCount = match.currentSide === player.side ? match.touchCount : 0;

    if (nearNet && player.z > 0 && ball.z > 30) {
        // At net, in air, ball high — spike!
        player.spike(ball);
        audio.spike();
        registerTouchAndSync(player.side);
    } else if (nearNet && ball.z > 25 && touchCount >= 2) {
        // At net, ball set high — jump and spike
        player.jump();
        // Will spike on next frame when in air
    } else if (nearNet && ball.vx !== 0 &&
               ((player.side === 0 && ball.vx < 0) || (player.side === 1 && ball.vx > 0))) {
        // Ball coming from opponent side near net — block
        player.block();
    } else if (touchCount === 1) {
        // Second touch — set
        player.set(ball);
        audio.hit();
        registerTouchAndSync(player.side);
    } else {
        // First or third touch — bump
        player.bump(ball, partner ? partner.x : player.x + 30, partner ? partner.y : player.y);
        audio.hit();
        registerTouchAndSync(player.side);
    }
}

function registerTouchAndSync(side) {
    const violation = match.registerTouch(side);
    ball.touchCount = match.touchCount;
    ball.lastTeam = side;
    if (violation) {
        // Too many touches — stop the ball
        ball.active = false;
        audio.whistle();
    }
}

function checkCollisions() {
    for (const player of players) {
        if (player.hitCooldown > 0) continue;
        if (!ball.active) continue;
        if (ball.hitCooldown > 0) continue;

        if (checkBallPlayerCollision(ball, player)) {
            // Auto-action for AI or passive collision
            const partner = getPartner(player);
            const touchCount = match.currentSide === player.side ? match.touchCount : 0;
            const nearNet = (player.side === 0 && player.x > COURT.NET_X - 30) ||
                            (player.side === 1 && player.x < COURT.NET_X + 30);

            if (player.state === PLAYER_STATES.BLOCKING) {
                // Block — reflect ball back
                ball.vx = -ball.vx * 0.8;
                ball.vz = Math.abs(ball.vz) * 0.5 + 1;
                ball.lastTeam = player.side;
                ball.hitCooldown = 10;
                player.hitCooldown = 10;
                player.justHitBall = true;
                audio.spike();
                registerTouchAndSync(player.side);
            } else if (player.state === PLAYER_STATES.SPIKING) {
                // Already spiking — handled in performAction
            } else if (player.state === PLAYER_STATES.DIVING) {
                // Dive save — bump
                player.bump(ball,
                    partner ? partner.x : player.x,
                    partner ? partner.y - 20 : player.y - 20);
                audio.hit();
                registerTouchAndSync(player.side);
            } else if (nearNet && player.z > 5 && touchCount >= 2) {
                // At net, in air — spike
                player.spike(ball);
                audio.spike();
                registerTouchAndSync(player.side);
            } else if (touchCount === 1) {
                // Second touch — set
                player.set(ball);
                audio.hit();
                registerTouchAndSync(player.side);
            } else {
                // Default — bump toward partner
                player.bump(ball,
                    partner ? partner.x : player.x + (player.side === 0 ? 30 : -30),
                    partner ? partner.y : player.y);
                audio.hit();
                registerTouchAndSync(player.side);
            }
        }
    }
}

function updateAllAI() {
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const ai = aiControllers[i];
        if (!ai) continue;
        if (player.isHuman) continue;

        const partner = getPartner(player);
        const decision = ai.update(player, ball, partner, match.rallyState);

        // Apply movement
        if (decision.dx !== 0 || decision.dy !== 0) {
            player.movement(decision.dx, decision.dy);
        } else {
            if (player.state === PLAYER_STATES.RUNNING) {
                player.setState(PLAYER_STATES.IDLE);
            }
        }

        // Apply actions
        if (decision.action && ball.active && ball.hitCooldown === 0 && player.hitCooldown === 0) {
            const dist = Math.sqrt(
                Math.pow(player.x + 8 - ball.x - 3, 2) +
                Math.pow(player.y - ball.y, 2)
            );
            const nearNet = (player.side === 0 && player.x > COURT.NET_X - 30) ||
                            (player.side === 1 && player.x < COURT.NET_X + 30);

            if (dist < 25) {
                const touchCount = match.currentSide === player.side ? match.touchCount : 0;

                if (nearNet && player.z > 5 && touchCount >= 2) {
                    player.spike(ball);
                    audio.spike();
                    registerTouchAndSync(player.side);
                } else if (nearNet && touchCount >= 2 && ball.z > 20) {
                    player.jump();
                } else if (touchCount === 1) {
                    player.set(ball);
                    audio.hit();
                    registerTouchAndSync(player.side);
                } else {
                    player.bump(ball,
                        partner ? partner.x : player.x + (player.side === 0 ? 30 : -30),
                        partner ? partner.y : player.y);
                    audio.hit();
                    registerTouchAndSync(player.side);
                }
            } else if (dist < 35) {
                // Close but not quite — jump or move closer
                if (nearNet && ball.z > 20) {
                    player.jump();
                }
            }
        }

        if (decision.dive) {
            player.dive();
        }
    }
}

function updatePointScored() {
    match.pointDelay--;

    // Set player states
    for (const p of players) {
        if (p.side === match.lastPointWinner) {
            if (p.state !== PLAYER_STATES.CELEBRATING) {
                p.setState(PLAYER_STATES.CELEBRATING);
            }
        } else {
            if (p.state !== PLAYER_STATES.DEFEATED) {
                p.setState(PLAYER_STATES.DEFEATED);
            }
        }
    }

    if (match.pointDelay <= 0) {
        audio.cheer();
        prepareNextRally();
    }
}

function updateMatchOver() {
    // Set player states
    for (const p of players) {
        if (p.side === match.winner) {
            if (p.state !== PLAYER_STATES.CELEBRATING) {
                p.setState(PLAYER_STATES.CELEBRATING);
            }
        } else {
            if (p.state !== PLAYER_STATES.DEFEATED) {
                p.setState(PLAYER_STATES.DEFEATED);
            }
        }
    }

    // Wait for some time then show result
    if (match.stateTimer > 120) {
        gameState = GAME_STATES.RESULT;
    }
}

function handleMatchEnd() {
    // Match is over
    for (const p of players) {
        if (p.side === match.winner) {
            p.setState(PLAYER_STATES.CELEBRATING);
        } else {
            p.setState(PLAYER_STATES.DEFEATED);
        }
    }
    audio.cheer();
}

function prepareNextRally() {
    match.startNextRally();

    // Reset ball
    ball.reset(match.servingTeam);

    // Reset players to default positions
    const servingSide = match.servingTeam;
    for (const p of players) {
        const isServer = p.side === servingSide && p.playerIndex === 0;
        p.setDefaultPosition(p.side, isServer, p.playerIndex);
    }

    serveDelayTimer = 60;
    serveTossActive = false;
    serveTossTimer = 0;
}

// ===== PAUSED =====
function updatePaused() {
    if (Input.isJustPressed('Escape') || Input.isJustPressed('KeyP')) {
        gameState = GAME_STATES.PLAYING;
        return;
    }

    if (Input.isJustPressed('ArrowUp')) {
        ui.pauseSelectedItem = (ui.pauseSelectedItem - 1 + ui.pauseItems.length) % ui.pauseItems.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('ArrowDown')) {
        ui.pauseSelectedItem = (ui.pauseSelectedItem + 1) % ui.pauseItems.length;
        audio.menuSelect();
    }
    if (Input.isJustPressed('Enter') || Input.isJustPressed('KeyZ')) {
        if (ui.pauseSelectedItem === 0) {
            // Resume
            gameState = GAME_STATES.PLAYING;
        } else {
            // Quit
            gameState = GAME_STATES.TITLE;
        }
        audio.menuConfirm();
    }
}

// ===== RESULT =====
function updateResult() {
    if (Input.isJustPressed('Enter') || Input.isJustPressed('KeyZ')) {
        audio.menuConfirm();
        gameState = GAME_STATES.TITLE;
    }
}

// ===== HELPERS =====
function getServer(side) {
    return players.find(p => p.side === side && p.playerIndex === 0);
}

function getPartner(player) {
    return players.find(p => p.side === player.side && p.playerIndex !== player.playerIndex);
}

// ===== RENDER =====
function render() {
    renderer.clear();

    switch (gameState) {
        case GAME_STATES.TITLE:
            ui.drawTitle(renderer.ctx);
            break;
        case GAME_STATES.TEAM_SELECT:
            ui.drawTeamSelect(renderer.ctx, selectedTeamIndex);
            break;
        case GAME_STATES.PLAYING:
            renderer.drawGameplay(players, ball, match, ui);
            break;
        case GAME_STATES.PAUSED:
            renderer.drawGameplay(players, ball, match, ui);
            ui.drawPause(renderer.ctx);
            break;
        case GAME_STATES.RESULT:
            renderer.drawGameplay(players, ball, match, ui);
            ui.drawResult(renderer.ctx, match);
            break;
    }
}

// ===== START =====
window.addEventListener('DOMContentLoaded', init);
