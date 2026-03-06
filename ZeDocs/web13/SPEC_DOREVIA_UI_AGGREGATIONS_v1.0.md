
# SPEC_DOREVIA_UI_AGGREGATIONS_v1.0

## Objectif
Définir la première brique standard d’agrégation temporelle pour Dorevia-UI basée sur événements certifiés (Vault) et données opérationnelles (ERP/POS).

Cette spec servira à toutes les cards :
- Ventes certifiées
- Impayés
- Paiements
- Cash net
- POS
- Ratios & scoring

---

## Principes

- Source principale : événements vaultés (preuve certifiée)
- Données opérationnelles possibles : non vaultées (signalées comme indicatives)
- Toujours filtrable dans le temps
- Toujours groupable par granularité

---

## Filtres globaux

### Période

| Champ | Type | Description |
|------|------|-------------|
| date_debut | date | borne basse incluse |
| date_fin | date | borne haute incluse |

### Granularité

Valeurs autorisées :

- day
- week
- month

---

## Modèle logique d’agrégation

Pseudo-règle standard :

```
SELECT time_bucket(event_date, granularity) AS period,
       SUM(amount) AS total
FROM events
WHERE event_date BETWEEN date_debut AND date_fin
  AND event_type = <scope>
GROUP BY period
ORDER BY period
```

---

## Exemple scopes

### Ventes certifiées

event_type = invoice.posted

### Paiements certifiés

event_type = payment.captured

### POS (reporté à plus tard)

event_type = ticket.closed — hors périmètre v1 ; on verra le POS après.

---

## Rendu UI recommandé

### Card simple

💰 Ventes certifiées  
914 093,53 €  
📆 01/01/2026 → 06/02/2026  
✅ Données certifiées  

### Mini-graph optionnel

Groupement par :
- jour
- semaine
- mois

---

## Règles produit

- Toute valeur financière critique doit être issue d’événements vaultés
- Les données non vaultées doivent être visuellement différenciées
- Les ratios se basent prioritairement sur des bases certifiées

---

## Briques construites à partir de ce socle

- Total ventes
- Impayés
- Ratio d’impayés
- Cash brut
- Cash net
- Performance POS
- Scoring clients
- Géographie des ventes

---

## Version

v1.0 — socle temporel Dorevia-UI
