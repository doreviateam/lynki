# Spécification — Connecteur HelloAsso → Odoo (adhérents)

| | |
|---|---|
| **Version** | 0.3.5 |
| **Date** | Avril 2026 |
| **Statut** | **Prête à arbitrage** — hypothèses de travail posées ; les décisions structurantes restent à valider métier / MOA |
| **Document amont** | [Big Picture HelloAsso → Odoo](./Big_Picture_HelloAsso.md) |
| **Fichier** | `SPEC_DOREVIA_HELLOASSO_ADHERENT.md` — spec Dorevia, connecteur HelloAsso, focus **adhérent** |

**Objectif du document :** fournir une base exploitable pour **arbitrage**, **développement** et **recette**, sans figer prématurément les choix d’architecture ou les décisions métier non encore validées. La spec fixe un vocabulaire sur l’**entrée dans le flux**, clarifie **adhérent / adhésion**, et relie explicitement le périmètre à la [note API HelloAsso](./REF_API_HELLO_ASSO.md) et à l’[ADR](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md) pour les faits techniques consolidés et les décisions figées.

Les **décisions actées** par le métier et la technique (modèle cible, rapprochement figé, routage, **point de vérité** du flux HelloAsso, mode de synchro) sont consignées dans un document court séparé : [ADR — Décisions d’arbitrage HelloAsso ↔ Odoo (adhérents)](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md), pour ne pas alourdir la spec.

---

## 1. Objet de la spécification

Définir le **comportement fonctionnel et technique** du flux **HelloAsso → Odoo** pour l’alimentation des adhérents : données attendues, règles métier, modèle cible dans Odoo, rattachement aux structures, modes d’échange, traçabilité et critères de validation.

Ce document permet de :

* trancher les arbitrages encore ouverts ;
* compléter la **cartographie des données** (API HelloAsso ↔ champs Odoo) ;
* choisir une **architecture** de connecteur ;
* lancer développement, paramétrage et recette.

Le besoin est d’abord **fonctionnel** ; les options techniques (§11) **répondent** à ce besoin et ne se substituent pas aux règles métier.

---

## 2. Contexte et périmètre

### 2.1. Rappel du besoin

Les associations utilisent **HelloAsso** pour les adhésions et renouvellements côté public ; la même information doit être disponible dans **Odoo** pour le suivi interne, sans double saisie ni dérive. Le détail du cadrage (intention, premier lot, critères de succès) est dans le [Big Picture](./Big_Picture_HelloAsso.md).

### 2.2. Premier lot (inclus dans cette spec)

**Entrée dans le flux :** seules les adhésions considérées comme **validées selon la règle métier arrêtée pour HelloAsso** entrent dans le connecteur. Cette règle **devra être explicitement formalisée avec le métier** (équivalence exacte ou non avec un libellé API, prise en compte du paiement, etc.) — l’objectif est de ne pas **présupposer** trop tôt la sémantique précise de l’API tant qu’elle n’est pas consolidée.

| Élément | Description |
|---------|-------------|
| Flux traité | Adhésions **éligibles** au sens ci-dessus (souvent qualifiées « validées » côté métier) |
| Effet attendu | **Création ou mise à jour** des données adhérent dans Odoo |
| Obligatoire | **Rattachement** à la bonne structure (LGZ / RGL / CCC selon règles arrêtées — cf. §8) |
| Obligatoire | **Traçabilité** vers l’origine HelloAsso |

### 2.3. Exclusions temporaires (hors premier lot fonctionnel)

Voir **§12 — Hors périmètre**.

---

## 3. Hypothèses et principes

| Principe | Formulation |
|----------|-------------|
| **Canal public** | HelloAsso reste l’outil d’inscription et de renouvellement côté public ; il n’est pas remplacé par Odoo. |
| **Référentiel interne** | Odoo est le référentiel structuré pour la gestion interne des adhérents. |
| **Périmètre du flux** | Le connecteur traite les **adhésions entrant dans l’état métier « validé »** selon la **règle arrêtée pour HelloAsso**. Les états intermédiaires ou incomplets sont **hors flux du premier lot**, sauf décision explicite contraire. |
| **Traçabilité** | Chaque traitement pertinent est **rattaché** à un identifiant stable côté HelloAsso (adhésion / commande selon le modèle API). |
| **Rejouabilité** | La synchronisation doit être **idempotente** à l’échelle d’une adhésion : un même événement rejoué ne doit pas créer de doublon ni corrompre les données. |
| **Reprise** | En cas d’échec partiel ou total, une **reprise** manuelle ou automatique doit être possible sans ambiguïté (cf. §10 et §11). |

