#!/usr/bin/env bash
# Vider le cache Symfony (prod) du site Sylius et redémarrer PHP-FPM + Nginx.
# Usage : depuis la racine du projet : ./scripts/restart_sylius_cache.sh

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Vidage du cache prod Sylius..."
docker exec sylius_lab_core_php-fpm sh -c "rm -rf /var/www/html/var/cache/prod/*" 2>/dev/null || {
  echo "Conteneur sylius_lab_core_php-fpm absent ou erreur."
  exit 1
}

echo "Redémarrage PHP-FPM et Nginx Sylius..."
cd "$REPO_ROOT/units/sylius"
docker compose restart php-fpm-core nginx-core

echo "OK. Rechargez la page en Ctrl+Shift+R pour voir les changements."
