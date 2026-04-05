# Odoo lab — GLZ-RGL

URL : https://glz-rgl.doreviateam.com  
Base : `odoo_lab_glz_rgl` (voir `odoo.conf` — créé localement à partir de `odoo.conf.example`, non versionné)

## Custom addons Dorevia

Le répertoire `units/odoo/custom-addons` du dépôt est monté en lecture seule dans le conteneur sous `/mnt/custom-addons` (voir `docker-compose.yml`).

Après un ajout ou une mise à jour de module dans ce dossier sur l’hôte :

1. Sur le serveur : `git pull` dans `/opt/dorevia-plateform` (ou le chemin équivalent du déploiement).
2. Redémarrer Odoo pour recharger le code si besoin :  
   `docker compose -f docker-compose.yml restart odoo`  
   (depuis ce répertoire `lab/`, avec le bon contexte réseau/volumes).
3. Dans l’interface Odoo : **Apps** → **Mettre à jour la liste des Apps**.
4. Rechercher **dorevia** ou **HelloAsso**, puis **Installer** (ou **Mettre à jour**) le module concerné.

### Modules HelloAsso — `dorevia_helloasso_members` et shim `dorevia_helloasso_adherent`

La **synchro Membership**, le **cron**, la **prévisualisation** et le bloc **Paramètres** HelloAsso sont dans **`dorevia_helloasso_members`** (dépend du socle **`dorevia_helloasso_connector`**). **`dorevia_helloasso_adherent`** est un **shim** (même nom de module pour les bases existantes) qui ne fait que dépendre de `members` et rester **application** dans la liste des Apps.

Connecteur MVP HelloAsso → `res.partner` (paramètres API sous **Paramètres**, bloc HelloAsso ; champs techniques sur le partenaire via **`dorevia_partner_membership_fields`**).

« Tester la connexion » appelle OAuth2 + optionnellement `formTypes`. « Prévisualiser les données HelloAsso » : rapport **lecture seule** (formTypes, formulaires Membership, totaux commandes/paiements, identifiants candidats) dans une **fenêtre modale** — pas seulement une notification courte ; détail aussi dans les logs serveur. « Synchroniser les adhérents » reste un stub jusqu’au mapping SPEC §6.2.

### Erreurs `Invalid field 'helloasso_*'` ou Owl / « field is undefined » (`helloasso_external_id`)

La **vue** contient les champs HelloAsso, mais le **registre Python** n’expose pas encore ces champs sur `res.partner` : le code sur le disque n’est pas celui attendu, ou la **mise à jour de module** n’a pas été appliquée sur **cette** base (souvent après un `git pull` sans `odoo module upgrade`).

Les champs sont définis dans **`dorevia_partner_membership_fields`** (version **≥ 19.0.1.0.4**). À faire dans l’ordre :

1. **`git pull`** sur l’hôte qui sert les addons, puis **redémarrer** le conteneur Odoo (rechargement des workers).
2. Lancer la **mise à jour CLI** ci-dessous (**`dorevia_partner_membership_fields` en premier**), ou via **Apps** : mettre à jour la liste puis **Mettre à jour** ces deux modules.
3. Dans le navigateur : rechargement forcé (**Ctrl+Shift+R**) ou vider le cache pour les assets Odoo.
4. Si ça persiste : **Paramètres → Technique → Interface utilisateur → Vues** : vérifier qu’il n’y a pas une **vue personnalisée / Studio** obsolète sur `res.partner` qui référence encore des champs absents.

En cas de doute, vérifier dans **Paramètres → Technique → Structure de la base → Champs** le modèle `Contact` / `res.partner` : les champs `helloasso_*` doivent apparaître une fois `dorevia_partner_membership_fields` à jour.

### Erreur upgrade : « Le champ catalog_form_id n’existe pas » (`dorevia.helloasso.billetterie.order`)

La **vue** billetterie attend le champ **`catalog_form_id`** sur les commandes, mais le **code Python** chargé par Odoo ne le déclare pas (fichier `helloasso_billetterie_order.py` trop ancien dans le conteneur, ou module masqué par un autre répertoire dans `addons_path`).

1. Sur l’hôte qui monte les volumes : **`git pull`** sur le dépôt (branche livrée), puis vérifier :
   `grep -r catalog_form_id units/odoo/custom-addons/dorevia_helloasso_billetterie/models/helloasso_billetterie_order*.py`  
   (le champ est défini dans **`helloasso_billetterie_order_catalog.py`** depuis la version **19.0.1.9.0** du module.)
2. Dans le conteneur :  
   `docker exec odoo_lab_glz-rgl sh -c 'grep -r catalog_form_id /mnt/custom-addons/dorevia_helloasso_billetterie/models/helloasso_billetterie_order*.py'`  
   Si vide : le volume ou le déploiement n’est pas aligné avec le dépôt (fichier **`helloasso_billetterie_order_catalog.py`** manquant ou ancien).