---

## 4. Objets métiers concernés

| Objet métier | Rôle dans le flux |
|--------------|-------------------|
| **Adhérent** | Personne physique (ou morale si cas prévu) porteuse de l’adhésion ; cible principale de la fiche contact dans Odoo. |
| **Adhésion** | Fait métier : souscription validée dans HelloAsso (dates, formule, rattachement, identifiants source) ; **unité de traitement** du connecteur. |
| **Structure de rattachement** | Entité organisationnelle **métier** (ex. LGZ, RGL, CCC) ; se mappe sur la segmentation Odoo (cf. §8). |
| **Référence HelloAsso** | Identifiant(s) et métadonnées pour lier sans ambiguïté une adhésion HelloAsso à l’état synchronisé dans Odoo (cf. §6 et §10). |

**Distinction à ne pas amalgamer :** la **personne adhérente** et l’**acte d’adhésion** ne sont pas interchangeables. La première relève du **référentiel contact** (`res.partner`) ; le second est un **fait métier** qui peut, selon les arbitrages, se traduire par un état sur la fiche, une ligne d’historique, ou les deux (cf. §5). Une fiche partenaire, un statut courant, une adhésion et un historique ne doivent pas être lus comme synonymes sans clarification.

---

## 5. Modèle cible dans Odoo

### 5.1. `res.partner`

Les personnes adhérentes sont représentées au minimum par un **`res.partner`** (type personne). Les **champs standards** Odoo couvrent identité, coordonnées et adresse selon les usages du projet.

### 5.2. Champs standards (indicatif)

Nom, prénom (cf. `partner_firstname` sur le [lab LGZ](../instance_odoo.md)), e-mail, téléphone, adresse postale, pays, etc. — la liste exacte dépend des champs effectivement alimentés par HelloAsso et des choix de saisie obligatoire côté Odoo.

### 5.3. Champs complémentaires éventuels

| Zone | Exemple | Module / remarque |
|------|---------|-------------------|
| Adhérent | Type d’adhérent, statut, consentement | `dorevia_partner_membership_fields` (cf. inventaire lab) |
| Multi-structure | Société visible, droits multi-sociétés | `base_multi_company` si retenu |
| Traçabilité | ID HelloAsso adhésion, URL, horodatage d’import | Extension ou module dédié **à prévoir** |

### 5.4. Besoin ou non d’un objet d’adhésion dédié

| Option | Description | Statut (v0.3) |
|--------|-------------|----------------|
| **A** | **`res.partner`** enrichi (dernière adhésion / état courant reflétés sur la fiche) | **Hypothèse de travail pour le MVP** |
| **B** | **A** + modèle **historique** (une ligne par adhésion / campagne / exercice) | Retenue si le métier confirme un besoin d’historisation |
| **C** | Autre (décrire) | À documenter si pertinent |

**Hypothèse de travail :** démarrer sur **A** pour le MVP, afin de limiter la complexité initiale, **sauf exigence métier explicite** imposant un **historique d’adhésion** dès le premier lot.

Le passage à **B** sera retenu si le métier confirme un besoin d’**historisation exploitable** des adhésions (renouvellements, campagnes, statistiques par période, pilotage du cycle d’adhésion). Cet arbitrage conditionne modèle de données, renouvellement, stats et lisibilité métier (cf. §13.1).

---

## 6. Données à synchroniser

Les champs exacts dépendent de l’**API HelloAsso** et des formulaires par structure. La table de correspondance détaillée est à compléter après consolidation API.

### 6.1. Familles de données

