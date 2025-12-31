const mongoose = require('mongoose');
const { Player } = require('./models');
const { INITIAL_PLAYERS } = require('./mockData');

mongoose.connect('mongodb://localhost:27017/auction-db')
    .then(async () => {
        console.log('Connected to MongoDB for manual seeding...');
        try {
            const count = await Player.countDocuments();
            console.log(`Loaded ${INITIAL_PLAYERS.length} players from mockData.`);

            // Force Clear
            console.log('Clearing existing players...');
            await Player.deleteMany({});

            // Seed
            console.log(`Seeding ${INITIAL_PLAYERS.length} players...`);
            await Player.insertMany(INITIAL_PLAYERS);
            console.log('Seeding complete.');
        } catch (err) {
            console.error('Seeding failed:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
    });
