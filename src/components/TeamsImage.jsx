import { fullName } from '../hooks/usePlayers';

// Rendered off-screen and captured by html2canvas for the "Download image" button.
// Inline styles only: html2canvas can't parse Tailwind v4's oklch() colors. Power is deliberately hidden.

const TEAM_STYLES = {
  blue: { card: 'rgba(30, 58, 138, 0.6)', border: 'rgba(59, 130, 246, 0.5)', title: '#93c5fd', row: 'rgba(23, 37, 84, 0.6)', avatar: 'rgba(37, 99, 235, 0.6)' },
  rose: { card: 'rgba(136, 19, 55, 0.6)', border: 'rgba(244, 63, 94, 0.5)', title: '#fda4af', row: 'rgba(76, 5, 25, 0.6)', avatar: 'rgba(225, 29, 72, 0.6)' },
};

function TeamColumn({ title, color, players, captainId }) {
  const s = TEAM_STYLES[color];
  return (
    <div style={{ backgroundColor: s.card, borderRadius: '16px', padding: '20px', border: `1px solid ${s.border}` }}>
      <h2 style={{ fontSize: '20px', fontWeight: '900', color: s.title, marginBottom: '16px', textAlign: 'center' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {players.map((player) => {
          const isCaptain = player.id === captainId;
          return (
            <div
              key={player.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '8px',
                padding: '8px',
                backgroundColor: isCaptain ? 'rgba(113, 63, 18, 0.4)' : s.row,
                border: isCaptain ? '1px solid rgba(234, 179, 8, 0.5)' : 'none',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  backgroundColor: isCaptain ? 'rgba(234, 179, 8, 0.6)' : s.avatar,
                }}
              >
                {isCaptain ? '👑' : '⚽'}
              </div>
              <span style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>
                {fullName(player)}
                {isCaptain && <span style={{ marginLeft: '4px', color: '#facc15', fontSize: '12px' }}>(C)</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TeamsImage({ ref, teamA, teamB, captainA, captainB }) {
  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
      <div
        ref={ref}
        style={{ padding: '32px', backgroundColor: '#0f172a', width: '800px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <h1 style={{ fontSize: '28px', fontWeight: '900', textAlign: 'center', color: '#34d399', marginBottom: '24px' }}>⚽ Zemer Teams</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <TeamColumn title="🔵 Team A" color="blue" players={teamA} captainId={captainA} />
          <TeamColumn title="🔴 Team B" color="rose" players={teamB} captainId={captainB} />
        </div>
      </div>
    </div>
  );
}
