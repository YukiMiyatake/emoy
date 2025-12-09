# ソロランク専用データガイドライン

## 🚨 重要: このルールを絶対に守ってください

**⚠️ このミスは何度も繰り返されています。必ずこのドキュメントを読んでから実装してください。⚠️**

**新しい機能を追加する前に、このドキュメントを必ず読んでください。**
**リーグエントリーを扱うコードを書く前に、このドキュメントを必ず読んでください。**
**統計情報を扱うコードを書く前に、このドキュメントを必ず読んでください。**

## 概要

NovaChartは**RANKED_SOLO_5x5（ソロランク）のみ**のデータを使用します。
統計情報、グラフ、進捗計算など、すべての機能はソロランクのデータのみを対象とします。

**フレックスランク（`RANKED_FLEX_SR`）やその他のキュー形式のデータは一切使用しません。**

## 🚨 絶対に守るべきルール（何度もミスが発生している箇所）

### 1. 統計情報はソロランクのみ - 最重要

**⚠️ このルール違反が何度も発生しています。必ず守ってください。**

**絶対に守るべきルール:**
- 統計情報（`calculateStatistics`）は**RANKED_SOLO_5x5のみ**を使用
- `currentLeagueEntry`がソロランクでない場合は、統計を計算しない（`null`を返す）
- フレックスランク（`RANKED_FLEX_SR`）やその他のキュー形式のデータは**一切使用しない**
- **`!currentLeagueEntry || currentLeagueEntry.queueType === 'RANKED_SOLO_5x5'`のような条件は使わない**（`currentLeagueEntry`が`null`の場合に`true`になってしまうため）

**正しいチェック方法:**
```typescript
// ✅ 正しい: currentLeagueEntryが存在する場合のみチェック
if (currentLeagueEntry && currentLeagueEntry.queueType !== 'RANKED_SOLO_5x5') {
  return null; // ソロランクでない場合は拒否
}

// ❌ 間違い: currentLeagueEntryがnullの場合にtrueになってしまう
const isSoloQueue = !currentLeagueEntry || currentLeagueEntry.queueType === 'RANKED_SOLO_5x5';
```

### 2. SummonerIdは使用しない

**絶対に守るべきルール:**
- **SummonerIdは使用しない**
- すべてのAPI呼び出しは**PUUID**を使用する
- SummonerIdを使用するコードは削除または修正する

### 3. リーグエントリー取得時の注意 - 必須チェック

**⚠️ このルール違反も何度も発生しています。必ず守ってください。**

**必須の実装:**
- リーグエントリーを取得する際は、**必ず`queueType`パラメータを明示的に指定**
- デフォルト値に依存せず、`queueType=RANKED_SOLO_5x5`を明示的に指定
- **取得したエントリーがソロランクであることを確認してから使用**
- `setCurrentLeagueEntry`を呼び出す前に、必ず`queueType === 'RANKED_SOLO_5x5'`をチェック

**よくある間違い:**
- `queueType`パラメータを指定し忘れる → フレックスランクが返される可能性がある
- 取得後にチェックしない → フレックスランクのデータが設定されてしまう

## 実装例

### ✅ 正しい実装

```typescript
// リーグエントリー取得時にqueueTypeを明示的に指定
const leagueResponse = await fetch(
  `${API_ENDPOINTS.RIOT.LEAGUE_BY_PUUID}?puuid=${puuid}&region=${region}&queueType=${DEFAULTS.QUEUE_TYPE}&apiKey=${apiKey}`
);

if (leagueResponse.ok) {
  const leagueData = await leagueResponse.json();
  if (leagueData.entry) {
    const entry = extractLeagueEntry(leagueData.entry);
    // ソロランクであることを確認
    if (entry.queueType === 'RANKED_SOLO_5x5') {
      setCurrentLeagueEntry(entry);
    } else {
      logger.warn('Received non-solo queue entry, ignoring:', entry.queueType);
    }
  }
}
```

```typescript
// 統計計算時にソロランクをチェック
export function calculateStatistics(
  rateHistory: RateHistory[],
  currentLeagueEntry?: { queueType?: string; ... } | null
): RateStatistics | null {
  // CRITICAL: ソロランクでない場合は拒否
  if (currentLeagueEntry && currentLeagueEntry.queueType !== 'RANKED_SOLO_5x5') {
    return null;
  }
  // ... 統計計算
}
```

