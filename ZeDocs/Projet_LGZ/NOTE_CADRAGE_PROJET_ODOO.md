# Note de cadrage — Projet Odoo

## Les Grandlieu’Zarts, Radio Grandlieu et Cric Crac Café

| | |
| ----------- | ----------------------------------------------- |
| **Version** | 1.9 |
| **Date** | Avril 2026 |
| **Statut** | Note soumise au comité de direction |
| **Objet** | Validation du cadre de poursuite du projet Odoo |

---

## 1. Objet de la note

La présente note a pour objet de soumettre au comité de direction le cadrage du projet Odoo concernant :

* Les Grandlieu’Zarts (LGZ) ;
* Radio Grandlieu (RGL) ;
* Cric Crac Café (CCC).

Elle vise à permettre au comité de direction de se prononcer sur le périmètre général du projet, la lecture retenue, le cadre méthodologique de mise en œuvre, le cadre économique et technique, et les conditions de poursuite du projet.

---

## 2. Contexte général

Le projet concerne deux associations hébergées dans les mêmes locaux : Les Grandlieu’Zarts (LGZ) et Radio Grandlieu (RGL). À cet ensemble s’ajoute Cric Crac Café (CCC), comme activité rattachée à LGZ.

Les deux associations évoluent dans un environnement partagé, avec un enjeu possible de structuration commune ou coordonnée de certains usages de gestion. Elles se rapprochent de manière organique, sans relever d’une fusion juridique ou comptable.

Le projet doit donc être lu comme une démarche de structuration portant sur deux structures distinctes, partageant un même lieu, certains usages, et plusieurs besoins proches.

---

## 3. Odoo

Odoo est le logiciel retenu comme socle du projet.

Il permet de réunir, dans un même environnement, plusieurs fonctions utiles à l’organisation et à la gestion des structures.

Dans le cadre du projet LGZ / RGL / CCC, Odoo est envisagé comme un outil de structuration progressive, mis en place à partir d’un périmètre adapté aux besoins identifiés.

---

## 4. Travail préalable

Un premier travail d’identification du projet a été mené sur LGZ, RGL et CCC.

Il a permis d’identifier les premiers besoins, de préciser les grands périmètres, de distinguer les sujets communs et les sujets propres à chaque structure, et de poser une première traduction du projet dans Odoo.

---

## 5. Constats retenus

Les premiers éléments recueillis conduisent à retenir les constats suivants :

* LGZ et RGL ont des activités distinctes ;
* leurs fonctionnements peuvent se croiser sur certains sujets ;
* leurs besoins de gestion ne sont pas identiques ;
* certaines ressources sont déjà mutualisées, au moins au niveau des locaux et de l’environnement de travail ;
* chacune conserve toutefois son autonomie, notamment sur les plans administratif et comptable.

Le projet doit donc tenir ensemble deux exigences : séparer clairement les gestions et permettre un socle commun lorsque cela est utile.

---

## 6. Lecture retenue du projet

### 6.1. Les Grandlieu’Zarts

Pour LGZ, le projet concerne notamment :

* les usages de gestion ;
* le suivi des contacts, partenaires, adhérents et parties prenantes ;
* la coordination opérationnelle ;
* l’organisation documentaire ;
* et certains flux de fonctionnement.

### 6.2. Radio Grandlieu

Pour RGL, le projet concerne notamment :

* la structuration opérationnelle ;
* le suivi de projet ;
* le suivi de facturation ;
* et la mise en place d’un cadre de gestion plus lisible.

### 6.3. Cric Crac Café

Cric Crac Café, rattaché à LGZ, élargit le périmètre du projet.

Ce sous-périmètre fait apparaître des besoins propres, notamment autour :

* de la caisse ;
* des ventes et encaissements ;
* des articles ;
* des achats et fournisseurs ;
* du suivi d’exploitation ;
* du terminal de paiement ;
* et, le cas échéant, des stocks ou du suivi matière.

Le sujet CCC constitue un lot spécifique, avec ses propres enjeux fonctionnels et sa propre temporalité.

---

## 7. Outils et écosystème existants

Pour LGZ, deux outils occupent déjà une place réelle : Pennylane, utilisé principalement comme espace de dépôt documentaire à destination du cabinet comptable, et HelloAsso, utilisé notamment pour la billetterie, les cotisations et les dons.

Pour RGL, le besoin paraît aujourd’hui plus directement lié à la structuration des projets et au suivi de facturation.

WhatsApp occupe une place importante dans la communication opérationnelle, notamment pour les échanges rapides, la mobilisation autour des événements et l’animation du quotidien.

---

## 8. Base fonctionnelle retenue

La base fonctionnelle retenue comprend notamment :

* la gestion de la relation ;
* la facturation ;
* le point de vente pour les usages liés à Cric Crac Café ;
* la gestion documentaire ;
* le suivi de projet ;
* et les achats.

