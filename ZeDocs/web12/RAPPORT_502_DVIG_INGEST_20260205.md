# Rapport d’analyse — 502 Bad Gateway sur DVIG /ingest

**Date** : 5 février 2026  
**Contexte** : Facture FAC/2026/00027 (Odoo stinger sarl-la-platine) — section « SÉCURITÉ DE LA FACTURE » en « Échec temporaire ».

---

## 1. Symptôme

- **Message d’erreur** :  
  `HTTP None: 502 Server Error: Bad Gateway for url: https://dvig.core-stinger.doreviateam.com/ingest`
- **Statut de protection** : Échec temporaire  
- **Dernière tentative** : 05/02/2026 16:11:28  
- **Nombre de tentatives** : 7  
- **Prochaine tentative** : 05/02/2026 17:11:28  

Odoo envoie bien les requêtes POST vers DVIG (`/ingest`) avec le token ; c’est la réponse HTTP qui est un **502 Bad Gateway**, donc le problème est côté infrastructure / service DVIG, pas dans la logique métier Odoo.

---

## 2. Interprétation du 502

Un **502 Bad Gateway** signifie que le reverse proxy (Caddy, devant `dvig.core-stinger.doreviateam.com`) a bien reçu la requête, mais que la réponse reçue du serveur en amont (le conteneur DVIG) est invalide ou inexistante. Causes typiques :

1. **Conteneur DVIG (`dvig-core-stinger`) arrêté ou en crash**
2. **DVIG ne répond pas sur le port attendu (8080)** (process down, écoute sur une autre interface, etc.)
3. **Réseau Docker** : la gateway et le conteneur DVIG ne sont pas sur le même réseau, ou le nom `dvig-core-stinger` n’est pas résolu
4. **Timeout** : DVIG met trop de temps à répondre, le proxy renvoie 502
5. **Réponse HTTP invalide** renvoyée par DVIG (proxy considère que ce n’est pas une réponse valide)

---

## 3. Chaîne technique concernée

- **Odoo** (stinger sarl-la-platine) → `dorevia.dvig.url` = `https://dvig.core-stinger.doreviateam.com`  
- **Caddy** (gateway) : bloc `dvig.core-stinger.doreviateam.com { reverse_proxy dvig-core-stinger:8080 }`  
- **Service amont** : conteneur `dvig-core-stinger` (DVIG FastAPI, endpoint POST `/ingest`)

Le connecteur Odoo appelle correctement `{dvig_url}/ingest` (sans `/api/v1`). L’application DVIG (FastAPI) expose bien `POST /ingest`. Donc le souci n’est pas une mauvaise URL côté Odoo.

---

## 4. Vérifications recommandées

À exécuter sur l’hôte où tournent Caddy et les conteneurs du tenant core-stinger.

### 4.1 État du conteneur DVIG

```bash
docker ps -a --filter name=dvig-core-stinger
docker logs dvig-core-stinger --tail 100
```

- Si le conteneur est **Exited** ou **Restarting** : redémarrer ou corriger la cause du crash (logs, santé DB, Vault, etc.).
- Si les logs montrent des **exceptions Python** ou des erreurs au démarrage : corriger la config ou les dépendances (tokens, DB, VAULT_URL, etc.).

### 4.2 Réseau et résolution

```bash
# Depuis le conteneur Caddy (ou un conteneur sur le même réseau)
docker exec <container_caddy> wget -qO- http://dvig-core-stinger:8080/health || echo "Échec"

# Ou depuis l’hôte si le port est exposé
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port_dvig>/health
```

- Si « Échec » ou pas de 200 : DVIG est injoignable depuis la gateway (réseau ou processus).

### 4.3 Accès HTTPS depuis l’extérieur

```bash
curl -v -X POST https://dvig.core-stinger.doreviateam.com/health
curl -v -X POST https://dvig.core-stinger.doreviateam.com/ingest \
  -H "Authorization: Bearer <TOKEN_VALIDE>" \
  -H "Content-Type: application/json" \
  -d '{"source": "...", "event_id": "test-502", "event_type": "account_move.posted", "occurred_at": "2026-02-05T16:00:00Z", "data": {}}'
```

