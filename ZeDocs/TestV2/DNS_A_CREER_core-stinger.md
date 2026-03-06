# 🌐 Enregistrements DNS à Créer — Tenant core-stinger

**Date** : 2026-01-10  
**Approche** : Double Stack (Option A - Hostnames conformes v2.0)  
**Statut** : ⏳ **À créer**

---

## 📋 Enregistrements DNS Requis

### Services Platform (DVIG + Vault)

Créer les enregistrements suivants chez votre registrar DNS (OVH/Cloudflare/IONOS) :

| Type | Nom | Valeur | TTL | Notes |
|------|-----|--------|-----|-------|
| **A** | `dvig.core-stinger.doreviateam.com` | `<IP_SERVEUR>` | 300 | Service DVIG STINGER |
| **A** | `vault.core-stinger.doreviateam.com` | `<IP_SERVEUR>` | 300 | Service Vault STINGER |

**Remplacement** : `<IP_SERVEUR>` = IP publique de votre serveur Dorevia

---

## 🔍 Comment Trouver l'IP du Serveur

### Option 1 : Via SSH
```bash
hostname -I
# OU
ip addr show | grep "inet " | grep -v "127.0.0.1"
```

### Option 2 : Via DNS Existant
Vérifier l'IP d'un hostname existant :
```bash
dig +short dvig.core.doreviateam.com
# OU
nslookup dvig.core.doreviateam.com
```

---

## ✅ Vérification Après Création

Attendre 5-15 minutes (propagation DNS) puis vérifier :

```bash
# Vérifier résolution DNS
dig +short dvig.core-stinger.doreviateam.com
dig +short vault.core-stinger.doreviateam.com

# OU
nslookup dvig.core-stinger.doreviateam.com
nslookup vault.core-stinger.doreviateam.com
```

**Résultat attendu** : Les commandes doivent retourner l'IP du serveur.

---

## 📝 Notes

- **TTL recommandé** : 300 secondes (5 minutes) pour tests, puis augmenter à 3600 (1 heure) en production
- **Propagation** : Attendre 5-15 minutes après création avant de tester
- **Certificats SSL** : Caddy générera automatiquement les certificats Let's Encrypt une fois les DNS propagés

---

## 🎯 Exemple Concret

Si votre serveur a l'IP `123.45.67.89`, créer :

```
Type    Nom                                    Valeur
A       dvig.core-stinger.doreviateam.com     123.45.67.89
A       vault.core-stinger.doreviateam.com   123.45.67.89
```

---

## ⚠️ Important

- Ces hostnames sont **conformes à l'architecture v2.0** (Option A validée)
- Ils seront utilisés par le Caddyfile déjà généré et agrégé
- Les certificats SSL seront générés automatiquement par Caddy après propagation DNS

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 📋 **Enregistrements à créer**
