// GitHub 統計カード（assets/stats.svg）と使用言語カード（assets/top-langs.svg）を自前生成する。
// github-readme-stats（第三者＋camp遅延）への依存を排し、実データを自前で計算・配信する。
// ランク算出は github-readme-stats と同じアルゴリズム（exponential/log-normal CDF）を再現。
// 背景透過・ライト/ダーク両方で読める配色。
// 必要環境変数: GITHUB_TOKEN（読み取りのみ）、GH_LOGIN（対象ユーザー名）

import { writeFileSync, mkdirSync } from "node:fs";

const TOKEN = process.env.GITHUB_TOKEN;
const LOGIN = process.env.GH_LOGIN || "RyoTACHIWANA";
if (!TOKEN) {
  console.error("GITHUB_TOKEN is required");
  process.exit(1);
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
      nodes {
        stargazerCount
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
    pullRequests { totalCount }
    issues { totalCount }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      totalPullRequestReviewContributions
    }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
      totalCount
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
  commits: u.contributionsCollection.totalCommitContributions + u.contributionsCollection.restrictedContributionsCount,
  prs: u.pullRequests.totalCount,
  issues: u.issues.totalCount,
  reviews: u.contributionsCollection.totalPullRequestReviewContributions,
  contributed: u.repositoriesContributedTo.totalCount,
  followers: u.followers.totalCount,
};

// ===== ランク算出（github-readme-stats と同一ロジック）=====
const exponential_cdf = (x) => 1 - 2 ** -x;
const log_normal_cdf = (x) => x / (1 + x);
function calculateRank({ commits, prs, issues, reviews, stars, followers }) {
  const COMMITS_MEDIAN = 1000, COMMITS_WEIGHT = 2;
  const PRS_MEDIAN = 50, PRS_WEIGHT = 3;
  const ISSUES_MEDIAN = 25, ISSUES_WEIGHT = 1;
  const REVIEWS_MEDIAN = 2, REVIEWS_WEIGHT = 1;
  const STARS_MEDIAN = 50, STARS_WEIGHT = 4;
  const FOLLOWERS_MEDIAN = 10, FOLLOWERS_WEIGHT = 1;
  const TOTAL = COMMITS_WEIGHT + PRS_WEIGHT + ISSUES_WEIGHT + REVIEWS_WEIGHT + STARS_WEIGHT + FOLLOWERS_WEIGHT;
  const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const LEVELS = ["S", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];
  const rank = 1 - (
    COMMITS_WEIGHT * exponential_cdf(commits / COMMITS_MEDIAN) +
    PRS_WEIGHT * exponential_cdf(prs / PRS_MEDIAN) +
    ISSUES_WEIGHT * exponential_cdf(issues / ISSUES_MEDIAN) +
    REVIEWS_WEIGHT * exponential_cdf(reviews / REVIEWS_MEDIAN) +
    STARS_WEIGHT * log_normal_cdf(stars / STARS_MEDIAN) +
    FOLLOWERS_WEIGHT * log_normal_cdf(followers / FOLLOWERS_MEDIAN)
  ) / TOTAL;
  const percentile = rank * 100;
  const level = LEVELS[THRESHOLDS.findIndex((t) => percentile <= t)];
  return { level, percentile };
}
const rank = calculateRank(stats);

// 配色（背景透過・両テーマで可読）
const ACCENT = "#6f8ff7";
const LABEL = "#8b949e";
const RINGBG = "#8b949e";

// アイコン（24x24 viewBox 相当・単色）
const ICONS = {
  stars: '<path d="M12 1.5l3.1 6.7 7.2.8-5.4 4.9 1.5 7.1L12 17.4 5.6 21l1.5-7.1L1.7 9l7.2-.8z"/>',
  commits: '<circle cx="12" cy="12" r="4.2" fill="none" stroke-width="2.6"/><line x1="0.5" y1="12" x2="7.8" y2="12" stroke-width="2.6"/><line x1="16.2" y1="12" x2="23.5" y2="12" stroke-width="2.6"/>',
  prs: '<circle cx="6.5" cy="5.5" r="3" fill="none" stroke-width="2.4"/><circle cx="6.5" cy="18.5" r="3" fill="none" stroke-width="2.4"/><circle cx="17.5" cy="18.5" r="3" fill="none" stroke-width="2.4"/><line x1="6.5" y1="8.5" x2="6.5" y2="15.5" stroke-width="2.4"/><path d="M11 5.5h4a2.5 2.5 0 0 1 2.5 2.5v7.5" fill="none" stroke-width="2.4"/>',
  issues: '<circle cx="12" cy="12" r="9.5" fill="none" stroke-width="2.6"/><circle cx="12" cy="12" r="3.2"/>',
  contributed: '<path d="M5 2.5h13a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H6.5A2.5 2.5 0 0 1 4 19V4a1.5 1.5 0 0 1 1-1.5z" fill="none" stroke-width="2.2"/><line x1="8.2" y1="2.5" x2="8.2" y2="21.5" stroke-width="2.2"/>',
};

