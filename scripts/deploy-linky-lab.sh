#!/usr/bin/env bash
# Commande de référence — rebuild Docker Linky pour le lab « visible » + instance laplatine2026.
# Le hash git courant est injecté dans le pied de page (« UI <hash> »).
#
# Caddy (units/gateway/Caddyfile) route :
#   lab.linky.doreviateam.com  → conteneur linky_generic (tenants/linky-generic)
#   ui.lab.laplatine2026…      → conteneur linky_lab_laplatine2026
# Reconstruire uniquement laplatine2026 ne met pas à jour l’URL publique lab.linky.
#
# Usage (depuis n’importe où, si appelé par chemin absolu ou relatif depuis la racine du dépôt) :
#   ./scripts/deploy-linky-lab.sh
#
# Prérequis : Docker, réseau compose `dorevia-network`, accès au contexte
# `units/dorevia-linky` (voir tenants/linky-generic et tenants/laplatine2026/apps/ui/lab).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== 1/2 — linky_generic (lab.linky.doreviateam.com) ==="
"$ROOT/tenants/linky-generic/rebuild-linky-generic.sh"

echo "=== 2/2 — linky_lab_laplatine2026 (ui.lab.laplatine2026.doreviateam.com) ==="
"$ROOT/tenants/laplatine2026/apps/ui/lab/rebuild-linky.sh"

echo "OK — lab.linky + ui.lab.laplatine2026 alignés sur le même commit (voir « UI … » en pied de page)."
