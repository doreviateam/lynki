# Plan V1.4 — Lynki (mini-cadrage — axe 2)

*Ouverture du chantier **Lynki V1.4** après clôture de **V1.3** sur l’axe synthèse (`lynki-v1.3`). **Changement de nature** : on ne prolonge pas la synthèse comptable ; on vise la **profondeur métier** des pages détail déjà ouvertes depuis le cockpit.*

**Ouverture** : 24 mars 2026

**Références** : [`RELEASE_NOTE_LYNKI_V1_3.md`](./RELEASE_NOTE_LYNKI_V1_3.md) · [`PLAN_V1_3_LYNKI.md`](./PLAN_V1_3_LYNKI.md) · [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md)

---

## 1. Convention de nommage

> **V1.4 = axe 2 — profondeur de lecture et d’action sur les pages détail**

Le passage **V1.3 → V1.4** marque un **nouveau jalon lisible** : après un cycle centré sur `/synthese`, le produit s’enrichit sur les **vues détail** déjà navigables depuis Lynki, sans les rebaptiser « suite V1.3 ».

---

## 2. Point de départ

* **V1.3** : clôturée sur l’axe 1 — synthèse comptable plus crédible, comité-compatible ; tag **`lynki-v1.3`**.
* **V1.2-6** (sparklines / polish mobile) : **hors périmètre par défaut** de V1.4 — reste l’**axe 3**, à traiter après l’axe 2 si la priorité le confirme.

---

## 3. Périmètre V1.4 et ordre d’exécution

**Quatre tickets** — ordre **figé** dans [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md) :

| Ordre | ID | Zone | Rationale courte |
|-------|-----|------|------------------|
| 1 | V1.4-1 | **`/encours`** | Le plus **actionnable** pour un RAF ; premier build axe 2. |
| 2 | V1.4-2 | **`/flux-net`** | Lecture du **mouvement réel** après la grammaire Encours. |
| 3 | V1.4-3 | **`/business`** | Enrichi quand le **détail** est mieux cadré. |
| 4 | V1.4-4 | **`/tresorerie`** | **Alignement final** avec la grammaire V1.4 — pas le point de départ (page souvent la plus mature). |

DoD détaillés : **même fichier backlog**.

---

## 4. Règles (même esprit que V1.3)

* **Pas** de refonte globale du shell ni du design system.
* **Pas** de tunnel ni d’écran « détail pour le détail » : seulement des **gains lisibles et tenus**.
* **Pas** de faux détail (données, libellés ou actions non soutenus par la stack ou le métier).
* **Pas** de surpromesse : chaque ticket porte un **DoD** explicite.

---

## 5. Suite immédiate

1. **Mini-recette** `/synthese` puis **push** branche + tag **`lynki-v1.3`** si ce n’est pas déjà fait.
2. **Ouvrir V1.4-1 — `/encours`** (premier ticket exécutable — intention, structure cible et DoD dans le backlog).
3. Enchaîner **V1.4-2 → V1.4-3 → V1.4-4** selon le backlog.
4. Tag de clôture **`lynki-v1.4`** — **posé** le 24 mars 2026 ; release note : [`RELEASE_NOTE_LYNKI_V1_4.md`](./RELEASE_NOTE_LYNKI_V1_4.md).

---

*Mini-cadrage V1.4 — axe 2 pages détail : [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md).*
