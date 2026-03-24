# Note technique — Diva / Mistral : travaux de stabilisation et de qualité
## À l'intention du MOA technique

**Date** : 16 mars 2026  
**Périmètre** : service Diva (Go) · LLM Mistral (llama.cpp) · store Postgres · UI Linky (Next.js)  
**Statut** : exécuté et déployé en environnement lab  
**Référence** : ZeDocs/web55 — Note · Avis expert · Spec · Plan Scrum

---

## 1. Contexte de départ

Diva est le composant qui génère les **insights financiers** du cockpit Linky — un bloc texte rédigé, ancré sur les 12 indicateurs du tableau de bord (trésorerie, business, taxes, BFR, EBE, encours, remboursements, POS, etc.).

Le moteur de génération est **Mistral 7B** (quantifié Q4, inférence CPU locale via llama.cpp), hébergé sur le même hôte que les services de production Odoo et les environnements lab.

### Problèmes identifiés avant travaux

| Catégorie | Symptôme observé |
|-----------|-----------------|
| **Infrastructure** | Swap à saturation (100%), RAM disponible < 500 MiB après inférence |
| **Persistance** | Store Diva en mémoire → insights perdus au redémarrage du conteneur |
| **Robustesse** | Absence de single-flight → doubles inférences possibles sur requêtes concurrentes |
| **Qualité LLM** | Prompt en "soupe de cartes", LLM chargé de hiérarchiser les données lui-même |
| **Ligne éditoriale** | Prescriptions, anglicismes, calculs autonomes non conformes au ton voulu |
| **Troncature** | Headline coupé en cours de phrase (`"...dépasse considérablement ce..."`) |
| **UX** | Pas d'indicateur d'âge de l'insight ; bloc principal trop compact sur desktop |

---

## 2. Organisation des travaux

Les travaux ont été structurés en **5 phases séquentielles** avec gate formel entre chaque phase. Aucune phase applicative ne commence sans validation de la phase infrastructure.

```
Phase 0 (P0) — Stabilisation hôte          ← socle obligatoire
Phase 1 (P0) — Robustesse applicative      ← avant toute amélioration qualité
Phase 2 (P1) — Qualité et latence perçue   ← cœur produit
Phase 3A (P2) — Fraîcheur et UX            ← optionnel, livré
Phase 3B (P2) — Start/stop planifié        ← optionnel, livré
```

**32 tickets DM-x** au total, chacun avec Definition of Done et artefact de preuve.

---

## 3. Phase 0 — Stabilisation de l'hôte

### Problème central

