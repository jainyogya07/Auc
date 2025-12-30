const { Team, Player, AuctionState } = require('./models');

// Configuration
const BOT_DELAY_MS = 2000; // Delay before bot places a bid (simulate thinking)
const MAX_PURSE_PERCENT_PER_PLAYER = 15; // Don't spend more than 15% of total purse on one player unless critical

class BotEngine {
    constructor(auctionManager) {
        this.manager = auctionManager;
        this.timeoutId = null;
    }

    // Called whenever state changes
    async evaluateState(state) {
        // TEMPORARILY DISABLED - Uncomment to re-enable bots
        // Bots were bidding too fast making it hard to test
        return;

        // Clear any pending bid
        if (this.timeoutId) clearTimeout(this.timeoutId);

        // Only act if Bidding or Nominated (waiting for first bid)
        if (state.status !== 'BIDDING' && state.status !== 'NOMINATED') return;
        if (state.isPaused) return;

        // Current Situation
        const currentBid = state.currentBid;
        const currentBidderId = state.currentBidder;
        const currentPlayerId = state.currentPlayerId;

        // Find the player object
        const player = state.players.find(p => p.id === currentPlayerId);
        if (!player) return;

        // Identify potential bot teams
        // We need to fetch teams again or assume state.teams has updated data (it should)
        const botTeams = state.teams.filter(t => t.isBot);

        // If no bots, exit
        if (botTeams.length === 0) return;

        // Decide which bot should bid
        // We iterate and see if any bot WANTS to bid and CAN bid
        for (const team of botTeams) {
            // 1. Don't bid against self
            if (team.id === currentBidderId) continue;

            // 2. Evaluate Interest/Ability
            const decision = this.shouldBid(team, player, currentBid);

            if (decision.shouldBid) {
                // Schedule the bid
                const nextBidAmount = this.calculateNextBid(currentBid, player.basePrice);
                console.log(`[Bot] ${team.name} wants to bid ${nextBidAmount} for ${player.name}`);

                this.timeoutId = setTimeout(async () => {
                    try {
                        // Double check state before bidding (race conditions)
                        const freshState = this.manager.getState();
                        if (freshState.status !== 'BIDDING' && freshState.status !== 'NOMINATED') return;
                        if (freshState.currentBidder === team.id) return; // Already winning
                        if (freshState.currentBid >= nextBidAmount) return; // Price moved up

                        await this.manager.placeBid(team.id, nextBidAmount);
                    } catch (err) {
                        console.error(`[Bot Error] ${team.name} failed to bid:`, err.message);
                    }
                }, BOT_DELAY_MS + Math.random() * 1000); // Randomize slightly

                // Only one bot needs to trigger per evaluation cycle. 
                // The loop breaks because we scheduled an action that will change state, 
                // triggering re-evaluation.
                return;
            }
        }
    }

    shouldBid(team, player, currentBid) {
        // Validation Checks
        if (team.squadCount >= 25) return { shouldBid: false, reason: 'Squad Full' };
        if (player.isForeign && team.foreignPlayers >= 8) return { shouldBid: false, reason: 'Foreign Limit' };

        // Budget Logic
        const nextBid = this.calculateNextBid(currentBid, player.basePrice);
        if (team.purse < nextBid) return { shouldBid: false, reason: 'Insufficient Purse' };

        // Valuation Strategy (Simple Logic for now)
        // 1. Base Valuation based on Role?
        // 2. Stop if price is too high relative to remaining purse/slots

        const remainingSlots = 25 - team.squadCount;
        const avgBudgetPerSlot = team.purse / remainingSlots;

        // Aggressiveness: 
        // If we have lots of money and few players, be aggressive.
        // If we're tight, be conservative.

        let limit = avgBudgetPerSlot * 1.5; // Willing to pay 1.5x average

        // Star Player Boost (heuristic: high base price = star?)
        if (player.basePrice >= 2.0) limit *= 2.0;

        // Role needs (Mock: just random preference or check existing squad composition if complex)
        // For V1, simplest logic: Random chance to drop out if price > base + (random buffer)

        // Absolute Ceiling to prevent draining entire purse
        const absoluteCeiling = (team.purse * MAX_PURSE_PERCENT_PER_PLAYER) / 100;
        limit = Math.min(limit, absoluteCeiling);

        if (nextBid > limit) return { shouldBid: false, reason: 'Price too high' };

        // Randomness to simulate human hesitation or disinterest
        // If price > 5 Cr, 10% chance to drop out randomly
        if (nextBid > 5 && Math.random() < 0.1) return { shouldBid: false, reason: 'Random drop out' };

        return { shouldBid: true };
    }

    calculateNextBid(currentBid, basePrice) {
        // Increment logic matching existing system (if any) or simple steps
        // If current is 0, start at base price
        if (currentBid === 0) return basePrice;

        if (currentBid < 1) return Number((currentBid + 0.05).toFixed(2));
        if (currentBid < 2) return Number((currentBid + 0.10).toFixed(2));
        if (currentBid < 5) return Number((currentBid + 0.20).toFixed(2));
        return Number((currentBid + 0.25).toFixed(2));
    }
}

module.exports = BotEngine;
