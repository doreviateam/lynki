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

---

## Tableau de bord

| ID | Titre | Persona | Statut |
|----|-------|---------|--------|
| V1.3-1 | Résumé de lecture comité (entrée de synthèse) | Esther | `À faire` |
| V1.3-2 | États vide / partiel / indisponible homogènes sur les blocs comptables | Esther | `À faire` |
| V1.3-3 | Périmètre explicite par bloc (période, société, sources) | Véréna / Esther | `À faire` |
| V1.3-4 | Lecture comparative légère (N vs N-1) — si données tenues | Esther | `À faire` |
| V1.3-5 | Libellés et périmètre des exports par bloc (CSV / DOCX) | Esther | `À faire` |

---

## V1.3-1 — Résumé de lecture comité

**Objectif** : offrir en tête de `/synthese` une **lecture courte** (2–4 lignes utiles + repères chiffrés optionnels) pour un comité, sans dupliquer tout le contenu des blocs.

**Fichiers probables** : `app/(reporting)/synthese/page.tsx`, `AccountingSummaryView.tsx` ou composant dédié léger.

**DoD** :
- [ ] bloc ou section « lecture comité » visible sans scroll excessif sur desktop ;
- [ ] contenu **uniquement** dérivé de données déjà chargées ou d’un agrégat minimal (pas de nouveau moteur narratif non qualifié) ;
- [ ] état honnête si données insuffisantes ;
- [ ] typecheck / lint OK.

---

## V1.3-2 — États homogènes sur les blocs comptables

**Objectif** : aligner les patterns **chargement / vide / partiel / indisponible** entre `TrialBalanceBlock`, rubriques, balances âgées, etc.

**Fichiers probables** : `AccountingSummaryView.tsx` et sous-composants de blocs.

**DoD** :
- [ ] même grammaire visuelle et textuelle pour les états limites ;
- [ ] aucune régression sur les données « ready » ;
- [ ] typecheck / lint OK.

---

## V1.3-3 — Périmètre explicite par bloc

**Objectif** : chaque bloc comptable affiche clairement **période**, **société** (si applicable) et **source** de la donnée, pour lecture RAF sans ambiguïté.

**DoD** :
- [ ] au moins une ligne de périmètre cohérente par bloc principal ;
- [ ] pas de texte générique trompeur ;
- [ ] typecheck / lint OK.

---

## V1.3-4 — Lecture comparative N vs N-1

**Objectif** : si les **APIs / agrégats** permettent une comparaison **sans extrapolation**, exposer un indicateur ou un écart contrôlé sur 1–2 blocs prioritaires.

**Point d’attention** : **audit préalable** — si aucune base sérieuse, ticket basculé en **Abandonné** ou réduit à un message « non disponible » explicite.

**DoD** :
- [ ] audit tranché (données tenues ou non) ;
- [ ] si oui : affichage qualifié (pas de faux pourcentage décoratif) ;
- [ ] si non : aucune promesse d’écart affichée ;
- [ ] typecheck / lint OK.

---

## V1.3-5 — Libellés et périmètre des exports

**Objectif** : harmoniser les libellés des boutons CSV / renvois DOCX pour que **chaque export** corresponde à un **objet métier clair** (ex. « Balance générale », « Rubriques bilan », etc.).

**DoD** :
- [ ] aucun nouveau bouton sans action réelle ;
- [ ] libellés alignés avec le contenu effectivement exporté ;
- [ ] typecheck / lint OK.

---

## Journal de clôture

| ID | Date | Notes |
|----|------|-------|
| — | — | — |

---

*Backlog V1.3 Lynki — axe 1 uniquement — 5 tickets max.*
