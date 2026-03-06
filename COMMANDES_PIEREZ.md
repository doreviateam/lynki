# 📋 Guide Opérationnel — Projet « pierez »  
## Plateforme Dorevia — Version améliorée (v1.1)

**Date** : 2026-01-02  
**Projet** : pierez  
**Audience** :  
- Opérateurs Dorevia  
- Partenaires techniques  
- Clients accompagnés (avec prestataire ou support Dorevia)

**Objectif** :  
Fournir un **guide complet, fiable et opposable** pour créer, déployer, exploiter et restaurer le tenant **pierez** sur la plateforme Dorevia.

---

## 🧭 À lire avant de commencer (important)

Ce document décrit **le chemin opérationnel complet**, y compris des commandes avancées.  

👉 **Vous n'avez pas besoin d'exécuter toutes les commandes** pour un usage standard.  
👉 Les sections sont organisées du **plus simple** au **plus avancé**.

### 🟢 Chemin recommandé (Golden Path)
Pour un premier déploiement standard :

```
validate → prompt → render → preflight → apply → status
```

Les autres commandes servent à :
- des cas avancés (serveur client, domaine client),
- la maintenance,
- la restauration après incident.

---

## 👥 Qui fait quoi ? (clarification des responsabilités)

| Acteur | Responsabilités |
|------|----------------|
| **Client** | Choix du domaine, configuration DNS, validation métier |
| **Dorevia** | CLI, orchestration, sécurité, backups, support |
| **Prestataire IT** (si présent) | Serveur, accès SSH, réseau |

> ⚠️ Dorevia ne peut **pas modifier les DNS** d'un domaine client sans accès explicite.

---

## 🚀 Création du Tenant « pierez »

### ℹ️ Note importante
Les étapes ci-dessous montrent la **structure attendue**.  
👉 Lorsque la commande `tenant create` est disponible, elle est **préférable**.

---

### 1. Création de la structure minimale

```bash
mkdir -p tenants/pierez/{state,secrets,platform,apps/odoo/{lab,stinger,prod}}
```

---

### 2. Création du manifest.json

```bash
cat > tenants/pierez/state/manifest.json << 'EOF'
{
  "version": "1.0",
  "tenant_id": "pierez",
  "created_at": "2026-01-02T00:00:00Z",
  "universes": ["odoo"],
  "environments": ["lab", "stinger", "prod"],
  "domain_mode": "saas",
  "units": {
    "platform": ["dvig", "vault", "postgres"],
    "odoo": ["odoo", "postgres"]
  },
  "secrets_refs": {
    "dvig_tokens": "tenants/pierez/secrets/dvig.tokens.yml"
  },
  "images": {
    "dvig": "dorevia/dvig:0.1.2-auth",
    "vault": "dorevia/vault:v1.3.0",
    "odoo": "odoo:18.0-20250819",
    "postgres": "postgres:16"
  }
}
EOF
```

---

### 3. Fichier de secrets DVIG

```bash
cat > tenants/pierez/secrets/dvig.tokens.yml << 'EOF'
# Tokens DVIG pour le tenant pierez
# Générés via : dorevia.sh token issue <univers> <env> pierez
EOF
```

---

## ✅ Validation

```bash
dorevia.sh validate pierez
```

✔ Vérifie la **cohérence** du tenant  
✔ Ne liste pas les tenants existants  

---

## 🎛️ Configuration interactive (recommandé)

```bash
dorevia.sh prompt pierez --env prod
```

Cette commande :
- pose des questions simples,
- génère un fichier `intent-*.json`,
- évite les erreurs manuelles.

---

## 🎨 Génération des fichiers

```bash
dorevia.sh render pierez --env prod
```

📂 Résultat :
```
tenants/pierez/rendered/prod/
```

---

## 🔍 Préflight (avant déploiement)

```bash
dorevia.sh preflight pierez --env prod
```

Vérifie :
- Docker
- ports
- fichiers
- cohérence générale

### 🌐 Vérification DNS (Phase 3)
```bash
dorevia.sh preflight pierez --env prod --check-dns
```

---

## 🚀 Déploiement (SaaS Dorevia)

```bash
dorevia.sh apply pierez --env prod --auto-gateway
```

➡️ Déploie l'application  
➡️ Recharge automatiquement la gateway

---

## 🔑 Gestion des tokens DVIG

### Création
```bash
dorevia.sh token issue odoo prod pierez
```

📌 Les tokens :
- sont stockés dans `tenants/pierez/secrets/`
- sont consommés automatiquement par l'application
- doivent être régénérés en cas d'incident

---

## 📊 Vérification du statut

```bash
dorevia.sh app status odoo prod pierez
```

---

## 🌐 Domaine client (Phase 3)

### Configuration
```bash
dorevia.sh prompt pierez --env prod
# Choisir mode Client ou Hybride
# Saisir le domaine (ex: pierez.fr)
```

### Vérification DNS
```bash
dorevia.sh preflight pierez --env prod --check-dns
```

---

## 🖥️ Serveur client (Phase 3)

### 1. Ajouter le serveur
```bash
dorevia.sh server add pierez-serveur
```

Éditer :
```
servers/pierez-serveur.json
```

### 2. Préflight serveur
```bash
dorevia.sh server preflight pierez-serveur
```

### 3. Déploiement
```bash
dorevia.sh platform up pierez --server pierez-serveur
dorevia.sh app up odoo prod pierez --server pierez-serveur
```

---

## 💾 Backup & Restore (Phase 3)

### Backup
```bash
dorevia.sh backup pierez --server pierez-serveur
```

### Restore
```bash
dorevia.sh restore pierez --server pierez-serveur --from backups/backup-pierez-<timestamp>
```

✔ Volumes Vault  
✔ Bases  
✔ Secrets chiffrés  

---

## 🛠️ Maintenance

### Arrêt
```bash
dorevia.sh app down odoo prod pierez
```

### Redémarrage Gateway
```bash
dorevia.sh gateway aggregate --reload
```

---

## 🏭 Processus de production (optionnel)

```bash
dorevia.sh production pierez
```

Ou phase par phase :
```bash
dorevia.sh production pierez --phase 1
```

---

## 🧾 URLs générées (SaaS)

- Odoo PROD  
  https://odoo.prod.pierez.doreviateam.com
- DVIG  
  https://dvig.pierez.doreviateam.com
- Vault  
  https://vault.pierez.doreviateam.com

---

## 📚 Documentation associée

- GUIDE_PHASE1.md  
- GUIDE_PHASE2.md  
- GUIDE_PHASE3.md  
- RUNBOOK_DOMAINES_CLIENTS.md  
- RUNBOOK_SERVEUR_CLIENT.md  

---

## 🏁 Conclusion

Ce guide constitue :
- un **runbook opérateur**
- une **base contractuelle technique**
- un **référentiel d'exploitation**

👉 Il est **opposable**, **réplicable**, et **sécurisé**.

---

**Version** : 1.1  
**Statut** : Validé pour usage réel
