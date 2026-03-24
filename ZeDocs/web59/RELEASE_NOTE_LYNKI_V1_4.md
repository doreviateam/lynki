# Release note — Lynki V1.4 (axe 2 : pages détail cockpit)

*Jalon produit : **profondeur et honnêteté** des pages détail (`/encours`, `/flux-net`, `/business`, `/tresorerie`) avec une **grammaire d’interface commune** (périmètre, erreurs, chargement, vues partielles), **sans** refonte globale ni surpromesse métier.*

**Date de gel** : 24 mars 2026  
**Tag Git** : **`lynki-v1.4`**

**Image Docker lab de référence** : `dorevia/linky:lynki-v1.4-20260324-r13`  
**Branche** : `port-account-reconcile-oca-o19` _(merge vers la branche principale du dépôt selon process interne)_

**Références** : [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md) · [`PLAN_V1_4_LYNKI.md`](./PLAN_V1_4_LYNKI.md) · [`RELEASE_NOTE_LYNKI_V1_3.md`](./RELEASE_NOTE_LYNKI_V1_3.md)

---

## Décision de jalon

* **Recette** : **go** sur l’image lab **r13** pour les quatre routes détail (axe 2).
* **Périmètre** : **V1.4 axe 2 figé** pour ce tag — pas de « queue polish » ouverte dans cette note ; les suites éventuelles sont hors jalon (stinger, axe 3, autres chantiers).
* **Posture** : la présente note **constate** le livrable associé au tag ; elle ne remplace pas une recette exhaustive (voir checklists détaillées si besoin).

---

## Formulation release (comité / interne)

> **Lynki V1.4 livre sur l’axe 2 des pages détail cockpit plus lisibles pour le pilotage : périmètre et états homogènes (chargement, erreur, partiel), lecture RAF plus claire sur les encours et le flux net, activité commerciale enrichie (concentration, évolution ventes / achats, créances) sans équivalence comptable P&L, trésorerie alignée sur la même grammaire. Les limites de périmètre (Vault / ERP, mode instruments, données absentes) restent explicites à l’écran.**

---

## Périmètre livré (tickets axe 2)

| Ticket | Zone | Synthèse |
|--------|------|----------|
| **V1.4-1** | `/encours` | Périmètre, erreur + réessai, états homogènes, segmentation honnête (ouvert / échu), exposition client avec retards quand la donnée le permet. |
| **V1.4-2** | `/flux-net` | KPI flux net + encaissements / décaissements, bannières d’écart / partiel, graphique d’évolution aligné sur la logique métier (hors tableau IFRS). |
| **V1.4-3** | `/business` | CA / ventes–achats, concentration clients, aperçu créances + renvoi `/encours` ; évolution ventes / achats, délais où données disponibles. |
| **V1.4-4** | `/tresorerie` | Alignement grammaire V1.4 : header, périmètre, `metricsError`, squelettes, bannières partielles, Actualiser, évolution avec `res.ok`, état vide. |

**Queue polish (post-jalon)** : **Aucune** n’est inscrite dans cette release ; les évolutions mineures suivantes se traitent hors tag **`lynki-v1.4`**.

---

## Ce que V1.4 axe 2 ne promet pas

* Pas de **tableau de flux** ou **P&L** normés : lecture **cockpit** sur périmètre servi.
* Pas de **nouveau backend** implicite : les écrans s’appuient sur les agrégations et API déjà branchées.
* **Stinger** : les stacks **lab / linky-generic** pointent sur **`lynki-v1.4-20260324-r13`** ; le compose **stinger** (ex. `sarl-la-platine`) peut encore référencer une **image antérieure** — **écart assumé** jusqu’à décision d’alignement ou de déploiement dédié.

---

## Fichiers et composants principaux (indicatif)

| Zone | Fichiers / composants (indicatif) |
|------|-----------------------------------|
| Encours | `app/(cockpit)/encours/page.tsx`, `cockpitEncoursStates.tsx` |
| Flux net | `app/(cockpit)/flux-net/page.tsx`, `cockpitFluxNetStates.tsx` |
| Business | `app/(cockpit)/business/page.tsx`, `BusinessPageEvolution.tsx`, `cockpitBusinessStates.tsx` |
| Trésorerie | `app/(cockpit)/tresorerie/page.tsx`, `cockpitTreasuryStates.tsx` |
| Types / agrégats | `app/api/dashboard-metrics/route.ts` |

---

## Commits de référence (jalon)

| Commit | Sujet |
|--------|--------|
| `9d43e5d8` | Compose lab — image `lynki-v1.4-20260324-r13` |
| `46a138f5` | V1.4-4 — harmonisation `/tresorerie` |
| `33d2f8ab` | `/business` — évolution + créances, compose r12 |
| `7a3008a9` | Graphique `/flux-net` aligné carte FLUX NET |
| `a2a6276d` | V1.4-3 Business, graphique flux-net, images lab r7 |
| `1ad183bb` | Lab r5, V1.4 cockpit, nav tenant, pages détail |
| `418f2aab` | `PLAN_V1_4` + `BACKLOG_V1_4` — axe 2 |

---

## Mini-recette de verrouillage (axe 2 — courte)

À rejouer si besoin après déploiement ou changement de tenant :

1. **`/encours`** : périmètre visible ; erreur + Réessayer ; chargement ; segmentation ; tableau client cohérent avec les données.
2. **`/flux-net`** : même grammaire ; cartes encaissements / décaissements ou bannière partielle honnête ; graphique si série dispo.
3. **`/business`** : CA / ventes–achats ; concentration ; bloc évolution si période OK ; créances / délais sans contradiction avec `/encours`.
4. **`/tresorerie`** : fil d’Ariane + périmètre ; erreur / squelettes ; KPI + rapprochement ou message si détail absent ; courbe évolution ou état vide propre.

*(Checklists plus lourdes : `CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`, `RECETTE_V1_LYNKI_PASSE1.md`.)*

---

## Suite produit suggérée (hors tag)

* **Stinger** : aligner l’image Linky sur la même ligne que le lab ou maintenir l’écart **documenté** ci-dessus.
* **Axe 3** : polish mobile / sparklines (V1.2-6) si priorité confirmée.
* **Branche métier** : suite du chantier sur `port-account-reconcile-oca-o19` ou équivalent selon arbitrage.

---

*Release Lynki V1.4 — axe 2 pages détail — tag **`lynki-v1.4`** — image lab **`lynki-v1.4-20260324-r13`**.*
