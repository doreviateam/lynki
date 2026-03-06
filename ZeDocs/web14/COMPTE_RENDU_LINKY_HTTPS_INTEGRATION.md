# Compte rendu détaillé — Linky en HTTPS (ui.lab.*)

**Date** : 2026-02-01  
**Contexte** : Exposer Dorevia Linky (Next.js) en **https://ui.lab.\<tenant>.doreviateam.com**.  
**Spec** : `ZeDocs/web14/SPEC_DOREVIA_LINKY_UI_v2.0.md`.

Ce document détaille les trois volets réalisés : (1) Dockerfile Linky, (2) intégration dans le rendu (Caddy + docker-compose app), (3) runbook « Servir Linky en https ».

---

## 1. Dockerfile pour Linky

### Objectif

Permettre de déployer Dorevia Linky en conteneur, avec un build Next.js optimisé et un serveur écoutant sur le **port 3000**, pour être exposé derrière Caddy (reverse_proxy).

### Fichier concerné

- **`units/dorevia-linky/Dockerfile`**

### Choix techniques

| Élément | Décision |
|--------|----------|
| Base build | `node:20-alpine` (étape 1) |
| Base runtime | `node:20-alpine` (étape 2) |
| Build | `npm ci` puis `npm run build` |
| Mode Next.js | **Standalone** (`output: "standalone"` dans `next.config.js`) pour réduire la taille de l’image et éviter d’embarquer tout `node_modules` en prod |
| Utilisateur | `nextjs` (uid 1001) pour ne pas tourner en root |
| Port | **3000** (variable `PORT=3000`, `HOSTNAME="0.0.0.0"` pour écoute sur toutes les interfaces dans le conteneur) |
| Commande | `node server.js` (fichier généré par Next.js dans `.next/standalone`) |

### Structure du Dockerfile

1. **Étape `builder`**  
   - Copie `package.json` (et `package-lock.json` si présent), `npm ci`, copie du code source, `npm run build`.  
   - Produit l’artefact dans `.next/` (standalone + static).

2. **Étape `runner`**  
   - Image légère, `NODE_ENV=production`.  
   - Copie `public/`, `.next/standalone/`, `.next/static/` depuis le builder.  
   - Utilisateur `nextjs`, exposition du port 3000, lancement de `server.js`.

### Modification associée

- **`units/dorevia-linky/next.config.js`**  
  - Ajout de `output: "standalone"` pour que `next build` génère le bundle standalone utilisé dans le Dockerfile.

### Build manuel

```bash
cd /opt/dorevia-plateform/units/dorevia-linky
docker build -t dorevia/linky:latest .
```

L’image peut être taguée avec une version (ex. `dorevia/linky:v0.1.0`) et poussée vers un registry si besoin.

### Résumé

- **Dockerfile** : multi-stage, Next.js standalone, port 3000, utilisateur non-root.  
- **next.config.js** : `output: "standalone"` pour le build Docker.  
- **Objectif** : image prête à être utilisée par le docker-compose rendu et par Caddy (reverse_proxy sur le conteneur `linky_<env>_<tenant>:3000`).

---

## 2. Intégration dans le rendu (Caddy + docker-compose app)

### Objectif

- Que le **Caddyfile** généré pour un tenant/env pointe l’hôte **ui.\<env>.\<tenant>.doreviateam.com** vers le **conteneur Linky** (port 3000) lorsque l’unité UI du tenant est **linky**.
- Que le **docker-compose** rendu pour l’univers **ui** génère un service **linky** (image, env, réseau) lorsque le manifest indique `units.ui: ["linky"]`.

Actuellement, l’univers UI peut être soit **appsmith** (port 80), soit **linky** (port 3000). Un seul backend par hostname : soit Appsmith soit Linky selon le manifest.

### 2.1 Rendu Caddyfile — `lib/render/render_caddyfile.sh`

#### Comportement avant

- Pour l’univers `ui`, le conteneur et le port étaient **fixes** : `appsmith_<env>_<tenant_id>`, port **80**.

#### Modifications

1. **Lecture de l’unité UI dans le manifest**  
   - Après la lecture du `manifest.json` (et après la vérification de l’env), une variable **`UI_UNIT`** est définie :  
     - `UI_UNIT=$(echo "$MANIFEST" | jq -r '(.units.ui // ["appsmith"])[0]')`  
   - Si le manifest n’est pas lu (ex. chemin intent), **`UI_UNIT`** reste vide et est forcée à **`appsmith`** par défaut.

