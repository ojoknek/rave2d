# RAVE 2D | TOKYO SUB CULTURE DJ CATALOG

インターネットとクラブの交差点。東京発の DJ ミックスブランド「RAVE 2D」の公式カタログサイトです。

## 概要

- **コンセプト**: Intersection of internet and club. Tokyo-based DJ mix brand.
- **説明**: 日本サブカル DJ のカタログチャンネル。東京のアンダーグラウンドからインターネットの海へ。

## 技術スタック

- **HTML5** … セマンティックなマークアップ
- **CSS3** … カスタムプロパティ、Grid、アニメーション、レスポンシブ対応
- **フォント**: [Unbounded](https://fonts.google.com/specimen/Unbounded), [Zen Kaku Gothic New](https://fonts.google.com/specimen/Zen+Kaku+Gothic+New)（Google Fonts）

## ファイル構成

```
rave2d/
├── index.html   # メインHTML
├── style.css    # スタイルシート
└── README.md    # 本ファイル
```

## 主な機能・構成

| セクション | 内容 |
|-----------|------|
| **ヘッダー** | ロゴ「RAVE 2D」、サブテキスト「TOKYO SUB CULTURE DJ CATALOG」 |
| **マーキー** | 上部のスクロールテキスト（新着ミックス告知など） |
| **ヒーロー** | キャッチコピー「DIGITAL NOISE ARCHIVE」、YouTube / カタログへのリンク |
| **情報バー** | STATUS（ONLINE）、LOC（TOKYO, JP）、EST（2024） |
| **ミックスアーカイブ** | カード形式のミックス一覧（TOKYO NIGHT VOL.1、INTERNET ANGEL、BLUE SCREEN など） |
| **フッター** | Twitter(X)、Instagram、TikTok へのリンク |

## デザイン

- **背景色**: `#050505`
- **アクセントカラー（RAVE BLUE）**: `#0022FF`
- **文字色**: `#FFFFFF`
- **レイアウト**: CSS Grid（サイドバー 260px + メインエリア）、最大幅 1600px
- **アニメーション**: ローダー（フェードアウト）、マーキー（横スクロール）、ONLINE の点滅、カードホバー

## レスポンシブ

- **768px 以下**: 1カラムレイアウトに切り替え、情報バーは非表示、ヒーロー見出しを縮小

## ローカルでの閲覧

1. リポジトリをクローンまたはダウンロード
2. `index.html` をブラウザで開く  
   （またはローカルサーバーで `index.html` を配信）

```bash
# 例: Python で簡易サーバー
python3 -m http.server 8000
# http://localhost:8000 でアクセス
```

## リンク

- [YouTube チャンネル](https://www.youtube.com/@RAVE2D)
- [Twitter(X)](https://x.com/rave_2d)
- [Instagram](https://www.instagram.com/rave_2d/)
- [TikTok](https://www.tiktok.com/@rave2d)

---

© RAVE 2D ALL RIGHTS RESERVED.
