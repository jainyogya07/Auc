import { Users, DollarSign, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    return (
        <div className="space-y-8">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Teams"
                    value="10"
                    change="+2"
                    icon={<Users className="w-6 h-6 text-emerald-400" />}
                />
                <StatCard
                    title="Total Budget"
                    value="₹ 100 Cr"
                    change="Initial"
                    icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
                />
                <StatCard
                    title="Players Pool"
                    value="452"
                    change="Registered"
                    icon={<Trophy className="w-6 h-6 text-emerald-400" />}
                />
                <StatCard
                    title="Auction Status"
                    value="Pending"
                    change="--:--"
                    icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
                />
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Activity or Chart */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-[400px]">
                        <h3 className="text-lg font-medium text-slate-200 mb-4">Auction Overview</h3>
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Chart Placeholder
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-slate-200 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button onClick={() => navigate('/admin/teams')} className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium">Add New Team</button>
                            <button onClick={() => navigate('/admin/players')} className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium border border-slate-700">Manage Players</button>
                            <button onClick={() => navigate('/admin/control')} className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors text-sm font-medium border border-slate-700">Auction Control</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, icon }: { title: string; value: string; change: string; icon: React.ReactNode }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm font-medium">{title}</span>
                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">{icon}</div>
            </div>
            <div>
                <div className="text-2xl font-bold text-slate-100">{value}</div>
                <div className="text-xs text-emerald-500 mt-1 font-medium">{change}</div>
            </div>
        </div>
    );
}
