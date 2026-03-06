# Recommandation produit — DIVA (Auto + Refresh)

**Version** : v1.0  
**Date** : 2026-02-17  
**Contexte** : Intégration DIVA dans Linky (lecture KPI assistée)

---

## 1. Décision stratégique

DIVA sera :

- ✅ **Déclenchée automatiquement** (après debounce 5 secondes)
- ➕ **Complétée par un bouton manuel** « Rafraîchir l'analyse »

Cette approche combine fluidité UX et maîtrise utilisateur.

---

## 2. Objectifs produit

### 2.1 Déclenchement automatique

Lorsque le contexte change : tenant, société, période (`date_start` / `date_end`), DIVA génère automatiquement une nouvelle synthèse après stabilisation des filtres (debounce 5 s).

**But** :
- Maintenir la cohérence cockpit
- Éviter à l'utilisateur d'avoir à « penser » à analyser
- Renforcer l'effet assistant intelligent

### 2.2 Bouton « Rafraîchir l'analyse »

Un bouton discret permet de relancer manuellement l'analyse.

**But** :
- Redonner le contrôle psychologique à l'utilisateur
- Permettre une relance en cas de doute
- Offrir un fallback naturel si erreur ou timeout

---

## 3. Comportement technique recommandé

### 3.1 Automatique

- Déclenchement après debounce 5 s
- Utilisation du cache `context_hash` si hit (TTL 5 min)
- Si cache hit → réponse instantanée
- Si cache miss → appel Mistral

### 3.2 Bouton Refresh

Le bouton doit :

- **Forcer un recalcul**
- **Ignorer le cache existant**
- Appeler DIVA avec option `force_refresh: true`

Sinon l'utilisateur pourrait percevoir que le bouton est inefficace.

---

## 4. UX recommandée

**Placement** : sous la grille KPI, aligné à droite du bloc DIVA

**Style** : bouton secondaire, icône ↻, texte discret « Rafraîchir l'analyse »

**Affichage recommandé** :

```
Lecture assistée par DIVA    [↻ Rafraîchir]
```

---

## 5. Gestion des erreurs

Si DIVA retourne 408 (timeout) ou 503 (Mistral indisponible) :

Afficher : « Lecture DIVA momentanément indisponible. »

Le bouton reste actif pour relancer l'analyse.

---

## 6. Bénéfices stratégiques

| Mode | Perception |
|------|------------|
| Automatique seul | Assistant passif |
| Manuel seul | Outil technique |
| **Automatique + Refresh** | **Assistant maîtrisé** |

Ce modèle est cohérent avec le positionnement Dorevia :
- Données financières scellées
- Lecture assistée
- Décision finale humaine

---

## 7. Conclusion

La combinaison Auto + Refresh est la solution la plus cohérente pour :

- UX CFO
- Robustesse technique
- Positionnement stratégique Dorevia
- Gestion de la perception IA

**Recommandation validée pour implémentation Sprint 3.**

---

## 8. Références

| Document | Lien |
|----------|------|
| Spec API | `SPEC_DIVA_API_v1.0.md` — `options.force_refresh` ajouté |
| Plan Scrum | `PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md` Sprint 3 (US-3.1, US-3.2) |
| INDEX | `INDEX.md` |

---

**Fin du document.**
