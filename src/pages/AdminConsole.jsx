import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { fullName, PLAYERS_COLLECTION, usePlayers } from '../hooks/usePlayers';
import { averagePower } from '../lib/teamBalancer';
import { ErrorScreen, LoadingScreen } from '../components/StatusScreens';

const EMPTY_FORM = { firstname: '', lastname: '', power: '' };

const SORTS = {
  name: { label: 'Name', compare: (a, b) => fullName(a).localeCompare(fullName(b)) },
  power: { label: 'Power', compare: (a, b) => b.power - a.power || fullName(a).localeCompare(fullName(b)) },
};

const inputClass =
  'w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all';

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

  const openForm = (player = null) => {
    setEditingPlayer(player);
    setFormData(player ? { firstname: player.firstname, lastname: player.lastname, power: String(player.power) } : EMPTY_FORM);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const firstname = formData.firstname.trim();
    const lastname = formData.lastname.trim();
    if (!firstname || !lastname || formData.power === '') {
      setFormError('Please fill in all fields');
      return;
    }

    const power = parseFloat(formData.power);
    if (isNaN(power) || power < 0 || power > 100) {
      setFormError('Power must be a number between 0 and 100');
      return;
    }

    setSaving(true);
    try {
      const data = { firstname, lastname, power: Math.round(power * 10) / 10 };
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
          <Link
            to="/"
            className="px-5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-purple-300 rounded-xl font-semibold transition-all duration-300 border border-purple-500/30 hover:border-purple-400/60"
          >
            ⚽ Team Generator
          </Link>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 w-full max-w-md border border-purple-500/30 shadow-2xl"
            >
              <h2 id="player-form-title" className="text-2xl font-bold text-white mb-6">
                {editingPlayer ? '✏️ Edit Player' : '➕ Add New Player'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="firstname" className="block text-purple-300 text-sm font-medium mb-2">First Name</label>
                  <input
                    id="firstname"
                    type="text"
                    autoFocus
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className={inputClass}
                    placeholder="Enter first name"
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
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label htmlFor="power" className="block text-purple-300 text-sm font-medium mb-2">Power (0-100)</label>
                  <input
                    id="power"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.power}
                    onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                    className={inputClass}
                    placeholder="Enter power rating"
                  />
                </div>

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
        )}

        {/* Players Table */}
        {players.length === 0 ? (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700/50">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-2xl font-bold text-slate-300 mb-2">No Players Yet</h3>
            <p className="text-slate-400">Click "Add New Player" to create your first player</p>
          </div>
        ) : (
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 p-4 bg-slate-800/80 border-b border-slate-700/50 text-purple-300 font-semibold text-sm uppercase tracking-wider">
              <div className="col-span-3">First Name</div>
              <div className="col-span-3">Last Name</div>
              <div className="col-span-3">Power</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-slate-700/50">
              {visiblePlayers.length === 0 && (
                <p className="text-slate-400 text-center p-8">No players match “{query}”.</p>
              )}
              {visiblePlayers.map((player) => (
                <div key={player.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 p-4 hover:bg-slate-700/20 transition-colors">
                  <div className="sm:col-span-3 flex items-center gap-3">
                    <div className="sm:hidden text-xs text-slate-500 uppercase w-20">First Name</div>
                    <span className="text-white font-medium">{player.firstname}</span>
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-3">
                    <div className="sm:hidden text-xs text-slate-500 uppercase w-20">Last Name</div>
                    <span className="text-white">{player.lastname}</span>
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-3">
                    <div className="sm:hidden text-xs text-slate-500 uppercase w-20">Power</div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 max-w-[120px] h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                          style={{ width: `${Math.min(player.power, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-purple-300 font-bold w-10 text-right">{player.power}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-3 flex items-center justify-start sm:justify-end gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => openForm(player)}
                      className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
                    >
                      <span>✏️</span> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(player)}
                      className="px-4 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
                    >
                      <span>🗑️</span> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer */}
            <div className="p-4 bg-slate-800/60 border-t border-slate-700/50">
              <p className="text-slate-400 text-sm">
                Total Players: <span className="text-purple-300 font-bold">{players.length}</span>
                {' • '}
                Average Power: <span className="text-purple-300 font-bold">{averagePower(players)}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
