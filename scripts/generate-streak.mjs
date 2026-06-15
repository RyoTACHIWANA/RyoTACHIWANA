// GitHub のコントリビューションカレンダーから連続記録カード（assets/streak.svg）を生成する。
// streak-stats.demolab.com（第三者サービス＋camoキャッシュで表示が古くなる）への依存を排し、
// 実データを自前で計算・自前配信する。ライト/ダーク両方で読める配色（背景透過）。
// 必要環境変数: GITHUB_TOKEN（読み取りのみ）、GH_LOGIN（対象ユーザー名）

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
    contributionsCollection {
      contributionCalendar {
        weeks { contributionDays { date contributionCount } }
      }
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

const days = json.data.user.contributionsCollection.contributionCalendar.weeks
  .flatMap((w) => w.contributionDays)
  .sort((a, b) => a.date.localeCompare(b.date));

const total = days.reduce((s, d) => s + d.contributionCount, 0);

// 現在の連続記録: 末尾から遡る。今日がまだ0なら（その日は未確定なので）記録を切らず前日から数える。
let i = days.length - 1;
if (days[i].contributionCount === 0) i--;
let curEndIdx = i, curCount = 0;
while (i >= 0 && days[i].contributionCount > 0) { curCount++; i--; }
const curStartIdx = i + 1;
const current = {
  count: curCount,
  start: curCount ? days[curStartIdx].date : null,
  end: curCount ? days[curEndIdx].date : null,
};

// 最長の連続記録
let best = { count: 0, start: null, end: null };
let run = 0, runStart = 0;
for (let k = 0; k < days.length; k++) {
  if (days[k].contributionCount > 0) {
    if (run === 0) runStart = k;
    run++;
    if (run > best.count) best = { count: run, start: days[runStart].date, end: days[k].date };
  } else {
    run = 0;
  }
}

const firstContrib = days.find((d) => d.contributionCount > 0)?.date || days[0].date;
const today = days[days.length - 1].date;

function fmt(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function range(s, e) {
  if (!s) return "—";
  return s === e ? fmt(s) : `${fmt(s)} - ${fmt(e)}`;
}

// 配色（背景透過・両テーマで可読）
const C = {
  num: "#6f8ff7",      // 通常の数値（ブルー）
  fire: "#fb8c00",     // 現在の連続記録（オレンジ＝炎）
  label: "#8b949e",    // ラベル（グレー）
  sub: "#8b949e",      // 日付（グレー）
  divider: "#8b949e",
};

const W = 495, H = 165;
const cols = [W * 0.18, W * 0.5, W * 0.82]; // 各カラム中心x
const ringR = 33, ringCY = 60;

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  xmlns="http://www.w3.org/2000/svg" role="img"
  aria-label="${LOGIN}'s contribution streak: current ${current.count} days, longest ${best.count} days, total ${total}">
  <style>
    text { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; }
    .num { font-size: 28px; font-weight: 800; }
    .ringnum { font-size: 30px; font-weight: 800; }
    .label { font-size: 13px; font-weight: 700; }
    .sub { font-size: 10.5px; font-weight: 400; }
  </style>

  <line x1="${W / 3}" y1="28" x2="${W / 3}" y2="${H - 28}" stroke="${C.divider}" stroke-opacity="0.3" stroke-width="1"/>
  <line x1="${(2 * W) / 3}" y1="28" x2="${(2 * W) / 3}" y2="${H - 28}" stroke="${C.divider}" stroke-opacity="0.3" stroke-width="1"/>

  <!-- Total Contributions -->
  <text class="num" x="${cols[0]}" y="62" text-anchor="middle" fill="${C.num}">${total.toLocaleString("en-US")}</text>
  <text class="label" x="${cols[0]}" y="98" text-anchor="middle" fill="${C.label}">Total Contributions</text>
  <text class="sub" x="${cols[0]}" y="120" text-anchor="middle" fill="${C.sub}">${fmt(firstContrib)} - Present</text>

  <!-- Current Streak (中央・リング強調) -->
  <circle cx="${cols[1]}" cy="${ringCY}" r="${ringR}" fill="none" stroke="${C.fire}" stroke-width="5" stroke-opacity="0.25"/>
  <circle cx="${cols[1]}" cy="${ringCY}" r="${ringR}" fill="none" stroke="${C.fire}" stroke-width="5" stroke-linecap="round"
          stroke-dasharray="${(2 * Math.PI * ringR).toFixed(1)}" transform="rotate(-90 ${cols[1]} ${ringCY})"/>
  <text class="ringnum" x="${cols[1]}" y="${ringCY}" text-anchor="middle" dominant-baseline="central" fill="${C.fire}">${current.count}</text>
  <text class="label" x="${cols[1]}" y="112" text-anchor="middle" fill="${C.fire}">Current Streak</text>
  <text class="sub" x="${cols[1]}" y="132" text-anchor="middle" fill="${C.sub}">${range(current.start, current.end)}</text>

  <!-- Longest Streak -->
  <text class="num" x="${cols[2]}" y="62" text-anchor="middle" fill="${C.num}">${best.count}</text>
  <text class="label" x="${cols[2]}" y="98" text-anchor="middle" fill="${C.label}">Longest Streak</text>
  <text class="sub" x="${cols[2]}" y="120" text-anchor="middle" fill="${C.sub}">${range(best.start, best.end)}</text>
</svg>
`;

mkdirSync("assets", { recursive: true });
writeFileSync("assets/streak.svg", svg);
console.log("generated assets/streak.svg:", JSON.stringify({ total, current: current.count, longest: best.count }));
