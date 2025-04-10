import React, { useState, useEffect } from 'react';
import { fetchPlayers } from './DynamoDBFunctions';
import { TrueSkill, Rating, rate, quality } from 'ts-trueskill'; // TrueSkill ライブラリをインポート

type Player = {
  PlayerID: string;
  Name: string;
  RatingMu: number;
  RatingSigma: number;
};

const PlayerSelection: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [team1, setTeam1] = useState<(string | null)[]>(() => {
    const savedTeam1 = localStorage.getItem('team1');
    const parsedTeam1 = savedTeam1 ? JSON.parse(savedTeam1) : [];
    return [...parsedTeam1, ...Array(5 - parsedTeam1.length).fill(null)].slice(0, 5); // 5人未満の場合、null で埋める
  });
  const [team2, setTeam2] = useState<(string | null)[]>(() => {
    const savedTeam2 = localStorage.getItem('team2');
    const parsedTeam2 = savedTeam2 ? JSON.parse(savedTeam2) : [];
    return [...parsedTeam2, ...Array(5 - parsedTeam2.length).fill(null)].slice(0, 5); // 5人未満の場合、null で埋める
  });

  const [team1MuSum, setTeam1MuSum] = useState(0);
  const [team2MuSum, setTeam2MuSum] = useState(0);
  const [matchQuality, setMatchQuality] = useState(0);

  useEffect(() => {
    const loadPlayers = async () => {
      const fetchedPlayers = await fetchPlayers();
      setPlayers(fetchedPlayers);
    };

    loadPlayers();
  }, []);

  // チームの状態をローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('team1', JSON.stringify(team1));
    localStorage.setItem('team2', JSON.stringify(team2));
  }, [team1, team2]);

  // チームのレート合計と勝利確率を計算
  useEffect(() => {
    const team1Ratings = team1
      .map(playerId => players.find(player => player.PlayerID === playerId))
      .filter(Boolean)
      .map(player => new Rating(player!.RatingMu, player!.RatingSigma));

    const team2Ratings = team2
      .map(playerId => players.find(player => player.PlayerID === playerId))
      .filter(Boolean)
      .map(player => new Rating(player!.RatingMu, player!.RatingSigma));

    const team1Mu = team1Ratings.reduce((sum, rating) => sum + rating.mu, 0);
    const team2Mu = team2Ratings.reduce((sum, rating) => sum + rating.mu, 0);

    setTeam1MuSum(team1Mu);
    setTeam2MuSum(team2Mu);

    if (team1Ratings.length === 5 && team2Ratings.length === 5) {
      const qualityValue = quality([team1Ratings, team2Ratings]);
      setMatchQuality(qualityValue);
    } else {
      setMatchQuality(0);
    }
  }, [team1, team2, players]);

  const handlePlayerSelect = (team: 'team1' | 'team2', index: number, playerId: string | null) => {
    if (team === 'team1') {
      const newTeam1 = [...team1];
      newTeam1[index] = playerId;
      setTeam1(newTeam1);
    } else {
      const newTeam2 = [...team2];
      newTeam2[index] = playerId;
      setTeam2(newTeam2);
    }
  };

  const handleTeamVictory = (winningTeam: 'team1' | 'team2') => {
    if (!window.confirm(`${winningTeam === 'team1' ? 'チーム1' : 'チーム2'}が勝利しました。レートを更新しますか？`)) {
      return;
    }

    const team1Ratings = team1
      .map(playerId => players.find(player => player.PlayerID === playerId))
      .filter(Boolean)
      .map(player => new Rating(player!.RatingMu, player!.RatingSigma));

    const team2Ratings = team2
      .map(playerId => players.find(player => player.PlayerID === playerId))
      .filter(Boolean)
      .map(player => new Rating(player!.RatingMu, player!.RatingSigma));

    const [updatedTeam1Ratings, updatedTeam2Ratings] =
      winningTeam === 'team1' ? rate([team1Ratings, team2Ratings]) : rate([team2Ratings, team1Ratings]);

    const updatedPlayers = players.map(player => {
      const team1Index = team1.indexOf(player.PlayerID);
      if (team1Index !== -1) {
        const updatedRating = updatedTeam1Ratings[team1Index];
        return { ...player, RatingMu: updatedRating.mu, RatingSigma: updatedRating.sigma };
      }

      const team2Index = team2.indexOf(player.PlayerID);
      if (team2Index !== -1) {
        const updatedRating = updatedTeam2Ratings[team2Index];
        return { ...player, RatingMu: updatedRating.mu, RatingSigma: updatedRating.sigma };
      }

      return player;
    });

    setPlayers(updatedPlayers);
  };

  const handleAutoBalanceTeams = () => {
    const selectedPlayerIds = [...team1, ...team2].filter((id): id is string => id !== null);
    const selectedPlayers = players.filter(player => selectedPlayerIds.includes(player.PlayerID));

    if (selectedPlayers.length !== 10) {
      alert('自動振り分けを行うには、10人のプレイヤーを選択してください。');
      return;
    }

    let bestTeam1: Player[] = [];
    let bestTeam2: Player[] = [];
    let smallestRatingDifference = Infinity;

    for (let i = 0; i < 10; i++) {
      const shuffledPlayers = [...selectedPlayers].sort(() => Math.random() - 0.5);
      const tempTeam1 = shuffledPlayers.slice(0, 5);
      const tempTeam2 = shuffledPlayers.slice(5, 10);

      const team1MuSum = tempTeam1.reduce((sum, p) => sum + p.RatingMu, 0);
      const team2MuSum = tempTeam2.reduce((sum, p) => sum + p.RatingMu, 0);

      const ratingDifference = Math.abs(team1MuSum - team2MuSum);

      if (ratingDifference < smallestRatingDifference) {
        smallestRatingDifference = ratingDifference;
        bestTeam1 = tempTeam1;
        bestTeam2 = tempTeam2;
      }
    }

    setTeam1(bestTeam1.map(player => player.PlayerID));
    setTeam2(bestTeam2.map(player => player.PlayerID));
  };

  return (
    <div>
      <h1>試合</h1>
      <div className="match-info">
        <p>マッチクオリティ: {(matchQuality * 100).toFixed(2)}%</p>
      </div>
      <div className="team-container">
        <div className="team">
          <h2>チーム1: {team1MuSum.toFixed(2)}</h2> 
          {team1.map((playerId, index) => (
            <div key={index}>
              <select
                value={playerId || ''}
                onChange={(e) => handlePlayerSelect('team1', index, e.target.value || null)}
              >
                <option value="">未選択</option>
                {players
                  .filter((player) => ![...team1, ...team2].includes(player.PlayerID) || player.PlayerID === playerId)
                  .map((player) => (
                    <option key={player.PlayerID} value={player.PlayerID}>
                      {player.Name} (μ={player.RatingMu.toFixed(2)}, σ={player.RatingSigma.toFixed(2)})
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>
        <div className="team">
          <h2>チーム2: {team2MuSum.toFixed(2)}</h2>
          {team2.map((playerId, index) => (
            <div key={index}>
              <select
                value={playerId || ''}
                onChange={(e) => handlePlayerSelect('team2', index, e.target.value || null)}
              >
                <option value="">未選択</option>
                {players
                  .filter((player) => ![...team1, ...team2].includes(player.PlayerID) || player.PlayerID === playerId)
                  .map((player) => (
                    <option key={player.PlayerID} value={player.PlayerID}>
                      {player.Name} (μ={player.RatingMu.toFixed(2)}, σ={player.RatingSigma.toFixed(2)})
                    </option>
                  ))}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button onClick={() => handleTeamVictory('team1')}>チーム1勝利</button>
        <button onClick={() => handleTeamVictory('team2')}>チーム2勝利</button>
        <button onClick={handleAutoBalanceTeams}>チームを自動バランス</button>
      </div>
    </div>
  );
};

export default PlayerSelection;