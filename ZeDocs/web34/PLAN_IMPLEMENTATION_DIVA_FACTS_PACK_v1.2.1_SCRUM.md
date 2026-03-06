# Plan d'implémentation Scrum — DIVA Facts Pack v1.2.1

**Date :** 2026-03-01  
**Référence :** `ZeDocs/web34/SPEC_DIVA_v1.2.md` (v1.2.1 consolidée), `AVIS_EXPERT_STRATEGIE_DIVA_FACTS_PACK_2026-03-01.md`  
**Durée estimée :** 3 sprints (~3 jours)  
**Stack :** DIVA (Go), Mistral (llama.cpp), Linky (Next.js)

---

## 0. Vue d'ensemble

| Sprint | Périmètre | Estimation | Livrable | Dépendance |
|--------|-----------|------------|----------|-------------|
| **Sprint 1** | Facts Engine — extraction et structuration | 1 j | Module `internal/facts/`, FactsPack opérationnel | — |
| **Sprint 2** | Payload LLM — simplification prompt et modes | 1 j | Prompt consolidé, max_tokens dynamique, cache FactsPack | Sprint 1 |
| **Sprint 3** | Mode dégradé, intégration, tests | 1 j | degradedFlash(FactsPack), diva-runner short, validation KPIs | Sprint 2 |

**Principe :** Vérité → Vault | Analyse → Code (Facts Engine) | Style → LLM. Aucun changement de contrat API Linky.

**Definition of Done globale :** Code review, tests passent, pas de régression sur le flux cockpit existant. Latence cible −30 %, timeouts < 2 % sur 24 h.

---

## Sprint 1 — Facts Engine

**Objectif :** Extraire la logique d'analyse déterministe dans un module dédié et produire un FactsPack structuré.

### User Story 1.1 — Module facts

> En tant que DIVA, je dispose d'un module `internal/facts/` qui calcule les faits financiers à partir des cartes et détails du dashboard.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 1.1.1 | Créer `units/diva/internal/facts/` avec `types.go` : FactsPack (incl. **Version: "1.2.1"**), Fact, DataCompleteness, ContextMeta | `internal/facts/types.go` | 0,1 j |
| 1.1.2 | Définir échelle de priorité — **à trancher consciemment** : Option A (treasury 1) ou B (governance 1), cf. §6.2 | `internal/facts/priority.go` ou doc | 0,1 j |
| 1.1.3 | Extraire `computeInsights()` de `mistral/client.go` vers `internal/facts/engine.go` | `internal/facts/engine.go` | 0,4 j |
| 1.1.4 | Adapter la sortie : produire `[]Fact` avec Priority, Category, Message au lieu de `[]string` | `internal/facts/engine.go` | 0,3 j |
| 1.1.5 | Contrainte : **10 faits max**. Tri **figé** : `Priority asc` → `CategoryRank(category)` (table explicite, pas lexico — sinon "ar" remonte avant "governance") → `NormalizeMessage(Message)` lexico. **Un seul endroit** : `facts.SortFacts()` appelé par BuildFactsPack | `internal/facts/engine.go` | 0,1 j |
| 1.1.5a | `CategoryRank(category) int` : table explicite governance=0, treasury=1, tax=2, pos=3, ar=4 (figé en code + doc) | `internal/facts/priority.go` | 0,1 j |
| 1.1.5b | `NormalizeMessage(msg) string` : trim, collapse spaces — stabilité (espaces doubles, accents, € vs EUR, ponctuation) | `internal/facts/` | 0,1 j |
| 1.1.6 | Migrer extractPosDetails, extractARDetails et helpers (toInt, toFloat, fmtEUR, etc.) | `internal/facts/` | 0,2 j |

