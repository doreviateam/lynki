# Runbook — Migration Odoo 18 → 19 (données laplatine2026 vers o19)

**Objectif** : Restaurer les données de `odoo.lab.laplatine2026` (Odoo 18) sur `odoo.lab.o19` (Odoo 19).

## Contexte

La migration directe (restore dump + `odoo -u all`) échoue à cause d’incompatibilités de schéma :
- Colonnes manquantes (`res_partner.suggest_based_on`, etc.)
- Conversion JSON invalide (`Token "base" is invalid`)

## Options de migration

### 1. OCU — Odoo Community Upgrade (recommandé)

**URL** : https://ocu.winotto.com

- Migration 18 → 19 supportée
- Test gratuit (sortie neutralisée)
- Production : 99 EUR (backup complet)
- Formats : `.dump`, `.sql`, `.zip` (avec filestore)

**Procédure** :
1. Créer le dump : `./tenants/o19/apps/odoo/lab/dump_laplatine2026.sh`
2. Téléverser le fichier depuis `tenants/o19/apps/odoo/lab/dumps/`
3. Choisir cible : Odoo 19
4. Télécharger le backup migré
5. Restaurer sur o19 : `DUMP_FILE=/chemin/vers/migre.dump ./reinstall_o19.sh`

### 2. upgrade.odoo.com (Enterprise uniquement)

**URL** : https://upgrade.odoo.com

- Requiert un abonnement Odoo Enterprise
- Nécessite l’enregistrement de la base avec le code contrat

### 3. OpenUpgrade (OCA)

- Projet communautaire
- OpenUpgrade v19 en cours de financement (crowdfunding OCA)
- Migration manuelle : scripts dans `upgrades/` ou `migrations/`

## Dump laplatine2026

```bash
# Créer le dump
cd /opt/dorevia-plateform/tenants/o19/apps/odoo/lab
./dump_laplatine2026.sh

# Fichier généré
ls -la dumps/laplatine2026_*.dump
```

**Pour OCU** : créer une archive .zip avec dump + filestore :

```bash
cd /opt/dorevia-plateform/tenants/o19/apps/odoo/lab
DUMP=$(ls -t dumps/laplatine2026_*.dump 2>/dev/null | head -1)
mkdir -p /tmp/laplatine_migration
cp "$DUMP" /tmp/laplatine_migration/dump.dump
docker run --rm -v odoo_lab_laplatine2026_data:/src -v /tmp/laplatine_migration:/dst alpine sh -c "cp -a /src/filestore/laplatine2026 /dst/ 2>/dev/null || true"
cd /tmp/laplatine_migration && python3 -c "
import zipfile, os
os.chdir('/tmp/laplatine_migration')
with zipfile.ZipFile('laplatine2026_pour_ocu.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        for f in files:
            p = os.path.join(root, f)
            if not p.startswith('./laplatine2026_pour_ocu'):
                zf.write(p, p)
" && ls -la laplatine2026_pour_ocu.zip
```

Le dump est aussi copié dans `/tmp/` lors d’une exécution manuelle :

```bash
docker exec odoo_db_lab_laplatine2026 pg_dump -U odoo -Fc laplatine2026 > /tmp/laplatine2026_odoo18_$(date +%Y%m%d_%H%M%S).dump
```

## Filestore

Si laplatine2026 a des pièces jointes, copier le filestore :

```bash
# Source : volume odoo_lab_laplatine2026_data
# Cible : volume odoo_lab_o19_data

docker run --rm \
  -v odoo_lab_laplatine2026_data:/src:ro \
  -v odoo_lab_o19_data:/dst \
  alpine sh -c "cp -a /src/filestore/laplatine2026 /dst/filestore/odoo_lab_o19/"
```

## Modules OCA requis pour o19

Pour une installation vierge (sans dump migré), le tenant o19 installe automatiquement via `reinstall_o19.sh` :
- **account_usability** (19.0) — menus comptables manquants, option Anglo-Saxon ; dans `units/odoo/addons-o19/`
- **account_statement_base** (19.0) — base relevés bancaires OCA ; dans `units/odoo/addons-o19/`
- **queue_job** (19.0) — jobs asynchrones ; dans `units/odoo/addons-o19/`

**Note :** `account_reconcile_oca` n'est pas disponible en 19.0 (voir `RUNBOOK_ACCOUNT_RECONCILE_OCA_O19.md`).

Installation manuelle si besoin :
```bash
cd tenants/o19/apps/odoo/lab
docker compose run --rm --no-deps odoo odoo -c /etc/odoo/odoo.conf -d odoo_lab_o19 -i account_usability --stop-after-init
```

## Références

- OCU : https://ocu.winotto.com
- upgrade.odoo.com : https://upgrade.odoo.com
- OpenUpgrade OCA : https://github.com/OCA/OpenUpgrade
- Forum : https://www.odoo.com/forum/help-1/how-to-upgrade-from-latest-18-to-19-self-hosted-287090
