# 🚀 Commandes de Configuration - Token Interne DVIG

**Token** : `0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI`  
**Date** : 2026-01-12

---

## ✅ Configuration DVIG (Déjà fait)

Le token a été ajouté dans `tenants/core-stinger/platform/docker-compose.yml`.

**Redémarrer DVIG** :
```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker-compose restart dvig
```

**Vérifier** :
```bash
docker exec dvig-core-stinger env | grep DVIG_INTERNAL_TOKEN
```

---

## 📋 Configuration Odoo

### Option 1 : Via Interface Odoo

1. Aller dans **Paramètres** → **Technique** → **Paramètres** → **Paramètres Système**
2. Créer/modifier :
   - **Clé** : `dorevia.dvig.internal.token`
   - **Valeur** : `0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI`

### Option 2 : Via Odoo Shell

```bash
# Se connecter au conteneur Odoo
docker exec -it odoo-<tenant> odoo shell -d <database>

# Dans le shell Odoo
env['ir.config_parameter'].sudo().set_param('dorevia.dvig.internal.token', '0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI')

# Optionnel : URL complète (sinon construit automatiquement)
env['ir.config_parameter'].sudo().set_param('dorevia.dvig.internal.url', 'https://dvig.core-stinger.doreviateam.com/internal/outbox/process')
```

### Option 3 : Via SQL direct

```bash
# Se connecter à la base de données Odoo
docker exec -it odoo-db-<tenant> psql -U odoo -d <database>

# Dans psql
INSERT INTO ir_config_parameter (key, value, create_date, write_date, create_uid, write_uid)
VALUES ('dorevia.dvig.internal.token', '0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI', NOW(), NOW(), 2, 2)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, write_date = NOW(), write_uid = 2;
```

---

## ✅ Vérification

### Test de l'endpoint DVIG

```bash
curl -X POST https://dvig.core-stinger.doreviateam.com/internal/outbox/process \
  -H "Authorization: Bearer 0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

**Réponse attendue** :
```json
{
  "processed": 5,
  "succeeded": 4,
  "failed_soft": 1,
  "failed_hard": 0,
  "duration_ms": 842
}
```

### Test depuis Odoo

1. Créer une facture dans Odoo
2. Valider la facture (`action_post()`)
3. Vérifier dans **Job Queue** → **Jobs** qu'un job "Trigger DVIG worker" a été créé
4. Vérifier que le job s'exécute avec succès

### Vérification des logs

**DVIG** :
```bash
docker logs dvig-core-stinger --tail 50 | grep "internal_trigger"
```

**Odoo** :
```bash
docker logs odoo-<tenant> --tail 50 | grep "Worker DVIG"
```

---

## 🔄 Redémarrage des Services

```bash
# Redémarrer DVIG
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker-compose restart dvig

# Redémarrer Odoo (si nécessaire)
docker restart odoo-<tenant>
```

---

## ✅ Checklist

- [x] Token ajouté dans docker-compose.yml DVIG
- [ ] Token configuré dans Odoo (paramètre système)
- [ ] DVIG redémarré
- [ ] Test de l'endpoint DVIG réussi
- [ ] Test depuis Odoo réussi (création facture)

---

**Statut** : ✅ Token configuré dans DVIG, en attente de configuration Odoo
