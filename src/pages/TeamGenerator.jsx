import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fullName, initials, usePlayers } from '../hooks/usePlayers';
import { averagePower, generateTeams, MODES, SHUFFLE_TOLERANCE, totalPower } from '../lib/teamBalancer';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';
import TeamCard from '../components/TeamCard';
import TeamsImage from '../components/TeamsImage';
import AppFooter from '../components/AppFooter';
import LogoutButton from '../components/LogoutButton';

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// Captain first, then by name, so shared lists don't reveal the power ranking.
const sharingOrder = (team, captainId) =>
  [...team].sort((a, b) => (b.id === captainId) - (a.id === captainId) || fullName(a).localeCompare(fullName(b)));

const teamText = (title, team, captainId) =>
  [title, ...sharingOrder(team, captainId).map((p, i) => `${i + 1}. ${fullName(p)}${p.id === captainId ? ' (C)' : ''}`)].join('\n');

function resultDescription({ mode, optionCount }) {
  if (mode === MODES.balanced) {
    return optionCount > 1
      ? `The fairest possible split, picked from ${optionCount} equally fair options.`
      : 'The fairest possible split.';
  }
  return optionCount > 1
    ? `Picked at random from ${optionCount} splits within ${SHUFFLE_TOLERANCE} points of the fairest.`
    : 'Only one split is close enough to the fairest.';
}

