# Fiche flux — Billetterie (HelloAsso → Odoo)

| | |
|---|---|
| **Document** | État de l’implémentation **tel que dans le dépôt** (module `dorevia_helloasso_billetterie`) |
| **Complément** | Spécification et arbitrages : [SPEC billetterie](../HelloAsso_billetterie/SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md), [ADR billetterie](../HelloAsso_billetterie/ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) |
| **Note de cadrage** | [note_cadrage.md](./note_cadrage.md) |
| **Vue d’ensemble** | [Cartographie des flux](./cartographie_flux_helloasso_odoo.md) |

---

## Objectif du flux

Reproduire dans Odoo une **représentation interne** des **commandes** de billetterie (ou assimilées) issues d’un **formulaire HelloAsso** paramétrable, avec **payeur** et **lignes / participants**, sans remplacer HelloAsso comme canal public de vente.

**Doctrine** (alignée note de cadrage) : **HelloAsso reste maître de la collecte ; Odoo intègre et structure pour le suivi interne.**

---

## Consultation dans l’app HelloAsso (rappel UX)

* **Commandes importées** : menu **HelloAsso → Billetterie → Commandes** (liste centrée consultation ; pas de raccourcis d’en-tête redondants).
* **Référentiel billetteries** : **HelloAsso → Billetterie → Billetteries** ; rechargement catalogue API et outils avancés : menu **Action** sur la liste (ou **Paramètres** / assistant selon le parcours).
* **Orientation** : **HelloAsso → Aide** (FAQ : où trouver adhésions, billetteries, commandes, réglage connexion).

*Détail des arbitrages menu / listes :* [backlog menu HelloAsso](./backlog_impl_menu_helloasso_odoo.md), [note d’arborescence](./note_arborescence_fonctionnelle_menu_helloasso.md).

---

## Sens du flux

**Unidirectionnel : HelloAsso → Odoo.**

* Odoo appelle l’**API HelloAsso v5** (OAuth2 client credentials, mêmes identifiants que le bloc adhérent).
* **Aucune** écriture ni mise à jour n’est renvoyée vers HelloAsso.

---

## Source HelloAsso concernée

* **Organisation** : slug configuré dans les paramètres HelloAsso (bloc adhérent).
* **Formulaire cible** :
  * **formType** paramétrable (défaut : `Event`) — `ir.config_parameter` `dorevia_helloasso_billetterie.form_type` ;
  * **formSlug** optionnel — si renseigné, appel direct sur ce couple type + slug ; sinon **premier formulaire** dont le `formType` correspond (recherche insensible à la casse, avec repli sur la liste complète des formulaires si besoin).
* **Endpoint principal** : liste paginée des **commandes** du formulaire — `GET …/organizations/{slug}/forms/{formType}/{formSlug}/orders` (via `fetch_form_orders_page` du module adhérent).

---

## Données lues (côté API)

Pour chaque **commande** (objet JSON) :

* identifiant commande (`id` / `Id`) ;
* statut brut (`state` / `State`) ;
* montant : `amount`, `Amount`, `totalAmount` ou `TotalAmount` — **interprété comme centimes** puis converti en **euros** (même convention que les paiements adhérent) ;
* date : `date`, `Date`, `createdAt` ou `CreatedAt` ;
* **payeur** : bloc `payer` / `Payer` (e-mail, prénom, nom) ;
* **lignes** : liste `items` / `Items` (dictionnaires) ; pour chaque ligne, extraction tolérante du libellé, du type, de l’id ligne, et d’un **bloc personne** parmi `user`, `participant`, `attendee`, `beneficiary` (casse Pascal/camel), ou champs directs sur l’item.

La **prévisualisation** (bouton Paramètres) lit les mêmes sources pour un **échantillon** (première page, 5 commandes max) **sans écrire** en base Odoo.

---

## Objets Odoo créés ou mis à jour

| Objet technique | Rôle |
|-----------------|------|
| **`dorevia.helloasso.billetterie.order`** | Miroir d’une commande HelloAsso ; **unicité** sur `helloasso_order_id`. À chaque synchro réussie : champs en-tête mis à jour, **lignes existantes supprimées puis recréées**. |
| **`dorevia.helloasso.billetterie.line`** | Lignes (billet / article / participant) rattachées à la commande. |
| **`res.partner`** | **Payeur uniquement** : création si aucun partenaire avec l’e-mail ; réutilisation si **exactement un** match sur e-mail. **Pas** d’écriture des champs HelloAsso « adhérent » (`helloasso_external_id`, etc.) sur le partenaire dans ce flux — évite le conflit avec le connecteur adhérent. |

