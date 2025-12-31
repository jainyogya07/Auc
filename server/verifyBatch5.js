const mongoose = require('mongoose');
const { Player } = require('./models');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/auction-db')
    .then(async () => {
        console.log('Connected to MongoDB for Batch 5 verification...');
        try {
            const count = await Player.countDocuments();
            console.log(`Total Players in DB: ${count}`);

            // Check specific new players from Batch 5
            const checkPlayer1 = await Player.findOne({ id: 'musaif-ajaz' }); // Set 52
            const checkPlayer2 = await Player.findOne({ id: 'vijay-yadav' }); // Set 79

            if (checkPlayer1) console.log('Found Musaif Ajaz (Set 52)');
            else console.log('Musaif Ajaz NOT FOUND');

            if (checkPlayer2) console.log('Found Vijay Yadav (Set 79)');
            else console.log('Vijay Yadav NOT FOUND');

        } catch (err) {
            console.error('Verification failed:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
    });
