# PLAN D’IMPLÉMENTATION — Couverture structurelle (Card Trésorerie)

**Date :** 15 mars 2026  
**Référence :** MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE_v1.0, RAPPORT_VERIFICATION_COUVERTURE_STRUCTURELLE_PAIE_v1.0

---

## 1. Objectif

Faire respecter par le code les règles métier de la mini-spec :
- Les **OD de salaire** (et à terme autres charges structurelles) contribuent à la **couverture structurelle** dès leur constat, **sans** condition de paiement bancaire.
- La card Trésorerie affiche une **couverture structurelle > 0** lorsqu’au moins une charge structurelle reconnue (ex. OD paie) est présente, et ne doit pas afficher « Non disponible » dans ce cas.

---

## 2. Principes de conception

- **Distinction conservée :**
  - **Couverture structurelle** (spec) = niveau d’**explicabilité** de la trésorerie par des charges structurelles constatées (paie, loyer, etc.), indépendant du cash. Ce n’est **pas** le montant des charges : le montant **justifie** la présence d’une couverture, il ne s’y identifie pas.
  - **Charges structurelles constatées** = base explicative (montants par catégorie : paie, puis loyer, abonnements, etc.) ; exposée séparément pour éviter l’assimilation « couverture structurelle = montant de paie ».
  - **Couverture probante** = part des flux couverts par preuve bancaire / rapprochement (inchangée).
  - **Ratio « X mois »** (optionnel) = position validée ÷ masse salariale (indicateur gouvernance existant ; peut rester sous un libellé explicite).
- **Source de vérité paie :** réutiliser l’agrégat payroll Vault (`GET /ui/aggregations/payroll`, table `payroll_od_lines`) pour la période, afin d’alimenter la **disponibilité** de la couverture structurelle et le **breakdown** des charges, sans dupliquer la logique métier.

---

## 3. Options d’architecture

### Option A — Enrichissement de l’API Treasury (Vault + Linky)

- **Vault :** Enrichir `GET /ui/aggregations/treasury` avec un champ dédié (ex. `structural_coverage` ou `structural_charges_amount`) calculé côté Vault à partir des mêmes filtres (tenant, company_id, date_debut, date_fin).
  - Calcul Vault : appeler ou répliquer la logique type `PayrollAggregation` (somme OD paie sur la période) et, à terme, ajouter d’autres charges structurelles.
  - Réponse : ex. `structural_charges_amount` (montant des charges structurelles constatées sur la période) et/ou un ratio/interprétation.
- **Linky :** `GET /api/treasury` agrège la réponse Vault et expose `structural_coverage_available`, `structural_charges_amount`, `structural_charges_breakdown` (voir §4).
- **Avantages :** Une seule requête treasury pour Linky ; cohérence tenant/période/company.  
- **Inconvénients :** Vault doit dépendre de la période pour treasury (déjà le cas pour certaines métriques) et ajouter l’appel ou le calcul payroll pour la même période.

### Option B — Linky appelle Treasury + Payroll

- **Vault :** Inchangé pour treasury. Linky utilise déjà `GET /ui/aggregations/payroll` (via EBE / dashboard).
- **Linky :** Dans `GET /api/treasury`, en parallèle de l’appel treasury Vault, appeler `GET /ui/aggregations/payroll` (même tenant, company_id, date_debut, date_fin). Si `payroll_source === "od"` ou `"payslip"` et `total_charges > 0` → `structural_coverage_available = true`, `structural_charges_amount` = total, `structural_charges_breakdown.payroll` = total_charges.
- **Avantages :** Pas de modification Vault pour treasury ; réutilisation immédiate de l’agrégat payroll ; structure extensible (breakdown) dès la phase 1.
- **Inconvénients :** Un appel API supplémentaire depuis Linky.

### Option C — Nouveau endpoint Vault dédié

- **Vault :** Nouveau `GET /ui/aggregations/structural-coverage` (tenant, date_debut, date_fin, company_id) retournant par exemple `{ structural_charges_amount, has_payroll, currency }` (et plus tard autres catégories).
- **Linky :** `GET /api/treasury` appelle treasury + structural-coverage, puis compose la réponse pour la card.
- **Avantages :** Séparation nette des responsabilités ; évolution future (loyer, abonnements, etc.) centralisée dans le Vault.  
- **Inconvénients :** Un endpoint et une route de plus ; deux appels depuis Linky sauf si on fusionne ensuite dans treasury (Option A).

**Recommandation :** **Option B** en première phase (rapide, pas de changement Vault treasury), puis évolution vers **Option A** ou **Option C** si on souhaite centraliser dans le Vault et ajouter d’autres charges structurelles.

---

## 4. Plan par phase

### Phase 1 — Backend Linky (API treasury)

**Objectif :** Exposer la **disponibilité** de la couverture structurelle et les **charges structurelles constatées** (montant + breakdown) sans assimiler « couverture » et « montant », et sans modifier le Vault.

