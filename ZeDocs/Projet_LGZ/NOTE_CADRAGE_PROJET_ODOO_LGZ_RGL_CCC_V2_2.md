# **NOTE DE CADRAGE — PROJET ODOO**

## **Les Grandlieu’Zarts, Radio Grandlieu et Cric Crac Café**

|             |                                                        |
| ----------- | ------------------------------------------------------ |
| **Version** | 2.2                                                    |
| **Date**    | Avril 2026                                             |
| **Statut**  | Version révisée de travail, alignée sur le lab LGZ-RGL |
| **Objet**   | Validation du cadre de poursuite du projet Odoo        |

## **Coordonnées de référence**

| | |
|---|---|
| **Structure** | Dorevia Team |
| **Email** | contact@doreviateam.com |
| **Téléphone** | +33 6 89 01 70 09 |
| **Adresse** | 2B Route des épinais, 44860 Saint-Aignan-Grandlieu, France |
| **TVA** | FR50481904969 |
| **SIRET** | 48190496900021 |
| **Site web** | https://suite.doreviateam.com |

---

## **1. Objet de la note**

La présente note a pour objet de soumettre au comité de direction un cadrage révisé du projet Odoo concernant :

* Les Grandlieu’Zarts (LGZ) ;
* Radio Grandlieu (RGL) ;
* Cric Crac Café (CCC).

Elle vise à permettre au comité de direction de se prononcer sur :

* le périmètre général du projet ;
* la lecture retenue entre LGZ, RGL et CCC ;
* la base fonctionnelle initiale ;
* le découpage du projet en lots ;
* le cadre méthodologique de mise en œuvre ;
* le cadre économique et technique ;
* et les conditions de poursuite du projet.

---

## **2. Contexte général**

Le projet concerne deux associations hébergées dans les mêmes locaux : Les Grandlieu’Zarts (LGZ) et Radio Grandlieu (RGL).

À cet ensemble s’ajoute Cric Crac Café (CCC), qui ne doit pas être lu comme une troisième structure autonome au même niveau que LGZ et RGL, mais comme une activité rattachée à LGZ, avec ses propres enjeux de gestion.

Le projet doit donc être compris comme une démarche de structuration portant :

* sur deux structures juridiquement distinctes, LGZ et RGL ;
* dans un environnement partagé ;
* avec certains besoins communs ;
* et avec un sous-périmètre spécifique CCC rattaché à LGZ.

L’objectif n’est pas de fusionner les gestions, mais de mettre en place un cadre Odoo capable de :

* séparer clairement ce qui doit l’être ;
* mutualiser ce qui peut l’être utilement ;
* et permettre une progression par étapes.

---

## **3. Odoo comme socle du projet**

Odoo est retenu comme socle de structuration progressive.

Le projet est développé sur la base d’**Odoo 19 Community Edition**, qui constitue le socle technique retenu à ce stade.

Les choix fonctionnels, techniques et de modules doivent donc être lus en cohérence avec ce cadre.

Dans le cadre du projet LGZ / RGL / CCC, Odoo n’est pas envisagé comme un basculement global immédiat, mais comme un environnement de travail interne capable de couvrir progressivement :

* la relation ;
* la gestion ;
* la facturation ;
* certains flux opérationnels ;
* le documentaire de gestion ;
* le suivi de projet ;
* les achats ;
* les ventes et encaissements pour CCC ;
* ainsi que certains connecteurs ou flux externes utiles.

Le projet est donc pensé comme un socle évolutif, alimenté par des lots successifs.

---

## **4. Travail préalable et état du lab**

Un premier travail d’identification et de traduction du besoin a déjà été mené.

Il a permis :

* d’identifier les premiers besoins ;
* de poser une lecture plus claire de LGZ, RGL et CCC ;
* de distinguer les sujets communs et les sujets propres à chaque périmètre ;
* d’amorcer une traduction fonctionnelle dans Odoo ;
* et de valider sur le lab plusieurs briques utiles du périmètre HelloAsso.