export default function TeamGenerator() {
  const { players, loading, error } = usePlayers();
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [notice, setNotice] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const imageRef = useRef(null);
  const resultsRef = useRef(null);

  // Deleted players drop out automatically because selection is resolved against the live list.
  const selectedPlayers = useMemo(() => players.filter((p) => selectedIds.has(p.id)), [players, selectedIds]);

  const visiblePlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? players.filter((p) => fullName(p).toLowerCase().includes(q)) : players;
  }, [players, query]);

  useEffect(() => {
    const el = resultsRef.current;
    if (!result || !el) return;
    const { top } = el.getBoundingClientRect();
    if (top < 0 || top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [result]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(timer);
  }, [notice]);

  const updateSelection = (update) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      update(next);
      return next;
    });
    setResult(null);
  };

  const togglePlayer = (id) => updateSelection((s) => (s.has(id) ? s.delete(id) : s.add(id)));
  const selectVisible = () => updateSelection((s) => visiblePlayers.forEach((p) => s.add(p.id)));
  const clearSelection = () => updateSelection((s) => s.clear());

  const generate = (mode) => {
    if (selectedPlayers.length < 2) return;
    const teams = generateTeams(selectedPlayers, { mode, avoidKey: result?.key });
    setResult({
      ...teams,
      mode,
      captainA: pickRandom(teams.teamA).id,
      captainB: pickRandom(teams.teamB).id,
    });
  };

  const copyAsText = async () => {
    const text = [
      '⚽ Zemer Teams',
      '',
      teamText('🔵 Team A', result.teamA, result.captainA),
      '',
      teamText('🔴 Team B', result.teamB, result.captainB),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setNotice('Teams copied to clipboard');
    } catch {
      setNotice('Your browser blocked clipboard access');
    }
  };

  const downloadImage = async () => {
    const element = imageRef.current;
    if (!element) return;
    setDownloading(true);
    // Temporarily bring the off-screen image into the viewport so html2canvas renders it
    const originalStyle = element.parentElement.style.cssText;
    element.parentElement.style.cssText = 'position: fixed; top: 0; left: 0; z-index: -1; opacity: 0;';
    // html2canvas finds each font's text baseline by measuring an <img> in the live document. Tailwind's
    // preflight makes images display:block, which skews that measurement and draws all text too low.
    // This unlayered rule beats preflight for the duration of the capture.
    const imgFix = document.createElement('style');
    imgFix.textContent = 'img { display: inline; }';
    document.head.appendChild(imgFix);
    try {
      const { default: html2canvas } = await import('html2canvas'); // loaded on demand to keep the initial bundle small
      const canvas = await html2canvas(element, { backgroundColor: '#0f172a', scale: 2, useCORS: true, logging: false });
      const link = document.createElement('a');
      link.download = `zemer-teams-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating screenshot:', err);
      setNotice('Could not create the image');
    } finally {
      imgFix.remove();
      element.parentElement.style.cssText = originalStyle;
      setDownloading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  const count = selectedPlayers.length;
  const selectionHint =
    count < 2
      ? 'Select at least 2 players'
      : count % 2
        ? `${Math.floor(count / 2)} vs ${Math.ceil(count / 2)}: the smaller team gets stronger players`
        : `${count / 2} vs ${count / 2}`;

  const totalA = result ? totalPower(result.teamA) : 0;
  const totalB = result ? totalPower(result.teamB) : 0;
  const shareA = result && totalA + totalB > 0 ? (totalA / (totalA + totalB)) * 100 : 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 px-4 py-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              <span aria-hidden="true">⚽ </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Zemer Teams Generator
              </span>
            </h1>
            <p className="text-emerald-200/60 mt-2 text-lg">Pick who's playing, get fair teams</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/admin"
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 rounded-xl font-semibold transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/60"
            >
              ⚙️ Admin Console
            </Link>
            <LogoutButton />
          </div>
        </header>

        {players.length === 0 ? (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700/50">
            <div className="text-6xl mb-4">🏟️</div>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">No Players Yet</h3>
            <p className="text-slate-400 mb-6">Add some players in the admin console to get started</p>
            <Link
              to="/admin"
              className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-600/30"
            >
              Add Players →
            </Link>
          </div>
        ) : (
          <>
            {/* Player selection */}
            <section className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">🔍</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search players"
                    aria-label="Search players"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={selectVisible}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg font-medium transition-all duration-200 border border-emerald-500/40"
                  >
                    {query ? 'Select shown' : 'Select all'}
                  </button>
                  <button
                    onClick={clearSelection}
                    disabled={count === 0}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600/40 disabled:opacity-40 disabled:hover:bg-rose-600/20 text-rose-300 rounded-lg font-medium transition-all duration-200 border border-rose-500/40"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {visiblePlayers.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No players match “{query}”.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {visiblePlayers.map((player) => {
                    const selected = selectedIds.has(player.id);
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.id)}
                        aria-pressed={selected}
                        className={`flex items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 border ${
                          selected
                            ? 'bg-emerald-600/25 border-emerald-400/80 shadow-lg shadow-emerald-500/10'
                            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-500'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold transition-colors ${
                            selected ? 'bg-emerald-400 text-slate-900' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {selected ? '✓' : player.photo ? <img src={player.photo} alt="" className="w-full h-full object-cover" /> : initials(player)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span dir="auto" className="font-semibold text-white truncate">{fullName(player)}</span>
                            <span className="shrink-0 text-sm">
                              {player.position && <span className="text-slate-400 font-medium mr-1.5">{player.position}</span>}
                              <span className="text-emerald-400 font-bold">{player.power}</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                              style={{ width: `${Math.min(player.power, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Action bar: sticks to the bottom of the screen while scrolling the player list */}
            <div className="sticky bottom-4 z-20 mb-8">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl p-3 sm:p-4 shadow-2xl">
                <div className="flex-1 text-center sm:text-left">
                  <div className="text-white font-semibold">
                    <span className="text-emerald-400 font-bold">{count}</span> / {players.length} selected
                    {count > 0 && <span className="text-slate-400 font-normal"> · avg power {averagePower(selectedPlayers)}</span>}
                  </div>
                  <div className="text-slate-400 text-sm">{selectionHint}</div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => generate(MODES.balanced)}
                    disabled={count < 2}
                    title="The fairest split possible"
                    className="flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-emerald-500/30 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    ⚖️ Balanced
                  </button>
                  <button
                    onClick={() => generate(MODES.shuffle)}
                    disabled={count < 2}
                    title={`A random split within ${SHUFFLE_TOLERANCE} points of the fairest`}
                    className="flex-1 sm:flex-none whitespace-nowrap px-4 sm:px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 disabled:from-slate-700 disabled:to-slate-600 disabled:text-slate-400 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-violet-500/30 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    🎲 Shuffle
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            {result && (
              <section ref={resultsRef} className="animate-fadeIn scroll-mt-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 sm:p-5 mb-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="text-slate-300">Power difference</span>
                        <span className="text-3xl font-black text-amber-400">{result.powerDiff}</span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{resultDescription(result)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm sm:flex sm:text-base">
                      <button
                        onClick={() => generate(result.mode)}
                        disabled={result.optionCount <= 1}
                        title={result.optionCount <= 1 ? 'There is no other option this fair' : 'Show a different option'}
                        className="px-3 sm:px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700/70 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200"
                      >
                        ↻ Try another
                      </button>
                      <button
                        onClick={copyAsText}
                        className="px-3 sm:px-4 py-2.5 bg-slate-700/70 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-200"
                      >
                        📋 Copy text
                      </button>
                      <button
                        onClick={downloadImage}
                        disabled={downloading}
                        className="px-3 sm:px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200"
                      >
                        {downloading ? 'Saving…' : '📥 Save image'}
                      </button>
                    </div>
                  </div>

                  {/* Balance bar: the line in the middle marks a perfect 50/50 */}
                  <div className="mt-4">
                    <div className="relative flex h-3 rounded-full overflow-hidden bg-slate-700">
                      <div className="bg-blue-500 transition-all duration-500" style={{ width: `${shareA}%` }}></div>
                      <div className="bg-rose-500 flex-1"></div>
                      <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-white/80"></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1.5 text-slate-400">
                      <span>🔵 Team A · {totalA}</span>
                      <span>{totalB} · Team B 🔴</span>
                    </div>
                  </div>

                  <p className="text-slate-500 text-xs mt-3">
                    Fairness looks at total power and at how evenly strong and weaker players are spread across the teams.
                  </p>
                  {notice && (
                    <p role="status" className="text-emerald-300 text-sm mt-2">
                      {notice}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TeamCard name="Team A" icon="🔵" color="blue" players={result.teamA} captainId={result.captainA} />
                  <TeamCard name="Team B" icon="🔴" color="rose" players={result.teamB} captainId={result.captainB} />
                </div>

                <TeamsImage
                  ref={imageRef}
                  teamA={sharingOrder(result.teamA, result.captainA)}
                  teamB={sharingOrder(result.teamB, result.captainB)}
                  captainA={result.captainA}
                  captainB={result.captainB}
                />
              </section>
            )}
          </>
        )}
        <AppFooter />
      </div>
    </div>
  );
}
