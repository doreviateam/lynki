# Runbook — Erreur SSL odoo.lab.o19.doreviateam.com

**Symptôme :** `SSL_ERROR_INTERNAL_ERROR_ALERT` — « Le pair signale qu'il a eu une erreur interne »  
**URL concernée :** https://odoo.lab.o19.doreviateam.com  
**Date :** 2026-03-06

---

## 1. Diagnostic rapide

| Vérification | Commande | Attendu |
|--------------|----------|---------|
| DNS | `dig +short odoo.lab.o19.doreviateam.com` | Une IP (ex. 85.215.206.213) |
| Conteneurs o19 | `docker ps \| grep o19` | odoo_lab_o19, linky_lab_o19 up |
| Gateway | `docker ps \| grep gateway-caddy` | gateway-caddy up |
| Réseau | `docker network inspect dorevia-network` | gateway-caddy et odoo_lab_o19 présents |
| Caddyfile o19 | `grep -A2 "odoo.lab.o19" units/gateway/Caddyfile` | Bloc présent |

---

## 2. Causes possibles

### 2.1 Certificat Let's Encrypt non encore obtenu

Caddy obtient le certificat à la **première requête HTTPS**. Si l'ACME (HTTP-01) échoue :
- Port 80 non accessible depuis Internet (pare-feu, NAT)
- Domaine non résolu côté Let's Encrypt
- Rate limit Let's Encrypt (trop de requêtes récentes)

### 2.2 Erreur interne Caddy pendant le handshake

Le serveur envoie `internal_error` au client — souvent « no certificate available ».

---

## 3. Actions correctives

### 3.1 Recharger la gateway et forcer une nouvelle tentative

```bash
cd /opt/dorevia-plateform
./bin/dorevia.sh gateway aggregate --reload
```

Puis réessayer dans le navigateur (bouton « Réessayer »).

### 3.2 Vérifier les logs Caddy lors de l'accès

Dans un terminal :
```bash
docker logs -f gateway-caddy
```

Dans un autre terminal ou navigateur, accéder à https://odoo.lab.o19.doreviateam.com  
Rechercher dans les logs : erreurs ACME, `odoo.lab.o19`, `certificate`, `tls`.

### 3.3 Tester en HTTP (contournement temporaire)

Si le problème persiste, vérifier que le reverse proxy fonctionne :

```bash
curl -v -k -H "Host: odoo.lab.o19.doreviateam.com" http://localhost:8069/
```

(En local, depuis la machine hébergeant Docker — remplacer localhost par l'IP du serveur si distant.)

### 3.4 Vérifier l'accessibilité des ports 80 et 443

Let's Encrypt doit atteindre le serveur sur le port 80 pour le défi HTTP-01 :

```bash
# Depuis l'extérieur du serveur
curl -I http://odoo.lab.o19.doreviateam.com/.well-known/acme-challenge/test
```

Si le port 80 est bloqué, le certificat ne pourra pas être émis.

### 3.5 Redémarrer Caddy (dernier recours)

```bash
cd /opt/dorevia-plateform/units/gateway
docker compose restart caddy
```

Attendre 30 s puis réessayer.

---

## 4. Vérification post-correction

```bash
curl -sI https://odoo.lab.o19.doreviateam.com | head -5
```

Attendu : `HTTP/2 200` ou `HTTP/2 302` (redirection Odoo).

---

## 5. Références

- Plan o19 : `ZeDocs/web39/PLAN_IMPLEMENTATION_O19_ODOO19_SCRUM.md`
- Caddy Community : [SSL_ERROR_INTERNAL_ERROR_ALERT](https://caddy.community/t/ssl-error-internal-error-alert-when-trying-to-access-the-website-with-https/23301)
