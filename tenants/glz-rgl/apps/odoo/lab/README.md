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

### Module `dorevia_helloasso_adherent`

Connecteur MVP HelloAsso → `res.partner` (paramètres API sous **Paramètres**, bloc HelloAsso ; champs techniques sur le partenaire, onglet réservé aux utilisateurs paramètres).

« Tester la connexion » appelle OAuth2 + optionnellement `formTypes`. « Prévisualiser les données HelloAsso » : lecture seule `formTypes`, notification + log (aucune écriture Odoo). « Synchroniser les adhérents » reste un stub jusqu’au mapping SPEC §6.2.

### Erreurs `Invalid field 'helloasso_*'` ou Owl / « field is undefined » (`helloasso_external_id`)

La **vue** contient les champs HelloAsso, mais le **registre Python** n’expose pas encore ces champs sur `res.partner` : le code sur le disque n’est pas celui attendu, ou la **mise à jour de module** n’a pas été appliquée sur **cette** base (souvent après un `git pull` sans `odoo module upgrade`).

Les champs sont définis dans **`dorevia_partner_membership_fields`** (version **≥ 19.0.1.0.4**). À faire dans l’ordre :

1. **`git pull`** sur l’hôte qui sert les addons, puis **redémarrer** le conteneur Odoo (rechargement des workers).
2. Lancer la **mise à jour CLI** ci-dessous (**`dorevia_partner_membership_fields` en premier**), ou via **Apps** : mettre à jour la liste puis **Mettre à jour** ces deux modules.
3. Dans le navigateur : rechargement forcé (**Ctrl+Shift+R**) ou vider le cache pour les assets Odoo.
4. Si ça persiste : **Paramètres → Technique → Interface utilisateur → Vues** : vérifier qu’il n’y a pas une **vue personnalisée / Studio** obsolète sur `res.partner` qui référence encore des champs absents.

En cas de doute, vérifier dans **Paramètres → Technique → Structure de la base → Champs** le modèle `Contact` / `res.partner` : les champs `helloasso_*` doivent apparaître une fois `dorevia_partner_membership_fields` à jour.

Les champs et l’onglet **HelloAsso** sur `res.partner` sont dans **`dorevia_partner_membership_fields`** (pour éviter une base avec la vue mais sans champs si le connecteur API n’est pas installé). Le module **`dorevia_helloasso_adherent`** (API, paramètres) **dépend** de `dorevia_partner_membership_fields`. **`partner_contact_birthdate`** (OCA) fournit date de naissance / âge dans **Informations personnelles**.

### Mise à jour modules (CLI Odoo 19, conteneur qui tourne déjà)

Ne pas lancer un second `odoo -c … -u … --stop-after-init` dans le même conteneur : le port HTTP est déjà pris par le processus Odoo actif. Utiliser la sous-commande **`odoo module`** :

```bash
# Dépendances OCA pas encore installées (première fois après ajout birthdate)
docker exec odoo_lab_glz-rgl odoo module install -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl \
  partner_contact_personal_information_page partner_contact_birthdate

# Mise à jour des modules Dorevia
docker exec odoo_lab_glz-rgl odoo module upgrade -c /etc/odoo/odoo.conf -d odoo_lab_glz_rgl \
  dorevia_partner_membership_fields dorevia_helloasso_adherent
```

Adapter le nom du conteneur et le nom de la base si besoin.

### Même chose sur l’hôte public (`glz-rgl.doreviateam.com`)

Depuis l’environnement de développement (Cursor / CI), **on ne peut pas** exécuter Docker sur le serveur distant sans accès SSH. Sur **la machine qui héberge** réellement les conteneurs du lab :

```bash
cd /opt/dorevia-plateform
bash tenants/glz-rgl/apps/odoo/lab/upgrade-dorevia-odoo-on-host.sh
```

Le script enchaîne `git pull`, `odoo module upgrade` sur les deux modules Dorevia, puis `docker restart` du conteneur Odoo. Variables optionnelles : `REPO_ROOT`, `ODOO_CONTAINER`, `ODOO_DB`, `ODOO_CONF`, `GIT_BRANCH`.
