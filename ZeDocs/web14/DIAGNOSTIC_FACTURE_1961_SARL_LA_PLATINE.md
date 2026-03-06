# Diagnostic — Facture 1961 (sarl-la-platine)

**Lien Odoo** : [Facture client 1961](https://odoo.stinger.sarl-la-platine.doreviateam.com/odoo/customer-invoices/1961)  
**Contexte** : Vérifier pourquoi cette facture ne passe pas (ou tarde) en « Protégée » / apparaît ou non dans Linky.  
**Date** : 2026-02-08

---

## 1. À vérifier dans l’interface Odoo

Une fois connecté sur https://odoo.stinger.sarl-la-platine.doreviateam.com :

1. **Ouvrir la facture** : Facturation → Factures clients → ouvrir la facture dont l’URL se termine par `/1961` (ou rechercher par numéro si l’URL utilise un slug).
2. **Bloc « Sécurité de la facture »** (connecteur Vault) :
   - **Statut affiché** : 🟢 Protégée / 🟠 En cours de sécurisation / 🔴 Problème de sécurisation / ou rien (champ vide).
   - **Valeur technique** : `dorevia_vault_status` = `vaulted` | `todo` | `pending_proof` | `failed_soft` | `failed_hard` | vide.
3. **Si « Problème de sécurisation »** : noter **Dernière erreur** (`dorevia_vault_last_error`) et **Date dernière tentative** (`dorevia_vault_last_try_at`) — visibles en groupe « Détails techniques (audit) » (droits admin) ou en base.
4. **État de la facture** : doit être **Comptabilisée** (`state = posted`) pour être éligible au vault.

---

## 2. Vérification en base (Odoo)

Si vous avez accès au shell Odoo ou à la base PostgreSQL du tenant sarl-la-platine :

```bash
docker exec -it <conteneur_odoo_stinger_sarl-la-platine> odoo shell -d sarl-la-platine --no-http --stop-after-init
```

Puis :

```python
move = env['account.move'].browse(1961)
if not move.exists():
    print("Aucune facture avec id=1961")
else:
    print("id:", move.id)
    print("name:", move.name)
    print("state:", move.state)
    print("move_type:", move.move_type)
    print("dorevia_vault_status:", move.dorevia_vault_status or "(vide)")
    print("dorevia_vault_idempotency_key:", (move.dorevia_vault_idempotency_key or "")[:60])
    print("dorevia_dvig_event_id:", move.dorevia_dvig_event_id)
    print("dorevia_vault_last_try_at:", move.dorevia_vault_last_try_at)
    print("dorevia_vault_last_error:", (move.dorevia_vault_last_error or "")[:200])
    print("dorevia_vault_next_retry_at:", move.dorevia_vault_next_retry_at)
```

Interprétation rapide :

| `dorevia_vault_status` | Signification |
|------------------------|----------------|
| vide / False | Jamais mise en file (validation avant module ou avant migration v1.1, ou pas éligible). |
| `todo` | En attente d’envoi vers DVIG (CRON #1 ou job_trigger_worker). |
| `pending_proof` | Envoyée au Vault, en attente de récupération de la preuve (CRON #2 ou job_vault_fetch_proof). |
| `failed_soft` | Erreur temporaire ; retry prévu (voir `dorevia_vault_next_retry_at`). |
| `failed_hard` | Arrêt des retries sauf si `dorevia.vault.no_abandon` + CRON Reconciler. |
| `vaulted` | OK — facture protégée, preuve stockée. |

---

## 3. Vérification côté Vault (preuve disponible ?)

Le Vault utilisé par Odoo (ex. vault.core-stinger) doit exposer `GET /api/v1/proof/account_move/:id` avec l’**ID Odoo** (1961).

Test depuis une machine ayant accès au Vault (ou via un outil type curl depuis un conteneur du même réseau) :

```bash
# Remplacer VAULT_URL et TOKEN par les valeurs configurées dans Odoo (dorevia.vault.url, token si nécessaire)
curl -s -o /dev/null -w "%{http_code}" "https://vault.core-stinger.doreviateam.com/api/v1/proof/account_move/1961"
```

- **200** : le document existe dans le Vault ; si Odoo affiche encore « En cours » ou « Problème », le blocage est côté récupération de preuve (CRON #2 / job_vault_fetch_proof, token, ou URL).
- **404** : aucun document pour cette facture dans ce Vault ; l’event n’a pas été reçu ou a été envoyé vers un autre Vault (vérifier DVIG → VAULT_URL et tenant).

---

## 4. Actions correctives possibles

- **Statut vide** : lancer la migration des factures posted en `todo` si pas déjà fait (`migrate_vault_status_v1_1()`), ou pour cette facture uniquement : en shell, `move.write({'dorevia_vault_status': 'todo', 'dorevia_vault_next_retry_at': fields.Datetime.now()})`, puis déclencher le worker (CRON #1 ou job).
- **`todo` ou `pending_proof` qui ne bougent pas** : vérifier queue_job (channel `dorevia_vault`) et CRON #1 / #2 actifs ; vérifier DVIG et Vault accessibles depuis Odoo.
- **`failed_soft` / `failed_hard`** : consulter `dorevia_vault_last_error` ; si `no_abandon` est activé, le CRON Reconciler remet les `failed_hard` en `todo` toutes les 15 min.

Références : ZeDocs/web14/DIAGNOSTIC_FACTURES_NON_VAULTEES.md, FLUX_VAULTAGE_ODOO_STINGER_SARL_LA_PLATINE.md.
