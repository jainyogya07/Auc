const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

try {
    if (fs.existsSync(DB_PATH)) {
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
        const playerCount = db.players ? db.players.length : 0;

        console.log(`Found ${playerCount} players. Wiping them now...`);

        db.players = [];
        // Optional: Reset setOrder or other state if needed, but user just said "remove players"
        // keeping auctionState safe prevents frontend crashes

        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        console.log('✅ Successfully removed all players from db.json');
    } else {
        console.log('❌ db.json not found');
    }
} catch (error) {
    console.error('❌ Error wiping DB:', error);
}
