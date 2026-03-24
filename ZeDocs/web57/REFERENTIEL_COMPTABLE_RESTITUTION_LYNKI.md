# Référentiel comptable de restitution — Lynki

**Fichier de référence unique** dans `ZeDocs/web57/` — les évolutions se suivent via le **numéro de version** ci-dessous (pas de suffixe `_v1.x` dans le nom de fichier).

**Version :** 1.1 — mars 2026  
**Révisions v1.1 :** netting tiers (§12.6), règle transverse d’ancienneté (§6.6), journaux inclus / exceptions (§5.6), preuve de version (§3.5, §18.5), harmonisation vocabulaire « écritures postées / validées… », annexe recette §19.3.  
**Statut :** Référentiel de base FR / PCG — à valider puis enrichir par tenant / client  
**Objet :** formaliser les règles de transformation entre la comptabilité source et les **restitutions comptables Lynki**  
**Références :**
- [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) v2.2
- [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) v1.2

---

## 1. Objet et périmètre

Le présent document définit le **référentiel comptable de restitution** utilisé par Lynki pour produire des restitutions fiables, explicables et rejouables à partir d'une comptabilité source.

Il précise notamment :

- les **règles d'éligibilité** des écritures ;
- les **principes de normalisation** des données comptables source ;
- les **conventions de signe**, de devise et d'arrondi ;
- le **mapping par défaut PCG FR → rubriques Lynki** ;
- les règles de calcul des restitutions suivantes :
  - **Structure financière / Bilan** ;
  - **Performance comptable / Compte de résultat** ;
  - **Balance âgée clients** ;
  - **Balance âgée fournisseurs** ;
  - **Balance générale** ;
  - **Grand livre** ;
- les **règles de réconciliation** entre ces restitutions ;
- les **cas limites** et exceptions documentées.

Ce document constitue la **référence métier et technique** permettant de passer :

> des comptes, écritures, partenaires et journaux du système source  
> aux rubriques et vues comptables Lynki.

### 1.1 Périmètre fonctionnel

Le présent référentiel couvre les **restitutions comptables structurantes** du socle Lynki.  
Il ne couvre pas, à ce stade, les autres KPIs de pilotage du noyau Lynki (trésorerie opérationnelle, flux business, etc.), sauf lorsqu'une règle de réconciliation avec la comptabilité est explicitement mentionnée.

### 1.2 Périmètre géographique et comptable

Cette v1.0 est construite pour un **socle français** compatible avec le **Plan Comptable Général (PCG)**.

Elle doit être comprise comme :

- un **modèle de base FR** ;
- à **adapter ou surcharger** par client / tenant lorsque le dossier comptable le nécessite ;
- sans remise en cause du principe d'**ERP agnostique** de Lynki.

### 1.3 Limites de la v1.0

Cette version :

- définit un **référentiel de base exploitable** ;
- ne prétend pas remplacer un manuel comptable exhaustif ;
- suppose une **validation métier** par dossier, notamment pour :
  - les regroupements comptables particuliers,
  - les règles de consolidation,
  - les traitements multi-devises,
  - les exceptions sectorielles,
  - les retraitements spécifiques décidés par le client ou son conseil.

---

## 2. Documents liés et articulation documentaire

Le dispositif documentaire Lynki Finance repose sur trois niveaux complémentaires :

### 2.1 CDC master

Le **CDC master** décrit :

- la vision produit ;
- le périmètre fonctionnel ;
- les exigences ;
- la chaîne de preuve ;
- les critères d'acceptation.

### 2.2 Dictionnaire des restitutions

Le **dictionnaire des restitutions comptables** décrit :

- les six restitutions du socle ;
- leur rôle ;
- leurs champs obligatoires ;
- les règles de période, signe, droits, drill-down et réconciliation attendue.

### 2.3 Référentiel comptable de restitution

Le présent document décrit :

- les **règles concrètes de mapping et de calcul** ;
- les **comptes ou groupes de comptes** mobilisés ;
- les **règles d'inclusion / exclusion** ;
- les **formules métier** des rubriques ;
- les **règles de réconciliation** entre vues.

### 2.4 Ordre de priorité documentaire

En cas de divergence apparente, l'ordre d'interprétation est le suivant :

1. **Décision métier / arbitrage documenté sur le dossier client** ;
2. **Référentiel comptable de restitution** ;
3. **Dictionnaire des restitutions comptables** ;
4. **CDC master**.

Si un arbitrage client déroge au présent référentiel, cette dérogation doit être :

- explicitement documentée ;
- versionnée ;
- rattachée à un environnement et à une date d'effet.

---

## 3. Principes généraux du référentiel

### 3.1 Finalité

Lynki n'a pas pour finalité de reproduire à l'identique l'interface du logiciel comptable source.  
Sa finalité est de fournir :

- une **lecture structurée** ;
- une **explicabilité** ;
- une **réconciliation possible** ;
- une **chaîne de preuve sans rupture logique**.

