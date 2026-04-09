# Odoo 19 local - test `base_accounting_kit`

Ce dossier sert a lancer une instance Odoo 19 locale dediee au test du module :

- `base_accounting_kit`
- source : <https://apps.odoo.com/apps/modules/19.0/base_accounting_kit>

## 1. Deposer le module

Telecharger le module depuis ton compte Odoo Apps, puis dezipper son contenu ici :

- `addons-thirdparty/base_accounting_kit`

Le dossier final doit contenir au minimum :

- `addons-thirdparty/base_accounting_kit/__manifest__.py`

## 2. Lancer la stack

```bash
cd /Users/doreviateam/lynki/sandboxes/odoo19-accounting-kit
docker compose up -d --build
```

## 3. Ouvrir Odoo

- URL : <http://localhost:18079>
- base conseillee : `odoo19_accounting_kit`
- mot de passe maitre : `admin`

## 4. Installer le module

Dans Odoo :

1. creer la base `odoo19_accounting_kit`
2. activer le mode developpeur
3. mettre a jour la liste des applications
4. chercher `base_accounting_kit`
5. installer

## 5. Dependance Python deja prevue

Le conteneur installe deja :

- `openpyxl`
- `ofxparse`
- `qifparse`

Ce sont les dependances externes mentionnees sur la page du module.

## 6. Arret

```bash
cd /Users/doreviateam/lynki/sandboxes/odoo19-accounting-kit
docker compose down
```