### **4.1. Ce que le lab LGZ-RGL confirme déjà**

Le lab LGZ-RGL confirme déjà plusieurs éléments concrets autour du sous-périmètre HelloAsso du projet.

Sont désormais opérationnels ou validés sur le lab :

* une landing HelloAsso par société active ;
* une lecture des contacts adhérents synchronisés ;
* un inventaire des événements / billetteries HelloAsso ;
* la lecture des commandes liées à ces campagnes ;
* un objet dédié de paiement HelloAsso dans Odoo ;
* un import CSV MVP des paiements ;
* un import API MVP des paiements ;
* une orchestration cron MVP des paiements API ;
* une navigation HelloAsso plus structurée entre consultation, paiement et configuration.

Ces validations ne signifient pas que le projet est terminé. Elles montrent en revanche qu’une partie du besoin HelloAsso du périmètre LGZ / RGL est déjà sortie du simple cadrage et entre dans un usage réel de back-office Odoo.

---

## **5. Constats retenus**

Les premiers éléments recueillis conduisent à retenir les constats suivants :

* LGZ et RGL ont des activités distinctes ;
* leurs fonctionnements peuvent se croiser sur certains sujets ;
* leurs besoins de gestion ne sont pas identiques ;
* certaines ressources sont déjà mutualisées, notamment les locaux et une partie de l’environnement de travail ;
* chacune conserve toutefois son autonomie, notamment sur les plans administratif et comptable ;
* CCC doit être traité comme un sujet spécifique, rattaché à LGZ, et non comme une structure strictement équivalente à LGZ ou RGL.

Le projet doit donc tenir ensemble deux exigences :

* séparer clairement les gestions ;
* permettre un socle commun lorsque cela est utile.

---

## **6. Lecture retenue du projet**

### **6.1. Les Grandlieu’Zarts**

Pour LGZ, le projet concerne notamment :

* les usages de gestion ;
* le suivi des contacts, partenaires, adhérents et parties prenantes ;
* la coordination opérationnelle ;
* l’organisation documentaire de gestion ;
* certains flux de fonctionnement ;
* et le sous-périmètre HelloAsso déjà identifié comme besoin réel.

### **6.2. Radio Grandlieu**

Pour RGL, le projet concerne notamment :

* la structuration opérationnelle ;
* le suivi de projet ;
* le suivi de facturation ;
* et la mise en place d’un cadre de gestion plus lisible.

### **6.3. Cric Crac Café**

Cric Crac Café, rattaché à LGZ, élargit le périmètre du projet.

Ce sous-périmètre fait apparaître des besoins propres, notamment autour :

* de la caisse ;
* des ventes et encaissements ;
* des articles ;
* des achats et fournisseurs ;
* du suivi d’exploitation ;
* du terminal de paiement ;
* et, le cas échéant, des stocks ou du suivi matière.

Le sujet CCC constitue donc un lot spécifique, avec ses propres enjeux fonctionnels et sa propre temporalité.

---

## **7. Outils et écosystème existants**

Plusieurs outils occupent déjà une place réelle dans le fonctionnement courant de LGZ et RGL, avec des usages parfois communs et parfois différenciés selon les structures.

### **7.1. Pennylane**

Pennylane est utilisé principalement comme espace de dépôt documentaire à destination du cabinet comptable.

### **7.2. HelloAsso**

HelloAsso couvre un besoin fonctionnel important pour LGZ et RGL autour :

* des adhésions ;
* de la billetterie et des événements ;
* des paiements en ligne associés à ces flux ;
* et plus largement de certains encaissements liés à la vie associative.

Le projet Odoo n’a pas vocation à remplacer HelloAsso comme plateforme publique de collecte, d’inscription ou de billetterie.

En revanche, il a vocation à :

