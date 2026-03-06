# Plan d'implémentation — DIVA Cockpit « Trésorerie + Inducteurs + Discipline » v1.1

**Version :** 1.1  
**Date :** 2026-02-22  
**Statut :** À faire  
**Référence :** ZeDocs/web29/SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md  
**Avis expert :** ZeDocs/web29/AVIS_EXPERT_SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md  
**Durée estimée :** 1,5–2 jours (Linky + DIVA)  
**Stack :** Linky (Next.js), DIVA (Go/Mistral), Vault (Go)

---

## 1. Vue d'ensemble

| Sprint | Périmètre | Estimation | Livrable |
|--------|-----------|-------------|----------|
| **S1** | dashboard-metrics — bank-reconciliation-health + data_completeness | 2–3 h | Flux enrichi, structure obligatoire |
| **S2** | Linky → DIVA — transmission data_completeness + _details.treasury enrichi | 0,5–1 h | Payload conforme |
| **S3** | DIVA — system prompt + computeInsights (règles contenu) | 2–3 h | Discours Trésorerie-first, axe discipline |
| **S4** | Tests + polish | 1 h | Validation chaîne complète |

**DoD global :** Critères SPEC §8 validés. Schéma JSON output inchangé (headline, what_i_see, to_check, confidence). Pas de dette structurelle.

---

## 2. État actuel vs cible

| Élément | Actuel | Cible (v1.1) |
|---------|--------|---------------|
| dashboard-metrics | Appelle `/ui/aggregations/treasury` uniquement | + appel `/ui/system/bank-reconciliation-health` |
| _details.treasury | reconciled, unreconciled, total, currency | + unreconciled_lines_count, last_statement_import_date, journals_count, oldest_unreconciled_date |
| data_completeness | Absent | `{ bank_health_metrics: "absent" | "partial" | "complete" }` (union TS) |
| Payload DIVA | cards, _details, insights | + data_completeness |
| System prompt | Règles 1–11 génériques | + règles 3 blocs (headline = POINT DOMINANT ; what_i_see = 2–4 inducteurs + dernière ligne = synthèse autres cartes) |
| Règle données absentes | Aucune | Si bank_health_metrics = "absent" → mentionner « Données de rapprochement non disponibles » |
| Règle Z de caisse | Non spécifiée | null/— → mention si POS actif ; incohérent → inducteur ; sinon ignorer |
| Schéma JSON output | headline, what_i_see, to_check, confidence | **Inchangé** — règles de contenu uniquement |

---

## 3. Sprints détaillés

### Sprint 1 — dashboard-metrics : bank-reconciliation-health + data_completeness

**Objectif :** Enrichir le flux pour que DIVA reçoive les métriques de discipline. Structure obligatoire même si `data_completeness = "absent"`.

**Fichier :** `units/dorevia-linky/app/api/dashboard-metrics/route.ts`

| Tâche | Action | Détail |
|-------|--------|--------|
| 1.1 | Appel bank-reconciliation-health | Ajouter `fetchJson("/ui/system/bank-reconciliation-health", treasuryParams)` au Promise.all (mêmes params que treasury) |
| 1.2 | Mapping health → _details.treasury | Enrichir `_details.treasury` avec : `unreconciled_lines_count` ← `unreconciled_entries`, `journals_count` ← `bank_accounts_count`, `last_statement_import_date` ← `last_statement_date`, `oldest_unreconciled_date` (si exposé) |
| 1.3 | Fallback | Si health en erreur ou timeout : champs bank_health à `null`, ne pas bloquer la réponse |
| 1.4 | data_completeness | Calculer selon présence des champs : `absent` si aucun health ou tout null ; `partial` si unreconciled_entries seul ; `complete` si unreconciled_entries + last_statement_date (+ optionnel oldest_unreconciled_date) |
| | | **Nuance importante** : `complete` = données *disponibles*, pas qualité de discipline. Pour la qualité, DIVA regarde `unreconciled_lines_count`, `reconciliation_rate`, `last_statement_import_date`. Disponibilité ≠ qualité. |
| 1.5 | Interface DashboardMetricsResponse | Ajouter `data_completeness?: { bank_health_metrics: "absent" | "partial" | "complete" }` |
| 1.6 | Interface CardDetails.treasury | Étendre avec champs optionnels : `unreconciled_lines_count?: number \| null`, `last_statement_import_date?: string \| null`, `journals_count?: number \| null`, `oldest_unreconciled_date?: string \| null` |

**Critères :** Réponse JSON enrichie. Si health indisponible → `data_completeness.bank_health_metrics = "absent"`, champs bank_health à null. Pas de régression si Vault ne propose pas la route.

**Référence :** `api/treasury/route.ts` fait déjà ce mapping (lignes 70–84).

