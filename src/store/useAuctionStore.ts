import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useToastStore } from './useToastStore';
import { useAuthStore } from './useAuthStore';
import type { AuctionState, Player, Team, AuctionSettings } from '../types';

// Connect to Backend with dynamic auth
// We can't just invoke io() at top level anymore if we want to pass token from store/localStorage
// But io() auto-connects. Let's delay connection or use auth option.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || ''; // Fallback to relative/proxy in dev

const socket = io(BACKEND_URL, {
    autoConnect: false, // Wait for auth
    transports: ['websocket'], // Force WebSocket for better performance/latency
    reconnection: true,
    reconnectionAttempts: Infinity, // Try forever
    reconnectionDelay: 1000, // Start fast
    reconnectionDelayMax: 5000, // Cap at 5s
    timeout: 20000,
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
    latency: number | null; // ms
    timeOffset: number; // serverTime - clientTime (ms)
    currentPlayerId: string | null; // Server sends this, frontend derives currentPlayer
    _lastUpdated: number; // Timestamp to force re-renders on state updates

    // Server State properties that might be missing from AuctionState in some contexts
    passedTeams: string[];

    // Actions
    placeBid: (teamId: string, amount: number) => void;
    passBid: () => void;
    escalateBid: () => void;
    requestSync: () => void;

    // Admin Actions
    adminSetPlayer: (playerId: string) => void;
    adminSoldPlayer: (playerId: string, teamId: string, amount: number) => void;
    adminUnsoldPlayer: (playerId: string) => void;
    adminPauseAuction: (isPaused: boolean) => void;
    adminUpdateSettings: (settings: AuctionSettings) => void;
    adminRollbackBid: () => void;

    // Player Management & RTM
    addPlayer: (player: Player) => void;
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    deletePlayer: (id: string) => void;
    executeRTM: (playerId: string, teamId: string, amount?: number) => void;

    adminRTMDecision: (decision: boolean) => Promise<void>;
    adminRTMHike: (amount: number) => Promise<void>;
    adminRTMMatch: (match: boolean) => Promise<void>;
    adminUpdateBid: (amount: number) => Promise<void>;
    adminResetRTM: () => void;

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

    // Bot Actions
    toggleBot: (teamId: string, isBot: boolean) => void;

    // --- Set Management ---
    updateSetOrder: (newOrder: number[]) => void;
}

export const useAuctionStore = create<AuctionStore>()((set, _get) => {
    // Listen for updates from server
    socket.on('connect', () => {
        console.log('[Socket] Connected successfully');
        set({ isConnected: true });
        useToastStore.getState().addToast('Connected to Server', 'success', 2000);

        // Start Latency Check Loop
        startLatencyCheck(set);

        // Auto-sync state on connection
        console.log('[Socket] Requesting initial state sync...');
        socket.emit('client:sync');
    });

    socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        set({ isConnected: false, latency: null });
        stopLatencyCheck();

        // Only show error for unexpected disconnects
        if (reason === 'io server disconnect' || reason === 'transport close') {
            useToastStore.getState().addToast(`Connection Lost: ${reason}`, 'error');
        }

        // If server closed the connection, try to reconnect
        if (reason === 'io server disconnect') {
            socket.connect();
        }
    });

    socket.on('reconnect', (attemptNumber) => {
        console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
        set({ isConnected: true });
        useToastStore.getState().addToast('Connection Restored!', 'success');

        // Sync state immediately after reconnection
        console.log('[Socket] Requesting state sync after reconnect...');
        socket.emit('client:sync');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`[Socket] Reconnection attempt #${attemptNumber}`);
        // Optional: We could show a specific "Reconnecting..." toast here if we had a way to update it
    });

    socket.on('reconnect_failed', () => {
        console.error('[Socket] Reconnection failed after all attempts');
        set({ isConnected: false });
        useToastStore.getState().addToast('Connection Failed. Please refresh.', 'error');
    });

    socket.on('connect_error', (err) => {
        console.error('[Socket] Connection Error:', err.message);
        if (err.message === 'Authentication error') {
            useToastStore.getState().addToast('Authentication Failed. Please login again.', 'error');
        } else {
            // Only show generic connection errors if we aren't already handling disconnect
            // useToastStore.getState().addToast(`Connection Error: ${err.message}`, 'error');
        }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on('auction:update', (newState: any) => {
        console.log('[Store] Received auction:update:', {
            currentBid: newState.currentBid,
            status: newState.status,
            historyLen: newState.history?.length,
            currentPlayerId: newState.currentPlayerId,
            currentBidder: newState.currentBidder
        });
        // Explicitly set all known properties to ensure Zustand detects changes
        set((state) => ({
            ...state,
            status: newState.status ?? state.status,
            rtmState: newState.rtmState ?? state.rtmState,
            teams: newState.teams ?? state.teams,
            players: newState.players ?? state.players,
            currentSet: newState.currentSet ?? state.currentSet,
            currentPlayer: newState.currentPlayer ?? state.currentPlayer,
            currentPlayerId: newState.currentPlayerId ?? state.currentPlayerId,
            currentBid: newState.currentBid ?? state.currentBid,
            currentBidder: newState.currentBidder ?? state.currentBidder,
            history: newState.history ?? state.history,
            eventLog: newState.eventLog ?? state.eventLog,
            isPaused: newState.isPaused ?? state.isPaused,
            timerExpiresAt: newState.timerExpiresAt ?? state.timerExpiresAt,
            settings: newState.settings ?? state.settings,
            nominations: newState.nominations ?? state.nominations,
            setOrder: newState.setOrder ?? state.setOrder,
            // Force re-render by updating a timestamp
            _lastUpdated: Date.now()
        }));
    });

    socket.on('auction:connected-users', (users: any[]) => {
        set({ connectedUsers: users });
    });

    socket.on('bid:error', (errorMsg: string) => {
        console.error('Bid Failed:', errorMsg);
        useToastStore.getState().addToast(`Bid Failed: ${errorMsg}`, 'error');
    });

    socket.on('error', (errMsg: string) => {
        console.error('Auction Error:', errMsg);
        useToastStore.getState().addToast(`Error: ${errMsg}`, 'error');
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
        currentPlayerId: null,
        currentBid: 0,
        currentBidder: null,
        history: [],
        eventLog: [],
        passedTeams: [],
        isPaused: true,
        isConnected: false,
        latency: null,
        timeOffset: 0,
        timerExpiresAt: null,
        settings: { defaultDuration: 60, resetDuration: 30 },
        nominations: { isOpen: false, submissions: [] },
        setOrder: [],
        _lastUpdated: 0,

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
            console.log('[Store] placeBid:', { teamId, amount });
            socket.emit('bid:place', { teamId, amount }, (response: any) => {
                if (response?.error) {
                    useToastStore.getState().addToast(response.error, 'error');
                }
            });
        },

        passBid: () => {
            const { isConnected } = useAuctionStore.getState();
            if (!isConnected) return;
            const state = useAuthStore.getState();
            if (state.role === 'team' && state.teamId) {
                socket.emit('team:pass', { teamId: state.teamId }, (response: any) => {
                    if (response?.error) useToastStore.getState().addToast(response.error, 'error');
                });
            }
        },

        escalateBid: () => {
            const { isConnected } = useAuctionStore.getState();
            if (!isConnected) return;
            const state = useAuthStore.getState();
            if (state.role === 'team' && state.teamId) {
                socket.emit('team:escalate', { teamId: state.teamId }, (response: any) => {
                    if (response?.error) useToastStore.getState().addToast(response.error, 'error');
                });
            }
        },

        adminSetPlayer: (playerId) => {
            socket.emit('admin:set-player', { playerId });
        },

        adminSoldPlayer: (playerId, teamId, amount) => {
            return new Promise((resolve, reject) => {
                socket.emit('admin:sold', { playerId, teamId, amount }, (response: any) => {
                    if (response?.error) {
                        useToastStore.getState().addToast(response.error, 'error');
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        },

        adminUnsoldPlayer: (playerId) => {
            return new Promise((resolve, reject) => {
                socket.emit('admin:unsold', playerId, (response: any) => {
                    if (response?.error) {
                        useToastStore.getState().addToast(response.error, 'error');
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                });
            });
        },

        adminPauseAuction: (isPaused) => {
            console.log('[Store] adminPauseAuction called with:', isPaused);
            socket.emit('admin:pause', { isPaused });
        },

        adminUpdateSettings: (settings) => {
            socket.emit('admin:update-settings', settings);
        },

        adminRollbackBid: () => {
            socket.emit('admin:rollback-bid');
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
            return new Promise((resolve, reject) => {
                socket.emit('admin:rtm-decision', decision, (response: any) => {
                    if (response?.error) reject(response.error);
                    else resolve(response);
                });
            });
        },

        adminRTMHike: (amount) => {
            return new Promise((resolve, reject) => {
                socket.emit('admin:rtm-hike', amount, (response: any) => {
                    if (response?.error) reject(response.error);
                    else resolve(response);
                });
            });
        },

        adminRTMMatch: (match) => {
            return new Promise((resolve, reject) => {
                socket.emit('admin:rtm-match', { match }, (response: any) => {
                    if (response?.error) reject(response.error);
                    else resolve(response);
                });
            });
        },

        adminUpdateBid: (amount) => {
            return new Promise((resolve, reject) => {
                getSocket().emit('admin:updateBid', { amount }, (res: any) => {
                    if (res?.error) reject(res.error);
                    else resolve();
                });
            });
        },

        adminResetRTM: () => {
            socket.emit('admin:reset-rtm');
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

        toggleBot: (teamId, isBot) => {
            socket.emit('toggle_bot', { teamId, isBot });
        },

        resetAuction: () => {
            socket.emit('admin:reset');
        },

        // Force Sync Action
        requestSync: () => {
            if (socket.connected) {
                socket.emit('client:sync');
            }
        }
    };
});


export const getSocket = () => socket;

// --- Latency & Visibility Helper ---
let latencyInterval: any = null;

const startLatencyCheck = (set: any) => {
    stopLatencyCheck();
    latencyInterval = setInterval(() => {
        const start = Date.now();
        socket.emit('latency:ping', () => {
            const lat = Date.now() - start;
            set({ latency: lat });
        });
    }, 5000);
};

const stopLatencyCheck = () => {
    if (latencyInterval) clearInterval(latencyInterval);
    latencyInterval = null;
};

// Auto-reconnect on visibility change (Mobile Wake-up)
if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // If supposed to be connected (based on valid auth? we assume yes if loaded)
            // But we only force if disconnected
            if (!socket.connected) {
                console.log('[Visibility] Tab woke up, force reconnecting...');
                socket.connect();
            }
            // Immediately ping to check health
            if (socket.connected) {
                const start = Date.now();
                socket.emit('latency:ping', () => {
                    useAuctionStore.setState({ latency: Date.now() - start });
                });
            }
        }
    });
}
