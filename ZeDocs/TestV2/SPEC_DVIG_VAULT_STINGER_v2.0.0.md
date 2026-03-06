# SPEC — Ajout d’un couple DVIG+Vault STINGER (Pré-production isolée)

**Version** : v2.0.0  
**Statut** : VALIDÉ  
**Date** : 2026-01-10  
**Auteur** : Dorevia Team

---

## 1. Objectif

Mettre en place un second couple **DVIG + Vault dédié à STINGER** afin de :

- Simuler exactement le comportement de la PROD
- Tester sans aucun risque pour la production
- Valider flux, sécurité, constats, MRR
- Préparer sereinement les mises en production

👉 **La PROD existante n’est PAS modifiée.**

---

## 2. Architecture cible

### PROD (inchangée)

```
PROD
 ├─ dvig.core.doreviateam.com
 └─ vault.core.doreviateam.com

Clients PROD :
 - prod.sarl-la-platine.fr
 - (futur) prod.sweet-manihot.fr
```

Flux :
```
Odoo PROD → dvig.core → vault.core
```

### STINGER (nouveau couple dédié)

```
STINGER
 ├─ dvig.stinger.core.doreviateam.com
 └─ vault.stinger.core.doreviateam.com

Clients STINGER :
 - odoo.stinger.sarl-la-platine.doreviateam.com
 - odoo.stinger.sweet-manihot.doreviateam.com
```

Flux :
```
Odoo STINGER → dvig.stinger.core → vault.stinger.core
```

---

## 3. Périmètre

### Inclus
- Nouveau DVIG STINGER
- Nouveau Vault STINGER
- DNS, TLS, reverse proxy
- Secrets dédiés STINGER
- Volumes dédiés STINGER
- Sauvegardes STINGER

### Exclus
- Odoo core STINGER
- Migration PROD
- Haute dispo
- SSO
- Paiement réel

---

## 4. DNS

Créer :

```
dvig.stinger.core.doreviateam.com
vault.stinger.core.doreviateam.com

odoo.stinger.sarl-la-platine.doreviateam.com
odoo.stinger.sweet-manihot.doreviateam.com
```

---

## 5. Reverse proxy

| FQDN | Service | Port |
|------|----------|------|
| dvig.stinger.core | DVIG | 8080 |
| vault.stinger.core | Vault | 8080 |
| odoo.stinger.* | Odoo | 8069 |

Headers requis :
```
X-Forwarded-Proto: https
Host: <fqdn>
```

---

## 6. Containers

### STINGER
- dvig_stinger_core
- vault_stinger_core
- vault_db_stinger_core

### PROD (existant)
- dvig_core
- vault_core
- vault_db_core

---

## 7. Volumes

### STINGER
- vault_db_stinger_core_data
- vault_storage_stinger_core
- vault_ledger_stinger_core
- vault_audit_stinger_core
- dvig_logs_stinger_core

### PROD
- vault_db_core_data
- vault_storage_core
- vault_ledger_core
- vault_audit_core
- dvig_logs_core

---

## 8. Bases de données

| Environnement | Base |
|---------------|------|
| PROD | dorevia_vault_prod |
| STINGER | dorevia_vault_stinger |

---

## 9. Tokens DVIG

Fichiers :
```
tenants/core/secrets/dvig.prod.tokens.yml
tenants/core/secrets/dvig.stinger.tokens.yml
```

Format source :
```
<univers>.<env>.<tenant>
```

---

## 10. DVIG STINGER

| Élément | Valeur |
|--------|--------|
| Container | dvig_stinger_core |
| Port | 8080 |
| URL | https://dvig.stinger.core.doreviateam.com |
| Tokens | dvig.stinger.tokens.yml |

---

## 11. Vault STINGER

| Élément | Valeur |
|--------|--------|
| Container | vault_stinger_core |
| DB | dorevia_vault_stinger |
| URL | https://vault.stinger.core.doreviateam.com |
| Port | 8080 |

---

## 12. Odoo STINGER

| Client | URL |
|--------|-----|
| La Platine | odoo.stinger.sarl-la-platine.doreviateam.com |
| Sweet ManiHot | odoo.stinger.sweet-manihot.doreviateam.com |

Config :
```
VAULT_URL=https://dvig.stinger.core.doreviateam.com
SOURCE=odoo.stinger.<tenant>
TOKEN=token_stinger_xxx
```

---

## 13. Flux

```
Odoo STINGER
 → DVIG STINGER
   → Vault STINGER
     → Constat
       → Odoo STINGER
```

---

## 14. Sécurité

- TLS obligatoire
- Tokens séparés
- DVIG refuse mismatch env
- Volumes isolés

---

## 15. Sauvegardes

- Dump quotidien
- Snapshot volumes
- Rétention 14 jours

---

## 16. Commandes

```bash
dorevia.sh platform up core stinger
dorevia.sh token issue odoo stinger sarl-la-platine
dorevia.sh token issue odoo stinger sweet-manihot
```

---

## 17. Décisions

- PROD inchangée
- STINGER isolé
- Pas de mutualisation
- Pas de refonte plateforme

---

## 18. Backlog

1. DNS
2. Proxy
3. Déploiement DVIG
4. Déploiement Vault
5. DB
6. Tokens
7. Paramétrage Odoo
8. Tests

---

## 19. Conclusion

Architecture claire :

- 1 couple PROD
- 1 couple STINGER
- Isolation totale
- Scalabilité future
