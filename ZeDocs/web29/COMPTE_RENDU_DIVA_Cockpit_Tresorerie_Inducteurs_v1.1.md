# Compte rendu — DIVA Cockpit « Trésorerie + Inducteurs + Discipline » v1.1

**Date de création :** 2026-02-22  
**Dernière mise à jour :** 2026-02-21 (tests automatisés)  
**SPEC :** `ZeDocs/web29/SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md`  
**Plan :** `ZeDocs/web29/PLAN_IMPLEMENTATION_DIVA_Cockpit_Tresorerie_Inducteurs_v1.1.md`  
**Statut global :** Implémenté (tests automatisés OK ; grille manuelle à valider)

> 📋 Document à alimenter au fur et à mesure de l'avancement. Mettre à jour la date et le statut à chaque jalon.

---

## 1. Résumé

Évolution du cockpit DIVA vers un discours **Trésorerie-first** avec axe discipline : données bank_health dans dashboard-metrics, data_completeness, règles de contenu (3 blocs, Z de caisse, incohérence discipline). Schéma JSON output inchangé (headline, what_i_see, to_check, confidence).

---

## 2. Avancement par sprint

### Sprint 1 — dashboard-metrics : bank-reconciliation-health + data_completeness

| Tâche | Statut | Date | Notes |
|-------|--------|------|-------|
| 1.1 Appel bank-reconciliation-health | ✅ | 2026-02-22 | Promise.all avec treasury |
| 1.2 Mapping health → _details.treasury | ✅ | 2026-02-22 | unreconciled_lines_count, last_statement_import_date, journals_count, oldest_unreconciled_date |
| 1.3 Fallback (health en erreur) | ✅ | 2026-02-22 | Champs à null, pas de blocage |
| 1.4 data_completeness (absent/partial/complete) | ✅ | 2026-02-22 | absent / partial (unreconciled seul) / complete |
| 1.5 Interface DashboardMetricsResponse | ✅ | 2026-02-22 | data_completeness, TreasuryDetail |
| 1.6 Interface CardDetails.treasury | ✅ | 2026-02-22 | TreasuryDetail enrichi |

**Livrable Sprint 1 :** ✅ Terminé

---

### Sprint 2 — Linky → DIVA : transmission payload

| Tâche | Statut | Date | Notes |
|-------|--------|------|-------|
| 2.1 divaBody + data_completeness | ✅ | 2026-02-22 | explain, explain/async, refresh, prewarm |
| 2.2 Vérifier _details.treasury enrichi | ✅ | 2026-02-22 | Passé via _details (Sprint 1) |
| 2.3 Routes async/refresh/prewarm | ✅ | 2026-02-22 | _details + data_completeness dans dashboard |

**Livrable Sprint 2 :** ✅ Terminé

---

### Sprint 3 — DIVA : system prompt + computeInsights

| Tâche | Statut | Date | Notes |
|-------|--------|------|-------|
| 3.1 Output rules (strict order) + règles 12–16 | ✅ | 2026-02-22 | system prompt enrichi |
| 3.2 buildUserPrompt + data_completeness | ✅ | 2026-02-22 | DataCompleteness dans payload cockpit |
| 3.3 computeInsights (simple, sans scoring) | ✅ | 2026-02-22 | Règle 16 : trésorerie 0 % + flux → insight discipline |

**Livrable Sprint 3 :** ✅ Terminé

---

### Sprint 4 — Tests + polish

| Tâche | Statut | Date | Notes |
|-------|--------|------|-------|
| 4.1 Test dashboard-metrics | ✅ | 2026-02-21 | Script `scripts/test_diva_cockpit_v1_1.sh` — structure, data_completeness, bank_health |
| 4.2 Test health absent | ✅ | 2026-02-21 | Idem — bank_health_metrics = absent valide |
| 4.3 Test DIVA cockpit | ✅ | 2026-02-21 | Script + tests unitaires Go (mistral) |
| 4.4 Régression DivaFlashBlock | ⬜ | | À valider manuellement si modifications front |

**Livrable Sprint 4 :** ✅ Terminé (tests automatisés)

---

## 3. Modifications techniques (détail à compléter)

### 3.1 Linky — dashboard-metrics

