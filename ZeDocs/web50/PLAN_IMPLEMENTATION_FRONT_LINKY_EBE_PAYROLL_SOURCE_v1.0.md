# PLAN_IMPLEMENTATION_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0

**Document :** `PLAN_IMPLEMENTATION_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.md`  
**Répertoire :** `ZeDocs/web50/`  
**Date :** 2026-03-15  
**Référence :** `SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0`  
**Produit :** Dorevia Linky  
**Objet :** Plan d’implémentation front — adaptation de la card EBE selon `payroll_source`  
**Statut :** Validé pour exécution — v1.0 gelée  
**Implémentation :** 2026-03-15 — toutes les tâches du plan ont été réalisées (payroll-source-ui, EbeCardWithPolling, EbeCard, mapping §10, suppression wording obsolète).

---

### Validation

Le document `PLAN_IMPLEMENTATION_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0` est validé pour exécution et gelé en v1.0. Il constitue la **référence front** de mise en œuvre de l’adaptation de la card EBE selon `payroll_source`.

---

## 1. Vue d’ensemble

Ce plan découpe l’implémentation front du **Lot 2 UI** (adaptation EBE selon `payroll_source`) en tâches exécutables, alignées sur la spec normative et sur le code actuel (EbeCard, EbeCardWithPolling, API payroll).

**Principe :** la card EBE doit utiliser `payroll_source` ("payslip" | "od" | "none") comme source de vérité pour le badge et les messages d’aide, et gérer l’état `legacy_fallback` tant que le backend n’expose pas encore ce champ. La chaîne **« Aucun bulletin dans le Vault »** ne doit plus apparaître.

**Dépendance :** le backend Vault peut ne pas encore exposer `payroll_source` ; le front doit rester rétrocompatible (état `legacy_fallback`).

---

## 2. Périmètre

### 2.1 Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `units/dorevia-linky/app/api/payroll/route.ts` | Proxy vers Vault ; transmet la réponse telle quelle (déjà le cas). Aucune modification obligatoire si Vault renvoie les nouveaux champs. |
| `units/dorevia-linky/components/EbeCardWithPolling.tsx` | Appelle `/api/payroll`, lit la réponse, passe `payrollTotal`, `payslipCount` (et à venir : `payrollSource`, `payrollUnavailable`, `breakdown`) à EbeCard. |
| `units/dorevia-linky/components/EbeCard.tsx` | Affiche la card EBE ; bloc « composantes manquantes » avec badge source paie et message d’aide. Doit dériver l’état UI à partir de `payroll_source`. |

### 2.2 Hors périmètre

- Modification du calcul EBE côté API.
- Autres cards Linky.
- Design responsive détaillé du bloc source paie.

---

## 3. Phases et tâches

### Phase 1 — Contrat de données et résolution d’état

**Objectif :** définir le type de réponse payroll et la fonction de résolution d’état UI.

- [x] **T1.1** Définir un type TypeScript pour la réponse payroll (ex. dans `app/types/` ou module dédié) et une **fonction de normalisation** `normalizePayrollResponse(raw)` qui unifie les champs backend (éviter la dispersion `total` vs `total_charges`, `count` vs `payslip_count`) :
  - retour : `{ total, count, currency, payroll_source?, payroll_unavailable?, breakdown? }`
  - ex. `total = raw?.total ?? raw?.total_charges ?? null`, `count = raw?.count ?? raw?.payslip_count ?? 0`, `currency = raw?.currency ?? "EUR"` ; les autres champs transmis tels quels.
  - ainsi `EbeCardWithPolling` travaille sur un objet normalisé stable.
- [x] **T1.2** Implémenter `resolvePayrollSourceUi(payroll)` (spec §11.1) :
  - si `payroll_source === "payslip"` → `"payslip"`
  - si `payroll_source === "od"` → `"od"`
  - si `payroll_source === "none"` ou `payroll_unavailable === true` → `"none"`
  - sinon → `"legacy_fallback"`
