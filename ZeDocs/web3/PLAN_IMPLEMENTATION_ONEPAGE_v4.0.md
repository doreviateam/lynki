# 🎯 Plan d'Implémentation — Refonte One-Page v4.0

**Date** : 18 janvier 2026  
**Base** : `SPEC_REFONTE_ONEPAGE_v4.0.md` + `ANALYSE_ECARTS_ONEPAGE_v4.0.md`  
**Durée estimée** : 1 sprint (1 semaine)  
**Équipe** : Dev frontend / Web

---

## 📋 Vue d'Ensemble

### Objectif

Refondre complètement la homepage en **one-page** selon la spécification v4.0, inspirée de Speeral.io, pour :
- Faire comprendre en moins de 5 secondes
- Créer un flow clair et linéaire
- Éviter tout jargon inutile
- Orienter vers l'action (contact)

### Définition de "Fait" (DoD)

La one-page v4.0 est terminée si :
- ✅ 10 sections implémentées dans l'ordre de la spec
- ✅ HERO refondu selon spec v4.0
- ✅ Sections manquantes créées (PROBLÈME RÉEL, QUI SOMMES‑NOUS)
- ✅ Sections existantes adaptées
- ✅ Ton éditorial respecté (clair, rassurant, business, pas jargon)
- ✅ Responsive (mobile, tablette, desktop)
- ✅ Analytics tracking maintenu
- ✅ SEO préservé
- ✅ Performance maintenue (Lighthouse ≥ 90)

**Statut** : ⏳ **À démarrer**

---

## 🏃 Structure Scrum

### Sprint

- **Sprint 1** : Refonte complète one-page v4.0 (1 semaine) — 18 points

**Total** : 1 semaine — 18 points

---

## 📦 Sprint 1 : Refonte One-Page v4.0 (1 semaine)

**Objectif** : Implémenter les 10 sections de la one-page selon la spécification v4.0

**Dates** : 2026-01-18 → 2026-01-25  
**Points** : 18 points

---

### User Stories

#### US-1.1 : Refondre HERO

**En tant que** visiteur de la homepage  
**Je veux** voir un message clair et simple dès l'arrivée  
**Afin de** comprendre immédiatement ce que propose Dorevia-Vault

**Points** : 5

**Critères d'acceptation** :
- [ ] H1 remplacé : "La plateforme qui produit des preuves fiables pour vos factures"
- [ ] Sous-titre remplacé : "Pour les entrepreneurs qui veulent être en règle sans se compliquer la vie."
- [ ] Texte d'appui remplacé : "Dorevia‑Vault sécurise automatiquement vos opérations financières et génère des preuves vérifiables en cas de contrôle."
- [ ] CTA remplacés : "Voir comment ça marche" et "Me contacter"
- [ ] Badge : "🇫🇷 Infrastructure souveraine française"
- [ ] Responsive maintenu
- [ ] Analytics tracking préservé

**Tâches techniques** :
- [ ] Modifier `templates/home/index.html.twig` (section Hero)
- [ ] Tester responsive
- [ ] Vérifier analytics tracking

**Livrables** :
- ✅ HERO refondu dans `templates/home/index.html.twig`

---

#### US-1.2 : Adapter CONTEXTE — Pourquoi maintenant

**En tant que** visiteur de la homepage  
**Je veux** comprendre l'urgence et l'enjeu réglementaire  
**Afin de** saisir pourquoi agir maintenant

**Points** : 2

**Critères d'acceptation** :
- [ ] Section existante adaptée
- [ ] Texte conforme à la spec v4.0
- [ ] Chiffre "10 milliards d'euros" mis en avant
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Modifier section "Pourquoi Maintenant" existante
- [ ] Ajouter chiffre "10 milliards d'euros" en évidence
- [ ] Tester responsive

**Livrables** :
- ✅ Section "CONTEXTE" adaptée dans `templates/home/index.html.twig`

---

#### US-1.3 : Créer PROBLÈME RÉEL

