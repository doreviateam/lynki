# 🎯 Guide : Vaulting de la première facture

**Date** : 2026-01-10  
**Facture** : FAC/2026/00001 (ou première facture postée non vaultée)

---

## ✅ Solution 1 : Via bouton dans Odoo (Recommandé)

### Prérequis

1. **Installer le module** `dorevia_vault_connector` :
   - Paramètres → Applications → Mettre à jour la liste
   - Rechercher "Dorevia Vault Connector"
   - Installer

2. **Redémarrer Odoo** (si nécessaire) :
   ```bash
   docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml restart odoo
   ```

### Étapes

1. **Ouvrir la facture** :
   - Aller sur `https://odoo.stinger.sarl-la-platine.doreviateam.com`
   - Ouvrir la facture FAC/2026/00001

2. **Cliquer sur "Vault"** :
   - Le bouton "Vault" apparaît dans la barre d'actions (en haut à droite)
   - Cliquer sur "Vault"
   - Attendre la confirmation

3. **Vérifier** :
   - Le champ "Vaulted?" doit passer à `True`
   - Un message de succès s'affiche

---

## ✅ Solution 2 : Via script Python (Alternative)

### Commande complète

```bash
docker exec -it odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine << 'EOF'
invoice = env['account.move'].search([
    ('state', '=', 'posted'),
    ('dorevia_vaulted', '=', False),
    ('move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'])
], order='id asc', limit=1)

if invoice:
    print(f"📄 Facture trouvée: {invoice.name}")
    invoice.action_vault()
    print(f"✅ Facture {invoice.name} vaultérisée avec succès!")
else:
    print("❌ Aucune facture postée non vaultée trouvée")
EOF
```

### Ou utiliser le script fourni

```bash
docker exec -i odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine < /opt/dorevia-plateform/scripts/vault_first_invoice.py
```

---

## 🔍 Vérification

### 1. Dans Odoo

- Ouvrir la facture FAC/2026/00001
- Vérifier que le champ "Vaulted?" est à `True`
- Le bouton "Vault" ne doit plus être visible

### 2. Logs Odoo

```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i "vault\|dvig" | tail -20
```

**Rechercher** :
- `Facture FAC/2026/00001 vaultérisée avec succès`
- `Envoi facture FAC/2026/00001 vers DVIG`

### 3. DVIG

```bash
curl -I https://dvig.core-stinger.doreviateam.com/health
```

---

## ⚠️ Dépannage

### Le bouton "Vault" n'apparaît pas

**Vérifications** :
1. ✅ Le module `dorevia_vault_connector` est installé
2. ✅ Redémarrer Odoo après installation
3. ✅ Rafraîchir la page (F5)

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
