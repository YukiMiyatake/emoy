# チャンピオン推薦機能 追加プラン

## 概要
ユーザーのプレイデータとメタ情報を分析し、最適なチャンピオンを推薦する機能を追加します。AIを活用した高度な推薦システムも含みます。

**重要**: チャンピオン推薦の精度を高めるため、ソロキューだけでなく**全てのマッチタイプ**（ノーマル、フレックス、ARAMなど）と**チャンピオンマスタリーデータ**も活用します。これにより、ユーザーの総合的なプレイスタイルや得意チャンピオンをより正確に把握できます。

## 機能一覧

### 1. チャンピオン統計分析機能
**目的**: ユーザーのチャンピオン別パフォーマンスを可視化

#### 1.1 チャンピオン別統計パネル
- **実装場所**: `app/components/ChampionStatsPanel.tsx`
- **機能**:
  - チャンピオン別の勝率、KDA、CS/分、ダメージ/分を表示
  - 試合数、勝敗数、平均試合時間
  - レーン別のチャンピオンパフォーマンス
  - 時系列でのパフォーマンス推移グラフ
  - チャンピオン別の詳細統計（ビジョンスコア、ゴールド獲得など）

#### 1.2 チャンピオン統計サービス
- **実装場所**: `lib/analytics/championStats.ts`
- **機能**:
  - チャンピオン別統計の計算
  - レーン別チャンピオン統計
  - 期間別チャンピオン統計（直近7日、30日、全期間）
  - チャンピオンランキング（勝率、KDA、CS/分など）

#### 1.3 データベース拡張
- **実装場所**: `lib/db/index.ts`
- **変更内容**:
  - `championStats` テーブル追加（オプション、キャッシュ用）
  - `championMastery` テーブル追加（マスタリーデータ保存用）
  - `recommendationHistory` テーブル追加（推薦履歴保存用）
    - 推薦日時、レーン、チャンピオン、カテゴリ、推薦期間を記録
  - インデックス追加: `matches` テーブルに `champion`, `queueType` インデックス
  - `Match` 型に `queueType` フィールド追加（420=Ranked Solo/Duo, 440=Ranked Flex, 450=ARAMなど）

#### 1.4 全マッチタイプ取得機能
- **実装場所**: `lib/riot/client.ts`, `app/api/riot/fetch-all-matches/route.ts`
- **機能**:
  - ソロキュー以外のマッチタイプも取得
    - Ranked Flex (440)
    - Normal Draft (400)
    - Normal Blind (430)
    - ARAM (450)
    - その他のゲームモード
  - マッチタイプ別の統計分析
  - マッチタイプフィルター機能
  - 重み付け設定（ソロキューを重視するなど）

#### 1.5 チャンピオンマスタリー取得機能
- **実装場所**: `lib/riot/client.ts`, `app/api/riot/fetch-mastery/route.ts`
- **機能**:
  - Riot API `/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}` を使用
  - 全チャンピオンのマスタリーポイント、レベル、チェスト取得状況を取得
  - マスタリーデータの定期更新
  - マスタリーレベルに基づく推薦スコアの調整

### 2. メタ分析機能
**目的**: パッチ情報とメタデータからチャンピオンの強さを分析

#### 2.1 パッチ情報取得
- **実装場所**: `lib/riot/patchData.ts`
- **機能**:
  - Riot APIから最新パッチ情報を取得
  - チャンピオンのバフ/ナーフ情報を取得
  - パッチノートの解析（オプション）

#### 2.2 メタチャンピオン分析
- **実装場所**: `lib/analytics/metaAnalysis.ts`
- **機能**:
  - グローバルメタデータの取得（U.GG、OP.GGなどのAPI、またはスクレイピング）
  - チャンピオンのピック率、バン率、勝率の取得
  - レーン別メタチャンピオンの特定
  - メタスコアの計算（ピック率 × 勝率）

#### 2.3 メタ情報パネル
- **実装場所**: `app/components/MetaAnalysisPanel.tsx`
- **機能**:
  - 現在のメタチャンピオン一覧表示
  - レーン別メタチャンピオンランキング
  - バフ/ナーフ情報の表示
  - メタの変化グラフ（時系列）

### 3. AI推薦機能
**目的**: ユーザーのプレイスタイルとデータから最適なチャンピオンを推薦

