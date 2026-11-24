#!/usr/bin/env bash
# Sao chép các skill của agent vào .agents/skills/ để repo tự mang theo.
#
# - Mỗi gói được GHIM vào một commit cụ thể, nên chạy lại cho cùng kết quả.
# - Chỉ lấy thư mục skill (có SKILL.md) và file văn bản. Ảnh, font, video bị bỏ
#   để tránh đưa binary vào Git (ví dụ taste-skill có ~40 MB ảnh mẫu).
# - Giấy phép của từng gói được lưu trong .agents/skills/licenses/.
#
# Dùng: bash tools/skills/vendor-skills.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="$ROOT/.agents/skills"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# pack | repo | commit | đường dẫn chứa skill (có thể nhiều, cách nhau bằng dấu cách)
PACKS=(
  "superpowers|obra/superpowers|22f0b46|skills"
  "low-level-dev|mohitmishra786/low-level-dev-skills|18f2951|skills"
  "go-skills|spf13/go-skills|383c2f8|."
  "cc-skills-golang|samber/cc-skills-golang|d68d80a|skills"
  "impeccable|pbakaus/impeccable|b49177d|plugin/skills"
  "ui-ux-pro-max|nextlevelbuilder/ui-ux-pro-max-skill|cc7b20d|.claude/skills"
  "vercel-agent-skills|vercel-labs/agent-skills|5a37a63|skills"
  "taste-skill|Leonxlnx/taste-skill|6c0b5c7|skills"
)

BINARY_EXCLUDES=(--exclude='*.png' --exclude='*.jpg' --exclude='*.jpeg' --exclude='*.webp'
  --exclude='*.gif' --exclude='*.mp4' --exclude='*.ico' --exclude='*.woff' --exclude='*.woff2'
  --exclude='*.ttf' --exclude='*.otf' --exclude='*.zip' --exclude='*.pdf' --exclude='.git'
  --exclude='node_modules' --exclude='tests' --exclude='photos')

rm -rf "$DEST"
mkdir -p "$DEST/licenses"
: > "$DEST/SOURCES.md"
{
  echo "# Nguồn skill"
  echo
  echo "Tạo bởi \`tools/skills/vendor-skills.sh\`. Mỗi gói ghim một commit."
  echo
  echo "| Gói | Repo | Commit | Số skill | Giấy phép |"
  echo "|---|---|---|---|---|"
} >> "$DEST/SOURCES.md"

for entry in "${PACKS[@]}"; do
  IFS='|' read -r pack repo commit subdirs <<< "$entry"
  src="$WORK/$pack"
  git clone -q "https://github.com/$repo.git" "$src"
  git -C "$src" checkout -q "$commit"

  lic="—"
  if [ -f "$src/LICENSE" ]; then
    cp "$src/LICENSE" "$DEST/licenses/$pack-LICENSE"; lic="MIT/LICENSE (xem licenses/)"
  elif [ -f "$src/LICENSE.md" ]; then
    cp "$src/LICENSE.md" "$DEST/licenses/$pack-LICENSE"; lic="LICENSE.md (xem licenses/)"
  else
    lic="không có file giấy phép trong repo"
  fi

  count=0
  for sub in $subdirs; do
    # Tìm mọi thư mục có SKILL.md; bỏ thư mục mẫu và bản sao trong test.
    while IFS= read -r skill_md; do
      skill_dir="$(dirname "$skill_md")"
      name="$(basename "$skill_dir")"
      case "$skill_dir" in *"/templates/"*|*"/tests/"*|*"/.git/"*) continue ;; esac
      if [ -e "$DEST/$name" ]; then
        echo "TRÙNG TÊN: $name (từ $pack) — dừng để tránh ghi đè" >&2
        exit 1
      fi
      mkdir -p "$DEST/$name"
      tar -C "$skill_dir" "${BINARY_EXCLUDES[@]}" -cf - . | tar -C "$DEST/$name" -xf -
      count=$((count + 1))
    done < <(find "$src/$sub" -name SKILL.md -not -path '*/node_modules/*' | sort)
  done

  echo "| $pack | [$repo](https://github.com/$repo) | \`$commit\` | $count | $lic |" >> "$DEST/SOURCES.md"
  echo "$pack: $count skill (commit $commit)"
done

echo "Xong: $(find "$DEST" -name SKILL.md | wc -l) SKILL.md trong $DEST"