- [x] **T1.3** Créer le mapping `PAYROLL_SOURCE_UI` (spec §13.2) : pour chaque état (`payslip`, `od`, `none`, `legacy_fallback`), définir badge et messages (principal, secondaire) selon le tableau §10 de la spec.

**Livrable Phase 1 :** type + `normalizePayrollResponse` + `resolvePayrollSourceUi` + `PAYROLL_SOURCE_UI`.

---

### Phase 2 — Remontée des champs payroll dans le parent

**Objectif :** que EbeCard reçoive l’état source (dérivé de la réponse API).

- [x] **T2.1** Dans `EbeCardWithPolling.tsx`, après réception de la réponse `/api/payroll` :
  - appeler `normalizePayrollResponse(payrollRes)` pour obtenir un objet stable ;
  - dériver l’état UI avec `resolvePayrollSourceUi(normalized)` ;
  - passer à EbeCard : `payrollSourceUi`, `payrollTotal` (depuis normalized.total), et optionnellement `payrollBreakdown`.
- [x] **T2.2** **Calculer `hasPayroll` dans `EbeCardWithPolling`** (et non dans EbeCard) : `(payrollSourceUi === "payslip" || payrollSourceUi === "od") && payrollTotal != null`, ou en legacy `(normalized.count > 0) && payrollTotal != null` ; **passer `hasPayroll` en prop booléenne à EbeCard**. Une seule source de vérité pour cette condition, évitant une logique dupliquée parent / enfant.

**Livrable Phase 2 :** EbeCard reçoit `payrollSourceUi`, `hasPayroll`, et les données normalisées ; pas de recalcul de hasPayroll dans EbeCard.

---

### Phase 3 — Affichage normatif dans EbeCard

**Objectif :** badge et messages d’aide selon l’état UI, suppression de tout wording obsolète.

- [x] **T3.1** Dans `EbeCard.tsx`, ajouter les props `payrollSourceUi`, `hasPayroll` (calculé par le parent), et optionnellement `payrollBreakdown`. Ne pas recalculer hasPayroll dans EbeCard.
- [x] **T3.2** Remplacer le bloc actuel du badge « Charges de personnel » et du paragraphe d’aide par un rendu basé sur `PAYROLL_SOURCE_UI[payrollSourceUi]` :
  - badge = libellé du mapping ;
  - message principal = texte principal du mapping ;
  - message secondaire si présent.
- [x] **T3.3** Vérifier qu’aucune chaîne « Aucun bulletin dans le Vault » ne reste dans le composant (recherche globale dans EbeCard et EbeCardWithPolling).
- [x] **T3.4** (Optionnel v1.0) Si `payrollSourceUi === "od"` et `breakdown` fourni, afficher en détail secondaire : « Salaires (641*) : X € », « Charges sociales (645*) : Y € ».

**Livrable Phase 3 :** affichage conforme au mapping §10 de la spec ; wording legacy supprimé.

---

### Phase 4 — Tests et régression

**Objectif :** valider les 4 états et la rétrocompatibilité.

- [x] **T4.1** Test manuel ou unitaire : réponse mock avec `payroll_source: "payslip"` → badge « Source paie : bulletins », pas de message d’absence.
- [x] **T4.2** Test : réponse mock avec `payroll_source: "od"` → badge « Source paie : OD comptables », message d’aide OD.
- [x] **T4.3** Test : réponse mock avec `payroll_source: "none"` → badge « Source paie indisponible », message générique (sans « bulletin »).
- [x] **T4.4** Test : réponse sans `payroll_source` (legacy) → état `legacy_fallback`, microcopy générique (actuelle ou alignée spec §7.4).
- [x] **T4.5** Vérifier que la chaîne « Aucun bulletin dans le Vault » n’apparaît dans aucun scénario (recherche dans le bundle ou tests E2E si disponibles).
- [x] **T4.6** Test de non-régression : avec `payroll_source: "od"` et `payrollTotal` renseigné, la card ne doit pas se comporter comme en absence de paie (montant EBE et bloc composantes doivent refléter la disponibilité de la source OD).

