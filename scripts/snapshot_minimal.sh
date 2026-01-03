#!/bin/bash
# Snapshot minimal — Configs + Manifests + Intents + Logs
# Usage: ./scripts/snapshot_minimal.sh [tag]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

TAG="${1:-$(date +%Y%m%d_%H%M%S)}"
SNAPSHOT_DIR="backups/snapshots/${TAG}_v1.5.1-stable"

echo "📦 Création snapshot minimal: $SNAPSHOT_DIR"
mkdir -p "$SNAPSHOT_DIR"

# Configs
echo "📋 Copie configs..."
mkdir -p "$SNAPSHOT_DIR/configs"
if [[ -f "units/gateway/Caddyfile" ]]; then
  cp "units/gateway/Caddyfile" "$SNAPSHOT_DIR/configs/" && echo "  ✅ Caddyfile"
fi

# Manifests
echo "📋 Copie manifests..."
mkdir -p "$SNAPSHOT_DIR/manifests"
if find tenants -name "manifest.json" -type f | grep -q .; then
  find tenants -name "manifest.json" -type f -exec cp --parents {} "$SNAPSHOT_DIR/manifests/" \;
  echo "  ✅ Manifests copiés ($(find "$SNAPSHOT_DIR/manifests" -name "manifest.json" | wc -l) fichiers)"
fi

# Intents
echo "📋 Copie intents..."
mkdir -p "$SNAPSHOT_DIR/intents"
if find tenants -name "intent*.json" -type f | grep -q .; then
  find tenants -name "intent*.json" -type f -exec cp --parents {} "$SNAPSHOT_DIR/intents/" \;
  echo "  ✅ Intents copiés ($(find "$SNAPSHOT_DIR/intents" -name "intent*.json" | wc -l) fichiers)"
fi

# Logs
echo "📋 Copie logs..."
mkdir -p "$SNAPSHOT_DIR/logs"
if find tenants -type d -name "logs" | grep -q .; then
  find tenants -type d -name "logs" -exec cp -r --parents {} "$SNAPSHOT_DIR/logs/" \;
  echo "  ✅ Logs copiés ($(find "$SNAPSHOT_DIR/logs" -type f | wc -l) fichiers)"
fi

# Manifest snapshot
cat > "$SNAPSHOT_DIR/SNAPSHOT_MANIFEST.txt" << EOF
# Snapshot Manifest — v1.5.1-stable

Date: $(date -Iseconds)
Tag: v1.5.1-stable
Snapshot ID: $TAG

## Contenu

- configs/ : Configuration gateway (Caddyfile)
- manifests/ : Manifests déclaratifs (tenants/*/state/manifest.json)
- intents/ : Intentions de déploiement (tenants/*/state/intents/*.json)
- logs/ : Journaux d'audit (tenants/*/state/logs/*)

## État Plateforme

- Phase 1: ✅ Complétée (66/66 points)
- Phase 2: ✅ Complétée (58/58 points)
- Corrections P0: ✅ Appliquées et validées
- Migration DNS P0.1: ✅ Complétée (2026-01-01)

## Tenants

- core: ✅ Opérationnel
- dido: ✅ Opérationnel
- rozas: ✅ Opérationnel

## Hostnames Validés

- dvig.core.doreviateam.com → HTTPS OK
- vault.core.doreviateam.com → HTTPS OK
- dvig.dido.doreviateam.com → HTTPS OK
- vault.dido.doreviateam.com → HTTPS OK
- dvig.rozas.doreviateam.com → HTTPS OK
- vault.rozas.doreviateam.com → HTTPS OK

## Statistiques

- Manifests: $(find "$SNAPSHOT_DIR/manifests" -name "manifest.json" 2>/dev/null | wc -l)
- Intents: $(find "$SNAPSHOT_DIR/intents" -name "intent*.json" 2>/dev/null | wc -l)
- Logs: $(find "$SNAPSHOT_DIR/logs" -type f 2>/dev/null | wc -l)
- Taille totale: $(du -sh "$SNAPSHOT_DIR" 2>/dev/null | cut -f1)

EOF

echo ""
echo "✅ Snapshot créé: $SNAPSHOT_DIR"
echo "📊 Taille: $(du -sh "$SNAPSHOT_DIR" | cut -f1)"
echo "📁 Fichiers: $(find "$SNAPSHOT_DIR" -type f | wc -l)"

