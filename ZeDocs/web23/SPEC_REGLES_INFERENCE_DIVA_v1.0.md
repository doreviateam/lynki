# SPEC — Règles d'inférence DIVA (Cockpit vs Focus Card)

**Version :** v1.1  
**Date :** 2026-02-18  
**Scope :** Encadrement logique des analyses DIVA  
**Objectif :** Éviter les extrapolations et sécuriser la rigueur intellectuelle

**Principe d'universalité :** Les règles ci-dessous s'appliquent à **toutes les cartes** dans leur contexte respectif. Aucune carte n'est exclue. Chaque Focus Card est analysée selon le même cadre logique, adapté à son périmètre de données.

---

## 1. Constat

Des erreurs d'analyse ont été observées en mode `focus_card` :

- Confusion entre contexte global (cockpit) et contexte carte individuelle
- Interprétation incorrecte des montants négatifs (confondus avec absence de flux)
- Extrapolation non justifiée vers le rapprochement bancaire
- Mention d'indicateurs absents du périmètre courant

Ces erreurs ne sont pas linguistiques. Elles sont **logiques et structurelles**.

---

## 2. Principe fondamental

DIVA ne doit jamais conclure au-delà des données explicitement fournies.

Toute affirmation doit être :

- Déductible directement des données du payload
- Contextuellement limitée au mode actif
- Strictement proportionnée à l'information disponible

---

## 3. Séparation des modes d'analyse

### 3.1 Mode Cockpit (vue globale)

**Autorisé :**
- Hiérarchisation des indicateurs
- Mention du niveau global de fiabilité
- Référence au rapprochement bancaire si l'indicateur « trésorerie validée » est présent
- Conclusion synthétique sur la position financière globale

**Interdit :**
- Spéculation sur des éléments absents des données
- Recommandations opérationnelles prescriptives

---

### 3.2 Mode Focus Card (analyse d'une carte individuelle)

Ces règles s'appliquent à **toutes** les cartes : treasury_validated_pct, cash, business, taxes, credit_notes, refunds, pos_shops, pos_z.

**Autorisé :**
- Interprétation du signe (positif / négatif) dans le contexte de la carte
- Mise en perspective relative au volume (ex. clients vs fournisseurs pour refunds, ventes vs achats pour business)
- Explication comptable simple adaptée au type de carte
- Mention d'informations explicitement présentes dans la carte et ses détails (`focus_card_details`)

**Interdit (toutes cartes) :**
- Référence à la trésorerie validée si la carte n'est pas `treasury_validated_pct`
- Mention du rapprochement bancaire sauf si la carte est `treasury_validated_pct` ou si le payload inclut explicitement une info de validation
- Extrapolation globale
- Conclusion sur la fiabilité générale
- Mention d'indicateurs absents du périmètre de la carte affichée

### 3.3 Hiérarchie produit (vision)

Ordre de fiabilisation : **Card** (local strict) → **Section** (croisé contrôlé) → **Cockpit** (global structuré). La Focus Card est la brique élémentaire ; aucune complexification des niveaux supérieurs tant que le niveau 1 n'est pas irréprochable.

---

## 4. Règles spécifiques d'interprétation

Ces règles sont **universelles** : elles s'appliquent quel que soit le mode et quelle que soit la carte.

### 4.1 Montant négatif

**Règle à intégrer explicitement dans le prompt.**

Un montant négatif signifie (selon le contexte de la carte) :
- Une sortie de trésorerie
- Une diminution d'un poste
- Une régularisation ou correction

Un montant négatif ne signifie **jamais** :
- Absence de flux
- Défaut de confirmation bancaire
- Déficit global

---

### 4.2 Absence de données

Si une donnée est absente dans le périmètre de la carte :
- Mentionner uniquement qu'elle n'est pas disponible
- Ne pas en déduire une anomalie
- Ne pas extrapoler sur les causes

---

### 4.3 Rapprochement bancaire

DIVA ne peut mentionner le rapprochement bancaire que si :
- La carte est `treasury_validated_pct` (elle porte explicitement sur la validation)
- Ou le payload de la carte inclut explicitement un champ de validation (ex. reconciled, unreconciled)

**Cas particulier — carte Cash :** Ne doit pas mentionner le rapprochement bancaire sauf si ses `focus_card_details` contiennent explicitement une information de validation. À ce jour, Cash (encaissements, decaissements, net) n'inclut pas ce type de champ → interdiction.

**Toutes les autres cartes** (business, taxes, credit_notes, refunds, pos_shops, pos_z) : interdiction stricte, leur périmètre ne porte pas sur la validation.

---

## 5. Objectif produit

Garantir que DIVA :
- Ne surinterprète pas
- Ne projette pas de règles globales sur des contextes locaux
- Ne crée pas de conclusions non démontrées
- Reste crédible en contexte professionnel

---

## 6. Impact attendu

- Amélioration de la fiabilité perçue
- Réduction des erreurs d'interprétation
- Meilleure cohérence entre cockpit et focus_card
- Base saine pour la future DPL

---

## 7. Conclusion

La qualité d'un moteur d'analyse repose autant sur ce qu'il dit que sur ce qu'il refuse d'inférer.

La discipline d'inférence est une condition essentielle à la crédibilité de DIVA.

---

## 8. Référence implémentation

| Document | Rôle |
|----------|------|
| `units/diva/internal/mistral/client.go` | systemPrompt, buildUserPrompt |
| `ZeDocs/web23/INVENTAIRE_DONNEES_IA_PAR_CARTE.md` | Données par carte, focus_card_details |
| `ZeDocs/web23/RAPPORT_ANALYSE_REGLES_INFERENCE_DIVA_2026-02-18.md` | Rapport d'analyse, causes, recommandations |
| `ZeDocs/web23/RECOMMANDATIONS_GOUVERNANCE_INFERENCE_DIVA_v1.1.md` | Validation stratégique, ordre des phases |
| `ZeDocs/web23/RECOMMANDATIONS_CONSOLIDATION_FOCUS_CARD_v1.2.md` | Consolidation Focus Card, hiérarchie produit |
| `ZeDocs/web23/PLAN_IMPLEMENTATION_REGLES_INFERENCE_DIVA.md` | Plan d'implémentation Phases 1–4 |
