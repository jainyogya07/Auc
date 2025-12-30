import { useAuctionStore } from '../../store/useAuctionStore';
import { Users, DollarSign, Trophy } from 'lucide-react';

export default function AuctioneerTeams() {
    const { teams } = useAuctionStore();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-emerald-500" />
                Teams Overview
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                    <div key={team.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-4 mb-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-bold text-white/30 border-2 border-slate-700/50 shadow-inner"
                                style={{ backgroundColor: team.color }}
                            >
                                {team.code}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white leading-tight">{team.name}</h3>
                                <div className="text-sm font-mono text-slate-500">{team.code}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <DollarSign className="w-4 h-4" />
                                    Purse Left
                                </div>
                                <div className="font-mono text-emerald-400 font-bold">
                                    ₹ {team.purse.toFixed(2)} Cr
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Users className="w-4 h-4" />
                                    Squad Size
                                </div>
                                <div className="text-white font-bold">
                                    {team.squadCount} / 25
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-xl">
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    <Trophy className="w-4 h-4" />
                                    Foreign
                                </div>
                                <div className="text-white font-bold">
                                    {team.foreignPlayers} / 8
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
