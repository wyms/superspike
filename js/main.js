// main.js — Game loop, state machine, entry point
// Super Spike V'Ball — NES-faithful recreation
// Horizontal net, top-down angled view, Kunio-kun style sprites

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
    TOURNAMENT_BRACKET: 'TOURNAMENT_BRACKET',
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
let players = [];
let aiControllers = [];
let selectedTeamIndex = 0;
let opponentTeamIndex = 1;
let playerTeamSide = 0;     // 0 = near (bottom)
let gameMode = 0;            // 0 = exercise, 1 = circuit, 2 = world cup
let difficulty = 1;

// Serve state
let serveTossTimer = 0;
let serveTossActive = false;
let serveDelayTimer = 0;

// Tournament state
let tournamentRound = 0;
let tournamentOpponents = [];
let tournamentWins = 0;
let titleMusicStarted = false;
let gameMusicStarted = false;

// ===== INITIALIZATION =====
function init() {
    renderer = new Renderer();
    ui = new UI();
    match = new Match();
    ball = new Ball();

    let lastTime = performance.now();
    const FRAME_TIME = 1000 / 60;
    let accumulator = 0;

    function gameLoop(currentTime) {
        const deltaTime = Math.min(currentTime - lastTime, 200);
        lastTime = currentTime;
        accumulator += deltaTime;

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
        case GAME_STATES.TOURNAMENT_BRACKET:
            updateTournamentBracket();
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
    // Start title music
    if (!titleMusicStarted) {
        audio.ensureContext();
        audio.playTitleMusic();
        titleMusicStarted = true;
    }

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
        if (gameMode === 0) difficulty = 0;
        else if (gameMode === 1) difficulty = 1;
        else difficulty = 2;

        audio.stopMusic();
        titleMusicStarted = false;
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

        if (gameMode === 0) {
            // Exercise: single match
            startMatch(selectedTeamIndex, getRandomOpponent(selectedTeamIndex));
        } else {
            // Tournament: set up bracket
            setupTournament(selectedTeamIndex);
            gameState = GAME_STATES.TOURNAMENT_BRACKET;
        }
    }
    if (Input.isJustPressed('Escape')) {
        gameState = GAME_STATES.TITLE;
    }
}

// ===== TOURNAMENT =====
function setupTournament(humanTeamIdx) {
    tournamentRound = 0;
    tournamentWins = 0;
    const totalRounds = gameMode === 1 ? 4 : 6;

    // Generate opponent list (avoid picking human team)
    tournamentOpponents = [];
    const available = [];
    for (let i = 0; i < TEAMS.length; i++) {
        if (i !== humanTeamIdx) available.push(i);
    }
    // Shuffle
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }
    for (let r = 0; r < totalRounds; r++) {
        tournamentOpponents.push(TEAMS[available[r % available.length]].name);
    }
}

function updateTournamentBracket() {
    if (Input.isJustPressed('Enter') || Input.isJustPressed('KeyZ')) {
        audio.menuConfirm();
        // Start next match in tournament
        const oppName = tournamentOpponents[tournamentRound];
        const oppIdx = TEAMS.findIndex(t => t.name === oppName);
        startMatch(selectedTeamIndex, oppIdx >= 0 ? oppIdx : getRandomOpponent(selectedTeamIndex));
    }
    if (Input.isJustPressed('Escape')) {
        gameState = GAME_STATES.TITLE;
    }
}

function getRandomOpponent(humanTeamIdx) {
    let opp;
    do {
        opp = Math.floor(Math.random() * TEAMS.length);
    } while (opp === humanTeamIdx);
    return opp;
}

