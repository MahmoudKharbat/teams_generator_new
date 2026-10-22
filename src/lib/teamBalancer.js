// Team balancing.
//
// Every split is scored as:
//   (strongest total - weakest total) + SPREAD_WEIGHT * (widest skill spread - narrowest skill spread)
// where "skill spread" is the standard deviation of a team's powers. With two teams that is just the
// gap between them. The second term stops splits like (star + weak players) vs (all average players)
// that match on totals but play unevenly.
//
// Up to EXHAUSTIVE_LIMIT[teamCount] players every possible split is checked, so the result is the true
// best. Above that, many randomized local searches are run instead.

const SPREAD_WEIGHT = 0.5;
const EXHAUSTIVE_LIMIT = { 2: 26, 3: 18 };
const FALLBACK_RESTARTS = 400;
const SCALE = 10; // powers have 0.1 resolution; work in integers to avoid float drift
const TIE_EPSILON = 1e-6;

export const MODES = {
  balanced: 'balanced',
  shuffle: 'shuffle',
};

export const SHUFFLE_TOLERANCE = 3;

// Three teams are offered from this many players (5 vs 5 vs 6).
export const MIN_PLAYERS_FOR_THREE_TEAMS = 16;

const stdDev = (sum, sumSq, size) => (size ? Math.sqrt(Math.max(0, sumSq / size - (sum / size) ** 2)) : 0);

// Team sizes, smallest first: 16 players in 3 teams -> [5, 5, 6].
export function teamSizes(playerCount, teamCount) {
  const base = Math.floor(playerCount / teamCount);
  const extra = playerCount % teamCount;
  return Array.from({ length: teamCount }, (_, t) => base + (t >= teamCount - extra ? 1 : 0));
}

function score(sums, sqs, sizes) {
  let minSum = Infinity;
  let maxSum = -Infinity;
  let minSpread = Infinity;
  let maxSpread = -Infinity;
  for (let t = 0; t < sizes.length; t++) {
    const spread = stdDev(sums[t], sqs[t], sizes[t]);
    if (sums[t] < minSum) minSum = sums[t];
    if (sums[t] > maxSum) maxSum = sums[t];
    if (spread < minSpread) minSpread = spread;
    if (spread > maxSpread) maxSpread = spread;
  }
  return maxSum - minSum + SPREAD_WEIGHT * (maxSpread - minSpread);
}

// Collects splits whose score is within `window` of the best seen so far.
function makeCollector(window) {
  let best = Infinity;
  let items = [];
  let pruneAt = 100000;
  return {
    add(score, split) {
      if (score < best) best = score;
      if (score <= best + window + TIE_EPSILON) items.push({ score, split });
      if (items.length > pruneAt) {
        items = items.filter((c) => c.score <= best + window + TIE_EPSILON);
        // When most items are still in the window, wait for the list to double before pruning again.
        pruneAt = Math.max(pruneAt, items.length * 2);
      }
    },
    result() {
      return items.filter((c) => c.score <= best + window + TIE_EPSILON);
    },
  };
}

// Splits are returned as the team index of each player.
function exhaustiveSearch(powers, sizes, collector) {
  const n = powers.length;
  const k = sizes.length;
  const counts = new Array(k).fill(0);
  const sums = new Array(k).fill(0);
  const sqs = new Array(k).fill(0);
  // A split is stored as one number: player i's team is digit i in base k.
  const place = powers.map((_, i) => k ** i);
  const visit = (i, code) => {
    if (i === n) {
      collector.add(score(sums, sqs, sizes), code);
      return;
    }
    const p = powers[i];
    for (let t = 0; t < k; t++) {
      if (counts[t] === sizes[t]) continue;
      // Teams of equal size are interchangeable, so only the first empty one of each size is opened.
      // This skips mirror images of splits already visited (sizes are sorted, so equal ones are adjacent).
      if (counts[t] === 0 && t > 0 && sizes[t - 1] === sizes[t] && counts[t - 1] === 0) continue;
      counts[t]++;
      sums[t] += p;
      sqs[t] += p * p;
      visit(i + 1, code + t * place[i]);
      counts[t]--;
      sums[t] -= p;
      sqs[t] -= p * p;
    }
  };
  visit(0, 0);
  return collector.result().map(({ split }) => powers.map((_, i) => Math.floor(split / place[i]) % k));
}

