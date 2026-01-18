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
    isBot: { type: Boolean, default: false },
    retentions: [{
        playerId: String,
        playerName: String,
        deduction: Number,  // Amount deducted from purse (in Cr)
        set: String         // Which set player belongs to
    }]
});

// Player Schema
const playerSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    country: { type: String, required: true },
    stateAssociation: String,
    dob: String,
    age: Number,
    specialism: String, // e.g., WICKETKEEPER, BATTER, BOWLER, ALL-ROUNDER
    battingStyle: String, // e.g., RHB, LHB
    bowlingStyle: String, // e.g., RIGHT ARM Off Spin
    basePrice: { type: Number, required: true },
    isForeign: { type: Boolean, default: false },
    status: { type: String, enum: ['U', 'S', 'US'], default: 'U' },
    set: { type: Number, default: 1 },
    setLabel: String, // e.g., M1, BA1
    soldPrice: Number,
    soldTo: String, // Team ID
    soldVia: { type: String, enum: ['BID', 'RTM'], default: 'BID' }, // 'BID' or 'RTM'
    originalTeamId: String, // For RTM Eligibility
    previousTeams: [String], // Array of team codes e.g. ['MI', 'RR']
    category: { type: String, enum: ['C', 'U', 'A'], default: 'C' }, // Capped, Uncapped, Associate
    caps: {
        test: { type: Number, default: 0 },
        odi: { type: Number, default: 0 },
        t20: { type: Number, default: 0 },
        ipl: { type: Number, default: 0 }
    },
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
    },
    // Retention tracking
    isRetained: { type: Boolean, default: false },
    retainedBy: String,  // Team ID
    retentionAmount: Number
});

const logSchema = new mongoose.Schema({
    id: String,
    type: { type: String, required: true },
    timestamp: { type: Number, default: Date.now },
    details: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Auction State Schema (Singleton)
const auctionStateSchema = new mongoose.Schema({
    status: { type: String, default: 'IDLE' },
    currentSet: { type: Number, default: 1 },
    currentPlayerId: String, // Referencing Player ID string (not ObjectId to keep logic simple)
    currentBid: { type: Number, default: 0 },
    currentBidder: String, // Team ID
    passedTeams: { type: [String], default: [] },
    history: [{
        id: String,
        playerId: String,
        teamId: String,
        amount: Number,
        timestamp: Number
    }],
    // Removed eventLog to prevent 16MB limit explosion
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
const Log = mongoose.model('Log', logSchema);

// Indexes
playerSchema.index({ id: 1 });
playerSchema.index({ status: 1 });
playerSchema.index({ set: 1 });
playerSchema.index({ soldTo: 1 });
teamSchema.index({ id: 1 });
teamSchema.index({ inviteCode: 1 });
logSchema.index({ timestamp: -1 });
logSchema.index({ type: 1 });

module.exports = { Team, Player, AuctionState, User, Log };
