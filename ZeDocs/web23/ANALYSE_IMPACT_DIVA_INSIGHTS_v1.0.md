# Analyse d'impact — DIVA Insights v1.1 sur l'implémentation actuelle

**Date :** 2026-02-18  
**Référence :** `SPEC_DIVA_Insights_v1.0.md` (contenu v1.1)  
**Auteur :** Analyse technique

**Design cible : mode A (lecture à la minute)** — diva_insights = cache applicatif volatil ; Vault = mémoire ; Linky = lecture d'état.

---

## 1. Synthèse exécutive

| Critère | Évaluation |
|---------|------------|
| **Impact global** | Moyen à fort — refonte du flux UX, ajout table + endpoints |
| **Risque** | Faible si migration progressive ; rupture nette si bascule d'un coup |
| **Réutilisabilité** | 70–80 % du code existant (Mistral client, buildUserPrompt, runner loop) |
| **Effort estimé** | 6–8 jours (conforme à la spec §12) |

**Recommandation :** migration **progressive** en 2 sprints. Sprint 1 : backend (table, generate, GET). Sprint 2 : bascule Linky sur GET, dépréciation poll.

---

## 2. Inventaire de l'existant

### 2.1 Composants concernés

| Composant | Fichiers | Rôle actuel |
|-----------|----------|-------------|
| **DIVA (Go)** | `handlers/explain_async.go`, `explain.go`, `store/`, `mistral/client.go` | POST explain/async, GET jobs/:hash, store `diva_analysis` |
| **Runner** | `internal/runner/`, `cmd/diva-runner/` | Tick 1–2 min, appelle explain/async (cockpit uniquement) |
| **Linky** | `DivaFlashBlock.tsx`, `explain/async/route.ts`, `prewarm/route.ts`, `jobs/[contextHash]/route.ts` | POST + poll 2 s, prewarm fire-and-forget |
| **Postgres** | `diva_analysis` | Clé `context_hash`, status processing/done/failed |

### 2.2 Flux actuel (schéma)

```
DivaFlashBlock
    │
    ├─► GET dashboard-metrics
    ├─► POST prewarm (fire-and-forget) ──► DIVA explain/async
    └─► POST explain/async ──► DIVA
              │
              ├─ 200 + flash → affichage
              └─ 202 + context_hash → poll GET jobs/{hash} toutes les 2 s
                    │
                    └─ 200 + flash → affichage
```

**Points sensibles :**
- DivaFlashBlock : ~310 lignes, logique poll + retry + cache localStorage
- 2 min de poll max avant timeout
- Pas de génération « card » par le runner (seulement cockpit)

---

## 3. Impact par composant

### 3.1 DIVA (Go)

| Élément | Impact | Action |
|---------|--------|--------|
| **Table `diva_analysis`** | Conservée (rétrocompat) | Coexistence avec `diva_insights` |
| **Nouvelle table `diva_insights`** | À créer | Migration SQL |
| **hash_input / payload_hash** | À implémenter | Nouveau : buildHashInput + canonicalJSON (§4.4.5). `computeContextHash` obsolète pour insights. |
| **`buildUserPrompt`** | Réutilisable | Inchangé |
| **Mistral client** | Réutilisable | Inchangé |
| **`POST /diva/explain/async`** | Conservé (phase 1) | Dépréciable en v2 |
| **`GET /diva/jobs/:contextHash`** | Conservé | Pour flux legacy |
| **Nouveau `GET /diva/insights`** | À implémenter | Query `diva_insights` WHERE status='ok' AND expires_at>now() |
| **Nouveau `POST /diva/generate`** | À implémenter | Lock + Mistral + insert `diva_insights` |

**Effort DIVA :** 2–3 j (store insights, handlers GET + generate, lock).

### 3.2 Runner (Go)

| Élément | Impact | Action |
|---------|--------|--------|
| **Boucle tick** | Réutilisable | Même structure |
| **FetchMetricsFromLinky** | Réutilisable | Inchangé |
| **CallDivaAsync** | À remplacer | Appeler `POST /diva/generate` au lieu de `explain/async` |
| **Mode card** | Non implémenté aujourd'hui | Spec : 8 cartes × périodes. À ajouter si priorité. |

**Effort Runner :** 0,5–1 j (nouveau client generate, param `generated_from_runner: true`).

### 3.3 Linky (Next.js)

| Élément | Impact | Action |
|---------|--------|--------|
| **DivaFlashBlock** | Forte simplification | Remplacer POST+poll par GET insight. Supprimer ~150 lignes (poll, retry). |
| **Nouveau `GET /api/diva/insight`** | À créer | Proxy vers DIVA GET /diva/insights |
| **`explain/async/route.ts`** | Conservé ou déprécié | Garder pour transition, puis supprimer |
| **`prewarm/route.ts`** | À modifier | Appeler `POST /diva/generate` au lieu de explain/async |
| **`jobs/[contextHash]/route.ts`** | Dépréciable | Plus utilisé si DivaFlashBlock ne poll plus |

