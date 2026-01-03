# 🔒 Préconisations — Points à Verrouiller (CORE tenant + DVIG/Vault partagés)

**Version**: v1.0  
**Date**: 2025-01-28  
**Contexte**: État d'implémentation "SPEC CORE Tenant + dorevia.sh" (phases 0–2 terminées)

---

## 0) Résumé Exécutif

L'implémentation est saine. Les seuls risques significatifs identifiés sont :

1. **Image Vault en `latest`** (risque de casse silencieuse, surtout avec services partagés)
2. **Deux sources de vérité pour les tokens DVIG** (dérive inévitable)
3. **Routage Caddy → DVIG : port interne à figer** (piège classique)

Ce document décrit les corrections minimales à appliquer (2–10 lignes chacune).

---

## 1) Verrouiller les Versions : Interdire `latest` pour Vault (et idéalement pour DVIG/Vault en CORE)

### Problème

La plateforme CORE (DVIG/Vault partagés) sert LAB/STINGER/PROD.  
Une image `latest` peut évoluer sans commit, entraînant une régression "fantôme".

### Préconisation (normative)

- **CORE**: DVIG/Vault doivent être **taggés**.
- `latest` est tolérable uniquement en contexte LAB local, pas en CORE partagé.

### Actions

- [x] Remplacer `dorevia/vault:latest` par `dorevia/vault:<tag>` (ex: `dorevia/vault:v1.3.0`)
- [ ] Conserver l'historique des tags utilisés (ex: dans `tenants/core/state/manifest.json`)

### Critère d'Acceptation

- [ ] `docker inspect vault-core` montre une image taggée (≠ latest)

---

## 2) Unifier la Source de Vérité des Tokens DVIG

### Problème

Tu as actuellement :
- `sources/dvig/conf/tokens.yml` (historique / conf)
- `tenants/core/secrets/dvig.tokens.yml` (secrets)

À terme, ces deux fichiers vont diverger.

### Préconisation (normative)

- **Source de vérité unique** : `tenants/<tenant>/secrets/dvig.tokens.yml`
- `sources/dvig/conf/tokens.yml` devient :
  - soit un **template** (`tokens.yml.template`)
  - soit un **exemple** documenté
  - mais **jamais** un fichier "actif" en runtime

### Actions

- [ ] Mettre à jour le `docker-compose.yml` DVIG pour monter **uniquement** :
  - `tenants/core/secrets/dvig.tokens.yml` → `/etc/dvig/tokens.yml:ro`
- [ ] Renommer `sources/dvig/conf/tokens.yml` → `sources/dvig/conf/tokens.yml.template` (ou le laisser mais non utilisé)
- [ ] Ajouter un commentaire clair dans la doc / compose : "runtime tokens = tenants/<tenant>/secrets/*"

### Critère d'Acceptation

- [ ] Un seul fichier alimente DVIG en runtime
- [ ] Rotation/révocation via `dorevia.sh token ...` ne modifie qu'un seul fichier

---

## 3) Figer le Port Interne DVIG derrière Caddy (cohérence réseau)

### Problème

Caddy route `dvig.core...` → `dvig-core:8080`.  
Si DVIG écoute sur un autre port interne, tu peux avoir :
- des accès locaux OK,
- mais la route HTTPS cassée.

### Préconisation (normative)

- Choisir **un port interne unique** pour DVIG (ex: `8080`) et l'utiliser partout :
  - DVIG container `PORT=8080` (ou config équivalente)
  - healthcheck sur `http://localhost:8080/health`
  - Caddy reverse_proxy vers `dvig-core:8080`

### Actions

- [ ] Vérifier le port réellement écouté dans le conteneur DVIG
- [ ] Aligner :
  - DVIG config
  - docker-compose
  - healthcheck
  - Caddyfile

### Critère d'Acceptation

- [ ] `curl -k https://dvig.core.doreviateam.com/health` retourne 200
- [ ] Aucune dépendance aux ports hôte (mode DNS-only)

---

## 4) Bonus Recommandé : Cohérence de Date & Journal

### Observation

Ton journal d'état affiche une date `2025-01-28`.  
Si c'est volontaire (journal interne), OK. Sinon, corriger pour éviter confusion future.

### Action

- [ ] Harmoniser les dates dans les docs (ISO `YYYY-MM-DD`) et la timezone.

---

## 5) Plan d'Application (ordre conseillé)

1. **(immédiat)** Remplacer `vault:latest` par un tag
2. **(immédiat)** Unifier la source de vérité tokens + montage unique
3. **(immédiat)** Vérifier/figer le port DVIG derrière Caddy
4. (ensuite) Continuer Phase 3 → 6 de `dorevia.sh`

---

**Fin du document**