// ===== START MATCH =====
function startMatch(humanTeamIdx, oppTeamIdx) {
    opponentTeamIndex = oppTeamIdx;
    const humanTeam = TEAMS[humanTeamIdx];
    const cpuTeam = TEAMS[opponentTeamIndex];

    // Human always on near (bottom) side (side 0)
    playerTeamSide = 0;

    players = [];
    aiControllers = [];

    // Near team (human + AI partner) — side 0
    const p0 = new Player(humanTeamIdx, 0, 0, true, humanTeam.stats);
    p0.color1 = humanTeam.color;
    p0.color2 = humanTeam.color2;
    p0.skin = humanTeam.players[0].skin;
    p0.hairColor = humanTeam.players[0].hair;
    p0.hairStyle = humanTeam.players[0].hairStyle;
    p0.setDefaultPosition(0, true, 0);

    const p1 = new Player(humanTeamIdx, 1, 0, false, humanTeam.stats);
    p1.color1 = humanTeam.color;
    p1.color2 = humanTeam.color2;
    p1.skin = humanTeam.players[1].skin;
    p1.hairColor = humanTeam.players[1].hair;
    p1.hairStyle = humanTeam.players[1].hairStyle;
    p1.setDefaultPosition(0, false, 1);

    // Far team (CPU) — side 1
    const p2 = new Player(opponentTeamIndex, 0, 1, false, cpuTeam.stats);
    p2.color1 = cpuTeam.color;
    p2.color2 = cpuTeam.color2;
    p2.skin = cpuTeam.players[0].skin;
    p2.hairColor = cpuTeam.players[0].hair;
    p2.hairStyle = cpuTeam.players[0].hairStyle;
    p2.setDefaultPosition(1, false, 0);

    const p3 = new Player(opponentTeamIndex, 1, 1, false, cpuTeam.stats);
    p3.color1 = cpuTeam.color;
    p3.color2 = cpuTeam.color2;
    p3.skin = cpuTeam.players[1].skin;
    p3.hairColor = cpuTeam.players[1].hair;
    p3.hairStyle = cpuTeam.players[1].hairStyle;
    p3.setDefaultPosition(1, false, 1);

    players = [p0, p1, p2, p3];

    // AI: partner is slightly better, opponents scale with difficulty
    const partnerDiff = Math.min(2, difficulty + 1);
    const oppDiff = gameMode > 0 ? Math.min(2, difficulty + Math.floor(tournamentRound / 2)) : difficulty;
    aiControllers = [
        null,                            // Human
        new AIController(partnerDiff),   // Partner
        new AIController(oppDiff),       // CPU 1
        new AIController(oppDiff)        // CPU 2
    ];

    match.reset();
    match.nearTeamName = humanTeam.name;
    match.farTeamName = cpuTeam.name;
    match.nearTeamIndex = humanTeamIdx;
    match.farTeamIndex = opponentTeamIndex;
    match.servingTeam = 0;
    match.gameMode = gameMode;

    ball.reset(0);
    serveTossActive = false;
    serveTossTimer = 0;
    serveDelayTimer = 60;

    gameMusicStarted = false;
    gameState = GAME_STATES.PLAYING;
}

// ===== PLAYING STATE =====
function updatePlaying() {
    // Start game music
    if (!gameMusicStarted) {
        audio.ensureContext();
        audio.playGameMusic();
        gameMusicStarted = true;
    }

    // Pause
    if (Input.isJustPressed('Escape') || Input.isJustPressed('KeyP')) {
        gameState = GAME_STATES.PAUSED;
        ui.pauseSelectedItem = 0;
        return;
    }

    match.update();

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

    const servingSide = match.servingTeam;
    const server = getServer(servingSide);

    ball.reset(servingSide);

    // Allow human movement during serve ready
    for (const p of players) {
        if (p.isHuman) {
            handleHumanInput(p);
        }
    }

    // Human serve: press Z
    if (server.isHuman) {
        if (Input.isJustPressed('KeyZ')) {
            audio.ensureContext();
            startServeToss(server);
        }
    } else {
        // AI auto-serve
        const aiIdx = players.indexOf(server);
        const ai = aiControllers[aiIdx];
        if (ai) {
            const decision = ai.update(server, ball, getPartner(server), match.rallyState, 0);
            if (decision.action || serveDelayTimer <= -30) {
                startServeToss(server);
            }
        }
    }

    updateAllAI();
}

function startServeToss(server) {
    match.rallyState = RALLY_STATES.SERVE_TOSS;
    serveTossTimer = 0;
    serveTossActive = true;
    audio.serveToss();

    // Ball toss position near server
    ball.x = server.x + 4;
    ball.y = server.y + (server.side === 0 ? -8 : 8);
    ball.z = 20;
    ball.vx = 0;
    ball.vy = 0;
    ball.vz = 2.0;
    ball.active = true;
    ball.landed = false;
}

