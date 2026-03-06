# Avis d'expert — Stratégie DIVA « Facts Pack » : analyse par le code, rédaction par le LLM

**Date :** 2026-03-01  
**Référence :** SPEC DIVA v1.2.1 (validée pour implémentation)  
**Contexte :** Analyse au regard de l'existant (codebase DIVA, Mistral, Linky)  
**Alignement :** Ce document est aligné sur la SPEC v1.2.1 consolidée.

---

## 1. Synthèse de l'avis

**Verdict :** La proposition est **pertinente, alignée avec l'existant et réalisable**. L'architecture actuelle de DIVA est déjà partiellement conforme à ce modèle. L'évolution proposée consolide et optimise ce qui existe, plutôt que de tout repenser.

| Critère | Évaluation |
|---------|------------|
| **Alignement avec l'existant** | Fort — 70–80 % déjà en place |
| **Réduction des timeouts** | Très probable — prompt plus court, génération limitée |
| **Effort d'implémentation** | Modéré — refactorisation, pas de réécriture |
| **Risque** | Faible — mode dégradé actuel prouve la faisabilité |
| **Cohérence produit** | Élevée — renforce la vision Dorevia (souveraineté, utilité) |

---

## 2. Analyse de l'existant

### 2.1 Ce qui est déjà en place

L'architecture actuelle de DIVA suit déjà une logique **« analyse par le code, formulation par le LLM »** :

| Composant | Implémentation actuelle | Rôle |
|-----------|-------------------------|------|
| **computeInsights()** | `units/diva/internal/mistral/client.go` L296–480 | Calcule en amont : ratios, écarts, anomalies, POS, AR, gouvernance. Produit des chaînes structurées (ex. « POINT DOMINANT: cash X € sans validation bancaire »). |
| **Payload envoyé à Mistral** | `userPromptPayload` (L242–249) | Contient : `cards`, `insights` (max 10), `data_completeness`. Les insights sont des faits pré-calculés. |
| **System prompt** | Règle 4 (L93) | « Ne déduis rien au-delà des données transmises. Ne calcule AUCUN ratio toi-même. Utilise UNIQUEMENT les ratios fournis dans le champ "insights". » |
| **degradedFlash()** | L999–1038 | En cas de timeout : utilise **uniquement** les insights pré-calculés pour produire headline + what_i_see + to_check. **Aucun LLM.** |

Le mode dégradé prouve que **les insights déterministes suffisent** à produire une synthèse exploitable. Le LLM ajoute de la fluidité et de la hiérarchisation, mais n'est pas indispensable pour le contenu factuel.

### 2.2 Ce qui alourdit encore le flux

| Élément | Impact | Localisation |
|---------|--------|--------------|
| **Cartes complètes** | 8 cartes avec label, value, formatted, status, status_reason — redondant avec les insights | `buildUserPrompt` L655–672 |
| **System prompt** | ~1 200 tokens (règles 1–17) | `client.go` L74–106 |
| **max_tokens** | 1 024 — le LLM peut générer jusqu'à 1 024 tokens | L144 |
| **Instruction** | « Analyse globale à partir des données et insights pré-calculés » — formulation encore orientée « analyse » | L707 |

### 2.3 Causes des timeouts (rappel)

D'après le rapport MOA laplatine2026 :

- Inférence CPU : Mistral 7B Q4 ≈ 25–40 s (prompt) + 30–90 s (génération)
- Parallélisme : `--parallel 1` (ou 2 après optimisation)
- Timeout DIVA : 120 s (porté à 180 s)

**Réduire la taille du prompt et le nombre de tokens générés** diminue directement la latence et le risque de timeout.

---

## 3. Évaluation de la proposition « Facts Pack » (SPEC v1.2.1)

### 3.1 Cohérence avec l'existant

La proposition formalise et pousse plus loin ce qui existe déjà :

1. **« Faire analyser par le code »** — déjà fait via `computeInsights()`. À renforcer en :
   - centralisant tous les calculs dans le module `internal/facts/` (SPEC §3.1) ;
   - produisant un objet structuré `FactsPack` avec `[]Fact` (Priority, Category, Message).

2. **« Faire rédiger par le LLM »** — déjà partiellement en place. À clarifier en :
   - simplifiant le system prompt (SPEC §5) ;
   - réduisant le payload à un facts pack compact (sans les cartes brutes).

3. **« Le LLM ne calcule rien »** — déjà imposé par la règle 4. À renforcer en :
   - supprimant les cartes du prompt (les insights en sont une synthèse) ;
   - limitant le contexte à des faits textuels prêts à être reformulés.

### 3.2 Gains attendus

