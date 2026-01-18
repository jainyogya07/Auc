import { useState, useEffect, useRef } from 'react';
import { useAuctionStore, getSocket } from '../../store/useAuctionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { History, Hand, MessageSquare, Send, Wifi, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';
// clsx removed
import { motion, AnimatePresence } from 'framer-motion';

import { useAuctionAudio } from '../../hooks/useAuctionAudio';

const SynchronizedTimer = ({ expiresAt }: { expiresAt: number }) => {
    const { timeOffset } = useAuctionStore();
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const updateTimer = () => {
            // ServerTime = ClientTime + Offset
            // expireAt is ServerTime
            const now = Date.now() + timeOffset;
            const diff = Math.max(0, Math.ceil((expiresAt - now) / 1000));
            setTimeLeft(diff);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [expiresAt, timeOffset]);

    if (timeLeft <= 0) return null;

    return (
        <div className={cn(
            "text-2xl font-black rounded-lg px-3 py-1 border-2 flex items-center justify-center animate-in zoom-in",
            timeLeft <= 10 ? "text-rose-500 border-rose-500 bg-rose-500/10 animate-pulse" : "text-amber-500 border-amber-500 bg-amber-500/10"
        )}>
            {timeLeft}s
        </div>
    );
};



export default function TeamAuctionArena() {
    const { currentPlayer, currentBid, currentBidder, placeBid, history, teams, status, _lastUpdated, isPaused, isConnected, timerExpiresAt, latency, passedTeams, passBid, escalateBid } = useAuctionStore();
    const { teamId: userTeamId } = useAuthStore();
    const hasPassed = userTeamId ? passedTeams.includes(userTeamId) : false;

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!timerExpiresAt) {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const diff = Math.max(0, Math.ceil((timerExpiresAt - Date.now()) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) clearInterval(interval);
        }, 200);

        return () => clearInterval(interval);
    }, [timerExpiresAt]);

    // Debug: Log when component re-renders with new values
    useEffect(() => {
        console.log('[TeamAuctionArena] State updated:', { currentBid, currentBidder, status, historyLen: history?.length, _lastUpdated, timerExpiresAt });
    }, [currentBid, currentBidder, status, history, _lastUpdated, timerExpiresAt]);

    // Play Sounds
    useAuctionAudio();

    // Use logged-in team
    const myTeam = teams.find(t => t.id === userTeamId);
    const leadingTeam = teams.find(t => t.id === currentBidder);

    // Local Bidding Cooldown State to prevent double-clicks/race conditions
    const [isBidding, setIsBidding] = useState(false);

    // Chat State
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ id: string, sender: string, text: string, time: number }[]>(() => [
        { id: '1', sender: 'System', text: 'Welcome to the Auction Arena!', time: Date.now() }
    ]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // History Panel State (Desktop)
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);

    // Mobile Tab State
    const [activeTab, setActiveTab] = useState<'chat' | 'history'>('chat');

    // Auto-scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, activeTab]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim() || !isConnected) return;

        const newMsg = {
            id: Math.random().toString(36).substr(2, 9),
            sender: myTeam?.code || 'Me',
            text: chatMessage,
            time: Date.now()
        };

        // Emit to server
        getSocket().emit('chat:message', newMsg);
        setChatMessage('');
    };

    // Listen for incoming chat messages
    useEffect(() => {
        const socket = getSocket();

        const handleChatBroadcast = (msg: { id: string, sender: string, text: string, time: number }) => {
            // Optimization: Limit chat history to last 50 messages to prevent memory leaks
            setChatHistory((prev) => [...prev, msg].slice(-50));
        };

        socket.on('chat:broadcast', handleChatBroadcast);

        return () => {
            socket.off('chat:broadcast', handleChatBroadcast);
        };
    }, []);

    const minIncrement = currentBid < 2 ? 0.10 : currentBid < 5 ? 0.20 : 0.50; // Crores logic
    // First bid should be base price, subsequent bids add increment
    const nextBidAmount = currentBid === 0
        ? (currentPlayer?.basePrice || 2).toFixed(2)
        : (currentBid + minIncrement).toFixed(2);
    const isTimerExpired = timeLeft !== null && timeLeft <= 0;

    // Pass Confirmation State
    const [showPassConfirm, setShowPassConfirm] = useState(false);

    // Active Bidders Calculation (Teams that haven't passed)
    const activeBiddersCount = teams.filter(t => !passedTeams.includes(t.id)).length;
    const totalTeams = teams.length;

    if (!myTeam) return <div className="p-8 text-center text-slate-500">Access Denied: You must be logged in as a Team.</div>;

    const canAfford = myTeam.purse >= Number(nextBidAmount);
    const isLeading = currentBidder === myTeam.id;
    const canBid = (status === 'NOMINATED' || status === 'BIDDING') && canAfford && !isLeading && !!currentPlayer && !isPaused && !isBidding && !isTimerExpired;

    const handleBid = async () => {
        console.log('[TeamAuctionArena] handleBid clicked');
        if (isBidding) {
            console.warn('[TeamAuctionArena] Bid blocked: isBidding is true');
            return;
        }
        setIsBidding(true);

        // Get the FRESH state from store at click time to avoid race conditions
        const freshState = useAuctionStore.getState();
        const freshCurrentBid = freshState.currentBid;
        const freshCurrentBidder = freshState.currentBidder;
        const freshCurrentPlayer = freshState.currentPlayer;

        console.log('[TeamAuctionArena] Fresh State:', {
            freshCurrentBid,
            freshCurrentBidder,
            myTeamId: myTeam.id,
            purse: myTeam.purse,
            status: freshState.status
        });

        // Recalculate with fresh values
        const freshMinIncrement = freshCurrentBid < 2 ? 0.10 : freshCurrentBid < 5 ? 0.20 : 0.50;
        const freshNextBid = freshCurrentBid === 0
            ? (freshCurrentPlayer?.basePrice || 2)
            : (freshCurrentBid + freshMinIncrement);

        // Check if still valid to bid
        const canStillBid = (freshState.status === 'NOMINATED' || freshState.status === 'BIDDING')
            && myTeam.purse >= freshNextBid
            && freshCurrentBidder !== myTeam.id
            && !!freshCurrentPlayer;

        if (canStillBid) {
            console.log('[TeamAuctionArena] Placing bid...');
            placeBid(myTeam.id, Number(freshNextBid.toFixed(2)));
            // Cooldown to prevent spamming
            setTimeout(() => setIsBidding(false), 800);
        } else {
            console.warn('[TeamAuctionArena] Cannot bid - state validation failed inside handleBid', {
                statusCheck: (freshState.status === 'NOMINATED' || freshState.status === 'BIDDING'),
                purseCheck: myTeam.purse >= freshNextBid,
                bidderCheck: freshCurrentBidder !== myTeam.id,
                playerCheck: !!freshCurrentPlayer
            });
            setIsBidding(false);
        }
    };

    if (!currentPlayer) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <div className="bg-white/5 border border-white/10 p-16 rounded-[2.5rem] shadow-2xl max-w-lg w-full flex flex-col items-center relative overflow-hidden backdrop-blur-2xl">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-[100px]"></div>

                    <div className="relative z-10 w-28 h-28 bg-slate-900/50 rounded-full flex items-center justify-center mb-8 border border-white/10 shadow-2xl backdrop-blur-xl">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <svg
                                className="w-12 h-12 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </motion.div>
                    </div>

                    <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Waiting for Auctioneer</h2>
                    <p className="text-slate-400 mb-10 text-lg leading-relaxed font-medium">
                        The auction has not started yet. Please wait for the admin to initiate the session.
                    </p>

                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 font-bold text-sm backdrop-blur-lg">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></span>
                        Connected & Waiting...
                    </div>
                </div>
            </div>
        );
    }

    // --- Components for Reuse ---

    const PlayerCard = ({ className }: { className?: string }) => (
        <div className={cn("bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-8 relative overflow-hidden flex flex-col justify-center items-center shadow-2xl shrink-0 lg:shrink", className)}>
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
            <div className="relative z-10 text-center w-full max-w-2xl">
                <div className="flex justify-center mb-4 md:mb-6">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-4 border-white/10 bg-slate-900/50 flex items-center justify-center shadow-2xl relative backdrop-blur-md">
                        <span className="text-4xl md:text-6xl filter drop-shadow-lg">🏏</span>
                        {currentPlayer.isForeign && <span className="absolute top-0 right-0 bg-amber-500 text-black text-xs md:text-sm font-black px-3 py-1.5 rounded-full shadow-lg border-2 border-white/20">✈️</span>}
                    </div>
                </div>

                <h1 className="text-3xl md:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-2xl">{currentPlayer.name}</h1>
                <div className="flex justify-center gap-3 text-sm md:text-lg text-slate-300 mb-6 md:mb-8 font-bold tracking-wide">
                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">{currentPlayer.role}</span>
                    <span className="w-px h-6 bg-white/20"></span>
                    <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">{currentPlayer.country}</span>
                </div>

                {/* Active Bidders Indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="bg-black/30 border border-white/10 rounded-full px-5 py-2 flex items-center gap-3 shadow-inner backdrop-blur-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                        </span>
                        <span className="text-sm font-bold text-slate-300">
                            <span className="text-white">{activeBiddersCount}</span> / <span className="text-slate-500">{totalTeams}</span> Active Bidders
                        </span>
                    </div>
                </div>

                <div className={cn(
                    "py-6 px-4 md:py-10 md:px-16 rounded-3xl border transition-all duration-300 transform relative overflow-hidden backdrop-blur-md select-none",
                    isLeading ? "bg-emerald-500/10 border-emerald-500/50 scale-105 shadow-[0_0_50px_rgba(16,185,129,0.2)]" : "bg-white/5 border-white/10"
                )}>
                    {/* Visual Countdown Overlay if Timer Active */}
                    {timeLeft !== null && timeLeft > 0 && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-red-500/20">
                            <motion.div
                                className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: 60, ease: "linear" }}
                            />
                        </div>
                    )}

                    <div className="text-xs md:text-sm font-black tracking-[0.2em] uppercase mb-2 text-slate-400">Current Bid</div>
                    <div className="text-4xl md:text-7xl font-black text-white tabular-nums tracking-tighter drop-shadow-xl">
                        ₹ {currentBid.toFixed(2)} <span className="text-xl md:text-3xl text-emerald-400 font-bold">Cr</span>
                    </div>
                    {/* Timer Display - Only when active */}
                    {timeLeft !== null && (
                        <div className="mt-6 flex justify-center">
                            {timerExpiresAt ? (
                                <SynchronizedTimer expiresAt={timerExpiresAt} />
                            ) : (
                                <div className={cn("text-4xl font-black w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto border-[6px] backdrop-blur-xl shadow-2xl",
                                    timeLeft <= 10 ? "text-rose-500 border-rose-500 animate-pulse bg-rose-500/20 shadow-rose-900/50" : "text-amber-500 border-amber-500 bg-amber-500/20"
                                )}>
                                    {timeLeft}
                                </div>
                            )}
                        </div>
                    )}

                    {currentBidder && timeLeft === null && (
                        <div className="mt-4 text-sm md:text-xl font-bold text-emerald-400 flex items-center justify-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                            Winning: {leadingTeam?.name}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const BiddingPanel = () => (
        <div className="bg-slate-900 border-t md:border border-slate-800 p-4 md:p-6 rounded-t-2xl md:rounded-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)] md:shadow-none">
            <div className="flex flex-row items-center justify-between gap-4 md:gap-6">
                <div className="flex flex-col md:block text-left shrink-0">
                    <div className="text-xs md:text-sm text-slate-400 flex items-center gap-2">
                        Your Purse
                        {!isConnected && <span className="text-rose-500 text-xs">(Offline)</span>}
                    </div>
                    <div className={cn("text-lg md:text-2xl font-bold", canAfford ? "text-white" : "text-rose-500")}>
                        ₹ {myTeam.purse.toFixed(2)} Cr
                    </div>
                </div>

                <motion.button
                    onClick={handleBid}
                    whileTap={{ scale: 0.95 }}
                    disabled={!canBid || !isConnected}
                    className={cn(
                        "flex-1 h-10 md:h-12 text-base md:text-lg font-bold uppercase rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg relative overflow-hidden",
                        isPaused
                            ? "bg-amber-900/20 text-amber-500 cursor-not-allowed border border-amber-500/30"
                            : isLeading
                                ? "bg-slate-800 text-emerald-500 cursor-not-allowed border border-emerald-500/20"
                                : !canAfford
                                    ? "bg-rose-900/20 text-rose-500 cursor-not-allowed border border-rose-900/50"
                                    : !isConnected
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                                        : "bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-emerald-500/20 active:shadow-inner"
                    )}
                >
                    {isPaused ? (
                        <>PAUSED</>
                    ) : !isConnected ? (
                        <>OFFLINE</>
                    ) : isLeading ? (
                        <>
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse md:block hidden" />
                            Leading
                        </>
                    ) : (
                        <>
                            <Hand className="w-4 h-4" />
                            <span className="md:inline hidden">Bid </span> ₹ {nextBidAmount}
                        </>
                    )}
                </motion.button>

                {/* Pass / Escalate Buttons */}
                {/* Pass / Escalate Buttons */}
                {!hasPassed ? (
                    <div className="relative">
                        {/* Pass Confirmation Popup */}
                        {showPassConfirm ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="absolute bottom-full mb-3 left-0 right-0 bg-slate-800 border-2 border-rose-500/50 p-4 rounded-xl shadow-2xl z-50 w-64 -translate-x-1/2 left-1/2 transform text-center"
                                style={{ transform: 'translateX(-50%)' }} // React style needed to center absolute
                            >
                                <p className="text-white text-sm font-bold mb-3">Confirm Pass for this Player?</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { passBid(); setShowPassConfirm(false); }}
                                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        YES, PASS
                                    </button>
                                    <button
                                        onClick={() => setShowPassConfirm(false)}
                                        className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        CANCEL
                                    </button>
                                </div>
                                {/* Arrow */}
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-b-2 border-r-2 border-rose-500/50 transform rotate-45"></div>
                            </motion.div>
                        ) : null}

                        <motion.button
                            onClick={() => setShowPassConfirm(true)}
                            whileTap={{ scale: 0.95 }}
                            disabled={!isConnected || isPaused || isLeading}
                            className="h-10 md:h-12 w-24 bg-rose-900/20 hover:bg-rose-900/40 text-rose-500 hover:text-rose-400 font-bold rounded-xl border border-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            PASS
                        </motion.button>
                    </div>
                ) : (
                    <motion.button
                        onClick={escalateBid}
                        whileTap={{ scale: 0.95 }}
                        disabled={!isConnected || isPaused}
                        className="h-10 md:h-12 w-32 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold rounded-xl border border-amber-500/50 flex items-center justify-center gap-1 animate-pulse"
                    >
                        ESCALATE
                    </motion.button>
                )}
            </div>
            {hasPassed && (
                <div className="mt-2 text-center text-xs text-rose-500 font-medium bg-rose-500/10 py-1 rounded-lg border border-rose-500/20">
                    You have passed. Escalate to bid again.
                </div>
            )}
        </div>
    );

    const ChatPanel = () => (
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden h-full min-h-[300px]">
            <div className="p-4 border-b border-slate-800 font-medium text-slate-300 flex items-center justify-between bg-slate-900">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    Team Chat
                </div>
                {/* Connection Status Indicator */}
                <div className="flex items-center gap-1.5">
                    {isConnected ? (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <Wifi className="w-3 h-3" />
                            <span>Live</span>
                            {latency !== null && (
                                <span className={cn(
                                    "border-l border-emerald-500/20 pl-1 ml-0.5",
                                    latency > 300 ? "text-rose-500" : latency > 150 ? "text-amber-500" : "text-emerald-500"
                                )}>
                                    {latency}ms
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-[10px] text-rose-500 font-medium bg-rose-500/10 px-2 py-0.5 rounded-full animate-pulse">
                            <WifiOff className="w-3 h-3" />
                            <span>Reconnecting...</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/30">
                {chatHistory.map((msg) => {
                    const isMe = msg.sender === (myTeam?.code || 'Me');
                    const isSystem = msg.sender === 'System';

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="flex justify-center my-2">
                                <span className="bg-slate-800/80 text-emerald-400 text-[10px] px-3 py-1 rounded-full font-medium border border-slate-700/50 shadow-sm">
                                    {msg.text}
                                </span>
                            </div>
                        );
                    }

                    return (
                        <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                            <div className={cn(
                                "px-3 py-2 rounded-2xl text-sm shadow-sm relative",
                                isMe
                                    ? "bg-emerald-600 text-white rounded-tr-sm"
                                    : "bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700"
                            )}>
                                {!isMe && <div className="text-[10px] font-bold text-emerald-400 mb-0.5">{msg.sender}</div>}
                                {msg.text}
                                <div className={cn("text-[9px] mt-1 text-right opacity-70", isMe ? "text-emerald-100" : "text-slate-500")}>
                                    {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 flex gap-2 bg-slate-900 relative">
                {!isConnected && (
                    <div className="absolute inset-0 bg-slate-900/80 index-10 flex items-center justify-center text-xs text-rose-500 font-bold backdrop-blur-[1px] z-10">
                        Connection Lost - Chat Disabled
                    </div>
                )}
                <input
                    id="team-chat-input"
                    name="chatMessage"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    placeholder={isConnected ? "Type a message..." : "Reconnecting..."}
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    disabled={!isConnected}
                    autoComplete="off"
                />
                <button
                    type="submit"
                    disabled={!isConnected || !chatMessage.trim()}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </form>
        </div>
    );

    const HistoryPanel = () => (
        <div className={cn(
            "bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden transition-all duration-300",
            // If closed, shrink height (min-h only to cover header)
            isHistoryOpen ? "flex-1 min-h-[300px]" : "h-auto shrink-0"
        )}>
            <div
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="p-4 border-b border-slate-800 font-medium text-slate-300 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors shrink-0"
            >
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-500" />
                    Bid History
                </div>
                {isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            <AnimatePresence>
                {isHistoryOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar max-h-[250px] min-h-0"
                    >
                        <AnimatePresence initial={false}>
                            {history.map((bid) => {
                                const team = teams.find(t => t.id === bid.teamId);
                                return (
                                    <motion.div
                                        key={bid.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-lg border",
                                            bid.teamId === myTeam.id
                                                ? "bg-emerald-950/30 border-emerald-500/20"
                                                : "bg-slate-800/30 border-slate-800"
                                        )}
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-slate-200">{team?.code}</div>
                                            <div className="text-xs text-slate-500">{new Date(bid.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="text-lg font-mono font-bold text-emerald-400">
                                            ₹ {bid.amount.toFixed(2)}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        {history.length === 0 && (
                            <div className="text-center text-slate-600 py-10 italic">No bids yet</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="h-full flex flex-col relative">
            {/* --- Mobile View (Tabs) --- */}
            <div className="lg:hidden flex flex-col h-full bg-slate-950 pb-[80px]"> {/* Padding bottom for sticky footer */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <PlayerCard />

                    <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
                        {(['chat', 'history'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize",
                                    activeTab === tab ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 min-h-0">
                        {activeTab === 'chat' && <ChatPanel />}
                        {activeTab === 'history' && <HistoryPanel />}
                    </div>
                </div>

                {/* Sticky Bidding Controls for Mobile */}
                <div className="fixed bottom-0 left-0 right-0 z-50">
                    <BiddingPanel />
                </div>
            </div>

            {/* --- Desktop View (Grid) --- */}
            <div className="hidden lg:grid grid-cols-3 gap-6 h-full min-h-0">
                <div className="col-span-2 space-y-6 flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col">
                        <PlayerCard className="flex-1" />
                    </div>
                    <BiddingPanel />
                </div>

                <div className="space-y-6 flex flex-col h-full min-h-0">
                    <ChatPanel />
                    <HistoryPanel />
                </div>
            </div>
        </div >
    );
}