function updateServeToss() {
    serveTossTimer++;
    ball.update();

    const server = getServer(match.servingTeam);

    if (server.isHuman) {
        if (Input.isJustPressed('KeyZ') && serveTossTimer > 5) {
            executeServe(server);
        }
    } else {
        const goodTiming = 18 + Math.floor(Math.random() * 12);
        if (serveTossTimer >= goodTiming) {
            executeServe(server);
        }
    }

    // Ball falls too low — fault
    if (ball.z <= 5 && serveTossTimer > 10) {
        audio.fault();
        ball.active = false;
        ball.landed = true;
        const servingSide = match.servingTeam;
        // Fault counts as landing on server's side
        match.handleBallLanded(servingSide === 0 ? 'near' : 'far');
        if (match.rallyState === RALLY_STATES.MATCH_OVER) {
            handleMatchEnd();
        }
        return;
    }

    updateAllAI();
}

function executeServe(server) {
    const quality = getServeQuality(serveTossTimer);

    server.serve(ball);

    if (quality === 'good') {
        audio.spike();
    } else if (quality === 'late') {
        audio.fault();
        // Weak/fault serve
        ball.vz = 0.5;
        ball.vy *= 0.3;
    } else {
        audio.hit();
        // Early: float serve
        ball.vz = 2.5;
        ball.vy *= 0.6;
    }

    match.rallyState = RALLY_STATES.BALL_IN_PLAY;
    match.touchCount = 0;
    match.currentSide = server.side;
    ball.touchCount = 0;
    serveTossActive = false;
}

function getServeQuality(tossTimer) {
    if (tossTimer >= 15 && tossTimer <= 35) return 'good';
    if (tossTimer < 15) return 'early';
    return 'late';
}

function updateBallInPlay() {
    ball.update();

    // Check net collision
    if (checkBallNet(ball)) {
        audio.netHit();
        ball.vx = 0;
        ball.vy = 0;
        ball.vz = -1;
        ball.active = false;

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

    // Human input
    for (const p of players) {
        if (p.isHuman) {
            handleHumanInput(p);
            handleHumanAction(p);
        }
    }

    // AI
    updateAllAI();

    // Collisions
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
        audio.diveSand();
    }
}

function performAction(player) {
    if (!ball.active) return;
    if (player.hitCooldown > 0) return;

    const dist = Math.sqrt(
        Math.pow(player.x + 6 - ball.x - 3, 2) +
        Math.pow(player.y - ball.y, 2)
    );

    const nearNet = player.isNearNet();

    if (dist > 28) {
        // Too far to hit
        if (nearNet && ball.z > 25) {
            player.block();
        } else {
            player.jump();
        }
        return;
    }

    const partner = getPartner(player);
    const touchCount = match.currentSide === player.side ? match.touchCount : 0;

    if (nearNet && player.z > 0 && ball.z > 25) {
        // Spike!
        player.spike(ball);
        if (player.powerMeter >= 100) {
            audio.powerSpike();
        } else {
            audio.spike();
        }
        registerTouchAndSync(player.side);
    } else if (nearNet && ball.z > 20 && touchCount >= 2) {
        // Jump for spike
        player.jump();
    } else if (nearNet && ball.vy !== 0 &&
               ((player.side === 0 && ball.vy < 0) || (player.side === 1 && ball.vy > 0))) {
        // Ball coming from opponent side — block
        player.block();
    } else if (touchCount === 1) {
        // Set
        player.set(ball);
        audio.setSound();
        registerTouchAndSync(player.side);
    } else {
        // Bump
        player.bump(ball, partner ? partner.x : player.x + 20, partner ? partner.y : player.y);
        audio.hit();
        registerTouchAndSync(player.side);
    }
}

