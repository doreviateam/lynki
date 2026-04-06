# Plan d’implémentation — HelloAsso billetterie → Odoo (Scrum-like)

| | |
|---|---|
| **Version** | 0.1.7 |
| **Date** | Avril 2026 |
| **Statut** | Plan de travail — à ajuster selon vélocité et arbitrages |
| **Documents de référence** | [Big Picture](./The_Big_Picture.md) · [SPEC](./SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md) · [ADR](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) · [Recette MVP](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) |

---

## 1. Objectif produit (Product Goal)

Livrer un **connecteur Odoo MVP** qui synchronise les **ventes billetterie HelloAsso** vers Odoo avec :

- **commande** comme ancrage de traçabilité et d’idempotence ;
- **payeur** comme pivot de rapprochement ;
- **participants** conservés explicitement ;
- **pas d’événement miroir Odoo obligatoire** au premier lot (ADR).

**Hors scope initial :** tout ce qui figure en SPEC §11 / recette « hors périmètre » sans décision écrite.

**Principe directeur :** le développement du connecteur billetterie doit commencer par un **sprint de découverte** cadré par l’ADR, **avant** d’engager le socle Odoo, la synchro payeur / commande, puis la **conservation explicite des participants**.

---

## 2. Cadre Scrum-like (léger)

| Élément | Proposition |
|---------|-------------|
| **Durée de sprint** | **2 semaines** (ajustable : 1 semaine si équipe très petite) |
| **Cérémonies** | Planif sprint (1 h) · Daily (15 min) · Revue + rétro (1 h 30) |
| **Artefacts** | Backlog produit (ce document) · Backlog sprint (outil interne) · Incrément potentiellement livrable |
| **Référence technique** | Doc [HelloAsso_adhérent](../HelloAsso_adhérent/) / module **`dorevia_helloasso_members`** — **inspiration uniquement** ; pas de fusion de code sans arbitrage |

Le **Product Owner** aligne priorités avec l’ADR ; le **Scrum Master** (ou lead dev) protège le périmètre MVP.

---

## 3. Prérequis avant Sprint 1 (Definition of Ready — projet)

- [ ] **Sandbox HelloAsso billetterie** : au moins une commande éligible documentée (JSON ou export).
- [ ] **ADR §1** : identifiant d’idempotence figé ou **hypothèse de travail** notée (`order.id` vs clé composée).
- [ ] **ADR §3** : choix minimal sur le **support** participants (trace structurée vs `res.partner` — même provisoire).
- [ ] **Rattachement** LGZ/RGL/CCC : **première règle** ou cas par **défaut** documenté (ADR §5).
- [ ] Dépôt : module Odoo dédié **`dorevia_helloasso_billetterie`** (aligné sur le vocabulaire doc *billetterie*) ; valider le nom en Sprint 0 si exception métier.

Sans cela, le sprint 1 reste de la **spike** uniquement.

---

## 4. Vue par phases (épiques)

| ID | Épique | Description |
|----|--------|-------------|
| E0 | **Fondations & audit API** | Payloads commande / paiement / participants ; alignement ADR |
| E1 | **Socle module Odoo** | Manifest, dépendances, paramètres, client HTTP, logs |
| E2 | **Synchro MVP** | Lecture HelloAsso → écriture Odoo (payeur, participants, traçabilité commande) |
| E3 | **Qualité & idempotence** | Tests auto, rejouabilité, critères CA-B01–CA-B04 |
| E4 | **Automatisation & lab** | `ir.cron`, déploiement lab, recette [RECETTE…](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) |
| E5 | **Reporté (backlog post-MVP)** | Événement miroir, `queue_job`, compta, annulations… |

---

## 5. Déroulement suggéré par sprint

Les numéros sont **indicatifs** ; fusionner ou étaler selon l’équipe.

### Sprint 0 — Découverte (spike, 1–2 semaines)

| Stories (exemples) | Livrable |
|--------------------|----------|
| S0.1 — Capturer payloads JSON billetterie (commande, paiement, billets) | Note ou fichier d’exemples anonymisés |
| S0.2 — Cartographier champs vs SPEC §6.1 | Table brouillon HelloAsso → Odoo |
| S0.3 — Mettre à jour ADR (identifiant idempotence, option participants) | ADR v0.2+ |
| S0.4 — Décision nom module + structure repo (référence : `dorevia_helloasso_billetterie`) | README module |

**Definition of Done sprint 0 :** ADR relu ; risques identifiés ; GO / NO-GO pour développement encadré.

**Artefacts Sprint 0 utiles** (outil de suivi ou wiki) :

- **Backlog Sprint 0** aligné sur S0.1–S0.4 ;
- **Table d’audit payloads** (commande / paiement / participants / billets), données **anonymisées** ;
- **Checklist** : au moins un extrait ou schéma par famille d’objet API réellement interrogé.

