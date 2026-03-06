# Diagnostic — Factures clients qui ne se vaultent pas (Odoo sarl-la-platine)

**Contexte** : Sur https://odoo.stinger.sarl-la-platine.doreviateam.com, certaines factures clients (ex. les deux premières) restent sans statut « Protégée » alors que les autres se vaultent correctement.

---

## 0. Exigence : aucune facture posted non vaultée

**Règle métier** : On ne peut pas se permettre d’avoir des factures à l’état **comptabilisé (posted)** qui restent définitivement non vaultées.

### Mesures implémentées dans le connecteur (dorevia_vault_connector)

1. **Paramètre `dorevia.vault.no_abandon`**  
   - **Valeur** : `True` ou `1` pour activer.  
   - **Effet** : les seuils d’abandon (MAX_ATTEMPTS_PROOF, MAX_AGE_PENDING_PROOF) ne provoquent **plus** de passage en `failed_hard`. Les factures restent en `todo` / `pending_proof` / `failed_soft` et continuent d’être retentées par les CRON et jobs.

2. **CRON « Vault Reconciler failed_hard (no_abandon) »**  
   - **Fréquence** : toutes les 15 minutes.  
   - **Condition** : s’exécute uniquement si `dorevia.vault.no_abandon` est activé.  
   - **Effet** : les factures **posted** en statut `failed_hard` sont remises en `todo`, puis le worker DVIG est déclenché. Les factures sont ainsi retentées jusqu’à ce qu’elles passent en `vaulted`.

### À faire côté déploiement (sarl-la-platine / tout tenant concerné)

- **Paramètres système Odoo** (Réglages → Technique → Paramètres système) :  
  - Créer ou modifier la clé **`dorevia.vault.no_abandon`** avec la valeur **`True`** (ou `1`).
- **Infrastructure** : s’assurer que le Vault expose **POST /api/v1/events** (voir §7) pour que les retries aboutissent. Sans cela, les factures resteront en boucle todo → pending_proof → failed_soft (ou sans jamais passer en failed_hard si no_abandon est activé).

### Résumé

| Sans no_abandon | Avec no_abandon = True |
|-----------------|------------------------|
| Après N tentatives ou D heures → `failed_hard` (arrêt des retries) | Pas de passage en `failed_hard` ; retries continuent |
| Les `failed_hard` restent bloquées sauf action manuelle | CRON toutes les 15 min remet les `failed_hard` en `todo` et relance le flux |

---

## 1. Pourquoi une facture ne se vault pas ?

Le flux ne prend que les factures dont le **statut de protection** est **`todo`** (ou `failed_soft` pour retry). Si une facture n’est jamais passée en `todo`, elle ne sera jamais envoyée au DVIG.

Causes fréquentes :

| Cause | Explication |
|-------|--------------|
| **Factures validées avant le connecteur** | Validées avant l’installation du module ou avant la migration v1.1 → `dorevia_vault_status` est vide (False), jamais mis à `todo`. |
| **Migration non exécutée** | La méthode `migrate_vault_status_v1_1()` n’a pas été lancée après mise à jour du module → les anciennes factures posted n’ont pas été passées en `todo`. |
| **Blocage en failed_soft / failed_hard** | Une erreur passée (DVIG/Vault indisponible, 4xx/5xx) a mis la facture en `failed_soft` ou `failed_hard` ; sans remise en `todo`, elle n’est plus retentée. |
| **Config DVIG manquante** | `dorevia.dvig.url`, `dorevia.dvig.token` ou `dorevia.dvig.source` manquants → `_should_vault()` renvoie False pour toutes les factures (cas rare si d’autres factures vaultent). |

Les « deux premières » factures (par numéro ou par date) sont souvent les **plus anciennes** : validées avant activation du vaulting ou avant la migration, donc sans `todo`.

---

## 2. Diagnostic rapide (Odoo shell)

Sur la machine qui héberge le conteneur Odoo sarl-la-platine (remplacer le nom du conteneur si besoin) :

```bash
# Entrer dans le shell Odoo (base sarl-la-platine)
docker exec -it odoo_stinger_sarl-la-platine odoo shell -d sarl-la-platine --no-http --stop-after-init
```

Dans le shell Python :

