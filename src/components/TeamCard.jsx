import { averagePower, totalPower } from '../lib/teamBalancer';
import { fullName } from '../hooks/usePlayers';

const COLORS = {
  blue: {
    card: 'from-blue-900/40 to-blue-800/10 border-blue-500/30',
    title: 'text-blue-300',
    stat: 'bg-blue-500/20 text-blue-200',
    row: 'bg-blue-950/40',
    avatar: 'bg-blue-600/50',
    power: 'bg-blue-600/30 text-blue-200',
  },
  rose: {
    card: 'from-rose-900/40 to-rose-800/10 border-rose-500/30',
    title: 'text-rose-300',
    stat: 'bg-rose-500/20 text-rose-200',
    row: 'bg-rose-950/40',
    avatar: 'bg-rose-600/50',
    power: 'bg-rose-600/30 text-rose-200',
  },
};

export default function TeamCard({ name, icon, color, players, captainId }) {
  const c = COLORS[color];
  return (
    <div className={`bg-gradient-to-br ${c.card} rounded-2xl p-4 sm:p-6 border`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className={`text-2xl font-black ${c.title}`}>
          {icon} {name}
        </h3>
        <div className="flex gap-2 text-sm">
          <span className={`px-3 py-1 rounded-lg ${c.stat}`}>
            Total <span className="font-bold">{totalPower(players)}</span>
          </span>
          <span className={`px-3 py-1 rounded-lg ${c.stat}`}>
            Avg <span className="font-bold">{averagePower(players)}</span>
          </span>
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-3">{players.length} players</p>
      <ul className="space-y-2">
        {players.map((player) => {
          const isCaptain = player.id === captainId;
          return (
            <li
              key={player.id}
              className={`flex items-center gap-3 rounded-xl p-2.5 ${
                isCaptain ? 'bg-yellow-900/30 border border-yellow-500/40' : c.row
              }`}
            >
              <div
                className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${
                  isCaptain ? 'bg-yellow-500/50' : c.avatar
                }`}
              >
                {isCaptain ? '👑' : '⚽'}
              </div>
              <div className="flex-1 min-w-0 font-semibold text-white truncate">
                {fullName(player)}
                {isCaptain && <span className="ml-2 text-yellow-400 text-sm">(C)</span>}
              </div>
              <div className={`px-2.5 py-0.5 rounded-lg font-bold text-sm ${c.power}`}>{player.power}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