Cette base constitue le socle initial proposé pour la mise en œuvre.

---

## 9. Découpage du projet en lots

| Lot | Modules / périmètre | Entités concernées | Objectif |
|-----|---------------------|-------------------|----------|
| **Lot 1 — Socle commun** | `contacts`, `crm`, `account`, `dms`, socle multi-sociétés | LGZ + RGL | Structuration commune, séparation des gestions |
| **Lot 2 — Opérations** | `project`, `hr_timesheet`, `purchase` | RGL (+ LGZ) | Suivi de projet, temps et achats |
| **Lot 3 — CCC** | `point_of_sale`, `stock`, `product` | CCC uniquement | Caisse, encaissement, suivi matière |
| **Lot 4 — Enrichissements** | Modules OCA, reporting, automatismes, intégrations | Toutes | Reporting, performance, connecteurs externes |

---

## 10. Cadre méthodologique de mise en œuvre

La mise en œuvre du projet est conduite selon une approche agile, fondée sur des itérations successives.

Elle repose sur la mise en place d’un socle initial, appelé à être enrichi, précisé et ajusté au fil du projet.

Cette méthode repose notamment sur :

* la mise en place d’un premier périmètre utile ;
* l’observation des usages réels ;
* des arbitrages successifs ;
* l’enrichissement progressif du socle fonctionnel ;
* la prise en compte des contraintes propres à chaque structure ;
* et une logique de formation continue au fil de la mise en œuvre.

Le projet est ainsi conduit dans une logique de construction progressive, au plus près du terrain.

---

## 11. Cadre d’intervention

L’accompagnement du projet est porté dans une logique d’assistance à maîtrise d’ouvrage (AMOA).

Il couvre :

* le cadrage ;
* l’organisation du périmètre ;
* la mise en œuvre initiale ;
* les ajustements de démarrage ;
* le travail d’arbitrage ;
* et le suivi de cohérence du projet.

Dans le cadre du démarrage du projet, un temps d’AMOA est consacré à son accompagnement sur une première séquence de 6 semaines, à raison d’une moyenne de 5 heures par semaine, soit 30 heures au total.

Cet engagement est apporté à titre bénévole par Doreviateam pour l’amorçage du projet.

---

## 12. Cadre économique et technique

Le modèle retenu distingue une phase projet et une prise en charge technique récurrente.

### 12.1. Phase projet

La phase projet couvre le cadrage, le paramétrage initial, l’organisation fonctionnelle, l’accompagnement au démarrage, les ajustements liés à la mise en œuvre et les enrichissements retenus à l’issue des premiers arbitrages.

### 12.2. Prise en charge technique récurrente

La prise en charge technique récurrente repose sur une contribution de 17 € par mois et par association, versée à Doreviateam.

Elle couvre :

* l’hébergement ;
* la maintenance courante ;
* l’administration technique de base ;
* et la continuité générale de fonctionnement.

Pour deux associations, cela représente 34 € par mois, soit 408 € par an.

---

## 13. Point particulier : documentaire

Le projet comporte un enjeu documentaire important, compte tenu du volume de documents, PDF, photographies, vidéos et contenus liés aux activités.

Odoo a vocation à couvrir les usages documentaires directement liés à la gestion.

Un espace documentaire partagé complémentaire pourra être mis en place dans la suite du projet, selon les arbitrages arrêtés.

---

## 14. Points de vigilance

* ne pas confondre rapprochement organique et fusion de gestion ;
* ne pas élargir trop vite le périmètre ;
* clarifier le rôle exact de chaque outil déjà en place ;
* préserver une séparation lisible des responsabilités ;
* et traiter Cric Crac Café comme un sujet spécifique.

---

## 15. Points soumis à décision

* 1. le cadrage général du projet Odoo ;
* 2. son périmètre autour de LGZ, RGL et CCC ;
* 3. la lecture retenue ;
* 4. la base fonctionnelle initiale proposée ;
* 5. le découpage du projet en lots ;
* 6. le cadre méthodologique de mise en œuvre ;
* 7. le principe d’une mise en œuvre progressive par itérations successives ;
* 8. la poursuite du projet sur la base d’une phase projet chiffrée ;
* 9. le cadre technique récurrent reposant sur une contribution mensuelle par association.

---

## 16. Conclusion

Le projet Odoo concerne la structuration d’ensemble de LGZ, RGL et CCC.

La présente note a pour objet de fixer le cadre général dans lequel le projet peut se poursuivre.

Il est proposé au comité de direction d’en valider le principe, le périmètre, la méthode de mise en œuvre et les modalités générales d’accompagnement.

---

## Liens internes (plateforme Dorevia)

* Instance Odoo (lab) : https://glz-rgl.doreviateam.com
* Inventaire technique (dépôt) : [`instance_odoo.md`](./instance_odoo.md)