function num(n) { return n.toLocaleString("en-US"); }

// ===== 統計カード =====
function buildStatsSVG() {
  const W = 480, H = 195;
  const rows = [
    { icon: "stars", label: "Total Stars Earned", value: stats.stars },
    { icon: "commits", label: "Total Commits", value: stats.commits },
    { icon: "prs", label: "Total PRs", value: stats.prs },
    { icon: "issues", label: "Total Issues", value: stats.issues },
    { icon: "contributed", label: "Contributed to (last year)", value: stats.contributed },
  ];
  let body = `
  <text x="25" y="34" font-size="18" font-weight="700" fill="${ACCENT}">${LOGIN}'s GitHub Stats</text>`;
  const y0 = 70, step = 24;
  rows.forEach((r, i) => {
    const y = y0 + i * step;
    body += `
  <g transform="translate(26,${y - 13}) scale(0.7)" fill="${ACCENT}" stroke="${ACCENT}">${ICONS[r.icon]}</g>
  <text x="54" y="${y}" font-size="14" fill="${LABEL}">${r.label}:</text>
  <text x="300" y="${y}" font-size="14" font-weight="700" text-anchor="end" fill="${ACCENT}">${num(r.value)}</text>`;
  });
  // ランクリング（右）
  const cx = 400, cy = 105, R = 42;
  const circ = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, (100 - rank.percentile) / 100));
  body += `
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${RINGBG}" stroke-opacity="0.25" stroke-width="6"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${ACCENT}" stroke-width="6" stroke-linecap="round"
          stroke-dasharray="${(circ * frac).toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="28" font-weight="800" fill="${ACCENT}">${rank.level}</text>`;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
  font-family="Segoe UI, Helvetica, Arial, sans-serif" role="img" aria-label="${LOGIN}'s GitHub stats: rank ${rank.level}">${body}
</svg>
`;
}

// ===== 使用言語カード =====
function buildLangsSVG() {
  const totals = new Map();
  for (const repo of u.repositories.nodes) {
    for (const e of repo.languages?.edges || []) {
      const k = e.node.name;
      const cur = totals.get(k) || { size: 0, color: e.node.color || "#858585" };
      cur.size += e.size;
      totals.set(k, cur);
    }
  }
  const all = [...totals.entries()].map(([name, v]) => ({ name, size: v.size, color: v.color }))
    .sort((a, b) => b.size - a.size);
  const grand = all.reduce((s, l) => s + l.size, 0) || 1;
  // パーセンテージは全言語に対する比率で算出し、極小（0.5%未満）は除外して上位6件を表示
  let langs = all.map((l) => ({ ...l, pct: (l.size / grand) * 100 }))
    .filter((l) => l.pct >= 0.5).slice(0, 6);

  const W = 330, H = 195;
  let body = `
  <text x="25" y="34" font-size="18" font-weight="700" fill="${ACCENT}">Most Used Languages</text>`;
  // 積み上げバー
  const barX = 25, barY = 52, barW = W - 50, barH = 10;
  let cursor = barX;
  let segs = "";
  langs.forEach((l) => {
    const w = (l.pct / 100) * barW;
    segs += `<rect x="${cursor.toFixed(2)}" y="${barY}" width="${w.toFixed(2)}" height="${barH}" fill="${l.color}"/>`;
    cursor += w;
  });
  body += `
  <clipPath id="bar"><rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="5"/></clipPath>
  <g clip-path="url(#bar)">${segs}<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="none"/></g>`;
  // 凡例（2列）
  const colX = [30, 180];
  langs.forEach((l, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = colX[col], y = 92 + row * 26;
    body += `
  <circle cx="${x}" cy="${y - 4}" r="5.5" fill="${l.color}"/>
  <text x="${x + 13}" y="${y}" font-size="13" fill="${LABEL}">${l.name} <tspan font-weight="700" fill="${ACCENT}">${l.pct.toFixed(1)}%</tspan></text>`;
  });
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
  font-family="Segoe UI, Helvetica, Arial, sans-serif" role="img" aria-label="${LOGIN}'s most used languages">${body}
</svg>
`;
}

mkdirSync("assets", { recursive: true });
writeFileSync("assets/stats.svg", buildStatsSVG());
writeFileSync("assets/top-langs.svg", buildLangsSVG());
console.log("generated stats.svg / top-langs.svg:", JSON.stringify({ ...stats, rank: rank.level }));
