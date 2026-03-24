# 📋 CAHIER DES CHARGES  
## Lynki by Dorevia — Interface de contrôle de gestion permanent, explicable et rejouable

**Version :** 2.2 — mars 2026  
**Évolutions majeures :** socle de **restitutions** comptables structurantes (vs. simples « cartes »), ajout de la **balance générale** comme pivot synthèse ↔ grand livre, **grand livre** comme preuve détaillée, critères de **cohérence de bout en bout** (chaîne de preuve), référentiel §6.5 et moteur §7.3.1 enrichis, F8 ajustée.

**Dossier ZeDocs/web57** — référentiels d’alignement et d’exploitation rattachés au CDC.

---

### Référentiels complémentaires (même dossier)

| Document | Usage |
|----------|--------|
| [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) | Matrice d’alignement **CDC ↔ implémentation** (Lynki UI, Diva, Vault, tenants) et priorités de comblement des écarts. |
| [RUNBOOK_ODOO_OWLERROR_STOCK_PICKING_INVOICE_IDS.md](RUNBOOK_ODOO_OWLERROR_STOCK_PICKING_INVOICE_IDS.md) | **Exploitation** : incident Odoo (OwlError, champ `stock.picking.invoice_ids`), diagnostic et désinstallation de modules OCA incohérents — à réutiliser si la source ERP est Odoo. |
| [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) | **Dictionnaire métier** : fiches des restitutions comptables structurantes (§4.1.1) — bilan, compte de résultat, balances tiers, balance générale, grand livre ; alimente le livrable §6.3. |
| [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) | **Référentiel comptable de restitution** (§6.5) : mapping PCG FR → rubriques Lynki, éligibilité, signes, ancienneté tiers, réconciliation ; noyau FR + surcharges tenant. |
| [AVIS_EXPERT_CDC_MASTER_LYNKI.md](AVIS_EXPERT_CDC_MASTER_LYNKI.md) | **Avis d’expert** sur le présent CDC : validation de fond, lecture du triptyque documentaire (CDC ↔ dictionnaire des restitutions ↔ référentiel comptable), tableau de cohérence avec l’existant, recommandations mineures — trace de gouvernance produit. |

Ces documents **ne remplacent pas** le présent CDC ; ils en sont les **artefacts opérationnels** (recette, support, runbooks) exigés par la section *Documentation* (§13).

---

## 1. CONTEXTE ET VISION PRODUIT

### 1.1 Contexte

Les petites et moyennes entreprises disposent rarement d’un outil de contrôle de gestion réellement opérationnel au quotidien. Les données sont souvent dispersées entre ERP, banque, caisse, comptabilité, facturation, paie et tableurs. Le pilotage repose alors sur des retraitements manuels, des exports Excel et des lectures tardives, partielles ou difficilement explicables.

Dans ce contexte, l’ambition de **Lynki by Dorevia** est de proposer une interface de lecture financière et opérationnelle continue permettant à une direction, un RAF, un DAF ou un CODIR de :

- lire la situation de l’entreprise à partir de données consolidées,
- comprendre les grands équilibres de gestion,
- identifier les tensions ou dérives,
- arbitrer plus rapidement,
- et, à terme, consigner les décisions prises dans le temps.

Lynki n’est donc pas seulement un tableau de bord.  
C’est un **assistant au contrôle de gestion**, centré sur la **lecture continue de l’activité**, avec un objectif de **fiabilité**, de **traçabilité** et d’**explicabilité**.

*(Nom de projet interne historique : Linky ; marque utilisateur : Lynki.)*

---

### 1.2 Vision

Le produit doit permettre d’entrer dans un monde de **contrôle de gestion permanent** :

- **permanent** : lecture régulière, voire quasi continue, des indicateurs clés,
- **rejouable** : capacité à relire un état passé selon un périmètre et une date donnés,
- **explicable** : tout indicateur et tout insight doivent pouvoir être reliés à des données sources et à des règles de calcul,
- **actionnable** : l’interface doit aider la prise de décision, pas seulement afficher des chiffres.

---

### 1.3 Objectifs métier

L’interface devra permettre de :

- **centraliser** des données financières et opérationnelles issues de plusieurs sources,
- **fiabiliser** la lecture de la situation économique,
- **visualiser** immédiatement les équilibres de gestion essentiels,
- **détecter** les points d’attention avant qu’ils ne deviennent critiques,
- **réduire** le temps de production des lectures de gestion,
- **aider à la décision** par des commentaires automatisés et contextualisés,
- **préparer** un futur mode simulation / consignation de décision.

---

## 2. POSITIONNEMENT FONCTIONNEL

### 2.1 Nature du produit

Lynki est une **interface de contrôle de gestion multi-sources** qui agrège, met en cohérence et restitue des indicateurs-clés à partir de données issues notamment de :

