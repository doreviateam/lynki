# Rapport de Sprint 15 — Lynki

**Fichier canonique :** `RAPPORT_SPRINT_15_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Révision 1.1 :** formulation e2e ajustée, Gate D précisée (livré vs activation ops), deploy Vault explicité, non-régression archives qualifiée fenêtre de rétention.  
**Plan :** [PLAN_SPRINT_15_LYNKI.md](PLAN_SPRINT_15_LYNKI.md) v1.3  
**Tickets :** [EXECUTION_TICKETS_SPRINT_15_LYNKI.md](EXECUTION_TICKETS_SPRINT_15_LYNKI.md) v1.1  
**Contrat métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2  
**Sprint précédent :** [RAPPORT_SPRINT_14_LYNKI.md](RAPPORT_SPRINT_14_LYNKI.md) v1.3

---

## 1. Résumé exécutif

Le Sprint 15 **rend visible en Synthèse comptable le niveau de confiance sur les flux financiers**, répondant directement au constat MOA : le rapprochement bancaire était visible en Pilotage mais absent de la Synthèse.

Trois axes livrés :

1. **Bloc « État du rapprochement bancaire » en Synthèse** — un bloc métier dédié, en tête de zone, affichant le taux de rapprochement, le reste à rapprocher et les écritures non rapprochées, avec gestion explicite des états dégradés (Partiel, Indisponible, Non aligné).
2. **Cohérence Pilotage × Synthèse + tests e2e** — tests e2e couvrant le cas aligné, le cas non aligné, la non-régression des blocs existants et l'ordre de lecture.
3. **Rétention 90j `facts_pack_archive`** — handler Vault dédié, protégé par Bearer token, avec logs structurés (date, lignes supprimées, seuil, statut) et documentation ops.

**4 tickets livrés (T84–T87)**, builds propres Vault + Linky.

---

## 2. Tickets livrés

| # | Titre | Statut |
|---|-------|--------|
| T84 | Linky — bloc « État du rapprochement bancaire » en Synthèse | Livré |
| T85 | Linky — cohérence Pilotage × Synthèse + tests e2e | Livré |
| T86 | Vault — rétention 90j `facts_pack_archive` + doc ops | Livré |
| T87 | Transversal — clôture sprint, contrat, doc, non-régression | Livré |

---

## 3. Détail par axe

### 3.1 Bloc rapprochement bancaire en Synthèse (T84)

- Nouveau composant `BankReconciliationBlock.tsx` intégré en tête de `AccountingSummaryView`.
- **Source canonique provisoire** : identique au Pilotage (`/api/treasury` → Vault `/ui/aggregations/treasury`), conformément à la règle du plan v1.2 tant que §4.1 du contrat métier n'est pas figé.
- **Libellé principal** : **État du rapprochement bancaire** (sous-libellé : Confiance des flux).
- **Contrat d'affichage respecté** : libellé → valeur principale (ou message d'état en fallback) → badge d'état → métriques secondaires (max 3, pas de lignes fantômes) → ligne `Réf.`.
- **États gérés** : OK, Partiel, Indisponible, Non aligné. Le message d'état remplace la valeur principale sans laisser de trou UI.
- **Ligne `Réf.`** visible même en état dégradé.

### 3.2 Cohérence Pilotage × Synthèse + e2e (T85)

- Fichier de tests : `tests/e2e/reconciliation-coherence.spec.ts`.
- **Cas 1 — Aligné** : vérifie que le bloc affiche une valeur (%) ou un état explicite ; pas de trou UI.
- **Cas 2 — Non aligné / Indisponible** : vérifie la ligne `Réf.` visible et un contenu textuel substantiel (pas de bloc vide).
- **Non-régression Synthèse** : blocs Balance générale, Bilan, Compte de résultat toujours visibles.
- **Ordre de lecture** : le bloc rapprochement apparaît avant la Balance générale (vérification par bounding box).
- La comparaison e2e porte sur la **cohérence métier** (valeur + état), pas sur du texte pixel-perfect.

### 3.3 Rétention 90j FactsPack (T86)

- **Route** : `POST /internal/jobs/facts-pack-purge`.
- **Sécurité** : Bearer token `FACTS_PACK_PURGE_TOKEN` obligatoire, non exposée au navigateur utilisateur — doctrine sécurité plan v1.2 respectée.
- **Logique** : `DELETE FROM facts_pack_archive WHERE generated_at < NOW() - '90 days'::INTERVAL`.
- **Idempotence** : deux exécutions consécutives sans ligne à purger ne produisent pas d'erreur.
- **Payload réponse** : `{ status, deleted_count, threshold_days, executed_at }`.
- **Observabilité** : logs structurés (zerolog) avec `event`, `deleted_count`, `threshold_days`, `executed_at`, `status`.
- **Documentation ops** : variable `FACTS_PACK_PURGE_TOKEN` ajoutée au docker-compose plateforme.

### 3.4 Deploy

- **Linky** — Image Docker : `dorevia/linky:sprint15-2026-03-21`. Tenants mis à jour : o19, laplatine2026, sarl-la-platine (lab + stinger), linky-generic.
- **Vault** — Code mis à jour (handler purge, storage, config, route). Nécessite redéploiement du service Vault avec la nouvelle variable `FACTS_PACK_PURGE_TOKEN` pour activation complète de T86.

---

## 4. Gates

| Gate | Statut | Détail |
|------|--------|--------|
| A — Build Vault | Passe | `go build ./...` OK |
| B — Build Linky | Passe | `npx next build` OK — Compiled successfully |
| C — Docker image | Passe | `dorevia/linky:sprint15-2026-03-21` construite |
| D — Close (périmètre Sprint 15) | Passe | Bloc rapprochement en Synthèse, cohérence e2e (cas aligné + non aligné), rétention FactsPack livrée côté Vault |

**Gate D** — Synthèse V1 confiance :
- Le bloc §3.1 du contrat métier v0.2 est visible en Synthèse.
- Cas e2e aligné et non aligné couverts.
- Rétention 90j livrée côté Vault (route, sécurité, observabilité) ; activation cron ops restant à finaliser.
- Les définitions MOA §4.1 n'ont pas été figées pendant ce sprint ; la source canonique provisoire (= Pilotage) est documentée.

---

## 5. Non-régression

| Surface | Statut |
|---------|--------|
| Navigation Pilotage / Synthèse (segmented control) | OK |
| Blocs Synthèse existants (BG, Bilan, CdR, Insight, Balances tiers) | OK |
| Comparatifs N/N-1 | OK |
| DOCX v2 | Non impacté par Sprint 15 |
| Archivage FactsPack Sprint 14 | OK — `GET /api/accounting/facts-pack/:hash` inchangé pour les archives récentes / dans la fenêtre de rétention |
| Proxy consultation archive | OK |
| Habilitations `/accounting/*` | Non modifiées |

---

## 6. Dette / Report / Hors sprint

| Sujet | Statut | Note |
|-------|--------|------|
| Gel §4.1 contrat métier (définitions MOA) | **Reporté** | Atelier Esther nécessaire |
| Contrat v0.3 (4 blocs canoniques complets) | **Reporté** | Suite logique du contrat v0.2 |
| Rejouabilité v2 (régénération depuis archive) | **Backlog** | Prérequis : rétention en place |
| DOCX — résumé rapprochement | **Backlog** | Option v1.1 ou v2 du DOCX |
| Lien « Voir le détail en Pilotage » (C8) | **Non bloquant V1** | Option V1.1 |
| Cron plateforme effectif | **À configurer ops** | Route et token prêts, activation cron à planifier |

---

## 7. Suite logique

1. **Atelier MOA** (Esther) : figer §4.1 du contrat métier — définitions, source canonique du %, règles de prudence.
2. **Contrat v0.3** — extension aux 4 blocs canoniques complets (Bilan, CdR, Tiers, Grand livre).
3. **Activation cron purge** — documenter la fréquence et intégrer au scheduler ops.
4. **Rejouabilité v2** — régénération depuis FactsPack archivé.
5. **DOCX enrichi** — résumé du rapprochement dans le rapport documentaire.

---

## 8. Fichiers modifiés / créés

### Linky (T84 + T85)
- `components/BankReconciliationBlock.tsx` — **nouveau** — bloc rapprochement bancaire Synthèse
- `components/AccountingSummaryView.tsx` — import + intégration du bloc en tête
- `tests/e2e/reconciliation-coherence.spec.ts` — **nouveau** — 4 scénarios e2e

### Vault (T86)
- `sources/vault/internal/handlers/jobs_facts_pack_purge.go` — **nouveau** — handler de purge
- `sources/vault/internal/storage/facts_pack_archive.go` — ajout `PurgeFactsPackArchiveOlderThan`
- `sources/vault/internal/config/config.go` — ajout `FactsPackPurgeToken`
- `sources/vault/internal/server/replay.go` — enregistrement route `/internal/jobs/facts-pack-purge`

### Deploy (T87)
- `tenants/o19/apps/ui/lab/docker-compose.yml` — tag sprint15
- `tenants/laplatine2026/apps/ui/lab/docker-compose.yml` — tag sprint15
- `tenants/sarl-la-platine/apps/ui/lab/docker-compose.yml` — tag sprint15
- `tenants/sarl-la-platine/apps/ui/stinger/docker-compose.yml` — tag sprint15
- `tenants/linky-generic/docker-compose.yml` — tag sprint15
- `tenants/core-stinger/platform/docker-compose.yml` — ajout `FACTS_PACK_PURGE_TOKEN`

### Documentation
- `ZeDocs/web57/RAPPORT_SPRINT_15_LYNKI.md` — **nouveau**

---

## 9. Documentation ops — Purge FactsPack (T86)

### Route

```
POST /internal/jobs/facts-pack-purge
```

### Authentification

```
Authorization: Bearer <FACTS_PACK_PURGE_TOKEN>
```

### Fréquence recommandée

Quotidienne (cron `0 3 * * *` ou équivalent).

### Exemple curl

```bash
curl -s -X POST \
  -H "Authorization: Bearer ${FACTS_PACK_PURGE_TOKEN}" \
  http://vault:8080/internal/jobs/facts-pack-purge
```

### Réponse succès

```json
{
  "status": "ok",
  "deleted_count": 12,
  "threshold_days": 90,
  "executed_at": "2026-03-21T03:00:00Z"
}
```

### Réponse erreur

```json
{
  "status": "error",
  "error": "...",
  "threshold_days": 90,
  "executed_at": "2026-03-21T03:00:00Z"
}
```

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `FACTS_PACK_PURGE_TOKEN` | Bearer token pour la route de purge | *(requis en production)* |

### Logs structurés

Chaque exécution produit un log structuré contenant :
- `event` : `facts_pack_purged` (succès) ou `facts_pack_purge_failed` (erreur)
- `deleted_count` : nombre de lignes supprimées
- `threshold_days` : seuil de rétention appliqué (90)
- `executed_at` : date/heure d'exécution

---

*Rapport rédigé à la clôture du Sprint 15 — mars 2026.*
