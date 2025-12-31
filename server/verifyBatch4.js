const mongoose = require('mongoose');
const { Player } = require('./models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auction-db')
    .then(async () => {
        console.log('Connected to MongoDB for Batch 4 verification...');
        try {
            const count = await Player.countDocuments();
            console.log(`Total Players in DB: ${count}`);

            // Check specific new player from Batch 4
            const checkPlayer = await Player.findOne({ id: 'adam-milne' });
            if (checkPlayer) {
                console.log('Found Adam Milne (Batch 4)');
            } else {
                console.log('Adam Milne NOT FOUND');
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
