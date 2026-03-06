# Rapport MOA — Complétude avant affichage

**Date :** 2026-03-03  
**Objet :** Blocage strict des cartes tant que la complétude des preuves n'est pas validée  
**Statut :** Sprint 1 + Sprint 2 + Phase DVIG + Cache Vault 5 s (T2.7) + livrables recette réalisés — en recette  
**Référence :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1.md, SPEC_ALIMENTATION_EXPECTED_COUNTS_DVIG_v1.0.md  
**Documents associés :** GUIDE_RECETTE_PHASE_DVIG.md, CONFIG_CRON_EXPECTED_COUNTS.md, RUNBOOK_COMPLETUDE_AVANT_AFFICHAGE.md, DECISION_CARTE_TRESORERIE_BLOCAGE.md

---

## 1. Contexte

### 1.1 Objectif

Répondre au principe gouvernance :

> **Aucune carte stratégique affichée tant que la complétude des preuves n'est pas validée.**

En cas d'incomplétude (une ou plusieurs des 5 sources Vault non répondues), le CFO voit :

- Un message clair : « Synchronisation des preuves en cours… »
- Une progression : « X / Y preuves scellées » (Y fourni par Phase DVIG)
- Optionnel : « Dernière synchronisation : … » quand `generated_at` disponible
- Un bouton « Réessayer » après échec des retries automatiques

**Principe :** Une vérité partielle, en finance, est une source d'erreur.

### 1.2 Périmètre Sprint 1

| Élément | Détail |
|---------|--------|
| **Scope** | Linky (cockpit financier) — front uniquement |
| **Complétude utilisée** | `sealed_count_complete` = 5 sources API OK (ventes, achats, encaissements, décaissements, POS) |
| **Cartes concernées** | Toutes : Trésorerie, Cash, Business, Taxes, Notes de crédit, Remboursements, POS, Z de caisse, IconGrid, DivaFlashBlock, DecisionsBlock |

---

## 2. Solution livrée

### 2.1 Règle de blocage

| Condition | Affichage |
|-----------|-----------|
| `sealed_count_complete === true` **et** pas de loading **et** pas d'erreur | Cartes visibles |
| Erreur fetch totale (snapshot indisponible, 503, timeout) | **SyncInProgress** uniquement — pas de Trésorerie (données stale) |
| Incomplet **et** elapsedTime ≤ 5 s | **SyncInProgress** (aucune carte) |
| Incomplet **et** elapsedTime > 5 s **et** données Tréso disponibles (Option C) | **Trésorerie position** visible + « Consolidation globale en cours » + SyncInProgress pour le reste |

**Blocage si :** incomplet OU chargement en cours OU erreur réseau. **Exception Option C :** après 5 s d'incomplétude, Trésorerie débloquée en priorité (SPEC §2.5).

**Important — Erreur fetch totale :** Si erreur fetch totale (snapshot indisponible, 503, timeout) → **pas de Trésorerie**. Option C ne s'active que si données Trésorerie disponibles (*dashboard-metrics* a répondu) mais complétude globale `false`. Cela évite d'afficher des données stale lors d'une indisponibilité complète.

### 2.2 Écran « Synchronisation en cours »

| Élément | Comportement |
|---------|--------------|
| **Message principal** | « Synchronisation des preuves en cours… » |
| **Après retry raté** | « Synchronisation en cours… Vous pouvez réessayer. » |
| **Progression** | « X / Y preuves scellées » (Y = `expected_count` Phase DVIG ou fallback sealed quand complet) |
| **Dernière synchronisation** | Affichée quand `generated_at` fourni par le connecteur |
| **Spinner** | Affiché pendant le chargement |
| **Bouton Réessayer** | Visible si `attemptCount >= 1` et incomplet |

**Ton :** Neutre, pas d'alarme.

### 2.3 Badge intégrité

| Situation | Affichage |
|-----------|-----------|
| Complétude validée | Badge normal (vert si OK) |
| Incomplétude / loading / erreur | Badge masqué ou neutre (« — ») — **pas de « X preuves (partiel) »** |

### 2.4 Cache et scope

- Cache `sessionStorage` invalidé au changement de scope (tenant, société, période)
- Évite l'affichage de données d'un ancien périmètre

---

## 3. Travail technique réalisé

### 3.1 Composants créés / modifiés

