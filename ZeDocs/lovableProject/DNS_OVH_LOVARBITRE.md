# 🌐 Enregistrements DNS OVH — Site web lovable44

**Date** : 2026-01-22  
**URL cible** : `https://sylius.lab.lovable44.doreviateam.com`  
**Statut** : ⏳ **À créer chez OVH**

---

## 📋 Enregistrement DNS à créer chez OVH

Créez l'enregistrement suivant dans votre zone DNS `doreviateam.com` :

| Type | Nom | Valeur | TTL | Notes |
|------|-----|--------|-----|-------|
| **A** | `sylius.lab.lovable44.doreviateam.com` | `85.215.206.213` | 300 | Site web Lov'Arbitre LAB |

---

## 🔍 Détails de l'enregistrement

**Type** : A  
**Nom** : `sylius.lab.lovable44`  
**Valeur** : `85.215.206.213` (IP du serveur Dorevia)  
**TTL** : 300 secondes (5 minutes) - peut être augmenté à 3600 (1 heure) après validation

---

## ✅ Étapes après création DNS

1. **Attendre la propagation DNS** : 5-15 minutes
2. **Vérifier la résolution DNS** :
   ```bash
   dig +short sylius.lab.lovable44.doreviateam.com
   # Doit retourner : 85.215.206.213
   ```
3. **Recharger Caddy** (déjà configuré) :
   ```bash
   cd /opt/dorevia-plateform/units/gateway
   docker compose restart caddy
   ```
4. **Tester l'accès** :
   ```bash
   curl -I https://sylius.lab.lovable44.doreviateam.com
   ```

---

## 🔒 Certificat SSL automatique

Une fois le DNS propagé, **Caddy générera automatiquement** le certificat SSL Let's Encrypt pour `sylius.lab.lovable44.doreviateam.com`.

**Vérification** :
```bash
# Tester accès HTTPS
curl -I https://sylius.lab.lovable44.doreviateam.com

# Vérifier certificat SSL
openssl s_client -connect sylius.lab.lovable44.doreviateam.com:443 -servername sylius.lab.lovable44.doreviateam.com
```

---

## 📝 Configuration déjà en place

✅ **Caddyfile** : Route `sylius.lab.lovable44.doreviateam.com` configurée  
✅ **Symfony** : Détection automatique du tenant via hostname  
✅ **Template** : Template Lov'Arbitre prêt  

**Il ne reste plus qu'à créer l'enregistrement DNS chez OVH !**

---

## 🎯 Résumé

**Action requise** : Créer l'enregistrement DNS A chez OVH  
**Nom** : `sylius.lab.lovable44`  
**Valeur** : `85.215.206.213`  
**TTL** : 300  

Une fois créé, le site sera accessible à : `https://sylius.lab.lovable44.doreviateam.com`