function registerTouchAndSync(side) {
    const violation = match.registerTouch(side);
    ball.touchCount = match.touchCount;
    ball.lastTeam = side;
    if (violation) {
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
            const partner = getPartner(player);
            const touchCount = match.currentSide === player.side ? match.touchCount : 0;
            const nearNet = player.isNearNet();

            if (player.state === PLAYER_STATES.BLOCKING) {
                // Block
                ball.vy = -ball.vy * 0.8;
                ball.vx *= 0.5;
                ball.vz = Math.abs(ball.vz) * 0.5 + 1;
                ball.lastTeam = player.side;
                ball.hitCooldown = 10;
                player.hitCooldown = 10;
                player.justHitBall = true;
                ball.spikeTrail = false;
                ball.isPowerSpike = false;
                audio.block();
                registerTouchAndSync(player.side);
            } else if (player.state === PLAYER_STATES.SPIKING) {
                // Already handled in performAction
            } else if (player.state === PLAYER_STATES.DIVING) {
                // Dive save
                player.bump(ball,
                    partner ? partner.x : player.x,
                    partner ? partner.y + (player.side === 0 ? -20 : 20) : player.y);
                audio.hit();
                registerTouchAndSync(player.side);
            } else if (nearNet && player.z > 5 && touchCount >= 2) {
                // Spike
                player.spike(ball);
                if (player.powerMeter >= 100) {
                    audio.powerSpike();
                } else {
                    audio.spike();
                }
                registerTouchAndSync(player.side);
            } else if (touchCount === 1) {
                // Set
                player.set(ball);
                audio.setSound();
                registerTouchAndSync(player.side);
            } else {
                // Bump toward partner
                const targetX = partner ? partner.x : player.x + (player.facingRight ? 20 : -20);
                const targetY = partner ? partner.y : player.y + (player.side === 0 ? -20 : 20);
                player.bump(ball, targetX, targetY);
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
        const tc = match.currentSide === player.side ? match.touchCount : 0;
        const decision = ai.update(player, ball, partner, match.rallyState, tc);

        // Movement
        if (decision.dx !== 0 || decision.dy !== 0) {
            player.movement(decision.dx, decision.dy);
        } else {
            if (player.state === PLAYER_STATES.RUNNING) {
                player.setState(PLAYER_STATES.IDLE);
            }
        }

        // Actions
        if (decision.action && ball.active && ball.hitCooldown === 0 && player.hitCooldown === 0) {
            const dist = Math.sqrt(
                Math.pow(player.x + 6 - ball.x - 3, 2) +
                Math.pow(player.y - ball.y, 2)
            );
            const nearNet = player.isNearNet();

            if (dist < 22) {
                if (nearNet && player.z > 5 && tc >= 2) {
                    player.spike(ball);
                    if (player.powerMeter >= 100) {
                        audio.powerSpike();
                    } else {
                        audio.spike();
                    }
                    registerTouchAndSync(player.side);
                } else if (nearNet && tc >= 2 && ball.z > 18) {
                    player.jump();
                } else if (nearNet && player.state === PLAYER_STATES.BLOCKING) {
                    // Already blocking
                } else if (tc === 1) {
                    player.set(ball);
                    audio.setSound();
                    registerTouchAndSync(player.side);
                } else {
                    const targetX = partner ? partner.x : player.x + (player.side === 0 ? 20 : -20);
                    const targetY = partner ? partner.y : player.y + (player.side === 0 ? -20 : 20);
                    player.bump(ball, targetX, targetY);
                    audio.hit();
                    registerTouchAndSync(player.side);
                }
            } else if (dist < 30 && nearNet && ball.z > 18) {
                player.jump();
            }
        }

        if (decision.dive) {
            player.dive();
            audio.diveSand();
        }
    }
}

function updatePointScored() {
    match.pointDelay--;

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

    if (match.stateTimer > 120) {
        audio.stopMusic();
        gameMusicStarted = false;
        gameState = GAME_STATES.RESULT;

        // Play appropriate jingle
        if (match.winner === 0) {
            audio.playVictoryJingle();
        } else {
            audio.playDefeatJingle();
        }
    }
}

function handleMatchEnd() {
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
    ball.reset(match.servingTeam);

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
            gameState = GAME_STATES.PLAYING;
        } else {
            audio.stopMusic();
            gameMusicStarted = false;
            gameState = GAME_STATES.TITLE;
        }
        audio.menuConfirm();
    }
}

// ===== RESULT =====
function updateResult() {
    if (Input.isJustPressed('Enter') || Input.isJustPressed('KeyZ')) {
        audio.menuConfirm();
        audio.stopMusic();

        if (gameMode === 0) {
            // Exercise: back to title
            gameState = GAME_STATES.TITLE;
        } else {
            // Tournament mode
            if (match.winner === 0) {
                // Won this round
                tournamentWins++;
                tournamentRound++;
                const totalRounds = gameMode === 1 ? 4 : 6;
                if (tournamentRound >= totalRounds) {
                    // Tournament won!
                    gameState = GAME_STATES.TITLE;
                } else {
                    // Next round
                    gameState = GAME_STATES.TOURNAMENT_BRACKET;
                }
            } else {
                // Lost - tournament over
                gameState = GAME_STATES.TITLE;
            }
        }
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
        case GAME_STATES.TOURNAMENT_BRACKET:
            ui.drawTournamentBracket(renderer.ctx, gameMode, tournamentRound,
                                     tournamentOpponents, tournamentWins);
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
