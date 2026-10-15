import { useState } from 'react';
import { checkPassword, startSession } from '../lib/auth';

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setChecking(true);
    setError(null);
    try {
      if (await checkPassword(password)) {
        startSession();
        onLogin();
        return;
      }
      setError('Wrong password');
    } catch (err) {
      console.error('Login error:', err);
      setError('Could not check the password in this browser');
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center px-4 py-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            Zemer Teams Generator
          </h1>
          <p className="text-slate-400 mt-1">Enter the password to continue</p>
        </div>

        <label htmlFor="password" className="block text-emerald-300 text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoFocus
            autoComplete="current-password"
            autoCapitalize="none"
            spellCheck={false}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className="w-full pl-4 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            placeholder="xxxx-xxxx-xxxx-xxxx"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-slate-400 hover:text-slate-200"
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-rose-300 text-sm bg-rose-900/30 border border-rose-500/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={checking || !password.trim()}
          className="mt-5 w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 text-white font-bold rounded-xl transition-all duration-300"
        >
          {checking ? 'Checking…' : 'Log in'}
        </button>
      </form>
      <p className="mt-8 text-xs text-slate-500">Version {__APP_VERSION__}</p>
    </div>
  );
}
