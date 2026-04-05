# Note d’arborescence fonctionnelle — Menu HelloAsso dans Odoo

## Version opérationnelle

### Objet

Décrire l’arborescence fonctionnelle **cible** du menu **HelloAsso** dans Odoo sous une forme directement exploitable pour le cadrage produit, l’UX Odoo et l’implémentation technique.

### Principe général

Le menu **HelloAsso** doit présenter dans Odoo un **miroir interne sobre** des flux HelloAsso utiles à l’association.

Il ne s’agit pas de reproduire HelloAsso, mais de structurer dans Odoo les objets réellement consultés et exploités en interne.

Le menu doit donc :

- refléter les **flux métier existants** ;
- rester **simple à lire** ;
- distinguer clairement la **consultation métier** du **paramétrage technique**.

---

### Tableau d’arborescence cible


| Menu          | Sous-menu                   | Modèle Odoo principal                                                    | Utilisateur visé                                             | Commentaire                                                                                                                                                                                      |
| ------------- | --------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **HelloAsso** | **Vue d’ensemble**          | vue fonctionnelle dédiée ou action d’accueil                             | Administration, coordination, référent projet                | Point d’entrée de l’application. Lecture rapide de l’état du connecteur, des derniers flux synchronisés et des accès vers les objets principaux. Vue légère, non technique dans sa présentation. |
| **HelloAsso** | **Adhésion**                | `res.partner` (champs HelloAsso via `dorevia_partner_membership_fields`) | Administration, gestion associative, suivi adhésions         | Libellé menu livré : **Adhésion** (flux Membership). Contacts synchronisés avec traçabilité utile ; vue filtrée.                                                                                    |
| **HelloAsso** | **Billetterie → Billetteries** | `dorevia.helloasso.billetterie.form`                                  | Administration, coordination événementielle                  | Référentiel des campagnes événements côté HelloAsso (inventaire). Consultation prioritaire ; actions techniques (rechargement API, import commandes, assistant) en **second niveau** (menu **Action** / fiche). |
| **HelloAsso** | **Billetterie → Commandes** | `dorevia.helloasso.billetterie.order`                                    | Administration, coordination événementielle, gestion interne | Commandes importées : consultation, filtres, fiche. **Pas** de boutons d’en-tête redondants (navigation par menu).                                                                                |
| **HelloAsso** | **Billetterie / Lignes**    | `dorevia.helloasso.billetterie.line`                                     | Administration, coordination événementielle                  | Vue complémentaire (billet / participant / article). Peut être **masquée** ou secondaire si elle complexifie inutilement le MVP.                                                                 |
| **HelloAsso** | **Synchronisations**        | modèle technique dédié, journal de synchro, ou vue fonctionnelle dérivée | Administration, référent fonctionnel, technique              | Derniers lancements, résultats, volumes traités / ignorés, erreurs. Plus technique possible, mais lisible.                                                                                       |
| **HelloAsso** | **Aide**                    | page d’orientation (`dorevia.helloasso.form.guide`, transient)          | Tous profils utilisateurs de l’app                           | Questions courtes (où sont adhésions, billetteries, commandes, paramètres) + raccourcis ; sans identifiants techniques Odoo. Anciennement intitulé **Repère**.                                      |


---

### Éléments à garder hors menu principal


| Emplacement    | Élément                                   | Modèle / zone                                 | Utilisateur visé                 | Commentaire                                                                               |
| -------------- | ----------------------------------------- | --------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| **Paramètres** | **Configuration HelloAsso**               | `res.config.settings` + `ir.config_parameter` | Administrateur                   | Identifiants API, sandbox / production, slugs, types de formulaires, réglages techniques. |
| **Paramètres** | **Tester la connexion**                   | action de configuration                       | Administrateur                   | Validation d’accès API ; pas une fonction métier courante dans le menu principal.         |
| **Paramètres** | **Prévisualiser les données / commandes** | action de configuration                       | Administrateur, référent recette | Vérification avant synchro.                                                               |
| **Paramètres** | **Synchroniser les adhérents**            | action / cron / bouton manuel                 | Administrateur, référent recette | Pilotage technique ; exposition plus « métier » possible plus tard si besoin.             |
| **Paramètres** | **Synchroniser la billetterie**           | action / cron / bouton manuel                 | Administrateur, référent recette | Même logique : à distinguer de la consultation métier.                                    |


---

### Lecture par profil


| Profil                                | Ce qu’il doit trouver facilement                                          | Ce qu’il ne doit pas subir                |
| ------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------- |
| **Utilisateur métier / coordination** | Adhérents, commandes billetterie, données synchronisées en lecture simple | Paramètres API, OAuth, options techniques |
| **Administrateur fonctionnel**        | Vue d’ensemble, synchronisations, **Aide**, données métier                | Arborescence confuse ou trop éclatée      |
| **Administrateur technique**          | Paramètres, tests, prévisualisation, déclenchements manuels, journaux     | Séparation floue métier / configuration   |


