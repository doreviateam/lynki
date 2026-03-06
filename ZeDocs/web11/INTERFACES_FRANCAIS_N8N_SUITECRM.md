# Interfaces en français — n8n et SuiteCRM

---

## En pratique (résumé)

- **n8n** : il n’y a **pas** de réglage de langue dans l’interface (Settings → Personal ne contient pas d’option « Language »). La langue se configure **uniquement** via la variable d’environnement `N8N_DEFAULT_LOCALE=fr` dans le `.env` de l’app, puis redémarrage de n8n (voir section n8n ci‑dessous).
- **SuiteCRM** : sur la page de connexion, **identifiant** = `admin`, **mot de passe** = `admin` (ce sont les champs de connexion, pas des menus). Ensuite, menu **Admin** (en haut) → **Module Loader** pour installer le pack français.

---

## n8n

### Méthode 1 : Variable d'environnement (recommandé)

La variable **`N8N_DEFAULT_LOCALE`** définit la langue de l’interface (ex. `fr` pour le français).

- **Déjà pris en compte** : le compose généré par le render inclut `N8N_DEFAULT_LOCALE: ${N8N_DEFAULT_LOCALE:-fr}` — par défaut l’interface est en **français**.
- **Pour un tenant** : dans `tenants/<tenant>/apps/n8n/<env>/.env`, vous pouvez ajouter ou modifier :
  ```bash
  N8N_DEFAULT_LOCALE=fr
  ```
  Puis redémarrer n8n : `bin/dorevia.sh app down n8n <env> <tenant>` puis `app up n8n <env> <tenant>`.

Si vous avez déployé **avant** cette modification du render : re-générer le compose (`bin/dorevia.sh render <tenant> --env <env>`) puis redémarrer n8n ; ou ajouter `N8N_DEFAULT_LOCALE=fr` dans le fichier `.env` du répertoire app et redémarrer.

### Pas de réglage « Language » dans l’interface (n8n 2.x)

La page **Settings → Personal** ne propose que **Theme**, pas **Language**. La langue est définie **uniquement** par la variable d’environnement et éventuellement par la **langue du navigateur** (Accept-Language). Si l’interface reste en anglais alors que le conteneur a bien `N8N_DEFAULT_LOCALE=fr`, essayez de mettre le **français en première langue** dans les paramètres de votre navigateur, ou d’ouvrir n8n en **navigation privée** avec la langue du navigateur réglée sur français. (Il n’existe pas d’option « Language » ou « French » dans Personal Settings.)

**Note** : n8n ne traduit pas tout en français ; les chaînes non traduites restent en anglais.

---

## SuiteCRM

### Se connecter à SuiteCRM

Sur la page de connexion (https://suitecrm.lab.core.doreviateam.com), utilisez :

- **Identifiant (username)** : `admin`
- **Mot de passe (password)** : `admin`

*(Ce ne sont pas des menus : ce sont le nom d’utilisateur et le mot de passe du compte administrateur.)*

### Installer le pack de langue français

1. **Connectez-vous** avec le compte ci-dessus (admin / admin).
2. Dans le **menu du haut**, cliquez sur **Admin**, puis **Module Loader**.
3. **Télécharger** le pack de langue français pour votre version de SuiteCRM :
   - [SuiteCRM Language Packs (SourceForge)](https://sourceforge.net/projects/suitecrmtranslations/files/)  
   - ou [Crowdin – SuiteCRM Translations](https://crowdin.com/project/suitecrmtranslations)  
   Choisir la version (ex. 8.x) et le français.
4. **Upload** du fichier ZIP dans Module Loader, puis **Install**.
5. **Admin** → **Repair** → **Quick Repair and Rebuild**.
6. **Déconnexion** puis **reconnexion**.
7. **Changer la langue** : dans le profil utilisateur ou les préférences (souvent en haut à droite ou dans **Admin** → **Users** → votre utilisateur), définir **Language** sur **French**.

### Définir le français par défaut pour tous

Après installation du pack : **Admin** → **Locale** (ou **System Settings**) → définir la **Default Language** sur **French** si l’option existe.

---

## Récapitulatif

| Application | Méthode principale |
|-------------|---------------------|
| **n8n** | Pas de réglage langue dans l’interface. Variable `N8N_DEFAULT_LOCALE=fr` dans `tenants/…/apps/n8n/<env>/.env` puis redémarrage (`app down` puis `app up`). |
| **SuiteCRM** | Installer le pack de langue français via Admin → Module Loader, puis choisir French dans les préférences utilisateur ou les paramètres système. |
