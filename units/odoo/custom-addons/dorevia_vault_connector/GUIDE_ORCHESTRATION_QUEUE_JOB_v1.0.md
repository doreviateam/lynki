# 📐 Guide : Orchestration temps réel DVIG via queue_job Odoo

**Version** : 1.1.0  
**Date** : 2026-01-12  
**Module** : dorevia_vault_connector  
**SPEC** : Orchestration Temps Réel du Vaulting via OCA queue_job v1.1.0

---

## 🎯 Objectif

Mettre en place une orchestration **quasi temps réel** du worker DVIG depuis Odoo en utilisant `queue_job` (OCA) pour déclencher le traitement de l'outbox DVIG immédiatement après la validation d'une facture.

### Avantages

- ⏱ **Latence réduite** : < 10 secondes (au lieu de 30s-5min avec CRON)
- 🔐 **Sécurité** : Aucun accès Docker depuis Odoo
- 📊 **Observabilité** : Interface Odoo + Prometheus
- 🔁 **Fiabilité** : Retries automatiques via queue_job

---

## 📋 Prérequis

### 1. Module queue_job installé

Le module `queue_job` (OCA) doit être installé et configuré dans Odoo.

**Vérification** :
```python
# Dans Odoo shell
env['ir.module.module'].search([('name', '=', 'queue_job'), ('state', '=', 'installed')])
```

**Installation** :
- Aller dans **Apps** → Rechercher "queue_job"
- Installer le module

### 2. Configuration Odoo

**Fichier `odoo.conf`** :
```ini
[options]
server_wide_modules = web,queue_job
workers = 2  # Au moins 2 workers requis

[queue_job]
# SPEC v1.1.0 : Channel dédié pour orchestration vaulting temps réel
channels = root:2,dorevia_vault:2
```

**Redémarrer Odoo** après modification.

### 3. Configuration DVIG

**Variables d'environnement DVIG** :
```bash
DVIG_INTERNAL_TOKEN=<token_securise>
```

**Génération du token** :
```bash
# Générer un token sécurisé (32 caractères minimum)
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 4. Configuration Odoo (Paramètres système)

Configurer dans **Paramètres → Technique → Paramètres → Paramètres Système** :

| Clé | Description | Exemple | Obligatoire |
|-----|-------------|---------|-------------|
| `dorevia.dvig.internal.url` | URL complète de l'endpoint interne | `https://dvig.core-stinger.doreviateam.com/internal/outbox/process` | ⚠️ Optionnel* |
| `dorevia.dvig.internal.token` | Token Bearer pour authentification interne | `dvig_internal_...` | ✅ Oui |

\* Si `dorevia.dvig.internal.url` n'est pas configuré, l'URL sera construite automatiquement depuis `dorevia.dvig.url` en ajoutant `/internal/outbox/process`.

---

## 🔧 Fonctionnement

### Flux complet (v1.1.0)

```
1. Odoo : action_post() facture
   ↓
2. Initialisation machine d'état (status='todo')
   ↓
3. Enqueue job queue_job : job_trigger_worker() (si disponible)
   ↓
4. Job runner exécute job_trigger_worker()
   ↓
5. HTTP POST /internal/outbox/process vers DVIG
   ↓
6. DVIG traite l'outbox (process_outbox_events)
   ↓
7. Événements transférés vers Vault
   ↓
8. DVIG retourne forwarded_source_ids dans la réponse
   ↓
9. job_trigger_worker enchaîne automatiquement job_vault_fetch_proof()
   ↓
10. Job runner exécute job_vault_fetch_proof() (retries automatiques si 404)
   ↓
11. Statut Odoo → vaulted (latence < 15s)
```

**Filet de sécurité** : CRON #2 continue de fonctionner pour les factures manquées

### Déclenchement

Le worker est déclenché automatiquement :
- ✅ **À chaque `action_post()`** d'une facture (si queue_job disponible)
- ✅ **Fallback CRON** : Si queue_job n'est pas disponible, le CRON existant continue de fonctionner

---

## 📊 Observabilité

### Interface Odoo

**Menu** : **Job Queue** → **Jobs**

Vous pouvez voir :
- Tous les jobs `job_trigger_worker`
- Statut (pending, enqueued, started, done, failed)
- Durée d'exécution
- Erreurs éventuelles
- Historique des retries

### Métriques Prometheus

**DVIG** expose les métriques suivantes :

```
# Nombre de déclenchements internes
dvig_internal_trigger_total

# Durée des déclenchements (millisecondes)
dvig_internal_trigger_duration_ms
```

