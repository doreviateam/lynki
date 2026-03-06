# 🎯 Plan d'Implémentation — Spec Globale v1.0

**Date** : 18 janvier 2026  
**Base** : `SPEC_GLOBALE_SITE_DOREVIA-VAULT_v1.0.md` + `ANALYSE_ECARTS_SPEC_GLOBALE_v1.0.md`  
**Durée estimée** : 2 sprints (2 semaines)  
**Équipe** : Dev frontend / Web

---

## 📋 Vue d'Ensemble

### Objectif

Alignement complet du site Dorevia-Vault avec la spécification globale v1.0 pour :
- Simplifier le message
- Rendre le site plus humain et moins marketing
- Faciliter le contact
- Renforcer le positionnement expert

### Définition de "Fait" (DoD)

Le site est aligné avec la spec globale v1.0 si :
- ✅ Homepage conforme (HERO ajusté, blocs manquants créés)
- ✅ Page Contact simplifiée (Email + Message obligatoires, Nom + Entreprise optionnels)
- ✅ Ton global ajusté (humain, simple, pas marketing agressif)
- ✅ Blog vérifié et aligné
- ✅ Responsive maintenu
- ✅ Analytics tracking préservé
- ✅ SEO préservé

**Statut** : ⏳ **À démarrer**

---

## 🏃 Structure Scrum

### Sprints

- **Sprint 1** : Homepage + Contact (1 semaine) — 15 points
- **Sprint 2** : Ton global + Blog + Tests (1 semaine) — 8 points

**Total** : 2 semaines — 23 points

---

## 📦 Sprint 1 : Homepage + Contact (1 semaine)

**Objectif** : Ajuster la homepage et simplifier drastiquement le formulaire de contact

**Dates** : 2026-01-18 → 2026-01-25  
**Points** : 15 points

---

### User Stories

#### US-1.1 : Ajuster HERO Homepage

**En tant que** visiteur de la homepage  
**Je veux** voir un message clair et simple dès l'arrivée  
**Afin de** comprendre immédiatement ce que propose Dorevia-Vault

**Points** : 3

**Critères d'acceptation** :
- [ ] H1 remplacé : "La plateforme qui produit des preuves fiables pour vos factures"
- [ ] Sous-titre remplacé : "Pour les entrepreneurs qui veulent être en règle sans se compliquer la vie."
- [ ] Texte descriptif remplacé : "Dorevia-Vault sécurise automatiquement vos opérations financières et vous fournit des preuves vérifiables en cas de contrôle."
- [ ] CTA "Comprendre comment ça marche" ajouté (en plus de "Demander une démo")
- [ ] Responsive maintenu
- [ ] Analytics tracking préservé

**Tâches techniques** :
- [ ] Modifier `templates/home/index.html.twig` (section Hero)
- [ ] Tester responsive
- [ ] Vérifier analytics tracking

**Livrables** :
- ✅ HERO ajusté dans `templates/home/index.html.twig`

---

#### US-1.2 : Créer Bloc Problème

**En tant que** visiteur de la homepage  
**Je veux** comprendre le problème que résout Dorevia-Vault  
**Afin de** m'identifier et comprendre la nécessité

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée après le Hero ou après le Bloc Vision
- [ ] Texte conforme : "Beaucoup d'entrepreneurs honnêtes rencontrent des difficultés non par fraude, mais par manque de preuve."
- [ ] Design épuré, centré, lisible
- [ ] Responsive
- [ ] Analytics tracking (section view)

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Ajouter styles CSS
- [ ] Tester responsive
- [ ] Ajouter tracking analytics

**Livrables** :
- ✅ Section "Bloc Problème" dans `templates/home/index.html.twig`

---

#### US-1.3 : Créer Bloc Solution

**En tant que** visiteur de la homepage  
**Je veux** comprendre la solution proposée  
**Afin de** voir comment Dorevia-Vault répond au problème

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée après le Bloc Problème
- [ ] Texte conforme : "Dorevia-Vault est une plateforme conçue pour produire de la preuve automatiquement."
- [ ] Design épuré, centré, lisible
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Ajouter styles CSS
- [ ] Tester responsive
- [ ] Ajouter tracking analytics

**Livrables** :
- ✅ Section "Bloc Solution" dans `templates/home/index.html.twig`

---

#### US-1.4 : Créer Bloc Humain

**En tant que** visiteur de la homepage  
**Je veux** savoir qui est derrière Dorevia-Vault  
**Afin de** créer un lien humain et comprendre l'ancrage terrain

