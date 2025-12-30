import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Gavel,
    Settings,
    LogOut,
    Menu,
    Trophy,
    History
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

type NavItem = {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    to: string;
};

const NAV_ITEMS: Record<string, NavItem[]> = {
    admin: [
        { label: 'Overview', icon: LayoutDashboard, to: '/admin' },
        { label: 'Teams', icon: Users, to: '/admin/teams' },
        { label: 'Players', icon: Trophy, to: '/admin/players' },
        { label: 'Auction Control', icon: Gavel, to: '/admin/control' },
        { label: 'Settings', icon: Settings, to: '/admin/settings' },
    ],
    team: [
        { label: 'Dashboard', icon: LayoutDashboard, to: '/team' },
        { label: 'My Squad', icon: Users, to: '/team/squad' },
        { label: 'Auction Arena', icon: Gavel, to: '/team/arena' },
        { label: 'History', icon: History, to: '/team/history' },
    ],
    auctioneer: [
        { label: 'Live Console', icon: Gavel, to: '/auctioneer' },
        { label: 'Upcoming', icon: History, to: '/auctioneer/upcoming' },
        { label: 'Teams Status', icon: Users, to: '/auctioneer/teams' },
    ]
};

export function DashboardLayout({ role }: { role: 'admin' | 'team' | 'auctioneer' }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, logout, username, role: userRole } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }

        // Strict Role Check
        if (userRole && userRole !== role) {
            // If logged in but wrong role, redirect to root (or we could be smarter and send them to their dashboard)
            navigate('/');
        }
    }, [isAuthenticated, userRole, role, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = NAV_ITEMS[role] || [];

    if (!isAuthenticated) return null; // Prevent flash of content

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans selection:bg-emerald-500/30">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarOpen ? 240 : 80 }}
                className="border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex-shrink-0 relative z-20 flex flex-col"
            >
                <div className="h-16 flex items-center px-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/20">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400"
                            >
                                IPL Auction
                            </motion.span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to !== '/admin' && item.to !== '/team'} // Exact match for root except dashboard
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                isActive
                                    ? "bg-emerald-500/10 text-emerald-400"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                            )}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn(
                                        "w-5 h-5 flex-shrink-0 transition-colors",
                                        isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                                    )} />
                                    {isSidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="font-medium whitespace-nowrap"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeNav"
                                            className="absolute left-0 w-1 h-6 bg-emerald-500 rounded-r-full"
                                        />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-slate-800/50">
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all"
                    >
                        <Menu className="w-5 h-5" />
                        {isSidebarOpen && <span>Collapse</span>}
                    </button>

                    <div className="mt-2 pt-2 border-t border-slate-800/50">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all">
                            <LogOut className="w-5 h-5" />
                            {isSidebarOpen && <span>Logout</span>}
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />

                {/* Header */}
                <header className="h-16 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-md flex items-center justify-between px-8 relative z-10 shrink-0">
                    <h2 className="text-xl font-semibold text-slate-200">
                        {navItems.find(i => i.to === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-400 border border-slate-700">
                            User: <span className="text-emerald-400 font-bold">{username}</span> ({role})
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
                    </div>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 overflow-hidden relative z-10">
                    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="min-h-full"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
