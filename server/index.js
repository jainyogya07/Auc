const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
    generateToken,
    authenticateToken,
    socketAuth,
    ADMIN_CREDS,
    AUCTIONEER_CREDS
} = require('./auth');
const connectDB = require('./config/db');
const { User, Team } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Health check route for Render
app.get('/', (req, res) => {
    res.send('Auction Server is Running');
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 5000, // 5 seconds - fast detection of dead connections
    pingInterval: 10000, // 10 seconds - frequent heartbeats
    // Performance optimizations for production
    compress: true,  // Enable compression for all messages
    maxHttpBufferSize: 1e6,  // 1MB max payload size
    transports: ['websocket', 'polling'],
    perMessageDeflate: {
        threshold: 1024  // Only compress messages > 1KB
    },
    connectTimeout: 10000  // 10s connection timeout
});

const PORT = process.env.PORT || 4000;

const auctionManager = require('./store');

// --- Connected Users Tracking ---
const connectedUsers = new Map(); // socketId -> { role, username, teamId, code }

// --- Security: Sanitize Errors ---
function sanitizeError(err) {
    const msg = err.message || 'Unknown Error';
    // Remove system paths (e.g. /Users/name/...)
    if (msg.includes('/') || msg.includes('\\')) {
        // Return a generic safe message for system errors, or try to clean it
        if (msg.includes('ENOENT') || msg.includes('EADDRINUSE')) {
            return 'Internal Server Error (System Resource)';
        }
        // If it looks like a path, strip it?
        // Simple heuristic: If it contains "Desktop" or "Users", mask it.
        if (msg.includes('/Users/') || msg.includes('C:\\')) {
            return 'Internal Server Error (Path Hidden)';
        }
    }
    return msg;
}

function broadcastConnectedUsers() {
    const usersList = Array.from(connectedUsers.values());
    // Filter to avoid duplicates if same user has multiple tabs (optional, but good for UI)
    // For now, raw list is fine, or unique by username/id
    const uniqueUsers = Array.from(new Map(usersList.map(u => [u.username, u])).values());
    io.emit('auction:connected-users', uniqueUsers);
}