**Critères d'acceptation :**
- [ ] `BuildFactsPack(cards, details, dataCompleteness) → *FactsPack` retourne un FactsPack trié (Priority → Category → Message)
- [ ] FactsPack.Version = "1.2.1" (comparer hashes v1 vs v2, rejouer historiquement)
- [ ] Chaque Fact a Priority, Category (governance|treasury|tax|pos|ar), Message
- [ ] Couverture des règles métier actuelles (règle 16, 17, POS, AR, gouvernance)
- [ ] Tests unitaires : cas La Platine, Sweet Manihot, empty

**DoD Sprint 1 :**
- [ ] Module facts compilable, sans import circulaire
- [ ] mistral/client.go appelle `facts.BuildFactsPack()` (transition douce : garder computeInsights en wrapper si besoin)
- [ ] Aucune régression sur les tests existants (TestDegradedFlash, etc.)

---

## Sprint 2 — Payload LLM et modes

**Objectif :** Simplifier le payload envoyé à Mistral, réduire le system prompt, implémenter les modes short/professional/deep.

### User Story 2.1 — Payload Facts Pack uniquement

> En tant que DIVA, j'envoie à Mistral uniquement un payload compact (output_mode, facts, data_completeness) sans les cartes brutes.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.1.1 | Créer `buildUserPromptFromFactsPack(fp *FactsPack, outputMode string) string` | `internal/mistral/client.go` | 0,2 j |
| 2.1.2 | Payload JSON : output_mode, facts (messages uniquement), data_completeness { bank_health_metrics } | — | 0,1 j |
| 2.1.3 | Supprimer l'envoi des cards dans le payload Mistral | `buildUserPrompt` | 0,2 j |
| 2.1.4 | Adapter Chat() : accepter FactsPack en entrée, construire prompt depuis FactsPack | `internal/mistral/client.go` | 0,2 j |

### User Story 2.2 — System prompt consolidé

> En tant que DIVA, le system prompt est court et orienté « reformulation » (pas « analyse »).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.2.1 | Remplacer le system prompt actuel (règles 1–17) par la version consolidée SPEC §5 | `internal/mistral/client.go` | 0,2 j |
| 2.2.2 | Instruction dynamique selon output_mode (short : « max 3 points », professional : « 4–5 points », deep : « synthèse étendue ») | — | 0,1 j |
| 2.2.3 | Règles : français uniquement, aucun calcul, aucun conseil, utiliser UNIQUEMENT les faits fournis | — | — |

### User Story 2.3 — Modes et max_tokens dynamique

> En tant que DIVA, j'adapte max_tokens selon output_mode (short=250, professional=500, deep=1024).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.3.1 | Ajouter `output_mode` dans Options (ExplainRequest, Generate) ; défaut = "short" | `internal/models/models.go`, handlers | 0,1 j |
| 2.3.2 | `maxTokens := map[outputMode]int{"short":250, "professional":500, "deep":1024}` | `internal/mistral/client.go` | 0,1 j |
| 2.3.3 | Passer output_mode dans le payload et l'appel Mistral | — | 0,1 j |
| 2.3.4 | **Contrainte mode deep :** manuel uniquement, à la demande. Jamais utilisé par le runner. Coûteux volontairement — sinon perte du gain latence. | — | — |

### User Story 2.4 — Cache et idempotence FactsPack

> En tant que DIVA, le payload_hash est dérivé du FactsPack canonique pour l'idempotence (« GitHub financier »).

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 2.4.1 | Implémenter `CanonicalJSON(fp *FactsPack) []byte` : **type canonique dédié** (pas marshal direct Go). `canonicalFactsPack{Version string; Facts []string; Completeness string}` — pas de maps, pas de float, pas de champs optionnels ambigus. **Ne jamais retrier** : ordre = celui de BuildFactsPack. **Float :** int64 cents + fmtEURFromCents quand possible ; sinon arrondi 2 décimales AVANT canonical | `internal/facts/canonical.go` | 0,3 j |
| 2.4.1a | **Tests critiques :** `TestFactsPackCanonicalHashStable()` ; `TestFactsPackSortingDeterministic()` (même input → même ordre facts) ; `TestFactsPackVersionAffectsHash()` (même contenu, Version change → hash change) | `internal/facts/canonical_test.go` | 0,2 j |
| 2.4.2 | `payload_hash = SHA256(canonicalBytes)` — UTF-8 strict, bytes strict. Pas de pretty print, indentation, locale, encoding implicite | `internal/store/`, handlers | 0,2 j |
| 2.4.3 | Vérifier que context_key reste inchangé (cockpit:tenant:company_id:date_start:date_end) | — | 0,1 j |