3. **`docker restart`** du service Odoo (workers), puis relancer la mise à jour du module **`dorevia_helloasso_billetterie`**.
4. Aligner **`addons_path`** sur **`odoo.conf.example`** : **`/mnt/custom-addons` avant `/mnt/addons-o19`**, puis **redémarrer** le conteneur — ainsi les modules Dorevia ne sont pas masqués par un homonyme éventuel dans la pile OCA.

Le script **`upgrade-dorevia-odoo-on-host.sh`** vérifie la présence de `catalog_form_id` dans le `.py` **avant** l’upgrade billetterie.

### Journal des synchros (`dorevia.helloasso.logentry`)

Le modèle technique est **`dorevia.helloasso.logentry`** (module **`dorevia_helloasso_connector`**, fichier `helloasso_sync_log.py`). Les droits **`ir.model.access`** sont créés au chargement du registre via **`_register_hook`**.

Ordre recommandé : **`dorevia_helloasso_connector`** → **`dorevia_helloasso_members`** → **`dorevia_helloasso_adherent`** (shim) → **`dorevia_helloasso_billetterie`**.

### Documents (OCA **dms**) sur Odoo 19

1. Appliquer le patch : `./scripts/apply-oca-dms-odoo19-patch.sh` (voir `patches/README.md`).
2. Installer le module **`dms`** dans Odoo (Apps → Documents / « Document Management System »).

Sans patch, `dms` reste non installable (manifest 18.0) ; les vues Paramètres peuvent alors provoquer une erreur Owl sur `documents_binary_max_size` si des données orphelines existent déjà en base. Le module **`dorevia_res_config_dms_shim`** expose les champs `documents_*` attendus par ces vues (dépendance de **`dorevia_helloasso_members`** / chaîne HelloAsso).

Les champs et l’onglet **HelloAsso** sur `res.partner` sont dans **`dorevia_partner_membership_fields`**. **`dorevia_helloasso_members`** (paramètres API, synchro) **dépend** de `dorevia_partner_membership_fields`. **`partner_contact_birthdate`** (OCA) fournit date de naissance / âge dans **Informations personnelles**.

### Mise à jour modules (CLI Odoo 19, conteneur qui tourne déjà)

Ne pas lancer un second `odoo -c … -u … --stop-after-init` dans le même conteneur : le port HTTP est déjà pris par le processus Odoo actif. Utiliser la sous-commande **`odoo module`** :

```bash
# Dépendances OCA pas encore installées (première fois après ajout birthdate)
docker exec odoo_lab_glz-rgl odoo module install -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl \
  partner_contact_personal_information_page partner_contact_birthdate

# Shim DMS : installer une première fois (upgrade échoue si le module n’est pas installé)
docker exec odoo_lab_glz-rgl odoo module install -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_res_config_dms_shim \
  || docker exec odoo_lab_glz-rgl odoo module upgrade -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_res_config_dms_shim

# Mise à jour des modules Dorevia (ordre : champs partenaire → connector → members → shim adherent → billetterie)
docker exec odoo_lab_glz-rgl odoo module upgrade -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl \
  dorevia_partner_membership_fields
docker exec odoo_lab_glz-rgl odoo module install -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_helloasso_connector \
  || docker exec odoo_lab_glz-rgl odoo module upgrade -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_helloasso_connector
docker exec odoo_lab_glz-rgl odoo module install -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_helloasso_members \
  || docker exec odoo_lab_glz-rgl odoo module upgrade -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_helloasso_members
docker exec odoo_lab_glz-rgl odoo module upgrade -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl \
  dorevia_helloasso_adherent
docker exec odoo_lab_glz-rgl odoo module install -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_helloasso_billetterie \
  || docker exec odoo_lab_glz-rgl odoo module upgrade -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl dorevia_helloasso_billetterie
```

Adapter le nom du conteneur et le nom de la base si besoin.

### Même chose sur l’hôte public (`glz-rgl.doreviateam.com`)

Depuis l’environnement de développement (Cursor / CI), **on ne peut pas** exécuter Docker sur le serveur distant sans accès SSH. Sur **la machine qui héberge** réellement les conteneurs du lab :

```bash
cd /opt/dorevia-plateform
bash tenants/glz-rgl/apps/odoo/lab/upgrade-dorevia-odoo-on-host.sh
```

Le script enchaîne `git pull`, `odoo module upgrade` (ou install) sur les modules Dorevia **membership_fields**, **helloasso_adherent** et **helloasso_billetterie**, puis `docker restart` du conteneur Odoo. Entre adhérent et billetterie, il vérifie que le code du **journal** (`dorevia.helloasso.logentry`) est bien présent dans le volume, puis que **`catalog_form_id`** est présent côté billetterie. Variables optionnelles : `REPO_ROOT`, `ODOO_CONTAINER`, `ODOO_DB`, `ODOO_CONF`, `GIT_BRANCH`.
