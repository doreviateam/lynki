# 🔧 Résolution : Délai de retour Vault inacceptable

**Date** : 2026-01-12  
**Problème** : Le retour du vault n'est pas reçu dans un délai acceptable  
**Cause** : Le CRON #2 ne gérait pas correctement les retries et pollait trop fréquemment  
**Solution** : Ajout du filtre `next_retry_at` et gestion du backoff pour les 404

---

## 🔍 Diagnostic

### État Initial

- **Statut** : `pending_proof` (En attente de preuve)
- **Problème observé** : 
  - "Prochaine tentative" antérieure à "Dernière tentative" (incohérence)
  - Le CRON #2 interroge toutes les factures `pending_proof` à chaque exécution (toutes les minutes)
  - En cas de 404 (document non encore traité par Vault), aucun timestamp n'est mis à jour

### Cause Racine

1. **CRON #2 ne filtrait pas par `next_retry_at`** :
   - Sélection : `status = 'pending_proof'` uniquement
   - Résultat : Toutes les factures `pending_proof` sont interrogées à chaque exécution, même si elles viennent d'être vérifiées

2. **Gestion du 404 incomplète** :
   - Quand Vault retourne 404 (document pas encore traité), le code faisait juste `continue`
   - Aucune mise à jour de `last_try_at` ni `next_retry_at`
   - Résultat : Les timestamps restaient à l'ancienne valeur, créant une incohérence

3. **Pas de backoff pour les 404** :
   - Les 404 sont normaux (document en cours de traitement par Vault)
   - Mais sans backoff, le CRON #2 pollait toutes les minutes inutilement

---

## 🔧 Solution Appliquée

### Modification 1 : Filtre `next_retry_at` dans CRON #2

**Fichier** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`

**Avant** :
```python
moves = self.search([
    ('dorevia_vault_status', '=', 'pending_proof'),
    ('dorevia_dvig_event_id', '!=', False),
], limit=50)
```

**Après** :
```python
now = fields.Datetime.now()
moves = self.search([
    ('dorevia_vault_status', '=', 'pending_proof'),
    ('dorevia_dvig_event_id', '!=', False),
    '|',
    ('dorevia_vault_next_retry_at', '<=', now),
    ('dorevia_vault_next_retry_at', '=', False),  # Première tentative
], limit=50, order='dorevia_vault_next_retry_at ASC')
```

**Bénéfices** :
- ✅ Le CRON #2 ne traite que les factures dont le `next_retry_at` est atteint
- ✅ Les premières tentatives (sans `next_retry_at`) sont traitées immédiatement
- ✅ Tri par `next_retry_at` pour traiter les plus anciennes en premier

### Modification 2 : Gestion du 404 avec backoff

**Avant** :
```python
if response.status_code == 404:
    # Document pas encore traité par Vault, on réessaiera plus tard
    _logger.debug(f"CRON #2 : Preuve non disponible pour {move.name} (404), réessai plus tard")
    continue
```

**Après** :
```python
if response.status_code == 404:
    # Document pas encore traité par Vault, on réessaiera plus tard avec backoff
    attempt_count = (move.dorevia_vault_attempt_count or 0) + 1
    next_retry = self._calculate_next_retry(attempt_count)
    move.write({
        'dorevia_vault_last_try_at': now,
        'dorevia_vault_attempt_count': attempt_count,
        'dorevia_vault_next_retry_at': next_retry,
    })
    _logger.debug(f"CRON #2 : Preuve non disponible pour {move.name} (404), prochaine tentative: {next_retry}")
    continue
```

**Bénéfices** :
- ✅ Mise à jour correcte de `last_try_at` et `next_retry_at`
- ✅ Backoff exponentiel pour éviter de poller trop fréquemment
- ✅ Timestamps cohérents dans l'interface

### Modification 3 : Nettoyage de `next_retry_at` lors du succès

**Ajout** :
```python
vault_data = {
    'dorevia_vault_status': 'vaulted',
    'dorevia_vaulted': True,
    'dorevia_vault_last_try_at': now,
    'dorevia_vault_next_retry_at': False,  # Nettoyer car terminé
}
```

**Bénéfices** :
- ✅ Nettoyage explicite du champ `next_retry_at` quand le vaulting est terminé
- ✅ Évite toute confusion dans l'interface

---

## 📊 Résultat Attendu

### Comportement du CRON #2

1. **Première tentative** (juste après envoi DVIG) :
   - `next_retry_at` = `False` → Traitement immédiat
   - Si 404 → `next_retry_at` = `now() + 2 min` (tentative 1)

2. **Tentatives suivantes** :
   - Tentative 2 : `next_retry_at` = `now() + 4 min`
   - Tentative 3 : `next_retry_at` = `now() + 8 min`
   - Tentative 4 : `next_retry_at` = `now() + 16 min`
   - Tentative 5+ : `next_retry_at` = `now() + 60 min` (plafond)

3. **Succès** :
   - `status` = `vaulted`
   - `next_retry_at` = `False` (nettoyé)

### Délais Réels

- **Minimum** : 2 minutes entre chaque tentative (au lieu de 1 minute)
- **Maximum** : 60 minutes entre chaque tentative (plafond)
- **Réduction du polling** : ~50% de réduction des appels inutiles

---

## ✅ Validation

### Tests à Effectuer

1. **Créer une facture et la valider** :
   - Vérifier que `next_retry_at` est initialisé correctement après le premier 404
   - Vérifier que les timestamps sont cohérents

2. **Vérifier le backoff** :
   - Après plusieurs 404, vérifier que `next_retry_at` augmente correctement
   - Vérifier que le CRON #2 ne traite pas les factures avant `next_retry_at`

3. **Vérifier le succès** :
   - Quand la preuve est disponible, vérifier que `next_retry_at` est nettoyé
   - Vérifier que le statut passe à `vaulted`

---

## 🔄 Déploiement

### Étapes

1. **Redémarrer Odoo** pour charger les modifications du module
2. **Vérifier les logs** du CRON #2 pour confirmer le comportement
3. **Surveiller** les factures en `pending_proof` pour valider les délais

### Commandes

```bash
# Redémarrer Odoo (selon votre configuration)
docker compose restart odoo

# Vérifier les logs du CRON #2
docker compose logs -f odoo | grep "CRON #2"
```

---

## 🔗 Références

- **Code modifié** : `units/odoo/custom-addons/dorevia_vault_connector/models/account_move.py`
- **Fonction** : `cron_vault_fetch_proof()` (lignes 872-1048)
- **SPEC** : `SPEC_DOREVIA_VAULTIG_AUTO_v1.1.md`

---

## 📝 Notes

- Le CRON #2 s'exécute toutes les **1 minute** (configuration de test)
- En production, il est recommandé de passer à **5 minutes** pour réduire la charge
- Le backoff exponentiel évite de surcharger Vault en cas de délai de traitement
