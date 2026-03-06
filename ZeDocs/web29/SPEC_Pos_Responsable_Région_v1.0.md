# SPEC --- DOREVIA Linky --- Points de vente (Responsable Région)

**Version :** 1.1\
**Date :** 2026-02-22\
**Cible persona :** Responsable Région (Lee -- Maxi Zoo)\
**Produit :** Dorevia Linky\
**Périmètre :** Card "Points de vente"\
**Statut :** Implémenté (voir COMPTE_RENDU_Pos_Responsable_Region_v1.1_2026-02-22.md)

------------------------------------------------------------------------

# 1. OBJECTIF PRODUIT

La card **Points de vente** doit permettre à un Responsable Région de
répondre en moins de 3 secondes à la question :

> Mes magasins fonctionnent-ils normalement aujourd'hui ?

⚠ Cette version (v1.1) couvre **la supervision d'intégrité des sessions
POS uniquement**.\
La notion de "sessions attendues" (planning) est exclue de cette phase.

------------------------------------------------------------------------

# 2. PÉRIMÈTRE FONCTIONNEL (PHASE 1)

## 2.1 Ce que couvre la v1.1

-   Sessions remontées
-   Sessions scellées (Vault)
-   Sessions non scellées (pending / failed)
-   Volume € par magasin
-   Verdict global régional basé uniquement sur l'intégrité

## 2.2 Ce que NE couvre PAS la v1.1

-   Sessions attendues (planning ouverture)
-   Sessions métier "non remontées"
-   Détection d'absence de remontée via planning
-   Comparaison historique ou détection baisse anormale

------------------------------------------------------------------------

# 3. DÉFINITION DU PÉRIMÈTRE « RÉGION »

En v1.1 :

> Région = Tenant

La card agrège toutes les sessions POS du tenant courant.

Aucune notion technique de région distincte n'est implémentée dans cette
phase.

------------------------------------------------------------------------

# 4. GRANULARITÉ TEMPORELLE

La card est conçue pour une supervision **journalière**.

Comportement par défaut :
-   Période = date du jour (today)
-   Pas de YTD ou période large pour le persona Responsable Région

------------------------------------------------------------------------

# 5. STRUCTURE DE LA CARD

## 5.1 Bloc synthétique régional (toujours visible)

Affiché en haut de la card :

-   X magasins actifs
-   Y sessions remontées
-   Z sessions sécurisées
-   N sessions en attente (si > 0)

------------------------------------------------------------------------

## 5.2 Verdict global (Phase 1)

Le verdict est basé uniquement sur l'intégrité des sessions remontées.

`unsealed_sessions` = sessions avec `vault_status` ∈ {pending, failed, missing}

### Algorithme

    if unsealed_sessions > 0:
        status = "WARNING"
    else:
        status = "OK"

### Niveaux

  Niveau    Condition                          Affichage
  --------- ---------------------------------- --------------------------
  OK        100% sessions remontées scellées   Région opérationnelle (pill vert)
  WARNING   ≥1 session non scellée             Session à sécuriser (pill orange)

🔴 CRITICAL est réservé à la phase 2 (avec planning attendu).

Badge : pill `rounded-full`, couleurs douces (design system aligné autres cards).

------------------------------------------------------------------------

# 6. HIÉRARCHIE VISUELLE

Ordre obligatoire dans la card :

1.  Badge verdict (pill, couleurs douces, sans emoji)
2.  Bloc synthétique (magasins / sessions / scellées)
3.  Volume total : XX € (secondaire, avec libellé)
4.  Détail par magasin

L'intégrité passe avant le volume.

------------------------------------------------------------------------

# 7. BLOC DÉTAIL PAR MAGASIN

Pour chaque magasin :

### Bloc compact (toujours visible)

-   Nom du magasin
-   Volume €
-   X sessions
-   ✔ Y sécurisées
-   ⚠ N non scellées (si N > 0)

### Détail dépliable (bouton « Détail »)

-   X ticket(s) compté(s)
-   ✔ Y sécurisée(s)
-   ⚠ N non scellée(s) (si N > 0)
-   **Panier moyen : XX,XX €** (total_sales / total_sessions)
-   Liste des sessions (POS/xxx, montant, statut, plage horaire ouverture → clôture)

**Format des heures :** `HH:MM → HH:MM`. Si date invalide → « — ».

### Exemples

**Cas nominal** — Sweet Manihot, 1 544 €, 2 sessions, ✔ 2 sécurisées

**Cas anomalie** — Sweet Manihot, 1 544 €, 2 sessions, ⚠ 1 non scellée

------------------------------------------------------------------------

# 8. SÉMANTIQUE TECHNIQUE --- CLARIFICATION

Dans Vault / Linky :

`vault_status ∈ {sealed, pending, failed, missing}`

⚠ En v1.1 :

-   "missing" signifie session connue mais non vaultée.
-   La notion métier "session manquante" (planning non remonté) n'est
    PAS implémentée.

Ces deux notions sont distinctes.

------------------------------------------------------------------------

# 9. API ACTUELLE UTILISÉE

Source : `GET /ui/aggregations/pos-sessions`

Champs utilisés :

-   total_sessions
-   sealed_sessions
-   pending_sessions
-   items[]

Aucune extension backend requise pour v1.1.

------------------------------------------------------------------------

# 10. CRITÈRES D'ACCEPTATION

-   Verdict visible sans scroller
-   WARNING si ≥1 session non scellée
-   OK si toutes les sessions sont scellées
-   Aucun usage de `expected_sessions`
-   Aucun affichage de "session manquante" métier
-   Région = tenant documenté
-   Période par défaut = today

------------------------------------------------------------------------

# 11. PHASE 2 (NON INCLUSE V1.1)

Phase 2 introduira :

-   `expected_sessions`
-   `missing_sessions`
-   Niveau CRITICAL
-   Détection absence remontée magasin
-   Intégration planning ouverture

------------------------------------------------------------------------

# 12. POSITIONNEMENT STRATÉGIQUE

Business Card → Santé économique\
Points de vente → Santé opérationnelle\
Vault → Vérité scellée

La v1.1 garantit que la card POS n'affiche que des vérités prouvables
par les données existantes.

------------------------------------------------------------------------

# 13. DOCUMENTATION

-   Plan : `ZeDocs/web29/PLAN_IMPLEMENTATION_Pos_Responsable_Region_v1.1.md`
-   Compte rendu : `ZeDocs/web29/COMPTE_RENDU_Pos_Responsable_Region_v1.1_2026-02-22.md`

------------------------------------------------------------------------

*Fin du document*