**Effort Linky :** 1,5–2 j (nouveau fetch GET, simplification DivaFlashBlock, prewarm).

### 3.4 Schéma de données

| Champ / contrainte | `diva_analysis` actuel | `diva_insights` spec |
|--------------------|------------------------|----------------------|
| Clé | `context_hash` (opaque) | `context_key` (SHA-256 contexte) + `payload_hash` (SHA-256 hash_input) |
| Status | processing, done, failed | ok, error |
| Contenu | flash_json (JSONB) | message_text (TXT) + flash_json (JSONB) + confidence |
| Query | Par hash uniquement | Par `context_key` (calculé côté API) |

**Incompatibilité :** Le format de sortie change. Actuel : `{ headline, what_i_see, to_check, confidence }`. Spec : `message_text` (paragraphe). Le prompt DIVA v2 produit déjà un paragraphe ; `parseFlash` mappe en Flash. Pour insights, on stocke soit le `message_text` seul (affichage simplifié), soit le Flash complet en JSONB. La spec dit `message_text` → adapter l’affichage Linky si on ne renvoie que le texte.

---

## 4. Points d'attention

### 4.1 Format de réponse : message_text + flash_json

**Décision spec (mode A) :** Stocker **les deux** : `message_text` (affichage par défaut) et `flash_json` (Flash complet) pour flexibilité UI, future DLP, debug. Table toujours consommable.

### 4.2 Périodes : mapping period → dates

Actuel : Linky envoie `date_debut`, `date_fin` (custom). Pas de notion YTD/MTD côté DIVA.  
Spec : `period=YTD` → `date_start`, `date_end` calculés.

**À implémenter :** Fonction `PeriodToDates(period string) (start, end)` (côté DIVA ou Linky) pour YTD, MTD, current_month.

### 4.3 Runner : priorisation v1 (mode A)

Cockpit YTD + MTD ; 2–3 cartes max (treasury, cash, business). Le reste via warmup opportuniste uniquement. Charge Mistral maîtrisée.

### 4.4 Connexion Postgres

Actuel : `DIVA_DATABASE_URL` → `diva_analysis` dans la base Vault.  
Nouveau : même DB, nouvelle table `diva_insights`. Aucune nouvelle connexion.

---

## 5. Risques et mitigation

| Risque | Probabilité | Gravité | Mitigation |
|--------|-------------|---------|------------|
| Régression UX pendant la transition | Moyenne | Moyenne | Feature flag : affichage GET vs POST+poll. Basculer progressivement. |
| Double écriture (diva_analysis + diva_insights) | Faible | Faible | Phase 1 : générer dans les deux. Phase 2 : diva_insights uniquement. |
| Runner surcharge Mistral (9× contexte) | Moyenne | Moyenne | Limiter à cockpit + 3 cartes en v1. Augmenter ensuite. |
| Lock advisory : deadlock ou blocage | Faible | Élevée | Timeout sur le lock. Logs. Monitoring. |

---

## 6. Plan de migration recommandé

### Phase 1 — Backend (3–4 j)

1. Créer table `diva_insights` (migration SQL).
2. Implémenter `GET /diva/insights` (DIVA).
3. Implémenter `POST /diva/generate` (lock + Mistral + insert).
4. Adapter le runner pour appeler `/generate` avec `generated_from_runner: true`.
5. Adapter prewarm pour appeler `/generate`.

**Livrable :** Génération dans `diva_insights`. Flux explain/async inchangé. Runner + prewarm remplissent la nouvelle table.

### Phase 2 — Linky (2–3 j)

1. Créer `GET /api/diva/insight` (proxy).
2. Modifier DivaFlashBlock : essai GET en premier ; fallback POST+poll si 404.
3. Tester, puis basculer en GET-only.
4. Supprimer la logique poll, retry, jobs proxy.

**Livrable :** UX instantanée. Dépréciation de `explain/async` pour l’UI (conservation pour debug).

---

## 7. Conclusion

La spec DIVA Insights est **alignée avec l’existant** et réutilise une grande partie du code. L’impact principal est sur **DivaFlashBlock** (simplification) et sur l’ajout de **2 handlers DIVA** (GET insights, POST generate).

Migration progressive conseillée : backend d’abord, puis Linky. Pas de big-bang. La coexistence avec `diva_analysis` et explain/async permet un rollback simple si besoin.

**Effort total réaliste :** 6–8 jours, en phase avec l’estimation de la spec.

---

## 8. Statut d'implémentation

**Implémenté le :** 2026-02-16

| Phase | Statut | Référence |
|-------|--------|-----------|
| Phase 1 — Backend | OK | POINT_ETAPE_IMPLEMENTATION_DIVA_INSIGHTS_2026-02-16.md |
| Phase 2 — Linky | OK | DivaFlashBlock GET-only, proxy insight, prewarm vers generate |
| Doc déploiement | À faire | README, variables INSIGHTS_* |