### 3.2 Principe de vérité comptable

Pour les restitutions comptables, Lynki repose sur la **vérité comptable du dossier** :

- écritures postées / validées selon la terminologie du système source ;
- périmètre comptable sélectionné ;
- règles documentées de mapping ;
- exclusions et exceptions tracées.

### 3.3 Principe d'abstraction ERP

Les règles du référentiel ne dépendent pas conceptuellement d'un ERP unique.  
Les connecteurs doivent traduire les données source vers un **modèle canonique Lynki**, puis appliquer le présent référentiel.

### 3.4 Principe de traçabilité

Toute restitution doit pouvoir être expliquée par :

- la version du référentiel utilisée ;
- le périmètre sélectionné ;
- la période ;
- les règles de regroupement ;
- les conventions de signe ;
- les écritures ou postes retenus.

### 3.5 Preuve de version du référentiel (rejouabilité)

Toute **restitution comptable Lynki** doit pouvoir **exposer** (interface, export, métadonnées) et/ou **journaliser** (logs techniques, traçabilité d’ingestion) l’**identifiant de version** du référentiel comptable et du mapping effectivement utilisés pour le calcul (ex. `lynki.mapping.accounting@1.0.0`, hash de surcharges tenant).

Sans cette preuve, la **rejouabilité** et le contrôle de cohérence dans le temps ne sont pas garantis.

---

## 4. Modèle canonique minimal de données comptables

Le référentiel suppose qu'après ingestion, Lynki manipule un noyau canonique minimal permettant de raisonner indépendamment de l'ERP source.

### 4.1 Objets canoniques principaux

| Objet | Description minimale attendue |
|---|---|
| **Écriture / ligne d'écriture** | identifiant stable, date comptable, journal, compte, débit, crédit, devise, partenaire éventuel, statut, pièce source |
| **Compte comptable** | code, libellé, type / groupe si disponible, société, devise de tenue si applicable |
| **Journal** | code, libellé, nature si disponible |
| **Partenaire** | identifiant, nom, rôle (client / fournisseur / autre), société / périmètre |
| **Poste ouvert** | partenaire, compte, échéance, solde ouvert, devise, statut de lettrage / rapprochement |
| **Périmètre** | tenant, société, établissement, consolidation, devise de présentation |
| **Version de référentiel** | identifiant versionné du mapping et des règles utilisées |

### 4.2 Champs transverses indispensables

Chaque ligne comptable ou agrégat utilisé dans Lynki doit pouvoir être rattaché aux attributs suivants :

- identifiant technique stable ;
- source système ;
- date comptable ;
- société ;
- compte ;
- journal ;
- devise ;
- montant débit ;
- montant crédit ;
- partenaire si applicable ;
- statut canonique de l'écriture ;
- indicateur d'éligibilité pour restitution.

---

## 5. Éligibilité des écritures et normalisation du statut

### 5.1 Règle de base

Toutes les restitutions comptables Lynki s'appuient sur des **écritures postées / validées selon la terminologie du système source**.

> **Formule de référence (document) :** utiliser de préférence cette formulation complète partout où l’éligibilité des écritures est évoquée (y compris en synthèse ou en tableau), pour éviter les ambiguïtés entre environnements.

La couche d'ingestion normalise les statuts source vers un **statut canonique Lynki**.

### 5.2 Brouillons

Les écritures au statut **brouillon** sont **exclues** de toutes les restitutions comptables Lynki, sauf mention explicite contraire dans :

- un environnement de simulation ;
- un environnement de prévisualisation ;
- un mode de travail spécifique documenté hors production.

### 5.3 Écritures annulées ou neutralisées

Les écritures annulées, extournées ou neutralisées suivent les règles suivantes :

- si elles restent comptablement présentes et postées, elles sont traitées selon leur **réalité comptable source** ;
- si elles sont compensées par une écriture inverse, l'effet apparaît naturellement dans les agrégats ;
- toute règle d'exclusion spécifique doit être **documentée**.

### 5.4 Écritures d'ouverture et d'à-nouveaux

Les écritures d'ouverture et d'à-nouveaux :

- sont **prises en compte** pour les restitutions à date et les soldes d'ouverture ;
- sont **exclues des mouvements de période** du compte de résultat, sauf règle contraire du dossier explicitement documentée ;
- doivent être identifiables via le journal, le type d'écriture ou une règle d'ingestion équivalente.

### 5.5 Écritures de clôture

Les écritures de clôture sont incluses ou exclues selon la nature de la restitution :

- **bilan à date** : incluses si elles affectent la situation à la date ;
- **compte de résultat** : incluses si elles appartiennent à la période et à la logique de clôture retenue ;
- **balance générale** : incluses selon la définition retenue pour l'exercice ;
- toute règle de retraitement spécifique doit être documentée.

### 5.6 Journaux : inclusion par défaut et exceptions typiques