---

### Sprint 2 — Linky → DIVA : transmission data_completeness + _details enrichi

**Objectif :** Transmettre data_completeness et _details.treasury enrichi au service DIVA.

**Fichiers :** `units/dorevia-linky/app/api/diva/explain/route.ts`, `explain/async/route.ts`, `refresh/route.ts`, `prewarm/route.ts`

| Tâche | Action | Détail |
|-------|--------|--------|
| 2.1 | divaBody | Ajouter `data_completeness: metrics.data_completeness ?? { bank_health_metrics: "absent" }` au payload envoyé à DIVA |
| 2.2 | Vérifier _details | Les _details sont déjà passés via `dashboard: { cards, _details }`. S'assurer que _details.treasury enrichi (Sprint 1) est bien transmis |
| 2.3 | Routes async/refresh/prewarm | Si elles construisent un payload similaire, ajouter data_completeness de manière cohérente |

**Critères :** Payload DIVA contient data_completeness. _details.treasury inclut les champs bank_health quand disponibles.

---

### Sprint 3 — DIVA : system prompt + computeInsights (règles de contenu)

**Objectif :** Mettre à jour le discours sans toucher au schéma JSON. Imposer les règles de contenu pour les 3 blocs.

**Fichier :** `units/diva/internal/mistral/client.go`

