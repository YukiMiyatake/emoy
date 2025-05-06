/* eslint @typescript-eslint/no-explicit-any: 0 */

'use client';
import { CHAMPION_IMAGE_URL } from '../constants';

export default function ChampionCard({
  champion,
  isOpen,

  onToggleDialog,
  onUpdate,

}: {
  champion: any;
  isOpen: boolean;
  onToggleDialog: () => void;
  onUpdate: (champion: any) => void;
}) {

  //const [showDialog, setShowDialog] = useState(false);

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
        onToggleDialog();
      }}
    >
      <img
        src={`${CHAMPION_IMAGE_URL}${champion.image}`}
        alt={champion.name}
        style={{
          filter: champion.tags.Live ? 'none' : 'grayscale(100%)',
          border: champion.tags.Live ? '0px' : '4px groove #000000',
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
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()} // クリックイベントの伝播を防ぐ
          style={{
            position: 'absolute',
            top: '110%',
            left: '0',
            background: 'white', // 背景色
            border: '1px solid #ccc', // 枠線
            borderRadius: '8px', // 角丸
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // 影
            padding: '15px', // 内側の余白
            zIndex: 1000, // 最前面に表示
            animation: 'fadeIn 0.3s ease-in-out', // アニメーション
          }}
        >
          {Object.keys(champion.tags).map((tag) => (
            <div key={tag} style={{ marginBottom: '5px' }}>
              <label>
                <input
                  type="checkbox"
                  checked={champion.tags[tag]}
                  onChange={() => toggleTag(tag)}
                  style={{ 
                    marginRight: '5px',
                  }}
                />
                <span style={{color: tag==='Live' ? 'red' : 'black' }}>{tag}</span>
              </label>
            </div>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation(); // クリックイベントの伝播を防ぐ
              onToggleDialog(); // ダイアログを閉じる
            }}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}