| Fichier | Modification |
|---------|--------------|
| `components/SyncInProgress.tsx` | **Nouveau** — message, progression X/Y, « Dernière synchronisation », spinner, Réessayer |
| `components/DashboardWithFilters.tsx` | `metricsError`, `showCards`, `attemptCount`, `expectedCount`, Option C (déblocage Trésorerie après 5 s, « Consolidation globale en cours »), invalidation cache |
| `components/ReportHeader.tsx` | Prop `showIntegrityBadge` pour masquer le badge si incomplet |
| `app/api/dashboard-metrics/route.ts` | Appel `/ui/completeness-snapshot` + fallback ; `expected_count`, `generated_at` |
| `sources/vault/.../completeness_snapshot.go` | Handler GET /ui/completeness-snapshot ; lit `expected_counts` ; **cache 5 s** (T2.7) |
| `sources/vault/internal/cache/completeness_snapshot.go` | **Nouveau** — cache mémoire TTL 5 s (clé : tenant + company_id + dates) |
| `sources/vault/.../expected_counts.go` | Table + handler POST /api/v1/expected-counts |
| `sources/dvig/.../internal.py` | POST /internal/expected-counts (forward vers Vault) |
| `dorevia_vault_connector/.../dorevia_dvig_service.py` | `push_expected_counts` ; CRON 2 min |

### 3.2 Logique mise en place (3 états — Option C incluse)

```
// Détermination du mode d'affichage
if (complete && !loading && !error) {
  mode = "FULL"           // Cockpit complet
} else if (!complete && elapsedTime <= 5000) {
  mode = "BLOCKED"        // SyncInProgress uniquement
} else if (!complete && elapsedTime > 5000 && treasuryDataAvailable) {
  mode = "TREASURY_ONLY"  // Option C : Trésorerie + « Consolidation globale en cours » + SyncInProgress pour le reste
} else {
  mode = "BLOCKED"        // Erreur fetch, snapshot indisponible → pas de Tréso (données stale)
}

// Rendu
{mode === "FULL" ? (
  // IconGrid, cartes, DivaFlashBlock, DecisionsBlock...
) : mode === "TREASURY_ONLY" ? (
  // Trésorerie position + mention + SyncInProgress
) : (
  <SyncInProgress sealedCount={...} onRetry={...} loading={...} attemptCount={...} />
)}
```

### 3.3 Tests automatisés

| Fichier | Contenu |
|---------|---------|
| `tests/e2e/completude.spec.ts` | 12 scénarios Playwright (AT1–AT8 + AT9, AT10, AT11, AT12 Sprint 2) |

---

## 4. Résultats des tests

### 4.1 Tests Playwright

| Test | Scénario | Résultat |
|------|----------|----------|
| **AT1** | Blocage strict si incomplet | ✅ Passant |
| **AT2** | Blocage pendant loading | ✅ Passant |
| **AT3** | Incomplet → bouton Réessayer visible | ✅ Passant |
| **AT4** | Réessayer relance le fetch | ✅ Passant |
| **AT5** | Badge neutre quand incomplet | ✅ Passant |
| **AT6** | Cache invalidé au changement de scope | ✅ Passant |
| **AT7** | Happy path : cartes visibles | ✅ Passant |
| **AT8** | Transition SyncInProgress → cartes sans refresh | ✅ Passant |
| **AT9** | Stabilité sealed_count au refresh | ✅ Passant |
| **AT10** | Matérialisation à l'événement : snapshot mis à jour après scellement simulé | ✅ Passant |
| **AT11** | Progression X / Y quand expected_count connu | ✅ Passant |
| **AT12** | Fallback 5 endpoints — blocage conservé | ✅ Passant |

**12 tests passants** en CI (Chromium).

### 4.2 Validation manuelle recommandée

| Cas | Procédure | Résultat attendu |
|-----|-----------|-----------------|
| Vault arrêté ou timeout | Arrêter le Vault, recharger le cockpit | SyncInProgress affiché, aucune carte |
| Erreur réseau | Simuler offline / 503 | SyncInProgress + bouton Réessayer |
| Complétude OK | Vault opérationnel, données à jour | Cartes visibles, badge vert |

**Guide détaillé :** `GUIDE_RECETTE_PHASE_DVIG.md` — checklist pas à pas.

---

## 5. Definition of Done — Sprint 1

| Critère | Statut |
|---------|--------|
| Aucune carte si incomplet / loading / erreur | ✅ |
| Écran « Synchronisation des preuves en cours… » | ✅ |
| Progression (sealed_count / expected_count) | ✅ Sprint 2 |
| Bouton « Réessayer » visible et fonctionnel | ✅ |
| Badge masqué ou neutre quand incomplet | ✅ |
| Cache invalidé au changement de scope | ✅ |
| Tests Playwright AT1–AT12 | ✅ 12 passants |

---

## 6. Sprint 2 — Complétude probante (livré 2026-02-28)

### 6.1 Objectif atteint