2. **Fonctions `get_port_for_universe` et `get_container_for_universe`**  
   - **`get_port_for_universe(universe, [ui_unit])`**  
     - Pour `universe == "ui"` : si `ui_unit == "linky"` → **3000**, sinon → **80**.  
     - Les autres univers sont inchangés.  
   - **`get_container_for_universe(universe, env, tenant_id, [ui_unit])`**  
     - Pour `universe == "ui"` : si `ui_unit == "linky"` → **`linky_<env>_<tenant_id>`**, sinon → **`appsmith_<env>_<tenant_id>`**.  
     - Les autres univers sont inchangés (dont sylius avec suffixe `_nginx`).

3. **Boucle de génération des blocs**  
   - Lors de la génération du bloc pour l’univers `ui`, les appels passent **`UI_UNIT`** :  
     - `port=$(get_port_for_universe "$universe" "${UI_UNIT:-appsmith}")`  
     - `container=$(get_container_for_universe "$universe" "$ENV" "$TENANT_ID" "${UI_UNIT:-appsmith}")`  
   - Le bloc Caddy généré est donc du type :  
     - `ui.<env>.<tenant>.doreviateam.com { reverse_proxy linky_<env>_<tenant>:3000 }` si `units.ui[0] == "linky"`,  
     - sinon `reverse_proxy appsmith_<env>_<tenant>:80`.

#### Fichier modifié

- **`lib/render/render_caddyfile.sh`**  
  - Définition de `UI_UNIT` à partir du manifest.  
  - Signatures et logique de `get_port_for_universe` et `get_container_for_universe` étendues pour l’univers `ui` selon `ui_unit`.  
  - Appels dans la boucle mis à jour avec `UI_UNIT`.

### 2.2 Rendu docker-compose app — `lib/render/render_app_compose.sh`

#### Comportement avant

- Pour l’univers **ui**, seul un service **appsmith** était émis lorsque `units.ui` contenait **appsmith** (image, volumes, env Appsmith, pas de port exposé dans le compose car routage via Caddy).

#### Modifications

1. **Image Linky**  
   - Lecture d’une image optionnelle dans le manifest :  
     - `IMAGE_LINKY=$(echo "$MANIFEST" | jq -r '.images.linky // "dorevia/linky:latest"')`

2. **Nouveau bloc « Service Dorevia Linky »**  
   - Condition : `UNIVERS == "ui"` et `units.ui` contient **`linky`**.  
   - Service **linky** :  
     - `image` : `IMAGE_LINKY`  
     - `container_name` : **`linky_<env>_<tenant_id>`** (aligné avec le Caddyfile)  
     - `restart: unless-stopped`  
     - Variables d’environnement :  
       - **`VAULT_URL`** : défaut `http://vault-<tenant_id>:8080` (nom du service Vault côté plateforme)  
       - **`TENANT_ID`** : identifiant du tenant  
       - **`TZ`** (optionnel)  
     - Réseau **dorevia-network**  
     - Pas de volume (Linky est stateless pour ce MVP).  
   - Commentaire indiquant que le port 3000 est utilisé en interne (routage via Caddy).

#### Fichier modifié

- **`lib/render/render_app_compose.sh`**  
  - Ajout de `IMAGE_LINKY`.  
  - Ajout du bloc conditionnel pour le service **linky** lorsque `units.ui` contient `linky`.  
  - Aucun volume dédié à Linky (section volumes inchangée pour linky).

### 2.3 Manifest — choix Appsmith vs Linky

Dans **`tenants/<tenant>/state/manifest.json`** :

- **Appsmith** (comportement actuel par défaut) :  
  `"units": { "ui": ["appsmith"] }`  
  → Rendu : service appsmith, Caddy → `appsmith_<env>_<tenant>:80`.

- **Linky** :  
  `"units": { "ui": ["linky"] }`  
  → Rendu : service linky, Caddy → `linky_<env>_<tenant>:3000`.

Optionnel dans le manifest :  
`"images": { "linky": "dorevia/linky:v0.1.0" }` pour fixer la version de l’image.

