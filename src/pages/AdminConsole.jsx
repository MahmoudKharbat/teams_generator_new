import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { fullName, PLAYERS_COLLECTION, usePlayers } from '../hooks/usePlayers';
import { averagePower } from '../lib/teamBalancer';
import {
  clampStat,
  computeOverall,
  DEFAULT_POSITION,
  describeWeights,
  GK_HINT,
  POSITION_ORDER,
  POSITIONS,
  STAT_MAX,
  STAT_MIN,
  STATS,
} from '../lib/playerRating';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';
import AppFooter from '../components/AppFooter';
import PlayerCard from '../components/PlayerCard';

const uniformStats = (value) => Object.fromEntries(STATS.map(({ key }) => [key, clampStat(value)]));

const EMPTY_FORM = { firstname: '', lastname: '', position: DEFAULT_POSITION, stats: uniformStats(60) };

const POSITION_GROUPS = [...new Set(POSITIONS.map((p) => p.group))];

const byName = (a, b) => fullName(a).localeCompare(fullName(b));
const SORTS = {
  name: { label: 'Name', compare: byName },
  power: { label: 'Overall', compare: (a, b) => b.power - a.power || byName(a, b) },
  position: {
    label: 'Position',
    compare: (a, b) =>
      (POSITION_ORDER[a.position] ?? 99) - (POSITION_ORDER[b.position] ?? 99) || b.power - a.power || byName(a, b),
  },
};

const inputClass =
  'w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all';

// Unrated players get all six stats set to their old manual power, so their overall stays the same until edited.
const formFromPlayer = (player) =>
  player.rated
    ? { firstname: player.firstname, lastname: player.lastname, position: player.position, stats: { ...player.stats } }
    : {
        firstname: player.firstname,
        lastname: player.lastname,
        position: player.position ?? DEFAULT_POSITION,
        stats: uniformStats(player.power),
      };

