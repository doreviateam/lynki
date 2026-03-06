# SPEC_DOREVIA_UI_CARD_SALES_v1.0

## Contexte

Cette spec définit la **première card officielle Dorevia-UI** : *Ventes certifiées*. Elle s'appuie exclusivement sur des **événements vaultés** et constitue la base de tout le pilotage ultérieur (impayés, ratios, cash).

**Tenant cible** : sarl-la-platine

**Références** :
- SPEC_DOREVIA_UI_AGGREGATIONS_v1.0
- PHASE_0_DOREVIA_UI_PREREQUIS_v1.0

---

## 1. Objectif produit

Afficher, en temps réel : **le montant total des ventes certifiées**, filtrable par période et groupable par granularité.

Cette card doit :
- être lisible en 3 secondes
- inspirer confiance (preuve)
- ne montrer **aucun détail inutile**

---

## 2. Source de vérité

### Scope événement

| Élément    | Valeur            |
|------------|-------------------|
| event_type | `invoice.posted`   |
| odoo_model | `account.move`     |
| move_type  | `out_invoice`     |
| tenant     | `sarl-la-platine`  |

### Champs utilisés (Vault)

| Concept     | Champ         |
|-------------|---------------|
| Date métier | `invoice_date`|
| Montant     | `total_ttc`   |
| Devise      | `currency`    |
| Échelle     | `scale`       |

---

## 3. Filtres

### Période (obligatoire)

- `date_debut` (incluse)
- `date_fin` (incluse)

### Granularité (optionnelle)

Valeurs :
- `day`
- `week`
- `month`

Valeur par défaut : `month`

---

## 4. Règle de calcul

### Total global

```
total_ventes = SUM(total_ttc)
WHERE invoice_date BETWEEN date_debut AND date_fin
```

### Agrégation temporelle (si demandée)

```
GROUP BY time_bucket(invoice_date, granularity)
```

---

## 5. API Dorevia-UI (read-only)

### Endpoint

```
GET /ui/aggregations/sales
```

### Paramètres

| Nom          | Type  | Obligatoire |
|--------------|-------|-------------|
| date_debut   | date  | oui         |
| date_fin     | date  | oui         |
| granularity  | enum  | non         |

### Réponse (exemple)

```json
{
  "tenant": "sarl-la-platine",
  "scope": "invoice.posted",
  "currency": "EUR",
  "total": 914093.53,
  "from": "2026-01-01",
  "to": "2026-02-06",
  "granularity": "month",
  "series": [
    { "period": "2026-01", "amount": 612340.22 },
    { "period": "2026-02", "amount": 301753.31 }
  ],
  "last_seal_at": "2026-02-06T21:18:00Z",
  "verifiable": true
}
```

---

## 6. Rendu UI (Appsmith)

### Card principale

```
💰 Ventes certifiées
914 093,53 €

📆 Janvier → Février 2026
✅ Données certifiées
Dernier scellement : il y a 3 min
```

### Interactions

- Sélecteur période (date_debut / date_fin)
- Sélecteur granularité (Jour / Semaine / Mois)
- Rafraîchissement automatique ou manuel

---

## 7. Règles produit

- Les **factures brouillons** sont exclues
- Les **factures annulées** sont exclues
- Toute valeur affichée est **traçable à un événement Vault**
- Aucun calcul n'est fait côté Appsmith

---

## 8. Definition of Done

- [ ] Endpoint `/ui/aggregations/sales` opérationnel
- [ ] Appsmith affiche la card sans erreur
- [ ] Les filtres période fonctionnent
- [ ] La granularité modifie l'agrégation
- [ ] Le badge "Données certifiées" est visible

---

## 9. Suite logique

Après validation de cette card :
- Card Impayés certifiés
- Ratio d'impayés
- Paiements certifiés
- Cash brut
- Cash net

---

Version : v1.0
