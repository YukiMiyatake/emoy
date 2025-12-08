# LoLランクアップアプリ改善機能追加計画

## 現状分析
- マッチID取得とマッチ詳細取得のAPIは実装済み（`getMatchByMatchId`, `getAllRankedMatchIds`）
- `Match`型には詳細フィールド（`csAt10`, `visionScore`, `kda`, `damage`など）が定義されているが未使用
- 現在はLP履歴の計算のみにマッチデータを使用
- 試合詳細データの保存・分析機能が未実装

## 実装する改善機能

### 1. 試合詳細データの取得・保存機能
**ファイル**: `NovaChart/app/api/riot/fetch-match-details/route.ts` (新規)
- Riot APIから取得したマッチ詳細を解析
- プレイヤーのパフォーマンスデータ（CS、ダメージ、KDA、ビジョンスコア、ゴールド等）を抽出
- `Match`型に合わせてデータベースに保存

**変更ファイル**:
- `NovaChart/lib/riot/client.ts`: マッチ詳細解析用のヘルパー関数を追加
- `NovaChart/types/index.ts`: `Match`型に`damageDealt`, `damageTaken`, `goldEarned`, `csPerMin`等のフィールドを追加

### 2. レーン別統計・分析パネル
**ファイル**: `NovaChart/app/components/LaneStatsPanel.tsx` (新規)
- レーン（TOP, JUNGLE, MID, ADC, SUPPORT）ごとの統計を表示
- 各レーンの勝率、平均KDA、平均CS、平均ダメージ等を集計
- レーン別の推移グラフを表示

**変更ファイル**:
- `NovaChart/lib/analytics/laneStats.ts` (新規): レーン別統計計算ロジック
- `NovaChart/app/components/StatsPanel.tsx`: レーン別統計へのリンクを追加

### 3. 勝敗分析機能
**ファイル**: `NovaChart/app/components/WinLossAnalysis.tsx` (新規)
- 勝利試合と敗北試合のデータを比較
- 平均CS、平均ダメージ、平均ビジョンスコア等の差分を可視化
- 改善すべきポイントを自動提案

**変更ファイル**:
- `NovaChart/lib/analytics/winLossAnalysis.ts` (新規): 勝敗比較分析ロジック

### 4. LP以外の目標設定機能
**ファイル**: `NovaChart/app/components/SkillGoalSetting.tsx` (新規)
- CS目標（例: 10分で80CS以上）
- KDA目標（例: KDA 3.0以上）
- ビジョンスコア目標（例: 平均50以上）
- ダメージ目標（例: 平均15,000以上）
- 目標達成状況を追跡・表示

**変更ファイル**:
- `NovaChart/types/index.ts`: `SkillGoal`型を追加
- `NovaChart/lib/db/index.ts`: `skillGoals`テーブルを追加
- `NovaChart/lib/store/useAppStore.ts`: スキル目標の状態管理を追加

### 5. 試合詳細分析パネル
**ファイル**: `NovaChart/app/components/MatchDetailsPanel.tsx` (新規)
- 最近の試合一覧を表示
- 各試合の詳細（CS、ダメージ、KDA、ビジョンスコア等）を表示
- 試合ごとのパフォーマンス評価（S, A, B, C等）

**変更ファイル**:
- `NovaChart/lib/analytics/matchRating.ts` (新規): 試合評価ロジック

### 6. モチベーション向上機能
**ファイル**: `NovaChart/app/components/MotivationPanel.tsx` (新規)
- 連勝記録の表示
- ベストパフォーマンス試合の表示
- 週間/月間の改善ポイント表示
- 達成バッジシステム（例: 10連勝、100試合達成等）

**変更ファイル**:
- `NovaChart/lib/analytics/motivation.ts` (新規): モチベーション指標計算ロジック

### 7. データ可視化の強化
**変更ファイル**: `NovaChart/app/components/RateChart.tsx`
- CS推移グラフの追加
- ダメージ推移グラフの追加
- 複数指標を同時表示できるタブ機能

### 8. 自動データ取得の拡張
**変更ファイル**: `NovaChart/app/components/SummonerSearch.tsx`
- 検索時に試合詳細データも自動取得・保存
- バックグラウンドで定期的に最新試合データを取得（オプション）

## 実装順序（推奨）
1. 試合詳細データの取得・保存機能（基盤）
2. 試合詳細分析パネル（データ確認用）
3. レーン別統計パネル
4. 勝敗分析機能
5. LP以外の目標設定機能
6. モチベーション向上機能
7. データ可視化の強化

## 技術的な考慮事項
- Riot APIのレート制限に注意（1秒あたり20リクエスト、2分あたり100リクエスト）
- マッチ詳細取得は時間がかかるため、バッチ処理や非同期処理を検討
- IndexedDBの容量制限に注意（大量の試合データ保存時）
- データ取得失敗時のリトライ機能を実装

## 追加で検討すべき機能
- チャンピオン別統計・分析
- 時間帯別パフォーマンス分析（朝/昼/夜）
- 対戦相手のランク分析
- チーム構成分析（味方/敵のチャンピオン組み合わせ）
- リプレイデータの活用（Riot APIの制限により現時点では困難）

## 実装タスク詳細

### タスク1: 試合詳細データ取得API
- `NovaChart/app/api/riot/fetch-match-details/route.ts` を実装
- Riot APIからマッチ詳細を取得し、プレイヤーデータ（CS、ダメージ、KDA等）を抽出して返す

### タスク2: Match型の拡張
- `Match`型に詳細フィールド（`damageDealt`, `damageTaken`, `goldEarned`, `csPerMin`, `lane`, `damageToChampions`等）を追加

### タスク3: マッチ詳細解析ヘルパー
- `lib/riot/client.ts`にマッチ詳細解析用のヘルパー関数を追加
- Riot APIのレスポンスからプレイヤーデータを抽出

### タスク4: 自動データ取得・保存
- `SummonerSearch.tsx`で検索時に試合詳細データも自動取得・保存する機能を追加

### タスク5: 試合詳細分析パネル
- `MatchDetailsPanel.tsx` を実装
- 最近の試合一覧と各試合の詳細データを表示

### タスク6: レーン別統計計算ロジック
- `lib/analytics/laneStats.ts` を実装
- レーンごとの勝率、平均KDA、平均CS等を計算

### タスク7: レーン別統計パネル
- `LaneStatsPanel.tsx` を実装
- レーンごとの統計と推移グラフを表示

### タスク8: 勝敗分析機能
- `WinLossAnalysis.tsx` + `lib/analytics/winLossAnalysis.ts` を実装
- 勝利試合と敗北試合のデータを比較して改善ポイントを提案

### タスク9: スキル目標の型定義
- `SkillGoal`型を追加し、データベースに `skillGoals` テーブルを追加

### タスク10: スキル目標設定コンポーネント
- `SkillGoalSetting.tsx` を実装
- CS、KDA、ビジョンスコア、ダメージ等の目標を設定可能に

### タスク11: スキル目標の達成状況追跡
- スキル目標の達成状況を追跡・表示する機能を実装
- 目標達成率を計算して表示

### タスク12: モチベーション指標計算
- `lib/analytics/motivation.ts` を実装
- 連勝記録、ベストパフォーマンス、達成バッジ等を計算

### タスク13: モチベーション向上パネル
- `MotivationPanel.tsx` を実装
- 連勝記録、ベストパフォーマンス、達成バッジを表示

### タスク14: グラフ機能の拡張
- `RateChart.tsx`にCS推移グラフ、ダメージ推移グラフを追加
- 複数指標をタブで切り替え可能に

