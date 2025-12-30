import { Link } from 'react-router-dom';
import { Shield, Users, Gavel, Monitor } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tight">
                        IPL AUCTION 2025
                    </h1>
                    <p className="text-xl text-slate-400">Select your portal to continue</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PortalCard
                        to="/admin/login"
                        title="Admin"
                        icon={<Shield className="w-10 h-10" />}
                        description="System Control & Management"
                        color="bg-rose-500"
                    />
                    <PortalCard
                        to="/auctioneer/login"
                        title="Auctioneer"
                        icon={<Gavel className="w-10 h-10" />}
                        description="Conduct the Bidding Process"
                        color="bg-amber-500"
                    />
                    <PortalCard
                        to="/team/login"
                        title="Team Owner"
                        icon={<Users className="w-10 h-10" />}
                        description="Participate & Bid for Players"
                        color="bg-indigo-500"
                    />
                    <PortalCard
                        to="/projector"
                        title="Projector"
                        icon={<Monitor className="w-10 h-10" />}
                        description="Big Screen Display View"
                        color="bg-emerald-500"
                    />
                </div>
            </div>
        </div>
    );
}

function PortalCard({ to, title, icon, description, color }: { to: string; title: string; icon: React.ReactNode; description: string; color: string }) {
    return (
        <Link
            to={to}
            className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-slate-700 transition-all hover:-translate-y-1 overflow-hidden"
        >
            <div className={`absolute top-0 left-0 w-full h-1 ${color}`} />
            <div className="flex flex-col items-center text-center gap-6">
                <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 group-hover:scale-110 transition-transform ${color.replace('bg-', 'text-')}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
            </div>
        </Link>
    );
}
