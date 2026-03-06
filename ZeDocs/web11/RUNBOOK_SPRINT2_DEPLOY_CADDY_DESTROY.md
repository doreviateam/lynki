# Runbook Sprint 2 — Déploiement, Caddy, Destroy, Smoke test

**SPEC** : `SPEC_Units_SuiteCRM_N8n_Plateforme_v1.0.md`  
**Plan** : `PLAN_IMPLEMENTATION_SPEC_Units_SuiteCRM_N8n_SCRUM.md` (Sprint 2)

---

## 1. Déploiement app suitecrm et n8n (US-2.1)

### Prérequis

- Réseau Docker `dorevia-network` existant.
- Manifest du tenant avec `universes` contenant `suitecrm` et/ou `n8n`, et `units.suitecrm` / `units.n8n` définis.

### Étapes

```bash
cd /opt/dorevia-plateform

# 1. Render (génère Caddyfile + docker-compose par univers)
bin/dorevia.sh render <tenant> --env <env>
# Ex. : bin/dorevia.sh render lab --env lab

# 2. Démarrer les apps
bin/dorevia.sh app up suitecrm <env> <tenant>
bin/dorevia.sh app up n8n <env> <tenant>
# Ex. : bin/dorevia.sh app up n8n lab lab

# 3. Vérifier
bin/dorevia.sh app status suitecrm <env> <tenant>
bin/dorevia.sh app status n8n <env> <tenant>
```

### Variables optionnelles par app

- **SuiteCRM** : `tenants/<tenant>/apps/suitecrm/<env>/.env` (SUITECRM_DOMAIN, mots de passe, image si besoin).
- **n8n** : idem `tenants/<tenant>/apps/n8n/<env>/.env` (N8N_ENCRYPTION_KEY recommandé en prod, N8N_DOMAIN).

Le compose généré par render est copié dans `tenants/<tenant>/apps/<univers>/<env>/` ; vous pouvez y ajouter un `.env` pour surcharger les valeurs.

---

## 2. Caddy — agrégation et routage TLS (US-2.2)

### Agrégation du Caddyfile global

```bash
bin/dorevia.sh gateway aggregate [--reload]
```

- Collecte tous les `tenants/*/rendered/*/caddy/Caddyfile` (dont les blocs suitecrm:80 et n8n:5678).
- Produit `units/gateway/Caddyfile` (fichier global).
- `--reload` : recharge Caddy si la gateway est déjà démarrée.

### Démarrer la gateway (si pas encore fait)

```bash
bin/dorevia.sh gateway up
```

### DNS ou /etc/hosts

Pour accéder en HTTPS aux URLs :

- `https://suitecrm.<env>.<tenant>.doreviateam.com`
- `https://n8n.<env>.<tenant>.doreviateam.com`

**Option A — DNS** : Créer les enregistrements A (ou CNAME) pointant vers l’hôte où tourne Caddy.

**Option B — /etc/hosts (lab)** : Ajouter par exemple :

```
127.0.0.1 suitecrm.lab.core.doreviateam.com n8n.lab.core.doreviateam.com
```

Remplacer `127.0.0.1` par l’IP du serveur si accès distant.  
**Option C — DNS OVH** : Créer l’entrée pour **n8n.lab.core** (sous-domaine `n8n.lab.core`, type A ou CNAME vers l’IP du serveur). Voir `ZeDocs/web11/DNS_OVH_N8N_LAB_CORE.md`.

### Vérification

- Ouvrir les URLs dans un navigateur (TLS automatique via Caddy).
- Pas d’erreur 502 = routage OK (les conteneurs doivent être sur `dorevia-network`).

---

## 3. DoD Plateforme — checklist (US-2.3)

- [ ] Manifest accepte `universes` contenant `suitecrm` et `n8n`.
- [ ] `render_app_compose.sh` génère un compose valide pour suitecrm et n8n.
- [ ] `render_caddyfile.sh` génère les blocs avec ports 80 (suitecrm) et 5678 (n8n).
- [ ] `dorevia.sh app up suitecrm/n8n <env> <tenant>` démarre les conteneurs sur `dorevia-network`.
- [ ] Aucune régression : tenant Odoo seul fonctionne (render + app up).

---

## 4. Rollback et clean destroy (US-2.4)

### Arrêt sans supprimer les volumes

```bash
bin/dorevia.sh app down suitecrm <env> <tenant>
bin/dorevia.sh app down n8n <env> <tenant>
```

### Destruction avec purge des volumes (redeploy à zéro)

```bash
bin/dorevia.sh app destroy suitecrm <env> <tenant> --purge
bin/dorevia.sh app destroy n8n <env> <tenant> --purge
```

- Sans `--purge` : conteneurs supprimés, volumes conservés.
- Avec `--purge` : conteneurs et volumes nommés supprimés ; un nouvel `app up` repart sur des volumes vides.

### Après destroy + purge

Relancer render puis app up pour redéployer proprement.

---

## 5. Smoke test automatique (US-2.5)

```bash
./scripts/smoke_test_suitecrm_n8n.sh <tenant> <env>
# Ex. : ./scripts/smoke_test_suitecrm_n8n.sh lab lab
```

- Vérifie que les conteneurs attendus sont en état **running** (app + db pour suitecrm et n8n).
- Optionnel : vérification HTTP (curl) sur les URLs si DNS/hosts configurés.
- **Code de sortie** : 0 si tout OK, non nul sinon (utilisable en CI ou post-deploy).

Voir `scripts/smoke_test_suitecrm_n8n.sh` pour les seuils HTTP acceptés (200, 301, 302, 401).  
Documentation détaillée des tests manuels : `ZeDocs/web11/TESTS_MANUELS_SUITECRM_N8N.md`.
