import { fullName } from '../hooks/usePlayers';
import ClubLogo from './ClubLogo';

// Rendered off-screen and captured by html2canvas for the "Download image" button.
// Inline styles only: html2canvas can't parse Tailwind v4's oklch() colors. Power is deliberately hidden.

const TEAM_STYLES = {
  blue: { card: 'rgba(30, 58, 138, 0.6)', border: 'rgba(59, 130, 246, 0.5)', title: '#93c5fd', row: 'rgba(23, 37, 84, 0.6)', avatar: 'rgba(37, 99, 235, 0.6)' },
  rose: { card: 'rgba(136, 19, 55, 0.6)', border: 'rgba(244, 63, 94, 0.5)', title: '#fda4af', row: 'rgba(76, 5, 25, 0.6)', avatar: 'rgba(225, 29, 72, 0.6)' },
  emerald: { card: 'rgba(6, 78, 59, 0.6)', border: 'rgba(16, 185, 129, 0.5)', title: '#6ee7b7', row: 'rgba(2, 44, 34, 0.6)', avatar: 'rgba(5, 150, 105, 0.6)' },
};

function TeamColumn({ title, color, players, captainId }) {
  const s = TEAM_STYLES[color];
  return (
    <div style={{ backgroundColor: s.card, borderRadius: '16px', padding: '20px', border: `1px solid ${s.border}` }}>
      <h2 style={{ fontSize: '20px', fontWeight: '900', color: s.title, marginBottom: '16px', textAlign: 'center' }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {players.map((player, index) => {
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
                  flexShrink: 0,
                  fontSize: '15px',
                  fontWeight: '900',
                  color: 'white',
                  backgroundColor: isCaptain ? 'rgba(234, 179, 8, 0.6)' : s.avatar,
                }}
              >
                {index + 1}
              </div>
              <span style={{ fontWeight: '600', color: 'white', fontSize: '14px' }}>
                {fullName(player)}
                {isCaptain && <span style={{ marginLeft: '4px', color: '#facc15', fontSize: '12px' }}>👑 (C)</span>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Goalkeeper / substitute rotation, by the player numbers shown above. Same for every team, whatever its size.
function RotationNote() {
  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        marginTop: '24px',
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
        border: '1px solid rgba(52, 211, 153, 0.4)',
        color: '#e2e8f0',
        fontSize: '18px',
        lineHeight: '1.8',
        textAlign: 'right',
        fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif",
      }}
    >
      <div style={{ fontWeight: '900', color: '#34d399', marginBottom: '4px' }}>ملاحظة</div>
      <div>اللاعب رقم 2 يبدأ حارسًا للمرمى، واللاعب رقم 5 يجلس خارجًا للتبديل.</div>
      <div>كل 6 دقائق نقوم بالتبديل: اللاعب رقم 3 يصبح حارس المرمى، واللاعب رقم 6 يخرج، وهكذا.</div>
    </div>
  );
}

// `teams`: [{ title, color, players, captainId }]
export default function TeamsImage({ ref, teams }) {
  return (
    <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
      <div
        ref={ref}
        style={{
          padding: '32px',
          backgroundColor: '#0f172a',
          width: teams.length > 2 ? '1100px' : '800px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
          <ClubLogo alt="" style={{ width: '72px', height: '72px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#34d399' }}>Zemer Teams</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${teams.length}, 1fr)`, gap: '24px' }}>
          {teams.map((team) => (
            <TeamColumn key={team.title} {...team} />
          ))}
        </div>
        <RotationNote />
      </div>
    </div>
  );
}
