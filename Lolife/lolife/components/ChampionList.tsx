'use client';

import React, { useEffect, useState } from 'react';
import ChampionCard from './ChampionCard';

type Champion = {
  id: string;
  name: string;
  image: string;
  tags: { [key: string]: boolean };
};

type ChampionListProps = {
  champions: Champion[];
};

export default function ChampionList({ champions }: ChampionListProps) {
  const [storedChampions, setStoredChampions] = useState<Champion[]>([]);
  const [filters, setFilters] = useState<{ [key: string]: boolean }>({});
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [randomCount, setRandomCount] = useState<number>(5);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChampions = localStorage.getItem('champions');
      if (savedChampions) {
        setStoredChampions(JSON.parse(savedChampions));
      } else {
        setStoredChampions(champions);
        localStorage.setItem('champions', JSON.stringify(champions));
      }
    }
  }, [champions]);

  const toggleFilter = (tag: string) => {
    setFilters((prev) => ({ ...prev, [tag]: !prev[tag] }));
  };

  const updateChampions = (updatedChampions: Champion[]) => {
    setStoredChampions(updatedChampions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('champions', JSON.stringify(updatedChampions));
    }
  };

  const setRandomChoiced = () => {
    if (!window.confirm(`${randomCount}個のチャンピオンをランダムでChoiceに設定しますか？`)) return;

    const updatedChampions = storedChampions.map((champion) => ({
      ...champion,
      tags: { ...champion.tags, Choiced: false },
    }));

    const randomIndexes = Array.from({ length: randomCount }, () =>
      Math.floor(Math.random() * updatedChampions.length)
    );

    randomIndexes.forEach((index) => {
      updatedChampions[index].tags.Choiced = true;
    });

    updateChampions(updatedChampions);
  };

  const setRandomChoicedFromEnabled = () => {
    const enabledChampions = storedChampions.filter((champion) => champion.tags.Live);

    if (enabledChampions.length < randomCount) {
      alert('Enabled状態のチャンピオンがランダム選択数より少ないです。');
      return;
    }

    if (!window.confirm(`${randomCount}個のEnabledチャンピオンをランダムでChoiceに設定しますか？`)) {
      return;
    }

    const updatedChampions = storedChampions.map((champion) => ({
      ...champion,
      tags: { ...champion.tags, Choiced: false },
    }));

    const randomIndexes = Array.from({ length: randomCount }, () =>
      Math.floor(Math.random() * enabledChampions.length)
    );

    randomIndexes.forEach((index) => {
      const championId = enabledChampions[index].id;
      const targetChampion = updatedChampions.find((c) => c.id === championId);
      if (targetChampion) {
        targetChampion.tags.Choiced = true;
      }
    });

    updateChampions(updatedChampions);
  };

  const setAllEnabledTrue = () => {
    if (!window.confirm('全てのチャンピオンをEnabledに設定しますか？')) return;

    const updatedChampions = storedChampions.map((champion) => ({
      ...champion,
      tags: { ...champion.tags, Live: true },
    }));

    updateChampions(updatedChampions);
  };

  const filteredChampions = storedChampions.filter((champion) => {
    return Object.keys(filters).every((key) => !filters[key] || champion.tags[key]);
  });

  const styles = {
    button: (isActive: boolean) => ({
      backgroundColor: isActive ? '#4CAF50' : '#f0f0f0',
      color: isActive ? 'white' : 'black',
      border: '1px solid #ccc',
      padding: '5px 10px',
      margin: '5px',
      borderRadius: '5px',
      cursor: 'pointer',
    }),
    input: {
      marginRight: '10px',
      padding: '5px',
      width: '50px',
    },
    actionButton: (bgColor: string, textColor: string) => ({
      padding: '5px 10px',
      backgroundColor: bgColor,
      color: textColor,
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      marginRight: '10px',
    }),
    championContainer: {
      display: 'flex',
      flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
      gap: '10px',
    },
  };

  return (
    <div>
      <div>
        {['Live', 'Top', 'Jg', 'Mid', 'Bot', 'Sup', 'Choiced'].map((tag) => (
          <button
            key={tag}
            onClick={() => toggleFilter(tag)}
            style={styles.button(filters[tag])}
          >
            {tag}
          </button>
        ))}
      </div>
      <div style={{ margin: '10px 0' }}>
        <input
          type="number"
          value={randomCount}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (!isNaN(value)) setRandomCount(value);
          }}
          style={styles.input}
        />
        <button
          onClick={setRandomChoiced}
          style={styles.actionButton('#007BFF', 'white')}
        >
          ランダムChoice
        </button>
        <button
          onClick={setRandomChoicedFromEnabled}
          style={styles.actionButton('#28A745', 'white')}
        >
          EnabledからランダムChoice
        </button>
        <button
          onClick={setAllEnabledTrue}
          style={styles.actionButton('#FFC107', 'black')}
        >
          全てEnabledに設定
        </button>
      </div>
      <div style={styles.championContainer}>
        {filteredChampions.map((champion) => (
          <ChampionCard
            key={champion.id}
            champion={champion}
            onUpdate={(updatedChampion) => {
              const updatedChampions = storedChampions.map((c) =>
                c.id === updatedChampion.id ? updatedChampion : c
              );
              updateChampions(updatedChampions);
            }}
            isOpen={openDialogId === champion.id}
            onToggleDialog={() =>
              setOpenDialogId(openDialogId === champion.id ? null : champion.id)
            }
          />
        ))}
      </div>
    </div>
  );
}