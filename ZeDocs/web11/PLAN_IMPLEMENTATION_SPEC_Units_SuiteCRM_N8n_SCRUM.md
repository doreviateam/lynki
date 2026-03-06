# Plan d'implémentation SCRUM — SPEC Units SuiteCRM et n8n (SaaS managé)

**Version** : 1.0  
**Date** : 2026-02-01  
**Base** : `SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md`  
**Durée estimée** : 3–4 sprints (3–4 semaines)  
**Équipe** : Plateforme + Intégration

---

## Vue d'ensemble

### Objectif

Intégrer **SuiteCRM** et **n8n** comme units first-class dans Dorevia-Plateforme : extension du manifest et des scripts de render, création des units `suitecrm` et `n8n`, déploiement via `dorevia.sh app up`, routage Caddy avec ports corrects (80, 5678).

### Définition de « Fait » (DoD global)

La SPEC v1.0 est terminée si :

- [x] Manifest accepte `universes` contenant `suitecrm` et `n8n` ; `units.suitecrm` et `units.n8n` définis.
- [x] `render_app_compose.sh` génère un compose valide pour suitecrm (MariaDB + app) et n8n (PostgreSQL + app).
- [x] `render_caddyfile.sh` génère les blocs avec les bons ports (80, 5678, 8069) et noms de conteneurs.
- [x] `dorevia.sh` accepte `suitecrm` et `n8n` (validate_univers, _get_app_container_name).
- [x] Units `units/suitecrm/` et `units/n8n/` créées (docker-compose template, .env.example, README).
- [x] Au moins un tenant de test (ex. lab) déployé : **n8n** accessible en TLS sur `n8n.lab.core.doreviateam.com`.
- [x] **SuiteCRM core/lab** : TLS sur `suitecrm.lab.core.doreviateam.com`, admin créé, DB persistante.
- [x] **Odoo core/lab** : TLS sur `odoo.lab.core.doreviateam.com`, DB persistante. **3 couches** (SuiteCRM, n8n, Odoo) opérationnelles en core lab.
- [x] Un flow n8n template (web-to-lead ou opportunity → Odoo) importable et exécutable — **webhook-echo validé** (`test_n8n_webhook.sh core lab --public` OK).

**Statut** : Sprint 3 — 3 couches en place (SuiteCRM, n8n, Odoo core lab). Reste : flows intégration (web-to-lead, opportunity → Odoo), Odoo → Vault (voir `CONNECTER_ODOO_CORE_LAB_VAULT.md`), backup SuiteCRM. Référence : `SUITE_IMPLEMENTATION_SPRINT3.md`, `POINT_IMPLEMENTATION.md`.

---

## Structure des sprints

| Sprint   | Durée      | Objectif principal                          | Story Points |
|----------|------------|---------------------------------------------|--------------|
| **Sprint 0** | 2–3 jours  | Manifest + render (schéma, Caddy, compose)  | 8 SP         |
| **Sprint 1** | 1 semaine  | Units suitecrm + n8n (compose, images)     | 13 SP        |
| **Sprint 2** | 1 semaine  | Déploiement tenant + Caddy + validation + destroy + smoke test | 12 SP        |
| **Sprint 3** | 3–5 jours  | Workflows n8n templates + DoD intégration    | 8 SP         |

**Total estimé** : 41 SP — 3–4 semaines

---

## Sprint 0 : Manifest et render (2–3 jours)

**Objectif** : Étendre le schéma manifest et les scripts de render pour que la plateforme connaisse les univers `suitecrm` et `n8n`, génère les bons compose et le bon Caddyfile (ports 80, 5678).

### US-0.1 : Extension du schéma manifest — universes suitecrm et n8n

**En tant que** développeur plateforme  
**Je veux** ajouter `suitecrm` et `n8n` aux univers et définir `units.suitecrm` et `units.n8n`  
**Afin de** pouvoir activer ces units par tenant via le manifest.

**Points** : 2

**Critères d'acceptation** :