#### 3.1 プレイスタイル分析
- **実装場所**: `lib/ai/playstyleAnalysis.ts`
- **機能**:
  - ユーザーのプレイパターン分析
    - アグレッシブ度（KDA、ダメージ/分から算出）
    - ファーミング重視度（CS/分から算出）
    - サポート性（アシスト数、ビジョンスコアから算出）
    - レーン適性（各レーンの勝率から算出）
  - プレイスタイルベクトルの生成

#### 3.2 チャンピオン類似度分析
- **実装場所**: `lib/ai/championSimilarity.ts`
- **機能**:
  - チャンピオンの特性ベクトル化
    - ダメージタイプ（物理/魔法/混合）
    - プレイスタイル（アグレッシブ/ディフェンシブ）
    - レーン適性
    - スキル難易度
  - コサイン類似度によるチャンピオン類似度計算
  - ユーザーの得意チャンピオンに類似したチャンピオン推薦

#### 3.3 AI推薦エンジン
- **実装場所**: `lib/ai/recommendationEngine.ts`
- **機能**:
  - **レーン別推薦システム**: 各レーンごとに複数のチャンピオンを推薦
  - **期間ベース再抽選**: 一定期間（デフォルト1週間）ごとに自動的に再抽選
  - **多様性確保**: 毎回同じチャンピオンにならないよう、過去の推薦履歴を記録し、重複を避ける
  - **ランダム性の導入**: 完全に決定論的ではなく、ある程度のランダム要素を含める

  - **推薦カテゴリ別選出**（各レーンごとに各カテゴリから数体ずつ選出）:
    1. **メタベース推薦** (2-3体)
       - 現在のメタで強いチャンピオン
       - ピック率・勝率が高いチャンピオン
       - バフを受けたチャンピオン
       - レーン別メタティア（S/A/B）から選出
    2. **プロフィールベース推薦** (2-3体)
       - ユーザーのプレイスタイルに合うチャンピオン
       - 得意チャンピオンに類似したチャンピオン
       - 過去のパフォーマンスが良いチャンピオン
       - プレイスタイルベクトルとの類似度が高いチャンピオン
    3. **低使用頻度推薦** (1-2体)
       - 最近使っていないが、過去に良い成績を残したチャンピオン
       - マスタリーポイントは高いが、直近30日で使用回数が少ないチャンピオン
       - 再発見・再挑戦を促すチャンピオン
    4. **ランダム推薦** (1-2体)
       - 完全にランダムな選出（ただし、そのレーンでプレイ可能なチャンピオンのみ）
       - ユーザーが試したことがないチャンピオンの発見を促進
       - 多様性を確保するための要素

  - **推薦履歴管理**:
    - 過去の推薦チャンピオンを記録（`recommendationHistory` テーブル）
    - 再抽選時に過去N回の推薦から除外（デフォルト: 過去2回分）
    - 除外期間を設定可能（例: 過去2週間は同じチャンピオンを推薦しない）

  - **推薦スコアの計算**:
    - 各カテゴリごとに異なるスコアリング方法
    - マスタリーレベルによるボーナス（レベル5以上で+10%、レベル7で+20%）
    - マッチタイプ別の重み付け（ソロキュー: 1.0, フレックス: 0.8, ノーマル: 0.6, ARAM: 0.4）
    - ランダム要素の追加（±10%のランダム変動）

  - **レーン別推薦数**:
    - 各レーンごとに合計6-10体のチャンピオンを推薦
    - カテゴリごとの配分は設定可能（デフォルト: メタ2-3体、プロフィール2-3体、低使用頻度1-2体、ランダム1-2体）

#### 3.4 AI推薦パネル
- **実装場所**: `app/components/ChampionRecommendationPanel.tsx`
- **機能**:
  - **レーン別タブ表示**: TOP, JUNGLE, MID, ADC, SUPPORTのタブで切り替え
  - **カテゴリ別グループ表示**: 
    - メタベース推薦
    - プロフィールベース推薦
    - 低使用頻度推薦
    - ランダム推薦
    - 各カテゴリにバッジやアイコンで識別
  - **チャンピオンカード表示**:
    - チャンピオン画像
    - 推薦理由の表示（なぜこのチャンピオンがおすすめか）
    - カテゴリバッジ（メタ/プロフィール/低使用頻度/ランダム）
    - 関連統計（勝率、試合数、マスタリーレベルなど）
  - **再抽選機能**:
    - 「新しい推薦を取得」ボタン（期間が経過していなくても手動で再抽選可能）
    - 次回自動再抽選までの残り時間表示
    - 再抽選設定（期間の変更、カテゴリ別の推薦数を調整）
  - **推薦履歴表示**:
    - 過去の推薦チャンピオン一覧
    - どのチャンピオンを選んだかの記録（オプション）
  - **フィルター機能**:
    - カテゴリ別フィルター（メタのみ、プロフィールのみなど）
    - マスタリーレベルフィルター
    - 試合数フィルター