**Accès** : `http://dvig.<tenant>/metrics`

---

## 🛠 Dépannage

### Le worker ne se déclenche pas

1. **Vérifier queue_job** :
   ```python
   # Dans Odoo shell
   env['ir.module.module'].search([('name', '=', 'queue_job')])
   ```

2. **Vérifier la configuration** :
   ```python
   # Dans Odoo shell
   env['ir.config_parameter'].sudo().get_param('dorevia.dvig.internal.token')
   ```

3. **Vérifier les logs Odoo** :
   ```
   grep "Worker DVIG" /var/log/odoo/odoo.log
   ```

4. **Vérifier les jobs** :
   - Menu **Job Queue** → **Jobs**
   - Filtrer par description "Trigger DVIG worker"

### Erreur 401 (Unauthorized)

Le token interne DVIG n'est pas correct.

**Solution** :
1. Vérifier `DVIG_INTERNAL_TOKEN` dans l'environnement DVIG
2. Vérifier `dorevia.dvig.internal.token` dans Odoo
3. Les deux doivent être identiques

### Erreur de connexion

L'URL interne DVIG n'est pas accessible depuis Odoo.

**Solution** :
1. Vérifier `dorevia.dvig.internal.url` dans Odoo
2. Tester l'URL manuellement :
   ```bash
   curl -X POST https://dvig.<tenant>/internal/outbox/process \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"limit": 10}'
   ```

### Fallback vers CRON

Si queue_job n'est pas disponible, le système bascule automatiquement vers le CRON existant. Aucune action requise.

---

## 🔐 Sécurité

### Authentification

- **Token interne** : Stocké dans variable d'environnement DVIG et paramètre système Odoo
- **Comparaison constant-time** : Protection contre timing attacks
- **Header obligatoire** : `Authorization: Bearer <token>`

### Protection réseau

L'endpoint `/internal/outbox/process` doit être :
- ✅ Accessible uniquement depuis Odoo (réseau privé ou Caddy allowlist)
- ❌ **NE PAS** exposer publiquement

**Configuration Caddy (exemple)** :
```caddy
dvig.<tenant> {
    # ... configuration existante ...
    
    @internal {
        path /internal/*
    }
    
    handle @internal {
        # Autoriser uniquement depuis Odoo
        reverse_proxy localhost:8000 {
            header_up X-Real-IP {remote_host}
        }
    }
}
```

---

## 📈 Performance

### Latence cible

| Métrique | Cible | Actuel (CRON) |
|----------|-------|---------------|
| Latence | < 10s | 30s - 5min |
| Taux succès | > 99% | > 99% |
| Backlog | < 10 | Variable |

### Optimisation

- **Limit par batch** : 50 événements (configurable)
- **Timeout** : 10 secondes (évite de bloquer)
- **Priority** : 10 (haute priorité)

---

## 🔄 Migration depuis CRON

### Étape 1 : Installer queue_job

Voir section **Prérequis** ci-dessus.

### Étape 2 : Configurer le token interne

```bash
# Générer le token
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Configurer dans DVIG
export DVIG_INTERNAL_TOKEN=<token>

# Configurer dans Odoo
# Paramètres → Technique → Paramètres → Paramètres Système
# dorevia.dvig.internal.token = <token>
```

### Étape 3 : Mettre à jour le module

```bash
# Mettre à jour le module dorevia_vault_connector
odoo-bin -u dorevia_vault_connector -d <database>
```

### Étape 4 : Vérifier le fonctionnement

1. Créer une nouvelle facture
2. Valider la facture (`action_post()`)
3. Vérifier dans **Job Queue** → **Jobs** qu'un job a été créé
4. Vérifier que le job s'exécute avec succès
5. Vérifier que l'événement est traité dans DVIG

### Étape 5 : Désactiver le CRON (optionnel)

Une fois que queue_job fonctionne correctement, vous pouvez désactiver le CRON existant :

```python
# Dans Odoo shell
env['ir.cron'].search([('name', '=', 'cron_vault_send_dvig')]).write({'active': False})
```

**Note** : Le CRON reste disponible comme fallback si queue_job est indisponible.

---

## 📌 Conclusion

Cette architecture offre :
- ✅ Latence réduite (< 10s)
- ✅ Sécurité renforcée (token interne)
- ✅ Observabilité complète (Odoo + Prometheus)
- ✅ Fiabilité (retries automatiques)
- ✅ Compatibilité (fallback CRON)

➡️ **Prêt pour production**.
