const { Team, Player, AuctionState } = require('./models');
const axios = require('axios');

// Configuration
const BOT_DELAY_MS = 2000; // Delay before bot places a bid (simulate thinking)
const MAX_PURSE_PERCENT_PER_PLAYER = 15; // Don't spend more than 15% of total purse on one player unless critical
const PYTHON_BOT_URL = process.env.PYTHON_BOT_URL || 'http://localhost:5001';

class BotEngine {
    constructor(auctionManager) {
        this.manager = auctionManager;
        this.timeoutId = null;

        // Advanced Intelligence Tracking
        this.marketData = new Map(); // playerId -> {soldPrice, soldTo, multiplier}
        this.bidHistory = new Map(); // teamId -> {totalBids, wins, avgMultiplier}
        this.auctionPhase = 'early'; // early, mid, late
        this.playersAuctioned = 0;
        this.avgPricePerRole = { BATTER: 0, BOWLER: 0, 'ALL-ROUNDER': 0, WICKETKEEPER: 0 };

        // Team Personalities (makes bots behave differently)
        this.teamPersonalities = {
            'mi': { type: 'aggressive', riskTolerance: 0.8, starMultiplier: 2.5 },
            'csk': { type: 'balanced', riskTolerance: 0.5, starMultiplier: 2.0 },
            'rcb': { type: 'aggressive', riskTolerance: 0.9, starMultiplier: 2.8 },
            'dc': { type: 'conservative', riskTolerance: 0.3, starMultiplier: 1.5 },
            'kkr': { type: 'balanced', riskTolerance: 0.6, starMultiplier: 2.0 },
            'rr': { type: 'conservative', riskTolerance: 0.4, starMultiplier: 1.6 },
            'pbks': { type: 'aggressive', riskTolerance: 0.7, starMultiplier: 2.3 },
            'srh': { type: 'conservative', riskTolerance: 0.35, starMultiplier: 1.7 },
            'gt': { type: 'balanced', riskTolerance: 0.5, starMultiplier: 1.9 },
            'lsg': { type: 'balanced', riskTolerance: 0.55, starMultiplier: 2.1 }
        };

        // Python ML service availability
        this.pythonServiceAvailable = false;
        this.checkPythonService();
    }

    /**
     * Check if Python ML service is available
     */
    async checkPythonService() {
        try {
            const response = await axios.get(`${PYTHON_BOT_URL}/health`, { timeout: 2000 });
            this.pythonServiceAvailable = response.data.status === 'healthy';
            if (this.pythonServiceAvailable) {
                console.log('[Bot Engine] 🐍 Python ML service connected');
            }
        } catch (err) {
            this.pythonServiceAvailable = false;
            console.log('[Bot Engine] Python ML service unavailable - using fallback logic');
        }
    }

    /**
     * Call Python ML service for advanced player evaluation
     * Only used for high-value players (basePrice >= 8 Cr)
     */
    async callPythonBotService(player, team, currentBid) {
        if (!this.pythonServiceAvailable) return null;

        try {
            const response = await axios.post(`${PYTHON_BOT_URL}/evaluate-player`, {
                player: {
                    id: player.id,
                    name: player.name,
                    role: player.role,
                    basePrice: player.basePrice,
                    currentBid: currentBid,
                    isForeign: player.isForeign
                },
                team: {
                    id: team.id,
                    purse: team.purse,
                    strategy: this.getPersonality(team.code).type
                }
            }, { timeout: 1500 });

            return response.data;
        } catch (err) {
            console.warn(`[Bot Engine] Python ML call failed: ${err.message}`);
            return null;
        }
    }