**Livrable Phase 4 :** AC1–AC5 de la spec couverts ; non-régression montant / source OD (T4.6) ; AC6 (breakdown optionnel) si implémenté.

---

## 4. Ordre d’exécution recommandé

1. **Phase 1** : type + `resolvePayrollSourceUi` + `PAYROLL_SOURCE_UI` (T1.1 → T1.3).
2. **Phase 2** : remontée des champs et état dans EbeCardWithPolling (T2.1, T2.2).
3. **Phase 3** : affichage dans EbeCard (T3.1 → T3.4).
4. **Phase 4** : tests (T4.1 → T4.6).

Les phases 1 et 2 peuvent être enchaînées sans bloquer le backend ; la Phase 3 consomme l’état remonté ; la Phase 4 valide l’ensemble.

---

## 5. Récapitulatif des livrables

| Livrable | Contenu |
|----------|---------|
| **Type + résolution** | Type réponse payroll, `normalizePayrollResponse`, `resolvePayrollSourceUi`, mapping `PAYROLL_SOURCE_UI`. |
| **Remontée état** | EbeCardWithPolling normalise la réponse, dérive l’état UI et **calcule hasPayroll** ; passe `payrollSourceUi`, `hasPayroll` (et données) à EbeCard. |
| **Affichage EbeCard** | Badge et messages d’aide selon état ; suppression wording « Aucun bulletin dans le Vault » ; breakdown optionnel. |
| **Tests** | AC1–AC5 (et AC6 si breakdown) ; aucun wording legacy restant. |

---

## 6. Définition of Done (rappel spec §15)

La mise à jour front est terminée lorsque :

- la card EBE lit `payroll_source` (via réponse API proxy) ;
- les 4 états UI (`payslip`, `od`, `none`, `legacy_fallback`) sont gérés ;
- la chaîne **« Aucun bulletin dans le Vault »** a disparu ;
- la microcopy correspond exactement à la source réelle quand elle est connue ;
- l’ancienne API (sans `payroll_source`) reste supportée sans message trompeur ;
- le breakdown OD reste optionnel et non bloquant.

---

## 7. Backlog technique — tâches dev ordonnancées

| # | Tâche | Phase | Fichier(s) cible(s) |
|---|--------|-------|----------------------|
| 1 | Type réponse payroll + `normalizePayrollResponse` + `resolvePayrollSourceUi` + `PAYROLL_SOURCE_UI` | 1 | Nouveau module (ex. `app/lib/payroll-source-ui.ts` ou `app/types/payroll.ts`) |
| 2 | EbeCardWithPolling : normaliser réponse, dériver état, **calculer hasPayroll**, passer à EbeCard | 2 | `EbeCardWithPolling.tsx` |
| 3 | EbeCard : props `payrollSourceUi`, `hasPayroll` (fourni par le parent), optionnel `payrollBreakdown` | 2–3 | `EbeCard.tsx` |
| 4 | EbeCard : remplacer badge + message par mapping `PAYROLL_SOURCE_UI` | 3 | `EbeCard.tsx` |
| 5 | Vérification suppression « Aucun bulletin dans le Vault » | 3 | `EbeCard.tsx`, `EbeCardWithPolling.tsx` |
| 6 | (Optionnel) Affichage breakdown 641/645 si `od` + `breakdown` | 3 | `EbeCard.tsx` |
| 7 | Tests manuels ou unitaires des 4 états + legacy | 4 | Tests existants ou nouveau fichier test |

---

## 8. Compatibilité backend

- Tant que `payroll_source` est absent, le front **ne doit jamais reconstituer une source métier à partir de `count` seul** ; il doit rester en `legacy_fallback` et afficher la microcopy générique.
- Dès que le backend renvoie `payroll_source` et `payroll_unavailable`, le front affiche l’état exact sans déploiement supplémentaire (les champs sont déjà lus et transmis).

---

*ZeDocs/web50 — SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0. À exécuter après ou en parallèle du Lot 2 backend. Document final de référence Lot 2 UI — v1.0 gelée.*
