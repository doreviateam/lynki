# SPEC --- Card 1 / 9 --- TRÉSORERIE (MVP Phase 1)

**Date :** 2026-03-03\
**Statut :** P0 implémentable\
**Principe :** Position, pas flux\
**Source unique de vérité :** Vault + ERP\
**Décisions produit :** 2026-03-03 (Q1–Q4)

------------------------------------------------------------------------

## 1️⃣ Objectif fonctionnel

Répondre en moins de 3 secondes à :

> "Où en est ma position réelle ?"

Sans : projection, estimation, règle métier implicite, données non scellées.

------------------------------------------------------------------------

## 2️⃣ Données utilisées (existantes)

| Métrique              | Source                                   | Disponibilité |
|-----------------------|------------------------------------------|---------------|
| `erp_balance`         | Odoo (proxy Vault)                       | ✅ (si config) |
| `validated_balance`   | Vault (bank reconciliation projection)   | ✅ |
| `reconciliation_rate` | Vault                                    | ✅ |

Aucune nouvelle dépendance.

------------------------------------------------------------------------

## 3️⃣ Structure UX MVP

### Card pleine largeur (au-dessus des autres cards)

**TRÉSORERIE**

- **💰 Solde comptable (ERP)** — Affichage dominant (si disponible)
- **🔐 Position validée (Vault)** — Montant confirmé par rapprochement bancaire
- **📊 Taux de rapprochement** — Pourcentage des flux confirmés

**Mention obligatoire :** "Au {date}" ou "Dernière mise à jour : {date}" — la position se lit au présent.

------------------------------------------------------------------------

## 4️⃣ Règles d'affichage

| Cas       | Condition                                      | Indicateur UI              |
|-----------|-------------------------------------------------|----------------------------|
| Normal    | `flags.large_delta === false` et taux ≥ 90 %    | Affichage neutre           |
| Vigilance | `flags.large_delta === true` OU 70 % ≤ taux < 90 % | "Écart à analyser"         |
| Tension   | taux < 70 %                                    | Badge "Validation partielle" |

Aucune alerte dramatique.

------------------------------------------------------------------------

## 5️⃣ Définitions métier (tooltip)

- **Solde comptable (ERP)** : solde banque issu de la comptabilité (ERP).
- **Position validée (Vault)** : montant confirmé par rapprochement bancaire.
- **Taux de rapprochement** : pourcentage des flux bancaires confirmés.

------------------------------------------------------------------------

## 6️⃣ API Backend

**Endpoint :** `GET /api/treasury` (existant, proxy vers Vault `/ui/aggregations/treasury`)

**Paramètres :** `tenant` (requis), `company_id` (optionnel)

**Note :** La carte Trésorerie affiche une **snapshot à date** — elle n'est pas influencée par `date_debut`/`date_fin`. L'appel peut transmettre ces paramètres pour compatibilité, mais l'UI affiche "Au {date}" (dernière mise à jour).

**Payload (extrait consommé) :**

```json
{
  "position": {
    "erp_balance": 72480.00,
    "validated_balance": 68920.00,
    "unvalidated_exposure": 3560.00
  },
  "reconciliation_rate": 94,
  "currency": "EUR",
  "flags": {
    "large_delta": false,
    "sign_mismatch": false,
    "structural_delta": false
  },
  "generated_at": "2026-03-03T12:00:00Z"
}
```

Aucune modification backend.

------------------------------------------------------------------------

## 7️⃣ Mode dégradé

Si `position.erp_balance === null` (tenant sans ERP bank reconciliation configuré) :

- Masquer **Solde comptable (ERP)**
- Afficher **Position validée (Vault)** et **Taux de rapprochement**
- Mention : "Solde comptable : non configuré"

------------------------------------------------------------------------

## 8️⃣ Placement UX

1. **TRÉSORERIE** (Position) — synthèse 3 chiffres + statut
2. **Paiements** (Process) — détail à traiter/traité, charts, exposition
3. **Cash** (Flux)
4. **Business**
5. **Taxes**

Règle : *"Position d'abord, explication ensuite."*

------------------------------------------------------------------------

## 9️⃣ Décisions produit (Q1–Q4)

| Question | Décision |
|----------|----------|
| **Q1 — Trésorerie vs Paiements** | Garder les deux. Trésorerie = synthèse ; Paiements = process détaillé. |
| **Q2 — Période** | Snapshot "à date", pas "sur période". Afficher "Au {date}" ou "Dernière mise à jour : …". *"La sécurité se lit au présent."* |
| **Q3 — Multi-société** | Supporter si backend agrège correctement (`company_id` vide). Sinon → forcer sélection société + message clair. *"Pas de chiffre global si on n'est pas certain."* |
| **Q4 — Polling** | Même fréquence que Paiements (10 min) + bouton "Rafraîchir" discret. *"Stable par défaut, contrôlable à la demande."* |

------------------------------------------------------------------------

## 🔟 Critères d'acceptation

- Données strictement issues de Vault + ERP
- Pas de projection
- Card pleine largeur
- Lecture en moins de 3 secondes
- Aucune dépendance bancaire externe
- Comportement défini en mode dégradé (`erp_balance` indisponible)
- Mention "Au {date}" / "Dernière mise à jour" visible
- Bouton Rafraîchir disponible

------------------------------------------------------------------------

**Fin du document --- SPEC MVP Trésorerie**
