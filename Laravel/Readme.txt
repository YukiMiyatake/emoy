# 経緯
PHP/Laravel案件が来たが、PHPやりたくないから断る（予想で80-90万/月）
120万/月ならどうだ？
じゃあ勉強して自信もって請けれたら請けます


# PHP歴
PHPを多少は知ってるけど業務で使った事ない
LaravelはRailsライクってぐらいしか知らぬ

基礎終わり。あとは実践。。。
なんかサンプルする？


API（レシート）
　登録済レシート？
    ResponseフラグOFF?
      Response
        Responseフラグ ON
    存在
      Error

  レシート検証API
  OK
    DB Write アイテム
      アイテム付与フラグ ON
    Response
      Response OK時のみ ResponseフラグON
  NG
    NG


receipt_ios
  receipt_id  PK
  user_id
  ...
  item_granted bool
  response_succeeded bool
  created_at
  updated_at



ユーザーのキャンセル処理の対応はゲーム次第




Gacha
ガチャ確率テーブル
10連ガチャ（1つSSR以上確定）
ゲーム内コイン、石、有償石
ボックスガチャ

ガチャシミュレータ作る





