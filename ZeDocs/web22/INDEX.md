# Index — ZeDocs/web22
## Vision, architecture et déploiement Dorevia (DIVA, Mistral, DLP)

Dernière mise à jour : 2026-02-17

**Mistral** : ✅ Option B implémentée (`units/mistral/`, ~3,4 s latence)  
**DIVA** : ✅ Implémenté — `units/diva/`, proxy Linky, bloc UI (debounce 2 s, Rafraîchir, bloc Données utilisées repliable)  
**DIVA Warmup Runner** : ✅ Store Postgres, runner CODIR, prewarm — `RAPPORT_IMPLEMENTATION_DIVA_WARMUP_DETAILLE_2026-02-17.md`

---

## 1. Hiérarchie des documents

```
DOREVIA_THE_BIG_PICTURE.md     ← Vision produit (DIVA, DLP)
         │
         ▼
VISION_TECHNIQUE_DOREVIA_v1.0.md  ← Architecture technique
         │
         ├── RECOMMANDATIONS_VISION_TECHNIQUE_v1.0.md  ← Renforcements Phase DIVA
         ├── SPEC_INSTALLATION_MISTRAL.v0.1.md         ← Installation Mistral (vLLM, GPU/CPU)
         ├── RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md  ← Option B CPU (llama.cpp, sans GPU)
         └── RAPPORT_INTEGRATION_MISTRAL_DIVA_v1.0.md   ← Rapport détaillé intégration

PLAN_IMPLEMENTATION_MISTRAL_SCRUM_v1.0.md  ← Plan Scrum Mistral (Phase 1 terminée)
PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md     ← Plan Scrum DIVA (3 sprints — implémentation complète)
PLAN_IMPLEMENTATION_DIVA_v2_EDITORIAL_SCRUM.md  ← Plan Scrum v2 éditorial (1 sprint, 2 j)
RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17.md  ← Rapport implémentation Mistral
RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md  ← Rapport implémentation DIVA
RAPPORT_LOAD_TEST_DIVA_MISTRAL_2026-02-17.md  ← Load test DIVA + Mistral (RAM/CPU, cache, 10 simultanés, 20 séquentiels)
SPEC_ConcurrencyGuard.md  ← Guard concurrence par context_hash (1 refresh max)
AVIS_SPEC_ConcurrencyGuard_2026-02-17.md  ← Avis et analyse spec Concurrency Guard
RECOS_ConcurrencyGuard_DIVA_2026-02-17.md  ← Décisions validées et recommandations implémentation
RAPPORT_IMPLEMENTATION_CONCURRENCY_GUARD_2026-02-17.md  ← Rapport implémentation Guard
PRE_SPEC_DIVA_v0.1.md  ← Pré-spéc DIVA (expression du besoin, questions)
SPEC_DIVA_API_v1.0.md  ← Spec API /diva/explain (v1.1, ready for implementation)
SPEC_DIVA_v2_Copilote_CODIR.md  ← Spec éditoriale v2.1 — forme narrative (JSON v1 conservé)
PLAN_IMPLEMENTATION_DIVA_v2_EDITORIAL_SCRUM.md  ← Plan Scrum v2 — prompt, UI, recette (2 j)
COHERENCE_DIVA_v2_2026-02-17.md  ← Vérification cohérence v2 (SPEC, AVIS, PLAN)
AVIS_SPEC_DIVA_v2_Copilote_CODIR_2026-02-17.md  ← Avis et checklist implémentation v2
AVIS_SPEC_DIVA_API_v1.0.md  ← Avis, recommandations (précède v1.1)
ANNEXE_PROMPT_DIVA_FLASH_v1.0.md  ← Prompts v1.1 (JSON strict, garde-fous) — à adapter pour v2
RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md  ← Décision Auto + bouton Rafraîchir
COHERENCE_WEB22_2026-02-17.md  ← Vérification cohérence
SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md  ← Spec Warmup Runner (prewarm, runner Go)
RAPPORT_IMPLEMENTATION_DIVA_WARMUP_DETAILLE_2026-02-17.md  ← Rapport implémentation Warmup (Store Postgres, UX)
MEMO_DIVA_WARMUP_2026-02-17.md  ← Mémo rapide (déploiement, config, commandes)
```

---

## 2. Documents par rôle