- ERP / facturation,
- comptabilité,
- banque / trésorerie,
- POS / caisse,
- paie,
- fiscalité,
- autres sources métier selon contexte client.

Le produit ne doit pas être conçu comme un simple écran décoratif de BI, mais comme une **surface de lecture fiable du réel de gestion**.

---

### 2.2 Différenciation produit

Le produit devra refléter les principes suivants :

- **ERP agnostique** : l’interface ne doit pas dépendre conceptuellement d’un ERP unique ;
- **multi-source** : chaque KPI peut combiner plusieurs origines de données ;
- **multi-tenant / multi-sociétés** : l’outil doit pouvoir gérer plusieurs espaces, sociétés, établissements ou points de vente ;
- **explicabilité** : chaque chiffre affiché doit pouvoir être justifié ;
- **rejouabilité** : l’utilisateur doit pouvoir consulter une lecture à date et par périmètre ;
- **progressivité** : MVP focalisé sur la lecture fiable, puis enrichissement progressif vers la simulation et la consignation.

---

### 2.3 Socle comptable de référence

Pour les périmètres français, Lynki devra pouvoir s’appuyer sur un **socle comptable de référence** permettant de restituer certains indicateurs et certaines vues à partir de la **comptabilité générale** et de la **comptabilité auxiliaire**.

Ce socle devra respecter les principes suivants :

- exploitation prioritaire des **écritures comptables validées / postées** ;
- agrégation selon le **plan comptable applicable au dossier**, avec compatibilité forte avec le **plan comptable français** ;
- distinction explicite entre :
  - **lecture de comptabilité générale** (bilan, compte de résultat, trésorerie comptable, taxes, etc.),
  - **lecture auxiliaire de tiers** (clients, fournisseurs, échéances, ancienneté, lettrage) ;
- non-dépendance à un ERP unique, grâce à une **couche de mapping comptable** entre les comptes, types de comptes ou groupes de comptes sources et les rubriques métier Lynki ;
- traçabilité des règles d’agrégation, conventions de signe, inclusions et exclusions.

Lynki ne se substitue pas à un logiciel comptable ; il s’appuie sur la **vérité comptable disponible** pour produire une **lecture de gestion exploitable, explicable et rejouable**.

---

## 3. UTILISATEURS CIBLES

### 3.1 Profils principaux

- **Direction générale** : lecture synthétique, arbitrage, priorisation
- **RAF / DAF / CFO** : lecture détaillée, contrôle, analyse
- **Contrôle de gestion** : suivi des indicateurs, investigation, reporting
- **Manager opérationnel** : consultation d’un périmètre donné
- **Consultant / AMOA** : lecture encadrée selon habilitations

---

### 3.2 Cas d’usage principaux

- Lire la situation de trésorerie d’une entreprise ou d’un périmètre
- Comparer activité, flux, encours et tension de BFR
- Identifier une dérive ou une concentration de risque
- Suivre les impacts opérationnels d’une activité POS / vente / facturation
- Préparer un échange de direction ou CODIR
- Justifier un indicateur à partir de ses sources
- Comparer une lecture actuelle à une lecture passée
- Lire une restitution fondée sur les écritures comptables validées
- Analyser les soldes clients et fournisseurs ouverts par ancienneté

---

## 4. PÉRIMÈTRE FONCTIONNEL

### 4.1 Vue principale — Cockpit de synthèse

L’interface principale doit proposer une lecture synthétique de l’activité via une grille structurée de cartes de gestion.

Cette grille devra combiner :

- des **cartes de lecture de pilotage** issues de flux métier et financiers,
- et un **socle de restitutions comptables structurantes** permettant de restituer les grands équilibres de l’entreprise.

Le produit ne devra donc pas être limité conceptuellement à une simple liste fixe de 12 KPIs.  
Le MVP pourra afficher un nombre réduit de cartes priorisées, mais le **modèle fonctionnel et le modèle de données** devront intégrer dès l’origine la possibilité de restituer :

- la **structure financière**,
- la **performance comptable**,
- l’**exposition clients**,
- l’**engagement fournisseurs**,
- ainsi que les autres indicateurs opérationnels et de trésorerie déjà prévus.

---

### 4.1.1 Socle de restitutions comptables structurantes

En complément des KPIs de trésorerie, d’activité et d’exploitation, Lynki devra intégrer les restitutions comptables structurantes suivantes (synthèses, balances et vues intermédiaires — le **grand livre** est une **vue de justification détaillée**, pas une « carte » de premier niveau au même titre qu’un bilan).

