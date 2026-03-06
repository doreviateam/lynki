# 📊 Analyse des Écarts — Refonte One-Page v4.0 vs Existant

**Date** : 18 janvier 2026  
**Base** : `SPEC_REFONTE_ONEPAGE_v4.0.md`  
**Statut** : Analyse complète

---

## 📋 Vue d'Ensemble

Cette analyse compare la spécification one-page v4.0 avec l'implémentation actuelle de la homepage pour identifier les écarts et définir les actions correctives nécessaires.

**Philosophie** : La spec v4.0 demande une **one-page complète** avec 10 sections dans un ordre précis, inspirée de Speeral.io.

---

## 🔍 Comparaison Section par Section

### 1️⃣ HERO

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Badge** | 🇫🇷 Infrastructure souveraine française | 🇫🇷 Infrastructure souveraine | ✅ **Quasi-identique** |
| **H1** | "La plateforme qui produit des preuves fiables pour vos factures" | "Sécurisez vos factures. Prouvez votre conformité. Dormez tranquille." | 🔴 **Différent** — Spec v4.0 plus simple et directe |
| **Sous-titre** | "Pour les entrepreneurs qui veulent être en règle sans se compliquer la vie." | "La plateforme Dorevia-Vault protège automatiquement vos documents financiers grâce à un coffre-fort numérique certifiable." | 🔴 **Différent** — Spec v4.0 plus orientée utilisateur |
| **Texte d'appui** | "Dorevia‑Vault sécurise automatiquement vos opérations financières et génère des preuves vérifiables en cas de contrôle." | "Dorevia-Vault génère automatiquement des preuves cryptographiques opposables pour tous vos documents financiers." | ⚠️ **Différent** — Spec v4.0 simplifie le jargon |
| **CTA** | - Voir comment ça marche<br>- Me contacter | - Demander une démo<br>- Calculer mon coût | 🔴 **Différent** — Spec v4.0 propose "Voir comment ça marche" et "Me contacter" |

**Action** : 🔴 **Refonte complète du HERO**

---

### 2️⃣ CONTEXTE — Pourquoi maintenant

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Existence** | ✅ Présent | ⚠️ Partiellement présent (section "Pourquoi Maintenant") | ⚠️ **À adapter** |
| **Contenu** | - Réglementation française évolue<br>- **10 milliards d'euros** notifiés lors de contrôles fiscaux | - Réglementation française évolue<br>- Mention "2026" | ⚠️ **À enrichir** — Ajouter le chiffre "10 milliards d'euros" |

**Action** : ⚠️ **Adapter la section existante**

---

### 3️⃣ PROBLÈME RÉEL

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Existence** | ✅ Présent | ❌ **Absent** | 🔴 **Manquant** |
| **Contenu** | "Les entrepreneurs honnêtes n'ont pas besoin de plus de complexité. Ils ont besoin de : preuves fiables, documents traçables, historique vérifiable, sécurité dans le temps" | - | 🔴 **À créer** |

**Action** : 🔴 **Créer la section**

---

### 4️⃣ SOLUTION

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Existence** | ✅ Présent | ⚠️ Partiellement présent (Bloc Vision) | ⚠️ **À adapter** |
| **Contenu** | "Dorevia‑Vault est une plateforme qui transforme vos factures en preuves opposables. automatique, sans changer vos outils, sans formation complexe, sans jargon technique" | "Nous construisons une plateforme pour prouver vos factures..." | ⚠️ **À adapter** — Spec v4.0 plus directe |

**Action** : ⚠️ **Adapter la section existante**

---

### 5️⃣ COMMENT ÇA MARCHE

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Format** | 1) Vous travaillez normalement<br>2) Nous sécurisons en arrière‑plan<br>3) Vous obtenez une preuve légale | "Vous travaillez normalement → Nous sécurisons en arrière-plan → Vous obtenez une preuve légale" | ✅ **Quasi-conforme** — Format légèrement différent (numérotation vs flèches) |

**Action** : ⚠️ **Adapter le format (numérotation)**

---

