
# CheckMate V2 プロジェクト構成

このドキュメントは、CheckMate V2プロジェクトのファイル構成と、各ファイルの役割をまとめたものです。

## ファイル構成図

```
/ (ルート)
├── .gitignore
├── index.html
├── manifest.webmanifest
├── sw.js
├── document.md
├── .github/
│   └── workflows/
│       └── release.yml
├── css/ (未使用)
├── icons/
│   └── icon-512.png
└── js/
    ├── backup.js
    ├── category.js
    ├── checklist.js
    ├── dark_mode_startup.js
    ├── dark_mode.js
    ├── global.js
    ├── indexdb.js
    ├── items.js
    ├── pwa.js
    ├── quick.js
    ├── scan_mode.js
    ├── search.js
    ├── sort.js
    ├── stats.js
    ├── status.js
    ├── style_config.js
    ├── tab.js
    └── ui.js
```

## 主要ファイルの役割

### フロントエンド (HTML)

- **`index.html`**: アプリケーションの骨格となるメインのHTMLファイル。すべてのUI要素が含まれています。

### PWA (Progressive Web App)

- **`manifest.webmanifest`**: Webアプリのマニフェストファイル。アプリのインストール情報などを定義します。
- **`sw.js`**: サービスワーカーファイル。オフライン動作やキャッシュ戦略を記述します。
- **`pwa.js`**: PWAのインストール処理などを担当します。

### JavaScript (`js/`)

#### 中核機能
- **`indexdb.js`**: ブラウザ内データベース(IndexedDB)の操作を一手に担う、データ永続化の心臓部です。
- **`items.js`**: アイテムの追加、更新、削除、一覧表示など、アイテム管理の基本機能を提供します。
- **`global.js`**: アプリ全体で共有される変数や状態（アイテムリスト本体など）を管理します。
- **`main.js`** (今後作成予定): アプリケーション全体の初期化と起動処理を担当します。

#### UI・表示関連
- **`ui.js`**: 編集モーダルなど、UIに関する共通の関数をまとめます。
- **`tab.js`**: メイン画面のタブ切り替えを制御します。
- **`dark_mode.js`**: ライトモードとダークモードのテーマ切り替え機能です。
- **`dark_mode_startup.js`**: テーマ設定を読み込み、ページのちらつきを防ぎます。
- **`style_config.js`**: UIフレームワーク(TailwindCSS)の設定ファイルです。

#### 機能別
- **`quick.js`**: 「クイック追加」タブの処理を担当します。
- **`scanner.js`** (今後作成予定): バーコードの読み取り機能（登録・チェック時）を担当します。
- **`scan_mode.js`**: 「チェック」タブ内の手動モードとスキャンモードの表示を切り替えます。
- **`checklist.js`**: 「チェック」タブのチェックリスト表示と操作（一括選択など）の機能です。
- **`category.js`**: 「一覧」タブのカテゴリー絞り込み機能です。
- **`search.js`**: 「一覧」タブの検索機能です。
- **`sort.js`**: 「一覧」タブの並び替え機能です。
- **`stats.js`**: 「設定」タブの統計情報を計算・表示します。
- **`status.js`**: 画面上部に表示されるステータスメッセージを管理します。
- **`backup.js`**: 「設定」タブのデータ管理（インポート、エクスポートなど）機能です。
