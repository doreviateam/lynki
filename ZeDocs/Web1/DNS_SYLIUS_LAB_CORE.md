# 🌐 Enregistrement DNS — Sylius Landing Page LAB

**Date** : 2026-01-16  
**Statut** : ⏳ **À créer**  
**Service** : Landing Page Dorevia-Vault (Sylius)  
**Environnement** : LAB  
**Tenant** : core

---

## 📋 Enregistrement DNS Requis

Créer l'enregistrement suivant chez votre registrar DNS (OVH/Cloudflare/IONOS) :

| Type | Nom | Valeur | TTL | Notes |
|------|-----|--------|-----|-------|
| **A** | `sylius.lab.core.doreviateam.com` | `<IP_SERVEUR>` | 300 | Landing Page Sylius LAB |

**Remplacement** : `<IP_SERVEUR>` = IP publique du serveur LAB Dorevia

---

## 🔍 Comment Trouver l'IP du Serveur

### Option 1 : Via SSH
```bash
hostname -I
# OU
ip addr show | grep "inet " | grep -v "127.0.0.1"
```

### Option 2 : Via DNS Existant
Vérifier l'IP d'un hostname existant du même serveur :
```bash
dig +short odoo.lab.core.doreviateam.com
# OU
nslookup odoo.lab.core.doreviateam.com
```

---

## ✅ Vérification Après Création

Attendre 5-15 minutes (propagation DNS) puis vérifier :

```bash
# Vérifier résolution DNS
dig +short sylius.lab.core.doreviateam.com

# OU
nslookup sylius.lab.core.doreviateam.com

# OU
host sylius.lab.core.doreviateam.com
```

**Résultat attendu** : La commande doit retourner l'IP du serveur.

---

## 🔒 Certificat SSL Automatique

Une fois le DNS propagé, **Caddy générera automatiquement** le certificat SSL Let's Encrypt :

1. **Vérifier la configuration Caddy** :
   - Route `sylius.lab.core.doreviateam.com` configurée dans `units/gateway/Caddyfile`
   - Recharger Caddy : `docker-compose -f units/gateway/docker-compose.yml restart caddy`

2. **Vérifier le certificat** :
   ```bash
   # Tester accès HTTPS
   curl -I https://sylius.lab.core.doreviateam.com
   
   # Vérifier certificat SSL
   openssl s_client -connect sylius.lab.core.doreviateam.com:443 -servername sylius.lab.core.doreviateam.com
   ```

3. **Vérifier les logs Caddy** :
   ```bash
   docker-compose -f units/gateway/docker-compose.yml logs caddy | grep sylius
   ```

---

## 🧪 Test Complet

Une fois le DNS propagé et Caddy rechargé :

```bash
# Test accès HTTPS
curl https://sylius.lab.core.doreviateam.com

# Test healthz endpoint
curl https://sylius.lab.core.doreviateam.com/healthz

# Test landing page
curl -I https://sylius.lab.core.doreviateam.com
```

**Résultats attendus** :
- ✅ HTTP 200 sur `/`
- ✅ JSON `{"status":"healthy"}` sur `/healthz`
- ✅ Certificat SSL valide (Let's Encrypt)

---

## 📝 Notes

- **TTL recommandé** : 300 secondes (5 minutes) pour tests, puis augmenter à 3600 (1 heure) en production
- **Propagation** : Attendre 5-15 minutes après création avant de tester
- **Certificats SSL** : Caddy générera automatiquement les certificats Let's Encrypt une fois les DNS propagés
- **Caddyfile** : La route doit être configurée dans `units/gateway/Caddyfile` (voir US-2.6)

---

## 🎯 Exemple Concret

Si votre serveur LAB a l'IP `123.45.67.89`, créer :

```
Type    Nom                                    Valeur
A       sylius.lab.core.doreviateam.com       123.45.67.89
```

---

## ⚠️ Important

- Ce hostname est nécessaire pour accéder à la landing page Sylius
- Le service Sylius doit être déployé et configuré pour répondre sur ce hostname
- Le Caddyfile doit contenir la route correspondante (vérifier avec `dorevia.sh gateway aggregate`)

---

## 🔗 Liens Utiles

- **Configuration Caddy** : `units/gateway/Caddyfile`
- **Documentation Sylius** : `units/sylius/README.md`
- **Plan d'implémentation** : `ZeDocs/Web1/PLAN_IMPLEMENTATION_LANDING_PAGE_SYLIUS_v1.2.md`
