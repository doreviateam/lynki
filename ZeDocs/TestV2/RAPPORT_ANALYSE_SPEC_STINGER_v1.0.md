# 📊 Rapport d'analyse — SPEC_STINGER_v1.0.md

**Date** : 2026-01-08  
**Analyseur** : Dorevia Team  
**Document analysé** : `ZeDocs/TestV2/SPEC_STINGER_v1.0.md`  
**Référence** : Architecture Dorevia v2.0

---

## 🎯 Résumé exécutif

Le document SPEC_STINGER présente une **vision globale correcte** de l'environnement STINGER, mais contient plusieurs **incohérences critiques** avec l'architecture Dorevia v2.0, notamment sur les hostnames DVIG/Vault et les conventions de nommage.

**Statut global** : ⚠️ **À corriger avant implémentation**

---

## ❌ Incohérences critiques avec l'architecture v2.0

### 1. Hostnames DVIG/Vault incorrects

**Problème** : Le document spécifie des hostnames avec l'environnement pour DVIG/Vault :

```text
❌ https://dvig.stinger.core.doreviateam.com
❌ https://vault.stinger.core.doreviateam.com
```

**Référence v2.0** : Selon `BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md` (migration complétée 2026-01-01), les services cœur (DVIG/Vault) **n'incluent PAS l'environnement** car ils sont **partagés par tenant**.

**Correctif requis** :

```text
✅ https://dvig.core.doreviateam.com
✅ https://vault.core.doreviateam.com
```

**Impact** : 🔴 **CRITIQUE** — Violation de l'architecture v2.0, migration DNS déjà effectuée.

---

### 2. Convention DNS non conforme

**Section 4 — URLs** : Les hostnames DVIG/Vault incluent `stinger` dans le FQDN.

**Référence** : `SPEC_Dorevia_Reference_v2.0.md` section 6 :

> **Services cœur** (DVIG/Vault) : `<service>.<tenant>.<domain>` (1 par tenant)

**Correctif** :

```markdown
### Core STINGER

- ✅ https://odoo.stinger.core.doreviateam.com
- ✅ https://dvig.core.doreviateam.com  (sans stinger)
- ✅ https://vault.core.doreviateam.com  (sans stinger)
```

---

### 3. Noms de containers incorrects

**Section 7 — Architecture** :

```text
❌ dvig_stinger_core
❌ vault_stinger_core
❌ odoo_core_stinger
```

**Convention v2.0** (référence : `SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` section 6.1) :

```text
✅ dvig-core          (Platform, sans env)
✅ vault-core         (Platform, sans env)
✅ odoo_stinger_core  (Apps, avec env)
```

**Correctif** :

```markdown
## 7. Architecture

Core (Platform) :
- dvig-core
- vault-core

Odoo core (Apps) :
- odoo_stinger_core
- odoo_db_stinger_core

Clients (Apps) :
- odoo_stinger_<tenant>
- odoo_db_stinger_<tenant>
```

---

### 4. Ports DVIG incorrects

**Section 6 — Reverse Proxy** :

```text
❌ DVIG → port 8000
```

**Référence** : `RESUME_FONCTIONNEMENT_PLATEFORME.md` section 2.1 :

```text
✅ DVIG → port 8080
```

**Correctif** :

```markdown
Chaque FQDN pointe vers :
- Odoo → port 8069
- DVIG → port 8080
- Vault → port 8080
```

---

## ⚠️ Problèmes de formatage et structure

### 1. Formatage Markdown cassé

