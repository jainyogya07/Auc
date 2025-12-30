const io = require('socket.io-client');

async function testAuctionFlow() {
    console.log('--- Starting Auction Flow Test ---');

    // Helper for fetch
    const post = async (url, body, headers = {}) => {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
        return res.json();
    };

    // 1. Authenticate Admin
    console.log('Logging in as Admin...');
    const adminLogin = await post('http://localhost:4000/api/login', {
        role: 'admin',
        username: 'admin',
        password: 'admin123'
    });
    const adminToken = adminLogin.token;
    console.log('Admin Token Received');

    // 2. Authenticate Team (RCB)
    console.log('Logging in as Team (RCB)...');
    const teamLogin = await post('http://localhost:4000/api/login', {
        role: 'team',
        inviteCode: 'RCB2024'
    });
    const teamToken = teamLogin.token;
    const teamId = teamLogin.teamId;
    console.log('Team Token Received for:', teamId);

    // 3. Connect Sockets
    const adminSocket = io('http://localhost:4000', {
        auth: { token: adminToken }
    });
    const teamSocket = io('http://localhost:4000', {
        auth: { token: teamToken }
    });

    await new Promise(resolve => {
        let connected = 0;
        const check = () => { connected++; if (connected === 2) resolve(); };
        adminSocket.on('connect', () => { console.log('Admin Socket Connected'); check(); });
        teamSocket.on('connect', () => { console.log('Team Socket Connected'); check(); });
    });

    // Helper to log state
    const logState = (source, state) => {
        console.log(`[${source}] State Update: Status=${state.status}, Player=${state.currentPlayer?.name}, Bid=${state.currentBid}`);
    };

    // Listen for updates
    adminSocket.on('auction:update', (s) => logState('Admin', s));

    // 4. Reset Auction (Admin)
    console.log('Resetting Auction...');
    // We can use the API for reset
    await post('http://localhost:4000/api/reset', {}, { 'Authorization': `Bearer ${adminToken}` });
    await new Promise(r => setTimeout(r, 1000));

    // 5. Select Player (IDLE -> NOMINATED)
    console.log('Selecting Player p1 (Virat Kohli)...');
    adminSocket.emit('admin:set-player', { playerId: 'p1' });
    await new Promise(r => setTimeout(r, 1000));

    // 6. Place Bid (NOMINATED -> BIDDING)
    console.log('Placing Bid of 2Cr...');
    teamSocket.emit('bid:place', { teamId, amount: 2.0 });
    await new Promise(r => setTimeout(r, 1000));

    // 7. Place Higher Bid (BIDDING -> BIDDING) - Fails self-bid usually but lets see logic
    // Logic says "Bid must be higher". Current is 2.0.
    console.log('Placing Higher Bid of 2.2Cr...');
    teamSocket.emit('bid:place', { teamId, amount: 2.2 });
    await new Promise(r => setTimeout(r, 1000));

    // 8. Sell Player (BIDDING -> SOLD)
    console.log('Selling Player...');
    adminSocket.emit('admin:sold', { playerId: 'p1', teamId, amount: 2.2 });
    await new Promise(r => setTimeout(r, 1000));

    // 9. Try Illegal Move (Place Bid after Sold)
    console.log('Attempting Illegal Bid (Should Fail)...');
    teamSocket.emit('bid:place', { teamId, amount: 3.0 });
    teamSocket.on('error', (err) => console.log('Caught Expected Error:', err));
    await new Promise(r => setTimeout(r, 1000));

    console.log('--- Test Complete ---');
    process.exit(0);
}

testAuctionFlow().catch(console.error);
