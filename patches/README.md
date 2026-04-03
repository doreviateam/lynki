# Correctifs hors dépôt upstream

## `dms-odoo19-compat-wip.patch`

Adaptation du module **OCA `dms`** (branche **18.0** du dépôt `sources/oca/dms`) pour **Odoo 19** : `res.groups` / `user_ids`, manifest `19.0.x`, vues XML, démo.

La branche officielle **19.0** sur [OCA/dms](https://github.com/OCA/dms) peut ne pas être disponible ; ce patch est la vérité déploiement dans ce monorepo.

### Application recommandée

À la racine du dépôt :

```bash
./scripts/apply-oca-dms-odoo19-patch.sh
```

Équivalent manuel :

```bash
cd sources/oca/dms
patch -p1 -N < ../../patches/dms-odoo19-compat-wip.patch
```

Puis dans Odoo : **installer** (ou mettre à jour) le module **`dms`** (« Documents »). Sans patch, le module reste « non installable » (manifest 18.0 sur serveur 19).

### Mise à jour du patch

Après modification locale dans `sources/oca/dms` :

```bash
cd sources/oca/dms && git diff dms > ../../patches/dms-odoo19-compat-wip.patch
```

### Notes

- Des avertissements `_sql_constraints` / `auto_join` peuvent apparaître dans les logs : dette technique OCA, hors périmètre immédiat.
- Le module **`dorevia_helloasso_adherent`** ne duplique plus les champs `documents_*` sur `res.config.settings` : ils sont fournis par **`dms`** une fois installé.
