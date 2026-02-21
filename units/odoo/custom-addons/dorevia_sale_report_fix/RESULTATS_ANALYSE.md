# 📊 Résultats de l'analyse des interférences

## Ordre de chargement des modules dorevia_*

D'après les logs :
- `dorevia_billing_core` : Charge en position 46/52
- `dorevia_posted_lock` : Charge en position 47/52
- `dorevia_sale_report_fix` : Charge en position 56/63 (dernier)

**Conclusion** : `dorevia_sale_report_fix` charge **après** les autres modules dorevia_*, donc il devrait avoir la priorité finale sur les templates.

## Modules qui modifient les templates de rapports

**Résultat de la recherche** :
- ✅ Seul `dorevia_sale_report_fix` modifie les templates de rapports de vente
- ✅ Aucun autre module (dorevia_* ou tiers) ne modifie `sale.report_saleorder*`

**Conclusion** : Les modules dorevia_* **ne semblent pas interférer** directement avec la génération de PDF.

## Hypothèses sur le problème

### Hypothèse 1 : Le xpath ne trouve pas l'élément

Notre xpath : `//t[@t-call='sale.report_saleorder_document']`

**Problème possible** : Si le template standard a été modifié par un autre module (non-dorevia) ou si la structure est différente, notre xpath ne trouvera pas l'élément.

**Solution** : Vérifier la structure exacte du template dans la base de données.

### Hypothèse 2 : Le rapport utilisé n'est pas celui que nous modifions

Nous modifions `sale.report_saleorder_raw`, mais peut-être que le rapport utilisé est :
- `sale.report_saleorder` (qui appelle `report_saleorder_raw`)
- Un rapport personnalisé
- Un rapport d'un module tiers

**Solution** : Vérifier quel rapport est réellement utilisé lors de la génération du PDF.

### Hypothèse 3 : Le cache Odoo n'est pas vidé

Même après `-u all`, il peut y avoir un cache résiduel.

**Solution** : Vider complètement le cache Odoo :
```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo rm -rf /var/lib/odoo/filestore/*/cache/*
docker compose restart odoo
```

### Hypothèse 4 : Un module tiers (non-dorevia) modifie les templates

Il est possible qu'un module installé dans `/mnt/extra-addons` modifie les templates.

**Solution** : Vérifier tous les modules dans `/mnt/extra-addons` :
```bash
cd /opt/dorevia-plateform/tenants/core/apps/odoo/lab
docker compose exec -T odoo find /mnt/extra-addons -name "*.xml" -exec grep -l "report\|template" {} \;
```

## Actions recommandées

1. **Vérifier la vue QWeb effective** dans l'interface Odoo (voir `VERIFICATION_RAPPORT.md`)
2. **Vérifier quel rapport est utilisé** lors de la génération du PDF
3. **Vider le cache Odoo** complètement
4. **Vérifier les modules tiers** qui pourraient modifier les templates

## Conclusion

Les modules dorevia_* **ne semblent pas être la cause** du problème. Le problème vient probablement :
- D'un problème avec notre xpath qui ne trouve pas l'élément
- D'un cache Odoo qui n'est pas vidé
- D'un module tiers qui modifie les templates
- Du fait que le rapport utilisé n'est pas celui que nous modifions

