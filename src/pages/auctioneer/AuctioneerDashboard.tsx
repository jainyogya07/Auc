import { Play, Pause, Hammer, SkipForward, ShieldCheck } from 'lucide-react';
import { useAuctionStore, getSocket } from '../../store/useAuctionStore';
import { useState, useEffect } from 'react';

export default function AuctioneerDashboard() {
    const {
        currentSet,
        currentPlayer,
        currentBid,
        currentBidder,
        history,
        teams,
        adminSoldPlayer,
        adminUnsoldPlayer,
        isPaused,
        adminPauseAuction,
        status,
        rtmState,
        adminRTMDecision,
        adminRTMHike,
        adminRTMMatch,
        players,
        adminSetPlayer
    } = useAuctionStore();

    const [isProcessing, setIsProcessing] = useState(false);

    // Reset processing state when player, status, or RTM state changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsProcessing(false);
    }, [currentPlayer?.id, status, rtmState]);

    // Global Error Listener for reset
    useEffect(() => {
        const socket = getSocket();

        const handleError = (msg: string) => {
            console.error('Socket error caught in Dashboard:', msg);
            setIsProcessing(false);
        };

        const handleUpdate = () => {
            setIsProcessing(false);
        };

        socket.on('error', handleError);
        socket.on('auction:update', handleUpdate);

        return () => {
            socket.off('error', handleError);
            socket.off('auction:update', handleUpdate);
        };
    }, []);

    const leadingTeam = teams.find(t => t.id === currentBidder);

    const handleSold = () => {
        if (isProcessing) return;
        if (currentPlayer && currentBidder) {
            setIsProcessing(true);
            adminSoldPlayer(currentPlayer.id, currentBidder, currentBid);
            // Safety fallback
            setTimeout(() => setIsProcessing(false), 5000);
        }
    };

    const handleUnsold = () => {
        if (isProcessing) return;
        if (currentPlayer) {
            setIsProcessing(true);
            adminUnsoldPlayer(currentPlayer.id);
            // Safety fallback
            setTimeout(() => setIsProcessing(false), 5000);
        }
    };

    if (!currentPlayer) {
        // Simple auto-selector for next player in set (Demo logic)
        const nextPlayer = players.find(p => p.status === 'U' && p.set === currentSet);

        return (
            <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center space-y-4">
                <h2 className="text-2xl text-slate-300">Set {currentSet} Completed or No Active Player</h2>
                {nextPlayer ? (
                    <button
                        onClick={() => adminSetPlayer(nextPlayer.id)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold"
                    >
                        Start Bidding for {nextPlayer.name}
                    </button>
                ) : (
                    <p className="text-slate-500">No more players in this set.</p>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-8rem)] flex flex-col gap-6">
            {/* Top Bar - Current Status */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-4 md:p-6 rounded-2xl">
                <div>
                    <div className="text-sm text-slate-400 font-mono uppercase tracking-wider mb-1">Current Set</div>
                    <div className="text-xl font-bold text-white">Set {currentSet}</div>
                </div>
                <div className="w-full md:w-auto flex items-center justify-between md:block text-right">
                    <div className="text-sm text-slate-400 font-mono uppercase tracking-wider mb-1">Status</div>
                    {isPaused ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-sm font-bold border border-amber-500/20">
                            <Pause className="w-4 h-4" /> PAUSED
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            LIVE
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Player Display */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 opacity-50" />

                    {/* Player Card Content */}
                    <div className="relative z-10 text-center space-y-4 w-full">
                        <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto border-2 border-slate-700 shadow-xl flex items-center justify-center text-slate-600 text-3xl relative">
                            🏏
                            {currentPlayer.isForeign && <span className="absolute top-0 right-0 text-lg">✈️</span>}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">{currentPlayer.name}</h1>
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                                <span className="px-2 py-0.5 bg-slate-800 rounded text-xs">{currentPlayer.role}</span>
                                <span className="px-2 py-0.5 bg-slate-800 rounded text-xs">{currentPlayer.country}</span>
                            </div>
                        </div>

                        <div className="py-4 border-t border-b border-slate-800 w-full max-w-md mx-auto">
                            <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Current Bid</div>
                            <div className="text-3xl font-black text-emerald-400 tracking-tight transition-all">
                                ₹ {currentBid.toFixed(2)} Cr
                            </div>
                            {leadingTeam ? (
                                <div className="text-sm text-slate-300 mt-2 flex items-center justify-center gap-2">
                                    Held by <span className="text-white font-bold px-2 py-0.5 bg-slate-800 rounded">{leadingTeam.name}</span>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 mt-2">
                                    Base Price: ₹ {currentPlayer.basePrice} Cr
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-amber-500" />
                        Controls
                    </h3>

                    <div className="space-y-4 flex-1">
                        {/* RTM Controls Overlay/Section */}
                        {rtmState ? (
                            <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-xl space-y-4 animate-in zoom-in duration-300">
                                <h4 className="text-emerald-400 font-bold flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    RTM PHASE: {rtmState?.replace('_', ' ')}
                                </h4>

                                {rtmState === 'PENDING_DECISION' && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400">Does the original team want to use RTM?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => { setIsProcessing(true); adminRTMDecision(true); }}
                                                className="py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 disabled:opacity-50"
                                            >
                                                {isProcessing ? 'Processing...' : 'YES (Hike)'}
                                            </button>
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => { setIsProcessing(true); adminRTMDecision(false); }}
                                                className="py-2 bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-600 disabled:opacity-50"
                                            >
                                                {isProcessing ? 'Processing...' : 'NO (Sell)'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {rtmState === 'AWAITING_HIKE' && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400">Enter hike amount (Winner's final bid):</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                defaultValue={currentBid}
                                                id="rtm-hike-input"
                                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                                            />
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => {
                                                    const val = (document.getElementById('rtm-hike-input') as HTMLInputElement).value;
                                                    setIsProcessing(true);
                                                    adminRTMHike(Number(val));
                                                }}
                                                className="px-4 bg-emerald-600 text-white rounded-lg font-bold disabled:opacity-50"
                                            >
                                                {isProcessing ? '...' : 'Submit'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {rtmState === 'AWAITING_MATCH' && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400">Does original team match ₹ {currentBid} Cr?</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => { setIsProcessing(true); adminRTMMatch(true); }}
                                                className="py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 disabled:opacity-50"
                                            >
                                                {isProcessing ? '...' : 'MATCH (Sell to EX)'}
                                            </button>
                                            <button
                                                disabled={isProcessing}
                                                onClick={() => { setIsProcessing(true); adminRTMMatch(false); }}
                                                className="py-2 bg-slate-700 text-white rounded-lg font-bold hover:bg-slate-600 disabled:opacity-50"
                                            >
                                                {isProcessing ? '...' : 'NO (Sell to Winner)'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (status === 'SOLD' || status === 'UNSOLD') ? (
                            <div className="space-y-4 animate-in zoom-in duration-300">
                                <div className={`p-4 rounded-xl text-center font-bold text-xl border ${status === 'SOLD' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
                                    PLAYER {status}
                                </div>
                                {(() => {
                                    const nextPlayer = players.find(p => p.status === 'U' && p.set === currentSet);
                                    return nextPlayer ? (
                                        <button
                                            onClick={() => {
                                                if (isProcessing) return;
                                                setIsProcessing(true);
                                                adminSetPlayer(nextPlayer.id);
                                                setTimeout(() => setIsProcessing(false), 2000);
                                            }}
                                            disabled={isProcessing}
                                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <SkipForward className="w-6 h-6" />
                                            {isProcessing ? 'Starting...' : `Start Next: ${nextPlayer.name}`}
                                        </button>
                                    ) : (
                                        <div className="text-center text-slate-500 p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                                            No more players in Set {currentSet}. Please switch sets in Admin.
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleSold}
                                    disabled={!currentBidder || (status as string) === 'SOLD' || (status as string) === 'UNSOLD' || isProcessing}
                                    className="w-full py-3 md:py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-base md:text-lg"
                                >
                                    <Hammer className="w-5 h-5 md:w-6 md:h-6" />
                                    {isProcessing ? 'Processing Sold...' : 'SOLD'}
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={isPaused ? () => adminPauseAuction(false) : () => adminPauseAuction(true)}
                                        className="py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl flex items-center justify-center gap-2 border border-slate-700"
                                    >
                                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                        {isPaused ? "Resume" : "Pause"}
                                    </button>
                                    <button
                                        onClick={handleUnsold}
                                        disabled={(status as string) === 'SOLD' || (status as string) === 'UNSOLD' || isProcessing}
                                        className="py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium rounded-xl flex items-center justify-center gap-2 border border-rose-500/20 disabled:opacity-50"
                                    >
                                        <SkipForward className="w-5 h-5" />
                                        {isProcessing ? '...' : 'Unsold'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex-1 overflow-hidden flex flex-col min-h-0">
                        <h4 className="text-sm font-medium text-slate-400 mb-4">Bid History</h4>
                        <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                            {history.slice().reverse().map((bid) => {
                                const team = teams.find(t => t.id === bid.teamId);
                                return (
                                    <div key={bid.id} className="flex items-center justify-between text-sm py-2 px-3 bg-slate-800/50 rounded">
                                        <span className="text-slate-300 font-medium">{team?.code}</span>
                                        <span className="text-emerald-400 font-mono font-bold">₹ {bid.amount.toFixed(2)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
