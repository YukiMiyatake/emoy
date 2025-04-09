/*
  例えば配信用に、どのチャンプを使ったかの一覧
*/
// クリック部分だけクライアントにしたい



import { useEffect, useState } from 'react';
import { getServerSideProps, ChampionListProps, ChampionProps, ChampionData } from './no-store/champions';
import { ChampionDiv, ChampionDivDisable, Reset, SetChampionData } from '@/components/client';

// TODO: LatestのバージョンをAPIで取得し、WebStorageのバージョンと比較
// バージョンが変わっていたら チャンピオン取得APIを呼び、WebStorageにチャンピオン名（英語、日本語）取得

// 毎回チャンピオンAPIを使わず、WebStorageからチャンピオン名リストを読むようにする
// WebStorageには Version、[champion.key, champion.image.full, champion.name,  フラグ（後述）  ]
// マウスクリックで、フラグを変更し、フラグに応じてオーバーレイ（〇、× あるいは暗転など）
// チャンピオン選定も可能にする（Midチャンプなど）

/*
  WebStorage案

  Version
  Main
    id
    name
    image
    status

  
3
*/

/*s
サーバレンダリング：
  バージョン取得
  チャンピオンデータ一覧取得

クライアントレンダリング
　バージョン取得
  localStorageから取得。なければチャンピオンデータを保存

*/





const LOL_VERSION = '14.13.1';


//type Props = {champions: any}






function ChampionsPage( {champions}: ChampionListProps ) {

// ComponentにわけてClinetServerわける
  //const [state, setState] = useState(champions);
 // SetChampionData(champions);
  return (
  <>
    <div>
      <SetChampionData champions={champions} />
      <Reset champions={champions}/>
    </div>

    <div>
      Champion
      <div>
        {champions.map((champion, index) => (
          <><ChampionDiv champions={[champion]} index={index} /></>
        ))}
      </div>

      Disable
      <div>
        {champions.map((champion, index) => (
          <><ChampionDivDisable champions={[champion]} index={index} /></>
        ))}
      </div>
    </div>
  </>
  );
}

//export default ChampionsPage;


export default async function Home() {
  let champions = await getServerSideProps();

//  setChampionData(champions.props);

  return (
    ChampionsPage(champions.props)
  );
}
