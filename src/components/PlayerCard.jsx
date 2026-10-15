import { fullName, initials } from '../hooks/usePlayers';
import { cardTier, POSITION_BY_CODE, STATS } from '../lib/playerRating';

// FIFA-style player card. Sizes are in container units (cqw), so the card scales to whatever width it gets.

const TIERS = {
  gold: {
    background: 'linear-gradient(160deg, #fcefb4 0%, #e9cd72 30%, #cfa94f 65%, #ecd17a 100%)',
    text: '#3d2f0f',
    avatar: 'rgba(61, 47, 15, 0.14)',
    line: 'rgba(61, 47, 15, 0.25)',
  },
  silver: {
    background: 'linear-gradient(160deg, #f8fafc 0%, #d9dde3 30%, #a9b0ba 65%, #d9dde3 100%)',
    text: '#1f2937',
    avatar: 'rgba(31, 41, 55, 0.12)',
    line: 'rgba(31, 41, 55, 0.22)',
  },
  bronze: {
    background: 'linear-gradient(160deg, #f6d2b1 0%, #dba27a 30%, #b0714a 65%, #d99a6f 100%)',
    text: '#3b1d0b',
    avatar: 'rgba(59, 29, 11, 0.14)',
    line: 'rgba(59, 29, 11, 0.25)',
  },
};

const CARD_SHAPE = 'polygon(0 5%, 7% 0, 93% 0, 100% 5%, 100% 87%, 76% 95%, 50% 100%, 24% 95%, 0 87%)';
const SHINE =
  'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 42%, transparent 50%, transparent 62%, rgba(255,255,255,0.18) 68%, transparent 74%)';

export default function PlayerCard({ player, className = '' }) {
  const tier = TIERS[cardTier(player.power)];
  return (
    <div className={`@container ${className}`} style={{ filter: 'drop-shadow(0 8px 14px rgba(0, 0, 0, 0.35))' }}>
      <div
        className="relative aspect-[5/7] flex flex-col overflow-hidden select-none"
        style={{ clipPath: CARD_SHAPE, background: tier.background, color: tier.text }}
      >
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: SHINE }}></div>

        {/* Overall + position, face */}
        <div className="relative flex px-[8cqw] pt-[11cqw]">
          <div className="flex flex-col items-center leading-none w-[22cqw]">
            <span className="text-[19cqw] font-black tracking-tight">{Math.round(player.power)}</span>
            <span className="text-[8cqw] font-bold mt-[1.5cqw]">{player.position ?? '—'}</span>
          </div>
          <div className="flex-1 flex justify-center pr-[4cqw]">
            <div
              className="w-[44cqw] aspect-square rounded-full overflow-hidden flex items-center justify-center text-[16cqw] font-black"
              style={{ background: tier.avatar, boxShadow: player.photo ? `0 0 0 0.8cqw ${tier.line}` : undefined }}
            >
              {player.photo ? (
                <img src={player.photo} alt="" className="w-full h-full object-cover" draggable={false} />
              ) : (
                initials(player)
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div
          dir="auto"
          className="relative mx-[8cqw] mt-[6cqw] pb-[2cqw] text-center text-[8.5cqw] font-extrabold truncate"
          style={{ borderBottom: `1px solid ${tier.line}` }}
        >
          {fullName(player)}
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-6 text-center px-[6cqw] mt-[4cqw] leading-tight">
          {STATS.map(({ key, label, name }) => (
            <div key={key} title={name}>
              <div className="text-[5cqw] font-semibold opacity-75">{label}</div>
              <div className="text-[7.5cqw] font-bold">{player.stats ? player.stats[key] : '–'}</div>
            </div>
          ))}
        </div>

        {player.rated ? (
          <div className="relative mt-[6cqw] text-center text-[5cqw] font-bold uppercase tracking-[0.15em] opacity-60">
            {POSITION_BY_CODE[player.position].name}
          </div>
        ) : (
          <div
            className="relative mx-auto mt-[5cqw] px-[3cqw] py-[1cqw] rounded-full text-[4.5cqw] font-bold uppercase tracking-wide"
            style={{ background: tier.line }}
          >
            Not rated
          </div>
        )}
      </div>
    </div>
  );
}
