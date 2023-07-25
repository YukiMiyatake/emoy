レーティングシステム

まずはDynamoDBの1レコードで試してみる

$ docker run -d -p 8000:800 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb

$ dynamodb-admin

aws dynamodb update-item --endpoint-url http://localhost:8000 \
>     --table-name test \
>     --key '{ "id": {"S": "wildrift-yojo"}}' \
>     --update-expression "ADD player.Yojo.rate[0].win :val, player.Yojo.rate[0].loose -:val" \
>     --expression-attribute-values '{":val":{"N":"2"}}' \
>     --return-values ALL_NEW

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






AOE2で考える？？


Main
--
ID
name  


user
---
ID
name    25
mu      9
sigma   12