| Restitution Lynki | Référence métier | Source de calcul principale | Finalité |
|---|---|---|---|
| Structure financière | Bilan | écritures comptables validées agrégées | lire les équilibres actif / passif / capitaux propres |
| Performance comptable | Compte de résultat | écritures comptables validées agrégées | lire la performance économique de la période |
| Balance clients | Balance âgée clients | écritures auxiliaires clients ouvertes | lire le risque de recouvrement et les encaissements attendus |
| Balance fournisseurs | Balance âgée fournisseurs | écritures auxiliaires fournisseurs ouvertes | lire les engagements à payer et la pression de décaissement |
| Balance générale | Balance comptable | écritures comptables validées agrégées par compte | contrôler les soldes comptables et servir de pivot vers le grand livre |
| Grand livre | Grand livre comptable | écritures comptables validées détaillées | justifier un solde, une rubrique ou un mouvement par le détail des écritures |

#### Principes attendus

**Structure financière / Bilan**  
La carte devra proposer une lecture synthétique du bilan à date, reposant sur l’agrégation des écritures validées relevant des classes patrimoniales.  
Elle devra permettre, au minimum, de visualiser :

- actifs circulants,
- trésorerie,
- créances,
- stocks si disponibles,
- dettes d’exploitation,
- dettes financières si disponibles,
- capitaux propres.

**Performance comptable / Compte de résultat**  
La carte devra proposer une lecture synthétique de la performance de la période en s’appuyant sur les écritures validées de produits et charges.  
Elle devra permettre, au minimum, de visualiser :

- chiffre d’affaires ou produits d’exploitation,
- charges d’exploitation principales,
- marge ou soldes intermédiaires disponibles selon paramétrage,
- résultat d’exploitation,
- résultat net ou résultat de période.

**Balance clients**  
La carte devra proposer une lecture auxiliaire des créances clients ouvertes, par partenaire et par ancienneté.  
Elle devra intégrer, au minimum :

- total restant dû,
- non échu / échu,
- ventilation par tranches d’ancienneté,
- principaux débiteurs,
- dates d’échéance,
- indicateurs de concentration ou de risque.

**Balance fournisseurs**  
La carte devra proposer une lecture auxiliaire des dettes fournisseurs ouvertes, par partenaire et par ancienneté.  
Elle devra intégrer, au minimum :

- total à payer,
- non échu / échu,
- ventilation par tranches d’ancienneté,
- principaux créanciers,
- échéances proches,
- indicateurs de pression court terme sur la trésorerie.

**Balance générale**  
Lynki devra proposer une vue de **balance générale** permettant de consulter, par compte comptable, les soldes d’ouverture, les mouvements débit/crédit et les soldes de période.  
Cette vue constitue un **niveau intermédiaire** entre les restitutions synthétiques (bilan, compte de résultat) et le **grand livre** détaillé.

**Grand livre**  
Lynki devra proposer une vue de **grand livre comptable** permettant de justifier une restitution synthétique par le détail des écritures.  
Le grand livre constitue une **vue de preuve et d’investigation**, non nécessairement une carte de premier niveau du cockpit, mais un composant structurant du drill-down comptable.  
Cette vue devra permettre, au minimum, de visualiser :

- les mouvements par compte comptable,
- la date comptable,
- le journal,
- la pièce ou écriture d’origine,
- le libellé,
- le partenaire si applicable,
- le débit,
- le crédit,
- le solde cumulé ou solde de période selon le contexte,
- les références de lettrage ou de rapprochement si disponibles.

---

### 4.1.2 Noyau initial de KPIs de pilotage

En complément du socle comptable, l’interface devra proposer un noyau initial d’indicateurs de pilotage permettant une lecture immédiate de la santé financière et opérationnelle.

| Domaine | Indicateur | Format | Fréquence cible | Finalité |
|---|---|---:|---:|---|
| Trésorerie | Trésorerie totale | € | quasi temps réel / J | lecture cash disponible |
| Activité | Flux business | € + % | quotidien | lecture activité génératrice |
| Flux | Flux net | € + % | quotidien | lecture variation nette |
| Paiements | Total paiements | € | quotidien | lecture encaissements / règlements |
| BFR | Besoin en fonds de roulement | € | hebdo / quotidien selon données | lecture tension structurelle |
| Encours | Créances clients | € | quotidien | lecture exposition client |
| Taxes | Taxes dues | € | mensuel / estimatif intermédiaire | lecture obligations à venir |
| EBE | Excédent brut d’exploitation | € + % | mensuel / glissant | lecture performance d’exploitation |
| Crédit | Notes de crédit / avoirs | € | quotidien | lecture corrections commerciales |
| Remboursements | Remboursements clients | € | quotidien | lecture sorties liées à l’activité |
| Vente | Points de vente actifs | nb | temps réel / session | lecture dynamique commerciale |
| Caisse | Z de caisse | € | quotidien | lecture clôtures / activité POS |

---

### 4.2 Principes de restitution des KPIs, restitutions et vues de synthèse

Chaque **KPI, restitution ou vue de synthèse** devra intégrer :

