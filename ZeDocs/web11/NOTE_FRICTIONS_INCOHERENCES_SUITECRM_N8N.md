# Points de friction et incohérences — SPEC SuiteCRM / n8n

**Date** : 2026-02-01  
**Contexte** : Avant démarrage Sprint 0 (Manifest + render).

---

## 1. Incohérence à corriger avant ou pendant Sprint 0

### 1.1 Génération `odoo.conf` pour tous les univers (`dorevia.sh` — app up)

**Où** : `bin/dorevia.sh`, fonction `cmd_app_up`, vers les lignes 1986–1988.

**Problème** : Le code génère `odoo.conf` dès que le fichier est absent, sans vérifier l’univers :

```bash
if [[ ! -f "$app_dir/odoo.conf" ]]; then
  generate_app_odoo_conf "$univers" "$env" "$tenant" "$db_name"
fi
```

Pour `suitecrm` ou `n8n`, `app_dir` = `tenants/<tenant>/apps/suitecrm/<env>/` (ou n8n) : il n’y a pas d’`odoo.conf`, donc on appellerait `generate_app_odoo_conf` et on créerait un `odoo.conf` dans le répertoire SuiteCRM/n8n, ce qui est incorrect.

**Correction recommandée** : Ne générer `odoo.conf` que pour l’univers `odoo` :

```bash
if [[ "$univers" == "odoo" ]] && [[ ! -f "$app_dir/odoo.conf" ]]; then
  generate_app_odoo_conf "$univers" "$env" "$tenant" "$db_name"
fi
```

À faire dès le Sprint 0 (ou en prérequis) pour que `app up suitecrm` / `app up n8n` ne déclenchent pas cette génération.

---

## 2. Frictions déjà couvertes par le plan SCRUM

- **Port Caddy fixe 8069** : `render_caddyfile.sh` utilise `reverse_proxy … :8069` pour tous les univers. US-0.2 prévoit le mapping univers → port (odoo 8069, suitecrm 80, n8n 5678).
- **Compose centré Odoo/Postgres** : `render_app_compose.sh` ne gère que `postgres` + `odoo` et ajoute le volume `oca_extra_addons` systématiquement. US-0.3 prévoit les blocs suitecrm (MariaDB + app) et n8n (PostgreSQL + app) ; il faudra ne générer `oca_extra_addons` que pour l’univers `odoo`.
- **CLI** : `validate_univers` et `_get_app_container_name` n’acceptent que `odoo`. US-0.4 prévoit d’ajouter `suitecrm` et `n8n` (et de généraliser le cas « app » dans `_get_app_container_name`, ex. `odoo|suitecrm|n8n` pour le conteneur app).

Aucune action supplémentaire à prévoir : le plan couvre ces points.

---

## 3. Friction à traiter au plus tard en Sprint 2 (app reset)

**Où** : `bin/dorevia.sh`, fonction `cmd_app_reset`, vers les lignes 2140–2145.

**Problème** : Après `docker compose down -v`, le code tente éventuellement un `docker exec … psql -U odoo … DROP DATABASE`.  
En pratique, après `down -v` le conteneur DB n’existe plus, donc ce bloc ne s’exécute souvent pas. Mais si on l’exécute (état partiel, autre usage), pour l’univers `suitecrm` le conteneur DB est MariaDB : `psql -U odoo` échouerait.

**Recommandation** : Conditionner ce bloc à l’univers `odoo` (et éventuellement `n8n` si on souhaite un DROP explicite PostgreSQL pour n8n plus tard) :

```bash
if docker ps -a --format "{{.Names}}" | grep -q "^${db_container}$"; then
  if [[ "$univers" == "odoo" ]]; then
    echo "🗑️  Suppression DB $db_name..."
    docker exec "$db_container" psql -U odoo -c "DROP DATABASE IF EXISTS $db_name;" 2>/dev/null || true
  fi
  # Pour suitecrm/n8n : compose down -v suffit (volumes supprimés)
fi
```

À faire au plus tard lors du Sprint 2 (rollback / destroy / smoke test), pas bloquant pour Sprint 0.

---

## 4. Extension future (hors scope v1.0)

- **Alias de domaine** : Le schéma `manifest.schema.json` (section `domains.aliases`) autorise aujourd’hui `odoo`, `dvig`, `vault`. Pour des alias dédiés à `suitecrm` ou `n8n` (ex. mode client / Phase 3), il faudra étendre le schéma avec `suitecrm` et `n8n`. La SPEC v1.0 ne l’exige pas ; à prévoir en v1.1+ si besoin.
- **Images manifest** : Le schéma `images` n’a pas encore `mariadb`, `suitecrm`, `n8n`. US-0.1 et US-1.3 prévoient de documenter ou d’ajouter ces clés ; cohérent avec le plan.

---

## 5. Synthèse

| Point | Gravité | Quand corriger |
|-------|---------|----------------|
| Génération `odoo.conf` pour tout univers | Incohérence / bug | Sprint 0 (ou avant) |
| Port Caddy 8069 / compose Odoo-only / validate_univers | Friction | Déjà prévu US-0.2, US-0.3, US-0.4 |
| `app reset` + psql sur MariaDB (suitecrm) | Friction | Sprint 2 au plus tard |
| Aliases `suitecrm`/`n8n` dans manifest | Évolution | v1.1+ si besoin |

Recommandation : appliquer la correction §1.1 (condition `odoo` pour `odoo.conf`) en prérequis ou en tout début de Sprint 0 pour éviter toute régression sur `app up suitecrm` / `app up n8n`.
