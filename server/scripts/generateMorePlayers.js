const fs = require('fs');
const path = require('path');
const { INITIAL_TEAMS, INITIAL_PLAYERS } = require('../mockData');

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
const COUNTRIES = ['India', 'Australia', 'England', 'South Africa', 'New Zealand', 'West Indies'];

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generatePlayers = (count) => {
    const newPlayers = [];

    for (let i = 1; i <= count; i++) {
        const role = getRandomItem(ROLES);
        const country = getRandomItem(COUNTRIES);
        const isForeign = country !== 'India';

        const stats = {
            matches: getRandomInt(10, 150),
            runs: role === 'Bowler' ? getRandomInt(10, 200) : getRandomInt(500, 5000),
            innings: getRandomInt(10, 140),
            notOut: getRandomInt(0, 30),
            highScore: getRandomInt(30, 150).toString(),
            average: getRandomInt(15, 50),
            ballsFaced: getRandomInt(300, 4000),
            strikeRate: getRandomInt(110, 160),
            hundreds: role === 'Batsman' ? getRandomInt(0, 5) : 0,
            fifties: getRandomInt(1, 30),
            fours: getRandomInt(50, 400),
            sixes: getRandomInt(20, 200)
        };

        newPlayers.push({
            id: `gen-player-${Date.now()}-${i}`,
            name: `Player ${Date.now().toString().slice(-4)}${i} ${role}`,
            role: role,
            country: country,
            basePrice: getRandomItem([0.2, 0.5, 1, 1.5, 2]),
            isForeign: isForeign,
            status: 'U',
            set: getRandomInt(2, 5), // Sets 2-5 for these new players
            stats: stats
        });
    }
    return newPlayers;
};

const newPlayers = generatePlayers(100);
const allPlayers = [...INITIAL_PLAYERS, ...newPlayers];

const fileContent = `const INITIAL_TEAMS = ${JSON.stringify(INITIAL_TEAMS, null, 4)};

const INITIAL_PLAYERS = ${JSON.stringify(allPlayers, null, 4)};

module.exports = { INITIAL_TEAMS, INITIAL_PLAYERS };
`;

fs.writeFileSync(path.join(__dirname, '../mockData.js'), fileContent);
console.log(`Successfully added ${newPlayers.length} new players! Total: ${allPlayers.length}`);
