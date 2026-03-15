// career.js — Career mode / circuit progression

import { OPPONENTS } from './opponents.js';

export const CIRCUITS = {
    MINOR: {
        name: 'Minor Circuit',
        opponents: [0, 1, 2], // Glass Joe, Von Kaiser, Piston Honda (title)
        titleFight: 2
    },
    MAJOR: {
        name: 'Major Circuit',
        opponents: [3, 4, 5], // Don Flamenco, King Hippo, Great Tiger (title)
        titleFight: 5
    },
    WORLD: {
        name: 'World Circuit',
        opponents: [6, 7, 8, 9], // Bald Bull, Soda Pop, Mr Sandman, Super Macho Man (title)
        titleFight: 9
    },
    DREAM: {
        name: 'Dream Fight',
        opponents: [10], // Mike Tyson
        titleFight: 10
    }
};

export class Career {
    constructor() {
        this.reset();
    }

    reset() {
        this.currentOpponentIndex = 0;
        this.wins = 0;
        this.losses = 0;
        this.kos = 0;
        this.tkos = 0;
        this.currentCircuit = 'MINOR';
        this.unlockedOpponents = [0]; // Start with Glass Joe unlocked
        this.defeatedOpponents = [];
        this.circuitsWon = [];
    }

    getCurrentOpponent() {
        return OPPONENTS[this.currentOpponentIndex];
    }

    getCurrentCircuitName() {
        return CIRCUITS[this.currentCircuit].name;
    }

    isTitleFight() {
        return CIRCUITS[this.currentCircuit].titleFight === this.currentOpponentIndex;
    }

    recordWin(resultType) {
        this.wins++;
        if (resultType === 'KO') this.kos++;
        if (resultType === 'TKO') this.tkos++;

        if (!this.defeatedOpponents.includes(this.currentOpponentIndex)) {
            this.defeatedOpponents.push(this.currentOpponentIndex);
        }

        // Check if this was a title fight
        if (this.isTitleFight()) {
            if (!this.circuitsWon.includes(this.currentCircuit)) {
                this.circuitsWon.push(this.currentCircuit);
            }
        }

        // Advance to next opponent
        this.advanceToNext();
    }

    recordLoss() {
        this.losses++;
        // On loss, can retry the same opponent
    }

    advanceToNext() {
        const circuit = CIRCUITS[this.currentCircuit];
        const indexInCircuit = circuit.opponents.indexOf(this.currentOpponentIndex);

        if (indexInCircuit < circuit.opponents.length - 1) {
            // Next opponent in circuit
            this.currentOpponentIndex = circuit.opponents[indexInCircuit + 1];
        } else {
            // Advance to next circuit
            if (this.currentCircuit === 'MINOR') {
                this.currentCircuit = 'MAJOR';
                this.currentOpponentIndex = CIRCUITS.MAJOR.opponents[0];
            } else if (this.currentCircuit === 'MAJOR') {
                this.currentCircuit = 'WORLD';
                this.currentOpponentIndex = CIRCUITS.WORLD.opponents[0];
            } else if (this.currentCircuit === 'WORLD') {
                this.currentCircuit = 'DREAM';
                this.currentOpponentIndex = CIRCUITS.DREAM.opponents[0];
            } else {
                // Beat the game! Stay at Tyson
                this.currentOpponentIndex = 10;
            }
        }

        // Unlock the opponent
        if (!this.unlockedOpponents.includes(this.currentOpponentIndex)) {
            this.unlockedOpponents.push(this.currentOpponentIndex);
        }
    }

    canSelectOpponent(index) {
        return this.unlockedOpponents.includes(index) || this.defeatedOpponents.includes(index);
    }

    selectOpponent(index) {
        if (this.canSelectOpponent(index)) {
            this.currentOpponentIndex = index;
            // Set circuit based on opponent
            const opp = OPPONENTS[index];
            for (const [key, circuit] of Object.entries(CIRCUITS)) {
                if (circuit.opponents.includes(index)) {
                    this.currentCircuit = key;
                    break;
                }
            }
            return true;
        }
        return false;
    }

    hasWonGame() {
        return this.defeatedOpponents.includes(10); // Beat Tyson
    }

    getRecord() {
        return `${this.wins}-${this.losses}`;
    }

    // Save to localStorage
    save() {
        try {
            const data = {
                currentOpponentIndex: this.currentOpponentIndex,
                wins: this.wins,
                losses: this.losses,
                kos: this.kos,
                tkos: this.tkos,
                currentCircuit: this.currentCircuit,
                unlockedOpponents: this.unlockedOpponents,
                defeatedOpponents: this.defeatedOpponents,
                circuitsWon: this.circuitsWon
            };
            localStorage.setItem('punchout_career', JSON.stringify(data));
        } catch(e) {
            // localStorage might not be available
        }
    }

    // Load from localStorage
    load() {
        try {
            const raw = localStorage.getItem('punchout_career');
            if (raw) {
                const data = JSON.parse(raw);
                this.currentOpponentIndex = data.currentOpponentIndex || 0;
                this.wins = data.wins || 0;
                this.losses = data.losses || 0;
                this.kos = data.kos || 0;
                this.tkos = data.tkos || 0;
                this.currentCircuit = data.currentCircuit || 'MINOR';
                this.unlockedOpponents = data.unlockedOpponents || [0];
                this.defeatedOpponents = data.defeatedOpponents || [];
                this.circuitsWon = data.circuitsWon || [];
                return true;
            }
        } catch(e) {}
        return false;
    }

    hasSave() {
        try {
            return !!localStorage.getItem('punchout_career');
        } catch(e) {
            return false;
        }
    }
}
