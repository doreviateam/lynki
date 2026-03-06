# Vérification cohérence — DIVA v2 éditorial

**Date** : 2026-02-17  
**Périmètre** : SPEC, AVIS, PLAN, références croisées

---

## 1. Synthèse

| Aspect | Statut | Détail |
|--------|--------|--------|
| **Versions** | ✅ | SPEC v2.1, AVIS évalue v2.1, PLAN base v2.1 |
| **Portée** | ✅ | Forme éditoriale uniquement — JSON v1 conservé (SPEC §0, PLAN §0, AVIS §1) |
| **Truncate** | ✅ | Suppression complète côté backend — pas de limite code (SPEC §9, PLAN US-v2.2, AVIS §4.3) |
| **headline** | ✅ | Max 5 phrases, max 900 car. — contrôle prompt uniquement |
| **to_check** | ✅ | Factuel, non prescriptif ; vide si aucune piste (SPEC §3.2, PLAN, AVIS §4.5) |
| **Garde-fous** | ✅ | Anti-répétition, densité (SPEC §2, §8 ; PLAN US-v2.1) |
| **Cache awareness** | ✅ | force_refresh ou clear cache au déploiement (SPEC §11, PLAN US-v2.4, AVIS §7) |
| **UI** | ✅ | Paragraphe, séparateur, données compactes, badge (SPEC §7, PLAN US-v2.3, AVIS §4.6) |

---

## 2. Règles éditoriales — alignement

| Règle | SPEC | PLAN US-v2.1 | AVIS |
|-------|------|--------------|------|
| 3–5 phrases, max 900 car. | §2, §8 | ✅ | §4.3 |
| Pas de dates dans headline | §5 | ✅ | — |
| Anti-répétition structure | §2, §8 | ✅ | — |
| Ne pas commencer par le même indicateur | §2, §8 | ✅ | — |
| Densité (info nouvelle par phrase) | §2, §8 | ✅ | — |
| to_check vide si pas de piste | §3.2, §9 | ✅ | §4.5 |
| Données limitées (1–2 KPI) : 3 phrases courtes max | §2 | ✅ | — |
| Parsing JSON vérifié en recette | — | US-v2.4 | — |
| to_check factuel, non prescriptif | §3.2 | ✅ | §4.5 |
| what_i_see format « KPI : valeur », une ligne par KPI max | §2, §9 | ✅ | §4.4 |

---

## 3. Contraintes techniques — alignement

| Contrainte | SPEC | PLAN | Implémentation cible |
|------------|------|------|----------------------|
| Supprimer truncate | §9, §11 | US-v2.2 | `client.go` parseFlash |
| max_tokens 400 | §8 | US-v2.2 | Payload Mistral |
| Fallback JSON strict | §8 | §0 | `client.go` parseFlash |
| sanitizeHeadline (dates) | §9 | US-v2.2 | Conserver ; ne pas casser la ponctuation (virgule orpheline en début) |

---

## 4. Références croisées

| Document | Référence vers |
|----------|----------------|
| SPEC_DIVA_API_v1.0 | SPEC_DIVA_v2 (forme éditoriale) |
| ANNEXE_PROMPT | SPEC_DIVA_v2 (à adapter) |
| COHERENCE_WEB22 | Plan v2, Spec v2, Avis v2 |
| INDEX | Spec v2, Plan v2, Avis v2 |

---

## 5. Points de vigilance

1. **Confidence justification** : La spec §5 exemple montre « Niveau de confiance : moyen, en raison de données partielles ». Le champ JSON `confidence` reste enum. La justification pourrait être produite par le modèle dans le headline (dernière phrase) ou affichage dédié — à clarifier à l’implémentation.

2. **ANNEXE_PROMPT** : Contient encore le prompt v1.1. Sera remplacé par le prompt v2 lors de l’implémentation (US-v2.1). Référence correcte en place.

---

**Conclusion** : Ensemble cohérent. Prêt pour implémentation.