| Tâche | Action | Détail |
|-------|--------|--------|
| 3.1 | Règles system prompt | Ajouter après règle 11 : |
| | | **Output rules (strict order)** — à formaliser textuellement dans le prompt : |
| | | 1. **headline** : 1 phrase, trésorerie dominante. |
| | | 2. **what_i_see** : premières 2–4 lignes = inducteurs uniquement ; **dernière ligne** = statut synthétique des autres cartes, séparées par " • " (ex. « Business OK • Taxes watch • POS scellé ✓ »). Ne pas mélanger — si "last line" n'est pas précisé, Mistral confond. |
| | | 3. **to_check** : énoncés vérifiables uniquement. |
| | | Puis règles sémantiques 12–16 : |
| | | 12. Si data_completeness.bank_health_metrics = "absent", mentionner « Données de rapprochement bancaire non disponibles » dans what_i_see ou to_check. Ne pas extrapoler. |
| | | 13. **Z de caisse** : si Z = null ou "—", mentionner uniquement si POS actif. Si Z incohérent, en faire un inducteur. Sinon ignorer. Ne pas polluer le discours. |
| | | 14. Si POS > 0 et 100 % scellé, inclure « POS scellé ✓ » dans la synthèse (headline ou dernière ligne what_i_see). |
| | | 15. **complete ≠ qualité** : data_completeness = "complete" signifie données disponibles, pas discipline bonne. Pour évaluer la discipline : unreconciled_lines_count, reconciliation_rate, last_statement_import_date. Ne pas confondre. |
| | | 16. **Incohérence discipline** : Si Trésorerie = 0 % validée ET flux opérationnels présents (Business, POS ou Cash significatifs), signaler explicitement une incohérence de discipline financière. Angle gouvernance : flux OK + activité OK mais aucune validation bancaire = tension logique à mettre en avant. |
| 3.2 | buildUserPrompt | En mode cockpit, inclure `data_completeness` dans le payload (depuis dashboardDetails) |
| 3.3 | computeInsights | **Faire simple en v1.1** : pas de scoring, pas de top_inductors calculé. Réutiliser les insights pré-calculés existants. Ajouter *uniquement* un insight discipline supplémentaire si conditions réunies (ex. trésorerie 0 % + flux significatifs — déjà partiellement couvert par l'existant). Complexité heuristique → v1.2. Stabilité > sophistication. |

**Critères :** Prompt respecte les 3 blocs. Données absentes clairement indiquées. Z de caisse géré selon règle. Pas de modification du schéma Flash (headline, what_i_see, to_check, confidence).

---

### Sprint 4 — Tests + polish

| Tâche | Action | Détail |
|-------|--------|--------|
| 4.1 | Test dashboard-metrics | Vérifier présence data_completeness et _details.treasury enrichi (mock ou environnement stinger) |
| 4.2 | Test health absent | Couper Odoo ou désactiver route → data_completeness = "absent", pas de crash |
| 4.3 | Test DIVA cockpit | Générer insight avec données complètes vs absentes → discours adapté |
| 4.4 | Régression DivaFlashBlock | Vérifier qu'headline, what_i_see, to_check, confidence sont toujours exploités correctement |

---

## 4. Fichiers impactés

| Fichier | Modifications |
|---------|---------------|
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Appel bank-reconciliation-health, mapping, data_completeness |
| `units/dorevia-linky/app/api/diva/explain/route.ts` | Transmission data_completeness |
| `units/dorevia-linky/app/api/diva/explain/async/route.ts` | Idem si applicable |
| `units/dorevia-linky/app/api/diva/refresh/route.ts` | Idem si applicable |
| `units/dorevia-linky/app/api/diva/prewarm/route.ts` | Idem si applicable |
| `units/diva/internal/mistral/client.go` | system prompt, buildUserPrompt, computeInsights |

---

## 5. Dépendances

| Dépendance | Rôle |
|------------|------|
| **Vault** | Route `GET /ui/system/bank-reconciliation-health` enregistrée (déjà fait pour Trésorerie v1.1) |
| **Odoo** | Endpoint bank-reconciliation exposant unreconciled_entries, last_statement_date, bank_accounts_count, oldest_unreconciled_date |
| **DivaFlashBlock** | Aucune modification — consomme headline, what_i_see, to_check, confidence inchangés |

---

## 6. Tests manuels

| Scénario | Attendu |
|----------|---------|
| bank_health disponible | data_completeness = "complete", _details.treasury enrichi, DIVA mentionne discipline si pertinent |
| bank_health indisponible | data_completeness = "absent", DIVA mentionne « Données de rapprochement non disponibles » |
| Trésorerie 0 % + flux significatifs | DIVA signale un signal de discipline |
| POS scellé + non nul | « POS scellé ✓ » dans synthèse |
| Z null, POS actif | Mention Z si pertinent |
| Z incohérent | Z comme inducteur dans what_i_see |
| Schéma output | headline, what_i_see, to_check, confidence inchangés — pas d'erreur frontend |

---

## 7. Estimation détaillée

| Phase | Durée | Détail |
|-------|-------|--------|
| Sprint 1 (dashboard-metrics) | 2–3 h | Appel health, mapping, data_completeness |
| Sprint 2 (Linky → DIVA) | 0,5–1 h | Transmission payload |
| Sprint 3 (DIVA prompt + insights) | 2–3 h | Règles system prompt, buildUserPrompt, computeInsights |
| Sprint 4 (Tests) | 1 h | Tests manuels, régression |

**Total :** 1,5–2 jours développeur.

---

## 8. Points de vigilance

### 8.1 Double appel Odoo — risque à surveiller

**Contexte des flux :**
- `dashboard-metrics` (Linky) → appelle Vault treasury + Vault bank-reconciliation-health
- `TreasuryCard` → appelle `/api/treasury` (Linky) → appelle Vault treasury + Vault bank-reconciliation-health

**Risque :** Quand le cockpit ET la TreasuryCard sont affichés, on a potentiellement 2 appels à bank-reconciliation-health (un via dashboard-metrics, un via api/treasury). Vérifier qu'on ne crée pas de double appel inutile.

**Pistes :** (a) Partager les données — TreasuryCard pourrait consommer les _details.treasury de dashboard-metrics si déjà chargés ; (b) Accepter le double appel pour v1.1 et monitorer la latence. Pas bloquant, mais à surveiller.

Déjà documenté : idempotence côté Odoo dans PLAN_IMPLEMENTATION_Tresorerie_Validee_v1.1.md §9.1.

### 8.2 Route Vault

Vérifier que `/ui/system/bank-reconciliation-health` est bien enregistrée dans le serveur Vault (replay.go ou équivalent). Déjà fait pour Trésorerie v1.1.

### 8.3 Pas de changement de schéma

DivaFlashBlock et tout consommateur du Flash ne doivent pas être modifiés. Les règles sont **de contenu** (ce que Mistral produit dans headline, what_i_see, to_check), pas structurelles (pas de nouveaux champs JSON).

---

## 9. Périmètre exclu (v1.2)

- **Scoring heuristique** des inducteurs (×1.5, ×1.2, etc.) — report v1.2
- **Schéma gouvernance native** : inductors[], governance_flags[], other_cards[], decision_candidates[] — à l'arrivée de DLP

---

## 10. Références

- Compte rendu MOA (à alimenter) : `ZeDocs/web29/COMPTE_RENDU_DIVA_Cockpit_Tresorerie_Inducteurs_v1.1.md`
- SPEC : `ZeDocs/web29/SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md`
- Avis expert : `ZeDocs/web29/AVIS_EXPERT_SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md`
- Trésorerie v1.1 (données bank_health) : `ZeDocs/web29/PLAN_IMPLEMENTATION_Tresorerie_Validee_v1.1.md`
- api/treasury (référence mapping) : `units/dorevia-linky/app/api/treasury/route.ts`
- Vault bank-reconciliation-health : `sources/vault/internal/handlers/bank_reconciliation_health.go`

---

*Fin du document*