**Principe :** sauf règle contraire **documentée** sur le dossier ou le tenant, **tous les journaux comptables** portant des **écritures postées / validées selon la terminologie du système source** dans le périmètre retenu sont **inclus** dans les restitutions qui s’appuient sur les lignes d’écriture (balance générale, grand livre, agrégats en dérivant, etc.).

**Exceptions fréquentes** (à traiter par **exclusion explicite** ou règle métier, jamais implicitement) :

- journaux d’**ouverture** ;
- journaux de **clôture** ;
- journaux d’**inventaire** ;
- journaux **techniques**, d’**import** ou de **migration** ;
- journaux de **simulation** ou d’**environnement de test** hors production.

Toute exclusion de journal doit être **tracée**, **versionnée** et prise en compte dans les **jeux de recette** (§17).

---

## 6. Périmètre, temporalité, devise et arrondis

### 6.1 Périmètre

Le périmètre de restitution peut inclure :

- un **tenant** ;
- une **société** ;
- un ou plusieurs **établissements** ;
- un périmètre de **consolidation** ;
- un filtre sur certains journaux ou comptes si la restitution le justifie.

Toute restitution doit porter la trace de son périmètre exact.

### 6.2 Temporalité

Les règles temporelles de référence sont les suivantes :

| Restitution | Temporalité de référence |
|---|---|
| **Bilan** | lecture à date d'arrêté |
| **Compte de résultat** | lecture sur période |
| **Balances tiers** | lecture à date d'observation |
| **Balance générale** | lecture sur période avec soldes d'ouverture |
| **Grand livre** | lecture sur période |

### 6.3 Devise

Pour chaque restitution, il faut distinguer :

- **devise des lignes source** ;
- **devise société / dossier** ;
- **devise de présentation Lynki**.

Si la devise de présentation diffère de la devise source, la règle de conversion doit être documentée :

- taux utilisé ;
- date de conversion ;
- niveau d'arrondi ;
- mode de conversion retenu.

### 6.4 Arrondis

Sauf règle spécifique documentée :

- les calculs internes se font à la précision maximale disponible ;
- les affichages Lynki peuvent être arrondis pour lecture ;
- les exports de contrôle ou de réconciliation doivent permettre de retrouver les montants de référence.

### 6.5 Tolérance de réconciliation

Les modes admis sont les suivants :

| Mode | Définition |
|---|---|
| **Zéro strict** | aucun écart n'est admis |
| **Tolérance paramétrée** | écart numérique maximal autorisé, documenté |
| **Écart autorisé si règle documentée** | écart admis s'il correspond à une règle métier / consolidation / reclassement |

Par défaut, le référentiel vise le **zéro strict**, hors cas d'arrondis ou retraitements explicitement documentés.

### 6.6 Règle transverse — date d’ancienneté des tiers (balances âgées)

Pour les restitutions de type **balance âgée clients** et **balance âgée fournisseurs**, la règle de référence est la suivante :

> Par défaut, l’**ancienneté** d’un poste ouvert est calculée à partir de la **date d’échéance** lorsqu’elle existe ; **à défaut**, à partir de la **date comptable** de la ligne (ou du poste selon modèle source).

Toute autre hiérarchie (ex. date de document, date de lettrage) doit être **explicitement documentée** et **versionnée** pour le dossier.

---

## 7. Conventions globales de signe

### 7.1 Bilan

Les rubriques de bilan sont affichées en **valeurs positives métier** :

- actif en positif ;
- passif en positif ;
- capitaux propres en positif.

Le signe brut des comptes source n'est pas exposé tel quel à l'utilisateur final sur la restitution synthétique.

### 7.2 Compte de résultat

Sur la restitution métier :

- produits affichés en positif ;
- charges affichées en positif ;
- résultat calculé selon la formule documentée (somme algébrique des rubriques).

### 7.3 Balance générale

La balance générale conserve :

- les **débits natifs** ;
- les **crédits natifs** ;
- un **solde calculé**.

Par défaut :

> **solde = somme des débits cumulés − somme des crédits cumulés**

sur le périmètre et la définition de période retenus, sauf convention de dossier explicitement documentée.

### 7.4 Grand livre

Le grand livre conserve les montants **natifs comptables** :

- débit ;
- crédit ;
- solde courant ou de période selon paramétrage.

### 7.5 Balances tiers

Les balances âgée clients et fournisseurs affichent des **encours positifs** :

- montant dû côté client ;
- montant à payer côté fournisseur.

Le sens économique est porté par la nature de la restitution, et non par un signe négatif difficilement lisible.

---

## 8. Architecture logique du référentiel

Le référentiel est composé de deux niveaux :

### 8.1 Noyau commun FR

Le noyau commun définit :

- le mapping de base compatible PCG FR ;
- les conventions de signe ;
- les règles d'inclusion / exclusion ;
- les règles standards de réconciliation.

### 8.2 Surcharge client / tenant

