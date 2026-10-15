// Team balancing.
//
// Every split is scored as:
//   |total power A - total power B| + SPREAD_WEIGHT * |skill spread A - skill spread B|
// where "skill spread" is the standard deviation of a team's powers. The second term stops
// splits like (star + weak players) vs (all average players) that match on totals but play unevenly.
//
// Up to EXHAUSTIVE_LIMIT players every possible split is checked, so the result is the true best.
// Above that, many randomized local searches are run instead.

const SPREAD_WEIGHT = 0.5;
const EXHAUSTIVE_LIMIT = 26;
const FALLBACK_RESTARTS = 400;
const SCALE = 10; // powers have 0.1 resolution; work in integers to avoid float drift
const TIE_EPSILON = 1e-6;

export const MODES = {
  balanced: 'balanced',
  shuffle: 'shuffle',
};

export const SHUFFLE_TOLERANCE = 3;

const stdDev = (sum, sumSq, size) => (size ? Math.sqrt(Math.max(0, sumSq / size - (sum / size) ** 2)) : 0);

function makeScorer(powers) {
  const n = powers.length;
  const total = powers.reduce((a, b) => a + b, 0);
  const totalSq = powers.reduce((a, b) => a + b * b, 0);
  return (sumA, sqA, sizeA) => {
    const sizeB = n - sizeA;
    const sumB = total - sumA;
    const sqB = totalSq - sqA;
    const spreadGap = Math.abs(stdDev(sumA, sqA, sizeA) - stdDev(sumB, sqB, sizeB));
    return Math.abs(sumA - sumB) + SPREAD_WEIGHT * spreadGap;
  };
}

// Collects splits whose score is within `window` of the best seen so far.
function makeCollector(window) {
  let best = Infinity;
  let items = [];
  return {
    add(score, split) {
      if (score < best) best = score;
      if (score <= best + window + TIE_EPSILON) items.push({ score, split });
      if (items.length > 100000) items = items.filter((c) => c.score <= best + window + TIE_EPSILON);
    },
    result() {
      return items.filter((c) => c.score <= best + window + TIE_EPSILON);
    },
  };
}

function exhaustiveSearch(powers, sizeA, score, collector) {
  const n = powers.length;
  // With equal team sizes, a split and its mirror are the same; pin player 0 to team A.
  const pinFirst = sizeA * 2 === n;
  const visit = (i, taken, mask, sum, sq) => {
    if (taken === sizeA) {
      collector.add(score(sum, sq, sizeA), mask);
      return;
    }
    if (n - i < sizeA - taken) return;
    visit(i + 1, taken + 1, mask | (1 << i), sum + powers[i], sq + powers[i] * powers[i]);
    if (i > 0 || !pinFirst) visit(i + 1, taken, mask, sum, sq);
  };
  visit(0, 0, 0, 0, 0);
  return collector.result().map(({ split }) => powers.map((_, i) => (split & (1 << i)) !== 0));
}

function localSearch(powers, sizeA, score, collector) {
  const n = powers.length;
  const seen = new Set();
  for (let r = 0; r < FALLBACK_RESTARTS; r++) {
    const order = shuffle(powers.map((_, i) => i));
    const inA = new Array(n).fill(false);
    order.slice(0, sizeA).forEach((i) => (inA[i] = true));
    let sum = 0;
    let sq = 0;
    inA.forEach((a, i) => {
      if (a) {
        sum += powers[i];
        sq += powers[i] * powers[i];
      }
    });
    let current = score(sum, sq, sizeA);

    // Best-improvement 1-for-1 swaps until no swap helps.
    for (;;) {
      let bestMove = null;
      for (let i = 0; i < n; i++) {
        if (!inA[i]) continue;
        for (let j = 0; j < n; j++) {
          if (inA[j]) continue;
          const nSum = sum - powers[i] + powers[j];
          const nSq = sq - powers[i] * powers[i] + powers[j] * powers[j];
          const s = score(nSum, nSq, sizeA);
          if (s < current - TIE_EPSILON && (!bestMove || s < bestMove.s)) bestMove = { i, j, nSum, nSq, s };
        }
      }
      if (!bestMove) break;
      inA[bestMove.i] = false;
      inA[bestMove.j] = true;
      ({ nSum: sum, nSq: sq, s: current } = bestMove);
    }

    const key = inA.map(Number).join('');
    if (!seen.has(key)) {
      seen.add(key);
      collector.add(current, inA);
    }
  }
  return collector.result().map(({ split }) => split);
}

export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const roundPower = (value) => Math.round(value * 10) / 10;

export const totalPower = (team) => roundPower(team.reduce((sum, p) => sum + p.power, 0));

export const averagePower = (team) => (team.length ? roundPower(totalPower(team) / team.length) : 0);

// Identifies a split regardless of which side is called A or B.
export const splitKey = (teamA, teamB) =>
  [teamA, teamB]
    .map((team) => team.map((p) => p.id).sort().join(','))
    .sort()
    .join('|');

/**
 * Splits players into two teams.
 *
 * mode 'balanced': the fairest split; when several are equally fair, one is picked at random.
 * mode 'shuffle': a random split scoring within SHUFFLE_TOLERANCE power points of the fairest.
 *
 * With an odd number of players the smaller team gets the stronger players, since totals are balanced.
 * `avoidKey` (from a previous result's `key`) skips that exact split when another option exists.
 */
export function generateTeams(players, { mode = MODES.balanced, avoidKey = null } = {}) {
  if (players.length < 2) throw new Error('At least 2 players are needed');

  const powers = players.map((p) => Math.round(p.power * SCALE));
  const sizeA = Math.floor(players.length / 2);
  const window = mode === MODES.shuffle ? SHUFFLE_TOLERANCE * SCALE : 0;
  const score = makeScorer(powers);
  const collector = makeCollector(window);

  const splits =
    players.length <= EXHAUSTIVE_LIMIT
      ? exhaustiveSearch(powers, sizeA, score, collector)
      : localSearch(powers, sizeA, score, collector);

  let options = splits.map((inA) => {
    const teamA = players.filter((_, i) => inA[i]);
    const teamB = players.filter((_, i) => !inA[i]);
    return { teamA, teamB, key: splitKey(teamA, teamB) };
  });
  const optionCount = options.length;
  if (avoidKey && options.length > 1) options = options.filter((o) => o.key !== avoidKey);

  const choice = options[Math.floor(Math.random() * options.length)];
  const byPower = (a, b) => b.power - a.power;
  let teamA = [...choice.teamA].sort(byPower);
  let teamB = [...choice.teamB].sort(byPower);
  if (Math.random() < 0.5) [teamA, teamB] = [teamB, teamA];

  return {
    teamA,
    teamB,
    key: choice.key,
    optionCount,
    powerDiff: roundPower(Math.abs(totalPower(teamA) - totalPower(teamB))),
  };
}
