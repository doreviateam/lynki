# OCA Document Management System (DMS) – Odoo 18

Le dépôt **dms** (branche 18.0) est cloné dans `sources/oca/dms`. Les modules sont pris en charge automatiquement par `oca_flatten.sh` au démarrage des conteneurs Odoo lab (lglz44, o19, etc.).

## Modules disponibles

| Module | Description |
|--------|-------------|
| **dms** | Document Management System (base) – à installer en premier |
| **dms_auto_classification** | Classification automatique des documents |
| **dms_field** | Champ DMS dans les vues / enregistrements |
| **dms_field_auto_classification** | Classification auto dans les DMS embarqués |
| **dms_user_role** | Rôles utilisateur DMS |
| **hr_dms_field** | Champ DMS pour les employés (RH) |
| **web_editor_media_dialog_dms** | Intégration DMS dans la boîte de dialogue média de l’éditeur web |

## Installation sur une instance (ex. odoo.lab.lglz44.doreviateam.com)

1. Redémarrer Odoo pour exécuter `oca_flatten.sh` et recréer les symlinks :
   ```bash
   cd tenants/<tenant>/apps/odoo/lab   # ex. tenants/lglz44/apps/odoo/lab
   docker compose restart odoo
   ```

2. Dans Odoo : **Mode Développeur** → **Applications** → **Mettre à jour la liste**, puis rechercher « Document Management System » et installer le module **dms**. Installer les modules optionnels selon besoin.

## Configuration après installation

1. **Documents → Configuration → Storages** : créer un stockage (Database, Attachment ou File).
2. **Configuration → Access Groups** : créer des groupes d’accès (Create, Write, Unlink).
3. **Documents → Directories** : créer un répertoire racine, l’associer au stockage et aux groupes.

## Dépendances

- **python-magic** (et **libmagic1**) : recommandés pour le type MIME et l’aperçu des fichiers. Ils sont inclus dans l’image construite depuis `units/odoo/Dockerfile`. Pour les instances qui utilisent l’image officielle `odoo:18.0-*` sans rebuild, rebuilder une image à partir de `units/odoo/Dockerfile` pour bénéficier de python-magic, ou accepter un aperçu limité.

## Références

- [OCA/dms sur GitHub](https://github.com/OCA/dms) (branche 18.0)
- Documentation du module : `sources/oca/dms/dms/README.rst`
