# Décision produit — Carte Trésorerie et blocage complétude

**Référence :** PLAN_IMPLEMENTATION_COMPLETUDE_AVANT_AFFICHAGE_v1.1 §2.5, §3.3  
**Statut :** ✅ Option C implémentée (2026-03-03)  
**Date :** 2026-03-03

---

## Contexte

Le principe « aucune carte si incomplétude » bloque **toutes** les cartes tant que la complétude n'est pas validée. La carte Trésorerie (position à date) peut rester utile pour le pilotage quotidien même si les flux sont encore en cours de synchronisation.

---

## Options

| Option | Description | Effet |
|--------|-------------|-------|
| **A — Blocage strict** | Toutes les cartes bloquées tant que complétude non validée | Cohérence maximale |
| **B — Trésorerie toujours visible** | Trésorerie visible même si incomplet | Moins de cohérence stricte |
| **C — Libération après 5 s** | Tout bloqué 5 s, puis Trésorerie libérée en priorité | **Implémenté** — compromis délai acceptable + pilotage |

---

## Option C (implémentée)

- **0–5 s** : Tout bloqué (SyncInProgress).
- **Après 5 s** si toujours incomplet : carte Trésorerie position visible ; mention « Consolidation globale en cours » ; autres cartes bloquées.
- **Si complétude atteinte** : toutes les cartes affichées (sans refresh).
- **Badge** : pas de badge vert tant que incomplet.

**Référence formelle :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1 §2.5 — ne pas simplifier sans accord produit.

**Constante :** `TREASURY_UNBLOCK_AFTER_MS = 5000` dans `DashboardWithFilters.tsx`.

---

*Document à usage MOA — Complétude avant affichage.*