Chaque client ou tenant peut surcharger le noyau commun sur certains points :

- regroupement de comptes ;
- règles de présentation ;
- tranches d'ancienneté ;
- journaux inclus / exclus ;
- règles multi-devises ;
- retraitements particuliers.

### 8.3 Ordre de priorité des règles

1. surcharge client / tenant active ;
2. référentiel commun FR ;
3. règle d'exception documentée ;
4. absence de règle = restitution non gelée / non validée.

---

## 9. Référentiel des rubriques Lynki — bilan

Les rubriques ci-dessous constituent le **socle de base** recommandé pour la restitution `lynki.accounting.balance_sheet`.

### 9.1 Principes de construction du bilan

Le bilan Lynki repose sur :

- une lecture **à date d'arrêté** ;
- une présentation **métier structurée** ;
- un passage possible vers les comptes puis la balance générale et le grand livre ;
- un calcul en **valeur nette** lorsque cela fait sens économiquement et comptablement.

### 9.2 Rubriques de base — actif

| Identifiant rubrique | Libellé | Nature | Base PCG FR indicative | Règle de calcul |
|---|---|---|---|---|
| `lynki.rubric.bs.fixed_assets` | Immobilisations nettes | Agrégat | classes 20 à 27, corrigées des 28/29 | somme des immobilisations brutes − amortissements / dépréciations associés |
| `lynki.rubric.bs.inventory` | Stocks et en-cours nets | Agrégat | classes 31 à 37, corrigées des 39 | stocks bruts − dépréciations de stocks |
| `lynki.rubric.bs.trade_receivables` | Créances clients | Agrégat | 411, 413, 416, 418 et assimilés selon dossier ; 491 en correctif si retenu | créances commerciales nettes selon règle dossier |
| `lynki.rubric.bs.other_receivables` | Autres créances | Agrégat | 409 débiteurs, 42, 43, 44 débiteurs, 46 débiteurs, autres comptes d'actif circulant | autres créances d'exploitation et hors exploitation selon règle dossier |
| `lynki.rubric.bs.cash_and_cash_equivalents` | Trésorerie et équivalents | Agrégat | 50 à 53, 58 si retenu | disponibilités et quasi-disponibilités selon règle dossier |
| `lynki.rubric.bs.prepaid_expenses` | Charges constatées d'avance | Ligne | 486 | montant à date |

### 9.3 Rubriques de base — passif

| Identifiant rubrique | Libellé | Nature | Base PCG FR indicative | Règle de calcul |
|---|---|---|---|---|
| `lynki.rubric.bs.equity` | Capitaux propres | Agrégat | 10 à 14, résultat reporté selon dossier | capitaux propres comptables à date |
| `lynki.rubric.bs.provisions` | Provisions pour risques et charges | Ligne / agrégat | 15 | provisions à date |
| `lynki.rubric.bs.financial_debt` | Dettes financières | Agrégat | 16, 17 et assimilés | dettes financières à date |
| `lynki.rubric.bs.trade_payables` | Dettes fournisseurs | Agrégat | 401, 403, 408 et assimilés selon dossier | dettes fournisseurs à date |
| `lynki.rubric.bs.tax_social_payables` | Dettes fiscales et sociales | Agrégat | 43, 44 créditeurs, 445 créditeurs et assimilés | dettes fiscales et sociales à date |
| `lynki.rubric.bs.other_payables` | Autres dettes | Agrégat | 46 créditeurs, 467, 468, autres comptes de dettes | autres dettes à date |
| `lynki.rubric.bs.deferred_income` | Produits constatés d'avance | Ligne | 487 | montant à date |

### 9.4 Règles particulières du bilan

#### Immobilisations nettes

La présentation par défaut retient une vision **nette** :

- immobilisations brutes incluses ;
- amortissements et dépréciations associés déduits.

Si le client souhaite une présentation brute + correctifs séparés, cette dérogation doit être documentée.

#### Créances clients

La rubrique bilan **créances clients** n'est pas nécessairement strictement identique à la **balance âgée clients** si le dossier retient des comptes de douteux, provisions ou reclassements spécifiques.

#### Trésorerie

Le périmètre exact de la trésorerie comptable doit être figé par dossier, notamment pour :

- caisses ;
- virements internes / comptes de passage ;
- placements de trésorerie ;
- comptes d'attente.

---

## 10. Référentiel des rubriques Lynki — compte de résultat

### 10.1 Principes de construction

Le compte de résultat Lynki repose sur :

- une lecture **sur période** ;
- une présentation métier synthétique ;
- un détail possible par compte et grand livre ;
- une possibilité de produire certains **SIG** si le dossier est paramétré pour cela.

### 10.2 Rubriques de base — exploitation