1. **Forme de réponse API (structure extensible dès la phase 1)**

   On n’expose **pas** `couverture_structurelle_montant` : le montant est la **base explicative**, pas la couverture elle-même. Forme cible :

   ```json
   {
     "structural_coverage_available": true,
     "structural_charges_amount": 12400,
     "structural_charges_breakdown": {
       "payroll": 12400
     }
   }
   ```

   Évolution future sans rupture :

   ```json
   {
     "structural_coverage_available": true,
     "structural_charges_amount": 16850,
     "structural_charges_breakdown": {
       "payroll": 12400,
       "rent": 3200,
       "subscriptions": 1250
     }
   }
   ```

2. **Données nécessaires**
   - Dans `GET /api/treasury` (units/dorevia-linky/app/api/treasury/route.ts) :
     - Conserver l’appel actuel à `GET /ui/aggregations/treasury` (Vault).
     - Ajouter un appel en parallèle à `GET /ui/aggregations/payroll` (Vault) avec les mêmes `tenant`, `company_id`, `date_debut`, `date_fin`.
   - Règle métier (alignée spec §7) :
     - Si `payroll_source` est `"od"` ou `"payslip"` et `total_charges > 0` → `structural_coverage_available = true`, `structural_charges_amount` = total_charges, `structural_charges_breakdown.payroll` = total_charges.
     - Sinon → `structural_coverage_available = false`, `structural_charges_amount` = null, `structural_charges_breakdown` = {} ou absent.
     - Conserver `couverture_salariale_mois` pour le ratio « position validée / masse salariale » (indicateur gouvernance, libellé explicite en UI).

3. **Implémentation proposée**
   - Créer un bloc qui appelle le Vault payroll avec les mêmes paramètres que la requête treasury.
   - En cas de succès et source paie reconnue et `total_charges > 0` : remplir `structural_coverage_available`, `structural_charges_amount`, `structural_charges_breakdown`.
   - En cas d’échec de l’appel payroll : ne pas casser la réponse treasury ; laisser `structural_coverage_available = false`, `structural_charges_amount` = null, pas de breakdown.

4. **Tests**
   - Payroll mock (source od ou payslip, total_charges > 0) → réponse contient `structural_coverage_available === true`, `structural_charges_amount > 0`, `structural_charges_breakdown.payroll` présent.
   - Sans paie ou total_charges = 0 → `structural_coverage_available === false`, `structural_charges_amount` null.

### Phase 2 — UI (Card Trésorerie)

**Objectif :** Afficher la couverture structurelle et les charges structurelles constatées **sans** réduire la couverture à un montant brut ; respecter AC1, AC4, AC6.

1. **Principe d’affichage**
   - La ligne **« Couverture structurelle »** ne doit **pas** afficher un montant brut sans contexte (éviter « Couverture structurelle : 12 400 € »).
   - Deux lignes distinctes (option retenue, la plus propre sémantiquement) :
     - **Charges structurelles constatées** → montant total (ex. `12 400 €`) avec tooltip ou sous-texte si besoin (ex. détail par catégorie : paie).
     - **Couverture structurelle** → `Présente` si `structural_coverage_available === true`, sinon `Non disponible` ou `—`.

2. **TresoreriePositionCard**
   - **Source des champs :** `structural_coverage_available`, `structural_charges_amount`, `structural_charges_breakdown` (et conserver `couverture_salariale_mois` pour le ratio « X mois »).
   - **Règles :**
     - Si `structural_coverage_available === true` :
       - Ligne **Couverture structurelle** : afficher **« Présente »** (jamais « Non disponible » → AC4).
       - Ligne **Charges structurelles constatées** : afficher le montant formaté (ex. `12 400 €`) ; tooltip ou libellé secondaire peut indiquer la catégorie (ex. « paie constatée ») pour AC6.
     - Si `structural_coverage_available === false` : Couverture structurelle → « Non disponible » ; on peut masquer la ligne Charges structurelles ou afficher « — ».
   - **AC1 :** présence OD paie → backend met `structural_coverage_available === true` → ligne Couverture structurelle = « Présente ».
   - **AC6 :** l’utilisateur peut identifier au moins la catégorie (paie) via le breakdown ou le tooltip.
   - **Couverture probante** : inchangée.

3. **TresoreriePositionCardWithPolling**
   - Passer les nouveaux champs dans `TresoreriePositionData` ; le fetch `/api/treasury` fournit déjà la réponse complète.

4. **Types**
   - Étendre le type de données de la card avec :
     - `structural_coverage_available?: boolean`
     - `structural_charges_amount?: number | null`
     - `structural_charges_breakdown?: { payroll?: number; rent?: number; subscriptions?: number }` (extensible)

### Phase 3 — Vault (optionnel, évolution)

