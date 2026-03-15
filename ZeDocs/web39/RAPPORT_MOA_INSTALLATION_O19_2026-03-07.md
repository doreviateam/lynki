# Rapport détaillé MOA — Installation du tenant o19 (Odoo 19)

**Destinataire :** Maîtrise d'Ouvrage  
**Date :** 2026-03-07  
**Objet :** Rapport détaillé d'installation du tenant laboratoire o19 — Odoo 19, Vault, DVIG, Linky  
**Référence :** `ZeDocs/web39/PLAN_IMPLEMENTATION_O19_ODOO19_SCRUM.md`  
**Statut :** Installation complète et opérationnelle

---

## 1. Synthèse exécutive

Le tenant **o19** est le **tenant laboratoire universel** de la plateforme Dorevia. Il permet de valider l'architecture fintech sur Odoo 19 et de préparer l'évolution vers des ERP et sources de données diversifiés (ERPNext, Pennylane, API bancaire, etc.).

| Indicateur | État |
|------------|------|
| **Tenant o19** | ✅ Opérationnel |
| **Odoo 19** | ✅ Déployé (image 19.0) |
| **Linky** | ✅ Déployé |
| **Connecteur Vault (dorevia_vault_connector)** | ✅ Adapté Odoo 19 |
| **account_usability** | ✅ Installé (v19.0.1.0.0) |
| **queue_job** | ✅ Installé (v19.0) |
| **Vaulting factures** | ✅ Opérationnel |
| **Vaulting paiements** | ✅ Opérationnel |
| **Réconciliation bancaire (Odoo → Linky)** | ✅ Endpoint opérationnel |
| **Lettrage / RECONCIL** | ✅ Flux validé |

**Conclusion :** Le tenant o19 est entièrement opérationnel. L'installation inclut les modules OCA requis (account_usability, queue_job), le connecteur Vault adapté pour Odoo 19, et l'intégration complète avec Vault, DVIG et Linky.

---

## 2. Contexte et objectifs

### 2.1 Besoin métier

| Besoin | Réponse |
|--------|---------|
| **Problème** | La plateforme Dorevia reposait sur Odoo 18. Il fallait valider la montée en version et préparer l'ouverture à d'autres ERP. |
| **Objectif** | Créer un tenant laboratoire o19 (Odoo 19) pour valider l'architecture sans impacter les tenants en production. |
| **Impact** | Plateforme prête pour Odoo 19 ; base de test pour futurs connecteurs ; sandbox fintech Dorevia. |

### 2.2 Rôle stratégique du tenant o19

Le tenant o19 sert de **sandbox fintech** : demain on pourra y connecter ERPNext, Pennylane, API bancaire, Shopify et vérifier que Vault, DVIG et Linky fonctionnent. Il valide l'architecture ERP-agnostic de la plateforme.

---

## 3. Architecture technique

```
                 Vault (ERP-agnostic, partagé core-stinger)
                   │
                  DVIG (collecteur d'événements, partagé core-stinger)
                   │
        ┌──────────┴──────────┐
        │                     │
    Odoo 18 tenants       Odoo 19 tenant (o19)
    (laplatine2026, etc.) (laboratoire)
        │                     │
        └──────────┬──────────┘
                   │
                 Linky (cockpit unique)
```

**Principe :** Réutilisation de l'infrastructure partagée (Vault, DVIG). Odoo 19 et Linky dédiés au tenant o19.

### 3.1 Composants déployés

| Composant | Détail |
|-----------|--------|
| **Odoo** | Image `odoo:19.0`, base `odoo_lab_o19` |
| **PostgreSQL** | Image `postgres:16` |
| **Linky** | Image `dorevia/linky:governance-2026-03-03`, `TENANT_ID=o19` |
| **DVIG** | Partagé (core-stinger), token dédié `tok_lab_o19_002` |
| **Vault** | Partagé (core-stinger), partition par `tenant=o19` |

### 3.2 URLs d'accès

| Service | URL |
|---------|-----|
| Odoo 19 | https://odoo.lab.o19.doreviateam.com |
| Linky (cockpit) | https://ui.lab.o19.doreviateam.com |
| Vault (partagé) | https://vault.core-stinger.doreviateam.com |
| DVIG (partagé) | https://dvig.core-stinger.doreviateam.com |

---

## 4. Détail de l'installation

### 4.1 Structure du tenant

```
tenants/o19/
├── state/
│   └── manifest.json          # Configuration du tenant
├── secrets/                   # Tokens DVIG, etc.
├── apps/
│   ├── odoo/
│   │   └── lab/
│   │       ├── docker-compose.yml
│   │       ├── odoo.conf
│   │       ├── reinstall_o19.sh    # Script de réinstallation complète
│   │       ├── configure_vault_dvig.py
│   │       ├── configure_fr_plan_comptable.py
│   │       ├── seed_donnees_tests.py
│   │       └── ...
│   └── ui/
│       └── lab/
│           └── docker-compose.yml
```

