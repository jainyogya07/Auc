import { Play, Pause, XCircle, ShieldCheck, Hammer, SkipForward } from 'lucide-react';
import { useAuctionStore, getSocket } from '../../store/useAuctionStore';
import { useState, useEffect, useMemo } from 'react';
import { ChatPanel } from '../../components/ChatPanel';
import { cn } from '../../lib/utils';

const TimerDisplay = ({ timerExpiresAt }: { timerExpiresAt: number | null }) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const { timeOffset } = useAuctionStore();

    useEffect(() => {
        if (!timerExpiresAt) {
            setTimeLeft(null);
            return;
        }
        const interval = setInterval(() => {
            // Corrected Now = System Now + Offset
            // However, our offset is (Server - Client). So ServerTime ~= Client + Offset.
            // TimerExpiresAt is in Server Time.
            // So TimeLeft = TimerExpiresAt - (ClientNow + Offset)
            const now = Date.now() + timeOffset;
            const diff = Math.max(0, Math.ceil((timerExpiresAt - now) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) clearInterval(interval);
        }, 100); // 100ms for smoother updates
        return () => clearInterval(interval);
    }, [timerExpiresAt, timeOffset]);

    if (timeLeft === null) return null;

    return (
        <div className="my-2 flex justify-center">
            <div className={cn(
                "text-4xl font-black w-20 h-20 rounded-full flex items-center justify-center border-4",
                timeLeft <= 10 ? "text-rose-500 border-rose-500 animate-pulse bg-rose-500/10" : "text-amber-500 border-amber-500 bg-amber-500/10"
            )}>
                {timeLeft}
            </div>
        </div>
    );
};

