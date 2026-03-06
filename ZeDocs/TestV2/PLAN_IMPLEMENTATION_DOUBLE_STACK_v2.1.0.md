# 🚀 Plan d'Implémentation — Double Stack (v2.1.0)

**Date** : 2026-01-10  
**Document de référence** : SPEC_DVIG_VAULT_STINGER_v2.1.0  
**Approche** : Créer tenant `core-stinger` comme nouveau tenant  
**Durée estimée** : 2-4 heures (selon DNS et tests)

---

## 🎯 Objectif

Implémenter l'approche "Double Stack" en créant un tenant `core-stinger` dédié à STINGER, permettant une isolation complète sans modification de code ni breaking change.

---

## 📋 Prérequis

### Vérifications Système

- [ ] Docker et Docker Compose opérationnels
- [ ] CLI `dorevia.sh` accessible et fonctionnel
- [ ] Gateway globale opérationnelle : `dorevia.sh gateway status`
- [ ] Accès SSH au serveur Dorevia
- [ ] Accès au registrar DNS (OVH/Cloudflare/IONOS)
- [ ] Espace disque suffisant (~5GB pour volumes + base de données)
- [ ] RAM disponible (~1GB pour nouveaux containers)

### Vérifications Infrastructure

- [ ] Tenant `core` existant et fonctionnel
- [ ] Containers PROD opérationnels : `docker ps | grep core`
- [ ] Base de données PROD accessible : `docker exec vault-db-core psql -U vault -d dorevia_vault -c "SELECT 1;"`
- [ ] Gateway opérationnelle : `curl https://dvig.core.doreviateam.com/health`

---

## 🔀 Décisions à Prendre

### Décision 1 : Hostnames

**Option A : Conformes v2.0** (Recommandé)
- Hostnames : `dvig.core-stinger.doreviateam.com`, `vault.core-stinger.doreviateam.com`
- ✅ Génération automatique via `render_caddyfile.sh`
- ✅ Conforme architecture v2.0
- ⚠️ Moins explicite (pas de `<env>` visible)

**Option B : Explicites avec `<env>`** (Document v2.1.0)
- Hostnames : `dvig.stinger.core.doreviateam.com`, `vault.stinger.core.doreviateam.com`
- ⚠️ Modification manuelle Caddyfile nécessaire
- ⚠️ Non conforme architecture v2.0
- ✅ Plus explicite (environnement visible)

**Recommandation** : **Option A** (conformes v2.0) pour génération automatique.

---

### Décision 2 : Base de Données

**Option A : Conforme v2.0** (Recommandé)
- Nom : `dorevia_vault` (1 base par tenant)
- ✅ Conforme architecture v2.0
- ✅ Génération automatique

**Option B : Explicite** (Document v2.1.0)
- Nom : `dorevia_vault_stinger`
- ⚠️ Modification manuelle nécessaire
- ⚠️ Non conforme architecture v2.0

**Recommandation** : **Option A** (conforme v2.0) pour génération automatique.

---

### Décision 3 : Fichiers Tokens

**Option A : Nouveau Tenant** (Recommandé)
- Fichier : `tenants/core-stinger/secrets/dvig.tokens.yml`
- ✅ Conforme architecture v2.0
- ✅ Isolation complète

**Option B : Modification Core** (Document v2.1.0)
- Fichier : `tenants/core/secrets/dvig.stinger.tokens.yml`
- ⚠️ Non conforme (fichier dans mauvais répertoire)

**Recommandation** : **Option A** (nouveau tenant) pour isolation complète.

---

## 📝 Plan d'Implémentation

### Phase 1 : Préparation (30 min)

#### 1.1 Décisions Finales

- [ ] Valider Option A pour hostnames (conformes v2.0)
- [ ] Valider Option A pour base de données (conforme v2.0)
- [ ] Valider Option A pour fichiers tokens (nouveau tenant)

#### 1.2 Documentation

- [ ] Noter les décisions prises
- [ ] Documenter les hostnames choisis
- [ ] Préparer les commandes DNS

---

### Phase 2 : Création Tenant (45 min)

#### 2.1 Créer Structure Répertoires

```bash
# Se placer à la racine du projet
cd /opt/dorevia-plateform

# Créer structure répertoires
mkdir -p tenants/core-stinger/{state,secrets,platform,apps/odoo/{lab,stinger,prod}}
mkdir -p tenants/core-stinger/rendered/{lab,stinger,prod}/{platform,odoo,caddy}
```

**Vérification** :
```bash
tree tenants/core-stinger -L 2
```

#### 2.2 Créer Manifest

Créer le fichier `tenants/core-stinger/state/manifest.json` :