| Famille | Contenu typique | Notes |
|---------|-----------------|--------|
| **Identité** | Nom, prénom, éventuellement date de naissance | Clés de rapprochement possibles (§7.1) |
| **Coordonnées** | E-mail, téléphone, adresse | |
| **Type / campagne / formule** | Libellé ou code pour routage et étiquetage métier | Lien avec §8 |
| **Dates** | Date d’adhésion, date correspondant à l’entrée dans l’état métier validé, fin de période si disponible | |
| **Éligibilité** | Preuve que l’adhésion entre dans le flux du §2.2 | Alignée sur la règle métier HelloAsso |
| **Identifiants source** | ID adhésion HelloAsso, identifiants de structure / campagne | Obligatoire pour §10 |
| **Paiement** (optionnel v1) | Montant, moyen | **Hors compta détaillée** ; usage éventuel : information ou filtre |

### 6.2. Table de correspondance HelloAsso → Odoo

Le remplissage de cette table doit rester cohérent avec les arbitrages consignés dans l’[ADR HelloAsso ↔ Odoo (adhérents)](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md) (**v0.3.3**), notamment sur le **point de vérité métier** du flux, les **références stables candidates** (`order.id`, `payment.id` ou clé composée) et les principes de **rattachement**.

Les tableaux ci-dessous intègrent les **premières observations réelles** (sandbox **HelloAsso**, organisation **`testdorevia`**, avril 2026) : prévisualisation API depuis Odoo + saisie back-office HelloAsso. Ils **ne remplacent pas** l’audit des **payloads JSON** (champs exacts, imbrication) ni la règle d’éligibilité §2.2 — à consigner avant gel du mapping.

#### 6.2.1. Contexte et traçabilité

| HelloAsso (objet / champ / API) | Odoo (champ / modèle) | Obligatoire | Transformation | Impact métier | Remarques |
|--------------------------------|------------------------|-------------|------------------|---------------|-----------|
| `organizationSlug` | Paramètres connecteur (`res.config.settings`) | Oui | Aucune | Cible des appels API | Valeur observée sandbox : `testdorevia` |
| `formType` | Contexte technique / routage sync | Oui | Aucune | Périmètre « adhésion » | Valeur observée : `Membership` |
| `formSlug` | `helloasso_source_form` sur `res.partner` (ou équivalent) | Oui | Aucune | Rattachement au formulaire source | Valeur observée : `adhesiontestdoreviaglz` |
| Commande — identifiant stable (ex. `id` ressource order) | Traçabilité / idempotence (champ dédié ou log) | À arbitrer | Cast texte si besoin | Candidat **point de vérité** | Observé via prévisualisation API : `82771` |
| Paiement — identifiant stable (ex. `id` ressource payment) | Traçabilité / idempotence | À arbitrer | Cast texte si besoin | Candidat **point de vérité** | Observé : `53022` |

#### 6.2.2. Données adhérent (alignement Odoo)

| HelloAsso (origine / champ) | Odoo (champ / modèle) | Obligatoire | Transformation | Impact métier | Remarques |
|----------------------------|------------------------|-------------|------------------|---------------|-----------|
| Nom | `res.partner` — nom de famille / champ nom | Oui | Normalisation légère | Identification | Ex. observé : `Norab` |
| Prénom | `res.partner.firstname` | Oui | Normalisation légère | Identification | Ex. observé : `Daniel` |
| E-mail | `res.partner.email` | Oui | `lower` / `trim` | Rapprochement | Ex. observé : `daniel@norab.fr` |
| Date d’adhésion / date commande | Champ métier ou traçabilité | Oui | Format date | Suivi | Ex. observé : `03/04/2026` |
| Libellé tarif / formule | Remarque, étiquette ou champ technique | Non | Texte | Contexte | Ex. observé : `AdhésionTest` |
| Montant | Information de contexte (hors compta détaillée sauf arbitrage) | Non | Numérique | Contrôle / lecture | Ex. observé : `10 €` |
| Statut HelloAsso (ex. back-office) | `helloasso_sync_status` ou journal | Non | Mapping métier à définir | Suivi | Ex. observé : `Hors-ligne` — lien API / éligibilité §2.2 à confirmer |

