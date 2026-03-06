# Runbook — Paiements non vaultés : diagnostic et résolution

**Date :** 2026-03-03  
**Contexte :** Carte Paiements — badge « Données incomplètes »  
**Référence :** SPEC_CARTE_PAIEMENTS_v1.0.md §3.2, PLAN_IMPLEMENTATION_CARTE_PAIEMENTS_v1.0.md Étape 2

---

## 1. Symptôme

La carte **Paiements** affiche :

- **Badge :** « Données incomplètes »
- **Message :** « Certains paiements ERP validés ne sont pas encore enregistrés dans le Vault. »  
  ou  
- **Message :** « Contrôle de complétude indisponible (Odoo inaccessible) »

---

## 2. Diagnostic rapide

### 2.1 Vérifier Odoo accessible

Si le message indique « Odoo inaccessible » → problème réseau / disponibilité Odoo, pas de données manquantes.

```bash
# Test ping Odoo (adapter l'URL selon l'environnement)
curl -s -o /dev/null -w "%{http_code}" "https://odoo.lab.laplatine2026.dorevia.local/web/login"
```

### 2.2 Comparer count et sum Odoo vs Vault

**Odoo** — paiements posted sur la période (adapter `date_from`, `date_to`, `tenant`) :

```bash
# Dans Odoo shell (adapter le container et la base)
echo "
env.cr.execute('''
  SELECT COUNT(*), COALESCE(SUM(CASE WHEN payment_type=''outbound'' THEN -amount ELSE amount END), 0)
  FROM account_payment
  WHERE state IN (''posted'',''paid'',''in_process'',''sent'',''reconciled'')
    AND payment_date BETWEEN ''2026-01-01'' AND ''2026-01-31'';
''')
print(env.cr.fetchone())
" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

**Vault** — documents payment sur la même période :

```bash
docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "
SELECT COUNT(*), COALESCE(SUM(amount_signed), 0)
FROM documents
WHERE tenant = 'laplatine2026'
  AND (odoo_model = 'account.payment' OR source = 'payment')
  AND date_value >= '2026-01-01'
  AND date_value <= '2026-01-31';
"
```

**Interprétation :**
- Si `count_odoo > count_vault` ou `|sum_odoo - sum_vault| > 0.01` → paiements non vaultés ou en cours d'ingestion.

### 2.3 État des paiements Odoo (par statut Vault)

```bash
docker exec odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -c "
SELECT dorevia_vault_status, COUNT(*)
FROM account_payment
WHERE state IN ('posted','paid','in_process','sent','reconciled')
GROUP BY dorevia_vault_status ORDER BY 1;
"
```

| Statut | Signification |
|--------|---------------|
| `todo` | En attente d'envoi vers DVIG |
| `pending_proof` | Envoyé à DVIG, en attente de preuve Vault |
| `vaulted` | OK — document dans le Vault |
| `failed_soft` | Échec temporaire (retry automatique) |
| `failed_hard` | Échec persistant — action manuelle |

---

## 3. Résolution

### 3.1 CRON désactivés ou en retard

Vérifier que les CRON sont actifs dans Odoo :

```bash
echo "
crons = env['ir.cron'].search([
  ('code', 'ilike', '%vault%payment%')
])
for c in crons:
  print(f'{c.name}: active={c.active} interval={c.interval_number} {c.interval_type}')
" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

Si actifs : attendre 2–5 min (cron send toutes les 2 min). Si toujours incomplet → backfill manuel.

### 3.2 Backfill complet des paiements

```bash
echo "exec(open('/mnt/tenant-scripts/scripts/backfill_all_payments_to_vault.py').read())" | \
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

**Note :** Le script traite 50 paiements par round × 15 rounds. Pour de gros volumes, répéter ou augmenter les rounds dans le script.

### 3.3 Traiter l'outbox DVIG

Les événements sont d'abord stockés dans l'outbox DVIG, puis transmis au Vault. Pour accélérer :

```bash
TOKEN="${DVIG_INTERNAL_TOKEN:-dvig_internal_core-stinger_stinger}"
while true; do
  r=$(docker exec dvig-core-stinger curl -s -X POST \
    http://127.0.0.1:8080/internal/outbox/process \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"limit":100}' 2>/dev/null | grep -o '"processed":[0-9]*' | cut -d: -f2)
  r=${r:-0}
  [ "$r" = "0" ] && break
  echo "  Processed: $r"
  sleep 0.5
done
echo "Outbox traitée."
```

### 3.4 Paiements en failed_soft

Le CRON retente automatiquement. Vérifier `dorevia_vault_next_retry_at` et `dorevia_vault_last_error` :

```bash
docker exec odoo_db_lab_laplatine2026 psql -U odoo -d laplatine2026 -c "
SELECT id, name, dorevia_vault_status, dorevia_vault_last_error, dorevia_vault_next_retry_at
FROM account_payment
WHERE dorevia_vault_status IN ('failed_soft','failed_hard')
LIMIT 10;
"
```

Pour forcer un retry immédiat (remise en todo) :

```bash
echo "exec(open('/mnt/tenant-scripts/scripts/reset_payments_vaulted_and_resend.py').read())" | \
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

(Adapter le script selon le besoin : reset failed_soft uniquement ou failed_hard.)

### 3.5 Paiements en failed_hard

Causes typiques : token DVIG expiré, URL erronée, document rejeté par le Vault (doublon, erreur de schéma).

1. Vérifier la config DVIG :
   ```bash
   echo "print(env['ir.config_parameter'].get_param('dorevia.dvig.url')); print(env['ir.config_parameter'].get_param('dorevia.dvig.token')[:20]+'...')" | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
   ```
2. Consulter `dorevia_vault_last_error` pour les paiements concernés.
3. Corriger la cause (token, URL, données) puis exécuter le reset/backfill.

---

## 4. Vérification post-résolution

Après backfill + outbox :

1. **Recomparer** count et sum Odoo vs Vault (§2.2).
2. **Rafraîchir** la carte Paiements dans Linky (cache 45 s).
3. Le badge « Données incomplètes » doit disparaître si les données sont alignées.

---

## 5. Scripts de référence

| Script | Emplacement | Rôle |
|--------|-------------|------|
| `backfill_all_payments_to_vault.py` | `tenants/laplatine2026/scripts/` | Backfill complet + 15 rounds cron |
| `backfill_2026_payments_and_send.py` | `tenants/laplatine2026/scripts/` | Paiements 2026 uniquement |
| `resend_missing_payments_to_vault.py` | `tenants/laplatine2026/scripts/` | Ré-envoi liste spécifique |
| `reset_payments_vaulted_and_resend.py` | `tenants/laplatine2026/scripts/` | Reset failed → todo + cron |

**Voir aussi :** RUNBOOK_BACKFILL_VAULT.md (procédure complète factures + paiements).

---

**Fin du runbook**
