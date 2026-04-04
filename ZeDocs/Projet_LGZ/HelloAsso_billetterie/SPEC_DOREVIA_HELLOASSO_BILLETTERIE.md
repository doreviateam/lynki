# Spécification — Connecteur HelloAsso → Odoo (billetterie)

| | |
|---|---|
| **Version** | 0.1.14 |
| **Date** | Avril 2026 |
| **Statut** | **Brouillon de travail** — hypothèses et périmètre à valider métier / MOA ; arbitrages techniques ouverts |
| **Document amont** | [Big Picture — HelloAsso → Odoo (billetterie)](./The_Big_Picture.md) |
| **Fichier** | `SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md` |

**Objectif du document :** poser une base exploitable pour **arbitrage**, **développement** et **recette** du flux billetterie, sans figer prématurément le mapping API ni les modèles Odoo tant qu’ils ne sont pas validés. La spec distingue **billetterie** et **adhérent**, fixe un **vocabulaire métier** et s’appuie sur l’[ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) pour les **décisions structurantes** (provisoires jusqu’à validation métier).

**Renvoi projet LGZ — adhérent :** le connecteur [adhérents](../HelloAsso_adhérent/SPEC_DOREVIA_HELLOASSO_ADHERENT.md) est un **autre périmètre** ; les règles, objets API et cibles Odoo **ne sont pas** supposés réutilisables tels quels.

---

## 1. Objet de la spécification

Définir le **comportement fonctionnel et technique** du flux **HelloAsso billetterie → Odoo** : données attendues, règles métier, représentation cible dans Odoo, traçabilité, critères de validation et exclusions du premier lot.

Ce document permet de :

* trancher les arbitrages encore ouverts (modèles Odoo, rapprochement payeur / participants, événement miroir) ;
* compléter la **cartographie des données** (API HelloAsso ↔ champs / modèles Odoo) dès que des payloads réels sont consolidés ;
* choisir une **architecture** de connecteur cohérente avec la [note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md) ;
* lancer développement, paramétrage et recette.

---

## 2. Contexte et périmètre

### 2.1. Rappel du besoin

Les associations utilisent **HelloAsso** pour la **vente et la gestion publique** de billets ; les informations utiles au **suivi interne**, à la **relation** et au **pilotage** doivent pouvoir être **structurées dans Odoo** sans double saisie. Le cadrage d’intention est dans la [Big Picture](./The_Big_Picture.md).

**Sens de flux MVP :** pour le MVP billetterie, **HelloAsso reste maître** : la billetterie est **créée et pilotée dans HelloAsso**, puis **synchronisée vers Odoo** pour usage interne (**HelloAsso → Odoo**, et non l’inverse au MVP). Décision motivée et exclusions (pilotage inverse, synchro bidirectionnelle, création billetterie depuis Odoo) : [ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md).

### 2.2. Premier lot (cible de cette spec)

**Principe :** le connecteur traite des **ventes billetterie** considérées comme **éligibles** selon une **règle métier** à formaliser avec le métier (équivalence avec statuts / types d’objets HelloAsso, prise en compte du paiement, etc.).

| Élément | Description |
|---------|-------------|
| Flux traité | Commandes billetterie **éligibles** et données associées (payeur, participants, billets) |
| Effet attendu | **Création ou mise à jour** dans Odoo des représentations utiles (contacts, lien commande, participants, traces HelloAsso) |
| Obligatoire | **Traçabilité** vers l’origine HelloAsso (identifiants stables — cf. §9) |
| Hypothèse de travail | **Commande HelloAsso** comme **ancrage** de traçabilité ; **payeur** comme pivot de rapprochement principal (cf. Big Picture §8) |

### 2.3. Exclusions (hors premier lot fonctionnel sauf décision contraire)

Voir **§11 — Hors périmètre MVP**.

---

## 3. Hypothèses et principes

| Principe | Formulation |
|----------|-------------|
| **Canal public** | HelloAsso reste le canal de vente et d’émission des billets côté public ; Odoo ne le remplace pas. |
| **Référentiel interne** | Odoo capitalise une **représentation interne** exploitable (personnes, commandes, lien événement si retenu). |
| **Objets multiples** | La billetterie engage **commande, payeur, participants, billets, paiement** (cf. Big Picture §6) ; le connecteur ne se réduit pas à « paiement → un seul contact ». |
| **Traçabilité** | Chaque synchronisation pertinente est **rattachée** à des identifiants stables côté HelloAsso (à préciser dans l’ADR : commande, paiement, billet, etc.). |