---

### Sprint 1 — Socle technique

| Stories | Livrable |
|---------|----------|
| S1.1 — Créer module Odoo (manifest, `depends`, structure `models/`) | Module installable (vide ou stub) |
| S1.2 — Paramètres (`ir.config_parameter` ou `res.config.settings`) alignés SPEC | Écran Paramètres ou équivalent |
| S1.3 — Client API : OAuth2 + appels lecture **formulaire / commande / paiement / participants** (et billets si exposés), selon ce que l’API livre réellement | Logs de test OK |
| S1.4 — Journalisation structurée (SPEC §9) | Niveau log défini |

---

### Sprint 2 — Premier incrément fonctionnel

| Stories | Livrable |
|---------|----------|
| S2.1 — Résoudre une commande éligible depuis l’API | Méthode déterministe |
| S2.2 — Créer / mettre à jour **payeur** (`res.partner`) | Rapprochement minimal |
| S2.3 — **Conserver explicitement les participants** (support retenu en S0/S1), **sans confusion** avec le payeur | Données visibles dans Odoo |
| S2.4 — Stocker identifiant commande source + statut synchro | Traçabilité CA-B01 |

---

### Sprint 3 — Robustesse & tests

| Stories | Livrable |
|---------|----------|
| S3.1 — Idempotence : rejouer sans doublon (CA-B03) | Comportement validé |
| S3.2 — Cas ambigus (doublons, email) : pas de fusion aveugle | Logs + règle documentée |
| S3.3 — Tests automatisés (mocks API) | CI verte |
| S3.4 — Repasser recette §1–§4 (checklist) | Tableau « État de validation » mis à jour |

---

### Sprint 4 — Automatisation & mise en lab

| Stories | Livrable |
|---------|----------|
| S4.1 — `ir.cron` + modèle technique (comme adhérent) | **Cron désactivé par défaut** — activation **après** validation lab / recette manuelle (éviter la synchro planifiée avant preuve terrain) |
| S4.2 — Upgrade module + procédure déploiement (README tenant) | Doc ops |
| S4.3 — Revue MOA sur CA-B01–B04 | Validation signée ou backlog correctifs |

---

## 5 bis. Mode exécution — fil conducteur (Sprint 0 → 4)

**Règle :** l’exécution commence par l’**audit payloads** billetterie et les **décisions ADR**, pas par le `ir.cron`, ni par des écrans ou du code « au hasard ».

### Sprint 0 — audit utile

**Objectif :** réduire l’incertitude sur l’API billetterie réelle.

- Récupérer un ou plusieurs **payloads réels** (commande, paiement, participants, billets) ; les **anonymiser**.
- Compléter une première **table de mapping** HelloAsso → Odoo (brouillon exploitable).
- **Figer dans l’ADR** : `order.id` seul vs **clé composée** ; **support minimal** des participants.

**Livrables fin Sprint 0 :** exemples JSON propres (anonymisés) ; **ADR billetterie** mis à jour ; **décision sur le nom du module** ; **GO** (ou NO-GO) pour développement MVP.

### Sprint 1 — socle Odoo

Module installable, manifest, dépendances, paramètres HelloAsso, client API **lecture seule**, logs structurés ; **test de connexion / lecture minimal**.

### Sprint 2 — premier flux métier

Commande éligible → **payeur** ; **participants** conservés explicitement (sans confusion avec le payeur) ; traçabilité commande ; incrément **testable en lab**.

### Sprint 3 — fiabiliser

Rejouabilité, anti-doublons, cas ambigus, tests auto, recette **CA-B01 à CA-B04**.

### Sprint 4 — exploitation

`ir.cron` (désactivé par défaut jusqu’à validation lab), doc d’exploitation, validation lab finale.

### Ordre ultra concret (« demain matin »)

1. **Figer le nom du module** (référence doc : `dorevia_helloasso_billetterie`, sauf exception validée).
2. **Capturer les payloads JSON billetterie** (réels, puis anonymisés).
3. **Mettre à jour l’ADR** (idempotence, support participants).
4. **Créer le squelette du module** Odoo.
5. **Brancher les paramètres** (HelloAsso / OAuth selon SPEC).
6. **Faire une lecture API simple** (preuve dans les logs).
7. **Enchaîner commande + payeur**.
8. **Puis participants** (explicitement, distincts du payeur).

### Ticket 1 — Audit payloads billetterie HelloAsso *(point d’entrée d’exécution)*

**Objectif :** capturer et anonymiser les **payloads réels** billetterie nécessaires au MVP.

