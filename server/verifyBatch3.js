const mongoose = require('mongoose');
const { Player } = require('./models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auction-db')
    .then(async () => {
        console.log('Connected to MongoDB for verification...');
        try {
            const count = await Player.countDocuments();
            console.log(`Total Players in DB: ${count}`);

            // Optional: Check specific new players
            const checkPlayer = await Player.findOne({ id: 'steve-smith' });
            if (checkPlayer) {
                console.log('Found Steve Smith (Batch 3)');
            } else {
                console.log('Steve Smith NOT FOUND');
            }

        } catch (err) {
            console.error('Verification failed:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
    });