| Identifiant rubrique | Libellé | Nature | Base PCG FR indicative | Règle de calcul |
|---|---|---|---|---|
| `lynki.rubric.is.revenue` | Chiffre d'affaires / produits d'exploitation principaux | Agrégat | 70, 71, 72, 74 selon présentation retenue | agrégat des produits d'exploitation retenus comme activité |
| `lynki.rubric.is.other_operating_income` | Autres produits d'exploitation | Agrégat | 75 et produits d'exploitation hors CA | produits d'exploitation hors activité principale selon dossier |
| `lynki.rubric.is.purchases_consumed` | Achats consommés / consommation de marchandises et matières | Agrégat / formule | 60 et 603 selon dossier | achats ± variation de stocks selon règle dossier |
| `lynki.rubric.is.external_services` | Services extérieurs | Agrégat | 61, 62 | charges externes |
| `lynki.rubric.is.taxes_and_duties` | Taxes et impôts | Agrégat | 63 | impôts et taxes d'exploitation |
| `lynki.rubric.is.payroll` | Charges de personnel | Agrégat | 64 | charges de personnel |
| `lynki.rubric.is.other_operating_expenses` | Autres charges d'exploitation | Agrégat | 65 | autres charges d'exploitation |
| `lynki.rubric.is.depreciation_amortization` | Dotations d'exploitation | Agrégat | 68 d'exploitation selon paramétrage | dotations aux amortissements / dépréciations / provisions explo. |

### 10.3 Rubriques intermédiaires et résultats

| Identifiant rubrique | Libellé | Nature | Règle de calcul |
|---|---|---|---|
| `lynki.rubric.is.gross_margin` | Marge brute / marge commerciale | Formule optionnelle | selon configuration métier du dossier |
| `lynki.rubric.is.value_added` | Valeur ajoutée | Formule optionnelle | produits exploitation − achats consommés − services extérieurs |
| `lynki.rubric.is.ebitda` | EBE / EBITDA métier | Formule optionnelle | produits exploitation − charges d'exploitation hors dotations |
| `lynki.rubric.is.operating_profit` | Résultat d'exploitation | Formule | produits exploitation − charges exploitation |
| `lynki.rubric.is.financial_result` | Résultat financier | Formule / agrégat | produits financiers 76 − charges financières 66 |
| `lynki.rubric.is.exceptional_result` | Résultat exceptionnel | Formule / agrégat | produits exceptionnels 77 − charges exceptionnelles 67 |
| `lynki.rubric.is.income_tax` | Impôt sur les bénéfices et assimilés | Agrégat | 69 selon règle dossier |
| `lynki.rubric.is.net_income` | Résultat net | Formule | résultat exploitation + financier + exceptionnel − impôt |

### 10.4 Règles particulières du compte de résultat

#### Produits et charges affichés en positif

L'affichage métier Lynki ne reprend pas le signe brut des comptes :

- produits affichés positifs ;
- charges affichées positives ;
- le calcul du résultat reste algébrique.

#### Variations de stocks

La manière de traiter les comptes 603 / 713 / assimilés doit être fixée par dossier :

- inclusion dans les achats consommés ;
- présentation séparée ;
- intégration à un SIG.

#### Dotations et reprises

La distinction entre dotations et reprises doit être documentée selon l'objectif de lecture.  
Par défaut, Lynki retient une lecture orientée gestion, tout en conservant la traçabilité vers les comptes source.

---

## 11. Règles de restitution — balance âgée clients

### 11.1 Objectif

La balance âgée clients vise à présenter les **encours ouverts** dus par les clients à une date d'observation.

### 11.2 Périmètre standard

Sont inclus par défaut :

- les postes ouverts sur comptes tiers clients ;
- les **écritures postées / validées selon la terminologie du système source** ;
- les échéances et lettrages disponibles ;
- les écritures rattachables à un partenaire client.

### 11.3 Date de référence pour l'ancienneté

Voir la règle transverse **§6.6** (échéance prioritaire, sinon date comptable).  
Toute dérogation doit être documentée.

### 11.4 Tranches d'ancienneté par défaut

Le modèle par défaut propose les tranches suivantes :

- **non échu** ;
- **0–30 jours** ;
- **31–60 jours** ;
- **61–90 jours** ;
- **91–180 jours** ;
- **> 180 jours**.

Ces tranches sont **configurables**, mais toute modification doit être versionnée.

### 11.5 Règles particulières

#### Avoirs clients

Les avoirs ou crédits clients peuvent être :

- imputés au niveau du partenaire selon la règle dossier ;
- affichés séparément ;
- exclus du netting automatique si la politique de restitution l'impose.

#### Douteux / contentieux

Les créances douteuses ou litigieuses doivent être :

- soit intégrées à une tranche spécifique ;
- soit documentées comme écart de réconciliation avec le bilan ;
- soit traitées par règle client spécifique.

#### Multi-devises

Les encours affichés en devise de présentation doivent préciser :

- la devise affichée ;
- la règle de conversion ;
- le niveau d'arrondi.

---

## 12. Règles de restitution — balance âgée fournisseurs

### 12.1 Objectif

