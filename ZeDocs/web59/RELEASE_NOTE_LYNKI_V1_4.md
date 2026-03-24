# Release note — Lynki V1.4 (axe 2 : pages détail cockpit)

*Jalon produit : **profondeur et honnêteté** des pages détail (`/encours`, `/flux-net`, `/business`, `/tresorerie`) avec une **grammaire d’interface commune** (périmètre, erreurs, chargement, vues partielles), **sans** refonte globale ni surpromesse métier.*

**Date (à compléter au gel)** : _[ex. 24 mars 2026]_  
**Tag Git (à créer après go recette)** : **`lynki-v1.4`** _(ou variante datée si convention interne)_

**Image Docker lab de référence au moment de la rédaction** : `dorevia/linky:lynki-v1.4-20260324-r13`  
**Branche de travail** : `port-account-reconcile-oca-o19` _(à ajuster si le merge se fait depuis une autre branche)_

**Références** : [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md) · [`PLAN_V1_4_LYNKI.md`](./PLAN_V1_4_LYNKI.md) · [`RELEASE_NOTE_LYNKI_V1_3.md`](./RELEASE_NOTE_LYNKI_V1_3.md)

---

## Règle de gel (discipline)

1. **Recette** sur l’image lab ci-dessus (ou la taguée au moment du gel) : les quatre routes détail.
2. **Décision produit** : V1.4 axe 2 **figé** ou **figé + queue polish** explicite (sinon pas de « terminé » implicite).
3. **Si go** : tag + mise à jour de cette note (date, tag, image finale, commits) + merge.
4. **Ensuite seulement** : alignement stinger, axe 3, ou suite autre chantier.

---

## Formulation release (comité / interne)

> _[À rédiger en 3–5 phrases après recette. Exemple de fil directeur :]_  
> **Lynki V1.4 livre sur l’axe 2 des pages détail cockpit plus lisibles pour le pilotage : même logique de périmètre et d’états, lecture RAF plus claire sur encours et flux, activité commerciale enrichie sans équivalence P&L, trésorerie alignée sur cette grammaire. Les limites de périmètre (Vault / ERP, instruments, données absentes) restent explicites à l’écran.**

---

## Périmètre livré (tickets axe 2)

| Ticket | Zone | Synthèse |
|--------|------|----------|
| **V1.4-1** | `/encours` | Périmètre, erreur + réessai, états homogènes, segmentation honnête (ouvert / échu), exposition client avec retards quand la donnée le permet. |
| **V1.4-2** | `/flux-net` | KPI flux net + encaissements / décaissements, bannières d’écart / partiel, graphique d’évolution aligné sur la logique métier (hors tableau IFRS). |
| **V1.4-3** | `/business` | CA / ventes–achats, concentration clients, aperçu créances + renvoi `/encours` ; enrichissements (évolution ventes/achats, délais où données disponibles). |
| **V1.4-4** | `/tresorerie` | Alignement grammaire V1.4 : header, périmètre, `metricsError`, squelettes, bannières partielles, Actualiser, évolution avec `res.ok`, état vide. |

**Queue polish (si applicable)** : _[Lister ici tout ce qui est volontairement laissé après le tag, ou indiquer « Aucune ».]_

---

## Ce que V1.4 axe 2 ne promet pas

* Pas de **tableau de flux** ou **P&L** normés : lecture **cockpit** sur périmètre servi.
* Pas de **nouveau backend** implicite : les écrans s’appuient sur les agrégations et API déjà branchées.
* **Stinger** : _[À compléter — aligné sur la même image que le lab / ou décalage assumé et documenté ici.]_

---

## Fichiers et composants principaux (indicatif)

| Zone | Fichiers / composants (indicatif) |
|------|-----------------------------------|
| Encours | `app/(cockpit)/encours/page.tsx`, `cockpitEncoursStates.tsx` |
| Flux net | `app/(cockpit)/flux-net/page.tsx`, `cockpitFluxNetStates.tsx` |
| Business | `app/(cockpit)/business/page.tsx`, `BusinessPageEvolution.tsx`, `cockpitBusinessStates.tsx` |
| Trésorerie | `app/(cockpit)/tresorerie/page.tsx`, `cockpitTreasuryStates.tsx` |
| Types / agrégats | `app/api/dashboard-metrics/route.ts` _(et types associés selon évolutions)_ |

---

## Commits de référence (jalon — à affiner au tag)

| Commit | Sujet (indicatif) |
|--------|-------------------|
| `9d43e5d8` | Compose lab — image `lynki-v1.4-20260324-r13` |
| `46a138f5` | V1.4-4 — harmonisation `/tresorerie` |
| `33d2f8ab` | `/business` — évolution + créances, compose r12 |
| _[…]_ | _[Commits V1.4-1 / V1.4-2 si besoin d’une ligne stable plus bas dans l’historique — `git log`]_ |

---

## Mini-recette recommandée (axe 2 — courte)

À passer **avant** officialisation du tag, sur **un tenant lab représentatif** :

1. **`/encours`** : périmètre visible ; erreur + Réessayer ; chargement ; segmentation ; tableau client cohérent avec les données.
2. **`/flux-net`** : même grammaire ; cartes encaissements / décaissements ou bannière partielle honnête ; graphique si série dispo.
3. **`/business`** : CA / ventes–achats ; concentration ; bloc évolution si période OK ; créances / délais sans contradiction avec `/encours`.
4. **`/tresorerie`** : fil d’Ariane + périmètre ; erreur / squelettes ; KPI + rapprochement ou message si détail absent ; courbe évolution ou état vide propre.

*(Checklists plus lourdes : ex. `CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`, `RECETTE_V1_LYNKI_PASSE1.md`.)*

---

## Suite produit suggérée (hors tag)

* **Stinger** : aligner l’image Linky ou documenter l’écart.
* **Axe 3** : polish mobile / sparklines (V1.2-6) si priorité confirmée.
* **Autres chantiers** : _[ex. sujet Odoo / réconciliation sur la branche métier]_.

---

*Release Lynki V1.4 — axe 2 pages détail — **brouillon** jusqu’à recette go + tag **`lynki-v1.4`**._
