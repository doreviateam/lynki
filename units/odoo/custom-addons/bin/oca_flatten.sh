#!/usr/bin/env sh
set -eu

OCA_ROOT="${OCA_ROOT:-/mnt/oca}"
DEST="${DEST:-/mnt/extra-addons}"

echo "[oca_flatten] OCA_ROOT=$OCA_ROOT"
echo "[oca_flatten] DEST=$DEST"

mkdir -p "$DEST"

# Supprime uniquement les symlinks (on ne touche pas au reste)
find "$DEST" -maxdepth 1 -type l -delete 2>/dev/null || true

# Lien direct de chaque module (dossier avec __manifest__.py)
find "$OCA_ROOT" -mindepth 2 -maxdepth 4 -name "__manifest__.py" | while read -r manifest; do
  mod_dir="$(dirname "$manifest")"
  mod_name="$(basename "$mod_dir")"
  repo_name="$(basename "$(dirname "$mod_dir")")"

  link_name="$mod_name"
  if [ -e "$DEST/$link_name" ]; then
    link_name="${repo_name}__${mod_name}"
  fi

  ln -s "$mod_dir" "$DEST/$link_name"
done

echo "[oca_flatten] linked: $(ls -1 "$DEST" | wc -l) modules"