La balance âgée fournisseurs vise à présenter les **dettes ouvertes** à payer aux fournisseurs à une date d'observation.

### 12.2 Périmètre standard

Sont inclus par défaut :

- les postes ouverts sur comptes tiers fournisseurs ;
- les **écritures postées / validées selon la terminologie du système source** ;
- les échéances et lettrages disponibles ;
- les écritures rattachables à un partenaire fournisseur.

### 12.3 Date de référence

Voir **§6.6** (même règle transverse que pour la balance âgée clients).

### 12.4 Tranches d'ancienneté

Par défaut, même logique que pour la balance âgée clients :

- non échu ;
- 0–30 jours ;
- 31–60 jours ;
- 61–90 jours ;
- 91–180 jours ;
- > 180 jours.

### 12.5 Cas particuliers

#### Acomptes et avances

Les acomptes et avances fournisseurs peuvent nécessiter un traitement particulier :

- maintien dans les dettes si la règle dossier le prévoit ;
- reclassement en autres créances / autres dettes ;
- exclusion de certaines vues auxiliaires.

#### Avoirs fournisseurs

Même logique que pour les avoirs clients :

- netting au niveau du partenaire si documenté ;
- affichage séparé possible ;
- impact documenté sur la réconciliation bilan.

### 12.6 Netting tiers (règle transverse clients / fournisseurs)

Le **netting** (compensation crédit / débit au sein d’un même périmètre d’analyse) conditionne la lisibilité des balances âgées et leur **alignement** avec les rubriques **créances clients** / **dettes fournisseurs** du bilan.

#### 12.6.1 Principe par défaut

Par défaut, le référentiel **n’impose pas** le netting automatique : le paramétrage **autorisé / exclu** et le **niveau** de netting doivent être **explicitement fixés** par dossier ou tenant et **versionnés**, pour éviter des écarts non maîtrisés entre vues.

#### 12.6.2 Niveaux de netting possibles

| Niveau | Description | Usage typique |
|---|---|---|
| **Partenaire** | compensation des soldes au sein d’un même tiers | vision « encours net » par client / fournisseur |
| **Compte** | compensation au sein d’un même compte tiers | sous-périmètre analytique |
| **Échéance / ligne** | pas de netting entre lignes distinctes | lecture la plus proche du détail source |

Une règle **mixte** (ex. netting au partenaire avec exclusion des avoirs non affectés) doit être **documentée**.

#### 12.6.3 Avoirs non affectés

Les **avoirs** (crédits clients, avoirs fournisseurs) **non affectés** ou **non lettrés** peuvent être :

- **rapprochés** des factures ouverts selon la politique du dossier ;
- **affichés séparément** ;
- **exclus** du netting automatique lorsque la politique de restitution l’impose.

Tout traitement doit être **traçable** pour la réconciliation avec le bilan.

#### 12.6.4 Impact sur la réconciliation avec le bilan

Les montants des balances âgées **après netting** peuvent différer des **bruts** des rubriques bilan si le dossier retient des **provisions**, **reclassements**, **douteux** ou **présentations brutes / nettes** distinctes.

Tout écart entre :

- total balance âgée (vue retenue) et  
- rubrique bilan correspondante  

doit être **nul** ou **documenté** comme écart autorisé (§6.5, §15.4).

---

## 13. Règles de restitution — balance générale

### 13.1 Objectif

La balance générale constitue le **pivot** entre les restitutions synthétiques et le grand livre.

### 13.2 Colonnes minimales attendues

Le modèle minimal attend les colonnes suivantes :

- compte ;
- libellé compte ;
- solde d'ouverture ;
- débit période ;
- crédit période ;
- solde de clôture.

Selon le dossier, ces colonnes peuvent être décomposées en :

- ouverture débit / ouverture crédit ;
- clôture débit / clôture crédit.

### 13.3 Règle de calcul par défaut

Par défaut :

- **solde d'ouverture** = cumul antérieur à la date de début de période ;
- **débit période** = somme des débits sur la période ;
- **crédit période** = somme des crédits sur la période ;
- **solde clôture** = solde d'ouverture + débit période − crédit période,
  ou présentation équivalente selon convention dossier.

### 13.4 Périmètre de comptes

Par défaut, tous les comptes du périmètre retenu sont éligibles, sous réserve de :

- présence d’**écritures postées / validées selon la terminologie du système source** ;
- non-exclusion explicite par règle dossier ;
- cohérence avec le plan comptable de la société.

### 13.5 Usage en réconciliation

La balance générale doit permettre de réconcilier :

- le bilan ;
- le compte de résultat ;
- le grand livre.

---

## 14. Règles de restitution — grand livre

### 14.1 Objectif

Le grand livre constitue la **preuve détaillée** mobilisable par Lynki dans la chaîne de justification.

### 14.2 Contenu minimal

Le grand livre doit permettre d'afficher, au minimum :

