# Note — Paramètres HelloAsso (`res.config.settings`)

| | |
|---|---|
| **Objet** | Comportement documenté de l’écran **Paramètres → HelloAsso** et alignement avec le **multi-sociétés** / comptes HelloAsso |
| **Modules** | Principalement `dorevia_helloasso_members` (vue + logique) ; résolution des identifiants pour l’API : `helloasso_company_params.get_helloasso_connection_params` |

---

## Rôle de l’écran

Bloc **minimal** sous **Paramètres** : lier **une société Odoo** aux **identifiants OAuth** HelloAsso (client ID + secret) pour cette association. Ce n’est pas un poste de pilotage des synchros (cron, tests massifs, etc.).

Champs présentés :

| Libellé UI | Rôle |
|------------|------|
| **Société** | Société Odoo concernée (`company_id` sur le transient Paramètres). |
| **ID** | Client ID HelloAsso (écran HelloAsso : *Intégrations et API*). |
| **Clé** | Secret client ; affichage **masqué** (mot de passe) pour limiter l’exposition visuelle. |

Les valeurs sont persistées sur **`res.company`** et sur **`dorevia.helloasso.account`** lorsque les contraintes le permettent (création / mise à jour du compte au **Enregistrer**).

---

## Règle métier : bijection société ↔ compte HelloAsso

* **Une société Odoo** → **au plus un** enregistrement `dorevia.helloasso.account` (contrainte SQL `UNIQUE(company_id)`).
* **Un même client ID HelloAsso** → **une seule** société dans la base (validation Python sur les comptes actifs).

Référence modèle : `units/odoo/custom-addons/dorevia_helloasso_members/models/helloasso_account.py`.

---

## Détails techniques (à connaître pour la maintenance)

### Champ « Clé » côté Paramètres

Le champ technique sur `res.config.settings` s’appelle **`helloasso_oauth_key`** (et non `helloasso_client_secret`) : le client web Odoo peut **omettre** les champs dont le nom contient `secret` dans les données envoyées au navigateur, ce qui produisait une **clé vide** à l’affichage malgré un calcul serveur correct.

### Repli historique : `ir.config_parameter`

Les anciens paramètres globaux (`dorevia_helloasso.client_id`, `dorevia_helloasso.client_secret`, etc.) restent utilisés par l’API en **dernier repli** lorsqu’il n’y a **pas** de `dorevia.helloasso.account` et que les champs société sont vides.

**Multi-sociétés** : ce repli **ne doit pas** appliquer les identifiants globaux à une société qui n’a **pas** le même client ID que l’ICP (ex. **RADIO GRAND LIEU** ne doit pas hériter du couple ID/clé de **LES GRANDLIEU'ZARTS**). Règle implémentée :

* **Affichage Paramètres** : secret ICP affiché seulement si la société est déjà liée au **même** client ID que l’ICP (ou base **mono-société**).
* **`get_helloasso_connection_params`** : même logique avant de lire l’ICP pour `client_id` / `client_secret` (et booléen bac à sable).

Fichier : `dorevia_helloasso_members/models/helloasso_company_params.py`.

### Après `module upgrade` (exploitation)

Après une mise à jour du module en ligne de commande (`-u`, `--stop-after-init`), **redémarrer** le service / conteneur Odoo pour que **tous les workers** rechargent le registre ; sinon risque d’erreur OWL du type *field is undefined* sur un champ récemment ajouté ou renommé.

---

## Références liées

* [Architecture multi-compte HelloAsso](./ARCHITECTURE_HELLOASSO_MULTI_COMPTE.md)
* [Cartographie des flux](./cartographie_flux_helloasso_odoo.md)
* [Vues kanban HelloAsso](./note_vues_kanban_helloasso.md)
* [Backlog menu / Paramètres](./backlog_impl_menu_helloasso_odoo.md)
