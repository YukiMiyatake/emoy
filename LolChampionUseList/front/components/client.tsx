'use client'

import { ChampionData, ChampionListProps, ChampionProps } from '@/app/no-store/champions';

import { MouseEventHandler, useState } from 'react';


//var championList : ChampionListProps;
//var hoge: ChampionData[];

  // LocalStorageからChampionPropsデータを取得する
  // データが無い場合はgetServerSideProps()で取得する
function getChampionPropsFromLocalStorage() : ChampionData[] | null  
{
  const storedData = localStorage.getItem('champions');

  return storedData ? JSON.parse(storedData) : null;
};


// LocalStorageにChampionListPropsを保存する関数
function saveChampionPropsToLocalStorage(champions: ChampionData[]) 
{
  localStorage.setItem('champions', JSON.stringify(champions));
};


import { useEffect } from 'react';

export function SetChampionData({ champions }: ChampionListProps) {
  const [champ, setChampions] = useState(champions);

  useEffect(() => {
    const c = getChampionPropsFromLocalStorage();
    if (c) {
      console.log("find");
//      console.log(c);
      setChampions([...c]);
      console.log(champions);
} else {
      console.log("not found");
      saveChampionPropsToLocalStorage(champions);
    }
  }, []);

  return (<></>);
}

export function SetChampionData2( {champions}: ChampionListProps) {
  
  const [champ, setChampions] = useState(champions);

  const c = getChampionPropsFromLocalStorage();
  if( c ) {
    console.log("find");
    console.log(c)

    // ここでchampionListを更新する
    setChampions(c); 
    //championList = {champions: c};//////

  }else{
    console.log("not found");
    saveChampionPropsToLocalStorage(champions);
    //championList = champions;
  }

  //console.log(championList.champions[0]);
  
  return(<></>);
 
}



//export function ChampionDiv( { champion, index}: ChampionIndexProps) {
export function ChampionDiv( { champions, index}: ChampionListProps) {
  const champion = champions[index!];

  const [status, setStatus] = useState(champion.status);
  const [display, setDisplay] = useState(champion.display);
  

  
  return (
    
    <div
      onClick={() => {
        const s: number = status === 0 ? 1 : 0;
        setStatus(s);
        champion.status = s;
        saveChampionPropsToLocalStorage(champions);
      }}
      // 右クリックしたら要素を非表示する
      onContextMenu={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setDisplay(false);
        champion.display = false;
        saveChampionPropsToLocalStorage(champions);
        e.preventDefault();
      }}
      key={champion.id}
      style={{ 
        position: 'relative', 
        display: display ? 'inline-block' : 'none'
      }}
    >
        <img
            src={`http://ddragon.leagueoflegends.com/cdn/14.13.1/img/champion/${champion.image}`}
            alt={champion.name}
        />

        {
            (() =>{
              if (status === 1) {
                return (
                  <img
                    src={"maru.png"}
                    style={{ position: 'absolute', top: 0, left: 0 }}
                  />
                );
            }
          })()}

      </div>

    );
}


export function ChampionDivDisable( {champions, index}: ChampionListProps) {
  const champion = champions[index!];

  const [display, setDisplay] = useState(champion.display);
    

  return (

<div
onContextMenu={() => {
  setDisplay(true);
  champion.display = true;
  saveChampionPropsToLocalStorage(champions);
}}
key={champion.id}
style={{ 
  position: 'relative', 
  display: !display ? 'inline-block' : 'none'
}}
>
  <img
      src={`http://ddragon.leagueoflegends.com/cdn/14.13.1/img/champion/${champion.image}`}
      alt={champion.name}
  />

  </div>



    );
}



export function Reset({ champions }: ChampionListProps) {
  // チャンピオンの状態をリセットする関数
  const resetChampions = () => {
    const resetChampions = champions.map((champion) => ({
      ...champion,
      status: 0, // すべてのチャンピオンのstatusを0にリセット
      display: true, // displayをtrueに設定
    }));

    // 更新されたチャンピオンリストをローカルストレージに保存
    saveChampionPropsToLocalStorage(resetChampions);

    // 必要に応じて、状態管理のロジックをここに追加する
    // 再レンダリング
   // window.location.reload(); 
    
  };

  return (
    <div onClick={resetChampions}>
      Reset
    </div>
  );
}