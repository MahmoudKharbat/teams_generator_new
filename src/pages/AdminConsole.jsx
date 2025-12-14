import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function AdminConsole() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    power: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'new_players'), 
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlayers(playersData.sort((a, b) => a.firstname.localeCompare(b.firstname)));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Firebase error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({ firstname: '', lastname: '', power: '' });
    setEditingPlayer(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.power) {
      alert('Please fill in all fields');
      return;
    }

    const power = parseFloat(formData.power);
    if (isNaN(power) || power < 0 || power > 100) {
      alert('Power must be a number between 0 and 100');
      return;
    }

    try {
      if (editingPlayer) {
        await updateDoc(doc(db, 'new_players', editingPlayer.id), {
          firstname: formData.firstname.trim(),
          lastname: formData.lastname.trim(),
          power: power
        });
      } else {
        await addDoc(collection(db, 'new_players'), {
          firstname: formData.firstname.trim(),
          lastname: formData.lastname.trim(),
          power: power
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Failed to save player. Please try again.');
    }
  };

  const handleEdit = (player) => {
    setFormData({
      firstname: player.firstname,
      lastname: player.lastname,
      power: player.power.toString()
    });
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDelete = async (playerId) => {
    if (!confirm('Are you sure you want to delete this player?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'new_players', playerId));
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to delete player. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-300">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-lg text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-300 mb-4">Firebase Connection Error</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <div className="text-left bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300">
            <p className="font-bold mb-2">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Go to Firebase Console</li>
              <li>Click on Firestore Database</li>
              <li>Create database (if not created)</li>
              <li>Start in test mode</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-300 to-pink-400 tracking-tight">
              ⚙️ Admin Console
            </h1>
            <p className="text-purple-200/60 mt-2 text-lg">Manage your soccer players</p>
          </div>
          <Link 
            to="/"
            className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-purple-300 rounded-xl font-semibold transition-all duration-300 border border-purple-500/30 hover:border-purple-400/60 shadow-lg hover:shadow-purple-500/20"
          >
            ⚽ Team Generator
          </Link>
        </div>

        {/* Add Player Button */}
        <button
          onClick={() => { setShowForm(true); setEditingPlayer(null); setFormData({ firstname: '', lastname: '', power: '' }); }}
          className="mb-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white rounded-xl font-bold transition-all duration-300 shadow-xl hover:shadow-purple-500/30 flex items-center gap-2"
        >
          <span className="text-xl">+</span> Add New Player
        </button>

        {/* Player Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 w-full max-w-md border border-purple-500/30 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingPlayer ? '✏️ Edit Player' : '➕ Add New Player'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-purple-300 text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    placeholder="Enter first name"
                  />
                </div>
                
                <div>
                  <label className="block text-purple-300 text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    placeholder="Enter last name"
                  />
                </div>
                
                <div>
                  <label className="block text-purple-300 text-sm font-medium mb-2">Power (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.power}
                    onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                    placeholder="Enter power rating"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-500 hover:to-fuchsia-400 text-white rounded-xl font-bold transition-all duration-300"
                  >
                    {editingPlayer ? 'Update Player' : 'Add Player'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
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
              {players.map(player => (
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
                      onClick={() => handleEdit(player)}
                      className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded-lg font-medium transition-all duration-200 flex items-center gap-1"
                    >
                      <span>✏️</span> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(player.id)}
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
                Average Power: <span className="text-purple-300 font-bold">
                  {(players.reduce((sum, p) => sum + p.power, 0) / players.length).toFixed(1)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

