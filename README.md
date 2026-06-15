# GitHub Profile README Starter

A ready-made GitHub **profile** that auto-generates and self-hosts trophies, stats,
a streak card, top languages, a contribution snake, a metrics dashboard, and a 3D
"city" built from your commits. Everything updates on a schedule from real data.

GitHubの**プロフィール**を一式そろえるテンプレートです。トロフィー・統計・連続記録・使用言語・
スネーク・メトリクス・コミット履歴から育つ3Dの街を、実データから自動更新します。

[![License: MIT](https://img.shields.io/badge/License-MIT-6f8ff7?style=flat-square)](LICENSE)
![Template](https://img.shields.io/badge/Use_this-template-2ea44f?style=flat-square&logo=github)

**This guide is written in English and 日本語 — この解説は英語と日本語で読めます: [English](#english) ・ [日本語](#日本語)**

---

## Live example / 実例

A real profile built with this template — このテンプレートで作った実例:

### [github.com/uzuchan](https://github.com/uzuchan)

<div align="center">

![header](https://raw.githubusercontent.com/uzuchan/uzuchan/main/assets/header.svg)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/uzuchan/uzuchan/main/assets/trophies-dark.svg">
  <img alt="trophies" src="https://raw.githubusercontent.com/uzuchan/uzuchan/main/assets/trophies-light.svg">
</picture>

<img height="160" alt="stats" src="https://raw.githubusercontent.com/uzuchan/uzuchan/main/assets/stats.svg">
<img height="160" alt="top languages" src="https://raw.githubusercontent.com/uzuchan/uzuchan/main/assets/top-langs.svg">

</div>

---

# English

## What you get

- Trophies, GitHub stats, streak, and top-languages cards — **self-generated from real data, no third-party service**
- A contribution **snake** animation and a **metrics** dashboard
- A 3D **contribution city** (with a link to the interactive WebGL version)
- An animated header banner and skill icons
- **Auto-updates** via GitHub Actions (trophies/stats every 6h, the rest daily)
- Works with the built-in token — **no Personal Access Token needed**

## How to use

> You will need a GitHub account and a terminal with `git` (or GitHub Desktop).

**1. Create your profile repository.**
Create a **public** repository whose name is **exactly your username** (e.g. username `octocat` -> repo `octocat`).
GitHub shows a "you found a secret!" note, confirming it is your special profile repo.
Easiest: the green **"Use this template"** button at the top of this page -> name it like your username.

**2. Get the files locally.**
```bash
git clone https://github.com/<your-username>/<your-username>.git
cd <your-username>
```
(No terminal? Use **GitHub Desktop** to clone, then open the folder.)

**3. Run the setup script.**
```bash
./setup.sh <your-username>
```
It turns `PROFILE_TEMPLATE.md` into your `README.md`, replaces the `__USERNAME__` placeholder, generates skill icons, and checks for leftovers.

**4. Commit and push.**
```bash
git add -A && git commit -m "set up my profile" && git push
```

**5. Turn on the automation.**
Open the **Actions** tab, enable workflows if asked, then **Run workflow** on each once
(`Generate Stats`, `Generate Snake Animation`, `Generate Metrics`, `Generate 3D Contribution City`).
Reload your profile after a minute.

**6. Make it yours.**
Edit the `TODO` parts in `README.md`: **About Me**, **Featured Projects** (set `__REPO__` to your repos), and **Skills** (see Customizing).
Optional: on your contribution graph, open **Contribution settings** and enable **Private contributions** to include private activity in the numbers (contents stay private).

## Customizing

- **Skills**: edit the `CATEGORIES` list in `scripts/fetch-skills.sh`, then run `bash scripts/fetch-skills.sh` again. Icon names: <https://skillicons.dev> (all lowercase).
- **Header tagline**: edit the text in `assets/header.svg`.
- **Accent color**: `#6f8ff7` is used throughout — search & replace to change it.

## How it works

| Element | Source | Updates |
|---------|--------|---------|
| Header / Footer | `assets/header.svg` `footer.svg` | static (name set by setup.sh) |
| Trophies / Streak / Stats / Top languages | `scripts/generate-*.mjs` -> `assets/*.svg` | every 6h |
| Snake | Platane/snk -> `output` branch | daily |
| Metrics | lowlighter/metrics -> `metrics.svg` | daily |
| Contribution City (3D) | github-profile-3d-contrib | daily |
| Skill icons | `scripts/fetch-skills.sh` -> `assets/skills-*.svg` | manual |

Workflows detect the repository owner with `${{ github.repository_owner }}`, so they target **your** data automatically. Image URLs carry a `?v=` value that the workflow bumps on each update, so the display never gets stuck on GitHub's image cache.

---

# 日本語

## このキットでできること

- トロフィー・GitHub統計・連続記録・使用言語カード — **実データから自前生成（外部サービス非依存）**
- コントリビューションの**スネーク**アニメと**メトリクス**ダッシュボード
- コミット履歴から育つ**3Dの街**（操作できるWebGL版へのリンク付き）
- アニメーションするヘッダーバナーと使用技術アイコン
- GitHub Actions で**自動更新**（トロフィー/統計は6時間ごと、他は毎日）
- 標準トークンで動作 — **個人アクセストークン（PAT）は不要**

## 使い方

> 必要なもの: GitHubアカウントと、`git` が使えるターミナル（または GitHub Desktop）。

**1. プロフィール用リポジトリを作る。**
**自分のユーザー名と完全に同じ名前**の **public** リポジトリを作ります（例: ユーザー名 `octocat` → リポジトリ名も `octocat`）。
作成画面で「秘密を見つけました！」のような表示が出れば、それが特別な「プロフィール用リポジトリ」です。
一番簡単なのは、このページ上部の緑の **「Use this template」** ボタン → リポジトリ名を自分のユーザー名と同じにする方法です。

**2. ファイルを自分のPCに取得する。**
```bash
git clone https://github.com/<ユーザー名>/<ユーザー名>.git
cd <ユーザー名>
```
（ターミナルが苦手なら **GitHub Desktop** で clone してフォルダを開いてもOK）

**3. セットアップスクリプトを実行する。**
```bash
./setup.sh <ユーザー名>
```
`PROFILE_TEMPLATE.md` が `README.md` になり、`__USERNAME__` が一括置換され、使用技術アイコンも生成され、置換漏れもチェックされます。

**4. コミットして push する。**
```bash
git add -A && git commit -m "set up my profile" && git push
```

**5. 自動更新をオンにする。**
**Actions** タブを開き、必要なら「ワークフローを有効化」。各ワークフロー
（`Generate Stats` / `Generate Snake Animation` / `Generate Metrics` / `Generate 3D Contribution City`）を **「Run workflow」** で1回ずつ実行（以降は自動）。
1分ほど待ってプロフィールを再読み込みするとカードが表示されます。

**6. 自分の内容に編集する。**
`README.md` の `TODO` を埋めます: **About Me**、**Featured Projects**（`__REPO__` を自分のリポジトリ名に）、**Skills**（下のカスタマイズ参照）。
任意: コントリビューショングラフの **Contribution settings** → **Private contributions** をONにすると非公開リポの活動も件数に反映されます（中身は非公開のまま）。

## カスタマイズ

- **使用技術（Skills）**: `scripts/fetch-skills.sh` の `CATEGORIES` を編集して `bash scripts/fetch-skills.sh` を再実行。アイコン名一覧: <https://skillicons.dev>（すべて小文字）。
- **ヘッダーの肩書き**: `assets/header.svg` のテキストを編集。
- **アクセントカラー（配色）**: 全体で `#6f8ff7` を使用 — 置換すれば色を変えられます。

## 仕組み

| 表示 | 生成元 | 更新 |
|------|--------|------|
| ヘッダー / フッター | `assets/header.svg` `footer.svg` | 固定（名前は setup.sh が設定） |
| トロフィー / 連続記録 / 統計 / 使用言語 | `scripts/generate-*.mjs` → `assets/*.svg` | 6時間ごと |
| スネーク | Platane/snk → `output` ブランチ | 毎日 |
| メトリクス | lowlighter/metrics → `metrics.svg` | 毎日 |
| Contribution City（3D） | github-profile-3d-contrib | 毎日 |
| 使用技術アイコン | `scripts/fetch-skills.sh` → `assets/skills-*.svg` | 手動 |

ワークフローは `${{ github.repository_owner }}` でリポジトリの持ち主を自動取得するため、**自分の**データが対象になります。画像URLの `?v=` はデータ更新時にワークフローが自動で付け替えるので、表示がGitHubの画像キャッシュで古いまま固まりません。

---

## Credits / License

- Trophies / streak / stats / top-languages cards are this kit's own generators (no external
  service). The rank algorithm mirrors [github-readme-stats](https://github.com/anuraghazra/github-readme-stats) (MIT).
- 3D SVG: [github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib) (MIT)
- Interactive 3D city (link target): [honzaap/GithubCity](https://github.com/honzaap/GithubCity) (Apache-2.0)
- Snake: [Platane/snk](https://github.com/Platane/snk) / Metrics: [lowlighter/metrics](https://github.com/lowlighter/metrics)
- Icons: [skillicons.dev](https://skillicons.dev)

MIT licensed — see [LICENSE](LICENSE). Made by [uzuchan](https://github.com/uzuchan).
