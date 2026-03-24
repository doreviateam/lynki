# RAPPORT DE VÉRIFICATION — Couverture structurelle (Card Trésorerie)

**Date :** 15 mars 2026  
**Référence :** MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE_v1.0  
**Périmètre :** Card Trésorerie, moteur de calcul, Diva (Linky + Vault)

---

## 1. Synthèse

| Critère | Statut | Commentaire |
|--------|--------|-------------|
| AC1 — OD paie → couverture structurelle > 0 | ❌ Non conforme | La couverture affichée dépend de la position validée, pas des OD paie |
| AC2 — Indépendance du paiement bancaire | ❌ Non conforme | `couverture_salariale_mois` = position validée / masse salariale → liée au rapprochement |
| AC3 — Couverture probante inchangée | ✅ Conforme | Probante et « couverture en mois » sont des métriques distinctes |
| AC4 — Pas « Non disponible » si charge structurelle | ❌ Non conforme | Si pas de position validée ou masse salariale non configurée → « Non disponible » |

**Conclusion :** Le code actuel **ne respecte pas** la règle métier de la mini-spec. L’indicateur nommé « Couverture structurelle » en UI est en réalité un **ratio en mois** (position validée ÷ masse salariale), calculé côté Linky, et **non** une couverture par charges structurelles constatées (dont OD paie), indépendante du cash.

---

## 2. Vérification détaillée

### 2.1 Sémantique actuelle de « Couverture structurelle » en UI

- **Fichier :** `units/dorevia-linky/components/TresoreriePositionCard.tsx`
- **Libellé affiché :** « Couverture structurelle » (ligne 211).
- **Valeur affichée :** `couverture_salariale_mois` (lignes 107–116, 123–126) :
  - Si défini et fini : `X,XX mois`
  - Sinon : **« Non disponible »**

- **Fichier :** `units/dorevia-linky/app/api/treasury/route.ts` (lignes 215–222)
  - `couverture_salariale_mois` = `validated_balance / MASSE_SALARIALE_MENSUELLE_EUR` (si masse salariale > 0 et `validated_balance` fini).
  - Sinon : `null`.

Donc aujourd’hui :
- La « couverture structurelle » affichée = **nombre de mois de trésorerie** (position validée / masse salariale).
- Elle **dépend** de la position validée (elle-même issue du rapprochement bancaire / projection Vault).
- Elle **ne s’appuie pas** sur les OD de salaire ni sur d’autres charges structurelles constatées.

→ **Écart par rapport à la spec :** la spec définit la couverture structurelle comme « part de la trésorerie explicable par des charges structurelles **constatées** (dont OD paie) », **indépendante** du paiement bancaire. Le code ne calcule pas cette notion.

### 2.2 Critères d’acceptation

**AC1 — Si une OD de salaire qualifiée existe sur la période, la couverture structurelle doit être supérieure à zéro.**

- **Constat :** Le calcul actuel n’utilise pas les OD paie. Il utilise uniquement `validated_balance` et `MASSE_SALARIALE_MENSUELLE_EUR`. En présence d’OD paie mais sans position validée (ou masse salariale non configurée), la valeur reste `null` ou 0.
- **Statut :** ❌ **Non conforme.**

**AC2 — La couverture structurelle ne doit pas dépendre de la présence d’un paiement bancaire rapproché.**

- **Constat :** `couverture_salariale_mois` est dérivée de `validated_balance`, elle-même issue de la projection de rapprochement / données bancaires. Donc la métrique dépend directement du rapprochement.
- **Statut :** ❌ **Non conforme.**

**AC3 — La couverture probante peut rester inchangée même si la couverture structurelle augmente.**

- **Constat :** Couverture probante (taux rapproché) et « couverture en mois » sont des champs distincts ; l’une peut varier sans l’autre. Aucun couplage bloquant.
- **Statut :** ✅ **Conforme.**