#### 3.5 外部AI API統合（オプション）
- **実装場所**: `lib/ai/externalAI.ts`
- **機能**:
  - OpenAI API / Anthropic Claude API との統合
  - 自然言語での推薦理由生成
  - より高度な分析（試合データの詳細分析）
  - カスタムプロンプトによる推薦

### 4. チャンピオン比較機能
**目的**: 複数のチャンピオンを比較して最適な選択を支援

#### 4.1 チャンピオン比較パネル
- **実装場所**: `app/components/ChampionComparisonPanel.tsx`
- **機能**:
  - 最大5つのチャンピオンを同時比較
  - 統計の並列表示（勝率、KDA、CS/分など）
  - レーダーチャートによる可視化
  - メタ情報との比較

#### 4.2 マッチアップ分析
- **実装場所**: `lib/analytics/matchupAnalysis.ts`
- **機能**:
  - 特定のチャンピオンに対する勝率分析
  - カウンターチャンピオンの特定
  - シナジーチャンピオンの特定（チーム構成との相性）

### 5. 統合ダッシュボード
**目的**: すべてのチャンピオン関連情報を一箇所に集約

#### 5.1 チャンピオンダッシュボード
- **実装場所**: `app/components/ChampionDashboard.tsx`
- **機能**:
  - チャンピオン統計、メタ分析、AI推薦を統合表示
  - タブまたはセクションで切り替え
  - クイックアクション（チャンピオン選択、比較など）

## 実装順序（フェーズ分け）

### フェーズ1: 基礎統計機能（優先度: 高）
1. データベース拡張（1.3）
2. 全マッチタイプ取得機能（1.4）
3. チャンピオンマスタリー取得機能（1.5）
4. チャンピオン統計分析機能（1.1, 1.2）- 全マッチタイプ対応
5. チャンピオン統計パネルのUI実装

**見積もり**: 5-7日

### フェーズ2: メタ分析機能（優先度: 中）
1. パッチ情報取得（2.1）
2. メタチャンピオン分析（2.2）
3. メタ情報パネル（2.3）

**見積もり**: 5-7日

### フェーズ3: AI推薦機能（優先度: 高）
1. プレイスタイル分析（3.1）
2. チャンピオン類似度分析（3.2）
3. 推薦履歴管理システム（データベース拡張含む）
4. AI推薦エンジン（3.3）
   - カテゴリ別推薦アルゴリズム実装
   - ランダム性の導入
   - 推薦履歴による重複回避
   - 期間ベース再抽選ロジック
5. AI推薦パネル（3.4）
   - レーン別タブ表示
   - カテゴリ別グループ表示
   - 再抽選機能
   - 推薦履歴表示

**見積もり**: 10-14日

### フェーズ4: 高度な機能（優先度: 低）
1. 外部AI API統合（3.5）
2. チャンピオン比較機能（4.1, 4.2）
3. 統合ダッシュボード（5.1）

**見積もり**: 5-7日

## 技術スタック

### 既存技術
- Next.js (App Router)
- TypeScript
- Dexie (IndexedDB)
- Recharts (グラフ表示)
- Tailwind CSS

### 追加技術
- **AI/ML**: 
  - ベクトル計算: 自前実装（コサイン類似度など）
  - 外部API: OpenAI API / Anthropic Claude API（オプション）
- **メタデータ取得**:
  - Riot API（パッチ情報）
  - 外部API（U.GG、OP.GGなど）またはスクレイピング
- **データ可視化**:
  - Recharts（既存）
  - レーダーチャート用ライブラリ（必要に応じて）

## データ構造

