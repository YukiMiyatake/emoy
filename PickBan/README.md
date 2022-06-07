# ウェイティングリスト  
参加型配信で、参加ウェイティングリスト


# 環境構築  
## Server  
### .envを設定
sample.envをコピーして.envファイルを作る

```
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

AWSのCredencialを設定する

### server/.envを設定
server/sample.envをコピーしてserver/.envファイルを作る
TODO:// ルートディレクトリの.envと統合して、COPYするなり環境変数で設定なり行いたい

```
JWS_SECRET_KEY=
```

サーバ側(democlient)と同じHS256のキー（任意文字列）を設定する


## Docker作成&ローカル実行確認
```
$ docker-compose build
$ docker-compose up -d
$ docker-compose exec emoy-waitinglist /bin/bash
# sls offline start --host 0.0.0.0
```

上記でエラーが無い事を確認する

別のシェルよりwscatで確認

```
# wscat -c ws://localhost:3001
> {"action":"hello"}
< {message : hello}
```

上記でエラーが出ない事を確認する
（現在、JWT対応もあり、データ送信確認が出来ないので、今後確認用のメッセージを作るかも）




## デプロイする

```
# sls deploy
Running "serverless" from node_modules

Deploying chatapp to stage dev (us-east-1)

✔ Service deployed to stack chatapp-dev (111s)

endpoint: wss://xxxxx.execute-api.us-east-1.amazonaws.com/dev
functions:
  connect: chatapp-dev-connect (59 MB)
  ...
```

## クライアントをデプロイする



## デバッグのTips

### WebSocketのメッセージテスト
democlientをローカル接続してテストを行う事が可能だが
wscatを使い、生WebSocketでテストも可能

```
$ wscat -c ws://localhost:3001
> {"action":"hello"}
```

### dynamodb-local
dynamodb-localを単体で動作させる。 エンドポイント http://localhost:8000
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
  




## Ver0.1  
Webページ限定  
API Gateway+WebSocket+Lambda+DynamoDB+S3  
フロントエンドはライブラリを使わずベタで(軽量化)  
管理人画面と参加用画面の2画面  
  
  
### DB      
#### 管理者テーブル(全てのシステム共通にしたい)  
```
emoy-manage-${sls:stage}  
admin       S PK    Yojo  
appname     S SK    wildrift-waiting  
password    S       qwertyuiop@[]  
(今後ユーザリスト等を追加する)
```
  
#### 接続管理テーブル  
```
emoy-waitinglist-connection-${sls:stage}  
admin S PK  
username S SK  
connectionId S    
```
  
#### ログテーブル(1日程度で消える)  
```
emoy-waitinglist-log-${sls:stage}  
admin S PK  
title S    
maxMember N  
members[参加者] S
createdAt N    
```

### 画面  
#### 管理者  
ユーザ名   パスワード    [ログイン]  
試合1  タイトル  募集人数   ユーザ1 ・・・ ユーザN   [募集開始] [募集終了][削除]  
試合2  タイトル  募集人数   ユーザ1 ・・・ ユーザN   [募集開始] [募集終了][削除]  
試合3  タイトル  募集人数   ユーザ1 ・・・ ユーザN   [募集開始] [募集終了][削除]  

[全削除]  


#### ユーザ
ユーザ名  
試合1  タイトル  募集人数   ユーザ1 ・・・ ユーザN   [参加/キャンセル]  
試合2  タイトル  募集人数   ユーザ1 ・・・ ユーザN   [参加/キャンセル]  
試合3  タイトル  募集人数   ユーザ1 ・・・ ユーザN   [参加/キャンセル]  

### API(WebSocket)  
#### *Admin ログイン
$connectにて、認証を行う
認証方法は色々ある  
https://websockets.readthedocs.io/en/latest/topics/authentication.html    
- メッセージに認証情報をつける   
どのルートでも、任意の場所で可能  
- URLのQueryParameterで行う  
$connectルートのみ  
- HTTPのカスタムヘッダで行う  
$connectルートのみ  
URLに直にクレデンシャルが出ない  
- Cookieで認証する  
WebSocketとHTMLが異なるドメインの場合、対応出来ない  
API Gatewayを使う、CloudFrontを置いたりの関係で難しいかもしれない  
- URIにUserInformationを付ける  
`ws://token:${token}@.../` こんなやつ  
$connectルートのみ    
API Gatewayだと多分対応できない  
ブラウザも新しいバージョンでないと対応していない  
  
これらを色々考えて一つの案。Bearerトークンではあるが  
例えば現在時刻等を HS256で user:pass などのキーで暗号化し  
カスタムヘッダにてBearerトークンとして作る  
サーバでDBから読んだ user:passで複合を行い、現在時刻と大きなズレがなければOK  
これにより、ネットワークにパスワードが流れる、同じTokenを繰り返し使う事 を防げる  
もちろん、wssにしてTLSにしてヘッダで送れば暗号化されるが、TLSを使いたくない場合でもOK  
マジ天才  

#### *Admin パスワード変更
#### *Admin 名前変更

#### Admin ログ全削除
Action: 

#### 共通 ログ取得
#### Admin 募集開始
#### Admin 募集終了
#### Admin 1ログ削除

#### ユーザ 参加
#### ユーザ キャンセル


## 今後実装したいもの  
ユーザリスト作成＆一意に  
管理者がユーザ参加させれるように  
Youtube等のコメントから作成  
OBS用のHTML出力  
鍵部屋、レーン等  
  

