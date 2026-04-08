#!/usr/bin/env sh
set -eu

OCA_ROOT="${OCA_ROOT:-/mnt/oca}"
DEST="${DEST:-/mnt/extra-addons}"
EXCLUDE_MODULES="${EXCLUDE_MODULES:-}"

echo "[oca_flatten] OCA_ROOT=$OCA_ROOT"
echo "[oca_flatten] DEST=$DEST"
echo "[oca_flatten] EXCLUDE_MODULES=$EXCLUDE_MODULES"

mkdir -p "$DEST"
# Vidage complet pour éviter anciens modules, symlinks obsolètes et conflits (recommandé prod)
[ -n "$DEST" ] && [ "$DEST" != "/" ] && rm -rf "${DEST:?}"/* 2>/dev/null || true

# Lien direct de chaque module (dossier avec __manifest__.py)
find "$OCA_ROOT" -mindepth 2 -maxdepth 4 -name "__manifest__.py" | while read -r manifest; do
  mod_dir="$(dirname "$manifest")"
  mod_name="$(basename "$mod_dir")"
  repo_name="$(basename "$(dirname "$mod_dir")")"

  if [ -n "$EXCLUDE_MODULES" ] && printf '%s' ",$EXCLUDE_MODULES," | grep -q ",$mod_name,"; then
    echo "[oca_flatten] skipped: $mod_name"
    continue
  fi

  link_name="$mod_name"
  if [ -e "$DEST/$link_name" ]; then
    link_name="${repo_name}__${mod_name}"
  fi

  ln -s "$mod_dir" "$DEST/$link_name"
done

echo "[oca_flatten] linked: $(ls -1 "$DEST" | wc -l) modules"
