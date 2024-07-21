'use client'

import { ChampionData, ChampionListProps, ChampionProps } from '@/app/no-store/champions';
import { ChampionIndexProps } from '@/app/page';
import { MouseEventHandler, useState } from 'react';


var championList : ChampionListProps;
var hoge: ChampionData[];

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

export function SetChampionData( champions: ChampionListProps) {
  
  const c = getChampionPropsFromLocalStorage();
  if( c ) {
    console.log("find");
    console.log(c)

    // ここでchampionListを更新する
    championList = {champions: c};

  }else{
    console.log("not found");
    saveChampionPropsToLocalStorage(champions.champions);
    championList = champions;
  }

  console.log(championList.champions[0]);
  
  return(<>{champions.children}</>);

}



export function ChampionDiv( { index}: ChampionIndexProps) {
  const champion = championList.champions[index];

  const [status, setStatus] = useState(championList.champions[index].status);
  const [display, setDisplay] = useState(championList.champions[index].display);
  

  
  return (
    
    <div
      onClick={() => {
        const s: number = status === 0 ? 1 : 0;
        setStatus(s);
        championList.champions[index].status = s;
        saveChampionPropsToLocalStorage(championList.champions);
      }}
      // 右クリックしたら要素を非表示する
      onContextMenu={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setDisplay(false);
        championList.champions[index].display = false;
        saveChampionPropsToLocalStorage(championList.champions);
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


export function ChampionDivDisable( {index}: ChampionIndexProps) {
  const champion = championList.champions[index];

  const [display, setDisplay] = useState(champion.display);
    

  return (

<div
onContextMenu={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  setDisplay(true);
  championList.champions[index].display = true;
  saveChampionPropsToLocalStorage(championList.champions);
  e.preventDefault();
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



export function Reset()
{

  return (
  <div       
    onClick={() => {
      championList.champions.forEach((champion) => {
        champion.status = 0;
        champion.display = true;
      });
      saveChampionPropsToLocalStorage(championList.champions);  
      window.location.reload() 
    }}
  >
    Reset
  </div>
  );
}