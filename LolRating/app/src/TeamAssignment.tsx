import React, { useState } from 'react';
import { Rating, createInitialRating, updateRatings } from './TrueSkillFunctions';

type Player = {
  name: string;
  rating: Rating;
};

const TeamAssignment: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([
    { name: 'Player 1', rating: createInitialRating() },
    { name: 'Player 2', rating: createInitialRating() },
    { name: 'Player 3', rating: createInitialRating() },
    { name: 'Player 4', rating: createInitialRating() },
  ]);

  const handleMatchResults = () => {
    const team1 = players.slice(0, 2).map(p => p.rating); // Team 1
    const team2 = players.slice(2, 4).map(p => p.rating); // Team 2

    const [updatedTeam1, updatedTeam2] = updateRatings([team1, team2]);

    const updatedPlayers = players.map((player, index) => ({
      ...player,
      rating: index < 2 ? updatedTeam1[index] : updatedTeam2[index - 2],
    }));

    setPlayers(updatedPlayers);
  };

  return (
    <div>
      <h1>LoL 仲間内のレーティング</h1>
      <ul>
        {players.map((player, index) => (
          <li key={index}>
            {player.name}: μ={player.rating.mu.toFixed(2)}, σ={player.rating.sigma.toFixed(2)}
          </li>
        ))}
      </ul>
      <button onClick={handleMatchResults}>試合結果を入力</button>
    </div>
  );
};

export default TeamAssignment;