**Points** : 2

**Critères d'acceptation** :
- [ ] Section créée (avant ou après le CTA final)
- [ ] Texte conforme : "Basé à Nantes ancré en Guadeloupe. Des solutions pensées pour le terrain."
- [ ] Design épuré, centré, lisible
- [ ] Responsive
- [ ] Analytics tracking

**Tâches techniques** :
- [ ] Créer section HTML/Twig
- [ ] Ajouter styles CSS
- [ ] Tester responsive
- [ ] Ajouter tracking analytics

**Livrables** :
- ✅ Section "Bloc Humain" dans `templates/home/index.html.twig`

---

#### US-1.5 : Ajuster CTA Final Homepage

**En tant que** visiteur de la homepage  
**Je veux** voir un appel à l'action final clair et conversationnel  
**Afin de** passer à l'action facilement

**Points** : 1

**Critères d'acceptation** :
- [ ] Texte remplacé : "Envie d'en parler ?"
- [ ] Boutons remplacés : "Me contacter" et "Voir le blog"
- [ ] Design conservé (centré, visible)
- [ ] Responsive
- [ ] Analytics tracking (clics boutons)

**Tâches techniques** :
- [ ] Modifier section CTA Final existante
- [ ] Ajuster textes et liens
- [ ] Vérifier responsive
- [ ] Vérifier analytics tracking

**Livrables** :
- ✅ Section "CTA Final" modifiée dans `templates/home/index.html.twig`

---

#### US-1.6 : Simplifier Formulaire Contact (Refonte)

**En tant que** visiteur de la page contact  
**Je veux** contacter facilement sans remplir 15 champs  
**Afin de** avoir une expérience simple et sans friction

**Points** : 5

**Critères d'acceptation** :
- [ ] Titre simplifié : ton humain et simple
- [ ] Texte d'intro : "Un besoin, une question, une discussion ? Écris-moi simplement."
- [ ] Champs obligatoires : Email + Message uniquement
- [ ] Champs optionnels : Nom + Entreprise uniquement
- [ ] Bouton : "Envoyer" (simple)
- [ ] Formulaire court et épuré
- [ ] Message de confirmation chaleureux
- [ ] Responsive
- [ ] Analytics tracking préservé

**Tâches techniques** :
- [ ] Modifier `src/Form/LeadType.php` (simplifier champs)
- [ ] Modifier `src/Entity/Lead.php` (rendre Rôle optionnel, Message obligatoire)
- [ ] Modifier `templates/contact/index.html.twig` (refonte complète)
- [ ] Ajuster `src/Controller/ContactController.php` si nécessaire
- [ ] Migration base de données si nécessaire (Rôle optionnel)
- [ ] Tester validation formulaire
- [ ] Tester responsive
- [ ] Vérifier analytics tracking

**Livrables** :
- ✅ Formulaire simplifié dans `templates/contact/index.html.twig`
- ✅ Form `LeadType.php` simplifié
- ✅ Entity `Lead.php` ajustée (si nécessaire)

**Notes** :
- ⚠️ **Attention** : Migration base de données nécessaire si on rend `role` optionnel
- ⚠️ **Attention** : Vérifier impact sur synchronisation Odoo si on change la structure

---

## 📦 Sprint 2 : Ton Global + Blog + Tests (1 semaine)

**Objectif** : Ajuster le ton global, vérifier le blog, et tester l'ensemble

**Dates** : 2026-01-25 → 2026-02-01  
**Points** : 8 points

---

### User Stories

#### US-2.1 : Ajuster Ton Global (Réduire Marketing)

**En tant que** visiteur du site  
**Je veux** voir un ton calme, humain, crédible, terrain  
**Afin de** me sentir en confiance sans être agressé par du marketing

**Points** : 3

**Critères d'acceptation** :
- [ ] Réduire expressions marketing ("early adopter", "Rejoignez l'aventure")
- [ ] Simplifier jargon technique ("preuves cryptographiques" → "preuves vérifiables")
- [ ] Rendre plus humain et conversationnel
- [ ] Ton cohérent sur toutes les pages
- [ ] Responsive maintenu

**Tâches techniques** :
- [ ] Passer en revue tous les textes du site
- [ ] Remplacer expressions marketing par ton plus simple
- [ ] Simplifier jargon technique
- [ ] Tester cohérence globale

**Livrables** :
- ✅ Textes ajustés sur homepage et contact
- ✅ Ton global cohérent

---

#### US-2.2 : Vérifier et Ajuster Blog