- un **libellé clair**,
- une **valeur principale**,
- une **variation** si disponible,
- une **couleur sémantique**,
- un **niveau de fraîcheur**,
- un **accès au détail**,
- une **explication de calcul**,
- un **timestamp de dernière mise à jour**.

---

### 4.3 Bloc “Insights principaux”

Sous la grille de KPIs, l’interface doit proposer une zone de synthèse narrative générée automatiquement.

Cette zone a pour but de transformer les chiffres en **lecture de gestion compréhensible**.

#### Attendus

- commentaires analytiques lisibles par un dirigeant non technicien,
- détection des variations significatives,
- ratios utiles à la lecture,
- alertes contextualisées,
- tonalité professionnelle de contrôle de gestion,
- historique consultable.

Les règles de génération, de formulation et de priorisation des vigilances sont détaillées dans le document *Comportement insight Lynki / Diva* (ZeDocs/web56). Les normes de libellés (activité commerciale, formulations CODIR) sont définies dans la note de normalisation langue Lynki (ZeDocs/web56).

#### Exemples attendus

> La trésorerie disponible demeure supérieure à l’activité observée sur la période, ce qui traduit une marge de sécurité immédiate.

> Les créances clients représentent une part significative de l’activité récente. Une vigilance particulière est recommandée sur le rythme de recouvrement.

> Les taxes dues restent à ce stade contenues au regard de l’activité, mais devront être suivies à l’approche des échéances.

---

### 4.4 Principe d’explicabilité

Chaque insight devra pouvoir être rattaché à :

- une période,
- un périmètre,
- un ou plusieurs KPIs,
- une règle d’interprétation,
- éventuellement une ou plusieurs sources de données.

Un insight ne devra jamais apparaître comme une “boîte noire”.

---

### 4.5 Explicabilité comptable

Pour les **restitutions** reposant sur la comptabilité, l’explicabilité devra inclure non seulement les sources de données, mais aussi les **règles d’agrégation comptable**.

Chaque restitution comptable devra pouvoir être reliée à :

- la période de lecture,
- la date comptable ou date d’arrêté,
- le périmètre société / établissement / consolidation,
- les comptes ou groupes de comptes inclus,
- les conventions de signe appliquées,
- les écritures exclues le cas échéant,
- les règles de lettrage ou de réconciliation utilisées pour les balances tiers,
- les références de journaux, comptes et écritures mobilisées pour les vues de détail,
- la version du mapping comptable utilisée.

**Aucune restitution comptable ni aucune vue de justification comptable** ne devra être calculée comme une simple boîte noire.

---

## 5. EXIGENCES FONCTIONNELLES DÉTAILLÉES

### F1 — Visualisation

- Affichage sous forme de cartes
- Vue synthèse claire et lisible
- Sémantique couleur homogène
- Icônes et libellés cohérents
- Formatage des montants, pourcentages et volumes
- Support d’affichage des variations
- Affichage de la fraîcheur de donnée

---

### F2 — Navigation et interaction

- filtres de période : jour, semaine, mois, trimestre, année, personnalisé
- sélection du périmètre : tenant, société, établissement, point de vente
- drill-down par indicateur
- infobulles d’aide
- actualisation manuelle
- actualisation automatique paramétrable
- navigation entre vue synthèse et vue détail

---

### F3 — Lecture à date / rejouabilité

L’outil devra permettre, au moins à terme, de consulter une lecture correspondant à une date donnée, selon un périmètre donné.

Fonctions attendues :

- consultation d’une lecture “à date”
- comparaison entre deux périodes
- historisation des recalculs ou corrections
- conservation du contexte de génération des insights
- possibilité de rejouer un **calcul comptable ou un calcul de restitution** sur une période, un périmètre et une version de mapping donnés

Cette capacité de rejouabilité constitue un axe structurant du produit.

---

### F4 — Alertes

- définition de seuils par indicateur
- alertes visuelles dans l’interface
- catégorisation des alertes
- historique des alertes
- notifications externes en option
- suppression des faux positifs ou accusés abusifs

---

### F5 — Personnalisation

- vues par rôle
- affichage sélectif de certains **KPIs, restitutions ou vues**
- préférences sauvegardées
- possibilité ultérieure de composition personnalisée
- ordre des cartes potentiellement adaptable selon profil

---

### F6 — Gestion des rôles et accès

Profils minimaux attendus :

- **Admin** : configuration, droits, supervision
- **Controller / RAF / DAF** : lecture complète, détail, export
- **Manager** : lecture synthétique et périmètre limité
- **Consultant / prestataire** : accès restreint

Exigences associées :

- gestion des habilitations par périmètre,
- audit trail,
- journalisation des consultations et actions sensibles.

---

### F7 — Export et diffusion

- export PDF de synthèse
- export tableur des données visibles ou du détail
- génération de reporting périodique
- partage contrôlé selon droits
- possibilité d’envoi programmé

---

