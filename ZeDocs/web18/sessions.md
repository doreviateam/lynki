# SPEC --- Dorevia POS Sessions (Linky)

**Version :** v1.0\
**Date :** 13/02/2026\
**Contexte :** Domaine POINT DE VENTE --- Dorevia Linky\
**Source unique :** `pos.session.closed` (Vault)

------------------------------------------------------------------------

# 1. Objectif

La vue **Sessions** permet de :

> Contrôler que les sessions POS sont fermées, cohérentes et sécurisées.

Cette vue n'est pas une vue de pilotage financier stratégique. Elle est
dédiée au **contrôle opérationnel et à la sécurisation des clôtures**.

------------------------------------------------------------------------

# 2. Architecture générale

## Flux événementiel

    Odoo (POS)
        → pos.session.closed
        → DVIG /ingest
        → Vault (StoreDocumentWithEvidence)
        → GET /ui/aggregations/pos-sessions
        → Linky (lecture seule)

Aucune autre source n'est autorisée.

------------------------------------------------------------------------

# 3. Route API Vault

## Endpoint

    GET /ui/aggregations/pos-sessions

## Paramètres

-   `tenant` (obligatoire)
-   `date_debut` (ISO8601)
-   `date_fin` (ISO8601)
-   `shop_id` (optionnel)

------------------------------------------------------------------------

# 4. Structure de réponse API

``` json
{
  "total_sessions": 18,
  "sealed_sessions": 17,
  "pending_sessions": 1,
  "items": [
    {
      "session_id": "POS/2026/0021",
      "shop_id": "Comptoir La Platine",
      "opened_at": "2026-02-12T08:00:00Z",
      "closed_at": "2026-02-12T18:02:00Z",
      "total_sales": 3248.50,
      "cash_total": 1250.00,
      "card_total": 1998.50,
      "difference": 0.00,
      "vault_status": "sealed"
    }
  ]
}
```

------------------------------------------------------------------------

# 5. Champs affichés dans Linky

## En-tête

-   Nombre total de sessions
-   Nombre de sessions scellées
-   Nombre de sessions en attente

Exemple :

    18 sessions
    ✓ 17 sécurisées
    ⏳ 1 en attente

------------------------------------------------------------------------

## Liste des sessions (tri décroissant par date de clôture)

Pour chaque session :

-   Date de clôture
-   Période (heure ouverture → fermeture)
-   Total des ventes
-   Écart de caisse
-   Statut Vault

------------------------------------------------------------------------

# 6. Statuts Vault

  vault_status   Affichage UI
  -------------- ---------------
  sealed         ✓ Scellée
  pending        ⏳ En attente
  failed         ⚠ Échec
  missing        ⚠ Non vaultée

------------------------------------------------------------------------

# 7. Règles UX

-   Tri : `closed_at DESC`
-   Pas de graphique
-   Pas d'agrégation secondaire
-   Pas de tickets détaillés en V1
-   Pas d'utilisateur affiché en V1
-   Vue strictement en lecture seule

------------------------------------------------------------------------

# 8. Gestion des écarts

Si `difference != 0` :

-   Affichage en rouge
-   Priorité visuelle
-   Pas de correction possible depuis Linky

------------------------------------------------------------------------

# 9. Positionnement dans le menu

    POINT DE VENTE
    → Points de vente
    → Sessions
    → Z de caisse (à venir)

Activation via :

    viewMode === "pos_sessions"

------------------------------------------------------------------------

# 10. Non-objectifs

-   Modification de session
-   Recalcul manuel
-   Lecture directe Odoo
-   Mélange avec paiements ou factures
-   Suppression d'événements

------------------------------------------------------------------------

# 11. Évolutions futures possibles (V2)

-   Filtre par point de vente
-   Lien vers détail session
-   Affichage responsable (caissier)
-   Nombre de tickets
-   Lien vers Z de caisse
-   Indicateur taux sécurisation global

------------------------------------------------------------------------

# 12. Résumé conceptuel

POS Domain =

    pos.session.closed
        → Aggregation pos-shops (vision stratégique)
        → Aggregation pos-sessions (vision contrôle)

Même source. Deux usages. Deux niveaux d'analyse. Architecture cohérente
et certifiable.

------------------------------------------------------------------------

*Document généré automatiquement --- Dorevia Vault / Linky.*
