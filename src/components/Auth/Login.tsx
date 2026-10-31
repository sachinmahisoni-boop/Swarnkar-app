import React, { useState } from 'react';
import { Lock, User, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '369369') {
      onLogin();
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-stone-200">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-amber-100 p-3 rounded-full mb-3">
            <ShieldCheck className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-xl font-black text-stone-800">Shreem Mahal ERP</h1>
          <p className="text-sm text-stone-500">Secure Admin Login</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-600 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-100 border border-stone-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>
          {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition shadow-lg shadow-amber-500/30 cursor-pointer"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};