**Principe structurant :** le connecteur billetterie **ne se réduit pas** à « paiement → un seul contact ».
| **Rejouabilité** | La synchro doit être **idempotente** à l’échelle des unités métier choisies (ex. commande ou équivalent) : rejouer sans doublon ni corruption. |
| **Distinction adhérent** | Aucune réutilisation **implicite** des règles du connecteur **adhérent** sans arbitrage explicite. |

---

## 4. Objets métiers concernés

| Objet métier | Rôle dans le flux |
|--------------|-------------------|
| **Événement / formulaire billetterie** (HelloAsso) | Contexte de vente (lieu, date, libellé) ; peut donner lieu à un **miroir** dans Odoo si arbitré. |
| **Commande** | Unité de vente ; **candidat** à l’**ancrage** de traçabilité et d’idempotence. |
| **Payeur** | Acquéreur ; **candidat** au rapprochement principal avec `res.partner`. |
| **Participant(s)** | Personnes associées aux billets ; peuvent être distinctes du payeur ; à représenter sans ambiguïté (champs, lignes liées ou modèle dédié — **à arbitrer**). |
| **Billet(s)** | Unité d’accès à l’événement ; données utiles au contrôle et au suivi. |
| **Paiement** | Preuve de règlement ; lien avec commande ; **hors compta détaillée** dans le MVP sauf décision contraire. |
| **Don complémentaire** (si présent) | Hors périmètre fonctionnel détaillé en v0.1 sauf arbitrage. |

**Distinction utile :** **payeur** et **participant** ne sont pas interchangeables ; la spec et l’ADR devront trancher leur mapping Odoo.

---

## 5. Modèle cible dans Odoo (hypothèses — à figer dans l’ADR)

### 5.1. `res.partner`

Les **personnes** (payeur, participants) sont en principe représentées par des **`res.partner`**, sous réserve des règles de **rapprochement** et de doublons (§7).

### 5.2. Événement « miroir »

Un **événement Odoo miroir** (ex. module *Événements* / `event.event`, ou autre) est **une option** à valider : utile pour structurer le pilotage et les rapports ; **pas** acté dans cette v0.1 (cf. Big Picture §8).

### 5.3. Commande et lignes

La **commande HelloAsso** peut se traduire par un **document Odoo** (ex. `sale.order`, enregistrement dédié minimal, ou autre) ou par des **champs de traçabilité** sur d’autres objets — **à arbitrer**. L’objectif minimal du MVP est la **lisibilité métier** et la **traçabilité**, pas la reproduction complète du panier HelloAsso.

### 5.4. Tableau d’arbitrages à trancher (synthèse)

| Sujet | Options / question | Statut (v0.1) |
|-------|-------------------|-------------|
| Point de vérité idempotence | Commande vs paiement vs clé composée | **Ouvert** |
| Événement Odoo miroir | Oui / non / plus tard | **Ouvert** |
| Représentation des billets | Champs liés vs lignes vs modèle dédié | **Ouvert** |
| Participants ≠ payeur | Modélisation explicite | **Ouvert** |

Détail des **décisions provisoires** sur ces sujets : [ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) (§1 à §4).

### 5.5. Position de travail MVP (v0.1)

À ce stade, le MVP est orienté vers :

- la **commande HelloAsso** comme ancrage de traçabilité ;
- le **payeur** comme pivot principal de rapprochement ;
- les **participants** comme données métier explicites à conserver ;
- **sans obligation**, à ce stade, de créer un **modèle événementiel miroir complet** dans Odoo.

L’**ADR billetterie** devra trancher ce qui est **obligatoire en MVP** et ce qui est **prévu mais repoussé** (participants riches, événement miroir, lignes / modèles dédiés, etc.) pour éviter une latitude excessive côté développement.

---

## 6. Données à synchroniser

### 6.1. Familles de données (indicatif)

Les champs exacts dépendent de l’**API HelloAsso** et des formulaires billetterie. La table de correspondance détaillée sera complétée après **observation terrain / sandbox** et arbitrage ADR.

