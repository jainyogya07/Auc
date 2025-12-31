import { useState, useEffect } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Save, ArrowUp, ArrowDown, ListOrdered, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

export default function AdminSetManagement() {
    const { players, setOrder, updateSetOrder, deletePlayer } = useAuctionStore();
    const [localOrder, setLocalOrder] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [expandedSet, setExpandedSet] = useState<number | null>(null);

    const SET_NAMES: Record<number, string> = {
        1: 'M1 - Marquee Set 1',
        2: 'M2 - Marquee Set 2',
        3: 'BA1 - Batters 1',
        4: 'AL1 - All Rounders 1',
        5: 'WK1 - Wicket Keepers 1',
        6: 'FA1 - Fast Bowlers 1',
        7: 'SP1 - Spinners 1',
        8: 'UBA1 - Uncapped Batters',
        9: 'UAL1 - Uncapped All Rounders',
        10: 'UWK1 - Uncapped Wicket Keepers',
        11: 'UFA1 - Uncapped Fast Bowlers 1',
        12: 'USP1 - Uncapped Spinners 1',
        13: 'BA2 - Batters 2',
        14: 'AL2 - All Rounders 2',
        15: 'WK2 - Wicket Keepers 2',
        17: 'SP2 - Spinners 2',
        18: 'UBA2 - Uncapped Batters 2',
        19: 'UAL2 - Uncapped All Rounders 2',
        20: 'UWK2 - Uncapped Wicket Keepers 2',
        21: 'UFA2 - Uncapped Fast Bowlers 2',
        22: 'USP2 - Uncapped Spinners 2',
        23: 'BA3 - Batters 3',
        24: 'AL3 - All Rounders 3',
        25: 'WK3 - Wicket Keepers 3',
        26: 'FA3 - Fast Bowlers 3',
        27: 'SP3 - Spinners 3',
        28: 'UBA3 - Uncapped Batters 3',
        29: 'UAL3 - Uncapped All Rounders 3',
        30: 'UWK3 - Uncapped Wicket Keepers 3',
        31: 'UFA3 - Uncapped Fast Bowlers 3',
        32: 'USP3 - Uncapped Spinners 3',
        33: 'BA4 - Batters 4',
        34: 'AL4 - All Rounders 4',
        35: 'WK4 - Wicket Keepers 4',
        36: 'FA4 - Fast Bowlers 4',
        37: 'UBA4 - Uncapped Batters 4',
        38: 'UAL4 - Uncapped All Rounders 4',
        39: 'UWK4 - Uncapped Wicket Keepers 4',
        40: 'UFA4 - Uncapped Fast Bowlers 4',
        41: 'USP4 - Uncapped Spinners 4',
        42: 'BA5 - Batters 5',
        43: 'AL5 - All Rounders 5',
        44: 'FA5 - Fast Bowlers 5',
        45: 'UBA5 - Uncapped Batters 5',
        46: 'UAL5 - Uncapped All Rounders 5',
        47: 'UWK5 - Uncapped Wicket Keepers 5',
        48: 'FA5 - Fast Bowlers 5', 49: 'UBA5 - Uncapped Batters 5', 50: 'AL6 - All Rounders 6', 51: 'FA6 - Fast Bowlers 6',
        52: 'UBA6 - Uncapped Batters 6', 53: 'UAL6 - Uncapped All-Rounders 6', 54: 'UWK6 - Uncapped Wicket Keepers 6', 55: 'UFA6 - Uncapped Fast Bowlers 6',
        56: 'AL7 - All Rounders 7', 57: 'FA7 - Fast Bowlers 7',
        58: 'UBA7 - Uncapped Batters 7', 59: 'UAL7 - Uncapped All-Rounders 7', 60: 'UFA7 - Uncapped Fast Bowlers 7',
        61: 'AL8 - All Rounders 8', 62: 'FA8 - Fast Bowlers 8',
        63: 'UBA8 - Uncapped Batters 8', 64: 'UAL8 - Uncapped All-Rounders 8', 65: 'UFA8 - Uncapped Fast Bowlers 8',
        66: 'AL9 - All Rounders 9', 67: 'FA9 - Fast Bowlers 9',
        68: 'UBA9 - Uncapped Batters 9', 69: 'UAL9 - Uncapped All-Rounders 9', 70: 'UFA9 - Uncapped Fast Bowlers 9',
        72: 'AL10/FA10 - Mixed Set 10', 73: 'UAL10 - Uncapped All-Rounders 10', 74: 'UFA10 - Uncapped Fast Bowlers 10',
        75: 'UAL11 - Uncapped All-Rounders 11', 76: 'UAL12 - Uncapped All-Rounders 12',
        77: 'UAL13 - Uncapped All-Rounders 13', 78: 'UAL14 - Uncapped All-Rounders 14', 79: 'UAL15 - Uncapped All-Rounders 15'
    };

    const ALL_SETS = Array.from({ length: 79 }, (_, i) => i + 1).filter(s => s !== 71 && s !== 16); // Sets 1-79, skip 71 and 16

    // Initialize Local Order
    useEffect(() => {
        if (setOrder && setOrder.length > 0) {
            // Merge existing order with any missing sets
            const missingSets = ALL_SETS.filter(s => !setOrder.includes(s));
            if (JSON.stringify(localOrder) !== JSON.stringify([...setOrder, ...missingSets])) {
                setLocalOrder([...setOrder, ...missingSets]);
            }
        } else {
            setLocalOrder(ALL_SETS);
        }
    }, [setOrder, players]);

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newOrder = [...localOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        setLocalOrder(newOrder);
    };

    const moveDown = (index: number) => {
        if (index === localOrder.length - 1) return;
        const newOrder = [...localOrder];
        [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
        setLocalOrder(newOrder);
    };

    const handleSave = () => {
        setIsSaving(true);
        updateSetOrder(localOrder);
        setTimeout(() => {
            setIsSaving(false);
            setShowConfirm(false);
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Set Management</h1>
                    <p className="text-slate-400">Organize players into categories (Sets).</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Saving...' : 'Save Order'}
                    </button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center gap-3 text-slate-400">
                    <ListOrdered className="w-5 h-5" />
                    <span className="font-mono text-sm uppercase tracking-wider">Set Order (Drag Logic Pending)</span>
                </div>

                <div className="divide-y divide-slate-800/50">
                    {localOrder.map((setNum, index) => {
                        const setPlayers = players.filter(p => p.set === setNum);
                        const playerCount = setPlayers.length;
                        const isExpanded = expandedSet === setNum;

                        return (
                            <div key={setNum} className="transition-all duration-200">
                                <div
                                    className={`p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-800/30' : ''}`}
                                    onClick={() => setExpandedSet(isExpanded ? null : setNum)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500 font-mono text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-200 flex items-center gap-2">
                                                {SET_NAMES[setNum] || `Set ${setNum}`}
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                                            </div>
                                            <div className="text-sm text-slate-500 flex gap-2">
                                                <span>{playerCount} Players</span>
                                                {!isExpanded && playerCount > 0 && (
                                                    <span className="text-slate-600 truncate max-w-[200px]">• e.g. {setPlayers[0].name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <button
                                            onClick={() => moveUp(index)}
                                            disabled={index === 0}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowUp className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => moveDown(index)}
                                            disabled={index === localOrder.length - 1}
                                            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowDown className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Player List */}
                                {isExpanded && (
                                    <div className="bg-slate-900/50 border-t border-slate-800 p-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {setPlayers.map(player => (
                                                <div key={player.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800/50 group/card">
                                                    <div>
                                                        <div className="font-medium text-slate-200">{player.name}</div>
                                                        <div className="text-xs text-slate-500">{player.role} • {player.country}</div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-mono text-emerald-400 text-sm">₹{player.basePrice}Cr</div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (confirm(`Delete ${player.name}?`)) deletePlayer(player.id);
                                                            }}
                                                            className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover/card:opacity-100"
                                                            title="Delete Player"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {setPlayers.length === 0 && (
                                                <div className="col-span-full text-center py-8 text-slate-600 italic">
                                                    No players in this set yet.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-slate-900 border border-indigo-500/50 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Save Set Order?</h3>
                        <p className="text-slate-300 mb-6">
                            This will update the "Upcoming Sets" order for the Auctioneer.
                            <br />
                            <span className="text-slate-400 text-sm">Use "Randomize" to auto-fill sets.</span>
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-colors"
                            >
                                Confirm Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
