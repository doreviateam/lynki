# Backlog V1.3 — Lynki (axe 1 : synthèse comptable / reporting)

*Tickets ciblés sur **l’axe 1** uniquement — pas de sparklines mobile (V1.2-6) ni profondeur pages détail cockpit dans ce backlog.*
*Référence plan : [`PLAN_V1_3_LYNKI.md`](./PLAN_V1_3_LYNKI.md)*

**Ouverture** : 24 mars 2026
**Règle** : pas de rapport lourd ni écran comptable exhaustif sur `/synthese` ; pas de promesse non tenue.

---

## Convention de statut

| Statut | Signification |
|--------|--------------|
| `À faire` | Non démarré |
| `En cours` | En cours |
| `Fait` | DoD validé |
| `Abandonné` | Décision explicite |
| `Audité` | Pré-requis documentaire levé ; **implémentation seulement si verdict produit positif** |

---

## Tableau de bord

| ID | Titre | Persona | Statut |
|----|-------|---------|--------|
| V1.3-1 | Résumé de lecture comité (entrée de synthèse) | Esther | `Fait` |
| V1.3-2 | États vide / partiel / indisponible homogènes sur les blocs comptables | Esther | `Fait` |
| V1.3-3 | Périmètre explicite par bloc (période, société, sources) | Véréna / Esther | `Fait` |
| V1.3-4 | Lecture comparative N vs N-1 (sous condition — voir audit § ci-dessous) | Esther | `Audité` |
| V1.3-5 | Libellés et périmètre des exports par bloc (CSV / DOCX) | Esther | `Fait` |

---

## Ordre d’exécution recommandé

**Règle** : l’audit **V1.3-4** est fait **en tête** (documentaire / code), mais **aucun build** sur V1.3-4 avant la fin de V1.3-3 (sauf décision contraire).

| Ordre | Action |
|-------|--------|
| 0 | **Audit V1.3-4** — figé dans ce document (§ suivant) ; décision produit sur la suite |
| 1 | **Build V1.3-1** — résumé comité |
| 2 | **Build V1.3-2** — états homogènes |
| 3 | **Build V1.3-3** — périmètre explicite par bloc |
| 4 | **Build V1.3-5** — libellés exports (après périmètres clairs) |
| 5 | **Build V1.3-4** — **uniquement si** le verdict post-V1.3-3 reste favorable et le périmètre d’implémentation est tranché |

---

## Audit V1.3-4 — résultat (code + API, 24 mars 2026)

**Objectif de l’audit** : savoir où la donnée N / N-1 est **déjà tenue** sans extrapolation front.

| Zone | Source réelle N vs N-1 ? | Détail |
|------|--------------------------|--------|
| **Rubriques bilan** (`/api/accounting/balance-sheet/rubrics`) | **Oui** | Query `compare=n-1` proxifiée vers Vault ; réponse avec `lines_previous`, `period_previous_from` / `period_previous_to`. `RubricsBlock` dans `AccountingSummaryView.tsx` affiche déjà **Comparatif N/N-1** et colonnes N / N-1 quand `hasComparison`. |
| **Rubriques CdR** (`/api/accounting/income-statement/rubrics`) | **Oui** | Même mécanisme que bilan. |
| **Balance générale** (`/api/accounting/trial-balance`) | **Non** | Aucun paramètre `compare` ni colonnes N-1 dans la route actuelle. |
| **Balances âgées** (clients / fournisseurs) | **Non** *en une requête* | Snapshot à une date (`period.to`) ; un comparatif N vs N-1 exigerait **deux appels** + **règle métier** explicite (hors scope tacite V1.3-4 sans cadrage). |

**Verdict pour l’implémentation V1.3-4** :

* **Périmètre réaliste sans nouveau backend** : enrichir la **lisibilité** ou la **surface** du comparatif **déjà présent** sur les blocs rubriques (bilan / CdR), ou le rendre plus visible au niveau synthèse — **sans** promettre un comparatif global sur toute la page.
* **Hors périmètre immédiat** : comparatif balance générale ou balances âgées **sans** évolution Vault / double période spécifiée.

Si, après V1.3-1 → V1.3-3, la priorité produit est ailleurs, **V1.3-4 peut rester au backlog** sans bloquer la release V1.3.

---

## V1.3-1 — Résumé de lecture comité

**Objectif** : offrir en tête de `/synthese` une **lecture courte** (2–4 lignes utiles + repères chiffrés optionnels) pour un comité, sans dupliquer tout le contenu des blocs.

**Fichiers probables** : `app/(reporting)/synthese/page.tsx`, `AccountingSummaryView.tsx` ou composant dédié léger.

**DoD** :
- [x] bloc « Résumé de lecture comité » en entrée de la synthèse (rendu dans `AccountingSummaryView`, page `/synthese`) ;
- [x] contenu dérivé de `coverageState`, `enableCompare`, libellés période / société — **aucun nouvel appel API** ;
- [x] couverture loading / ready / partial / empty / unavailable explicitée ; comparatif N/N-1 **uniquement** pour les rubriques, BG sans comparatif ;
- [x] typecheck / lint OK — composant `AccountingSummaryExecutiveBlock.tsx`

