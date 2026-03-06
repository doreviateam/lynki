# Vérification cohérence — ZeDocs/web22

**Date** : 2026-02-17

---

# 1. Synthèse

| Aspect | Statut | Détail |
|--------|--------|--------|
| **Versions** | ✅ | Spec v1.1, Annexe v1.1 — cohérentes |
| **Stack DIVA** | ✅ | Go (aligné Vault), documenté dans SPEC, PLAN, VISION |
| **DIVA implémenté** | ✅ | 2026-02-17 — service, proxy, UI — `RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md` |
| **Références croisées** | ✅ | INDEX, SPEC, ANNEXE, VISION, RAPPORT — liens corrects |
| **Convention dates** | ⚠️ | `date_start`/`date_end` (SPEC) vs `date_debut`/`date_fin` (Vault/Linky) — documenté, conversion côté Linky |
| **Annexe** | ✅ | Créée, prompts v1.1 alignés avec SPEC |

---

# 2. Points cohérents

- **Architecture** : `units/diva/`, flux Linky → proxy → DIVA → Mistral, réseau `dorevia-network`
- **Structure réponse** : `headline`, `what_i_see`, `to_check`, `confidence` — identique SPEC et ANNEXE
- **Confidence** : low | medium | high — définie dans SPEC §7 et ANNEXE §4
- **Fichiers** : `SPEC_DIVA_API_v1.0.md` (contenu v1.1), `ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` (contenu v1.1)
- **Spec éditoriale v2** : `SPEC_DIVA_v2_Copilote_CODIR.md` (v2.1) — forme narrative, UI compacte ; JSON v1 conservé, pas d’évolution d’API

---

# 3. Corrections appliquées

| Document | Correction |
|----------|------------|
| INDEX | "annexe prompt requise" → "annexe v1.1 disponible" |
| SPEC §14 | "prompts, exemples" → "prompts v1.1 (JSON strict, garde-fous)" |
| AVIS | "Reste : Annexe" → "Annexe créée v1.1, reste : mapping cards" |

---

# 4. Convention dates — décision

La SPEC utilise `date_start` / `date_end` pour l’API DIVA (contrat externe).  
Linky et Vault utilisent `date_debut` / `date_fin`.

**Recommandation** : le proxy Linky (`/api/diva/explain`) effectue la conversion :
- Linky reçoit `date_debut`, `date_fin` (filtres)
- Le proxy envoie à DIVA : `date_start` = `date_debut`, `date_end` = `date_fin`

Aucune modification de la SPEC nécessaire — la conversion est explicite dans le proxy.

---

# 5. Spec éditoriale v2

| Document | Rôle |
|----------|------|
| SPEC_DIVA_v2_Copilote_CODIR | Forme narrative (A/B/C), UI compacte, contraintes Mistral, mapping JSON v1 |
| PLAN_IMPLEMENTATION_DIVA_v2_EDITORIAL_SCRUM | Plan Scrum v2 — 4 US, 8 SP, 2 j |
| AVIS_SPEC_DIVA_v2 | Avis, checklist implémentation (prompt, max_tokens, UI, tests) |
| COHERENCE_DIVA_v2_2026-02-17 | Vérification cohérence v2 (règles, contraintes, références) |

Relation : la spec v2 ne modifie pas l'API ni le contrat JSON. Cohérence v2 détaillée : `COHERENCE_DIVA_v2_2026-02-17.md`.

------------------------------------------------------------------------

# 6. Références

| Document | Référence |
|----------|-----------|
| PLAN_IMPLEMENTATION_DIVA_SCRUM | Plan Scrum DIVA — 3 sprints (service, proxy, UI), 24 SP |
| RECO_MISTRAL | `SPEC_DIVA_API_v1.0.md` (consommateur Mistral) |
| RAPPORT_INTEGRATION | `ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` |
| Spec v2 éditoriale | `SPEC_DIVA_v2_Copilote_CODIR.md` (forme narrative, JSON v1 conservé) |

---

**Fin du document.**
