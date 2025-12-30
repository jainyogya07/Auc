const mongoose = require('mongoose');

// Team Schema
const teamSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    code: { type: String, required: true },
    inviteCode: { type: String, required: true },
    logo: String,
    purse: { type: Number, default: 0 },
    purseUsed: { type: Number, default: 0 },
    squadCount: { type: Number, default: 0 },
    foreignPlayers: { type: Number, default: 0 },
    rtmCardsLeft: { type: Number, default: 0 },
    color: String,
    isBot: { type: Boolean, default: false }
});

// Player Schema
const playerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    country: { type: String, required: true },
    basePrice: { type: Number, required: true },
    isForeign: { type: Boolean, default: false },
    status: { type: String, enum: ['U', 'S', 'US'], default: 'U' },
    set: { type: Number, default: 1 },
    soldPrice: Number,
    soldTo: String, // Team ID
    soldVia: { type: String, enum: ['BID', 'RTM'], default: 'BID' }, // 'BID' or 'RTM'
    originalTeamId: String, // For RTM Eligibility
    stats: {
        matches: Number,
        runs: Number,
        innings: Number,
        notOut: Number,
        highScore: String,
        average: mongoose.Schema.Types.Mixed,
        ballsFaced: Number,
        strikeRate: Number,
        hundreds: Number,
        fifties: Number,
        fours: Number,
        sixes: Number
    }
});

// Auction State Schema (Singleton)
const auctionStateSchema = new mongoose.Schema({
    status: { type: String, default: 'IDLE' },
    currentSet: { type: Number, default: 1 },
    currentPlayerId: String, // Referencing Player ID string (not ObjectId to keep logic simple)
    currentBid: { type: Number, default: 0 },
    currentBidder: String, // Team ID
    history: [{
        id: String,
        playerId: String,
        teamId: String,
        amount: Number,
        timestamp: Number
    }],
    eventLog: [{
        id: String,
        type: { type: String },
        timestamp: Number,
        details: mongoose.Schema.Types.Mixed
    }],
    isPaused: { type: Boolean, default: true },
    rtmState: { type: String, enum: [null, 'PENDING_DECISION', 'AWAITING_HIKE', 'AWAITING_MATCH'], default: null },
    timerExpiresAt: Number,
    settings: {
        defaultDuration: { type: Number, default: 60 },
        resetDuration: { type: Number, default: 30 }
    },
    nominations: {
        isOpen: { type: Boolean, default: false },
        submissions: [{
            teamId: String,
            playerIds: [String]
        }]
    },
    setOrder: { type: [Number], default: [] }
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'auctioneer'], required: true }
});

const Team = mongoose.model('Team', teamSchema);
const Player = mongoose.model('Player', playerSchema);
const AuctionState = mongoose.model('AuctionState', auctionStateSchema);
const User = mongoose.model('User', userSchema);

module.exports = { Team, Player, AuctionState, User };
