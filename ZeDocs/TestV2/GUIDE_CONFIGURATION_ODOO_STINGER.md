# ⚙️ Guide Configuration Odoo STINGER — DVIG STINGER

**Date** : 2026-01-10  
**Objectif** : Configurer les instances Odoo STINGER pour utiliser le DVIG STINGER (`dvig.core-stinger.doreviateam.com`)

---

## 🎯 Vue d'Ensemble

Les instances Odoo STINGER des clients (`sarl-la-platine` et `sweet-manihot`) doivent être configurées pour utiliser le **DVIG STINGER** au lieu du DVIG PROD.

**Configuration requise** :
- **DVIG URL** : `https://dvig.core-stinger.doreviateam.com`
- **Tokens** : Tokens générés pour `odoo.stinger.sarl-la-platine` et `odoo.stinger.sweet-manihot`
- **Source** : `odoo.stinger.<tenant>`

---

## 📋 Prérequis

- [x] DVIG STINGER déployé et opérationnel
- [x] Tokens générés pour les clients STINGER
- [x] Instances Odoo STINGER déployées (ou à déployer)

---

## 🔧 Configuration Odoo STINGER

### Option 1 : Configuration via Modules dorevia_* (Recommandé)

Si les modules `dorevia_*` sont installés dans Odoo, la configuration se fait via l'interface Odoo :

#### Étape 1 : Accéder à la Configuration

1. Se connecter à l'instance Odoo STINGER :
   - `https://odoo.stinger.sarl-la-platine.doreviateam.com`
   - OU `https://odoo.stinger.sweet-manihot.doreviateam.com`

2. Aller dans **Paramètres** → **Technique** → **Paramètres Système**

3. Rechercher les paramètres suivants :
   - `dorevia.dvig.url` (ou équivalent)
   - `dorevia.dvig.token` (ou équivalent)
   - `dorevia.dvig.source` (ou équivalent)

#### Étape 2 : Configurer les Paramètres

**Pour `sarl-la-platine`** :
- **DVIG URL** : `https://dvig.core-stinger.doreviateam.com`
- **Token** : `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g`
- **Source** : `odoo.stinger.sarl-la-platine`

**Pour `sweet-manihot`** :
- **DVIG URL** : `https://dvig.core-stinger.doreviateam.com`
- **Token** : `dvig_6MVlYOJAaABtsOKUN4dwdqyff7MxWxlOS8KDu0bBW_g`
- **Source** : `odoo.stinger.sweet-manihot`

---

### Option 2 : Configuration via Base de Données (Si modules non disponibles)

Si les modules `dorevia_*` ne sont pas encore installés ou si la configuration via interface n'est pas disponible, configurer directement dans la base de données :

#### Étape 1 : Se Connecter à la Base de Données

```bash
# Pour sarl-la-platine
docker exec -it odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine

# Pour sweet-manihot
docker exec -it odoo_db_stinger_sweet-manihot psql -U odoo -d odoo_stinger_sweet-manihot
```

#### Étape 2 : Configurer les Paramètres

**Pour `sarl-la-platine`** :

```sql
-- DVIG URL
INSERT INTO ir_config_parameter (key, value, create_date, write_date)
VALUES ('dorevia.dvig.url', 'https://dvig.core-stinger.doreviateam.com', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = 'https://dvig.core-stinger.doreviateam.com', write_date = NOW();

-- Token (à stocker de manière sécurisée)
INSERT INTO ir_config_parameter (key, value, create_date, write_date)
VALUES ('dorevia.dvig.token', 'dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = 'dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g', write_date = NOW();

-- Source
INSERT INTO ir_config_parameter (key, value, create_date, write_date)
VALUES ('dorevia.dvig.source', 'odoo.stinger.sarl-la-platine', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = 'odoo.stinger.sarl-la-platine', write_date = NOW();
```

**Pour `sweet-manihot`** :

