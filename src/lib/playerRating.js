// Player ratings: six FIFA-style card stats (1-99) and a position give the overall ("power").
//
// Each position weighs the stats differently. The weights come from EA's per-position overall formulas
// (which use ~30 hidden sub-stats), with each sub-stat folded into the card stat it belongs to
// (e.g. finishing + positioning + shot power → SHO). Heading counts as PHY for attackers (aerial
// ability) and as DEF for defenders. Weights sum to 100, so a player with every stat at X is rated X.

export const STATS = [
  { key: 'pac', label: 'PAC', name: 'Pace' },
  { key: 'sho', label: 'SHO', name: 'Shooting' },
  { key: 'pas', label: 'PAS', name: 'Passing' },
  { key: 'dri', label: 'DRI', name: 'Dribbling' },
  { key: 'def', label: 'DEF', name: 'Defending' },
  { key: 'phy', label: 'PHY', name: 'Physical' },
];

export const STAT_MIN = 1;
export const STAT_MAX = 99;

const FULLBACK = { pac: 12, pas: 16, dri: 15, def: 49, phy: 8 };
const WIDE_MID = { pac: 14, sho: 14, pas: 30, dri: 37, phy: 5 };
const WINGER = { pac: 13, sho: 23, pas: 24, dri: 40 };

// In display order: goalkeeper, defenders, midfielders, attackers.
export const POSITIONS = [
  { code: 'GK', name: 'Goalkeeper', group: 'Goalkeeper', weights: { pac: 5, pas: 15, dri: 20, def: 40, phy: 20 } },
  { code: 'CB', name: 'Centre-back', group: 'Defence', weights: { pas: 5, dri: 9, def: 66, phy: 20 } },
  { code: 'LB', name: 'Left-back', group: 'Defence', weights: FULLBACK },
  { code: 'RB', name: 'Right-back', group: 'Defence', weights: FULLBACK },
  { code: 'CDM', name: 'Defensive midfielder', group: 'Midfield', weights: { pas: 25, dri: 18, def: 42, phy: 15 } },
  { code: 'CM', name: 'Central midfielder', group: 'Midfield', weights: { sho: 10, pas: 44, dri: 30, def: 10, phy: 6 } },
  { code: 'CAM', name: 'Attacking midfielder', group: 'Midfield', weights: { pac: 4, sho: 26, pas: 31, dri: 39 } },
  { code: 'LM', name: 'Left midfielder', group: 'Midfield', weights: WIDE_MID },
  { code: 'RM', name: 'Right midfielder', group: 'Midfield', weights: WIDE_MID },
  { code: 'LW', name: 'Left winger', group: 'Attack', weights: WINGER },
  { code: 'RW', name: 'Right winger', group: 'Attack', weights: WINGER },
  { code: 'ST', name: 'Striker', group: 'Attack', weights: { pac: 10, sho: 48, dri: 27, phy: 15 } },
];

export const POSITION_BY_CODE = Object.fromEntries(POSITIONS.map((p) => [p.code, p]));

export const POSITION_ORDER = Object.fromEntries(POSITIONS.map((p, i) => [p.code, i]));

export const DEFAULT_POSITION = 'CM';

// What the six stats mean for a keeper, since they share the outfield stats.
export const GK_HINT = 'For keepers: DEF = shot-stopping, DRI = reflexes, PAS = distribution, PHY = presence in the box.';

export const clampStat = (value) => Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(Number(value) || STAT_MIN)));

// Returns the six stats as integers, or null if any is missing or out of range.
export function parseStats(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const stats = {};
  for (const { key } of STATS) {
    const value = Number(raw[key]);
    if (!Number.isFinite(value) || value < STAT_MIN || value > STAT_MAX) return null;
    stats[key] = Math.round(value);
  }
  return stats;
}

export function computeOverall(stats, positionCode) {
  const { weights } = POSITION_BY_CODE[positionCode];
  const weighted = STATS.reduce((sum, { key }) => sum + (weights[key] ?? 0) * stats[key], 0);
  return clampStat(weighted / 100);
}

// e.g. "SHO 48% · DRI 27% · PHY 15% · PAC 10%"
export const describeWeights = (positionCode) =>
  STATS.filter(({ key }) => POSITION_BY_CODE[positionCode].weights[key])
    .sort((a, b) => POSITION_BY_CODE[positionCode].weights[b.key] - POSITION_BY_CODE[positionCode].weights[a.key])
    .map(({ key, label }) => `${label} ${POSITION_BY_CODE[positionCode].weights[key]}%`)
    .join(' · ');

// FIFA card colours: gold 75+, silver 65-74, bronze below.
export const cardTier = (overall) => (overall >= 75 ? 'gold' : overall >= 65 ? 'silver' : 'bronze');
