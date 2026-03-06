# 🌐 Enregistrement DNS — Odoo LAB LGLZ

**Date** : 2026-01-27  
**Statut** : ⏳ **À créer**  
**Service** : Instance Odoo 19 LAB  
**Tenant** : LGLZ  
**URL** : `https://odoo.lab.lglz.doreviateam.com`

---

## 📋 Enregistrement DNS Requis

Créer l'enregistrement suivant chez votre registrar DNS (OVH/Cloudflare/IONOS) :

| Type | Nom | Valeur | TTL | Notes |
|------|-----|--------|-----|-------|
| **A** | `odoo.lab.lglz.doreviateam.com` | `<IP_SERVEUR>` | 300 | Instance Odoo 19 LAB - LGLZ |

**Remplacement** : `<IP_SERVEUR>` = IP publique du serveur Dorevia

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
dig +short odoo.stinger.lglz.doreviateam.com
# OU
nslookup odoo.stinger.lglz.doreviateam.com
```

---

## ✅ Vérification Après Création

Attendre 5-15 minutes (propagation DNS) puis vérifier :

```bash
# Vérifier résolution DNS
dig +short odoo.lab.lglz.doreviateam.com

# OU
nslookup odoo.lab.lglz.doreviateam.com

# OU
host odoo.lab.lglz.doreviateam.com
```

**Résultat attendu** : La commande doit retourner l'IP du serveur.

---

## 🔒 Certificat SSL Automatique

Une fois le DNS propagé, **Caddy générera automatiquement** le certificat SSL Let's Encrypt :

1. **Vérifier la configuration Caddy** :
   - ✅ Route `odoo.lab.lglz.doreviateam.com` configurée dans `units/gateway/Caddyfile`
   - ✅ Caddy redémarré

2. **Vérifier le certificat** :
   ```bash
   # Tester accès HTTPS
   curl -I https://odoo.lab.lglz.doreviateam.com
   
   # Vérifier certificat SSL
   openssl s_client -connect odoo.lab.lglz.doreviateam.com:443 -servername odoo.lab.lglz.doreviateam.com
   ```

3. **Vérifier les logs Caddy** :
   ```bash
   docker logs gateway-caddy --tail 50
   ```

---

## 📝 Configuration Déjà en Place

✅ **Docker Compose** : `tenants/lglz/apps/odoo/lab/docker-compose.yml`  
✅ **Configuration Odoo** : `tenants/lglz/apps/odoo/lab/odoo.conf`  
✅ **Caddyfile** : Route `odoo.lab.lglz.doreviateam.com` configurée  
✅ **Containers** : `odoo_lab_lglz` et `odoo_db_lab_lglz` démarrés  

**Il ne reste plus qu'à créer l'enregistrement DNS !**

---

## 🎯 Résumé

**Action requise** : Créer l'enregistrement DNS A chez votre registrar  
**Type** : A  
**Nom** : `odoo.lab.lglz`  
**Valeur** : `<IP_SERVEUR>` (même IP que les autres services)  
**TTL** : 300 secondes (5 minutes) - peut être augmenté à 3600 (1 heure) après validation
