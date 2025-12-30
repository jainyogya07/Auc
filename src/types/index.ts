export type Role = 'admin' | 'team' | 'auctioneer' | 'viewer';

export interface Team {
    id: string;
    name: string;
    code: string; // e.g., RCB, CSK
    logo: string;
    purse: number; // In Crores
    purseUsed: number;
    squadCount: number;
    foreignPlayers: number;
    rtmCardsLeft: number;
    color: string; // Hex code
}

export interface Player {
    id: string;
    name: string;
    role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket Keeper';
    country: string;
    basePrice: number; // In Crores
    isForeign: boolean;
    status: 'U' | 'S' | 'US'; // Unsold, Sold, Unsold (passed)
    soldPrice?: number;
    soldTo?: string; // Team ID
    soldVia?: 'BID' | 'RTM';
    originalTeamId?: string;
    set: number;
}

export type AuctionStatus = 'IDLE' | 'NOMINATED' | 'BIDDING' | 'SOLD' | 'UNSOLD' | 'PAUSED'; // Updated


export interface AuctionState {
    status: AuctionStatus;
    rtmState: null | 'PENDING_DECISION' | 'AWAITING_HIKE' | 'AWAITING_MATCH';
    currentSet: number;
    currentPlayer: Player | null;
    currentBid: number;
    currentBidder: string | null; // Team ID
    history: Bid[];
    eventLog: AuctionEvent[];
    isPaused: boolean;
    timerExpiresAt: number | null;
    settings: AuctionSettings;
    nominations?: {
        isOpen: boolean;
        submissions: { teamId: string; playerIds: string[] }[];
    };
    setOrder?: number[];
}

export interface AuctionSettings {
    defaultDuration: number; // Seconds
    resetDuration: number;   // Seconds
}

export interface Bid {
    id: string;
    playerId: string;
    teamId: string;
    amount: number;
    timestamp: number;
}

export interface AuctionEvent {
    id: string;
    type: 'BID_PLACED' | 'PLAYER_SOLD' | 'PLAYER_UNSOLD' | 'PLAYER_SET' | 'AUCTION_PAUSED' | 'AUCTION_RESUMED';
    timestamp: number;
    details: any;
}
