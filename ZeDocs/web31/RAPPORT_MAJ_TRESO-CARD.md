# Rapport d'intervention — Carte Trésorerie validée

**Date :** 25 février 2026  
**Objet :** Mise à jour de la carte « Trésorerie validée » du cockpit Linky  
**Public :** MOA (Maîtrise d'Ouvrage)  
**Contexte :** Corrections et adaptations suite au déploiement de la spécification RECONCIL (vaulting des événements de rapprochement bancaire)

---

## 1. Contexte et objectifs

La carte **Trésorerie validée** affiche, pour un tenant donné, la répartition entre montants rapprochés et montants en attente de rapprochement, ainsi qu’un indicateur de fiabilité bancaire. Elle s’appuie sur :
- le **Vault** (données vaultées : paiements, projection RECONCIL) ;
- **Odoo** (proxy bank-reconciliation-health pour certains indicateurs).

Plusieurs incohérences ont été observées et corrigées lors de cette intervention.

---

## 2. Problèmes identifiés

### 2.1 Fiabilité bancaire à 1 % au lieu de 100 %

**Symptôme :** La fiabilité s’affichait « 1 % » alors que toutes les lignes de relevé dans le périmètre rapprochement étaient rapprochées.

**Cause :** Le Vault renvoyait le taux en décimal (0–1) alors que le frontend l’interprétait comme un pourcentage (0–100). Ainsi, `1` (100 %) était affiché comme « 1 % ».

### 2.2 Fiabilité bancaire non représentative de la réalité

**Symptôme :** Quand une grande partie des paiements n’était pas encore rapprochée (ex. ~1,4 M€ en attente), la carte affichait « 100 % » car seules quelques lignes de relevé (~2 680 €) étaient dans la projection, toutes rapprochées.

**Cause :** Le calcul de fiabilité se basait uniquement sur le périmètre « projection » (lignes de relevé bancaire vaultées), sans prendre en compte le « gap » (paiements vaultés mais pas encore présents dans des relevés bancaires).

### 2.3 Filtrage société incorrect

**Symptôme :** En vue « Consolidé » (ou `company_id = 0`), les données de projection étaient filtrées à tort, aboutissant à des montants à 0.

**Cause :** Le filtre `company_id` était appliqué même pour la vue consolidée. De plus, le format `odoo:1` envoyé par Linky n’était pas correctement pris en compte côté Vault.

### 2.4 Indicateurs « Lignes à rapprocher » et « Plus ancien mouvement » non déterminables

**Symptôme :** Ces champs affichaient « — » ou des valeurs peu fiables.

**Cause :** La sémantique Odoo (lignes de relevé bancaire) ne correspond pas à celle du périmètre vaulté. Les paiements non encore inclus dans des relevés ne sont pas des « lignes » au sens Odoo, ce qui rend ces indicateurs peu exploitables dans le contexte actuel.

### 2.5 Données bank-reconciliation-health manquantes

**Symptôme :** « Dernier relevé importé », « Journaux concernés » restaient vides.

**Cause :** Le handler Vault `bank-reconciliation-health` ne consultait plus Odoo et renvoyait systématiquement un stub vide.

---

## 3. Modifications apportées

### 3.1 Vault — Fiabilité bancaire

| Modification | Description |
|-------------|-------------|
| **Prise en compte du gap** | Si le total des paiements vaultés (`netCash`) est supérieur au total de la projection (lignes de relevé), le « gap » (montants non encore dans des relevés) est ajouté à « En attente de rapprochement ». |
| **Formule de fiabilité** | `reliability_rate = reconciled / netCash` (part du solde effectivement validée par rapprochement). |

Résultat : la fiabilité reflète désormais la part réelle du cash rapprochée par rapport à l’ensemble des paiements vaultés.

### 3.2 Linky API — Affichage du taux

| Modification | Description |
|-------------|-------------|
| **Conversion 0–1 vers 0–100** | La route `/api/treasury` convertit le taux décimal renvoyé par le Vault (0–1) en pourcentage (0–100) avant envoi au frontend. |

### 3.3 Vault — Filtrage société

| Modification | Description |
|-------------|-------------|
| **Vue consolidée** | Si `company_id` est vide ou égal à `"0"`, aucun filtre n’est appliqué sur la projection. |
| **Format odoo:N** | Extraction automatique de l’identifiant numérique à partir de formats tels que `odoo:1`. |

### 3.4 Vault — Proxy bank-reconciliation-health

| Modification | Description |
|-------------|-------------|
| **Reprise du proxy Odoo** | Le handler `bank-reconciliation-health` appelle à nouveau l’endpoint Odoo `/dorevia/vault/linky_bank_reconciliation` pour récupérer : `last_statement_date`, `oldest_unreconciled_date`, `bank_accounts_count`, etc. |
| **Fallback** | En cas d’échec ou d’indisponibilité d’Odoo, un stub (valeurs nulles) est renvoyé. |

### 3.5 Carte Trésorerie — Simplification des indicateurs

| Modification | Description |
|-------------|-------------|
| **Suppression** | Les lignes « Lignes à rapprocher » et « Plus ancien mouvement » ont été retirées de la carte, car non déterminables de manière fiable avec les données et sémantiques actuelles. |
| **Conservation** | Les champs « Journaux concernés » et « Dernier relevé importé » sont conservés (alimentés par Odoo via le proxy). |

---

## 4. Déploiement

| Composant | Action |
|-----------|--------|
| **Vault** | Rebuild de l’image `dorevia/vault:vaulting-routes` et recréation du conteneur `vault-core-stinger`. |
| **Linky** | Rebuild de l’image `dorevia/linky:build-local` et recréation des conteneurs `linky_lab_sarl-la-platine` et `linky_stinger_sarl-la-platine`. |

---

## 5. Résultat attendu

- **Trésorerie validée** : montant effectivement rapproché (lignes de relevé vaultées avec `is_reconciled = true`).
- **En attente de rapprochement** : montants non rapprochés dans la projection + montants des paiements vaultés non encore présents dans des relevés bancaires.
- **Fiabilité bancaire** : pourcentage du solde (paiements vaultés) validé par rapprochement.
- **Journaux concernés** : nombre de journaux bancaires (source Odoo).
- **Dernier relevé importé** : date du dernier relevé bancaire importé (source Odoo).

---

## 6. Recommandations MOA

1. **Importer des relevés bancaires** : Pour augmenter la fiabilité affichée, importer et rapprocher les relevés dans Odoo, puis lancer le backfill RECONCIL si nécessaire.
2. **Cohérence des sources** : La carte mixe données vaultées (payments, projection RECONCIL) et données Odoo (bank-reconciliation-health). À long terme, une harmonisation des sources (tout vaulté ou tout Odoo) serait souhaitable.
3. **Documentation utilisateur** : Préciser aux utilisateurs que « En attente » inclut à la fois les lignes de relevé non rapprochées et les paiements pas encore intégrés dans des relevés.

---

## 7. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `sources/vault/internal/handlers/aggregations_treasury.go` | Calcul du gap, fiabilité, filtrage company_id |
| `sources/vault/internal/storage/bank_reconciliation.go` | Filtrage company_id (consolidé, format odoo:N) |
| `sources/vault/internal/handlers/bank_reconciliation_health.go` | Réactivation du proxy vers Odoo |
| `units/dorevia-linky/app/api/treasury/route.ts` | Conversion taux 0–1 → 0–100 |
| `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` | Suppression « Lignes à rapprocher » et « Plus ancien mouvement » |

---

## 8. Annexes — Diagnostic ligne 480 k€

### Contexte

Une ligne d'environ 480 k€ rapprochée dans Odoo n'apparaît pas dans la carte Trésorerie (ni dans la projection, ni dans les événements vaultés).

### Vérifications effectuées

| Composant | Résultat |
|-----------|----------|
| **Vault `bank_reconciliation_events`** | 6 événements pour sarl-la-platine : 158,80 € (reconciled/unreconciled le 25/02), 2 880 €, -360,30 €, 1,50 €, 158,80 €. **Aucun événement 480 k€**. |
| **Vault `bank_reconciliation_projection`** | 4 lignes (~2 680 €), toutes rapprochées. **La ligne 480 k€ n'est pas dans la projection**. |
| **Logs Odoo** (`reconcil_emit_ok` / `reconcil_emit_error`) | **Aucun** log pour une ligne 480 k€. Le flux temps réel fonctionne pour 158,80 € (événements du 25/02 à 13:06). |
| **Logs DVIG** | `events_count: 0` sur l'outbox — pas d'événement bank.move.reconciled en attente. Le flux Odoo → DVIG → Vault est OK pour les lignes qui émettent. |

### Analyse

1. **Flux temps réel valide** : Les événements 158,80 € reconciled/unreconciled du 25/02 prouvent que Odoo (override `account.bank.statement.line.write`) → DVIG `/ingest` → Vault `POST /bank-reconciliation/events` fonctionne correctement.
2. **La ligne 480 k€ n'a jamais émis** : Aucun `reconcil_emit_ok` Odoo, aucun événement correspondant dans le Vault.
3. **Cause racine identifiée** : Dans le module OCA `account_reconcile_oca`, le lettrage appelle `reconcile_bank_line()` qui modifie le `move` et ses lignes. Le champ `is_reconciled` est un **champ calculé** (computed) mis à jour par recomputation — il **ne passe pas par `write(vals)`** avec `is_reconciled` dans les valeurs. Notre override sur `write()` ne voyait donc jamais la transition.

### Correction appliquée

Surcharge de `reconcile_bank_line()` et `unreconcile_bank_line()` dans `dorevia_vault_connector` pour émettre l'événement **au moment du lettrage/délettrage**, sans dépendre de `write(is_reconciled=…)` :

| Fichier | Modification |
|---------|--------------|
| `units/odoo/custom-addons/dorevia_vault_connector/models/account_bank_statement_line.py` | Override `reconcile_bank_line()` et `unreconcile_bank_line()` pour appeler `_emit_reconciliation_event()` après le lettrage |
| `units/odoo/custom-addons/dorevia_vault_connector/__manifest__.py` | Dépendance `account_reconcile_oca` |

### Action post-déploiement

Pour la ligne 480 k€ **déjà lettrée** — exécuté le 25/02 : backfill RECONCIL (5 lignes, 0 erreur), ligne 480 k€ intégrée. Rebuild Vault déployé. Correction sémantique : « En attente » = Σ |amount| lignes non rapprochées. Voir sections 9–11 ci-dessous.

**Historique :** Pour toute ligne déjà lettrée avant le correctif : lancer le backfill RECONCIL manuellement pour l’alimenter dans la projection. Les prochaines réconciliations (dont toute nouvelle lettrage) remonteront en temps réel via les nouveaux hooks.
---

## 9. Correction sémantique — Valeurs absolues

« En attente » = Σ |amount| des lignes non rapprochées. Fichiers : `bank_reconciliation.go` (ABS), `aggregations_treasury.go` (suppression gap).

## 10. Backfill et déploiement

Backfill : 5 lignes, 0 erreur. Ligne 480 k€ intégrée. Vault rebuild et recréé. API : reconciled=483 400 €, fiabilité 100 %.

## 11. Données Vault

Tables : `bank_reconciliation_events` (historique), `bank_reconciliation_projection` (état courant). Flux Odoo→DVIG→Vault.

---

*Rapport rédigé à l’issue de l’intervention du 25 février 2026.*
