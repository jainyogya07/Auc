import { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { ChevronDown, ChevronRight, Calendar } from 'lucide-react';

export default function AuctioneerUpcoming() {
    const { players, currentSet, setOrder } = useAuctionStore();
    const [expandedSet, setExpandedSet] = useState<number | null>(null);

    // Filter players for future sets
    const upcomingPlayers = players.filter(p => p.set > currentSet || p.status === 'U'); // Keep displaying future sets even if current is high

    // Group by Set
    const sets: Record<number, typeof players> = {};
    upcomingPlayers.forEach(p => {
        if (!sets[p.set]) sets[p.set] = [];
        sets[p.set].push(p);
    });

    // Sort by custom setOrder or default numerical
    let setNumbers = Object.keys(sets).map(Number);
    if (setOrder && setOrder.length > 0) {
        setNumbers.sort((a, b) => {
            const indexA = setOrder.indexOf(a);
            const indexB = setOrder.indexOf(b);
            // If both in order, sort by index
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If A not in order (new set?), push to end
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return a - b;
        });
    } else {
        setNumbers.sort((a, b) => a - b);
    }

    if (setNumbers.length === 0) {
        return (
            <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-slate-500">
                <Calendar className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-xl font-medium">No Upcoming Sets</h2>
                <p>All sets are either completed or current.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">Upcoming Sets</h2>
                    <p className="text-slate-400">Preview players in future auction sets</p>
                </div>
                <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-sm">Remaining Players: </span>
                    <span className="text-emerald-400 font-bold">{upcomingPlayers.length}</span>
                </div>
            </div>

            <div className="grid gap-4">
                {setNumbers.map(setNum => (
                    <div key={setNum} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden transition-all">
                        <button
                            onClick={() => setExpandedSet(expandedSet === setNum ? null : setNum)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                                    #{setNum}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-slate-200">Set {setNum}</div>
                                    <div className="text-xs text-slate-500">{sets[setNum].length} Players</div>
                                </div>
                            </div>
                            {expandedSet === setNum ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                        </button>

                        {expandedSet === setNum && (
                            <div className="border-t border-slate-800 bg-slate-950/30 p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {sets[setNum].map(player => (
                                        <div key={player.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                                                🏏
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-slate-200 truncate">{player.name}</div>
                                                <div className="text-xs text-slate-500 flex gap-2">
                                                    <span>{player.role}</span>
                                                    <span>•</span>
                                                    <span className="text-emerald-500">₹ {player.basePrice} Cr</span>
                                                </div>
                                            </div>
                                            {player.isForeign && <span className="ml-auto text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">海外</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
