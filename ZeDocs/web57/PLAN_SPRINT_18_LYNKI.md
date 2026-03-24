# Plan Sprint 18 — Lynki

**Fichier canonique :** `PLAN_SPRINT_18_LYNKI.md`  
**Version :** 1.0 — mars 2026 — **gel documentaire** (base canonique Sprint 18)  
**Sprint précédent (plan) :** [PLAN_SPRINT_17_LYNKI.md](PLAN_SPRINT_17_LYNKI.md) v1.3  
**Rapport amont :** [RAPPORT_SPRINT_17_LYNKI.md](RAPPORT_SPRINT_17_LYNKI.md) v1.5  
**Contrat métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2.1  
**Référence UI cible :** [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) v0.3.1 *(north star, annexe HTML §3, matrice T99 §5.1 source unique, avertissement libellés §3.1)*  
**Tickets d’exécution :** [EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)

**En une phrase :** Sprint 18 = **faire entrer Lynki dans une cohérence visuelle produit mature**, en adaptant la maquette cible à la vérité métier et à la preuve réelle, **sans surpromesse visuelle ni refonte aveugle**.

---

## 1. Intention

Après :
- **Sprint 15** : confiance visible,
- **Sprint 16** : lecture haute,
- **Sprint 17** : lecture visuelle expliquée,

le **Sprint 18** vise à transformer la Synthèse en une **surface produit cohérente, respirante et assumée**, proche de la maquette cible, mais fidèle :
- aux **données réellement disponibles**,
- aux **états partiels / indisponibles**,
- et au **niveau de preuve effectivement porté par le backend**.

Le but n’est plus d’ajouter des briques majeures, mais de :
1. **unifier la présentation** des blocs déjà présents ;
2. **adapter la maquette HTML cible** à l’existant réel de Lynki ;
3. **poser un design system V2 localisé** à la Synthèse avant extension globale ;
4. améliorer la **respiration**, la **lisibilité**, les **états vides**, les **poids visuels** et le **responsive**.

**Principe directeur :** *la forme monte, mais elle reste tenue par le sens métier et la preuve réelle.*

### 1.1 Invariant d’ordre de lecture (hérité Sprints 15–17)

Le Sprint 18 manipule la **peau visuelle** : il doit **préserver l’ossature** de lecture déjà validée :

1. **Bloc confiance** en tête  
2. **KPI** juste après  
3. **Charts / Diva / preuve** ensuite (cohabitation sans écraser le reste)  
4. **Suites documentaires** et **points d’attention** après  

Toute évolution de composition reste **soumise** à cet ordre, sauf **décision produit explicite** documentée (ticket + rapport).

---

## 2. Objectifs (périmètre Sprint 18)

| # | Objectif | Critère de succès |
|---|----------|-------------------|
| A | **Adaptation de la maquette cible à Lynki réel** | Les grands blocs de la maquette (lecture graphique, Diva, preuve, points d’attention, export/documentation) sont traduits dans Lynki **sans promesse non portée** par le backend. |
| B | **Design system V2 localisé à la Synthèse** | Variables, cards, badges, sections, hiérarchie typographique et surfaces sont harmonisés **sur la zone Synthèse**, sans casser le reste de l’app. |
| C | **Traitement des états métier** | `Partiel`, `Indisponible`, `Proxy`, `Non vérifiable` deviennent visuellement plus lisibles et moins envahissants, sans être cachés. |
| D | **Respiration / hiérarchie / cohabitation des blocs** | Bloc confiance, KPI, charts, Diva, preuve et suites documentaires coexistent sans surcharge visuelle. |
| E | **Responsive mature** | Desktop, tablette, mobile : pas de collision, pas de surcharge, pas de hiérarchie cassée. |

---

## 3. Traduction de la maquette cible (north star) vers Lynki réel

### 3.0 Statut de la maquette HTML

La **maquette HTML** cible est une **référence de composition visuelle**.  
Elle ne constitue **ni** un contrat de données, **ni** une obligation de reprise **bloc à bloc à l’identique**.

**Traduction attendue :** le HTML ne doit pas être « codé tel quel » : il doit être **traduit** en Lynki mature, vérifiable et sobre (voir aussi [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) §2–4).

### 3.1 Matrice d’adaptation — bloc par bloc

