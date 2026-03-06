# Avis expert — SPEC DIVA Cockpit « Trésorerie + Inducteurs + Discipline » v1.0

**Date :** 2026-02-22  
**Référence :** ZeDocs/web29/SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md  
**Contexte :** Revue pour alignement avec l'existant implémenté et identification des écarts  
**Cible :** Génération d'insight cockpit DIVA (mode Cockpit only)

---

## 1. Synthèse

La SPEC est **claire et bien structurée**. Elle formalise une évolution vers un discours Trésorerie-first avec axe discipline, alignée avec des parties déjà présentes dans le code (règle 8 du system prompt, insights pré-calculés). Des **écarts de contrat**, des **gaps de données** et des **clarifications** sont à traiter avant implémentation.

| Thème | Avis | Priorité |
|-------|------|----------|
| **Pivot bank_health** | 🎯 **Critique** — Sans `unreconciled_lines_count`, `last_statement_import_date`, `journals_count`, `oldest_unreconciled_date`, l'axe discipline est bancal | **Blocante** |
| Étendre dashboard-metrics | ✅ Prioritaire v1.1 — la structure doit exister même si `data_completeness = "absent"` au début | **Haute** |
| Schéma JSON output | ✅ Ne pas toucher — DivaFlashBlock dépend de `headline`, `what_i_see`, `to_check`, `confidence` → règles de **contenu**, pas structurelles | — |
| Objectif Trésorerie-first | ✅ Déjà en partie implémenté (règle 8) | — |
| Score heuristique inducteurs | ⚠️ Non critique — report v1.2 | Moyenne |
| Règle POS scellé | ✅ Partiellement couverte (règle 10) | Faible |

---

## 2. Mapping structure de sortie (§2) vs implémentation

### 2.1 Existant

Le output DIVA actuel est :

```json
{
  "headline": "...",
  "what_i_see": ["...", "...", "..."],
  "to_check": ["...", "..."],
  "confidence": "low|medium|high"
}
```

### 2.2 SPEC

La SPEC impose 3 blocs :

1. **POINT DOMINANT** — 1 phrase  
2. **INDUCTEURS** — 2 à 4 puces  
3. **AUTRES CARTES** — 1 ligne de statuts synthétiques

### 2.3 Alignement proposé

| Bloc SPEC | Champ JSON | Commentaire |
|-----------|------------|-------------|
| POINT DOMINANT | `headline` | ✅ Équivalent |
| INDUCTEURS | `what_i_see` (ou sous-ensemble) | À préciser : les 2–4 premières phrases = inducteurs, le reste = autres |
| AUTRES CARTES | Nouveau champ ou dernière phrase de `what_i_see` | Non présent aujourd'hui |

**Décision :** Ne pas toucher au schéma JSON. DivaFlashBlock dépend déjà de `headline`, `what_i_see`, `to_check`, `confidence`. Modifier la structure = dette inutile.

**Règles de contenu** (pas de règles structurelles) :
- `headline` = POINT DOMINANT (1 phrase)
- `what_i_see` = INDUCTEURS (2–4 phrases) + dernière ligne = synthèse AUTRES CARTES (ex. « Business OK • Taxes watch • POS scellé ✓ »)

---

## 3. Axe discipline (§3) — gap de données

### 3.1 Constat

La SPEC mentionne comme indicateurs de discipline :
- Trésorerie validée %
- **Lignes à rapprocher**
- **Dernier relevé importé**
- Z de caisse
- Données absentes

### 3.2 Flux actuel

- **Linky dashboard-metrics** : appelle `/ui/aggregations/treasury` (Vault) — pas `bank-reconciliation-health`
- **Données treasury dans `_details`** : `reconciled`, `unreconciled`, `total`, `currency`
- **Pas exposé à DIVA** : `unreconciled_lines_count`, `oldest_unreconciled_date`, `last_statement_import_date`, `journals_count`

Ces métriques existent côté **TreasuryCard** (qui appelle `/api/treasury` → treasury + bank-reconciliation-health) mais ne sont pas transmises à dashboard-metrics ni à DIVA.

### 3.3 Amendement proposé

Pour que DIVA reçoive les métriques de discipline :

1. **Option A** : Étendre `dashboard-metrics` pour appeler `bank-reconciliation-health` en plus de `treasury`, et enrichir `_details.treasury` avec :
   - `unreconciled_lines_count`
   - `oldest_unreconciled_date`
   - `last_statement_import_date`
   - `journals_count`

2. **Option B** : Créer un bloc `_details.bank_health` avec ces champs.

