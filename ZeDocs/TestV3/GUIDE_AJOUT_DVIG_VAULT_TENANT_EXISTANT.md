# 📘 Guide — Ajouter DVIG/Vault à un Tenant Odoo Existant

**Version** : v1.0  
**Date** : 2026-01-12  
**Objectif** : Ajouter les services platform (DVIG/Vault) à un tenant Odoo déjà en fonctionnement

---

## 🎯 Objectif

Permettre d'ajouter les services DVIG/Vault à un tenant Odoo existant qui a été créé initialement **sans** ces services (avec `units.platform: []`).

**Cas d'usage** :
- Client qui a commencé avec Odoo seul
- Besoin ultérieur de vaulting de factures
- Besoin ultérieur de billing automatique
- Migration progressive vers la plateforme complète

---

## ✅ Faisabilité

**Réponse** : ✅ **OUI, c'est totalement possible et prévu par la spécification**

### Pourquoi c'est possible

1. **Architecture modulaire** : Les services platform sont indépendants d'Odoo
   - Odoo continue de fonctionner pendant l'ajout
   - Aucun impact sur les données Odoo existantes

2. **Génération conditionnelle** : Le script `lib/render/render_platform_compose.sh` génère uniquement les services présents dans `units.platform`
   - Modifier le manifest → régénérer le docker-compose
   - Démarrer les nouveaux services

3. **Réseau Docker partagé** : Tous les services sont sur `dorevia-network`
   - Odoo peut communiquer avec DVIG/Vault une fois démarrés
   - Pas de reconfiguration réseau nécessaire

---

## 📋 Scénario Complet

### État Initial

**Tenant** : `client-demo`  
**Manifest initial** :
```json
{
  "units": {
    "platform": [],  // Vide = pas de services platform
    "odoo": ["odoo", "postgres"]
  }
}
```

**Services actifs** :
- ✅ `odoo_stinger_client-demo` (Odoo)
- ✅ `odoo_db_stinger_client-demo` (PostgreSQL)
- ❌ Pas de DVIG/Vault

**URL accessible** :
- ✅ `https://odoo.stinger.client-demo.doreviateam.com`

---

## 🔧 Étapes de Migration

### Étape 1 : Modifier le Manifest

**Fichier** : `tenants/client-demo/state/manifest.json`

**Modification** :
```json
{
  "version": "1.0",
  "tenant_id": "client-demo",
  "created_at": "2026-01-12T00:00:00Z",
  "universes": ["odoo"],
  "environments": ["stinger"],
  "domain_mode": "saas",
  "units": {
    "platform": ["dvig", "vault", "postgres"],  // ✅ Ajout des services
    "odoo": ["odoo", "postgres"]
  },
  "images": {
    "dvig": "dorevia/dvig:0.1.6",
    "vault": "dorevia/vault:v1.3.4",
    "odoo": "odoo:18.0-20250819",
    "postgres": "postgres:16"
  }
}
```

**Points clés** :
- ✅ Ajouter `"dvig"` et `"vault"` dans `units.platform`
- ✅ Ajouter les images DVIG/Vault dans `images`
- ✅ Conserver la configuration Odoo existante

---

### Étape 2 : Créer les Tokens DVIG

**Commande** :
```bash
dorevia.sh token issue odoo stinger client-demo
```

**Résultat** :
- ✅ Token généré : `odoo.stinger.client-demo`
- ✅ Stocké dans : `tenants/client-demo/secrets/dvig.tokens.yml`
- ⚠️ **Important** : Sauvegarder le token affiché (affiché une seule fois)

**Vérification** :
```bash
dorevia.sh token list client-demo
```

**Attendu** :
```
odoo.stinger.client-demo (tenant: client-demo)
```

---

### Étape 3 : Générer le Docker Compose Platform

**Commande** :
```bash
# Le script platform up génère automatiquement le docker-compose.yml
# depuis le manifest mis à jour
dorevia.sh platform up client-demo
```

**Processus automatique** :
1. ✅ Lit le manifest mis à jour
2. ✅ Génère `tenants/client-demo/platform/docker-compose.yml`
3. ✅ Inclut uniquement les services présents dans `units.platform`
4. ✅ Démarre les containers DVIG/Vault

**Résultat** :
- ✅ Container `dvig-client-demo` démarré
- ✅ Container `vault-client-demo` démarré
- ✅ Container `vault-db-client-demo` démarré
- ✅ Odoo continue de fonctionner (aucun impact)