```bash
cat > tenants/core-stinger/state/manifest.json << 'EOF'
{
  "version": "1.0",
  "tenant_id": "core-stinger",
  "created_at": "2026-01-10T00:00:00Z",
  "universes": [
    "odoo"
  ],
  "environments": [
    "stinger"
  ],
  "domain_mode": "saas",
  "units": {
    "platform": [
      "dvig",
      "vault",
      "postgres"
    ],
    "odoo": [
      "odoo",
      "postgres"
    ]
  },
  "secrets_refs": {
    "dvig_tokens": "tenants/core-stinger/secrets/dvig.tokens.yml"
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

**Vérification** :
```bash
cat tenants/core-stinger/state/manifest.json | jq .
```

#### 2.3 Créer Fichier Tokens Vide

```bash
cat > tenants/core-stinger/secrets/dvig.tokens.yml << 'EOF'
# Tokens DVIG pour tenant core-stinger
# Format: source: token
# Source: <univers>.<env>.<tenant>
# Exemple: odoo.stinger.core-stinger: <token>
EOF
```

**Vérification** :
```bash
cat tenants/core-stinger/secrets/dvig.tokens.yml
```

---

### Phase 3 : DNS (15 min)

#### 3.1 Créer Enregistrements DNS

**Si Option A (conformes v2.0)** :

Créer les enregistrements suivants chez le registrar (OVH/Cloudflare/IONOS) :

```
Type    Nom                                    Valeur
A       dvig.core-stinger.doreviateam.com     <IP_SERVEUR>
A       vault.core-stinger.doreviateam.com    <IP_SERVEUR>
```

**Si Option B (explicites)** :

```
Type    Nom                                    Valeur
A       dvig.stinger.core.doreviateam.com     <IP_SERVEUR>
A       vault.stinger.core.doreviateam.com    <IP_SERVEUR>
```

#### 3.2 Vérifier Propagation DNS

Attendre 5-15 minutes puis vérifier :

```bash
# Vérifier résolution DNS
dig +short dvig.core-stinger.doreviateam.com
dig +short vault.core-stinger.doreviateam.com

# OU si Option B
dig +short dvig.stinger.core.doreviateam.com
dig +short vault.stinger.core.doreviateam.com
```

**Vérification** : Les commandes doivent retourner l'IP du serveur.

---

### Phase 4 : Génération Configs (30 min)

#### 4.1 Générer Docker Compose Platform

```bash
# Générer docker-compose pour platform
./lib/render/render_platform_compose.sh core-stinger stinger

# Vérifier génération
ls -la tenants/core-stinger/rendered/stinger/platform/docker-compose.yml
```

**Vérification** :
```bash
# Vérifier contenu
cat tenants/core-stinger/rendered/stinger/platform/docker-compose.yml | head -50
```

**Containers attendus** :
- `dvig-core-stinger`
- `vault-core-stinger`
- `vault-db-core-stinger`

#### 4.2 Générer Caddyfile

**Si Option A (conformes v2.0)** :

```bash
# Générer Caddyfile pour tenant
./lib/render/render_caddyfile.sh core-stinger stinger

# Vérifier génération
ls -la tenants/core-stinger/rendered/stinger/caddy/Caddyfile
```

**Vérification** :
```bash
# Vérifier hostnames
cat tenants/core-stinger/rendered/stinger/caddy/Caddyfile | grep -E "dvig|vault"
```

**Hostnames attendus** :
- `dvig.core-stinger.doreviateam.com`
- `vault.core-stinger.doreviateam.com`

**Si Option B (explicites)** :

Modifier manuellement `units/gateway/Caddyfile` :

```caddyfile
# DVIG STINGER (tenant core-stinger)
dvig.stinger.core.doreviateam.com {
  reverse_proxy dvig-core-stinger:8080
}

# Vault STINGER (tenant core-stinger)
vault.stinger.core.doreviateam.com {
  reverse_proxy vault-core-stinger:8080
}
```

#### 4.3 Agréger Caddyfile Global

```bash
# Agréger tous les Caddyfiles
./bin/dorevia.sh gateway aggregate

# OU si commande n'existe pas
./lib/render/render_caddyfile.sh --aggregate

# Recharger Caddy
./bin/dorevia.sh gateway reload
```

**Vérification** :
```bash
# Vérifier hostnames dans Caddyfile global
cat units/gateway/Caddyfile | grep -E "core-stinger|stinger.core"
```

---

### Phase 5 : Déploiement (30 min)

#### 5.1 Déployer Platform

```bash
# Déployer platform pour tenant core-stinger
./bin/dorevia.sh platform up core-stinger

