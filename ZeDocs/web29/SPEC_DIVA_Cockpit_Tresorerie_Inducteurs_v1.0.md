# SPEC --- DIVA Cockpit « Trésorerie + Inducteurs + Discipline » v1.1

**Date :** 2026-02-22\
**Produit :** Dorevia Linky + DIVA\
**Périmètre :** Génération d'insight cockpit (mode *Cockpit only*)\
**Type :** Évolution UX décisionnelle + contrat de contexte IA\
**Statut :** Proposition consolidée

------------------------------------------------------------------------

# 1. Objectif

DIVA doit produire un discours **Trésorerie-first**, tout en :

1.  Tenant compte des **principaux inducteurs** (2 à 4 max)\
2.  N'ignorant aucune card significative\
3.  Intégrant un **axe discipline structurelle**\
4.  Restant court, déterministe et audit-friendly

------------------------------------------------------------------------

# 2. Structure obligatoire de sortie

DIVA doit structurer l'analyse en **3 blocs visibles maximum** :

1.  **POINT DOMINANT** --- 1 phrase (finance + discipline si pertinent)\
2.  **INDUCTEURS** --- 2 à 4 puces maximum\
3.  **AUTRES CARTES** --- 1 ligne de statuts synthétiques

Règles : - Pas de storytelling - Pas de prescription ("faites ceci") -
Pas d'hypothèses non vérifiables

------------------------------------------------------------------------

# 3. Axe Discipline Structurelle (nouveau)

Certaines métriques reflètent la **discipline opérationnelle** plutôt
que les flux :

-   Trésorerie validée %
-   Lignes à rapprocher
-   Dernier relevé importé
-   Z de caisse
-   Données absentes ("---")

Si :

-   validation = 0 % malgré flux significatifs
-   ou métriques secondaires absentes
-   ou incohérence flux / validation

Alors DIVA doit mentionner explicitement un **signal de discipline**.

Exemples :

-   "Discipline bancaire absente malgré des flux opérationnels élevés."
-   "Validation bancaire complète."

------------------------------------------------------------------------

# 4. Sélection déterministe des inducteurs

## 4.1 Éligibilité

Une card est éligible si :

-   valeur != 0\
-   ou statut != OK\
-   ou donnée absente significative\
-   et différente de "Trésorerie validée"

## 4.2 Score heuristique

Base = `abs(value)` (si monétaire)

Multiplicateurs :

-   × 1.5 si WARNING / CRITIQUE\
-   × 1.2 Taxes\
-   × 1.2 AR / AP\
-   × 1.1 POS scellé\
-   × 0.8 valeur = 0 (pour couverture uniquement)

Conserver 2 à 4 inducteurs max.

------------------------------------------------------------------------

# 5. Règle spéciale POS

Si :

-   `pos.sales_total > 0`
-   et POS scellé (100 %)

Alors POS doit apparaître : - soit dans INDUCTEURS - soit dans AUTRES
CARTES avec "POS scellé ✓"

------------------------------------------------------------------------

# 6. Gestion des données absentes

Nouvelle section dans le contexte IA :

``` json
"data_completeness": {
  "bank_health_metrics": "absent" | "partial" | "complete"
}
```

Règle :

Si `bank_health_metrics = "absent"`\
→ DIVA doit l'indiquer clairement dans le discours (sans extrapolation).

------------------------------------------------------------------------

# 7. Contrat de contexte IA

Le payload envoyé à DIVA inclut :

``` json
{
  "treasury": { ... },
  "cards": [...],
  "top_inductors": [...],
  "other_cards_status": [...],
  "data_completeness": {
    "bank_health_metrics": "absent"
  }
}
```

------------------------------------------------------------------------

# 8. Critères d'acceptation

1.  POINT DOMINANT centré sur Trésorerie\
2.  Discipline mentionnée si incohérence flux / validation\
3.  2 à 4 inducteurs max\
4.  POS non ignoré si scellé et non nul\
5.  Aucune card significative ignorée\
6.  Longueur maîtrisée (≤ \~10 lignes visibles)

------------------------------------------------------------------------

# 9. Versioning

v1.0 --- Trésorerie + inducteurs\
v1.1 --- Ajout axe discipline + gestion données absentes

------------------------------------------------------------------------

*Fin du document*