| Gain | Mécanisme | Estimation |
|------|-----------|------------|
| **Réduction du prompt** | Suppression des cartes, insights condensés en facts pack | −30 à −50 % de tokens d'entrée |
| **Réduction de la génération** | max_tokens 250 (mode short) | −50 à −75 % de tokens de sortie |
| **Latence** | Moins de tokens à traiter et à générer | −20 à −40 % de temps total |
| **Timeouts** | Latence plus faible et plus stable | Cible : < 2 % sur 24 h (SPEC §9) |
| **Stabilité** | Moins de « raisonnement » attendu du LLM | Comportement plus prévisible |

### 3.3 Modes (SPEC v1.2.1)

| Mode | max_tokens | Usage |
|------|------------|-------|
| **short** | 250 | Cockpit / diva-runner (défaut API) |
| **professional** | 500 | Analyse manuelle |
| **deep** | 1024 | Async export futur |

Le mode **short** est le défaut API. Le diva-runner et le cockpit l'utilisent pour une latence cible < 30–60 s CPU.

---

## 4. Plan d'implémentation (aligné SPEC v1.2.1)

### Phase 1 — Extraction Facts Engine (1 j)

1. **Créer le module `units/diva/internal/facts/`**  
   - Déplacer `computeInsights()` et la logique associée.  
   - Produire `FactsPack` avec `[]Fact` (Priority, Category, Message).  
   - Échelle de priorité : 1 = gouvernance, 2 = trésorerie, 3 = inducteurs, 4 = complémentaire.

2. **Format FactsPack (SPEC §3.2)**  
   ```go
   type FactsPack struct {
       Mode             string
       Context          ContextMeta
       Facts            []Fact
       DataCompleteness *DataCompleteness
   }
   type Fact struct {
       Priority  int
       Category  string  // governance | treasury | tax | pos | ar
       Message   string
   }
   ```

### Phase 2 — Simplification prompt (1 j)

1. **Payload LLM (SPEC §4)** — Envoyer uniquement :
   ```json
   {
     "output_mode": "short",
     "facts": ["POINT DOMINANT: ...", "Position nette ...", ...],
     "data_completeness": { "bank_health_metrics": "complete" }
   }
   ```

2. **System prompt consolidé (SPEC §5)** — Instruction dynamique selon mode.

3. **max_tokens dynamique** — 250 (short), 500 (professional), 1024 (deep).

### Phase 3 — Intégration (0,5 j)

1. **diva-runner** — Utiliser `output_mode: "short"` par défaut.
2. **Linky** — API inchangée ; format de réponse identique.
3. **Cache & idempotence (SPEC §7)** — `payload_hash = SHA256(canonical_json(FactsPack))`.

### Phase 4 — Mode dégradé & tests (1 j)

1. **degradedFlash basé sur FactsPack (SPEC §8)**  
   - headline = premier fait "POINT DOMINANT:" sinon Facts[0]  
   - what_i_see = Facts[1:4] (max 3)  
   - to_check = Facts Category == "governance" contenant alerte/conformité/absence (max 2)  
   - confidence = computeConfidence(cards) — cartes conservées en entrée

2. **Tests** — Régression, comparaison latence, validation KPIs (§9).

**Total estimé : ~3 jours** (SPEC §10).

---

## 5. Risques et points de vigilance

| Risque | Mitigation |
|--------|------------|
| Perte de nuance par rapport à l'actuel | Conserver le mode professional en parallèle du mode short |
| Facts pack incomplet | Revue des règles métier de `computeInsights()` pour couvrir tous les cas |
| Régression sur la qualité de formulation | A/B test sur un échantillon de contextes (laplatine2026, sarl-la-platine) |
| Complexité du facts pack | 8 à 12 faits maximum, tri strict par Priority (SPEC §3.2) |

---

## 6. Conclusion et recommandation

La proposition « Faire analyser par le code. Faire rédiger par le LLM » est **techniquement solide et alignée avec l'existant**. La SPEC v1.2.1 la formalise et la valide pour implémentation. Elle :

- s'appuie sur ce qui existe déjà (`computeInsights`, mode dégradé) ;
- réduit la charge sur Mistral (prompt plus court, génération limitée) ;
- conserve l'IA en interne (souveraineté des données) ;
- reste cohérente avec la vision Dorevia (utilité, stabilité, maîtrise).

**Recommandation :** Implémenter selon la roadmap SPEC v1.2.1. Prioriser le mode short pour le cockpit et le diva-runner.

---

*Document aligné sur SPEC DIVA v1.2.1. Références : `ZeDocs/web34/SPEC_DIVA_v1.2.md` (v1.2.1 consolidée), `units/diva/internal/mistral/client.go`, `ZeDocs/web33/RAPPORT_MOA_laplatine2026_COMPLET_2026-03-01.md`.*
