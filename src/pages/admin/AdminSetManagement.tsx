import { useState, useEffect } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Save, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react';

export default function AdminSetManagement() {
    const { players, setOrder, updateSetOrder } = useAuctionStore();
    const [localOrder, setLocalOrder] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize Local Order
    useEffect(() => {
        if (setOrder && setOrder.length > 0) {
            if (JSON.stringify(localOrder) !== JSON.stringify(setOrder)) {
                setLocalOrder(setOrder);
            }
        } else {
            // Default sort if empty
            const uniqueSets = [...new Set(players.map(p => p.set))].sort((a, b) => a - b);
            setLocalOrder(uniqueSets);
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
        if (confirm('Update Set Order? This will affect the Auctioneer view immediately.')) {
            setIsSaving(true);
            updateSetOrder(localOrder);
            setTimeout(() => setIsSaving(false), 500);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Set Management</h1>
                    <p className="text-slate-400">Reorder auction sets to prioritize specific groups.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving...' : 'Save Order'}
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex items-center gap-3 text-slate-400">
                    <ListOrdered className="w-5 h-5" />
                    <span className="font-mono text-sm uppercase tracking-wider">Drag & Drop Simulation (Use Arrows)</span>
                </div>

                <div className="divide-y divide-slate-800/50">
                    {localOrder.map((setNum, index) => {
                        const playerCount = players.filter(p => p.set === setNum).length;
                        return (
                            <div key={setNum} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500 font-mono text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-200">Set {setNum}</div>
                                        <div className="text-sm text-slate-500">{playerCount} Players</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