**Objectif :** Centraliser la notion de charges structurelles côté Vault si on souhaite un seul endpoint ou une évolution multi-catégories (loyer, abonnements, etc.).

1. **Option A (enrichissement treasury)**
   - Dans `TreasuryAggregationHandler`, pour la même période/tenant/company : calculer `structural_charges_amount` et `structural_charges_breakdown` (ex. via PayrollAggregation / `payroll_od_lines`), exposer `structural_coverage_available` (true si montant > 0).
   - Linky : dans `GET /api/treasury`, utiliser ces champs au lieu d’appeler payroll séparément.

2. **Option C (endpoint dédié)**
   - Ajouter `GET /ui/aggregations/structural-coverage` retournant `structural_coverage_available`, `structural_charges_amount`, `structural_charges_breakdown` (extensible).
   - Linky : appeler cet endpoint depuis `GET /api/treasury` et reprendre la même forme de réponse (pas de renommage côté Linky).

### Phase 4 — Diva / narration (optionnel)

- Dans `dashboard-metrics` (ou le flux Diva), si `structural_coverage_available === true` :
  - Narration possible : « La trésorerie est partiellement expliquée par des charges structurelles constatées (notamment la paie). »
- Pas obligatoire pour les AC ; à traiter après les phases 1–2.

---

## 5. Récapitulatif des modifications (Phases 1–2)

| Fichier / composant | Modification |
|----------------------|--------------|
| `units/dorevia-linky/app/api/treasury/route.ts` | Appel parallèle à payroll Vault ; exposition de `structural_coverage_available`, `structural_charges_amount`, `structural_charges_breakdown` (forme extensible). |
| `units/dorevia-linky/components/TresoreriePositionCard.tsx` | Deux lignes : **Charges structurelles constatées** (montant + tooltip catégorie) ; **Couverture structurelle** (« Présente » si `structural_coverage_available`, sinon « Non disponible »). Ne pas afficher un montant brut comme libellé de la couverture (AC4, AC6). |
| Types `TresoreriePositionData` (ou équivalent) | Ajouter `structural_coverage_available`, `structural_charges_amount`, `structural_charges_breakdown`. |
| `TresoreriePositionCardWithPolling` | Transmettre les champs depuis la réponse API (déjà mappée dans `data`). |

---

## 6. Critères d’acceptation

- **AC1 :** Si une OD de salaire qualifiée existe sur la période, la couverture structurelle affichée est « Présente » (ou équivalent > 0).
- **AC2 :** La couverture structurelle ne dépend pas du paiement bancaire rapproché (elle dépend des charges structurelles constatées).
- **AC3 :** La couverture probante reste indépendante (déjà le cas).
- **AC4 :** L’interface n’affiche pas « Non disponible » pour la couverture structurelle lorsqu’au moins une charge structurelle reconnue est présente.
- **AC5 :** La présence d’une charge structurelle reconnue doit être distinguée du montant qui la compose ; l’API ne doit pas assimiler implicitement « couverture structurelle » et « montant de paie ». → Réponse : `structural_coverage_available` (booléen) + `structural_charges_amount` / `structural_charges_breakdown` (base explicative) exposés séparément.
- **AC6 :** L’interface doit permettre d’identifier au moins la catégorie structurelle ayant déclenché la disponibilité (ex. paie). → Ligne « Charges structurelles constatées » avec montant + tooltip ou libellé indiquant la catégorie (ex. paie).

---

## 7. Risques et points d’attention

- **Sémantique (AC5) :** Ne jamais exposer un champ du type « couverture_structurelle_montant » qui assimilerait la couverture au montant de paie. Toujours distinguer `structural_coverage_available` (présence / disponibilité) et `structural_charges_amount` / `structural_charges_breakdown` (base explicative).
- **Période :** S’assurer que la période utilisée pour l’appel payroll (date_debut, date_fin) est la même que celle de la lecture trésorerie (ou définir une règle explicite si différente).
- **Company_id :** Aligner le filtrage company_id entre treasury et payroll (déjà supporté par le Vault payroll).
- **Performance :** Un appel payroll en plus par chargement de la card ; acceptable en général ; si besoin, Phase 3 (Vault) permet de regrouper dans un seul appel.
- **Rétrocompatibilité :** Les nouveaux champs sont additifs ; les clients existants qui n’utilisent que `couverture_salariale_mois` continuent de fonctionner. Conserver l’affichage du ratio « X mois » sous un libellé distinct pour ne pas casser les usages actuels.

---

*Document aligné sur MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE_v1.0 (AC1–AC6) et RAPPORT_VERIFICATION_COUVERTURE_STRUCTURELLE_PAIE_v1.0. AC5 et AC6 ont été ajoutés à la mini-spec pour verrouiller la distinction « couverture » / « montant » et l’identification de la catégorie structurelle (paie).*
