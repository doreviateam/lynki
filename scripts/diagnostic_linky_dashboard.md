# Diagnostic — Tuiles Linky affichent "—"

## 1. Vérification rapide depuis le conteneur

```bash
# Depuis le conteneur Linky (l'API tourne dedans)
docker exec linky_lab_sarl-la-platine wget -qO- "http://127.0.0.1:3000/api/dashboard-metrics?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-02-23" | head -c 500
```

Si vous voyez du JSON avec `treasury`, `cash`, `business` → l'API fonctionne côté serveur.

## 2. Vérification via Caddy (comme le navigateur)

```bash
# Depuis la machine hôte (Caddy doit être joignable)
curl -s "http://localhost/api/dashboard-metrics?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-02-23" \
  -H "Host: ui.lab.sarl-la-platine.doreviateam.com" 2>/dev/null | head -c 500
```

Ou si vous accédez via HTTPS :
```bash
curl -sk "https://ui.lab.sarl-la-platine.doreviateam.com/api/dashboard-metrics?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-02-23" | head -c 500
```

## 3. Rebuild et redéploiement obligatoires

Les correctifs (fallback IconGrid, validation) sont dans le code source. Il faut **reconstruire** :

```bash
cd /opt/dorevia-plateform
docker build -t dorevia/linky:build-local -f units/dorevia-linky/Dockerfile units/dorevia-linky
./bin/dorevia.sh app up ui lab sarl-la-platine --force-recreate
```

## 4. Côté navigateur (DevTools)

1. F12 → onglet **Network**
2. Recharger la page (Ctrl+Shift+R)
3. Repérer la requête `dashboard-metrics`
4. Vérifier :
   - **Status** : 200 ?
   - **Response** : contient `treasury`, `cash`… ou `_fallback: true` ?

## 5. Logs Linky (si erreur API)

```bash
docker logs linky_lab_sarl-la-platine 2>&1 | grep -E "dashboard-metrics|Error"
```

Si vous voyez `[dashboard-metrics] Error:` → la cause est loguée.

## 6. Services requis

Linky dépend de :

- **vault-core-stinger** (agrégations)
- **dorevia-network** (réseau Docker partagé)

```bash
docker ps | grep -E "linky_lab|vault-core-stinger"
docker network inspect dorevia-network | grep -A2 linky_lab_sarl-la-platine
```