**DoD Sprint 2 :**
- [ ] Payload Mistral ne contient plus les cards
- [ ] System prompt < 500 tokens (estimation)
- [ ] max_tokens = 250 pour mode short
- [ ] payload_hash dérivé du FactsPack
- [ ] Tests : même FactsPack → même hash, appel Mistral avec payload court
- [ ] **TestFactsPackCanonicalHashStable** : idempotence hash garantie
- [ ] **TestFactsPackSortingDeterministic** : même input → même ordre facts (pas que le hash)
- [ ] **TestFactsPackVersionAffectsHash** : Version change → hash change (confirme Version dans le canon)

---

## Sprint 3 — Mode dégradé et validation

**Objectif :** Adapter degradedFlash pour utiliser FactsPack, intégrer le diva-runner en mode short, valider les KPIs.

### User Story 3.1 — degradedFlash basé sur FactsPack

> En tant que DIVA, en cas de timeout ou erreur Mistral, je produis une synthèse à partir du FactsPack sans appeler le LLM.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 3.1.1 | Créer `DegradedFlashFromFactsPack(fp *FactsPack, cards []Card) Flash` | `internal/mistral/client.go` ou `internal/facts/` | 0,2 j |
| 3.1.2 | headline = premier fait contenant "POINT DOMINANT:" (sans préfixe), sinon Facts[0].Message | — | 0,1 j |
| 3.1.3 | what_i_see = Facts[1:4] (max 3 éléments) | — | 0,1 j |
| 3.1.4 | to_check = Facts avec Category=="governance" et Message contenant alerte/conformité/absence (max 2) | — | 0,1 j |
| 3.1.5 | confidence = computeConfidence(cards) — conserver les cartes en entrée pour ce calcul | — | 0,1 j |
| 3.1.6 | Remplacer les appels à degradedFlash(cards, details) par DegradedFlashFromFactsPack(fp, cards) | `internal/mistral/client.go` | 0,2 j |

### User Story 3.2 — diva-runner mode short

> En tant que diva-runner, j'utilise output_mode="short" par défaut pour le pré-calcul cockpit.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 3.2.1 | Ajouter `options.output_mode: "short"` dans les appels POST /diva/generate du runner | `internal/runner/diva_client.go` | 0,1 j |
| 3.2.2 | Construire FactsPack depuis le payload dashboard avant l'appel generate | `internal/runner/` | 0,2 j |
| 3.2.3 | Vérifier que le flux discovery → generate utilise le nouveau chemin | — | 0,1 j |

### User Story 3.3 — Tests et validation KPIs

> En tant qu'équipe, je valide qu'il n'y a pas de régression et que les KPIs sont atteints.

| Tâche | Action | Fichier | Estimation |
|-------|--------|---------|------------|
| 3.3.1 | Adapter TestDegradedFlash_* pour utiliser FactsPack | `internal/mistral/client_test.go` | 0,2 j |
| 3.3.2 | Tests BuildFactsPack : cas nominal, empty, POS, AR, gouvernance | `internal/facts/engine_test.go` | 0,2 j |
| 3.3.3 | Test E2E : cockpit laplatine2026, vérifier latence et format réponse | Script ou manuel | 0,2 j |
| 3.3.4 | Documenter métriques : prompt_chars, output_chars, llm_latency_ms (déjà en place) | — | 0,1 j |

