import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
    const navigate = useNavigate();
    const { login } = useAuthStore();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!password) {
            setError('Please enter password');
            return;
        }
        const success = await login({ role: 'admin', username: 'admin', password });
        if (success) {
            navigate('/admin');
        } else {
            setError('Invalid Password');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 text-rose-500">
                        <Shield className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
                    <p className="text-slate-400">Restricted Access Only</p>
                </div>

                <div className="space-y-4">
                    <input
                        type="password"
                        placeholder="Enter Admin Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500"
                    />
                    {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors"
                    >
                        Access Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
