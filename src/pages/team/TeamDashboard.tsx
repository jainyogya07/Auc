import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, Bookmark, Trophy, ArrowRight, Activity, Search } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuctionStore } from '../../store/useAuctionStore';
import { useState, useEffect } from 'react';

export default function TeamDashboard() {
    const navigate = useNavigate();
    const { teamId } = useAuthStore();
    const { teams, players, history, eventLog } = useAuctionStore();

    // Get current team data
    const myTeam = teams.find(t => t.id === teamId);

    // Get squad (players sold to this team)
    const mySquad = players.filter(p => p.soldTo === teamId);

    // --- NOMINATION PANEL LOGIC ---
    const { nominations, submitNomination } = useAuctionStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNominees, setSelectedNominees] = useState<string[]>([]);

    // Load existing nomination if any
    useEffect(() => {
        const mySub = nominations?.submissions?.find((s: any) => s.teamId === teamId);
        if (mySub) {
            // Only update if different to avoid potential loops/lint warnings
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedNominees(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(mySub.playerIds)) {
                    return mySub.playerIds;
                }
                return prev;
            });
        }
    }, [nominations, teamId]);

    const unsoldPlayers = players.filter(p => p.status === 'U' || p.status === 'US');
    const filteredPlayers = unsoldPlayers.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleNominee = (id: string) => {
        if (selectedNominees.includes(id)) {
            setSelectedNominees(prev => prev.filter(x => x !== id));
        } else {
            if (selectedNominees.length >= 10) return alert("Max 10 players allowed!");
            setSelectedNominees(prev => [...prev, id]);
        }
    };

    const handleSubmitNominations = () => {
        if (confirm(`Submit ${selectedNominees.length} players for nomination?`)) {
            submitNomination(selectedNominees);
        }
    };
    // ------------------------------

    // Calculate stats
    const totalPurse = 100; // Assuming 100 Cr total budget
    const spentAmount = totalPurse - (myTeam?.purse || 0);
    const squadSize = mySquad.length;

    // Get recent bids (last 3 for this team)
    const myRecentBids = history
        .filter(bid => bid.teamId === teamId)
        .slice(0, 3);

    if (!myTeam) return <div>Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-2xl p-8">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 p-4 opacity-[0.03]">
                    <Trophy className="w-96 h-96" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
                            {myTeam.name}
                        </h1>
                        <p className="text-slate-400 text-lg flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Team Owner Dashboard
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/team/arena')}
                        className="group flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
                    >
                        Enter Auction Arena
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Nomination Panel (Only visible when active) */}
            {nominations?.isOpen && (
                <div className="bg-indigo-900/10 border-2 border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.05]">
                        <Search className="w-64 h-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">Unsold Player Nomination Phase</h3>
                                <p className="text-indigo-200">Select up to 10 unsold players to bring back to the auction pool.</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-4xl font-black ${selectedNominees.length === 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {selectedNominees.length}
                                </span>
                                <span className="text-slate-400 text-sm block">/ 10 Selected</span>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search unsold players by name or role..."
                                    className="w-full bg-slate-950 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSubmitNominations}
                                disabled={selectedNominees.length === 0}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                            >
                                Submit List
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredPlayers.slice(0, 50).map(p => {
                                const isSelected = selectedNominees.includes(p.id);
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => toggleNominee(p.id)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${isSelected
                                            ? 'bg-indigo-600 border-indigo-500 shadow-lg scale-[1.02]'
                                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                                            }`}
                                    >
                                        <div>
                                            <div className={`font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{p.name}</div>
                                            <div className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>{p.role}</div>
                                        </div>
                                        {isSelected && <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Purse Remaining"
                    value={`₹ ${myTeam.purse.toFixed(2)} Cr`}
                    icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
                    subtext={`Spent: ₹ ${spentAmount.toFixed(2)} Cr`}
                    trend="high"
                />
                <StatCard
                    title="Squad Size"
                    value={`${squadSize} / 25`}
                    icon={<Users className="w-6 h-6 text-blue-400" />}
                    subtext="Target: 18-25 Players"
                    trend="neutral"
                />
                <StatCard
                    title="RTM Cards"
                    value={`${myTeam.rtmCardsLeft} Left`}
                    icon={<Bookmark className="w-6 h-6 text-amber-400" />}
                    subtext="Total Limit: 5"
                    trend="neutral"
                />
                <StatCard
                    title="Active Bids"
                    value={myRecentBids.length.toString()}
                    icon={<Activity className="w-6 h-6 text-rose-400" />}
                    subtext="In recent history"
                    trend="neutral"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Squad Preview */}
                <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" />
                            Current Squad
                        </h3>
                        <button
                            onClick={() => navigate('/team/squad')}
                            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            View All
                        </button>
                    </div>

                    {mySquad.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {mySquad.slice(0, 4).map((player: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors">
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl relative">
                                        🏏
                                        {player.soldVia === 'RTM' && (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-slate-800" title="Retained via RTM">
                                                <Bookmark className="w-3 h-3 text-white fill-current" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200 flex items-center gap-2">
                                            {player.name}
                                            {player.soldVia === 'RTM' && (
                                                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">RTM</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-slate-400">{player.role} • ₹ {player.soldPrice || player.basePrice} Cr</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
                            <div className="text-slate-500 mb-2">No players purchased yet</div>
                            <p className="text-sm text-slate-600">Join the auction arena to start building your squad</p>
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            Recent Activity
                        </h3>
                        <button
                            onClick={() => navigate('/team/history')}
                            className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                            View All
                        </button>
                    </div>
                    <div className="space-y-4">
                        {eventLog.filter(e => e.details?.teamId === teamId).slice(-3).reverse().map((event) => (
                            <div key={event.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex justify-between items-center">
                                <div>
                                    <div className="text-sm text-slate-400 mb-1">
                                        {event.type === 'BID_PLACED' ? 'Bid Placed' : 'Player Purchased'}
                                    </div>
                                    <div className="font-mono text-emerald-400 font-bold">₹ {event.details.amount} Cr</div>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {new Date(event.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ value, subtext, icon, trend }: { title: string; value: string; subtext: string; icon: React.ReactNode, trend: 'high' | 'neutral' }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:bg-slate-800/50 transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-slate-950 rounded-xl group-hover:scale-110 transition-transform duration-300 border border-slate-800">
                    {icon}
                </div>
                {trend === 'high' && <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12%</div>}
            </div>
            <div className="text-3xl font-bold text-white mb-2 tracking-tight">{value}</div>
            <div className="text-sm text-slate-400 font-medium">{subtext}</div>
        </div>
    );
}
