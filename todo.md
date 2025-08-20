# ✅ CheckMate 開発TODO

## 🏗 プロジェクト準備
- [ ] Vite + React プロジェクト作成  
- [ ] Tailwind CSS or shadcn/ui 導入  
- [ ] react-router-dom セットアップ  
- [ ] PWA: manifest.json & Service Worker 設定  

---

## 📂 基本構成
- [ ] ディレクトリ構成作成（pages, components, hooks, utils, data）  
- [ ] グローバル状態管理（useContext または hooks）  
- [ ] localStorage / IndexedDB ラッパー実装  

---

## 🛠 機能実装
### 1. 持ち物リスト
- [ ] 手動入力で持ち物登録  
- [ ] バーコードスキャン登録（ZXing/QuaggaJS）  
- [ ] カテゴリ分け対応  
- [ ] テンプレート保存＆適用  

### 2. チェックリスト & パッキング
- [ ] 当日リスト自動生成（曜日/予定/テンプレ参照）  
- [ ] チェックボックス & バーコード確認  
- [ ] 準備完了→ファイナルチェックモーダル  
- [ ] 履歴を localStorage に保存  

### 3. 忘れ物記録
- [ ] その日の忘れ物入力画面  
- [ ] 日ごとに保存・蓄積  

### 4. 統計・分析
- [ ] 週/月ごとの忘れ物件数集計  
- [ ] グラフ表示（recharts.jsやchart.js）  
- [ ] 傾向コメント生成  
- [ ] 忘れやすい持ち物を次回リストでハイライト  

### 5. 通知 & リマインド
- [ ] PWA通知（時間指定・即時）  
- [ ] よく忘れるアイテムを重点通知  

---

## 🎨 UI/UX
- [ ] メインダッシュボード（予定+持ち物）  
- [ ] PackingList（チェック画面）  
- [ ] FinalCheckModal（最終確認ダイアログ）  
- [ ] ForgottenItemRegister（忘れ物記録）  
- [ ] StatsDashboard（統計・分析）  
- [ ] TemplateSettings（テンプレ編集）  

---

## 🔧 仕上げ & テスト
- [ ] オフライン動作確認  
- [ ] スマホ表示最適化（レスポンシブ）  
- [ ] PWAインストール確認  
- [ ] ユーザーフローの最終調整  