```python
# Factures clients (out_invoice) comptabilisées
Move = env['account.move']
invoices = Move.search([
    ('state', '=', 'posted'),
    ('move_type', '=', 'out_invoice'),
], order='id asc')

# Afficher les 10 premières : id, name, statut vault, dernière erreur
for inv in invoices[:10]:
    print(
        inv.id, inv.name,
        '| status:', inv.dorevia_vault_status or '(vide)',
        '| key:', (inv.dorevia_vault_idempotency_key[:20] + '...') if inv.dorevia_vault_idempotency_key else None,
        '| err:', (inv.dorevia_vault_last_error or '')[:60]
    )
```

Interprétation :

- **`status: (vide)`** → la facture n’a jamais été initialisée pour le vaulting → soit migration, soit remise manuelle en `todo` (voir §3).
- **`status: failed_soft`** ou **`failed_hard`** → voir `dorevia_vault_last_error` ; pour retenter, remettre en `todo` (§3).
- **`status: todo`** → normalement prise en charge par le job/CRON ; si ça reste bloqué, vérifier les logs Odoo/DVIG et le job queue.

---

## 3. Corriger : remettre les factures en « à protéger »

### Option A — Relancer la migration (toutes les factures posted non vaultées)

Dans le shell Odoo (même session que ci‑dessus) :

```python
env['account.move'].migrate_vault_status_v1_1()
env.cr.commit()
```

Cela met en `todo` (et calcule la clé d’idempotence pour) toutes les factures **posted** qui sont soit non vaultées soit sans statut. Les deux factures concernées seront prises en compte si elles sont bien **posted** et **out_invoice** (ou in_invoice/refund).

### Option B — Remettre en `todo` uniquement certaines factures (par ID ou nom)

Dans le shell Odoo (si besoin : `from odoo import fields`) :

```python
from odoo import fields
# Par ID (ex. 42 et 43)
inv_ids = [42, 43]
moves = env['account.move'].browse(inv_ids)
for m in moves:
    if m.state != 'posted' or m.move_type not in ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']:
        print(f"Skip {m.name}: state={m.state} move_type={m.move_type}")
        continue
    idempotency_key = m._compute_idempotency_key(m)
    m.write({
        'dorevia_vault_status': 'todo',
        'dorevia_vault_idempotency_key': idempotency_key,
        'dorevia_vault_attempt_count': 0,
        'dorevia_vault_next_retry_at': fields.Datetime.now(),
        'dorevia_vault_last_error': None,
    })
    print(f"OK {m.name} -> todo")
env.cr.commit()
```

Si vous ne connaissez pas les ID : utiliser la même boucle sur un `search` filtré (ex. par numéro de facture ou date).

### Option C — Déclencher le worker à la main après remise en `todo`

Après avoir remis les factures en `todo` (Option A ou B), le **job queue** ou le **CRON** les prendra au prochain passage. Pour forcer un passage immédiat :

```python
# Déclencher le worker DVIG (envoi ingest + outbox + fetch proof)
env['dorevia.dvig.service'].with_delay(
    priority=10, channel='dorevia_vault', description="Trigger DVIG worker"
).job_trigger_worker(limit=50)
```

(Si `with_delay` n’existe pas, le CRON le fera dans les 5 minutes.)

---

## 4. Forcer le vaulting d’une facture (script existant)

Le dépôt contient un script qui met une facture en `todo` si besoin puis appelle l’envoi DVIG :

```bash
# Remplacer 1899 par l’ID Odoo de la facture
./scripts/force_vault_invoice.sh 1899
```

Le script cible le conteneur **`odoo_stinger_sarl-la-platine`** et la base **sarl-la-platine**. Si votre conteneur ou base a un autre nom, adapter le `docker exec` dans le script.

---

## 5. Vérifier la configuration DVIG (si aucune facture ne vault)

Dans le shell Odoo :

```python
p = env['ir.config_parameter'].sudo()
for k in ['dorevia.dvig.url', 'dorevia.dvig.token', 'dorevia.dvig.source', 'dorevia.vault.url']:
    v = p.get_param(k) or ''
    print(k, ':', v[:50] + '...' if len(v) > 50 else v)
```

Tous doivent être renseignés pour que `_should_vault()` renvoie True.

---

## 6. Résumé

| Situation | Action |
|-----------|--------|
| Deux (ou quelques) factures jamais « Protégées », les autres OK | Diagnostic §2 → si `status` vide ou `failed_*`, faire Option A (migration) ou B (remise en `todo` par ID), puis Option C si besoin. |
| Toutes les factures restent non vaultées | Vérifier la config §5 et les logs Odoo / queue_job / DVIG. |
| Une facture précise à forcer | Utiliser `force_vault_invoice.sh <ID>` après l’avoir remise en `todo` si nécessaire. |

