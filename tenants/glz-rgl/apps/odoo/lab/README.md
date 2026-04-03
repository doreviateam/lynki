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

« Tester la connexion » appelle OAuth2 + optionnellement `formTypes`. « Synchroniser les adhérents » reste un stub jusqu’au mapping SPEC §6.2.
