# ADR — Décisions d’arbitrage HelloAsso ↔ Odoo (billetterie)

| | |
|---|---|
| **Version** | 0.1.3 |
| **Date** | Avril 2026 |
| **Statut** | Registre d’arbitrage — **version provisoire** ; décisions à valider métier / MOA |
| **Spec de référence** | [SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md](./SPEC_DOREVIA_HELLOASSO_BILLETTERIE.md) |
| **Vision amont** | [The_Big_Picture.md](./The_Big_Picture.md) |

---

## Objet de ce document

Consigner le **sens de flux MVP** et les **quatre arbitrages structurants** du connecteur billetterie, sans refaire la spec.

* La **spec** pose le périmètre, les principes et les critères.
* Cet **ADR** enregistre ce qui est **retenu pour le MVP**, ce qui est **reporté** et ce qui reste **ouvert** jusqu’à audit API / terrain.

**Rappel :** le flux **[adhérents](../HelloAsso_adhérent/ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md)** est **distinct** ; aucune décision adhérent ne s’applique par défaut à la billetterie.

---

### Décision de sens de flux — MVP billetterie

Dans le périmètre MVP, **HelloAsso reste maître du flux billetterie**.

Cela signifie que :

- la **création** et la **gestion** de la billetterie se font dans **HelloAsso** ;
- HelloAsso reste la **source de vérité publique** pour la diffusion, la vente, les participants, les billets et le paiement ;
- **Odoo** reçoit ensuite une **représentation interne synchronisée** utile au suivi, à la relation et au pilotage ;
- la création automatique d’une billetterie HelloAsso à partir d’un événement Odoo **n’entre pas dans le MVP** ;
- toute logique de pilotage inverse ou de synchronisation bidirectionnelle est **explicitement reportée** à un palier ultérieur.

Le sens de flux retenu est donc :

**HelloAsso → Odoo**

et non :

**Odoo → HelloAsso**

> Pour le MVP billetterie, HelloAsso reste maître : la billetterie est créée et pilotée dans HelloAsso, puis synchronisée vers Odoo pour usage interne.

---

## Ligne de travail proposée (synthèse)

| Levier | Orientation **provisoire** MVP |
|--------|----------------------------------|
| **Ancrage** | **Commande HelloAsso** comme unité principale de traçabilité et d’idempotence |
| **Pivot** | **Payeur** = contact principal de rapprochement (`res.partner` en première intention) |
| **Participants** | **Données conservées explicitement** ; représentation Odoo à trancher (voir §3) |
| **Événement miroir Odoo** | **Plutôt palier suivant** — sauf **besoin métier fort** justifiant dès le premier lot |

Cette ligne **verrouille** le MVP sans exclure une évolution documentée ultérieurement.

**En une phrase :** le MVP billetterie est structuré autour de la **commande HelloAsso** comme ancrage, du **payeur** comme pivot principal, et de la **conservation explicite des participants**, sans imposer à ce stade un **événement miroir complet** dans Odoo.

> **Automatisation (alignement Projet LGZ) :** premier palier attendu = action planifiée **`ir.cron`** ; **`queue_job`** uniquement si besoin réel (volumétrie, durée, file). Voir [Big Picture §11](./The_Big_Picture.md).

---

## 1. Ancrage principal (idempotence, traçabilité)

| | |
|---|---|
| **Question** | L’**unité de référence** pour rejouer la synchro sans doublon et tracer le flux est-elle bien la **commande** HelloAsso ? |
| **Décision provisoire** | **Oui** — la **commande HelloAsso** est l’**ancrage principal** du MVP. |
| **Identifiant stable** | **À confirmer après audit payloads** : **`order.id`** seul **ou** **clé composée** (ex. commande + contexte organisation / formulaire) si l’API ou les cas limites l’exigent. |
| **Paiement** | Élément de **preuve** et de **complément de traçabilité** ; ne remplace pas l’ancrage commande au MVP, sauf décision contraire motivée par l’audit. |
| **Validé par** | *À compléter* — arbitrage technique + métier après premiers JSON réels billetterie |