**Menu** : Contacts → **Billetterie HelloAsso** → **Commandes**.

---

## Règles de rapprochement

| Niveau | Règle |
|--------|--------|
| **Commande** | Recherche d’un enregistrement `dorevia.helloasso.billetterie.order` avec le même `helloasso_order_id`. S’il en existe plusieurs (anomalie), la commande est **ignorée**. |
| **Payeur** | Recherche `res.partner` avec `email` **ilike** l’e-mail du payeur. **0** → création ; **1** → lien ; **> 1** → commande **ignorée** (ambiguïté). |
| **Participants (lignes)** | Données stockées en **champs texte** sur les lignes ; **pas** de création systématique de `res.partner` par participant dans le MVP actuel. |

**Idempotence** : rejouer la synchro sur la même commande **met à jour** l’en-tête et **remplace** les lignes.

---

## Commandes « éligibles » (filtre MVP actuel)

Une commande est **traitée** si :

1. c’est un objet JSON valide ;
2. son statut (normalisé en minuscules) **n’est pas** dans : `refused`, `abandoned`, `canceled`, `cancelled`, `expired` ;
3. elle possède un **id** ;
4. le **payeur** a un **e-mail** non vide ;
5. le payeur n’est pas en situation d’**e-mail ambigu** (voir ci-dessus).

**Toute autre commande** sur la page peut être **comptée comme ignorée** sans traitement complet (y compris statut vide = non exclu par la liste « bad states »).

---

## Cas ignorés ou erreurs (résumé)

* Objet commande non dict ; commande avec statut dans la liste d’exclusion ; **sans id** ; **sans e-mail payeur** ; **plusieurs partenaires** pour l’e-mail du payeur ; **plusieurs** `dorevia.helloasso.billetterie.order` pour le même `helloasso_order_id`.
* Erreur HTTP / réseau sur une **page** de commandes : la boucle s’arrête pour cette exécution ; message dans les stats / logs.
* Lignes `items` absentes ou vides : une **ligne unique** de repli est créée avec les coordonnées du **payeur**.

**Pagination** : pages de **50** commandes, **40** pages max par exécution (plafond technique).

---

## Déclenchement

* **Manuel** : Paramètres → bloc **HelloAsso (billetterie)** → *Synchroniser la billetterie* / *Prévisualiser les commandes* ; app **Billetteries** (menu **Action** / fiche).
* **Planifié** : action planifiée **« HelloAsso : synchroniser la billetterie (MVP) »** — **active par défaut**, **toutes les heures** (utilisateur root). À chaque passage : **inventaire** des formulaires Event, puis **import des commandes** pour **chaque** ligne d’inventaire de l’organisation (même bac à sable / production que les paramètres) ; si l’inventaire est vide, **repli** sur le couple type + slug des paramètres ICP (comportement historique).

---

## Limites actuelles (MVP code)

* **Un seul formulaire** ciblé par config (type + éventuellement slug) ; pas de multi-formulaires en une passe.
* **Ancrage = commande**, pas le paiement (contrairement au flux adhérent).
* **Mapping JSON défensif** : les vrais champs peuvent différer selon les formulaires HelloAsso — **validation terrain** (payloads réels) recommandée avant de figer la recette métier.
* **Pas** d’événement Odoo miroir (`event.event`), **pas** de `sale.order`, **pas** de synchro bidirectionnelle, **pas** de gestion comptable des encaissements dans ce module.
* Les champs `sync_status` / `sync_message` sur la commande sont prévus ; en l’état le flux nominal met `synced` — peu d’usage de `error` dans le code actuel.

---

## Prochain niveau cible (à trancher produit / ADR)

* Valider sur **données réelles** : éligibilité fine (statuts, types d’articles), montants, structure `items`.
* Décider si les **participants** doivent donner lieu à **contacts** `res.partner` et sous quelles règles.
* Envisager **événement / commande de vente** Odoo si le pilotage métier l’exige.
* Multi-formulaires, **queue_job**, critères de **rattachement** LGZ / RGL / CCC (comme en SPEC).
* Aligner la **recette** : [RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md](../HelloAsso_billetterie/RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md).

---

## Référence code (racine dépôt)

* `units/odoo/custom-addons/dorevia_helloasso_billetterie` — synchro : `models/helloasso_billetterie_sync.py` ; modèles : `models/helloasso_billetterie_order.py` ; paramètres UI : `models/res_config_settings.py`.