# OU si commande nécessite environnement
./bin/dorevia.sh platform up core-stinger --env stinger
```

**Vérification** :
```bash
# Vérifier containers démarrés
docker ps | grep core-stinger

# Containers attendus :
# - dvig-core-stinger
# - vault-core-stinger
# - vault-db-core-stinger
```

#### 5.2 Vérifier Health Checks

```bash
# Health check DVIG
curl -k https://dvig.core-stinger.doreviateam.com/health

# Health check Vault
curl -k https://vault.core-stinger.doreviateam.com/health

# OU si Option B
curl -k https://dvig.stinger.core.doreviateam.com/health
curl -k https://vault.stinger.core.doreviateam.com/health
```

**Vérification** : Les commandes doivent retourner `200 OK` ou `{"status":"ok"}`.

#### 5.3 Vérifier Base de Données

```bash
# Vérifier base de données créée
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "SELECT 1;"

# Vérifier tables Vault
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "\dt"
```

**Vérification** : La base `dorevia_vault` doit exister avec les tables Vault.

---

### Phase 6 : Tokens (30 min)

#### 6.1 Générer Tokens DVIG

```bash
# Générer token pour Odoo STINGER (si clients sont des tenants séparés)
./bin/dorevia.sh token issue odoo stinger sarl-la-platine
./bin/dorevia.sh token issue odoo stinger sweet-manihot

# OU si clients sont des apps de core-stinger
./bin/dorevia.sh token issue odoo stinger core-stinger
```

**Vérification** :
```bash
# Vérifier tokens dans fichier
cat tenants/core-stinger/secrets/dvig.tokens.yml

# OU si tokens dans core
cat tenants/core/secrets/dvig.stinger.tokens.yml
```

#### 6.2 Recharger Tokens DVIG

```bash
# Redémarrer DVIG pour charger nouveaux tokens
docker restart dvig-core-stinger

# Vérifier logs
docker logs dvig-core-stinger --tail 50
```

**Vérification** : Les logs doivent montrer les tokens chargés sans erreur.

---

### Phase 7 : Configuration Odoo (30 min)

#### 7.1 Configurer Odoo STINGER Clients

Pour chaque client STINGER (`sarl-la-platine`, `sweet-manihot`), configurer :

```bash
# Se connecter au container Odoo
docker exec -it odoo_stinger_sarl-la-platine bash

# OU si clients sont des apps de core-stinger
docker exec -it odoo_stinger_core-stinger bash
```

**Configuration dans Odoo** :
- `DVIG_URL` : `https://dvig.core-stinger.doreviateam.com` (Option A)
- OU : `https://dvig.stinger.core.doreviateam.com` (Option B)
- `TOKEN` : Token généré à l'étape 6.1
- `SOURCE` : `odoo.stinger.sarl-la-platine` (si tenant séparé)
- OU : `odoo.stinger.core-stinger` (si app de core-stinger)

#### 7.2 Tester Flux E2E

```bash
# Tester vaulter un événement depuis Odoo STINGER
# (via interface Odoo ou API)

# Vérifier dans DVIG
curl -k https://dvig.core-stinger.doreviateam.com/api/v1/events | jq .

# Vérifier dans Vault
curl -k https://vault.core-stinger.doreviateam.com/api/v1/events | jq .
```

**Vérification** : Les événements doivent apparaître dans DVIG et Vault STINGER.

---

### Phase 8 : Tests et Validation (45 min)

#### 8.1 Tests Smoke

```bash
# Health checks
curl -k https://dvig.core-stinger.doreviateam.com/health
curl -k https://vault.core-stinger.doreviateam.com/health

# Vérifier isolation (PROD inchangée)
curl -k https://dvig.core.doreviateam.com/health
curl -k https://vault.core.doreviateam.com/health
```

**Vérification** : Tous les health checks doivent retourner `200 OK`.

#### 8.2 Tests Isolation

```bash
# Vérifier que tokens STINGER ne fonctionnent pas en PROD
curl -k -H "Authorization: Bearer <token_stinger>" \
  https://dvig.core.doreviateam.com/api/v1/events

# Doit retourner 401 Unauthorized
```

**Vérification** : Tokens STINGER doivent être rejetés par DVIG PROD.

#### 8.3 Tests Fonctionnels

- [ ] Vaulter événement depuis Odoo STINGER
- [ ] Vérifier événement dans DVIG STINGER
- [ ] Vérifier événement dans Vault STINGER
- [ ] Vérifier constat généré
- [ ] Vérifier facturation MRR (si applicable)

#### 8.4 Tests Performance

