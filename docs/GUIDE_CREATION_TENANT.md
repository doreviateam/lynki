# 📘 Guide de Création d'un Nouveau Tenant (ex: `dido`)
**Version** : v1.1  
**Date** : 2025-12-28 (Europe/Paris)  
**Plateforme** : Dorevia Platform — `dorevia.sh` (gateway globale + platform par tenant + apps par env)

> ⚠️ Note importante (termes)  
> - **DNS** = enregistrements chez le registrar (OVH/Cloudflare/IONOS…) pointant vers l'IP du serveur.  
> - **Caddyfile** = **routage HTTPS** (reverse proxy) au niveau de la gateway globale.  
> Dans ce guide, on sépare clairement ces deux sujets.

---

## 🎯 Vue d'ensemble (ordre recommandé)

1. **Préparer le routage Gateway (Caddyfile)** pour le tenant (et recharger Caddy)
2. **Créer l'arborescence** `tenants/<tenant>/...` (si `platform up` ne le fait pas déjà)
3. **Créer les tokens DVIG** (LAB/STINGER/PROD)
4. **Démarrer la platform** (`dvig` + `vault`) du tenant
5. **Démarrer les apps** (Odoo LAB/STINGER/PROD)
6. **Valider** : URLs, isolation, tokens, logs

---

## ✅ Pré-requis

- Docker + Docker Compose OK
- `dorevia.sh` accessible (`bin/dorevia.sh`)
- Gateway globale opérationnelle :
  ```bash
  dorevia.sh gateway status
  ```
- Conventions respectées :
  - env ∈ `lab|stinger|prod`
  - univers v1.x : `odoo`
  - source stricte : `<univers>.<env>.<tenant>` (ex: `odoo.lab.dido`)

---

## 1) Gateway — Ajouter le routage (Caddyfile)

### 1.1 Modifier le Caddyfile
Fichier : `units/gateway/Caddyfile`

Convention :
- Apps : `<application>.<environnement>.<tenant>.doreviateam.com`
- Services partagés : `dvig.<tenant>.doreviateam.com` et `vault.<tenant>.doreviateam.com`

Exemple (tenant `dido`) :

```caddyfile
# Odoo - Environnements (tenant dido)
odoo.lab.dido.doreviateam.com {
  reverse_proxy odoo_lab_dido:8069
}

odoo.stinger.dido.doreviateam.com {
  reverse_proxy odoo_stinger_dido:8069
}

odoo.prod.dido.doreviateam.com {
  reverse_proxy odoo_prod_dido:8069
}

# Services partagés (tenant dido)
dvig.dido.doreviateam.com {
  reverse_proxy dvig-dido:8080
}

vault.dido.doreviateam.com {
  reverse_proxy vault-dido:8080
}
```

> ⚠️ Important  
> Les noms `odoo_lab_dido`, `dvig-dido`, etc. doivent **correspondre exactement** aux noms de services/containers créés par `dorevia.sh`.  
> Si ton implémentation utilise une autre convention (`odoo_lab_<tenant>` vs `odoo_<env>_<tenant>`), aligne le Caddyfile sur la convention **réelle**.

### 1.2 Recharger Caddy
```bash
dorevia.sh gateway reload
```

Fallback (si reload non supporté) :
```bash
dorevia.sh gateway down
dorevia.sh gateway up
```

### 1.3 DNS — Vérifier les enregistrements (registrar)
À faire **chez ton registrar** (pas dans Caddy). Chaque FQDN doit pointer vers l'IP du serveur :

- `odoo.lab.dido.doreviateam.com`
- `odoo.stinger.dido.doreviateam.com`
- `odoo.prod.dido.doreviateam.com`
- `dvig.dido.doreviateam.com`
- `vault.dido.doreviateam.com`

---

## 2) Créer la structure de répertoires du tenant

> Si `dorevia.sh platform up <tenant>` génère déjà cette structure, cette étape peut être facultative.

```bash
mkdir -p tenants/dido/platform
mkdir -p tenants/dido/apps/odoo/lab
mkdir -p tenants/dido/apps/odoo/stinger
mkdir -p tenants/dido/apps/odoo/prod
mkdir -p tenants/dido/secrets
mkdir -p tenants/dido/state
```

Structure attendue :

```
tenants/dido/
├── platform/           # compose + conf DVIG/Vault
├── apps/
│   └── odoo/
│       ├── lab/
│       ├── stinger/
│       └── prod/
├── secrets/            # dvig.tokens.yml (hors Git)
└── state/              # manifest.json (versions)
```

### 2.1 Vérifier `.gitignore`
Doit contenir :
```
tenants/*/secrets/
```

---

## 3) Tokens DVIG (LAB/STINGER/PROD)

### 3.1 Fichier tokens initial
Créer `tenants/dido/secrets/dvig.tokens.yml` :

```yaml
version: 1
# Tokens DVIG - Tenant DIDO
# Règle : tenant DVIG DOIT correspondre exactement au tenant DNS
# Format source : univers.env.tenant (ex: odoo.lab.dido)

tokens: []
```

### 3.2 Générer les tokens (recommandé via CLI)
```bash
dorevia.sh token issue odoo lab dido
dorevia.sh token issue odoo stinger dido
dorevia.sh token issue odoo prod dido
```

