# Backlog d’implémentation — Menu HelloAsso dans Odoo

| | |
|---|---|
| **Référence** | [Note d’arborescence fonctionnelle (version opérationnelle)](./note_arborescence_fonctionnelle_menu_helloasso.md) |
| **Usage** | Prioriser et suivre les travaux **UI / menu** alignés sur la cible ; ne remplace pas les backlog métier des flux (recette, mapping API). |

**Priorité** : `P0` = cohérence minimale du menu ; `P1` = utile rapidement après P0 ; `P2` = arbitrage / confort / refacto ; **Acté** = règle fixe sans gros développement.

---

## Lot 1 — gelé (cohérence minimale du menu)

**Décision de pilotage :** enchaîner dans cet **ordre logique** :

1. **M2 — Adhérents** : corriger l’angle mort principal (l’app n’expose aujourd’hui que la billetterie alors que le flux adhérents existe).
2. **M8 — Ordre et libellés** : sans menu propre, l’app reste bancale même après M2 — à traiter **au même niveau de criticité** que M2.
3. **M1 — Vue d’ensemble** : vraie entrée applicative ; améliore l’expérience mais n’est pas le premier levier de cohérence.

**M7** (synchro manuelle dans Paramètres) reste **acté** — pas de changement majeur, éventuels liens depuis M1.

---

## Phasage (lots 2 et 3)

### Lot 2 — confort et lisibilité

* **M5 — Synchronisations** (journal / pilotage des exécutions, utile pour la recette).
* **M6 — Aide** (page d’orientation : questions fréquentes, raccourcis menu ; anciennement « Repère »).

### Lot 3 — arbitrages

* **M4 — Lignes** : menu séparé ou uniquement onglet sur la commande (sobriété).
* **M9 — Module racine commun** : refacto éventuelle pour ne pas porter l’app uniquement sur `dorevia_helloasso_billetterie`.

---

## Priorités proposées (lecture nette)

| ID | Priorité proposée | Pourquoi |
|----|-------------------|----------|
| M2 | **P0** | Rendre **visible dans l’app HelloAsso** un flux **déjà implémenté** (adhérents). |
| M8 | **P0** | **Cohérence minimale** de lecture du menu (sequences, libellés, groupes) — sans cela, l’app reste confuse après M2. |
| M1 | **P1** | Améliore l’**entrée** dans l’app ; pas bloquant pour la première cohérence flux / menu. |
| M7 | **Acté** | Pas de travail majeur : **conserver** synchro manuelle sous **Paramètres** ; liens optionnels depuis M1. |
| M5 | **P1** | Utile rapidement pour **piloter la recette** et comprendre ce que le connecteur a fait. |
| M6 | **P2** | Page **Aide** : orientation utilisateur ; **sans fuite technique** (titre métier, pas de NewId / nom de modèle). |
| M4 | **P2** | Dépend de la **sobriété** voulue (MVP menu). |
| M9 | **P2** | **Refacto** propre ; pas nécessaire tout de suite. |

### Lecture produit (une phrase)

**M2** corrige l’angle mort principal → **M8** remet le menu au propre → **M1** donne une entrée applicative → le **reste** enrichit ensuite.

---

## Backlog détaillé

| ID | Sujet | Action à créer / modifier | Priorité | Dépendance |
|----|--------|---------------------------|----------|------------|
| M1 | **Vue d’ensemble** | Créer une **action d’accueil** (client action, tableau de bord minimal ou `ir.actions.act_window` vers un modèle dédié léger) + `menuitem` sous `menu_dorevia_helloasso_root` ; contenu : état connexion (lecture `ir.config_parameter`), derniers sync si données disponibles, liens vers Commandes / Adhérents. | **P1** | Idéalement après **M2** et **M8** ; support technique à définir (QWeb, `board`, modèle `helloasso.dashboard`, etc.). |
| M2 | **Adhérents** sous HelloAsso | Ajouter un **menu** + `ir.actions.act_window` sur `res.partner` avec **domaine / filtre** « synchronisés HelloAsso adhérent » (ex. `helloasso_external_id` défini + `helloasso_form_type` = Membership, ou critère validé métier). | **P0** | Arbitrer le **domaine exact** avec le métier. |
| M3 | **Billetterie / Commandes** | Déjà livré : conserver / renommer libellés si besoin pour cohérence avec la note (`helloasso_billetterie_order_views.xml`). | — | Sous **M8**. |
| M4 | **Billetterie / Lignes** (menu séparé) | Décider : menu + liste `dorevia.helloasso.billetterie.line` ou **pas** de menu (onglet sur commande uniquement). | **P2** | Décision UX. |
| M5 | **Synchronisations** | Modèle journal (`dorevia.helloasso.logentry`, etc.) + menu + vues liste ; alimenter depuis les `run_*_sync`. | **P1** | Lot 2 ; peut être simplifié (compteur config) en attendant. |
| M6 | **Aide** (ex. « Repère » / « Formulaires ») | Page d’orientation dans l’app : titre **Aide HelloAsso**, menu **Aide**, contenu court (FAQ) ; pas d’identifiant technique visible (`name` + `name_get`, libellés métier). | **P2** | Lot 2. |
| M7 | **Synchro manuelle** | **Rester dans Paramètres** ; liens depuis Vue d’ensemble si M1. | **Acté** | M1 si liens. |
| M8 | **Ordre et libellés menu** | Harmoniser `sequence`, traductions, groupes de sécurité (métier vs technique). | **P0** | Recommandé **juste après M2** (ou en parallèle serré) pour un rendu cohérent. |
| M9 | **Icône / module racine** | Arbitrer module **pont** `dorevia_helloasso` vs menu racine dans `dorevia_helloasso_billetterie`. | **P2** | Lot 3. |