- [ ] `schemas/manifest.schema.json` : enum `universes` contient `suitecrm` et `n8n` (en plus de `odoo`, `pos`, `sylius`).
- [ ] Schéma `units` accepte les clés `suitecrm` et `n8n` (tableau de services), ex. `units.suitecrm: ["suitecrm", "mariadb"]`, `units.n8n: ["n8n", "postgres"]`.
- [ ] Optionnel : `images.suitecrm`, `images.mariadb`, `images.n8n`, `images.postgres` documentés ou ajoutés au schéma.
- [ ] Un manifest de test (ex. tenant lab) valide avec `"universes": ["odoo", "suitecrm", "n8n"]`.

**Tâches techniques** :

- [ ] Éditer `schemas/manifest.schema.json` : étendre `universes.items.enum` et `units` (additionalProperties ou liste explicite).
- [ ] Créer ou mettre à jour un `manifest.json` de test dans `tenants/<tenant>/state/` avec suitecrm et n8n.
- [ ] Vérifier validation JSON (jq ou outil de validation).

**Livrables** : Schéma manifest mis à jour ; manifest de test valide.

---

### US-0.2 : render_caddyfile.sh — mapping univers → port

**En tant que** développeur plateforme  
**Je veux** que le Caddyfile généré utilise le bon port par univers (odoo 8069, suitecrm 80, n8n 5678)  
**Afin de** router correctement vers chaque conteneur.

**Points** : 3

**Critères d'acceptation** :

- [ ] Mapping univers → port introduit (table ou case) : `odoo` → 8069, `suitecrm` → 80, `n8n` → 5678.
- [ ] Pour chaque univers du manifest, le bloc généré est `reverse_proxy ${universe}_${ENV}_${TENANT_ID}:<port>` avec `<port>` lu depuis le mapping.
- [ ] Univers inconnu : port par défaut 8069 ou erreur explicite (au choix, documenté).
- [ ] `dorevia.sh render <tenant> --env <env>` produit un Caddyfile contenant des blocs pour suitecrm et n8n avec les bons ports lorsque le manifest les inclut.

**Tâches techniques** :

- [ ] Éditer `lib/render/render_caddyfile.sh` : ajouter une fonction ou tableau `get_port_for_universe(universe)`.
- [ ] Remplacer la ligne fixe `reverse_proxy ... :8069` par `reverse_proxy ... :$(get_port_for_universe $universe)`.
- [ ] Tester avec un tenant dont manifest contient `odoo`, `suitecrm`, `n8n`.

**Livrables** : `render_caddyfile.sh` mis à jour ; Caddyfile généré avec ports 80, 5678, 8069 selon univers.

---

### US-0.3 : render_app_compose.sh — blocs compose suitecrm et n8n

**En tant que** développeur plateforme  
**Je veux** que le script génère les services Docker Compose pour les univers `suitecrm` et `n8n`  
**Afin de** déployer SuiteCRM (MariaDB + app) et n8n (PostgreSQL + app) depuis le manifest.

**Points** : 5

**Critères d'acceptation** :

- [ ] Pour `univers = suitecrm` : génération des services `db` (MariaDB) et `suitecrm` (app) avec `container_name` `suitecrm_db_<env>_<tenant>`, `suitecrm_<env>_<tenant>`, réseau `dorevia-network`, volumes dédiés, healthcheck MariaDB.
- [ ] Pour `univers = n8n` : génération des services `db` (PostgreSQL) et `n8n` (app) avec `container_name` `n8n_db_<env>_<tenant>`, `n8n_<env>_<tenant>`, réseau `dorevia-network`, volumes dédiés, healthcheck PostgreSQL.
- [ ] Images : lecture depuis `manifest.images.suitecrm`, `manifest.images.mariadb`, etc., avec valeurs par défaut si absentes.
- [ ] `dorevia.sh render <tenant> --env <env>` produit un `docker-compose.yml` dans `tenants/<tenant>/rendered/<env>/<univers>/` (ou structure actuelle) pour chaque univers du manifest.
- [ ] Compose générés sont valides (`docker compose config` OK).

**Tâches techniques** :

- [ ] Éditer `lib/render/render_app_compose.sh` : pour chaque univers, brancher sur `suitecrm` et `n8n` (comme pour `odoo` + `postgres`).
- [ ] Définir variables d'environnement minimales pour SuiteCRM et n8n (DB_*, domain, etc.) dans le compose généré ou via .env.
- [ ] Adapter la boucle de génération si le script produit un compose par univers (vérifier la structure actuelle).
- [ ] Tester génération pour un tenant avec `universes: [odoo, suitecrm, n8n]`.

