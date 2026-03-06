# Avis sur la SPEC DIVA v1.2 — Amendements et questions pour implémentation

**Date :** 2026-03-01  
**Référence :** SPEC_DIVA_v1.2.md, AVIS_EXPERT_STRATEGIE_DIVA_FACTS_PACK_2026-03-01.md  
**Objet :** Analyse croisée en vue d'une implémentation

---

## 1. Synthèse

La SPEC v1.2 est **globalement alignée** avec l'avis d'expert et l'existant. Les amendements proposés portent sur des points de détail (format, API, compatibilité). Les questions visent à lever les ambiguïtés avant le développement.

| Section SPEC | Verdict | Action |
|--------------|---------|--------|
| §1–2 Vision, architecture | ✅ Conforme | Aucune |
| §3 Facts Engine | ✅ Conforme | Amendement mineur (DataCompleteness) |
| §4 Payload Mistral | ⚠️ À préciser | Amendements + questions |
| §5 System Prompt | ✅ Conforme | Question mode professional |
| §6 Modes de sortie | ✅ Conforme | Question sélection du mode |
| §7 Ajustements techniques | ✅ Conforme | Question hash/idempotence |
| §8 Mode dégradé | ⚠️ À préciser | Amendement (mapping FactsPack → Flash) |
| §9–11 KPIs, roadmap | ✅ Conforme | — |

---

## 2. Amendements proposés

### 2.1 §3.2 — Structure FactsPack : DataCompleteness

**Spéc actuelle :** `DataCompleteness string`

**Amendement :** Conserver le format objet pour compatibilité avec Linky et les règles métier (règle 12 du prompt actuel) :

```go
type FactsPack struct {
    Mode             string
    Context          ContextMeta
    Facts            []Fact
    DataCompleteness *DataCompleteness  // pas string
}

type DataCompleteness struct {
    BankHealthMetrics string  // "absent" | "partial" | "complete"
}
```

**Justification :** Le code actuel et le prompt utilisent `data_completeness.bank_health_metrics`. Une évolution future pourrait ajouter d'autres champs (ex. `pos_metrics`).

---

### 2.2 §4 — Payload Mistral : format data_completeness

**Spéc actuelle :** `"data_completeness": "complete"`

**Amendement :** Utiliser l'objet :

```json
{
  "mode": "short",
  "facts": [...],
  "data_completeness": {
    "bank_health_metrics": "complete"
  }
}
```

**Justification :** Cohérence avec le system prompt (règle 12 actuelle) et extensibilité.

---

### 2.3 §4 — Distinction mode contexte / mode sortie

**Spéc actuelle :** Un seul champ `"mode": "short"`.

**Amendement :** Préciser la sémantique :

| Champ | Rôle | Valeurs |
|-------|------|---------|
| `output_mode` | Style de sortie LLM | `short` \| `professional` \| `deep` |
| `context_scope` | Périmètre (optionnel, pour log) | `cockpit` \| `card` |

Le payload minimal peut n'avoir que `output_mode` ; `context_scope` sert au logging si besoin.

---

### 2.4 §8 — Mode dégradé : mapping FactsPack → Flash

**Spéc actuelle :** « degradedFlash() devient fallback officiel basé sur FactsPack » — sans détail.

**Amendement :** Ajouter le mapping explicite :

```
1. headline = premier fait avec "POINT DOMINANT:" (sans le préfixe), sinon Facts[0].Message
2. what_i_see = Facts[1:min(4, len)] (max 3 en mode short)
3. to_check = Facts dont Category == "governance" et Message contient "alerte" ou "conformité" ou "absence" (max 2)
4. confidence = computeConfidence(cards) — nécessite accès aux cartes pour les keyCards
```