**En tant que** visiteur de la homepage  
**Je veux** comprendre le problème réel que résout Dorevia-Vault  
**Afin de** m'identifier et comprendre la nécessité

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée après CONTEXTE
- [ ] Texte conforme : "Les entrepreneurs honnêtes n'ont pas besoin de plus de complexité. Ils ont besoin de : preuves fiables, documents traçables, historique vérifiable, sécurité dans le temps"
- [ ] Design épuré, centré, lisible
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Ajouter styles CSS
- [ ] Tester responsive
- [ ] Ajouter tracking analytics

**Livrables** :
- ✅ Section "PROBLÈME RÉEL" dans `templates/home/index.html.twig`

---

#### US-1.4 : Adapter SOLUTION

**En tant que** visiteur de la homepage  
**Je veux** comprendre la solution proposée  
**Afin de** voir comment Dorevia-Vault répond au problème

**Points** : 2

**Critères d'acceptation** :
- [ ] Section existante (Bloc Vision) adaptée
- [ ] Texte conforme : "Dorevia‑Vault est une plateforme qui transforme vos factures en preuves opposables. automatique, sans changer vos outils, sans formation complexe, sans jargon technique"
- [ ] Design épuré, centré, lisible
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Modifier section "Bloc Vision" existante
- [ ] Adapter texte selon spec v4.0
- [ ] Tester responsive

**Livrables** :
- ✅ Section "SOLUTION" adaptée dans `templates/home/index.html.twig`

---

#### US-1.5 : Adapter COMMENT ÇA MARCHE

**En tant que** visiteur de la homepage  
**Je veux** voir le processus simplifié avec numérotation  
**Afin de** comprendre le flux en un coup d'œil

**Points** : 1

**Critères d'acceptation** :
- [ ] Section existante modifiée
- [ ] Format avec numérotation (1) 2) 3)) au lieu de flèches
- [ ] Design conservé
- [ ] Responsive

**Tâches techniques** :
- [ ] Modifier section "Comment ça marche" existante
- [ ] Remplacer flèches par numérotation
- [ ] Vérifier responsive

**Livrables** :
- ✅ Section "COMMENT ÇA MARCHE" adaptée dans `templates/home/index.html.twig`

---

#### US-1.6 : Adapter BÉNÉFICES MÉTIER

**En tant que** visiteur de la homepage  
**Je veux** voir les 4 bénéfices métier (incluant Conformité)  
**Afin de** évaluer la valeur pour mon activité

**Points** : 2

**Critères d'acceptation** :
- [ ] Section existante modifiée
- [ ] 4 bénéfices : Sérénité, Crédibilité, Simplicité, **Conformité** (nouveau)
- [ ] Design conservé (cartes avec icônes)
- [ ] Responsive

**Tâches techniques** :
- [ ] Modifier section "Bénéfices" existante
- [ ] Ajouter bénéfice "Conformité"
- [ ] Vérifier responsive

**Livrables** :
- ✅ Section "BÉNÉFICES MÉTIER" adaptée dans `templates/home/index.html.twig`

---

#### US-1.7 : Créer QUI SOMMES‑NOUS

**En tant que** visiteur de la homepage  
**Je veux** savoir qui est derrière Dorevia-Vault  
**Afin de** créer un lien humain et comprendre l'ancrage terrain

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée (avant CTA final)
- [ ] Texte conforme : "Basé à Nantes, ancré sur les réalités du terrain. Une approche simple, sans bullshit marketing, orientée métier."
- [ ] Design épuré, centré, lisible
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Ajouter styles CSS
- [ ] Tester responsive
- [ ] Ajouter tracking analytics

**Livrables** :
- ✅ Section "QUI SOMMES‑NOUS" dans `templates/home/index.html.twig`

---

#### US-1.8 : Adapter CTA FINAL

**En tant que** visiteur de la homepage  
**Je veux** voir un appel à l'action final clair  
**Afin de** passer à l'action (démo ou contact)

