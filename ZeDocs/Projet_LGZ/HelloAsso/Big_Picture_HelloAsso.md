# Note de cadrage — Big Picture

## HelloAsso → Odoo : alimentation automatique des adhérents

| | |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Version** | 0.2 |
| **Date** | Avril 2026 |
| **Statut** | Cadrage initial — orientations validables |
| **Objet** | Poser l’orientation générale d’un flux automatique entre HelloAsso et Odoo pour l’alimentation des adhérents |
| **Périmètre projet** | Les Grandlieu’Zarts (LGZ), Radio Grandlieu (RGL), Cric Crac Café (CCC) — dans la continuité du [cadre projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md) |

---

## 1. Besoin exprimé

Les associations utilisent **HelloAsso** pour les adhésions et les renouvellements côté public. Cette même information doit ensuite être retrouvée dans **Odoo** pour le suivi interne, ce qui génère aujourd’hui ressaisies, écarts, délais et charge inutile.

**Besoin :** disposer d’un mécanisme **automatique et fiable** permettant que toute **adhésion validée dans HelloAsso** crée ou mette à jour les **données adhérent correspondantes dans Odoo**, avec **rattachement à la bonne structure** (association / activité) et **traçabilité** vers l’origine HelloAsso, **sans** remettre en cause HelloAsso comme outil d’inscription publique.

Ce besoin est d’abord **fonctionnel** avant d’être technique : il s’agit en premier lieu de clarifier les données attendues, les règles métier et les principes de rattachement, puis de déterminer les modalités d’échange adaptées.

---

## 2. Intention

L’objectif **n’est pas** de remplacer HelloAsso.

L’objectif est de conserver **HelloAsso** comme **canal public** d’adhésion et de renouvellement, tout en faisant de **Odoo** le **référentiel interne structuré** des adhérents pour la gestion au quotidien.

Le besoin de fond est simple :

* **éviter la double saisie** ;
* **fiabiliser la donnée adhérent** ;
* disposer dans Odoo d’une **base exploitable** pour le suivi, les filtres, les renouvellements et le pilotage.

Le sujet ne porte donc pas, à ce stade, sur une refonte globale des flux associatifs. Il porte d’abord sur la mise en place d’un **mécanisme fiable** permettant à Odoo de récupérer automatiquement les informations utiles à partir des **adhésions validées** dans HelloAsso.

---

## 3. Principe général

Le schéma cible est le suivant :

* **HelloAsso** reste l’outil utilisé côté public pour souscrire ou renouveler une adhésion ;
* **Odoo** centralise les informations utiles à la gestion interne ;
* un **connecteur** assure automatiquement le passage des données entre HelloAsso et Odoo.

Dans cette logique, toute **adhésion validée** dans HelloAsso doit pouvoir entraîner la **création** ou la **mise à jour** des informations correspondantes dans Odoo.

Le rôle du connecteur n’est pas de remplacer les règles métier internes, mais d’assurer le **lien** entre les données issues de HelloAsso et le **modèle de gestion** retenu dans Odoo (contacts, champs adhérent, sociétés, segmentation, etc. — voir inventaire technique du [lab LGZ](../instance_odoo.md)).

---

## 4. Périmètre du premier lot

Le premier lot se concentre sur le flux principal :

* les **adhérents** ;
* les **adhésions validées** ;
* la **création ou mise à jour automatique** des données dans Odoo ;
* le **rattachement à la bonne structure** (association / entité Odoo).

Le périmètre prioritaire consiste donc à faire en sorte qu’une adhésion validée dans HelloAsso alimente Odoo de manière **exploitable**, **cohérente** et **traçable**.

**Hors périmètre du premier lot** — mais extensions naturelles possibles dans la suite :

* les **dons** ;
* la **billetterie** ;
* les **campagnes** ;
* la **comptabilité détaillée** ou l’intégration comptable fine.

---

## 5. Résultat recherché

À l’issue de ce premier périmètre, Odoo doit permettre :

* de disposer d’un **référentiel adhérents à jour** ;
* de relier chaque enregistrement interne à son **origine HelloAsso** ;
* d’**exploiter** cette base pour le **suivi**, les **renouvellements** et le **pilotage interne**.

Le résultat attendu n’est pas seulement technique : il s’agit de poser une **base de gestion propre**, réutilisable et suffisamment structurée pour servir ensuite à d’autres usages, notamment en matière de communication, de statistiques ou de conformité.

---

## 6. Critères de succès

| # | Critère |
|---|---------|
| 1 | Suppression de la ressaisie systématique des adhésions HelloAsso dans Odoo pour le périmètre « adhésion validée ». |
| 2 | Donnée cohérente entre HelloAsso (source) et Odoo (référentiel interne), avec règles explicites de rapprochement, mise à jour et gestion des doublons. |
| 3 | Traçabilité : lien identifiable entre une adhésion HelloAsso et la fiche Odoo correspondante. |
| 4 | Rattachement correct à la structure concernée (LGZ, RGL, CCC selon les règles retenues). |

---

## 7. Orientation de travail

La suite du travail devra formaliser :

* les **données à synchroniser** ;
* les **règles de création, rapprochement, fusion et mise à jour** ;
* le **mode de rattachement** à la bonne structure ;
* le **mode de synchronisation** retenu ;
* les **modalités techniques** d’échange ;
* les principes de **traçabilité**, de **journalisation** et de **reprise** en cas d’erreur.

Cette note de big picture fixe la **direction générale** ; une **spécification fonctionnelle et technique** détaillée viendra ensuite.

---

## 8. Enjeu de structuration

Ce sujet dépasse le simple confort de saisie.

En pratique, il s’agit de faire d’Odoo un **point d’appui fiable** pour la gestion interne, sans remettre en cause l’usage naturel de HelloAsso côté adhérent.

La valeur recherchée est double :

* **fluidifier** le fonctionnement en supprimant les ressaisies ;
* **structurer** la donnée adhérent pour qu’elle puisse être suivie, filtrée, consolidée et exploitée dans le temps.

Ce premier lot doit donc être pensé comme une **brique de structuration**, et non comme un simple import technique.

---

## 9. Questions ouvertes

1. **Objets Odoo cibles** : simple contact, ou également historique / lignes d’adhésion par campagne ou par exercice ?
2. **Organisation multi-associations** : base Odoo commune avec segmentation, ou autre logique de rattachement ?
3. **HelloAsso** : une ou plusieurs structures / formulaires, et selon quelle règle de routage vers LGZ, RGL ou CCC ?
4. **API et gouvernance** : accès API, fréquence de synchronisation, responsabilité des clés et supervision des erreurs.

---

## 10. Synthèse

**HelloAsso** reste le **canal public** d’adhésion.

**Odoo** devient le **référentiel interne** des adhérents pour la gestion.

Un **connecteur** synchronise automatiquement les **adhésions validées** vers Odoo, avec **rattachement** à la bonne structure et **traçabilité** vers HelloAsso.

---

## Liens internes

* [Spécification détaillée — connecteur adhérents (HelloAsso → Odoo)](./SPEC_DOREVIA_HELLOASSO_ADHERENT.md)
* [Note de cadrage projet Odoo (LGZ / RGL / CCC)](../NOTE_CADRAGE_PROJET_ODOO.md)
* [Inventaire modules Odoo — lab LGZ](../instance_odoo.md)
