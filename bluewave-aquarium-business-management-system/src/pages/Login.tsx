import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Waves } from 'lucide-react';
import { BlueWaveLogo } from '../components/BlueWaveLogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [email, setEmail] = useState('admin@bluewave.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Please fill in both email and password');
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      toastSuccess('Welcome back to BlueWave Aquarium System!');
    } catch (err: any) {
      toastError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('admin@bluewave.com');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] via-[#E0F2FE] to-white flex items-center justify-center p-4">
      {/* Decorative background ripples */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-[#90E0EF]/40 to-[#00B4D8]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl from-[#0077B6]/30 to-[#90E0EF]/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-sky-100/80 p-8 sm:p-10 backdrop-blur-md">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4">
            <BlueWaveLogo size="xl" showText={false} />
          </div>
          <div className="flex items-center tracking-tight font-extrabold text-[#0077B6] text-2xl">
            <span className="text-[#12304A]">BLUE</span>
            <span className="text-[#0077B6]">WAVE</span>
          </div>
          <span className="text-xs font-bold tracking-[0.25em] text-[#00B4D8] uppercase mt-0.5">
            AQUARIUM MANAGEMENT
          </span>
          <p className="mt-3 text-xs text-slate-500 max-w-xs leading-relaxed">
            Secure owner portal for daily fish sales, stock management, operating expenses & monthly financial reports.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bluewave.com"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#12304A] focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-[#12304A] focus:outline-none focus:ring-2 focus:ring-[#0077B6] focus:bg-white transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-[#0077B6] hover:bg-[#023E8A] active:scale-[0.99] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#0077B6]/20 transition-all cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span></span>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            className="text-xs font-semibold text-[#0077B6] hover:text-[#023E8A] bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
           
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Waves className="w-3.5 h-3.5 text-[#00B4D8]" />
          <span>BlueWave Aquarium Business Suite · v2.6</span>
        </div>
      </div>
    </div>
  );
};
