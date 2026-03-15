# Avis d'expert — Refonte du cockpit Dorevia Linky

**Document à l'attention de la MOA**

Date : Mars 2026  
Référent : Direction Artistique & Design System v1.1

---

## 1. Contexte et périmètre

### 1.1 Objet de l'expertise

La présente expertise porte sur la **refonte du cockpit Dorevia Linky**, interface de pilotage financier destinée aux dirigeants et CFO. Elle s'appuie sur :

- la **Direction Artistique Linky Cockpit** (v1.1)
- le **LINKY UI Design System** (v1.1)
- les **maquettes fonctionnelles** (demo1, demo2) réalisées à titre de validation

### 1.2 Positionnement produit

Linky se distingue des solutions concurrentes par une promesse centrale :

> **Données financières vérifiables** — et non de simples chiffres agrégés.

Cette différenciation impose une interface qui :

- inspire **confiance** et **crédibilité**
- rend **visible** le niveau de fiabilité des données
- évite toute confusion avec un dashboard marketing ou un ERP générique

---

## 2. Synthèse de l'expertise

### 2.1 Verdict global

**Le travail réalisé est solide et aligné avec les objectifs stratégiques.** La direction artistique, le design system et les maquettes forment un ensemble cohérent, prêt à servir de base pour le développement. Les choix visuels et structurels sont pertinents pour une cible CFO/dirigeants.

**Niveau de maturité estimé : 8/10** — prêt pour une phase de développement, avec quelques recommandations à intégrer en cours de route.

---

## 3. Points forts identifiés

### 3.1 Direction artistique claire

| Critère | Évaluation | Commentaire |
|---------|------------|-------------|
| Positionnement visuel | ✅ Très bon | Références Bloomberg / fintech bien intégrées |
| Palette dark premium | ✅ Très bon | Cohérent avec les standards du secteur |
| Couleurs fonctionnelles | ✅ Très bon | Vert/orange/rouge = signal, jamais décoration |
| Typographie | ✅ Bon | IBM Plex Sans adapté au contexte financier |
| Anti-patterns | ✅ Bon | Évite ERP lourd, look startup, surdensité |

La direction artistique évite les pièges classiques (dashboards marketing, effets crypto) et maintient une **sobriété professionnelle**.

### 3.2 Design System exploitable

Le Design System formalise :

- **Design tokens** (couleurs, espacements, typographie) prêts pour Tailwind/CSS variables
- **Composants** (KPI Card, Insight Card, Badge, Table) avec spécifications précises
- **Règles d'accessibilité** (WCAG AA, focus, contraste)
- **Stack technique** (Next.js, Tailwind, shadcn, Recharts, Lucide)

Ce niveau de formalisation **réduit les risques** de dérive visuelle en développement et **accélère** l'implémentation.

### 3.3 Structure de l'écran — logique cockpit

La structure implémentée suit une hiérarchie reconnue dans les produits fintech :

```
HEADER (contexte : tenant, période, source, fiabilité)
    ↓
INSIGHT (phrase narrative prioritaire)
    ↓
KPI (4 indicateurs synthétiques)
    ↓
COUVERTURE PROBANTE (widget signature Linky)
    ↓
ANALYSE (flux, exposition clients, position trésorerie)
    ↓
ALERTES (actions à traiter)
```

Cette structure répond à la question : **« Quelle est la situation financière en 3 secondes ? »** — objectif central d'un cockpit de pilotage.

### 3.4 Différenciation produit — signature Linky

Plusieurs éléments créent une **identité distinctive** :

1. **Widget Couverture probante**  
   Jauge radiale + statut des sources (Vault, Odoo, POS, Banque). Aucun concurrent ne met en avant la **fiabilité des données** de cette manière.

2. **Colonne Preuve** dans les tableaux  
   Indication explicite de la source (Vault ✓, Odoo + POS) pour chaque ligne.

3. **Header contextuel**  
   Badges « Flux validés », « Source Vault » — le contexte de fiabilité est immédiat.

4. **Deltas KPI**  
   Les variations (vs mois précédent, vs N−1) transforment les chiffres en **signaux décisionnels**.

