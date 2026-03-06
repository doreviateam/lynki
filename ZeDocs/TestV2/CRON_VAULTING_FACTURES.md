# ⏰ Cron de vaulting automatique des factures

**Date** : 2026-01-10  
**Fonctionnalité** : Cron job pour rattraper les factures postées non vaultées

---

## ✅ Fonctionnalité ajoutée

Un **cron job** a été ajouté au module `dorevia_vault_connector` pour vaultériser automatiquement les factures postées non vaultées.

### Objectifs

1. **Rattraper les factures postées avant l'installation du module**
2. **Rattraper les échecs de vaulting** (service DVIG down, erreurs réseau, etc.)
3. **Assurer la cohérence** : toutes les factures postées finissent par être vaultées

---

## ⚙️ Configuration du cron

### Paramètres

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| **Nom** | `Vault posted invoices (Dorevia)` | Nom du cron dans Odoo |
| **Intervalle** | **15 minutes** | Fréquence d'exécution |
| **Limite** | **50 factures** | Nombre max de factures traitées par exécution |
| **Actif** | ✅ Oui | Activé par défaut |

### Comportement

- ✅ Traite jusqu'à **50 factures** par exécution (pour éviter la surcharge)
- ✅ Continue même en cas d'erreur (ne bloque pas les autres factures)
- ✅ Log toutes les opérations (succès et erreurs)
- ✅ Ignore les factures déjà vaultées
- ✅ Ignore les factures non postées

---

## 🔍 Vérification

### 1. Vérifier que le cron est créé

Après installation du module, vérifier dans Odoo :
- **Paramètres → Technique → Automatisation → Actions planifiées**
- Rechercher "Vault posted invoices (Dorevia)"
- Vérifier que l'état est **"Actif"**

### 2. Vérifier les logs

```bash
docker compose -f tenants/sarl-la-platine/apps/odoo/stinger/docker-compose.yml logs odoo | grep -i "cron vaulting" | tail -20
```

**Rechercher** :
- `Cron vaulting: X facture(s) à vaultériser`
- `Facture FAC/2026/00001 vaultérisée avec succès (cron)`
- `Cron vaulting terminé: X succès, Y erreurs`

### 3. Déclencher manuellement (test)

Dans Odoo :
- **Paramètres → Technique → Automatisation → Actions planifiées**
- Ouvrir "Vault posted invoices (Dorevia)"
- Cliquer sur **"Déclencher maintenant"**

---

## 📊 Logs attendus

### Exécution normale (factures trouvées)

```
INFO: Cron vaulting: 1 facture(s) à vaultériser
INFO: Facture FAC/2026/00001 vaultérisée avec succès (cron)
INFO: Cron vaulting terminé: 1 succès, 0 erreurs
```

### Aucune facture à traiter

```
DEBUG: Aucune facture postée non vaultée trouvée
```

### Erreurs

```
WARNING: Facture FAC/2026/00002 ne peut pas être vaultée (configuration manquante)
ERROR: Erreur lors du vaulting de FAC/2026/00003 (cron): Erreur de connexion DVIG
INFO: Cron vaulting terminé: 1 succès, 2 erreurs
```

---

## ⚙️ Personnalisation

### Modifier l'intervalle

Dans Odoo :
- **Paramètres → Technique → Automatisation → Actions planifiées**
- Ouvrir "Vault posted invoices (Dorevia)"
- Modifier **"Intervalle"** :
  - `5 minutes` : Plus fréquent (pour rattrapage rapide)
  - `30 minutes` : Moins fréquent (pour réduire la charge)
  - `1 heure` : Encore moins fréquent

### Modifier la limite

Éditer le fichier :
```python
# units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py
invoices = self.search([...], limit=100)  # Augmenter à 100
```

Puis mettre à jour le module dans Odoo.

---

## 🎯 Cas d'usage

### 1. Rattrapage initial

Après installation du module, le cron va automatiquement vaultériser toutes les factures postées existantes.

**Temps estimé** :
- 50 factures toutes les 15 minutes
- Pour 200 factures : ~1 heure

### 2. Rattrapage après panne DVIG

Si DVIG était down lors de la validation d'une facture, le cron la rattrapera automatiquement.

### 3. Factures postées avant installation

Toutes les factures postées avant l'installation du module seront vaultées progressivement.

---

## ⚠️ Notes importantes

1. **Le cron ne remplace pas le vaulting automatique** :
   - Le vaulting lors de `action_post()` reste la méthode principale
   - Le cron est un filet de sécurité

2. **Performance** :
   - Limite de 50 factures par exécution pour éviter la surcharge
   - Si beaucoup de factures, elles seront traitées progressivement

3. **Idempotence** :
   - Le cron ignore les factures déjà vaultées
   - Pas de risque de double vaulting

---

## 📝 Résumé

| Aspect | Détails |
|--------|---------|
| **Fréquence** | Toutes les 15 minutes |
| **Limite** | 50 factures par exécution |
| **Actif** | ✅ Oui (par défaut) |
| **Logs** | ✅ Oui (succès et erreurs) |
| **Idempotence** | ✅ Oui (ignore déjà vaultées) |

---

**Version** : 1.0  
**Date** : 2026-01-10
