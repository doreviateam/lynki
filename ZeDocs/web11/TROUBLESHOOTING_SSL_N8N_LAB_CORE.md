# Dépannage SSL — n8n.lab.core.doreviateam.com

**Erreur observée** : `SSL_ERROR_INTERNAL_ERROR_ALERT` — « Le pair signale qu'il a eu une erreur interne » lors de l’accès à **https://n8n.lab.core.doreviateam.com**.

---

## 0. 502 Bad Gateway — Caddy OK, n8n ne répond pas

**Symptôme** : la page affiche « 502 Bad Gateway » ou « Il semble y avoir un problème sur ce site ».

**Causes possibles** : le conteneur n8n est arrêté, en cours de démarrage, ou Caddy ne peut pas joindre le conteneur (réseau / nom).

**Vérifications sur le serveur** (depuis `/opt/dorevia-plateform`) :

```bash
# 1. Conteneurs n8n en cours d'exécution ?
docker ps | grep n8n

# 2. Logs n8n (démarrage, erreurs)
docker logs n8n_lab_core --tail 80

# 3. Caddy et n8n sur le même réseau ?
docker network inspect dorevia-network --format '{{range .Containers}}{{.Name}} {{end}}'

# 4. Recharger Caddy (au cas où)
bin/dorevia.sh gateway aggregate --reload
```

- Si **n8n_lab_core** est absent ou **Exited** : consulter les logs pour l’erreur (ex. N8N_ENCRYPTION_KEY, DB). Corriger puis `bin/dorevia.sh app up n8n lab core`.
- Si n8n vient de démarrer : attendre **30 à 60 secondes** puis réessayer l’URL.
- Si Caddy et n8n ne sont pas sur le même réseau : vérifier `bin/dorevia.sh gateway up` et que le Caddyfile pointe vers `n8n_lab_core:5678`.

---

## 1. Causes possibles (erreur TLS)

1. **Caddy (gateway) ne tourne pas** sur le serveur qui reçoit le trafic (IP 85.215.206.213).
2. **Ports 80 / 443** fermés en pare-feu sur ce serveur, ou Caddy non exposé sur 80/443.
3. **Certificat TLS** : Caddy n’a pas pu obtenir un certificat Let’s Encrypt pour `n8n.lab.core.doreviateam.com` (ACME HTTP-01 exige que le port 80 soit joignable depuis Internet).
4. **Caddyfile pas à jour** sur le serveur (agrégation faite ailleurs, ou Caddy pas rechargé après modification).

---

## 2. Vérifications sur le serveur (85.215.206.213)

### 2.1 Gateway (Caddy) démarrée

Sur la machine où doit tourner la gateway (celle qui a l’IP publique 85.215.206.213) :

```bash
cd /opt/dorevia-plateform/units/gateway
docker ps | grep gateway-caddy
```

- Si **absent** : démarrer la gateway :  
  `bin/dorevia.sh gateway up` (depuis la racine du repo, sur ce serveur).
- Si la gateway tourne **ailleurs** (autre machine) : il faut que le trafic 80/443 soit acheminé vers cette machine, ou que la gateway soit déployée sur le serveur 85.215.206.213.

### 2.2 Ports 80 et 443 ouverts

- **Pare-feu local** : autoriser 80 (TCP) et 443 (TCP).
- **OVH / hébergeur** : vérifier que les ports 80 et 443 sont ouverts (règles firewall, groupe de sécurité, etc.).

```bash
sudo ss -tlnp | grep -E ':80|:443'
# ou
sudo netstat -tlnp | grep -E ':80|:443'
```

Vous devez voir un processus (souvent Docker/Caddy) en écoute sur 80 et 443.

### 2.3 Caddyfile à jour et rechargé

- Le fichier **units/gateway/Caddyfile** doit contenir le bloc **n8n.lab.core.doreviateam.com** (déjà le cas après `gateway aggregate`).
- Recharger Caddy après toute modification :  
  `bin/dorevia.sh gateway aggregate --reload`  
  ou redémarrer le conteneur :  
  `docker restart gateway-caddy`

### 2.4 Logs Caddy (certificat / TLS)

```bash
docker logs gateway-caddy 2>&1 | tail -100
```

- Chercher des lignes contenant **n8n.lab.core**, **certificate**, **acme**, **error**.
- Si Let’s Encrypt échoue (ex. « challenge failed ») : vérifier que le **port 80** est bien joignable depuis Internet vers 85.215.206.213 (pas bloqué par un autre service ni par l’hébergeur).

---

## 3. ACME / Let’s Encrypt (port 80)

Caddy obtient les certificats via HTTP-01 (Let’s Encrypt). Pour **n8n.lab.core.doreviateam.com** :

1. **DNS** : `n8n.lab.core.doreviateam.com` doit résoudre vers **85.215.206.213** (déjà fait chez OVH).
2. **Port 80** : une requête vers `http://n8n.lab.core.doreviateam.com/.well-known/acme-challenge/...` doit atteindre **Caddy** sur le serveur 85.215.206.213 (pas un autre service).

Si un autre service (Apache, Nginx, autre reverse proxy) écoute déjà sur 80, il peut intercepter le challenge et provoquer des erreurs SSL. Dans ce cas : faire terminer TLS sur Caddy seul (80 + 443) ou configurer ce service pour laisser passer ACME.

---

## 4. Résumé des actions

| Action | Commande / vérification |
|--------|--------------------------|
| Démarrer la gateway (sur le serveur cible) | `bin/dorevia.sh gateway up` |
| Vérifier le bloc n8n dans le Caddyfile | `grep -A2 n8n.lab.core units/gateway/Caddyfile` |
| Recharger Caddy après modif | `bin/dorevia.sh gateway aggregate --reload` ou `docker restart gateway-caddy` |
| Ouvrir 80/443 (pare-feu, hébergeur) | Selon OVH / firewall |
| Consulter les erreurs TLS/certificat | `docker logs gateway-caddy 2>&1 | tail -100` |

---

## 5. Test après correction

Une fois Caddy démarré, 80/443 ouverts et certificat obtenu :

- **Navigateur** : https://n8n.lab.core.doreviateam.com  
- **curl** : `curl -sI https://n8n.lab.core.doreviateam.com`
- **Script** : `./scripts/check_https_n8n.sh core lab` (vérifie HTTPS depuis le serveur).

---

## 6. Après correction SSL — valider n8n (workflow + webhook)

Une fois l'accès HTTPS opérationnel :

1. **Ouvrir n8n** : https://n8n.lab.core.doreviateam.com  
2. **Importer le workflow template** : dans l'UI n8n, *Workflows* → *Import from File* → choisir `units/n8n/workflows/webhook-echo.json`.  
3. **Activer le workflow** : bascule *Active* à ON.  
4. **Tester le webhook** :
   ```bash
   ./scripts/test_n8n_webhook.sh core lab --public
   ```
   Résultat attendu : `OK HTTP 200 — réponse: {"received":...}`.  
   En cas de 404 : vérifier que le workflow est bien activé et que l'URL du webhook est `.../webhook/web-to-lead`.
