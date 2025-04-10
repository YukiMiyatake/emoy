import React, { useState } from 'react';
import { Tabs, Tab } from '@mui/material';
import PlayerManagement from './PlayerManagement';
import PlayerSelection from './PlayerSelection';
import TeamAssignment from './TeamAssignment';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <h1>身内ランクツール</h1>
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
        <Tab label="プレイヤー" />
        <Tab label="試合登録" />
      </Tabs>
      {activeTab === 0 && <PlayerManagement />}
      {activeTab === 1 && <PlayerSelection />}
    </div>
  );
};

export default App;