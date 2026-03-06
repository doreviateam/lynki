# 📊 Analyse des Écarts — Spec Globale v1.0 vs Existant

**Date** : 18 janvier 2026  
**Base** : `SPEC_GLOBALE_SITE_DOREVIA-VAULT_v1.0.md`  
**Statut** : Analyse complète

---

## 📋 Vue d'Ensemble

Cette analyse compare la spécification globale v1.0 avec l'implémentation actuelle du site Dorevia-Vault pour identifier les écarts et définir les actions correctives nécessaires.

---

## 1️⃣ Homepage

### Écarts Identifiés

#### HERO Section

| Élément | Spec Globale v1.0 | Existant (v2.2) | Écart |
|---------|-------------------|-----------------|-------|
| **H1** | "La plateforme qui produit des preuves fiables pour vos factures" | "Sécurisez vos factures. Prouvez votre conformité. Dormez tranquille." | ⚠️ **Différent** — Spec globale plus simple et directe |
| **Sous-titre** | "Pour les entrepreneurs qui veulent être en règle sans se compliquer la vie." | "La plateforme Dorevia-Vault protège automatiquement vos documents financiers grâce à un coffre-fort numérique certifiable." | ⚠️ **Différent** — Spec globale plus orientée utilisateur |
| **Texte descriptif** | "Dorevia-Vault sécurise automatiquement vos opérations financières et vous fournit des preuves vérifiables en cas de contrôle." | "Dorevia-Vault génère automatiquement des preuves cryptographiques opposables pour tous vos documents financiers." | ⚠️ **Différent** — Spec globale plus simple, moins technique |
| **Badge** | 🇫🇷 Infrastructure souveraine française | 🇫🇷 Infrastructure souveraine | ✅ **Quasi-identique** |
| **CTA** | - Demander une démo<br>- Comprendre comment ça marche | - Demander une démo<br>- Calculer mon coût | ⚠️ **Différent** — Spec globale propose "Comprendre comment ça marche" au lieu de "Calculer mon coût" |

#### Bloc Problème

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Existence** | ✅ Présent | ❌ **Absent** | 🔴 **Manquant** |
| **Contenu** | "Beaucoup d'entrepreneurs honnêtes rencontrent des difficultés non par fraude, mais par manque de preuve." | - | 🔴 **À créer** |

#### Bloc Solution

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Existence** | ✅ Présent | ❌ **Absent** | 🔴 **Manquant** |
| **Contenu** | "Dorevia-Vault est une plateforme conçue pour produire de la preuve automatiquement." | - | 🔴 **À créer** |

#### Comment ça marche

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Format** | "Vous travaillez normalement → Nous sécurisons en arrière-plan → Vous obtenez une preuve légale" | ✅ Présent avec flèches | ✅ **Conforme** |

#### Bénéfices

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Contenu** | - Sérénité : prêt en cas de contrôle<br>- Crédibilité : vous pouvez prouver<br>- Simplicité : aucun changement d'habitude | ✅ Présent avec mêmes bénéfices | ✅ **Conforme** |

#### Bloc Crédibilité

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Points** | - Infrastructure souveraine 🇫🇷<br>- Hébergement France<br>- ERP agnostique<br>- Compatible Odoo & autres<br>- Automatisation complète | ✅ Présent avec points similaires | ✅ **Quasi-conforme** |

#### Bloc Humain

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Existence** | ✅ Présent | ❌ **Absent** | 🔴 **Manquant** |
| **Contenu** | "Basé à Nantes ancré en Guadeloupe. Des solutions pensées pour le terrain." | - | 🔴 **À créer** |

#### CTA Final

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Texte** | "Envie d'en parler ?" | "Envie de voir comment ça fonctionne ?" | ⚠️ **Différent** — Spec globale plus conversationnel |
| **Boutons** | - Me contacter<br>- Voir le blog | - Demander une démo<br>- Voir les tarifs | ⚠️ **Différent** — Spec globale propose "Voir le blog" |

### Résumé Homepage

- ✅ **Conforme** : Bloc Vision, Opportunité Marché, Bénéfices, Comment ça marche, Crédibilité
- ⚠️ **À ajuster** : HERO (H1, sous-titre, texte, CTA), CTA Final
- 🔴 **À créer** : Bloc Problème, Bloc Solution, Bloc Humain

---

## 2️⃣ Page Contact