#### 6.2.3. Suite attendue avant gel

* Payloads JSON **commande** et **paiement** (noms de champs officiels, objets liés).
* Règle d’**éligibilité** alignée sur les statuts HelloAsso et l’ADR §4.
* Confirmation **LGZ / RGL / CCC** pour la production (§8) — le sandbox ci-dessus ne suffit pas à figer le routage multi-structures.

---

## 7. Règles fonctionnelles

| Règle | Comportement attendu |
|-------|----------------------|
| **Création** | Si aucun adhérent Odoo ne correspond aux critères de rapprochement, **créer** une fiche `res.partner` (et lignes associées si modèle **B** retenu). |
| **Mise à jour** | Si un adhérent est **identifié sans ambiguïté**, **mettre à jour** les champs concernés selon la politique de fusion (écrasement vs. préservation des champs modifiés à la main dans Odoo — **à arbitrer** avec le métier). |
| **Rapprochement** | Utiliser une **hiérarchie explicite de critères**, **définie et documentée avant développement** (cf. §7.1). L’objectif est d’identifier de manière fiable une personne existante **sans** générer de doublons ni d’écrasements injustifiés. |
| **Doublons** | Éviter la création de fiches en double ; en cas de doute, **journaliser** et orienter vers traitement manuel ou règle métier documentée. |
| **Renouvellement** | Une nouvelle adhésion éligible pour une **même personne** met à jour la fiche existante et, si **B** est retenu, crée ou met à jour une **ligne d’historique** d’adhésion. |
| **Changement de structure** | Si l’adhésion HelloAsso indique un autre rattachement, appliquer la règle §8 et tracer l’événement. |

### 7.1. Proposition de hiérarchie de rapprochement (v0.3 — à valider)

Ordre **indicatif** pour discussion ; l’implémentation devra respecter la version **figée** par le métier.

| Rang | Critère | Commentaire |
|------|---------|---------------|
| 1 | **Identifiant HelloAsso déjà lié au partenaire** | Si une adhésion précédente a stocké l’ID côté `res.partner` (ou équivalent), rapprochement **sans ambiguïté**. |
| 2 | **Adresse e-mail normalisée** | Souvent discriminante ; traiter les variantes (casse, espaces) selon règle commune. |
| 3 | **Nom + prénom + date de naissance** | Si disponibles côté HelloAsso et Odoo ; attention aux homonymes. |
| 4 | **Cas non résolu** | Ne pas créer de doublon à l’aveugle : **file d’attente** / **traitement manuel** / règle métier explicite. |

Cette stratégie est l’un des **trois arbitrages structurants** avec le modèle Odoo (§5.4) et le routage (§8).

---

## 8. Rattachement à la bonne structure

### 8.1. Entités métier

Le périmètre projet couvre notamment **LGZ**, **RGL**, **CCC** (cf. [cadre projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md)). La manière dont elles apparaissent dans Odoo (sociétés, équipes, étiquettes, champs dédiés) est **à figer**.

### 8.2. Proposition de méthode de routage (v0.3 — à compléter par le métier)

Sans préjuger des réalités HelloAsso de chaque association, la spec propose la **méthode** suivante pour aboutir à une règle déterministe :

1. **Inventaire côté HelloAsso** : structures, formulaires d’adhésion, campagnes ou champs permettant de distinguer LGZ, RGL, CCC (et le cas CCC : rattaché à LGZ ou entité distincte).
2. **Table de correspondance** : à produire avec le métier — par exemple `(identifiant structure HelloAsso | identifiant de formulaire | code campagne) → { LGZ \| RGL \| CCC }` avec règles de **priorité** si plusieurs signaux coexistent.
3. **Traduction Odoo** : une fois la cible métier connue, mapper vers la **segmentation Odoo** retenue (§8.3).

| Question | Réponse à compléter |
|----------|---------------------|
| HelloAsso distingue-t-il les flux par **structure**, **formulaire**, **campagne** ou autre ? | |
| Table de correspondance effective **LGZ / RGL / CCC** | |
| **CCC** : entité Odoo distincte ou segment sous LGZ ? | |

### 8.3. Règles de segmentation Odoo