### 6️⃣ BÉNÉFICES MÉTIER

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Bénéfices** | - Sérénité<br>- Crédibilité<br>- Simplicité<br>- **Conformité** (nouveau) | - Sérénité<br>- Crédibilité<br>- Simplicité | ⚠️ **À ajouter** — Bénéfice "Conformité" |

**Action** : ⚠️ **Ajouter le bénéfice "Conformité"**

---

### 7️⃣ CRÉDIBILITÉ

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Points** | - 🇫🇷 Infrastructure souveraine<br>- Hébergement en France<br>- ERP agnostique<br>- Compatible Odoo & autres ERP<br>- Automatisation complète | ✅ Présent avec points similaires | ✅ **Conforme** |

**Action** : ✅ **Aucune action**

---

### 8️⃣ QUI SOMMES‑NOUS

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Existence** | ✅ Présent | ❌ **Absent** | 🔴 **Manquant** |
| **Contenu** | "Basé à Nantes, ancré sur les réalités du terrain. Une approche simple, sans bullshit marketing, orientée métier." | - | 🔴 **À créer** |

**Action** : 🔴 **Créer la section**

---

### 9️⃣ CTA FINAL

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Texte** | "Vous voulez voir comment ça fonctionne pour vous ?" | "Envie de voir comment ça fonctionne ?" | ⚠️ **Légèrement différent** |
| **Boutons** | - Demander une démo<br>- Me contacter | - Demander une démo<br>- Voir les tarifs | ⚠️ **Différent** — Spec v4.0 propose "Me contacter" au lieu de "Voir les tarifs" |

**Action** : ⚠️ **Ajuster texte et boutons**

---

### 🔟 BLOG / RESSOURCES (optionnel)

| Élément | Spec v4.0 | Existant | Écart |
|---------|-----------|----------|-------|
| **Existence** | ✅ Optionnel | ✅ Blog existe | ✅ **Conforme** |
| **Intégration** | Section optionnelle sur la one-page | Page séparée | ⚠️ **À intégrer** — Ajouter teaser blog sur one-page |

**Action** : ⚠️ **Ajouter teaser blog (optionnel)**

---

## 📊 Synthèse des Écarts

### Priorité P0 (Critique)

1. 🔴 **HERO** : Refonte complète (H1, sous-titre, texte, CTA)
2. 🔴 **PROBLÈME RÉEL** : Créer la section
3. 🔴 **QUI SOMMES‑NOUS** : Créer la section

### Priorité P1 (Important)

4. ⚠️ **CONTEXTE** : Enrichir avec chiffre "10 milliards d'euros"
5. ⚠️ **SOLUTION** : Adapter le contenu
6. ⚠️ **COMMENT ÇA MARCHE** : Adapter le format (numérotation)
7. ⚠️ **BÉNÉFICES** : Ajouter "Conformité"
8. ⚠️ **CTA FINAL** : Ajuster texte et boutons

### Priorité P2 (Optionnel)

9. ⚠️ **BLOG / RESSOURCES** : Ajouter teaser (optionnel)

---

## 🎯 Actions Recommandées

1. **Refondre le HERO** selon spec v4.0 (P0)
2. **Créer section PROBLÈME RÉEL** (P0)
3. **Créer section QUI SOMMES‑NOUS** (P0)
4. **Adapter sections existantes** (CONTEXTE, SOLUTION, COMMENT ÇA MARCHE, BÉNÉFICES, CTA FINAL) (P1)
5. **Ajouter teaser blog** (optionnel) (P2)

---

## 🔄 Différences Clés avec Spec Globale v1.0

| Aspect | Spec Globale v1.0 | Spec One-Page v4.0 |
|--------|-------------------|-------------------|
| **Structure** | 3 pages séparées (Homepage, Contact, Blog) | 1 page unique avec 10 sections |
| **Approche** | Multi-pages | One-page |
| **Inspiration** | - | Speeral.io |
| **Focus** | Compréhension rapide | Compréhension en 5 secondes + flow complet |
| **Sections** | Blocs séparés | 10 sections dans un ordre précis |

**Note** : La spec v4.0 est une **refonte complète** en one-page, pas une évolution de la spec globale v1.0.

---

**Version** : 1.0  
**Statut** : Analyse complète