### 4.2 Modules Odoo installés

#### Modules standard (plan comptable FR)

| Module | Version | Rôle |
|--------|---------|------|
| base | 19.0 | Noyau Odoo |
| account | 19.0 | Comptabilité |
| l10n_fr | 19.0 | Localisation France |
| l10n_fr_account | 19.0 | Plan comptable français (PCG) |
| sale | 19.0 | Ventes |

#### Modules OCA (Odoo 19)

| Module | Version | Source | Rôle |
|--------|---------|--------|------|
| **account_usability** | 19.0.1.0.0 | `units/odoo/addons-o19/` | Menus comptables manquants, option Anglo-Saxon |
| **account_statement_base** | 19.0.1.0.0 | `units/odoo/addons-o19/` | Base relevés bancaires OCA |
| **queue_job** | 19.0 | `units/odoo/addons-o19/` | Jobs asynchrones |

*Note :* Les modules OCA 18.0 ne sont pas compatibles avec Odoo 19. Les versions 19.0 ont été copiées depuis les dépôts OCA (branche 19.0) dans `units/odoo/addons-o19/`.

**account_reconcile_oca** : Non disponible en 19.0 (seul `account_statement_base` a été migré par OCA). Voir `RUNBOOK_ACCOUNT_RECONCILE_OCA_O19.md`.

#### Modules Dorevia (custom-addons)

| Module | Rôle |
|--------|------|
| **dorevia_vault_connector** | Connecteur Vault — vaulting factures, paiements, lettrage |
| **dorevia_session_guard** | Sécurisation des sessions |
| **web_responsive** | Interface responsive (v19.0.1.0.1) |

### 4.3 Adaptations techniques pour Odoo 19

#### Connecteur Vault (dorevia_vault_connector)

| Fonctionnalité | Adaptation |
|---------------|------------|
| **Dépendance OCA** | Suppression de `account_reconcile_oca` (non disponible en 19.0) |
| **Lettrage bancaire** | Fallback sur `write()` pour détecter les changements `is_reconciled` ; backfill pour lignes déjà rapprochées |
| **Vaulting factures / paiements** | API Odoo 19 compatible |
| **Revue code v1.1.2** | Corrections datetime, `next_retry_at`, `source_model/source_id` |

#### account_usability

Le module OCA `account_usability` (version 18.0) n'est pas installable sur Odoo 19. La version 19.0 a été récupérée depuis le dépôt OCA `account-financial-tools` (branche 19.0) et copiée dans `units/odoo/addons-o19/account_usability/`.

### 4.4 Script de réinstallation

Le script `reinstall_o19.sh` automatise une installation complète :

1. Arrêt Odoo
2. Suppression base + filestore
3. Création base (vierge ou restauration dump)
4. Installation base + langue FR
5. Configuration pays France
6. Installation account, l10n_fr, l10n_fr_account, sale
7. **Installation queue_job, account_usability, dorevia_vault_connector, dorevia_session_guard**
8. Configuration Vault/DVIG
9. Création données de test

**Usage :**
```bash
cd tenants/o19/apps/odoo/lab
./reinstall_o19.sh
```

**Avec restauration d'un dump migré :**
```bash
DUMP_FILE=/chemin/vers/dump_migre.dump ./reinstall_o19.sh
```

---

## 5. Flux métier validés

### 5.1 Vaulting factures

| Étape | Statut |
|-------|--------|
| Création facture client | ✅ |
| Validation (action_post) | ✅ |
| Statut « Protégée » + `dorevia_vault_id` | ✅ |
| Émission événement vers DVIG | ✅ |

### 5.2 Vaulting paiements

| Étape | Statut |
|-------|--------|
| Enregistrement paiement | ✅ |
| Validation | ✅ |
| Statut vaulted | ✅ |

### 5.3 Lettrage / réconciliation bancaire

| Étape | Statut |
|-------|--------|
| Lettrage manuel dans l'UI Odoo | ✅ |
| Détection changement `is_reconciled` | ✅ |
| Émission événements `bank.move.reconciled` / `bank.move.unreconciled` vers DVIG | ✅ |
| Backfill des lignes déjà rapprochées | ✅ |
| Endpoint `linky_bank_reconciliation` (Odoo → Linky) | ✅ |

### 5.4 Linky

| API | Statut |
|-----|--------|
| `/api/tenant` → o19 | ✅ |
| `/api/cockpit/cards` | ✅ Schéma v1 |

---

## 6. Migration Odoo 18 → 19 (données existantes)

### 6.1 Contexte

La migration directe (restore dump Odoo 18 + `odoo -u all`) **échoue** à cause d'incompatibilités de schéma :
- Colonnes manquantes (`res_partner.suggest_based_on`, etc.)
- Conversion JSON invalide

### 6.2 Options recommandées