**En tant que** visiteur du blog  
**Je veux** voir des articles alignés avec les lignes éditoriales  
**Afin de** comprendre la vision et l'expertise

**Points** : 2

**Critères d'acceptation** :
- [ ] Vérifier que les articles existants respectent les lignes éditoriales
- [ ] Vérifier le ton (pédagogique, honnête, pas corporate)
- [ ] Ajouter CTA "me contacter" si absent
- [ ] Responsive maintenu

**Tâches techniques** :
- [ ] Passer en revue les articles existants
- [ ] Vérifier alignement avec lignes éditoriales
- [ ] Ajouter CTA "me contacter" dans templates blog si absent
- [ ] Tester responsive

**Livrables** :
- ✅ Blog vérifié et aligné
- ✅ CTA "me contacter" ajouté si nécessaire

---

#### US-2.3 : Tests Finaux et Validation

**En tant que** équipe  
**Je veux** valider que tout fonctionne correctement  
**Afin de** garantir une expérience utilisateur optimale

**Points** : 3

**Critères d'acceptation** :
- [ ] Tests responsive (mobile, tablette, desktop)
- [ ] Tests formulaire contact (validation, soumission)
- [ ] Tests analytics tracking
- [ ] Tests SEO (meta tags, structured data)
- [ ] Tests performance (Lighthouse ≥ 90)
- [ ] Tests cross-browser (Chrome, Firefox, Safari)
- [ ] Validation DoD complète

**Tâches techniques** :
- [ ] Tests manuels responsive
- [ ] Tests formulaire contact
- [ ] Vérifier analytics tracking
- [ ] Vérifier SEO
- [ ] Test Lighthouse
- [ ] Tests cross-browser
- [ ] Checklist DoD

**Livrables** :
- ✅ Rapport de tests
- ✅ Validation DoD

---

## 📊 Résumé des User Stories

| Sprint | ID | User Story | Points | Priorité |
|--------|----|------------|--------|----------| 
| **Sprint 1** | US-1.1 | Ajuster HERO Homepage | 3 | P0 |
| **Sprint 1** | US-1.2 | Créer Bloc Problème | 2 | P0 |
| **Sprint 1** | US-1.3 | Créer Bloc Solution | 2 | P0 |
| **Sprint 1** | US-1.4 | Créer Bloc Humain | 2 | P0 |
| **Sprint 1** | US-1.5 | Ajuster CTA Final | 1 | P0 |
| **Sprint 1** | US-1.6 | Simplifier Formulaire Contact | 5 | P0 |
| **Sprint 2** | US-2.1 | Ajuster Ton Global | 3 | P1 |
| **Sprint 2** | US-2.2 | Vérifier Blog | 2 | P1 |
| **Sprint 2** | US-2.3 | Tests Finaux | 3 | P1 |
| **Total** | | | **23** | |

---

## ✅ Checklist Definition of Done (DoD)

### Homepage
- [ ] HERO ajusté (H1, sous-titre, texte, CTA)
- [ ] Bloc Problème créé
- [ ] Bloc Solution créé
- [ ] Bloc Humain créé
- [ ] CTA Final ajusté

### Contact
- [ ] Formulaire simplifié (Email + Message obligatoires, Nom + Entreprise optionnels)
- [ ] Ton humain et simple
- [ ] Titre et texte d'intro ajustés
- [ ] Bouton "Envoyer"

### Ton Global
- [ ] Marketing réduit
- [ ] Jargon technique simplifié
- [ ] Ton humain et conversationnel
- [ ] Cohérence sur toutes les pages

### Blog
- [ ] Articles vérifiés (lignes éditoriales)
- [ ] Ton vérifié (pédagogique, honnête)
- [ ] CTA "me contacter" ajouté si absent

### Technique
- [ ] Responsive testé
- [ ] Analytics tracking fonctionne
- [ ] SEO préservé
- [ ] Performance maintenue (Lighthouse ≥ 90)
- [ ] Tests cross-browser validés

---

## 🚀 Prochaines Étapes

1. **Démarrer Sprint 1** : Homepage + Contact
2. **Jour 1-2** : HERO + Blocs manquants (US-1.1, US-1.2, US-1.3, US-1.4)
3. **Jour 3-4** : CTA Final + Formulaire Contact (US-1.5, US-1.6)
4. **Jour 5** : Tests Sprint 1
5. **Sprint 2** : Ton global + Blog + Tests finaux

---

**Version** : 1.0  
**Statut** : ⏳ Prêt pour démarrage Sprint 1