### ❌ 間違った実装

```typescript
// ❌ queueTypeを指定していない
const leagueResponse = await fetch(
  `${API_ENDPOINTS.RIOT.LEAGUE_BY_PUUID}?puuid=${puuid}&region=${region}&apiKey=${apiKey}`
);

// ❌ ソロランクチェックをしていない
if (leagueData.entry) {
  const entry = extractLeagueEntry(leagueData.entry);
  setCurrentLeagueEntry(entry); // 危険: フレックスランクの可能性
}
```

```typescript
// ❌ ソロランクチェックが不十分
const isSoloQueue = !currentLeagueEntry || currentLeagueEntry.queueType === 'RANKED_SOLO_5x5';
// 問題: currentLeagueEntryがnullの場合はtrueになってしまう
```

## 影響を受けるファイル

以下のファイルで特に注意が必要です:

1. **`app/components/StatsPanel.tsx`**
   - `currentLeagueEntry`がソロランクであることを確認
   - ソロランクでない場合は統計を表示しない

2. **`lib/analytics/progress.ts`**
   - `calculateStatistics`: ソロランクでない場合は`null`を返す
   - `calculateRequiredMatches`: ソロランクでない場合は`null`を返す

3. **`app/components/SummonerSearch/useSummonerSearch.ts`**
   - リーグエントリー取得時に`queueType`を明示的に指定
   - 取得したエントリーがソロランクであることを確認

4. **`app/page.tsx`**
   - `handleUpdate`関数でリーグエントリー取得時に`queueType`を明示的に指定
   - 取得したエントリーがソロランクであることを確認

5. **`app/api/riot/league-by-puuid/route.ts`**
   - デフォルトで`RANKED_SOLO_5x5`を使用するが、明示的に指定することを推奨

## テスト時の確認事項

新しい機能を追加する際は、以下を確認してください:

1. ✅ リーグエントリー取得時に`queueType=RANKED_SOLO_5x5`を指定しているか
2. ✅ 取得したエントリーがソロランクであることを確認しているか
3. ✅ 統計計算関数がソロランクでないデータを拒否しているか
4. ✅ SummonerIdを使用していないか（PUUIDを使用しているか）

## 過去の問題例

### 問題: 統計情報がフレックスランクのデータを含んでいた

**原因:**
- `currentLeagueEntry`がフレックスランクのデータを含んでいた
- `calculateStatistics`のチェックが不十分だった（`!currentLeagueEntry`の場合は`true`になっていた）

**修正:**
- `currentLeagueEntry`がソロランクでない場合は明示的に`null`を返すように修正
- リーグエントリー取得時に`queueType`を明示的に指定

### 問題: SummonerIdを使用していた

**原因:**
- 古いAPIエンドポイントでSummonerIdを使用していた

**修正:**
- すべてのAPI呼び出しをPUUIDベースに変更

## 📋 チェックリスト（新しい機能を追加する前に必ず確認）

新しい機能を追加する際は、以下を**必ず**確認してください:

1. ✅ **リーグエントリー取得時に`queueType=RANKED_SOLO_5x5`を指定しているか**
2. ✅ **取得したエントリーがソロランクであることを確認しているか**（`entry.queueType === 'RANKED_SOLO_5x5'`）
3. ✅ **統計計算関数がソロランクでないデータを拒否しているか**（`if (currentLeagueEntry && currentLeagueEntry.queueType !== 'RANKED_SOLO_5x5') return null;`）
4. ✅ **`setCurrentLeagueEntry`を呼び出す前にソロランクチェックをしているか**
5. ✅ **`!currentLeagueEntry || ...`のような条件を使っていないか**（`null`の場合に`true`になってしまうため）

## まとめ

- **統計情報はソロランクのみ**: `RANKED_SOLO_5x5`以外のデータは使用しない
- **SummonerIdは使用しない**: すべてPUUIDを使用
- **明示的な指定**: `queueType`は常に明示的に指定（デフォルトに依存しない）
- **検証**: 取得したデータがソロランクであることを確認（チェックを忘れない）

**⚠️ これらのルールを守ることで、統計情報が正しくソロランクのみのデータを使用することを保証できます。**
**このミスは何度も繰り返されています。必ず上記のチェックリストを確認してください。**

