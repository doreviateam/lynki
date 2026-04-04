# Recette — MVP HelloAsso billetterie → Odoo

**Périmètre** : valider le **premier lot** billetterie une fois le connecteur Odoo disponible, en s’appuyant sur l’[ADR](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) et la [SPEC](./SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md).  
**Environnement** : lab (ex. `glz-rgl`) ou base dédiée ; HelloAsso **sandbox** ou prod selon périmètre validé.  
**Référence documentaire** : avril 2026 — pas de module `dorevia_*` billetterie dans le dépôt à ce jour ; cette recette est **prête à l’emploi** dès qu’un connecteur MVP est branché.

## Alignement ADR (rappel)

Le MVP se cale sur :

- **Sens de flux** : **HelloAsso → Odoo** — HelloAsso **maître** (création / pilotage billetterie côté HelloAsso ; Odoo = représentation interne synchronisée). Pas de pilotage inverse ni synchro bidirectionnelle au MVP (cf. ADR).
- **Commande HelloAsso** = ancrage principal (idempotence / traçabilité à confirmer : `order.id` ou clé composée).
- **Payeur** = pivot principal de rapprochement (`res.partner` en première intention).
- **Participants** = **données conservées explicitement** (support A/B/C/D selon maquette — cf. ADR §3).
- **Événement miroir Odoo** = **non obligatoire** au MVP par défaut (ADR §4).

Ne pas confondre avec le flux **[adhérents](../HelloAsso_adhérent/RECETTE_MVP_HELLOASSO_COMPACT.md)**.

**En synthèse :** la recette MVP billetterie valide d’abord la **traçabilité** de la commande, la **distinction payeur / participants**, puis la **rejouabilité**, avant toute **automatisation** ou extension **hors périmètre**.

## État de validation

| Zone | Statut |
|------|--------|
| Connecteur Odoo billetterie | **Non livré** — recette en attente d’implémentation |
| §1 Traçabilité commande (CA-B01) | ☐ |
| §2 Payeur vs participants (CA-B02) | ☐ |
| §3 Rejouabilité (CA-B03) | ☐ |
| §4 Hors périmètre SPEC §11 (CA-B04) | ☐ |
| Automatisation `ir.cron` (palier 2) | ☐ — après MVP manuel validé |

## Préparation

- [ ] Credentials API HelloAsso (sandbox ou prod) et **slug organisation** documentés.
- [ ] Au moins une **commande billetterie éligible** identifiable (JSON / back-office) avec commande, payeur, participants si présents.
- [ ] Règle d’**éligibilité** alignée avec le métier (cf. SPEC §2.2).
- [ ] Table de rattachement LGZ / RGL / CCC ou **premier cas** documenté (ADR §5).

---

## 1. Traçabilité — commande source (CA-B01)

**But** : après synchro, retrouver dans Odoo une **trace** liée à la **commande HelloAsso** (identifiant stable retenu par l’implémentation).

- [ ] Lancer la synchro MVP sur une commande **sandbox** éligible.
- [ ] Vérifier qu’un enregistrement (ou jeu de champs) porte l’**identifiant source** commande attendu.
- [ ] Vérifier **horodatage** / **statut** de traitement (cf. SPEC §9).
- [ ] Vérifier les **logs** : message exploitable en cas de **succès**, d’**échec partiel** ou d’**erreur**.

## 2. Payeur et participants distincts (CA-B02)

**But** : si la source expose **payeur** et **participants** distincts, le comportement respecte l’ADR (conservation explicite des participants ; pas de fusion arbitraire).

- [ ] Cas où payeur ≠ au moins un participant : **données participants présentes** dans Odoo (selon support retenu A/B/C/D).
- [ ] Vérifier que le **payeur** est le pivot principal de rapprochement (`res.partner` ou règle documentée).
- [ ] Vérifier qu’**aucune fusion arbitraire** n’assimile un **participant** au **payeur** sans règle documentée.
- [ ] Si la source ne distingue pas : consigner **N/A** et la preuve (extrait JSON ou capture).

## 3. Rejouabilité (CA-B03)

**But** : relancer la synchro **sans changement** côté HelloAsso sur la même commande.

- [ ] Deux passages consécutifs : **pas de doublons** sur les objets cibles retenus (partenaires, lignes, etc.).
- [ ] Comportement **idempotent** cohérent avec l’ancrage commande (ADR §1).

## 4. Respect du hors-périmètre (CA-B04)

**But** : le MVP ne met pas en œuvre les exclusions SPEC §11 (vente remplacée, synchro bidirectionnelle, compta complète, annulations complexes, etc.) **sans décision documentée**.

- [ ] Vérifier qu’aucune fonctionnalité « hors liste §11 » n’est activée par défaut.
- [ ] Si test ponctuel hors périmètre : **décision écrite** (ticket / addendum SPEC).

## 5. Automatisation (`ir.cron`) — palier suivant

À traiter **après** validation manuelle :

- [ ] Action planifiée ou équivalent ; fréquence modérée ; logs propres.
- [ ] Pas de **`queue_job`** sauf besoin explicite (cf. [Big Picture §11](./The_Big_Picture.md)).

---

## Synthèse — ordre recommandé

1. **CA-B01** (traçabilité)
2. **CA-B02** (payeur / participants)
3. **CA-B03** (rejouabilité)
4. **CA-B04** (hors périmètre)
5. Puis **cron** si applicable

## Ticket de clôture

Après recette, consigner :

- date, environnement, base ;
- scénarios OK / KO ;
- pour chaque KO : observé / attendu / extrait log ;
- **version** des documents (SPEC, ADR, cette recette).

## Références

- [Big Picture — billetterie](./The_Big_Picture.md)
- [SPEC billetterie](./SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md)
- [ADR billetterie](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md)
- [Note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md)
- [Plan d’implémentation Scrum-like](./PLAN_IMPLEMENTATION_SCRUM_BILLETTERIE.md)

---

## Checklist PR / livraison connecteur (quand existant)

- [ ] Tests automatisés du module billetterie verts (commande à définir avec le repo).
- [ ] Lab : au minimum **CA-B01** + **CA-B03** sur sandbox.
- [ ] Documentation d’exploitation : paramètres, logs, reprise.

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Première version — scénarios alignés SPEC §12 et ADR v0.1.x ; hors module code |
| 0.1.1 | Avril 2026 | État validation (connecteur) ; §1 logs ; §2 non-confusion payeur/participant ; phrase synthèse ; historique cohérent avec [ADR v0.1.2](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) |
| 0.1.2 | Avril 2026 | Alignement ADR — **sens de flux** MVP (**HelloAsso → Odoo**) ; renvoi [ADR v0.1.3](./ADR_DECISIONS_ARBITRAGE_HELLOASSO_BILLETTERIE.md) |

---
