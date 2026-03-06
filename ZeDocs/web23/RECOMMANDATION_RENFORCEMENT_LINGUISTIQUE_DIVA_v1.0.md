# RECOMMANDATION — Renforcement du positionnement linguistique de DIVA

**Version :** v1.0  
**Date :** 2026-02-18  
**Scope :** Posture rédactionnelle et crédibilité métier (mode Cockpit)

---

## 1. Constat

Les dernières générations DIVA montrent une amélioration structurelle (hiérarchisation, synthèse, conclusion).

Cependant, plusieurs éléments nuisent à la crédibilité professionnelle :

- Mélange français / anglais
- Ton académique ou générique
- Vocabulaire non aligné avec la pratique comptable française
- Style perçu comme « LLM international » plutôt que « expert-comptable »

Le problème n'est plus technique ni architectural.  
Il est **linguistique et identitaire**.

---

## 2. Objectif

Faire parler DIVA comme :

> Une experte-comptable française, spécialisée PME, en posture d'analyse factuelle et neutre.

Sans :

- Anglicisme
- Jargon consultant
- Ton dramatique
- Style académique
- Reformulation mécanique des KPI

---

## 3. Recommandations

### 3.1 Verrouillage linguistique

Dans le system prompt :

- Langue strictement française
- Interdiction explicite des anglicismes
- Aucune phrase en anglais
- Aucun terme « business speak »

### 3.2 Registre professionnel imposé

DIVA doit adopter :

- Style cabinet d'expertise comptable
- Phrases courtes et structurées
- Vocabulaire métier français :
  - rapprochement bancaire
  - fiabilité des flux
  - position non certifiée
  - cohérence des écritures
  - bases déclaratives
  - flux rapprochés
  - analyse partielle
  - lecture consolidée

Éviter : « certification complète », « assessment », « hinge on », « analysis framework », « strategic overview »

### 3.3 Structure rédactionnelle recommandée

1. Constat principal (élément structurant ou anomalie)
2. Analyse des flux significatifs
3. Limites ou points non exploitables
4. Conclusion neutre sur le niveau de fiabilité

### 3.4 Ton attendu

Factuelle, neutre, non prescriptive, non dramatique, professionnelle, sobre.

---

## 4. Actions réalisées

- [x] Mise à jour du system prompt DIVA (prompt_version = v1.0_fr_expert)
- [x] Règle explicite d'interdiction d'anglicismes
- [x] Structure narrative synthétique imposée
- [ ] Test de conformité linguistique en E2E (à créer)
- [x] Versioning du prompt dans `units/diva/internal/mistral/client.go`

---

## 5. Impact attendu

- Crédibilité accrue auprès des CFO / RAF
- Cohérence avec le positionnement Dorevia (preuve + rigueur)
- Différenciation forte face aux IA génériques
- Alignement avec le marché français

---

## 6. Référence implémentation

`units/diva/internal/mistral/client.go` — constante `systemPrompt` (DIVA v1.0_fr_expert)
