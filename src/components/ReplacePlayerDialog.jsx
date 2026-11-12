import { useEffect, useMemo, useState } from 'react';
import { fullName, initials } from '../hooks/usePlayers';

const formatDiff = (diff) => {
  const rounded = Math.round(diff * 10) / 10;
  return rounded === 0 ? '±0' : rounded > 0 ? `+${rounded}` : `−${Math.abs(rounded)}`;
};

/**
 * Lists the players who aren't in any team, closest in power to `player` first, so a player who can't
 * make it can be swapped out without regenerating the teams.
 */
export default function ReplacePlayerDialog({ player, teamName, bench, onPick, onClose }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bench
      .filter((p) => !q || fullName(p).toLowerCase().includes(q))
      .sort((a, b) => Math.abs(a.power - player.power) - Math.abs(b.power - player.power) || fullName(a).localeCompare(fullName(b)));
  }, [bench, query, player]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-title"
        className="w-full max-w-md max-h-[85vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-fadeIn"
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-700/60">
          <div className="min-w-0">
            <h2 id="replace-title" className="text-lg font-bold text-white truncate">
              Replace <bdi>{fullName(player)}</bdi>
            </h2>
            <p className="text-slate-400 text-sm">
              {teamName} · power {player.power} · closest in power first
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {bench.length === 0 ? (
          <p className="p-6 text-center text-slate-400">Everyone is already in a team. Add more players in the admin console.</p>
        ) : (
          <>
            <div className="p-4 pb-2">
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search players"
                aria-label="Search players"
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <ul className="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
              {options.length === 0 && <li className="text-center text-slate-400 py-6">No players match “{query}”.</li>}
              {options.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPick(p)}
                    className="w-full flex items-center gap-3 rounded-xl p-2.5 text-left bg-slate-800/60 border border-slate-700/50 hover:border-emerald-400/70 hover:bg-emerald-600/15 transition-all duration-200"
                  >
                    <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold bg-slate-700 text-slate-300">
                      {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover" /> : initials(p)}
                    </div>
                    <span dir="auto" className="flex-1 min-w-0 font-semibold text-white truncate">
                      {fullName(p)}
                    </span>
                    {p.position && <span className="text-xs font-semibold text-slate-400">{p.position}</span>}
                    <span className="text-emerald-400 font-bold text-sm">{p.power}</span>
                    <span className="w-10 text-right text-xs text-slate-500">{formatDiff(p.power - player.power)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