---

### Étape 4 : Ajouter les Routes Caddy

**Fichier** : `units/gateway/Caddyfile`

**Ajouter** :
```caddyfile
# Tenant: client-demo - Environment: stinger

# odoo - Environnements (tenant client-demo)
odoo.stinger.client-demo.doreviateam.com {
  reverse_proxy odoo_stinger_client-demo:8069
}

# Services partagés (tenant client-demo) - Ajoutés après migration
dvig.client-demo.doreviateam.com {
  reverse_proxy dvig-client-demo:8080
}

vault.client-demo.doreviateam.com {
  reverse_proxy vault-client-demo:8080
}
```

**Recharger Caddy** :
```bash
dorevia.sh gateway reload
```

**Points clés** :
- ✅ Routes DVIG/Vault ajoutées
- ✅ Route Odoo conservée (inchangée)

---

### Étape 5 : Créer les Enregistrements DNS

**Chez le registrar** (OVH/Cloudflare/IONOS) :

**Enregistrements A à ajouter** :
```
dvig.client-demo.doreviateam.com → IP_SERVEUR
vault.client-demo.doreviateam.com → IP_SERVEUR
```

**Points clés** :
- ✅ Enregistrements DNS pour DVIG/Vault
- ✅ Enregistrement Odoo existant conservé

---

### Étape 6 : Vérifier les Services

**Vérification platform** :
```bash
dorevia.sh platform status client-demo
```

**Attendu** :
- ✅ `dvig-client-demo` : running
- ✅ `vault-client-demo` : running
- ✅ `vault-db-client-demo` : running

**Vérification URLs** :
```bash
curl https://dvig.client-demo.doreviateam.com/health
curl https://vault.client-demo.doreviateam.com/health
```

**Attendu** :
- ✅ Réponses HTTP 200 OK

---

### Étape 7 : Configurer les Modules Odoo (Optionnel)

**Si besoin de vaulting de factures** :

#### Module `dorevia_vault_connector`

**Installation** :
1. Dans Odoo : **Apps** → Rechercher "Dorevia Vault Connector"
2. Cliquer sur **"Installer"**

**Configuration** :
**Menu** : `Paramètres → Technique → Paramètres → Paramètres Système`

**Paramètres à créer** :
| Clé | Valeur | Description |
|-----|--------|-------------|
| `dorevia.dvig.url` | `https://dvig.client-demo.doreviateam.com` | URL du DVIG |
| `dorevia.dvig.token` | `dvig_...` (token généré) | Token Bearer |
| `dorevia.dvig.source` | `odoo.stinger.client-demo` | Source au format unit.env.tenant |

**Vérification** :
- ✅ Module installé
- ✅ Paramètres configurés
- ✅ CRONs de vaulting actifs

#### Module `dorevia_billing_core` (si besoin)

**Installation** :
1. Dans Odoo : **Apps** → Rechercher "Dorevia Billing CORE"
2. Cliquer sur **"Installer"**

**Configuration** :
| Clé | Valeur | Description |
|-----|--------|-------------|
| `dorevia_billing.core_api_token` | `sk_live_...` | Token API pour authentifier les requêtes du Vault |

---

## ✅ Checklist de Migration

### Préparation
- [ ] Manifest modifié : `units.platform: ["dvig", "vault", "postgres"]`
- [ ] Images DVIG/Vault ajoutées dans `images`
- [ ] Tokens DVIG générés : `dorevia.sh token issue odoo stinger <tenant>`
- [ ] Tokens sauvegardés en sécurité

### Déploiement
- [ ] `dorevia.sh platform up <tenant>` exécuté
- [ ] Containers DVIG/Vault démarrés
- [ ] Routes Caddy ajoutées
- [ ] Caddy rechargé : `dorevia.sh gateway reload`
- [ ] Enregistrements DNS créés

### Vérification
- [ ] `dorevia.sh platform status <tenant>` : tous les services running
- [ ] `https://dvig.<tenant>.doreviateam.com/health` : accessible
- [ ] `https://vault.<tenant>.doreviateam.com/health` : accessible
- [ ] Odoo toujours accessible : `https://odoo.stinger.<tenant>.doreviateam.com`

### Configuration Modules (Optionnel)
- [ ] Module `dorevia_vault_connector` installé (si besoin)
- [ ] Paramètres `dorevia.dvig.*` configurés
- [ ] Module `dorevia_billing_core` installé (si besoin)
- [ ] Paramètres `dorevia_billing.*` configurés

