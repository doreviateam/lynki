# Note de livraison — UX page « Aide HelloAsso »

| | |
|---|---|
| **Objet** | Page d’**orientation** dans l’app HelloAsso : vocabulaire simple, pas de fuite technique, honnêtement présentée comme une **aide** (et non comme une entrée métier autonome). |
| **Références** | [Backlog menu HelloAsso](./backlog_impl_menu_helloasso_odoo.md), [Note d’arborescence](./note_arborescence_fonctionnelle_menu_helloasso.md) |
| **Module** | `dorevia_helloasso_billetterie` |
| **Version (indicative)** | ≥ 19.0.1.43.0 (menu **Aide**, contenu FAQ) |
| **Branche** | `web60-w60-103-tresorerie-contour-etat` |

---

## 1. Objet

Livrable : une **page d’aide** dans l’application HelloAsso, lisible comme une **surface d’orientation** (où cliquer pour adhésions, billetteries, commandes, paramètres), et non comme une fiche technique Odoo.

Historique : l’entrée de menu **Repère** a été **renommée en Aide** pour refléter la fonction réelle (explication / guidance). Le contenu a été **raccourci** et structuré en **questions fréquentes** plutôt qu’en longs paragraphes.

---

## 2. Décisions UX

* **Menu** : **HelloAsso → Aide** (remplace **Repère**).
* **Titres** : action et formulaire **Aide HelloAsso** ; `name_get` / `page_title` alignés sur **Aide HelloAsso**.
* **Contenu** : texte court ; réponses à des questions concrètes (adhésions, billetteries, commandes importées, réglage de la connexion) ; rappel optionnel (environnement, organisation, nombre de billetteries en base).
* **Raccourcis** : boutons **Adhésion**, **Billetteries**, **Commandes** (miroir des entrées de menu).

**Implémentation** : modèle transient `dorevia.helloasso.form.guide`, vue formulaire verrouillée (`create` / `edit` / `delete` / `duplicate` désactivés). Pas de champ `name` dans l’arch XML (compatibilité Owl) ; `_rec_name = "page_title"`.

---

## 3. Périmètre hors de cette note

Les **listes Billetteries et Commandes** (hiérarchie des actions, menu **Action**, absence de boutons redondants en tête de liste Commandes) sont documentées dans le **backlog** (arbitrage UX liste Billetteries et voisins). Cette note se concentre sur la page **Aide**.

---

## 4. Limites

* En **mode développeur**, des informations techniques peuvent encore apparaître ailleurs dans Odoo.
* La page repose sur le **formulaire standard** Odoo (habillé), pas sur une client action entièrement custom.

---

## 5. Suite possible

* Surface **100 % maîtrisée** via `ir.actions.client` et éventuel module **`dorevia_helloasso_app`** (même piste que pour l’ancienne page Repère).

---

*Document aligné sur l’arbitrage produit : « Aide » assume la nature réelle de l’écran.*
