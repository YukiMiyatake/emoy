'use client';

import { useState } from 'react';

export default function ChampionCard({
  champion,
  onUpdate,
}: {
  champion: any;
  onUpdate: (champion: any) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);

  const toggleTag = (tag: string) => {
    const updatedTags = { ...champion.tags, [tag]: !champion.tags[tag] };
    onUpdate({ ...champion, tags: updatedTags });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100px',
        height: '100px',
        cursor: 'pointer',
      }}
      onClick={() => {
        console.log('Card clicked');
        setShowDialog(true);
      }}
    >
      <img
        src={`https://ddragon.leagueoflegends.com/cdn/14.13.1/img/champion/${champion.image}`}
        alt={champion.name}
        style={{
          filter: champion.tags.Live ? 'none' : 'grayscale(100%)',

          width: '100%',
          height: '100%',
        }}
      />
      {!champion.tags.Live && (
        <img
          src="/overlay.png"
          alt="overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.5,
          }}
        />
      )}
      {showDialog && (
        <div
          onClick={(e) => e.stopPropagation()} // クリックイベントの伝播を防ぐ
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            background: 'white',
            border: '1px solid black',
            padding: '10px',
            zIndex: 1000, // ダイアログを最前面に表示
            filter: 'none',
          }}
        >
          {Object.keys(champion.tags).map((tag) => (
            <div key={tag}>
              <label>
                <input
                  type="checkbox"
                  checked={champion.tags[tag]}
                  onChange={() => toggleTag(tag)}
                />
                {tag}
              </label>
            </div>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation(); // クリックイベントの伝播を防ぐ
              console.log('Close clicked');
              setShowDialog(false);
            }}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}