# ピックバンシステム  
Pick/Banシステム
Pick/Ban以外にもARAM的なランダムチャンピオンを両チーム取り合うモードとかも欲しいかも

## Ver0.1  
Webページ限定。最初はLoL  
API Gateway+WebSocket+Lambda+DynamoDB+S3  
フロントはNext使いたい  
1: 管理者。試合を作成。ルールやパスワード設定する  
2: 青、赤チームのリーダー用(Pick/Banする人)  
3: 観戦用  

[管理者画面]  
まず管理者がマッチを作る。複数作れるようにしたいがそれは後程。  
ゲーム名、青チーム、赤チームの名前を入力  
ルール(Pick/Banの順番等)を設定  
選択時間の設定  
パスワードの設定  
開始ボタンを押したら開始。  
ログデータ作成    
青、赤(パスワード有)用のURLと観戦用のURLの作成  
案：http://hogehoge(S3のURL)/adminname/gameId/blue  
その後は観戦用画面みたいな画面になる（別途キャンセルや一時停止ボタン）  
  
[リーダー用画面]  
パスワード入力してWS接続  
開始ボタンを押しログデータに書き込み  
両者ボタン押したら開始    
サーバよりPick/Banの指示が来るのでそれに従いUIを変える  
選択～決定の2段階で、それぞれサーバに通信する  
Pick/Banを選んだらサーバに送信しログデータ書き込み    
    
[観戦用画面]  
Pick/Banのリストのみの表示  
  
  
  
  
  
### DB      
  
#### 管理者テーブル(全てのシステム共通にしたい)  
emoy-admin  
admin S PK   Yojo  
appname S SK   wildrift-pickban  
password S  
(今後ユーザリスト等を追加する)
  

#### Gameテーブル(複数する時に作る)   
emoy-pickban-games  
管理者名 S PK   Yojo  
connectionId S  xxxxxx  
gameId=CreatedAt   [S] xxxx  
  
#### ログテーブル(1日程度で消える)  
emoy-pickban-log  
管理者名 S PK   Yojo  
CreatedAt N RK  (事実上gameId)   
Title S    
TeamName [S]    
ConnectionIdAdmin S
ConnectionIdLeaders [S]     # 両チームのリーダーの
ConnectionIdSpectators [S]  # 観戦者の  
leaderPassword S   
data  [LOGDATA]   # ログデータ 
  
LOGDATA{  
  side: 0|1   # 0=Blue 1=Red  
  type: 0|1   # 0=pick 1=ban  
  result: N?  # 選択したチャンピオン番号。   
  status: 0|1 # 0=未決定 1=決定
  startAt: N
}  




### 画面  
#### 管理者(Ver 0)  
ログイン画面    
name/ID  Storageに保存。HTTP API  
(将来的に、パスワード変更、忘れた等を追加)  
  
管理画面  
ゲーム名  
青チーム名 赤チーム名  
ルール選択  
開始/削除  
  
BAN/Pick画面(観戦者とだいたい同じ)  
ゲーム名  
青チーム名 赤チーム名  
BAN/PICK状態  
時間  
(一時停止) 管理者のみ    
  
  
#### リーダー(Ver 0)  
ゲーム名  
青チーム名 赤チーム名  
BAN/PICK状態  
時間  
チャンピオン選択(ソート等はフロントで頑張りたい)    




## 今後実装したいもの  
複数ゲームの作成  
管理画面の共通化  
ランダムチャンピオンから選択(別アプリだけど、ランダムあるいは管理人が選ぶチャンプからトレード)  