| Bloc maquette | Décision S18 | Règle d’adaptation |
|---|---|---|
| **Vue d’ensemble / chaîne de lecture** | **Repris** (sobre) | Pas un bloc marketing ; expliquer le chemin de lecture réel de Lynki. |
| **4 cartes structurantes** | **Repris** | Garder les KPI réels, reformuler si besoin les libellés provisoires. |
| **Tendance d’activité** | **Repris** si série fiable ; sinon **Partiel** / **Reporté** | Ne pas sur-habiller une série faible (T93 / données réelles). |
| **Répartition** | **Repris** si matière fiable ; sinon **Partiel** / **Reporté** | Même prudence que pour le line chart (T94 / données réelles). |
| **Lecture Diva** | **Repris** | Bloc central et mieux composé ; pas de surpromesse sur le contenu généré. |
| **Statut de preuve / intégrité du dossier** | **Repris** | Vocabulaire aligné sur §3.3 ; **interdit sans backend** pour tout niveau « fort ». |
| **Points d’attention** | **Repris** si matière ; sinon **Partiel** (vide noble) | Pas de faux bloc rempli ; états vides §8.4. |
| **Préparation CODIR / documentation** | **Repris** (V1 honnête) | Relier à DOCX / export existants ; pas de promesse non portée. |
| **Nav bottom mobile** | **Reporté** par défaut | **Repris** uniquement si cohérent avec la navigation globale Lynki (sinon hors S18). |

**Légende décision :** *Repris* = livré ou visé S18 dans la forme prévue ; *Partiel* = version dégradée ou sous-ensemble ; *Reporté* = hors périmètre S18 ou après arbitrage ; *Interdit sans backend* = pas de libellé/badge fort sans capacité explicite (§3.3).

### 3.1bis Check produit (rappel)

Pour chaque bloc : (1) Lynki peut-il **vraiment** l’afficher ? (2) le **backend** le porte-t-il ? (3) le **wording** est-il honnête ? — Détail : [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) §4.

### 3.2 Règle d’honnêteté produit

Tout élément repris de la maquette doit être adapté selon cette règle :

- **on ne montre pas plus que ce que le système sait tenir** ;
- **on n’emploie pas un vocabulaire plus fort que la réalité backend** ;
- **on préfère un état partiel explicite à une surface « premium » mensongère**.

Exemples :
- `Vault certifié` → uniquement si cette promesse est réellement portée ;
- `Snapshot comptable certifié` → interdit sans backend correspondant ;
- cartes « pleines » → reformulées si la donnée est encore un proxy ou une lecture haute provisoire.

### 3.3 Vocabulaire « preuve » et niveaux forts

**Règle directe :** tout badge ou libellé de niveau fort (**`certifié`**, **`garanti`**, **`conforme`**, **`officiel`**, **`validé` au sens juridique**, etc.) doit être **adossé à une capacité backend explicite** documentée (contrat, endpoint, invariant).  
En l’absence de cette capacité : **formulation neutre** ou **état partiel / non vérifiable** (sans dévaloriser abusivement l’utilisateur).

---

## 4. Gate D — Synthèse produit mature (périmètre Sprint 18)

**Gate D | Cohérence visuelle mature de la Synthèse**

*Note : libellé **Gate D** réutilisé pour la **continuité produit**. Les gates D des **Sprints 16–17** (« lecture haute », « Synthèse expliquée visuellement ») sont **clôturées** dans leurs rapports respectifs. En cas de confusion en atelier, renommer en clôture (ex. « Gate S18 »).*

| Critère | Attendu |
|---------|---------|
| Structure globale | Bloc confiance, KPI, charts, Diva, preuve, suites documentaires coexistent sans confusion |
| Design system local | Cards, badges, titres, sous-textes, surfaces, espacements harmonisés sur la Synthèse |
| États métier | `Partiel`, `Indisponible`, `Proxy`, `Non vérifiable` restent visibles mais mieux hiérarchisés |
| Responsive | Parcours correct desktop / tablette / mobile |
| Honnêteté produit | Aucun libellé ou badge supérieur au niveau de preuve réel |
| Non-régression | Pilotage, Synthèse, drill-down, exports, DOCX, preuve existante inchangés fonctionnellement |

**Important :** la Gate D n’exige pas que toute la maquette HTML soit clonée.  
Elle exige que Lynki gagne une **cohérence visuelle mature**, fidèle à son architecture réelle.

---

## 5. Hors périmètre (explicitement)

- refonte globale de toute l’application au-delà de la zone Synthèse ;
- réécriture complète de la navigation globale si non nécessaire ;
- nouvelles promesses backend de preuve non encore implémentées ;
- moteur prescriptif / simulation ;
- `seed_erp` ;
- refonte DOCX profonde au-delà de l’intégration produit V1.

---

## 6. Dépendances

- Sprint 17 suffisamment stabilisé :
  - line chart livré ou report propre,
  - donut livré ou report propre,
  - bloc Diva renforcé,
  - bloc preuve V1,
  - polish intermédiaire amorcé ;
- inventaire des libellés réellement tenables côté preuve ;
- disponibilité du HTML cible comme référence de composition ;
- arbitrages produit sur :
  - points d’attention,
  - bloc CODIR / documentation,
  - responsive mobile,
  - vocabulaire preuve.

---

## 7. Risques

