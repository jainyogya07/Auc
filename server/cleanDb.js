const mongoose = require('mongoose');

const cleanDB = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ipl-auction');
        console.log('Connected to MongoDB for cleanup...');

        await mongoose.connection.db.dropDatabase();
        console.log('Database dropped successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Error cleaning DB:', error);
        process.exit(1);
    }
};

cleanDB();