**DoD Sprint 3 :**
- [ ] degradedFlash utilise FactsPack, pas computeInsights direct
- [ ] diva-runner envoie output_mode=short (jamais deep — vérifier qu'aucun chemin n'utilise deep)
- [ ] Tous les tests passent
- [ ] Pas de régression sur le format de réponse (headline, what_i_see, to_check)
- [ ] Latence moyenne mesurée (objectif −30 %)
- [ ] Timeouts < 2 % sur 24 h (validation post-déploiement)

---

## 4. Récapitulatif des tâches

| ID | Tâche | Sprint | Estimation |
|----|-------|--------|------------|
| 1.1.1 | Types FactsPack, Fact, DataCompleteness | 1 | 0,1 j |
| 1.1.2 | Échelle priorité | 1 | 0,1 j |
| 1.1.3 | Extraire computeInsights → engine.go | 1 | 0,4 j |
| 1.1.4 | Adapter sortie []Fact | 1 | 0,3 j |
| 1.1.5–1.1.5b | Contrainte 10 faits max, tri figé, CategoryRank, NormalizeMessage | 1 | 0,3 j |
| 1.1.6 | Migrer helpers | 1 | 0,2 j |
| 2.1.1–2.1.4 | Payload Facts Pack uniquement | 2 | 0,7 j |
| 2.2.1–2.2.3 | System prompt consolidé | 2 | 0,3 j |
| 2.3.1–2.3.3 | Modes max_tokens | 2 | 0,3 j |
| 2.4.1–2.4.3 | Cache payload_hash FactsPack + type canonique + 3 tests critiques | 2 | 0,8 j |
| 3.1.1–3.1.6 | degradedFlash FactsPack | 3 | 0,8 j |
| 3.2.1–3.2.3 | diva-runner short | 3 | 0,4 j |
| 3.3.1–3.3.4 | Tests et KPIs | 3 | 0,7 j |

**Total :** ~3 jours.

---

## 5. Risques et dépendances

| Risque | Mitigation |
|--------|------------|
| Régression qualité formulation | Conserver mode professional ; A/B test si besoin |
| FactsPack incomplet | Revue exhaustive des règles computeInsights avant extraction |
| Mode card (focus card) | Hors périmètre v1.2.1 ; traiter en v1.3 si nécessaire |

**Dépendances externes :** Mistral opérationnel, Linky dashboard-metrics inchangé.

---

## 6. Décisions stratégiques (alignement produit)

### 6.1 Décisions techniques

| Décision | Justification |
|----------|---------------|
| **FactsPack.Version** | Champ `Version: "1.2.1"`. Compare hashes v1 vs v2, comprend pourquoi un output change, rejoue historiquement. Ça ne coûte rien. Sécurise le « GitHub financier ». |
| **10 faits max** | Simplicité, moins de variabilité, stabilité LLM, degradedFlash prévisible. La contrainte est un allié. |
| **Tri figé (ordre secondaire)** | `sort by: Priority asc` → `CategoryRank(category)` (table explicite, pas lexico) → `NormalizeMessage(Message)` lexico. Un seul endroit : `facts.SortFacts()`. |
| **CanonicalJSON déterministe** | Tri clés, ordre facts stable. **Float :** arrondi fixe (2 décimales) AVANT canonical, format string stable, jamais de float brut — sinon hash instable dans 6 mois. Critique pour l'idempotence (« GitHub financier »). |
| **TestFactsPackCanonicalHashStable** | Garantit : même entrée → même hash → même JSON. Non négociable. |
| **Mode deep = manuel uniquement** | Jamais utilisé par le runner. À la demande, coûteux volontairement. Sinon perte du gain latence. |

### 6.2 Échelle de priorité — à trancher consciemment

| Option | Hiérarchie | Vision |
|--------|------------|--------|
| **A (recommandé)** | 1 = treasury, 2 = governance, 3 = tax/pos/ar, 4 = complémentaire | Pour un CFO : si la trésorerie est critique, elle domine la narration. |
| **B** | 1 = governance, 2 = treasury, 3 = tax/pos/ar, 4 = complémentaire | Gouvernance (alertes, conformité) prime sur la position trésorerie. |

