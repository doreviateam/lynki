# Note de cadrage — Intégration HelloAsso dans Odoo

## Objet

Clarifier l’objectif, le périmètre et l’orientation de l’intégration **HelloAsso ↔ Odoo** pour Les Grandlieu’Zarts, afin d’aligner l’usage métier, la logique fonctionnelle et les futurs développements.

## Contexte

L’association utilise **HelloAsso** comme outil de collecte en ligne pour ses activités associatives, notamment pour les adhésions, les inscriptions, la billetterie et les paiements.

En parallèle, **Odoo** a vocation à devenir le système interne de gestion, de structuration et de suivi de l’activité. Il doit permettre de centraliser les informations utiles à l’organisation, d’éviter les ressaisies et d’améliorer la lisibilité de l’activité pour l’équipe.

Jusqu’ici, l’intégration HelloAsso dans Odoo pouvait être perçue comme un espace fonctionnel à part entière. Le besoin est désormais de clarifier son rôle : il ne s’agit pas de recréer HelloAsso dans Odoo, mais de faire en sorte qu’Odoo récupère, rapproche et exploite correctement les données issues de HelloAsso.

Par ailleurs, un premier flux métier est déjà implémenté dans le module : la synchronisation des **adhérents**. Ce point constitue aujourd’hui le socle fonctionnel concret de l’intégration.

## Finalité

La finalité du projet est de faire d’**Odoo** le système interne de **structuration, de suivi et de pilotage**, tout en laissant **HelloAsso** comme système maître pour la **collecte opérationnelle en ligne**.

Autrement dit :

* **HelloAsso** reste la plateforme de référence pour les opérations réalisées par le public ;
* **Odoo** devient le référentiel interne permettant d’organiser, suivre et exploiter ces opérations dans la vie courante de l’association.

## Principe directeur

Le principe retenu est le suivant :

**HelloAsso capte l’opération ; Odoo l’intègre, la structure et l’exploite.**

Ce principe implique que :

* la saisie publique reste portée par HelloAsso ;
* les données utiles sont ensuite synchronisées dans Odoo ;
* Odoo sert à la gestion interne, au suivi administratif et au pilotage.

## Orientation retenue

L’orientation retenue n’est pas une refonte complète de l’existant, mais une **évolution de l’intégration dans un cadre plus clair**.

Il s’agit donc :

* de conserver la logique d’intégration déjà engagée ;
* de recentrer le module HelloAsso dans Odoo sur une fonction de synchronisation et d’exploitation ;
* de clarifier les données synchronisées et leur usage dans Odoo ;
* d’éviter de faire d’Odoo le maître fonctionnel de la billetterie ou des adhésions en ligne.

Cette évolution repose sur une logique simple : **HelloAsso reste maître des opérations publiques, Odoo devient le système interne de lecture, de rapprochement et d’exploitation**.

## État actuel de l’intégration

À ce jour, le module met déjà en œuvre un premier mécanisme opérationnel sur le périmètre **adhérents**.

Ce mécanisme fonctionne dans un **seul sens**, de **HelloAsso vers Odoo**. Odoo interroge l’API HelloAsso, identifie les paiements d’adhésion éligibles, puis crée ou met à jour des contacts internes dans Odoo. Aucune création ou mise à jour n’est renvoyée vers HelloAsso depuis Odoo.

Le déclenchement de cette synchronisation peut être réalisé :

* manuellement, depuis les paramètres du module ;
* ou de manière planifiée, via une tâche programmée prévue à cet effet.

Ce premier flux constitue un **MVP fonctionnel réel** déjà codé dans le module. Il valide la direction générale retenue pour l’intégration.

## Premier flux opérationnel validé : les adhérents

Le premier flux effectivement implémenté concerne la **synchronisation des adhérents**.

Le mécanisme actuel repose sur les principes suivants :

* authentification via l’API HelloAsso ;
* identification d’un formulaire de type **Membership** ;
* lecture paginée des paiements associés à ce formulaire ;
* filtrage des paiements éligibles selon des critères métier simples ;
* création, mise à jour ou rapprochement de contacts **`res.partner`** dans Odoo ;
* enregistrement de données de traçabilité liées à l’opération HelloAsso.

La logique de rapprochement s’appuie en priorité sur l’identifiant externe du paiement HelloAsso, puis, à défaut, sur l’adresse e-mail du payeur lorsqu’elle permet un rattachement non ambigu.

Ce flux ne constitue pas une reprise complète de toute l’activité HelloAsso. Il couvre à ce stade un périmètre volontairement limité : **les paiements d’adhésion éligibles issus d’un formulaire Membership**.

## Périmètre fonctionnel visé

Le périmètre fonctionnel visé concerne, à terme, la remontée dans Odoo des données produites dans HelloAsso, notamment :

* les contacts ;
* les payeurs ;
* les participants ;
* les adhérents ;
* les événements ou campagnes concernés ;
* les billets ou formules souscrites ;
* les montants ;
* les statuts ;
* les références d’origine HelloAsso.

Ces données doivent permettre ensuite, dans Odoo :

* le suivi des personnes ;
* l’organisation interne ;
* la consolidation de l’activité ;
* l’alimentation de tableaux de bord ;
* la préparation d’éventuels traitements administratifs, CRM ou comptables.