**AC4 — L’interface ne doit pas afficher « Non disponible » pour la couverture structurelle lorsqu’au moins une charge structurelle reconnue est présente.**

- **Constat :** Dès que `couverture_salariale_mois` est `null` (pas de masse salariale configurée ou pas de position validée), l’UI affiche « Non disponible », même si des OD paie existent (données disponibles via `GET /ui/aggregations/payroll`).
- **Statut :** ❌ **Non conforme.**

### 2.3 Vault — Données disponibles

- **Treasury :** `sources/vault/internal/handlers/aggregations_treasury.go`  
  - Expose position (validated_balance, erp_balance, unvalidated_exposure), process (reconciled/unreconciled), flags, reconciliation_metrics.  
  - **N’expose pas** de métrique « couverture structurelle » ni de montant de charges structurelles (OD paie, etc.).

- **Payroll :** `sources/vault/internal/handlers/aggregations_payroll.go` + table `payroll_od_lines`  
  - Expose `total_charges`, `payroll_source` (payslip | od | none), `breakdown` (641/645) pour la période.  
  - Les **OD paie sont déjà agrégées** par le Vault pour EBE ; réutilisables pour alimenter la couverture structurelle.

- **Conclusion :** Les données nécessaires (OD paie sur la période) existent côté Vault (payroll) mais ne sont **pas** utilisées pour la card Trésorerie ni pour un indicateur de couverture structurelle.

### 2.4 Diva / dashboard-metrics

- **Fichier :** `units/dorevia-linky/app/api/dashboard-metrics/route.ts`  
  - Utilise la trésorerie (position, reste à rapprocher) pour le statut de la tuile Trésorerie et la narration.  
  - Aucune référence à une « couverture structurelle » au sens de la spec (charges structurelles constatées).  
- **Fichier :** `units/dorevia-linky/app/lib/metric-engine/`  
  - Métriques `treasury_balance`, `treasury_validated_pct` ; pas de métrique dédiée couverture structurelle.

→ **Diva :** pas d’écart bloquant par rapport à la spec, mais la **narration** ne peut pas encore indiquer « partiellement expliquée par des charges structurelles constatées (paie) » tant que la couverture structurelle n’est pas calculée et exposée.

---

## 3. Tableau de conformité

| Exigence | Composant | Conforme |
|----------|-----------|----------|
| Couverture structurelle = explicabilité par charges structurelles (dont OD paie) | Backend (Vault + Linky API) | ❌ |
| OD paie contribuent dès constat, sans condition de paiement bancaire | Backend | ❌ |
| AC1 — OD paie → couverture structurelle > 0 | Calcul + UI | ❌ |
| AC2 — Indépendance du rapprochement bancaire | Calcul | ❌ |
| AC3 — Probante indépendante de la structurelle | Calcul | ✅ |
| AC4 — Pas « Non disponible » si charge structurelle présente | UI (TresoreriePositionCard) | ❌ |
| Narration Diva (explicabilité structurelle / paie) | dashboard-metrics / Diva | ⚪ Non implémenté (hors scope actuel) |

---

## 4. Recommandation

Mettre en œuvre le **plan d’implémentation** (voir `PLAN_IMPLEMENTATION_COUVERTURE_STRUCTURELLE_PAIE_v1.0.md`) pour :

1. Introduire une **métrique « couverture structurelle »** au sens de la spec (alimentée par OD paie et, à terme, autres charges structurelles), distincte du ratio « position validée / masse salariale ».
2. Adapter le **backend** (Vault et/ou Linky) pour exposer et calculer cette métrique.
3. Adapter l’**UI** (card Trésorerie) pour afficher cette couverture structurelle et respecter AC1, AC2 et AC4.
4. Optionnel : conserver le ratio « X mois » sous un libellé explicite (ex. « Trésorerie en mois (position validée / masse salariale) ») pour ne pas perdre l’info actuelle.

---

*Document généré pour alignement avec MINI_SPEC_COUVERTURE_STRUCTURELLE_PAIE_v1.0.*