export default function AdminConsole() {
  const { players, loading, error } = usePlayers();
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const visiblePlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? players.filter((p) => fullName(p).toLowerCase().includes(q)) : players;
    return [...filtered].sort(SORTS[sortBy].compare);
  }, [players, query, sortBy]);

  const unratedCount = players.filter((p) => !p.rated).length;

  const statsComplete = STATS.every(({ key }) => formData.stats[key] !== '');
  const previewStats = Object.fromEntries(STATS.map(({ key }) => [key, clampStat(formData.stats[key])]));
  const preview = {
    firstname: formData.firstname.trim() || 'New',
    lastname: formData.lastname.trim() || 'Player',
    position: formData.position,
    stats: previewStats,
    rated: true,
    power: computeOverall(previewStats, formData.position),
  };

  const openForm = (player = null) => {
    setEditingPlayer(player);
    setFormData(player ? formFromPlayer(player) : EMPTY_FORM);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPlayer(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  };

  useEffect(() => {
    if (!showForm) return;
    // openForm resets the rest of the form state, so hiding is enough here
    const onKeyDown = (e) => e.key === 'Escape' && setShowForm(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showForm]);

  // Empty is allowed while typing; anything else is kept within 1-99.
  const setStat = (key, raw) =>
    setFormData((prev) => ({ ...prev, stats: { ...prev.stats, [key]: raw === '' ? '' : clampStat(raw) } }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const firstname = formData.firstname.trim();
    const lastname = formData.lastname.trim();
    if (!firstname || !lastname) {
      setFormError('Please fill in the first and last name');
      return;
    }
    if (!statsComplete) {
      setFormError(`Every stat needs a value from ${STAT_MIN} to ${STAT_MAX}`);
      return;
    }

    setSaving(true);
    try {
      // power is stored for reference only; the app always recomputes it from position + stats
      const data = { firstname, lastname, position: preview.position, stats: preview.stats, power: preview.power };
      if (editingPlayer) {
        await updateDoc(doc(db, PLAYERS_COLLECTION, editingPlayer.id), data);
      } else {
        await addDoc(collection(db, PLAYERS_COLLECTION), data);
      }
      closeForm();
    } catch (err) {
      console.error('Error saving player:', err);
      setFormError('Failed to save player. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (player) => {
    if (!confirm(`Delete ${fullName(player)}?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, PLAYERS_COLLECTION, player.id));
    } catch (err) {
      console.error('Error deleting player:', err);
      alert('Failed to delete player. Please try again.');
    }
  };

  if (loading) return <LoadingScreen theme="purple" />;
  if (error) return <ErrorScreen message={error} theme="purple" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 px-4 py-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              <span aria-hidden="true">⚙️ </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400">
                Admin Console
              </span>
            </h1>
            <p className="text-purple-200/60 mt-2 text-lg">Manage your soccer players</p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/positions"
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-purple-300 rounded-xl font-semibold transition-all duration-300 border border-purple-500/30 hover:border-purple-400/60"
            >
              📖 شرح المراكز
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-purple-300 rounded-xl font-semibold transition-all duration-300 border border-purple-500/30 hover:border-purple-400/60"
            >
              ⚽ Team Generator
            </Link>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <button
            onClick={() => openForm()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-purple-500/30 flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span> Add New Player
          </button>
          {players.length > 0 && (
            <>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">🔍</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search players"
                  aria-label="Search players"
                  className="w-full h-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-700" role="group" aria-label="Sort players">
                <span className="flex items-center px-3 text-sm text-slate-500 bg-slate-800/60">Sort</span>
                {Object.entries(SORTS).map(([key, { label }]) => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    aria-pressed={sortBy === key}
                    className={`flex-1 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                      sortBy === key ? 'bg-purple-600/40 text-white' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {players.length > 0 && (
          <p className="text-slate-400 text-sm mb-6">
            <span className="text-purple-300 font-bold">{players.length}</span> players · average overall{' '}
            <span className="text-purple-300 font-bold">{averagePower(players)}</span>
            {unratedCount > 0 && (
              <>
                {' · '}
                <span className="text-amber-300">
                  {unratedCount} not rated yet: edit them to set a position and stats
                </span>
              </>
            )}
          </p>
        )}

        {/* Player Form Modal */}
        {showForm && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && closeForm()}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="player-form-title"
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 sm:p-8 w-full max-w-3xl max-h-[92vh] overflow-y-auto border border-purple-500/30 shadow-2xl"
            >
              <h2 id="player-form-title" className="text-2xl font-bold text-white mb-6">
                {editingPlayer ? '✏️ Edit Player' : '➕ Add New Player'}
              </h2>

              <div className="grid md:grid-cols-[1fr_220px] gap-6 md:gap-8">
                {/* Live preview */}
                <div className="md:order-last">
                  <div className="md:sticky md:top-0">
                    <PlayerCard player={preview} className="w-44 md:w-full mx-auto" />
                    <p className="text-slate-400 text-xs text-center mt-3">
                      Overall for {formData.position}: {describeWeights(formData.position)}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="firstname" className="block text-purple-300 text-sm font-medium mb-2">First Name</label>
                      <input
                        id="firstname"
                        type="text"
                        autoFocus
                        value={formData.firstname}
                        onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                        className={inputClass}
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastname" className="block text-purple-300 text-sm font-medium mb-2">Last Name</label>
                      <input
                        id="lastname"
                        type="text"
                        value={formData.lastname}
                        onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                        className={inputClass}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <label htmlFor="position" className="text-purple-300 text-sm font-medium">Position</label>
                      <a
                        href="#/positions"
                        target="_blank"
                        rel="noopener"
                        className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2"
                      >
                        ما معنى المراكز؟
                      </a>
                    </div>
                    <select
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className={inputClass}
                    >
                      {POSITION_GROUPS.map((group) => (
                        <optgroup key={group} label={group}>
                          {POSITIONS.filter((p) => p.group === group).map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.code} · {p.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {formData.position === 'GK' && <p className="text-slate-400 text-xs mt-2">{GK_HINT}</p>}
                  </div>

                  <fieldset className="space-y-3" aria-labelledby="stats-heading">
                    <div className="flex items-baseline justify-between mb-3">
                      <span id="stats-heading" className="text-purple-300 text-sm font-medium">
                        Stats ({STAT_MIN}-{STAT_MAX})
                      </span>
                      <span className="text-slate-400 text-sm">
                        Overall <span className="text-white text-lg font-black">{preview.power}</span>
                      </span>
                    </div>
                    {STATS.map(({ key, label, name }) => (
                      <div key={key} className="grid grid-cols-[3rem_1fr_3.75rem] items-center gap-3">
                        <label htmlFor={`stat-${key}`} className="text-white text-sm font-bold" title={name}>
                          {label}
                        </label>
                        <input
                          type="range"
                          min={STAT_MIN}
                          max={STAT_MAX}
                          value={formData.stats[key] === '' ? STAT_MIN : formData.stats[key]}
                          onChange={(e) => setStat(key, e.target.value)}
                          aria-label={name}
                          className="w-full accent-purple-500"
                        />
                        <input
                          id={`stat-${key}`}
                          type="number"
                          inputMode="numeric"
                          min={STAT_MIN}
                          max={STAT_MAX}
                          value={formData.stats[key]}
                          onChange={(e) => setStat(key, e.target.value)}
                          className="w-full px-2 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-center focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    ))}
                  </fieldset>

                  {formError && (
                    <p role="alert" className="text-rose-300 text-sm bg-rose-900/30 border border-rose-500/40 rounded-lg px-3 py-2">
                      {formError}
                    </p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 disabled:opacity-60 text-white rounded-xl font-bold transition-all duration-300"
                    >
                      {saving ? 'Saving…' : editingPlayer ? 'Update Player' : 'Add Player'}
                    </button>
                    <button
                      type="button"
                      onClick={closeForm}
                      className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl font-medium transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Player cards */}
        {players.length === 0 ? (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700/50">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">No Players Yet</h3>
            <p className="text-slate-400">Click "Add New Player" to create your first player</p>
          </div>
        ) : visiblePlayers.length === 0 ? (
          <p className="text-slate-400 text-center p-8">No players match “{query}”.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
            {visiblePlayers.map((player) => (
              <div key={player.id} className="flex flex-col gap-2">
                <PlayerCard player={player} />
                <div className="flex gap-2">
                  <button
                    onClick={() => openForm(player)}
                    className="flex-1 px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    ✏️ {player.rated ? 'Edit' : 'Rate'}
                  </button>
                  <button
                    onClick={() => handleDelete(player)}
                    aria-label={`Delete ${fullName(player)}`}
                    title="Delete"
                    className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg text-sm transition-all duration-200"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <AppFooter />
      </div>
    </div>
  );
}