---

## ⚠️ Points d'Attention

### 1. Aucun Impact sur Odoo

**Important** : L'ajout de DVIG/Vault n'a **aucun impact** sur Odoo existant :
- ✅ Odoo continue de fonctionner normalement
- ✅ Aucune interruption de service
- ✅ Aucune perte de données
- ✅ Aucune reconfiguration Odoo nécessaire

### 2. Modules Odoo Optionnels

**Rappel** : Les modules Dorevia sont **optionnels** :
- ✅ Odoo fonctionne sans ces modules
- ✅ Installer les modules uniquement si besoin de fonctionnalités spécifiques
- ⚠️ Ne pas installer si pas de besoin (évite erreurs CRON inutiles)

### 3. Tokens DVIG

**Sécurité** :
- ⚠️ Token affiché **une seule fois** lors de la génération
- ✅ Sauvegarder immédiatement dans un gestionnaire de secrets
- ✅ Ne pas commiter dans Git (fichier dans `tenants/*/secrets/`)

### 4. Ordre des Opérations

**Recommandé** :
1. ✅ Modifier manifest
2. ✅ Générer tokens
3. ✅ Démarrer platform
4. ✅ Ajouter routes Caddy/DNS
5. ✅ Installer modules Odoo (si besoin)

**À éviter** :
- ❌ Installer modules Odoo avant que DVIG/Vault soient démarrés
- ❌ Créer routes DNS avant que les services soient démarrés

---

## 🔄 Scénario Inverse (Non Recommandé)

### Retirer DVIG/Vault d'un Tenant

**⚠️ NON RECOMMANDÉ** — Risque de perte de données

**Si vraiment nécessaire** :
1. Arrêter platform : `dorevia.sh platform down <tenant>`
2. Modifier manifest : `units.platform: []`
3. Désinstaller modules Odoo dépendants
4. Supprimer routes Caddy/DNS manuellement
5. ⚠️ **Attention** : Données Vault non supprimées automatiquement

**Recommandation** : Conserver les services même si non utilisés (coûts faibles, flexibilité future)

---

## 📊 Comparaison : Avant vs Après

| Aspect | Avant (Sans DVIG/Vault) | Après (Avec DVIG/Vault) |
|--------|------------------------|------------------------|
| **Services platform** | ❌ Aucun | ✅ DVIG + Vault + DB |
| **Odoo** | ✅ Fonctionnel | ✅ Fonctionnel (inchangé) |
| **Vaulting factures** | ❌ Non disponible | ✅ Disponible (si module installé) |
| **Billing automatique** | ❌ Non disponible | ✅ Disponible (si module installé) |
| **URLs** | 1 (Odoo) | 3 (Odoo + DVIG + Vault) |
| **Ressources** | 🟢 Faibles | 🟡 Moyennes |
| **Complexité** | 🟢 Simple | 🟡 Moyenne |

---

## 🎯 Cas d'Usage

### ✅ Idéal pour

1. **Migration progressive** :
   - Phase 1 : Initiation Odoo (sans DVIG/Vault)
   - Phase 2 : Ajout vaulting (avec DVIG/Vault)

2. **Évolution des besoins** :
   - Client qui commence simple
   - Besoin ultérieur de fonctionnalités avancées

3. **Tests et validation** :
   - Tester Odoo d'abord
   - Valider besoin de vaulting ensuite

### ❌ Non recommandé pour

1. **Production avec vaulting obligatoire** :
   - Si le vaulting est requis dès le départ
   - Mieux vaut créer directement avec DVIG/Vault

---

## 📝 Conclusion

**Réponse** : ✅ **OUI, vous pouvez installer DVIG/Vault dans un second temps**

**Avantages** :
- ✅ Migration sans impact sur Odoo
- ✅ Aucune interruption de service
- ✅ Flexibilité maximale
- ✅ Évolutivité garantie

**Processus** :
1. Modifier manifest
2. Générer tokens
3. Démarrer platform
4. Ajouter routes Caddy/DNS
5. Configurer modules Odoo (optionnel)

**Durée estimée** : 15-30 minutes (selon configuration DNS)

---

**Références** :
- `SPEC_DVIG_VAULT_OPTIONNELS_v1.0.md` : Spécification technique
- `GUIDE_CLIENT_INITIATION_ODOO_STINGER.md` : Guide création tenant sans DVIG/Vault
- `docs/GUIDE_CREATION_TENANT.md` : Guide général de création de tenant
