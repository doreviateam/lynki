# Release note — Lynki V1.3 (axe 1 : synthèse comptable)

*Jalon produit : renforcement de **`/synthese`** pour une lecture comptable plus sérieuse, sans rapport lourd ni surpromesse.*

**Date** : 24 mars 2026  
**Tag Git** : **`lynki-v1.3`**

**Références** : [`BACKLOG_V1_3_LYNKI.md`](./BACKLOG_V1_3_LYNKI.md) · [`PLAN_V1_3_LYNKI.md`](./PLAN_V1_3_LYNKI.md)

---

## Formulation release (comité / interne)

> **Lynki V1.3 livre sur l’axe 1 une synthèse comptable plus lisible pour comité et RAF : entrée de lecture structurée, états d’interface homogènes, périmètre explicite par bloc, exports CSV et DOCX mieux qualifiés. Le ticket optionnel V1.3-4 (comparatif N/N-1 « en plus » sur les rubriques) n’a pas été retenu dans cette séquence : le comparatif existant sur rubriques bilan / CdR est jugé suffisant, l’audit reste valable.**

---

## Périmètre livré (tickets axe 1)

| Ticket | Intitulé | Synthèse |
|--------|----------|----------|
| **V1.3-1** | Résumé de lecture comité | Bloc exécutif en tête de synthèse, déterministe, sans nouvel appel API. |
| **V1.3-2** | États homogènes | Grammaire commune loading / indisponible / vide / badges (`accountingBlockStates.tsx`). |
| **V1.3-3** | Périmètre par bloc | Ligne de périmètre (période, société, source, comparatif N/N-1 **uniquement** si données comparatives réelles). |
| **V1.3-5** | Exports qualifiés | Libellés CSV homogènes, infobulles de périmètre, distinction nette **CSV par bloc** vs **DOCX Diva** ; honnêteté BG filtrée / CSV complet. |
| **V1.3-4** | Comparatif N/N-1 (optionnel) | **Non livré** : statut **`Abandonné`** pour cette release après micro-arbitrage produit (gain net non démontré ; risque de flou). |

---

## Ce que V1.3 ne promet pas

* Pas de comparatif N/N-1 sur la **balance générale** ni sur les **balances âgées** sans évolution Vault dédiée.
* Pas de **nouvel export fantôme** : seuls les canaux déjà branchés sont libellés et expliqués.
* **V1.3-4** peut être **réouvert** plus tard uniquement comme **petite** évolution **RubricsBlock**, sans backend nouveau, si un gain de lecture est **identifié avant** tout code.

---

## Fichiers et composants principaux

| Zone | Fichiers / composants (indicatif) |
|------|-------------------------------------|
| Synthèse | `AccountingSummaryView.tsx`, `AccountingSummaryExecutiveBlock.tsx` |
| États / périmètre / exports | `components/accounting-summary/accountingBlockStates.tsx` |
| Diva / CODIR | `AccountingInsightBlock.tsx`, `AccountingSummaryCodirBlock.tsx` |

---

## Commits de référence (jalon)

| Commit | Sujet |
|--------|--------|
| `2edcac9e` | V1.3-1 — résumé comité |
| `a3b2a397` | V1.3-2 — états homogènes |
| `a8b0c315` | V1.3-3 — périmètre par bloc |
| `2fbc5153` | V1.3-5 — libellés exports |
| `40a711ad` | Clôture axe 1 — V1.3-4 abandonné, docs |

---

## Mini-recette recommandée sur `/synthese` (courte)

À passer **après** pose du tag, pour verrouiller la release sans charge lourde :

1. **Résumé comité** : présent en entrée ; cohérent avec filtres période / société et état de couverture.
2. **États** : chargement, erreur (Réessayer), vide, partiel / stub — rendu aligné entre blocs comptables.
3. **Périmètre** : chaque grand bloc affiche la ligne période · société · source ; **Comparatif N/N-1** seulement sur rubriques quand les colonnes comparatives sont là.
4. **Exports** : libellés `CSV · …` et `DOCX · Rapport Diva` ; infobulles crédibles ; message d’erreur si export âgé en échec ; pas d’action DOCX « fantôme » dans le bloc CODIR.
5. **Bruit** : pas de régression visuelle majeure sur le reste de la page (graphiques, alertes, preuve).

*(Les recettes détaillées existantes — ex. `CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md` — peuvent compléter si besoin.)*

---

## Suite produit suggérée (hors tag)

* **V1.4 — axe 2** (profondeur pages détail : `/business`, `/flux-net`, `/encours`, harmonisation minimale `/tresorerie`) — voir [`PLAN_V1_4_LYNKI.md`](./PLAN_V1_4_LYNKI.md) et [`BACKLOG_V1_4_LYNKI.md`](./BACKLOG_V1_4_LYNKI.md).
* **Axe 3** (polish mobile / sparklines V1.2-6) **après** l’axe 2 si la priorité le confirme.

---

*Release Lynki V1.3 — axe 1 synthèse comptable figé — tag **`lynki-v1.3`**.*
