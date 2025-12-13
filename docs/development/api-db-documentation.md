# API・DB 取得・保存 ドキュメント

このドキュメントでは、NovaChartアプリケーションにおけるAPI呼び出しとデータベース（IndexedDB）への保存に関する詳細を説明します。

## 目次

1. [概要](#概要)
2. [APIキー管理](#apiキー管理)
3. [サマナー検索フロー](#サマナー検索フロー)
4. [データ更新フロー](#データ更新フロー)
5. [データベーススキーマ](#データベーススキーマ)
6. [LP関連データの取得と保存](#lp関連データの取得と保存)
7. [マッチデータの取得と保存](#マッチデータの取得と保存)
8. [APIエンドポイント一覧](#apiエンドポイント一覧)

---

## 概要

NovaChartは、Riot Games APIを使用してリーグ・オブ・レジェンドのプレイヤーデータを取得し、IndexedDB（Dexie.js）を使用してクライアント側でデータを保存します。

### 重要な制約事項

⚠️ **CRITICAL**: NovaChartは**ソロキュー（RANKED_SOLO_5x5）のみ**をサポートしています。
- フレックスキュー（RANKED_FLEX_SR）やその他のキュー種別のデータは保存されません
- リーグエントリー、レート履歴、マッチデータはすべてソロキューのみです

---

## APIキー管理

### ストレージ場所

APIキーは`localStorage`に保存されます。

- **キー名**: `riot_api_key`
- **リージョン**: `riot_api_region`（デフォルト: `jp1`）

### StorageService

`lib/utils/storage.ts`で提供される`StorageService`クラスを使用してAPIキーを管理します。

```typescript
// APIキーの取得
const apiKey = StorageService.getApiKey(); // string | null

// APIキーの設定
StorageService.setApiKey('your-api-key');

// APIキーの削除
StorageService.removeApiKey();

// リージョンの取得
const region = StorageService.getApiRegion(); // string (デフォルト: 'jp1')

// リージョンの設定
StorageService.setApiRegion('na1');
```

### APIキーの使用優先順位

1. **リクエストパラメータ**: API呼び出し時に`apiKey`パラメータとして渡された値
2. **環境変数**: `process.env.RIOT_API_KEY`（サーバーサイドのみ）

### 設定UI

`app/components/ApiKeySettings.tsx`コンポーネントで、ユーザーがAPIキーを設定・管理できます。

---

## サマナー検索フロー

### 検索プロセス

`app/components/SummonerSearch/useSummonerSearch.ts`の`search`関数が検索処理を実行します。

#### 1. Riot IDの検証

```typescript
// 形式: "ゲーム名#タグライン" (例: "PlayerName#JP1")
const parts = riotId.split('#');
if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) {
  throw new Error('Riot IDを「ゲーム名#タグライン」の形式で入力してください');
}
```

#### 2. APIキーの確認

```typescript
const apiKey = StorageService.getApiKey();
if (!apiKey) {
  throw new Error('APIキーが必要です。右上の「APIキー設定」からAPIキーを設定してください。');
}
```

#### 3. アカウント情報の取得

**エンドポイント**: `/api/riot/account/by-riot-id`

```typescript
const url = `${API_ENDPOINTS.RIOT.ACCOUNT_BY_RIOT_ID}?gameName=${gameName}&tagLine=${tagLine}&region=${region}&apiKey=${apiKey}`;
const response = await fetch(url);
const data = await response.json();
const summonerData = data?.summoner || data;
```

**レスポンス**:
- `account`: アカウント情報（puuid含む）
- `summoner`: サマナー情報（id, name, profileIconId, summonerLevel等）

#### 4. サマナー情報の補完

`name`が欠落している場合、`puuid`を使用してサマナーAPIから取得します。

```typescript
if (!summonerData.name) {
  const client = new RiotApiClient(apiKey, region);
  const fullSummonerData = await client.getSummonerByPuuid(summonerData.puuid);
  // 欠落フィールドをマージ
}
```

#### 5. サマナーの保存

```typescript
const { summonerService } = await import('@/lib/db');
await summonerService.addOrUpdate(summoner);
```

#### 6. リーグエントリーの取得（ソロキューのみ）

**エンドポイント**: `/api/riot/league-by-puuid`

```typescript
const leagueResponse = await fetch(
  `${API_ENDPOINTS.RIOT.LEAGUE_BY_PUUID}?puuid=${puuid}&region=${region}&queueType=${DEFAULTS.QUEUE_TYPE}&apiKey=${apiKey}`
);
const leagueData = await leagueResponse.json();
const entry = extractLeagueEntry(leagueData.entry);

// ⚠️ CRITICAL: ソロキューのみを受け入れる
if (entry.queueType === 'RANKED_SOLO_5x5') {
  setCurrentLeagueEntry(entry);
  await leagueEntryService.addOrUpdate(puuid, entry);
} else {
  // 非ソロキューは拒否し、DBから削除
  await leagueEntryService.delete(puuid);
}
```

#### 7. レート履歴の自動取得

検索成功後、自動的にレート履歴を取得します（後述）。

#### 8. マッチ詳細の自動取得

検索成功後、自動的にマッチ詳細を取得します（後述）。

---

## データ更新フロー

### 更新ボタンの処理

`app/page.tsx`の`handleUpdate`関数が更新処理を実行します。

#### 1. サマナー情報の更新

```typescript
const summonerResponse = await fetch(
  `${API_ENDPOINTS.RIOT.SUMMONER_BY_PUUID}?puuid=${puuid}&region=${region}&apiKey=${apiKey}`
);
const summonerData = await summonerResponse.json();
const updatedSummoner: Summoner = {
  ...summonerData,
  lastUpdated: new Date(),
};
setCurrentSummoner(updatedSummoner);
await summonerService.addOrUpdate(updatedSummoner);
```

#### 2. リーグエントリーの更新（ソロキューのみ）

```typescript
const leagueResponse = await fetch(
  `${API_ENDPOINTS.RIOT.LEAGUE_BY_PUUID}?puuid=${puuid}&region=${region}&queueType=${DEFAULTS.QUEUE_TYPE}&apiKey=${apiKey}`
);
const leagueData = await leagueResponse.json();
if (leagueData.entry) {
  const entry = extractLeagueEntry(leagueData.entry);
  if (entry.queueType === 'RANKED_SOLO_5x5') {
    setCurrentLeagueEntry(entry);
    await leagueEntryService.addOrUpdate(puuid, entry);
  } else {
    // 非ソロキューは拒否
    await leagueEntryService.delete(puuid);
  }
} else {
  // エントリーが見つからない場合は削除
  await leagueEntryService.delete(puuid);
  setCurrentLeagueEntry(null);
}
```

#### 3. レート履歴の更新

レート履歴APIを呼び出して、新しいマッチデータからレート履歴を取得・保存します。

#### 4. マッチ詳細の更新

新しいマッチIDを取得し、既存でないマッチのみを詳細取得・保存します。

---

## データベーススキーマ

### IndexedDB（Dexie.js）

データベース名: `NovaChartDB_v6`

⚠️ **NOTE**: データベース名が`v5`から`v6`に変更されました。これは、`leagueEntries`テーブルのプライマリキーを`puuid`から`leagueId`に変更するためです（Dexieでは既存テーブルのプライマリキー変更がサポートされていないため、新しいデータベースを作成します）。

**バージョン履歴**:
- **NovaChartDB_v5** (現在):
  - Version 1: 初期スキーマ（`leagueId`をプライマリキーとして使用）
- **NovaChartDB_v4** (旧):
  - Version 1-5: 旧スキーマ（`puuid`をプライマリキーとして使用）

### テーブル一覧

#### 1. `summoners` - サマナー情報

**プライマリキー**: `puuid` (string)

```typescript
interface Summoner {
  id?: string;              // オプション（puuidが主キー）
  puuid: string;            // 必須・プライマリキー
  name: string;
  profileIconId: number;
  summonerLevel: number;
  region: string;
  lastUpdated: Date;
}
```

**インデックス**: `&puuid, id, name, region, lastUpdated`

**サービス**: `summonerService`
- `getByPuuid(puuid: string)`: PUUIDで取得
- `getAll()`: 全件取得
- `addOrUpdate(summoner: Summoner)`: 追加または更新
- `delete(puuid: string)`: 削除

#### 2. `leagueEntries` - リーグエントリー（ソロキューのみ）

**プライマリキー**: `leagueId` (string)

⚠️ **CRITICAL**: このテーブルには**ソロキュー（RANKED_SOLO_5x5）のみ**が保存されます。

⚠️ **NOTE**: プライマリキーは`leagueId`です（Riot APIの仕様に従う）。`leagueId`はRiot APIが返すリーグエントリーの一意の識別子です。

```typescript
interface LeagueEntry {
  leagueId: string;         // プライマリキー（Riot APIのリーグID）
  queueType: string;        // 常に 'RANKED_SOLO_5x5'
  tier: string;             // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
  rank: string;             // IV, III, II, I
  leaguePoints: number;     // LP
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

// DB保存時は以下が追加される
{
  ...LeagueEntry,
  puuid: string;            // インデックス（プレイヤー識別用）
  lastUpdated: Date;
}
```

**インデックス**: `&leagueId, puuid, queueType, lastUpdated`

**サービス**: `leagueEntryService`
- `getByLeagueId(leagueId: string)`: leagueIdで取得（ソロキューのみ、非ソロキューは自動削除）
- `getByPuuid(puuid: string)`: PUUIDで取得（ソロキューのみ、非ソロキューは自動削除、puuidインデックスを使用）
- `addOrUpdate(puuid: string, entry: LeagueEntry)`: 追加または更新（ソロキューのみ、バリデーションあり、`leagueId`が必須）
- `deleteByLeagueId(leagueId: string)`: leagueIdで削除
- `delete(puuid: string)`: PUUIDで削除（puuidインデックスを使用）

**バリデーション**: 
- `addOrUpdate`メソッドは、`queueType !== 'RANKED_SOLO_5x5'`の場合にエラーをスローします。
- `addOrUpdate`メソッドは、`leagueId`が空の場合にエラーをスローします（`leagueId`はプライマリキーとして必須）。
- `getByPuuid`メソッドと`getByLeagueId`メソッドは、非ソロキューのエントリーを検出した場合、自動的に削除します。

#### 3. `rateHistory` - レート履歴

**プライマリキー**: `matchId` (string)

```typescript
interface RateHistory {
  matchId: string;          // プライマリキー（Riot APIのマッチID）
  date: Date;
  tier: string;
  rank: string;
  lp: number;
  wins: number;
  losses: number;
}
```

**インデックス**: `&matchId, date, tier, rank, lp`

**サービス**: `rateHistoryService`
- `getAll()`: 全件取得（日付順、matchIdがないエントリーは除外）
- `getByDateRange(startDate: Date, endDate: Date)`: 日付範囲で取得
- `getByMatchId(matchId: string)`: マッチIDで取得
- `getAllMatchIds()`: 全マッチIDを取得
- `add(rate: RateHistory)`: 追加（重複チェックあり、存在する場合は更新）
- `update(matchId: string, changes: Partial<RateHistory>)`: 更新
- `delete(matchId: string)`: 削除
- `getLatest()`: 最新エントリーを取得

**重複防止**: `add`メソッドは、同じ`matchId`が既に存在する場合、新規追加ではなく更新を行います。

#### 4. `matches` - マッチ詳細

**プライマリキー**: `matchId` (string)

```typescript
interface Match {
  matchId: string;          // プライマリキー
  date: Date;
  win: boolean;
  role?: string;
  champion?: string;
  kda?: { kills: number; deaths: number; assists: number };
  csAt10?: number;
  visionScore?: number;
  killParticipation?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  memo?: string;
  lane?: string;            // TOP, JUNGLE, MID, ADC, SUPPORT
  damageDealt?: number;
  damageTaken?: number;
  damageToChampions?: number;
  goldEarned?: number;
  csPerMin?: number;
  gameDuration?: number;
  totalMinionsKilled?: number;
  neutralMinionsKilled?: number;
}
```

**インデックス**: `&matchId, date, win, role, champion`

**サービス**: `matchService`
- `getAll()`: 全件取得（日付降順）
- `getByDateRange(startDate: Date, endDate: Date)`: 日付範囲で取得
- `getByMatchId(matchId: string)`: マッチIDで取得
- `getAllMatchIds()`: 全マッチIDを取得
- `add(match: Match)`: 追加（重複チェックあり）
- `update(matchId: string, changes: Partial<Match>)`: 更新
- `delete(matchId: string)`: 削除
- `getWinRate(role?: string, champion?: string)`: 勝率を計算

**重複防止**: `add`メソッドは、同じ`matchId`が既に存在する場合、新規追加ではなく更新を行います。

#### 5. `goals` - 目標（ゴール）

**プライマリキー**: `id` (auto-increment)

```typescript
interface Goal {
  id?: number;
  targetDate: Date;
  targetTier: string;
  targetRank: string;
  targetLP: number;
  createdAt: Date;
  isActive: boolean;
}
```

**インデックス**: `++id, targetDate, createdAt, isActive`

**サービス**: `goalService`
- `getAll()`: 全件取得
- `getActive()`: アクティブなゴールを取得
- `add(goal: Omit<Goal, 'id'>)`: 追加
- `update(id: number, changes: Partial<Goal>)`: 更新
- `delete(id: number)`: 削除

#### 6. `skillGoals` - スキル目標

**プライマリキー**: `id` (auto-increment)

```typescript
interface SkillGoal {
  id?: number;
  type: SkillGoalType;      // 'CS_AT_10' | 'KDA' | 'VISION_SCORE' | 'DAMAGE' | 'CSPERMIN' | 'DAMAGE_PER_MIN'
  targetValue: number;
  lanes?: string[];         // TOP, JUNGLE, MID, ADC, SUPPORT
  createdAt: Date;
  isActive: boolean;
  description?: string;
  lane?: string;            // 非推奨（後方互換性のため）
}
```

**インデックス**: `++id, type, lane, createdAt, isActive`

**サービス**: `skillGoalService`
- `getAll()`: 全件取得
- `getActive()`: アクティブなスキル目標を取得
- `getByType(type: SkillGoalType)`: タイプで取得
- `add(goal: Omit<SkillGoal, 'id'>)`: 追加
- `update(id: number, changes: Partial<SkillGoal>)`: 更新
- `delete(id: number)`: 削除

---

## LP関連データの取得と保存

### レート履歴の取得

#### エンドポイント

**POST** `/api/riot/fetch-rate-history`

#### リクエスト

```typescript
{
  puuid: string;
  region?: string;          // デフォルト: 'jp1'
  apiKey: string;
  maxMatches?: number;      // デフォルト: 100
}
```

#### レスポンス

```typescript
{
  message: string;
  rateHistory: Array<{
    matchId: string;
    date: string;           // ISO 8601形式
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
  }>;
  currentEntry: {           // 表示用のみ（DBには保存しない）
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    date: string;
  };
  matchesProcessed: number;
  totalMatches: number;
}
```

#### 処理フロー

1. **現在のリーグエントリー取得**（ソロキューのみ）
   ```typescript
   const currentEntry = await client.getRankedSoloQueueEntryByPuuid(puuid);
   ```

2. **マッチID取得**
   ```typescript
   const matchIds = await client.getAllRankedMatchIds(puuid, maxMatches);
   ```

3. **マッチ詳細取得**（最大20件）
   ```typescript
   const matchDetails = [];
   for (let i = 0; i < Math.min(matchIds.length, 20); i++) {
     const match = await client.getMatchByMatchId(matchIds[i]);
     matchDetails.push({ match, matchId });
   }
   ```

4. **レート履歴の推定**
   - 現在のLPから逆算して過去のLPを推定
   - 勝利: -20 LP、敗北: +20 LP（逆算のため符号が逆）
   - `tierRankToLP`と`lpToTierRank`ユーティリティを使用

5. **日付順にソート**（古い順）

#### クライアント側での保存

`useSummonerSearch.ts`の`fetchAndSaveRateHistory`関数で保存されます。

```typescript
// 既存のmatchIdを取得して重複チェック
const existingMatchIds = new Set(
  currentRateHistory.map(r => r.matchId).filter((id): id is string => !!id)
);

for (const entry of result.rateHistory) {
  // matchIdが欠落している場合はスキップ
  if (!entry.matchId) continue;
  
  // 既に存在する場合はスキップ
  if (existingMatchIds.has(entry.matchId)) continue;
  
  // 今日または未来の日付はスキップ（マッチ履歴ベースではないため）
  const entryDate = new Date(entry.date);
  const entryDateOnly = new Date(entryDate);
  entryDateOnly.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (entryDateOnly.getTime() >= today.getTime()) continue;
  
  // DBに保存
  await addRateHistory({
    matchId: entry.matchId,
    date: entryDate,
    tier: entry.tier,
    rank: entry.rank,
    lp: entry.lp,
    wins: entry.wins,
    losses: entry.losses,
  });
}

// 最新エントリーを再度保存（rateHistoryの最後のエントリー）
if (result.rateHistory && result.rateHistory.length > 0) {
  const latestEntry = result.rateHistory[result.rateHistory.length - 1];
  if (latestEntry && latestEntry.matchId) {
    await addRateHistory({
      matchId: latestEntry.matchId,
      date: new Date(latestEntry.date),
      tier: latestEntry.tier,
      rank: latestEntry.rank,
      lp: latestEntry.lp,
      wins: latestEntry.wins || 0,
      losses: latestEntry.losses || 0,
    });
  }
}
```

⚠️ **重要な注意事項**:
- `currentEntry`は表示用のみで、DBには保存されません（マッチ履歴ベースではないため）
- 今日または未来の日付のエントリーは保存されません
- `matchId`が欠落しているエントリーはスキップされます
- 最新エントリー（rateHistoryの最後）は再度保存されます（最も最近のマッチデータ）

### リーグエントリーの保存

#### 保存タイミング

1. **サマナー検索時**: 検索成功後、ソロキューのリーグエントリーを取得して保存
2. **レート履歴取得時**: `currentEntry`が存在し、まだ保存されていない場合に保存（`leagueId`が存在する場合のみ）
3. **更新ボタンクリック時**: 現在のリーグエントリーを更新

#### 保存処理

```typescript
// ソロキューのみを受け入れる
if (entry.queueType === 'RANKED_SOLO_5x5') {
  setCurrentLeagueEntry(entry);
  // ⚠️ NOTE: leagueIdが必須（プライマリキー）
  if (entry.leagueId && entry.leagueId.trim() !== '') {
    await leagueEntryService.addOrUpdate(puuid, entry);
  } else {
    logger.warn('Skipping save of league entry - leagueId is missing');
  }
} else {
  // 非ソロキューは拒否し、DBから削除
  await leagueEntryService.delete(puuid);
}
```

⚠️ **重要な注意事項**:
- `leagueId`はプライマリキーとして必須です。Riot APIから取得したリーグエントリーには必ず`leagueId`が含まれています。
- `leagueId`が空の場合は、データベースに保存されません（エラーがスローされます）。

---

## マッチデータの取得と保存

### マッチ詳細の取得

#### エンドポイント

**POST** `/api/riot/fetch-match-details`

#### リクエスト

```typescript
{
  puuid: string;
  region?: string;          // デフォルト: 'jp1'
  apiKey: string;
  matchIds?: string[];      // 指定された場合はそれを使用、未指定の場合は取得
  maxMatches?: number;      // デフォルト: 20（matchIds未指定時）
}
```

#### レスポンス

```typescript
{
  message: string;
  matches: Match[];         // パース済みマッチデータ
  count: number;
}
```

#### 処理フロー

1. **マッチID取得**（未指定の場合）
   ```typescript
   if (!matchIds || matchIds.length === 0) {
     const allMatchIds = await client.getAllRankedMatchIds(puuid, maxMatches);
     matchIdsToFetch = allMatchIds;
   }
   ```

2. **マッチ詳細取得とパース**
   ```typescript
   const matches = await fetchAndParseMatchDetails(
     client, 
     matchIdsToFetch, 
     puuid, 
     50  // レート制限対策の遅延（ミリ秒）
   );
   ```

3. **パース処理**
   - Riot APIのマッチデータから必要な情報を抽出
   - プレイヤー情報（KDA、CS、ダメージ等）を取得
   - `Match`インターフェース形式に変換

#### クライアント側での保存

`useSummonerSearch.ts`の`fetchAndSaveMatchDetails`関数で保存されます。

```typescript
// 既存のmatchIdを取得
const existingMatches = useAppStore.getState().matches;
const existingMatchIds = new Set(
  existingMatches.map(m => m.matchId).filter((id): id is string => !!id)
);

// 新しいmatchIdのみを取得
const allMatchIds = await client.getAllRankedMatchIds(puuid, 20);
const newMatchIds = allMatchIds.filter(matchId => !existingMatchIds.has(matchId));

// 新しいmatchIdのみを詳細取得
const response = await fetch(API_ENDPOINTS.RIOT.FETCH_MATCH_DETAILS, {
  method: 'POST',
  body: JSON.stringify({
    puuid,
    region,
    apiKey,
    matchIds: newMatchIds,
  }),
});

// 保存
for (const matchData of result.matches) {
  if (!matchData.matchId) continue;
  
  const match: Match = {
    ...matchData,
    matchId: matchData.matchId,
    date: new Date(matchData.date),
  };
  
  await addMatch(match);
}
```

**重複防止**: 既存の`matchId`を事前に取得し、新しいマッチのみを取得・保存します。

---

## APIエンドポイント一覧

### 1. アカウント情報取得

**GET** `/api/riot/account/by-riot-id`

**パラメータ**:
- `gameName`: string（必須）
- `tagLine`: string（必須）
- `region`: string（デフォルト: 'jp1'）
- `apiKey`: string（必須）

**レスポンス**:
```typescript
{
  account: {
    puuid: string;
    gameName: string;
    tagLine: string;
  };
  summoner: {
    id: string;
    puuid: string;
    name: string;
    profileIconId: number;
    summonerLevel: number;
  };
}
```

### 2. サマナー情報取得（PUUID）

**GET** `/api/riot/summoner-by-puuid`

**パラメータ**:
- `puuid`: string（必須）
- `region`: string（デフォルト: 'jp1'）
- `apiKey`: string（必須）

**レスポンス**:
```typescript
{
  summoner: {
    id: string;
    puuid: string;
    name: string;
    profileIconId: number;
    summonerLevel: number;
  };
}
```

### 3. リーグエントリー取得

**GET** `/api/riot/league-by-puuid`

**パラメータ**:
- `puuid`: string（必須）
- `region`: string（デフォルト: 'jp1'）
- `queueType`: string（デフォルト: 'RANKED_SOLO_5x5'）
- `apiKey`: string（必須）

**レスポンス**:
```typescript
{
  entry: LeagueEntry;
}
```

### 4. レート履歴取得

**POST** `/api/riot/fetch-rate-history`

**リクエストボディ**:
```typescript
{
  puuid: string;
  region?: string;
  apiKey: string;
  maxMatches?: number;
}
```

**レスポンス**: [LP関連データの取得と保存](#lp関連データの取得と保存)を参照

### 5. マッチ詳細取得

**POST** `/api/riot/fetch-match-details`

**リクエストボディ**:
```typescript
{
  puuid: string;
  region?: string;
  apiKey: string;
  matchIds?: string[];
  maxMatches?: number;
}
```

**レスポンス**: [マッチデータの取得と保存](#マッチデータの取得と保存)を参照

### 6. データ更新

**POST** `/api/riot/update`

**リクエストボディ**:
```typescript
{
  gameName: string;
  tagLine: string;
  region?: string;
  apiKey: string;
}
```

**レスポンス**:
```typescript
{
  message: string;
  entry: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    date: string;
  };
}
```

**注意**: このエンドポイントはサーバーサイドで実行され、DBへの保存はクライアント側で行います。

---

## データフロー図

```
[ユーザー入力: Riot ID]
         ↓
[APIキー確認 (localStorage)]
         ↓
[アカウント情報取得 API]
         ↓
[サマナー情報取得]
         ↓
[DB保存: summoners]
         ↓
[リーグエントリー取得 API (ソロキューのみ)]
         ↓
[DB保存: leagueEntries]
         ↓
[レート履歴取得 API]
         ↓
[DB保存: rateHistory]
         ↓
[マッチ詳細取得 API]
         ↓
[DB保存: matches]
```

### 更新フロー

```
[更新ボタンクリック]
         ↓
[サマナー情報更新 API]
         ↓
[DB更新: summoners]
         ↓
[リーグエントリー更新 API (ソロキューのみ)]
         ↓
[DB更新: leagueEntries]
         ↓
[レート履歴更新 API]
         ↓
[DB更新: rateHistory]
         ↓
[マッチ詳細更新 API]
         ↓
[DB更新: matches]
```

---

## エラーハンドリング

### APIエラー

- **401 Unauthorized**: APIキーが無効
- **403 Forbidden**: APIキーの権限不足
- **404 Not Found**: リソースが見つからない
- **429 Too Many Requests**: レート制限超過
- **500 Internal Server Error**: サーバーエラー

エラーは`lib/utils/errorHandler.ts`の`handleRiotApiError`関数で処理され、ユーザーフレンドリーなメッセージに変換されます。

### DBエラー

- **重複エラー**: プライマリキーが既に存在する場合、更新処理が実行されます
- **バリデーションエラー**: ソロキュー以外のリーグエントリーは拒否されます

---

## パフォーマンス最適化

### 重複防止

- **レート履歴**: `matchId`をプライマリキーとして使用し、既存データは更新
- **マッチデータ**: 既存の`matchId`を事前に取得し、新しいマッチのみを取得

### レート制限対策

- マッチ詳細取得時に50msの遅延を追加
- レート履歴取得時は最大20件のマッチのみを処理

### データの遅延読み込み

- サマナー検索成功後に、レート履歴とマッチ詳細を非同期で取得
- エラーが発生しても検索処理は継続

### 状態管理

- Zustandストア（`useAppStore`）を使用してクライアント側の状態を管理
- DB操作後は自動的にストアを再読み込み

---

## まとめ

- **APIキー**: localStorageに保存、リクエストパラメータまたは環境変数から取得
- **サマナー検索**: Riot ID → アカウント情報 → サマナー情報 → DB保存
- **データ更新**: 更新ボタンでサマナー情報、リーグエントリー、レート履歴、マッチデータを更新
- **LPデータ**: レート履歴とリーグエントリーを取得・保存（ソロキューのみ）
- **マッチデータ**: マッチ詳細を取得・保存、重複防止あり
- **DB**: IndexedDB（Dexie.js）を使用、6つのテーブルでデータ管理
- **バージョン管理**: データベーススキーマのバージョン5まで対応
