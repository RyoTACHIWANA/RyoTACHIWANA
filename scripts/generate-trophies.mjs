// GitHub統計からトロフィーSVGを生成する（ライト/ダーク両対応）。
// 本家 github-profile-trophy (ryo-ma) のカード意匠を再現:
//   上部にカテゴリ名 / 中央に円形プログレスリング＋ランク文字 / 下部にスコア / カードに影。
// 公開インスタンスが停止中（DEPLOYMENT_DISABLED）のため自前生成する。
// 必要環境変数: GITHUB_TOKEN（読み取りのみ）、GH_LOGIN（対象ユーザー名）
// 出力: assets/trophies-light.svg, assets/trophies-dark.svg
// 注: Commits は GitHub API 仕様上「直近1年間」のコントリビューション数。

import { writeFileSync, mkdirSync } from "node:fs";

const TOKEN = process.env.GITHUB_TOKEN;
const LOGIN = process.env.GH_LOGIN || "__USERNAME__";
if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
      totalCount
      nodes { stargazerCount }
    }
    pullRequests { totalCount }
    issues { totalCount }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
    }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
});
const json = await res.json();
if (!json.data?.user) {
  console.error("GraphQL error:", JSON.stringify(json.errors || json));
  process.exit(1);
}
const u = json.data.user;

const stats = {
  stars: u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0),
  commits:
    u.contributionsCollection.totalCommitContributions +
    u.contributionsCollection.restrictedContributionsCount,
  followers: u.followers.totalCount,
  repos: u.repositories.totalCount,
  prs: u.pullRequests.totalCount,
  issues: u.issues.totalCount,
};

// ランクのしきい値（降順）: [SSS, SS, S, AAA, AA, A, B]。下回れば C。
const TIERS = ["SSS", "SS", "S", "AAA", "AA", "A", "B"];

// value から「ランク」と「次ランクまでの進捗率(0..1)」を求める。
function evaluate(value, thresholds) {
  let i = thresholds.findIndex((t) => value >= t);
  if (i === -1) {
    // C ランク: 0 → B のしきい値までの進捗
    const upper = thresholds[thresholds.length - 1];
    return { rank: "C", progress: Math.min(value / upper, 1) };
  }
  const rank = TIERS[i];
  if (i === 0) return { rank, progress: 1 }; // 最高ランク SSS は満タン
  const lower = thresholds[i];
  const upper = thresholds[i - 1];
  return { rank, progress: Math.min((value - lower) / (upper - lower), 1) };
}

// ランク→色（ゴールド=S系 / パープル=A系 / ブルー=B / グレー=C）。両テーマで可読。
function tierColor(rank) {
  if (rank.startsWith("S")) return "#e3b341"; // gold
  if (rank.startsWith("A")) return "#a371f7"; // purple
  if (rank === "B") return "#6f8ff7"; // blue (profile accent)
  return "#8b949e"; // gray
}

const CARDS = [
  { label: "Stars", value: stats.stars, thresholds: [100, 50, 25, 10, 5, 3, 2] },
  { label: "Commits", value: stats.commits, thresholds: [2000, 1000, 500, 200, 100, 50, 20] },
  { label: "Followers", value: stats.followers, thresholds: [100, 50, 25, 10, 5, 3, 2] },
  { label: "Repositories", value: stats.repos, thresholds: [50, 30, 20, 12, 8, 5, 3] },
  { label: "PullRequest", value: stats.prs, thresholds: [200, 100, 50, 25, 12, 6, 3] },
  { label: "Issues", value: stats.issues, thresholds: [100, 50, 25, 12, 8, 4, 2] },
];

const THEME = {
  light: { cardFill: "#fffefe", cardBorder: "#e4e2e2", title: "#434d58", ringBg: "#dfe2e5", score: "#6f8ff7", shadow: 0.16 },
  dark: { cardFill: "#1a1b27", cardBorder: "#2a2c3d", title: "#a9b1d6", ringBg: "#3b3e52", score: "#6f8ff7", shadow: 0.4 },
};

const CARD_W = 120;
const CARD_H = 132;
const GAP = 10;
const R = 26; // リング半径
const CX = CARD_W / 2;
const CY = 70; // リング中心 y
const CIRC = 2 * Math.PI * R;

function buildSVG(themeName) {
  const t = THEME[themeName];
  const width = CARDS.length * CARD_W + (CARDS.length - 1) * GAP;
  let body = "";
  CARDS.forEach((c, idx) => {
    const x = idx * (CARD_W + GAP);
    const { rank, progress } = evaluate(c.value, c.thresholds);
    const color = tierColor(rank);
    const dash = (CIRC * progress).toFixed(2);
    const rankFont = rank.length >= 3 ? 18 : rank.length === 2 ? 22 : 27;
    body += `
  <g transform="translate(${x},0)">
    <rect x="1.5" y="1.5" width="${CARD_W - 3}" height="${CARD_H - 3}" rx="8"
          fill="${t.cardFill}" stroke="${t.cardBorder}" stroke-width="1.2" filter="url(#sh)"/>
    <text x="${CX}" y="26" text-anchor="middle"
          font-family="Segoe UI, Helvetica, Arial, sans-serif"
          font-size="13.5" font-weight="700" fill="${t.title}">${c.label}</text>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${t.ringBg}" stroke-width="6"/>
    <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${color}" stroke-width="6"
            stroke-linecap="round" stroke-dasharray="${dash} ${CIRC.toFixed(2)}"
            transform="rotate(-90 ${CX} ${CY})"/>
    <text x="${CX}" y="${CY}" text-anchor="middle" dominant-baseline="central"
          font-family="Segoe UI, Helvetica, Arial, sans-serif"
          font-size="${rankFont}" font-weight="800" fill="${color}">${rank}</text>
    <text x="${CX}" y="119" text-anchor="middle"
          font-family="Segoe UI, Helvetica, Arial, sans-serif"
          font-size="14" font-weight="700" fill="${t.score}">${c.value.toLocaleString("en-US")}</text>
  </g>`;
  });
  return `<svg width="${width}" height="${CARD_H}" viewBox="0 0 ${width} ${CARD_H}"
  xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${LOGIN}'s trophies">
  <defs>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000000" flood-opacity="${t.shadow}"/>
    </filter>
  </defs>${body}
</svg>
`;
}

mkdirSync("assets", { recursive: true });
writeFileSync("assets/trophies-light.svg", buildSVG("light"));
writeFileSync("assets/trophies-dark.svg", buildSVG("dark"));
console.log("generated trophies-light.svg / trophies-dark.svg:", JSON.stringify(stats));
