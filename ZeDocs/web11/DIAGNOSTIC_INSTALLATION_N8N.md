# Diagnostic installation n8n — Dorevia

**Contexte** : n8n déployé via `dorevia.sh app up n8n <env> <tenant>` (ex. core / lab).  
**Symptômes possibles** : page setup en boucle, erreur au démarrage, credentials perdus après redémarrage, 502 / erreur interne.

---

## 1. Problèmes connus et correctifs

### 1.1 Clé de chiffrement (N8N_ENCRYPTION_KEY)

- **Requis** : n8n recommande une clé d’au moins **32 caractères** (idéalement 64 caractères hex pour du 256-bit).
- **Ancien rendu** : le compose généré utilisait une valeur fixe courte (`change-me-in-secrets`) ; le rendu a été corrigé pour utiliser la variable d’environnement **`N8N_ENCRYPTION_KEY`** (depuis un fichier `.env` ou l’environnement), avec une valeur par défaut de 32+ caractères.
- **À faire** : définir une clé stable dans `tenants/<tenant>/apps/n8n/<env>/.env` :
  ```bash
  # Générer une clé (64 caractères hex)
  openssl rand -hex 32
  # Puis dans tenants/core/apps/n8n/lab/.env :
  N8N_ENCRYPTION_KEY=<la_clé_générée>
  ```
  Puis **re-render** et **redémarrer** :
  ```bash
  bin/dorevia.sh render core --env lab
  bin/dorevia.sh app down n8n lab core
  bin/dorevia.sh app up n8n lab core
  ```
  **Attention** : si vous changez la clé après avoir déjà créé des credentials dans n8n, ceux-ci ne seront plus déchiffrables. Pour une première installation, définir la clé avant de créer le compte owner.

### 1.2 Fichier .env non pris en compte (compose généré avec valeur fixe)

- Si le compose généré contient une ligne **fixe** `N8N_ENCRYPTION_KEY: change-me-in-secrets`, le `.env` du répertoire app n’était pas utilisé pour cette variable.
- **Correctif** : mettre à jour le script de render (déjà fait) puis **re-générer** le compose :
  ```bash
  bin/dorevia.sh render core --env lab
  ```
  Vérifier que le fichier `tenants/core/apps/n8n/lab/docker-compose.yml` contient maintenant :
  `N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY:-...}`  
  Créer ou éditer `tenants/core/apps/n8n/lab/.env` avec une vraie `N8N_ENCRYPTION_KEY`, puis `app down` / `app up`.

### 1.3 Page « Set up owner account » en boucle

- Causes possibles :  
  - **Clé changée** entre deux démarrages → n8n considère une nouvelle instance, réaffiche le setup.  
  - **Volume ou DB réinitialisés** (nouveau volume, `app destroy --purge`) → installation vierge, le setup est normal.  
- **À faire** : créer le compte owner **une seule fois**, avec une **N8N_ENCRYPTION_KEY stable** (voir 1.1). Ne pas changer la clé ni purger les volumes après avoir créé des workflows/credentials.

### 1.4 Setup owner : pas de passage à l'écran suivant après « Next »

- **Symptôme** : après avoir cliqué « Next » sur « Set up owner account », la page ne change pas, alors que les logs montrent « Owner was set up successfully » puis « password authentication failed for user "n8n" ».
- **Cause** : PostgreSQL est considéré « healthy » par `pg_isready` avant d’accepter correctement les connexions authentifiées (mot de passe). n8n démarre, crée l’owner, puis les requêtes suivantes (auth, redirection) échouent car la connexion à la DB est intermittente.
- **Correctif** : le healthcheck PostgreSQL pour n8n a été renforcé : vérification d’une connexion authentifiée (`psql -U n8n -d n8n -c 'SELECT 1'`) au lieu de `pg_isready`, avec `start_period: 15s` et plus de retries. Après re-render et prochain déploiement, n8n ne démarrera qu’une fois la DB vraiment prête.
- **Immédiat** : le compte owner est déjà créé. Aller sur **https://n8n.lab.core.doreviateam.com/signin** et se connecter avec l’email et le mot de passe définis au setup.

### 1.5 Erreur au démarrage du conteneur (exit 1, logs)

- Consulter les logs :  
  `docker logs n8n_lab_core` (adapter `<env>_<tenant>`).
- Vérifier : **N8N_ENCRYPTION_KEY** définie (et longueur suffisante), **PostgreSQL** du service `db` démarré et healthy, **N8N_HOST** cohérent avec l’URL publique (ex. `n8n.lab.core.doreviateam.com`).

---

## 2. Vérifications rapides

| Vérification | Commande / action |
|--------------|-------------------|
| Conteneurs n8n + DB running | `docker ps \| grep n8n` |
| Logs n8n | `docker logs n8n_lab_core` |
| Compose utilise une variable pour la clé | `grep N8N_ENCRYPTION_KEY tenants/core/apps/n8n/lab/docker-compose.yml` |
| Fichier .env présent | `ls -la tenants/core/apps/n8n/lab/.env` |
| Clé définie (sans l’afficher) | `grep -q N8N_ENCRYPTION_KEY tenants/core/apps/n8n/lab/.env && echo OK` |

---

## 3. Après correction

1. Définir **N8N_ENCRYPTION_KEY** dans `tenants/core/apps/n8n/lab/.env` (32+ caractères, idéalement `openssl rand -hex 32`).  
2. Re-générer le compose : `bin/dorevia.sh render core --env lab`.  
3. Redémarrer : `bin/dorevia.sh app down n8n lab core` puis `bin/dorevia.sh app up n8n lab core`.  
4. Ouvrir https://n8n.lab.core.doreviateam.com : créer le compte owner **une fois**, puis importer les workflows (voir `TROUBLESHOOTING_SSL_N8N_LAB_CORE.md` §6 et `PROCEDURE_N8N_AUTH_WORKFLOWS.md`).