3. **data_completeness** : Définir `bank_health_metrics: "absent"` si l’appel échoue ou si Odoo n’est pas configuré ; `"partial"` ou `"complete"` selon les champs présents.

**Pivot critique :** Sans ces 4 champs (`unreconciled_lines_count`, `last_statement_import_date`, `journals_count`, `oldest_unreconciled_date`), l'axe discipline est bancal. Le point critique n'est pas le scoring — c'est les données bank_health.

**Décision :** Étendre dashboard-metrics est prioritaire en v1.1. Même si `data_completeness = "absent"` au début (Odoo non configuré, erreur, etc.), la **structure** (bloc bank_health dans le payload, `data_completeness` présent) doit exister.


---

## 4. Contrat de contexte IA (§7) — écarts

### 4.1 Payload SPEC

```json
{
  "treasury": { ... },
  "cards": [...],
  "top_inductors": [...],
  "other_cards_status": [...],
  "data_completeness": { "bank_health_metrics": "absent" }
}
```

### 4.2 Payload actuel (buildUserPrompt)

- `mode`, `context`, `cards`, `insights` (pré-calculés)
- `details` (en mode focus card uniquement)
- Pas de `top_inductors` ni `other_cards_status` explicites
- Pas de `data_completeness`

### 4.3 Recommandation

- **top_inductors** : Si implémentation du score heuristique (§4.2), calculer côté DIVA avant l’appel Mistral et injecter dans le prompt. Ou laisser Mistral déduire à partir des insights (comportement actuel).
- **other_cards_status** : Dérivable à partir de `cards[].status` et `cards[].status_reason`. Peut être pré-calculé et injecté.
- **data_completeness** : À calculer côté Linky (dashboard-metrics) et transmettre dans le payload vers DIVA.

---

## 5. Score heuristique (§4.2) — terminologie et implémentation

### 5.1 Terminologie

La SPEC utilise **WARNING / CRITIQUE**. L’existant utilise **watch / alert**.

**Recommandation :** Aligner la SPEC sur le vocabulaire du code : `watch` (équivalent WARNING), `alert` (équivalent CRITIQUE). Ou documenter la correspondance.

### 5.2 Multiplicateurs

Les multiplicateurs proposés (×1.5 statut, ×1.2 Taxes, ×1.2 AR, ×1.1 POS scellé, ×0.8 valeur=0) ne sont pas implémentés. Aujourd’hui, la sélection des insights est déterministe mais sans scoring.

**Question :** Le score doit-il vraiment piloter une sélection des inducteurs (2–4 max), ou les insights pré-calculés suffisent-ils ? Actuellement, `computeInsights` produit une liste fixe, tronquée à 10. Une logique de scoring permettrait de prioriser.

**Recommandation :** Pour v1.1, documenter que la sélection des inducteurs reste pilotée par les insights pré-calculés. Le scoring heuristique peut être reporté en v1.2.

---

## 6. AR / AP (§4.2)

La SPEC mentionne « ×1.2 AR / AP ». Le cockpit actuel expose :
- **AR** (ar_by_partner) — encours clients
- **AP** (comptes fournisseurs) — non présent dans les cartes cockpit

**Recommandation :** Préciser que le multiplicateur AR s’applique ; AP sera applicable si une carte AP est ajoutée ultérieurement.

---

## 7. Règle POS (§5)

La règle « POS scellé et non nul → apparaître dans INDUCTEURS ou AUTRES CARTES avec "POS scellé ✓" » est proche de la règle 10 du system prompt (POS comme inducteur, sessions non scellées en to_check).

**Recommandation :** Ajouter au system prompt une instruction explicite : si POS > 0 et 100 % scellé, inclure « POS scellé ✓ » dans la synthèse (headline ou what_i_see).

---

## 8. Gestion données absentes (§6)

La section `data_completeness.bank_health_metrics` est cohérente avec le besoin.

**Définition proposée :**

| Valeur | Condition |
|--------|-----------|
| `absent` | Aucun appel bank-reconciliation-health ou échec |
| `partial` | Réponse partielle (ex. uniquement unreconciled_entries, sans dates) |
| `complete` | unreconciled_entries, last_statement_date, et optionnellement oldest_unreconciled_date présents |

**Règle prompt :** Si `absent`, DIVA doit indiquer : « Données de rapprochement bancaire non disponibles » (ou formulation équivalente) sans extrapolation.

---

## 9. Questions pour le métier