### チャンピオン統計型定義
```typescript
export interface ChampionStatistics {
  champion: string;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKDA: number;
  averageKills: number;
  averageDeaths: number;
  averageAssists: number;
  averageCSPerMin: number;
  averageDamagePerMin: number;
  averageVisionScore: number;
  averageGoldEarned: number;
  averageKillParticipation: number;
  lanes: string[]; // プレイしたレーン
  laneStats: Map<string, LaneChampionStats>; // レーン別統計
  queueTypeStats: Map<string, QueueTypeStats>; // マッチタイプ別統計
  recentTrend: 'improving' | 'declining' | 'stable'; // 最近の傾向
  masteryLevel?: number; // マスタリーレベル（1-7）
  masteryPoints?: number; // マスタリーポイント
  lastPlayed?: Date; // 最後にプレイした日時
}

export interface QueueTypeStats {
  queueType: string; // 'RANKED_SOLO_5x5', 'RANKED_FLEX_SR', 'ARAM', etc.
  queueName: string; // 表示名
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKDA: number;
}

export interface ChampionMastery {
  puuid: string;
  championId: number;
  championName: string;
  championLevel: number; // 1-7
  championPoints: number; // マスタリーポイント
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  chestGranted: boolean;
  tokensEarned: number;
  lastPlayTime: number; // タイムスタンプ
  lastUpdated: Date;
}

export interface ChampionMasteryData {
  champion: string;
  level: number;
  points: number;
  chestGranted: boolean;
  lastPlayed: Date;
  tokensEarned: number;
}

export interface MetaChampionData {
  champion: string;
  patch: string;
  pickRate: number;
  banRate: number;
  winRate: number;
  metaScore: number; // ピック率 × 勝率
  tier: 'S' | 'A' | 'B' | 'C' | 'D'; // メタティア
  buffs: string[]; // バフ情報
  nerfs: string[]; // ナーフ情報
  lanes: string[]; // メタレーン
}

export interface ChampionRecommendation {
  champion: string;
  score: number; // 0-100の推薦スコア
  reasons: string[]; // 推薦理由
  recommendationCategory: 'meta' | 'profile' | 'lowUsage' | 'random'; // 推薦カテゴリ
  lane: string;
  confidence: number; // 0-1の信頼度
  masteryLevel?: number; // マスタリーレベル
  masteryPoints?: number; // マスタリーポイント
  matchCount?: number; // 総試合数（全マッチタイプ含む）
  soloQueueWinRate?: number; // ソロキュー勝率
  overallWinRate?: number; // 全マッチタイプの勝率
  lastPlayed?: Date; // 最後にプレイした日時
  daysSinceLastPlay?: number; // 最後にプレイしてからの日数
}

export interface RecommendationSet {
  id?: number;
  lane: string; // TOP, JUNGLE, MID, ADC, SUPPORT
  generatedAt: Date; // 生成日時
  validUntil: Date; // 有効期限（再抽選日時）
  recommendations: ChampionRecommendation[]; // 推薦チャンピオン一覧
  settings: RecommendationSettings; // 生成時の設定
}

export interface RecommendationSettings {
  refreshPeriodDays: number; // 再抽選期間（デフォルト: 7日）
  metaCount: number; // メタベース推薦数（デフォルト: 2-3）
  profileCount: number; // プロフィールベース推薦数（デフォルト: 2-3）
  lowUsageCount: number; // 低使用頻度推薦数（デフォルト: 1-2）
  randomCount: number; // ランダム推薦数（デフォルト: 1-2）
  excludeRecentCount: number; // 過去N回の推薦から除外（デフォルト: 2）
  randomVariation: number; // ランダム変動幅（デフォルト: 0.1 = ±10%）
}

export interface RecommendationHistory {
  id?: number;
  lane: string;
  champion: string;
  category: 'meta' | 'profile' | 'lowUsage' | 'random';
  generatedAt: Date;
  validUntil: Date;
  selected?: boolean; // ユーザーが選択したかどうか（オプション）
}
```

## API設計

