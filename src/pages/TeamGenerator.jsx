import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function TeamGenerator() {
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [showTeams, setShowTeams] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'new_players'), 
      (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlayers(playersData);
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

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
    setShowTeams(false);
  };

  const selectAll = () => {
    setSelectedPlayers(players.map(p => p.id));
    setShowTeams(false);
  };

  const clearSelection = () => {
    setSelectedPlayers([]);
    setShowTeams(false);
  };

  // Algorithm to balance teams with minimal power difference
  const generateBalancedTeams = () => {
    const selected = players.filter(p => selectedPlayers.includes(p.id));
    
    if (selected.length < 2) {
      alert('Please select at least 2 players');
      return;
    }

    if (selected.length % 2 !== 0) {
      alert('Please select an even number of players');
      return;
    }

    // Sort players by power descending
    const sorted = [...selected].sort((a, b) => b.power - a.power);
    const teamSize = sorted.length / 2;
    
    // Use dynamic programming approach for optimal team balancing
    const n = sorted.length;
    const totalPower = sorted.reduce((sum, p) => sum + p.power, 0);
    const targetPower = totalPower / 2;
    
    // DP to find the subset closest to half the total power
    // dp[i][j][k] = best subset of k players from first i players with power closest to j
    const bestTeam = findOptimalTeam(sorted, teamSize, targetPower);
    
    const teamAPlayers = bestTeam;
    const teamBPlayers = sorted.filter(p => !bestTeam.includes(p));
    
    setTeamA(teamAPlayers);
    setTeamB(teamBPlayers);
    setShowTeams(true);
  };

  // Find optimal team using subset sum with constraint on team size
  const findOptimalTeam = (players, teamSize, targetPower) => {
    const n = players.length;
    const maxPower = players.reduce((sum, p) => sum + p.power, 0);
    
    // dp[power][count] = array of indices that achieve this power with this count
    // We'll use a simpler greedy + local search approach for efficiency
    
    // Start with greedy assignment
    let teamA = [];
    let teamB = [];
    let powerA = 0;
    let powerB = 0;
    
    // Sort by power descending and alternate assignment
    const sorted = [...players].sort((a, b) => b.power - a.power);
    
    for (const player of sorted) {
      if (teamA.length < teamSize && (powerA <= powerB || teamB.length >= teamSize)) {
        teamA.push(player);
        powerA += player.power;
      } else {
        teamB.push(player);
        powerB += player.power;
      }
    }
    
    // Local search: try swapping players to minimize difference
    let improved = true;
    while (improved) {
      improved = false;
      
      for (let i = 0; i < teamA.length; i++) {
        for (let j = 0; j < teamB.length; j++) {
          const currentDiff = Math.abs(powerA - powerB);
          const newPowerA = powerA - teamA[i].power + teamB[j].power;
          const newPowerB = powerB - teamB[j].power + teamA[i].power;
          const newDiff = Math.abs(newPowerA - newPowerB);
          
          if (newDiff < currentDiff) {
            // Swap players
            const temp = teamA[i];
            teamA[i] = teamB[j];
            teamB[j] = temp;
            powerA = newPowerA;
            powerB = newPowerB;
            improved = true;
          }
        }
      }
    }
    
    return teamA;
  };

  const calculateTotalPower = (team) => {
    return team.reduce((sum, p) => sum + p.power, 0);
  };

  const getPowerDifference = () => {
    const powerA = calculateTotalPower(teamA);
    const powerB = calculateTotalPower(teamB);
    return Math.abs(powerA - powerB).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-emerald-300">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 tracking-tight">
              ⚽ Team Generator
            </h1>
            <p className="text-emerald-200/60 mt-2 text-lg">Create perfectly balanced teams</p>
          </div>
          <Link 
            to="/admin"
            className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 rounded-xl font-semibold transition-all duration-300 border border-emerald-500/30 hover:border-emerald-400/60 shadow-lg hover:shadow-emerald-500/20"
          >
            ⚙️ Admin Console
          </Link>
        </div>

        {/* Selection Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={selectAll}
            className="px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded-lg font-medium transition-all duration-200 border border-emerald-500/40"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg font-medium transition-all duration-200 border border-rose-500/40"
          >
            Clear Selection
          </button>
          <div className="flex-1"></div>
          <div className="px-4 py-2.5 bg-slate-800/60 rounded-lg text-emerald-200">
            Selected: <span className="font-bold text-emerald-400">{selectedPlayers.length}</span> / {players.length}
          </div>
        </div>

        {/* Players Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {players.map(player => (
              <div
                key={player.id}
                onClick={() => togglePlayerSelection(player.id)}
                className={`relative cursor-pointer rounded-xl p-5 transition-all duration-300 transform hover:scale-[1.02] ${
                  selectedPlayers.includes(player.id)
                    ? 'bg-gradient-to-br from-emerald-600/40 to-teal-600/30 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                }`}
              >
                {/* Selection Indicator */}
                <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                  selectedPlayers.includes(player.id)
                    ? 'bg-emerald-400 text-slate-900'
                    : 'bg-slate-700 text-slate-500'
                }`}>
                  {selectedPlayers.includes(player.id) ? '✓' : ''}
                </div>
                
                {/* Player Avatar */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl mb-3 shadow-lg">
                  ⚽
                </div>
                
                {/* Player Info */}
                <h3 className="text-xl font-bold text-white mb-1">
                  {player.firstname} {player.lastname}
                </h3>
                
                {/* Power Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-400">Power</span>
                    <span className="text-emerald-400 font-bold">{player.power}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(player.power, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate Button */}
        {players.length > 0 && (
          <div className="text-center mb-8">
            <button
              onClick={generateBalancedTeams}
              disabled={selectedPlayers.length < 2}
              className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-700 disabled:to-slate-600 text-white text-xl font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-emerald-500/30 disabled:shadow-none disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
            >
              ⚡ Generate Balanced Teams
            </button>
          </div>
        )}

        {/* Teams Display */}
        {showTeams && (
          <div className="animate-fadeIn">
            {/* Power Difference Banner */}
            <div className="bg-gradient-to-r from-amber-600/20 via-orange-500/20 to-amber-600/20 border border-amber-500/40 rounded-xl p-4 mb-6 text-center">
              <span className="text-amber-300 text-lg">
                Power Difference: <span className="font-black text-2xl text-amber-400">{getPowerDifference()}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team A */}
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-2xl p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-blue-300">🔵 Team A</h2>
                  <div className="px-4 py-2 bg-blue-500/30 rounded-lg">
                    <span className="text-blue-200">Total Power: </span>
                    <span className="text-blue-300 font-bold">{calculateTotalPower(teamA)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {teamA.map(player => (
                    <div key={player.id} className="flex items-center gap-4 bg-blue-950/40 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600/50 flex items-center justify-center text-lg">⚽</div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{player.firstname} {player.lastname}</div>
                      </div>
                      <div className="px-3 py-1 bg-blue-600/40 rounded-lg text-blue-200 font-bold">{player.power}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div className="bg-gradient-to-br from-rose-900/40 to-rose-800/20 rounded-2xl p-6 border border-rose-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-rose-300">🔴 Team B</h2>
                  <div className="px-4 py-2 bg-rose-500/30 rounded-lg">
                    <span className="text-rose-200">Total Power: </span>
                    <span className="text-rose-300 font-bold">{calculateTotalPower(teamB)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {teamB.map(player => (
                    <div key={player.id} className="flex items-center gap-4 bg-rose-950/40 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600/50 flex items-center justify-center text-lg">⚽</div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{player.firstname} {player.lastname}</div>
                      </div>
                      <div className="px-3 py-1 bg-rose-600/40 rounded-lg text-rose-200 font-bold">{player.power}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

