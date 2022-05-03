# OverView
今のところWebSocketテストのプロジェクト。
今後はesports等の補助ツールとかも作りたい

# EldenTalk
エルデンリング風のチャットシステムを作りたい
## /server
ServerlessFrameworkでAPI Gateway+Websocket+DynamoDBのチャットシステムのサーバ

### 環境構築
sample.envに正しいAWS Credencialを設定し .envにファイル名変更する

```
$ cd EldenTalk/server
$ docker-compose build
$ docker-compose exec serverless /bin/bash

# npm install
```

### サーバにDeploy
```
# sls deploy -v
```

### ローカル実行＆確認
オフライン実行  エンドポイント ws://localhost:3001
```
# sls offline start --host 0.0.0.0
```
sls offline だけだとDynamodb等のプラグインが実行されない！


wscatで確認(コンテナ内でもホストからでもOK)
```
$ wscat -c ws://localhost:3001
> {"message":"sendmessage", "data":"hello world"}
```

### デバッグ
#### dynamodb-local単体で動かす
dynamodb-localの起動。 エンドポイント http://localhost:8000
```
# sls dynamodb start
```

テーブル一覧表示
```
$ aws dynamodb list-tables --endpoint-url http://localhost:8000 --region local
```

テーブル作成
```
$aws dynamodb create-table --table-name '...' --cli-input-json file://localdb.json --endpoint-url http://localhost:8000 --region local
```

データの永続化、SEEDも出来る


#### Dynamodb-admin
dynamodb-localのテーブルをGUI操作出来る
```
# npx dynamodb-admin
```
デフォルトだと localhost:8000でDynamoに接続し、http://localhost:8001 をブラウザで表示できる

## 残タスク
TypeScript化
フロント作成
ログテーブル