### F8 — Restitution comptable et auxiliaire

Le système devra permettre la restitution de lectures fondées sur la comptabilité générale et auxiliaire, avec un niveau d’explicabilité compatible avec un usage de contrôle de gestion.

Fonctions attendues :

- agrégation d’écritures validées pour les restitutions de bilan et compte de résultat,
- agrégation des postes tiers ouverts pour les balances clients et fournisseurs,
- restitution d’une **balance générale** (soldes débit/crédit par compte), comme niveau intermédiaire entre synthèse et grand livre,
- drill-down depuis une carte vers les rubriques, comptes, partenaires et échéances,
- restitution d’une vue grand livre exploitable jusqu’à l’écriture, cohérente avec les agrégats et la balance générale affichés,
- affichage des conventions de calcul,
- possibilité de distinguer lecture comptable et lecture opérationnelle lorsque les deux coexistent.

---

## 6. GOUVERNANCE DE LA DONNÉE

### 6.1 Principe fondamental

La valeur de Lynki dépend de la confiance dans les chiffres affichés.

Le projet doit donc inclure un socle de gouvernance de la donnée permettant de préciser :

- l’origine de chaque donnée,
- sa fréquence de mise à jour,
- son niveau de fiabilité,
- sa date de valeur,
- ses règles de transformation,
- son périmètre de validité.

---

### 6.2 Notion de source de vérité

Pour chaque **KPI, restitution ou vue de détail**, il faudra définir :

- la ou les sources utilisées,
- la source faisant foi en cas de divergence,
- les règles de priorité entre systèmes,
- la stratégie de gestion des écarts.

---

### 6.3 Dictionnaire des indicateurs

Un livrable dédié devra formaliser pour chaque **KPI, restitution ou vue de détail** :

- définition métier,
- formule de calcul,
- unités,
- conventions de signe,
- inclusions / exclusions,
- fréquence de calcul,
- source(s),
- périmètre,
- cas limites,
- règles de restitution,
- base de calcul comptable ou non comptable,
- comptes, types de comptes ou journaux mobilisés si applicable,
- niveau d’agrégation comptable,
- règle de lettrage / ouverture de poste si applicable,
- version du mapping comptable utilisée.

Ce dictionnaire est indispensable à la réussite du projet.

---

### 6.4 Fraîcheur des données

La notion de “temps réel” devra être encadrée.

Pour chaque domaine, il faudra préciser :

| Domaine | Fréquence source | Fréquence d’intégration | Latence cible |
|---|---|---|---|
| Banque | API ou import | selon connecteur | quasi temps réel à J+1 |
| ERP / facturation | événementiel ou batch | quotidien ou plus fréquent | J à infra-journalier |
| Comptabilité | batch | quotidien | J+1 |
| POS / caisse | session / clôture | quotidien ou quasi temps réel | session à J |
| Paie | mensuel | mensuel | M |
| Fiscalité | mensuel / échéance | mensuel | M |

---

### 6.5 Référentiel comptable et règles d’agrégation

Le projet devra inclure un **référentiel comptable de restitution** formalisant la manière dont les écritures sont transformées en rubriques Lynki.

**Document de référence (web57) :** [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md).

Ce référentiel devra préciser :

- les comptes ou catégories de comptes mobilisés,
- la logique de regroupement par rubriques,
- les conventions de signe,
- les règles de conversion éventuelle multi-devises,
- la gestion des écritures d’extourne, d’à-nouveaux et de clôture,
- la gestion des écritures non postées ou brouillons,
- la gestion des écritures de tiers partiellement lettrées,
- les règles de calcul des balances âgées,
- les règles de construction et de restitution de la **balance générale** (liste des comptes, soldes d’ouverture, mouvements débit/crédit, soldes de période, lien avec les agrégats de bilan / compte de résultat),
- les règles d’ouverture, de tri et de restitution du grand livre,
- les règles de priorisation entre comptabilité générale, auxiliaire et autres sources.

Pour les déploiements français, ce référentiel devra être **compatible avec le plan comptable FR**, tout en restant implémenté de manière suffisamment abstraite pour préserver l’objectif **ERP agnostique** du produit.

---

## 7. SPÉCIFICATIONS TECHNIQUES ORIENTÉES PRODUIT

### 7.1 Architecture cible

Le produit devra reposer sur une architecture modulaire comprenant :

- un **frontend** moderne,
- une **API de restitution**,
- un ou plusieurs **connecteurs d’ingestion**,
- un **moteur de calcul / agrégation**,
- un **référentiel de données consolidées**,
- un **mécanisme d’historisation**,
- un **moteur d’insights**.

L’architecture doit rester compatible avec une stratégie **ERP agnostique** et **multi-tenant**.

---

### 7.2 Frontend

Technologies possibles :

