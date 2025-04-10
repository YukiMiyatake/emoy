import React, { useState, useEffect } from 'react';
import { fetchPlayers, addPlayer, deletePlayer, updatePlayer } from './DynamoDBFunctions';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import './PlayerManagement.css';

const PlayerManagement: React.FC = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [newPlayer, setNewPlayer] = useState({ PlayerID: '', Name: '', RatingMu: 25, RatingSigma: 8.333 });
  const [editingPlayer, setEditingPlayer] = useState<any | null>(null);

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

  const handleCancelEdit = () => {
    setEditingPlayer(null); // 編集モードを終了
  };

  return (
    <div>
      <h1>プレイヤー管理画面</h1>

      {/* 新しいプレイヤー追加フォームを一番上に移動 */}
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

      {/* プレイヤー一覧 */}
      <h2>プレイヤー一覧</h2>
      <table className="player-table">
        <thead>
          <tr>
            <th>PlayerID</th>
            <th>Name</th>
            <th>μ</th>
            <th>σ</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.PlayerID}>
              <td>{player.PlayerID}</td>
              <td>{player.Name}</td>
              <td>{player.RatingMu.toFixed(0)}</td>
              <td>{player.RatingSigma.toFixed(2)}</td>
              <td>
                <button onClick={() => handleEditPlayer(player)}>編集</button>
                <button onClick={() => handleDeletePlayer(player.PlayerID)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 編集ダイアログ */}
      <Dialog open={!!editingPlayer} onClose={handleCancelEdit}>
        <DialogTitle>プレイヤーを編集</DialogTitle>
        <DialogContent>
          {editingPlayer && (
            <>
              <TextField
                label="Name"
                value={editingPlayer.Name}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, Name: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="RatingMu"
                type="number"
                value={editingPlayer.RatingMu}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, RatingMu: parseFloat(e.target.value) })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="RatingSigma"
                type="number"
                value={editingPlayer.RatingSigma}
                onChange={(e) => setEditingPlayer({ ...editingPlayer, RatingSigma: parseFloat(e.target.value) })}
                fullWidth
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} color="secondary">
            キャンセル
          </Button>
          <Button onClick={handleSaveEdit} color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PlayerManagement;