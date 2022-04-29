今のところWebSocketテストのプロジェクト。

/server
ServerlessFrameworkでAPI Gateway+Websocket+DynamoDBのチャットシステムのサーバ

$ docker-compose build
$ docker-compose exec serverless /bin/bash
でコンソールに入る
最初に
$ npm install
する

$ sls dynamodb start
Dynamodb-localだけ動かす

$aws dynamodb list-tables --endpoint-url http://localhost:8000
$aws dynamodb create-table --table-name 'elden-talk-dev' --cli-input-json file://localdb.json --endpoint-url http://localhost:8000


$ sls offline
オフライン実行

$  sls deploy -v
デプロイ

$ wscat -c ws://...
> {"message":"sendmessage", "data":"hello world"}

$sls offline --host 0.0.0.0
で起動(0.0.0.0 が重要)