### 内部API（クライアント側）
```typescript
// lib/services/championService.ts
export const championService = {
  getChampionStatistics(
    champion?: string, 
    lane?: string, 
    dateRange?: DateRange,
    queueTypes?: string[] // フィルター用
  ): Promise<ChampionStatistics[]>;
  getChampionMastery(puuid: string): Promise<ChampionMasteryData[]>;
  getMetaChampions(lane?: string, patch?: string): Promise<MetaChampionData[]>;
  getRecommendations(
    lane?: string, 
    preferences?: RecommendationPreferences,
    includeAllMatchTypes?: boolean // 全マッチタイプを含めるか
  ): Promise<ChampionRecommendation[]>;
  compareChampions(champions: string[]): Promise<ChampionComparison>;
  getChampionSimilarity(champion: string): Promise<SimilarChampion[]>;
};

// lib/services/recommendationService.ts (新規)
export const recommendationService = {
  /**
   * レーン別の推薦セットを生成
   * @param lane レーン（TOP, JUNGLE, MID, ADC, SUPPORT）
   * @param settings 推薦設定
   * @param forceRefresh 強制的に再生成するか（期間を無視）
   */
  generateRecommendationSet(
    lane: string,
    settings?: Partial<RecommendationSettings>,
    forceRefresh?: boolean
  ): Promise<RecommendationSet>;
  
  /**
   * 現在有効な推薦セットを取得（期限切れの場合は自動生成）
   */
  getCurrentRecommendationSet(lane: string): Promise<RecommendationSet>;
  
  /**
   * 全レーンの推薦セットを取得
   */
  getAllRecommendationSets(): Promise<Map<string, RecommendationSet>>;
  
  /**
   * 推薦履歴を取得
   */
  getRecommendationHistory(
    lane?: string,
    limit?: number
  ): Promise<RecommendationHistory[]>;
  
  /**
   * 推薦を選択したことを記録（オプション）
   */
  recordSelection(
    lane: string,
    champion: string,
    category: string
  ): Promise<void>;
  
  /**
   * 推薦設定を更新
   */
  updateSettings(settings: Partial<RecommendationSettings>): Promise<void>;
};

// lib/services/matchService.ts (拡張)
export const matchService = {
  // 既存メソッド...
  getAllByQueueType(queueType: string): Promise<Match[]>;
  getChampionMatchesByQueueType(
    champion: string, 
    queueType: string
  ): Promise<Match[]>;
};

// lib/services/masteryService.ts (新規)
export const masteryService = {
  getAll(puuid: string): Promise<ChampionMastery[]>;
  getByChampion(puuid: string, championId: number): Promise<ChampionMastery | null>;
  getTopChampions(puuid: string, limit?: number): Promise<ChampionMastery[]>;
  refresh(puuid: string, region: string, apiKey: string): Promise<void>;
};
```

### 外部API（サーバー側、必要に応じて）
```typescript
// app/api/champions/meta/route.ts
// app/api/champions/recommendations/route.ts
// app/api/champions/patch-info/route.ts
// app/api/riot/fetch-all-matches/route.ts - 全マッチタイプ取得
// app/api/riot/fetch-mastery/route.ts - マスタリーデータ取得
```

### Riot API エンドポイント拡張
```typescript
// lib/riot/client.ts に追加
export class RiotApiClient {
  // 既存メソッド...
  
  /**
   * 全マッチタイプのマッチIDを取得
   * @param puuid プレイヤーのPUUID
   * @param maxMatches 最大取得数
   * @param queueTypes 取得するキューIDの配列（省略時は全タイプ）
   */
  async getAllMatchIdsByQueueTypes(
    puuid: string, 
    maxMatches: number = 100,
    queueTypes?: number[]
  ): Promise<Map<number, string[]>>;
  
  /**
   * チャンピオンマスタリー情報を取得
   * @param puuid プレイヤーのPUUID
   * @param championId チャンピオンID（省略時は全チャンピオン）
   */
  async getChampionMastery(
    puuid: string, 
    championId?: number
  ): Promise<ChampionMastery[]>;
  
  /**
   * 全チャンピオンのマスタリーポイント合計を取得
   */
  async getTotalMasteryScore(puuid: string): Promise<number>;
}
```

**キューID一覧**:
- 420: Ranked Solo/Duo
- 440: Ranked Flex
- 400: Normal Draft
- 430: Normal Blind
- 450: ARAM
- 700: Clash
- など

## UI/UX設計

### チャンピオン統計パネル
- チャンピオン一覧（カード形式）
- フィルター（レーン、試合数、勝率など）
- ソート機能
- 詳細モーダル

### AI推薦パネル
- レーン選択タブ
- 推薦チャンピオンカード（スコア、理由表示）
- 推薦設定（メタ重視/パフォーマンス重視のスライダー）
- 推薦履歴（過去の推薦と結果）

### チャンピオン比較パネル
- チャンピオン選択UI
- 並列統計表示
- レーダーチャート
- 差分ハイライト

## パフォーマンス考慮