**Recommandation :** Option A — treasury en priorité 1. La trésorerie est l'indicateur central du cockpit ; les alertes gouvernance s'intègrent dans le récit (to_check, inducteurs).

### 6.3 Les 3 règles d'or d'implémentation

| Règle | Principe | Piège à éviter |
|-------|----------|----------------|
| **Règle 1 — Tri stable partout** | BuildFactsPack produit une liste triée stable. CanonicalJSON **ne retrie jamais** à sa façon. Un seul endroit décide : `facts.SortFacts()` appelé par BuildFactsPack. Tests vérifient l'ordre final exact. | CanonicalJSON qui retrie différemment → hash qui change |
| **Règle 2 — CanonicalJSON = modèle canonique** | Type canonique dédié : `canonicalFactsPack{Version string; Facts []string; Completeness string}`. Pas de maps, pas de float, pas de champs optionnels ambigus. Pas de marshal direct Go (omitempty, ordre maps). | Go marshal n'est pas ton canon |
| **Règle 3 — Hash = SHA256(bytes)** | UTF-8 strict, bytes strict. Pas de dépendance à pretty print, indentation, locale, encoding implicite. | Hash qui fluctue selon l'environnement |

### 6.4 Raffinements techniques

| Raffinement | Implémentation |
|-------------|----------------|
| **Ordre catégories** | Table explicite `categoryRank`: governance=0, treasury=1, tax=2, pos=3, ar=4. Pas lexicographique (sinon "ar" avant "governance"). |
| **NormalizeMessage** | Trim, collapse spaces. Stabilité : espaces doubles, accents, € vs EUR, ponctuation variable. |
| **Floats** | Quand possible : stocker en int64 cents, `fmtEURFromCents(int64)` stable. Élimine la classe d'erreurs float. |

### 6.5 Move stratégique

Ce plan ne fait pas que « optimiser Mistral ». Il découple vérité/style, stabilise le multi-tenant, assure une idempotence propre, rend le pré-calcul runner fiable et réduit la dépendance au modèle. **C'est un move de plateforme.**

---

## 7. Impact produit réel (si exécuté proprement)

| Gain | Cible |
|------|-------|
| Tokens | −30 à −50 % |
| Latence | −30 % |
| Timeouts | Quasi inexistants |
| Output | Plus stable, moins d'hallucination |
| Multi-tenant | Moins de variabilité |

**Mais surtout :** DIVA devient plus indépendante du modèle. Et ça… c'est stratégique.

---

## 8. Validation finale (go/no-go)

Avec : Version, tri figé, deep encadré, floats cadrés, canonical + tests critiques, le plan est **platform-grade** et prêt à lancer.

| Critère | Statut |
|---------|--------|
| FactsPack.Version dans le hash | ✅ |
| Tri figé (Priority → CategoryRank → NormalizeMessage) | ✅ |
| Mode deep = manuel uniquement | ✅ |
| Type canonique dédié (pas marshal direct) | ✅ |
| TestFactsPackCanonicalHashStable | ✅ |
| TestFactsPackSortingDeterministic | ✅ |
| TestFactsPackVersionAffectsHash | ✅ |

**Couverture :** multi-tenant, runner, cache, auditabilité, stabilité long terme.

---

## 9. Références

| Document | Chemin |
|----------|--------|
| SPEC DIVA v1.2.1 | `ZeDocs/web34/SPEC_DIVA_v1.2.md` |
| Avis expert Facts Pack | `ZeDocs/web34/AVIS_EXPERT_STRATEGIE_DIVA_FACTS_PACK_2026-03-01.md` |
| Amendements SPEC | `ZeDocs/web34/AVIS_SPEC_DIVA_v1.2_AMENDEMENTS_2026-03-01.md` |
| Code computeInsights | `units/diva/internal/mistral/client.go` L296–480 |
| Code degradedFlash | `units/diva/internal/mistral/client.go` L999–1038 |

---

*Document généré le 2026-03-01 — Dorevia Architecture*
