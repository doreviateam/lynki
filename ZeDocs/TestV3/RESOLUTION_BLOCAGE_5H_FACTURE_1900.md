# 🔧 Résolution : Facture FAC/2026/00004 Bloquée 5+ Heures

**Date** : 2026-01-12  
**Problème** : Facture FAC/2026/00004 (ID: 1900) bloquée en statut "En attente de preuve" depuis plus de 5 heures  
**Cause** : Worker outbox DVIG non démarré automatiquement  
**Solution** : Configuration automatique du worker + traitement manuel immédiat

---

## 📊 Diagnostic

### État Initial

- **Facture** : `FAC/2026/00004` (ID: 1900)
- **Statut Odoo** : `pending_proof` (en attente de preuve)
- **Event ID DVIG** : `b9e53686-920a-4493-9ab2-ae6b7654e78b`
- **Dernière tentative** : 12/01/2026 01:16:49
- **Nombre de tentatives** : 1
- **Durée d'attente** : Plus de 5 heures

### Problème Identifié

1. **Événement dans outbox** : Statut `accepted`, jamais traité (`attempt_count = 0`)
2. **Document dans Vault** : ❌ Absent
3. **Worker outbox** : ❌ Non démarré automatiquement (configuration manquante)

---

## 🔧 Solution Appliquée

### 1. Configuration Automatique du Worker

**Modification** : `tenants/core-stinger/platform/docker-compose.yml`

Le service `dvig` a été modifié pour démarrer automatiquement le worker :

```yaml
command: ["sh", "-c", "python -m dvig.api_fastapi & while true; do python3 -m workers.outbox_worker --limit 50 || true; sleep 30; done & wait"]
```

**Résultat** :
- ✅ Worker démarre automatiquement avec le conteneur
- ✅ S'exécute toutes les 30 secondes
- ✅ Redémarrage automatique si le conteneur redémarre

### 2. Traitement Immédiat de l'Événement Bloqué

**Action** : Exécution manuelle du worker pour traiter l'événement en attente

**Résultat** :
- ✅ Événement traité : `status = accepted → forwarded`
- ✅ Document créé dans Vault : `d839a058-0309-47e8-aa54-3f3c2fd82f35`
- ✅ Toutes les données de facturation enregistrées

---

## ✅ État Final

### Document dans Vault

| Champ | Valeur | Statut |
|-------|--------|--------|
| `invoice_number` | `FAC/2026/00004` | ✅ |
| `move_type` | `out_invoice` | ✅ |
| `invoice_date` | `2026-01-12` | ✅ |
| `total_ht` | `2664.00` | ✅ |
| `total_ttc` | `3196.80` | ✅ |
| `currency` | `EUR` | ✅ |
| `odoo_id` | `1900` | ✅ |

**Statut** : ✅ **COMPLET**

### Événement Outbox

- **Statut** : `forwarded` (traité avec succès)
- **Attempt count** : 1
- **Vault Receipt ID** : `d839a058-0309-47e8-aa54-3f3c2fd82f35`

---

## 🔄 Prochaines Étapes

Le **CRON #2 d'Odoo** (récupération preuve) devrait maintenant mettre à jour le statut dans Odoo :

1. **CRON #2** s'exécute toutes les 1 minute (configuré précédemment)
2. **Récupère la preuve** depuis Vault pour la facture 1900
3. **Met à jour le statut** : `pending_proof → vaulted`
4. **Stocke les informations** : SHA256, Vault ID, Ledger Hash, JWS

**Délai attendu** : 1-2 minutes maximum

---

## 📝 Actions Préventives

### Pour Éviter ce Problème à l'Avenir

1. ✅ **Worker automatique** : Configuration appliquée dans docker-compose.yml
2. ✅ **Redémarrage automatique** : `restart: unless-stopped`
3. ✅ **Monitoring** : Vérifier régulièrement les logs du worker

### Vérification Régulière

```bash
# Vérifier les événements bloqués
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c \
  "SELECT COUNT(*) FROM outbox_events WHERE status = 'accepted' AND attempt_count = 0;"

# Vérifier que le worker tourne
docker logs dvig-core-stinger --tail 20 | grep outbox_worker
```

---

## 🎯 Conclusion

**Problème résolu** :
- ✅ Document créé dans Vault avec toutes les données
- ✅ Worker configuré pour démarrage automatique
- ✅ Plus besoin d'intervention manuelle

**Statut Odoo** : Le CRON #2 mettra à jour le statut à `vaulted` dans les prochaines minutes.

---

## 🔗 Références

- **Docker Compose** : `tenants/core-stinger/platform/docker-compose.yml`
- **Documentation worker** : `ZeDocs/TestV3/SOLUTION_WORKER_AUTOMATIQUE_20260111.md`
- **Rapport diagnostic** : `ZeDocs/TestV3/RAPPORT_DIAGNOSTIC_WORKER_DVIG_20260111.md`