* relire dans Odoo les flux utiles issus de HelloAsso ;
* les structurer dans un cadre de gestion interne ;
* les rattacher clairement à la bonne société ;
* les rendre consultables et exploitables dans Odoo ;
* et fiabiliser le suivi interne sans ressaisie.

Dans cette logique, HelloAsso doit être compris comme un sous-périmètre fonctionnel identifié du projet, commun à LGZ et RGL, déjà partiellement structuré dans Odoo et déjà validé sur le lab pour plusieurs usages.

### **7.3. WhatsApp**

WhatsApp occupe une place importante dans la communication opérationnelle, notamment pour les échanges rapides, la mobilisation autour des événements et l’animation du quotidien.

Pour RGL, les besoins paraissent aujourd’hui plus directement liés à la structuration des projets, au suivi opérationnel et à la facturation.

---

## **8. Base fonctionnelle retenue**

La base fonctionnelle retenue comprend notamment :

* la gestion de la relation ;
* la facturation ;
* le point de vente pour les usages liés à Cric Crac Café ;
* la gestion documentaire de gestion ;
* le suivi de projet ;
* les achats ;
* et, pour LGZ et RGL, la lecture structurée dans Odoo des flux utiles issus de HelloAsso, en particulier autour des adhérents, des événements / billetteries, des commandes et des paiements.

Cette base constitue le socle initial proposé pour la mise en œuvre.

---

## **9. Découpage du projet en lots**

Le découpage en lots permet de séquencer la mise en œuvre sans confondre socle commun, besoins métier et sous-périmètres spécifiques.

| **Lot** | **Modules / périmètre** | **Entités concernées** | **Objectif** |
| --- | --- | --- | --- |
| **Lot 1 — Socle commun** | contacts, CRM, account, socle multi-sociétés, configuration générale | LGZ + RGL | Structuration commune, séparation des gestions |
| **Lot 2 — Opérations** | project, hr_timesheet, purchase | RGL en priorité, avec extension possible à LGZ selon les arbitrages de mise en œuvre | Suivi de projet, temps et achats |
| **Lot 3 — CCC** | point_of_sale, stock, product, exploitation CCC | CCC / LGZ | Caisse, encaissements, suivi d’exploitation |
| **Lot 4 — HelloAsso et enrichissements** | connecteurs HelloAsso, reporting, automatismes, modules OCA utiles, intégrations externes | LGZ + RGL, puis extension selon arbitrages | Structurer les flux externes utiles, en particulier adhérents, billetteries, commandes et paiements |

### **9.1. Comment lire le lot HelloAsso**

Le sous-périmètre HelloAsso ne doit pas être lu comme un sujet annexe.

Il couvre déjà un besoin fonctionnel concret pour LGZ et RGL, avec des validations déjà obtenues sur le lab.

Il constitue aujourd’hui un bon exemple de mise en œuvre progressive du projet :

* flux public conservé dans l’outil d’origine ;
* lecture interne structurée dans Odoo ;
* progression par MVP successifs ;
* et automatisation ensuite seulement lorsque le besoin est stabilisé.

---

## **10. Cadre méthodologique de mise en œuvre**

La mise en œuvre du projet est conduite selon une approche agile, fondée sur des itérations successives.

Elle repose sur :

* la mise en place d’un premier périmètre utile ;
* l’observation des usages réels ;
* des arbitrages successifs ;
* l’enrichissement progressif du socle fonctionnel ;
* la prise en compte des contraintes propres à chaque structure ;
* et une logique de formation continue au fil de la mise en œuvre.

Le projet est ainsi conduit dans une logique de construction progressive, au plus près du terrain.

---

## **11. Cadre d’intervention**

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

## **12. Cadre économique et technique**

Le modèle retenu distingue :

* une phase projet ;
* et une prise en charge technique récurrente.

### **12.1. Phase projet**

La phase projet couvre :

