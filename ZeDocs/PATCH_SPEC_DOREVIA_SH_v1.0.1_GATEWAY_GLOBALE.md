# PATCH SPEC — `dorevia.sh` — v1.0 → v1.0.1 (Gateway globale)
**Version**: v1.0.1  
**Date**: 2025-12-28 (Europe/Paris)  
**Objet**: Alignement SPEC ↔ implémentation : **Caddy (gateway) devient global**, géré par `dorevia.sh` via un namespace `gateway`.  
**Référence**: SPEC `dorevia.sh` v1.0 + état d'implémentation (Caddy dans `units/gateway/`, platform DVIG/Vault dans `tenants/<tenant>/platform/`)

---

## 1) Pourquoi ce patch

La SPEC v1.0 positionne "reverse proxy (Caddy)" dans les **platform services (par tenant)**.

L'implémentation (et la trajectoire multi-tenant) convergent naturellement vers :
- **un seul Caddy global** qui route vers *tous* les tenants (DVIG/Vault) et leurs apps (Odoo lab/stinger/prod),
- afin d'éviter duplication, complexité TLS, et points de panne.

Ce patch met la SPEC en conformité avec cette réalité, **sans perdre l'objectif** : `dorevia.sh` reste l'orchestrateur unique.

---

## 2) Changement d'architecture (normatif)

### 2.1 Nouveau modèle en 3 couches

**Couche 0 — Gateway (globale)**
- **Caddy** (TLS + routage)
- Unique pour la plateforme (tous tenants)

**Couche 1 — Platform (par tenant)**
- DVIG
- Vault
- Vault DB (si applicable)
- Connectés au réseau global de routage

**Couche 2 — Apps (par tenant + univers + env)**
- Odoo (lab/stinger/prod)
- Connectés au réseau global de routage

### 2.2 Règle réseau (invariant)

Un réseau Docker externe global est requis, par défaut :
- `dorevia-network`

**Doivent être connectés à `dorevia-network`:**
- `gateway-caddy`
- `dvig-<tenant>` / `vault-<tenant>` (ou `dvig-core`, `vault-core` pour tenant `core`)
- `odoo_<env>_<tenant>` (ou services équivalents)

---

## 3) Modifications à apporter à la SPEC v1.0 (diff sémantique)

### 3.1 Section "Modèle d'architecture plateforme" (v1.0 §5.1)

**Avant (v1.0)**  
Platform services (par tenant) :
- reverse proxy (Caddy)
- DVIG
- Vault

**Après (v1.0.1) — NORMATIF**  
Gateway services (globaux) :
- reverse proxy (Caddy)

Platform services (par tenant) :
- DVIG
- Vault
- (Vault DB / stockage)

Apps (par tenant + univers + env) :
- Odoo lab/stinger/prod

### 3.2 Invariants

Ajouter l'invariant suivant :

- Toute commande `platform up` ou `app up` **DOIT** échouer si la gateway globale n'est pas opérationnelle, sauf si un flag explicite `--no-gateway-check` est utilisé (réservé aux tests locaux).

---

## 4) Modifications CLI — Ajout du namespace `gateway`

### 4.1 Nouvelles commandes (v1.0.1)

```bash
dorevia.sh gateway up
dorevia.sh gateway status
dorevia.sh gateway down
dorevia.sh gateway reload
```

**Objectif**
- piloter `units/gateway/` (Caddy) via `dorevia.sh`
- rendre l'infrastructure "globale" **non manuelle**

### 4.2 Contrats de sortie (recommandé)

- `gateway status` affiche :
  - état du container `gateway-caddy`
  - présence réseau `dorevia-network`
  - résumé des hosts routés (optionnel)

---

## 5) Modifications CLI — `platform` et `app` (comportement)

### 5.1 `platform up <tenant>`

**Nouveau prérequis**
- `gateway status` doit être OK (par défaut)

**Responsabilité**
- démarre uniquement DVIG/Vault (+ db vault)
- s'assure que les services sont connectés à `dorevia-network`

### 5.2 `app up <univers> <env> <tenant>`

**Nouveau prérequis**
- `gateway status` OK
- `platform status <tenant>` OK

---

## 6) Structure de répertoires (mise à jour)

### 6.1 Root repo

Ajouter une couche gateway explicite :

```
dorevia-platform/
  bin/
    dorevia.sh
  units/
    gateway/                 # Caddy global (TLS+routage)
  tenants/
    <tenant>/
      platform/              # DVIG/Vault par tenant
      apps/
        <univers>/
          <env>/
      secrets/
      state/
```

---

## 7) Conséquences (compatibilité)

### 7.1 Compatibilité ascendante

- Les commandes `platform` et `app` restent identiques.
- On ajoute `gateway` sans casser l'existant.

### 7.2 Impacts d'implémentation

- Implémenter `gateway up/status/down/reload` (wrapper docker compose sur `units/gateway/`)
- Mettre à jour `doctor` :
  - check existence `units/gateway/docker-compose.yml`
  - check réseau `dorevia-network`

---

## 8) Critères d'acceptation (v1.0.1)

1. `dorevia.sh gateway up` démarre Caddy global.
2. `dorevia.sh gateway status` retourne OK et montre le réseau `dorevia-network`.
3. `dorevia.sh platform up core` démarre DVIG/Vault et les connecte au réseau global.
4. `dorevia.sh app up odoo lab core` démarre Odoo LAB et le connecte au réseau global.
5. `curl -k https://dvig.core.doreviateam.com/health` fonctionne via Caddy.
6. `curl -k https://odoo.lab.core.doreviateam.com` fonctionne via Caddy.
7. `dorevia.sh app up ...` échoue si `gateway` est down (sauf `--no-gateway-check`).

---

## 9) Historique

- v1.0.1 (2025-12-28): introduction de la gateway globale (Caddy) gérée par `dorevia.sh` via namespace `gateway`. Alignement SPEC ↔ implémentation.

---

**Fin du patch**

