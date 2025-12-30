import { Loader2, Coffee } from 'lucide-react';

export default function WaitingRoom() {
    // const { isPaused } = useAuctionStore(); // Unused here, controlled by parent

    // Although this page is conditionally rendered based on isPaused, 
    // we can add a listener or just rely on the parent to unmount this when isPaused becomes false.

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl max-w-lg w-full shadow-2xl space-y-8">
                <div className="flex justify-center">
                    <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center animate-pulse">
                        <Coffee className="w-12 h-12 text-indigo-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold text-white">Waiting for Auctioneer</h1>
                    <p className="text-slate-400 text-lg">
                        The auction has not started yet. Please wait for the admin to initiate the session.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-3 text-emerald-500 bg-emerald-500/10 py-3 px-6 rounded-full w-fit mx-auto">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-mono font-medium">Connected & Waiting...</span>
                </div>
            </div>
        </div>
    );
}
