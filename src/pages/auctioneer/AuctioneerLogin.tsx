import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Gavel } from 'lucide-react';

export default function AuctioneerLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!password) {
            setError('Please enter password');
            return;
        }
        const success = await login({ role: 'auctioneer', username: 'auctioneer', password });
        if (success) {
            navigate('/auctioneer');
        } else {
            setError('Invalid Password');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md space-y-8 text-center">
                <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4 text-amber-500">
                    <Gavel className="w-8 h-8" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Auctioneer Access</h1>
                    <p className="text-slate-400">Enter the control room</p>
                </div>

                <div className="space-y-4">
                    <input
                        type="password"
                        placeholder="Enter Auctioneer Password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-500"
                    />
                    {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-xl transition-colors"
                    >
                        Start Session
                    </button>
                </div>
            </div>
        </div>
    );
}
