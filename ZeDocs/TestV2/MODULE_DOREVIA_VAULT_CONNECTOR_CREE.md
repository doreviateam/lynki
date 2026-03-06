# ✅ Module `dorevia_vault_connector` créé

**Date** : 2026-01-10  
**Statut** : ✅ Module créé et prêt à être installé

---

## 📦 Structure du module

```
units/odoo/custom-addons/dorevia_vault_connector/
├── __init__.py
├── __manifest__.py
├── README.md
├── models/
│   ├── __init__.py
│   └── account_move.py
└── security/
    └── ir.model.access.csv
```

---

## 🎯 Fonctionnalités

### Vaulting automatique

- ✅ Surcharge `action_post()` sur `account.move`
- ✅ Vaulting automatique après validation
- ✅ Mise à jour `dorevia_vaulted = True` après succès
- ✅ Support : `out_invoice`, `in_invoice`, `out_refund`, `in_refund`

### Envoi vers DVIG

- ✅ Format payload conforme DVIG API
- ✅ Authentification Bearer Token
- ✅ Endpoint : `{dvig_url}/ingest`
- ✅ Gestion d'erreurs (ne bloque pas la validation)

---

## ⚙️ Configuration requise

Les paramètres suivants doivent être configurés dans Odoo :

| Paramètre | Exemple | État |
|-----------|---------|------|
| `dorevia.dvig.url` | `https://dvig.core-stinger.doreviateam.com` | ✅ Déjà configuré |
| `dorevia.dvig.token` | `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g` | ✅ Déjà configuré |
| `dorevia.dvig.source` | `odoo.stinger.sarl-la-platine` | ✅ Déjà configuré |

---

## 🚀 Installation

### 1. Redémarrer Odoo (si nécessaire)

Pour que Odoo détecte le nouveau module, redémarrer le container :

```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml restart odoo
```

### 2. Mettre à jour la liste des modules

Dans Odoo :
- **Paramètres → Applications → Mettre à jour la liste des applications**

### 3. Installer le module

- Rechercher **"Dorevia Vault Connector"**
- Cliquer sur **"Installer"**

---

## ✅ Vérification

### Après installation

1. **Vérifier que le module est installé** :
   - Paramètres → Applications → Rechercher "Dorevia Vault Connector"
   - Statut : ✅ Installé

2. **Tester le vaulting** :
   - Créer une nouvelle facture
   - La valider (action "Comptabiliser")
   - Vérifier que le champ "Vaulted?" passe à `True`

3. **Vérifier les logs** :
   ```bash
   docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i vault
   ```

---

## 📋 Format du payload envoyé

Le module envoie un payload au format DVIG :

```json
{
  "source": {
    "unit": "odoo",
    "tenant": "sarl-la-platine",
    "env": "stinger",
    "component": "account.move",
    "connector": "dorevia-vault-connector",
    "version": "1.0.0"
  },
  "event": {
    "type": "invoice.posted",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "occurred_at": "2026-01-10T14:30:00.123456+00:00"
  },
  "data": {
    "move_id": 1,
    "move_name": "FAC/2026/00001",
    "move_type": "out_invoice",
    "state": "posted",
    "invoice_date": "2026-01-10",
    "amount_total": 1000.00,
    "currency_name": "EUR",
    "seller_vat": "...",
    "buyer_vat": "...",
    ...
  }
}
```

---

## 🔍 Dépannage

### Le module n'apparaît pas dans la liste

**Solution** :
1. Vérifier que le module est dans `custom-addons/`
2. Redémarrer Odoo
3. Mettre à jour la liste des applications

### Erreur lors de l'installation

**Vérifications** :
- ✅ Le module `dorevia_posted_lock` est installé (dépendance)
- ✅ Les permissions sont correctes sur les fichiers

### La facture n'est pas vaultée après installation

**Vérifications** :
1. ✅ Le module est installé et activé
2. ✅ Les 3 paramètres `dorevia.dvig.*` sont configurés
3. ✅ Le format de `dorevia.dvig.source` est correct (`unit.env.tenant`)
4. ✅ Le token DVIG est valide
5. ✅ L'URL DVIG est accessible depuis Odoo

**Logs** :
```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i "vault\|dvig"
```

---

## 📝 Notes

- Le vaulting ne bloque **pas** la validation de la facture si une erreur survient
- Les erreurs sont loggées mais n'interrompent pas le processus
- Le champ `dorevia_vaulted` est mis à jour uniquement en cas de succès

---

**Version** : 1.0.0  
**Date** : 2026-01-10
