import { useState } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import type { Team } from '../../types';

export default function AdminTeams() {
    const { teams, addTeam, updateTeam, deleteTeam } = useAuctionStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Team>>({
        name: '',
        code: '',
        purse: 100,
        color: '#000000'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateTeam(editingId, formData);
            setEditingId(null);
        } else {
            const newTeam: Team = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.name!,
                code: formData.code!,
                logo: 'https://placehold.co/100x100/333/fff?text=' + formData.code,
                purse: Number(formData.purse),
                purseUsed: 0,
                squadCount: 0,
                foreignPlayers: 0,
                rtmCardsLeft: 2,
                color: formData.color || '#000000'
            };
            addTeam(newTeam);
            setIsAdding(false);
        }
        setFormData({ name: '', code: '', purse: 100, color: '#000000' });
    };

    const startEdit = (team: Team) => {
        setEditingId(team.id);
        setFormData(team);
        setIsAdding(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-100">Teams Configuration</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Team
                </button>
            </div>

            {isAdding && (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-200">{editingId ? 'Edit Team' : 'New Team'}</h3>
                        <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-500 hover:text-slate-300">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Team Name</label>
                            <input
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Team Code (Short)</label>
                            <input
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono uppercase"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value })}
                                required
                                maxLength={3}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Initial Purse (Cr)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.purse}
                                onChange={e => setFormData({ ...formData, purse: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">RTM Cards</label>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.rtmCardsLeft ?? 2}
                                onChange={e => setFormData({ ...formData, rtmCardsLeft: Number(e.target.value) })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm text-slate-400">Theme Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    className="h-10 w-10 bg-transparent border-0 rounded cursor-pointer"
                                    value={formData.color}
                                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                                />
                                <span className="text-slate-500 font-mono text-sm">{formData.color}</span>
                            </div>
                        </div>
                        <div className="col-span-2 pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-medium">
                                {editingId ? 'Update Team' : 'Create Team'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(team => (
                    <div key={team.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: team.color }} />

                        <div className="flex items-start justify-between mb-4 pl-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold text-white/30 border border-slate-700 shadow-sm"
                                    style={{ backgroundColor: team.color }}
                                >
                                    {team.code}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">{team.name}</h3>
                                    <div className="text-xs text-slate-500 font-mono">{team.code}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(team)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-blue-400">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteTeam(team.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pl-3 border-t border-slate-800/50 pt-4">
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Purse</div>
                                <div className="text-emerald-400 font-bold">₹ {team.purse} Cr</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Used</div>
                                <div className="text-slate-300 font-bold">₹ {team.purseUsed} Cr</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">Squad</div>
                                <div className="text-white font-bold">{team.squadCount} / 25</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase">RTMs</div>
                                <div className="text-amber-400 font-bold">{team.rtmCardsLeft}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
