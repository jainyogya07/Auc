import { useState, useEffect } from 'react';
import { useAuctionStore } from '../../store/useAuctionStore';
import { Link } from 'react-router-dom';
import { Clock, ListOrdered, ArrowRight } from 'lucide-react';

export default function AdminSettings() {
    const { settings, adminUpdateSettings } = useAuctionStore();
    const [localSettings, setLocalSettings] = useState(settings);

    useEffect(() => {
        if (settings && JSON.stringify(settings) !== JSON.stringify(localSettings)) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleSave = () => {
        if (localSettings) {
            adminUpdateSettings(localSettings);
            alert("Timer Settings Updated!");
        }
    };

    if (!localSettings) return <div className="text-slate-500">Loading settings...</div>;

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-100">Global Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
                        <ListOrdered className="w-5 h-5 text-indigo-500" />
                        Set Management
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">
                        Reorder auction sets to control the flow of the event. Prioritize marquee sets or specific categories.
                    </p>
                    <Link
                        to="/admin/sets"
                        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                        Manage Set Order <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-slate-200 mb-6 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" />
                        Auction Timer Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Default Duration (Seconds)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={localSettings.defaultDuration}
                                onChange={(e) => setLocalSettings({ ...localSettings, defaultDuration: Number(e.target.value) })}
                            />
                            <p className="text-xs text-slate-500 mt-2">Time given to start waiting for bids on a new player.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Reset Duration (Seconds)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={localSettings.resetDuration}
                                onChange={(e) => setLocalSettings({ ...localSettings, resetDuration: Number(e.target.value) })}
                            />
                            <p className="text-xs text-slate-500 mt-2">Time reset after each valid bid.</p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                        >
                            Update Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