| Option | Description | À trancher |
|--------|-------------|------------|
| Base **unique** multi-sociétés | `company_id` / droits `company_ids` | ☐ |
| **Tags** / catégories partenaire | Filtrage et listes | ☐ |
| **Équipes** / sales team | Si pertinent pour le métier | ☐ |
| Autre | | ☐ |

---

## 9. Scénarios de synchronisation

| Scénario | Comportement attendu |
|----------|----------------------|
| **Nouvel adhérent** | Aucune fiche correspondante : création complète, rattachement §8, enregistrement des identifiants §10. |
| **Adhérent existant** | Fiche trouvée : mise à jour ciblée, pas de second partenaire pour la même personne. |
| **Renouvellement** | Nouvelle adhésion éligible : mise à jour + historique si **B** (§5.4). |
| **Erreur partielle** | Ex. champ obligatoire Odoo non fourni par HelloAsso : **ne pas** laisser la fiche dans un état incohérent ; journaliser ; permettre reprise après correction ou paramétrage. |
| **Adhésion non exploitable** | Non éligible au §2.2, données insuffisantes, structure non mappée : **ignorer** ou **mettre en attente** selon règle produit ; toujours **journaliser**. |

---

## 10. Traçabilité et journalisation

La traçabilité **métier** (champs visibles sur la fiche, identifiants source) et le **journal technique** (diagnostic, reprise, support) sont complémentaires : l’un ne remplace pas l’autre.

| Élément | Exigence |
|---------|----------|
| **Identifiant source** | Stocker l’identifiant stable HelloAsso de l’**adhésion** traitée, ainsi que tout identifiant complémentaire utile au **diagnostic** ou au **rapprochement** (structure, campagne, etc.). |
| **Date de synchro** | Horodatage du dernier traitement réussi pour cette adhésion (ou équivalent métier). |
| **Statut de traitement** | Conserver un état permettant de distinguer au minimum : traitement **réussi**, **en attente de reprise**, **erreur**. |
| **Journal technique** | Conserver des éléments exploitables pour **diagnostic**, **reprise** et **support**, sans dépendre uniquement des champs métier visibles dans Odoo. |
| **Erreurs** | Message exploitable (code, libellé, informations minimales utiles) pour le diagnostic. |
| **Reprise** | Possibilité de **rejouer** un lot ou une adhésion sans effet de bord dupliqué (idempotence). |

---

## 11. Mode d’échange technique

Les modalités ci-dessous **encadrent** le choix d’architecture ; elles ne figent pas un produit ou un protocole tant que l’arbitrage technique n’est pas acté.

### 11.0. Hypothèse d’exploitation de l’API HelloAsso

La spec s’appuie sur une **note interne** qui consolide la documentation officielle HelloAsso utile au connecteur (API v5, OAuth 2.0, **formulaires**, endpoint **`formTypes`**, commandes, paiements, notifications, retries webhooks) : [REF_API_HELLO_ASSO.md](./REF_API_HELLO_ASSO.md).

* **Valeurs de `formType` :** les objectiver sur **compte réel** en interrogeant d’abord le point de terminaison **`formTypes`** (cf. note §2.4) — ne pas figer une chaîne sans preuve terrain.
* **Jetons OAuth :** respecter le cycle **access / refresh** et les interdictions documentées (ex. ne pas enchaîner les `client_credentials` à la place du refresh).
* **Notifications :** concevoir le traitement comme **idempotent par événement métier** reçu, compte tenu des **retries** HelloAsso si la réponse n’est pas HTTP 200 (cf. note §3.4).
* **Point de vérité métier** retenu pour décider qu’une adhésion doit être synchronisée : **commande**, **paiement**, ou **combinaison** de plusieurs objets HelloAsso. La doc technique **ne suffit pas** à le trancher seule — décision à **figer dans l’ADR** ([§4](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md)), en cohérence avec le §5.1 de cette spec et la note REF.

### 11.1. API / webhook / batch