- date comptable ;
- compte ;
- journal ;
- pièce / référence d'origine ;
- libellé ;
- partenaire si applicable ;
- débit ;
- crédit ;
- solde courant ou de période ;
- lettrage / rapprochement si disponible.

### 14.3 Ordre de tri par défaut

Par défaut :

1. date comptable croissante ;
2. identifiant stable d'écriture ;
3. ordre secondaire technique si nécessaire.

L'objectif est d'obtenir un rendu **déterministe et rejouable**.

### 14.4 Filtres attendus

Les filtres minimaux attendus sont :

- période ;
- compte ;
- société ;
- journal ;
- partenaire ;
- référence de pièce si disponible.

### 14.5 Niveau de détail

Lynki ne cherche pas à reproduire exhaustivement toutes les fonctions du logiciel comptable source.  
Le grand livre Lynki s'arrête au niveau de la **ligne d'écriture exploitable**.

Le lien vers la pièce ou le document source dépend :

- du connecteur ;
- des droits ;
- du niveau d'exposition autorisé.

---

## 15. Règles de réconciliation transverses

### 15.1 Bilan ↔ balance générale

Le bilan doit être réconciliable avec la balance générale :

- par regroupement des comptes selon le mapping ;
- à la même date d'arrêté ;
- sur le même périmètre ;
- avec écart nul ou documenté.

### 15.2 Compte de résultat ↔ balance générale

Le compte de résultat doit être réconciliable avec la balance générale :

- via les comptes de produits et charges ;
- sur la même période ;
- selon la même règle d'inclusion des écritures ;
- avec tolérance conforme au référentiel.

### 15.3 Balance générale ↔ grand livre

Pour chaque compte :

- la somme des lignes du grand livre doit permettre de retrouver le solde de la balance générale ;
- la logique de période doit être identique ;
- les arrondis et écarts autorisés doivent être documentés.

### 15.4 Balances tiers ↔ bilan

Les balances clients et fournisseurs doivent être réconciliables avec les rubriques bilan correspondantes, sous réserve des écarts documentés liés à :

- provisions ;
- reclassements ;
- douteux / contentieux ;
- acomptes / avances ;
- multi-devises ;
- paramétrages de netting.

### 15.5 Chaîne de preuve cible

Lynki doit permettre la chaîne logique suivante :

> restitution synthétique → rubrique → compte → balance générale → grand livre

Toute rupture dans cette chaîne doit être :

- détectable ;
- documentée ;
- traitée comme anomalie ou exception métier formalisée.

---

## 16. Cas limites et exceptions documentées

### 16.1 Multi-devises

Les restitutions multi-devises nécessitent :

- une devise de présentation explicitée ;
- une règle de conversion documentée ;
- une tolérance de réconciliation éventuelle ;
- une cohérence entre agrégats et vues détaillées.

### 16.2 Reclassements et consolidation

Les reclassements ou retraitements de consolidation peuvent créer des écarts apparents avec le dossier brut.  
Ils sont admis uniquement s'ils sont :

- versionnés ;
- explicités ;
- traçables ;
- rattachés à une règle ou note de retraitement.

### 16.3 Comptes transitoires et comptes de passage

Les comptes de passage, d'attente ou transitoires doivent faire l'objet d'un arbitrage clair :

- inclus dans une rubrique ;
- exclus ;
- surveillés séparément.

### 16.4 Journaux particuliers

Voir le principe d’**inclusion par défaut** et les **exceptions typiques** en **§5.6**.

Certains journaux peuvent en outre faire l'objet d'un traitement spécifique au dossier :

- journaux d'ouverture ;
- journaux de clôture ;
- journaux d'inventaire ;
- journaux techniques / imports ;
- journaux de simulation.

Toute exclusion ou règle particulière doit être documentée.

### 16.5 Périodes verrouillées

Les périodes verrouillées ou régularisées restent restituées selon la vérité comptable du dossier, sauf règle d'environnement contraire.

---

## 17. Règles minimales de recette

Avant validation d'une restitution sur un environnement donné, les éléments suivants doivent être testés :

### 17.1 Cohérence de périmètre

- société correcte ;
- période correcte ;
- devise correcte ;
- version du référentiel renseignée.

### 17.2 Cohérence de mapping

- comptes inclus conformes ;
- comptes exclus conformes ;
- regroupements conformes ;
- conventions de signe conformes.

### 17.3 Cohérence de réconciliation

- bilan ↔ balance générale ;
- compte de résultat ↔ balance générale ;
- balance générale ↔ grand livre ;
- balances tiers ↔ rubriques bilan correspondantes.

### 17.4 Cohérence d'explicabilité

- drill-down disponible ;
- version de référentiel visible ;
- règles documentées ;
- anomalies identifiables.

---

## 18. Gouvernance, validation et versionnement

### 18.1 Niveaux de version

Le référentiel doit au minimum porter :

