# Compte rendu — SPEC Trésorerie validée v1.1

**Date :** 2026-02-22  
**SPEC :** `ZeDocs/web29/SPEC_LINKY_Tresorerie_Validee_v1.1.md`  
**Statut :** Implémenté

---

## 1. Résumé

Évolution de la carte Trésorerie validée vers un outil de pilotage : verdict visuel, métriques secondaires, CTAs vers Odoo.

---

## 2. Modifications techniques

### 2.1 Backend — `/api/treasury` (Linky)

- Appel parallèle à `GET /ui/aggregations/treasury` et `GET /ui/system/bank-reconciliation-health`
- Champs ajoutés :
  - `unreconciled_lines_count` — nombre de lignes non rapprochées
  - `oldest_unreconciled_date` — date de la plus ancienne ligne non rapprochée
  - `journals_count` — nombre de journaux bancaires concernés
  - `last_statement_import_date` — date du dernier relevé importé

### 2.2 Vault — Route `bank-reconciliation-health`

- Enregistrement de `GET /ui/system/bank-reconciliation-health` dans `RegisterUiAggregations`
- Handler existant : `BankReconciliationHealthHandler(cfg.OdooBankReconciliationURL)`

### 2.3 Frontend — `TreasuryCardWithPolling`

- **Verdict bordure** :
  - 100 % validé → bordure verte
  - 0 % validé → bordure orange
  - Entre 0 et 100 % → bordure bleue (accent Linky)

- **Phrase déterministe** :
  - 0 % : « Aucun rapprochement effectué sur la période sélectionnée. »
  - Partiel : « Rapprochement partiel. Montants non validés présents. »
  - 100 % : « Toutes les écritures sont rapprochées et validées. »

- **Bloc métriques secondaires** :
  - Lignes à rapprocher : X ou —
  - Plus ancien mouvement : JJ/MM/AAAA ou —
  - Journaux concernés : N ou —
  - Dernier relevé importé : JJ/MM/AAAA ou JJ/MM/AAAA HH:MM ou —

- **CTAs** (si `unreconciled > 0`) :
  - « Rapprocher maintenant » → Odoo `/web#model=account.bank.statement.line`
  - « Importer relevés » → Odoo `/web#model=account.bank.statement`

---

## 3. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `units/dorevia-linky/app/api/treasury/route.ts` | Appel bank-reconciliation-health, champs agrégats |
| `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` | Verdict, phrase, métriques, CTAs |
| `sources/vault/internal/server/replay.go` | Enregistrement route bank-reconciliation-health |
| `sources/vault/internal/handlers/bank_reconciliation_health.go` | Champ `oldest_unreconciled_date` (transmission Odoo → Linky) |

---

## 4. Données requises côté Odoo

L’endpoint Odoo `GET /dorevia/vault/linky_bank_reconciliation` doit exposer :

- `unreconciled_entries` — nombre de lignes non rapprochées
- `last_statement_date` — date du dernier relevé (YYYY-MM-DD)
- `bank_accounts_count` — nombre de journaux bancaires
- (optionnel v1.1) `oldest_unreconciled_date` — date de la plus ancienne ligne non rapprochée

Si ces champs sont absents, le front affiche « — » pour les métriques concernées.

---

## 5. Variable d’environnement

`NEXT_PUBLIC_ODOO_URL` — URL de base Odoo pour les CTAs (ex. `https://odoo.stinger.xxx.doreviateam.com/odoo`).

**Build Linky** (URL personnalisable via --build-arg) :
```bash
cd units/dorevia-linky
docker build --build-arg NEXT_PUBLIC_ODOO_URL="https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo" -t dorevia/linky:tresorerie-v1.2 .
```

---

## 6. Déploiement

| Environnement | Image | Statut (2026-02-22) |
|---------------|-------|---------------------|
| Vault core-stinger | `dorevia/vault:tresorerie-v1.2` | Déployé |
| Linky stinger | `dorevia/linky:tresorerie-v1.2` | Déployé |
| Linky lab | `dorevia/linky:tresorerie-v1.2` | Déployé |

**Build :**
- Linky : `docker build --build-arg NEXT_PUBLIC_ODOO_URL="…" -t dorevia/linky:tresorerie-v1.2 .`
- Vault : `docker build -t dorevia/vault:tresorerie-v1.2 .`
