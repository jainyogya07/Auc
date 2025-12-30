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

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

const auctionManager = require('./store');

// --- Connected Users Tracking ---
const connectedUsers = new Map(); // socketId -> { role, username, teamId, code }

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
    socket.on('bid:place', async ({ teamId, amount }) => {
        try {
            const newState = await auctionManager.placeBid(teamId, amount);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    // --- Admin Events ---
    socket.on('admin:set-player', async ({ playerId }) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
        try {
            const newState = await auctionManager.setNextPlayer(playerId);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:sold', async ({ playerId, teamId, amount }) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
        try {
            const newState = await auctionManager.soldPlayer(playerId, teamId, amount);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:unsold', async ({ playerId }) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
        try {
            const newState = await auctionManager.unsoldPlayer(playerId);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:pause', async ({ isPaused }) => {
        console.log(`[Socket] admin:pause received. isPaused=${isPaused}, User=${socket.user?.username}, Role=${socket.user?.role}`);
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) {
            console.warn('[Socket] admin:pause denied. Invalid role.');
            return;
        }
        try {
            const newState = await auctionManager.setPause(isPaused);
            io.emit('auction:update', newState);
        } catch (err) {
            console.error('[Socket] admin:pause error:', err.message);
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:update-settings', async (settings) => {
        if (socket.user.role !== 'admin') return;
        try {
            const newState = await auctionManager.updateSettings(settings);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    // Admin Reset Auction
    socket.on('admin:reset', async () => {
        if (socket.user.role !== 'admin') return;
        try {
            console.log('Admin initiated auction reset');
            const newState = await auctionManager.reset();
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    // --- Admin Player Management ---
    socket.on('admin:create-player', async (playerData) => {
        if (socket.user.role !== 'admin') return;
        try {
            const newState = await auctionManager.addPlayer(playerData);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:update-player', async ({ id, updates }) => {
        if (socket.user.role !== 'admin') return;
        try {
            const newState = await auctionManager.updatePlayer(id, updates);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:delete-player', async ({ id }) => {
        if (socket.user.role !== 'admin') return;
        try {
            const newState = await auctionManager.deletePlayer(id);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
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
            socket.emit('error', err.message);
        }
    });

    socket.on('team:submit-nomination', async ({ playerIds }) => {
        // Any team can submit? Yes, if authorized.
        // Identify team by socket user logic if strictly enforced, but here we trust the teamId claim?
        // Wait, socket.user (from middleware) has username, role.
        // For teams, username is usually team ID or related. 
        // Let's assume we pass teamId or derive it. 
        // The middleware `auth.js` verifies token. User schema has username like 'csk', 'mi'.
        // So socket.user.username is likely the teamId.

        try {
            const teamId = socket.user.username; // Assuming username === teamId
            const newState = await auctionManager.submitNomination(teamId, playerIds);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:finalize-nominations', async () => {
        if (socket.user.role !== 'admin') return;
        try {
            const state = await auctionManager.finalizeNominations();
            io.emit('auction:state', state);
        } catch (err) {
            socket.emit('auction:error', { message: err.message });
        }
    });

    socket.on('admin:update-set-order', async (newOrder) => {
        if (socket.user.role !== 'admin') return;
        try {
            const state = await auctionManager.updateSetOrder(newOrder);
            io.emit('auction:state', state);
        } catch (err) {
            socket.emit('auction:error', { message: err.message });
        }
    });

    socket.on('admin:rtm-decision', async ({ decision }) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
        try {
            const newState = await auctionManager.handleRTMDecision(decision);
            io.emit('auction:update', newState);
        } catch (e) {
            socket.emit('error', e.message);
        }
    });

    socket.on('admin:rtm-hike', async ({ amount }) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
        try {
            const newState = await auctionManager.submitHike(amount);
            io.emit('auction:update', newState);
        } catch (e) {
            socket.emit('error', e.message);
        }
    });

    socket.on('admin:rtm-match', async ({ match }) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
        try {
            const newState = await auctionManager.finalizeRTMMatch(match);
            io.emit('auction:update', newState);
        } catch (e) {
            socket.emit('error', e.message);
        }
    });

    socket.on('admin:rtm', async ({ playerId, teamId, amount }) => {
        if (!socket.user || (socket.user.role !== 'admin' && socket.user.role !== 'auctioneer')) return;
        try {
            const newState = await auctionManager.rtmPlayer(playerId, teamId, amount);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    // --- Admin Team Management ---
    socket.on('admin:create-team', async (teamData) => {
        if (socket.user.role !== 'admin') return;
        try {
            const newState = await auctionManager.addTeam(teamData);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:update-team', async ({ id, updates }) => {
        if (socket.user.role !== 'admin') return;
        try {
            const newState = await auctionManager.updateTeam(id, updates);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('admin:delete-team', async ({ id }) => {
        if (socket.user.role !== 'admin') return;
        try {
            const newState = await auctionManager.deleteTeam(id);
            io.emit('auction:update', newState);
        } catch (err) {
            socket.emit('error', err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        connectedUsers.delete(socket.id);
        broadcastConnectedUsers();
    });
});

server.listen(PORT, async () => {
    await connectDB();
    await auctionManager.initialize();
    console.log(`Server running on http://localhost:${PORT}`);
});
