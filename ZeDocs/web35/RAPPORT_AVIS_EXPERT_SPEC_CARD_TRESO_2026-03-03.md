# Rapport d'avis d'expert — SPEC_CARD_TRESO

**Date :** 2026-03-03  
**Document analysé :** `SPEC_CARD_TRESO.md`  
**Base :** Existant Vault, Linky, TreasuryCard

---

## 1. Synthèse

La SPEC est **implémentable en l'état** et alignée avec l'existant. Les données requises sont déjà exposées par le Vault (`/ui/aggregations/treasury`). Quelques amendements et clarifications sont proposés pour garantir la cohérence avec la stack actuelle et couvrir les cas dégradés.

---

## 2. Analyse par section

### 2.1 §1 Objectif fonctionnel — ✅ Conforme

Le principe « Position, pas flux » et l'absence de projection/estimation sont cohérents avec la stack Dorevia (données scellées).

### 2.2 §2 Données utilisées — ✅ Conforme avec précision

| Métrique SPEC | Source existante | Emplacement |
|---------------|------------------|-------------|
| `erp_balance` | Odoo (proxy Vault) | `position.erp_balance` |
| `validated_balance` | Vault (projection RECONCIL) | `position.validated_balance` |
| `reconciliation_rate` | Vault | `process.reliability_volume` ou `reconciliation_rate` (legacy) |

**Précision :** `erp_balance` n'est disponible que si `ODOO_BANK_RECONCILIATION_URL` (ou `ODOO_BANK_RECONCILIATION_URL_LAPLATINE2026`) est configuré pour le tenant. Sinon, `erp_balance = null` (mode dégradé).

### 2.3 §3 Structure UX — ✅ Conforme

La structure proposée (Solde comptable, Position validée, Taux de rapprochement) correspond aux données disponibles.

### 2.4 §4 Règles d'affichage — ⚠️ À aligner avec l'existant

La SPEC définit :
- **Cas vigilance :** Écart ERP vs Validated > 5 %
- **Cas tension :** Taux < 70 %

L'existant Vault utilise déjà :
- `flags.large_delta` : `|erp - validated| > MAX(500, 0.05 × |erp|)` — aligné avec « > 5 % » pour les soldes significatifs
- Pas de seuil 70 % côté backend ; à gérer côté UI

**Amendement proposé :** Documenter que les seuils 5 % et 70 % sont des règles UI ; le backend expose `flags.large_delta` et `reconciliation_rate` (ou `reliability_volume`).

### 2.5 §5 Définitions métier — ✅ Conforme

Les tooltips sont clairs. Suggestion : ajouter « (comptabilité Odoo) » pour Solde comptable afin de distinguer du solde bancaire réel.

### 2.6 §6 API Backend — ⚠️ Amendements

**Problème 1 — Endpoint :** La SPEC propose `GET /api/v1/treasury/position`. L'existant est :
- Vault : `GET /ui/aggregations/treasury`
- Linky : `GET /api/treasury` (proxy vers Vault)

**Amendement :** Ne pas créer de nouvel endpoint. Utiliser l'existant `/api/treasury` (Linky) → `/ui/aggregations/treasury` (Vault). La nouvelle carte Trésorerie consommera le même flux ; le payload actuel contient déjà `position.erp_balance`, `position.validated_balance`, `reconciliation_rate`.

**Problème 2 — Paramètres :** La SPEC ne mentionne pas `tenant`, `company_id`, `date_debut`, `date_fin`. Ces paramètres sont requis par l'endpoint existant.

**Amendement :** Documenter les paramètres de requête :
```
GET /api/treasury?tenant={tenant}&company_id={id}&date_debut={YYYY-MM-DD}&date_fin={YYYY-MM-DD}
```

**Problème 3 — Payload :** La SPEC propose un payload simplifié. L'existant retourne une structure plus riche (`position`, `process`, `flags`, `currency`, etc.).

