# ADR — Décisions d’arbitrage HelloAsso ↔ Odoo (adhérents)

| | |
|---|---|
| **Version** | 0.3.5 |
| **Date** | Avril 2026 |
| **Statut** | Registre d’arbitrage — **version provisoire** ; hypothèses de départ à confirmer |
| **Spec de référence** | [SPEC_DOREVIA_HELLOASSO_ADHERENT.md](./SPEC_DOREVIA_HELLOASSO_ADHERENT.md) |
| **Note technique API** | [REF_API_HELLO_ASSO.md](./REF_API_HELLO_ASSO.md) |
| **Automatisation synchro (cron / queue_job)** | [POSITIONNEMENT_SYNC_CRON_VS_QUEUE_JOB.md](./POSITIONNEMENT_SYNC_CRON_VS_QUEUE_JOB.md) |

---

## Objet de ce document

Consigner les décisions **actées** sur le connecteur HelloAsso → Odoo (adhérents), sans dupliquer la spec détaillée.

* La **spec** décrit le périmètre, les principes, les hypothèses et les critères de recette.
* Cet **ADR** enregistre **les arbitrages tranchés**, qu’ils soient :
  * **confirmés**
  * **provisoires**
  * ou **à réviser ultérieurement**

Chaque entrée peut inclure : date, version, contenu stable, éventuelles références (réunion, ticket).

Tant qu’un arbitrage n’est pas définitivement validé, il peut être consigné ici comme **décision provisoire**, explicitement identifiée comme telle.

Mettre à jour ce fichier lorsqu’un arbitrage est **confirmé, ajusté ou écarté** (cf. spec §13.1 et §13.2).

> **Décision de positionnement (automatisation)** : l’automatisation de la synchro HelloAsso ne passera pas, dans l’immédiat, par `queue_job`. Le prochain palier retenu est une action planifiée Odoo (`ir.cron`). Le recours à `queue_job` est explicitement repoussé à un palier ultérieur, conditionné par le retour terrain.

---

## 1. Modèle cible dans Odoo (cf. spec §5.4)

| | |
|---|---|
| **Décision** | ☒ **A** — `res.partner` enrichi uniquement · ☐ **B** — A + historique d’adhésion · ☐ **C** — (préciser) |
| **Nature de la décision** | **Provisoire** |
| **Date** | Avril 2026 |
| **Validé par** | Dorevia — hypothèse de travail interne, à confirmer métier / MOA |
| **Précisions** (champs, modèles custom, nommage) | MVP basé sur `res.partner` enrichi pour limiter la complexité initiale. Pas d’objet historique dédié au premier lot, sauf exigence métier explicite lors des arbitrages. Prévoir toutefois les champs de traçabilité HelloAsso et les champs métier adhérent nécessaires au suivi courant. |

---

## 2. Stratégie de rapprochement (cf. spec §7.1)

| | |
|---|---|
| **Hiérarchie figée** | 1. Identifiant HelloAsso déjà lié au partenaire ; 2. e-mail normalisé ; 3. nom + prénom + date de naissance ; 4. sinon cas non résolu |
| **Nature de la décision** | **Provisoire** |
| **Automatique vs revue manuelle** | Automatique sur les rangs 1 et 2 si absence d’ambiguïté ; rang 3 à confirmer selon qualité réelle des données ; cas douteux orientés en revue manuelle |
| **Règle en cas d’ambiguïté** | **Pas de création automatique** en cas de doute ; mise en attente / revue manuelle prioritaire |
| **Date** | Avril 2026 |
| **Validé par** | Dorevia — hypothèse de travail interne, à confirmer métier / MOA |

---

## 3. Rattachement LGZ / RGL / CCC (cf. spec §8)

| | |
|---|---|
| **Table de correspondance** | **À produire** à partir de l’audit HelloAsso réel : structure / formulaire / campagne HelloAsso → cible métier → segmentation Odoo |
| **Nature de la décision** | **Partiellement ouverte** |
| **Orientation retenue** | Base Odoo commune avec logique de segmentation à confirmer |
| **Cas CCC** | ☐ Entité distincte · ☐ Segment sous LGZ · ☒ **À arbitrer explicitement** |
| **Date** | Avril 2026 |
| **Validé par** | Dorevia — orientation interne ; arbitrage métier requis |

*Joindre ou référencer une table externe si elle est volumineuse.*

**Ancrage terrain (sandbox, avril 2026)** — Première boucle réelle sur l’organisation **`testdorevia`** : formulaire d’adhésion *AdhésionTestDoreviaGLZ*, **`formSlug`** `adhesiontestdoreviaglz`, **`formType`** `Membership`. Cet ancrage sert de **premier ancrage de validation technique** pour le routage par formulaire ; il **ne substitue pas** la table LGZ / RGL / CCC en production (cf. spec §8).

---

## 4. Point de vérité métier du flux (HelloAsso) (cf. spec §5.1, §11.0)

La documentation API **ne tranche pas seule** quel objet fait foi pour une adhésion **éligible** au connecteur : **commande**, **paiement**, **combinaison**, autre. Ce choix conditionne le déclenchement métier et l’alignement avec les notifications `Order` / `Payment`. Voir [REF_API_HELLO_ASSO.md](./REF_API_HELLO_ASSO.md) (parcours formulaires, commandes, paiements).