---

## 2. Pivot de rapprochement (contacts)

| | |
|---|---|
| **Payeur** | **Pivot principal** de rapprochement avec **`res.partner`** (cf. SPEC §5.1, §7). |
| **Participants** | **Distincts** du payeur lorsque les données source le permettent ; **règle de rapprochement** : hiérarchie indicative dans la SPEC §7.1, à **figer** ici une fois les tests réalisés (e-mail, identifiant source, etc.). |
| **Ambiguïté / doublons** | Même exigence que la spec : **pas** de création aveugle ; journalisation et traitement manuel ou règle métier explicite. |
| **Validé par** | *À compléter* |

---

## 3. Représentation des participants dans Odoo

| Option | Description | Statut MVP |
|--------|-------------|------------|
| **A** | **Trace minimale** sur l’enregistrement commande / traçabilité (champs texte ou JSON contrôlé) | Possible si besoin de livrer vite |
| **B** | **Lignes liées** à une commande Odoo ou équivalent | Selon modèle retenu pour la « commande » côté Odoo |
| **C** | **`res.partner`** pour chaque participant distinct | Cohérent si rapprochement par e-mail / identité |
| **D** | **Modèle dédié** (ex. objet participant / billet) | Plus riche ; peut être **reporté** si charge MVP trop forte |

| **Décision provisoire** | Le MVP doit **conserver explicitement** les données participants. Le support exact (A / B / C / D) reste **ouvert** jusqu’à maquette technique et retour métier. |
| **Report explicite** | Une modélisation **D** complète peut être **hors MVP** si l’ADR et la recette le consignent. |

---

## 4. Événement miroir dans Odoo

| | |
|---|---|
| **Question** | Faut-il créer dès le MVP un **événement Odoo** (ex. `event.event` ou équivalent) **miroir** de l’événement / formulaire HelloAsso ? |
| **Décision provisoire** | **Par défaut : non obligatoire au MVP** — **plutôt palier suivant**, sauf **besoin métier fort** (ex. pilotage, communication interne) documenté. |
| **Option « oui »** | Si le métier impose un miroir dès le premier lot : décrire le **périmètre minimal** (libellé, dates, lien commandes) dans une révision de cet ADR. |
| **Validé par** | *À compléter* |

---

## 5. Rattachement LGZ / RGL / CCC

| | |
|---|---|
| **Décision** | **Table de correspondance à produire** (formulaire / campagne / slug HelloAsso → structure métier → Odoo), comme pour le flux adhérent mais avec **règles propres** à la billetterie. |
| **Nature** | **Ouverte** jusqu’à audit terrain. |

Voir [note de cadrage projet Odoo](../NOTE_CADRAGE_PROJET_ODOO.md).

---

## Évolution du registre (v0.1 → versions suivantes)

À ce stade, cet ADR est un **registre d’orientation MVP** : les décisions sont **provisoires** là où l’audit API / terrain n’est pas clos.

Dans une **v0.2** ou **v0.3**, certaines lignes devront passer d’**ouvert** à **retenu** (représentation des participants, identifiant d’idempotence exact, éventuel événement miroir), pour que le document devienne un **registre d’arbitrages réellement figés** — sans doublon avec la spec, qui reste le détail des exigences.

**Recette MVP :** les scénarios de validation sont dans [RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) (alignés sur la SPEC §12).

---

## Historique des versions

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Création — quatre sections structurantes, ligne de travail MVP, statut provisoire, renvois SPEC / Big Picture / adhérent |
| 0.1.1 | Avril 2026 | Statut en-tête ; §1 Paiement ; §3 décision participants ; §5 coquille ; phrase synthèse ; section évolution du registre |
| 0.1.2 | Avril 2026 | Renvoi [recette MVP](./RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) après § évolution du registre |
| 0.1.3 | Avril 2026 | **Décision de sens de flux** MVP — HelloAsso maître, **HelloAsso → Odoo** ; hors MVP : création billetterie depuis Odoo, synchro bidirectionnelle ; phrase de doctrine |

---