Le Ticket 1 ne doit **pas** devenir une discussion floue : il doit produire, **noir sur blanc**, les quatre sorties ci-dessous (JSON anonymisés, tableau de mapping, ADR à jour, GO/NO-GO). **Tant qu’elles ne sont pas là, l’équipe reste en spike** — et c’est le comportement attendu.

**Suite :** à ce stade, **aucune nouvelle couche documentaire** n’est requise. Il s’agit d’**exécuter Ticket 1 jusqu’à sa clôture formelle**. La prochaine étape utile est **terrain API / payloads** — **rien d’autre** avant cette clôture.

> **Phrase de pilotage :** le Ticket 1 **n’est pas** un ticket de **développement** ; c’est un ticket de **levée d’incertitude**. Tant qu’il n’est **pas** clos, le développement du connecteur billetterie ne doit **pas** sortir du périmètre **spike** (pas de synchro métier ni de cron au-delà de ce qui sert à **lire** et **documenter** les payloads).

**Mini-lot (cadre de rythme)**

| | |
|---|-------------|
| **Entrées** | Sandbox billetterie disponible ; **au moins une commande test payée** ; accès **API** / prévisualisation / exports utiles. |
| **Sorties** | Dossier payloads anonymisés ; **tableau de mapping** brouillon ; **mise à jour de l’ADR** ; **décision de passage** Sprint 1 (GO ou spike prolongé). |
| **Critère de décision** | Payloads **lisibles et suffisants** pour trancher mapping + idempotence + participants → **GO Sprint 1**. Objets API **encore ambigus** ou données **insuffisantes** → **Spike prolongé** (itérer capture / questions API, pas élargir le code connecteur). |

**Ce que cela veut dire pour l’équipe**

- **Ce n’est pas** la mission immédiate : imaginer des **modèles** Odoo ; brancher un **`ir.cron`** ; écrire la **synchro métier**.
- **C’est** la mission immédiate : **capturer** · **anonymiser** · **comparer** · **cartographier** · **trancher** l’incertitude **minimale** (idempotence, payeur, participants, faisabilité Sprint 1).

**Attendus (résumé) :**

- exemple **commande** ;
- exemple **paiement** ;
- exemple **participants** / **billets** (selon ce que l’API expose) ;
- première **table de mapping** vers Odoo ;
- **ADR billetterie** mis à jour sur l’**ancrage idempotence** (`order.id` vs clé composée) et le **support minimal des participants** ;
- **GO développement MVP** ou **NO-GO** (spike à prolonger) une fois les points ci-dessous clos.

**Sortie structurée en 4 artefacts :**

| # | Artefact | Contenu minimal |
|---|----------|-----------------|
| **1** | **Dossier payloads anonymisés** | Fichiers d’exemple (noms indicatifs) : `order_sample_01.json`, `payment_sample_01.json`, `participants_sample_01.json` ou payload source équivalent ; éventuellement `form_sample_01.json` si utile au mapping. |
| **2** | **Table de mapping brouillon** | Colonnes : **HelloAsso objet/champ** · **Exemple observé** · **Cible Odoo envisagée** · **Obligatoire ?** · **Remarque / arbitrage**. |
| **3** | **Mise à jour ADR** | À figer ou préciser : `order.id` seul **ou** clé composée ; **support minimal** participants (provisoire explicite). |
| **4** | **Décision GO / NO-GO Sprint 1** | Mini-conclusion : **GO Sprint 1** ou **Spike à prolonger** — consignée par écrit (note, MR, ou entrée d’outil). |

**Discipline de pilotage (à garder après le cadrage doc) :**

- ne pas coder la **synchro métier** avant d’avoir les **JSON** ;
- ne pas ouvrir le **cron** avant d’avoir le **flux manuel** ;
- ne pas **sur-modéliser les participants** avant la **lecture réelle** des payloads.

#### Clôture Ticket 1 — conditions minimales

Le **Ticket 1** est considéré comme **clos** lorsque :

- au moins **un jeu** de payloads billetterie **réels** a été **capturé et anonymisé** ;
- la **table de mapping brouillon** HelloAsso → Odoo **existe** ;
- l’**ADR** a été **mis à jour** sur l’**ancrage d’idempotence** et le **support minimal des participants** ;
- une **décision explicite** **GO / NO-GO** pour **Sprint 1** a été **consignée**.

**À la clôture Ticket 1 — signal de maturité (quatre questions)**

Lorsque le Ticket 1 est **clos**, l’équipe doit pouvoir répondre **sans hésitation** à :

1. **Quel objet HelloAsso exact** ancre l’**idempotence** MVP ?
2. **Quelles données minimales du payeur** vont dans Odoo ?
3. **Sous quelle forme minimale** conserve-t-on les **participants** ?
4. **A-t-on assez d’information** pour lancer **Sprint 1** sans rester en **spéculation** ?

Si l’une de ces réponses **manque encore**, le **spike continue** — discipline attendue.