- React.js / Next.js ou Vue.js
- Tailwind / composant UI moderne
- composants de restitution clairs et robustes
- design dark mode prioritaire
- responsive desktop / mobile / tablette

Le frontend devra privilégier :

- lisibilité,
- rapidité,
- hiérarchisation des informations,
- clarté de navigation.

---

### 7.3 Backend

Attendus :

- API RESTful ou équivalent
- authentification sécurisée
- gestion de droits par périmètre
- endpoints de consultation synthèse / détail
- endpoints d’historique
- endpoints d’explication / justification des chiffres
- journalisation des accès et calculs

---

### 7.3.1 Moteur d’agrégation comptable

Le backend devra intégrer un moteur d’agrégation comptable permettant :

- de lire des écritures validées issues des ERP ou systèmes comptables sources,
- de les regrouper selon un référentiel de restitution,
- de produire des vues de bilan et de compte de résultat à date,
- de produire une **balance générale** par compte, cohérente avec ces agrégats et servant de pivot vers le grand livre,
- de calculer des balances auxiliaires clients et fournisseurs,
- d’ouvrir des vues de grand livre cohérentes avec les agrégats et la balance générale restitués,
- de conserver la traçabilité des calculs,
- de rejouer un calcul sur une période, un périmètre et une version de mapping donnés.

Ce moteur devra être conçu de manière compatible avec une stratégie multi-tenant, multi-sociétés et ERP agnostique.

---

### 7.4 Stockage

Besoins principaux :

- base relationnelle principale,
- cache de consultation,
- stockage historisé des états ou événements de calcul,
- stratégie de rétention conforme aux contraintes légales et métier.

---

### 7.5 Intégrations cibles

Le système doit pouvoir se connecter à terme à :

- ERP (Odoo, ERPNext, Sage, autres),
- banques / agrégateurs bancaires,
- POS / caisse,
- comptabilité,
- paie,
- CRM / ventes,
- outils d’exports comptables.

---

## 8. PERFORMANCE ET DISPONIBILITÉ

### Exigences cibles

- temps d’affichage initial rapide sur écran de synthèse,
- restitution fluide sur données déjà synchronisées,
- capacité à supporter plusieurs utilisateurs simultanés,
- haute disponibilité en heures ouvrées,
- comportement prévisible même en cas de retard d’alimentation de certaines sources,
- performances acceptables sur une volumétrie normale d’écritures comptables et de postes tiers.

### Important

La performance devra être appréciée en tenant compte de la nature des flux sources.  
Une donnée “quasi temps réel” ne signifie pas que toutes les sources seront instantanées.

---

## 9. SÉCURITÉ ET CONFORMITÉ

### Exigences minimales

- HTTPS obligatoire
- authentification sécurisée
- gestion des rôles
- journalisation
- protection des endpoints
- chiffrement des données sensibles
- sauvegardes automatiques
- conformité RGPD
- gestion des accès et des exports
- audit trail des actions critiques

---

## 10. ERGONOMIE ET DESIGN

### 10.1 Principes UI

L’interface doit refléter une posture de cockpit sérieux, lisible et professionnel.

Principes directeurs :

- dark mode assumé,
- faible charge cognitive,
- contraste fort,
- lecture rapide,
- hiérarchie visuelle claire,
- priorité à la synthèse,
- détail accessible sans saturer l’écran.

---

### 10.2 Composants attendus

#### Grille de cartes KPI
- lecture immédiate,
- libellé court,
- valeur forte,
- aide contextuelle,
- variation,
- statut / couleur,
- timestamp.

#### Bloc insights
- largeur pleine,
- lecture narrative naturelle,
- hiérarchie entre message principal et compléments,
- indication de date / fraîcheur.

#### Vues détail
- tableaux hiérarchisés,
- comparatifs période,
- tendances,
- exposition par client, flux, compte, rubrique ou périmètre selon KPI,
- accès à une **balance générale** filtrée depuis les restitutions comptables,
- accès à un grand livre filtré depuis les restitutions comptables ou depuis la balance générale,
- navigation du synthétique vers l’écriture justificative selon les droits.

---

### 10.3 Responsive

- mobile : consultation synthèse et détail simplifié
- tablette : lecture intermédiaire
- desktop : cockpit complet

La version mobile devra rester utilisable, mais le desktop constitue le support prioritaire du cockpit de pilotage.

---

### 10.4 Accessibilité

- conformité WCAG 2.1 AA visée
- contrastes suffisants
- navigation clavier
- labels accessibles
- compatibilité lecteurs d’écran
- non-dépendance exclusive à la couleur

---

## 11. CONTRAINTES MÉTIER

### 11.1 Multi-sociétés et multi-périmètres

Le produit devra gérer :

- plusieurs tenants,
- plusieurs sociétés,
- plusieurs établissements,
- plusieurs points de vente,
- plusieurs périmètres de consolidation.

---

### 11.2 Temporalité de gestion

