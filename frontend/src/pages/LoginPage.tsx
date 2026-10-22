import React, { useState } from 'react';
import { Droplet, Waves, Shield, Lock, Mail, ArrowRight, UserCheck, ShieldAlert, Cpu } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useApp();
  const [email, setEmail] = useState('operator@aquacare.io');
  const [password, setPassword] = useState('prawn');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: 'admin' | 'operator') => {
    setError(null);
    setIsLoading(true);
    const uEmail = role === 'admin' ? 'admin@aquacare.io' : 'operator@aquacare.io';
    const uPass = role === 'admin' ? 'admin' : 'prawn';
    try {
      await login(uEmail, uPass);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-ocean-900 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-500 to-cyan-400 text-slate-950 shadow-glow-cyan mb-4">
          <Droplet className="w-8 h-8 text-slate-950 fill-slate-950" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">AquaCare</h2>
        <p className="mt-1 text-sm text-cyan-300 font-medium">
          Smart Aquaculture Monitoring &bull; <em>Macrobrachium rosenbergii</em>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-4 shadow-2xl rounded-3xl sm:px-10 border border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@aquacare.io"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-seafoam-400 hover:from-cyan-300 hover:to-seafoam-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all disabled:opacity-60"
            >
              {isLoading ? 'Verifying...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              One-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('operator')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 font-medium transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-seafoam-400" />
                <span>Field Operator</span>
              </button>

              <button
                type="button"
                onClick={() => quickLogin('admin')}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 font-medium transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span>Admin</span>
              </button>
            </div>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Pre-seeded accounts: admin@aquacare.io / admin | operator@aquacare.io / prawn
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-slate-400 text-xs">
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800">
            <Cpu className="w-4 h-4 mx-auto text-cyan-400 mb-1" />
            <span>ESP32 Telemetry</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800">
            <Shield className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <span>Backend Rules</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800">
            <Waves className="w-4 h-4 mx-auto text-seafoam-400 mb-1" />
            <span>Zero-H/W Lab</span>
          </div>
        </div>
      </div>
    </div>
  );
};

