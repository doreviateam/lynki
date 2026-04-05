# Note de livraison — UX page « Repère HelloAsso »

| | |
|---|---|
| **Objet** | Alignement de l’écran de repère de l’app HelloAsso sur la cible UX retenue (pas de fuite technique, page d’orientation métier). |
| **Références** | [Backlog menu HelloAsso](./backlog_impl_menu_helloasso_odoo.md), [Note d’arborescence](./note_arborescence_fonctionnelle_menu_helloasso.md) |
| **Module** | `dorevia_helloasso_billetterie` |
| **Version** | 19.0.1.23.0 |
| **Commit (livraison UX initiale)** | `52bcfca9` |
| **Correctif client web** | 19.0.1.23.0 — éviter le champ `name` en arch XML / renommer en `page_title` (Owl « field is undefined »). |
| **Branche** | `web60-w60-103-tresorerie-contour-etat` |

---

## 1. Objet

Livrable attendu : une **page de repère** dans l’application HelloAsso, lisible comme une **surface produit** (orientation, vocabulaire métier), et non comme une fiche technique Odoo exposant modèle, `NewId` ou jargon d’implémentation.

Le périmètre de cette note couvre la **correction du comportement**, les **ajustements UX**, la **documentation** associée et les **limites** assumées, ainsi que la **suite** logique si l’on poursuit vers une surface entièrement maîtrisée.

---

## 2. Décision

**Décision UX retenue :** l’écran « Repère » est une **page d’orientation** dans l’app HelloAsso ; il ne doit pas être perçu comme un enregistrement métier éditable ni afficher d’identifiants ou libellés techniques parasites dans l’usage standard.

**Décision d’implémentation (périmètre actuel) :** réalisation dans `dorevia_helloasso_billetterie` (modèle transient + vue formulaire habillée), en attendant un éventuel **portage** vers un module applicatif dédié (`dorevia_helloasso_app`) pour une surface sans héritage du formulaire standard.

**Validation produit (synthèse) :** l’écran est réaligné avec la cible UX : plus de libellé technique type `modèle / NewId` dans l’usage courant, écran verrouillé en lecture / repère, intitulés en vocabulaire produit, menu **Repère**, blocs métier lisibles, documentation de cadrage mise à jour. Une étape ultérieure reste possible pour une surface 100 % maîtrisée via `ir.actions.client` et `dorevia_helloasso_app`.

---

## 3. Modifications

### 3.1 Libellé d’enregistrement (correctifs techniques)

Pour éviter toute remontée d’un identifiant interne de type `modèle / NewId` :

* `page_title` renseigné dans `default_get` (le champ n’est pas nommé `name` : évite un conflit avec la couche web Owl sur certains formulaires) ;
* `name_get` retourne systématiquement **« Repère HelloAsso »** ;
* `_rec_name = "page_title"` comme libellé de référence ;
* pas de champ technique dans l’arch XML — uniquement le fil d’Ariane / libellé système.

### 3.2 Maîtrise du formulaire

L’écran est verrouillé comme **page de repère** et non comme fiche métier :

* `create="false"`, `delete="false"`, `duplicate="false"`, `edit="false"` sur la vue formulaire ;
* action avec `context="{'create': False}"`.

### 3.3 UX et vocabulaire produit

**Intitulés :** titre de page, d’action et de formulaire — **Repère HelloAsso** ; entrée de menu — **Repère** (remplace **Formulaires**).

**Structuration du contenu :**

* Organisation connectée  
* Adhésion  
* Billetterie  
* Configuration commune  
* Aller plus loin  

**Libellés de champs simplifiés :** Environnement, Organisation, Billetteries repérées — retrait des termes trop techniques dans les intitulés (ex. `slug`, `API`, `Event`).

**Textes explicatifs :** reformulation en langage métier, réduction du vocabulaire technique inutilement visible.

### 3.4 Documentation

* **`backlog_impl_menu_helloasso_odoo.md`** — lot M6, phasage, priorité, arbitrage UX page Repère, mention d’un futur `dorevia_helloasso_app`.  
* **`note_arborescence_fonctionnelle_menu_helloasso.md`** — tableau cible, schéma texte, annexe avec l’écran **Repère**.

### 3.5 Déploiement

Après mise à jour du module sur le lab ou la production : **rechargement forcé du navigateur** (`Ctrl` + `Shift` + `R`).

---

## 4. Limites

* En **mode développeur** ou via certains **outils de debug**, Odoo peut encore afficher ponctuellement des informations techniques dans d’autres zones de l’interface.  
* Ce lot ne vise pas à supprimer **tout** héritage technique d’Odoo dans l’absolu, mais à rendre **l’écran standard utilisateur** conforme à la cible UX retenue.  
* La page repose encore sur le **mécanisme formulaire standard** Odoo (habillé) : ce n’est pas une surface OWL / client action entièrement custom.

---

## 5. Suite

Pour une **surface totalement maîtrisée**, sans héritage du formulaire Odoo standard :

* mise en œuvre d’une action **`ir.actions.client`** ;  
* portage dans un futur module **`dorevia_helloasso_app`** ;  
* traitement de la page **Repère** comme **véritable surface applicative**, et non comme une fiche habillée.

---

*Document rédigé à partir du compte-rendu de livraison et de l’arbitrage produit validés sur la branche indiquée ci-dessus.*
