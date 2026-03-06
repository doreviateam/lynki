# Audit : Vaultage core lab vs stinger (même programme Vault Go)

**Date :** 2026-02  
**Contexte :** Même binaire Vault (Go) pour les deux environnements ; vaultage OK sur stinger (sarl-la-platine), KO sur core lab (odoo.lab.core.doreviateam.com).

---

## 1. Synthèse

| Point | Core lab | Stinger | Verdict |
|-------|----------|---------|--------|
| Routage Caddy → DVIG | **CASSÉ** | OK | Core lab : DVIG inaccessible depuis l’extérieur |
| Base DVIG (outbox) | OK (dvig-db-core) | OK (DB Vault partagée) | Corrigé côté core lab |
| Token interne Odoo ↔ DVIG | OK (`dvig_internal_core_lab`) | OK (token long) | Aligné |
| Paramètre `dorevia.vault.token` (Odoo) | **MANQUANT** | Présent (JWT) | Core lab : Odoo ne peut pas récupérer la preuve |
| Nom du conteneur DVIG | **Mauvais nom** | dvig-core-stinger | Core lab : Caddy ne résout pas le conteneur |

---

## 2. Problème critique : routage Caddy → DVIG (core lab)

### Constat

- **Caddyfile** (`units/gateway/Caddyfile`) : `dvig.core.doreviateam.com` → `reverse_proxy dvig-core:8080`.
- **Conteneur réel** : le DVIG core lab s’appelle **`71fba4ce77b1_dvig-core`**, pas **`dvig-core`**.

Sur le réseau Docker, Caddy résout les hôtes par **nom de conteneur**. Il n’existe aucun conteneur nommé exactement `dvig-core`, donc les requêtes vers `https://dvig.core.doreviateam.com` (ingest, internal/outbox/process) **ne trouvent pas le DVIG** et échouent (connexion refusée ou erreur réseau).

### Action corrective

**Option A (recommandée)** — Redonner le nom `dvig-core` au conteneur :

```bash
# Arrêter et renommer le conteneur actuel
docker stop 71fba4ce77b1_dvig-core
docker rename 71fba4ce77b1_dvig-core dvig-core
docker start dvig-core
```

Vérifier que Caddy et le DVIG sont sur le même réseau (`dorevia-network`), puis tester :  
`curl -s -o /dev/null -w "%{http_code}" https://dvig.core.doreviateam.com/health`

**Option B** — Recréer le service avec le bon nom depuis le compose core lab :

```bash
cd /opt/dorevia-plateform/tenants/core/platform
docker stop 71fba4ce77b1_dvig-core
docker rm 71fba4ce77b1_dvig-core
docker compose up -d dvig
```

Vérifier ensuite que le conteneur s’appelle bien `dvig-core` (`docker ps`).

---

## 3. Paramètre Odoo manquant : `dorevia.vault.token` (core lab)

### Constat

- **Stinger** : 13 paramètres « dorevia », dont **`dorevia.vault.token`** (JWT long) pour appeler Vault et récupérer la preuve.
- **Core lab** : 9 paramètres ; **`dorevia.vault.token`** est absent.

Sans ce token, Odoo ne peut pas appeler `GET https://vault.core.doreviateam.com/api/v1/proof/account_move/{id}` avec `Authorization: Bearer <token>`. Le document peut être bien enregistré dans Vault (même programme Go), mais le statut dans Odoo reste « Protection en cours » / « pending_proof » car la **récupération de preuve** n’a jamais lieu.

### Action corrective

1. Obtenir un **JWT Vault** valide pour l’instance **Vault core** (`https://vault.core.doreviateam.com`), selon la procédure de votre plateforme (génération côté Vault / équipe ops).
2. Sur **odoo.lab.core** : **Paramètres** → **Technique** → **Paramètres système** → créer ou modifier :
   - **Clé :** `dorevia.vault.token`
   - **Valeur :** le JWT obtenu pour Vault core.

Optionnel mais utile pour aligner avec stinger :

- `dorevia.vault.max_attempts_proof` = `20`
- `dorevia.vault.max_age_pending_proof_hours` = `24`
- `dorevia.debug.actions` = `1` (boutons manuels sur les factures)

---

## 4. Récapitulatif des différences techniques

| Élément | Core lab | Stinger |
|--------|----------|---------|
| **Caddy → DVIG** | `dvig-core:8080` (conteneur absent sous ce nom) | `dvig-core-stinger:8080` (conteneur présent) |
| **Conteneur DVIG** | `71fba4ce77b1_dvig-core` | `dvig-core-stinger` |
| **Base DVIG** | `dvig-db-core` (dédiée, migration 006 appliquée) | DB Vault partagée |
| **DVIG_INTERNAL_TOKEN** | `dvig_internal_core_lab` | `0MutdWWm...` |
| **Odoo `dorevia.vault.token`** | Non configuré | Configuré (JWT) |
| **Odoo paramètres « dorevia »** | 9 | 13 |

---

## 5. Checklist de mise en conformité core lab

- [ ] **Routage DVIG** : un conteneur nommé exactement `dvig-core` est joignable par Caddy sur `dorevia-network` (rename ou recréation depuis `tenants/core/platform`).
- [ ] **Test** : `curl -s https://dvig.core.doreviateam.com/health` retourne 200.
- [ ] **Odoo** : paramètre `dorevia.vault.token` créé avec un JWT valide pour Vault core.
- [ ] (Optionnel) Paramètres `dorevia.vault.max_attempts_proof`, `dorevia.vault.max_age_pending_proof_hours`, `dorevia.debug.actions` renseignés.
- [ ] **Test de bout en bout** : créer/valider une facture sur odoo.lab.core, vérifier passage à « Protégée » et présence des détails de preuve.

---

---

## 6. Procédure reproductible (post-audit)

Pour éviter que le même écart se reproduise :

1. **Rendu platform** : le script `lib/render/render_platform_compose.sh` a été mis à jour pour générer **dvig-db**, **DATABASE_URL** pour DVIG, **DVIG_INTERNAL_TOKEN** et **depends_on dvig-db**. Un déploiement via `dorevia.sh render <tenant> --env <env>` puis `dorevia.sh platform up <tenant>` produit désormais un DVIG opérationnel (outbox + nom de conteneur stable).
2. **Procédure** : le document **PROCEDURE_BRANCHEMENT_ODOO_DOREVIA_VAULT.md** contient une section **« Procédure reproductible »** (déploiement platform, migration 006, Caddyfile, checklist Odoo complète incluant **dorevia.vault.token**).
3. **Caddyfile** : s’assurer que la gateway utilise les noms de conteneurs **dvig-&lt;tenant_id&gt;** et **vault-&lt;tenant_id&gt;** (alignés avec le rendu).

*Document d’audit — ZeDocs/web11. Même programme Vault (Go) des deux côtés ; écart dû à la configuration (réseau, nom de conteneur, paramètres Odoo).*
