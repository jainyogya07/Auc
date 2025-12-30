import { useState, useEffect } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore'; // Assuming getSocket is exported
import { Play, Pause, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminAuctionControl() {
    const {
        isPaused,
        adminPauseAuction,
        currentPlayer,
        currentSet,
        adminUnsoldPlayer,
        history,
        status,
        currentBid,
        nominations: stateNominations,
        toggleNominations,
        finalizeNominations,
        resetAuction,
        connectedUsers,
        isConnected // Import isConnected
    } = useAuctionStore();

    // Hike Input State
    const [_hikeAmount, setHikeAmount] = useState(currentBid);

    // Sync local state when bid changes
    useEffect(() => {
        setHikeAmount(currentBid);
    }, [currentBid]);

    const handleForcePause = () => {
        if (!isConnected) return;
        adminPauseAuction(true);
    };

    const handleForceResume = () => {
        if (!isConnected) return;
        adminPauseAuction(false);
    };

    const handleForceUnsold = () => {
        if (!isConnected) return;
        if (confirm("Are you sure you want to force UNSOLD this player?")) {
            if (currentPlayer) adminUnsoldPlayer(currentPlayer.id);
        }
    };

    // Filter to show only teams
    const connectedTeams = connectedUsers.filter(u => u.role === 'team');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!isConnected && (
                <div className="bg-rose-500/10 border border-rose-500 text-rose-500 px-4 py-3 rounded-xl flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold">Disconnected from Server. attempting to reconnect...</span>
                </div>
            )}

            <div className={`transition-opacity duration-300 ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-100">Auction Control Center</h2>
                    <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 ${isPaused ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {isPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        {isPaused ? 'PAUSED' : 'LIVE'}
                    </div>
                </div>

                {/* Connected Teams Status */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                        <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </div>
                        Connected Teams ({connectedTeams.length})
                    </h3>
                    {connectedTeams.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {connectedTeams.map((user, idx) => (
                                <div key={idx} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <div>
                                        <div className="font-bold text-white text-sm">{user.username}</div>
                                        <div className="text-xs text-slate-500 font-mono">{user.code}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-500 py-4 italic text-sm">No teams connected yet.</div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Emergency Controls */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-rose-500" />
                            Emergency Override
                        </h3>

                        <div className="space-y-4">
                            <button
                                onClick={isPaused ? handleForceResume : handleForcePause}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
                                    isPaused
                                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                        : "bg-amber-500 hover:bg-amber-400 text-black"
                                )}
                            >
                                {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                                {isPaused ? "RESUME AUCTION" : "PAUSE AUCTION"}
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleForceUnsold}
                                    disabled={!currentPlayer}
                                    className="py-3 bg-slate-800 hover:bg-slate-700 text-rose-400 font-medium rounded-xl border border-slate-700 disabled:opacity-50"
                                >
                                    Force UNSOLD
                                </button>
                                <button
                                    className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 disabled:opacity-50"
                                >
                                    Rollback Last Bid
                                </button>
                            </div>

                            {/* Reset Auction Button */}
                            <div className="mt-6 pt-6 border-t border-slate-700">
                                <button
                                    onClick={() => {
                                        if (confirm("⚠️ Are you ABSOLUTELY SURE you want to RESET the entire auction?\n\nThis will:\n• Clear ALL player sales\n• Reset ALL team budgets\n• Delete bid history\n• Return to initial state\n\nThis action CANNOT be undone!")) {
                                            if (confirm("FINAL WARNING: Type OK to confirm reset.")) {
                                                resetAuction();
                                            }
                                        }
                                    }}
                                    className="w-full py-3 bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold rounded-xl border border-red-600/50 flex items-center justify-center gap-2 transition-all"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    RESET ENTIRE AUCTION
                                </button>
                                <p className="text-xs text-slate-600 mt-2 text-center">This will completely reset the auction to its initial state</p>
                            </div>
                        </div>
                    </div>

                    {/* Nomination Phase Control */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                            <Play className="w-5 h-5 text-indigo-400" />
                            Nominations Phase
                            {stateNominations?.isOpen && <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">OPEN</span>}
                        </h3>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => toggleNominations(true)}
                                    disabled={stateNominations?.isOpen}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:bg-slate-700"
                                >
                                    Open Nominations
                                </button>
                                <button
                                    onClick={() => toggleNominations(false)}
                                    disabled={!stateNominations?.isOpen}
                                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl disabled:opacity-50"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-slate-400 text-sm">Teams Submitted</span>
                                    <span className="text-white font-mono font-bold">{stateNominations?.submissions?.length || 0}</span>
                                </div>
                                <div className="space-y-1">
                                    {stateNominations?.submissions?.map((sub, i) => (
                                        <div key={i} className="text-xs text-slate-500 flex justify-between">
                                            <span>{sub.teamId}</span>
                                            <span>{sub.playerIds.length} players</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    if (confirm("Finalize nominations? This will move selected unsold players to Accelerated Set #99.")) {
                                        finalizeNominations();
                                    }
                                }}
                                className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl"
                            >
                                Finalize & Create Set 99
                            </button>
                        </div>
                    </div>

                    {/* Context Info */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-slate-200 mb-6">Current Context</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between p-4 bg-slate-800/50 rounded-lg">
                                <span className="text-slate-400">Current Set</span>
                                <span className="text-white font-mono">#{currentSet}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-slate-800/50 rounded-lg">
                                <span className="text-slate-400">Active Player</span>
                                <span className="text-white font-bold">{currentPlayer?.name || "None"}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-slate-800/50 rounded-lg">
                                <span className="text-slate-400">Status</span>
                                <span className="text-emerald-400 font-bold font-mono">{status}</span>
                            </div>
                            <div className="flex justify-between p-4 bg-slate-800/50 rounded-lg">
                                <span className="text-slate-400">Bids in Session</span>
                                <span className="text-white font-mono">{history.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