- Si ces appels renvoient aussi **502** : confirmer que le problème est bien entre Caddy et DVIG (ou entre le monde extérieur et Caddy, si Caddy est derrière un autre proxy).

### 4.4 Configuration Caddy

- Vérifier que le Caddyfile effectivement chargé contient bien :  
  `dvig.core-stinger.doreviateam.com { reverse_proxy dvig-core-stinger:8080 }`
- Vérifier que le conteneur Caddy et le conteneur `dvig-core-stinger` partagent un réseau Docker où le nom `dvig-core-stinger` est résolu (ex. `dorevia-network` ou réseau du tenant core-stinger).

---

## 5. Actions correctives proposées

1. **Redémarrer le conteneur DVIG**  
   `cd /opt/dorevia-plateform/tenants/core-stinger/platform && docker compose restart dvig-core-stinger`  
   Puis revérifier les logs et refaire un POST sur `/ingest` (ou déclencher « Refresh Proof Now » / prochaine tentative CRON sur la facture).

2. **Vérifier la santé de la stack core-stinger**  
   S’assurer que Vault et la base DVIG (si utilisée) sont joignables par DVIG ; sinon, 502 ou timeouts peuvent venir d’un blocage côté DVIG (ex. appel à Vault qui ne répond pas).

3. **Vérifier les tokens**  
   Le fichier `tenants/core-stinger/secrets/dvig.tokens.yml` doit contenir un token valide pour le tenant attendu par Odoo (ex. `sarl-la-platine`). Une erreur 502 peut apparaître avant même que DVIG n’ait le temps de renvoyer un 401/403 si le process DVIG crash au démarrage ou à la première requête.

4. **Augmenter les timeouts Caddy** (si les logs montrent des timeouts)  
   Dans le bloc Caddy, ajouter par exemple :  
   `reverse_proxy dvig-core-stinger:8080 { transport http { read_timeout 60s } }`

5. **Après correction**  
   Sur la facture FAC/2026/00027, utiliser « Refresh Proof Now » ou attendre la prochaine tentative automatique (17:11:28) ; le statut devrait passer de « Échec temporaire » à « Vaulted » si DVIG et Vault répondent correctement.

---

## 6. Résumé

| Élément | Valeur |
|--------|--------|
| Erreur | 502 Bad Gateway |
| URL appelée | `https://dvig.core-stinger.doreviateam.com/ingest` |
| Proxy | Caddy → `dvig-core-stinger:8080` |
| Cause probable | Conteneur DVIG down / injoignable / timeout ou réponse invalide |
| Prochaine étape | Vérifier `docker ps` et `docker logs dvig-core-stinger`, puis redémarrer si besoin et retester `/ingest` |

Ce rapport peut être conservé comme référence pour tout incident 502 sur l’endpoint DVIG `/ingest` (tenant core-stinger).

---

## 7. Résolution (5 février 2026)

**Cause identifiée** : Le conteneur **dvig-core-stinger** n’était pas démarré (aucun conteneur correspondant). Caddy renvoyait donc 502 car l’upstream était injoignable.

**Actions effectuées** :

1. **Démarrage du service DVIG** :
   ```bash
   cd /opt/dorevia-plateform/tenants/core-stinger/platform
   docker compose -p dorevia_core-stinger_platform up -d dvig
   ```

2. **Vérifications** :
   - `docker ps` : conteneur `dvig-core-stinger` Up (healthy), image `dorevia/dvig:0.1.6`
   - Health depuis le conteneur : `{"service":"dvig","status":"healthy",...}`
   - Connectivité Caddy → DVIG : `docker exec gateway-caddy wget -qO- http://dvig-core-stinger:8080/health` → réponse OK

**État actuel** : DVIG est opérationnel. Les prochaines tentatives Odoo vers `https://dvig.core-stinger.doreviateam.com/ingest` (CRON ou « Refresh Proof Now » sur la facture) devraient aboutir, sous réserve d’un token valide et d’une config Vault correcte.

**Recommandation** : Pour éviter une régression, s’assurer que le stack core-stinger (dvig + vault + vault-db) est bien démarré après un redémarrage hôte ou un déploiement, par exemple :
```bash
docker compose -p dorevia_core-stinger_platform up -d
```