1. **Structure output** : Préférer garder le format actuel (headline, what_i_see, to_check) avec des règles de contenu, ou faire évoluer le schéma JSON (ex. blocs dédiés INDUCTEURS / AUTRES CARTES) ?
2. **Longueur** : « ~10 lignes visibles » — correspond-il à ce qui est attendu côté UI (DivaFlashBlock) ? À valider avec le design.
3. **Priorité bank_health** : Étendre dashboard-metrics pour appeler bank-reconciliation-health est-il prioritaire pour la v1.1, ou peut-on démarrer avec `data_completeness: "absent"` et enrichir plus tard ?
4. **Z de caisse** : La carte pos_z existe mais est souvent vide. Quelle place doit avoir « Z de caisse » dans l’axe discipline (toujours mentionné si absent, ou seulement si valeur significative) ?

---

## 10. Résumé des amendements proposés

| § | Amendement | Priorité |
|---|------------|----------|
| 2 | Documenter le mapping POINT DOMINANT / INDUCTEURS / AUTRES CARTES → champs JSON (headline, what_i_see, etc.) | **Haute** |
| 3 | Préciser la dépendance aux métriques bank_health (lignes, dernier relevé) et le besoin d’étendre dashboard-metrics | **Haute** |
| 6–7 | Définir les conditions exactes de data_completeness (absent / partial / complete) | **Haute** |
| 4.2 | Aligner WARNING/CRITIQUE avec watch/alert ; acter le report du scoring heuristique en v1.2 | Moyenne |
| 4.2 | Clarifier AR vs AP (AP absent du cockpit) | Faible |
| 5 | Renforcer la règle POS scellé dans le system prompt | Faible |

---

## 11. Conclusion

La SPEC est solide et va dans le bon sens. L’existant couvre déjà une part importante (trésorerie-first, inducteurs, statuts, POS). Les principaux chantiers sont :

1. **Données** : Enrichir le flux dashboard-metrics → DIVA avec les métriques bank_health pour activer l’axe discipline.
2. **Contrat** : Formaliser le mapping structure de sortie et le format de `data_completeness`.
3. **Évolution** : Le scoring heuristique peut venir en v1.2 ; les règles de prompt suffisent pour v1.1.

**Recommandation :** Valider les amendements liés au flux de données (bank_health) et au mapping de sortie, puis lancer l’implémentation. La v1.1 peut démarrer avec `bank_health_metrics: "absent"` si l’extension dashboard-metrics est différée.

---

## 13. Plan de mise en œuvre


### Étape 1 — v1.1

| Action | Détail |
|--------|--------|
| **Pivot bank_health** | Étendre dashboard-metrics — appeler `bank-reconciliation-health` en plus de `treasury` |
| | Métriques requises : `unreconciled_lines_count`, `last_statement_import_date`, `journals_count`, `oldest_unreconciled_date` |
| | Structure obligatoire dès v1.1, même si `data_completeness = "absent"` au début |
| **data_completeness.bank_health_metrics** | Ajouter au payload transmis à DIVA ; valeurs : `absent` / `partial` / `complete` |
| **System prompt** | Règles de **contenu** (pas de changement de schéma JSON) : |
| | • **Bloc 1** = `headline` → Point dominant trésorerie (1 phrase) |
| | • **Bloc 2** = 2–4 inducteurs dans `what_i_see` |
| | • **Dernière ligne de `what_i_see`** = synthèse autres cartes (ex. « Business OK • Taxes watch • POS scellé ✓ ») |
| | • Si `data_completeness.bank_health_metrics = "absent"` → mentionner « Données de rapprochement non disponibles » |
| | • **Z de caisse** : null/— → mention si POS actif ; incohérent → inducteur ; sinon ignorer |
| | • **Règle 16** : Si Trésorerie = 0 % ET flux opérationnels présents (Business, POS, Cash) → signaler incohérence discipline financière (angle gouvernance) |

**Schéma JSON inchangé** — DivaFlashBlock dépend de headline, what_i_see, to_check, confidence. Pas de dette.

---

### Étape 2 — v1.2 (à l'arrivée de DLP)

Formalisation du schéma gouvernance native :

| Champ | Rôle |
|-------|------|
| `inductors[]` | Inducteurs prioritaires (2–4 max), avec score éventuel |
| `governance_flags[]` | Drapeaux de gouvernance (discipline, conformité, etc.) |
| `other_cards[]` | Statuts synthétiques des cartes hors inducteurs |
| `decision_candidates[]` | Pistes de décision / actions suggérées |

→ Passage à un modèle **gouvernance native** piloté par structure de données explicite.

---

*Fin du document*