Ces éléments incarnent la promesse : **ERP = chiffres ; Linky = chiffres vérifiables**.

### 3.5 Qualité d'implémentation des maquettes

Les démos HTML réalisées démontrent :

- Respect fidèle de la palette et des tokens
- Composants réutilisables (cards, badges, tables)
- Responsive (breakpoints 900px, 600px)
- Accessibilité (focus visible, sémantique HTML)
- Micro-interactions sobres (hover, transitions 150ms)

---

## 4. Points de vigilance et recommandations

### 4.1 À traiter avant ou en début de développement

| Point | Risque | Recommandation |
|-------|--------|----------------|
| **Mode clair** | Impressions/export PDF peu lisibles en dark | Prévoir une variante claire documentée (palette déjà définie) |
| **Composants manquants** | Header détaillé, filtres, états vides/erreur | Compléter le Design System (section 5.5 « à venir ») |
| **Largeur container** | Design System : 1440px ; démos : 1200px | Valider le choix (1200px = plus dense, recommandé par revue UX) |

### 4.2 À anticiper en cours de projet

| Point | Recommandation |
|-------|----------------|
| **Données dynamiques** | Prévoir états loading (skeleton), erreur, vide pour chaque bloc |
| **Graphiques** | Remplacer les barres statiques par Recharts/Tremor ; garder le style sobre |
| **Navigation** | Définir la navigation entre vues (trésorerie, marge, AR, etc.) |
| **Export / impression** | Mode clair + mise en page adaptée pour PDF |

### 4.3 Roadmap produit (rappel)

Le Design System prévoit :

- **v1** : cockpit financier, marge, trésorerie, AR clients
- **v2** : analytics avancées, alerting, DIVA insights

Respecter cette priorisation évite le scope creep.

---

## 5. Comparatif positionnement marché

| Produit | Type | Ce que Linky apporte en plus |
|---------|------|------------------------------|
| Power BI, Tableau | Dashboard BI | Pas de notion de **fiabilité des données** |
| Fygr, Agicap | Trésorerie / projection | Pas de **preuve Vault** ni de **couverture probante** |
| ERP (Odoo, etc.) | Chiffres bruts | Pas de **validation** ni de **traçabilité** |
| **Linky** | **Cockpit financier vérifiable** | Source, preuve, couverture = **signature produit** |

---

## 6. Recommandations pour la MOA

### 6.1 Décision

**Recommandation : valider la refonte** sur la base des documents et maquettes actuels. La direction artistique et le design system constituent une base solide pour le développement.

### 6.2 Conditions de succès

1. **Respect strict du Design System** par l'équipe front — pas de déviation sans validation design.
2. **Intégration des widgets signature** (Couverture probante, colonne Preuve) dès la v1 — ce sont les principaux leviers de différenciation.
3. **Tests utilisateurs** avec des CFO/dirigeants sur les maquettes avant développement — validation de la lisibilité et de la hiérarchie.
4. **Documentation des états** (loading, erreur, vide) pour chaque composant — éviter les écrans « cassés » en production.

### 6.3 Prochaines étapes suggérées

1. Validation MOA des maquettes demo1 et demo2
2. Finalisation des composants manquants (Header, filtres, états)
3. Création d'un backlog développement aligné sur le Design System
4. Sprint 0 : mise en place des tokens et composants de base (Tailwind, shadcn)

---

## 7. Conclusion

La refonte du cockpit Linky bénéficie d'une **direction artistique claire**, d'un **design system exploitable** et de **maquettes fonctionnelles convaincantes**. L'ensemble est cohérent avec le positionnement « données financières vérifiables » et avec les attentes d'une cible CFO/dirigeants.

Les **widgets signature** (Couverture probante, Preuve, Insight) constituent un avantage concurrentiel réel. Leur intégration dès la v1 est recommandée.

Sous réserve des points de vigilance identifiés, **le projet est prêt à passer en phase de développement**.

---

*Document établi à partir de l'analyse des documents de référence et des maquettes implémentées.*
