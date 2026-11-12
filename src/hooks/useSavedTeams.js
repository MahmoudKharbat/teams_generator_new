import { useEffect, useState } from 'react';
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { describeSplit } from '../lib/teamBalancer';

// The last saved split, shared by everyone who uses the app: savedTeams/latest.
// Only player ids are stored, so loading it picks up rating changes and renames made since.
const savedTeamsRef = doc(db, 'savedTeams', 'latest');

const isId = (value) => typeof value === 'string' && value !== '';

// Firestore can't hold nested arrays, so each team is stored as { playerIds, captainId }.
function parseSaved(data) {
  const teams = Array.isArray(data?.teams) ? data.teams : [];
  if (teams.length < 2 || teams.length > 3) return null;
  if (!teams.every((t) => Array.isArray(t?.playerIds) && t.playerIds.every(isId))) return null;
  return {
    teams: teams.map((t) => ({ playerIds: t.playerIds, captainId: isId(t.captainId) ? t.captainId : null })),
    mode: typeof data.mode === 'string' ? data.mode : null,
    savedAt: typeof data.savedAt === 'number' ? data.savedAt : null,
  };
}

// undefined while loading, null when nothing is saved.
export function useSavedTeams() {
  const [saved, setSaved] = useState(undefined);

  useEffect(
    () =>
      onSnapshot(
        savedTeamsRef,
        (snapshot) => setSaved(snapshot.exists() ? parseSaved(snapshot.data()) : null),
        (err) => {
          console.error('Could not load saved teams:', err);
          setSaved(null);
        }
      ),
    []
  );

  return saved;
}

export const saveTeams = ({ teams, captains, mode }) =>
  setDoc(savedTeamsRef, {
    teams: teams.map((team, t) => ({ playerIds: team.map((p) => p.id), captainId: captains[t] ?? null })),
    mode: mode ?? null,
    savedAt: Date.now(),
  });

export const forgetSavedTeams = () => deleteDoc(savedTeamsRef);

// Same teams and same captains, in any team order.
export const sameTeams = (saved, result) => {
  const signature = (teams) => teams.map(({ ids, captainId }) => `${captainId}:${[...ids].sort().join(',')}`).sort().join('|');
  return (
    signature(saved.teams.map((t) => ({ ids: t.playerIds, captainId: t.captainId }))) ===
    signature(result.teams.map((team, t) => ({ ids: team.map((p) => p.id), captainId: result.captains[t] })))
  );
};

/**
 * Resolves a saved split against the live player list. Players deleted since are left out and counted
 * in `missing`; a deleted captain is replaced by the team's strongest remaining player.
 */
export function resolveSavedTeams(saved, players) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const teams = saved.teams.map((t) => t.playerIds.map((id) => byId.get(id)).filter(Boolean));
  const missing = saved.teams.reduce((sum, t) => sum + t.playerIds.length, 0) - teams.reduce((sum, t) => sum + t.length, 0);
  if (teams.some((team) => team.length === 0)) return { result: null, missing };
  const split = describeSplit(teams);
  const captains = saved.teams.map((t, i) => (byId.has(t.captainId) && t.playerIds.includes(t.captainId) ? t.captainId : split.teams[i][0].id));
  return { result: { ...split, captains, mode: saved.mode, origin: 'saved', savedAt: saved.savedAt, optionCount: null }, missing };
}
