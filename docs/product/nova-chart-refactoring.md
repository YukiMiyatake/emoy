# NovaChartリファクタリング計画

## 現状の問題点

### 1. コードの重複
- **LeagueEntry抽出ロジック**: `page.tsx`、`SummonerSearch.tsx`、`league-by-puuid/route.ts`で同じロジックが3回繰り返されている
- **API呼び出しパターン**: `page.tsx`と`SummonerSearch.tsx`で似たようなAPI呼び出しロジックが重複
- **エラーハンドリング**: 複数箇所で同じエラーハンドリングパターンが繰り返されている
- **日付処理**: 日付のフォーマットや変換が複数箇所で行われている

### 2. コンポーネントの肥大化
- **SummonerSearch.tsx**: 430行の大きなコンポーネント。検索、データ取得、レート履歴取得、エラーハンドリングなど複数の責務
- **RateChart.tsx**: 850行以上の巨大コンポーネント。データ処理、グラフ描画、インタラクションなど複数の責務

### 3. ログ管理の問題
- **console.log/errorの過剰使用**: 92箇所で使用されており、本番環境では不要なログが多い
- **ログレベルの統一**: デバッグログとエラーログが混在

### 4. 状態管理の改善余地
- **useAppStoreのエラーハンドリング**: 各アクションで同じエラーハンドリングパターンが繰り返されている
- **localStorage操作の重複**: 3ファイルで直接操作されており、統一されたインターフェースがない

### 5. 型安全性の問題
- **LeagueEntry抽出**: 手動でフィールドを抽出しており、型安全性が低い
- **APIレスポンスの型定義**: 一部のAPIレスポンスに型定義が不足

## リファクタリング内容

### 1. ユーティリティ関数の作成

#### 1.1 LeagueEntry抽出ヘルパー
**ファイル**: `NovaChart/lib/utils/leagueEntry.ts` (新規)
- `extractLeagueEntry(rawEntry: any): LeagueEntry` 関数を作成
- APIレスポンスから`LeagueEntry`型を安全に抽出する共通ロジック
- デフォルト値の設定と型チェックを含む

**変更ファイル**:
- `NovaChart/app/page.tsx`: `extractLeagueEntry`を使用
- `NovaChart/app/components/SummonerSearch.tsx`: `extractLeagueEntry`を使用
- `NovaChart/app/api/riot/league-by-puuid/route.ts`: `extractLeagueEntry`を使用

#### 1.2 localStorage管理ユーティリティ
**ファイル**: `NovaChart/lib/utils/storage.ts` (新規)
- `StorageService`クラスを作成
- APIキー、リージョン、Riot IDの読み書きを統一
- 型安全なインターフェースを提供

**変更ファイル**:
- `NovaChart/app/page.tsx`: `StorageService`を使用
- `NovaChart/app/components/SummonerSearch.tsx`: `StorageService`を使用
- `NovaChart/app/components/ApiKeySettings.tsx`: `StorageService`を使用

#### 1.3 日付フォーマットユーティリティ
**ファイル**: `NovaChart/lib/utils/date.ts` (新規)
- `formatDateShort(date: Date): string` - "M/D"形式
- `formatDateFull(date: Date): string` - 完全な日付形式
- `getDateKey(date: Date): string` - 日付比較用のキー生成

**変更ファイル**:
- `NovaChart/app/components/RateChart.tsx`: 日付フォーマット関数を使用
- `NovaChart/app/components/SummonerSearch.tsx`: 日付キー生成関数を使用

#### 1.4 ログ管理ユーティリティ
**ファイル**: `NovaChart/lib/utils/logger.ts` (新規)
- `Logger`クラスを作成
- 開発環境と本番環境でログレベルを切り替え
- `debug`, `info`, `warn`, `error`メソッドを提供
- 本番環境では`debug`ログを無効化

**変更ファイル**:
- 全ファイル: `console.log/error`を`Logger`に置き換え

### 2. カスタムフックの作成

#### 2.1 API呼び出しフック
**ファイル**: `NovaChart/lib/hooks/useRiotApi.ts` (新規)
- `useFetchSummoner(puuid: string, region: string)`
- `useFetchLeagueEntry(puuid: string, region: string)`
- `useFetchRateHistory(puuid: string, region: string)`
- エラーハンドリング、ローディング状態、リトライロジックを含む

**変更ファイル**:
- `NovaChart/app/page.tsx`: `useRiotApi`フックを使用
- `NovaChart/app/components/SummonerSearch.tsx`: `useRiotApi`フックを使用