**Livrables** : `render_app_compose.sh` mis à jour ; compose générés pour suitecrm et n8n.

---

### US-0.4 : dorevia.sh — validate_univers et _get_app_container_name

**En tant que** développeur plateforme  
**Je veux** que dorevia.sh accepte les univers `suitecrm` et `n8n` et connaisse les noms de conteneurs associés  
**Afin de** exécuter `app up/down/status` pour ces units sans erreur.

**Points** : 2

**Critères d'acceptation** :

- [ ] `validate_univers` accepte `suitecrm` et `n8n` (en plus de `odoo`).
- [ ] `_get_app_container_name` (et helpers) gèrent les units `suitecrm`, `suitecrm_db`, `n8n`, `n8n_db` avec le pattern `<univers>_<env>_<tenant>` et `<univers>_db_<env>_<tenant>`.
- [ ] `dorevia.sh app up suitecrm <env> <tenant>` et `dorevia.sh app up n8n <env> <tenant>` ne renvoient pas « Univers invalide ».

**Tâches techniques** :

- [ ] Éditer `bin/dorevia.sh` : dans `validate_univers`, ajouter `suitecrm` et `n8n` au case.
- [ ] Dans `_get_app_container_name`, ajouter les cas `suitecrm`, `suitecrm_db`, `n8n`, `n8n_db` (ou généraliser le pattern si possible).
- [ ] Vérifier les autres appels à ces helpers (volumes, projet compose, etc.) et adapter si nécessaire.

**Livrables** : `dorevia.sh` mis à jour ; `app up/status/down` reconnus pour suitecrm et n8n.

---

**Sprint 0 — Definition of Done** :

- [ ] Manifest étendu et validé.
- [ ] render_caddyfile.sh génère les blocs avec ports 80, 5678, 8069.
- [ ] render_app_compose.sh génère les compose suitecrm et n8n.
- [ ] dorevia.sh accepte suitecrm et n8n.
- [ ] Aucune régression sur Odoo (render + CLI).

---

## Sprint 1 : Units suitecrm et n8n (1 semaine)

**Objectif** : Créer les répertoires `units/suitecrm/` et `units/n8n/` avec docker-compose de référence, .env.example, README, et images Docker validées.

### US-1.1 : Unit suitecrm — structure et compose de référence

**En tant que** développeur plateforme  
**Je veux** une unit `units/suitecrm/` avec docker-compose (MariaDB + SuiteCRM), .env.example et README  
**Afin de** déployer SuiteCRM selon la SPEC (port 80, réseau dorevia-network, noms de conteneurs).

**Points** : 5

**Critères d'acceptation** :

- [ ] Répertoire `units/suitecrm/` créé avec `docker-compose.yml` (ou template), `.env.example`, `README.md`.
- [ ] Compose : services `db` (MariaDB) et `suitecrm` (app), `container_name` selon convention `suitecrm_<env>_<tenant>`, `suitecrm_db_<env>_<tenant>` (ou paramétrable).
- [ ] Réseau `dorevia-network` (external), port 80 pour l'app, pas d'exposition host.
- [ ] Variables d'environnement documentées (SUITECRM_DOMAIN, DB_*, TZ).
- [ ] Healthcheck MariaDB et optionnel HTTP pour l'app.
- [ ] Image SuiteCRM : version fixée (ex. image Docker Hub officielle ou référencée).

**Tâches techniques** :

- [ ] Créer `units/suitecrm/docker-compose.yml` (template avec variables tenant/env ou à copier dans rendered).
- [ ] Créer `units/suitecrm/.env.example` et `units/suitecrm/README.md`.
- [ ] Optionnel : `units/suitecrm/scripts/` (backup, restore).
- [ ] Tester `docker compose up -d` dans un répertoire de test avec réseau dorevia-network existant.

**Livrables** : `units/suitecrm/` prêt ; compose testé localement.

---

### US-1.2 : Unit n8n — structure et compose de référence

**En tant que** développeur plateforme  
**Je veux** une unit `units/n8n/` avec docker-compose (PostgreSQL + n8n), .env.example et README  
**Afin de** déployer n8n selon la SPEC (port 5678, réseau dorevia-network, N8N_ENCRYPTION_KEY).

