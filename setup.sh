#!/usr/bin/env bash
# Profile starter kit setup.
# Usage:  ./setup.sh <your-github-username>
#   e.g.  ./setup.sh octocat
#
# What it does:
#   1) Turn PROFILE_TEMPLATE.md into your README.md (the repo's README is just a landing page)
#   2) Replace the __USERNAME__ placeholder in README / SVG / scripts with your username
#   3) Generate the skill icons (skills-*.svg)
#   4) Check there are no leftovers
# Note: workflows (.github/workflows/*.yml) use ${{ github.repository_owner }} and
#       need no replacement.
set -e
cd "$(dirname "$0")"

USER="$1"
if [ -z "$USER" ]; then
  echo "Usage: ./setup.sh <github-username>   (e.g. ./setup.sh octocat)"
  exit 1
fi

if [ -f PROFILE_TEMPLATE.md ]; then
  echo "==> Using PROFILE_TEMPLATE.md as your profile README.md"
  mv -f PROFILE_TEMPLATE.md README.md
fi

echo "==> Replacing __USERNAME__ with '$USER'"
for f in README.md assets/header.svg assets/footer.svg scripts/generate-trophies.mjs scripts/generate-streak.mjs scripts/generate-stats.mjs; do
  [ -f "$f" ] && perl -pi -e "s/__USERNAME__/$USER/g" "$f"
done

echo "==> Generating skill icons"
bash scripts/fetch-skills.sh || echo "(run later with internet: bash scripts/fetch-skills.sh)"

echo "==> Checking for leftover placeholders / example references"
if grep -rn -e '__USERNAME__' -e 'uzuchan' README.md assets scripts 2>/dev/null; then
  echo "!! Something above still references the placeholder or the example account. Please check."
else
  echo "OK no leftovers"
fi

echo
echo "Next steps:"
echo "  1) git add -A && git commit -m 'setup profile' && git push"
echo "  2) Actions tab -> Run workflow on each workflow (first build)"
echo "  3) Edit the TODOs in README.md (About Me / Featured Projects / Skills)"