---

## V1.3-2 — États homogènes sur les blocs comptables

**Objectif** : aligner les patterns **chargement / vide / partiel / indisponible** entre `TrialBalanceBlock`, rubriques, balances âgées, etc.

**Fichiers probables** : `AccountingSummaryView.tsx` et sous-composants de blocs.

**DoD** :
- [x] même grammaire visuelle et textuelle pour les états limites ;
- [x] aucune régression sur les données « ready » ;
- [x] typecheck / lint OK.

**Livraison** : module partagé `components/accounting-summary/accountingBlockStates.tsx` (squelette chargement, indisponible + `ACCOUNTING_UNAVAILABLE_BODY`, notice vide, badges `ACCOUNTING_BADGE_STUB` / `ACCOUNTING_BADGE_PARTIAL`) ; blocs `TrialBalanceBlock`, `ClassAggregationBlock`, `RubricsBlock`, `AgedBalanceBlock` et panneau `GeneralLedgerPanel` dans `AccountingSummaryView.tsx`.

---

## V1.3-3 — Périmètre explicite par bloc

**Objectif** : chaque bloc comptable affiche clairement **période**, **société** (si applicable) et **source** de la donnée, pour lecture RAF sans ambiguïté.

**DoD** :
- [x] au moins une ligne de périmètre cohérente par bloc principal ;
- [x] pas de texte générique trompeur ;
- [x] typecheck / lint OK.

**Livraison** : `AccountingBlockPerimeterLine` dans `accountingBlockStates.tsx` (période, société, source lisible vault/secours, option `Comparatif N/N-1` uniquement quand `hasComparison`). Branché sur `RubricsBlock`, `ClassAggregationBlock`, `AgedBalanceBlock` (`Position au …`), `TrialBalanceBlock` (y compris état vide), en-tête `GeneralLedgerPanel` (prêt si réutilisation). Libellé société = `companyLabel` (cohérent avec le header synthèse). Pastille `data_source` brute retirée des en-têtes au profit de la ligne de périmètre.

---

## V1.3-4 — Lecture comparative N vs N-1

**Statut ticket** : `Audité` — voir **§ Audit V1.3-4** ci-dessus. **Pas de premier ticket de build.**

**Objectif** : après V1.3-1 … V1.3-5, **si** l’équipe maintient la priorité : renforcer ou étendre **uniquement** des comparatifs **déjà soutenus** par l’API (en pratique : rubriques bilan / CdR), ou trancher **Abandonné** / report si le gain ne vaut pas le risque.

**Point d’attention** : ne pas introduire de **faux confort** (pourcentages décoratifs, périmètres N / N-1 non alignés).

**DoD** (implémentation, **conditionnelle**) :
- [x] audit documentaire tranché (figé § Audit V1.3-4) ;
- [ ] si implémentation : périmètre produit explicitement limité (ex. rubriques uniquement) ;
- [ ] si implémentation : affichage qualifié, pas de promesse sur trial balance / âgées sans backend ;
- [ ] si non implémentation : ticket **Abandonné** ou reporté avec motif ;
- [ ] typecheck / lint OK.

---

## V1.3-5 — Libellés et périmètre des exports

**Objectif** : harmoniser les libellés des boutons CSV / renvois DOCX pour que **chaque export** corresponde à un **objet métier clair** (ex. « Balance générale », « Rubriques bilan », etc.).

**DoD** :
- [x] aucun nouveau bouton sans action réelle ;
- [x] libellés alignés avec le contenu effectivement exporté ;
- [x] typecheck / lint OK.

**Livraison** : constantes + infobulles `build*CsvTooltip` / `buildDivaDocxTooltip` dans `accountingBlockStates.tsx` ; boutons CSV homogènes (`CSV · …`, `Téléchargement…`) dans `AccountingSummaryView` ; BG filtrée rubrique : tooltip explicite si le CSV reste la balance complète ; balances âgées : message d’erreur si échec. Diva : `DOCX · Rapport Diva`, tooltip « distinct des CSV » ; `AccountingSummaryCodirBlock` + résumé comité mis à jour (CSV par bloc vs DOCX Diva).

---

## Journal de clôture

| ID | Date | Notes |
|----|------|-------|
| V1.3-1 | 24 mars 2026 | Bloc exécutif déterministe ; props depuis probe existante + `enableCompare`. |
| V1.3-2 | 24 mars 2026 | États loading / unavailable / empty / badges harmonisés ; pas de changement de logique métier des APIs. |
| V1.3-3 | 24 mars 2026 | Ligne de périmètre homogène sous les titres ; comparatif N/N-1 seulement sur rubriques avec données comparatives. |
| V1.3-5 | 24 mars 2026 | Libellés CSV/DOCX + tooltips périmètre ; distinction nette CSV bloc vs rapport Diva. |

---

*Backlog V1.3 Lynki — axe 1 uniquement — 5 tickets max.*