#### 2.2 localStorageフック
**ファイル**: `NovaChart/lib/hooks/useLocalStorage.ts` (新規)
- `useLocalStorage<T>(key: string, initialValue: T)` フック
- 型安全なlocalStorage操作
- 変更の自動同期

**変更ファイル**:
- `NovaChart/app/components/SummonerSearch.tsx`: `useLocalStorage`を使用
- `NovaChart/app/components/ApiKeySettings.tsx`: `useLocalStorage`を使用

### 3. コンポーネントの分割

#### 3.1 SummonerSearchの分割
**ファイル**: 
- `NovaChart/app/components/SummonerSearch/SearchForm.tsx` (新規) - 検索フォーム
- `NovaChart/app/components/SummonerSearch/useSummonerSearch.ts` (新規) - 検索ロジック（カスタムフック）
- `NovaChart/app/components/SummonerSearch/index.tsx` (新規) - メインコンポーネント

**変更ファイル**:
- `NovaChart/app/components/SummonerSearch.tsx`: 分割されたコンポーネントに置き換え

#### 3.2 RateChartの分割
**ファイル**:
- `NovaChart/app/components/RateChart/ChartContainer.tsx` (新規) - グラフコンテナ
- `NovaChart/app/components/RateChart/ChartControls.tsx` (新規) - コントロール（時間範囲、移動平均等）
- `NovaChart/app/components/RateChart/useChartData.ts` (新規) - データ処理ロジック（カスタムフック）
- `NovaChart/app/components/RateChart/useYAxisConfig.ts` (新規) - Y軸設定ロジック（カスタムフック）
- `NovaChart/app/components/RateChart/index.tsx` (新規) - メインコンポーネント

**変更ファイル**:
- `NovaChart/app/components/RateChart.tsx`: 分割されたコンポーネントに置き換え

### 4. エラーハンドリングの統一

#### 4.1 エラーハンドリングユーティリティ
**ファイル**: `NovaChart/lib/utils/errorHandler.ts` (新規)
- `handleRiotApiError(error: unknown): string` - Riot APIエラーをユーザーフレンドリーなメッセージに変換
- `isRiotApiError(error: unknown): boolean` - エラータイプの判定
- エラーメッセージの国際化対応（将来の拡張）

**変更ファイル**:
- `NovaChart/app/components/SummonerSearch.tsx`: `handleRiotApiError`を使用
- `NovaChart/app/page.tsx`: `handleRiotApiError`を使用
- `NovaChart/lib/riot/client.ts`: エラーハンドリングを統一

#### 4.2 エラー境界コンポーネント
**ファイル**: `NovaChart/app/components/ErrorBoundary.tsx` (新規)
- React Error Boundaryを実装
- エラーの表示とリカバリー機能

**変更ファイル**:
- `NovaChart/app/layout.tsx`: `ErrorBoundary`でアプリをラップ

### 5. Zustandストアの改善

#### 5.1 エラーハンドリングの統一
**ファイル**: `NovaChart/lib/store/useAppStore.ts`
- 各アクションのエラーハンドリングを`handleStoreError`ヘルパーに統一
- エラーメッセージの一貫性を確保

#### 5.2 セレクターの追加
**ファイル**: `NovaChart/lib/store/useAppStore.ts`
- よく使われるデータの組み合わせをセレクターとして提供
- `useSoloQueueStats()` - ソロランク統計
- `useActiveGoals()` - アクティブな目標のみ

### 6. APIルートの改善

#### 6.1 共通ミドルウェア
**ファイル**: `NovaChart/lib/api/middleware.ts` (新規)
- APIキー検証
- エラーハンドリング
- ログ記録

**変更ファイル**:
- 全APIルート: 共通ミドルウェアを使用

#### 6.2 レスポンスヘルパー
**ファイル**: `NovaChart/lib/api/response.ts` (新規)
- `createSuccessResponse(data: T)`
- `createErrorResponse(message: string, status: number)`
- レスポンス形式の統一

**変更ファイル**:
- 全APIルート: レスポンスヘルパーを使用

### 7. 型定義の改善

#### 7.1 APIレスポンス型の追加
**ファイル**: `NovaChart/types/api.ts` (新規)
- Riot APIレスポンスの型定義
- `RiotApiResponse<T>`
- `LeagueEntryResponse`
- `SummonerResponse`

**変更ファイル**:
- `NovaChart/lib/riot/client.ts`: 型定義を使用
- `NovaChart/app/api/riot/**/*.ts`: 型定義を使用

### 8. 定数の統一

#### 8.1 定数ファイルの作成
**ファイル**: `NovaChart/lib/constants/index.ts` (新規)
- ストレージキー
- APIエンドポイント
- デフォルト値
- 設定値

**変更ファイル**:
- 全ファイル: 定数を`constants`からインポート