Le Vault devient la source unique de vérité pour la complétude. Linky lit un état stable via l'endpoint dédié `/ui/completeness-snapshot`.

### 6.2 Livrables techniques

| Élément | Fichier / Détail |
|---------|------------------|
| **Endpoint Vault** | `GET /ui/completeness-snapshot` — `sealed_count`, `expected_count`, `complete`, `sealed_count_sources`, `generated_at` |
| **Handler** | `sources/vault/internal/handlers/completeness_snapshot.go` |
| **Cache 5 s** | T2.7 — réponses mises en cache (clé : tenant + company_id + date_debut + date_fin) ; évite lectures DB répétées |
| **Route** | Enregistrée dans `sources/vault/internal/server/replay.go` |
| **Linky API** | Appel snapshot en parallèle (timeout 5 s — SPEC §5.1) ; fallback sur les 5 endpoints si 404/erreur |
| **Progression X/Y** | `expected_count` renvoyé (Phase DVIG ou fallback sealed quand complet) ; SyncInProgress affiche « X / Y » |

### 6.3 Comportement

| Situation | Progression affichée |
|-----------|---------------------|
| Phase DVIG alimentée + complétude OK | « 223 / 223 preuves scellées » + « Dernière synchronisation : … » |
| Phase DVIG alimentée, incomplet | « 50 / 223 preuves scellées » |
| Phase DVIG non alimentée, complétude OK | « 223 / 223 preuves scellées » (fallback) |
| Incomplétude / snapshot indisponible | « 50 / — preuves scellées » |

### 6.4 Phase DVIG (livrée 2026-03-03)

| Composant | Détail |
|-----------|--------|
| **Table Vault** | `expected_counts` — scope (tenant, company_id, period, source), `generated_at` |
| **Endpoint Vault** | `POST /api/v1/expected-counts` — upsert batch, payload `generated_at` optionnel |
| **Endpoint DVIG** | `POST /internal/expected-counts` — forward Odoo → Vault (auth Bearer) |
| **CompletenessSnapshot** | Lit `expected_counts` en priorité ; fallback `sealed_count` si complétude OK |
| **CRON Odoo** | **Implémenté** — `push_expected_counts` toutes les 2 min ; comptages sales, purchases, paymentsIn, paymentsOut, pos (sessions) |

**Flux complet :** Odoo compte → DVIG transporte → Vault stocke → Linky lit. Architecture ERP-agnostique.

### 6.5 Vision produit

La complétude est **déclarée par la source métier** (Odoo), pas déduite. Chaque couche a un rôle précis : Vault = vérité scellée, DVIG = couche d'abstraction, ERP = fournisseur de volumétrie. Demain : Odoo, ERPNext, SAP, Sage — il suffit qu'ils envoient un `expected_count`.

---

## 7. Recommandations MOA

1. **Recette manuelle** : Suivre `GUIDE_RECETTE_PHASE_DVIG.md` — checklist complète (Vault arrêté, CRON, X/Y, Réessayer).
2. **Recette Phase DVIG** : Avec Odoo, DVIG et Vault opérationnels, vérifier CRON et affichage « X / Y » + « Dernière synchronisation ».
3. **Configuration Odoo** : Consulter `CONFIG_CRON_EXPECTED_COUNTS.md` — paramètres requis pour le CRON.
4. **Carte Trésorerie** : Option C implémentée — tout bloqué 5 s, puis Trésorerie libérée en priorité si incomplet ; mention « Consolidation globale en cours » ; pas de badge vert. **Référence formelle :** SPEC §2.5 (ne pas simplifier sans accord produit).
5. **Opérationnel** : `RUNBOOK_COMPLETUDE_AVANT_AFFICHAGE.md` — démarrage, dépannage, rollback.
6. **Règles de gouvernance** : Timeout snapshot 5 s. Payload expected_count : exactement 5 sources, sinon 400.
7. **Performance** : Cache Vault 5 s sur `/ui/completeness-snapshot`.

---

## 8. Livrables annexes (2026-03-03)

| Document | Usage |
|----------|-------|
| `GUIDE_RECETTE_PHASE_DVIG.md` | Checklist recette manuelle pas à pas |
| `CONFIG_CRON_EXPECTED_COUNTS.md` | Paramètres Odoo pour CRON Expected Counts |
| `RUNBOOK_COMPLETUDE_AVANT_AFFICHAGE.md` | Mise en prod et dépannage |
| `DECISION_CARTE_TRESORERIE_BLOCAGE.md` | Option C : 5 s blocage puis Trésorerie en priorité |

---

*Rapport MOA — Complétude avant affichage — Sprint 1 + Sprint 2 + Phase DVIG + livrables recette.*
