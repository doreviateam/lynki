# Correctifs hors dépôt upstream

## `dms-odoo19-compat-wip.patch`

Modifications locales sur le sous-module **`sources/oca/dms`** (OCA, branche `18.0`) pour compatibilité Odoo **19** (`res.groups.user_ids`, manifest, vues).

Elles **ne sont pas poussées** sur `github.com/OCA/dms` (droits / compte).

### Application (sur une copie propre du sous-module)

```bash
cd sources/oca/dms
git status   # doit être aligné sur origin/18.0 sans changements
patch -p1 < ../../../patches/dms-odoo19-compat-wip.patch
```

Vérifier les rejets éventuels (`*.rej`).

### Mise à jour du patch

Après modification dans `sources/oca/dms` :

```bash
cd sources/oca/dms && git diff > ../../patches/dms-odoo19-compat-wip.patch
```

(ajuster le chemin relatif selon l’emplacement du fichier patch.)
