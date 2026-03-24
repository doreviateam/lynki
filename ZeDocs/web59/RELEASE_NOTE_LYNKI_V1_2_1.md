# Release note étendue — Lynki V1.2.1

*Document de communication : prolonge la release V1.2 par un correctif de cohérence produit livré **après** le jalon `lynki-v1.2`.*

**Date** : 24 mars 2026

---

## Ligne de tags Lynki (référence)

| Tag | Sens |
|-----|------|
| `lynki-v1-go-r1` | Validation recette V1 (GO avec réserves) |
| `lynki-v1.1` | Stabilisation post-recette |
| `lynki-v1.2` | Navigation détail desktop, filtres alertes, suppression faux label projection J+30, complétion canon desktop 12 tuiles — **jalon figé tel quel** |
| **`lynki-v1.2.1`** | **Nettoyage post-jalon** : suppression de l’action d’export PDF global non branchée sur `/synthese` (ticket backlog V1.2-5) |

Le tag `lynki-v1.2` **n’a pas été déplacé** : il reste fidèle à l’état figé au moment de sa pose.

---

## Formulation release (comité / interne)

> **Lynki V1.2.1 prolonge V1.2 par un nettoyage de cohérence produit sur la synthèse comptable, en supprimant une action d’export PDF non branchée, sans modifier le périmètre fonctionnel principal de la release V1.2.**

Les exports **réels** (CSV par blocs dans la synthèse, DOCX via le bloc Diva, exports GL pour les rôles autorisés) sont **inchangés**.

---

## Contenu technique V1.2.1

| Élément | Détail |
|---------|--------|
| Fichier impacté | `units/dorevia-linky/app/(reporting)/synthese/page.tsx` |
| Action | Suppression du bouton sticky « Export PDF » sans handler ni API |
| Motif | Alignement avec la règle produit : aucun export global exposé sans sortie réelle, qualifiée et branchée |
| Backlog | `BACKLOG_V1_2_LYNKI.md` — V1.2-5 statut `Fait` |
| Commits de référence | `f00feadd` (code), `1e099ef2` (backlog) |

---

## Hors périmètre de V1.2.1

* **V1.2-6** (mini-graphes sparklines mobile) : basse priorité, non incluse dans ce gel ; pas de tag dédié à ce stade.
* Nouvel export trésorerie, export cockpit global, PDF générique : non livrés.

---

*Note rédigée pour figer la release étendue V1.2.1 — tag Git : `lynki-v1.2.1`.*
