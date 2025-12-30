import type { Team } from '../types/index';

interface BidStrategy {
    safeMaxBid: number;
    recommendedLimit: number;
    riskLevel: 'SAFE' | 'MODERATE' | 'RISKY' | 'CRITICAL';
    message: string;
}

// Rules (IPL Context)
const MIN_SQUAD_SIZE = 18;
// MAX_SQUAD_SIZE = 25: Reserved for future rule validation
const MIN_PLAYER_COST = 0.20; // 20 Lakhs base

export function calculateBidStrategy(team: Team, currentBid: number): BidStrategy {
    const currentSquadSize = team.squadCount;
    // We strictly need to reach 18 players.
    // However, for calculation safety, we assume we might want to fill up to a safe buffer, say 20, or just stick to 18 min.
    // Let's use 18 as the hard requirement for "reserved cash".

    const slotsToFillMin = Math.max(0, MIN_SQUAD_SIZE - currentSquadSize - 1); // -1 because we are bidding for the *current* player
    const minCashReserved = slotsToFillMin * MIN_PLAYER_COST;

    const safeMaxBid = Math.max(0, team.purse - minCashReserved);

    // Recommendation Logic (Heuristic)
    // Don't spend more than 40% of remaining purse on one player unless it's the last few needed and you have tons of cash.
    const aggressiveRatio = 0.40;
    const recommendedLimit = Math.min(safeMaxBid, team.purse * aggressiveRatio);

    let riskLevel: BidStrategy['riskLevel'] = 'SAFE';
    let message = 'Bid within safe limits.';

    if (currentBid > safeMaxBid) {
        riskLevel = 'CRITICAL';
        message = 'You cannot afford this bid without breaking squad rules!';
    } else if (currentBid > recommendedLimit) {
        riskLevel = 'RISKY';
        message = 'High spending! Ensure this is a key player.';
    } else if (currentBid > recommendedLimit * 0.7) {
        riskLevel = 'MODERATE';
        message = 'Approaching recommended limit.';
    }

    // Edge case: If this is the last player needed for min squad, you can go all in (safeMaxBid == purse)
    if (slotsToFillMin === 0) {
        if (riskLevel === 'RISKY') {
            riskLevel = 'MODERATE';
            message = 'Go for it if you really want them.';
        }
    }

    return {
        safeMaxBid,
        recommendedLimit,
        riskLevel,
        message
    };
}
