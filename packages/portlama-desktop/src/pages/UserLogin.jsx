import { useState } from 'react';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { desktopUserAccessClient as client } from '../lib/desktop-user-access-client.js';

export default function UserLogin() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [waitingForCallback, setWaitingForCallback] = useState(false);

  const handleLogin = async () => {
    if (!domain.trim()) {
      setError('Please enter your server domain');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await client.startLogin(domain.trim());
      setWaitingForCallback(true);
      setLoading(false);
    } catch (err) {
      setError(err?.toString() || 'Failed to open browser');
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  if (waitingForCallback) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-8">
        <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8 max-w-md text-center">
          <Loader2 size={48} className="text-cyan-400 mx-auto mb-4 animate-spin" />
          <h1 className="text-xl font-bold text-white mb-3">Waiting for Login</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Complete the login in your browser. The app will automatically continue
            once authentication is successful.
          </p>
          <button
            type="button"
            onClick={() => {
              setWaitingForCallback(false);
              setLoading(false);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-8">
      <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <LogIn size={48} className="text-cyan-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">User Login</h1>
          <p className="text-zinc-400 text-sm">
            Sign in with your Authelia account to install plugins.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Server Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="example.com"
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}

          <button
            type="button"
            disabled={loading || !domain.trim()}
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 rounded bg-cyan-600 px-4 py-2.5 text-sm text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            Sign in with Authelia
          </button>
        </div>
      </div>
    </div>
  );
}
