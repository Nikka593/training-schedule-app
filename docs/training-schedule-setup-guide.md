# 研修スケジュール管理システム セットアップガイド

## 📋 目次

1. [動作環境](#動作環境)
2. [インストール手順](#インストール手順)
3. [初期設定](#初期設定)
4. [トラブルシューティング](#トラブルシューティング)
5. [アップデート方法](#アップデート方法)
6. [バックアップとリストア](#バックアップとリストア)

## 🖥️ 動作環境

### 推奨環境

| 項目 | 推奨スペック |
|------|-------------|
| OS | Windows 10/11, macOS 10.15以降, Ubuntu 20.04以降 |
| ブラウザ | Google Chrome 最新版 |
| 画面解像度 | 1920×1080以上 |
| メモリ | 4GB以上 |
| ネットワーク | 不要（ローカル動作） |

### 対応ブラウザ

| ブラウザ | バージョン | 対応状況 |
|---------|-----------|---------|
| Google Chrome | 90以降 | ✅ 完全対応 |
| Mozilla Firefox | 88以降 | ✅ 完全対応 |
| Microsoft Edge | 90以降 | ✅ 完全対応 |
| Safari | 14以降 | ⚠️ 一部制限あり |
| Internet Explorer | - | ❌ 非対応 |

## 📥 インストール手順

### 方法1: 直接ダウンロード（推奨）

1. **ファイルのダウンロード**
   ```bash
   # GitHubからZIPファイルをダウンロード
   # またはリリースページから最新版をダウンロード
   ```

2. **ファイルの展開**
   ```bash
   # ダウンロードしたZIPファイルを展開
   unzip training-schedule-app.zip
   ```

3. **フォルダ構造の確認**
   ```
   training-schedule-app/
   ├── index.html
   ├── css/
   ├── js/
   ├── data/
   └── docs/
   ```

4. **ブラウザで開く**
   - `index.html`をダブルクリック
   - またはブラウザにドラッグ&ドロップ

### 方法2: Gitを使用

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/your-org/training-schedule-app.git
   cd training-schedule-app
   ```

2. **ブランチの確認**
   ```bash
   git branch -a
   git checkout main  # 安定版
   ```

### 方法3: ローカルサーバーを使用

1. **Python を使用**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

2. **Node.js を使用**
   ```bash
   # http-serverをインストール
   npm install -g http-server
   
   # サーバー起動
   http-server -p 8000
   ```

3. **ブラウザでアクセス**
   ```
   http://localhost:8000
   ```

## ⚙️ 初期設定

### 1. 初回起動

1. ブラウザで`index.html`を開く
2. 「ようこそ！」画面が表示されることを確認
3. 「キャンプ期間を設定する」ボタンをクリック

### 2. 基本設定

#### サンプルデータの読み込み（オプション）

1. **開発者ツールを開く**（F12キー）
2. **コンソールで以下を実行**：
   ```javascript
   // サンプルデータを読み込む
   fetch('data/sample-schedule.json')
     .then(response => response.json())
     .then(data => {
       localStorage.setItem('trainingScheduleData', JSON.stringify(data));
       location.reload();
     });
   ```

#### 講師データの初期化

1. **講師リストの確認**
   - 初期状態で基本的な講師名が登録済み
   - 追加の講師情報は`data/instructors.json`を参照

### 3. カスタマイズ

#### 営業時間の変更

`js/app.js`を編集：
```javascript
const CONSTANTS = {
    START_TIME: '09:00',    // 開始時間を9:00に変更
    END_TIME: '18:00',      // 終了時間を18:00に変更
    TIME_SLOT_MINUTES: 30,  // 30分単位に変更
};
```

#### デフォルトカテゴリ色の変更

`js/app.js`を編集：
```javascript
categories: {
    sales: { name: 'セールス', color: '#0066cc' },     // 青を濃く
    service: { name: 'サービス', color: '#00aa44' },   // 緑を濃く
    // ... 他のカテゴリ
}
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. 画面が真っ白になる

**原因**: JavaScriptエラー

**解決方法**:
1. ブラウザの開発者ツールを開く（F12）
2. コンソールタブでエラーを確認
3. 以下を確認：
   - ファイルパスが正しいか
   - すべてのファイルが存在するか
   - JavaScriptが有効になっているか

#### 2. スタイルが適用されない

**原因**: CSSファイルの読み込みエラー

**解決方法**:
1. ネットワークタブで404エラーを確認
2. `css/`フォルダ内にすべてのCSSファイルがあるか確認
3. ファイル名の大文字小文字を確認（Linux/Macで重要）

#### 3. ドラッグ&ドロップが動作しない

**原因**: 古いブラウザまたは互換性の問題

**解決方法**:
1. ブラウザを最新版に更新
2. Chrome/Firefoxで動作確認
3. 拡張機能を一時的に無効化

#### 4. データが保存されない

**原因**: LocalStorageの制限

**解決方法**:
1. プライベートブラウジングモードではないか確認
2. LocalStorageの容量を確認：
   ```javascript
   // コンソールで実行
   const usage = new Blob(Object.values(localStorage)).size;
   console.log(`使用量: ${usage / 1024 / 1024} MB`);
   ```
3. 不要なデータをクリア：
   ```javascript
   // 古いアーカイブを削除
   cleanupStorage();
   ```

#### 5. 印刷レイアウトが崩れる

**原因**: ブラウザの印刷設定

**解決方法**:
1. 印刷プレビューで以下を設定：
   - 余白: 狭い
   - 倍率: 90%
   - 背景のグラフィック: 有効
2. 用紙サイズを確認（A4/A3）

### エラーメッセージ対応表

| エラーメッセージ | 原因 | 対処法 |
|-----------------|------|--------|
| `Uncaught ReferenceError` | 変数が未定義 | JSファイルの読み込み順序を確認 |
| `Failed to load resource` | ファイルが見つからない | ファイルパスとファイル名を確認 |
| `QuotaExceededError` | LocalStorage容量超過 | 古いデータを削除 |
| `SecurityError` | セキュリティ制限 | ローカルサーバーを使用 |

## 🔄 アップデート方法

### 手動アップデート

1. **現在のデータをバックアップ**
   ```javascript
   // ブラウザのコンソールで実行
   const backup = localStorage.getItem('trainingScheduleData');
   console.log(backup); // これをコピーして保存
   ```

2. **新しいファイルをダウンロード**
   - 既存のファイルを別フォルダに移動
   - 新しいファイルを展開

3. **データの復元**
   ```javascript
   // バックアップしたデータを復元
   localStorage.setItem('trainingScheduleData', 'バックアップしたJSON');
   location.reload();
   ```

### Gitを使用したアップデート

```bash
# 変更を保存
git stash

# 最新版を取得
git pull origin main

# 変更を適用
git stash pop
```

## 💾 バックアップとリストア

### 自動バックアップ

アプリケーションは以下のタイミングで自動バックアップを作成：
- 1時間ごと
- 重要な操作の前（インポート、復元など）

### 手動バックアップ

1. **エクスポート機能を使用**
   - 「エクスポート」ボタンをクリック
   - JSON形式を選択
   - ファイルを安全な場所に保存

2. **コンソールからバックアップ**
   ```javascript
   // 全データをコピー
   copy(localStorage.getItem('trainingScheduleData'));
   ```

### データの復元

1. **JSONファイルから復元**
   ```javascript
   // ファイル選択ダイアログを表示
   const input = document.createElement('input');
   input.type = 'file';
   input.accept = 'application/json';
   input.onchange = (e) => {
     const file = e.target.files[0];
     const reader = new FileReader();
     reader.onload = (event) => {
       importData(event.target.result);
     };
     reader.readAsText(file);
   };
   input.click();
   ```

2. **アーカイブから復元**
   ```javascript
   // アーカイブリストを表示
   const archives = getArchiveList();
   console.table(archives);
   
   // 特定のアーカイブを復元
   restoreArchive('trainingScheduleArchive_1234567890');
   ```

### データのクリーンアップ

```javascript
// 3ヶ月以上前のアーカイブを削除
cleanupStorage();

// 使用量を確認
const usage = getStorageUsage();
console.log(`使用量: ${usage.megabytes}MB (${usage.percentage}%)`);
```

## 🔐 セキュリティ設定

### ローカル環境での注意点

1. **ファイルの配置**
   - 共有フォルダに置かない
   - 適切なアクセス権限を設定

2. **データの取り扱い**
   - 機密情報を含む場合は暗号化を検討
   - 定期的なバックアップ

### ネットワーク環境での使用

1. **HTTPSの使用**
   ```nginx
   # nginx設定例
   server {
       listen 443 ssl;
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           root /path/to/training-schedule-app;
           index index.html;
       }
   }
   ```

2. **アクセス制限**
   ```apache
   # .htaccess例
   <RequireAll>
       Require ip 192.168.1.0/24
       Require ip 10.0.0.0/8
   </RequireAll>
   ```

## 📞 サポート情報

### 技術サポート

- **メール**: it-support@example.com
- **内線**: 6001（IT部門）
- **対応時間**: 平日 9:00-18:00

### よくある質問

最新のFAQは`docs/manual.html`を参照してください。

### ログの確認方法

```javascript
// デバッグモードを有効化
localStorage.setItem('debugMode', 'true');
location.reload();

// ログを確認
console.log('デバッグ情報が表示されます');
```

---
最終更新日: 2024年3月15日 | バージョン: 1.0.0