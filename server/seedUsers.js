const mongoose = require('mongoose');
require('dotenv').config();

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ipl-auction');
        console.log('Connected to MongoDB');

        const User = mongoose.model('User', new mongoose.Schema({
            username: String,
            password: String,
            role: String
        }));

        // Check and create admin
        const admin = await User.findOne({ username: 'admin', role: 'admin' });
        if (!admin) {
            await User.create({ username: 'admin', password: 'admin123', role: 'admin' });
            console.log('✅ Created admin user');
        } else {
            console.log('Admin already exists');
        }

        // Check and create auctioneer
        const auctioneer = await User.findOne({ username: 'auctioneer', role: 'auctioneer' });
        if (!auctioneer) {
            await User.create({ username: 'auctioneer', password: 'auc123', role: 'auctioneer' });
            console.log('✅ Created auctioneer user');
        } else {
            console.log('Auctioneer already exists');
        }

        await mongoose.disconnect();
        console.log('Done!');
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
}

seedUsers();