| Risque | Mitigation |
|---|---|
| Maquette trop « premium » par rapport à la réalité data | Adapter chaque bloc selon §3.2, jamais cloner sans filtre. |
| Design system local qui déborde sur toute l’app | Limiter explicitement le périmètre à la zone Synthèse. |
| États `Partiel`/`Indisponible` rendus invisibles au nom du polish | Conserver l’état, mais travailler sa hiérarchie visuelle. |
| Bloc preuve surprometteur | Relecture systématique des libellés avec la règle d’honnêteté produit. |
| Surcharge visuelle avec tous les blocs présents | Travailler la respiration, les poids visuels et les priorités de lecture. |

---

## 8. Hypothèses de travail design

### 8.1 Design system V2 local — composants à harmoniser

Le Sprint 18 vise une harmonisation locale des familles suivantes :

- **cards principales**
- **cards secondaires**
- **badges d’état**
- **titres / sous-titres**
- **blocs « Réf. » / sources / périmètre / horodatage**
- **états vides / indisponibles**
- **actions locales** (boutons, liens utilitaires)

### 8.2 États métier — stratégie visuelle

Les états métier doivent être :

- **visibles**
- **compréhensibles**
- **moins envahissants**

Objectif :
- ne pas cacher `Partiel`
- mais éviter que la page entière se lise d’abord comme une suite d’alertes techniques

Hypothèses :
- badge plus discret ;
- regroupement local d’état ;
- hiérarchie typographique plus calme ;
- wording plus stable.

### 8.3 Responsive

Le Sprint 18 doit vérifier au minimum :

- desktop large
- laptop / tablette
- mobile

Points de vigilance :
- co-placement charts
- densité des cards KPI
- Diva + preuve en colonnes ou pile
- points d’attention / DOCX
- éventuelle nav mobile

### 8.4 États vides « nobles » (obligatoire S18)

La maquette HTML cible est souvent **très « pleine »**. La **réalité** Lynki inclut **vide**, **partiel**, **indisponible**, **proxy**. Le Sprint 18 doit produire des états **élégants et utiles** (pas seulement le polish des cas riches) :

| État | Attendu visuel / produit |
|------|---------------------------|
| **Vide utile** | Expliquer pourquoi, prochaine action ou périmètre, pas un trou gris |
| **Partiel** | Ce qui manque est explicite ; pas de simulation de complétude |
| **Indisponible** | Honnête, hiérarchie calme, pas une alerte qui mange la page |
| **Proxy** | Libellés et refs qui disent que c’est une lecture haute / intermédiaire si applicable |

Ces états sont **transverses** aux tickets (notamment **T101**, **T103**) et **contrôlés** en Gate D.

---

## 9. Suite logique documentaire — tickets T99+

Détail : [EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1 — résumé :

| ID | Thème |
|----|--------|
| **T99** | Adaptation de la maquette cible : structure globale Synthèse (composition bloc par bloc) |
| **T100** | Design system V2 localisé à la Synthèse (cards, badges, titres, surfaces, refs) |
| **T101** | États métier : partiel / indisponible / proxy / non vérifiable (hiérarchie visuelle) |
| **T102** | Responsive mature Synthèse (desktop / tablette / mobile) |
| **T103** | Points d’attention + bloc documentation / CODIR (V1 honnête) |
| **T104** | Clôture sprint, Gate D, non-régression, rapport |

---

## 10. Suite logique (Sprint 19 — indicative)

| Sprint | Focus |
|--------|--------|
| **19** | Extension DS hors Synthèse, DOCX plus intégré, raffinement des surfaces annexes |

---

## 11. Historique des versions

| Version | Date | Changement |
|---------|------|------------|
| 0.1 | 2026-03 | Création : adaptation de la maquette cible, DS V2 local, états métier, responsive, cohérence produit mature. |
| 1.0 | 2026-03 | Gel documentaire : §1.1 invariant lecture S15–17 ; §3.0 statut maquette ; §3.1 matrice Décision S18 ; §3.3 vocabulaire preuve fort ; §8.4 états vides nobles ; liens REFERENCE_UI + EXECUTION v1.0 ; rapport amont v1.3. |
| 1.0.1 | 2026-03 | Point doc : tickets **[EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1** ; [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) v0.2 (§5.1 matrice T99). |
| 1.0.2 | 2026-03 | Annexe maquette **`ANNEXE_UI_CIBLE_SYNTHESE_LYNKI_S18.html`** versionnée ; [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) **v0.3** (§3.1 avertissement libellés). |
| 1.0.3 | 2026-03 | [REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md](REFERENCE_UI_CIBLE_SYNTHESE_LYNKI_S18.md) **v0.3.1** — matrice T99 **source de vérité unique** (§5.1) ; alignement tickets **[EXECUTION_TICKETS_SPRINT_18_LYNKI.md](EXECUTION_TICKETS_SPRINT_18_LYNKI.md) v1.1** gel canonique. |

---

*Document aligné sur la trajectoire Sprint 15 → 18 : après la crédibilité métier, la lecture haute et la lecture visuelle expliquée, le Sprint 18 vise la cohérence visuelle mature de la Synthèse sans perdre l’honnêteté de la preuve.*
