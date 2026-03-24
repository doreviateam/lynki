# Rapport de réalisation — Sprint 01 Lynki (Phase 2)

**Fichier canonique :** `RAPPORT_SPRINT_01_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_01_LYNKI.md](PLAN_SPRINT_01_LYNKI.md) **v1.0**  
**Date de clôture :** 20 mars 2026  
**Rédacteur :** équipe Lynki Phase 2  
**Version rapport :** 1.1 — mars 2026  
**Révision 1.1 :** statut global **sans contradiction** — Gate A **en attente de recette manuelle** (T3) ; formulation D2 (écart UX **accepté** Sprint 01).  
**Statut global :** **Sprint livré techniquement — Lot 4A stabilisé, Lot 2 amorcé — Gate A en attente de recette manuelle (T3)**

---

## 1. Résumé exécutif

L'objectif du Sprint 01 — poser les fondations Phase 2 sans casser le cockpit existant — est **atteint**.

Les **9 tickets** du sprint ont été traités. 8 sont **done** côté code ; T3 (tests manuels) reste à valider en environnement. La **doctrine Vault** est appliquée dès le premier incrément : aucune donnée comptable n'est lue en direct depuis les amont sans passer par la route `/api/accounting/*`.

| Objectif sprint | Résultat |
|----------------|---------|
| Gel documentaire (Lot 0) | ✅ Cohérent |
| Navigation Pilotage / Synthèse — **Gate A** | ✅ Implémentée côté code — **Gate A non prononcé** tant que T3 (R1–R7) n’est pas vert |
| Contrat `lynki.accounting.*` stabilisé (Lot 4A) | ✅ Contrat typé + stub documenté |
| Amorce Synthèse + bloc pilote BG (Lot 2) | ✅ Shell + `AccountingSummaryView` |
| Régression Pilotage | ⏳ À valider T3 (manuel) |

---

## 2. Tickets — état à la clôture

| # | Titre | Lot | Statut | Livrable |
|---|-------|-----|--------|---------|
| **T1** | Relecture en-têtes + renvois | 0 | ✅ done | En-têtes cohérents, spec Synthèse citée via en-tête |
| **T2** | Navigation `appView` / `?view=` | 1 | ✅ done | `DashboardWithFilters`, `page.tsx`, onglets Pilotage/Synthèse |
| **T3** | Tests manuels bascule / URL / régression Pilotage | 1 | ⏳ à valider | Scénarios écrits ci-dessous (§4) |
| **T4** | Inventaire API vs dictionnaire restitutions | 4A | ✅ done | Aucune route `lynki.accounting.*` préexistante — écart documenté |
| **T5** | Contrat stable `lynki.accounting.trial_balance` | 4A | ✅ done | Types TypeScript dans `route.ts` |
| **T6** | Décision stubs vs données réelles | 4A | ✅ done | Stub actif documenté dans le code ; décision tracée |
| **T7** | Shell vue Synthèse (routing / layout) | 2 | ✅ done | `AccountingSummaryView`, accessible via onglet |
| **T8** | Bloc pilote BG — données Vault + critères d'acceptation | 2 | ✅ done | `TrialBalanceBlock`, branché `/api/accounting/trial-balance` |
| **T9** | États chargement / erreur bloc BG | 2 | ✅ done | Skeleton, alerte erreur + bouton retry, état données en attente |

---

## 3. Fichiers créés ou modifiés

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `app/api/accounting/trial-balance/route.ts` | Route `GET` canonique `lynki.accounting.trial_balance` — contrat typé + stub Vault documenté (T5/T6) |
| `components/AccountingSummaryView.tsx` | Shell Synthèse + bloc pilote Balance générale avec états complets (T7/T8/T9) |

### Fichiers modifiés
| Fichier | Modification |
|---------|-------------|
| `app/page.tsx` | Lecture `?view=` côté serveur, passage de `initialAppView` au composant |
| `components/DashboardWithFilters.tsx` | État `appView`, sync URL (`router.push` + `useEffect`), onglets de bascule, rendu conditionnel Synthèse / Pilotage |

---

## 4. Scénarios de recette manuels (T3)

À exécuter en environnement dev ou déployé avant de valider **Gate A**.

| # | Scénario | Attendu | Statut |
|---|----------|---------|--------|
| R1 | Naviguer vers `/?view=pilotage` | Cockpit KPI s'affiche, onglet « Pilotage » actif | ⬜ |
| R2 | Naviguer vers `/?view=synthese` | Onglet « Synthèse comptable » actif, bloc BG visible (état « Données en attente » si Vault absent) | ⬜ |
| R3 | URL sans `?view=` | Comportement identique à `?view=pilotage` (fallback) | ⬜ |
| R4 | Cliquer onglet « Synthèse comptable » depuis Pilotage | URL change en `?view=synthese`, onglet bascule | ⬜ |
| R5 | Retour navigateur (← ) depuis Synthèse | Retour vers Pilotage, URL restaurée | ⬜ |
| R6 | Cockpit Pilotage — toutes les cartes KPI présentes | Aucune régression sur les 12 cartes | ⬜ |
| R7 | Cockpit Pilotage — bloc Diva Insights présent | Non régressé | ⬜ |
| R8 | Bloc BG en erreur (couper réseau) | Alerte visible, bouton « Réessayer » fonctionnel | ⬜ |

**Gate A validé** si R1 + R3 + R5 + R6 + R7 sont verts.

---

## 5. Décisions prises pendant le sprint

### D1 — Stub documenté actif (T6)
**Décision :** le stub `complete: false` + `lines: []` est actif quand le Vault n'a pas de route `/api/accounting/trial-balance`. L'UI affiche l'état « Données en attente » — pas d'erreur bloquante.  
**Raison :** débloquer l'amorce Synthèse sans attendre l'endpoint Vault. Élimine le risque T6 du plan.  
**Condition de retrait :** dès que `sources/vault` expose `/api/accounting/trial-balance`, le stub est court-circuité automatiquement.

### D2 — Onglets dans le corps (pas dans le header)
**Écart UX accepté pour Sprint 01 :** la barre **Pilotage | Synthèse comptable** est rendue **sous** le header existant, pas dans `ReportHeaderContentBody` — ce n’est **pas** la position définitive imposée par les wireframes BF ; c’est un **compromis livrable** pour limiter le risque de régression sur le chrome compact / mobile.  
**À arbitrer Sprint 02** : intégration dans le chrome header si l’UX le confirme (ref. `WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md`).

### D3 — Référentiel version figée à `"1.1"` dans la route
**Décision :** la version du référentiel est codée `"1.1"` (alignée sur l'en-tête de `REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md`). Pas de lecture dynamique.  
**Condition d'évolution :** si le référentiel passe en v1.2, mettre à jour la constante dans `route.ts` **et** journaliser ce changement (exigence §4B plan consolidé).

---

## 6. Évaluation des risques

| Risque plan | Matérialisé ? | Résolution |
|-------------|---------------|------------|
| 4A pas assez avancé pour débloquer Lot 2 | Non — stub documenté (D1) | Stub actif ; Lot 2 démarré sans blocage |

---

## 7. Écarts par rapport au plan

| Point | Plan | Réalisé | Impact |
|-------|------|---------|--------|
| Onglet de bascule | Header (wireframes cible) | Corps (sous header) — **écart accepté Sprint 01** (D2) | Réalignement possible Sprint 02 |
| T3 tests manuels | Done à la clôture | À valider en env | Condition Gate A — pas bloquant pour le code |

---

## 8. Gate A — état

| Condition Gate A | État |
|-----------------|------|
| Navigation Pilotage ↔ Synthèse stable | ✅ Code livré |
| URL `?view=` suit la bascule | ✅ Code livré |
| Historique navigateur cohérent | ✅ `router.push` utilisé |
| Non-régression cockpit Pilotage | ⏳ Recette manuelle T3 (R1–R7) à faire |

**Gate A :** **pas encore prononcé** au sens produit / recette — le code est prêt ; la **validation** suppose les scénarios §4 (R1–R7 minimum) **cochés**. Ensuite seulement : **Gate A atteint**.

---

## 9. Ce qui n'a pas été fait (hors périmètre sprint, conforme au plan)

* Lots **4B** (versioning bout-en-bout), **3** (BG/GL drill), **5** (DICO KPI), **6** (rôles, exports) — volontairement reportés.
* Endpoint Vault `/api/accounting/trial-balance` côté `sources/vault` — chantier Sprint 02 (Gate C en préparation).
* Intégration onglet dans le chrome header — Sprint 02 après validation UX.
* Blocs Bilan, Compte de résultat, Balances tiers, Grand livre dans la Synthèse — spec écran §3–§8, incréments ultérieurs.

---

## 10. Recommandations Sprint 02

1. **Valider Gate A** : exécuter recette T3 (§4) dès l'environnement disponible.
2. **Endpoint Vault** `sources/vault/internal/handlers/trial_balance.go` (ou équivalent) — données réelles BG → retrait automatique du stub.
3. **Aligner position des onglets** avec le chrome header si l'UX le demande (décision D2).
4. **Ouvrir Lot 4B** : version référentiel sur les réponses API, réconciliation bilan ↔ BG.
5. **Amorce Lot 5** : première entrée `DICO_INDICATEURS_KPI_LYNKI.md` si la recette KPI bloque.

---

*Rapport à archiver dans `ZeDocs/web57/` — référence de clôture Sprint 01. Suite : [PLAN_SPRINT_02_LYNKI.md](PLAN_SPRINT_02_LYNKI.md) (Vault BG, 4B, profondeur BG→GL) ; exécuter T3 / Gate A en parallèle dès environnement disponible.*
