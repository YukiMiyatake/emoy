'use client';

import { useEffect, useState } from 'react';
import ChampionCard from './ChampionCard'; // Ensure ChampionCard.tsx or ChampionCard/index.tsx exists in the same directory

export default function ChampionList({ champions }: { champions: any[] }) {
  const [storedChampions, setStoredChampions] = useState<any[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);

  const handleDialogToggle = (id: string | null) => {
    setOpenDialogId(id); // 現在開いているダイアログのIDを設定
  };

  useEffect(() => {
    const savedChampions = localStorage.getItem('champions');
    if (savedChampions) {
      setStoredChampions(JSON.parse(savedChampions));
    } else {
      setStoredChampions(champions);
      localStorage.setItem('champions', JSON.stringify(champions));
    }
  }, [champions]);

  const toggleFilter = (tag: string) => {
    setFilters((prev) =>
      prev.includes(tag) ? prev.filter((f) => f !== tag) : [...prev, tag]
    );
    setOpenDialogId(null); // フィルターボタンを押したときにダイアログを閉じる
  };

  const filteredChampions = storedChampions.filter((champion) =>
    filters.every((filter) => champion.tags[filter])
  );

  return (
    <div>
      <div>
        {['Live', 'Top', 'Jg', 'Mid', 'Bot', 'Sup'].map((tag) => (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            style={{
              backgroundColor: filters.includes(tag) ? '#4CAF50' : '#f0f0f0', // トグル状態に応じて色を変更
              color: filters.includes(tag) ? 'white' : 'black', // テキスト色も変更
              border: '1px solid #ccc',
              padding: '5px 10px',
              margin: '5px',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            {tag} {filters.includes(tag) ? '✓' : ''}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {filteredChampions.map((champion) => (
          <ChampionCard
            key={champion.id}
            champion={champion}
            onUpdate={(updatedChampion) => {
              const updatedChampions = storedChampions.map((c) =>
                c.id === updatedChampion.id ? updatedChampion : c
              );
              setStoredChampions(updatedChampions);
              localStorage.setItem('champions', JSON.stringify(updatedChampions));
            }}
            isOpen={openDialogId === champion.id} // ダイアログが開いているかどうかを判定
            onToggleDialog={() =>
              handleDialogToggle(openDialogId === champion.id ? null : champion.id)
            }
  
          />
        ))}
      </div>
    </div>
  );
}