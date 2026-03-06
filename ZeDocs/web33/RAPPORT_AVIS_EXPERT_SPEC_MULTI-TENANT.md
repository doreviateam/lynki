# Rapport Avis Expert — SPEC Multi-Tenant Linky (P0)

**Date :** 2026-02-26  
**Spec :** `ZeDocs/web33/SPEC_MULTI-TENANT.md` v0.1  
**Objet :** Analyse au regard de la plateforme Dorevia, préconisations, amendements et questions

---

## 1. Synthèse

La SPEC P0 est **alignée avec l’architecture existante** (Vault partagé, partition par tenant, Linky mono-tenant). Plusieurs **écarts de nommage** et **manques opérationnels** sont à traiter avant exécution. L’avis est **favorable sous amendements**.

---

## 2. Alignement plateforme / SPEC

### 2.1 Points conformes

| Élément SPEC | Plateforme | Statut |
|--------------|------------|--------|
| Vault partagé | `vault-core-stinger`, DB unique `dorevia_vault` | ✅ Conforme |
| Partition par tenant | Colonne `tenant` dans `bank_reconciliation_projection`, `financial_recon_deltas`, `bank_reconciliation_events`, etc. | ✅ Conforme |
| Idempotence tenant-scopée | `reconcil:{tenant}:bsl:{id}:{suffix}` (Odoo), `UNIQUE(tenant, idempotency_key)` (Vault) | ✅ Conforme |
| Instance Linky mono-tenant | `TENANT_ID` env, `/api/tenant` retourne `tenant_id` | ✅ Conforme |
| Token DVIG par tenant | `dvig.tokens.yml` : `tenant`, `token_hash`, `id` | ✅ Conforme |
| Commande token | `dorevia.sh token issue odoo lab laplatine2026` | ✅ Disponible |

### 2.2 Écarts à corriger

#### A. Nommage tenant

| SPEC | Plateforme actuelle | Proposition |
|------|---------------------|-------------|
| `laplatine` | `sarl-la-platine` | **Amendement** : préciser si la démo utilise `laplatine` (nouveau) ou réutilise `sarl-la-platine`. Cohérence DNS : `sarl-la-platine.doreviateam.com` existe, `laplatine.doreviateam.com` serait nouveau. |
| `laplatine2026` | — (nouveau) | OK pour tenant démo |

**Réponse Q1 :** La MOA fournit la base de données à reprendre. Le nommage tenant est aligné sur cette source.

#### B. Domaines

| SPEC | Réalité plateforme |
|------|--------------------|
| `ui.lab.laplatine.doreviateam.com` | `ui.lab.sarl-la-platine.doreviateam.com` (voir `tenants/sarl-la-platine/apps/ui/lab/docker-compose.yml`) |

**Amendement :** Adapter les domaines à la décision Q1. Si on garde sarl-la-platine : `ui.lab.sarl-la-platine.doreviateam.com` et `ui.lab.laplatine2026.doreviateam.com`.

#### C. ODOO_BANK_RECONCILIATION_URL (Vault)

Le Vault core-stinger a une **seule** URL :

```yaml
ODOO_BANK_RECONCILIATION_URL=http://odoo_stinger_sarl-la-platine:8069/dorevia/vault/linky_bank_reconciliation
```

**Amendement :** Pour une démo avec 2 tenants (laplatine, laplatine2026), chacun avec son Odoo :
- Option 1 : Vault appelle **un seul** Odoo (ex. sarl-la-platine). Laplatine2026 n’a pas le proxy bank-reconciliation → carte Trésorerie dégradée pour laplatine2026.
- Option 2 : Routage dynamique par tenant (ex. config `tenant → odoo_url`). Non implémenté actuellement.

**Question Q2 :** La démo exige-t-elle une carte Trésorerie fonctionnelle pour laplatine2026 ? Si oui, spécifier le routage Odoo par tenant.

---

## 3. Manques opérationnels

### 3.1 Backup / Restore Odoo

La SPEC STEP 4 « Restaurer backup » vise un **dump Odoo** (DB + filestore) vers une base LAB dédiée.

| Outil plateforme | Périmètre | Pertinent pour SPEC ? |
|------------------|-----------|------------------------|
| `dorevia.sh backup --server` | Vault (volumes, DB) + secrets, **serveur distant** | ❌ Non — backup Vault, pas Odoo |
| `dorevia.sh restore --server --from` | Idem, restore distant | ❌ Non |

