# Note — Vues kanban HelloAsso (alignement type Contacts)

| | |
|---|---|
| **Objet** | Règles de mise en page des **vues kanban** de l’app HelloAsso dans Odoo |
| **Module** | Principalement `dorevia_helloasso_billetterie` (Adhésion, Billetteries, Commandes) |

---

## Intention produit

Les écrans kanban **Adhésion**, **Billetteries** et **Commandes** doivent se comporter comme une **grille kanban standard** Odoo, comparable à **Contacts** :

* **Plusieurs cartes par ligne**, retour à la ligne, **espacement** naturel ;
* **Bonne occupation** de la largeur disponible ;
* Pas d’effet « liste verticale tassée à gauche ».

---

## Règles techniques retenues

| À éviter | Pourquoi |
|----------|----------|
| **`class="o_kanban_small_column"`** sur le `<kanban>` | Réduit la largeur des colonnes (usage type pipeline CRM) et dégrade la grille sur les écrans métier. |
| **`default_group_by="..."` par défaut** | Crée **une colonne par valeur** de regroupement ; **dans chaque colonne**, les cartes s’empilent verticalement → impression de liste étroite. |

| À privilégier | Détail |
|----------------|--------|
| **Kanban sans `default_group_by`** | Comportement proche **Contacts** : une zone de cartes en **flex / grille** avec retour à la ligne. |
| **`sample="1"`** | État vide cohérent avec les vues standard (aperçu d’exemple). |
| **Structure de carte** | `aside` `o_kanban_aside_full` + `main` avec `ps-2 min-w-0 flex-grow-1` (alignement sur `base.res_partner_kanban_view`). |
| **Regroupement optionnel** | Filtres **Regrouper par** / **Filtres** dans la **vue recherche** (`ir.ui.view` `search`), avec `context="{'group_by': 'champ'}"`, plutôt que `default_group_by` sur le kanban. |

---

## Vues et filtres (référence)

| Écran Odoo | Modèle | Vue kanban (xmlid) | Recherche associée | Regroupements proposés (exemples) |
|------------|--------|-------------------|---------------------|----------------------------------|
| **Adhésion** | `res.partner` | `view_res_partner_kanban_helloasso_memberships` | `view_res_partner_filter_helloasso_memberships` (hérite du filtre contact) | **Par campagne** (`helloasso_source_form`) |
| **Billetteries** | `dorevia.helloasso.billetterie.form` | `view_dorevia_helloasso_billetterie_form_kanban` | `view_dorevia_helloasso_billetterie_form_search` | **Par libellé organisation** (`billetterie_org_caption`), **Par type**, **Par organisation** (slug), etc. |
| **Commandes** | `dorevia.helloasso.billetterie.order` | `view_dorevia_helloasso_billetterie_order_kanban` | `view_dorevia_helloasso_billetterie_order_search` | **Par billetterie (slug)** (`form_slug`) |

Les actions fenêtre (`ir.actions.act_window`) déclarent un **`search_view_id`** pointant vers ces vues recherche lorsque des filtres de regroupement dédiés existent.

---

## Informations contextuelles sur les cartes

Sans **regroupement par défaut**, la **campagne** ou l’**organisation** peut être rappelée **sur la carte** (ligne dédiée en tête du bloc principal), pour ne pas perdre l’information qui était visible dans les en-têtes de colonnes auparavant.

---

## Références liées

* [Cartographie des flux](./cartographie_flux_helloasso_odoo.md)
* [Backlog menu HelloAsso](./backlog_impl_menu_helloasso_odoo.md)
* [Note Paramètres HelloAsso](./note_parametres_helloasso_res_config.md)