### Résumé

- **Caddy** : le Caddyfile généré utilise désormais la première unité de `units.ui` (linky ou appsmith) pour choisir conteneur et port.  
- **Compose** : si `units.ui` contient **linky**, un service **linky** est généré avec `VAULT_URL` et `TENANT_ID`.  
- **URL visée** : après rendu, agrégation et déploiement, **https://ui.lab.\<tenant>.doreviateam.com** sert Linky lorsque le tenant est configuré en `linky`.

---

## 3. Runbook « Servir Linky en https (ui.lab.*) »

### Objectif

Documenter les étapes opérationnelles pour : builder l’image Linky, activer Linky dans le manifest, régénérer le rendu (app + Caddy), agréger le Caddyfile global, démarrer le conteneur Linky, et vérifier l’accès en HTTPS. Inclure aussi la procédure pour revenir à Appsmith si besoin.

### Fichier créé

- **`ZeDocs/web14/RUNBOOK_LINKY_HTTPS_UI_LAB.md`**

### Contenu du runbook (résumé)

| Section | Contenu |
|--------|---------|
| **Prérequis** | Réseau `dorevia-network`, Vault accessible depuis le conteneur Linky, Node ou Docker pour le build. |
| **1. Builder l’image** | `docker build -t dorevia/linky:latest .` dans `units/dorevia-linky`, avec option de tag de version. |
| **2. Activer Linky dans le manifest** | Mise à jour de `units.ui` en `["linky"]` (et optionnellement `images.linky`) dans `tenants/<tenant>/state/manifest.json`. |
| **3. Régénérer le rendu** | `dorevia.sh render <tenant> --env <env> --univers ui` puis `render_caddyfile.sh <tenant> <env>`. Résultat : compose avec service linky, Caddyfile avec bloc `ui.<env>.<tenant>` → `linky_<env>_<tenant>:3000`. |
| **4. Agréger et recharger la gateway** | `dorevia.sh gateway aggregate --reload`. Vérification du bloc dans `units/gateway/Caddyfile`. |
| **5. Démarrer Linky** | Dans `tenants/<tenant>/rendered/<env>/ui`, définir `VAULT_URL` et `TENANT_ID`, puis `docker compose up -d`. |
| **6. Vérifier HTTPS** | DNS, ouverture de https://ui.lab.\<tenant>.doreviateam.com, diagnostic 502 / SSL. |
| **7. Revenir à Appsmith** | Remettre `units.ui: ["appsmith"]`, régénérer rendu + Caddy, `gateway aggregate --reload`, et démarrer le compose Appsmith à la place. |

Le runbook renvoie à la spec Linky, au README de l’unité et au runbook SSL UI existant.

### Résumé

- **RUNBOOK** : une seule référence opérationnelle pour servir Linky en **https://ui.lab.\<tenant>.doreviateam.com**, de la build à la vérification, avec option de bascule retour Appsmith.

---

## Synthèse des fichiers créés ou modifiés

| Fichier | Action |
|---------|--------|
| `units/dorevia-linky/Dockerfile` | **Créé** — build multi-stage Next.js standalone, port 3000. |
| `units/dorevia-linky/next.config.js` | **Modifié** — ajout `output: "standalone"`. |
| `lib/render/render_caddyfile.sh` | **Modifié** — `UI_UNIT`, `get_port_for_universe` / `get_container_for_universe` pour linky (port 3000, conteneur linky_*). |
| `lib/render/render_app_compose.sh` | **Modifié** — `IMAGE_LINKY`, bloc service **linky** (env VAULT_URL, TENANT_ID). |
| `ZeDocs/web14/RUNBOOK_LINKY_HTTPS_UI_LAB.md` | **Créé** — runbook opérationnel Linky en HTTPS. |
| `ZeDocs/web14/COMPTE_RENDU_LINKY_HTTPS_INTEGRATION.md` | **Créé** — présent document (compte rendu détaillé). |

---

## Prochaines étapes possibles

- Builder l’image sur un serveur ou en CI et la pousser vers un registry.
- Passer un tenant (ex. core) en `units.ui: ["linky"]`, exécuter le runbook et valider https://ui.lab.core.doreviateam.com.
- Documenter dans le README de l’unité Linky le lien vers ce runbook et vers le compte rendu.
