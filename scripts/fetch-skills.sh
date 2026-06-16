#!/usr/bin/env bash
# Generate the skill icon strips (assets/skills-*-{dark,light}.svg) from skillicons.dev
# and self-host them in your repo. We self-host (instead of linking skillicons.dev
# directly) so GitHub's image proxy (camo) cannot cache a broken/partial response.
#
# The icon list below is derived from icon_experience_checklist.md (the items you
# checked with [x]). To change your tech stack, edit the CATEGORIES below and re-run
# this script.  Icon name list: https://skillicons.dev  (all lowercase)
set -e
cd "$(dirname "$0")/.."

# How many icons per row before wrapping to the next line (skillicons "perline").
PERLINE=12

# "category|icons(comma-separated)" — keep these in sync with the README Skills section.
# Source of truth: icon_experience_checklist.md (checked [x] items, social/contact excluded).
CATEGORIES=(
  "languages|py,r,c,cpp,cs,java,kotlin,php,js,html,css,matlab"
  "frameworks|pytorch,tensorflow,sklearn,opencv,nodejs,threejs,selenium"
  "tools|git,github,vscode,vim,emacs,eclipse,visualstudio,npm,bash,powershell,aws,nginx,mysql,notion,obsidian,discord,linux,ubuntu,windows,apple,wordpress,latex,md,svg"
)

mkdir -p assets
for entry in "${CATEGORIES[@]}"; do
  cat="${entry%%|*}"; icons="${entry##*|}"
  n=$(echo "$icons" | tr ',' '\n' | grep -c .)
  cols=$(( n < PERLINE ? n : PERLINE ))          # columns actually drawn
  rows=$(( (n + PERLINE - 1) / PERLINE ))         # number of wrapped rows
  want=$(( cols * 256 + (cols - 1) * 44 ))        # expected skillicons viewBox width
  for theme in dark light; do
    f="assets/skills-$cat-$theme.svg"
    curl -s "https://skillicons.dev/icons?i=$icons&theme=$theme&perline=$PERLINE" -o "$f"
    # viewBox="0 0 WIDTH HEIGHT" -> the 3rd number is the width
    got=$(grep -oE 'viewBox="[0-9. ]+"' "$f" | head -1 | grep -oE '[0-9.]+' | sed -n '3p')
    if [ "$got" = "$want" ]; then
      echo "OK  $f ($n icons, ${rows} row(s))"
    else
      echo "NG  $f : viewBox width ${got:-none} != expected $want. Check the icon names."
    fi
  done
done
echo "Done. The README Skills section references assets/skills-*-*.svg."
