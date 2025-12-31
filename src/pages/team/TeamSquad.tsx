// Future: useNavigate from 'react-router-dom' for navigation features
import { useAuthStore } from '../../store/useAuthStore';
import { useAuctionStore } from '../../store/useAuctionStore';

export default function TeamSquad() {
    // Navigation available for future features
    const { teamId } = useAuthStore();
    const { players, teams } = useAuctionStore();

    if (!teamId) return <div>Please log in</div>;

    const myTeam = teams.find(t => t.id === teamId);
    const mySquad = players.filter(p => p.soldTo === teamId);

    // Group by Role
    const batsmen = mySquad.filter(p => p.role === 'Batsman');
    const bowlers = mySquad.filter(p => p.role === 'Bowler');
    const allRounders = mySquad.filter(p => p.role === 'All-Rounder');
    const keepers = mySquad.filter(p => p.role === 'Wicket Keeper');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Squad</h1>
                    <p className="text-slate-400">
                        Total Players: <span className="text-emerald-400 font-bold">{mySquad.length}</span>/25
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500 uppercase tracking-wider font-bold">Purse Remaining</p>
                    <p className="text-2xl font-mono text-emerald-400 font-bold">₹ {myTeam?.purse.toFixed(2)} Cr</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RoleSection title="Batsmen" icon="🏏" players={batsmen} />
                <RoleSection title="All-Rounders" icon="⚔️" players={allRounders} />
                <RoleSection title="Wicket Keepers" icon="🧤" players={keepers} />
                <RoleSection title="Bowlers" icon="⚾" players={bowlers} />
            </div>
        </div>
    );
}

function RoleSection({ title, icon, players }: { title: string, icon: string, players: any[] }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 md:p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>{icon}</span> {title}
                <span className="ml-auto text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{players.length}</span>
            </h3>

            <div className="space-y-3">
                {players.length > 0 ? (
                    players.map(player => (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                {player.isForeign && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">✈️</span>}
                                <span className="font-medium text-slate-200">{player.name}</span>
                            </div>
                            <span className="font-mono text-emerald-400 font-bold text-sm">₹ {player.soldPrice} Cr</span>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 text-slate-600 text-sm italic">
                        No {title.toLowerCase()} yet
                    </div>
                )}
            </div>
        </div>
    );
}
