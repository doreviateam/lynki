# Focus : Odoo ↔ DVIG/Vault

**Objectif** : connecter **Odoo core lab** à **DVIG** puis **Vault** pour que les factures postées soient vaultées (preuve horodatée).

**Chaîne** : Odoo (facture postée) → **DVIG** (ingest) → **Vault** (preuve).

---

## État des prérequis (déjà fait)

- [x] **Manifest core** : `units.platform` contient `["dvig", "vault"]` — DVIG et Vault sont générés par le render.
- [x] **Render** : `bin/dorevia.sh render core --env lab` a généré `tenants/core/rendered/lab/platform/docker-compose.yml` (dvig-core, vault-core, vault-db-core).
- [x] **Fichier tokens** : `tenants/core/secrets/dvig.tokens.yml` créé (vide) pour que le montage Docker fonctionne.
- [x] **Odoo core lab** : https://odoo.lab.core.doreviateam.com opérationnel.
- [x] **Module Odoo** : `dorevia_vault_connector` présent dans `units/odoo/custom-addons/` (monté dans le conteneur Odoo).

---
*(token DVIG à ne pas commiter — générer avec `bin/dorevia.sh token issue odoo lab core`)*
---

## État actuel (2026-02-01)

- **Odoo** : facture FAC/2026/00002 validée, bloc « Dorevia Vault » affiche **Échec temporaire**.
- **Erreur** : `GET https://vault.core.doreviateam.com/api/v1/proof/account_move/2` → **500 Internal Server Error**.
- **Cause probable** : soit le document n’a jamais été ingéré par DVIG → Vault (alors Vault renverrait 404), soit erreur côté Vault (DB, schéma, etc.).
- **Correctif** : migration SPEC 1 ajoutée dans le code Go. **Comment faire** : voir `ZeDocs/web11/COMMANDES_CORRECTIF_VAULT.md` (reconstruire l’image Vault puis redémarrer la plateforme core).

---

## Checklist — ordre d’exécution

### 1. Démarrer DVIG et Vault (platform core)

```bash
bin/dorevia.sh platform up core
```

- Démarre les conteneurs **dvig-core**, **vault-core**, **vault-db-core** sur le réseau `dorevia-network`.
- URLs attendues (après Caddy) : **https://dvig.core.doreviateam.com**, **https://vault.core.doreviateam.com**.
- Si Caddy n’a pas encore les blocs : `bin/dorevia.sh gateway aggregate --reload`.

### 2. Créer un token DVIG pour la source `odoo.lab.core`

```bash
bin/dorevia.sh token issue odoo lab core
```

- Ajoute un token actif pour la source **`odoo.lab.core`** dans `tenants/core/secrets/dvig.tokens.yml`.
- Recharge DVIG (SIGHUP) pour prendre en compte le nouveau token.
- **Affiche une seule fois** le token brut (ex. `dvig_xxxx...`) : **le copier** pour l’étape 4.

### 3. Vérifier DVIG et Vault

- **DVIG** : `curl -s https://dvig.core.doreviateam.com/health` (ou ouvrir dans le navigateur).
- **Vault** : `curl -s https://vault.core.doreviateam.com/health` (idem).
- DNS : `dvig.core.doreviateam.com` et `vault.core.doreviateam.com` doivent pointer vers l’IP du serveur (comme les autres sous-domaines core).

### 4. Dans Odoo : installer le module et configurer

1. Se connecter à **https://odoo.lab.core.doreviateam.com** (admin).
2. **Apps** → Mettre à jour la liste → rechercher **« Dorevia Vault Connector »** → **Installer**.
3. **Paramètres → Technique → Paramètres système** — ajouter :

| Clé | Valeur |
|-----|--------|
| `dorevia.dvig.url` | `https://dvig.core.doreviateam.com` |
| `dorevia.dvig.token` | *(token copié à l’étape 2)* |
| `dorevia.dvig.source` | `odoo.lab.core` |
| `dorevia.dvig.internal.token` | Même valeur que DVIG_INTERNAL_TOKEN (ex. `dvig_internal_core_lab`) — **obligatoire** pour que DVIG envoie vers Vault |
| `dorevia.vault.url` | `https://vault.core.doreviateam.com` (optionnel) |

### 5. (Optionnel) queue_job pour vaulting immédiat

Le module **queue_job** (OCA) est une **dépendance** du connecteur : il est installé avec. La config Odoo lab/prod inclut déjà :
- `workers = 2` et `server_wide_modules = web,queue_job`
- `[queue_job] channels = root:2,dorevia_vault:2`

Après validation d’une facture, un job est enqueued (trigger_worker puis fetch_proof) : le vaulting peut se faire en **quelques secondes** au lieu d’attendre le CRON (5 min).

### 6. Tester le vaulting

1. Dans Odoo : créer et **valider** une facture client (ou utiliser une facture existante en brouillon puis valider).
2. Vérifier dans la fiche facture : bloc **« Dorevia Vault »** — statut doit passer de `todo` à `pending_proof` puis `vaulted` (immédiat si queue_job actif, sinon CRON toutes les 5 min).
3. Optionnel : **Queue → Jobs** dans Odoo pour voir les jobs `job_trigger_worker` / `job_vault_fetch_proof`.

---

## Résumé des commandes

| Étape | Commande / action |
|-------|-------------------|
| 1 | `bin/dorevia.sh platform up core` |
| 2 | `bin/dorevia.sh token issue odoo lab core` → copier le token |
| 3 | Vérifier `https://dvig.core.doreviateam.com/health` et `https://vault.core.doreviateam.com/health` |
| 4 | Odoo : installer module, paramètres `dorevia.dvig.*` et `dorevia.dvig.source` = `odoo.lab.core` |
| 5 | (Optionnel) Vérifier que queue_job est installé et workers ≥ 2 |
| 6 | Valider une facture dans Odoo et vérifier le statut vault |

---

## Références

- **Procédure détaillée** : `CONNECTER_ODOO_CORE_LAB_VAULT.md`
- **Module Odoo** : `units/odoo/custom-addons/dorevia_vault_connector/README.md`
- **SPEC connecteur** : `sources/vault/docs/CONNECTEUR_ODOO_SPEC1.md`
