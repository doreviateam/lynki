# 🔄 Vaulting manuel d'une facture existante

**Date** : 2026-01-10  
**Objectif** : Vaultériser la première facture déjà postée (FAC/2026/00001)

---

## ✅ Solution implémentée

### Bouton "Vault" dans la vue facture

Un bouton **"Vault"** a été ajouté dans la barre d'actions de la vue facture.

**Conditions d'affichage** :
- ✅ Facture en état `posted`
- ✅ Facture non encore vaultée (`dorevia_vaulted = False`)
- ✅ Type de facture : `out_invoice`, `in_invoice`, `out_refund`, `in_refund`

---

## 🚀 Étapes pour vaultériser la première facture

### Option 1 : Via l'interface Odoo (Recommandé)

1. **Installer le module** (si pas encore fait) :
   - Paramètres → Applications → Mettre à jour la liste
   - Rechercher "Dorevia Vault Connector"
   - Installer

2. **Redémarrer Odoo** (si nécessaire) :
   ```bash
   docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml restart odoo
   ```

3. **Ouvrir la facture** :
   - Aller sur `https://odoo.stinger.sarl-la-platine.doreviateam.com`
   - Ouvrir la facture FAC/2026/00001

4. **Cliquer sur "Vault"** :
   - Le bouton "Vault" apparaît dans la barre d'actions (en haut à droite)
   - Cliquer sur "Vault"
   - Attendre la confirmation

5. **Vérifier** :
   - Le champ "Vaulted?" doit passer à `True`
   - Un message de succès s'affiche

---

### Option 2 : Via script Python (Alternative)

Si le module n'est pas encore installé ou si vous préférez un script :

```python
# Script à exécuter dans Odoo shell
# docker exec -it odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine

# Trouver la facture
invoice = env['account.move'].search([
    ('name', '=', 'FAC/2026/00001'),
    ('state', '=', 'posted'),
    ('dorevia_vaulted', '=', False)
], limit=1)

if invoice:
    # Vaultériser
    invoice.action_vault()
    print(f"Facture {invoice.name} vaultérisée avec succès")
else:
    print("Facture non trouvée ou déjà vaultée")
```

**Exécution** :
```bash
docker exec -it odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine < script_vault.py
```

---

## 🔍 Vérification

### 1. Vérifier dans Odoo

- Ouvrir la facture FAC/2026/00001
- Vérifier que le champ "Vaulted?" est à `True`
- Le bouton "Vault" ne doit plus être visible

### 2. Vérifier les logs Odoo

```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i "vault\|dvig" | tail -20
```

**Rechercher** :
- `Facture FAC/2026/00001 vaultérisée avec succès`
- `Envoi facture FAC/2026/00001 vers DVIG`

### 3. Vérifier dans DVIG

```bash
curl -X GET https://dvig.core-stinger.doreviateam.com/health
```

### 4. Vérifier dans Vault (si endpoint disponible)

Les données devraient être transmises de DVIG vers Vault automatiquement.

---

## ⚠️ Dépannage

### Le bouton "Vault" n'apparaît pas

**Vérifications** :
1. ✅ Le module `dorevia_vault_connector` est installé
2. ✅ La facture est en état `posted`
3. ✅ La facture n'est pas déjà vaultée
4. ✅ Redémarrer Odoo après installation du module

### Erreur lors du vaulting

**Vérifications** :
1. ✅ Les 3 paramètres `dorevia.dvig.*` sont configurés
2. ✅ Le format de `dorevia.dvig.source` est correct (`unit.env.tenant`)
3. ✅ Le token DVIG est valide
4. ✅ L'URL DVIG est accessible depuis Odoo

**Logs** :
```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i "erreur\|error" | tail -20
```

---

## 📝 Notes

- Le vaulting manuel utilise la même logique que le vaulting automatique
- Les erreurs sont affichées à l'utilisateur via une notification
- Le champ `dorevia_vaulted` est mis à jour uniquement en cas de succès

---

**Version** : 1.0  
**Date** : 2026-01-10
