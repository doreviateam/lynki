# Big Picture — HelloAsso → Odoo (billetterie)

| | |
|---|---|
| **Version** | 0.2.16 |
| **Date** | Avril 2026 |
| **Statut** | Travail initial |
| **Périmètre** | Billetterie HelloAsso → Odoo |
| **Fichier** | `ZeDocs/Projet_LGZ/HelloAsso_billetterie/The_Big_Picture.md` |

---

## 1. Intention

Cette note pose la vision d’ensemble du futur connecteur **HelloAsso billetterie → Odoo**.

Elle ne décrit pas encore le détail du mapping technique ni les arbitrages de modélisation.  
Son rôle est de clarifier :

- le **rôle de HelloAsso**
- le **rôle d’Odoo**
- le **sens métier** du flux
- le **premier périmètre utile**
- la direction de travail avant spécification détaillée

### Distinction avec le flux « adhérent »

Le projet **adhérents** HelloAsso → Odoo (documentation sous [`HelloAsso_adhérent`](../HelloAsso_adhérent/), implémentation **`dorevia_helloasso_members`**) traite un **autre périmètre métier**. **La billetterie est un flux distinct** : objets API, règles de rapprochement et cibles Odoo ne sont **pas** supposés identiques. Les deux initiatives peuvent coexister ; elles ne doivent pas être amalgamées sans arbitrage explicite (future SPEC / ADR billetterie).

---

## 2. Position de départ

Le projet ne vise **pas** à remplacer HelloAsso.

HelloAsso reste le **canal public** de diffusion, d’inscription et de paiement de la billetterie.  
Odoo a vocation à devenir le **référentiel interne structuré** permettant de capitaliser les informations utiles à l’association.

Autrement dit :

- **HelloAsso acquiert**
- **Odoo capitalise**

En synthèse : HelloAsso reste le **canal public** d’acquisition billetterie ; Odoo reçoit ensuite une **représentation interne structurée** des événements, des commandes, des payeurs et des participants utiles au suivi de l’association.

**Doctrine MVP (sens de flux) :** pour le MVP billetterie, **HelloAsso reste maître** : la billetterie est **créée et pilotée dans HelloAsso**, puis **synchronisée vers Odoo** pour usage interne. Décision détaillée (hors MVP : pilotage inverse, synchro bidirectionnelle, création billetterie depuis Odoo) : [ADR billetterie — sens de flux](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md).

---

## 3. Lecture métier

Dans le cas de la billetterie, HelloAsso n’est pas seulement un outil de paiement.  
C’est un canal d’acquisition qui capte :

- des **événements**
- des **commandes**
- des **payeurs**
- des **participants**
- des **signaux de relation** avec le public

La valeur du connecteur n’est donc pas seulement de “faire remonter un paiement”, mais de faire entrer dans Odoo une représentation interne exploitable de cette activité.

---

## 4. Rôle cible des deux systèmes

### HelloAsso

HelloAsso reste responsable de :

- la publication de la billetterie
- le parcours public
- la sélection des billets
- la collecte des informations participants
- le paiement
- l’émission des billets

### Odoo

Odoo reçoit et structure ensuite les données utiles pour l’interne :

- l’événement HelloAsso et, si retenu, son **miroir interne dans Odoo**
- le payeur
- les participants
- la commande source
- les références de traçabilité
- les données utiles au suivi, à la segmentation et au pilotage

---

## 5. Problème à résoudre

Sans connecteur, les données de billetterie restent principalement dans HelloAsso.

Cela limite :

- la vision consolidée dans Odoo
- le suivi des personnes et de leur historique
- la segmentation interne
- le rapprochement avec d’autres activités de l’association
- l’exploitation des événements comme point d’entrée relationnel

Le connecteur vise donc à transformer une activité gérée publiquement dans HelloAsso en information interne structurée dans Odoo.

---

## 6. Ce que les premiers tests montrent

Les premières explorations sandbox montrent que la billetterie HelloAsso met en jeu plusieurs objets distincts :

- un **formulaire / événement**
- une **commande**
- un **payeur**
- un ou plusieurs **participants**
- un ou plusieurs **billets**
- un **paiement**
- éventuellement un **don complémentaire**

La billetterie ne peut donc pas être réduite à une simple logique “paiement → contact”.

---

## 7. Hypothèse de travail MVP

Le MVP ne cherche pas à reconstruire toute la billetterie HelloAsso dans Odoo.

Il vise d’abord à faire entrer dans Odoo une représentation interne simple, fiable et rejouable des informations les plus utiles issues de HelloAsso.

L’orientation de départ est la suivante :