| Option | Description | Coût |
|--------|-------------|------|
| **OCU (Odoo Community Upgrade)** | https://ocu.winotto.com — migration 18→19 supportée | Test gratuit ; prod 99 EUR |
| **upgrade.odoo.com** | Enterprise uniquement | Abonnement Odoo |
| **OpenUpgrade (OCA)** | Projet communautaire, v19 en cours | — |

### 6.3 Procédure OCU (recommandée)

1. Créer le dump : `./tenants/o19/apps/odoo/lab/dump_laplatine2026.sh`
2. Téléverser sur https://ocu.winotto.com
3. Choisir cible : Odoo 19
4. Télécharger le backup migré
5. Restaurer : `DUMP_FILE=/chemin/vers/migre.dump ./reinstall_o19.sh`

*Détails complets :* `ZeDocs/web39/RUNBOOK_MIGRATION_ODOO18_VERS_19.md`

---

## 7. Points d'attention et limites

### 7.1 Lettrage — Odoo 19 sans OCA account_reconcile

En Odoo 19 standard, **aucune API programmatique** n'est documentée pour le rapprochement bancaire. Le module OCA `account_reconcile_oca` n'est pas disponible en 19.0.

| Conséquence | Mitigation |
|-------------|------------|
| Lettrage non automatisable par script | Le connecteur Dorevia détecte les changements lors du lettrage **manuel** dans l'UI Odoo |
| Backfill | Envoie l'état courant des lignes vers DVIG — opérationnel |

### 7.2 dorevia_session_guard

Le module `dorevia_session_guard` peut afficher un avertissement « some depends are not loaded » (dépendances manquantes). Impact à évaluer selon l'usage.

### 7.3 Image Odoo 19

**Recommandation :** Utiliser une image épinglée (ex. `odoo:19.0-20260205`) plutôt que `odoo:19.0` flottant, pour éviter les mises à jour silencieuses.

---

## 8. Commandes de référence

```bash
# Réinstallation complète
cd tenants/o19/apps/odoo/lab && ./reinstall_o19.sh

# Vérifier le statut des modules
docker compose run --rm --no-deps odoo odoo shell -d odoo_lab_o19 -c /etc/odoo/odoo.conf --no-http -c "
m = env['ir.module.module'].search([('name','in',['account_usability','queue_job','dorevia_vault_connector'])])
for r in m: print(r.name, r.state, r.latest_version)
"

# Endpoint réconciliation bancaire
curl -s "https://odoo.lab.o19.doreviateam.com/dorevia/vault/linky_bank_reconciliation?tenant=o19&date_from=2026-01-01&date_to=2026-12-31"

# API Linky
curl -sS https://ui.lab.o19.doreviateam.com/api/tenant
curl -sS https://ui.lab.o19.doreviateam.com/api/cockpit/cards?tenant=o19
```

---

## 9. Documents de référence

| Document | Rôle |
|----------|------|
| `ZeDocs/web39/PLAN_IMPLEMENTATION_O19_ODOO19_SCRUM.md` | Plan détaillé d'implémentation |
| `ZeDocs/web39/RUNBOOK_MIGRATION_ODOO18_VERS_19.md` | Procédure migration 18→19 |
| `ZeDocs/web39/RUNBOOK_QUEUE_JOB_O19.md` | Gestion queue_job sur o19 |
| `ZeDocs/web39/RUNBOOK_ACCOUNT_RECONCILE_OCA_O19.md` | État account_reconcile_oca (non dispo 19.0) |
| `ZeDocs/web39/RECOMMANDATION_STRATEGIE_RAPPROCHEMENT_BANCAIRE_O19.md` | Stratégie rapprochement |
| `ZeDocs/web39/SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md` | Spécification port account_reconcile_oca (budget accordé) |
| `ZeDocs/web39/PLAN_IMPLEMENTATION_PORT_ACCOUNT_RECONCILE_OCA_O19.md` | Plan d'implémentation du port (6 phases, 9–15 j) |
| `ZeDocs/web39/RAPPORT_MOA_TENANT_O19_ODOO19_2026-03-06.md` | Rapport MOA initial (Phase 5) |
| `ZeDocs/web39/PV_RECETTE_TENANT_O19_2026-03-06.md` | PV de recette technique |

---

## 10. Conclusion

L'installation du tenant o19 est **complète et opérationnelle**. Tous les composants requis sont déployés :

- **Odoo 19** avec plan comptable français
- **Modules OCA** : account_usability (menus comptables), queue_job (jobs asynchrones)
- **Connecteur Vault** adapté pour Odoo 19 (sans account_reconcile_oca)
- **Intégration Vault, DVIG, Linky** validée

Le tenant o19 constitue la **sandbox fintech** de la plateforme Dorevia et permet de préparer l'évolution vers des ERP et sources de données diversifiés.

---

*Document généré le 2026-03-07 — Référence : ZeDocs/web39/RAPPORT_MOA_INSTALLATION_O19_2026-03-07.md*
