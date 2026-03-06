# Runbook — Corriger l’erreur SSL sur ui.lab.sarl-la-platine.doreviateam.com

**Symptôme** : `SSL_ERROR_INTERNAL_ERROR_ALERT` ou « Le pair signale qu'il a eu une erreur interne » en ouvrant https://ui.lab.sarl-la-platine.doreviateam.com.

**Cause** : Caddy (gateway) sur le serveur ne sert pas de certificat pour ce hostname (config obsolète ou non rechargée).

---

## À faire sur le serveur (où tourne la gateway)

### 1. Vérifier que le Caddyfile contient le bloc UI

Sur la machine où le repo est déployé (ou où se trouve le Caddyfile de la gateway) :

```bash
grep -A2 "ui.lab.sarl-la-platine" /opt/dorevia-plateform/units/gateway/Caddyfile
```

Attendu :

```
ui.lab.sarl-la-platine.doreviateam.com {
  reverse_proxy appsmith_lab_sarl-la-platine:80
}
```

Si le bloc est absent : mettre à jour le repo (pull) puis regénérer le Caddyfile global :

```bash
cd /opt/dorevia-plateform
git pull   # ou déployer la version à jour
./bin/dorevia.sh gateway aggregate
```

### 2. S’assurer que Caddy utilise ce Caddyfile

- Si la gateway monte le fichier en volume : vérifier que le chemin monté pointe vers `units/gateway/Caddyfile` à jour.
- Si vous copiez le fichier dans le conteneur : après `gateway aggregate`, recopier le fichier puis recharger (voir étape 3).

### 3. Recharger Caddy

**Option A — Commande dorevia (recommandé)**  
À la racine du repo sur le serveur :

```bash
cd /opt/dorevia-plateform
./bin/dorevia.sh gateway aggregate --reload
```

**Option B — Rechargement manuel**  
Si le conteneur Caddy s’appelle `gateway-caddy` :

```bash
docker exec gateway-caddy caddy reload --config /etc/caddy/Caddyfile
```

Si le chemin du config dans le conteneur est différent, l’adapter. En cas d’échec du reload :

```bash
docker restart gateway-caddy
```

### 4. Vérifier les certificats

Après reload, Caddy demande les certificats Let’s Encrypt pour les nouveaux hostnames. Vérifier les logs :

```bash
docker logs gateway-caddy 2>&1 | tail -50
```

Rechercher des lignes contenant `ui.lab.sarl-la-platine` ou des erreurs `acme`, `certificate`.

### 5. Tester

- Ouvrir https://ui.lab.sarl-la-platine.doreviateam.com (nouvel onglet ou navigation privée).
- Ou en ligne de commande :  
  `curl -sI https://ui.lab.sarl-la-platine.doreviateam.com/`  
  → attendu : HTTP/2 200 ou 302 (plus d’erreur TLS).

---

## Prérequis côté infra

- **DNS** : `ui.lab.sarl-la-platine.doreviateam.com` doit pointer (A ou CNAME) vers l’IP du serveur où tourne Caddy (ex. 85.215.206.213).
- **Appsmith** : le conteneur `appsmith_lab_sarl-la-platine` doit être démarré et sur le même réseau Docker que Caddy (ex. `dorevia-network`), pour que `reverse_proxy appsmith_lab_sarl-la-platine:80` fonctionne.

Si après ces étapes l’erreur SSL persiste, vérifier les logs Caddy au moment du curl et l’exposition des ports 80/443 sur le serveur.