Une fois en `todo` et avec une clé d’idempotence, le flux normal (job_trigger_worker ou CRON) envoie la facture au DVIG puis au Vault et récupère la preuve ; l’utilisateur voit alors « Facture protégée » et peut télécharger l’attestation.

---

## 7. Cas : DVIG → Vault renvoie 404 sur POST /api/v1/events

Si une facture reste en **pending_proof** et que les logs DVIG indiquent :

```text
"error_type": "http_404"
"error_message": "Client error '404 Not Found' for url 'http://vault:8080/api/v1/events'"
```

alors le **conteneur Vault** (ex. vault-core-stinger) ne propose pas l’endpoint **POST /api/v1/events** (ou la route n’est pas enregistrée dans l’image déployée). Le code du Vault dans `sources/vault/internal/handlers/events.go` définit bien cet endpoint ; il faut **déployer une image Vault qui enregistre cette route**. Dans ce dépôt, le point d'entrée est **`sources/vault/cmd/vault/main.go`** (il enregistre POST `/api/v1/events`). Reconstruire l'image : `cd sources/vault && docker build -t dorevia/vault:VERSION .`, puis mettre à jour le compose platform et redémarrer le service vault. Tant que le Vault renverra 404 sur `/api/v1/events`, les événements envoyés par le DVIG ne seront pas enregistrés et la preuve restera indisponible (404 sur GET proof).

### Pourquoi une seule facture sur 30 échoue ?

Toutes les factures passent par le **même** flux : Odoo → DVIG /ingest → outbox → **POST Vault /api/v1/events**. Si le Vault renvoie 404 sur `/api/v1/events`, la cause la plus probable est **la chronologie** :

- Les **29 factures** ont été validées et traitées **avant** un changement côté Vault (redéploiement, changement d’image, ou période où la route `/api/v1/events` existait encore). Leurs événements ont donc bien été enregistrés dans le Vault à l’époque.
- La **30ᵉ** (ex. FAC/2026/00009) a été soit validée **après** ce changement, soit remise en `todo` et retentée **après** que le Vault ait cessé d’exposer `/api/v1/events`. Elle est alors la première (ou une des seules) à subir le 404.

En résumé : ce n’est pas une particularité de la facture 00009, c’est le **moment** où son événement a été envoyé au Vault (après que la route ait disparu ou que l’instance ait été remplacée). Dès que le Vault exposera à nouveau POST `/api/v1/events`, les prochaines factures (et un retry de la 00009) pourront être vaultées.

---

## 8. Total « Ventes certifiées » dans Linky (bon total)

La carte **Ventes certifiées** (Dorevia Linky) affiche le total retourné par **Vault GET /ui/aggregations/sales** (somme des `total_ttc` des documents facture de vente pour le tenant).

### Problème : doublon et total faux

- **Doublon** : une même facture (ex. 1905 / FAC/2026/00009) peut apparaître **deux fois** dans la table `documents` (deux événements avec des clés d’idempotence différentes, ex. après un re-play). Sans déduplication, elle est comptée deux fois → total **surestimé** (ex. 367 308,73 € au lieu de 353 583,13 €).
- **Factures manquantes** : les deux premières factures (1896 FAC/00001, 1898 FAC/00002) ne sont pas dans le Vault ; le total Vault est donc **inférieur** au total Odoo (30 factures vaultées dans Odoo = 914 093,53 € ; dans le Vault seulement 28 factures distinctes après dédup = 353 583,13 €).

### Correctif appliqué (agrégation Vault)

Dans **`sources/vault/internal/storage/aggregations_sales.go`** :

- **Déduplication par facture** : pour le total et les séries, on ne compte qu’**une ligne par `odoo_id`** (la plus récente en cas de doublon, via `ROW_NUMBER() OVER (PARTITION BY odoo_id ORDER BY created_at DESC)`).
- **Résultat** : le total affiché correspond à la somme des factures **distinctes** présentes dans le Vault (ex. 353 583,13 € pour sarl-la-platine sans les deux premières factures).

### Pour afficher le total Odoo (914 k€)

Il faut que les **factures 1896 et 1898** soient également vaultées et présentes dans le Vault (flux Odoo → DVIG → Vault). Tant qu’elles n’y sont pas, le total Linky restera inférieur au total des 30 factures côté Odoo.