```sql
-- DVIG URL
INSERT INTO ir_config_parameter (key, value, create_date, write_date)
VALUES ('dorevia.dvig.url', 'https://dvig.core-stinger.doreviateam.com', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = 'https://dvig.core-stinger.doreviateam.com', write_date = NOW();

-- Token
INSERT INTO ir_config_parameter (key, value, create_date, write_date)
VALUES ('dorevia.dvig.token', 'dvig_6MVlYOJAaABtsOKUN4dwdqyff7MxWxlOS8KDu0bBW_g', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = 'dvig_6MVlYOJAaABtsOKUN4dwdqyff7MxWxlOS8KDu0bBW_g', write_date = NOW();

-- Source
INSERT INTO ir_config_parameter (key, value, create_date, write_date)
VALUES ('dorevia.dvig.source', 'odoo.stinger.sweet-manihot', NOW(), NOW())
ON CONFLICT (key) DO UPDATE SET value = 'odoo.stinger.sweet-manihot', write_date = NOW();
```

#### Étape 3 : Redémarrer Odoo

```bash
# Pour sarl-la-platine
docker restart odoo_stinger_sarl-la-platine

# Pour sweet-manihot
docker restart odoo_stinger_sweet-manihot
```

---

### Option 3 : Configuration via Variables d'Environnement (Docker Compose)

Si les instances Odoo STINGER sont gérées via Docker Compose, ajouter les variables d'environnement :

**Fichier** : `tenants/<tenant>/apps/odoo/stinger/docker-compose.yml`

```yaml
services:
  odoo:
    environment:
      # DVIG STINGER
      - DOREVIA_DVIG_URL=https://dvig.core-stinger.doreviateam.com
      - DOREVIA_DVIG_TOKEN=dvig_<token>
      - DOREVIA_DVIG_SOURCE=odoo.stinger.<tenant>
```

Puis redémarrer :
```bash
cd tenants/<tenant>/apps/odoo/stinger
docker compose restart odoo
```

---

## ✅ Vérification

### Vérifier la Configuration

1. **Vérifier les paramètres dans Odoo** :
   - Aller dans **Paramètres** → **Technique** → **Paramètres Système**
   - Rechercher `dorevia.dvig.*`
   - Vérifier que les valeurs sont correctes

2. **Tester la connexion DVIG** :
   - Depuis Odoo, déclencher une action qui vaulter un événement
   - Vérifier les logs Odoo pour confirmer la connexion
   - Vérifier les logs DVIG STINGER : `docker logs dvig-core-stinger --tail 50`

3. **Vérifier les logs DVIG** :
   ```bash
   docker logs dvig-core-stinger --tail 50 | grep -i "sarl-la-platine\|sweet-manihot"
   ```

---

## 🔑 Tokens Générés

### Tokens STINGER

| Client | Token ID | Token (à copier) | Source |
|--------|----------|------------------|--------|
| **sarl-la-platine** | `tok_stinger_sarl-la-platine_001` | `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g` | `odoo.stinger.sarl-la-platine` |
| **sweet-manihot** | `tok_stinger_sweet-manihot_001` | `dvig_6MVlYOJAaABtsOKUN4dwdqyff7MxWxlOS8KDu0bBW_g` | `odoo.stinger.sweet-manihot` |

⚠️ **IMPORTANT** : Ces tokens ne seront plus affichés. Stockez-les en sécurité.

---

## 📝 Notes

- **Isolation** : Les tokens STINGER ne fonctionnent **que** avec le DVIG STINGER
- **PROD préservée** : Les instances Odoo PROD continuent d'utiliser le DVIG PROD
- **Source** : La source doit correspondre exactement au format `odoo.stinger.<tenant>`

---

## 🆘 Dépannage

### Problème : Token rejeté par DVIG

**Symptôme** : Erreur 401 Unauthorized dans les logs Odoo

**Solution** :
1. Vérifier que le token est correct dans la configuration Odoo
2. Vérifier que le token est présent dans `tenants/core-stinger/secrets/dvig.tokens.yml`
3. Vérifier que le DVIG STINGER a été redémarré après ajout du token
4. Vérifier les logs DVIG : `docker logs dvig-core-stinger --tail 100`

### Problème : Connexion impossible à DVIG

**Symptôme** : Timeout ou erreur de connexion

**Solution** :
1. Vérifier que le DVIG STINGER est démarré : `docker ps | grep dvig-core-stinger`
2. Vérifier l'URL : `https://dvig.core-stinger.doreviateam.com/health`
3. Vérifier les DNS : `dig +short dvig.core-stinger.doreviateam.com`
4. Vérifier le réseau Docker : Les containers doivent être sur `dorevia-network`

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **Guide de configuration**