```bash
# Vérifier ressources utilisées
docker stats dvig-core-stinger vault-core-stinger vault-db-core-stinger --no-stream

# Vérifier logs
docker logs dvig-core-stinger --tail 100
docker logs vault-core-stinger --tail 100
```

**Vérification** : Pas d'erreurs dans les logs, ressources normales.

---

### Phase 9 : Documentation (15 min)

#### 9.1 Documenter Configuration

- [ ] Noter hostnames choisis
- [ ] Noter tokens générés
- [ ] Noter configuration Odoo
- [ ] Documenter procédure de maintenance

#### 9.2 Mettre à Jour Documentation

- [ ] Mettre à jour guide création tenant (si applicable)
- [ ] Documenter spécificités STINGER
- [ ] Ajouter procédure de rollback

---

## 🔄 Procédure de Rollback

### Si Problème Critique

#### 1. Arrêter Containers STINGER

```bash
# Arrêter containers
docker stop dvig-core-stinger vault-core-stinger vault-db-core-stinger

# OU via docker-compose
cd tenants/core-stinger/rendered/stinger/platform
docker compose down
```

#### 2. Retirer DNS (Optionnel)

Retirer les enregistrements DNS créés (si nécessaire).

#### 3. Retirer Caddyfile

**Si Option A (conformes v2.0)** :
```bash
# Retirer Caddyfile généré
rm tenants/core-stinger/rendered/stinger/caddy/Caddyfile

# Ré-agréger Caddyfile global
./bin/dorevia.sh gateway aggregate --reload
```

**Si Option B (explicites)** :
```bash
# Retirer hostnames manuels de units/gateway/Caddyfile
# Ré-agréger Caddyfile global
./bin/dorevia.sh gateway aggregate --reload
```

#### 4. Supprimer Tenant (Optionnel)

```bash
# Supprimer répertoire tenant (si rollback complet)
rm -rf tenants/core-stinger
```

---

## ✅ Checklist Finale

### Prérequis
- [ ] Docker et Docker Compose opérationnels
- [ ] CLI `dorevia.sh` accessible
- [ ] Gateway opérationnelle
- [ ] Accès DNS
- [ ] Espace disque et RAM suffisants

### Création Tenant
- [ ] Structure répertoires créée
- [ ] Manifest créé et validé
- [ ] Fichier tokens créé

### DNS
- [ ] Enregistrements DNS créés
- [ ] Propagation DNS vérifiée

### Génération Configs
- [ ] Docker Compose platform généré
- [ ] Caddyfile généré (ou modifié manuellement)
- [ ] Caddyfile global agrégé

### Déploiement
- [ ] Containers démarrés
- [ ] Health checks OK
- [ ] Base de données créée

### Tokens
- [ ] Tokens générés
- [ ] Tokens chargés dans DVIG
- [ ] Tokens validés

### Configuration Odoo
- [ ] Odoo STINGER configuré
- [ ] Flux E2E testé

### Tests
- [ ] Tests smoke OK
- [ ] Tests isolation OK
- [ ] Tests fonctionnels OK
- [ ] Tests performance OK

### Documentation
- [ ] Configuration documentée
- [ ] Documentation mise à jour

---

## 📊 Estimation Temps

| Phase | Durée | Description |
|-------|-------|-------------|
| **Phase 1** | 30 min | Préparation et décisions |
| **Phase 2** | 45 min | Création tenant |
| **Phase 3** | 15 min | DNS (attente propagation) |
| **Phase 4** | 30 min | Génération configs |
| **Phase 5** | 30 min | Déploiement |
| **Phase 6** | 30 min | Tokens |
| **Phase 7** | 30 min | Configuration Odoo |
| **Phase 8** | 45 min | Tests et validation |
| **Phase 9** | 15 min | Documentation |
| **TOTAL** | **4h15** | (sans attente DNS) |

**Avec attente DNS** : +15-30 min (propagation DNS)

---

## 🎯 Points d'Attention

1. **DNS** : Attendre propagation DNS avant tests (5-15 min)
2. **Certificats SSL** : Caddy génère automatiquement, attendre 1-2 min
3. **Tokens** : Vérifier format source (`odoo.stinger.<tenant>`)
4. **Isolation** : Vérifier que PROD n'est pas impactée
5. **Ressources** : Surveiller RAM et CPU lors des tests

---

## 📝 Notes

- **Option A recommandée** : Hostnames conformes v2.0 pour génération automatique
- **Isolation complète** : Tenant `core-stinger` totalement indépendant de `core`
- **PROD préservée** : Aucun impact sur production
- **Rollback simple** : Arrêt containers et retrait DNS si nécessaire

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **Plan prêt pour implémentation**