export default function AuctioneerDashboard() {
    const {
        currentSet,
        currentPlayer: storeCurrentPlayer,
        currentPlayerId,
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
        passedTeams,
        adminRTMMatch,
        players,
        adminSetPlayer,
        timerExpiresAt,
        latency
    } = useAuctionStore();

    // Derive currentPlayer from players array if not directly available
    const currentPlayer = useMemo(() => {
        if (storeCurrentPlayer) return storeCurrentPlayer;
        if (currentPlayerId && players.length > 0) {
            return players.find(p => p.id === currentPlayerId) || null;
        }
        return null;
    }, [storeCurrentPlayer, currentPlayerId, players]);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isEditingPrice, setIsEditingPrice] = useState(false);

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

            // Auto-recovery for RTM state mismatch
            if (msg.includes('Action Unavailable') && msg.includes('Current phase is')) {
                console.warn('RTM State Mismatch detected. Requesting immediate sync...');
                // Force sync to clear the invalid UI state
                useAuctionStore.getState().requestSync();
            }
        };

        socket.on('error', handleError);

        return () => {
            socket.off('error', handleError);
        };
    }, []);

    const leadingTeam = teams.find(t => t.id === currentBidder);

    const handleSold = async () => {
        if (isProcessing) return;
        if (currentPlayer && currentBidder) {
            setIsProcessing(true);
            try {
                await adminSoldPlayer(currentPlayer.id, currentBidder, currentBid);
                // No timeout needed; processing stays true until server update comes back
                // But we set it false here just in case, though usually state change handles it
                setIsProcessing(false);
            } catch (err) {
                console.error("Sold failed:", err);
                setIsProcessing(false);
            }
        }
    };

    const handleUnsold = async () => {
        if (isProcessing) return;
        if (currentPlayer) {
            setIsProcessing(true);
            try {
                await adminUnsoldPlayer(currentPlayer.id);
                setIsProcessing(false);
            } catch (err) {
                console.error("Unsold failed:", err);
                setIsProcessing(false);
            }
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
                        onClick={() => {
                            console.log('Start Bidding Clicked');
                            console.log('Next Player:', nextPlayer);
                            console.log('Socket Connected:', getSocket().connected);
                            if (nextPlayer) {
                                adminSetPlayer(nextPlayer.id);
                            } else {
                                console.error('Next player is undefined!');
                            }
                        }}
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
        <div className="min-h-[calc(100vh-8rem)] flex flex-col gap-6 p-4 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950/20 to-slate-950">
            {/* Top Bar - Current Status */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-3xl shadow-2xl">
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
                        <div className="flex flex-col items-end gap-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                LIVE
                            </div>
                            {latency !== null && (
                                <div className={cn("text-xs font-mono", latency > 300 ? "text-rose-500" : "text-slate-500")}>
                                    Ping: {latency}ms
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Player Display */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-lg border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 opacity-50" />

                    {/* Player Card Content */}
                    <div className="relative z-10 text-center space-y-6 w-full">
                        <div className="w-32 h-32 rounded-full bg-slate-800/80 mx-auto border-4 border-slate-700/50 shadow-2xl flex items-center justify-center text-slate-600 text-5xl relative backdrop-blur-sm">
                            🏏
                            {currentPlayer.isForeign && <span className="absolute top-0 right-0 text-2xl drop-shadow-lg">✈️</span>}
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-md">{currentPlayer.name}</h1>
                            <div className="flex items-center justify-center gap-3 text-base text-slate-300">
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">{currentPlayer.role}</span>
                                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">{currentPlayer.country}</span>
                            </div>
                        </div>

                        <div className="py-6 border-t border-white/10 w-full max-w-lg mx-auto bg-black/20 rounded-2xl">
                            <div className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2 font-bold">Current Bid</div>
                            <div className="text-5xl md:text-6xl font-black text-emerald-400 tracking-tighter drop-shadow-xl" style={{ textShadow: '0 0 40px rgba(52, 211, 153, 0.3)' }}>
                                ₹ {currentBid.toFixed(2)} Cr
                            </div>

                            {/* Timer Display for Auctioneer */}
                            <TimerDisplay timerExpiresAt={timerExpiresAt} />

                            {leadingTeam ? (
                                <div className="text-base text-slate-300 mt-4 flex items-center justify-center gap-2">
                                    Held by <span className="text-emerald-300 font-bold px-3 py-1 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">{leadingTeam.name}</span>
                                </div>
                            ) : (
                                <div className="text-sm text-slate-500 mt-4 font-medium">
                                    Base Price: ₹ {currentPlayer.basePrice} Cr
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Control Panel */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl">
                    <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                        <Hammer className="w-5 h-5 text-amber-500" />
                        Controls
                    </h3>

                    <div className="space-y-4 flex-1">
                        {/* MANUAL PRICE EDIT */}
                        {isEditingPrice ? (
                            <div className="bg-slate-900/90 border border-slate-700 p-6 rounded-2xl space-y-4 shadow-2xl animate-in zoom-in duration-300">
                                <h4 className="font-bold text-white text-lg">Edit Current Price</h4>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg font-bold">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        defaultValue={currentBid}
                                        id="manual-price-input"
                                        className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 pl-10 py-3 text-xl font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={async () => {
                                            const val = (document.getElementById('manual-price-input') as HTMLInputElement).value;
                                            setIsProcessing(true);
                                            try {
                                                await useAuctionStore.getState().adminUpdateBid(Number(val));
                                                setIsEditingPrice(false);
                                            } catch (e) {
                                                console.error(e);
                                            } finally {
                                                setIsProcessing(false);
                                            }
                                        }}
                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                                    >
                                        UPDATE
                                    </button>
                                    <button
                                        onClick={() => setIsEditingPrice(false)}
                                        className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </div>
                        ) : (status === 'SOLD' || status === 'UNSOLD') ? (
                            <div className="space-y-4 animate-in zoom-in duration-300">
                                <div className={`p - 4 rounded - xl text - center font - bold text - xl border ${status === 'SOLD' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'} `}>
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
                                            {isProcessing ? 'Starting...' : `Start Next: ${nextPlayer.name} `}
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
                                    className="w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/40 text-2xl tracking-wide disabled:opacity-50 disabled:grayscale transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Hammer className="w-8 h-8" />
                                    {isProcessing ? 'PROCESSING...' : 'SOLD PLAYER'}
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={isPaused ? () => adminPauseAuction(false) : () => adminPauseAuction(true)}
                                        className={cn(
                                            "py-4 font-bold rounded-xl flex items-center justify-center gap-2 border-2 transition-all",
                                            isPaused
                                                ? "bg-amber-500 hover:bg-amber-400 text-black border-amber-500 hover:border-amber-400"
                                                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:border-slate-600"
                                        )}
                                    >
                                        {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                                        {isPaused ? "RESUME" : "PAUSE"}
                                    </button>
                                    <button
                                        onClick={handleUnsold}
                                        disabled={(status as string) === 'SOLD' || (status as string) === 'UNSOLD' || isProcessing}
                                        className="py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl flex items-center justify-center gap-2 border-2 border-rose-500/20 hover:border-rose-500/40 disabled:opacity-50 transition-all"
                                    >
                                        <XCircle className="w-6 h-6" />
                                        {isProcessing ? '...' : 'UNSOLD'}
                                    </button>

                                    {/* Edit Bid Button */}
                                    <button
                                        onClick={() => setIsEditingPrice(true)}
                                        disabled={isProcessing}
                                        className="col-span-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all text-xs uppercase tracking-wider"
                                    >
                                        <span className="text-sm">✏️</span> Edit Price
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col h-60 shrink-0">
                        <h4 className="text-sm font-medium text-slate-400 mb-4">Bid History</h4>
                        <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-2">
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

                    {/* Passed Teams Indicator */}
                    <div className="mt-4 pt-4 border-t border-slate-800">
                        <h4 className="text-sm font-medium text-slate-400 mb-2">Passed Teams</h4>
                        <div className="flex flex-wrap gap-2">
                            {passedTeams.length === 0 ? (
                                <span className="text-xs text-slate-600 italic">None</span>
                            ) : (
                                passedTeams.map(tid => {
                                    const team = teams.find(t => t.id === tid);
                                    return (
                                        <span key={tid} className="px-2 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold rounded border border-rose-500/20">
                                            {team?.code}
                                        </span>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Panel Integration */}
                    <div className="mt-6 h-[250px]">
                        <ChatPanel senderName="Auctioneer" />
                    </div>
                </div>
            </div>
        </div >
    );
}
