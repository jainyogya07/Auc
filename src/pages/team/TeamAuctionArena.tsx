import { useState, useEffect } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { useAuthStore } from '../../store/useAuthStore';
import { History, Hand, MessageSquare, Send, Brain, AlertTriangle, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
// clsx removed
import { motion, AnimatePresence } from 'framer-motion';

import { useAuctionAudio } from '../../hooks/useAuctionAudio';
import { calculateBidStrategy } from '../../lib/auctionAi';

export default function TeamAuctionArena() {
    const { currentPlayer, currentBid, currentBidder, placeBid, history, teams, status, timerExpiresAt } = useAuctionStore();
    const { teamId: userTeamId } = useAuthStore();

    // Timer Logic
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!timerExpiresAt) {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, timerExpiresAt - Date.now());
            setTimeLeft(remaining);
        }, 50);

        return () => clearInterval(interval);
    }, [timerExpiresAt]);

    const isLocked = timeLeft > 0 && timeLeft < 250;

    // Play Sounds
    useAuctionAudio();

    // Use logged-in team
    const myTeam = teams.find(t => t.id === userTeamId);
    const leadingTeam = teams.find(t => t.id === currentBidder);

    // AI Assist State
    const [showAiAssist, _setShowAiAssist] = useState(true);

    // Chat State
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ id: string, sender: string, text: string, time: number }[]>(() => [
        { id: '1', sender: 'System', text: 'Welcome to the Auction Arena!', time: Date.now() }
    ]);

    // AI Calculations
    const aiStrategy = myTeam ? calculateBidStrategy(myTeam, currentBid) : null;

    // eslint-disable-next-line react-hooks/purity
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatMessage.trim()) return;

        const newMsg = {
            id: Math.random().toString(36).substr(2, 9),
            sender: myTeam?.code || 'Me',
            text: chatMessage,
            time: Date.now()
        };

        setChatHistory([...chatHistory, newMsg]);
        setChatMessage('');
    };

    if (!myTeam) return <div className="p-8 text-center text-slate-500">Access Denied: You must be logged in as a Team.</div>;

    const minIncrement = currentBid < 2 ? 0.10 : currentBid < 5 ? 0.20 : 0.50; // Crores logic
    // First bid should be base price, subsequent bids add increment
    const nextBidAmount = currentBid === 0
        ? (currentPlayer?.basePrice || 2).toFixed(2)
        : (currentBid + minIncrement).toFixed(2);
    const canAfford = myTeam.purse >= Number(nextBidAmount);
    const isLeading = currentBidder === myTeam.id;
    const canBid = (status === 'NOMINATED' || status === 'BIDDING') && canAfford && !isLeading && !!currentPlayer;

    const handleBid = () => {
        // Get the FRESH state from store at click time to avoid race conditions
        const freshState = useAuctionStore.getState();
        const freshCurrentBid = freshState.currentBid;
        const freshCurrentBidder = freshState.currentBidder;
        const freshCurrentPlayer = freshState.currentPlayer;

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
            placeBid(myTeam.id, Number(freshNextBid.toFixed(2)));
        } else {
            console.log('Cannot bid - state changed. currentBid:', freshCurrentBid, 'nextBid:', freshNextBid);
        }
    };

    if (!currentPlayer) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
                <div className="bg-slate-900/50 border border-slate-800 p-16 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col items-center relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10 w-24 h-24 bg-slate-900/80 rounded-full flex items-center justify-center mb-8 border border-slate-700 shadow-xl">
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <svg
                                className="w-10 h-10 text-indigo-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </motion.div>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-4">Waiting for Auctioneer</h2>
                    <p className="text-slate-400 mb-10 text-lg leading-relaxed">
                        The auction has not started yet. Please wait for the admin to initiate the session.
                    </p>

                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 border border-emerald-500/30 text-emerald-400 font-medium text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        Connected & Waiting...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
            {/* Main Auction View */}
            <div className="lg:col-span-2 space-y-6 flex flex-col min-h-0">
                {/* Player Profile Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden flex-1 flex flex-col justify-center items-center shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/20" />

                    <div className="relative z-10 text-center w-full max-w-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="w-40 h-40 rounded-full border-4 border-slate-700 bg-slate-800 flex items-center justify-center shadow-2xl relative">
                                {/* Placeholder for player image */}
                                <span className="text-4xl">🏏</span>
                                {currentPlayer.isForeign && <span className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-xs font-bold px-2 py-1 rounded-full">✈️</span>}
                            </div>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tight">{currentPlayer.name}</h1>
                        <div className="flex justify-center gap-3 text-base md:text-lg text-slate-400 mb-8 font-medium">
                            <span className="px-3 py-1 bg-slate-800/50 rounded-lg">{currentPlayer.role}</span>
                            <span className="w-px h-6 bg-slate-700"></span>
                            <span className="px-3 py-1 bg-slate-800/50 rounded-lg">{currentPlayer.country}</span>
                        </div>

                        {/* Current Bid Display */}
                        <div className={cn(
                            "py-8 px-12 rounded-2xl border-2 transition-all duration-300 transform",
                            isLeading ? "bg-emerald-500/10 border-emerald-500/50 scale-105" : "bg-slate-800/50 border-slate-700"
                        )}>
                            <div className="text-xs md:text-sm font-bold tracking-widest uppercase mb-1 text-slate-400">Current Bid</div>
                            <div className="text-4xl md:text-6xl font-black text-white tabular-nums tracking-tighter">
                                ₹ {currentBid.toFixed(2)} <span className="text-xl md:text-2xl text-slate-500 font-bold">Cr</span>
                            </div>
                            {currentBidder && (
                                <div className="mt-2 text-lg font-medium text-emerald-400 flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Winning: {leadingTeam?.name}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bidding Controls */}
                <div className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-2xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                        <div className="flex items-center justify-between w-full md:w-auto md:block text-left">
                            <div className="text-sm text-slate-400">Your Purse</div>
                            <div className={cn("text-xl md:text-2xl font-bold", canAfford ? "text-white" : "text-rose-500")}>
                                ₹ {myTeam.purse.toFixed(2)} Cr
                            </div>
                        </div>

                        {/* Timer Display */}
                        {timeLeft > 0 && (
                            <div className={cn(
                                "flex flex-col items-center justify-center w-full md:w-24 h-12 md:h-20 rounded-xl border-2 shrink-0",
                                isLocked ? "bg-rose-950/50 border-rose-500 text-rose-500" :
                                    timeLeft < 5000 ? "bg-amber-950/50 border-amber-500 text-amber-500" :
                                        "bg-slate-800 border-slate-700 text-slate-300"
                            )}>
                                <div className="text-xl md:text-2xl font-mono font-bold">{(timeLeft / 1000).toFixed(1)}s</div>
                                {isLocked && <div className="text-[10px] uppercase font-black tracking-widest">LOCKED</div>}
                            </div>
                        )}

                        <button
                            onClick={handleBid}
                            disabled={!canBid || isLocked}
                            className={cn(
                                "w-full md:flex-1 h-16 md:h-20 text-xl md:text-2xl font-black uppercase rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl",
                                isLeading
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border-2 border-slate-700"
                                    : !canAfford
                                        ? "bg-rose-900/20 text-rose-500 cursor-not-allowed border-2 border-rose-900/50"
                                        : isLocked
                                            ? "bg-slate-800 text-rose-500 cursor-not-allowed border-2 border-rose-900"
                                            : "bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-emerald-500/20"
                            )}
                        >
                            {isLeading ? (
                                <>Current Leader</>
                            ) : isLocked ? (
                                <>LOCKED</>
                            ) : (
                                <>
                                    <Hand className="w-8 h-8" />
                                    Bid ₹ {nextBidAmount} Cr
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* AI Assist Card */}
                {myTeam && showAiAssist && aiStrategy && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                            "bg-slate-900 border p-5 rounded-2xl flex items-start gap-4 shadow-lg",
                            aiStrategy.riskLevel === 'SAFE' ? "border-slate-800" :
                                aiStrategy.riskLevel === 'MODERATE' ? "border-amber-500/20 bg-amber-950/10" :
                                    "border-rose-500/20 bg-rose-950/10"
                        )}
                    >
                        <div className={cn(
                            "p-3 rounded-lg",
                            aiStrategy.riskLevel === 'SAFE' ? "bg-slate-800 text-emerald-400" :
                                aiStrategy.riskLevel === 'MODERATE' ? "bg-amber-900/20 text-amber-400" :
                                    "bg-rose-900/20 text-rose-400"
                        )}>
                            <Brain className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                                    AI Strategy Insight
                                    {aiStrategy.riskLevel === 'SAFE' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                                    {aiStrategy.riskLevel !== 'SAFE' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                                </h4>
                                <span className={cn(
                                    "text-xs font-bold px-2 py-1 rounded",
                                    aiStrategy.riskLevel === 'SAFE' ? "bg-emerald-500/10 text-emerald-400" :
                                        aiStrategy.riskLevel === 'MODERATE' ? "bg-amber-500/10 text-amber-400" :
                                            "bg-rose-500/10 text-rose-400"
                                )}>
                                    {aiStrategy.riskLevel}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm mb-3">
                                {aiStrategy.message}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                                    <div className="text-slate-500 text-xs mb-1">Safe Max Bid</div>
                                    <div className="font-mono font-bold text-slate-200">₹ {aiStrategy.safeMaxBid.toFixed(2)} Cr</div>
                                </div>
                                <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                                    <div className="text-slate-500 text-xs mb-1">Recommended</div>
                                    <div className="font-mono font-bold text-emerald-400">₹ {aiStrategy.recommendedLimit.toFixed(2)} Cr</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6 flex flex-col h-full min-h-0">
                {/* Team Chat (Replaces Simulator) */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-0">
                    <div className="p-4 border-b border-slate-800 font-medium text-slate-300 flex items-center gap-2 bg-slate-900">
                        <MessageSquare className="w-4 h-4 text-emerald-500" />
                        Team Chat
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-950/30">
                        {chatHistory.map((msg) => (
                            <div key={msg.id} className="text-sm">
                                <span className={cn("font-bold mr-2", msg.sender === 'System' ? "text-emerald-500" : "text-slate-300")}>{msg.sender}:</span>
                                <span className="text-slate-400">{msg.text}</span>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-900">
                        <input
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                            placeholder="Type a message..."
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                        />
                        <button type="submit" className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                {/* Feed */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="p-4 border-b border-slate-800 font-medium text-slate-300 flex items-center gap-2 shrink-0">
                        <History className="w-4 h-4 text-emerald-500" />
                        Bid History
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar flex flex-col-reverse min-h-0">
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
                    </div>
                </div>
            </div>
        </div >
    );
}
