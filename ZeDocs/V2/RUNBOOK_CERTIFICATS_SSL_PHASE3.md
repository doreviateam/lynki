# 🔒 Runbook — Gestion Certificats SSL Domaines Clients (Phase 3)

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"

---

## 1. Vue d'Ensemble

Caddy obtient **automatiquement** les certificats Let's Encrypt pour tous les hostnames configurés (canonique + alias + fallback) via ACME.

**Prérequis** :
- Enregistrements DNS propagés vers l'IP du serveur
- Ports 80/443 ouverts
- Accès ACME (Let's Encrypt) depuis le serveur

---

## 2. Configuration Caddy (ACME)

### 2.1 Configuration Automatique

Caddy est configuré avec :
- **Email** : `admin@doreviateam.com` (pour notifications Let's Encrypt)
- **ACME** : Automatique (Let's Encrypt par défaut)
- **Renouvellement** : Automatique (avant expiration)

**Fichier** : `units/gateway/Caddyfile` (global agrégé)

**Exemple** :
```caddy
{
  email admin@doreviateam.com
}

odoo.prod.rozas.rozas.gp, erp.rozas.gp, odoo.prod.rozas.doreviateam.com {
  reverse_proxy odoo_prod_rozas:8069
}
```

### 2.2 Stockage Certificats

**Volume Docker** : `caddy_data` (persistant)

**Emplacement** : `/data/caddy` dans le container

**Contenu** :
- Certificats Let's Encrypt
- Clés privées
- Cache ACME

---

## 3. Validation DNS Avant Déploiement

### 3.1 Préflight DNS

**Commande** :
```bash
./lib/preflight/preflight.sh <tenant> <env>
```

**Vérifications** :
- Résolution DNS pour tous les hostnames (canonique + fallback)
- Cohérence IP (si IP serveur configurée)
- TTL acceptable (< 3600 secondes recommandé)

### 3.2 Validation Manuelle

**Script** :
```bash
./lib/preflight/check_dns.sh <hostname> [<expected_ip>]
```

**Exemple** :
```bash
# Vérifier résolution DNS
./lib/preflight/check_dns.sh odoo.prod.rozas.rozas.gp

# Vérifier résolution + IP attendue
./lib/preflight/check_dns.sh odoo.prod.rozas.rozas.gp 192.168.1.100
```

---

## 4. Gestion Erreurs Certificats

### 4.1 Erreurs Courantes

#### Erreur : "tlsv1 alert internal error"

**Cause** : DNS non propagé ou IP incorrecte

**Solution** :
1. Vérifier DNS : `dig +short <hostname>`
2. Vérifier que l'IP résolue correspond à l'IP du serveur
3. Attendre propagation DNS (TTL)
4. Redémarrer Caddy : `docker restart gateway-caddy`

#### Erreur : "could not get certificate from issuer"

**Cause** : Rate limit Let's Encrypt ou problème ACME

**Solution** :
1. Vérifier logs Caddy : `docker logs gateway-caddy`
2. Vérifier DNS : tous les hostnames doivent pointer vers le serveur
3. Vérifier ports 80/443 : doivent être ouverts et accessibles
4. Attendre si rate limit (5 certificats par semaine par domaine)

#### Erreur : "ambiguous site definition"

**Cause** : Hostname dupliqué dans Caddyfile

**Solution** :
1. Vérifier Caddyfile agrégé : `units/gateway/Caddyfile`
2. Vérifier déduplication : `dorevia.sh gateway aggregate`
3. Corriger Caddyfile et recharger : `dorevia.sh gateway reload`

### 4.2 Logs Caddy

**Commande** :
```bash
# Logs en temps réel
docker logs -f gateway-caddy

# Logs avec filtrage erreurs
docker logs gateway-caddy 2>&1 | grep -i "error\|certificate\|acme"
```

**Emplacements logs** :
- Container : `/var/log/caddy/` (si configuré)
- Docker : `docker logs gateway-caddy`

### 4.3 Vérification Certificats

**Commande** :
```bash
# Vérifier certificat via HTTPS
openssl s_client -connect <hostname>:443 -servername <hostname> < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Vérifier certificat via Caddy API (si activé)
curl http://localhost:2019/config/ | jq '.apps.tls.certificates'
```

**Informations** :
- Date d'émission
- Date d'expiration
- Émetteur (Let's Encrypt)

---

## 5. Procédure de Dépannage

### 5.1 Certificat Non Obtenu

**Checklist** :
1. ✅ DNS propagé : `dig +short <hostname>`
2. ✅ Ports 80/443 ouverts : `ss -tuln | grep -E ':80|:443'`
3. ✅ Caddyfile valide : `caddy validate --config units/gateway/Caddyfile`
4. ✅ Caddy démarré : `docker ps | grep gateway-caddy`
5. ✅ Logs Caddy : `docker logs gateway-caddy | tail -50`

**Actions** :
```bash
# 1. Vérifier DNS
./lib/preflight/check_dns.sh <hostname> <expected_ip>

# 2. Valider Caddyfile
caddy validate --config units/gateway/Caddyfile

# 3. Recharger Caddy
dorevia.sh gateway reload

# 4. Vérifier logs
docker logs gateway-caddy | tail -50
```

### 5.2 Certificat Expiré

**Cause** : Renouvellement automatique échoué

**Solution** :
1. Vérifier logs Caddy : `docker logs gateway-caddy | grep -i "renew\|expire"`
2. Vérifier DNS : doit toujours pointer vers le serveur
3. Forcer renouvellement : `docker restart gateway-caddy`
4. Vérifier certificat : `openssl s_client -connect <hostname>:443`

### 5.3 Rate Limit Let's Encrypt

**Limite** : 5 certificats par semaine par domaine

**Solution** :
1. Attendre 7 jours
2. Utiliser staging Let's Encrypt (test uniquement) :
   ```caddy
   {
     email admin@doreviateam.com
     acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
   }
   ```
3. Vérifier certificats existants : ne pas recréer inutilement

---

## 6. Tests Certificats Multi-Domaines

### 6.1 Test Automatique

**Script** :
```bash
# Tester tous les hostnames d'un tenant
./lib/preflight/check_dns.sh <hostname1>
./lib/preflight/check_dns.sh <hostname2>
# ...
```

### 6.2 Test Manuel

**Commandes** :
```bash
# Test HTTPS
curl -I https://<hostname>

# Test certificat
openssl s_client -connect <hostname>:443 -servername <hostname> < /dev/null

# Test depuis navigateur
# Ouvrir https://<hostname> et vérifier cadenas vert
```

---

## 7. Recommandations

### 7.1 DNS

- **TTL** : < 3600 secondes pour propagation rapide
- **Propagation** : Attendre 5-15 minutes après modification DNS
- **Vérification** : Toujours valider DNS avant déploiement

### 7.2 Certificats

- **Renouvellement** : Automatique (Caddy gère)
- **Monitoring** : Surveiller logs Caddy pour erreurs
- **Backup** : Volume `caddy_data` doit être sauvegardé

### 7.3 Production

- **Validation DNS** : Obligatoire avant déploiement PROD
- **Tests** : Tester certificats sur STINGER avant PROD
- **Documentation** : Documenter tous les hostnames configurés

---

**Dernière mise à jour** : 2026-01-02

