# ADR — Décisions d’arbitrage HelloAsso ↔ Odoo (adhérents)

| | |
|---|---|
| **Version** | 0.3.1 |
| **Date** | Avril 2026 |
| **Statut** | Registre d’arbitrage — **version provisoire initialisée** ; hypothèses de départ à confirmer |
| **Spec de référence** | [SPEC_DOREVIA_HELLOASSO_ADHERENT.md](./SPEC_DOREVIA_HELLOASSO_ADHERENT.md) |
| **Note technique API** | [REF_API_HELLO_ASSO.md](./REF_API_HELLO_ASSO.md) |

---

## Objet de ce document

Consigner les décisions **actées** sur le connecteur HelloAsso → Odoo (adhérents), sans dupliquer la spec détaillée.

* La **spec** décrit le périmètre, les principes, les hypothèses et les critères de recette.
* Cet **ADR** enregistre **ce qui a été tranché** : date, version, contenu stable, éventuelles références (réunion, ticket).

Tant qu’un arbitrage n’est pas définitivement validé, il peut être consigné ici comme **décision provisoire**, explicitement identifiée comme telle.

Mettre à jour ce fichier lorsqu’un arbitrage est **confirmé, ajusté ou écarté** (cf. spec §13.1 et §13.2).

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

---

## 4. Point de vérité métier du flux (HelloAsso) (cf. spec §5.1, §11.0)

La documentation API **ne tranche pas seule** quel objet fait foi pour une adhésion **éligible** au connecteur : **commande**, **paiement**, **combinaison**, autre. Ce choix conditionne le déclenchement métier et l’alignement avec les notifications `Order` / `Payment`. Voir [REF_API_HELLO_ASSO.md](./REF_API_HELLO_ASSO.md) (parcours formulaires, commandes, paiements).

| | |
|---|---|
| **Décision** | ☐ **Commande** seule · ☐ **Paiement** seul · ☒ **Combinaison** (préciser la règle) · ☐ Autre : |
| **Nature de la décision** | **Provisoire** |
| **Règle opérationnelle** | Hypothèse de départ : une adhésion n’entre dans le flux que si la **commande** existe et que l’état de **paiement** est compatible avec la règle métier d’éligibilité à formaliser avec le métier |
| **Référence stable retenue** | **À confirmer** après audit : priorité à un identifiant HelloAsso stable permettant idempotence et traçabilité ; possibilité d’utiliser une clé composée si nécessaire |
| **Date** | Avril 2026 |
| **Validé par** | Dorevia — hypothèse de travail interne, à confirmer métier / MOA |

---

## 5. Mode de synchronisation technique (cf. spec §11)

| | |
|---|---|
| **Mode retenu** | ☐ Batch planifié · ☐ Webhook · ☒ **Hybride** · ☐ Autre : |
| **Nature de la décision** | **Provisoire** |
| **Interfaces Odoo** | À confirmer au choix d’architecture ; orientation actuelle ouverte entre module Odoo dédié et service externe |
| **Fréquence / déclencheurs** | Notifications si disponibles pour la réactivité ; batch planifié de réconciliation pour sécuriser les écarts et reprises |
| **Mécanisme de reprise** | Journalisation des échecs + relance manuelle ou automatique + batch de réconciliation |
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

---

## Liens

* [Specification — SPEC_DOREVIA_HELLOASSO_ADHERENT.md](./SPEC_DOREVIA_HELLOASSO_ADHERENT.md)
* [Référence API HelloAsso](./REF_API_HELLO_ASSO.md)
* [Big Picture HelloAsso → Odoo](./Big_Picture_HelloAsso.md)
