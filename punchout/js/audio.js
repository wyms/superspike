// audio.js — Web Audio API procedural sounds

let ctx = null;
let masterGain = null;
let muted = false;

export function initAudio() {
    try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(ctx.destination);
    } catch(e) {
        console.warn('Web Audio not available');
    }
}

export function resumeAudio() {
    if (ctx && ctx.state === 'suspended') {
        ctx.resume();
    }
}

export function toggleMute() {
    muted = !muted;
    if (masterGain) {
        masterGain.gain.value = muted ? 0 : 0.3;
    }
    return muted;
}

function noise(duration, volume = 0.3) {
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * volume;
    }
    return buffer;
}

function playTone(freq, duration, type = 'square', volume = 0.3, detune = 0) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.2) {
    if (!ctx) return;
    const buf = noise(duration, 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(gain);
    gain.connect(masterGain);
    src.start(ctx.currentTime);
}

export function punch() {
    playNoise(0.05, 0.15);
    playTone(200, 0.05, 'square', 0.1);
}

export function punchHit() {
    playNoise(0.1, 0.4);
    playTone(150, 0.08, 'square', 0.2);
    playTone(80, 0.12, 'triangle', 0.15);
}

export function punchMiss() {
    playNoise(0.08, 0.08);
    playTone(400, 0.1, 'sine', 0.05);
}

export function dodge() {
    playNoise(0.04, 0.06);
    playTone(300, 0.06, 'sine', 0.08);
}

export function block() {
    playNoise(0.06, 0.15);
    playTone(100, 0.08, 'square', 0.1);
}

export function knockdown() {
    playNoise(0.3, 0.35);
    playTone(60, 0.4, 'triangle', 0.25);
    playTone(40, 0.5, 'square', 0.15);
    // crowd gasp
    setTimeout(() => playNoise(0.5, 0.2), 200);
}

export function bellRing() {
    if (!ctx) return;
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            playTone(800, 0.3, 'sine', 0.2);
            playTone(1200, 0.2, 'sine', 0.1);
        }, i * 250);
    }
}

export function crowdCheer() {
    if (!ctx) return;
    for (let i = 0; i < 5; i++) {
        setTimeout(() => playNoise(0.3, 0.15), i * 100);
    }
}

export function crowdBoo() {
    if (!ctx) return;
    playNoise(0.8, 0.1);
    playTone(80, 0.6, 'sawtooth', 0.05);
}

export function starEarned() {
    playTone(523, 0.08, 'square', 0.15);
    setTimeout(() => playTone(659, 0.08, 'square', 0.15), 80);
    setTimeout(() => playTone(784, 0.12, 'square', 0.2), 160);
}

export function ko() {
    playTone(200, 0.15, 'square', 0.2);
    setTimeout(() => playTone(150, 0.15, 'square', 0.2), 150);
    setTimeout(() => playTone(100, 0.4, 'square', 0.25), 300);
    setTimeout(() => playNoise(0.5, 0.3), 300);
}

export function menuSelect() {
    playTone(660, 0.06, 'square', 0.12);
}

export function menuMove() {
    playTone(440, 0.03, 'square', 0.08);
}

export function countSound() {
    playTone(600, 0.08, 'square', 0.15);
}

export function getUp() {
    playTone(300, 0.05, 'square', 0.1);
    setTimeout(() => playTone(400, 0.05, 'square', 0.1), 60);
    setTimeout(() => playTone(500, 0.08, 'square', 0.12), 120);
}

export function roundAnnounce() {
    playTone(440, 0.15, 'square', 0.15);
    setTimeout(() => playTone(550, 0.15, 'square', 0.15), 200);
    setTimeout(() => playTone(660, 0.25, 'square', 0.2), 400);
}