Le swap était saturé à 100% avant travaux. Sur un hôte hébergeant Odoo prod + labs + Mistral + Diva, tout événement OOM devient probable et toute mesure de latence est ambiguë (impossible de distinguer un problème LLM d'une contention système).

**Règle posée** : *l'ordre de priorité est infrastructure d'abord, code ensuite*.

### Actions

**Store Postgres activé (`DIVA_DATABASE_URL`)**  
Diva utilisait un store mémoire par défaut. Les insights étaient perdus à chaque redémarrage du conteneur. La variable `DIVA_DATABASE_URL` a été branchée sur la base Postgres du Vault (réseau interne `dorevia-network`). La table `diva_insights` existait déjà (migration antérieure).

Conséquence : le runner pré-calcule les insights, les stocke, et l'UI lit depuis le store sans aucune dépendance synchrone à Mistral.

**Paramètres Mistral réduits**

| Paramètre | Avant | Après | Raison |
|-----------|-------|-------|--------|
| `--ctx-size` | 8192 | 4096 | Les prompts effectifs n'approchent pas ce plafond |
| `--parallel` | non défini | 1 | Un seul slot d'inférence, évite le surcroît mémoire |
| `--threads` | non défini | 8 | Aligné sur les cœurs disponibles |
| `cpus` | non limité | `"6"` | Protection des autres services |
| `mem_limit` | non limité | `6g` | Évite que Mistral phagocyte toute la RAM |

**Baseline mesurée** (p50/p95 sur 5 inférences) : ~2835 ms / ~5248 ms.

**Leviers swap** (actions manuelles recommandées, documentées dans le runbook) : swappiness 10 et ajout d'un fichier swap de 4 GiB.

---

## 4. Phase 1 — Robustesse applicative

### Single-flight par `context_hash`

Sans protection, deux requêtes simultanées pour le même contexte (même tenant × société × période) déclenchaient deux inférences Mistral en parallèle. Le mécanisme `RefreshGuard` a été étendu à l'endpoint `/generate` :

- Première requête : acquiert le verrou, lance l'inférence
- Requêtes concurrentes : reçoivent immédiatement **HTTP 503** (pas d'attente, pas de duplication)
- À la fin de l'inférence : le résultat est en store, disponible pour tous

Test validé : 5 requêtes simultanées sur le même contexte → **1 seule inférence Mistral**.

### Logs enrichis

Chaque inférence logue désormais :

```json
{
  "event": "diva_gen",
  "context_hash": "939f220aeaaa...",
  "generation_reason": "ui_generate | runner_generate | force_refresh",
  "prompt_chars": 847,
  "llm_latency_ms": 16506,
  "fallback_level": "none | degraded | error"
}
```

### Timeout configurable

`MISTRAL_TIMEOUT_MS` (défaut 120 s, était 180 s codé en dur). En cas de dépassement, Diva dégrade proprement en **flash déterministe** (headline calculé côté Go, sans LLM) — pas de crash, pas d'attente infinie.

---

## 5. Phase 2 — Qualité et latence perçue

C'est la phase la plus structurante sur le plan produit.

### Principe architectural (inchangé, renforcé)

> **Le LLM ne doit pas être évalué sur sa capacité à découvrir les signaux. Il doit être évalué sur sa capacité à reformuler correctement des signaux déjà hiérarchisés par le code.**

Mistral n'analyse pas les données brutes. Il reçoit un **payload structuré pré-calculé** (côté Go) et reformule en langue naturelle.

### Payload JSON Niveau 1 (nouveau)

Avant : Mistral recevait une liste brute de 12 cartes avec valeurs, statuts et commentaires — la hiérarchisation était implicitement laissée au LLM.

Après : le payload est structuré en 3 niveaux explicites :

```json
{
  "headline_candidate": "Trésorerie nette post-fiscale : 7 448,61 €",
  "facts": [
    "Écart trésorerie/business : 86 610 € (priorité 1)",
    "EBE à 34 721 € (priorité 2)",
    "Encours clients 50 200 € (priorité 3)"
  ],
  "alerts": [
    "Taxes statut WATCH : 0,6% CA non rapproché",
    "Position trésorerie non rapprochée de zéro"
  ]
}
```

Le ranking est déterministe côté Go (score = variation × montant × criticité statut). Mistral ne calcule rien.

### System prompt — persona "contrôleur de gestion senior"

Le prompt installe explicitement le rôle et le format de sortie :

```
Tu es contrôleur de gestion senior. Tu reçois des faits financiers pré-calculés
et tu les reformules en langue naturelle sobre.

FORMAT STRICT — JSON valide uniquement :
{
  "headline": "1 phrase factuelle, complète, sans troncature",
  "what_i_see": ["Inducteur 1", "Inducteur 2", "Inducteur 3"],
  "to_check": ["Vigilance 1", "Vigilance 2"],
  "confidence": "low|medium|high"
}

Vocabulaire autorisé : "représente", "s'élève à", "soit X% du CA", "dépasse", "écart de".
Interdit : "il faut", "vous devez", "devrait", anglicismes, "...".
```

### `max_tokens` : 450 → 650

L'ancienne limite forçait Mistral à tronquer le headline pour "économiser" des tokens sur les items `what_i_see`. Passage à 650 tokens pour couvrir confortablement le JSON complet.

**Erreur de réglage identifiée et corrigée en session** : l'ajout d'une contrainte `"headline ≤ 20 mots"` provoquait exactement la troncature visée à corriger — Mistral obéissait au mot près et ajoutait `"..."` au mot 20. Suppression de la contrainte de comptage, remplacement par `"phrase complète, sans '...'"`.

### Grille de recette éditoriale

5 insights évalués sur 8 critères (ton factuel, absence prescription, absence anglicismes, ancrage 12 cartes, format JSON valide...). Score obtenu : **31/40 (77,5%)**. Non-conformités récurrentes documentées avec actions correctives.

---

## 6. Phase 3A — Fraîcheur et UX

### `facts_version` — traçabilité des données sources

Un identifiant court (`facts_version`) est désormais dérivé du hash du payload envoyé à Mistral (12 premiers caractères hex). Il est stocké dans `diva_insights` et retourné par l'API.

Objectif : savoir si l'insight affiché correspond aux données actuelles ou à des données obsolètes. Si le payload change (nouvelles données Odoo), le `facts_version` change → l'insight peut être invalidé ou signalé comme périmé.

Migration SQL appliquée :
```sql
ALTER TABLE diva_insights ADD COLUMN IF NOT EXISTS facts_version TEXT;
CREATE INDEX IF NOT EXISTS idx_diva_insights_facts_version ON diva_insights (context_key, facts_version);
```

### API enrichie

L'endpoint `/diva/insights` expose désormais :

```json
{
  "state": "ready",
  "insight": {
    "flash": { "headline": "...", "what_i_see": [...], "to_check": [...] },
    "facts_version": "939f220aeaaa",
    "insight_age_seconds": 142,
    "latency_ms": 16506
  }
}
```

### UI — "Calculé il y a X min"

L'affichage de l'âge de l'insight existait déjà dans le composant React (`DivaFlashBlock`). Les nouveaux champs (`insight_age_seconds`, `facts_version`, `latency_ms`) sont désormais typés dans l'interface TypeScript.

---

## 7. Phase 3B — Start/stop planifié Mistral

### Principe

Mistral n'a pas besoin de tourner en permanence. Le produit est **store-first** :

1. Runner Diva pré-calcule les insights (passe sur tous les contextes actifs)
2. Store Postgres conserve les insights calculés
3. UI lit depuis le store → latence < 1 s, sans Mistral

Mistral ne sert que pendant la **fenêtre de calcul**.

### Script `mistral_window.sh`

```
Démarrage Mistral
→ Attente healthcheck (port 8000, max 40 × 5s = 200s)
→ Fenêtre ouverte (runner tourne en fond)
→ Arrêt anticipé si Mistral inactif depuis 300s
   OU timeout max 60 min
→ Arrêt Mistral
→ Log RAM libérée
```

Variables configurables : `MISTRAL_WINDOW_MINUTES`, `DIVA_LOG_IDLE_SECONDS`, `MISTRAL_HEALTH_PORT`, `MISTRAL_CONTAINER_NAME`.

### Cron installé

```cron
0 6 * * 1-5  /opt/dorevia-plateform/scripts/mistral_window.sh >> /var/log/mistral_window.log 2>&1
```

Fenêtre ouverte à 6h du matin, du lundi au vendredi. Les insights sont disponibles toute la journée depuis le store.

### RAM libérée mesurée

| Mesure | Valeur |
|--------|--------|
| RAM disponible avant arrêt Mistral | 3,3 GiB |
| RAM disponible après arrêt Mistral | 7,6 GiB |
| **RAM libérée** | **~4,3 GiB** |
| Consommation Mistral (docker stats) | 4,332 GiB / 6 GiB |

### Comportement hors fenêtre documenté et testé

| Endpoint | Hors fenêtre Mistral |
|----------|---------------------|
| `GET /diva/insights` | Store Postgres — toujours disponible |
| `POST /diva/explain` cockpit | Flash dégradé déterministe (`degraded: true`) — calculé côté Go |
| `POST /diva/explain` card | HTTP 503 `MISTRAL_UNAVAILABLE` — documenté, sans attente |

---

## 8. Améliorations UX post-déploiement

### Bloc "INSIGHT PRINCIPAL" — desktop

Sur desktop (`md+`, ≥ 768px), le bloc insight est maintenant :

- **Plus large** : `max-w-3xl` (48 rem) contre `max-w-2xl` (42 rem) auparavant
- **Contenu directement visible** : `what_i_see` et `to_check` sont affichés sans avoir à déplier le composant `<details>`
- **Puces visuelles** : bleues pour les inducteurs (`what_i_see`), orange pour les points de vigilance (`to_check`)
- **Mobile inchangé** : le comportement compact avec dépliable est conservé

Sur mobile, le comportement compact avec `▶ Données utilisées` reste intact.

---

## 9. Ce qui a été déployé

| Composant | Image déployée | Date |
|-----------|---------------|------|
| Diva + Diva Runner | `dorevia/diva:diva-mistral-v2-2026-03-16` | 16 mars 2026 |
| Linky (tous labs) | `dorevia/linky:diva-desktop-v1-2026-03-16` | 16 mars 2026 |
| Migration SQL 045 | `facts_version` dans `diva_insights` | 16 mars 2026 |
| Cron mistral_window | 6h lun-ven | 16 mars 2026 |

**État à la clôture des travaux** :
- `diva` : healthy, 3,3 MiB RAM, CPU ≈ 0%
- `diva-runner` : healthy, 2,2 MiB RAM
- `mistral-llamacpp` : healthy, 5,3 GiB RAM, CPU ≈ 0% (idle)
- 57 insights en base, 4 tenants, latence moyenne 26 s, latence min 0 s (store hit)

---

## 10. Ce qui reste à surveiller

| Point | Détail |
|-------|--------|
| **TTL insights** | `INSIGHTS_TTL_MINUTES` doit être augmenté en prod (8h minimum) pour que les insights calculés à 6h soient valides jusqu'au soir |
| **Swap** | Les actions manuelles (swappiness, fichier swap) nécessitent un accès root — documentées dans le runbook, non encore appliquées |
| **Grille éditoriale** | Score 77,5% — les points de non-conformité (recalculs autonomes du LLM, qualificatifs vagues) peuvent être améliorés par un affinement du system prompt |
| **`facts_version` invalidation** | La mécanique est en place mais l'invalidation active (invalider l'insight si `facts_version` change) reste à implémenter côté runner |
| **Service DLP** | Erreur DNS `lookup dlp` dans les logs Vault — indépendant des travaux Diva, à traiter séparément |

---

## 11. Références

| Document | Rôle |
|----------|------|
| `ZeDocs/web55/Note_Diva_Mistral_Optimisation.md` | Cadrage produit initial, 3 lots, ligne éditoriale |
| `ZeDocs/web55/AVIS_EXPERT_DIVA_MISTRAL_v1.0.md` | Diagnostic infra, leviers swap, start/stop |
| `ZeDocs/web55/SPEC_DIVA_Mistral_Infrastructure_Exploitation_v1.0.md` | Spec de référence exécutable (phases, seuils, rollback) |
| `ZeDocs/web55/PLAN_IMPLEMENTATION_SCRUM_DIVA_MISTRAL_v1.0.md` | Backlog Scrum — 32 tickets DM-x |
| `ZeDocs/web55/RUNBOOK_PHASE0_DIVA_MISTRAL.md` | Configurations Phase 0, baseline, rollback |
| `ZeDocs/web55/GRILLE_RECETTE_EDITORIALE_DIVA_Phase2_v1.0.md` | Recette éditoriale (5 insights, 8 critères, 77,5%) |
| `ZeDocs/web55/RUNBOOK_PHASE3B_MISTRAL_STARTSTOP.md` | Start/stop, mesure RAM, règle hors fenêtre |
| `scripts/mistral_window.sh` | Script start/stop Mistral |
