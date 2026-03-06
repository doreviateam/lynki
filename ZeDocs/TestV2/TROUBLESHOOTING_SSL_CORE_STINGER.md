# 🔧 Troubleshooting SSL — core-stinger

**Date** : 2026-01-10  
**Problème** : Erreur SSL `tlsv1 alert internal error` sur `dvig.core-stinger.doreviateam.com` et `vault.core-stinger.doreviateam.com`

---

## 🔍 Symptômes

```bash
$ curl -I https://dvig.core-stinger.doreviateam.com/health
curl: (35) OpenSSL/3.0.13: error:0A000438:SSL routines::tlsv1 alert internal error
```

---

## ✅ Vérifications Effectuées

### 1. Services Internes ✅

Les services fonctionnent correctement en interne :

```bash
$ docker exec dvig-core-stinger curl -s http://localhost:8080/health
{"service":"dvig","status":"healthy","timestamp":"2026-01-10T14:48:08.529820+00:00","version":"0.1.2"}
```

### 2. Caddyfile ✅

Le Caddyfile contient bien les hostnames :

```caddyfile
dvig.core-stinger.doreviateam.com {
  reverse_proxy dvig-core-stinger:8080
}

vault.core-stinger.doreviateam.com {
  reverse_proxy vault-core-stinger:8080
}
```

### 3. Validation Caddyfile ✅

```bash
$ docker exec gateway-caddy caddy validate --config /etc/caddy/Caddyfile
Valid configuration
```

### 4. DNS ✅

Les enregistrements DNS sont corrects :

```bash
$ dig +short dvig.core-stinger.doreviateam.com
85.215.206.213
```

---

## 🔍 Diagnostic

L'erreur `tlsv1 alert internal error` indique généralement que :

1. **Caddy n'a pas encore généré les certificats SSL** pour les nouveaux hostnames
2. **Let's Encrypt est en cours de génération** (peut prendre 1-2 minutes)
3. **Problème de configuration TLS** dans Caddy

---

## 🔧 Solutions

### Solution 1 : Attendre la Génération Automatique (Recommandé)

Caddy génère automatiquement les certificats Let's Encrypt lors de la première requête HTTPS. Cela peut prendre **1-2 minutes**.

**Actions** :
1. Attendre 1-2 minutes
2. Réessayer : `curl -I https://dvig.core-stinger.doreviateam.com/health`

### Solution 2 : Forcer la Génération via HTTP

Forcer une requête HTTP pour déclencher la génération :

```bash
curl -I http://dvig.core-stinger.doreviateam.com/health
```

Caddy devrait automatiquement rediriger vers HTTPS et générer le certificat.

### Solution 3 : Vérifier les Logs Caddy

Surveiller les logs pour voir la génération de certificats :

```bash
docker logs gateway-caddy --tail 50 -f | grep -E "core-stinger|acme|obtain|certificate"
```

### Solution 4 : Redémarrer Caddy (Si nécessaire)

Si les certificats ne sont pas générés après 5 minutes :

```bash
docker restart gateway-caddy
```

Attendre 1-2 minutes puis réessayer.

### Solution 5 : Vérifier les Limites Let's Encrypt

Si vous avez atteint les limites de génération Let's Encrypt (50 certificats par semaine par domaine), attendre ou utiliser un certificat wildcard.

---

## 📊 État Actuel

- ✅ Services internes : Fonctionnels
- ✅ Caddyfile : Valide et configuré
- ✅ DNS : Propagé correctement
- ⏳ Certificats SSL : En cours de génération

---

## ⏰ Timeline Attendu

1. **0-30 secondes** : Caddy détecte le nouveau hostname
2. **30-60 secondes** : Let's Encrypt valide le domaine
3. **60-120 secondes** : Certificat généré et installé
4. **Après 2 minutes** : HTTPS fonctionnel

---

## ✅ Vérification Finale

Une fois les certificats générés :

```bash
# Vérifier le certificat
curl -vI https://dvig.core-stinger.doreviateam.com/health 2>&1 | grep -E "SSL|certificate|issuer"

# Health check
curl -I https://dvig.core-stinger.doreviateam.com/health

# Devrait retourner : HTTP/2 200
```

---

## 🆘 Si le Problème Persiste

Si après 5 minutes les certificats ne sont toujours pas générés :

1. **Vérifier les logs Caddy** :
   ```bash
   docker logs gateway-caddy --tail 200 | grep -i "error\|failed\|core-stinger"
   ```

2. **Vérifier les limites Let's Encrypt** :
   - Limite : 50 certificats par semaine par domaine
   - Vérifier : https://letsencrypt.org/docs/rate-limits/

3. **Vérifier la connectivité réseau** :
   ```bash
   # Depuis le serveur
   curl -I http://dvig.core-stinger.doreviateam.com/health
   ```

4. **Vérifier la configuration Caddy** :
   ```bash
   docker exec gateway-caddy caddy validate --config /etc/caddy/Caddyfile
   ```

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : 🔧 **Troubleshooting en cours**
