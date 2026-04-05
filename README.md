# RAVE 2D | TOKYO SUB CULTURE DJ CATALOG

インターネットとクラブの交差点。東京発の DJ ミックスブランド「RAVE 2D」の公式カタログサイトです。

## 概要

- **コンセプト**: Intersection of internet and club. Tokyo-based DJ mix brand.
- **説明**: 日本サブカル DJ のカタログチャンネル。東京のアンダーグラウンドからインターネットの海へ。

## 技術スタック

- **HTML5** … セマンティックなマークアップ、`viewport-fit=cover` によるノッチ対応
- **CSS3** … カスタムプロパティ、Grid、アニメーション、レスポンシブ（スマホ・タブレット・デスクトップ）、safe-area
- **JavaScript** … ローダー制御、YouTube サムネイル取得・ポップアップ、イベントページのカーソル連動アノテーション
- **フォント（トップ・イベント）**: [Unbounded](https://fonts.google.com/specimen/Unbounded), [Zen Kaku Gothic New](https://fonts.google.com/specimen/Zen+Kaku+Gothic+New)（Google Fonts）
- **RAVE WEAR 専用ページ**（`rave-wear/`）: Inter / Noto Sans JP、スタイルはルートの `style.css` とは別の `rave-wear/style.css`

## ファイル構成

```
rave2d/
├── index.html              # トップページ（カタログ・EC 導線・イベント一覧）
├── style.css               # トップ・イベント詳細の共通スタイル
├── CNAME                   # GitHub Pages 用（任意）
├── README.md               # 本ファイル
├── image/                  # ロゴ・イベントビジュアル・商品画像・ファビコン
│   ├── RAVE2D-fabicon.svg
│   ├── RAVE2D-WHITE.png
│   ├── RAVE2D-WORD.png
│   ├── RAVE2D-HIGHWAY1.png
│   ├── RAVE2D-MIRAI.png
│   ├── RAVE2D-OSAKA.png
│   ├── RAVE2D-OSAKA-Flyer.png
│   ├── RAVE2D-ASAGAYA.png
│   ├── TEE-LOGO.png
│   ├── TEE-MIXTAPE.png
│   └── TEE-SMOKY.png
├── rave-wear/
│   ├── index.html          # RAVE WEAR ランディング（EC 導線）
│   └── style.css           # RAVE WEAR 専用スタイル
└── events/                 # イベント詳細（各フォルダに index.html）
    ├── mirai/
    ├── highway/
    ├── osaka/
    └── asagaya/
```

---

## 設計構造

### CSS の全体構成

| ブロック | 内容 |
|----------|------|
| **RESET & VARS** | `:root` のカスタムプロパティ（`--bg`, `--blue`, `--font-en` など）、`box-sizing` |
| **REVEAL** | `[data-reveal]` によるロード・スクロール時のフェードイン |
| **SPLIT TITLE** | ヒーロー見出しの行ごとアニメーション（`data-split`） |
| **GRID LAYOUT** | `.grid-container` の 2 列グリッド定義 |
| **HEADER / MARQUEE / HERO / INFO-BAR / MAIN-CONTENT / FOOTER** | 各グリッドセルとコンポーネント |
| **CATALOG / CARD / POPUP** | カタログカード、サムネイルポップアップ |
| **RESPONSIVE** | 1024px / 768px / 480px のメディアクエリ |
| **LOADER** | 初回表示ローダー（Block Studio 風） |
| **EVENT PAGE** | `body.page-event` 用（`events/*/index.html`）のグリッド・コンポーネント・レスポンシブ |

### グリッドレイアウト

- **ベース**: `grid-template-columns: 260px 1fr`（左サイドバー / メイン）、`grid-template-rows: auto auto 1fr auto`。最大幅 1600px・中央寄せ。
- **デスクトップ（index.html）**
  - 列1: `.header`（1〜2行）、`.info-bar`（3〜5行）
  - 列2: `.marquee-section`（1行）、`.hero`（2行）、`.main-content`（3行）、`.footer`（4行）
- **デスクトップ（events/*/index.html / `body.page-event`）**
  - 列1: `.header`、`.info-bar`
  - 列2: `.marquee-section`、`.event-main`（2〜4行）、`.event-footer`（4行）
- **1024px 以下（タブレット）**: 列幅を `200px 1fr` に変更。ヒーロー・カタログ・イベントメインのパディング・フォントを調整。
- **768px 以下（スマホ・縦）**: **1 カラム**（`grid-template-columns: 1fr`）。全セルを `grid-column: 1 / 2` にし、縦並びで表示。情報バーは非表示。ヘッダーは横並び（ロゴ＋サブテキスト）。
- **イベントページの注意**: `.page-event .event-main` と `.page-event .event-footer` の**ベース**は「EVENT PAGE」ブロック内で `grid-column: 2/3` と後から定義されているため、768px では**イベントページ専用の `@media (max-width: 768px)` ブロック（style.css 末尾）**で `grid-column: 1/2` を再度指定し、フッターがメイン縦並びの下端に表示されるようにしている。
- **480px 以下（小型スマホ）**: `env(safe-area-inset-*)` でノッチ・ホームインジケーターを考慮。イベントページは `body.page-event` に `padding-bottom: env(safe-area-inset-bottom)`、フッターに `padding-bottom: calc(20px + env(safe-area-inset-bottom))` を指定。

### ページ種別とクラス

| ページ | body クラス | メインコンテンツ | 備考 |
|--------|-------------|------------------|------|
| トップ | なし | `.hero` + `.main-content` | ヒーロー、MIX CATALOG / RAVE WEAR / EVENTS |
| RAVE WEAR | `page-wear` | `rave-wear/index.html` 内の `.wear-wrap` など | `rave-wear/style.css` でスタイル。トップへ戻るリンク |
| イベント詳細 | `page-event` | `.event-main` | タイトル、ビジュアル、place/date/time アノテーション、DJ lineup、BACK ボタン。フッターは `.footer.event-footer` |

### 主なコンポーネント（クラス）

- **ヘッダー**: `.header`、`.logo-img`、`.sub-text`、イベントページでは `.logo-link` でラップ
- **マーキー**: `.marquee-section`、`.marquee-track`、`.marquee-content`
- **ヒーロー**: `.hero`、`.hero-inner`、`.hero-title`（`.line`、`.blue-txt`）、`.hero-desc`、`.btn-group`、`.hero-deco`
- **情報バー**: `.info-bar`、`.blink`（768px 以下で非表示）
- **カタログ**: `.main-content`、`.catalog`、`.section-label`、`.card`、`.card-img`、`.card-info`、`.card-link`
- **フッター**: `.footer`、`.footer-links`、`.copy`
- **イベントページ**: `.event-main`、`.event-title`、`.event-visual`、`.event-anno`（`--place` / `--date` / `--time`）、`.event-detail`、`.event-lineup-list`、`.event-back`、`.event-footer`

### アニメーション・インタラクション

- ローダー: 表示 → フェードアウト → `[data-reveal]` 要素を `.is-visible` で表示
- マーキー: 横スクロール（`@keyframes marquee`）、ホバーで一時停止
- ヒーロー見出し: 行ごとにスライドアップ＋フェード（`data-split`）
- カード: ホバーで浮き上がり・ボーダー・シャドウ変化、サムネイルポップアップ（Esc／背景クリックで閉じる）
- イベントページ: マウス位置に連動する place/date/time アノテーションの揺れ（タッチデバイスでは `will-change` を外して軽量化）

---

## 主な機能・構成

### トップページ（index.html）

| セクション | 内容 |
|-----------|------|
| **ヘッダー** | ロゴ「RAVE 2D」、サブテキスト「TOKYO SUB CULTURE DJ CATALOG」 |
| **マーキー** | 上部のスクロールテキスト。ナビから ABOUT / CATALOG / EVENTS へジャンプ（タブ切替）、RAVE WEAR は `rave-wear/` へ |
| **ヒーロー** | キャッチコピー、NEWS（RAVE WEAR 公開案内）、**LATEST MIX**（YouTube 埋め込み）、ABOUT・CATALOG・EVENTS・RAVE WEAR への導線 |
| **情報バー** | STATUS（ONLINE）、LOC（TOKYO, JP）、EST（2024）※768px 以下で非表示 |
| **メイン（タブパネル）** | `.main-content` 内を **ABOUT / MIX CATALOG / EVENTS / RAVE WEAR** のパネルで切替（マーキー・ヒーローのタブボタンと連動） |
| **ABOUT** | ブランド紹介コピー、YouTube へのボタン |
| **MIX CATALOG** | カード形式のミックス一覧。YouTube サムネイル表示・クリックでサムネイルポップアップ＋「LISTEN」など |
| **EVENTS** | カード形式のイベント一覧。各カードに「DETAIL」→ `events/mirai/` など |
| **RAVE WEAR** | カード形式の商品一覧。Stripe などへの「BUY」ボタン。専用ランディングは `rave-wear/` |
| **フッター** | X(Twitter)、Instagram、TikTok へのリンク |

### RAVE WEAR ページ（rave-wear/index.html）

トップからマーキー・ヒーロー・ボタンで遷移。独自ローダー・ヘッダー（トップへ戻る）・商品グリッドなど、`rave-wear/style.css` で構成。

### イベント詳細ページ（events/*/index.html）

共通レイアウトは `style.css` の `.page-event`。トップの EVENTS からリンクされるページ:

| パス | カード上の表記（例） |
|------|----------------------|
| `events/mirai/` | MIRAI — IKEJIRI-OHASHI, TOKYO |
| `events/highway/` | HIGHWAY — IKEJIRI-OHASHI, TOKYO |
| `events/osaka/` | OSAKA — NAMBA, OSAKA |
| `events/asagaya/` | ASAGAYA — ASAGAYA, TOKYO |

各ページの内容イメージ:

| セクション | 内容 |
|-----------|------|
| **ヘッダー・マーキー** | トップと同様（イベント名・日付・会場をマーキーで表示） |
| **イベントメイン** | タイトル、会場・日付・時間のアノテーション（カーソル連動）、ビジュアル画像、入場料・注意書き、DJ lineup、タグライン、「← BACK TO EVENTS」ボタン |
| **情報バー** | EVENT / DATE / VENUE（768px 以下で非表示） |
| **フッター** | トップと同様。768px 以下ではメイン縦並びの下端に表示（index と同一の挙動） |

---

## デザイン

- **背景色**: `#050505`（`--bg`）
- **アクセントカラー（RAVE BLUE）**: `#0022FF`（`--blue`）、グロー `rgba(0, 34, 255, 0.4)`
- **文字色**: `#FFFFFF`（`--text`）
- **ライン**: `#333333`（`--line`）
- **レイアウト**: CSS Grid（サイドバー 260px → 1024px で 200px / メイン 1fr）、最大幅 1600px
- **アニメーション**: ローダー（フェードアウト）、マーキー（横スクロール）、ONLINE の点滅、ヒーロー見出しの行アニメ、カードホバー、サムネイルポップアップ、イベントページのアノテーション揺れ
- **MIX CATALOG サムネイル**: YouTube 動画 URL からサムネイルを取得し、カード内で表示。クリックでオーバーレイポップアップ

---

## レスポンシブ

| ブレークポイント | レイアウト・主な変更 |
|------------------|------------------------|
| **1024px 以下** | サイドバー 200px。ヒーロー・カタログ・イベントメインのパディング・フォント縮小。カタログは `minmax(220px, 1fr)`。 |
| **768px 以下** | **1 カラム**。全セル `grid-column: 1/2`。情報バー非表示。ヘッダー横並び、ロゴ 120px。ヒーロー見出し `clamp(1.75rem, 8vw, 2.5rem)`。カタログ `minmax(160px, 1fr)`。**イベントページ**: 専用ブロックで `.event-main` / `.event-footer` を `grid-column: 1/2` に上書きし、フッターをメイン下端に表示。 |
| **480px 以下** | `env(safe-area-inset-left/right)`。ロゴ 90px。ヒーロー・パディング縮小。カタログ 1 列。**イベントページ**: `body.page-event` に safe-area 下、フッター下パディング、フォント・タップ領域（min-height 44px/48px）を調整。 |

---

## ローカルでの閲覧

1. リポジトリをクローンまたはダウンロード
2. `index.html` をブラウザで開く  
   （またはローカルサーバーでサイトルートを配信）

```bash
# 例: Python で簡易サーバー（リポジトリのルートで実行）
python3 -m http.server 8000
# トップ: http://localhost:8000/
# RAVE WEAR: http://localhost:8000/rave-wear/
# イベント例:
#   http://localhost:8000/events/mirai/
#   http://localhost:8000/events/highway/
#   http://localhost:8000/events/osaka/
#   http://localhost:8000/events/asagaya/
```

## リンク

- [YouTube チャンネル](https://www.youtube.com/@RAVE2D)
- [Twitter(X)](https://x.com/rave_2d)
- [Instagram](https://www.instagram.com/rave_2d/)
- [TikTok](https://www.tiktok.com/@rave2d)

---

© RAVE 2D ALL RIGHTS RESERVED.
