# レーティングシステム
Websocketではなく、Dynamo直でいいかも
1レコードにしてみよう

フロントで、チーム分け、レート変更などすべて行う。
Discord用に、チーム分け、レート変更のAPI作る


## 概要 
ゲームシステムのレーティングを使わない内戦（カスタムマッチ）向け  
まずはLoL、AoEあたりをターゲットにする  
最初はWebサービスだが、Discordと連携したい  

## 機能  

### Ver0.1  
まずは管理人は一人で管理人が全て登録する  


aws dynamodb update-item \
aws dynamodb update-item --endpoint-url http://localhost:8000 \
    --table-name test \
    --key '{ "id": {"S": "wildrift-yojo"}}' \
    --update-expression "SET user.Yojo.memo = :newval" \
    --expression-attribute-values '{":newval":{"S":"Memooo"}}' \
    --return-values ALL_NEW


aws dynamodb update-item --endpoint-url http://localhost:8000 \
    --table-name test \
    --key '{ "id": {"S": "wildrift-yojo"}}' \
    --update-expression "SET player.Yojo.rate[0].win = :newval" \
    --expression-attribute-values '{":newval":{"N":"99"}}' \
    --return-values ALL_NEW

aws dynamodb update-item --endpoint-url http://localhost:8000 \
    --table-name test \
    --key '{ "id": {"S": "wildrift-yojo"}}' \
    --update-expression "ADD player.Yojo.rate[0].win :val, player.Yojo.rate[0].lose :val" \
    --expression-attribute-values '{":val":{"N":"2"}}' \
    --return-values ALL_NEW


PYLrTKEeNJ7HAY0f
id PK wildrift+yojo

{
  "id": {
    "S": "wildrift-yojo"
  },
  "player": {
    "M": {
      "Yojo": {
        "M": {
          "gametag": {
            "S": "Yojo#JoJo"
          },
          "memo": {
            "S": "幼女先輩"
          },
          "rate": {
            "L": [
              {
                "M":{
                  "win" : {
                    "N" : "0"
                  },
                  "loose" : {
                    "N" : "0"
                  },
                  "mu" : {
                    "N" : "0"
                  },
                  "sigma" : {
                    "N" : "0"
                  }
                }
              },
              {
                "M":{
                  "win" : {
                    "N" : "0"
                  },
                  "loose" : {
                    "N" : "0"
                  },
                  "mu" : {
                    "N" : "0"
                  },
                  "sigma" : {
                    "N" : "0"
                  }
                }
              },
              {
                "M":{
                  "win" : {
                    "N" : "0"
                  },
                  "loose" : {
                    "N" : "0"
                  },
                  "mu" : {
                    "N" : "0"
                  },
                  "sigma" : {
                    "N" : "0"
                  }
                }
              },
              {
                "M":{
                  "win" : {
                    "N" : "0"
                  },
                  "loose" : {
                    "N" : "0"
                  },
                  "mu" : {
                    "N" : "0"
                  },
                  "sigma" : {
                    "N" : "0"
                  }
                }
              },
              {
                "M":{
                  "win" : {
                    "N" : "0"
                  },
                  "loose" : {
                    "N" : "0"
                  },
                  "mu" : {
                    "N" : "0"
                  },
                  "sigma" : {
                    "N" : "0"
                  }
                }
              },
              {
                "M":{
                  "win" : {
                    "N" : "0"
                  },
                  "loose" : {
                    "N" : "0"
                  },
                  "mu" : {
                    "N" : "0"
                  },
                  "sigma" : {
                    "N" : "0"
                  }
                }
              }
            ]
          }
        }
      }
    }
  }
}









```uiflow
[page1]
ユーザーが見るもの
---
ユーザーがすること

[page2]
ユーザーが見るもの
---
ユーザーがすること
==> page3
ユーザーがすること
==> page4

[page3]
ユーザーが見るもの

[page4]
ユーザーが見るもの
```

```uiflow
・管理用画面  
(パスワード変更)  
(アプリ登録)  
ユーザ登録  
マッチング  
  
  
・一般ユーザ用画面
ユーザーリスト  
マッチ結果  
(マッチリスト)  
  
  
[ユーザ登録(Admin)]
ユーザ名▽
全体レート、Topレート、Jgレート、Midレート、Botレート、Supレート
--
click: 更新


[マッチング(Admin)]
URL(マッチ開始時に作る)
合計レート                                           合計レート
User1  プレイヤー▽ レート □Top □JG □Mid □Bot □Sup    User6...
User2  プレイヤー▽ レート  □Top □JG □Mid □Bot □Sup    User7...
・・・
User5  プレイヤー▽ レート  □Top □JG □Mid □Bot □Sup    User10...
--
□レーンマッチ
click: 抽選
==> マッチング(Admin)

click: 開始
==> マッチング(Admin)  画面が全部ReadOnlyでマッチング結果のみ表示
```