**Point d'attention :** `computeConfidence(cards)` utilise aujourd'hui les cartes. En mode dégradé pur FactsPack, deux options :
- **A)** Conserver les cartes en entrée de degradedFlash (elles restent disponibles depuis le Dashboard)
- **B)** Déduire la confidence depuis les Facts (ex. présence d'alertes → low)

**Recommandation :** Option A pour ne pas changer la sémantique actuelle.

---

### 2.5 §7.3 — Clé de cache et idempotence

**Spéc actuelle :** `tenant + date_range + hash(FactsPack)`

**Amendement :** Préciser la compatibilité avec `diva_insights` :

- `context_key` : inchangé (déjà `cockpit:tenant:company_id:date_start:date_end`)
- `payload_hash` : dérivé du FactsPack canonique (ou du hash_input incluant la représentation FactsPack)

Le `hash_input` actuel (v3) contient context + cards + pos_aggregates + ar_aggregates. Le FactsPack en est une transformation déterministe. Donc :

- Soit `payload_hash = SHA256(canonical_json(FactsPack))`
- Soit on conserve le hash_input actuel et on ajoute que FactsPack est une vue dérivée (même entrée → même hash)

**Recommandation :** `payload_hash = SHA256(canonical_json(FactsPack))` pour que deux générations avec le même FactsPack soient idempotentes, même si la structure interne a évolué.

---

## 3. Questions pour implémentation

### Q1. Sélection du mode (short / professional / deep)

**Question :** Comment le client (Linky, diva-runner) choisit-il le mode ?

**Options :**
- **A)** Paramètre de requête : `POST /diva/generate` avec `options.output_mode: "short"` (défaut)
- **B)** diva-runner utilise toujours `short` ; `output_mode` uniquement pour explain/generate manuel
- **C)** Header ou query param : `X-DIVA-Output-Mode: short`

**Recommandation :** A — ajouter `output_mode` dans `Options` du body (rétrocompatible si défaut = `short`).

---

### Q2. Mode card (focus card)

**Question :** La SPEC ne mentionne pas le mode `card` (analyse ciblée sur une carte : cash, business, etc.). Faut-il :

- **A)** Le conserver en v1.2 : FactsPack peut avoir un `focus_card` et des facts filtrés
- **B)** Le déprécier en v1.2 et ne traiter que le cockpit
- **C)** Le traiter en phase 2

**Recommandation :** A — le mode card existe dans le code et peut être supporté par un FactsPack filtré (même moteur, sous-ensemble de facts).

---

### Q3. System prompt selon le mode

**Question :** Le system prompt doit-il varier selon `output_mode` ?

- **Short :** « Maximum 3 points dans what_i_see » (déjà dans la SPEC)
- **Professional :** « 4–5 points » ?
- **Deep :** « Synthèse étendue » ?

**Recommandation :** Oui — adapter l'instruction (et éventuellement une phrase du prompt) selon le mode. Ex. : `instruction_short`, `instruction_professional`, `instruction_deep`.

---

### Q4. Ordre des facts et priorité

**Question :** La SPEC indique « Tri strict par priorité ». Quelle échelle ?

- **Suggestion :** 1 = gouvernance critique, 2 = trésorerie/dominant, 3 = inducteurs (taxes, POS, AR), 4 = complémentaire.
- Les facts avec `Category == "governance"` et `Priority == 1` en premier.

---

### Q5. Mode professional — déclenchement UX

**Question :** Dans Linky, comment l'utilisateur demande-t-il une analyse « professionnelle » ?

- Bouton « Voir l'analyse détaillée » ?
- C'est le mode par défaut au clic sur « Rafraîchir » ?
- Réservé à un usage futur (export PDF) ?

**Recommandation :** Préciser dans la SPEC ou dans un doc UX Linky. Pour la v1.2, le mode `short` peut être le seul exposé dans le cockpit ; `professional` reste disponible via l'API pour des usages avancés.

---

### Q6. KPI « Timeouts < 2 % »

**Question :** Sur quelle base est calculé le 2 % ?

- Par requête (sur N requêtes, < 2 % déclenchent degradedFlash) ?
- Par fenêtre temporelle (ex. par jour) ?
- Par tenant ?

**Recommandation :** Préciser : « < 2 % des requêtes GET /diva/insights retournent state=failed avec error_code=timeout sur une fenêtre glissante de 24 h ».

---

## 4. Points de vigilance implémentation

| Point | Action |
|-------|--------|
| **Extraction computeInsights** | Vérifier que toutes les règles métier (POS, AR, gouvernance, règle 16/17) sont migrées dans le module facts |
| **Tests régression** | Conserver les tests `TestDegradedFlash_*` et les adapter à FactsPack |
| **Compatibilité API** | Aucun changement du contrat ExplainRequest/ExplainResponse — transformation interne uniquement |
| **diva-runner** | Passer explicitement `output_mode: "short"` dans les appels POST /diva/generate |

---

## 5. Checklist avant développement

- [ ] Valider les amendements §2.1 à §2.5
- [ ] Répondre aux questions Q1–Q6
- [ ] Mettre à jour la SPEC avec les amendements retenus
- [ ] Créer un ticket ou une tâche par phase de la roadmap (§10)

---

## 6. Conclusion

La SPEC DIVA v1.2 est **prête pour l'implémentation** après intégration des amendements proposés et clarification des questions. Les changements sont de portée limitée et n'impactent pas le contrat API exposé à Linky.

---

*Document généré le 2026-03-01.*