| Famille | Contenu typique | Notes |
|---------|-----------------|--------|
| **Identité** | Nom, prénom des payeurs et participants | Clés de rapprochement possibles (§7) |
| **Coordonnées** | E-mail, téléphone | |
| **Commande** | Identifiants HelloAsso, montants, statut, dates | Ancrage traçabilité |
| **Billets / places** | Libellés, quantités, liens participants | |
| **Paiement** | Montant, moyen, date | **Hors compta détaillée** MVP sauf arbitrage |
| **Événement** | Libellé, dates, lieu si disponibles | Lien avec miroir Odoo si retenu |
| **Identifiants source** | IDs API stables | Obligatoire pour §9 |

### 6.2. Table de correspondance HelloAsso → Odoo

À compléter : **aucune ligne terrain** n’est gelée dans cette v0.1. Prérequis avant gel :

* payloads JSON **commande**, **paiement**, **billets** (noms de champs officiels) ;
* règle d’**éligibilité** alignée sur le métier ;
* décisions **§5.4** et ADR billetterie.

---

## 7. Règles fonctionnelles et rapprochement

| Règle | Comportement attendu |
|-------|----------------------|
| **Création** | Si aucun partenaire ne correspond aux critères de rapprochement, **créer** les fiches nécessaires (payeur, participants selon arbitrage). |
| **Mise à jour** | Si identifié **sans ambiguïté**, **mettre à jour** selon politique de fusion (écrasement vs préservation des champs modifiés à la main — **à arbitrer**). |
| **Doublons** | Éviter les doubles fiches ; en cas de doute, **journaliser** et traitement manuel ou règle métier documentée. |

### 7.1. Hiérarchie de rapprochement (indicative — à valider)

Ordre **non figé** ; l’ADR billetterie devra en fixer une version.

| Rang | Critère | Commentaire |
|------|---------|-------------|
| 1 | Identifiant HelloAsso **déjà stocké** sur un partenaire ou une ligne liée | Si existant dans le modèle retenu |
| 2 | **E-mail** normalisé (payeur / participant selon contexte) | Souvent discriminante |
| 3 | **Nom + prénom** (+ autres critères si disponibles) | Attention homonymes |
| 4 | Cas non résolu | Journal + file ou traitement manuel |

---

## 8. Rattachement aux structures (LGZ / RGL / CCC)

Le périmètre projet couvre notamment **LGZ**, **RGL**, **CCC** (cf. [note de cadrage](../NOTE_CADRAGE_PROJET_ODOO.md)). La manière de déduire le **rattachement** depuis HelloAsso (formulaire, campagne, slug, etc.) est **à définir avec le métier** et à consigner dans l’ADR.

---

## 9. Traçabilité et journalisation

Chaque exécution de synchro devra pouvoir laisser une trace exploitable (logs applicatifs, champs techniques sur enregistrements Odoo, ou les deux).

| Élément | Exigence |
|---------|----------|
| **Identifiant source** | Stocker au minimum l’identifiant stable HelloAsso retenu pour l’**idempotence** (à figer dans l’ADR). |
| **Horodatage** | Date / heure du dernier traitement pertinent. |
| **Statut** | Succès / partiel / erreur. |
| **Journal technique** | Message exploitable pour **diagnostic** et **reprise**. |

Les **identifiants HelloAsso** concernés, le **statut** et les **messages** doivent rester **compréhensibles** pour l’exploitation.

---

## 10. Modes de synchronisation (principe)

En cohérence avec le projet LGZ et la [Big Picture](./The_Big_Picture.md) :

| Palier | Mode | Remarque |
|--------|------|----------|
| 1 | Déclenchement **manuel** (bouton / action) | Validation MVP |
| 2 | **`ir.cron`** (action planifiée) | Automatisation simple |
| 3 | **`queue_job`** (ou équivalent) | **Uniquement** si volumétrie, durée ou file d’attente le justifient |

Le détail d’implémentation (module Odoo, paramètres) sera documenté avec le code ; une **note d’automatisation** pourra compléter la recette.

---

## 11. Hors périmètre MVP (rappel)

* Remplacer la vente HelloAsso ou en faire le front-office.
* Synchro **bidirectionnelle** complète.
* Reconstruction de la **comptabilité** des encaissements.
* **Annulations**, **remboursements**, litiges — sauf périmètre explicitement rouvert.
* Parité fonctionnelle avec tout l’écosystème billetterie HelloAsso (cf. Big Picture §9).

---

## 12. Critères d’acceptation (indicatifs)

À détailler dans la **recette MVP** ; à ce stade :