### Écarts Identifiés

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Titre** | Ton simple et humain | "Devenir early adopter" | 🔴 **Très différent** — Spec globale demande un ton plus simple |
| **Texte d'intro** | "Un besoin, une question, une discussion ? Écris-moi simplement." | "Rejoignez le programme early adopters..." | 🔴 **Très différent** — Spec globale beaucoup plus simple |
| **Champs obligatoires** | - Email<br>- Message | - Email<br>- Rôle | 🔴 **Différent** — Spec globale demande Message au lieu de Rôle |
| **Champs optionnels** | - Nom<br>- Entreprise | - CompanyName<br>- FiscalCountry<br>- SIRET<br>- Stack<br>- Volume | 🔴 **Trop complexe** — Existant a beaucoup plus de champs |
| **Bouton** | "Envoyer" | "Rejoindre l'aventure" | ⚠️ **Différent** — Spec globale plus simple |
| **Ton** | Humain, simple, pas commercial | Marketing, "early adopter", commercial | 🔴 **Très différent** — Spec globale demande un ton beaucoup plus simple |

### Résumé Contact

- 🔴 **Refonte complète nécessaire** : Le formulaire actuel est trop complexe et trop commercial par rapport à la spec globale qui demande simplicité et humain.

---

## 3️⃣ Blog

### Écarts Identifiés

| Élément | Spec Globale v1.0 | Existant | Écart |
|---------|-------------------|----------|-------|
| **Lignes éditoriales** | - conformité<br>- preuve<br>- fraude involontaire<br>- ERP<br>- terrain entrepreneur<br>- souveraineté numérique<br>- retour d'expérience | ✅ Blog fonctionnel | ⚠️ **À vérifier** — Vérifier que les articles existants respectent ces lignes |
| **Ton** | Pédagogique, honnête, pas corporate, pas bullshit | - | ⚠️ **À vérifier** — Vérifier le ton des articles existants |
| **CTA** | - s'inscrire à une newsletter (plus tard)<br>- me contacter | - | ⚠️ **À ajouter** — CTA "me contacter" à ajouter si absent |

### Résumé Blog

- ✅ **Structure conforme** : Le blog existe et fonctionne
- ⚠️ **À vérifier** : Lignes éditoriales et ton des articles existants
- ⚠️ **À ajouter** : CTA "me contacter" si absent

---

## 4️⃣ Ton Global

### Écarts Identifiés

| Caractéristique | Spec Globale v1.0 | Existant | Écart |
|-----------------|-------------------|----------|-------|
| **Calme** | ✅ Demandé | ⚠️ Parfois trop marketing | ⚠️ **À ajuster** |
| **Crédible** | ✅ Demandé | ✅ Présent | ✅ **Conforme** |
| **Terrain** | ✅ Demandé | ✅ Présent | ✅ **Conforme** |
| **Humain** | ✅ Demandé | ⚠️ Parfois trop corporate | ⚠️ **À ajuster** |
| **Pas marketing agressif** | ✅ Demandé | ⚠️ "Early adopter", "Rejoignez l'aventure" | ⚠️ **À ajuster** |
| **Pas jargon tech** | ✅ Demandé | ⚠️ "Preuves cryptographiques", "coffre-fort numérique" | ⚠️ **À ajuster** |

### Résumé Ton Global

- ⚠️ **À ajuster** : Réduire le marketing, simplifier le jargon technique, rendre plus humain

---

## 📊 Synthèse des Écarts

### Priorité P0 (Critique)

1. 🔴 **Page Contact** : Refonte complète du formulaire (simplification drastique)
2. 🔴 **Homepage HERO** : Ajuster H1, sous-titre, texte, CTA selon spec globale
3. 🔴 **Homepage Bloc Problème** : Créer le bloc
4. 🔴 **Homepage Bloc Solution** : Créer le bloc
5. 🔴 **Homepage Bloc Humain** : Créer le bloc

### Priorité P1 (Important)

6. ⚠️ **Homepage CTA Final** : Ajuster texte et boutons
7. ⚠️ **Ton Global** : Réduire marketing, simplifier jargon
8. ⚠️ **Blog CTA** : Ajouter CTA "me contacter" si absent

### Priorité P2 (Amélioration)

9. ⚠️ **Blog Lignes éditoriales** : Vérifier alignement avec spec globale

---

## 🎯 Actions Recommandées

1. **Simplifier drastiquement le formulaire de contact** (P0)
2. **Ajuster le HERO de la homepage** (P0)
3. **Créer les blocs manquants** (Problème, Solution, Humain) (P0)
4. **Ajuster le ton global** pour être plus humain et moins marketing (P1)
5. **Vérifier le blog** et ajouter CTA si nécessaire (P1)

---

**Version** : 1.0  
**Statut** : Analyse complète
