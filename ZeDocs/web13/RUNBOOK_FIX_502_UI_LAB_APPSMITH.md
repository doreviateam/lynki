# Runbook — Corriger le 502 sur ui.lab.sarl-la-platine.doreviateam.com

**Symptôme** : 502 Bad Gateway en ouvrant https://ui.lab.sarl-la-platine.doreviateam.com (TLS OK, mais la page ne s’affiche pas).

**Cause** : le conteneur **appsmith_lab_sarl-la-platine** n’est pas démarré (ou pas sur le réseau `dorevia-network`). Caddy fait un reverse_proxy vers ce conteneur ; s’il est absent, Caddy renvoie 502.

---

## 1. Vérifier si le conteneur tourne

Sur le serveur :

```bash
docker ps -a --format "table {{.Names}}\t{{.Status}}" | grep appsmith
```

Si **appsmith_lab_sarl-la-platine** est absent ou en état **Exited**, il faut le démarrer (étape 2).

---

## 2. Démarrer Appsmith pour sarl-la-platine

Il faut définir **APPSMITH_ENCRYPTION_PASSWORD** et **APPSMITH_ENCRYPTION_SALT** (même valeurs que pour les autres instances Appsmith, ou générer des valeurs dédiées).

**Option A — Depuis le compose rendu (recommandé)**

```bash
cd /opt/dorevia-plateform/tenants/sarl-la-platine/rendered/lab/ui

# Créer un .env avec les secrets (à adapter avec vos valeurs)
export APPSMITH_ENCRYPTION_PASSWORD="votre_mot_de_passe_secret_long"
export APPSMITH_ENCRYPTION_SALT="votre_salt_secret"

docker compose up -d
```

**Option B — Depuis l’unit Appsmith (variables d’environnement)**

```bash
cd /opt/dorevia-plateform/units/appsmith

export DEPLOY_ENV=lab
export TENANT_ID=sarl-la-platine
export APPSMITH_ENCRYPTION_PASSWORD="votre_mot_de_passe_secret_long"
export APPSMITH_ENCRYPTION_SALT="votre_salt_secret"

docker compose up -d
```

Cela crée le conteneur **appsmith_lab_sarl-la-platine** et le connecte au réseau **dorevia-network** (déclaré dans le compose).

---

## 3. Vérifier le réseau

Le conteneur doit être sur le même réseau que la gateway Caddy :

```bash
docker network inspect dorevia-network --format '{{range .Containers}}{{.Name}} {{end}}' | tr ' ' '\n' | grep -E "gateway|appsmith"
```

Vous devez voir **gateway-caddy** (ou le nom du conteneur Caddy) et **appsmith_lab_sarl-la-platine**.

---

## 4. Attendre le démarrage d’Appsmith

Appsmith peut mettre **1 à 2 minutes** à répondre sur le port 80. En cas de 502 persistant :

```bash
docker logs appsmith_lab_sarl-la-platine --tail 30
```

Puis réessayer l’URL après une minute.

---

## 5. Tester

Ouvrir à nouveau **https://ui.lab.sarl-la-platine.doreviateam.com** (ou cliquer sur « Réessayer »). La page de connexion Appsmith doit s’afficher.

---

**Résumé** : le 502 vient du backend absent. Démarrer le conteneur **appsmith_lab_sarl-la-platine** (compose rendu ou unit appsmith avec `DEPLOY_ENV=lab` et `TENANT_ID=sarl-la-platine`), avec les variables d’encryption, puis vérifier qu’il est bien sur **dorevia-network**.
