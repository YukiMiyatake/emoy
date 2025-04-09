import React, { useState, useEffect } from 'react';
import { fetchPlayers } from './DynamoDBFunctions';
import { TrueSkill, Rating, rate } from 'ts-trueskill'; // TrueSkill ライブラリをインポート

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

    // ドロップダウンで選択されたプレイヤーを取得
    const team1Ratings = team1
      .map(playerId => players.find(player => player.PlayerID === playerId))
      .filter(Boolean)
      .map(player => new Rating(player!.RatingMu, player!.RatingSigma));

    const team2Ratings = team2
      .map(playerId => players.find(player => player.PlayerID === playerId))
      .filter(Boolean)
      .map(player => new Rating(player!.RatingMu, player!.RatingSigma));

    // 勝利チームに基づいてレートを更新
    const [updatedTeam1Ratings, updatedTeam2Ratings] =
      winningTeam === 'team1' ? rate([team1Ratings, team2Ratings]) : rate([team2Ratings, team1Ratings]);

    // プレイヤーのレートを更新
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
    // ドロップダウンで選択されたプレイヤーを取得
    const selectedPlayerIds = [...team1, ...team2].filter((id): id is string => id !== null);
    const selectedPlayers = players.filter(player => selectedPlayerIds.includes(player.PlayerID));

    // プレイヤーをランダムにシャッフル
    const shuffledPlayers = [...selectedPlayers].sort(() => Math.random() - 0.5);

    // チームを初期化
    let tempTeam1: Player[] = [];
    let tempTeam2: Player[] = [];

    shuffledPlayers.forEach(player => {
      const team1MuSum = tempTeam1.reduce((sum, p) => sum + p.RatingMu, 0);
      const team2MuSum = tempTeam2.reduce((sum, p) => sum + p.RatingMu, 0);

      // ランダム性を持たせつつ、レートの合計が均等になるように振り分け
      if (team1MuSum <= team2MuSum) {
        tempTeam1.push(player);
      } else {
        tempTeam2.push(player);
      }
    });

    // チームを更新
    setTeam1(tempTeam1.map(player => player.PlayerID).slice(0, 5));
    setTeam2(tempTeam2.map(player => player.PlayerID).slice(0, 5));
  };

  return (
    <div>
      <h1>5人対5人のプレイヤー選択</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h2>チーム1</h2>
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
        <div>
          <h2>チーム2</h2>
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
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => handleTeamVictory('team1')}>チーム1勝利</button>
        <button onClick={() => handleTeamVictory('team2')}>チーム2勝利</button>
        <button onClick={handleAutoBalanceTeams}>チームを自動バランス</button>
      </div>
    </div>
  );
};

export default PlayerSelection;