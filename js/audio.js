// audio.js — Web Audio API procedural sound effects + chiptune music
// NES-authentic sounds using square waves, noise, and triangle waves

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
        this.musicPlaying = false;
        this.currentMusic = null;  // for stopping music
        this.musicGain = null;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.value = 0.08;
            this.musicGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not available:', e);
        }
    }

    ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopMusic();
        }
        return this.muted;
    }

    // --- SOUND EFFECTS ---

    // Ball bump (mid pop)
    hit() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(700, t);
        osc.frequency.exponentialRampToValueAtTime(250, t + 0.06);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
    }

    // Ball set (higher pitch pok)
    setSound() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1000, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
        osc.start(t);
        osc.stop(t + 0.07);
    }

    // SPIKE — loud impact with noise burst
    spike() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;

        // Noise burst for impact
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.06);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 0.5);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        // Low frequency punch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
        gain.gain.setValueAtTime(0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        noise.start(t);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // Power spike — even louder, with extra crack
    powerSpike() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        this.spike();
        const t = this.ctx.currentTime + 0.02;
        // Extra high crack
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1500, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    // Referee whistle (two short blasts)
    whistle() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;

        for (let i = 0; i < 2; i++) {
            const offset = i * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2800, t + offset);
            osc.frequency.setValueAtTime(3200, t + offset + 0.05);
            gain.gain.setValueAtTime(0.2, t + offset);
            gain.gain.setValueAtTime(0.2, t + offset + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);
            osc.start(t + offset);
            osc.stop(t + offset + 0.12);
        }
    }

    // Single whistle blast (match start)
    whistleSingle() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(3000, t);
        osc.frequency.setValueAtTime(3400, t + 0.1);
        osc.frequency.setValueAtTime(3000, t + 0.2);
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.setValueAtTime(0.22, t + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
    }

    // Crowd cheer
    cheer() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const envelope = Math.sin(Math.PI * i / bufferSize);
            data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 0.5;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, t);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }

    // Net hit — dull thud
    netHit() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    // Dive/sand hit
    diveSand() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.3;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
    }

    // Block sound
    block() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
    }

    // Menu select blip
    menuSelect() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.setValueAtTime(880, t + 0.03);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc.start(t);
        osc.stop(t + 0.06);
    }

    // Menu confirm
    menuConfirm() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(660, t + 0.04);
        osc.frequency.setValueAtTime(880, t + 0.08);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.setValueAtTime(0.12, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    // Serve toss
    serveToss() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.12);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    // Fault/out — lower tone
    fault() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.setValueAtTime(150, t + 0.1);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
    }

    // --- MUSIC ---

    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.forEach(n => {
                    try { n.stop(); } catch(e) {}
                });
            } catch(e) {}
            this.currentMusic = null;
        }
        this.musicPlaying = false;
    }

    // Title screen music — upbeat chiptune loop
    playTitleMusic() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        this.stopMusic();

        const nodes = [];
        const t = this.ctx.currentTime;
        const bpm = 140;
        const beat = 60 / bpm;
        const totalBeats = 16;
        const loopDuration = totalBeats * beat;

        // Melody (square wave)
        const melody = [
            // beat, freq, duration in beats
            [0, 523, 0.5], [0.5, 659, 0.5], [1, 784, 1],
            [2, 659, 0.5], [2.5, 784, 0.5], [3, 1047, 1],
            [4, 784, 0.5], [4.5, 659, 0.5], [5, 523, 0.5], [5.5, 659, 0.5],
            [6, 784, 1], [7, 659, 1],
            [8, 523, 0.5], [8.5, 587, 0.5], [9, 659, 1],
            [10, 784, 0.5], [10.5, 659, 0.5], [11, 523, 1],
            [12, 440, 0.5], [12.5, 523, 0.5], [13, 659, 1],
            [14, 523, 1], [15, 440, 1]
        ];

        // Bass (triangle wave)
        const bass = [
            [0, 131, 2], [2, 165, 2], [4, 196, 2], [6, 165, 2],
            [8, 131, 2], [10, 175, 2], [12, 110, 2], [14, 131, 2]
        ];

        // Create melody with looping
        for (let loop = 0; loop < 30; loop++) { // ~45 seconds of music
            const loopStart = t + loop * loopDuration;

            for (const [b, freq, dur] of melody) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.musicGain);
                osc.type = 'square';
                osc.frequency.value = freq;
                const noteStart = loopStart + b * beat;
                const noteEnd = noteStart + dur * beat * 0.9;
                gain.gain.setValueAtTime(0.15, noteStart);
                gain.gain.setValueAtTime(0.15, noteEnd - 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
                osc.start(noteStart);
                osc.stop(noteEnd);
                nodes.push(osc);
            }

            for (const [b, freq, dur] of bass) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.musicGain);
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const noteStart = loopStart + b * beat;
                const noteEnd = noteStart + dur * beat * 0.95;
                gain.gain.setValueAtTime(0.2, noteStart);
                gain.gain.setValueAtTime(0.2, noteEnd - 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
                osc.start(noteStart);
                osc.stop(noteEnd);
                nodes.push(osc);
            }
        }

        this.currentMusic = nodes;
        this.musicPlaying = true;
    }

    // In-game music — faster paced
    playGameMusic() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        this.stopMusic();

        const nodes = [];
        const t = this.ctx.currentTime;
        const bpm = 160;
        const beat = 60 / bpm;
        const totalBeats = 8;
        const loopDuration = totalBeats * beat;

        const melody = [
            [0, 440, 0.5], [0.5, 523, 0.5], [1, 659, 0.5], [1.5, 784, 0.5],
            [2, 659, 0.5], [2.5, 523, 0.5], [3, 440, 1],
            [4, 523, 0.5], [4.5, 659, 0.5], [5, 784, 0.5], [5.5, 880, 0.5],
            [6, 784, 0.5], [6.5, 659, 0.5], [7, 523, 1]
        ];

        const bass = [
            [0, 110, 1], [1, 131, 1], [2, 165, 1], [3, 131, 1],
            [4, 131, 1], [5, 165, 1], [6, 196, 1], [7, 165, 1]
        ];

        for (let loop = 0; loop < 80; loop++) {
            const loopStart = t + loop * loopDuration;

            for (const [b, freq, dur] of melody) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.musicGain);
                osc.type = 'square';
                osc.frequency.value = freq;
                const noteStart = loopStart + b * beat;
                const noteEnd = noteStart + dur * beat * 0.85;
                gain.gain.setValueAtTime(0.1, noteStart);
                gain.gain.setValueAtTime(0.1, noteEnd - 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
                osc.start(noteStart);
                osc.stop(noteEnd);
                nodes.push(osc);
            }

            for (const [b, freq, dur] of bass) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.musicGain);
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const noteStart = loopStart + b * beat;
                const noteEnd = noteStart + dur * beat * 0.9;
                gain.gain.setValueAtTime(0.12, noteStart);
                gain.gain.setValueAtTime(0.12, noteEnd - 0.01);
                gain.gain.exponentialRampToValueAtTime(0.001, noteEnd);
                osc.start(noteStart);
                osc.stop(noteEnd);
                nodes.push(osc);
            }
        }

        this.currentMusic = nodes;
        this.musicPlaying = true;
    }

    // Victory jingle
    playVictoryJingle() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        this.stopMusic();

        const t = this.ctx.currentTime;
        const notes = [
            [0, 523, 0.15], [0.15, 659, 0.15], [0.3, 784, 0.15],
            [0.5, 1047, 0.3], [0.85, 784, 0.15], [1.0, 1047, 0.5]
        ];

        const nodes = [];
        for (const [offset, freq, dur] of notes) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.15, t + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
            osc.start(t + offset);
            osc.stop(t + offset + dur);
            nodes.push(osc);
        }
        this.currentMusic = nodes;
    }

    // Defeat jingle
    playDefeatJingle() {
        this.ensureContext();
        if (this.muted || !this.ctx) return;
        this.stopMusic();

        const t = this.ctx.currentTime;
        const notes = [
            [0, 440, 0.2], [0.2, 370, 0.2], [0.4, 330, 0.2],
            [0.7, 262, 0.5]
        ];

        const nodes = [];
        for (const [offset, freq, dur] of notes) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.12, t + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, t + offset + dur);
            osc.start(t + offset);
            osc.stop(t + offset + dur);
            nodes.push(osc);
        }
        this.currentMusic = nodes;
    }
}

// Singleton
export const audio = new AudioManager();
