# SPEC — Carte « Trésorerie » v4.1 (Hybride Net + Volume)

**Date :** 2026-02-25  
**Statut :** P0 — Référence (complément de l'existant)  
**Objectif :** Conserver la lecture *process* (volumes) et ajouter la lecture *position* (net), sans changer silencieusement la sémantique.  
**Sources :** Vault (projection RECONCIL) ; Odoo (erp_balance) via Vault uniquement.

---

## 0. Architecture — Principe Linky ↔ Vault

**Principe :** Toutes les données consommées par Linky transitent par le Vault. Linky ne connaît pas Odoo.

**Flux :**
```
Linky  ──(GET /api/treasury)──►  Vault  ──(projection RECONCIL)──►  DB Vault
                                      └──(GET Odoo erp_balance)──►  Odoo
```

- **Linky** appelle **uniquement** le Vault (ex. `GET /ui/aggregations/treasury`).
- **Vault** agrège :
  - Données **vaultées** : projection RECONCIL (position, volumes)
  - Données **Odoo** : `erp_balance` (proxy en temps réel, non vaulté — référence comparatif uniquement)

Le Vault est le **point d'entrée unique** pour Linky. La distinction « vaulté vs proxy Odoo » est interne au Vault ; Linky reçoit un objet cohérent.

**Contrainte de fraîcheur :** Toutes les données vaultables doivent parvenir automatiquement dans le Vault en **moins de 10 secondes** après leur apparition dans la source (ex. rapprochement dans Odoo → événement RECONCIL → ingestion Vault).

---

## 1. Décision produit (Phase 0)

Cette version **n'est pas un remplacement** du modèle actuel.  
Elle **ajoute** un axe « Position probante » à la carte existante « Qualité de rapprochement ».

La carte devient une carte à **2 axes** :

- **Axe 1 — Position (financier / probant)** : *validated net*, *exposure*, *ERP*
- **Axe 2 — Fiabilité process (opérationnel)** : *volumes*, *taux de traitement*

---

## 2. Objectifs fonctionnels

La carte doit permettre de répondre à 2 questions distinctes :

### 2.1 Axe 1 — Position
> Quelle est ma **position de trésorerie validée** (confirmée par la banque) et quel est l'**écart** avec l'ERP ?

### 2.2 Axe 2 — Process
> Est-ce que mes relevés sont **traités** (rapprochés) et à quel **niveau de complétude** ?

---

## 3. Hypothèses & limites à documenter

### 3.1 Décalage structurel ERP vs Vault
- **ERP (Odoo)** : ledger (`account.move.line`) — peut inclure écritures d'ouverture, OD manuelles, régularisations.
- **Vault (RECONCIL)** : lignes de relevé (`account.bank.statement.line`) + statuts de rapprochement.

Donc un **delta** est possible et normal. La carte doit l'assumer (et l'expliquer).

### 3.2 Période
**Carte = état courant (stock)**, non filtré par date, pour rester cohérente avec `erp_balance`.  
(Les analyses *flux sur période* doivent rester ailleurs dans le cockpit.)

### 3.3 Multi-société
Paramètre `company_id` optionnel :
- `company_id = 0` (ou absent) : consolidé tenant
- `company_id = <id>` : filtré

---

## 4. Modèle financier

### 4.1 Règles de signe
Tous les montants sont **signés**.

| Type | Signe |
|------|-------|
| Encaissement | + |
| Décaissement | − |