| Élément | Statut | Détail |
|---------|--------|--------|
| Appel bank-reconciliation-health | ✅ | En parallèle de treasury (Promise.all) |
| _details.treasury enrichi | ✅ | unreconciled_lines_count, last_statement_import_date, journals_count, oldest_unreconciled_date |
| data_completeness | ✅ | absent / partial / complete (complete = données disponibles) |

### 3.2 Linky → DIVA

| Élément | Statut | Détail |
|---------|--------|--------|
| Transmission data_completeness | ✅ | dashboard.data_completeness dans explain, refresh, prewarm |
| _details transmis | ✅ | treasury enrichi via _details |

### 3.3 DIVA — Mistral

| Élément | Statut | Détail |
|---------|--------|--------|
| Output rules (strict order) | ✅ | headline / what_i_see (dernière ligne = synthèse) / to_check |
| Règles 12–16 | ✅ | data_completeness, Z, POS scellé, complete≠qualité, incohérence discipline |
| computeInsights | ✅ | Règle 16 : trésorerie 0 % + flux opérationnels → POINT DOMINANT discipline |

---

## 4. Fichiers modifiés

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Appel health, mapping, data_completeness | ✅ |
| `units/dorevia-linky/app/api/diva/explain/route.ts` | Transmission data_completeness | ✅ |
| `units/dorevia-linky/app/api/diva/explain/async/route.ts` | Idem | ✅ |
| `units/dorevia-linky/app/api/diva/refresh/route.ts` | Idem + _details | ✅ |
| `units/dorevia-linky/app/api/diva/prewarm/route.ts` | Idem + _details | ✅ |
| `units/diva/internal/mistral/client.go` | system prompt, buildUserPrompt, computeInsights | ✅ |
| `units/diva/internal/models/models.go` | Dashboard.DataCompleteness | ✅ |
| `units/diva/internal/handlers/explain.go` | Fusion data_completeness dans dashboardDetails | ✅ |
| `units/diva/internal/handlers/generate.go` | Idem | ✅ |
| `scripts/test_diva_cockpit_v1_1.sh` | Script tests intégration (dashboard-metrics + DIVA) | ✅ |
| `units/diva/internal/mistral/client_test.go` | Tests unitaires Rule16 + buildUserPrompt data_completeness | ✅ |

---

## 5. Critères d'acceptation SPEC §8

| Critère | Statut |
|---------|--------|
| POINT DOMINANT centré sur Trésorerie | ⬜ |
| Discipline mentionnée si incohérence flux / validation | ⬜ |
| 2 à 4 inducteurs max | ⬜ |
| POS non ignoré si scellé et non nul | ⬜ |
| Aucune card significative ignorée | ⬜ |
| Longueur maîtrisée (≤ ~10 lignes visibles) | ⬜ |

---

## 6. Points de vigilance (suivi)

| Point | Statut | Action |
|-------|--------|--------|
| Double appel Odoo (dashboard-metrics + TreasuryCard) | 🟡 À surveiller | Monitorer latence ; partage données possible en v1.2 |
| data_completeness = complete ≠ bonne discipline | ✅ Documenté | Règle 15 du prompt |

---

## 7. Déploiement

| Environnement | Image Linky | Image DIVA | Statut |
|---------------|-------------|------------|--------|
| lab | `dorevia/linky:diva-cockpit-v1.1` | `dorevia/diva:cockpit-v1.1` | ✅ Déployé |
| stinger | `dorevia/linky:diva-cockpit-v1.1` | `dorevia/diva:cockpit-v1.1` | ✅ Déployé |

**Build (réalisé 2026-02-22) :**
```bash
# Linky (depuis units/dorevia-linky)
docker build --build-arg NEXT_PUBLIC_ODOO_URL="https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo" \
  -t dorevia/linky:diva-cockpit-v1.1 .

# DIVA (depuis units/diva)
docker build -t dorevia/diva:cockpit-v1.1 .
```

**Redéploiement :**
```bash
# UI sarl-la-platine (stinger)
cd /opt/dorevia-plateform
bin/dorevia.sh app up ui stinger sarl-la-platine

# UI sarl-la-platine (lab)
bin/dorevia.sh app up ui lab sarl-la-platine

# DIVA (si déployé séparément)
cd units/diva && docker compose up -d --force-recreate
```