// --- Auth Routes ---
app.post('/api/login', async (req, res) => {
    const { role, username, password, inviteCode } = req.body;

    try {
        if (role === 'admin' || role === 'auctioneer') {
            const user = await User.findOne({ username, role });
            if (user && user.password === password) { // In prod, hash passwords!
                const token = generateToken({ role: user.role, username: user.username });
                return res.json({ token, role: user.role, username: user.username });
            }
        }

        if (role === 'team') {
            // Find team by invite code directly from DB
            const team = await Team.findOne({ inviteCode });
            if (team) {
                const token = generateToken({ role: 'team', teamId: team.id, username: team.name, code: team.code });
                return res.json({ token, role: 'team', teamId: team.id, username: team.name, code: team.code });
            }
            return res.status(401).json({ error: 'Invalid Invite Code' });
        }

        return res.status(401).json({ error: 'Invalid Credentials' });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Basic API Endpoint
app.get('/api/status', (req, res) => {
    res.json({ status: 'Server is running', timestamp: Date.now() });
});

app.get('/api/state', (req, res) => {
    // Optional: Protect this too? For now public for projector View
    res.json(auctionManager.getState());
});

// Reset (Dev only)
app.post('/api/reset', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const state = await auctionManager.reset();
    io.emit('auction:update', state);
    res.json(state);
});

// Socket.io Middleware
io.use(socketAuth);

// Socket.io Connection
io.on('connection', (socket) => {
    const user = socket.user;
    console.log('User connected:', socket.id, 'Role:', user.role, 'User:', user.username);

    // Track User
    connectedUsers.set(socket.id, {
        role: user.role,
        username: user.username,
        teamId: user.teamId,
        code: user.code || (user.role === 'team' ? 'TEAM' : user.role.toUpperCase().slice(0, 3))
    });
    broadcastConnectedUsers();

    // Send initial state on connection
    socket.emit('auction:update', auctionManager.getState());

    // --- Team Events ---
    // --- Team Events ---
    socket.on('bid:place', async ({ teamId, amount }, ack) => {
        try {
            console.log(`[bid:place] Request from socket=${socket.id}`);
            console.log(`[bid:place] socket.user=${JSON.stringify(socket.user)}`);
            console.log(`[bid:place] payload={ teamId: '${teamId}', amount: ${amount} }`);

            // Role & Identity Check
            if (!socket.user || socket.user.role !== 'team') {
                console.error('[bid:place] Failed role check');
                throw new Error('Unauthorized: Only teams can place bids');
            }
            if (socket.user.teamId !== teamId) {
                console.error(`[bid:place] Failed teamId check: user.teamId=${socket.user.teamId}, payload.teamId=${teamId}`);
                throw new Error('Unauthorized: You can only bid for your own team');
            }

            // Input Validation
            if (!amount || isNaN(amount) || amount <= 0) {
                throw new Error('Invalid Bid Amount');
            }

            console.log(`[bid:place] Received request: team=${teamId}, amount=${amount}`);
            const newState = await auctionManager.placeBid(teamId, amount);
            io.emit('auction:update', newState);

            // Acknowledge success if callback provided
            if (typeof ack === 'function') ack({ success: true });

        } catch (err) {
            console.error('[bid:place] Error:', err.message);
            // socket.emit('bid:error', sanitizeError(err)); // Deprecated in favor of ack

            // Acknowledge error if callback provided
            if (typeof ack === 'function') ack({ error: sanitizeError(err) });
            else socket.emit('error', sanitizeError(err)); // Fallback
        }
    });

    socket.on('team:pass', async ({ teamId }, ack) => {
        try {
            if (socket.user.role === 'team' && socket.user.teamId !== teamId) {
                throw new Error('Unauthorized');
            }
            const newState = await auctionManager.pass(teamId);
            io.emit('auction:update', newState);
            if (typeof ack === 'function') ack({ success: true });
        } catch (err) {
            if (typeof ack === 'function') ack({ error: sanitizeError(err) });
            else socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('team:escalate', async ({ teamId }, ack) => {
        try {
            if (socket.user.role === 'team' && socket.user.teamId !== teamId) {
                throw new Error('Unauthorized');
            }
            const newState = await auctionManager.escalate(teamId);
            io.emit('auction:update', newState);
            if (typeof ack === 'function') ack({ success: true });
        } catch (err) {
            if (typeof ack === 'function') ack({ error: sanitizeError(err) });
            else socket.emit('error', sanitizeError(err));
        }
    });

    // --- Admin Events ---
    socket.on('admin:set-player', async ({ playerId }) => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) {
                console.error(`[Socket] Unauthorized admin:set-player access by user: ${JSON.stringify(socket.user)}`);
                throw new Error('Unauthorized: Admin/Auctioneer access required');
            }
            if (!playerId) throw new Error('Player ID is required');

            console.log(`[Socket] admin:set-player for ${playerId} from ${socket.user?.username}`);
            const newState = await auctionManager.setNextPlayer(playerId);
            io.emit('auction:update', newState);
            console.log('[Socket] admin:set-player success');
        } catch (err) {
            console.error('[Socket] admin:set-player error:', err.message);
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:sold', async ({ playerId, teamId, amount }) => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
            // Basic validation
            if (!playerId || !teamId || !amount) throw new Error('Missing conversion data');

            const newState = await auctionManager.soldPlayer(playerId, teamId, amount);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:unsold', async ({ playerId }) => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
            const newState = await auctionManager.unsoldPlayer(playerId);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:pause', async ({ isPaused }) => {
        console.log(`[Socket] admin:pause received. isPaused=${isPaused}, User=${socket.user?.username}, Role=${socket.user?.role}`);
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) {
                throw new Error('Unauthorized: Admin/Auctioneer access required');
            }
            const newState = await auctionManager.setPause(isPaused);
            io.emit('auction:update', newState);
        } catch (err) {
            console.error('[Socket] admin:pause error:', err.message);
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:update-settings', async (settings) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const newState = await auctionManager.updateSettings(settings);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    // Admin Reset Auction
    socket.on('admin:reset', async () => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
            console.log('Admin initiated auction reset');
            const newState = await auctionManager.reset();
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    // Admin Rollback Last Bid
    socket.on('admin:rollback-bid', async () => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
            console.log('Admin initiated bid rollback');
            const newState = await auctionManager.rollbackLastBid();
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    // --- Admin Player Management ---
    socket.on('admin:create-player', async (playerData) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const newState = await auctionManager.addPlayer(playerData);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:update-player', async ({ id, updates }) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const newState = await auctionManager.updatePlayer(id, updates);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:delete-player', async ({ id }) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const newState = await auctionManager.deletePlayer(id);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    // --- Nomination Phase ---
    socket.on('admin:toggle-nominations', async ({ isOpen }) => {
        console.log(`[Socket] admin:toggle-nominations. isOpen=${isOpen}, User=${socket.user?.username}, Role=${socket.user?.role}`);
        if (!socket.user || socket.user.role !== 'admin') {
            console.warn('[Socket] admin:toggle-nominations denied. Not admin.');
            return;
        }
        try {
            const newState = await auctionManager.toggleNominationPhase(isOpen);
            io.emit('auction:update', newState);
        } catch (err) {
            console.error('[Socket] admin:toggle-nominations error:', err.message);
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('team:submit-nomination', async ({ playerIds }) => {
        try {
            // Team ID is passed in the token during login
            if (!socket.user || socket.user.role !== 'team') {
                throw new Error('Unauthorized: Only teams can submit nominations');
            }
            const teamId = socket.user.teamId; // Use teamId from token, NOT username
            const newState = await auctionManager.submitNomination(teamId, playerIds);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:finalize-nominations', async () => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const state = await auctionManager.finalizeNominations();
            io.emit('auction:update', state);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:update-set-order', async (newOrder) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const state = await auctionManager.updateSetOrder(newOrder);
            io.emit('auction:update', state);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:rtm-decision', async (decision, ack) => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) {
                throw new Error('Unauthorized');
            }
            // Logic tweak: If decision comes as object { decision: boolean } or direct boolean
            const actualDecision = typeof decision === 'object' ? decision.decision : decision;
            const newState = await auctionManager.handleRTMDecision(actualDecision);
            io.emit('auction:update', newState);
            if (typeof ack === 'function') ack({ success: true });
        } catch (e) {
            if (typeof ack === 'function') ack({ error: sanitizeError(e) });
            else socket.emit('error', sanitizeError(e));
        }
    });

    socket.on('admin:rtm-hike', async (amount, ack) => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) {
                throw new Error('Unauthorized');
            }
            // Handle if amount is sent as number directly or object property (though typical emit might be one arg)
            const actualAmount = typeof amount === 'object' ? amount.amount : amount;

            if (!actualAmount || actualAmount <= 0) throw new Error('Invalid hike amount');
            const newState = await auctionManager.submitHike(actualAmount);
            io.emit('auction:update', newState);
            if (typeof ack === 'function') ack({ success: true });
        } catch (e) {
            if (typeof ack === 'function') ack({ error: sanitizeError(e) });
            else socket.emit('error', sanitizeError(e));
        }
    });

    socket.on('admin:rtm-match', async ({ match }, ack) => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) {
                throw new Error('Unauthorized');
            }
            const newState = await auctionManager.finalizeRTMMatch(match);
            io.emit('auction:update', newState);
            if (typeof ack === 'function') ack({ success: true });
        } catch (e) {
            if (typeof ack === 'function') ack({ error: sanitizeError(e) });
            else socket.emit('error', sanitizeError(e));
        }
    });

    socket.on('admin:rtm', async ({ playerId, teamId, amount }) => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
            const newState = await auctionManager.rtmPlayer(playerId, teamId, amount);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:reset-rtm', async () => {
        try {
            if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
            const newState = await auctionManager.resetRTM();
            io.emit('auction:update', newState);
            socket.emit('socket:toast', { type: 'success', message: 'RTM Phase Reset Successfully' });
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    // Retention Management
    socket.on('admin:seed-retentions', async (retentionData, ack) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') {
                throw new Error('Unauthorized: Admin only');
            }
            const newState = await auctionManager.seedRetentions(retentionData);
            io.emit('auction:update', newState);
            if (typeof ack === 'function') ack({ success: true });
        } catch (err) {
            console.error('[admin:seed-retentions] Error:', err.message);
            if (typeof ack === 'function') ack({ error: sanitizeError(err) });
            else socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:clear-retentions', async (ack) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') {
                throw new Error('Unauthorized: Admin only');
            }
            const newState = await auctionManager.clearRetentions();
            io.emit('auction:update', newState);
            if (typeof ack === 'function') ack({ success: true });
        } catch (err) {
            console.error('[admin:clear-retentions] Error:', err.message);
            if (typeof ack === 'function') ack({ error: sanitizeError(err) });
            else socket.emit('error', sanitizeError(err));
        }
    });

    // --- Admin Team Management ---
    socket.on('admin:create-team', async (teamData) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const newState = await auctionManager.addTeam(teamData);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:update-team', async ({ id, updates }) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const newState = await auctionManager.updateTeam(id, updates);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    socket.on('admin:delete-team', async ({ id }) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            const newState = await auctionManager.deleteTeam(id);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', sanitizeError(err));
        }
    });

    // Bot Toggle
    socket.on('toggle_bot', async ({ teamId, isBot }) => {
        try {
            if (!socket.user || socket.user.role !== 'admin') return;
            console.log(`[Admin] Toggling bot for team ${teamId}: ${isBot}`);

            const newState = await auctionManager.updateTeam(teamId, { isBot });
            io.emit('auction:update', newState);

            // Trigger bot evaluation if enabled
            if (isBot) {
                auctionManager.botEngine.evaluateState(newState);
            }
        } catch (err) {
            console.error('Bot toggle error:', err);
            socket.emit('error', sanitizeError(err));
        }
    });

    // --- Latency Check ---
    socket.on('latency:ping', (callback) => {
        if (typeof callback === 'function') callback();
    });

    // --- Chat System ---
    socket.on('chat:message', (msg) => {
        try {
            // Broadcast to all connected clients
            // We could validate msg structure here or add server-timestamp
            io.emit('chat:broadcast', msg);
        } catch (err) {
            console.error('Chat error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        connectedUsers.delete(socket.id);
        broadcastConnectedUsers();
    });
});

server.listen(PORT, '0.0.0.0', async () => {
    await connectDB();
    auctionManager.setIo(io);
    await auctionManager.initialize();
    console.log(`Server running on http://localhost:${PORT}`);
});