**Points** : 1

**Critères d'acceptation** :
- [ ] Section existante modifiée
- [ ] Texte : "Vous voulez voir comment ça fonctionne pour vous ?"
- [ ] 2 boutons : "Demander une démo" et "Me contacter"
- [ ] Design conservé (centré, visible)
- [ ] Responsive
- [ ] Analytics tracking (clics boutons)

**Tâches techniques** :
- [ ] Modifier section CTA Final existante
- [ ] Ajuster texte et boutons
- [ ] Vérifier responsive
- [ ] Vérifier analytics tracking

**Livrables** :
- ✅ Section "CTA FINAL" adaptée dans `templates/home/index.html.twig`

---

#### US-1.9 : Ajouter BLOG / RESSOURCES (optionnel)

**En tant que** visiteur de la homepage  
**Je veux** voir un teaser du blog  
**Afin de** découvrir les ressources et articles

**Points** : 1

**Critères d'acceptation** :
- [ ] Section optionnelle créée (après CTA final ou avant footer)
- [ ] Teaser blog avec CTA "Lire les articles"
- [ ] Design épuré
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig (optionnelle)
- [ ] Ajouter teaser blog
- [ ] Tester responsive
- [ ] Ajouter tracking analytics

**Livrables** :
- ✅ Section "BLOG / RESSOURCES" dans `templates/home/index.html.twig` (optionnelle)

---

## 📊 Résumé des User Stories

| ID | User Story | Points | Priorité |
|----|------------|--------|----------|
| US-1.1 | Refondre HERO | 5 | P0 |
| US-1.2 | Adapter CONTEXTE | 2 | P1 |
| US-1.3 | Créer PROBLÈME RÉEL | 2 | P0 |
| US-1.4 | Adapter SOLUTION | 2 | P1 |
| US-1.5 | Adapter COMMENT ÇA MARCHE | 1 | P1 |
| US-1.6 | Adapter BÉNÉFICES | 2 | P1 |
| US-1.7 | Créer QUI SOMMES‑NOUS | 2 | P0 |
| US-1.8 | Adapter CTA FINAL | 1 | P1 |
| US-1.9 | Ajouter BLOG / RESSOURCES | 1 | P2 |
| **Total** | | **18** | |

---

## ✅ Checklist Definition of Done (DoD)

### Contenu
- [ ] HERO refondu
- [ ] CONTEXTE adapté (avec chiffre 10 milliards)
- [ ] PROBLÈME RÉEL créé
- [ ] SOLUTION adaptée
- [ ] COMMENT ÇA MARCHE adapté (numérotation)
- [ ] BÉNÉFICES adaptés (4 bénéfices incluant Conformité)
- [ ] CRÉDIBILITÉ vérifiée
- [ ] QUI SOMMES‑NOUS créé
- [ ] CTA FINAL adapté
- [ ] BLOG / RESSOURCES ajouté (optionnel)

### Design
- [ ] Ton éditorial respecté (clair, rassurant, business, pas jargon)
- [ ] Sans jargon technique
- [ ] Orienté métier
- [ ] Mobile friendly
- [ ] CTA visibles
- [ ] Flow linéaire et clair

### Technique
- [ ] Responsive testé
- [ ] Analytics tracking fonctionne
- [ ] SEO préservé
- [ ] Performance maintenue (Lighthouse ≥ 90)
- [ ] Tests cross-browser validés

---

## 🚀 Prochaines Étapes

1. **Démarrer Sprint 1** : Refonte one-page v4.0
2. **Jour 1-2** : HERO + Sections manquantes (US-1.1, US-1.3, US-1.7)
3. **Jour 3-4** : Adapter sections existantes (US-1.2, US-1.4, US-1.5, US-1.6, US-1.8)
4. **Jour 5** : BLOG / RESSOURCES + Tests (US-1.9)

---

**Version** : 1.0  
**Statut** : ⏳ Prêt pour démarrage Sprint 1