| Document | Rôle | Cible |
|----------|------|-------|
| **DOREVIA_THE_BIG_PICTURE** | Vision produit — gouvernance par la preuve, DLP | Product, AMOA |
| **VISION_TECHNIQUE_DOREVIA** | Architecture technique — Vault, DVIG, Linky, DIVA, Mistral | Tech, CTO |
| **RECOMMANDATIONS_VISION_TECHNIQUE** | Recommandations — snapshot, isolation DIVA, registre DLP | Tech |
| **SPEC_INSTALLATION_MISTRAL** | Spec installation Mistral — vLLM, Docker, runbook, GPU/CPU | Ops, Dev |
| **RECO_MISTRAL_CPU_LLAMACPP** | Option B CPU — llama.cpp + GGUF (serveur sans GPU) | Ops |
| **RAPPORT_INTEGRATION_MISTRAL_DIVA** | Rapport intégration — options, architecture, plan déploiement | Tech, Ops |
| **PLAN_IMPLEMENTATION_MISTRAL_SCRUM** | Plan Scrum Mistral — sprints, US, DoD (Option B) | Ops, Dev |
| **PLAN_IMPLEMENTATION_DIVA_SCRUM** | Plan Scrum DIVA — 3 sprints (service, proxy, UI) | Tech, Dev |
| **RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17** | Rapport implémentation Mistral Phase 1 | Tech, Ops |
| **RAPPORT_IMPLEMENTATION_DIVA_2026-02-17** | Rapport implémentation DIVA (service, proxy, UI) | Tech, Ops |
| **RAPPORT_LOAD_TEST_DIVA_MISTRAL_2026-02-17** | Load test DIVA + Mistral — RAM/CPU, cache, 10 simultanés, latence 20 appels | Tech, Ops |
| **SPEC_ConcurrencyGuard** | Guard concurrence — 1 refresh max par context_hash, stratégie reject | Tech |
| **AVIS_SPEC_ConcurrencyGuard_2026-02-17** | Avis et analyse — recommandations, ordre des opérations, purge | Tech |
| **RECOS_ConcurrencyGuard_DIVA_2026-02-17** | Décisions validées — réponse soft, injection, ordre opérations | Tech |
| **RAPPORT_IMPLEMENTATION_CONCURRENCY_GUARD_2026-02-17** | Rapport implémentation Guard — flux, tests, impact UI | Tech, Ops |
| **PRE_SPEC_DIVA** | Expression du besoin DIVA (synthèse Linky, sans DLP) | Product, Tech |
| **SPEC_DIVA_API** | Spec API POST /diva/explain (v1.1, Flash, units/diva/) | Tech |
| **SPEC_DIVA_v2_Copilote_CODIR** | Spec éditoriale v2 — forme narrative, UI compacte, JSON v1 conservé | Product, Tech |
| **PLAN_IMPLEMENTATION_DIVA_v2_EDITORIAL** | Plan Scrum v2 — prompt, retrait truncate, UI, recette (2 j) | Tech |
| **AVIS_SPEC_DIVA_v2** | Avis, checklist implémentation v2 (prompt, UI, tests) | Tech |
| **ANNEXE_PROMPT_DIVA_FLASH** | Prompts v1.1 — JSON strict, anti-hallucination (à adapter pour v2 éditorial) | Tech |
| **AVIS_SPEC_DIVA_API** | Avis, recommandations, questions sur la spec | Product, Tech |
| **COHERENCE_WEB22_2026-02-17** | Vérification cohérence ZeDocs/web22 | Tech |
| **RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH** | Décision Auto + Refresh — bouton « Rafraîchir l'analyse » | Product |
| **SPEC_DIVA_Warmup_Runner_CODIR** | Spec Warmup Runner — prewarm, runner Go, périodes CODIR | Tech |
| **RAPPORT_IMPLEMENTATION_DIVA_WARMUP_DETAILLE** | Rapport implémentation Warmup — Store Postgres, runner, UX | Tech, Ops |
| **MEMO_DIVA_WARMUP_2026-02-17** | Mémo rapide — déploiement, config, commandes | Tous |

---

## 3. Déploiement Mistral — Quelle option ?

| Contexte serveur | Document à suivre |
|------------------|-------------------|
| **GPU NVIDIA présent** | `SPEC_INSTALLATION_MISTRAL.v0.1.md` §8.1 (vLLM GPU) |
| **Pas de GPU, CPU uniquement** | `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` (llama.cpp + GGUF) |
| **Pas de GPU, vLLM CPU (dégradé)** | `SPEC_INSTALLATION_MISTRAL.v0.1.md` §8.3 |

**Serveur doreviateam** (128 cœurs, 15 Go RAM, pas de GPU) → **Option B** recommandée.

**Emplacement** (Option B) : `units/mistral/` (`/opt/dorevia-plateform/units/mistral/`) — aligné avec les autres units (gateway, odoo, dorevia-linky).

**Plan d’implémentation** : `PLAN_IMPLEMENTATION_MISTRAL_SCRUM_v1.0.md` Phase 1 terminée. **DIVA** : `units/diva/` implémenté — `RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md`.

---

## 4. Références externes (hors web22)

| Document | Emplacement |
|----------|-------------|
| Spec grille Linky | `ZeDocs/web21/SPEC_LINKY_HOME_GRID_ICONS_KPI_CARDS_v0.1.md` |
| Spec layout Linky | `ZeDocs/web21/SPEC_LINKY_LAYOUT_HEADER_FOOTER_v0.1.md` |

---

**Fin de l'index.**
