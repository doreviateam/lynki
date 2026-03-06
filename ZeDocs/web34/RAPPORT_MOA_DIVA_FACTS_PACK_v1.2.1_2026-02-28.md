# Rapport MOA — DIVA Facts Pack v1.2.1

**Date :** 28 février 2026  
**Destinataire :** Maîtrise d'Ouvrage Dorevia  
**Référence :** Plan Scrum `PLAN_IMPLEMENTATION_DIVA_FACTS_PACK_v1.2.1_SCRUM.md`  
**Statut :** Sprints 1, 2 et 3 terminés — Validation finale à venir

---

## 1. Synthèse exécutive

Le projet **DIVA Facts Pack v1.2.1** vise à améliorer la performance et la fiabilité du cockpit financier DIVA en séparant clairement l’**analyse déterministe** (effectuée par le code) de la **rédaction** (effectuée par le LLM Mistral).

**Principe directeur :** *Faire analyser par le code. Faire rédiger par le LLM.*

| Indicateur | Cible | Statut |
|------------|-------|--------|
| Réduction latence | −30 % | Post-déploiement |
| Réduction timeouts | < 2 % sur 24 h | Post-déploiement |
| Réduction tokens | −30 à −50 % | ✅ En place (payload compact) |
| Sprint 1 (Facts Engine) | Livré | ✅ Terminé |
| Sprint 2 (Payload LLM, cache) | Livré | ✅ Terminé |
| Sprint 3 (Mode dégradé, runner) | Livré | ✅ Terminé |
| **Livraison code** | — | ✅ **Complète** |

---

## 2. Contexte et objectifs

### 2.1 Problématique actuelle

DIVA v1.1 repose sur une analyse partiellement effectuée par le LLM. Cette approche génère :

- Latence élevée (inférence CPU locale)
- Timeouts occasionnels
- Prompt volumineux (cartes + règles + insights)
- Dépendance forte à la génération longue

### 2.2 Objectifs du projet

| Objectif | Bénéfice attendu |
|---------|-------------------|
| **Séparation analyse / rédaction** | Code = vérité ; LLM = style |
| **Réduction des tokens** | Prompt plus court, coût et latence réduits |
| **Stabilité** | Moins d’hallucinations, output plus prévisible |
| **Résilience** | Mode dégradé sans LLM en cas de timeout |
| **Indépendance modèle** | DIVA moins dépendante du modèle Mistral |

---

## 3. Architecture cible

```
Vault (vérité financière) → Linky (dashboard) → DIVA Facts Engine → Mistral (rédacteur)
```

| Composant | Rôle |
|-----------|------|
| **Vault** | Vérité financière scellée |
| **DIVA Facts Engine** | Analyse déterministe (nouveau module) |
| **Mistral** | Reformulation stylistique uniquement |
| **degradedFlash** | Fallback sans LLM en cas d’erreur |

**Contrat API Linky :** aucun changement prévu. L’évolution est transparente pour les utilisateurs.

---

## 4. Avancement — Sprint 1 terminé

### 4.1 Livrables Sprint 1

| Livrable | Statut | Détail |
|----------|--------|--------|
| Module `internal/facts/` | ✅ | `types.go`, `engine.go`, `priority.go`, `normalize.go` |
| FactsPack structuré | ✅ | Version 1.2.1, 10 faits max, tri figé |
| Intégration client Mistral | ✅ | `computeInsights` remplacé par `BuildFactsPack` |
| Tests | ✅ | Aucune régression, tous les tests passent |

### 4.2 Décisions techniques validées

| Décision | Justification |
|----------|---------------|
| **10 faits max** | Simplicité, stabilité, degradedFlash prévisible |
| **Priorité treasury** | Pour un CFO, la trésorerie domine la narration |
| **Tri figé** | Priority → CategoryRank → Message (ordre stable) |
| **Version 1.2.1** | Traçabilité des hashes, « GitHub financier » |

### 4.3 Règles métier couvertes

- Règle 16/17 : trésorerie 0 % + flux opérationnels
- Position nette post-taxes
- Inducteur fiscal
- Écart trésorerie / activité
- Remboursements, POS (sessions, panier, mix, conformité, répartition)
- AR à risque
- Gouvernance (alertes, points d’attention)

---

## 5. Avancement — Sprint 2 terminé

### 5.1 Livrables Sprint 2

| Livrable | Statut | Détail |
|----------|--------|--------|
| CanonicalJSON + PayloadHash | ✅ | `facts/canonical.go`, hash déterministe SHA256 |
| Payload Facts Pack uniquement | ✅ | Envoi facts + data_completeness, sans cartes |
| System prompt consolidé | ✅ | Prompt court SPEC §5, reformulation uniquement |
| Modes short / professional / deep | ✅ | max_tokens 250 / 500 / 1024 |
| Cache idempotence | ✅ | payload_hash dérivé du FactsPack canonique |
| Tests critiques | ✅ | HashStable, SortingDeterministic, VersionAffectsHash |

### 5.2 Impact technique

- **Options.OutputMode** : nouveau paramètre (défaut `"short"`)
- **Chat()** : accepte FactsPack en entrée pour cockpit
- **Handlers** : build FactsPack, payload_hash = facts.PayloadHash(fp)

---

## 6. Avancement — Sprint 3 terminé

### 6.1 Livrables Sprint 3

| Livrable | Statut | Détail |
|----------|--------|--------|
| DegradedFlashFromFactsPack | ✅ | Synthèse sans LLM à partir du FactsPack |
| degradedFlashForCockpit | ✅ | Utilise FactsPack quand disponible |
| diva-runner output_mode | ✅ | `output_mode: "short"` dans les appels generate |
| Tests | ✅ | TestDegradedFlashFromFactsPack, régression OK |

---

## 7. Gains attendus (post-déploiement)

| Gain | Cible |
|------|-------|
| Tokens | −30 à −50 % |
| Latence | −30 % |
| Timeouts | Quasi inexistants |
| Output | Plus stable, moins d’hallucination |
| Multi-tenant | Moins de variabilité |

**Point stratégique :** DIVA devient plus indépendante du modèle. C’est un move de plateforme, pas seulement une optimisation Mistral.

---

## 8. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Régression qualité formulation | Mode professional conservé ; A/B test si besoin |
| FactsPack incomplet | Revue exhaustive des règles avant extraction (effectuée) |
| Mode card (focus carte) | Hors périmètre v1.2.1 ; traiter en v1.3 si nécessaire |

**Dépendances externes :** Mistral opérationnel, Linky dashboard-metrics inchangé.

---

## 9. Conclusion et prochaines étapes

**Livraison :** L’implémentation DIVA Facts Pack v1.2.1 est **complète**. Les trois sprints ont été livrés. Tous les tests passent, aucune régression identifiée.

**Prochaines étapes :**
1. **Validation finale** : Mesure de la latence, des timeouts et du format de réponse en production.
2. **Déploiement** : Mise en production et suivi des KPIs (−30 % latence, < 2 % timeouts).

---

## 10. Références

| Document | Chemin |
|----------|--------|
| Plan Scrum | `ZeDocs/web34/PLAN_IMPLEMENTATION_DIVA_FACTS_PACK_v1.2.1_SCRUM.md` |
| SPEC DIVA v1.2 | `ZeDocs/web34/SPEC_DIVA_v1.2.md` |
| Avis expert Facts Pack | `ZeDocs/web34/AVIS_EXPERT_STRATEGIE_DIVA_FACTS_PACK_2026-03-01.md` |

---

*Rapport mis à jour le 28 février 2026 — Dorevia Architecture*