---

### Recommandation de mise en œuvre

#### Arborescence recommandée à court terme

**Arborescence livrée dans l’app (synthèse)** :

```text
HelloAsso
- Adhésion
- Billetterie
  - Billetteries
  - Commandes
- Aide
```

*Cible plus large (Vue d’ensemble, Synchronisations sous l’app, sous-menu Lignes) : voir tableau ci-dessus et annexe — tout n’est pas encore exposé comme entrée de menu.*

```text
Paramètres
- Configuration HelloAsso (adhérent / billetterie)
- Tester la connexion
- Prévisualiser / synchroniser (actions techniques)
```

#### Recommandation de sobriété

À court terme, **ne pas créer immédiatement** de menus autonomes pour : payeurs, participants, événements, paiements, exports, CRM dérivé, comptabilité dérivée. Ces dimensions peuvent exister fonctionnellement sans entrée de menu dédiée en MVP.

---

### Commentaire d’architecture fonctionnelle

Cette organisation permet :

- d’aligner le menu avec les **objets réellement présents dans le code** ;
- de ne pas sur-promettre des capacités non encore implémentées ;
- de garder une expérience **sobre à la Odoo** ;
- de préparer les évolutions sans alourdir prématurément l’application.

Doctrine :

**HelloAsso reste maître des flux publics ; Odoo en propose une lecture miroir, structurée pour l’usage interne.**

### Conclusion

Cette note constitue la **base opérationnelle de cadrage** du menu HelloAsso dans Odoo. Elle distingue explicitement la **cible fonctionnelle** recherchée et l’**état actuellement livré** dans le dépôt (voir annexe). La règle directrice reste la suivante : **montrer dans Odoo ce qui est utile à l’usage interne, sans chercher à refaire HelloAsso.**

Pour la traduction en lots de développement : [backlog d’implémentation — menu HelloAsso](./backlog_impl_menu_helloasso_odoo.md).

---

## Version descriptive (référence)

Les intentions détaillées (intention, périmètre, rubriques « Vue d’ensemble » à « Formulaires », justification et ce qui reste hors menu) sont alignées sur la [note de cadrage](./note_cadrage.md) et la [cartographie des flux](./cartographie_flux_helloasso_odoo.md). La **version opérationnelle** ci-dessus en est la traduction directe pour produit / UX / technique.

---

## Annexe — État actuel du menu dans le dépôt

*À maintenir à jour lors des évolutions de menu. Ne couvre que l’**arborescence** et les **entrées UI** de l’application HelloAsso, pas l’intégralité du comportement des connecteurs.*


| Élément                              | Implémentation actuelle                                                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Icône **HelloAsso** sur l’écran Apps | Menu racine `menu_dorevia_helloasso_root` (`dorevia_helloasso_billetterie`, `helloasso_billetterie_order_views.xml`).                                        |
| Au clic sur l’app                    | **HelloAsso** : **Adhésion**, **Billetterie** (sous-menus **Billetteries**, **Commandes**), **Aide**.                                                                                              |
| Arborescence livrée                  | **Adhésion** → `res.partner` (Membership + `helloasso_external_id`). **Billetteries** → inventaire `dorevia.helloasso.billetterie.form` (liste consultation ; actions techniques via **Action**). **Commandes** → `dorevia.helloasso.billetterie.order` (liste sans en-tête redondant). **Aide** → `dorevia.helloasso.form.guide` (FAQ). **Synthèse connecteur** : `dorevia.helloasso.landing` existe mais **sans** entrée de menu dédiée. **Lignes** : onglet sur la fiche commande uniquement. |
| Flux adhérents côté UI               | **Contacts** + onglet HelloAsso sur `res.partner` ; synchro depuis **Paramètres → HelloAsso (adhérents)**.                                                   |


**Écart résiduel vs cible opérationnelle :** menu **Synchronisations** (journal) non exposé sous l’app HelloAsso pour l’instant ; **Lignes** billetterie sans entrée dédiée (conforme sobriété MVP). **Aide** (ex-**Repère**) : page d’orientation livrée (évolution possible vers module `dorevia_helloasso_app`). Le paramétrage API reste sous **Paramètres**.

---

## Références

- [Note de cadrage](./note_cadrage.md)
- [Cartographie des flux](./cartographie_flux_helloasso_odoo.md)
- [Backlog d’implémentation — menu HelloAsso](./backlog_impl_menu_helloasso_odoo.md)