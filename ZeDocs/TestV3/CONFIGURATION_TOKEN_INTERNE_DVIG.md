# 🔐 Configuration Token Interne DVIG

**Date** : 2026-01-12  
**Token généré** : `0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI`

---

## 📋 Configuration Requise

### 1. Configuration DVIG

#### Option A : Variable d'environnement (docker-compose.yml)

```yaml
services:
  dvig:
    environment:
      - DVIG_INTERNAL_TOKEN=0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI
```

#### Option B : Fichier .env

```bash
# Dans le répertoire du docker-compose.yml
echo "DVIG_INTERNAL_TOKEN=0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI" >> .env
```

#### Option C : Export direct

```bash
export DVIG_INTERNAL_TOKEN=0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI
```

**Redémarrer le conteneur DVIG** :
```bash
docker restart dvig-<tenant>
```

---

### 2. Configuration Odoo

#### Via Interface Odoo

1. Aller dans **Paramètres** → **Technique** → **Paramètres** → **Paramètres Système**
2. Créer/modifier les paramètres suivants :

| Clé | Valeur |
|-----|--------|
| `dorevia.dvig.internal.token` | `0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI` |
| `dorevia.dvig.internal.url` | (Optionnel) URL complète ou laisser vide pour construction automatique |

#### Via Odoo Shell

```python
# Dans Odoo shell
env['ir.config_parameter'].sudo().set_param('dorevia.dvig.internal.token', '0MutdWWm97SG7KAHCd3jqGL7aYZNptuqSJiGyEOIzSI')

# Optionnel : URL complète (sinon construit depuis dorevia.dvig.url)
env['ir.config_parameter'].sudo().set_param('dorevia.dvig.internal.url', 'https://dvig.core-stinger.doreviateam.com/internal/outbox/process')
```

---

## ✅ Vérification

### Test de l'endpoint DVIG

```bash
curl -X POST https://dvig.<tenant>/internal/outbox/process \
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
docker logs dvig-<tenant> | grep "internal_trigger"
```

**Odoo** :
```bash
docker logs odoo-<tenant> | grep "Worker DVIG"
```

---

## 🔒 Sécurité

⚠️ **Important** : Ce token doit être :
- ✅ Stocké de manière sécurisée
- ✅ Identique dans DVIG et Odoo
- ✅ Non exposé publiquement
- ✅ Changé régulièrement en production

---

## 🚀 Prochaines Étapes

1. ✅ Configurer le token dans DVIG
2. ✅ Configurer le token dans Odoo
3. ✅ Redémarrer les services
4. ✅ Tester avec une facture
5. ✅ Vérifier les métriques Prometheus

---

**Statut** : ✅ Token généré et prêt à être configuré