Le système devra distinguer, selon les cas :

- date comptable,
- date de valeur,
- date d’émission,
- date d’encaissement,
- date opérationnelle,
- date de lecture.

Cette distinction est essentielle pour un vrai outil de contrôle de gestion.

---

### 11.3 Devises et exercices

- multi-devises à prévoir
- exercices comptables configurables
- gestion des fuseaux si besoin multi-pays

---

## 12. LOTISSEMENT PROJET

Pour rester réaliste, le projet devra être phasé.

---

### Phase 1 — Cadrage métier et data

Livrables :

- cadrage des périmètres,
- dictionnaire des **KPIs, restitutions et vues de détail**,
- cartographie des sources,
- règles de priorité,
- cas d’usage,
- maquettes de synthèse,
- architecture cible,
- référentiel comptable de restitution.

Le **dictionnaire des indicateurs** est un préalable à la recette du MVP (Phase 2).

---

### Phase 2 — MVP Lynki

Périmètre recommandé :

- authentification,
- gestion de rôles simple,
- grille de cartes priorisées incluant, selon le périmètre retenu, un noyau de KPIs de trésorerie / activité et au moins une première restitution comptable structurante,
- bloc insights principal,
- filtres période et périmètre,
- drill-down simple,
- 2 à 3 sources intégrées,
- export basique,
- audit de consultation minimal,
- première couche de mapping comptable,
- première restitution de type bilan ou compte de résultat simplifié,
- première **balance générale** par comptes ou, à défaut, chemin de drill-down explicite vers le grand livre selon priorité métier,
- première balance clients ou fournisseurs selon priorité métier,
- préparation technique pour rejouabilité (modèle de données, clés période/périmètre, versionnement mapping) sans exposition utilisateur.

Objectif : **livrer une lecture de gestion fiable avant de chercher l’exhaustivité.**

---

### Phase 3 — V1 enrichie

- alertes configurables,
- historique des insights,
- comparaisons temporelles,
- vues détail avancées,
- multi-sociétés étendu,
- meilleure explicabilité,
- exports enrichis,
- extension du socle comptable et auxiliaire.

---

### Phase 4 — Évolutions structurantes

- lecture pleinement rejouable,
- simulation de scénarios,
- consignation des décisions,
- assistant de commentaire avancé,
- collaboration autour des lectures.

---

## 13. LIVRABLES ATTENDUS

### Conception
- maquettes haute fidélité
- prototype interactif
- architecture validée
- dictionnaire des **KPIs, restitutions et vues de détail**
- cartographie des sources
- règles de gestion
- référentiel comptable de restitution

### Développement
- frontend cockpit
- backend API
- connecteurs priorisés
- moteur de calcul
- moteur d’insights
- moteur d’agrégation comptable
- gestion des accès

### Recette
- cas de tests métier
- tests de cohérence des KPI
- tests d’intégration
- tests de performance
- validation utilisateurs
- rapprochement de cohérence entre restitutions Lynki et données comptables sources

### Documentation
- documentation technique
- documentation d’exploitation
- guide utilisateur
- guide d’administration
- procédure incident / reprise
- guide de lecture des restitutions comptables, de la balance générale et du grand livre

**Artefacts déjà amorcés (web57), à maintenir et étendre :**
- alignement CDC / code / UX : [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) ;
- dictionnaire des restitutions comptables (fiches §4.1.1) : [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) ;
- référentiel comptable de restitution (§6.5) : [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) ;
- avis d’expert sur le CDC (synthèse, gouvernance) : [AVIS_EXPERT_CDC_MASTER_LYNKI.md](AVIS_EXPERT_CDC_MASTER_LYNKI.md) ;
- runbook incident source Odoo (ex. erreurs de vue / modules OCA) : [RUNBOOK_ODOO_OWLERROR_STOCK_PICKING_INVOICE_IDS.md](RUNBOOK_ODOO_OWLERROR_STOCK_PICKING_INVOICE_IDS.md).

---

## 14. CRITÈRES D’ACCEPTATION

### Fonctionnels
- les KPIs affichés correspondent aux définitions validées,
- la lecture synthèse est exploitable par un RAF/DAF,
- les vues détail permettent de justifier les chiffres,
- les insights sont cohérents avec les données et la période,
- les filtres de périmètre et de temps fonctionnent correctement,
- les restitutions comptables **synthétiques** restituent des montants cohérents avec les écritures validées du périmètre,
- les balances clients et fournisseurs distinguent correctement les postes échus et non échus,
- le drill-down permet de remonter d’une carte vers les éléments justificatifs pertinents,
- les vues de **balance générale** restituent correctement les soldes par compte pour le périmètre, la période et les filtres demandés,
- les vues de grand livre restituent correctement les écritures correspondant au périmètre, à la période et aux filtres demandés,
- les soldes présentés dans les restitutions comptables sont **réconciliables** avec les vues de balance générale et de grand livre, selon le périmètre, la période et les règles de calcul retenues,
- une restitution synthétique comptable doit pouvoir être expliquée **sans rupture logique** par une chaîne de preuve de type : **restitution synthétique → rubrique → compte → balance générale → écriture détaillée (grand livre)**.