| | |
|---|---|
| **Décision** | ☐ **Commande** seule · ☐ **Paiement** seul · ☒ **Combinaison** (préciser la règle) · ☐ Autre : |
| **Nature de la décision** | **Provisoire** |
| **Règle opérationnelle** | Une adhésion est considérée comme synchronisable lorsqu’une **commande** existe pour le formulaire d’adhésion ciblé et qu’un **paiement** associé est présent dans un **état compatible** avec la règle métier d’**éligibilité** (à formaliser avec le métier, cf. spec §2.2). *Observation sandbox* : pour `adhesiontestdoreviaglz`, présence d’une commande (`id` **82771**) et d’un paiement (`id` **53022**) — à valider sur payloads JSON et comptes réels. |
| **Référence stable retenue** | **À confirmer** après audit : candidats **`order.id`** et **`payment.id`** (et/ou clé composée) pour idempotence et traçabilité ; alignement avec notifications `Order` / `Payment` |
| **Date** | Avril 2026 |
| **Validé par** | Dorevia — hypothèse de travail interne, à confirmer métier / MOA |

---

## 5. Mode de synchronisation technique (cf. spec §11)

<!-- id: 0h1f4n — alignement ir.cron / pas queue_job à ce stade -->

| | |
|---|---|
| **Mode retenu** | ☒ **Batch planifié** · ☐ Webhook · ☐ Hybride · ☐ Autre : |
| **Nature de la décision** | **Provisoire** |
| **Position actuelle** | Le MVP fonctionne aujourd’hui en **déclenchement manuel** depuis Odoo. Le **prochain palier retenu** est une automatisation simple par **action planifiée Odoo (`ir.cron`)**. |
| **Interfaces Odoo** | Synchronisation portée par le module Odoo existant ; pas de service externe retenu à ce stade |
| **Fréquence / déclencheurs** | Fréquence modérée à définir selon le besoin métier (ex. nocturne ou périodique). Pas de webhook retenu dans l’immédiat |
| **Mécanisme de reprise** | Journalisation des échecs, relance manuelle possible, puis exécution planifiée de réconciliation |
| **Position sur `queue_job`** | **Non retenu dans l’immédiat**. `queue_job` est considéré comme un **palier 2**, à envisager uniquement si la volumétrie, la durée d’exécution ou le besoin de non-blocage le justifient |
| **Référence doc API HelloAsso** | À renseigner précisément lors du choix technique final (URL + date/version) |
| **Date** | Avril 2026 |
| **Validé par** | Dorevia — hypothèse de travail interne, à confirmer technique / MOA |

---

## Historique des versions de ce document

| Version | Date | Modifications |
|---------|------|----------------|
| 0.1 | Avril 2026 | Création du gabarit |
| 0.2 | Avril 2026 | **§4** — Point de vérité métier (commande / paiement / combinaison) ; ancienne §4 technique → **§5** ; lien [REF_API](./REF_API_HELLO_ASSO.md) |
| 0.2.1 | Avril 2026 | Renvoi spec **§13.1 / §13.2** (restructuration des arbitrages dans la spec v0.3.3) |
| 0.3 | Avril 2026 | Statut **registre d’arbitrage** ; objet allégé ; **§2** — règle d’ambiguïté ; **§4** — référence stable ; **§5** — mécanisme de reprise |
| 0.3.1 | Avril 2026 | Première version **provisoire remplie** : hypothèses de départ sur modèle Odoo, rapprochement, point de vérité métier et mode de synchronisation |
| 0.3.2 | Avril 2026 | **§3** — ancrage terrain sandbox (`testdorevia`, `adhesiontestdoreviaglz`) ; **§4** — règle opérationnelle **combinaison** commande + paiement affinée + exemple d’ids observés ; référence stable : candidats `order.id` / `payment.id` |
| 0.3.3 | Avril 2026 | **§3** — formulation « premier ancrage de validation technique » (à la place de « preuve de faisabilité ») ; **§4** — fluidité de la règle opérationnelle (commande + paiement, état compatible) |
| 0.3.4 | Avril 2026 | Renvoi [POSITIONNEMENT_SYNC_CRON_VS_QUEUE_JOB.md](./POSITIONNEMENT_SYNC_CRON_VS_QUEUE_JOB.md) — prochain palier : `ir.cron` ; `queue_job` en palier 2 si besoin terrain |
| 0.3.5 | Avril 2026 | **§5** réaligné : MVP **manuel** aujourd’hui ; prochain palier **batch planifié** (`ir.cron`) ; **pas** de webhook ni `queue_job` à ce stade ; statut en-tête et **objet** du document assouplis ; décision d’automatisation gravée en citation sous l’objet |

---

## Liens

* [Specification — SPEC_DOREVIA_HELLOASSO_ADHERENT.md](./SPEC_DOREVIA_HELLOASSO_ADHERENT.md)
* [Référence API HelloAsso](./REF_API_HELLO_ASSO.md)
* [Big Picture HelloAsso → Odoo](./Big_Picture_HelloAsso.md)
* [Positionnement automatisation synchro — cron vs queue_job](./POSITIONNEMENT_SYNC_CRON_VS_QUEUE_JOB.md)