**Points** : 5

**Critères d'acceptation** :

- [ ] Répertoire `units/n8n/` créé avec `docker-compose.yml`, `.env.example`, `README.md`.
- [ ] Compose : services `db` (PostgreSQL) et `n8n` (app), `container_name` selon convention `n8n_<env>_<tenant>`, `n8n_db_<env>_<tenant>`.
- [ ] Réseau `dorevia-network`, port 5678 pour n8n.
- [ ] Variables d'environnement documentées (N8N_DOMAIN, N8N_ENCRYPTION_KEY, DB_TYPE=postgresdb, DB_POSTGRESDB_*, TZ).
- [ ] Healthcheck PostgreSQL.
- [ ] Image n8n : version fixée (ex. n8nio/n8n).

**Tâches techniques** :

- [ ] Créer `units/n8n/docker-compose.yml`, `units/n8n/.env.example`, `units/n8n/README.md`.
- [ ] Créer `units/n8n/workflows/` (vide ou avec un template JSON placeholder).
- [ ] Optionnel : `units/n8n/scripts/` (backup, restore).
- [ ] Tester `docker compose up -d` avec N8N_ENCRYPTION_KEY défini.

**Livrables** : `units/n8n/` prêt ; compose testé localement.

---

### US-1.3 : Alignement render_app_compose avec units (templates / images)

**En tant que** développeur plateforme  
**Je veux** que le compose généré par render utilise les mêmes images et conventions que les units  
**Afin de** que le déploiement via `app up` soit cohérent avec la SPEC.

**Points** : 3

**Critères d'acceptation** :

- [ ] Les images par défaut pour suitecrm et n8n (et leurs DB) sont documentées ou lues depuis le manifest.
- [ ] Le compose généré pour suitecrm/n8n est fonctionnel (démarrage, healthcheck) lorsqu'on lance depuis le répertoire rendered (ou depuis le répertoire app du tenant après copie/liens).
- [ ] Pas de conflit de noms de volumes entre tenants/univers.

**Tâches techniques** :

- [ ] Vérifier que les noms de volumes dans render_app_compose utilisent le préfixe `<univers>_<env>_<tenant>`.
- [ ] Adapter si besoin les chemins ou commandes dans le compose généré (env vars, domain) pour qu'ils correspondent au tenant/env.
- [ ] Tester génération + démarrage pour un tenant test (lab ou stinger).

**Livrables** : Compose générés alignés avec units ; test de démarrage OK.

---

**Sprint 1 — Definition of Done** :

- [ ] `units/suitecrm/` et `units/n8n/` créés et documentés.
- [ ] Compose de référence testés en local (réseau dorevia-network).
- [ ] Render produit des compose utilisables pour suitecrm et n8n.

---

## Sprint 2 : Déploiement tenant et Caddy (1 semaine)

**Objectif** : Déployer un tenant (ex. lab ou stinger) avec suitecrm et n8n, exposer les services via Caddy, valider URLs TLS et DoD plateforme.

### US-2.1 : Déploiement app suitecrm et n8n pour un tenant test

**En tant que** opérateur plateforme  
**Je veux** lancer SuiteCRM et n8n pour un tenant donné (ex. lab) via `dorevia.sh app up`  
**Afin de** avoir les conteneurs sur le réseau et prêts pour le routage Caddy.

**Points** : 3

**Critères d'acceptation** :

- [ ] Manifest du tenant test contient `suitecrm` et `n8n` dans `universes`.
- [ ] `dorevia.sh render <tenant> --env <env>` exécuté sans erreur.
- [ ] `dorevia.sh app up suitecrm <env> <tenant>` et `dorevia.sh app up n8n <env> <tenant>` démarrent les conteneurs.
- [ ] Conteneurs visibles sur `dorevia-network` avec les noms attendus (`suitecrm_<env>_<tenant>`, `n8n_<env>_<tenant>`, et leurs db).
- [ ] SuiteCRM répond en HTTP sur le port 80 en interne ; n8n sur le port 5678.

**Tâches techniques** :

