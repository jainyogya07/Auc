const mongoose = require('mongoose');
const { Player } = require('./models');
const auctionManager = require('./store');

mongoose.connect('mongodb://localhost:27017/auction-db')
    .then(async () => {
        console.log('Connected to MongoDB...');

        // Initialize the auction manager
        await auctionManager.initialize();

        // Get state from manager
        const state = auctionManager.getState();

        console.log('\n=== DEBUG REPORT ===');
        console.log(`Players in DB (via direct query): ${await Player.countDocuments()}`);
        console.log(`Players in manager state: ${state.players.length}`);
        console.log(`Teams in manager state: ${state.teams.length}`);

        // Check JSON size
        const stateJson = JSON.stringify(state);
        const sizeInBytes = Buffer.byteLength(stateJson, 'utf8');
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

        console.log(`\nState JSON size: ${sizeInKB} KB (${sizeInMB} MB)`);
        console.log(`Default Socket.IO limit: ~1 MB`);

        if (sizeInBytes > 1024 * 1024) {
            console.log('\n⚠️  WARNING: State size exceeds default Socket.IO buffer limit!');
            console.log('   This will cause data truncation.');
        }

        // Check for duplicate IDs
        const playerIds = state.players.map(p => p.id || p._id);
        const uniqueIds = new Set(playerIds);
        console.log(`\nUnique player IDs: ${uniqueIds.size}`);
        if (uniqueIds.size !== state.players.length) {
            console.log('⚠️  WARNING: Duplicate player IDs detected!');
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