## 実装順序（推奨）

1. **定数の統一** - 他のリファクタリングの基盤
2. **ユーティリティ関数の作成** - 重複コードの削減
3. **ログ管理の改善** - 開発効率の向上
4. **エラーハンドリングの統一** - ユーザー体験の向上
5. **カスタムフックの作成** - コンポーネントの簡素化
6. **コンポーネントの分割** - 保守性の向上
7. **ストアの改善** - 状態管理の最適化
8. **APIルートの改善** - バックエンドの統一

## 期待される効果

- **コードの重複削減**: 約30-40%のコード削減
- **保守性の向上**: 変更箇所の局所化
- **型安全性の向上**: TypeScriptの恩恵を最大限に活用
- **デバッグの容易化**: 統一されたログシステム
- **テストの容易化**: 小さなユニットへの分割
- **パフォーマンス**: 不要な再レンダリングの削減

## 注意事項

- 既存の機能を壊さないよう、段階的にリファクタリングを実施
- 各ステップで動作確認を実施
- 大きなコンポーネントの分割は、機能ごとに分けて実施
- 型定義の追加は、既存コードとの互換性を保つ

## 実装タスク詳細

### タスク1: 定数の統一
- `lib/constants/index.ts`を作成
- ストレージキー、APIエンドポイント、デフォルト値を定義
- 全ファイルで定数をインポートして使用

### タスク2: LeagueEntry抽出ヘルパー
- `lib/utils/leagueEntry.ts`を作成
- `extractLeagueEntry`関数を実装
- 3箇所の重複コードを置き換え

### タスク3: localStorage管理ユーティリティ
- `lib/utils/storage.ts`を作成
- `StorageService`クラスを実装
- 3ファイルのlocalStorage操作を統一

### タスク4: 日付フォーマットユーティリティ
- `lib/utils/date.ts`を作成
- 日付フォーマット関数を実装
- 複数箇所の日付処理を統一

### タスク5: ログ管理ユーティリティ
- `lib/utils/logger.ts`を作成
- `Logger`クラスを実装
- 環境に応じたログレベル制御

### タスク6: console.log/errorの置き換え
- 全ファイルの`console.log/error`を`Logger`に置き換え
- 段階的に実施（ファイルごと）

### タスク7: エラーハンドリングユーティリティ
- `lib/utils/errorHandler.ts`を作成
- `handleRiotApiError`関数を実装
- エラーメッセージの統一

### タスク8: API呼び出しフック
- `lib/hooks/useRiotApi.ts`を作成
- `useFetchSummoner`、`useFetchLeagueEntry`、`useFetchRateHistory`を実装
- エラーハンドリングとローディング状態を統一

### タスク9: localStorageフック
- `lib/hooks/useLocalStorage.ts`を作成
- 型安全なlocalStorage操作を提供

### タスク10: SummonerSearchの分割
- `components/SummonerSearch/SearchForm.tsx`を作成
- `components/SummonerSearch/useSummonerSearch.ts`を作成
- `components/SummonerSearch/index.tsx`を作成
- 元の`SummonerSearch.tsx`を置き換え

### タスク11: RateChartの分割
- `components/RateChart/ChartContainer.tsx`を作成
- `components/RateChart/ChartControls.tsx`を作成
- `components/RateChart/useChartData.ts`を作成
- `components/RateChart/useYAxisConfig.ts`を作成
- `components/RateChart/index.tsx`を作成
- 元の`RateChart.tsx`を置き換え

### タスク12: ストアのエラーハンドリング統一
- `useAppStore.ts`に`handleStoreError`ヘルパーを追加
- 各アクションのエラーハンドリングを統一

### タスク13: ストアのセレクター追加
- `useSoloQueueStats`セレクターを追加
- `useActiveGoals`セレクターを追加

### タスク14: API共通ミドルウェア
- `lib/api/middleware.ts`を作成
- APIキー検証、エラーハンドリング、ログ記録を実装

### タスク15: APIレスポンスヘルパー
- `lib/api/response.ts`を作成
- `createSuccessResponse`、`createErrorResponse`を実装

### タスク16: APIルートの更新
- 全APIルートで共通ミドルウェアとレスポンスヘルパーを使用

### タスク17: APIレスポンス型定義
- `types/api.ts`を作成
- Riot APIレスポンスの型定義を追加

### タスク18: ErrorBoundaryコンポーネント
- `components/ErrorBoundary.tsx`を作成
- React Error Boundaryを実装
- `layout.tsx`でアプリをラップ

### タスク19: page.tsxの更新
- 新しいユーティリティ、フック、コンポーネントを使用するように更新

