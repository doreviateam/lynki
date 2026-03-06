# RECOMMANDATIONS — Consolidation Focus Card (Suite au Rapport d'analyse v1.0)

**Version :** v1.2  
**Date :** 2026-02-18  
**Référence :** Rapport d'analyse — Règles d'inférence DIVA (Cockpit vs Focus Card)  
**Objectif :** Valider la stratégie et préciser l'ordre d'implémentation

---

## 1. Validation du diagnostic

Le rapport identifie correctement :
- La cause racine : prompt cockpit appliqué au mode card
- L'absence de règles spécifiques au Focus Card
- La confusion entre flux négatif et déficit de position
- L'extrapolation hors périmètre

Le payload est sain. Le problème est strictement cognitif (cadre d'analyse), non technique.

---

## 2. Décision stratégique confirmée

Consolider la Focus Card avant :
- toute extension Section
- toute complexification Cockpit
- toute DPL avancée

La Focus Card devient la **brique élémentaire de fiabilité**.

---

## 3. Ordre d'implémentation validé

### Phase 1 — Prompt différencié (obligatoire)

**Actions :**
1. Ajouter section explicite `Mode Focus Card` dans le system prompt
2. Adapter l'instruction utilisateur selon le mode
3. Ajouter un exemple spécifique à la carte `refunds`
4. Intégrer règles §4.1, §4.2, §4.3 dans le prompt
5. Tests manuels stricts

⚠️ Aucun filtre lexical à ce stade.

**Objectif :** Corriger la racine sans rustine.

### Phase 2 — Extension prewarm Focus Card

Après validation stabilité :
- 404 Focus Card → POST /diva/generate ciblé
- Éviter génération implicite ou incohérente

**Condition :** Comprendre précisément le chemin actuel de génération.

### Phase 3 — Filtre post-Mistral (uniquement si nécessaire)

À éviter en première intention. Risque : masquer erreurs, faux positifs, complexification.

Le filtre doit rester une **sécurité ultime**, pas une correction principale.

---

## 4. Recommandation additionnelle — Tests sémantiques

Test E2E minimal : pour chaque carte Focus Card → générer insight → vérifier absence termes interdits et indicateurs hors périmètre.

**Exemple refunds — interdits :** trésorerie validée, rapprochement bancaire, lecture globale, cycle POS, flux d'affaires.

---

## 5. Clarifications stratégiques

### 5.1 Mention rapprochement bancaire

Autorisé uniquement si : carte = treasury_validated_pct OU payload inclut explicitement validation. Cash ne doit pas mentionner rapprochement sans détail explicite.

### 5.2 Montant négatif

- = sortie ou régularisation
- ≠ déficit global
- ≠ absence de flux
- ≠ défaut de confirmation bancaire

Cette règle doit être gravée dans le prompt.

---

## 6. Gouvernance IA (Vision)

Après stabilisation Focus Card : signalement utilisateur, versioning `prompt_version`, conservation `payload_hash` + `model_version`. Objectif : infrastructure explicable et auditable.

---

## 7. Position produit

Hiérarchie d'intelligence cible :

1. **Card** (local strict)
2. **Section** (croisé contrôlé)
3. **Cockpit** (global structuré)

Uniquement après fiabilisation du niveau 1.

---

## 8. Conclusion

Stratégie : 1. Corriger le prompt. 2. Tester. 3. Stabiliser. 4. Étendre progressivement. Aucune complexification tant que la brique élémentaire n'est pas irréprochable.