À ce jour, ce périmètre cible est **partiellement couvert**, avec une implémentation concrète déjà opérationnelle sur le volet **adhérents**.

## Ce qui n’est pas recherché à ce stade

À ce stade, le projet ne vise pas :

* à reproduire l’intégralité des fonctions HelloAsso dans Odoo ;
* à rendre Odoo prioritaire sur la création des campagnes, billetteries ou adhésions publiques ;
* à mettre en place immédiatement une synchronisation bidirectionnelle complète ;
* à traiter en même temps tous les sujets connexes, notamment la comptabilité détaillée, l’automatisation avancée ou l’ensemble des workflows CRM ;
* à considérer que tout HelloAsso est déjà synchronisé dans Odoo alors que seul un premier flux MVP est aujourd’hui réellement implémenté.

Le projet privilégie une approche progressive, lisible et robuste.

## Flux cible

Le flux cible retenu est le suivant :

1. Une opération est créée et réalisée dans **HelloAsso**.
2. Les données utiles de cette opération sont récupérées par **Odoo**.
3. Odoo crée, met à jour ou rapproche les objets internes correspondants.
4. L’équipe exploite ensuite ces informations dans Odoo pour la gestion quotidienne.

Le sens principal du flux est donc :

**HelloAsso → Odoo**

Ce schéma est déjà vérifié sur le premier cas métier disponible : **les adhésions**.

## Enjeu organisationnel

Cette orientation permet :

* d’éviter les doubles saisies ;
* de conserver un point d’entrée public simple et déjà maîtrisé ;
* de mieux structurer l’information en interne ;
* de disposer d’une base de gestion plus cohérente ;
* de préparer plus sereinement les évolutions futures.

Elle permet également de sécuriser la progression du projet : au lieu de viser d’emblée une couverture complète, l’intégration avance par flux métier clairement identifiés, testés et consolidés.

## Prochaine étape fonctionnelle

Après la validation du flux **adhérents**, la suite logique consiste à cadrer avec le même niveau de précision les autres flux potentiels, notamment :

* la billetterie ;
* les commandes ;
* les participants ;
* les payeurs ;
* les événements ou formulaires associés.

L’objectif est de conserver une logique homogène : **lecture depuis HelloAsso, structuration dans Odoo, exploitation interne par l’association**.

## Conclusion

Le projet HelloAsso dans Odoo doit être compris comme une **intégration de structuration interne**, et non comme un remplacement de HelloAsso.

La ligne de cadrage retenue est donc la suivante :

**HelloAsso reste maître des flux publics ; Odoo devient le socle interne de gestion, de suivi et de pilotage.**

À ce jour, cette orientation est déjà confirmée par un premier flux métier effectivement implémenté : **la synchronisation unidirectionnelle des adhérents depuis HelloAsso vers Odoo**.

## Références documentaires et techniques

### Vue d’ensemble des flux

* [Cartographie des flux HelloAsso → Odoo (synthèse)](./cartographie_flux_helloasso_odoo.md)
* [Note d’arbitrage — consolidation MVP](./note_arbitrage_consolidation_mvp_helloasso.md) *(à compléter après recette terrain)*
* [Arborescence fonctionnelle — menu HelloAsso](./note_arborescence_fonctionnelle_menu_helloasso.md)
* [Backlog d’implémentation — menu HelloAsso](./backlog_impl_menu_helloasso_odoo.md)

### Cadrage projet Odoo (LGZ)

* [Note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md)

### Flux adhérents (HelloAsso → Odoo)

* [Big Picture — adhérents](../HelloAsso_adhérent/Big_Picture_HelloAsso.md)
* [Spécification](../HelloAsso_adhérent/SPEC_DOREVIA_HELLOASSO_ADHERENT.md)
* [ADR — arbitrages](../HelloAsso_adhérent/ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md)
* [Référence API (usage connecteur)](../HelloAsso_adhérent/REF_API_HELLO_ASSO.md)
* [Recette MVP (compact)](../HelloAsso_adhérent/RECETTE_MVP_HELLOASSO_COMPACT.md)
* [Validation lab / cron](../HelloAsso_adhérent/VALIDATION_LAB_HELLOASSO_CRON.md)

### Flux billetterie (HelloAsso → Odoo)

* [Fiche flux — billetterie (état implémentation)](./fiche_flux_billetterie.md)
* [Big Picture — billetterie](../HelloAsso_billetterie/The_Big_Picture.md)
* [Spécification](../HelloAsso_billetterie/SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md)
* [ADR — arbitrages](../HelloAsso_billetterie/ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md)
* [Recette MVP (compact)](../HelloAsso_billetterie/RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md)
* [Plan d’implémentation](../HelloAsso_billetterie/PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md)

### Modules Odoo (racine du dépôt)

Chemins relatifs à la racine du dépôt `dorevia-plateform` :

* `units/odoo/custom-addons/dorevia_helloasso_adherent` — connecteur adhérents (MVP)
* `units/odoo/custom-addons/dorevia_helloasso_billetterie` — connecteur billetterie (MVP)
* `units/odoo/custom-addons/dorevia_partner_membership_fields` — champs et onglet HelloAsso sur `res.partner`
* `units/odoo/custom-addons/dorevia_res_config_dms_shim` — champs Paramètres attendus par les vues (shim DMS)
