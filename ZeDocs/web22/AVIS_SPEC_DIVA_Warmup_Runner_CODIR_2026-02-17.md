# Avis — SPEC DIVA Warmup Runner CODIR v1.0 / v1.1

**Date** : 2026-02-17  
**Document évalué** : `SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md` (amendée en v1.1)

---

## Points forts

**1. Objectifs clairs**
- But principal explicite (réduction latence perçue) et mesurable
- Non-objectifs bien délimités, périmètre v1 raisonnable

**2. Architecture cohérente**
- Principe d’asynchrone, idempotent, déterministe aligné avec le Persistent Store
- Réutilisation du store Postgres sans nouvelle dépendance
- Stratégie à deux niveaux (prewarm + runner) adaptée

**3. Spécification exploitable**
- Flux détaillés (§4.2, §4.3) facilement implémentables
- API prewarm décrite (payload, comportement, réponses)
- Paramètres et variables d’environnement listés

**4. Observabilité**
- Logs structurés prévus
- KPIs listés pour un usage en v2

---

## Points d’attention / lacunes

**1. Payload prewarm (§5.2)**
- L’exemple montre `"dashboard": { "cards": [...] }`, alors que Linky envoie le résultat brut de `dashboard-metrics` (treasury, cash, business, etc.), transformé côté serveur en cards.
- À clarifier : le payload est le même que pour `explain/async` (avant transformation).

**2. Option A vs B pour le Runner (§6.5)** — ✅ Pris en compte
- Option B retenue pour v1 : simple, cohérent, zéro duplication. Spec mise à jour.

**3. `RUNNER_COMPANY_IDS` (§9.2)** — ✅ Pris en compte
- Format `RUNNER_TENANT_CONFIG=tenant:1,2;tenant2:0` formalisé. Spec + implémentation mises à jour.

**4. `RUNNER_MAX_IN_FLIGHT` (§6.4)**
- Mentionné mais absent des paramètres §9.2.
- En pratique `RUNNER_CONCURRENCY` suffit.

**5. Erreurs Runner / retry (§6)** — ✅ Pris en compte
- Section 6.5 Résilience ajoutée : pas de panic, log warning, retry cycle suivant. Implémentation : recover + slog.Warn.

**6. Timezone CODIR (§6.3)**
- “today” et “1er du mois” dépendent de la timezone.
- Implémentation : UTC.
- Pour un contexte CODIR français, Europe/Paris pourrait être indiqué.

---

## Cohérence avec l’existant Dorevia

**Alignement**
- Réutilisation des briques existantes (DIVA async, store Postgres)
- Pas de Redis ni de queue externe
- Concurrence limitée pour protéger le LLM
- Multi-instance via DB partagée

**Dépendances**
- Linky, DIVA, Vault doivent être disponibles
- Option B : Linky doit être joignable par le runner

---

## Recommandations pour v1.1

| Sujet | Proposition |
|-------|-------------|
| Payload prewarm | Aligner l’exemple sur le format réel (identique à `explain/async`) |
| Option B | Documenter que l’Option B est suffisante pour v1 |
| Company IDs | Décrire le format (ex. `tenant:1,2;sarl-la-platine:0,1`) |
| Timezone | Documenter la timezone utilisée pour les dates CODIR |
| Erreurs Runner | ✅ Section 6.5 Résilience + implémentation |
| US-3 Recette | Clarifier la mesure de “time to first meaningful DIVA” |

---

## Verdict

Spec de qualité, prête à l’implémentation : objectifs clairs, architecture cohérente, périmètre maîtrisé. Les écarts avec l’implémentation actuelle restent mineurs (payload, Option B, company IDs, timezone). Quelques ajustements documentaires amélioreront l’alignement spec ↔ code pour la maintenance.

---

**Fin de l’avis.**
