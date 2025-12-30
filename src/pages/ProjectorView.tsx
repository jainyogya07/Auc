import { useAuctionStore } from '../store/useAuctionStore';

import Confetti from 'react-confetti';
import { useAuctionAudio } from '../hooks/useAuctionAudio';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectorView() {
    const { currentPlayer, currentBid, currentBidder, teams, history, status } = useAuctionStore();
    const leadingTeam = teams.find(t => t.id === currentBidder);

    // Play Sounds
    useAuctionAudio();

    if (!currentPlayer) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-8 animate-pulse">
                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 tracking-tighter">
                        IPL AUCTION 2025
                    </h1>
                    <p className="text-4xl text-slate-500 font-light tracking-widest uppercase">
                        Waiting for next set...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative">
            {/* Confetti on SOLD */}
            {status === 'SOLD' && <Confetti numberOfPieces={500} recycle={false} />}

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black opacity-80" />

            {/* Dynamic Background for Leading Team */}
            <AnimatePresence>
                {leadingTeam && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000"
                        style={{ backgroundColor: leadingTeam.color }}
                    />
                )}
            </AnimatePresence>

            {/* Overlays for SOLD / UNSOLD */}
            <AnimatePresence>
                {status === 'SOLD' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-emerald-900/40 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.5, rotate: -10 }}
                            animate={{ scale: 1.5, rotate: 0 }}
                            className="bg-emerald-600 text-white border-8 border-white p-12 transform -rotate-12 shadow-2xl rounded-3xl"
                        >
                            <h1 className="text-9xl font-black uppercase tracking-tighter drop-shadow-lg">SOLD</h1>
                            <div className="text-4xl font-bold text-center mt-4">to {leadingTeam?.code}</div>
                        </motion.div>
                    </motion.div>
                )}
                {status === 'UNSOLD' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center grayscale"
                    >
                        <motion.div
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="border-8 border-slate-500 text-slate-400 p-12 rounded-xl"
                        >
                            <h1 className="text-9xl font-black uppercase tracking-widest opacity-50">UNSOLD</h1>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10 h-screen flex flex-col p-12 overflow-hidden">
                {/* Grid Layout */}
                <div className="grid grid-cols-12 gap-12 flex-1 min-h-0 overflow-hidden">

                    {/* Left: Player Profile (Large) */}
                    <div className="col-span-5 flex flex-col justify-center min-h-0">
                        <motion.div
                            key={currentPlayer.id}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="relative"
                        >
                            <div className="w-[450px] h-[450px] rounded-full mx-auto bg-gradient-to-b from-slate-800 to-slate-900 border-8 border-slate-800 shadow-2xl flex items-center justify-center relative z-10">
                                <span className="text-9xl">🏏</span>
                            </div>
                            {/* Decorative Rings */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-slate-800 rounded-full opacity-20 animate-[spin_10s_linear_infinite]" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-slate-800 rounded-full opacity-10 animate-[spin_15s_linear_infinite_reverse]" />
                        </motion.div>

                        <div className="mt-8 text-center space-y-4">
                            <h1 className="text-6xl font-black tracking-tight">{currentPlayer.name}</h1>
                            <div className="flex justify-center gap-6 text-2xl font-light text-slate-300">
                                <span className="px-6 py-2 bg-slate-900/50 border border-slate-800 rounded-xl">{currentPlayer.role}</span>
                                <span className="px-6 py-2 bg-slate-900/50 border border-slate-800 rounded-xl">{currentPlayer.country}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Bidding Information */}
                    <div className="col-span-7 flex flex-col justify-center pl-12 border-l border-slate-800/50 min-h-0 overflow-hidden">
                        <div className="space-y-10 flex-1 flex flex-col justify-center min-h-0">
                            {/* Current Bidder Block */}
                            <div className="shrink-0">
                                <h3 className="text-2xl text-slate-500 font-medium uppercase tracking-widest mb-4">Current Bidder</h3>
                                <AnimatePresence mode="wait">
                                    {leadingTeam ? (
                                        <motion.div
                                            key={leadingTeam.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="flex items-center gap-8 bg-slate-900/80 p-6 rounded-3xl border-l-8 backdrop-blur-sm shadow-2xl"
                                            style={{ borderLeftColor: leadingTeam.color }}
                                        >
                                            <div
                                                className="w-24 h-24 rounded-2xl shadow-lg border-2 border-slate-700/50 flex items-center justify-center text-3xl font-black text-white/20 select-none shrink-0"
                                                style={{ backgroundColor: leadingTeam.color }}
                                            >
                                                {leadingTeam.code}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-5xl font-bold mb-1 truncate">{leadingTeam.name}</div>
                                                <div className="text-xl text-slate-400 font-mono">Purse Left: ₹ {leadingTeam.purse.toFixed(2)} Cr</div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="text-3xl text-slate-600 italic">Waiting for opening bid...</div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Big Number */}
                            <div className="shrink-0">
                                <h3 className="text-2xl text-slate-500 font-medium uppercase tracking-widest mb-2">Current Price</h3>
                                <motion.div
                                    key={currentBid}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-[10rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 via-emerald-200 to-cyan-400 tabular-nums drop-shadow-[0_0_30px_rgba(52,211,153,0.3)]"
                                >
                                    ₹ {currentBid.toFixed(2)} <span className="text-5xl text-slate-500">Cr</span>
                                </motion.div>
                            </div>

                            {/* Feed */}
                            <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                                <h4 className="text-xl text-slate-600 uppercase mb-4 font-bold shrink-0">Recent Activity</h4>
                                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-4">
                                    {history.slice().reverse().slice(0, 5).map((bid) => (
                                        <motion.div
                                            key={bid.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 0.6, x: 0 }}
                                            className="flex items-center gap-4 text-2xl text-slate-400"
                                        >
                                            <span className="font-bold text-slate-300">{teams.find(t => t.id === bid.teamId)?.code}</span>
                                            <span>bid</span>
                                            <span className="font-mono text-emerald-500">₹ {bid.amount.toFixed(2)} Cr</span>
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
