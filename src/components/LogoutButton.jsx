import { endSession } from '../lib/auth';

// Ends the 30-day session; the reload brings back the login page.
export default function LogoutButton({ label = 'Log out' }) {
  const logOut = () => {
    endSession();
    window.location.reload();
  };

  return (
    <button
      type="button"
      onClick={logOut}
      className="px-4 py-2.5 bg-slate-800/80 hover:bg-rose-900/40 text-rose-300 rounded-xl font-semibold transition-all duration-300 border border-rose-500/30 hover:border-rose-400/60"
    >
      🚪 {label}
    </button>
  );
}
