# Fiche de synthèse — Cartographie des flux HelloAsso → Odoo

| | |
|---|---|
| **Objectif** | Vue d’ensemble **décisionnelle** : ce qui existe dans le code, ce qui reste ouvert |
| **Doctrine** | Voir [note de cadrage](./note_cadrage.md) — HelloAsso maître de la collecte publique ; Odoo intègre et structure |
| **Détail billetterie** | [Fiche flux — billetterie](./fiche_flux_billetterie.md) |
| **Détail adhérents** | Sections *État actuel* et *Premier flux* de la [note de cadrage](./note_cadrage.md) ; [SPEC adhérents](../HelloAsso_adhérent/SPEC_DOREVIA_HELLOASSO_ADHERENT.md) |
| **Après recette terrain** | [Note d’arbitrage — consolidation MVP](./note_arbitrage_consolidation_mvp_helloasso.md) |

---

## Tableau de cartographie

Réponse rapide à : **« Qu’est-ce qui existe déjà, et qu’est-ce qui reste à décider ? »**

| Flux | Source HelloAsso (API / objet) | Ancrage idempotence | Objet Odoo principal | Statut actuel |
|------|-------------------------------|---------------------|----------------------|---------------|
| **Adhérents** | Paiements d’un formulaire **Membership** (`…/payments`) | **Id paiement** HelloAsso → `res.partner.helloasso_external_id` | `res.partner` (+ champs traçabilité HelloAsso) | **Implémenté MVP** (`dorevia_helloasso_adherent`) |
| **Billetterie (commandes)** | Commandes d’un formulaire paramétrable (défaut **Event**) (`…/orders`) | **Id commande** → `dorevia.helloasso.billetterie.order.helloasso_order_id` | `dorevia.helloasso.billetterie.order` (+ lignes) | **Implémenté MVP** (`dorevia_helloasso_billetterie`) |
| **Participants** (hors payeur) | Lignes `items` / blocs personne dans la commande | Pas d’ancre dédiée côté Odoo | Champs texte sur **`dorevia.helloasso.billetterie.line`** uniquement | **Non structurés** en fiches contact |
| **Payeurs** | Bloc `payer` (commande ou paiement) | Rapprochement par **e-mail** (règles distinctes selon flux) | `res.partner` | **Partiellement structuré** : fiche contact ; traçabilité HelloAsso **complète** surtout sur le flux **adhérent** ; flux **billetterie** sans remplir les champs `helloasso_*` « adhérent » sur le partenaire (éviter conflit) |
| **Événements** | Métadonnées formulaire / contexte billetterie | Non posé comme `event.event` | Aucun miroir **`event.event`** | **Non implémenté** (hors MVP, sauf arbitrage métier) |
| **Compta / encaissement** | Montants paiements / commandes | — | Aucun document comptable Odoo dans ces modules | **Hors périmètre** connecteurs actuels |

---

## Trois niveaux de lecture (rappel)

1. **Doctrine projet** — intention et limites : note de cadrage.  
2. **Réalité adhérents** — lecture paginée des **paiements** éligibles, filtre Membership + `Registered`, etc.  
3. **Réalité billetterie** — miroir **commandes**, mapping défensif JSON, payeur = `res.partner`, lignes = texte.

Ensemble, cela forme un **dossier d’architecture fonctionnelle réelle** (intention + code).

---

## Ce qui est déjà tranché (côté produit / doc)

* Sens global **HelloAsso → Odoo** ; pas de maîtrise inverse des flux publics dans le périmètre MVP.  
* Deux connecteurs distincts : **adhérent** vs **billetterie** (ne pas amalgamer règles et objets).  
* Billetterie actuelle = **miroir structuré des commandes** exploitable en interne, **pas** une intégration métier profonde type événement Odoo ou vente complète.
* **App HelloAsso (menu / listes)** : entrée **Aide** (ex-**Repère**) pour l’orientation ; listes **Billetteries** et **Commandes** hiérarchisées pour privilégier la **consultation** et reléguer les actions techniques au **menu Action** ou au menu **Paramètres** — voir [note d’arborescence](./note_arborescence_fonctionnelle_menu_helloasso.md) et [backlog menu](./backlog_impl_menu_helloasso_odoo.md).
* **Planificateurs** : synchro **adhérents** et **billetterie** via `ir.cron` **actifs par défaut** (fréquence par défaut **toutes les 6 h**, désactivables ou ajustables dans **Paramètres → Technique → Actions planifiées**). La tâche billetterie enchaîne **inventaire** + import **toutes** les billetteries connues pour l’organisation (voir [fiche flux billetterie](./fiche_flux_billetterie.md)).

---

## Ce qui reste à décider (extraits)

* **Participants** : conserver uniquement des **lignes texte** ou créer / rapprocher des **`res.partner`** (et sous quelles règles).  
* **Événement miroir** : besoin réel de `event.event` (ou équivalent) pour LGZ.  
* **Rattachement** structures (LGZ / RGL / CCC) : règles depuis HelloAsso (SPEC / ADR).  
* **Affinage métier** billetterie : statuts, payloads réels, cas limites après recette terrain.  
* **Compta** : périmètre et module(s) concernés — en dehors des MVP actuels.

---

## Prochains lots possibles (arbitrage)

### Option A — Consolider le MVP existant

* Recette sur **vrais payloads** (sandbox puis prod).  
* Validation des **statuts** et de l’**éligibilité**.  
* Cas **ambigus** (e-mails multiples, doublons).  
* Stabilisation des **rapprochements**.

### Option B — Structurer les participants

* Décision : texte seul vs **`res.partner`** + politique de doublons avec le payeur.

### Option C — Exploitation interne dans Odoo

* Rattachement métier, **vues / filtres / menus**, pilotage, lien futur avec événements ou vente si retenu.

---

## En une phrase

**Les deux flux codés sont cartographiés ; la suite est un choix de lot (A, B ou C), pas un empilement de code sans arbitrage.**

---

## Références techniques rapides

| Module | Chemin (racine dépôt) |
|--------|------------------------|
| Adhérents | `units/odoo/custom-addons/dorevia_helloasso_adherent` |
| Billetterie | `units/odoo/custom-addons/dorevia_helloasso_billetterie` |
| Champs partner HelloAsso | `units/odoo/custom-addons/dorevia_partner_membership_fields` |
