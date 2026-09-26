'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (res.ok) { login({ id: 1, name: email.split('@')[0], email, token: data.access_token }); router.push(redirect); }
        else setError(data.detail || 'Login failed');
      } else {
        const res = await fetch('http://127.0.0.1:8000/api/auth/signup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (res.ok) { login({ id: 1, name, email, token: data.access_token }); router.push(redirect); }
        else setError(data.detail || 'Signup failed');
      }
    } catch { setError('Network error'); }
  };

  return (
    <div className="flex items-center justify-center py-16 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/60 rounded-2xl p-8 shadow-2xl shadow-blue-900/5">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg mx-auto mb-4 shadow-lg shadow-blue-500/30">T</div>
            <h2 className="text-2xl font-bold text-white">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="text-sm text-gray-500 mt-1">{isLogin ? 'Sign in to your Equinox OMS account' : 'Join Equinox OMS today'}</p>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Full Name"
                  className="w-full bg-gray-800/80 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 chars)"
                className="w-full bg-gray-800/80 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-blue-400 hover:text-blue-300 font-semibold">{isLogin ? 'Sign up' : 'Sign in'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
