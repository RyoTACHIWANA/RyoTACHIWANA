#!/usr/bin/env bash
# Generate the skill icon strips (assets/skills-*-{dark,light}.svg) from skillicons.dev
# and self-host them in your repo. We self-host (instead of linking skillicons.dev
# directly) so GitHub's image proxy (camo) cannot cache a broken/partial response.
#
# To change your tech stack, edit the CATEGORIES below and re-run this script.
# Icon name list: https://skillicons.dev  (all lowercase)
set -e
cd "$(dirname "$0")/.."

# "category|icons(comma-separated)" — keep these in sync with the README Skills section.
CATEGORIES=(
  "languages|js,ts,html,css,python"
  "frameworks|react,nodejs,vite,tailwind"
  "tools|git,github,docker,vscode"
)

mkdir -p assets
for entry in "${CATEGORIES[@]}"; do
  cat="${entry%%|*}"; icons="${entry##*|}"
  n=$(echo "$icons" | tr ',' '\n' | grep -c .)
  want=$(( n * 256 + (n - 1) * 44 ))   # skillicons viewBox width derived from icon count
  for theme in dark light; do
    f="assets/skills-$cat-$theme.svg"
    curl -s "https://skillicons.dev/icons?i=$icons&theme=$theme" -o "$f"
    got=$(grep -oE 'viewBox="[^"]*"' "$f" | head -1 | grep -oE '[0-9]+ 256' | grep -oE '^[0-9]+')
    if [ "$got" = "$want" ]; then
      echo "OK  $f ($icons)"
    else
      echo "NG  $f : viewBox width $got != expected $want. Check the icon names."
    fi
  done
done
echo "Done. The README Skills section references assets/skills-*-*.svg."
