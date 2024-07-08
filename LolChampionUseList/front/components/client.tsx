'use client'

import { ChampionData, ChampionProps } from '@/app/no-store/champions';
import { useState } from 'react';

export function ChampionDiv( {champion}: ChampionProps) {
    const [status, setStatus] = useState(champion.status);
    
console.log(champion)
console.log("client")

    


    return (
        <div
        onClick={() => {
            setStatus(status === 0 ? 1 : 0);
        }}
        key={champion.id}
        style={{ position: 'relative', display: 'inline-block'}}
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
    