- [ ] Choisir un tenant (ex. existant ou créer `tenants/erpnext-lab` / dédié).
- [ ] Mettre à jour le manifest du tenant avec `universes` et `units.suitecrm`, `units.n8n`.
- [ ] Exécuter render puis app up ; corriger erreurs (chemins, env, images).
- [ ] Documenter les éventuelles variables à définir dans `tenants/<tenant>/apps/suitecrm/<env>/.env` et idem pour n8n.

**Livrables** : Tenant test avec suitecrm et n8n démarrés ; procédure documentée.

---

### US-2.2 : Caddy — agrégation et routage TLS

**En tant que** opérateur plateforme  
**Je veux** que les hostnames `suitecrm.<env>.<tenant>.doreviateam.com` et `n8n.<env>.<tenant>.doreviateam.com` routent vers les conteneurs avec TLS  
**Afin de** accéder à SuiteCRM et n8n en HTTPS.

**Points** : 3

**Critères d'acceptation** :

- [ ] `dorevia.sh gateway aggregate [--reload]` exécuté ; Caddyfile global contient les blocs pour suitecrm et n8n du tenant test.
- [ ] Blocs utilisent `reverse_proxy suitecrm_<env>_<tenant>:80` et `reverse_proxy n8n_<env>_<tenant>:5678`.
- [ ] DNS configuré (ou /etc/hosts) pour les hostnames du tenant test.
- [ ] Accès HTTPS aux URLs SuiteCRM et n8n : pas d’erreur 502 (routage OK).

**Tâches techniques** :

- [ ] Exécuter gateway aggregate ; vérifier le Caddyfile généré.
- [ ] Recharger Caddy ; tester curl ou navigateur sur les URLs.
- [ ] Documenter la configuration DNS requise pour un nouveau tenant.

**Livrables** : SuiteCRM et n8n accessibles en TLS ; procédure Caddy + DNS documentée.

---

### US-2.3 : Validation DoD plateforme et corrections

**En tant que** développeur plateforme  
**Je veux** valider tous les critères DoD « Plateforme » de la SPEC  
**Afin de** considérer l’intégration render + CLI + units comme terminée.

**Points** : 2

**Critères d'acceptation** :

- [ ] Manifest accepte `universes` contenant `suitecrm` et `n8n`.
- [ ] `render_app_compose.sh` génère un compose valide pour suitecrm et n8n.
- [ ] `render_caddyfile.sh` génère les blocs avec les bons ports (80, 5678).
- [ ] `dorevia.sh app up suitecrm/n8n <env> <tenant>` démarre les conteneurs sur `dorevia-network`.
- [ ] Aucune régression : tenant Odoo seul continue de fonctionner (render + app up).

**Tâches techniques** :

- [ ] Parcourir la checklist Annexe B de la SPEC et confirmer chaque point.
- [ ] Corriger les bugs éventuels (noms de conteneurs, ports, volumes).
- [ ] Mettre à jour la SPEC ou le plan si des écarts sont actés.

**Livrables** : DoD plateforme validés ; corrections committées.

---

### US-2.4 : Rollback et clean destroy (app down + purge volumes)

**En tant qu’**opérateur plateforme  
**Je veux** pouvoir faire `dorevia.sh app down suitecrm/n8n <env> <tenant>` et purger les volumes proprement  
**Afin de** redeployer à zéro en SaaS sans laisser de volumes orphelins (déploie → casse → redeploie).

**Points** : 2

**Critères d’acceptation** :

- [ ] `dorevia.sh app down suitecrm <env> <tenant>` et `dorevia.sh app down n8n <env> <tenant>` stoppent les conteneurs sans erreur.
- [ ] Option de purge documentée ou intégrée (ex. `app destroy <univers> <env> <tenant> --purge` ou procédure manuelle) pour supprimer les volumes associés (suitecrm_db, suitecrm_data, n8n_db, n8n_data).
- [ ] Après destroy + purge, un nouvel `app up` repart sur des volumes vides (pas de réutilisation de données cassées).
- [ ] Procédure documentée dans le runbook ou README des units.

**Tâches techniques** :

- [ ] Vérifier/compléter `dorevia.sh app down` et `app destroy` pour suitecrm et n8n (volumes nommés, purge si --purge).
- [ ] Documenter la séquence : `app down` → (optionnel) `docker volume rm ...` ou `app destroy --purge` ; tester sur un tenant lab.
- [ ] Rappeler en README units : « En cas de réinstall propre : app down puis purge volumes (voir runbook). »