* le cadrage ;
* le paramétrage initial ;
* l’organisation fonctionnelle ;
* l’accompagnement au démarrage ;
* les ajustements liés à la mise en œuvre ;
* et les enrichissements retenus à l’issue des premiers arbitrages.

### **12.2. Prise en charge technique récurrente**

La prise en charge technique récurrente repose sur une contribution de **17 € par mois et par association**, versée à Doreviateam.

Elle couvre :

* l’hébergement ;
* la maintenance courante ;
* l’administration technique de base ;
* et la continuité générale de fonctionnement.

Pour deux associations, cela représente **34 € par mois**, soit **408 € par an**.

---

## **13. Point particulier : documentaire**

Le projet comporte un enjeu documentaire important, compte tenu du volume de documents, PDF, photographies, vidéos et contenus liés aux activités.

Odoo a vocation à couvrir les usages documentaires directement liés à la gestion.

Un espace documentaire partagé complémentaire pourra être mis en place dans la suite du projet, selon les arbitrages arrêtés.

---

## **14. Points d’attention de pilotage**

La poursuite du projet suppose une vigilance particulière sur les points suivants :

* maintenir une lecture claire entre LGZ, RGL et CCC, sans confondre rapprochement des usages et fusion de gestion ;
* garder un périmètre de mise en œuvre progressif, afin d’éviter une extension trop rapide du projet ;
* clarifier le rôle respectif des outils déjà en place, en particulier HelloAsso, Pennylane et les outils de communication du quotidien ;
* préserver une séparation lisible des responsabilités, des données et des circuits de validation ;
* traiter Cric Crac Café comme un sujet spécifique, avec son propre rythme de mise en œuvre ;
* capitaliser sur les éléments déjà validés sur le lab, sans considérer trop vite qu’ils valent généralisation complète à tous les usages ;
* conserver une logique d’arbitrages successifs, afin de ne pas figer prématurément des choix qui doivent encore être observés dans l’usage réel.

---

## **15. Points soumis à décision**

Il est proposé au comité de direction de se prononcer sur :

* le cadrage général du projet Odoo ;
* son périmètre autour de LGZ, RGL et CCC ;
* la lecture retenue distinguant LGZ et RGL, avec CCC comme sous-périmètre rattaché à LGZ ;
* la base fonctionnelle initiale proposée ;
* le découpage du projet en lots ;
* la place de HelloAsso comme sous-périmètre fonctionnel utile du projet LGZ / RGL ;
* le cadre méthodologique de mise en œuvre ;
* le principe d’une mise en œuvre progressive par itérations successives ;
* la poursuite du projet sur la base d’une phase projet chiffrée ;
* et le cadre technique récurrent reposant sur une contribution mensuelle par association.

---

## **16. Conclusion**

Le projet Odoo concerne la structuration d’ensemble de LGZ, RGL et CCC, avec une lecture clarifiée :

* LGZ et RGL comme deux structures distinctes ;
* CCC comme sous-périmètre spécifique rattaché à LGZ ;
* et HelloAsso comme un besoin fonctionnel déjà réel pour LGZ et RGL, déjà partiellement traduit et validé dans Odoo.

La présente note a pour objet de fixer le cadre général dans lequel le projet peut se poursuivre.

Il est proposé au comité de direction d’en valider :

* le principe ;
* le périmètre ;
* la lecture retenue ;
* la méthode de mise en œuvre ;
* et les modalités générales d’accompagnement.

Le projet ne relève plus d’une simple intention de structuration, mais d’une mise en œuvre progressive déjà engagée sur plusieurs briques concrètes, en particulier autour du sous-périmètre HelloAsso.

Il peut donc désormais être lu comme un projet effectivement amorcé, appelant des arbitrages de poursuite, de rythme et de priorisation plutôt qu’une simple validation d’intention.

---

## **Lien interne de référence**

* [Lab LGZ-RGL](https://glz-rgl.doreviateam.com)
