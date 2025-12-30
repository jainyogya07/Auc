import { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Plus, Search, Edit2, X, Trash2 } from 'lucide-react';
import type { Player } from '../../types';
import { cn } from '../../lib/utils'; // Assumed utility

export default function AdminPlayers() {
    const { players, addPlayer, updatePlayer, deletePlayer } = useAuctionStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filter, setFilter] = useState('');

    // Form State
    const [formData, setFormData] = useState<Partial<Player>>({
        name: '',
        role: 'Batsman',
        country: 'India',
        basePrice: 0.20, // 20 Lakhs
        isForeign: false,
        set: 1
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updatePlayer(editingId, formData);
            setEditingId(null);
        } else {
            const newPlayer: Player = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name!,
                role: formData.role! as any,
                country: formData.country!,
                basePrice: Number(formData.basePrice),
                isForeign: formData.isForeign!,
                status: 'U',
                set: Number(formData.set!)
            };
            addPlayer(newPlayer);
            setIsAdding(false);
        }
        setFormData({ name: '', role: 'Batsman', country: 'India', basePrice: 0.20, isForeign: false, set: 1 });
    };

    const startEdit = (player: Player) => {
        setEditingId(player.id);
        setFormData(player);
        setIsAdding(true);
    };

    const filteredPlayers = players.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-slate-100">Player Pool</h2>

                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        placeholder="Search players..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                    />
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Player
                </button>
            </div>

            {isAdding && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-200">{editingId ? 'Edit Player' : 'New Player'}</h3>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-500 hover:text-slate-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Player Name</label>
                            <input
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Role</label>
                            <select
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                            >
                                <option value="Batsman">Batsman</option>
                                <option value="Bowler">Bowler</option>
                                <option value="All-Rounder">All-Rounder</option>
                                <option value="Wicket Keeper">Wicket Keeper</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Country</label>
                            <input
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.country}
                                onChange={e => setFormData({ ...formData, country: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Base Price (Cr)</label>
                            <input
                                type="number"
                                step="0.05"
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.basePrice}
                                onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                                required
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Set No.</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.set}
                                onChange={e => setFormData({ ...formData, set: Number(e.target.value) })}
                            />
                        </div>

                        <div className="space-y-1 flex items-center gap-3 pt-6">
                            <input
                                type="checkbox"
                                id="isForeign"
                                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                                checked={formData.isForeign}
                                onChange={e => setFormData({ ...formData, isForeign: e.target.checked })}
                            />
                            <label htmlFor="isForeign" className="text-sm text-slate-400">Foreign Player</label>
                        </div>


                        <div className="col-span-2 pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium">
                                {editingId ? 'Update Player' : 'Add Player'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800">
                            <th className="px-6 py-4 text-sm font-medium text-slate-400">Name</th>
                            <th className="px-6 py-4 text-sm font-medium text-slate-400">Role</th>
                            <th className="px-6 py-4 text-sm font-medium text-slate-400">Country</th>
                            <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Base Price</th>
                            <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">Set</th>
                            <th className="px-6 py-4 text-sm font-medium text-slate-400 text-center">Status</th>
                            <th className="px-6 py-4 text-sm font-medium text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredPlayers.map(player => (
                            <tr key={player.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-200">{player.name}</div>
                                    {player.isForeign && <span className="text-xs text-amber-500">Foreign</span>}
                                </td>
                                <td className="px-6 py-4 text-slate-400">{player.role}</td>
                                <td className="px-6 py-4 text-slate-400">{player.country}</td>
                                <td className="px-6 py-4 text-slate-200 text-right font-mono">₹ {player.basePrice} Cr</td>
                                <td className="px-6 py-4 text-slate-400 text-center">{player.set}</td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={player.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => startEdit(player)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400 transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Are you sure you want to delete ${player.name}?`)) {
                                                deletePlayer(player.id);
                                            }
                                        }}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors ml-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {(player.status === 'S' || player.status === 'U') && (
                                        <RTMButton player={player} />
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filteredPlayers.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                    No players found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: Player['status'] }) {
    const styles = {
        'U': 'bg-slate-800 text-slate-400',
        'S': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        'US': 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    };
    const labels = {
        'U': 'Unsold',
        'S': 'SOLD',
        'US': 'Passed'
    };

    return (
        <span className={cn("px-2 py-1 rounded-full text-xs font-bold", styles[status])}>
            {labels[status]}
        </span>
    );
}

function RTMButton({ player }: { player: Player }) {
    const [isOpen, setIsOpen] = useState(false);
    const { teams, executeRTM } = useAuctionStore();
    const [selectedTeamCode, setSelectedTeamCode] = useState('');

    const targetTeam = teams.find(t => t.code.toUpperCase() === selectedTeamCode.toUpperCase());

    const handleConfirm = () => {
        if (targetTeam) {
            executeRTM(player.id, targetTeam.id, player.soldPrice || player.basePrice);
            setIsOpen(false);
            setSelectedTeamCode('');
        }
    };

    // Analysis Logic
    const getAnalysis = () => {
        if (!targetTeam) return null;

        const price = player.soldPrice || player.basePrice;
        const budgetImpact = (price / targetTeam.purse) * 100;

        let riskLevel = 'Low';
        let riskColor = 'text-emerald-400';

        if (budgetImpact > 20) {
            riskLevel = 'High';
            riskColor = 'text-rose-400';
        } else if (budgetImpact > 10) {
            riskLevel = 'Medium';
            riskColor = 'text-amber-400';
        }

        const remainingSlots = 25 - targetTeam.squadCount;
        const isStructureBad = remainingSlots < 5 && targetTeam.purse < 10; // Simple heuristic

        return { budgetImpact, riskLevel, riskColor, isStructureBad };
    };

    const analysis = getAnalysis();

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-400 transition-colors ml-2"
                title="Use RTM Card"
            >
                <span className="font-bold text-xs border border-current px-1 rounded">RTM / Retain</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in scale-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-amber-400">⚡</span> RTM / Retention Analysis
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-slate-400 block mb-1">Target Team Code</label>
                                <input
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono uppercase"
                                    placeholder="e.g. MI, CSK"
                                    value={selectedTeamCode}
                                    onChange={e => setSelectedTeamCode(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {targetTeam ? (
                                <div className="bg-slate-800/50 rounded-xl p-4 space-y-3 border border-slate-700/50">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Transfer To:</span>
                                        <span className="font-bold text-white">{targetTeam.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-400">Transfer Price:</span>
                                        <span className="font-mono text-white">₹ {player.soldPrice || player.basePrice} Cr</span>
                                    </div>
                                    <div className="h-px bg-slate-700/50 my-2" />

                                    {/* AI Insights */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1">
                                            <span className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">🤖</span>
                                            AI RISK ASSESSMENT
                                        </div>

                                        <div className="flex justify-between items-center bg-slate-950/30 p-2 rounded">
                                            <span className="text-slate-400 text-xs">Purse Impact</span>
                                            <span className="text-slate-200 font-mono text-xs">{analysis?.budgetImpact.toFixed(1)}%</span>
                                        </div>

                                        <div className="flex justify-between items-center bg-slate-950/30 p-2 rounded">
                                            <span className="text-slate-400 text-xs">Risk Verdict</span>
                                            <span className={`font-bold text-xs ${analysis?.riskColor}`}>{analysis?.riskLevel} RISK</span>
                                        </div>

                                        {analysis?.isStructureBad && (
                                            <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                                                Warning: Team has low slots and low purse.
                                            </div>
                                        )}
                                        {targetTeam.rtmCardsLeft === 0 && (
                                            <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                                                Warning: Team has NO RTM Cards left!
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : selectedTeamCode && (
                                <div className="text-rose-400 text-sm">Team not found</div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 py-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!targetTeam}
                                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirm RTM
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
