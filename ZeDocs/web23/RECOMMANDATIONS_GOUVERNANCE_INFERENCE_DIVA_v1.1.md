# RECOMMANDATIONS — Gouvernance d'inférence DIVA (Cockpit vs Focus Card)

**Version :** v1.1  
**Date :** 2026-02-18  
**Référence :** SPEC_REGLES_INFERENCE_DIVA_v1.0.md  
**Objet :** Validation stratégique + recommandations d'implémentation

---

## 1. Synthèse

Le diagnostic est correct : les erreurs observées en Focus Card sont dues à un prompt cockpit appliqué sans distinction de mode.

Le payload est sain. La dérive est cognitive (structure du prompt), non technique.

La priorité est donc de corriger le cadre d'analyse, pas d'ajouter des rustines.

---

## 2. Validation des constats

### 2.1 Cause racine

✔ Confirmé : le prompt système et l'instruction utilisateur ne distinguent pas cockpit vs focus_card. Le modèle applique une logique transversale même lorsque le payload contient une seule carte.

### 2.2 Violations observées

Les erreurs sont conformes aux dérives attendues : projection de règles cockpit sur carte locale, mauvaise interprétation d'un montant négatif, extrapolation vers rapprochement bancaire, mention d'indicateurs absents du périmètre.

**Conclusion :** problème de gouvernance d'inférence.

---

## 3. Recommandations stratégiques

### 3.1 Priorité absolue — Prompt différencié (Phase 1)

Implémenter immédiatement :
- Section explicite "Mode Focus Card" dans le system prompt
- Instruction utilisateur spécifique selon le mode
- Exemple dédié Focus Card (ex. refunds)

**Objectif :** Cloisonner strictement le périmètre d'analyse.

### 3.2 Filtre post-Mistral (Phase ultérieure)

**Recommandation :** NE PAS implémenter immédiatement.

**Risque :** Rustine logique, faux positifs, masquage des erreurs de prompt.

Le filtre ne doit être envisagé qu'en cas d'échec du prompt différencié.

### 3.3 Extension prewarm Focus Card (Phase 2)

À considérer après stabilisation du prompt.

**Objectif :** Ouverture carte → insight instantané. Éviter génération tardive ou incohérente.

**Ordre recommandé :** 1. Prompt corrigé. 2. Tests manuels. 3. Extension prewarm.

---

## 4. Réponses aux questions ouvertes

| Question | Réponse |
|----------|---------|
| **Q1** Origine génération Focus Card ? | Probable : prewarm implicite, fallback async, ou génération manuelle. Runner actuel ne couvre pas refunds, taxes, credit_notes, pos_shops, pos_z. |
| **Q2** Étendre le prewarm ? | Oui, à moyen terme. 404 Focus Card → POST /diva/generate avec focus_card ciblé. |
| **Q3** Rapprochement + carte Cash ? | Cash ne mentionne le rapprochement que si le payload inclut explicitement un champ de validation. Sinon : interdiction. |
| **Q4** Test E2E conformité sémantique ? | Recommandé. Script : payload Focus Card → vérifier absence de termes interdits. Ex. mode refunds : trésorerie validée, rapprochement bancaire, déficit global, cycle POS, lecture globale. |
| **Q5** Ordre d'implémentation ? | Phase 1 : A) Prompt différencié uniquement. Phase 2 : C) Extension prewarm Focus Card. Phase 3 : B) Filtre post-Mistral uniquement si nécessaire. |

---

## 5. Vision à moyen terme

Une fois la discipline d'inférence stabilisée :
- Mécanisme de signalement utilisateur intégré
- Retour contextualisé (mode, carte, payload_hash)
- Log des erreurs d'inférence
- Versioning des corrections (prompt_version)

**Objectif :** Maturité IA orientée production.

---

## 6. Position stratégique

La gouvernance d'inférence est un prérequis indispensable avant :
- Activation avancée de DPL
- Automatisation décisionnelle
- Alertes stratégiques
- Montée en gamme tarifaire

DIVA doit devenir : prévisible, cloisonnée, explicable, auditée.

---

## 7. Conclusion

Le problème observé est structurel mais maîtrisable. La correction par différenciation stricte des modes constitue la réponse la plus propre et la plus robuste. La discipline d'inférence est désormais un axe stratégique du produit.