| Mode | Description |
|------|-------------|
| **Batch planifié** | Job récurrent interroge l’API HelloAsso pour les adhésions **éligibles** depuis le dernier point de reprise. |
| **Webhook** (si offert et retenu) | Réception d’un événement → mise en file de traitement (ex. `queue_job`). |
| **Hybride** | Webhook pour réactivité + batch de réconciliation. |

Le choix dépend de la **documentation API HelloAsso** (version à référencer), des **quotas** et de l’**hébergement** Dorevia.

### 11.2. Sécurité

Secrets (clés API HelloAsso, accès vers Odoo) **hors code en clair** ; rotation possible ; pas de secrets commités dans le dépôt.

### 11.3. Fréquence

À définir selon volumétrie et contraintes API (ex. planification, déclenchement).

### 11.4. Reprise sur incident

Traitements **idempotents** ; journal des échecs ; relance manuelle ou automatique des lots en erreur.

### 11.5. Options d’implémentation Dorevia

| Option | Idée |
|--------|------|
| **1** | Module Odoo dédié : planification / **`queue_job`** pour appels vers HelloAsso — cf. [inventaire lab](../instance_odoo.md) |
| **2** | Service externe (worker, orchestrateur) écrivant dans Odoo via les **interfaces d’intégration Odoo retenues pour le projet** (à préciser au choix d’architecture : pas d’hypothèse de protocole figée ici). |
| **3** | Événement entrant (ex. webhook) → file → **queue_job** Odoo |

**Documentation HelloAsso :** consigner dans le projet la **référence exacte** utilisée (URL de la doc développeur, version ou date d’accès, périmètre des endpoints retenus). Ne pas s’appuyer sur un **lien générique** de site public à la place d’une doc technique validée.

---

## 12. Hors périmètre

Les éléments suivants ne sont **pas** couverts par cette spécification dans sa version actuelle (sauf extension ultérieure explicite) :

* **Dons** hors logique adhésion ;
* **Billetterie** ;
* **Campagnes** ne relevant pas des adhésions au sens du premier lot ;
* **Comptabilité détaillée** (écritures, lettrage, export comptable) ;
* Intégration **Pennylane** ou autre outil comptable ;
* Remplacement de HelloAsso comme canal public.

---

## 13. Questions ouvertes et arbitrages

### 13.1. Arbitrages structurants

Ces quatre sujets **conditionnent** le démarrage du développement et de la recette. La spec y apporte des **hypothèses** (§5.4, §7.1, §8.2, §11.0) à **confirmer, ajuster ou écarter** explicitement ; les décisions actées vont dans l’[ADR](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md).

| # | Sujet | État (spec) |
|---|--------|-------------|
| **1** | **Modèle Odoo** : **`res.partner` seul (A)** vs **`res.partner` + historique (B)** | Hypothèse MVP : **A** ; **B** si besoin métier d’historisation |
| **2** | **Routage LGZ / RGL / CCC** et segmentation Odoo | Méthode proposée §8.2 ; **table de correspondance** à produire avec le métier |
| **3** | **Stratégie de rapprochement** (fiabilité, doublons) | Hiérarchie proposée §7.1 ; à **figer** avant développement |
| **4** | **Point de vérité métier** du flux (objet HelloAsso de référence) | À figer dans l’[ADR §4](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md) : commande, paiement ou combinaison ; cf. §5.1, §11.0 |

### 13.2. Arbitrages complémentaires

| # | Sujet | Commentaire |
|---|--------|-------------|
| 1 | **Règles de fusion** : quels champs HelloAsso **écrasent** Odoo, lesquels sont préservés si modifiés en interne | À documenter avec le métier |
| 2 | **Gouvernance API** : comptes, clés, responsables, supervision des erreurs | Associations + Dorevia |
| 3 | **Règle métier d’éligibilité** au flux (équivalence avec les statuts HelloAsso) | À écrire avec le métier (cf. §2.2) |
| 4 | Champs **réels** de l’API HelloAsso pour les formulaires concernés | Consolidation technique → §6.2 |

---

## 14. Critères d’acceptation

