import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { computeOverall, parseStats, POSITION_BY_CODE } from '../lib/playerRating';
import { isPhoto } from '../lib/photo';

export const PLAYERS_COLLECTION = 'new_players';

export const fullName = (player) => `${player.firstname} ${player.lastname}`.trim();

export const initials = (player) => `${player.firstname[0] ?? ''}${player.lastname[0] ?? ''}`.toUpperCase() || '?';

// Rated players (position + six stats) get power computed from their stats, so formula changes apply
// to everyone at once. Players from before ratings keep their manually entered power until edited.
function ratePlayer(data) {
  const stats = parseStats(data.stats);
  const position = POSITION_BY_CODE[data.position] ? data.position : null;
  if (stats && position) return { stats, position, rated: true, power: computeOverall(stats, position) };
  return { stats: null, position, rated: false, power: Number(data.power) || 0 };
}

// Live list of players, sorted by name. Power is always a number so sums never concatenate strings.
export function usePlayers() {
  const [state, setState] = useState({ players: [], loading: true, error: null });

  useEffect(
    () =>
      onSnapshot(
        collection(db, PLAYERS_COLLECTION),
        (snapshot) => {
          const players = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                ...data,
                id: doc.id,
                firstname: String(data.firstname ?? '').trim(),
                lastname: String(data.lastname ?? '').trim(),
                photo: isPhoto(data.photo) ? data.photo : null,
                ...ratePlayer(data),
              };
            })
            .sort((a, b) => fullName(a).localeCompare(fullName(b)));
          setState({ players, loading: false, error: null });
        },
        (err) => {
          console.error('Firebase error:', err);
          setState((prev) => ({ ...prev, loading: false, error: err.message }));
        }
      ),
    []
  );

  return state;
}
