import { useState } from 'react';
import { useAuctionStore, getSocket } from '../../store/useAuctionStore';
import { Upload, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface RetentionPlayer {
    playerId: string;
    playerName: string;
    deduction: number;
    set: string;
}

interface ParsedRetentions {
    [teamId: string]: RetentionPlayer[];
}

export default function AdminRetentions() {
    const { teams } = useAuctionStore();
    const [csvInput, setCsvInput] = useState('');
    const [parsedData, setParsedData] = useState<ParsedRetentions>({});
    const [isSeeding, setIsSeeding] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const parseCSV = () => {
        try {
            const lines = csvInput.trim().split('\n');
            const retentions: ParsedRetentions = {};

            for (const line of lines) {
                const [teamCode, playerName, deductionStr, setLabel] = line.split(',').map(s => s.trim());

                if (!teamCode || !playerName || !deductionStr) continue;

                const teamId = teamCode.toLowerCase();
                const deduction = parseInt(deductionStr);
                const playerId = playerName.toLowerCase().replace(/ /g, '_');

                if (!retentions[teamId]) {
                    retentions[teamId] = [];
                }

                retentions[teamId].push({
                    playerId,
                    playerName,
                    deduction,
                    set: setLabel || 'Retained'
                });
            }

            setParsedData(retentions);
            setMessage({ type: 'success', text: `Parsed ${Object.keys(retentions).length} teams, ${Object.values(retentions).flat().length} players` });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to parse CSV. Check format.' });
        }
    };

    const seedRetentions = async () => {
        setIsSeeding(true);
        setMessage(null);

        try {
            for (const [teamId, players] of Object.entries(parsedData)) {
                await (getSocket() as any).emitWithPromise('admin:seed-retentions', {
                    teamId,
                    players
                });
            }

            setMessage({ type: 'success', text: 'Retentions seeded successfully!' });
            setCsvInput('');
            setParsedData({});
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to seed retentions' });
        } finally {
            setIsSeeding(false);
        }
    };

    const clearRetentions = async () => {
        if (!confirm('Clear all retentions? This will restore team purses and mark players as unsold.')) return;

        setIsSeeding(true);
        try {
            await (getSocket() as any).emitWithPromise('admin:clear-retentions', null);
            setMessage({ type: 'success', text: 'All retentions cleared!' });
            setParsedData({});
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to clear retentions' });
        } finally {
            setIsSeeding(false);
        }
    };

    const totalPlayers = Object.values(parsedData).flat().length;
    const totalDeduction = Object.values(parsedData).flat().reduce((sum, p) => sum + p.deduction, 0) / 100;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Retention Management</h1>
                <p className="text-slate-400">Seed retained players into teams before auction starts</p>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                    )}
                    <span className={message.type === 'success' ? 'text-emerald-200' : 'text-rose-200'}>
                        {message.text}
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CSV Input */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h2 className="text-lg font-bold text-slate-200 mb-4">CSV Input</h2>
                    <p className="text-sm text-slate-400 mb-3">Format: TeamCode,PlayerName,Deduction(Lakhs),Set</p>

                    <textarea
                        value={csvInput}
                        onChange={(e) => setCsvInput(e.target.value)}
                        placeholder="CSK,Ruturaj Gaikwad,1800,Set A&#10;CSK,Matheesha Pathirana,1300,Set A&#10;MI,Jasprit Bumrah,1800,Set B"
                        className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500 resize-none"
                    />

                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={parseCSV}
                            disabled={!csvInput.trim()}
                            className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Parse Data
                        </button>
                        <button
                            onClick={() => { setCsvInput(''); setParsedData({}); setMessage(null); }}
                            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                    <h2 className="text-lg font-bold text-slate-200 mb-4">
                        Preview {totalPlayers > 0 && `(${totalPlayers} players, ₹${totalDeduction.toFixed(2)} Cr)`}
                    </h2>

                    {Object.keys(parsedData).length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-slate-500">
                            No data parsed yet
                        </div>
                    ) : (
                        <div className="h-64 overflow-y-auto space-y-3">
                            {Object.entries(parsedData).map(([teamId, players]) => {
                                const team = teams.find(t => t.id === teamId);
                                const teamTotal = players.reduce((sum, p) => sum + p.deduction, 0) / 100;

                                return (
                                    <div key={teamId} className="bg-slate-950 rounded-lg p-3 border border-slate-800">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-bold text-slate-200">{team?.name || teamId.toUpperCase()}</span>
                                            <span className="text-sm text-emerald-400">₹{teamTotal.toFixed(2)} Cr</span>
                                        </div>
                                        <div className="space-y-1">
                                            {players.map((p, idx) => (
                                                <div key={idx} className="text-sm text-slate-400 flex justify-between">
                                                    <span>{p.playerName}</span>
                                                    <span className="text-slate-500">₹{(p.deduction / 100).toFixed(2)} Cr</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-4">
                <button
                    onClick={seedRetentions}
                    disabled={isSeeding || Object.keys(parsedData).length === 0}
                    className="flex items-center gap-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Upload className="w-5 h-5" />
                    {isSeeding ? 'Seeding...' : 'Seed Retentions'}
                </button>

                <button
                    onClick={clearRetentions}
                    disabled={isSeeding}
                    className="flex items-center gap-2 py-3 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-5 h-5" />
                    Clear All Retentions
                </button>
            </div>

            {/* Current Retentions Display */}
            <div className="mt-8 bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h2 className="text-lg font-bold text-slate-200 mb-4">Current Retentions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.filter(t => t.retentions && t.retentions.length > 0).map(team => (
                        <div key={team.id} className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                            <div className="font-bold text-slate-200 mb-2">{team.name}</div>
                            <div className="text-sm text-slate-400">
                                {team.retentions?.length || 0} players retained
                            </div>
                        </div>
                    ))}
                    {teams.filter(t => t.retentions && t.retentions.length > 0).length === 0 && (
                        <div className="col-span-full text-center text-slate-500 py-8">
                            No retentions seeded yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