- une version documentaire ;
- une date d'effet ;
- un environnement concerné ;
- un auteur / responsable ;
- un statut de validation.

### 18.2 Versionnement recommandé

Exemple recommandé :

- `REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md` = fichier unique ;
- version affichée dans l'en-tête du document ;
- identifiant versionné de mapping de type :
  - `lynki.mapping.accounting@1.0.0`
  - ou hash de référentiel client.

### 18.3 Statuts documentaires possibles

- **brouillon** ;
- **validé** ;
- **gelé** ;
- **remplacé**.

### 18.4 Validation minimale

Une version de référentiel est considérée exploitable lorsque :

- le CDC master est aligné ;
- le dictionnaire des restitutions est aligné ;
- les tests de réconciliation de base sont passants ;
- les exceptions connues sont documentées.

### 18.5 Exigence produit — exposition ou journalisation de la version

Conformément au **§3.5**, l’implémentation Lynki doit permettre, pour chaque restitution comptable produite, de connaître **sans ambiguïté** la **version du référentiel** (et le cas échéant les **surcharges tenant**) ayant servi au calcul — au minimum via métadonnées d’API, champs d’export ou corrélation avec des journaux techniques.

---

## 19. Annexes — mapping PCG FR indicatif par grandes masses

### 19.1 Vision simplifiée bilan

| Masse Lynki | Base PCG FR indicative |
|---|---|
| Immobilisations nettes | 20 à 27, corrigées des 28 / 29 |
| Stocks et en-cours nets | 31 à 37, corrigés des 39 |
| Créances clients | 411, 413, 416, 418 et assimilés selon dossier |
| Autres créances | 409 débiteurs, 42 / 43 / 44 débiteurs, 46 débiteurs, autres actifs circulants |
| Trésorerie | 50 à 53, 58 selon règle dossier |
| Charges constatées d'avance | 486 |
| Capitaux propres | 10 à 14 |
| Provisions | 15 |
| Dettes financières | 16, 17 |
| Dettes fournisseurs | 401, 403, 408 et assimilés |
| Dettes fiscales et sociales | 43, 44, 445 créditeurs et assimilés |
| Autres dettes | 46 créditeurs, 467, 468, autres dettes |
| Produits constatés d'avance | 487 |

### 19.2 Vision simplifiée compte de résultat

| Masse Lynki | Base PCG FR indicative |
|---|---|
| Produits d'exploitation principaux | 70, 71, 72, 74 selon dossier |
| Autres produits d'exploitation | 75 |
| Achats consommés | 60, 603 selon dossier |
| Services extérieurs | 61, 62 |
| Taxes et impôts | 63 |
| Charges de personnel | 64 |
| Autres charges d'exploitation | 65 |
| Charges financières | 66 |
| Charges exceptionnelles | 67 |
| Dotations | 68 selon nature retenue |
| Impôts sur les bénéfices et assimilés | 69 |
| Produits financiers | 76 |
| Produits exceptionnels | 77 |

### 19.3 Synthèse recette — réconciliation et tolérance par défaut

Tableau **indicatif** pour cadrer les jeux de recette (§17) ; toute dérogation doit être documentée (§6.5).

| Restitution | Réconciliation principale attendue | Tolérance par défaut |
|---|---|---|
| **Bilan** | Balance générale à la même date d’arrêté, même périmètre (agrégation des comptes selon mapping) | **Zéro strict** (écarts = retraitements ou erreurs à traiter) |
| **Compte de résultat** | Balance générale sur la même période, mêmes règles d’inclusion | **Zéro strict** |
| **Balance âgée clients** | Rubrique bilan **créances clients** (sous réserve netting / provisions / reclassements documentés §12.6) | **Zéro strict** ou **écart documenté** |
| **Balance âgée fournisseurs** | Rubrique bilan **dettes fournisseurs** (mêmes réserves) | **Zéro strict** ou **écart documenté** |
| **Balance générale** | Somme des lignes du **grand livre** par compte et période | **Zéro strict**, hors arrondis documentés |
| **Grand livre** | Cohérence avec la **source comptable** ingérée (**écritures postées / validées selon la terminologie du système source**) | **Zéro strict** |

> Ce mapping annexe est **indicatif** et doit être confirmé / adapté par dossier.

---

## 20. Synthèse

Le présent référentiel formalise la manière dont Lynki transforme une comptabilité source en **restitutions comptables explicables et réconciliables**.

Il fixe un cadre commun sur :

- l'éligibilité des écritures ;
- le périmètre, la période et la devise ;
- les conventions de signe ;
- le mapping comptable FR de base ;
- les règles de calcul des six restitutions structurantes ;
- la réconciliation entre synthèse, balance générale et grand livre.

En combinaison avec le **CDC master** et le **dictionnaire des restitutions**, il constitue le socle documentaire nécessaire pour faire de Lynki un **assistant de contrôle de gestion permanent**, fondé sur une lecture comptable fiable, explicable et rejouable.