- HelloAsso reste la **source publique**
- Odoo reçoit une **représentation interne**
- le connecteur privilégie d’abord la **traçabilité**, la **lisibilité métier** et la **rejouabilité**
- les fonctions avancées sont repoussées à plus tard

---

## 8. Première direction envisagée

À ce stade, une direction de travail crédible consiste à considérer :

- la **commande HelloAsso** comme ancrage de traçabilité
- le **payeur** comme contact principal de rapprochement
- les **participants** comme données métier explicites à conserver
- un **événement Odoo miroir**, si ce choix est confirmé, comme cible interne de structuration

Cette direction reste à confirmer dans la spec et l’ADR.

---

## 9. Ce que le MVP ne cherche pas encore à faire

Le premier lot ne vise pas encore :

- à remplacer la vente HelloAsso
- à faire de la synchro bidirectionnelle
- à reconstruire toute la logique comptable des paiements
- à couvrir immédiatement annulations, remboursements et cas complexes
- à faire d’Odoo le front-office public de billetterie

---

## 10. Ambition du connecteur

L’ambition du connecteur est de permettre à l’association de :

- conserver HelloAsso comme canal d’acquisition
- capitaliser dans Odoo les informations utiles
- relier les personnes, les événements et les participations
- préparer une meilleure exploitation interne des données billetterie

---

## 11. Suite documentaire

Cette Big Picture a vocation à être suivie par :

- une **SPEC** billetterie — voir [SPEC_DOREVIA_HELLOASSO_BILLETTERIE](./SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md) *(v0.1.14 — brouillon)*
- un **ADR** d’arbitrages — voir [ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) *(v0.1.3 — provisoire)*
- une **recette MVP** — voir [RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) *(v0.1.1)*
- éventuellement une note technique sur l’**automatisation** de la synchro : le premier palier attendu reste une **action planifiée Odoo (`ir.cron`)** ; le recours à **`queue_job`** ne sera envisagé qu’en **palier 2**, si le besoin réel le justifie (en cohérence avec le cadrage Projet LGZ).
- un **plan d’implémentation Scrum-like** — voir [PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) *(v0.1.7 — Ticket 1, trame [TICKET1_AUDIT_PAYLOADS](./TICKET1_AUDIT_PAYLOADS.md))*

Cadrage projet Odoo (contexte plateforme) : voir [Note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md).

---

## Historique des versions

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Première version — vision d’ensemble billetterie |
| 0.2 | Avril 2026 | En-tête : nom de fichier réel ; §1 — distinction flux adhérent / billetterie ; §11 — automatisation (`ir.cron` puis `queue_job` si besoin) ; lien note de cadrage ; historique |
| 0.2.1 | Avril 2026 | §2 — phrase de synthèse (boussole) ; §4 / §8 — formulations plus prudentes ; §11 — automatisation allégée |
| 0.2.2 | Avril 2026 | §11 — lien vers [SPEC billetterie](./SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md) (v0.1) |
| 0.2.3 | Avril 2026 | §11 — renvoi SPEC v0.1.1 |
| 0.2.4 | Avril 2026 | §11 — SPEC v0.1.2 + lien [ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) v0.1 |
| 0.2.5 | Avril 2026 | §11 — SPEC v0.1.3 + ADR v0.1.1 |
| 0.2.6 | Avril 2026 | §11 — SPEC v0.1.4 + [recette MVP](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) v0.1 |
| 0.2.7 | Avril 2026 | §11 — SPEC v0.1.5 + recette v0.1.1 |
| 0.2.8 | Avril 2026 | §11 — SPEC v0.1.6 + [plan Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1 |
| 0.2.9 | Avril 2026 | §11 — [plan Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.1 (micro-retouches) ; SPEC v0.1.7 |
| 0.2.10 | Avril 2026 | §11 — plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.2 (exécution, Ticket 1 audit) ; SPEC v0.1.8 |
| 0.2.11 | Avril 2026 | §11 — plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.3 (Ticket 1 — 4 artefacts, clôture) ; SPEC v0.1.9 |
| 0.2.12 | Avril 2026 | §11 — plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.4 (Ticket 1 — mini-lot, spike) ; SPEC v0.1.10 |
| 0.2.13 | Avril 2026 | §11 — plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.5 (Ticket 1 — exécution, 4 questions) ; SPEC v0.1.11 |
| 0.2.14 | Avril 2026 | §11 — plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.6 (matière réelle, fin sur-préparation) ; SPEC v0.1.12 |
| 0.2.15 | Avril 2026 | §11 — [trame Ticket 1](./TICKET1_AUDIT_PAYLOADS.md) ; plan v0.1.7 ; SPEC v0.1.13 |
| 0.2.16 | Avril 2026 | §2 — doctrine sens de flux MVP ; ADR v0.1.3 ; SPEC v0.1.14 |

---