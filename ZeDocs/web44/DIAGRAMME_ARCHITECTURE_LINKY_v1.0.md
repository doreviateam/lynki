# Diagramme — Architecture Linky

**Version :** 1.0  
**Date :** 13 mars 2026  
**Usage :** Site, documentation, investisseurs, équipe dev

---

## 1. Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SYSTÈMES MÉTIERS (émetteurs)                         │
│                                                                          │
│   ┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────────────┐  │
│   │   ERP    │   │   POS    │   │  Facturation │   │    Paiements     │  │
│   │  (Odoo)  │   │          │   │              │   │                  │  │
│   └────┬─────┘   └────┬─────┘   └──────┬───────┘   └────────┬─────────┘  │
│        │              │                │                    │             │
│        └──────────────┴────────────────┴────────────────────┘             │
│                                    │                                      │
│                          événements financiers                            │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DVIG                                          │
│              (collecte, normalisation, routage)                          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     DOREVIA VAULT                                        │
│                                                                          │
│   Registre financier probant • Événements scellés • Preuves              │
│   Source unique de vérité financière                                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   COUCHE MÉTRIQUES (Linky)                               │
│                                                                          │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │  Base Metrics    │     │ Derived Metrics  │     │ Metric Engine    │  │
│   │  (sum, balance) │ ──► │ (BFR, EBE)       │ ◄── │ (scheduling,    │  │
│   │  metric_class:  │     │ metric_class:    │     │  cache, API)    │  │
│   │  base           │     │ derived          │     │                  │  │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   COUCHE INSTRUMENTS (Linky)                             │
│                                                                          │
│   Instrument = vue calculée d'événements Vault                            │
│   12 instruments • Tuiles • Cards détaillées                             │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     LINKY COCKPIT                                        │
│                                                                          │
│   Terminal de lecture du registre financier probant                       │
│   Interface d'observation et d'analyse financière                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Principe clé

> **Les systèmes métiers (ERP, POS) ne constituent pas la source de vérité.**  
> Ils sont uniquement **émetteurs d'événements financiers** vers le Vault via DVIG.

---

## 3. Couches

| Couche | Rôle |
|--------|------|
| **Systèmes métiers** | Émettent des événements financiers |
| **DVIG** | Collecte, normalise, route vers le Vault |
| **Vault** | Enregistre, scelle, constitue la source unique de vérité |
| **Metric Layer** | Calcule les métriques (base + dérivées) |
| **Instrument Layer** | Agrège les métriques en instruments |
| **Cockpit** | Affiche les tuiles et cards |

---

## 4. Spécifications associées

| Document | Rôle |
|----------|------|
| `SPEC_LINKY_COCKPIT_INSTRUMENTS_v1.0.md` | Instruments, grille, UX |
| `SPEC_LINKY_INSTRUMENT_MODEL_v1.0.md` | Modèle structurel des instruments |
| `SPEC_LINKY_METRIC_REGISTRY_v1.0.md` | Registre des métriques |
| `SPEC_DVIG_EVENT_REGISTRY_v1.0.md` | Nomenclature des événements (à créer) |

---

*Document de référence architecture*