**Amendement :** Conserver le payload existant. La carte Trésorerie (position) utilisera uniquement :
- `position.erp_balance`
- `position.validated_balance`
- `reconciliation_rate` (ou `process.reliability_volume` × 100)
- `currency`
- `flags` (pour vigilance/tension)

### 2.7 §7 Placement UX — ✅ Conforme

L'ordre 1) Trésorerie 2) Paiements 3) Cash 4) Business 5) Taxes est cohérent. L'existant affiche actuellement Paiements puis Cash ; la nouvelle carte Trésorerie s'insère en tête.

### 2.8 §8 Critères d'acceptation — ✅ Conformes

Les critères sont réalistes. À ajouter : « Comportement défini en mode dégradé (erp_balance indisponible) ».

---

## 3. Amendements proposés (à intégrer dans la SPEC)

### 3.1 §6 API Backend — Version amendée

```
Endpoint : GET /api/treasury (existant, proxy vers Vault /ui/aggregations/treasury)

Paramètres : tenant (requis), company_id (optionnel), date_debut, date_fin

Payload (extrait consommé par la carte Trésorerie) :
{
  "position": {
    "erp_balance": 72480.00,
    "validated_balance": 68920.00,
    "unvalidated_exposure": 3560.00,
    "reliability_position": 0.95
  },
  "reconciliation_rate": 94,
  "currency": "EUR",
  "flags": {
    "sign_mismatch": false,
    "large_delta": false,
    "structural_delta": false
  }
}
```

Aucune modification backend. Nouveau composant Linky consommant ce flux.

### 3.2 Mode dégradé

Quand `erp_balance` est `null` (tenant sans Odoo bank reconciliation configuré) :
- Afficher uniquement **Position validée (Vault)** et **Taux de rapprochement**
- Masquer ou désactiver **Solde comptable (ERP)** avec mention « Non disponible (configuration Odoo) »

### 3.3 Règles d'affichage — Précision

| Cas | Condition | Indicateur UI |
|-----|-----------|---------------|
| Normal | `flags.large_delta === false` et taux ≥ 90 % | Affichage neutre |
| Vigilance | `flags.large_delta === true` OU 70 % ≤ taux < 90 % | « Écart à analyser » |
| Tension | taux < 70 % | Badge « Validation partielle » |

---

## 4. Décisions produit (2026-03-03)

Les questions Q1–Q4 ont été tranchées. Voir `SPEC_CARD_TRESO.md` §9.

| Question | Décision |
|----------|----------|
| Q1 — Trésorerie vs Paiements | Garder les deux. Position d'abord, explication ensuite. |
| Q2 — Période | Snapshot "à date". Afficher "Au {date}" ou "Dernière mise à jour". |
| Q3 — Multi-société | Supporter si backend agrège ; sinon forcer sélection société. |
| Q4 — Polling | 10 min + bouton Rafraîchir. |

---

## 5. Plan d'implémentation suggéré

1. **Créer** `TresoreriePositionCard.tsx` (nouvelle carte pleine largeur)
2. **Consommer** `/api/treasury` (existant)
3. **Insérer** en tête dans `DashboardWithFilters.tsx` (avant TreasuryCard)
4. **Gérer** mode dégradé (`erp_balance === null`)
5. **Appliquer** règles vigilance/tension selon §4
6. **Afficher** "Au {date}" ou "Dernière mise à jour" (snapshot)
7. **Ajouter** bouton Rafraîchir discret (polling 10 min)
8. **Tester** avec tenant configuré et tenant non configuré

Aucune modification Vault ni `/api/treasury` requise.

---

## 6. Conclusion

La SPEC est **solide et implémentable**. Les amendements ont été intégrés et les décisions produit (Q1–Q4) sont documentées dans la SPEC §9. La SPEC est prête pour le développement.

---

**Fin du rapport — Avis d'expert**