**Préconisation :** Documenter une procédure « Restauration base Odoo fournie → Odoo LAB » :
- Création DB `laplatine2026`
- Restauration du dump fourni par la MOA (`pg_restore` ou `psql`)
- Copie filestore si fournie

**Note MOA :** La MOA fournit la base de données à reprendre. La SPEC STEP 4 doit préciser le format attendu (dump PostgreSQL, filestore) et le chemin de dépôt.

### 3.2 Provisioning tenant

STEP 1 « Créer le tenant laplatine2026 » n’a pas d’équivalent automatisé.

**Préconisation :** Checklist explicite :
1. `tenants/laplatine2026/state/manifest.json` (copie depuis modèle)
2. `tenants/laplatine2026/apps/odoo/lab/` (docker-compose, odoo.conf)
3. `tenants/laplatine2026/apps/ui/lab/` (docker-compose Linky)
4. Entrée dans `tenants/core-stinger/secrets/dvig.tokens.yml`
5. DNS : `ui.lab.laplatine2026.doreviateam.com` → Caddy / serveur

### 3.3 Séquences

STEP 1 : « Initialiser séquences si nécessaire ».

**Question Q3 :** Quelles séquences ? Odoo (ir.sequence) ? Vault ? DVIG ? Préciser pour éviter oubli.

---

## 4. Étapes SPEC — Ajustements suggérés

| Step | Ajustement |
|------|------------|
| 1 | Ajouter référence au format `manifest.json` et `dvig.tokens.yml` |
| 2 | `VAULT_URL` Linky : même Vault partagé (ex. `http://vault-core-stinger:8080`) |
| 3 | Créer `tenants/laplatine2026/apps/odoo/lab/` avec docker-compose + volume postgres |
| 4 | Détailler procédure Odoo (dump source = prod laplatine, cible = DB laplatine2026) |
| 5 | Liste crons / intégrations à désactiver (SMTP, webhooks, etc.) |
| 6 | DVIG : ajouter token `laplatine2026` dans `dvig.tokens.yml`, relier Odoo LAB |
| 7 | Backfill : cibler `tenant_id=laplatine2026` |
| 8 | Test isolation : facture créée en laplatine2026 invisible en laplatine |

---

## 5. Definition of Done — Compléments

Suggérer d’ajouter :

- [ ] DNS `ui.lab.laplatine2026.doreviateam.com` résolu
- [ ] Caddy route configurée pour Linky laplatine2026
- [ ] Requête Vault `SELECT DISTINCT tenant FROM documents` retourne les 2 tenants sans fuite
- [ ] Script `query_bank_reconciliation_projection.sh --tenant laplatine2026` exécutable (même si 0 lignes)

---

## 6. Plan de rollback — Compléments

- Supprimer l’entrée `laplatine2026` de `dvig.tokens.yml` et recharger DVIG (SIGHUP ou restart)
- Optionnel : purger les données Vault `tenant=laplatine2026` (avec précaution si prod partagée)

---

## 7. Questions — Réponses MOA

| # | Question | Réponse |
|---|----------|---------|
| Q1 | laplatine vs sarl-la-platine pour le tenant prod de la démo ? | **MOA fournit une base de données à reprendre** — la source du backup/restore est externe. Adapter la procédure STEP 4 pour restaurer la DB fournie. |
| Q2 | Carte Trésorerie requise pour laplatine2026 ? Si oui, routage Odoo par tenant à spécifier. | **On utilise les cartes actuelles** — pas de nouveau développement côté Linky. Les cartes existantes (dont Trésorerie) sont affichées telles quelles. Pour laplatine2026 : si Odoo LAB a un endpoint `/dorevia/vault/linky_bank_reconciliation`, le routage Vault devra être configuré (ODOO_BANK_RECONCILIATION_URL multi-tenant ou instance dédiée). |
| Q3 | Quelles séquences « initialiser » (Odoo, Vault, DVIG) ? | À préciser |

---

## 8. Recommandation finale

**Avis : GO avec amendements.**

- Intégrer les ajustements de la section 4 dans la SPEC.
- Répondre aux questions Q1–Q3 avant exécution.
- Créer un runbook « Restauration Odoo → LAB » ou le référencer.
- Valider les domaines DNS et Caddy avant STEP 2.

---

*Document rédigé le 2026-02-26.*