### Métier
- chaque **KPI, restitution ou vue comptable structurante** dispose d’une définition formalisée et chaque restitution affichée est couverte par une entrée du dictionnaire validée,
- les écarts de source sont traités selon des règles connues,
- la fraîcheur de donnée est visible,
- les informations sont suffisamment fiables pour être utilisées en pilotage,
- le référentiel comptable de restitution est formalisé et validé,
- les conventions de signe et de regroupement sont documentées,
- les règles d’accès et d’usage de la balance générale et du grand livre sont définies,
- les écarts éventuels entre lecture comptable et lecture opérationnelle sont explicitables.

### Techniques
- le cockpit reste fluide sur périmètre normal d’usage,
- les droits d’accès sont respectés,
- les exports sont corrects,
- les logs et audits sont disponibles,
- la sécurité de base est validée,
- les calculs comptables sont rejouables sur une période et un périmètre donnés,
- les versions de mapping utilisées sont historisées,
- les soldes de **balance générale** et la somme des lignes du **grand livre** permettent de **réconcilier** les montants des restitutions synthétiques comptables (écart nul ou explicité par règle documentée),
- les ouvertures de grand livre restent cohérentes avec les agrégats et la balance générale affichés,
- les performances restent acceptables sur une volumétrie normale d’écritures.

---

## 15. ORGANISATION DU PROJET

### Rituels
- kick-off
- ateliers métier / KPI
- ateliers data / sources
- ateliers comptables / référentiel de restitution
- démonstrations régulières
- arbitrages de périmètre
- recette métier pilotée par cas réels

### Outils
- outil de gestion projet
- outil de design collaboratif
- dépôt Git
- documentation partagée
- environnement de préproduction

---

## 16. MAINTENANCE ET ÉVOLUTIONS

### Maintenance corrective
- correction des anomalies
- surveillance des flux critiques
- traitement des ruptures de connecteurs
- correction des écarts de mapping ou d’agrégation détectés

### Maintenance évolutive
- enrichissement des vues
- nouveaux connecteurs
- nouveaux KPIs
- nouvelles règles d’analyse
- approfondissement de la simulation
- enrichissement du moteur de décision
- enrichissement du référentiel comptable et des restitutions auxiliaires

---

## 17. POINTS DE VIGILANCE

Le projet devra faire l’objet d’une vigilance particulière sur :

- la qualité réelle des données sources,
- le cadrage métier précis des indicateurs,
- la distinction entre temps réel, quasi temps réel et batch,
- la dérive de périmètre fonctionnel,
- la tentation de faire un outil BI générique au lieu d’un assistant de contrôle de gestion,
- la lisibilité UX sur mobile,
- l’explicabilité des chiffres et des insights,
- la qualité du mapping comptable et des règles de regroupement,
- la gestion correcte des temporalités comptables et auxiliaires,
- la cohérence entre lecture opérationnelle et vérité comptable,
- **lorsque l’ERP source est Odoo** : cohérence **version Odoo ↔ modules OCA / custom** (modules installés mais non installables, vues résiduelles en base) pouvant bloquer l’UI métier (facturation, livraisons) et donc la fiabilité perçue des données exposées à Lynki ; maintenir des runbooks d’exploitation et une liste de modules autorisés par environnement.

---

## 18. SYNTHÈSE

Le produit attendu n’est pas un simple dashboard financier.  
Il s’agit d’un **cockpit de contrôle de gestion permanent**, pensé pour aider une direction et ses fonctions finance à :

- lire le réel,
- comprendre les tensions,
- justifier les chiffres,
- comparer dans le temps,
- et préparer des décisions mieux informées.

La réussite du projet ne reposera pas uniquement sur la qualité de l’interface, mais sur la combinaison de quatre dimensions :

- **fiabilité des données**,
- **qualité des règles métier**,
- **clarté de restitution**,
- **capacité d’explication**.

Lynki s’organise en **trois étages** complémentaires : lecture de **pilotage**, **restitutions comptables structurées** (dont balance générale comme pivot), et **preuve détaillée** via le grand livre.  
Dans cette logique, le **grand livre** fait partie des mécanismes de preuve attendus : il permet de passer d’une lecture synthétique à une justification comptable exploitable, en s’appuyant notamment sur la balance générale.

En synthèse, **Lynki combine une lecture multi-sources de gestion et un socle comptable explicable, fondé sur l’agrégation d’écritures validées et la lecture auxiliaire des tiers, afin de produire un contrôle de gestion permanent, fiable et rejouable**.