| ID | Critère |
|----|---------|
| CA-B01 | Une commande éligible **sandbox** produit une **traçabilité** identifiable dans Odoo avec identifiants source. |
| CA-B02 | **Payeur** et **participants** sont distingués **si** les données source le permettent et que l’arbitrage le prévoit. |
| CA-B03 | **Rejouabilité** : une même commande resynchronisée ne crée pas de doublons intempestifs sur les objets cibles retenus. |
| CA-B04 | Les **exclusions** §11 sont respectées sauf décision documentée. |

---

## 13. Livrables et suite documentaire

| Livrable | Statut (v0.1) |
|----------|----------------|
| [Big Picture](./The_Big_Picture.md) | Publiée (v0.2.16) |
| **Cette SPEC** | v0.1.14 — brouillon |
| **ADR billetterie** | [ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) — v0.1.3 provisoire |
| **Recette MVP billetterie** | [RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) — v0.1.2 |
| **Note API** (si utile) | À renouveler ou dupliquer depuis le contexte adhérent **sans** confondre périmètres |
| Module / connecteur Odoo | Hors périmètre de ce document |
| **Plan d’implémentation Scrum-like** | [PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) — v0.1.7 |
| **Trame exécution Ticket 1** | [TICKET1_AUDIT_PAYLOADS.md](./TICKET1_AUDIT_PAYLOADS.md) — audit payloads / mapping |

---

## 14. Liens internes

* [Big Picture — billetterie](./The_Big_Picture.md)
* [SPEC — adhérents](../HelloAsso_adhérent/SPEC_DOREVIA_HELLOASSO_ADHERENT.md) *(périmètre distinct)*
* [Note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md)
* [ADR — arbitrages billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md)
* [Recette MVP billetterie (compact)](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md)
* [Plan d’implémentation Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md)
* [Ticket 1 — trame audit payloads](./TICKET1_AUDIT_PAYLOADS.md)

---

## Historique des versions

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Première version — structure spec, objets métiers, hypothèses Odoo, arbitrages ouverts, renvois Big Picture et projet adhérent |
| 0.1.1 | Avril 2026 | §2.2 — flux traité resserré ; §5.1 — payeur vs participants ; §5.5 — position MVP ; §9 — tableau d’exigences ; §12 — coquille ; principe structurant explicite §3 ; livrables §13 |
| 0.1.2 | Avril 2026 | Lien [ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) v0.1 ; intro et §13–14 ; Big Picture v0.2.3 |
| 0.1.3 | Avril 2026 | Renvoi ADR v0.1.1 (micro-retouches éditoriales) |
| 0.1.4 | Avril 2026 | [Recette MVP billetterie](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) v0.1 ; §13–14 ; Big Picture v0.2.6 ; ADR v0.1.2 (renvoi recette) |
| 0.1.5 | Avril 2026 | Recette v0.1.1 (micro-retouches) ; Big Picture v0.2.7 |
| 0.1.6 | Avril 2026 | [Plan Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1 ; §13–14 ; Big Picture v0.2.8 |
| 0.1.7 | Avril 2026 | Plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.1 ; §13 ; Big Picture v0.2.9 |
| 0.1.8 | Avril 2026 | Plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.2 (mode exécution, Ticket 1) ; §13 ; Big Picture v0.2.10 |
| 0.1.9 | Avril 2026 | Plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.3 (Ticket 1 — artefacts, clôture) ; §13 ; Big Picture v0.2.11 |
| 0.1.10 | Avril 2026 | Plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.4 (Ticket 1 — mini-lot, phrase pilotage) ; §13 ; Big Picture v0.2.12 |
| 0.1.11 | Avril 2026 | Plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.5 (Ticket 1 — maturité, fin doc) ; §13 ; Big Picture v0.2.13 |
| 0.1.12 | Avril 2026 | Plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.6 (cap matière réelle, fin sur-préparation) ; §13 ; Big Picture v0.2.14 |
| 0.1.13 | Avril 2026 | Plan [Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md) v0.1.7 + [trame Ticket 1](./TICKET1_AUDIT_PAYLOADS.md) ; §13–14 ; Big Picture v0.2.15 |
| 0.1.14 | Avril 2026 | §2.1 — sens de flux MVP (**HelloAsso → Odoo**) ; ADR v0.1.3 ; Big Picture v0.2.16 |

---