**Livrables** : Destroy + purge opérationnels et documentés ; confort opérationnel pour itérations fréquentes.

---

### US-2.5 : Smoke test automatique (checklist scriptée)

**En tant qu’**opérateur plateforme  
**Je veux** une mini checklist scriptée (smoke test) pour valider que SuiteCRM et n8n sont up  
**Afin de** détecter rapidement une régression après déploiement ou redémarrage.

**Points** : 2

**Critères d’acceptation** :

- [ ] Script (ex. `scripts/smoke_test_suitecrm_n8n.sh` ou équivalent) exécutable avec paramètres tenant + env (ou URLs en variables).
- [ ] Vérifications : `curl` SuiteCRM → HTTP 200 (ou 302/301 si redirect login) ; `curl` n8n → HTTP 200 (ou 401 si auth requise).
- [ ] Vérifications : conteneurs attendus en état running (suitecrm_<env>_<tenant>, n8n_<env>_<tenant>, et leurs db).
- [ ] DB up : au moins une vérification que les conteneurs DB sont running (ou connexion TCP/healthcheck).
- [ ] Sortie claire : OK / KO par vérification ; code de sortie 0 si tout vert, non nul sinon (pour CI ou cron).

**Tâches techniques** :

- [ ] Créer le script dans `scripts/` (ou dans `units/suitecrm/scripts/` + `units/n8n/scripts/` si préféré) ; accepter tenant + env en arguments ou variables d’environnement.
- [ ] Utiliser `curl -s -o /dev/null -w "%{http_code}"` (ou équivalent) pour les URLs ; seuil acceptable 200, 301, 302, 401 selon cas.
- [ ] Utiliser `docker ps --filter "name=..." --format "{{.Status}}"` ou `docker inspect` pour vérifier que les conteneurs sont running.
- [ ] Documenter usage dans le runbook (ex. « Après deploy : ./scripts/smoke_test_suitecrm_n8n.sh <tenant> <env> »).

**Livrables** : Script smoke test ; exécution manuelle ou intégration optionnelle dans pipeline / post-deploy.

---

**Sprint 2 — Definition of Done** :

- [ ] Au moins un tenant avec suitecrm et n8n déployé.
- [ ] URLs TLS opérationnelles pour SuiteCRM et n8n.
- [ ] DoD plateforme cochés.
- [ ] Rollback / destroy + purge documentés et testés (US-2.4).
- [ ] Smoke test automatique en place et documenté (US-2.5).

---

## Sprint 3 : Workflows n8n et DoD intégration (3–5 jours)

**Objectif** : Finaliser la configuration SuiteCRM et n8n (admin, auth), importer un workflow template n8n, valider les DoD « SuiteCRM », « n8n » et « Intégration » de la SPEC.

### US-3.1 : SuiteCRM — premier déploiement utilisable (admin, DB)

**En tant que** opérateur  
**Je veux** pouvoir me connecter à SuiteCRM en tant qu’admin et avoir une DB persistante  
**Afin de** satisfaire le DoD SuiteCRM de la SPEC.

**Points** : 2

**Critères d'acceptation** :

- [ ] URL `suitecrm.<env>.<tenant>.doreviateam.com` accessible en TLS.
- [ ] Admin SuiteCRM créé et login OK.
- [ ] DB MariaDB persistante (conteneur `suitecrm_db_<env>_<tenant>`).
- [ ] Backup DB scriptable et testé (dump + restore en lab) — au moins une procédure documentée et exécutée une fois.

**Tâches techniques** :

- [ ] Initialisation SuiteCRM (install wizard ou image préconfigurée) ; création compte admin.
- [ ] Documenter identifiants par env (ou .env) ; ne pas committer les secrets.
- [ ] Rédiger un script ou procédure backup/restore (mysqldump + volume uploads) ; tester en lab.

**Livrables** : SuiteCRM utilisable ; procédure backup/restore documentée et testée.

---

### US-3.2 : n8n — auth, encryption, DB et premier workflow

**En tant que** opérateur  
**Je veux** n8n sécurisé (auth + encryption key), DB persistante, et un workflow template importé  
**Afin de** satisfaire le DoD n8n et préparer l’intégration.

