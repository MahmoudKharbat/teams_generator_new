import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const PLAYERS_COLLECTION = 'new_players';

export const fullName = (player) => `${player.firstname} ${player.lastname}`.trim();

// Live list of players, sorted by name. Power is coerced to a number so sums never concatenate strings.
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
                power: Number(data.power) || 0,
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