### 4.2 Règle d'arrondi
- Tous les montants : **2 décimales** (arrondi **côté Vault** au moment de l'agrégation).
- Linky affiche les valeurs telles quelles, sans recalcul.

---

## 5. Données & agrégations

### 5.1 Données Vault — Projection RECONCIL

Événements existants (alignement) :
- `bank.move.reconciled` (équivalent fonctionnel de `reconciliation.validated`)
- `bank.move.unreconciled`

La projection doit exposer **deux familles d'agrégats** :

### A) Agrégats « Position » (net)
- `validated_balance` : somme **algébrique** des lignes rapprochées
- `unreconciled_balance` : somme **algébrique** des lignes non rapprochées *(si disponible aujourd'hui)*

Formules :

```
validated_balance = Σ amount WHERE status = reconciled
unreconciled_balance = Σ amount WHERE status = unreconciled
```

> Remarque : même si le Vault stocke surtout les lignes RECONCIL, on calcule ici au niveau projection.

### B) Agrégats « Process » (volume)
- `reconciled_volume` : somme des **valeurs absolues** des lignes rapprochées
- `unreconciled_volume` : somme des **valeurs absolues** des lignes non rapprochées

Formules :

```
reconciled_volume = Σ ABS(amount) WHERE status = reconciled
unreconciled_volume = Σ ABS(amount) WHERE status = unreconciled
```

### C) Total process
```
total_volume = reconciled_volume + unreconciled_volume
```

---

### 5.2 Données ERP — Odoo (via Vault)

**Flux :** Vault appelle Odoo (`linky_bank_reconciliation`) pour récupérer `erp_balance`. Linky ne contacte jamais Odoo.

Odoo doit exposer `erp_balance` (= `bank_balance`) dans la réponse standard (hors `_debug`). Le Vault propage cette valeur dans sa réponse Treasury.

**Définition :** somme des soldes des comptes bancaires ciblés (ledger). **Non vaulté** — référence comparatif uniquement.

### 5.2.1 Périmètre bancaire (erp_balance) — à verrouiller

| Critère | Règle | Motif |
|---------|-------|-------|
| **Quels comptes ?** | Comptes `default_account_id` des journaux de type `bank` de la société | Alignement avec les journaux dont les relevés sont rapprochés |
| **Mapping** | Un journal bank → un compte (1:1) | Pas de doublon, pas de compte technique hors périmètre |
| **Comptes actifs uniquement** | Oui — journaux avec `active = true` | Exclure les journaux archivés (ex. banque fermée) |
| **Écritures** | Uniquement `move_id.state = 'posted'` | Pas d'ébauches, pas de brouillons |

> ⚠️ **Risque** : si un compte technique (OD, régularisation) est ajouté au périmètre ou si un journal bank est archivé sans mise à jour, le ratio peut fausser. Documenter ce périmètre dans Odoo et éviter les ajouts hors contrôle.

---

## 6. Indicateurs calculés (2 axes)

### 6.1 Axe 1 — Position (financier / probant)

### 6.1.1 Trésorerie validée (net)
```
validated_balance
```

### 6.1.2 Exposition non validée (écart ERP vs Vault validé)
```
unvalidated_exposure = erp_balance - validated_balance
```

> Interprétation : partie du solde ERP **non confirmée** par rapprochement (ou structurellement différente).

### 6.1.3 Fiabilité position (écart comptable)
```
reliability_position =
  CASE
    WHEN erp_balance = 0 THEN 1
    ELSE LEAST(1, ABS(validated_balance) / ABS(erp_balance))
  END
```

> **Cas `ABS(validated_balance) > ABS(erp_balance)` :** le ratio brut dépasserait 100%. On **clamp à 1.0** pour éviter des affichages type "118% couverture". Le Vault expose `flags.structural_delta = true` dans ce cas ; Linky affiche un badge "Écart structurel" pour expliquer.

⚠️ À afficher comme **"Couverture probante"** (pas "fiabilité process").

### 6.1.4 Cas signes opposés (badge)
Si `SIGN(erp_balance) != SIGN(validated_balance)` et `ABS(erp_balance) > 0` :
- Afficher un badge ⚠️ **"Signes incohérents"**
- Tooltip : "Position ERP et position validée de signes opposés (OD / écritures exceptionnelles / base différente)."

---

### 6.2 Axe 2 — Fiabilité process (opérationnel)

#### 6.2.1 Volume rapproché
```
reconciled_volume
```

#### 6.2.2 Volume en attente
```
unreconciled_volume
```

#### 6.2.3 Taux de traitement (process)
```
reliability_volume =
  CASE
    WHEN total_volume = 0 THEN 1
    ELSE reconciled_volume / total_volume
  END
```

> Interprétation : part des mouvements de relevés **traités** (rapprochés).

---

## 7. Contrat API (Linky ↔ Vault)

Linky appelle **uniquement** le Vault. Une seule route Treasury suffit. Le Vault renvoie l'objet ci-dessous (agrégation projection + erp_balance Odoo).

### 7.1 Réponse cible (proposition)

```json
{
  "company_id": 0,
  "position": {
    "validated_balance": 0,
    "erp_balance": 0,
    "unvalidated_exposure": 0,
    "reliability_position": 1.0
  },
  "process": {
    "reconciled_volume": 0,
    "unreconciled_volume": 0,
    "reliability_volume": 1.0
  },
  "flags": {
    "sign_mismatch": false,
    "large_delta": false,
    "structural_delta": false
  },
  "generated_at": "2026-02-25T14:32:00Z",
  "last_reconcil_event_at": "2026-02-25T14:31:56Z"
}
```

- **`generated_at`** (obligatoire) : horodatage UTC de la réponse. Linky peut afficher « Données actualisées il y a 4s ».
- **`last_reconcil_event_at`** (optionnel, produit premium) : timestamp du dernier événement RECONCIL. Pour "âge donnée vaultée" → utiliser `created_at` (ingestion Vault) ; pour date métier → `occurred_at`. Permet d'afficher « Dernière mise à jour rapprochement : il y a 12s ».

**Flags :** La logique métier reste dans le Vault. Linky consomme ces indicateurs sans recalculer.
- `sign_mismatch` : signes `validated_balance` et `erp_balance` opposés
- `large_delta` : `ABS(unvalidated_exposure) > MAX(500, 0.05×ABS(erp_balance))` — badge "Écart important"
- `structural_delta` : `ABS(validated_balance) > ABS(erp_balance)` — couverture brute > 100%, clampée à 1 ; badge "Écart structurel"

### 7.2 Mode dégradé (Odoo indisponible)

Si Odoo est en timeout ou erreur :
- `position.erp_balance` = `null`
- `position.unvalidated_exposure` = `null` (dépend d'erp)
- `position.reliability_position` = `null`
- `flags.sign_mismatch`, `flags.large_delta`, `flags.structural_delta` = `false` (neutralisés, pas calculés au hasard)

Évite d'afficher "100% couverture" alors que la donnée ERP est manquante (confiance utilisateur).

---

## 8. UI — Structure recommandée (2 axes)

### 8.1 Layout

**Bloc A — Position (Probant)**  
1) **Trésorerie validée** (net) — `validated_balance`  
2) **Exposition non validée** — `unvalidated_exposure` (+ badge si `large_delta` ou `sign_mismatch`)  
3) **Solde ERP** — `erp_balance`  
4) **Couverture probante** — `reliability_position` (barre) (+ badge si `structural_delta`)