**Fichiers modifiés :**
- `tenants/sarl-la-platine/state/manifest.json` → images.linky = diva-cockpit-v1.1 (source pour render)
- `tenants/sarl-la-platine/apps/ui/stinger/docker-compose.yml` → image linky
- `tenants/sarl-la-platine/apps/ui/lab/docker-compose.yml` → image linky
- `units/diva/docker-compose.yml` → image diva:cockpit-v1.1

**Statut 2026-02-22 :** Linky (stinger + lab) et DIVA redéployés avec les nouvelles images.

---

## 8. Tests

### 8.0 Tests automatisés

**Script d'intégration** `scripts/test_diva_cockpit_v1_1.sh` (nécessite stack en cours) :

| Test | Description | Type |
|------|-------------|------|
| 1 | dashboard-metrics — structure (data_completeness, bank_health, _details.treasury) | Déterministe |
| 2 | DIVA — structure réponse (headline, what_i_see, to_check, confidence) | Déterministe |
| 3 | Longueur bloc (≤ ~10 lignes) | Déterministe |
| 4 | Mention rapprochement absentes (data_completeness absent) | Soft (LLM) |
| 5 | Règle 16 (Tréso 0 % + flux) | Soft (LLM) |

```bash
./scripts/test_diva_cockpit_v1_1.sh
```

**Tests unitaires Go** `units/diva/internal/mistral` :

| Test | Description |
|------|-------------|
| `TestComputeInsights_Rule16_NoFlux` | Trésorerie 0 % sans flux → pas d'insight discipline |
| `TestComputeInsights_Rule16_WithFlux` | Trésorerie 0 % + flux → insight discipline requis |
| `TestBuildUserPrompt_DataCompleteness` | data_completeness transmis (absent par défaut, map, struct) |

```bash
cd units/diva && go test ./internal/mistral/... -v
```

**Résultats 2026-02-21 :** 13/13 tests script OK ; 28 tests Go OK.

---

### 8.1 Tests manuels — grille de validation

### Test 1 — bank_health disponible

**À vérifier :**
- [ ] headline → trésorerie clairement exprimée
- [ ] mention discipline si lignes non rapprochées > 0
- [ ] dernière ligne = synthèse claire des autres cartes (séparées par " • ")
- [ ] **Bug** : si discipline mentionnée alors que lignes = 0 → erreur de logique

| Résultat | Date |
|----------|------|
| | |

---

### Test 2 — bank_health indisponible (data_completeness = "absent")

**Attendu :**
- [ ] Mention sobre : « Données de rapprochement bancaire non disponibles »
- [ ] Aucune extrapolation
- [ ] Pas de ton dramatique
- [ ] **Bug** : si DIVA invente des métriques → problème

| Résultat | Date |
|----------|------|
| | |

---

### Test 3 — Trésorerie 0 % + flux significatifs (test clé)

**Attendu :**
- [ ] Tension explicitement formulée : flux opérationnels présents mais validation bancaire absente
- [ ] Règle 16 visible dans le discours
- [ ] **Bug** : si non formulé clairement → règle 16 insuffisamment forte

| Résultat | Date |
|----------|------|
| | |

---

### Test 4 — POS scellé + non nul

**Attendu :**
- [ ] POS apparaît dans la synthèse (dernière ligne ou inducteur)
- [ ] « POS scellé ✓ » ou équivalent si 100 % scellé
- [ ] **Bug** : si absent → perte de crédibilité immédiate

| Résultat | Date |
|----------|------|
| | |

---

### Test 5 — Longueur

**Attendu :**
- [ ] Bloc ≤ ~10 lignes visibles
- [ ] Lisible comme tableau de bord, pas comme rapport comptable
- [ ] **Bug** : si trop long → perte de l'effet cockpit

| Résultat | Date |
|----------|------|
| | |

---

## 9. Références

- SPEC : `ZeDocs/web29/SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md`
- Avis expert : `ZeDocs/web29/AVIS_EXPERT_SPEC_DIVA_Cockpit_Tresorerie_Inducteurs_v1.0.md`
- Plan : `ZeDocs/web29/PLAN_IMPLEMENTATION_DIVA_Cockpit_Tresorerie_Inducteurs_v1.1.md`

---

## 10. Addendum (évolutions post-MVP)

*Espace pour les ajustements, corrections ou précisions ajoutés au fil de l'eau.*

---

*Fin du document — à mettre à jour à chaque jalon d'avancement*
