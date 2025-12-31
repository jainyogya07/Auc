const { Team, Player, AuctionState, User } = require('./models'); // Trigger restart Mobile UI Updates
const { INITIAL_TEAMS, INITIAL_PLAYERS } = require('./mockData');
const BotEngine = require('./botEngine');

class AuctionManager {
    constructor() {
        this.state = null; // Will be loaded async
        this.botEngine = new BotEngine(this); // Init Bot Engine
    }

    async initialize() {
        // 1. Ensure State Exists
        let auctionState = await AuctionState.findOne();
        if (!auctionState) {
            console.log('Seeding Initial Auction State...');
            auctionState = await AuctionState.create({
                status: 'IDLE',
                rtmState: null,
                currentSet: 1,
                currentPlayerId: null,
                currentBid: 0,
                currentBidder: null,
                history: [],
                eventLog: [],
                isPaused: true,
                settings: { defaultDuration: 60, resetDuration: 30 }
            });
        }

        // 2. Ensure Teams Exist
        const teamCount = await Team.countDocuments();
        if (teamCount === 0) {
            console.log('Seeding Teams...');
            // Ensure invite codes
            const teamsWithCodes = INITIAL_TEAMS.map(t => ({
                ...t,
                inviteCode: t.inviteCode || `${t.code}2024`
            }));
            await Team.insertMany(teamsWithCodes);
        }

        // 3. Ensure Players Exist
        const playerCount = await Player.countDocuments();
        if (playerCount === 0) {
            console.log('Seeding Players...');
            await Player.insertMany(INITIAL_PLAYERS);
        }

        // 4. Ensure Users Exist (Admin/Auctioneer)
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('Seeding Users...');
            const { ADMIN_CREDS, AUCTIONEER_CREDS } = require('./auth');
            await User.insertMany([
                { ...ADMIN_CREDS, role: 'admin' },
                { ...AUCTIONEER_CREDS, role: 'auctioneer' }
            ]);
        }

        // 4. Ensure Set Order Exists
        if (!auctionState.setOrder || auctionState.setOrder.length === 0) {
            console.log('Seeding Set Order...');
            const players = await Player.find();
            const sets = [...new Set(players.map(p => p.set))].sort((a, b) => a - b);
            await AuctionState.updateOne({}, { setOrder: sets });
        }

