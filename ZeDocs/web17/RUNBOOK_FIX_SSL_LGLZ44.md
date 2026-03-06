# Runbook — Corriger l'erreur SSL sur odoo.lab.lglz44.doreviateam.com

**Symptôme** : `SSL_ERROR_INTERNAL_ERROR_ALERT` ou « Le pair signale qu'il a eu une erreur interne » en ouvrant https://odoo.lab.lglz44.doreviateam.com.

**Cause probable** : Caddy n'a pas encore obtenu le certificat Let's Encrypt pour ce hostname (domaine récemment ajouté).

---

## À faire sur le serveur

### 1. Vérifier le bloc Caddy

```bash
grep -A2 "odoo.lab.lglz44" /opt/dorevia-plateform/units/gateway/Caddyfile
```

Attendu :
```
odoo.lab.lglz44.doreviateam.com {
  reverse_proxy odoo_lab_lglz44:8069
}
```

Si absent : `./bin/dorevia.sh gateway aggregate` puis reload (étape 3).

### 2. Recharger Caddy

```bash
cd /opt/dorevia-plateform
docker compose -f units/gateway/docker-compose.yml exec caddy caddy reload --config /etc/caddy/Caddyfile
```

### 3. Forcer la génération du certificat via HTTP

Caddy obtient le certificat à la première requête. Forcer une requête HTTP :

```bash
curl -I http://odoo.lab.lglz44.doreviateam.com
```

Caddy redirige vers HTTPS et déclenche l'obtention Let's Encrypt.

### 4. Si ça échoue : redémarrer Caddy

```bash
docker restart gateway-caddy
```

Attendre 1-2 minutes puis réessayer.

### 5. Vérifier les logs Caddy

```bash
docker logs gateway-caddy --tail 100 2>&1 | grep -E "lglz44|acme|obtain|certificate|error"
```

---

## Prérequis

- **DNS** : `odoo.lab.lglz44.doreviateam.com` → 85.215.206.213
- **Ports 80 et 443** : accessibles depuis Internet (challenge ACME Let's Encrypt)
- **Backend Odoo** : conteneur `odoo_lab_lglz44` démarré sur `dorevia-network`

---

## Timeline attendue

- **0-60 s** : Let's Encrypt valide le domaine
- **1-2 min** : Certificat généré et installé
- **Après 2 min** : HTTPS fonctionnel
