import { useAuthStore } from '../../store/useAuthStore';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AuctionEvent } from '../../types';

export default function TeamBidHistory() {
    const { teamId } = useAuthStore();
    const { eventLog } = useAuctionStore();

    // Filter events relevant to this team
    // 1. Bids placed by this team
    // 2. Players sold to this team
    // 3. Players sold to others (maybe? for context. limit to this team for now as per specific request)
    // Actually "Team Bid History" usually implies mostly their own actions.
    // Let's show:
    // - Bids placed by team
    // - Players sold to team
    // - Players lost by team (if they were the second highest bidder? Hard to track without full history logic)
    // Let's stick to "My Activity"

    const myEvents = eventLog.filter(event => {
        if (event.type === 'BID_PLACED') return event.details.teamId === teamId;
        if (event.type === 'PLAYER_SOLD') return event.details.teamId === teamId;
        return false;
    }).reverse(); // Newest first

    if (!teamId) return <div>Please log in</div>;

    const getIcon = (type: AuctionEvent['type']) => {
        switch (type) {
            case 'BID_PLACED': return <Clock className="w-5 h-5 text-indigo-400" />;
            case 'PLAYER_SOLD': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
            default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
        }
    };

    const getTitle = (event: AuctionEvent) => {
        switch (event.type) {
            case 'BID_PLACED': return 'Bid Placed';
            case 'PLAYER_SOLD': return 'Player Purchased!';
            default: return 'Event';
        }
    };

    const getDescription = (event: AuctionEvent) => {
        const { amount, name, playerId } = event.details;
        if (event.type === 'BID_PLACED') return `Bid of ₹${amount} Cr for Player ID ${playerId}`; //Ideally need player name map or fetch
        if (event.type === 'PLAYER_SOLD') return `Won ${name} for ₹${amount} Cr`;
        return JSON.stringify(event.details);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Clock className="w-8 h-8 text-emerald-500" />
                Bid History
            </h1>

            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-4 md:p-6 backdrop-blur-sm">
                <div className="space-y-4">
                    {myEvents.length > 0 ? (
                        myEvents.map((event) => (
                            <div key={event.id} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-start gap-4">
                                <div className="mt-1 p-2 bg-slate-800 rounded-lg">
                                    {getIcon(event.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-slate-200">{getTitle(event)}</h3>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {getDescription(event)}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            No bidding activity yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