**Lignes 3-6** : Utilisation de backslashes (`\`) pour les retours à la ligne :

```markdown
❌ Version: v1.0.0\
❌ Statut: Draft\
```

**Correctif** :

```markdown
**Version** : v1.0.0  
**Statut** : Draft  
**Date** : 2026-01-10  
**Auteur** : Dorevia Team
```

---

### 2. Formatage des listes incohérent

**Section 1 — Objectifs** : Liste non formatée correctement :

```markdown
❌ Objectifs : - Valider les flux Odoo → DVIG → Vault - Vérifier
```

**Correctif** :

```markdown
**Objectifs** :
- Valider les flux Odoo → DVIG → Vault
- Vérifier l'intégrité et la traçabilité
- Tester la génération des constats mensuels
- Tester la facturation MRR dans Odoo core
```

---

### 3. Section 11 — Formatage code cassé

**Ligne 90-95** : Formatage incohérent :

```markdown
❌ Odoo client\
→ DVIG\
```

**Correctif** :

```markdown
```
Odoo client
  → DVIG
  → Vault
  → Constat
  → Odoo core
  → Facture
```
```

---

## 📋 Éléments manquants

### 1. Configuration Odoo (proxy_mode)

**Manquant** : Aucune mention de `proxy_mode = True` dans la configuration Odoo.

**Référence** : `REX_INCIDENT_PDF_ODOO_CSS_BOOTSTRAP_v1.0.md` — Configuration critique pour les PDF.

**Recommandation** : Ajouter une section sur la configuration Odoo STINGER :

```markdown
## Configuration Odoo STINGER

Dans `tenants/<tenant>/apps/odoo/stinger/odoo.conf` :

```ini
proxy_mode = True
```

Paramètres DB requis :
- `web.base.url` = `https://odoo.stinger.<tenant>.doreviateam.com`
- `report.url` = `https://odoo.stinger.<tenant>.doreviateam.com`
```
```

---

### 2. Volumes Docker

**Manquant** : Aucune mention des volumes Docker nécessaires.

**Référence** : `SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` section 6.2.

**Recommandation** : Ajouter une section :

```markdown
## Volumes Docker

### Platform (partagés par tenant)
- `vault_db_<tenant>_data`
- `vault_storage_<tenant>`
- `vault_ledger_<tenant>`
- `vault_audit_<tenant>`

### Apps (par environnement)
- `odoo_stinger_<tenant>_db`
- `odoo_stinger_<tenant>_data`
- `oca_extra_addons` (partagé)
```

---

### 3. Tokens DVIG

**Manquant** : Aucune mention de la génération des tokens DVIG.

**Référence** : `SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` section 6.6-6.7.

**Recommandation** : Ajouter une section :

```markdown
## Tokens DVIG

Format source : `<univers>.stinger.<tenant>`

Exemples :
- `odoo.stinger.core`
- `odoo.stinger.sarl-la-platine`

Génération :
```bash
dorevia.sh token issue odoo stinger core
dorevia.sh token issue odoo stinger sarl-la-platine
```
```

---

### 4. Compose Projects

**Manquant** : Aucune mention des noms de projets Docker Compose.

**Référence** : `SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` section 6.4.

**Recommandation** : Ajouter :

```markdown
## Compose Projects

- Platform : `dorevia_<tenant>_platform`
- Apps : `dorevia_odoo_stinger_<tenant>`

Exemples :
- `dorevia_core_platform`
- `dorevia_odoo_stinger_core`
```

---

## ✅ Points positifs

1. **Vision globale correcte** : L'objectif et le périmètre sont clairs
2. **Concepts bien définis** : Distinction LAB/STINGER/PROD claire
3. **Flux global documenté** : Le flux Odoo → DVIG → Vault → Facture est bien décrit
4. **Sécurité mentionnée** : HTTPS, tokens, secrets séparés
5. **Backlog structuré** : Plan d'action clair

---

## 🔧 Recommandations de correction

### Priorité 1 — Critiques (bloquant)

1. **Corriger les hostnames DVIG/Vault** : Retirer `stinger` des FQDN
2. **Corriger les noms de containers** : Suivre les conventions v2.0
3. **Corriger le port DVIG** : 8080 au lieu de 8000

### Priorité 2 — Importantes (qualité)

4. **Corriger le formatage Markdown** : Retirer les backslashes, formater correctement
5. **Ajouter la configuration Odoo** : `proxy_mode`, URLs HTTPS
6. **Ajouter les volumes Docker** : Documentation complète
7. **Ajouter les tokens DVIG** : Processus de génération

### Priorité 3 — Améliorations (bonnes pratiques)

8. **Ajouter les compose projects** : Noms de projets Docker
9. **Détailler les endpoints Vault** : Documentation API complète
10. **Ajouter des exemples de commandes** : Scripts de déploiement

---

## 📝 Checklist de conformité v2.0

- [ ] Hostnames DVIG/Vault sans `<env>` (conforme v2.0)
- [ ] Hostnames Odoo avec `<env>` (conforme v2.0)
- [ ] Noms de containers conformes (Platform vs Apps)
- [ ] Ports corrects (DVIG/Vault : 8080, Odoo : 8069)
- [ ] Configuration Odoo complète (`proxy_mode`, URLs HTTPS)
- [ ] Volumes Docker documentés
- [ ] Tokens DVIG documentés
- [ ] Formatage Markdown correct
- [ ] Références aux documents v2.0

---

## 📎 Références utilisées

1. `ZeDocs/V2/BREAKING_CHANGE_HOSTNAMES_DVIG_VAULT.md` — Migration hostnames DVIG/Vault
2. `ZeDocs/SPEC_Dorevia_Reference_v2.0.md` — Architecture de référence v2.0
3. `ZeDocs/SPEC_IMPLEMENTATION_ACTUELLE_V1.0.md` — Conventions de nommage
4. `ZeDocs/V2/REX_INCIDENT_PDF_ODOO_CSS_BOOTSTRAP_v1.0.md` — Configuration Odoo
5. `ZeDocs/RESUME_FONCTIONNEMENT_PLATEFORME.md` — Architecture plateforme

---

**Conclusion** : Le document nécessite des corrections importantes pour être conforme à l'architecture Dorevia v2.0, notamment sur les hostnames DVIG/Vault et les conventions de nommage. Une fois corrigé, il pourra servir de référence pour le déploiement STINGER.

**Statut recommandé** : 🔴 **À réviser** avant validation
