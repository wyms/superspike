// teams.js — Team and character data (NES-faithful)
// Each team has distinct visual appearances, stats, and two named players
// with individual looks (hair style, skin tone, build).

export const TEAMS = [
    {
        name: 'USA',
        color: '#3355DD',      // jersey
        color2: '#DD3333',     // shorts
        players: [
            { name: 'Billy', skin: '#FFCC88', hair: '#DDAA22', hairStyle: 'short' },
            { name: 'Jimmy', skin: '#FFCC88', hair: '#884400', hairStyle: 'spiky' }
        ],
        stats: { speed: 7, power: 8, technique: 6, defense: 5 }
    },
    {
        name: 'JAPAN',
        color: '#DD2222',
        color2: '#FFFFFF',
        players: [
            { name: 'Kunio', skin: '#FFD8A8', hair: '#222222', hairStyle: 'headband' },
            { name: 'Riki',  skin: '#FFD8A8', hair: '#222222', hairStyle: 'tall' }
        ],
        stats: { speed: 6, power: 6, technique: 8, defense: 8 }
    },
    {
        name: 'MEXICO',
        color: '#22AA22',
        color2: '#FFFFFF',
        players: [
            { name: 'Carlos', skin: '#DDA860', hair: '#332200', hairStyle: 'curly' },
            { name: 'Jorge',  skin: '#CC9850', hair: '#221100', hairStyle: 'short' }
        ],
        stats: { speed: 8, power: 5, technique: 7, defense: 6 }
    },
    {
        name: 'RUSSIA',
        color: '#DD2222',
        color2: '#3355DD',
        players: [
            { name: 'Ivan',   skin: '#FFD8B8', hair: '#CCBB88', hairStyle: 'flat' },
            { name: 'Sergei', skin: '#FFD8B8', hair: '#AA8844', hairStyle: 'spiky' }
        ],
        stats: { speed: 5, power: 9, technique: 5, defense: 7 }
    },
    {
        name: 'KENYA',
        color: '#22AA22',
        color2: '#222222',
        players: [
            { name: 'Abdi',   skin: '#8B5E3C', hair: '#222222', hairStyle: 'short' },
            { name: 'Mwangi', skin: '#7A5030', hair: '#111111', hairStyle: 'flat' }
        ],
        stats: { speed: 9, power: 6, technique: 6, defense: 5 }
    },
    {
        name: 'BRAZIL',
        color: '#DDCC22',
        color2: '#22AA22',
        players: [
            { name: 'Lucas',  skin: '#DDA860', hair: '#332200', hairStyle: 'headband' },
            { name: 'Rafael', skin: '#CC9850', hair: '#442200', hairStyle: 'curly' }
        ],
        stats: { speed: 7, power: 7, technique: 7, defense: 7 }
    }
];