**Bloc B — Process (Rapprochement)**  
1) **Volume rapproché** — `reconciled_volume`  
2) **Volume en attente** — `unreconciled_volume`  
3) **Taux de traitement** — `reliability_volume` (barre)

### 8.2 Libellés (anti-confusion)
- `reliability_position` → **Couverture probante**
- `reliability_volume` → **Taux de traitement (rapprochement)**

---

## 9. Cas limites

### 9.1 Aucun volume (total_volume = 0)
- `reliability_volume = 100%`
- volumes = 0

### 9.2 erp_balance = 0
- `reliability_position = 100%`

### 9.3 Couverture > 100% (écart structurel)
`ABS(validated_balance) > ABS(erp_balance)` → ratio brut dépasse 100%.
- **réponse :** `reliability_position` clampé à 1.0, `flags.structural_delta = true`
- **UI :** badge "Écart structurel" pour expliquer (décalage ledger vs relevés, écritures non vaultées, etc.)

### 9.4 Delta important (large_delta)

**Seuil hybride** (côté Vault) :
```
threshold = MAX(500, 0.05 × ABS(erp_balance))
```

- Seuil **absolu** 500€ évite les faux positifs sur petits soldes.
- Seuil **relatif** 5% évite d'ignorer les écarts sur gros comptes.
- Le MAX des deux = robuste dans tous les cas.

`large_delta = true` si `ABS(unvalidated_exposure) > threshold` → badge ⚠️ "Écart important"

---

## 10. Plan de mise en œuvre (révisé)

### Phase 0 — Produit
- Valider officiellement : **carte 2 axes** (complément)

### Phase 1 — Vault
- Ajouter dans la projection RECONCIL :
  - `validated_balance` (Σ amount reconciled)
  - `reconciled_volume` (Σ ABS amount reconciled)
  - `unreconciled_volume` (Σ ABS amount unreconciled)
  - *(optionnel)* `unreconciled_balance` (Σ amount unreconciled)
- Le handler Treasury **agrège** : projection + appel Odoo (`erp_balance`) → une seule réponse
- Arrondi : 2 décimales côté Vault
- Seuil `large_delta` : `MAX(500, 0.05×ABS(erp_balance))`
- Ajouter `generated_at` (obligatoire), `last_reconcil_event_at` (optionnel)

### Phase 2 — Odoo
- Exposer `erp_balance` (= `bank_balance`) dans la réponse standard de `linky_bank_reconciliation` (appelé par le Vault)
- S'assurer que le périmètre bancaire (5.2.1) est respecté : journaux bank actifs, default_account_id, posted uniquement

### Phase 3 — API Linky
- Linky appelle **uniquement** le Vault (`/ui/aggregations/treasury` ou équivalent)
- La route Linky `/api/treasury` fait un **proxy unique** vers le Vault (pas d'appel bank-reconciliation-health séparé)
- Le Vault renvoie la réponse complète (`position`, `process`, `flags`)

### Phase 4 — UI
- Implémenter la structure 2 axes
- Ajouter badges et tooltips : `sign_mismatch`, `large_delta`, `structural_delta`
- Afficher « Données actualisées il y a Xs » via `generated_at` ; optionnel : âge via `last_reconcil_event_at`

### Phase 5 — Doc
- Documenter la limite ERP vs Vault (ledger vs statement lines)

**Plan Scrum détaillé :** `ZeDocs/web32/PLAN_IMPLEMENTATION_TRESO_V4.1_SCRUM.md`

---

## 11. Fichiers impactés (rappel)

- `sources/vault/internal/storage/bank_reconciliation.go`
- `sources/vault/internal/handlers/aggregations_treasury.go`
- `units/odoo/.../linky_bank_reconciliation.py`
- `sources/vault/internal/handlers/aggregations_treasury.go` *(appel Odoo pour erp_balance, ou fusion avec bank-reconciliation-health)*
- `units/dorevia-linky/app/api/treasury/route.ts`
- `units/dorevia-linky/components/TreasuryCardWithPolling.tsx`

---

## 12. Glossaire

- **Net (position)** : somme algébrique (encaissements − décaissements)
- **Volume (process)** : somme des valeurs absolues (charge de traitement)
- **Rapproché** : ligne de relevé associée / validée par rapprochement
- **ERP balance** : solde comptable issu du ledger Odoo