⚠️ Sécurité :
- le token clair est affiché **UNE SEULE FOIS**
- stocke-le immédiatement (gestionnaire de secrets / coffre / fichier sécurisé)

### 3.3 Vérifier
```bash
dorevia.sh token list dido
```

Attendu :
- `odoo.lab.dido` (tenant: `dido`)
- `odoo.stinger.dido` (tenant: `dido`)
- `odoo.prod.dido` (tenant: `dido`)

---

## 4) Démarrer la Platform du tenant (DVIG/Vault)

### 4.1 Vérifier les prérequis
```bash
dorevia.sh gateway status
dorevia.sh doctor
```

### 4.2 Démarrer
```bash
dorevia.sh platform up dido
```

Attendu :
- containers : `dvig-dido`, `vault-dido`, `vault-db-dido`
- réseau : `dorevia-network`

### 4.3 Vérifier
```bash
dorevia.sh platform status dido
```

URLs attendues :
- `https://dvig.dido.doreviateam.com`
- `https://vault.dido.doreviateam.com`

---

## 5) Démarrer les Applications (Odoo)

> Convention recommandée DB : `odoo_<env>_<tenant>` (ex: `odoo_lab_dido`)  
> Convention recommandée volumes : `odoo_<env>_<tenant>_data`, `odoo_<env>_<tenant>_db`

### 5.1 Odoo LAB
```bash
dorevia.sh app up odoo lab dido
```
URL : `https://odoo.lab.dido.doreviateam.com`

### 5.2 Odoo STINGER
```bash
dorevia.sh app up odoo stinger dido
```
URL : `https://odoo.stinger.dido.doreviateam.com`

### 5.3 Odoo PROD
```bash
dorevia.sh app up odoo prod dido
```

⚠️ PROD :
- images **taggées** (pas `latest`)
- secrets verrouillés
- sauvegardes activées

URL : `https://odoo.prod.dido.doreviateam.com`

### 5.4 Vérifier
```bash
dorevia.sh app status odoo lab dido
dorevia.sh app status odoo stinger dido
dorevia.sh app status odoo prod dido
```

---

## ✅ Checklist de validation (à cocher)

### Gateway + DNS
- [ ] Entrées ajoutées dans `units/gateway/Caddyfile`
- [ ] `dorevia.sh gateway reload` OK
- [ ] Enregistrements DNS (registrar) pointent vers le serveur

### Structure
- [ ] `tenants/dido/` créé (platform/apps/secrets/state)
- [ ] `.gitignore` ignore `tenants/*/secrets/`

### Tokens
- [ ] Token LAB créé : `odoo.lab.dido`
- [ ] Token STINGER créé : `odoo.stinger.dido`
- [ ] Token PROD créé : `odoo.prod.dido`
- [ ] Tokens stockés en sécurité (hors repo)

### Platform
- [ ] `dorevia.sh platform up dido` OK
- [ ] `dorevia.sh platform status dido` OK
- [ ] `https://dvig.dido.doreviateam.com` accessible
- [ ] `https://vault.dido.doreviateam.com` accessible

### Applications
- [ ] `dorevia.sh app up odoo lab dido` OK
- [ ] `dorevia.sh app up odoo stinger dido` OK
- [ ] `dorevia.sh app up odoo prod dido` OK
- [ ] `https://odoo.lab.dido.doreviateam.com` accessible
- [ ] `https://odoo.stinger.dido.doreviateam.com` accessible
- [ ] `https://odoo.prod.dido.doreviateam.com` accessible

### Isolation
- [ ] DB isolées : `odoo_lab_dido`, `odoo_stinger_dido`, `odoo_prod_dido`
- [ ] Volumes isolés par env
- [ ] Aucun partage avec le tenant `core`

---

## 🔧 Commandes utiles

### Lister les tenants
```bash
ls -d tenants/*/
```

### Statut global
```bash
dorevia.sh gateway status
dorevia.sh platform status core
dorevia.sh platform status dido
dorevia.sh app status odoo lab core
dorevia.sh app status odoo lab dido
```

### Arrêter un tenant
```bash
dorevia.sh app down odoo lab dido
dorevia.sh app down odoo stinger dido
dorevia.sh app down odoo prod dido
dorevia.sh platform down dido
```

### Détruire un tenant (⚠️ destructif)
```bash
dorevia.sh app destroy odoo lab dido --purge
dorevia.sh app destroy odoo stinger dido --purge
dorevia.sh app destroy odoo prod dido --purge
dorevia.sh platform destroy dido --purge
```

---

## 🆘 Dépannage express

### "DNS non accessible / HTTPS KO"
- vérifier DNS chez registrar
- `dorevia.sh gateway status`
- logs : `docker logs gateway-caddy`
- vérifier réseau : conteneurs connectés à `dorevia-network`

### "Platform ne démarre pas"
- `dorevia.sh gateway status`
- `dorevia.sh token list dido`
- logs : `docker logs dvig-dido`

### "App ne démarre pas"
- `dorevia.sh platform status dido`
- `dorevia.sh doctor`
- logs : `docker logs odoo_lab_dido`

---

**Dernière mise à jour** : 2025-12-28

