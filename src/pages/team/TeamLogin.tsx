import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Users } from 'lucide-react';

export default function TeamLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    // const { teams } = useAuctionStore(); // Not needed for invite code login
    const [inviteCode, setInviteCode] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        const trimmedCode = inviteCode.trim().toUpperCase();
        if (!trimmedCode) {
            setError('Please enter an invite code');
            return;
        }

        const result = await login({ role: 'team', inviteCode: trimmedCode });
        if (result.success) {
            navigate('/team');
        } else {
            setError(result.error || 'Invalid Invite Code');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 text-indigo-500">
                        <Users className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Team Portal</h1>
                    <p className="text-slate-400">Select your franchise to continue</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter Invite Code (e.g. RCB2024)"
                            value={inviteCode}
                            onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setError(''); }}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 uppercase font-mono"
                        />

                        {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

                        <button
                            onClick={handleLogin}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
                        >
                            Enter Auction Room
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
