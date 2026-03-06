# ❓ Pourquoi ma facture n'est pas vaultée ?

**Date** : 2026-01-10  
**Problème** : Facture postée mais champ "Vaulted?" reste à `False`

---

## 🔍 Explication

### Le champ "Vaulted?" est un indicateur, pas un déclencheur

Le champ `dorevia_vaulted` dans `dorevia_posted_lock` est **uniquement un indicateur visuel**. Il ne déclenche **pas** automatiquement le vaulting.

**Rôle du champ** :
- ✅ Affiche si une facture a été vaultée (lecture seule)
- ❌ Ne vault pas automatiquement la facture
- ❌ N'envoie rien vers DVIG/Vault

---

## ⚠️ Module manquant : Connecteur Vaulting

### Ce qui existe

1. **`dorevia_posted_lock`** : Verrouille les factures validées
   - ✅ Protège les factures contre les modifications
   - ✅ Affiche le champ `dorevia_vaulted` (indicateur)
   - ❌ Ne vault pas automatiquement

2. **Paramètres DVIG configurés** :
   - ✅ `dorevia.dvig.url` = `https://dvig.core-stinger.doreviateam.com`
   - ✅ `dorevia.dvig.token` = `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g`
   - ✅ `dorevia.dvig.source` = `odoo.stinger.sarl-la-platine`
   - ⚠️ **Mais aucun module ne les utilise !**

---

### Ce qui manque

**Module connecteur vaulting** qui :
1. Intercepte `action_post()` sur `account.move`
2. Envoie la facture vers DVIG STINGER
3. Met à jour `dorevia_vaulted = True` après succès

**Ce module devrait** :
- Lire les paramètres `dorevia.dvig.*`
- Envoyer une requête HTTP POST vers `https://dvig.core-stinger.doreviateam.com/api/v1/ingest`
- Avec le token dans le header `Authorization: Bearer <token>`
- Avec la source dans le payload

---

## 📋 Spécification du module manquant

D'après `sources/vault/docs/CONNECTEUR_ODOO_SPEC1.md`, le module devrait :

### 1. Surcharger `action_post()`

```python
class AccountMove(models.Model):
    _inherit = 'account.move'
    
    def action_post(self):
        # Appeler la méthode parente d'abord
        result = super().action_post()
        
        # Vaultériser après validation
        for move in self:
            if self._should_vault(move):
                try:
                    self._vault_to_dorevia(move)
                    move.dorevia_vaulted = True  # Mettre à jour le champ
                except Exception as e:
                    _logger.error(f"Erreur vaulting: {e}")
        
        return result
```

### 2. Envoyer vers DVIG

```python
def _vault_to_dorevia(self, move):
    # Lire paramètres système
    dvig_url = self.env['ir.config_parameter'].sudo().get_param('dorevia.dvig.url')
    dvig_token = self.env['ir.config_parameter'].sudo().get_param('dorevia.dvig.token')
    dvig_source = self.env['ir.config_parameter'].sudo().get_param('dorevia.dvig.source')
    
    # Préparer payload
    payload = {
        "meta": {
            "source": dvig_source,
            "correlation_id": str(uuid.uuid4()),
            "timestamp": datetime.utcnow().isoformat(),
        },
        "document": {
            "id": move.id,
            "name": move.name,
            "type": move.move_type,
            # ... autres champs
        }
    }
    
    # Envoyer vers DVIG
    response = requests.post(
        f"{dvig_url}/api/v1/ingest",
        json=payload,
        headers={"Authorization": f"Bearer {dvig_token}"}
    )
    response.raise_for_status()
```

---

## ✅ Solutions

### Option 1 : Créer le module connecteur (Recommandé)

**Créer un nouveau module** `dorevia_vault_connector` qui :
- Surcharge `action_post()` sur `account.move`
- Envoie vers DVIG STINGER
- Met à jour `dorevia_vaulted = True`

**Avantages** :
- ✅ Automatique : Toute facture postée est vaultée
- ✅ Utilise les paramètres `dorevia.dvig.*` déjà configurés
- ✅ Conforme à la SPEC 1

---

### Option 2 : Vaulting manuel (Temporaire)

**Créer un bouton/action manuelle** pour vaultériser une facture :
- Bouton "Vault" dans la vue facture
- Envoie la facture vers DVIG
- Met à jour `dorevia_vaulted = True`

**Avantages** :
- ✅ Rapide à implémenter
- ✅ Contrôle manuel

**Inconvénients** :
- ❌ Pas automatique
- ❌ Risque d'oublier de vaultériser

---

### Option 3 : Script externe (Temporaire)

**Créer un script Python** qui :
- Lit les factures postées non vaultées
- Les envoie vers DVIG
- Met à jour `dorevia_vaulted = True`

**Avantages** :
- ✅ Peut être exécuté en cron
- ✅ Pas besoin de modifier Odoo

**Inconvénients** :
- ❌ Pas en temps réel
- ❌ Nécessite un script externe

---

## 🎯 Recommandation

**Créer le module `dorevia_vault_connector`** (Option 1) :
- ✅ Automatique et transparent
- ✅ Utilise la configuration DVIG existante
- ✅ Conforme aux spécifications

**Temps estimé** : 2-4 heures de développement

---

## 📝 État actuel

| Élément | État | Action |
|---------|------|--------|
| Infrastructure DVIG/Vault STINGER | ✅ Opérationnel | Rien à faire |
| Configuration DVIG dans Odoo | ✅ Configurée | Rien à faire |
| Module `dorevia_posted_lock` | ✅ Activé | Rien à faire |
| **Module connecteur vaulting** | ❌ **Manquant** | **À créer** |

---

## ❓ Question

**Avez-vous un module `dorevia_vault_connector` ou équivalent qui n'est pas encore installé ?**

Si OUI : Il faut l'installer dans Odoo STINGER.

Si NON : Il faut le créer selon la SPEC 1.

---

**Version** : 1.0  
**Date** : 2026-01-10
