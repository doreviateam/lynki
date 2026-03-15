# Spécification — Page Contact (Contactez-nous) — Connectée Odoo 19

*Page premium côté visiteur, capture propre côté Odoo 19 CRM. À lire en complément de `spec_dorevia_landing_page.md` (lien Footer « Nous contacter »).*

---

## 1. Objectif

La page **Contactez-nous** sert deux choses en même temps :

- **Expérience premium** pour le visiteur (formulaire sobre, clair, rassurant).
- **Capture propre** vers **Odoo 19** : création d’un **lead CRM** (pas contact + lead en première version — plus simple et aligné avec la logique commerciale).

---

## 2. Structure de la page

| Ordre | Bloc | Rôle |
|-------|------|------|
| 1 | **Hero** | Titre + sous-titre accueillant (parlons de votre contexte). |
| 2 | **Intro** | Rappel Dorevia + enjeux (trésorerie, paiements, rapprochements, lisibilité) — cette conversation est le bon point de départ. |
| 3 | **Formulaire** | Champs sobres + Sujet (liste) + CTA. Connecté à Odoo 19 CRM. |
| 4 | **Bloc réassurance** | « Quelques raisons de nous écrire » — 4 points. |
| 5 | **Bloc projection** | « Là où Dorevia peut déjà prendre sens » — Production, Association, Commerce et point de vente. |

---

## 3. Spécification des blocs

### 3.1 Hero

| Élément | Contenu |
|--------|---------|
| **Titre** | Parlons de votre contexte |
| **Sous-titre** | Que vous souhaitiez découvrir Dorevia, explorer un cas d’usage ou envisager une collaboration, nous serons ravis d’échanger avec vous. |

### 3.2 Intro

| Élément | Contenu |
|--------|---------|
| **Texte** | Dorevia aide les organisations à fiabiliser leurs données financières avant le pilotage. Si votre enjeu porte sur la trésorerie, les paiements, les rapprochements ou la lisibilité financière, cette conversation est le bon point de départ. |

### 3.3 Formulaire connecté à Odoo 19

**Champs recommandés :**

| Champ | Obligatoire | Notes |
|-------|-------------|-------|
| **Nom** | Oui | |
| **Email** | Oui | |
| **Entreprise / organisation** | Oui | |
| **Fonction** | Non (optionnel) | |
| **Sujet** | Oui | Liste déroulante — voir options ci-dessous. |
| **Message** | Oui | Zone de texte. |

**Sujet — options (liste déroulante) :**

- Découvrir Dorevia  
- Explorer un cas d’usage  
- Demander une démo  
- Partenariat  
- Autre sujet  

**CTA :** **Envoyer votre message**

---

## 4. Intégration Odoo 19

### 4.1 Logique retenue (première version)

**Création d’un lead CRM uniquement** — pas de contact + lead. Plus simple, plus propre, aligné avec la logique commerciale.

### 4.2 Action côté Odoo 19

À la soumission du formulaire : **création d’un lead** dans le module **CRM** Odoo 19.

### 4.3 Champs / métadonnées du lead

| Champ lead / métadonnée | Source formulaire / règle |
|-------------------------|---------------------------|
| Nom (contact) | Champ **Nom** |
| Email | Champ **Email** |
| Entreprise / organisation | Champ **Entreprise** (ou société du lead) |
| Fonction | Champ **Fonction** (optionnel) |
| Sujet / type de demande | Valeur du champ **Sujet** (liste) |
| Message / description | Champ **Message** |
| **Source** | Fixe : `Landing Page Dorevia` (ou équivalent) |
| **Canal** | Fixe : `Contact page` (ou `page contact`) |

### 4.4 Enrichissement optionnel (à trancher)

- **Tag / catégorie** selon la valeur de Sujet (ex. `demande_demo`, `cas_usage`, `partenariat`, `question_generale`).
- **Segment** (production / association / commerce) si un champ ou une logique est ajoutée plus tard.
- **Demande de démo** (oui/non) dérivé du Sujet si besoin pour les rapports.

---

## 5. Bloc réassurance

| Élément | Contenu |
|--------|---------|
| **Titre** | Quelques raisons de nous écrire |
| **Point 1** | Découvrir si Dorevia correspond à votre contexte |
| **Point 2** | Explorer un cas d’usage concret |
| **Point 3** | Échanger autour d’un partenariat ou d’une collaboration |
| **Point 4** | Poser une question produit, métier ou architecture |

### 6. Bloc projection

| Élément | Contenu |
|--------|---------|
| **Titre** | Là où Dorevia peut déjà prendre sens |
| **Cas 1** | Production |
| **Cas 2** | Association |
| **Cas 3** | Commerce et point de vente |

---

## 7. Version spec courte (référence)

```
Page Contactez-nous
  Rôle : Page de contact premium connectée à Odoo 19 CRM (lead uniquement)
  Hero
    Titre : Parlons de votre contexte
    Sous-titre : Que vous souhaitiez découvrir Dorevia, explorer un cas d’usage ou envisager une collaboration, nous serons ravis d’échanger avec vous.
  Intro
    Texte : Dorevia aide les organisations à fiabiliser leurs données financières avant le pilotage. Si votre enjeu porte sur la trésorerie, les paiements, les rapprochements ou la lisibilité financière, cette conversation est le bon point de départ.
  Formulaire
    Nom, Email, Entreprise / organisation, Fonction (optionnel), Sujet (liste), Message
    Sujet : Découvrir Dorevia | Explorer un cas d’usage | Demander une démo | Partenariat | Autre sujet
    CTA : Envoyer votre message
  Odoo 19
    Action : Création d’un lead CRM
    Source : Landing Page Dorevia | Canal : Contact page | Type : valeur Sujet
  Bloc réassurance : Quelques raisons de nous écrire (4 points)
  Bloc projection : Là où Dorevia peut déjà prendre sens (Production, Association, Commerce et point de vente)
```

---

## 8. Références

- **Landing principale** : `spec_dorevia_landing_page.md` — lien Footer « Nous contacter » pointe vers cette page.
- **URL de publication** : **suite.doreviateam.com** (landing + page contact ; DNS activé).
- **Stack** : Next.js + Mainline (Next 15, Tailwind 4, shadcn/ui) — même stack que la landing, cf. § 1.5 de la spec landing.
- **Back-end** : à prévoir (API ou formulaire postant vers un endpoint Odoo 19 / middleware qui crée le lead CRM).

---

*Document vivant — à amender avec les choix techniques Odoo 19 (champs CRM, tags, intégration).*