1. **データキャッシュ**: 
   - メタデータは1日1回更新
   - マスタリーデータは6時間ごとに更新（頻繁に変動しないため）
   - マッチデータは既存のキャッシュ戦略を継続
2. **インデックス**: チャンピオン、レーン、日付、queueTypeでインデックス
3. **遅延読み込み**: 大量データはページネーション
4. **計算の最適化**: 統計計算はメモ化
5. **バッチ処理**: 全マッチタイプの取得は並列処理で効率化
6. **データフィルタリング**: クライアント側でマッチタイプフィルターを適用可能に

## セキュリティ考慮

1. **APIキー管理**: 外部APIキーは環境変数で管理
2. **レート制限**: Riot APIのレート制限を遵守
3. **データプライバシー**: ユーザーデータはローカルに保存

## テスト計画

1. **ユニットテスト**: 統計計算ロジック
2. **統合テスト**: API連携
3. **E2Eテスト**: UI操作フロー

## 今後の拡張可能性

1. **チーム構成分析**: チーム全体でのチャンピオン推薦
2. **対戦相手分析**: 相手チーム構成に基づく推薦
3. **ビルド推薦**: アイテムビルドの推薦
4. **ランク別メタ**: ランク帯別のメタ分析
5. **コミュニティデータ**: 他のユーザーとの比較
6. **マッチタイプ別推薦**: ソロキュー用、フレックス用など、マッチタイプ別の推薦
7. **マスタリー進捗追跡**: マスタリーレベルの上昇を追跡し、次のレベルアップを推奨
8. **チェスト管理**: チェスト未取得のチャンピオンを優先的に推薦

## 参考資料

- Riot API Documentation: https://developer.riotgames.com/
  - Champion Mastery v4: https://developer.riotgames.com/apis#champion-mastery-v4
  - Match v5: https://developer.riotgames.com/apis#match-v5
  - Queue Types: https://static.developer.riotgames.com/docs/lol/queues.json
- U.GG API (非公式): スクレイピングまたは非公式API
- OP.GG: スクレイピング（利用規約確認必要）

## 実装上の注意点

### マッチタイプの扱い
- **ソロキュー優先**: レート追跡の主要機能として、ソロキューのデータは既存の実装を維持
- **全マッチタイプの統合**: チャンピオン推薦では全マッチタイプを考慮するが、重み付けでソロキューを重視
- **データ分離**: レート追跡とチャンピオン推薦でデータの扱いを明確に分離

### マスタリーデータの活用
- **推薦スコアへの反映**: マスタリーレベルが高いチャンピオンは推薦スコアにボーナス
- **未使用チャンピオンの発見**: マスタリーポイントは高いが最近使っていないチャンピオンを推薦
- **習熟度の評価**: マスタリーポイントと試合数の両方を考慮して習熟度を評価

### 推薦システムの実装
- **多様性の確保**: 
  - 各カテゴリから均等に選出することで、多様な推薦を実現
  - ランダム要素により、毎回異なる推薦を生成
  - 推薦履歴を記録し、過去の推薦を避ける
- **再抽選のタイミング**:
  - デフォルトで1週間ごとに自動再抽選
  - ユーザーが手動で再抽選することも可能
  - 期限切れの推薦セットは自動的に更新
- **カテゴリ別の選出ロジック**:
  - **メタベース**: メタティアS/Aから優先的に選出、ランダム性を加えて多様性を確保
  - **プロフィールベース**: プレイスタイル類似度が高い順に選出、上位からランダムに選択
  - **低使用頻度**: 直近30日で使用回数が少ない順に選出、マスタリーポイントが高いものを優先
  - **ランダム**: そのレーンでプレイ可能な全チャンピオンから完全ランダムに選出
- **重複回避**:
  - 同じ推薦セット内で同じチャンピオンが複数カテゴリに選出されないようにする
  - 過去N回（デフォルト2回）の推薦から除外
  - 除外期間は設定可能

### パフォーマンス最適化
- **段階的データ取得**: まずソロキューのみ取得し、必要に応じて他のマッチタイプを取得
- **バックグラウンド更新**: マスタリーデータはバックグラウンドで更新
- **ユーザー設定**: どのマッチタイプを分析に含めるかユーザーが選択可能に
- **推薦セットのキャッシュ**: 有効期限内の推薦セットはキャッシュして再利用
- **遅延生成**: 推薦セットは必要になった時点で生成（初回アクセス時など）