| ID | Critère |
|----|---------|
| CA-01 | **Plus de ressaisie systématique** : une adhésion **éligible** au sens §2.2 déclenche la création ou la mise à jour adéquate dans Odoo sans saisie manuelle dupliquée pour le cœur du périmètre. |
| CA-02 | **Cohérence des données** : les champs convenus sont alignés entre source et Odoo dans les limites des données disponibles côté HelloAsso. |
| CA-03 | **Rattachement correct** : l’adhérent est associé à la **bonne structure** (LGZ / RGL / CCC) selon les règles arrêtées en §8. |
| CA-04 | **Traçabilité disponible** : pour une adhésion traitée, on peut retrouver l’**identifiant source** et le **contexte** de synchronisation (cf. §10). |
| CA-05 | **Robustesse** : scénarios §9 (erreur partielle, non exploitable) se comportent comme décrit ; reprise possible sans doublons fantômes. |

### Jeux de recette (indicatifs)

| # | Scénario | Résultat attendu |
|---|----------|------------------|
| R1 | Première adhésion éligible | Fiche créée, champs remplis, référence HelloAsso stockée |
| R2 | Deuxième adhésion (même personne, renouvellement) | Comportement conforme §7 |
| R3 | Données incomplètes côté HelloAsso | Journal ; pas de corruption de fiche existante |
| R4 | Rattachement multi-structures | Bonne segmentation Odoo selon §8 |

---

## Annexe — Livrables projet

| Livrable | Responsable | Statut |
|----------|-------------|--------|
| Arbitrages §5.4, §7.1, §8, §13.1–13.2 (voir aussi [ADR](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md)) | MOA associations | ☐ |
| Règle écrite d’éligibilité HelloAsso (§2.2) | MOA + tech | ☐ |
| Table §6.2 (correspondance API) | Tech / AMOA | **Partiel** (sandbox — à compléter payloads + prod) |
| Module ou service connecteur | Développement | ☐ |
| Recette §14 | AMOA + métier | ☐ |
| Documentation d’exploitation (clés, logs, reprise) | Tech | ☐ |

---

## Historique des versions du document

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Première version : squelette aligné sur Big Picture v0.2 |
| 0.2 | Avril 2026 | Trame complète en 14 sections + annexe livrables |
| 0.3 | Avril 2026 | Spec **prête à arbitrage** : vocabulaire d’entrée dans le flux, distinction adhérent / adhésion, hypothèses MVP et rapprochement (§7.1), méthode de routage (§8.2), traçabilité métier / technique (§10), §11 neutralisé (pas de protocole figé ; doc HelloAsso à référencer proprement) |
| 0.3.1 | Avril 2026 | Micro-retouches §2.2 et §13 ; création du document [ADR](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md) pour les décisions figées hors corps de spec |
| 0.3.2 | Avril 2026 | **§11.0** — Hypothèse d’exploitation de l’API HelloAsso (lien [REF_API](./REF_API_HELLO_ASSO.md), idempotence notifications, renvoi **point de vérité** vers ADR §4) ; en-tête : décision **point de vérité** dans l’ADR ; **§13** : ligne **point de vérité** → ADR §4 |
| 0.3.3 | Avril 2026 | **En-tête** : objectif du document (sans numéro de version figé) ; **§11.0** : formulation **point de vérité** ; **§13** scindé en **13.1** (4 arbitrages structurants) et **13.2** (complémentaires) |
| 0.3.4 | Avril 2026 | **§6.2** : premières lignes de correspondance **terrain** (sandbox `testdorevia`, formulaire `adhesiontestdoreviaglz`, ids commande / paiement et champs adhérent observés) ; **§6.2.3** suite avant gel |
| 0.3.5 | Avril 2026 | **§6.2** : phrase de renvoi explicite vers l’[ADR](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md) **v0.3.3** (point de vérité, références stables, rattachement) |

---

## Liens internes

* [Big Picture HelloAsso → Odoo](./Big_Picture_HelloAsso.md)
* [Référence API HelloAsso — note interne](./REF_API_HELLO_ASSO.md) (alignée sur §11.0)
* [ADR — Décisions d’arbitrage HelloAsso ↔ Odoo (adhérents)](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md)
* [Note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md)
* [Inventaire modules Odoo — lab LGZ](../instance_odoo.md)
