import { create } from 'zustand';
import { io } from 'socket.io-client';
import type { AuctionState, Player, Team, AuctionSettings } from '../types';

// Connect to Backend with dynamic auth
// We can't just invoke io() at top level anymore if we want to pass token from store/localStorage
// But io() auto-connects. Let's delay connection or use auth option.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''; // Fallback to relative/proxy in dev

const socket = io(BACKEND_URL, {
    autoConnect: false, // Wait for auth
    transports: ['websocket', 'polling'], // Explicitly define transports for better stability
    auth: (cb) => {
        const token = localStorage.getItem('auc_token');
        cb({ token });
    }
});

interface AuctionStore extends AuctionState {
    teams: Team[];
    players: Player[];
    connectedUsers: any[]; // Track connected users globally
    isConnected: boolean;

    // Actions
    placeBid: (teamId: string, amount: number) => void;

    // Admin Actions
    adminSetPlayer: (playerId: string) => void;
    adminSoldPlayer: (playerId: string, teamId: string, amount: number) => void;
    adminUnsoldPlayer: (playerId: string) => void;
    adminPauseAuction: (isPaused: boolean) => void;
    adminUpdateSettings: (settings: AuctionSettings) => void;

    // Player Management & RTM
    addPlayer: (player: Player) => void;
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    deletePlayer: (id: string) => void;
    executeRTM: (playerId: string, teamId: string, amount?: number) => void;

    adminRTMDecision: (decision: boolean) => void;
    adminRTMHike: (amount: number) => void;
    adminRTMMatch: (match: boolean) => void;

    // Team Management
    addTeam: (team: Team) => void;
    updateTeam: (id: string, updates: Partial<Team>) => void;
    deleteTeam: (id: string) => void;

    // Dev/Debug
    resetAuction: () => void;

    // Manual Connect (called by AuthStore or App)
    connectSocket: () => void;
    disconnectSocket: () => void;

    // Nomination Actions
    toggleNominations: (isOpen: boolean) => void;
    submitNomination: (playerIds: string[]) => void;
    finalizeNominations: () => void;
    updateSetOrder: (newOrder: number[]) => void;
}

export const useAuctionStore = create<AuctionStore>()((set, _get) => {
    // Listen for updates from server
    socket.on('connect', () => {
        console.log('Socket Connected');
        set({ isConnected: true });
    });

    socket.on('disconnect', () => {
        console.log('Socket Disconnected');
        set({ isConnected: false });
    });

    socket.on('connect_error', (err) => {
        console.error('Socket Connection Error:', err.message);
        if (err.message === 'Authentication error') {
            // Optionally triggering logout here might be too aggressive if it's just a flake
            // But usually means token is invalid.
        }
    });

    socket.on('auction:update', (newState: Partial<AuctionState>) => {
        set((state) => ({ ...state, ...newState }));
    });

    socket.on('auction:connected-users', (users: any[]) => {
        set({ connectedUsers: users });
    });

    socket.on('bid:error', (errorMsg: string) => {
        console.error('Bid Failed:', errorMsg);
        // Rollback optimistic update:
        // Ideally we would fetch the last known good state, but simply popping the temp history
        // and reverting currentBid is a start. For now, let's trust the next 'auction:update' to fix it
        // which usually follows or we can force a sync.

        // Let's trigger a toast or alert for the user?
        // Actually, let's remove the optimistic history item if it exists
        set((state) => ({
            history: state.history.filter(h => !h.id.toString().startsWith('temp-'))
        }));

        // Re-sync with server state just in case
        socket.emit('auction:sync'); // Assuming we have or can add this, or just wait for update
    });

    socket.on('error', (errMsg: string) => {
        console.error('Auction Error:', errMsg);
        // Only alert if it's a critical system error, not just a rejected bid handled above
        if (!errMsg.includes('Bid')) {
            alert(`Error: ${errMsg}`);
        }
    });

    return {
        // Initial State
        status: 'IDLE',
        rtmState: null,
        teams: [],
        players: [],
        connectedUsers: [],
        currentSet: 1,
        currentPlayer: null,
        currentBid: 0,
        currentBidder: null,
        history: [],
        eventLog: [],
        isPaused: true,
        isConnected: false,
        timerExpiresAt: null,
        settings: { defaultDuration: 60, resetDuration: 30 },
        nominations: { isOpen: false, submissions: [] },
        setOrder: [],

        connectSocket: () => {
            if (!socket.connected) {
                socket.connect();
            }
        },

        disconnectSocket: () => {
            if (socket.connected) {
                socket.disconnect();
            }
        },

        placeBid: (teamId, amount) => {
            // Optimistic Update: Update local state immediately for instant feedback
            set((state) => ({
                currentBid: amount,
                currentBidder: teamId,
                // Add temporary history item for instant visual feedback
                history: [
                    {
                        id: `temp-${Date.now()}`,
                        teamId,
                        amount,
                        playerId: state.currentPlayer?.id || 'unknown',
                        timestamp: Date.now()
                    },
                    ...state.history
                ]
            }));

            // Emit to server
            socket.emit('bid:place', { teamId, amount });
        },

        adminSetPlayer: (playerId) => {
            socket.emit('admin:set-player', { playerId });
        },

        adminSoldPlayer: (playerId, teamId, amount) => {
            socket.emit('admin:sold', { playerId, teamId, amount });
        },

        adminUnsoldPlayer: (playerId) => {
            socket.emit('admin:unsold', { playerId });
        },

        adminPauseAuction: (isPaused) => {
            console.log('[Store] adminPauseAuction called with:', isPaused);
            socket.emit('admin:pause', { isPaused });
        },

        adminUpdateSettings: (settings) => {
            socket.emit('admin:update-settings', settings);
        },

        addPlayer: (player) => {
            socket.emit('admin:create-player', player);
        },

        updatePlayer: (id, updates) => {
            socket.emit('admin:update-player', { id, updates });
        },

        deletePlayer: (id) => {
            socket.emit('admin:delete-player', { id });
        },

        executeRTM: (playerId, teamId, amount = 0) => {
            socket.emit('admin:rtm', { playerId, teamId, amount });
        },

        adminRTMDecision: (decision) => {
            socket.emit('admin:rtm-decision', { decision });
        },

        adminRTMHike: (amount) => {
            socket.emit('admin:rtm-hike', { amount });
        },

        adminRTMMatch: (match) => {
            socket.emit('admin:rtm-match', { match });
        },

        submitHike: (amount: number) => {
            socket.emit('admin:submit-hike', amount);
        },
        finalizeRTMMatch: (match: boolean) => {
            socket.emit('admin:finalize-rtm-match', match);
        },

        // Team Management
        addTeam: (team: Team) => {
            socket.emit('admin:create-team', team);
        },
        updateTeam: (id: string, updates: Partial<Team>) => {
            socket.emit('admin:update-team', { id, updates });
        },
        deleteTeam: (id: string) => {
            socket.emit('admin:delete-team', { id });
        },

        // --- Set Management ---
        updateSetOrder: (newOrder) => {
            socket.emit('admin:update-set-order', newOrder);
        },

        // Nomination Phase
        toggleNominations: (isOpen) => {
            socket.emit('admin:toggle-nominations', { isOpen });
        },
        submitNomination: (playerIds) => {
            socket.emit('team:submit-nomination', { playerIds });
        },
        finalizeNominations: () => {
            socket.emit('admin:finalize-nominations', {});
        },

        resetAuction: () => {
            socket.emit('admin:reset');
        }
    };
});


export const getSocket = () => socket;