    // Called whenever state changes
    async evaluateState(state) {
        // Enable bots with advanced intelligence

        // Update auction phase tracking
        this.updatePhase(state);

        // Clear any pending bid
        if (this.timeoutId) clearTimeout(this.timeoutId);

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

            // 1.5 Check if already passed
            if (state.passedTeams && state.passedTeams.includes(team.id)) continue;

            // 2. HIGH-VALUE PLAYER CHECK: Use Python ML if available
            let decision;
            if (player.basePrice >= 8 && this.pythonServiceAvailable) {
                console.log(`[Bot] ${team.name} consulting Python ML for ${player.name}...`);
                const mlRecommendation = await this.callPythonBotService(player, team, currentBid);

                if (mlRecommendation && mlRecommendation.shouldBid) {
                    decision = {
                        shouldBid: true,
                        suggestedBid: mlRecommendation.suggestedBid,
                        reason: `ML: ${mlRecommendation.reasoning}`
                    };
                    console.log(`[Bot] Python ML recommends: ${mlRecommendation.reasoning}`);
                } else {
                    decision = { shouldBid: false, reason: 'ML rejected' };
                }
            } else {
                // Fallback to original logic for regular players
                decision = this.shouldBid(team, player, currentBid);
            }

            if (decision.shouldBid) {
                // Schedule the bid
                const nextBidAmount = decision.suggestedBid || this.calculateNextBid(currentBid, player.basePrice);
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

    // Track opponent bidding behavior
    trackOpponentBid(opponentId) {
        if (!this.bidHistory.has(opponentId)) {
            this.bidHistory.set(opponentId, {
                totalBids: 0,
                wins: 0,
                avgMultiplier: 1.0
            });
        }
        const history = this.bidHistory.get(opponentId);
        history.totalBids++;
    }

    // Analyze current competition
    analyzeCompetition(currentBidderId, state) {
        if (!currentBidderId) return { threat: 'low', shouldPullback: false };

        this.trackOpponentBid(currentBidderId);
        const opponentData = this.bidHistory.get(currentBidderId);

        // Check win rate
        const winRate = opponentData.wins / Math.max(opponentData.totalBids, 1);
        const isAggressiveBidder = winRate > 0.6;

        // Detect bid war (multiple teams bidding recently)
        const recentBids = (state.history || []).slice(0, 5);
        const uniqueBidders = new Set(recentBids.map(b => b.teamId)).size;
        const isBidWar = uniqueBidders >= 3;

        return {
            threat: isAggressiveBidder ? 'high' : winRate > 0.3 ? 'medium' : 'low',
            shouldPullback: isBidWar,
            bidWarIntensity: uniqueBidders
        };
    }

    // Get team personality
    getPersonality(teamCode) {
        const code = teamCode?.toLowerCase();
        return this.teamPersonalities[code] || { type: 'balanced', riskTolerance: 0.5, starMultiplier: 2.0 };
    }

    // Calculate value for money
    calculateValueScore(player, price) {
        const performance = this.evaluatePlayerPerformance(player);
        const valueRatio = performance / (price * 10); // Higher is better value
        return Math.min(valueRatio * 100, 100);
    }

    shouldBid(team, player, currentBid) {
        // === VALIDATION ===
        if (team.squadCount >= 25) return { shouldBid: false, reason: 'Squad Full' };
        if (player.isForeign && team.foreignPlayers >= 8) return { shouldBid: false, reason: 'Foreign Limit' };

        const nextBid = this.calculateNextBid(currentBid, player.basePrice);
        if (team.purse < nextBid) return { shouldBid: false, reason: 'Insufficient Purse' };

        // === ADVANCED ANALYSIS ===
        const remainingSlots = Math.max(25 - team.squadCount, 1);
        const avgBudgetPerSlot = team.purse / remainingSlots;

        // Get team personality
        const personality = this.getPersonality(team.code);

        // Analyze squad composition
        const needs = this.analyzeSquadNeeds(team, this.manager.state.players);
        const roleNeeded = this.isRoleNeeded(needs, player.role, player.specialism);

        // Evaluate player quality
        const playerScore = this.evaluatePlayerPerformance(player);
        const marketValue = this.estimateMarketValue(player);
        const valueScore = this.calculateValueScore(player, nextBid);

        // Analyze competition
        const competition = this.analyzeCompetition(this.manager.state.currentBidder, this.manager.state);

        // === INTELLIGENT LIMIT CALCULATION ===
        // Base varies by personality
        let baseMultiplier = personality.type === 'aggressive' ? 2.0 :
            personality.type === 'balanced' ? 1.5 : 1.2;
        let limit = avgBudgetPerSlot * baseMultiplier;

        // 1. Role Need (Critical > High > Medium > Low)
        if (roleNeeded === 'CRITICAL') limit *= 3.5;  // Must have!
        else if (roleNeeded === 'HIGH') limit *= 2.2;
        else if (roleNeeded === 'MEDIUM') limit *= 1.6;

        // 2. Player Quality Adjustment
        const qualityMultiplier = 1 + (playerScore / 100);
        limit *= qualityMultiplier;

        // 3. Market Intelligence
        if (marketValue > 0) {
            const marketFactor = marketValue / player.basePrice;
            if (marketFactor > 2.5) limit *= 1.3; // Very hot market
            else if (marketFactor > 2.0) limit *= 1.2; // Hot market
            else if (marketFactor < 1.0) limit *= 0.85; // Cold market
        }

        // 4. Value-for-Money Check
        if (valueScore > 80) limit *= 1.15; // Great value, pay more
        else if (valueScore < 30) limit *= 0.9; // Poor value, reduce

        // 5. Auction Phase Strategy
        if (this.auctionPhase === 'early') {
            limit *= 0.85; // Very conservative early
        } else if (this.auctionPhase === 'late') {
            // End-game desperation
            if (needs.wicketKeepers < 1 || team.squadCount < 11) {
                limit *= 1.4; // Desperate!
            } else if (roleNeeded === 'HIGH') {
                limit *= 1.2; // Still need key players
            }
        }

        // 6. Competitive Response
        if (competition.threat === 'high') {
            // Facing aggressive opponent
            if (roleNeeded !== 'CRITICAL' && personality.type === 'conservative') {
                limit *= 0.8; // Pull back, save for later
            } else if (personality.type === 'aggressive') {
                limit *= 1.1; // Fight harder!
            }
        }

        // 7. Bid War Detection
        if (competition.shouldPullback && competition.bidWarIntensity >= 3) {
            if (roleNeeded === 'LOW' || roleNeeded === 'MEDIUM') {
                return { shouldBid: false, reason: 'Bid war too intense, conserving budget' };
            } else if (personality.type === 'conservative') {
                limit *= 0.75; // Significantly reduce in bid wars
            }
        }

        // 8. Star Player Premium (personality-based)
        if (player.basePrice >= 2.0 && playerScore > 70) {
            const starBonus = player.basePrice * personality.starMultiplier;
            limit = Math.max(limit, starBonus);
        }

        // 9. Risk Tolerance (personality trait)
        if (nextBid > avgBudgetPerSlot * 3 && Math.random() > personality.riskTolerance) {
            return { shouldBid: false, reason: 'Risk threshold exceeded for personality' };
        }

        // === ABSOLUTE CONSTRAINTS ===
        const absoluteCeiling = (team.purse * MAX_PURSE_PERCENT_PER_PLAYER) / 100;
        limit = Math.min(limit, absoluteCeiling);

        // Emergency reserve for remaining slots
        const emergencyReserve = remainingSlots * 0.3;
        const maxSafeSpend = team.purse - emergencyReserve;
        limit = Math.min(limit, maxSafeSpend);

        if (nextBid > limit) {
            return { shouldBid: false, reason: 'Exceeds strategic limit' };
        }

        // === FINAL DECISION ===
        // Smart hesitation - personality and value based
        const hesitationChance = personality.type === 'conservative' ? 0.20 :
            personality.type === 'balanced' ? 0.15 : 0.10;
        if (nextBid > 5 && roleNeeded === 'LOW' && valueScore < 50 && Math.random() < hesitationChance) {
            return { shouldBid: false, reason: 'Strategic hesitation' };
        }

        console.log('[Bot]', team.name, '(' + personality.type + ') bidding on', player.name,
            '| Need:', roleNeeded, '| Score:', playerScore, '| Value:', Math.round(valueScore),
            '| Competition:', competition.threat, '| Phase:', this.auctionPhase);

        return { shouldBid: true, maxBid: limit };
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

    // ===== ADVANCED INTELLIGENCE METHODS =====

    // Update auction phase based on progress
    updatePhase(state) {
        const totalPlayers = state.players.length;
        const unsoldPlayers = state.players.filter(p => p.status === 'U').length;
        const progress = 1 - (unsoldPlayers / totalPlayers);

        if (progress < 0.3) this.auctionPhase = 'early';
        else if (progress < 0.7) this.auctionPhase = 'mid';
        else this.auctionPhase = 'late';
    }

    // Track when player is sold (call from store.js)
    updateMarketIntelligence(player, soldPrice, soldTo) {
        this.playersAuctioned++;

        this.marketData.set(player.id, {
            soldPrice,
            soldTo,
            basePrice: player.basePrice,
            multiplier: soldPrice / player.basePrice,
            role: player.role
        });

        // Update average price per role
        const soldPlayers = Array.from(this.marketData.values()).filter(p => p.role === player.role);
        if (soldPlayers.length > 0) {
            const avgPrice = soldPlayers.reduce((sum, p) => sum + p.soldPrice, 0) / soldPlayers.length;
            this.avgPricePerRole[player.role] = avgPrice;
        }
    }

    // Evaluate player performance score (0-100)
    evaluatePlayerPerformance(player) {
        let score = 0;
        const stats = player.stats || {};
        const caps = player.caps || {};

        // Base price indicates market value
        if (player.basePrice >= 2.0) score += 30; // Star player
        else if (player.basePrice >= 1.0) score += 20; // Premium
        else score += 10; // Budget

        // Role scarcity
        if (player.role === 'ALL-ROUNDER') score += 15; // Versatile
        if (player.specialism === 'WICKETKEEPER') score += 10; // Essential

        // Experience
        const iplCaps = caps.ipl || 0;
        if (iplCaps > 100) score += 20;
        else if (iplCaps > 50) score += 12;
        else if (iplCaps > 20) score += 6;

        // International experience
        const t20Caps = caps.t20 || 0;
        if (t20Caps > 50) score += 15;
        else if (t20Caps > 20) score += 8;

        // Batting performance
        if (player.role === 'BATTER' || player.role === 'ALL-ROUNDER') {
            const avg = parseFloat(stats.average) || 0;
            const sr = stats.strikeRate || 0;
            if (avg > 35 && sr > 140) score += 15; // Elite
            else if (avg > 25 && sr > 120) score += 8; // Good
        }

        return Math.min(score, 100);
    }

    // Estimate market value based on historical sales
    estimateMarketValue(player) {
        const similarPlayers = Array.from(this.marketData.values())
            .filter(p => p.role === player.role);

        if (similarPlayers.length > 0) {
            const avgMultiplier = similarPlayers.reduce((sum, p) => sum + p.multiplier, 0) / similarPlayers.length;
            return player.basePrice * avgMultiplier;
        }

        // No data yet, conservative estimate
        return player.basePrice * 1.3;
    }

    // Analyze squad composition
    analyzeSquadNeeds(team, allPlayers) {
        const squad = allPlayers.filter(p => p.soldTo === team.id);

        const needs = {
            batsmen: squad.filter(p => p.role === 'BATTER').length,
            bowlers: squad.filter(p => p.role === 'BOWLER').length,
            allRounders: squad.filter(p => p.role === 'ALL-ROUNDER').length,
            wicketKeepers: squad.filter(p => p.specialism === 'WICKETKEEPER').length,
            foreignPlayers: squad.filter(p => p.isForeign).length
        };

        return needs;
    }

    // Check if role is needed
    isRoleNeeded(needs, role, specialism) {
        // Ideal squad: 2 WK, 6 batsmen, 6 bowlers, 4 all-rounders
        if (specialism === 'WICKETKEEPER' && needs.wicketKeepers < 2) return 'CRITICAL';
        if (role === 'BATTER' && needs.batsmen < 6) return 'HIGH';
        if (role === 'BOWLER' && needs.bowlers < 6) return 'HIGH';
        if (role === 'ALL-ROUNDER' && needs.allRounders < 4) return 'MEDIUM';
        return 'LOW';
    }
}

module.exports = BotEngine;