> **Pilotage (formule courte) :** la documentation de cadrage est **suffisante** ; le chantier billetterie entre en phase de **levée d’incertitude contrôlée**. **Aucun développement métier** ne sort du périmètre **spike** tant que le **Ticket 1** n’est **pas** formellement clos.

**Synthèse — ce que le cadre assure**

- la doc amont est **suffisante** ; le **spike est assumé** ; le développement métier est **interdit** tant que l’**incertitude minimale** n’est pas levée ; la **sortie de spike** est **objectivée** (artefacts + questions de maturité).

**Cap à garder**

Ne **pas** rouvrir de **nouveaux débats de structure** tant que ne sont **pas** produits : les **payloads** ; le **mapping brouillon** ; la **mise à jour de l’ADR** ; le **GO / NO-GO**. En résumé : **moins de théorie, plus de matière réelle**.

> **Pilotage (fin de sur-préparation) :** le chantier billetterie **n’a plus besoin** d’être davantage cadré ; il doit maintenant **produire la matière réelle** qui permettra de **sortir du spike** de façon **contrôlée**.

**Prochain livrable utile** : le **dossier de payloads anonymisés** et son **analyse** (table de mapping, ADR) — **pas** un nouveau document de vision.

**Trame d’exécution (à remplir sur le terrain) :** [TICKET1_AUDIT_PAYLOADS.md](./TICKET1_AUDIT_PAYLOADS.md) — checklist, pistes pour obtenir les JSON, **tableau de mapping** vierge, emplacement [`audit_payloads_ticket1/`](./audit_payloads_ticket1/).

*(Ticket et tableau d’artefacts : à recopier dans l’outil de suivi — premier item du backlog Sprint 0.)*

---

## 6. Backlog produit (priorisé — à copier dans l’outil de suivi)

Ordre **haut → bas** (premier = plus prioritaire).

1. Audit payloads + mise à jour ADR (bloquant)
2. Module installable + paramètres
3. Synchro payeur + traçabilité commande
4. Participants explicites
5. Idempotence + tests
6. Recette MVP sur lab
7. `ir.cron`
8. *(Post-MVP)* Événement miroir, `queue_job`, etc.

---

## 7. Definition of Done (incrément)

- Code revu (pair ou MR) ; **pas** de régression sur le périmètre SPEC §11.
- Tests pertinents **verts** (ou exception documentée).
- Logs exploitables (succès / partiel / erreur).
- SPEC / ADR / recette **mentionnés** dans le CHANGELOG ou README module si changement de comportement.
- Démo possible en fin de sprint (même courte).

---

## 8. Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| API billetterie différente de l’adhérent | Sprint 0 obligatoire ; pas de réutilisation implicite |
| Arbitrage participants retardé | Timebox décision ; option « trace minimale » en ADR |
| Scope creep (événement miroir, compta) | Renvoi explicite SPEC §11 ; backlog E5 |
| Charge équipe | Réduire nombre de sprints ; livrer S2 minimal avant S3 |

---

## 9. Historique

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Création — phases, sprints suggérés, backlog, DoD, liens doc |
| 0.1.1 | Avril 2026 | Coquille §3 ; module `dorevia_helloasso_billetterie` ; S1.3 / S2.3 / S4.1 ; principe directeur ; artefacts Sprint 0 |
| 0.1.2 | Avril 2026 | §5 bis — mode exécution ; ordre « demain matin » ; **Ticket 1** audit payloads (premier ticket) |
| 0.1.3 | Avril 2026 | Ticket 1 — 4 artefacts ; clôture (conditions minimales) ; discipline pilotage ; GO/NO-GO explicite |
| 0.1.4 | Avril 2026 | Ticket 1 — mini-lot entrées/sorties/critère ; phrase de pilotage (spike vs dev) ; sorties « noir sur blanc » |
| 0.1.5 | Avril 2026 | Ticket 1 — mission équipe ; 4 questions maturité ; formule pilotage ; fin couche doc — exécution jusqu’à clôture |
| 0.1.6 | Avril 2026 | Synthèse cadre ; cap « moins de théorie » ; phrase fin sur-préparation ; prochain livrable = payloads + analyse |
| 0.1.7 | Avril 2026 | Trame exécution Ticket 1 : [TICKET1_AUDIT_PAYLOADS.md](./TICKET1_AUDIT_PAYLOADS.md) + dossier [audit_payloads_ticket1/](./audit_payloads_ticket1/) |

---

## 10. Liens internes

* [Big Picture](./The_Big_Picture.md)
* [SPEC billetterie](./SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md)
* [ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md)
* [Recette MVP compact](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md)
* [Note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md)
* [Ticket 1 — trame audit payloads](./TICKET1_AUDIT_PAYLOADS.md)

---