        // 5. Load Full State into Memory
        await this.syncState();
        console.log('Auction Manager Initialized from MongoDB');
    }

    async updateSetOrder(newOrder) {
        await AuctionState.updateOne({}, { setOrder: newOrder });
        await this.logEvent('SET_ORDER_UPDATED', newOrder);
        return await this.syncState();
    }

    // Load full state helper
    async syncState() {
        const auctionState = await AuctionState.findOne();
        if (!auctionState) {
            throw new Error('Auction state not found. Please reinitialize.');
        }
        const teams = await Team.find();
        const players = await Player.find();

        let currentPlayer = null;
        if (auctionState.currentPlayerId) {
            currentPlayer = players.find(p => p.id === auctionState.currentPlayerId) || null;
        }

        this.state = {
            ...auctionState.toObject(),
            teams: teams.map(t => t.toObject()),
            players: players.map(p => p.toObject()),
            currentPlayer // Hydrate the player object for frontend
        };
        return this.state;
    }

    getState() {
        return this.state;
    }

    // --- Helper for Logging ---
    async logEvent(type, details) {
        const entry = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            timestamp: Date.now(),
            details
        };

        await AuctionState.updateOne({}, { $push: { eventLog: entry } });
        // Optimistic update
        if (this.state) this.state.eventLog.push(entry);
    }

    // --- Actions (Async) ---

    async placeBid(teamId, amount) {
        console.log(`[placeBid] team=${teamId} amount=${amount} currentBid=${this.state.currentBid} status=${this.state.status}`);
        if (this.state.isPaused) throw new Error('Auction is paused');
        if (this.state.status !== 'NOMINATED' && this.state.status !== 'BIDDING') {
            throw new Error(`Cannot place bid in ${this.state.status} state`);
        }
        if (!this.state.currentPlayerId) throw new Error('No active player');

        // Get current player for base price validation
        const player = this.state.players.find(p => p.id === this.state.currentPlayerId);
        const basePrice = player?.basePrice || 0;

        // First bid must be at least base price, subsequent bids must be higher than current
        const bidAmount = Number(amount);
        if (isNaN(bidAmount)) throw new Error('Invalid bid amount');

        if (this.state.currentBid === 0) {
            if (bidAmount < basePrice) throw new Error(`First bid must be at least base price (₹${basePrice} Cr)`);
        } else {
            if (bidAmount <= this.state.currentBid) throw new Error('Bid must be higher than current');
        }

        // Verify Team from DB to be safe (or trust local cache?)
        // Let's trust local cache for speed, verifying funds
        const team = this.state.teams.find(t => t.id === teamId);
        if (!team) throw new Error('Team not found');
        if (team.purse < bidAmount) throw new Error(`Insufficient purse! (Has: ${team.purse}, Bid: ${bidAmount})`);

        // Anti-Snipe Validation
        if (this.state.timerExpiresAt) {
            const timeLeft = this.state.timerExpiresAt - Date.now();
            if (timeLeft < 250 && timeLeft > 0) {
                throw new Error('Anti-Snipe Protection: Bid Locked! (Too late)');
            }
        }

        // Updates
        const resetTime = (this.state.settings?.resetDuration || 30) * 1000;
        const newTimerExpiresAt = Date.now() + resetTime;

        const bid = {
            id: Math.random().toString(36).substr(2, 9),
            playerId: this.state.currentPlayerId,
            teamId,
            amount,
            timestamp: Date.now()
        };

        // DB Update
        await AuctionState.updateOne({}, {
            status: 'BIDDING',
            currentBid: bidAmount,
            currentBidder: teamId,
            timerExpiresAt: newTimerExpiresAt,
            $push: { history: bid }
        });

        await this.logEvent('BID_PLACED', { teamId, amount, playerId: this.state.currentPlayerId });
        await this.syncState();

        // Trigger Bot Evaluation
        this.botEngine.evaluateState(this.state);

        return this.state;
    }

    async setNextPlayer(playerId) {
        // Idempotency check: If already on this player, just return state
        if (this.state.currentPlayerId === playerId && ['NOMINATED', 'BIDDING'].includes(this.state.status)) {
            return this.state;
        }

        if (['NOMINATED', 'BIDDING'].includes(this.state.status)) {
            throw new Error('Cannot change player while auction is active');
        }

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) throw new Error('Player not found');

        const duration = (this.state.settings?.defaultDuration || 60) * 1000;
        const newTimerExpiresAt = Date.now() + duration;

        // DB Update
        await AuctionState.updateOne({}, {
            status: 'NOMINATED',
            rtmState: null,
            currentPlayerId: playerId,
            currentBid: 0,
            currentBidder: null,
            history: [],
            timerExpiresAt: newTimerExpiresAt
        });

        await this.logEvent('PLAYER_SET', { playerId, name: player.name });
        await this.syncState();

        // Trigger Bot Evaluation
        this.botEngine.evaluateState(this.state);

        return this.state;
    }

    async soldPlayer(playerId, teamId, amount) {
        if (this.state.status !== 'BIDDING' && this.state.status !== 'NOMINATED') throw new Error('Invalid state');

        const team = this.state.teams.find(t => t.id === teamId);
        const player = this.state.players.find(p => p.id === playerId);

        // Null safety checks
        if (!team) throw new Error('Team not found');
        if (!player) throw new Error('Player not found');

        const finalAmount = Number(amount);
        if (isNaN(finalAmount)) throw new Error('Invalid amount');

        // Re-validate
        if (team.purse < finalAmount) throw new Error('Insufficient purse');
        if (team.squadCount >= 25) throw new Error('Squad full');
        if (player.isForeign && team.foreignPlayers >= 8) throw new Error('Foreign limit reached');

        // Check RTM Eligibility (IPL 2025 Rule)
        // If player has originalTeamId AND that team is NOT the current bidder
        if (player.originalTeamId && player.originalTeamId !== teamId) {
            const originalTeam = this.state.teams.find(t => t.id === player.originalTeamId);
            if (originalTeam && originalTeam.rtmCardsLeft > 0) {
                // ENTER RTM PHASE
                await AuctionState.updateOne({}, {
                    rtmState: 'PENDING_DECISION',
                    timerExpiresAt: null
                });
                await this.logEvent('RTM_PHASE_START', {
                    playerId,
                    originalTeam: originalTeam.name,
                    winner: team.name,
                    bid: amount
                });
                return await this.syncState();
            }
        }

        // Standard Sale (No RTM or RTM Declined previously)
        return await this.finalizeSale(playerId, teamId, finalAmount, 'BID');
    }

    async finalizeSale(playerId, teamId, amount, soldVia) {
        const player = this.state.players.find(p => p.id === playerId);

        // 1. Update Player
        await Player.updateOne({ id: playerId }, {
            $set: {
                status: 'S',
                soldPrice: amount,
                soldTo: teamId,
                soldVia: soldVia
            }
        });

        // 2. Update Team
        await Team.updateOne({ id: teamId }, {
            $inc: {
                purse: -amount,
                purseUsed: amount,
                squadCount: 1,
                foreignPlayers: player.isForeign ? 1 : 0,
                rtmCardsLeft: soldVia === 'RTM' ? -1 : 0
            }
        });

        // 3. Update Auction State
        await AuctionState.updateOne({}, {
            status: 'SOLD',
            rtmState: null,
            timerExpiresAt: null
        });

        await this.logEvent('PLAYER_SOLD', { playerId, teamId, amount, soldVia, name: player.name });
        return await this.syncState();
    }

    // --- IPL 2025 RTM Logic ---

    // 1. Ex-Team Decision (Yes/No)
    async handleRTMDecision(decision) {
        if (this.state.rtmState !== 'PENDING_DECISION') throw new Error('Invalid RTM State');

        if (!decision) {
            // Ex-Team declined RTM. Sell to Winner.
            return await this.finalizeSale(
                this.state.currentPlayerId,
                this.state.currentBidder,
                this.state.currentBid,
                'BID'
            );
        } else {
            // Ex-Team said Yes. Move to Hike Phase.
            await AuctionState.updateOne({}, { rtmState: 'AWAITING_HIKE' });
            await this.logEvent('RTM_ACCEPTED_WAITING_HIKE', {});
            return await this.syncState();
        }
    }

    // 2. Winner Hike (New Amount)
    async submitHike(amount) {
        if (this.state.rtmState !== 'AWAITING_HIKE') throw new Error('Invalid RTM State');

        const hikeAmount = Number(amount);
        if (isNaN(hikeAmount)) throw new Error('Invalid hike amount');

        // If amount is 0 or same, it means NO HIKE.
        // If amount > currentBid, it is a HIKE.

        const isHike = hikeAmount > this.state.currentBid;

        // Validate Funds for Winner
        const winner = this.state.teams.find(t => t.id === this.state.currentBidder);
        if (isHike && winner.purse < hikeAmount) throw new Error('Winner cannot hike beyond purse');

        // Update Price
        await AuctionState.updateOne({}, {
            currentBid: hikeAmount,
            rtmState: 'AWAITING_MATCH'
        });

        await this.logEvent('RTM_HIKE_SUBMITTED', { amount: hikeAmount });
        return await this.syncState();
    }

    // 3. Ex-Team Match Decision (Yes/No)
    async finalizeRTMMatch(matches) {
        if (this.state.rtmState !== 'AWAITING_MATCH') throw new Error('Invalid RTM State');

        const player = this.state.players.find(p => p.id === this.state.currentPlayerId);
        const originalTeamId = player.originalTeamId;
        const originalTeam = this.state.teams.find(t => t.id === originalTeamId);

        if (matches) {
            // Check original team purse for Hiked Price
            if (originalTeam.purse < this.state.currentBid) throw new Error('Original Team cannot afford match');

            // Sell to Original Team via RTM
            return await this.finalizeSale(
                this.state.currentPlayerId,
                originalTeamId,
                this.state.currentBid,
                'RTM'
            );
        } else {
            // Declined Match. Sell to Winner at Hiked Price.
            return await this.finalizeSale(
                this.state.currentPlayerId,
                this.state.currentBidder,
                this.state.currentBid,
                'BID'
            );
        }
    }


    async unsoldPlayer(playerId) {
        await Player.updateOne({ id: playerId }, { $set: { status: 'US' } });
        const player = this.state.players.find(p => p.id === playerId);

        await AuctionState.updateOne({}, {
            status: 'UNSOLD',
            rtmState: null,
            currentBid: 0,
            currentBidder: null,
            timerExpiresAt: null
        });

        await this.logEvent('PLAYER_UNSOLD', { playerId, name: player?.name });
        return await this.syncState();
    }

    async setPause(isPaused) {
        await AuctionState.updateOne({}, { isPaused });
        await this.logEvent(isPaused ? 'AUCTION_PAUSED' : 'AUCTION_RESUMED', {});
        return await this.syncState();
    }

    async updateSettings(settings) {
        await AuctionState.updateOne({}, {
            $set: {
                "settings.defaultDuration": settings.defaultDuration,
                "settings.resetDuration": settings.resetDuration
            }
        });
        await this.logEvent('SETTINGS_UPDATED', settings);
        return await this.syncState();
    }

    async reset() {
        // Dev: Clear all data and re-seed
        await AuctionState.deleteMany({});
        await Player.deleteMany({});
        await Team.deleteMany({});
        await this.initialize();
        return this.getState();
    }

    // --- NOMINATION PHASE LOGIC ---

    async toggleNominationPhase(isOpen) {
        await AuctionState.updateOne({}, {
            $set: { "nominations.isOpen": isOpen }
        });
        await this.logEvent(isOpen ? 'NOMINATION_OPEN' : 'NOMINATION_CLOSED', {});
        return await this.syncState();
    }

    async submitNomination(teamId, playerIds) {
        if (!this.state.nominations?.isOpen) throw new Error('Nomination phase is closed');

        // Validation: Max 10 players
        if (!Array.isArray(playerIds) || playerIds.length > 10) {
            throw new Error('You can nominate up to 10 players maximum.');
        }

        // remove previous nomination for this team if any to allow updates
        await AuctionState.updateOne({}, {
            $pull: { "nominations.submissions": { teamId } }
        });

        await AuctionState.updateOne({}, {
            $push: {
                "nominations.submissions": {
                    teamId,
                    playerIds
                }
            }
        });

        // Don't log every submission to avoid spam, or log briefly
        await this.logEvent('NOMINATION_SUBMITTED', { teamId, count: playerIds.length });
        return await this.syncState();
    }

    async finalizeNominations() {
        const state = await this.syncState();
        const submissions = state.nominations.submissions || [];

        // 1. Consolidate unique player IDs
        const uniqueIds = new Set();
        submissions.forEach(sub => {
            sub.playerIds.forEach(id => uniqueIds.add(id));
        });

        const nominatedIds = Array.from(uniqueIds);

        if (nominatedIds.length === 0) {
            await this.toggleNominationPhase(false);
            return;
        }

        // 2. Update these players to a special Accelerated Set (Set 99)
        // Only update if they are currently Unsold (U) or Unsold-Sold (US - Wait, usually only unsold)
        // User said "unsold player sets", so assume status U or US.

        await Player.updateMany(
            { id: { $in: nominatedIds } },
            { $set: { set: 99, status: 'U' } } // Reset status to U logic if they were US? Or just keep U.
        );

        // 3. Close Phase
        await this.toggleNominationPhase(false);

        await this.logEvent('NOMINATIONS_FINALIZED', { count: nominatedIds.length });
        return await this.syncState();
    }

    // --- Admin Player Management ---
    async addPlayer(playerData) {
        const player = new Player(playerData);
        await player.save();
        await this.logEvent('PLAYER_CREATED', { name: player.name });
        return await this.syncState();
    }

    async updatePlayer(playerId, updates) {
        await Player.updateOne({ id: playerId }, { $set: updates });
        await this.logEvent('PLAYER_UPDATED', { playerId, updates });
        return await this.syncState();
    }

    async deletePlayer(playerId) {
        await Player.deleteOne({ id: playerId });
        await this.logEvent('PLAYER_DELETED', { playerId });
        return await this.syncState();
    }

    async rtmPlayer(playerId, teamId, amount) {
        const team = this.state.teams.find(t => t.id === teamId);
        const player = this.state.players.find(p => p.id === playerId);

        if (!team) throw new Error('Team not found');
        if (!player) throw new Error('Player not found');

        const rtmAmount = Number(amount);
        if (isNaN(rtmAmount)) throw new Error('Invalid RTM Amount');

        if (team.rtmCardsLeft <= 0) throw new Error('No RTM Cards left');
        if (team.purse < rtmAmount) throw new Error('Insufficient purse for RTM');
        if (team.squadCount >= 25) throw new Error('Squad full');
        if (player.isForeign && team.foreignPlayers >= 8) throw new Error('Foreign limit reached');

        // Transaction
        // 1. Update Player
        await Player.updateOne({ id: playerId }, {
            $set: {
                status: 'S',
                soldPrice: rtmAmount,
                soldTo: teamId,
                soldVia: 'RTM'
            }
        });

        // 2. Update Team (Deduct RTM Card)
        await Team.updateOne({ id: teamId }, {
            $inc: {
                purse: -rtmAmount,
                purseUsed: rtmAmount,
                squadCount: 1,
                foreignPlayers: player.isForeign ? 1 : 0,
                rtmCardsLeft: -1
            }
        });

        // 3. Update Auction State (if this was the current player, reset)
        if (this.state.currentPlayerId === playerId) {
            await AuctionState.updateOne({}, {
                status: 'SOLD',
                timerExpiresAt: null
            });
        }

        await this.logEvent('PLAYER_RTM', { playerId, teamId, amount, name: player.name });
        return await this.syncState();
    }

    // --- Admin Team Management ---
    async addTeam(teamData) {
        // Generate unique id if not provided
        if (!teamData.id) {
            teamData.id = teamData.code?.toLowerCase() || Math.random().toString(36).substr(2, 9);
        }
        // Ensure invite code exists
        if (!teamData.inviteCode) {
            teamData.inviteCode = `${teamData.code}2024`;
        }
        // Set defaults
        teamData.purseUsed = teamData.purseUsed || 0;
        teamData.squadCount = teamData.squadCount || 0;
        teamData.foreignPlayers = teamData.foreignPlayers || 0;
        teamData.rtmCardsLeft = teamData.rtmCardsLeft ?? 2;
        teamData.isBot = teamData.isBot || false;

        const team = new Team(teamData);
        await team.save();
        await this.logEvent('TEAM_CREATED', { name: team.name, code: team.code });
        return await this.syncState();
    }

    async updateTeam(teamId, updates) {
        await Team.updateOne({ id: teamId }, { $set: updates });
        await this.logEvent('TEAM_UPDATED', { teamId, updates });
        return await this.syncState();
    }

    async deleteTeam(teamId) {
        await Team.deleteOne({ id: teamId });
        await this.logEvent('TEAM_DELETED', { teamId });
        return await this.syncState();
    }
}

module.exports = new AuctionManager();
