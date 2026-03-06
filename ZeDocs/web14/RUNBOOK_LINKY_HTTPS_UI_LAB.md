# Runbook — Servir Dorevia Linky en HTTPS (ui.lab.*)

**Objectif** : Exposer l’interface Dorevia Linky (Next.js) en **https://ui.lab.\<tenant>.doreviateam.com**, derrière la gateway Caddy. Spec : `ZeDocs/web14/SPEC_DOREVIA_LINKY_UI_v2.0.md`.

---

## Prérequis

- Réseau Docker `dorevia-network` existant.
- Vault du tenant accessible (ex. `vault-<tenant>:8080`) depuis le conteneur Linky.
- Node 18+ (ou Docker) pour builder l’image Linky.

---

## 1. Builder l’image Linky

À la racine du dépôt (ou sur une machine avec Docker) :

```bash
cd /opt/dorevia-plateform/units/dorevia-linky
docker build -t dorevia/linky:latest .
```

Optionnel : tag de version pour traçabilité :

```bash
docker build -t dorevia/linky:v0.1.0 .
```

---

## 2. Activer Linky dans le manifest du tenant

Dans `tenants/<tenant>/state/manifest.json` :

- Vérifier que `universes` contient `"ui"` et que `environments` contient l’env cible (ex. `"lab"`).
- Mettre l’unité UI à **linky** (au lieu d’appsmith) :

```json
"units": {
  "ui": ["linky"]
}
```

Et éventuellement l’image dans `images` :

```json
"images": {
  "linky": "dorevia/linky:latest"
}
```

Sauvegarder le fichier.

---

## 3. Régénérer le rendu (app + Caddy)

Depuis la racine du dépôt :

```bash
cd /opt/dorevia-plateform

# Rendu docker-compose pour l’univers ui (tenant + env)
./bin/dorevia.sh render <tenant> --env <env> --univers ui

# Rendu Caddyfile pour le même tenant + env
./lib/render/render_caddyfile.sh <tenant> <env>
```

Exemple pour core / lab :

```bash
./bin/dorevia.sh render core --env lab --univers ui
./lib/render/render_caddyfile.sh core lab
```

Résultat attendu :

- `tenants/<tenant>/rendered/<env>/ui/docker-compose.yml` : service **linky** avec `VAULT_URL`, `TENANT_ID`.
- `tenants/<tenant>/rendered/<env>/caddy/Caddyfile` : bloc `ui.<env>.<tenant>.doreviateam.com` avec `reverse_proxy linky_<env>_<tenant>:3000`.

---

## 4. Agréger le Caddyfile global et recharger la gateway

```bash
./bin/dorevia.sh gateway aggregate --reload
```

Vérification :

```bash
grep -A2 "ui.lab.<tenant>" units/gateway/Caddyfile
```

Attendu (ex. tenant core) :

```
ui.lab.core.doreviateam.com {
  reverse_proxy linky_lab_core:3000
}
```

---

## 5. Démarrer Linky (conteneur)

Variables d’environnement recommandées (dans un `.env` à côté du docker-compose rendu ou exportées) :

- `VAULT_URL` : URL du Vault **interne** (ex. `http://vault-core:8080`).
- `TENANT_ID` : identifiant tenant (ex. `core`).

Exemple :

```bash
cd tenants/core/rendered/lab/ui
export VAULT_URL=http://vault-core:8080
export TENANT_ID=core
docker compose up -d
```

Vérifier que le conteneur tourne :

```bash
docker ps --filter name=linky_lab_core
```

---

## 6. Vérifier l’accès HTTPS

1. **DNS** : Le hostname `ui.lab.<tenant>.doreviateam.com` doit résoudre vers l’IP du serveur où tourne la gateway (ou du load balancer devant Caddy).
2. Ouvrir dans un navigateur : **https://ui.lab.\<tenant>.doreviateam.com**
3. La page d’accueil Dorevia Linky doit s’afficher (carte « Ventes certifiées » si le Vault répond).

En cas d’erreur :

- **502 Bad Gateway** : le conteneur Linky n’est pas joignable par Caddy (réseau, nom du conteneur, port 3000).
- **SSL** : exécuter à nouveau `./bin/dorevia.sh gateway aggregate --reload` et vérifier les logs Caddy.

---

## 7. Revenir à Appsmith (optionnel)

Pour servir à nouveau Appsmith sur la même URL :

1. Dans `manifest.json`, remettre `"units": { "ui": ["appsmith"] }`.
2. Régénérer rendu + Caddy : `render core --env lab --univers ui`, `render_caddyfile.sh core lab`.
3. `gateway aggregate --reload`.
4. Dans `tenants/<tenant>/rendered/<env>/ui`, lancer le compose Appsmith à la place de Linky (`docker compose down` puis `docker compose up -d` avec le compose contenant appsmith).

---

## Références

- Spec produit : `ZeDocs/web14/SPEC_DOREVIA_LINKY_UI_v2.0.md`
- Unité Linky : `units/dorevia-linky/README.md`
- Runbook SSL UI (Appsmith) : `ZeDocs/web13/RUNBOOK_FIX_SSL_UI_LAB.md`