---

## État de traitement (à cocher au fil de l’eau)

| ID | Statut | Date | Commentaire |
|----|--------|------|-------------|
| M1 | ☑ Livré code | | Lot 1 — `dorevia.helloasso.landing` (action technique / synthèse ; **pas** d’entrée de menu racine dédiée à ce jour) |
| M2 | ☑ Livré code | | Lot 1 — action `res.partner` + domain Membership |
| M3 | ☑ Livré | | Commandes billetterie |
| M4 | ☐ À arbitrer | | Lot 3 |
| M5 | ☑ Livré code | | Lot 2 — journal ``dorevia.helloasso.logentry`` + menu |
| M6 | ☑ Livré code | | Lot 2 — page **Aide** (ex-Repère) : FAQ, raccourcis ; évolutions UX listes Billetteries / Commandes documentées ci-dessous |
| M7 | ☑ Acté | | Paramètres |
| M8 | ☑ Livré code | | Lot 1 — sequences + libellés dans `helloasso_menu_lot1.xml` |
| M9 | ☐ À arbitrer | | Lot 3 |

### Arbitrage UX (page Aide)

L’écran **Aide** est une **page d’orientation** : titre **Aide HelloAsso**, entrée de menu **Aide** (remplace **Repère**), textes courts et questions concrètes ; pas d’affichage d’enregistrement technique (`NewId`, nom de modèle). L’implémentation peut rester dans `dorevia_helloasso_billetterie` jusqu’à un futur module `dorevia_helloasso_app` si l’on centralise l’habillage de l’app.

*Note de livraison :* [NOTE_LIVRAISON_UX_AIDE_HELLOASSO.md](./NOTE_LIVRAISON_UX_AIDE_HELLOASSO.md).

### Arbitrage UX (liste Adhésion — date de paiement)

La **date de paiement** fournie par HelloAsso fait partie de la **cible fonctionnelle** du suivi des adhésions. En revanche, une donnée ne doit pas figurer **en standard** dans la vue liste tant que son **import automatique** n’est pas **implémenté, stable et compréhensible** pour l’utilisateur (éviter colonnes vides ou ambiguës).

**Règle retenue :** la colonne reste dans le **modèle et la vue** (activable via le sélecteur de colonnes), mais est **`optional="hide"`** par défaut jusqu’à validation recette / prod de la synchro. Une fois la reprise **fiabilisée** (ex. fallbacks API `date` / `orderDate` / champs `order`, puis resynchronisation), on pourra la repasser en **`optional="show"`** pour l’exposer en lecture standard.

### Arbitrage UX (liste Billetteries et voisins)

Les vues **métier** de l’app HelloAsso n’affichent pas le vocabulaire brut du connecteur (`slug`, `Form type`, `Event`, etc.) : libellés de champs, filtres, boutons et textes d’aide sont formulés en **langage produit**. **Type** affiche une traduction métier des valeurs API courantes (ex. **Événement**) via le champ stocké `billetterie_type_caption`. **Organisation** peut afficher un **nom lisible** (`billetterie_org_caption`) si le champ facultatif est renseigné dans Paramètres HelloAsso (Members) ; sinon la référence technique. Les suffixes `*_display` et `*_label` sur les noms de champs sont évités côté web (Owl) ; des noms neutres préfixés module sont utilisés. Filtre liste billetteries : **Billetteries**. Champs techniques réservés aux administrateurs sur la fiche si besoin.

**Liste Billetteries (consultation référentiel, 2026-04)** : la liste est centrée sur la **lecture** du référentiel. Le **rechargement du catalogue** depuis l’API HelloAsso (opération occasionnelle / technique) est exposé sous le menu **Action** — *Recharger le référentiel billetteries (HelloAsso)* — et non comme bouton primaire en en-tête. L’**import des commandes** pour les lignes sélectionnées reste visible en en-tête **lorsqu’au moins une ligne est cochée** ; la même action existe aussi dans **Action**. Les entrées **Ouvrir la liste des commandes** et **Assistant de synchronisation (paramètres)** restent au **menu Action** (second niveau).

**Liste Commandes** : pas de boutons d’en-tête redondants (**Billetteries** / **Assistant**) ; la navigation passe par le **menu HelloAsso** (**Billetterie → Billetteries** ou **Commandes**). La liste sert à **consulter / filtrer / ouvrir une fiche**.

---

## Références

* [Note de livraison UX — Aide HelloAsso](./NOTE_LIVRAISON_UX_AIDE_HELLOASSO.md)
* [Note d’arborescence fonctionnelle](./note_arborescence_fonctionnelle_menu_helloasso.md)
* [Cartographie des flux](./cartographie_flux_helloasso_odoo.md)
