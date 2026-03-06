# 🌐 Enregistrements DNS Odoo STINGER à Créer

**Date** : 2026-01-10  
**Statut** : ⏳ **À créer**

---

## 📋 Enregistrements DNS Requis

Créer les enregistrements suivants chez votre registrar DNS (OVH/Cloudflare/IONOS) :

| Type | Nom | Valeur | TTL | Notes |
|------|-----|--------|-----|-------|
| **A** | `odoo.stinger.sarl-la-platine.doreviateam.com` | `<IP_SERVEUR>` | 300 | Instance Odoo STINGER - La Platine |
| **A** | `odoo.stinger.sweet-manihot.doreviateam.com` | `<IP_SERVEUR>` | 300 | Instance Odoo STINGER - Sweet ManiHot |

**Remplacement** : `<IP_SERVEUR>` = IP publique de votre serveur Dorevia (même IP que pour `dvig.core-stinger.doreviateam.com`)

---

## ✅ Vérification Après Création

Attendre 5-15 minutes (propagation DNS) puis vérifier :

```bash
# Vérifier résolution DNS
dig +short odoo.stinger.sarl-la-platine.doreviateam.com
dig +short odoo.stinger.sweet-manihot.doreviateam.com

# OU
nslookup odoo.stinger.sarl-la-platine.doreviateam.com
nslookup odoo.stinger.sweet-manihot.doreviateam.com
```

**Résultat attendu** : Les commandes doivent retourner l'IP du serveur.

---

## 📝 Notes

- **TTL recommandé** : 300 secondes (5 minutes) pour tests, puis augmenter à 3600 (1 heure) en production
- **Propagation** : Attendre 5-15 minutes après création avant de tester
- **Certificats SSL** : Caddy générera automatiquement les certificats Let's Encrypt une fois les DNS propagés
- **Caddyfile** : Les routes Odoo STINGER doivent être configurées dans le Caddyfile (vérifier si déjà générées)

---

## 🎯 Exemple Concret

Si votre serveur a l'IP `85.215.206.213`, créer :

```
Type    Nom                                                    Valeur
A       odoo.stinger.sarl-la-platine.doreviateam.com         85.215.206.213
A       odoo.stinger.sweet-manihot.doreviateam.com           85.215.206.213
```

---

## ⚠️ Important

- Ces hostnames sont nécessaires pour accéder aux instances Odoo STINGER
- Les instances Odoo doivent être déployées et configurées pour répondre sur ces hostnames
- Le Caddyfile doit contenir les routes correspondantes (vérifier avec `dorevia.sh gateway aggregate`)

---

**Version** : 1.0  
**Date** : 2026-01-10
