import React, { useState, useEffect } from 'react';
import { fetchPlayers, addPlayer, deletePlayer, updatePlayer } from './DynamoDBFunctions';

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [newPlayer, setNewPlayer] = useState({ PlayerID: '', Name: '', RatingMu: 25, RatingSigma: 8.333 });
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null); // 編集対象のプレイヤー

  // プレイヤーデータを取得
  useEffect(() => {
    const loadPlayers = async () => {
      const fetchedPlayers = await fetchPlayers();
      setPlayers(fetchedPlayers);
    };

    loadPlayers();
  }, []);

  // プレイヤーを追加
  const handleAddPlayer = async () => {
    await addPlayer(newPlayer);
    setNewPlayer({ PlayerID: '', Name: '', RatingMu: 25, RatingSigma: 8.333 });
    const updatedPlayers = await fetchPlayers();
    setPlayers(updatedPlayers);
  };

  // プレイヤーを削除
  const handleDeletePlayer = async (playerID: string) => {
    await deletePlayer(playerID);
    const updatedPlayers = await fetchPlayers();
    setPlayers(updatedPlayers);
  };

  // プレイヤーを編集
  const handleEditPlayer = (player: any) => {
    setEditingPlayer(player); // 編集対象を設定
  };

  // 編集内容を保存
  const handleSaveEdit = async () => {
    if (editingPlayer) {
      await updatePlayer(editingPlayer);
      const updatedPlayers = await fetchPlayers();
      setPlayers(updatedPlayers);
      setEditingPlayer(null); // 編集モードを終了
    }
  };

  return (
    <div>
      <h1>プレイヤー管理画面</h1>
      <h2>プレイヤー一覧</h2>
      <ul>
        {players.map((player) => (
          <li key={player.PlayerID}>
            {player.Name} (μ={player.RatingMu}, σ={player.RatingSigma})
            <button onClick={() => handleEditPlayer(player)}>編集</button>
            <button onClick={() => handleDeletePlayer(player.PlayerID)}>削除</button>
          </li>
        ))}
      </ul>
      <h2>新しいプレイヤーを追加</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddPlayer();
        }}
      >
        <input
          type="text"
          placeholder="PlayerID"
          value={newPlayer.PlayerID}
          onChange={(e) => setNewPlayer({ ...newPlayer, PlayerID: e.target.value })}
          required
        />
        <input
          type="text"
          placeholder="Name"
          value={newPlayer.Name}
          onChange={(e) => setNewPlayer({ ...newPlayer, Name: e.target.value })}
          required
        />
        <button type="submit">追加</button>
      </form>

      {editingPlayer && (
        <div>
          <h2>プレイヤーを編集</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit();
            }}
          >
            <input
              type="text"
              placeholder="Name"
              value={editingPlayer.Name}
              onChange={(e) => setEditingPlayer({ ...editingPlayer, Name: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="RatingMu"
              value={editingPlayer.RatingMu}
              onChange={(e) => setEditingPlayer({ ...editingPlayer, RatingMu: parseFloat(e.target.value) })}
              required
            />
            <input
              type="number"
              placeholder="RatingSigma"
              value={editingPlayer.RatingSigma}
              onChange={(e) => setEditingPlayer({ ...editingPlayer, RatingSigma: parseFloat(e.target.value) })}
              required
            />
            <button type="submit">保存</button>
            <button type="button" onClick={() => setEditingPlayer(null)}>キャンセル</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PlayerManagement;