// Identifies a split regardless of the order of the teams.
const assignmentKey = (team, k) =>
  Array.from({ length: k }, (_, t) => team.flatMap((tt, i) => (tt === t ? [i] : [])).join(','))
    .sort()
    .join('|');

function localSearch(powers, sizes, collector) {
  const n = powers.length;
  const k = sizes.length;
  const seen = new Set();
  for (let r = 0; r < FALLBACK_RESTARTS; r++) {
    const order = shuffle(powers.map((_, i) => i));
    const team = new Array(n);
    let next = 0;
    sizes.forEach((size, t) => order.slice(next, (next += size)).forEach((i) => (team[i] = t)));
    const sums = new Array(k).fill(0);
    const sqs = new Array(k).fill(0);
    team.forEach((t, i) => {
      sums[t] += powers[i];
      sqs[t] += powers[i] * powers[i];
    });
    let current = score(sums, sqs, sizes);

    // Best-improvement swaps of two players on different teams until no swap helps.
    for (;;) {
      let bestMove = null;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const ti = team[i];
          const tj = team[j];
          if (ti === tj) continue;
          const dSum = powers[j] - powers[i];
          const dSq = powers[j] * powers[j] - powers[i] * powers[i];
          sums[ti] += dSum;
          sqs[ti] += dSq;
          sums[tj] -= dSum;
          sqs[tj] -= dSq;
          const s = score(sums, sqs, sizes);
          sums[ti] -= dSum;
          sqs[ti] -= dSq;
          sums[tj] += dSum;
          sqs[tj] += dSq;
          if (s < current - TIE_EPSILON && (!bestMove || s < bestMove.s)) bestMove = { i, j, dSum, dSq, s };
        }
      }
      if (!bestMove) break;
      const { i, j, dSum, dSq, s } = bestMove;
      const ti = team[i];
      const tj = team[j];
      sums[ti] += dSum;
      sqs[ti] += dSq;
      sums[tj] -= dSum;
      sqs[tj] -= dSq;
      team[i] = tj;
      team[j] = ti;
      current = s;
    }

    const key = assignmentKey(team, k);
    if (!seen.has(key)) {
      seen.add(key);
      collector.add(current, team);
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

// Identifies a split regardless of the order of the teams.
export const splitKey = (teams) =>
  teams
    .map((team) => team.map((p) => p.id).sort().join(','))
    .sort()
    .join('|');

/**
 * Splits players into `teamCount` teams (2 or 3).
 *
 * mode 'balanced': the fairest split; when several are equally fair, one is picked at random.
 * mode 'shuffle': a random split scoring within SHUFFLE_TOLERANCE power points of the fairest.
 *
 * When players don't divide evenly the smaller teams get the stronger players, since totals are balanced.
 * `avoidKey` (from a previous result's `key`) skips that exact split when another option exists.
 */
export function generateTeams(players, { mode = MODES.balanced, avoidKey = null, teamCount = 2 } = {}) {
  if (players.length < teamCount) throw new Error(`At least ${teamCount} players are needed`);

  const powers = players.map((p) => Math.round(p.power * SCALE));
  const sizes = teamSizes(players.length, teamCount);
  const window = mode === MODES.shuffle ? SHUFFLE_TOLERANCE * SCALE : 0;
  const collector = makeCollector(window);

  const splits =
    players.length <= EXHAUSTIVE_LIMIT[teamCount]
      ? exhaustiveSearch(powers, sizes, collector)
      : localSearch(powers, sizes, collector);

  let options = splits.map((team) => {
    const teams = sizes.map((_, t) => players.filter((_, i) => team[i] === t));
    return { teams, key: splitKey(teams) };
  });
  const optionCount = options.length;
  if (avoidKey && options.length > 1) options = options.filter((o) => o.key !== avoidKey);

  const choice = options[Math.floor(Math.random() * options.length)];
  const byPower = (a, b) => b.power - a.power;
  const teams = shuffle(choice.teams.map((team) => [...team].sort(byPower)));
  const totals = teams.map(totalPower);

  return {
    teams,
    key: choice.key,
    optionCount,
    powerDiff: roundPower(Math.max(...totals) - Math.min(...totals)),
  };
}
