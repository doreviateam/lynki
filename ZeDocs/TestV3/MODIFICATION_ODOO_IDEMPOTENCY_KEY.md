# 🔧 Modification Odoo — Transmission idempotency_key

**Date** : 2026-01-11  
**Auteur** : Dorevia Team  
**Référence** : SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE

---

## 🎯 Objectif

Modifier le module Odoo `dorevia_vault_connector` pour transmettre la clé d'idempotence (`idempotency_key`) dans le payload envoyé à DVIG, garantissant ainsi l'idempotence bout en bout Odoo → DVIG → Vault.

---

## 📝 Modification Appliquée

### Fichier Modifié

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`  
**Méthode** : `_build_dvig_payload()` (ligne 382)

### Code Ajouté

```python
# Ajouter idempotency_key (SHA256) pour garantir l'idempotence bout en bout
# SPEC DVIG → Vault Forwarding v1.1 : Transmission de la clé d'idempotence
if move.dorevia_vault_idempotency_key:
    payload['idempotency_key'] = move.dorevia_vault_idempotency_key
```

### Contexte

**Avant** :
```python
payload = {
    'event_type': event_type,
    'source': dvig_source,
    'timestamp': timestamp,
    'data': {...}
}
# ❌ Pas d'idempotency_key
```

**Après** :
```python
payload = {
    'event_type': event_type,
    'source': dvig_source,
    'timestamp': timestamp,
    'data': {...},
    'idempotency_key': move.dorevia_vault_idempotency_key  # ✅ AJOUTÉ
}
```

---

## ✅ Validation

### Vérifications Effectuées

- [x] Code syntaxiquement correct (pas d'erreur linter)
- [x] Champ `dorevia_vault_idempotency_key` existe dans le modèle
- [x] Condition `if` pour éviter erreur si clé absente
- [x] Compatible avec format payload DVIG existant

### Format idempotency_key

**Type** : `Char(64)` (SHA256 hexadécimal)  
**Exemple** : `"bcd65105050f22fd0eb5760424adfd24e96b29fb96efe48b7f2500b92adb232e"`

**Formule de calcul** (déjà implémentée dans Odoo) :
```python
key_string = f"{dvig_source}{model}{record_id}{event_type}{posted_at}"
idempotency_key = SHA256(key_string).hexdigest()
```

---

## 🔄 Impact

### Compatibilité

✅ **Rétrocompatible** : Si `dorevia_vault_idempotency_key` est absent, le champ n'est pas ajouté au payload (pas d'erreur)

✅ **DVIG** : Peut accepter le champ `idempotency_key` optionnel dans le payload (fallback sur `event_id` si absent)

### Flux End-to-End

**Avant** :
```
Odoo → DVIG : { event_type, source, timestamp, data }
DVIG → Vault : { event_id (UUID) }  // ❌ Pas d'idempotence réelle
```

**Après** :
```
Odoo → DVIG : { event_type, source, timestamp, data, idempotency_key (SHA256) }
DVIG → Vault : { event_id (UUID), idempotency_key (SHA256) }  // ✅ Idempotence garantie
```

---

## 🧪 Tests Requis

### Tests Unitaires

- [ ] Vérifier que `idempotency_key` est présent dans le payload si `dorevia_vault_idempotency_key` existe
- [ ] Vérifier que `idempotency_key` est absent si `dorevia_vault_idempotency_key` est `False` ou vide

### Tests d'Intégration

- [ ] Envoyer une facture à DVIG et vérifier que `idempotency_key` est reçu
- [ ] Réessayer d'envoyer la même facture et vérifier l'idempotence (même clé = même traitement)

---

## 📋 Prochaines Étapes

1. **Mettre à jour le module Odoo** :
   ```bash
   docker exec odoo_lab_core odoo -d odoo_lab_core -u dorevia_vault_connector --stop-after-init
   ```

2. **Tester l'envoi** :
   - Valider une facture
   - Vérifier les logs DVIG pour confirmer la réception de `idempotency_key`

3. **Implémenter DVIG** :
   - Modifier `/ingest` pour accepter `idempotency_key`
   - Utiliser cette clé dans `outbox_events` avec `UNIQUE(tenant, idempotency_key)`

4. **Implémenter Vault** :
   - Créer endpoint `/api/v1/events`
   - Vérifier `UNIQUE(tenant, idempotency_key)` avant ingestion

---

## 🔗 Références

- **SPEC corrigée** : `SPEC_DVIG_VAULT_FORWARDING_v1.1_CORRIGEE.md`
- **Analyse** : `ANALYSE_SPEC_DVIG_VAULT_FORWARDING_v1.1.md`
- **Code source** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py` (ligne 382)

---

## ✅ Statut

**Modification** : ✅ **Appliquée**  
**Tests** : ⏳ **À exécuter**  
**Déploiement** : ⏳ **En attente validation DVIG/Vault**

---

**Fin du document**
