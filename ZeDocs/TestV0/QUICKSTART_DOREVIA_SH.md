# `dorevia.sh` — Quickstart (1 page)
**Version** : 1.0  
**Date** : 2025-12-28 (Europe/Paris)  
**Cible** : démarrer/arrêter rapidement la plateforme CORE (gateway + platform + app) et gérer les tokens DVIG.

---

## 0) Pré-requis
- Docker + Docker Compose installés
- DNS opérationnel (ex : `odoo.lab.core.doreviateam.com`, `dvig.core.doreviateam.com`)
- Réseau Docker global : `dorevia-network` (créé automatiquement par `gateway up`)
- Tokens : `tenants/<tenant>/secrets/dvig.tokens.yml` (hors Git)

Vérifier :
```bash
dorevia.sh doctor
```

---

## 1) Démarrage complet (LAB)
```bash
# 1) Gateway (globale)
dorevia.sh gateway up
dorevia.sh gateway status

# 2) Platform (par tenant)
dorevia.sh platform up core
dorevia.sh platform status core

# 3) App (par univers/env/tenant)
dorevia.sh app up odoo lab core
dorevia.sh app status odoo lab core
```

URLs attendues :
- `https://odoo.lab.core.doreviateam.com`
- `https://dvig.core.doreviateam.com`
- `https://vault.core.doreviateam.com`

---

## 2) Démarrage STINGER / PROD
```bash
dorevia.sh app up odoo stinger core
dorevia.sh app up odoo prod core
```

---

## 3) Tokens DVIG (issue / rotate / revoke)

### Créer un token (affiché UNE SEULE FOIS)
```bash
dorevia.sh token issue odoo lab core
```

### Rotation (overlap par défaut)
```bash
dorevia.sh token rotate odoo prod core
```

### Rotation avec révocation immédiate de l'ancien token
```bash
dorevia.sh token rotate odoo prod core --revoke-old
```

### Révoquer un token
```bash
dorevia.sh token revoke core tok_lab_core_001
```

Lister :
```bash
dorevia.sh token list core
```

---

## 4) Reset / Destroy (opérations destructives)

### Reset complet (DB + volumes) — nécessite `--purge`
```bash
dorevia.sh app reset odoo lab core --purge
dorevia.sh app up odoo lab core
```

### Détruire app (containers/networks, + volumes si `--purge`)
```bash
dorevia.sh app destroy odoo lab core --purge
```

### Détruire platform (DVIG/Vault, + volumes si `--purge`)
```bash
dorevia.sh platform destroy core --purge
```

---

## 5) Invariants (si ça casse, c'est souvent ici)
- env ∈ `lab|stinger|prod` (pas `prd`)
- univers v1.0 = `odoo`
- source stricte : `<univers>.<env>.<tenant>` (ex `odoo.prod.core`)
- STINGER/PROD : images **taggées** (pas `latest`)
- Tokens runtime : **uniquement** `tenants/<tenant>/secrets/dvig.tokens.yml`

---

## 6) Dépannage express
- `E03` : Docker/Compose manquant → installer/activer
- `E04` : platform down → `platform up <tenant>`
- `E06` : destructive sans `--purge` → ajouter le flag
- Si HTTPS ne route pas :
  - `dorevia.sh gateway status`
  - vérifier que les containers sont sur `dorevia-network`

---

**Fin Quickstart**

