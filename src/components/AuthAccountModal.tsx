import React, { useEffect, useState } from 'react';
import { User } from '../types/subscription.ts';
import { ComputedThemeStyles } from '../types/theme.ts';
import {
  ArrowLeft,
  KeyRound,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';

interface AuthAccountModalProps {
  isOpen: boolean;
  styles: ComputedThemeStyles;
  onClose: () => void;
  currentUser: User | null;
  token: string | null;
  onAuthSuccess: (token: string, user: User) => void;
  onLogout: () => void;
}

interface ProtectedMeResponse {
  user: User;
  metrics: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    monthlyRecurringSpend: number;
    annualizedSpend: number;
  };
  jwtSession: {
    userId: string;
    email: string;
    issuedAt?: string;
    expiresAt?: string;
  };
}

export const AuthAccountModal: React.FC<AuthAccountModalProps> = ({
  isOpen,
  styles,
  onClose,
  currentUser,
  token,
  onAuthSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<'profile' | 'login' | 'register'>(
    token ? 'profile' : 'login'
  );
  const [email, setEmail] = useState('alex.mercer@workspace.local');
  const [password, setPassword] = useState('RadarPass2026!');
  const [name, setName] = useState('Alex Mercer');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [meData, setMeData] = useState<ProtectedMeResponse | null>(null);
  const [isVerifyingMe, setIsVerifyingMe] = useState(false);

  const fetchProtectedProfile = async (jwtToken: string) => {
    setIsVerifyingMe(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/users/me', {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Protected route check failed.');
        setMeData(null);
      } else {
        setMeData(data as ProtectedMeResponse);
      }
    } catch {
      setErrorMsg('Failed to reach /api/users/me');
    } finally {
      setIsVerifyingMe(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      setMode('profile');
      fetchProtectedProfile(token);
    } else if (isOpen && !token) {
      setMode('login');
      setMeData(null);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Login failed.');
        return;
      }
      onAuthSuccess(data.token, data.user);
      setMode('profile');
      fetchProtectedProfile(data.token);
    } catch {
      setErrorMsg('Network error during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Registration failed.');
        return;
      }
      onAuthSuccess(data.token, data.user);
      setMode('profile');
      fetchProtectedProfile(data.token);
    } catch {
      setErrorMsg('Network error during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className={`max-w-xl w-full ${styles.cardClass} overflow-hidden my-8`}>
        <div className={`px-6 py-4 border-b ${styles.dividerClass} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-2.5 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer ${styles.subPanelClass}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
            <h2 className={`text-base font-bold ${styles.headingFontClass}`}>
              Account &amp; JWT Session
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 opacity-60 hover:opacity-100 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className={`px-6 pt-4 flex items-center justify-between border-b ${styles.dividerClass} pb-3`}>
          <div className={`flex items-center gap-1 p-1 ${styles.subPanelClass} text-xs`}>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode('profile');
              }}
              style={
                mode === 'profile'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className="px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Profile (/api/users/me)
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setMode('login');
              }}
              style={
                mode === 'login'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className="px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setEmail('');
                setPassword('');
                setName('');
                setMode('register');
              }}
              style={
                mode === 'register'
                  ? { backgroundColor: styles.accentHex, color: '#FFFFFF' }
                  : undefined
              }
              className="px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Register
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-md">
              {errorMsg}
            </div>
          )}

          {mode === 'profile' && (
            <div className="space-y-4">
              {token && currentUser ? (
                <>
                  <div className={`flex items-center justify-between pb-3 border-b ${styles.dividerClass}`}>
                    <div>
                      <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        Authenticated
                      </div>
                      <div className="text-base font-bold mt-0.5">
                        {currentUser.name}
                      </div>
                      <div className={`font-mono ${styles.mutedTextClass}`}>{currentUser.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fetchProtectedProfile(token)}
                        className={`px-3 py-1.5 ${styles.subPanelClass} font-medium flex items-center gap-1.5 cursor-pointer`}
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isVerifyingMe ? 'animate-spin' : ''}`}
                        />
                        Verify
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          setMeData(null);
                          setMode('login');
                        }}
                        className="px-3 py-1.5 bg-red-500/15 text-red-600 rounded-md font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>

                  {meData && (
                    <pre className={`p-3.5 ${styles.subPanelClass} font-mono text-[11px] overflow-x-auto max-h-52 overflow-y-auto leading-relaxed`}>
                      {JSON.stringify(meData, null, 2)}
                    </pre>
                  )}
                </>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <KeyRound className="w-6 h-6 opacity-50 mx-auto" />
                  <div className="text-sm font-semibold">No Active Session</div>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                    className="px-4 py-2 rounded-lg font-semibold cursor-pointer"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className={`p-3 ${styles.subPanelClass} flex items-center justify-between`}>
                <span className="font-mono text-[11px]">
                  alex.mercer@workspace.local
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('alex.mercer@workspace.local');
                    setPassword('RadarPass2026!');
                  }}
                  style={{ color: styles.accentHex }}
                  className="text-xs font-semibold underline cursor-pointer"
                >
                  Fill Demo
                </button>
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                className="w-full py-2.5 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jordan Vance"
                  className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@company.io"
                  className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3 py-2 border ${styles.inputClass} focus:outline-none`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: styles.accentHex, color: '#FFFFFF' }}
                className="w-full py-2.5 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                {isSubmitting ? 'Creating Account...' : 'Register Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
