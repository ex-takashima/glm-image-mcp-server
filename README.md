# glm-image-mcp-server

[![npm version](https://img.shields.io/npm/v/@dondonudonjp/glm-image-mcp-server.svg)](https://www.npmjs.com/package/@dondonudonjp/glm-image-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@dondonudonjp/glm-image-mcp-server.svg)](https://www.npmjs.com/package/@dondonudonjp/glm-image-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-8A2BE2.svg)](https://modelcontextprotocol.io/)

Z.AI の glm-image モデルを使用した画像生成 MCP サーバー

## 機能

- **MCP サーバー**: Claude Desktop やその他の MCP クライアントから画像を生成
- **バッチ CLI**: JSON 設定ファイルから複数の画像を一括生成
- **自動ダウンロード**: 生成された画像は自動的にローカルに保存

## インストール

### npm からインストール

```bash
npm install @dondonudonjp/glm-image-mcp-server
```

### ソースからビルド

```bash
git clone https://github.com/ex-takashima/glm-image-mcp-server.git
cd glm-image-mcp-server
npm install
npm run build
```

## 設定

### 環境変数

| 変数名 | 必須 | デフォルト値 | 説明 |
|--------|------|--------------|------|
| `Z_AI_API_KEY` | はい | - | Z.AI の API キー |
| `OUTPUT_DIRECTORY` | いいえ | `~/Downloads/glm-images` | 生成画像の保存先ディレクトリ |

`.env.example` を参考に `.env` ファイルを作成してください：

```bash
cp .env.example .env
# .env を編集して API キーを設定
```

## 使用方法

### MCP サーバー（Claude Desktop）

Claude Desktop の設定ファイル（`claude_desktop_config.json`）に以下を追加：

```json
{
  "mcpServers": {
    "glm-image": {
      "command": "npx",
      "args": ["@dondonudonjp/glm-image-mcp-server"],
      "env": {
        "Z_AI_API_KEY": "your_api_key"
      }
    }
  }
}
```

**ローカルビルドの場合：**
```json
{
  "mcpServers": {
    "glm-image": {
      "command": "node",
      "args": ["/path/to/glm-image-mcp-server/dist/index.js"],
      "env": {
        "Z_AI_API_KEY": "your_api_key"
      }
    }
  }
}
```

#### 利用可能なツール

**generate_image**
- `prompt`（必須）: 生成する画像の説明テキスト
- `quality`（任意）: `"hd"`（デフォルト）または `"standard"`
- `size_preset`（任意）: アスペクト比プリセット（下記参照）
- `custom_size`（任意）: カスタムサイズ（例: `"1536x1024"`）※事前検証あり
- `output_filename`（任意）: 保存するファイル名

**サイズ指定方法:**
- `size_preset` と `custom_size` のどちらかを指定（両方指定時は `size_preset` 優先）
- どちらも未指定の場合は `1:1`（1280x1280）がデフォルト

### バッチ CLI

```bash
# バッチ処理を実行
npx @dondonudonjp/glm-image-mcp-server/dist/cli.js config.json

# または glm-image-batch コマンド（グローバルインストール時）
glm-image-batch config.json

# JSON 形式で出力
glm-image-batch config.json --format json
```

#### バッチ設定ファイルの形式

```json
{
  "jobs": [
    {
      "prompt": "海に沈む美しい夕日",
      "quality": "hd",
      "size_preset": "16:9",
      "output_filename": "sunset.png"
    },
    {
      "prompt": "毛糸で遊ぶ猫",
      "custom_size": "1536x1024"
    },
    {
      "prompt": "山の風景"
    }
  ],
  "output_directory": "./output",
  "concurrency": 3
}
```

#### 終了コード

- `0`: すべてのジョブが正常に完了
- `1`: 1つ以上のジョブが失敗

## 開発

```bash
# ビルド
npm run build

# ウォッチモード
npm run dev

# MCP インスペクターでテスト
npx @anthropic/mcp-inspector dist/index.js
```

## API リファレンス

### Z.AI glm-image API

- **エンドポイント**: `POST https://api.z.ai/api/paas/v4/images/generations`
- **モデル**: `glm-image`
- **品質オプション**: `hd`, `standard`

#### 画像サイズ

**サイズプリセット（`size_preset`）:**
| プリセット | 解像度 | 用途 |
|------------|--------|------|
| `1:1` | 1280x1280 | 正方形（デフォルト） |
| `3:2` | 1568x1056 | 横長写真 |
| `2:3` | 1056x1568 | 縦長写真 |
| `4:3` | 1472x1088 | 横長スタンダード |
| `3:4` | 1088x1472 | 縦長スタンダード |
| `16:9` | 1728x960 | ワイドスクリーン |
| `9:16` | 960x1728 | スマホ縦画面 |

**カスタムサイズ（`custom_size`）の制限:**
- 幅・高さ: 1024px〜2048px
- 32で割り切れる値のみ
- 総ピクセル数: 最大 2^22 px（約419万ピクセル）
- 無効な値を指定した場合、API呼び出し前にエラーを返却

## ライセンス

MIT
