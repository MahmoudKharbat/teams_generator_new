import { fullName } from '../hooks/usePlayers';
import { cardTier, POSITION_BY_CODE, STATS } from '../lib/playerRating';

// FIFA-style player card. Sizes are in container units (cqw = 1% of the card's width), so the card scales
// to whatever width it gets. The card is 100cqw wide and 140cqw tall, the same ratio as the shape below.

const TIERS = {
  gold: {
    base: 'linear-gradient(180deg, #f9e5a4 0%, #f0d27c 40%, #e7c164 75%, #efd283 100%)',
    light: 'rgba(255, 247, 216, 0.75)',
    dark: 'rgba(213, 142, 22, 0.55)',
    panel: 'rgba(255, 246, 212, 0.3)',
    rim: '#b98a2c',
    text: '#33250a',
    silhouette: 'rgba(51, 37, 10, 0.2)',
  },
  silver: {
    base: 'linear-gradient(180deg, #f4f6f8 0%, #dde1e6 40%, #c3c9d1 75%, #d9dde3 100%)',
    light: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(122, 133, 148, 0.45)',
    panel: 'rgba(255, 255, 255, 0.3)',
    rim: '#8e96a2',
    text: '#1f2937',
    silhouette: 'rgba(31, 41, 55, 0.18)',
  },
  bronze: {
    base: 'linear-gradient(180deg, #f3cfae 0%, #e0aa82 40%, #c98b60 75%, #dca27a 100%)',
    light: 'rgba(255, 233, 212, 0.7)',
    dark: 'rgba(150, 78, 34, 0.5)',
    panel: 'rgba(255, 236, 218, 0.25)',
    rim: '#9c5e36',
    text: '#35190a',
    silhouette: 'rgba(53, 25, 10, 0.2)',
  },
};

// Shield outline in a 100 x 140 box: scooped top corners, straight sides, a pointed bottom.
const SHAPE =
  'M10 0H90A10 10 0 0 0 100 10V117C100 123 97 125 90 127L58 134Q52 135.5 50 140Q48 135.5 42 134L10 127C3 125 0 123 0 117V10A10 10 0 0 0 10 0Z';
const SHAPE_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 140' preserveAspectRatio='none'><path d='${SHAPE}'/></svg>`
)}")`;

// Diagonal light streaks across the top half, like the gold cards in the game.
const streaks = (t) =>
  `linear-gradient(130deg, transparent 30%, ${t.light} 33%, transparent 36%, transparent 41%, ${t.dark} 44%, ${t.light} 47.5%, ${t.dark} 51%, transparent 54%, transparent 58%, ${t.light} 61%, transparent 64%)`;

// The photo blends into the card at the top and sides and ends sharply on the line above the name.
const PHOTO_FADE = 'linear-gradient(to right, transparent, #000 22%, #000 78%, transparent), linear-gradient(to bottom, transparent, #000 18%)';

const BAND = 90; // cqw from the top: where the photo ends and the name panel starts

function Silhouette({ color }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill={color} aria-hidden="true">
      <circle cx="50" cy="38" r="19" />
      <path d="M12 100C12 74 28 62 50 62S88 74 88 100Z" />
    </svg>
  );
}

export default function PlayerCard({ player, className = '' }) {
  const tier = TIERS[cardTier(player.power)];
  return (
    <div className={`@container ${className}`} style={{ filter: 'drop-shadow(0 8px 14px rgba(0, 0, 0, 0.4))' }}>
      <div
        className="relative aspect-[5/7] overflow-hidden select-none"
        style={{
          background: tier.base,
          color: tier.text,
          fontFamily: "'Barlow Condensed', 'Cairo', sans-serif",
          maskImage: SHAPE_MASK,
          WebkitMaskImage: SHAPE_MASK,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
        }}
      >
        <div aria-hidden="true" className="absolute inset-x-0 top-0" style={{ height: `${BAND}cqw`, background: streaks(tier) }}></div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0"
          style={{ top: `${BAND}cqw`, background: tier.panel, boxShadow: `inset 0 1px 0 ${tier.rim}` }}
        ></div>

        {/* Photo */}
        <div
          className="absolute left-[24cqw] right-[3cqw] top-[8cqw]"
          style={{
            bottom: `calc(100% - ${BAND}cqw)`,
            maskImage: PHOTO_FADE,
            WebkitMaskImage: PHOTO_FADE,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        >
          {player.photo ? (
            <img src={player.photo} alt="" className="w-full h-full object-cover object-top" draggable={false} />
          ) : (
            <Silhouette color={tier.silhouette} />
          )}
        </div>

        {/* Overall + position */}
        <div className="absolute left-[6cqw] top-[12cqw] w-[22cqw] flex flex-col items-center leading-[0.85]">
          <span className="text-[24cqw] font-bold">{Math.round(player.power)}</span>
          <span className="text-[10cqw] font-semibold mt-[1cqw]">{player.position ?? '—'}</span>
        </div>

        {/* Name, stats, footer */}
        <div className="absolute inset-x-0 flex flex-col items-center" style={{ top: `${BAND}cqw` }}>
          <div dir="auto" className="max-w-[88cqw] mt-[1cqw] text-[12cqw] leading-none font-bold uppercase truncate">
            {fullName(player)}
          </div>

          <div className="w-full grid grid-cols-6 text-center px-[6cqw] mt-[1.5cqw] leading-none">
            {STATS.map(({ key, label, name }) => (
              <div key={key} title={name}>
                <div className="text-[6.5cqw] font-semibold opacity-85">{label}</div>
                <div className="text-[10cqw] font-bold mt-[0.5cqw]">{player.stats ? player.stats[key] : '–'}</div>
              </div>
            ))}
          </div>

          {player.rated ? (
            <div className="mt-[2.5cqw] text-[4.5cqw] font-semibold uppercase tracking-[0.15em] opacity-60">
              {POSITION_BY_CODE[player.position].name}
            </div>
          ) : (
            <div
              className="mt-[2cqw] px-[3cqw] py-[0.5cqw] rounded-full text-[4.5cqw] font-semibold uppercase tracking-wide"
              style={{ background: tier.silhouette }}
            >
              Not rated
            </div>
          )}
        </div>

        {/* Bevelled rim */}
        <svg aria-hidden="true" viewBox="0 0 100 140" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
          <path d={SHAPE} fill="none" stroke={tier.light} strokeWidth="6" vectorEffect="non-scaling-stroke" />
          <path d={SHAPE} fill="none" stroke={tier.rim} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}
