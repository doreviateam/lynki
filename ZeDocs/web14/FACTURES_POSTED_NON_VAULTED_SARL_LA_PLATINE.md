# Factures postées non présentes dans le Vault — sarl-la-platine

**Date** : 2026-02-07  
**Source** : comparaison Odoo (account_move posted, out_invoice) vs Vault (documents tenant sarl-la-platine, move_type out_invoice).

---

## Résultat

Sur **30 factures clients postées** dans Odoo, **28** sont présentes dans le Vault (vault-core-stinger).  
**2 factures** sont **absentes du Vault** (alors qu’elles sont marquées « vaulted » dans Odoo) :

| Numéro        | Date facture | Total TTC    | Statut dans Odoo |
|---------------|--------------|--------------|-------------------|
| **FAC/2026/00001** | 2026-01-11   | **427 951,20 €** | vaulted           |
| **FAC/2026/00002** | 2026-01-11   | **132 559,20 €** | vaulted           |
| **Total manquant** |              | **560 510,40 €** |                  |

---

## Conséquences

- **Total Odoo** (30 factures) : 914 093,53 €  
- **Total Vault** (28 factures) : 353 583,13 €  
- **Écart** : 560 510,40 € = exactement la somme des 2 factures ci-dessus.

Odoo affiche donc « Protégée » pour FAC/2026/00001 et FAC/2026/00002 (et stocke sans doute une preuve récupérée à un moment), mais **aucune ligne** ne correspond à ces numéros dans la table `documents` du Vault core-stinger. Causes possibles : envoi vers un autre Vault, échec silencieux à la création du document, ou base Vault réinitialisée après un premier enregistrement.

---

## Relance du vault (effectuée le 2026-02-07)

Les 2 factures ont été **remises en `todo`** dans Odoo pour être renvoyées vers DVIG puis le Vault :

```sql
-- Base: odoo_stinger_sarl-la-platine (conteneur odoo_db_stinger_sarl-la-platine)
UPDATE account_move
SET
  dorevia_vault_status = 'todo',
  dorevia_vault_next_retry_at = NULL,
  dorevia_vault_attempt_count = 0,
  dorevia_vault_last_error = NULL
WHERE name IN ('FAC/2026/00001', 'FAC/2026/00002')
  AND state = 'posted' AND move_type = 'out_invoice';
```

- **CRON « Vault Send DVIG »** : tourne toutes les 1 minute ; envoie les factures en `todo` vers DVIG → statut `pending_proof`.
- **CRON « Vault Fetch Proof »** : récupère la preuve auprès du Vault et repasse en `vaulted` une fois le document créé.

**Vérification** (après quelques minutes) :
- Odoo : les 2 factures doivent repasser à `vaulted` (onglet Sécurisation sur la facture).
- Vault : requête sur `vault-db-core-stinger`, table `documents`, `tenant_id = 'sarl-la-platine'`, filtrer par `source_ref` contenant FAC/2026/00001 et 00002 — les 2 lignes doivent apparaître.

### Jobs « Reconciler proof » en Pending (file queue_job)

Si les 2 jobs restent en **Pending** dans la file Odoo (File d’attente des tâches, canal `dorevia_vault`), c’est que **aucun worker n’écoute le canal `dorevia_vault`**. Corriger la config Odoo stinger :

- **Fichier** : `tenants/sarl-la-platine/apps/odoo/stinger/odoo.conf`
- **Section `[queue_job]`** : ajouter le canal `dorevia_vault` :
  ```ini
  [queue_job]
  channels = root:2,dorevia_vault:2
  ```
- **Redémarrer le conteneur Odoo** pour que le job runner prenne en compte le nouveau canal :
  ```bash
  cd /opt/dorevia-plateform/tenants/sarl-la-platine/apps/odoo/stinger
  docker compose restart odoo
  ```
  Les 2 jobs en attente seront alors exécutés (fetch proof → statut `vaulted` si le Vault a bien créé les documents).

### Jobs exécutés mais en échec (404 Proof not found)

Les 2 jobs « Reconciler proof » ont bien été pris en charge par le worker après redémarrage, mais ils ont **échoué** (état `failed`) après 5 tentatives avec :

- **Erreur** : `Preuve non disponible pour FAC/2026/00001 (404)` / idem pour 00002  
- **Cause** : le Vault répond 404 sur `GET /api/v1/proof/account_move/{id}` car **aucun document** pour ces factures (move_id 1896, 1898) n’existe dans la base du Vault (vault-core-stinger, tenant sarl-la-platine).

Les factures sont restées en **pending_proof**. Pour qu’elles passent en vaulted, il faut que les documents soient créés dans le Vault (flux Odoo → DVIG → Vault). À vérifier : envoi DVIG vers le bon Vault, traitement outbox DVIG, et création des documents côté Vault (tenant, odoo_model, odoo_id).

### Si les jobs restent Pending après le redémarrage

1. **Vérifier que le conteneur voit bien la config** :
   ```bash
   docker exec odoo_stinger_sarl-la-platine grep -A3 '\[queue_job\]' /etc/odoo/odoo.conf
   ```
   Vous devez voir `channels = root:2,dorevia_vault:2`. Si vous voyez seulement `channels = root:2`, le fichier monté n’est pas celui modifié (vérifier le chemin du compose).

2. **Contourner la file : exécuter le fetch proof en synchrone** (sans queue_job). Les 2 factures doivent être en statut `pending_proof` (après envoi par le CRON « Vault Send DVIG »). Lancer le shell Odoo puis coller le bloc ci‑dessous :
   ```bash
   docker exec -it odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine -c /etc/odoo/odoo.conf
   ```
   Dans le shell Python :
   ```python
   moves = env['account.move'].search([
       ('name', 'in', ['FAC/2026/00001', 'FAC/2026/00002']),
       ('state', '=', 'posted'),
       ('move_type', '=', 'out_invoice'),
   ])
   for m in moves:
       print(m.name, m.dorevia_vault_status)
       if m.dorevia_vault_status in ('pending_proof', 'failed_soft'):
           m.job_vault_fetch_proof()
           env.cr.commit()
           print(m.name, '->', m.dorevia_vault_status)
   ```
   Si les documents existent dans le Vault, le statut passera à `vaulted`. Sinon vous obtiendrez une erreur (ex. 404) ou un retry.

3. **Optionnel** : dans l’interface Odoo, ouvrir chaque job (File d’attente des tâches → clic sur le job) et utiliser le bouton **Exécuter** / **Run** s’il existe, pour lancer le job à la main.

---

## Pistes si la relance échoue

1. **Vérifier l’historique** : Les 2 factures ont été postées/vaultées très tôt (11/01/2026). Vérifier si des events ont bien été envoyés au DVIG et au Vault pour ces numéros (logs DVIG outbox, logs Vault).
2. **Script de backfill** : Si le CRON ne suffit pas, utiliser un script qui envoie un event pour chaque facture manquante vers le Vault.
3. **Cohérence Odoo** : Si les documents ne peuvent pas être recréés dans le Vault, envisager de repasser le statut Odoo de ces 2 factures à un état reflétant l’absence de preuve (pour éviter d’afficher « Protégée » alors que le Vault ne les connaît pas).