**Points** : 3

**Critères d'acceptation** :

- [ ] URL `n8n.<env>.<tenant>.doreviateam.com` accessible en TLS.
- [ ] Auth activée (basic auth ou user management n8n) + N8N_ENCRYPTION_KEY stable.
- [ ] DB PostgreSQL persistante (conteneur `n8n_db_<env>_<tenant>`).
- [ ] Import d’un workflow template A (web-to-lead) ou B (opportunity → Odoo) réussi.
- [ ] Exécution webhook → création lead SuiteCRM OK (ou équivalent selon template).

**Tâches techniques** :

- [ ] Configurer N8N_BASIC_AUTH_* ou user management ; documenter N8N_ENCRYPTION_KEY (backup sécurisé).
- [ ] Créer un workflow template minimal (ex. webhook → log ou webhook → SuiteCRM) et l’exporter en JSON dans `units/n8n/workflows/`.
- [ ] Tester import + exécution (webhook déclenché, étape suivante OK).
- [ ] Optionnel : tester enchaînement webhook → création lead SuiteCRM si API SuiteCRM disponible.

**Livrables** : n8n opérationnel ; au moins un template importable et exécutable.

---

### US-3.3 : DoD Intégration — flows opérationnels

**En tant que** product owner  
**Je veux** un flow « web-to-lead » et un flow « opportunity won → Odoo draft quotation » MVP opérationnels (même manuels)  
**Afin de** valider la chaîne SuiteCRM ↔ n8n ↔ Odoo.

**Points** : 3

**Critères d'acceptation** :

- [ ] Un flow « web-to-lead » opérationnel : webhook (ou formulaire) → normalisation → SuiteCRM (Lead/Contact).
- [ ] Un flow « opportunity won → Odoo draft quotation » MVP opérationnel : déclenchement (webhook ou polling) → récupération opportunité → création/màj res.partner + sale.order draft dans Odoo (même manuel).
- [ ] Documentation courte : comment déclencher les workflows, quelles credentials (Odoo, SuiteCRM) configurer dans n8n.

**Tâches techniques** :

- [ ] Implémenter ou adapter le template A (web-to-lead) dans n8n ; tester avec un webhook (Postman ou formulaire).
- [ ] Implémenter ou adapter le template B (opportunity → Odoo) : connexion Odoo (API key ou basic auth), nœuds pour récupérer opportunité SuiteCRM (API ou mock), création partner + quotation.
- [ ] Documenter dans `units/n8n/README.md` ou `ZeDocs/web11` les étapes et prérequis.

**Livrables** : Deux flows opérationnels ; documentation d’utilisation.

---

**Sprint 3 — Definition of Done** :

- [ ] DoD SuiteCRM, n8n et Intégration de la SPEC §11 cochés.
- [ ] Documentation runbook / onboarding tenant à jour (Annexe A de la SPEC).

---

## Récapitulatif et ordre d’exécution

| Ordre | Sprint | Résumé |
|-------|--------|--------|
| 1 | Sprint 0 | Manifest + render_caddyfile + render_app_compose + dorevia.sh |
| 2 | Sprint 1 | units/suitecrm + units/n8n (compose, README, .env.example) |
| 3 | Sprint 2 | Déploiement tenant test + Caddy + validation DoD + destroy/purge (US-2.4) + smoke test (US-2.5) |
| 4 | Sprint 3 | SuiteCRM/n8n utilisables + workflows templates + DoD intégration |

---

## Backlog v1.1+ (hors scope v1.0)

- SSO (Keycloak/OIDC) pour n8n, SuiteCRM, Odoo.
- n8n queue mode (Redis) + workers.
- Observabilité (traces, métriques, dashboards).
- Vaulting d’événements CRM (ex. `opportunity.won` scellé).
- Templates n8n packagés par verticale (B2B, retail, services).

---

## Références

- **SPEC** : `ZeDocs/web11/SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md`
- **Analyse** : `ZeDocs/web11/ANALYSE_SPEC_SUITECRM_N8N_UNITS.md`
- **Fichiers à étendre** : Annexe B de la SPEC (manifest.schema.json, render_app_compose.sh, render_caddyfile.sh, dorevia.sh).
