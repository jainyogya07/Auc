const { AuctionState, Team, Player, Log, User } = require('./models');
const { INITIAL_TEAMS, INITIAL_PLAYERS } = require('./mockData');
const BotEngine = require('./botEngine');

class AuctionManager {
    constructor() {
        this.state = null; // Will be loaded async
        this.botEngine = new BotEngine(this); // Init Bot Engine
        this.timers = {}; // Track active timeouts: { bidTimer: null, closingTimer: null }
    }

    setIo(io) {
        this.io = io;
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
                passedTeams: [],
                history: [],
                eventLog: [],
                eventLog: [],
                passedTeams: [], // Track teams that have passed
                isPaused: true,
                settings: { defaultDuration: 60, resetDuration: 30 }
            });
        } else {
            // Migration: Remove legacy eventLog if exists
            if (auctionState.toObject().eventLog) {
                console.log('Migrating: Removing legacy eventLog from AuctionState...');
                await AuctionState.updateOne({}, { $unset: { eventLog: 1 } });
            }
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

        // 5. Ensure Timer State is Clean on Restart
        if (auctionState.timerExpiresAt) {
            // If server restarted during a timer, we can either resume or clear.
            // For safety/strictness, let's clear it to avoid stuck "Closing" states with no active timeout.
            await AuctionState.updateOne({}, { timerExpiresAt: null });
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
    async syncState(forceFull = false) {
        const auctionState = await AuctionState.findOne();
        if (!auctionState) {
            throw new Error('Auction state not found. Please reinitialize.');
        }

        // Cache hit check: If we have players/teams and not forcing full update, skip fetching them
        if (!this.state || !this.state.teams || !this.state.players || forceFull) {
            console.log('[Store] Fetching FULL state (Players & Teams) from DB');
            const teams = await Team.find();
            const players = await Player.find();

            this.lastPlayersFetch = Date.now();
            this.lastTeamsFetch = Date.now();

            this.state = {
                ...auctionState.toObject(),
                teams: teams.map(t => t.toObject()),
                players: players.map(p => p.toObject()),
            };
        } else {
            // Lightweight update: Just update the dynamic auction state parts
            // We assume players/teams are updated in memory by the specialized methods (soldPlayer, etc)
            // or rarely changed from outside.
            const stateObj = auctionState.toObject();
            this.state = {
                ...this.state,
                ...stateObj,
                // Preserving players and teams from memory unless explicitly overwritten above
            };
        }

        // Re-hydrate current player reference
        if (this.state.currentPlayerId) {
            this.state.currentPlayer = this.state.players.find(p => p.id === this.state.currentPlayerId) || null;
        } else {
            this.state.currentPlayer = null;
        }

        return this.state;
    }

    // Force refresh specific entities
    async refreshPlayers() {
        console.log('[Store] Refreshing Players Cache');
        const players = await Player.find();
        if (this.state) {
            this.state.players = players.map(p => p.toObject());
        }
    }

    async refreshTeams() {
        console.log('[Store] Refreshing Teams Cache');
        const teams = await Team.find();
        if (this.state) {
            this.state.teams = teams.map(t => t.toObject());
        }
    }

    getState() {
        return this.state;
    }

    // --- Helper for Logging ---
    async logEvent(type, details) {
        try {
            await Log.create({
                id: Math.random().toString(36).substr(2, 9),
                type,
                timestamp: Date.now(),
                details
            });
            // We do NOT update this.state.eventLog anymore as it's not needed in frontend state loop
        } catch (e) {
            console.error('Logging failed:', e);
        }
    }

    // --- Timer Logic (Smart 2-Step) ---

    // Warning Phase: 2 minutes of idle time. No UI timer.
    startBidTimer() {
        this.clearTimers();
        console.log('[Timer] Starting 2-min Idle Timer');

        // Set a timeout for 2 minutes (120s) to trigger the "Closing Phase"
        this.timers.bidTimer = setTimeout(() => {
            this.triggerClosingPhase();
        }, 120 * 1000);
    }

    // Closing Phase: 60s countdown visible to users.
    async triggerClosingPhase() {
        console.log('[Timer] Idle ended. Triggering 60s Closing Phase.');
        const closingDuration = 60 * 1000;
        const expiresAt = Date.now() + closingDuration;

        await AuctionState.updateOne({}, { timerExpiresAt: expiresAt });
        if (this.state) this.state.timerExpiresAt = expiresAt; // Optimistic

        // Broadcast update immediately so clients see the timer
        if (this.io) this.io.emit('auction:update', this.state);

        this.timers.closingTimer = setTimeout(() => {
            this.autoFinalize();
        }, closingDuration);
    }

    async autoFinalize() {
        console.log('[Timer] 60s Closing Phase ended. Auto-finalizing.');
        // If we have a current bidder, SOLD. Else UNSOLD.
        try {
            if (this.state.currentBidder) {
                await this.soldPlayer(this.state.currentPlayerId, this.state.currentBidder, this.state.currentBid);
            } else {
                await this.unsoldPlayer(this.state.currentPlayerId);
            }
            // Broadcast the result
            if (this.io) this.io.emit('auction:update', this.state);
        } catch (err) {
            console.error('[Timer] Auto-finalize error:', err);
        }
    }

    clearTimers() {
        if (this.timers.bidTimer) clearTimeout(this.timers.bidTimer);
        if (this.timers.closingTimer) clearTimeout(this.timers.closingTimer);
        this.timers = { bidTimer: null, closingTimer: null };
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

        // Check if team has passed
        if (this.state.passedTeams && this.state.passedTeams.includes(teamId)) {
            throw new Error('You have passed. Escalate to rejoin bidding.');
        }

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

        // Anti-Snipe Validation - DISABLED to prevent clock drift issues
        // const timeLeft = this.state.timerExpiresAt ? (this.state.timerExpiresAt - Date.now()) : 0;
        // if (timeLeft > 0 && timeLeft < 5000) {
        //     // Extend timer by 10s
        //     // ...
        // }


        // We do NOT set timerExpiresAt here anymore. It stays null until "Closing Phase".
        const newTimerExpiresAt = null;

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
        // Trigger Bot Evaluation
        this.botEngine.evaluateState(this.state);

        if (this.io) {
            this.io.emit('auction:update', this.state);
        }

        return this.state;
    }

    async rollbackLastBid() {
        if (this.state.status !== 'BIDDING' && this.state.status !== 'NOMINATED') {
            throw new Error('Cannot rollback - no active auction');
        }

        const history = this.state.history || [];
        if (history.length === 0) {
            throw new Error('No bids to rollback');
        }

        // Remove the last bid (bids are pushed to end, so newest is at end)
        const lastBid = history[history.length - 1]; // Most recent bid is at end
        const remainingHistory = history.slice(0, -1); // All except last

        // Determine new current bid and bidder from remaining history
        let newCurrentBid = 0;
        let newCurrentBidder = null;

        if (remainingHistory.length > 0) {
            // Revert to the previous bid (now at end of remaining)
            newCurrentBid = remainingHistory[remainingHistory.length - 1].amount;
            newCurrentBidder = remainingHistory[remainingHistory.length - 1].teamId;
        }

        // Reset timer to default idle phase
        this.startBidTimer();
        const newTimerExpiresAt = null;

        // DB Update - remove last bid and revert state
        await AuctionState.updateOne({}, {
            currentBid: newCurrentBid,
            currentBidder: newCurrentBidder,
            status: remainingHistory.length > 0 ? 'BIDDING' : 'NOMINATED',
            timerExpiresAt: newTimerExpiresAt,
            $pop: { history: 1 } // Remove last element (1 = pop from end)
        });

        await this.logEvent('BID_ROLLBACK', {
            rolledBackBid: lastBid.amount,
            rolledBackTeam: lastBid.teamId,
            newBid: newCurrentBid,
            newBidder: newCurrentBidder
        });

        return await this.syncState();
    }

    async setNextPlayer(playerId) {
        console.log(`[Store] setNextPlayer: ${playerId}. Current Status: ${this.state.status}`);
        // Idempotency check: If already on this player, just return state
        if (this.state.currentPlayerId === playerId && ['NOMINATED', 'BIDDING'].includes(this.state.status)) {
            console.log('[Store] setNextPlayer ignored (idempotent)');
            return this.state;
        }

        if (['NOMINATED', 'BIDDING'].includes(this.state.status)) {
            throw new Error('Cannot change player while auction is active');
        }

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) throw new Error('Player not found');

        // Start Idle Timer (2 mins)
        this.startBidTimer();
        const newTimerExpiresAt = null;

        // DB Update
        await AuctionState.updateOne({}, {
            status: 'NOMINATED',
            rtmState: null,
            currentPlayerId: playerId,
            currentBid: 0,
            currentBidder: null,
            passedTeams: [], // Reset passed teams
            currentBidder: null,
            passedTeams: [],
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

        // Check RTM Eligibility (IPL 2025 Rule) - DISABLED per user request (Manual Mode)
        /*
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
        */

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

        this.clearTimers();

        await this.logEvent('PLAYER_SOLD', { playerId, teamId, amount, soldVia, name: player.name });

        // Update bot market intelligence
        this.botEngine.updateMarketIntelligence(player, amount, teamId);

        // Explicitly update STATE immediately before syncing, although syncState fetches DB.
        // This is to be doubly sure, but since syncState fetches DB, we rely on that.
        // We will call syncState immediately.

        return await this.syncState();
    }

    // --- IPL 2025 RTM Logic ---

    // 1. Ex-Team Decision (Yes/No)
    async handleRTMDecision(decision) {
        console.log(`[RTM] handleRTMDecision. Current: ${this.state.rtmState}, Decision: ${decision}`);

        // Idempotency: If already moved past PENDING_DECISION, assume success and return state
        if (this.state.rtmState !== 'PENDING_DECISION') {
            console.warn(`[RTM] handleRTMDecision ignored/skipped. Current phase is '${this.state.rtmState}'. decision=${decision}`);
            return this.state;
        }

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
        console.log(`[RTM] submitHike. Current: ${this.state.rtmState}, Amount: ${amount}`);

        // Idempotency
        if (this.state.rtmState !== 'AWAITING_HIKE') {
            console.warn(`[RTM] submitHike ignored. Current phase '${this.state.rtmState}' !== 'AWAITING_HIKE'. amount=${amount}`);
            return this.state;
        }

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
        console.log(`[RTM] finalizeRTMMatch. Current: ${this.state.rtmState}, Matches: ${matches}`);
        if (this.state.rtmState !== 'AWAITING_MATCH') throw new Error(`Invalid RTM State: ${this.state.rtmState} (Expected AWAITING_MATCH)`);

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

    async resetRTM() {
        console.log('[RTM] Force Reset triggered by Admin');
        await AuctionState.updateOne({}, {
            rtmState: null,
            timerExpiresAt: null,
        });
        this.clearTimers(); // Safety clear
        await this.logEvent('RTM_RESET_BY_ADMIN', {});
        return await this.syncState();
    }


    async unsoldPlayer(playerId) {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) throw new Error('Player not found');

        await Player.updateOne({ id: playerId }, { status: 'US' });

        await AuctionState.updateOne({}, {
            status: 'UNSOLD',
            rtmState: null,
            currentBid: 0,
            currentBidder: null,
            timerExpiresAt: null
        });

        // Optimistic Memory Update
        player.status = 'US';

        this.clearTimers();

        await this.logEvent('PLAYER_UNSOLD', { playerId, name: player.name });
        return await this.syncState();
    }

    async setPause(isPaused) {
        await AuctionState.updateOne({}, { isPaused });

        // If paused, maybe we should pause the timer? 
        // For simplicity v1: If paused, we Clear timers. If resumed, we Restart Idle timer?
        // Let's just Clear on Pause to prevent auto-sell while paused.
        if (isPaused) {
            this.clearTimers();
        } else {
            // If resuming and we are in active state, restart idle timer
            if (['BIDDING', 'NOMINATED'].includes(this.state.status)) {
                this.startBidTimer();
            }
        }
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

    async updatePlayer(id, updates) {
        await Player.updateOne({ id }, { $set: updates });
        await this.logEvent('PLAYER_UPDATED', { id, updates });

        // Optimistic Memory Update
        if (this.state && this.state.players) {
            const pIndex = this.state.players.findIndex(p => p.id === id);
            if (pIndex !== -1) {
                this.state.players[pIndex] = { ...this.state.players[pIndex], ...updates };
            }
        }

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

        // Optimistic
        if (player) {
            player.status = 'S';
            player.soldPrice = rtmAmount;
            player.soldTo = teamId;
            player.soldVia = 'RTM';
        }
        if (team) {
            team.purse -= rtmAmount;
            team.purseUsed += rtmAmount;
            team.squadCount += 1;
            if (player.isForeign) team.foreignPlayers += 1;
            team.rtmCardsLeft -= 1;
        }

        // 3. Update Auction State (if this was the current player, reset)
        if (this.state.currentPlayerId === playerId) {
            await AuctionState.updateOne({}, {
                status: 'SOLD',
                timerExpiresAt: null
            });
            this.clearTimers();
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

        // Optimistic Memory Update
        if (this.state && this.state.teams) {
            const tIndex = this.state.teams.findIndex(t => t.id === teamId);
            if (tIndex !== -1) {
                this.state.teams[tIndex] = { ...this.state.teams[tIndex], ...updates };
            }
        }

        return await this.syncState();
    }

    async deleteTeam(teamId) {
        await Team.deleteOne({ id: teamId });
        await this.logEvent('TEAM_DELETED', { teamId });
        return await this.syncState();
    }

    async pass(teamId) {
        if (!this.state.currentPlayer || this.state.status !== 'BIDDING') {
            throw new Error('Bidding not active');
        }

        let passed = this.state.passedTeams || [];
        if (!passed.includes(teamId)) {
            passed.push(teamId);
            await AuctionState.updateOne({}, { passedTeams: passed });
            await this.logEvent('TEAM_PASSED', { teamId });
            return await this.syncState();
        }
        return this.state;
    }

    async escalate(teamId) {
        if (!this.state.currentPlayer || this.state.status !== 'BIDDING') {
            throw new Error('Bidding not active');
        }

        let passed = this.state.passedTeams || [];
        if (passed.includes(teamId)) {
            passed = passed.filter(id => id !== teamId);
            await AuctionState.updateOne({}, { passedTeams: passed });
            await this.logEvent('TEAM_ESCALATED', { teamId });
            return await this.syncState();
        }
        return this.state;
    }

    /**
     * Seed retained players into teams
     */
    async seedRetentions(retentionData) {
        const { teamId, players } = retentionData;

        const team = await Team.findOne({ id: teamId });
        if (!team) throw new Error(`Team not found: ${teamId}`);

        team.retentions = players;
        const totalDeduction = players.reduce((sum, p) => sum + (p.deduction / 100), 0);
        team.purse -= totalDeduction;
        team.purseUsed += totalDeduction;
        team.squadCount += players.length;

        for (const retention of players) {
            const player = await Player.findOne({ name: retention.playerName });
            if (player) {
                if (player.isForeign) team.foreignPlayers += 1;
                player.isRetained = true;
                player.retainedBy = teamId;
                player.retentionAmount = retention.deduction / 100;
                player.status = 'S';
                player.soldTo = teamId;
                player.soldPrice = retention.deduction / 100;
                await player.save();
            }
        }

        await team.save();
        await this.refreshState();
        return this.state;
    }

    async clearRetentions() {
        const teams = await Team.find({});

        for (const team of teams) {
            if (team.retentions && team.retentions.length > 0) {
                const totalDeduction = team.retentions.reduce((sum, p) => sum + (p.deduction / 100), 0);
                team.purse += totalDeduction;
                team.purseUsed -= totalDeduction;
                team.squadCount -= team.retentions.length;

                for (const retention of team.retentions) {
                    const player = await Player.findOne({ name: retention.playerName });
                    if (player) {
                        if (player.isForeign) team.foreignPlayers = Math.max(0, team.foreignPlayers - 1);
                        player.isRetained = false;
                        player.retainedBy = null;
                        player.retentionAmount = null;
                        player.status = 'U';
                        player.soldTo = null;
                        player.soldPrice = null;
                        await player.save();
                    }
                }

                team.retentions = [];
                await team.save();
            }
        }

        await this.refreshState();
        return this.state;
    }
}

module.exports = new AuctionManager();