# DVIG et durée du processus vault

Rôle de DVIG dans la chaîne **Odoo → DVIG → Vault → « Protégée »** et où le temps peut partir.

---

## 1. Flux côté DVIG

1. **Déclenchement**  
   Odoo (queue_job) appelle **immédiatement** `POST /internal/outbox/process` — pas d’attente du scheduler.

2. **Traitement**  
   DVIG lit l’outbox, pour chaque événement en attente appelle `forward_to_vault()` : **une requête HTTP POST** vers Vault `POST /api/v1/events`.

3. **Scheduler (filet de sécurité)**  
   Toutes les **10 s** (`DVIG_SCHEDULER_INTERVAL=10` en core-stinger), le scheduler retraite l’outbox. Il ne sert que si l’appel depuis Odoo a échoué ou n’a pas eu lieu.

Donc en fonctionnement normal, **le délai ajouté par DVIG** = temps de la requête vers Vault (sélection outbox + POST + réponse).

---

## 2. Où le temps peut partir

| Étape | Config / code | Impact possible |
|-------|----------------|-----------------|
| Attente scheduler | `DVIG_SCHEDULER_INTERVAL=10` | **Aucun** sur le chemin normal (Odoo appelle directement `/internal/outbox/process`). |
| Timeout vers Vault | `vault_timeout` (défaut **10 s**, `config.py`) | Si Vault répond lentement, DVIG attend jusqu’à 10 s ; au-delà → timeout, retry plus tard (failed_soft). |
| Réponse Vault | Côté Vault (DB, sealing, etc.) | Si Vault met 5–30 s à répondre 200, toute cette durée est vue par DVIG (et par l’utilisateur comme délai avant « Protégée »). |

Variable d’environnement possible (si exposée dans `config.py`) : `VAULT_TIMEOUT` (secondes). En l’état, seul le défaut 10 s est utilisé.

---

## 3. Vérifier les durées côté DVIG

Les logs DVIG (JSON) contiennent pour chaque envoi réussi vers Vault :

- `"event": "outbox_event_forwarded"`
- `"duration_seconds": <float>`

Commandes utiles :

```bash
# Derniers envois réussis et leur durée
docker logs dvig-core-stinger 2>&1 | grep -o '"outbox_event_forwarded"[^}]*' | tail -20

# Ou extraire duration_seconds (si log JSON)
docker logs dvig-core-stinger 2>&1 | grep outbox_event_forwarded | tail -10
```

Script dédié (si présent) :

```bash
./scripts/check_dvig_forward_duration.sh
```

Si `duration_seconds` est souvent proche de 1–3 s, le goulot n’est pas DVIG mais **Vault** (traitement) ou **Odoo** (fetch_proof / backoff). Si c’est souvent 5–10 s ou des timeouts, regarder la santé et la charge de Vault.

**Vérifier le temps côté Vault** : voir `ZeDocs/web14/VAULT_DUREE_TRAITEMENT.md` et `./scripts/check_vault_event_duration.sh` (après déploiement du log `duration_ms`).

---

## 4. Résumé

- **Chez DVIG** : pas de délai volontaire sur le chemin normal ; seul le temps de la requête vers Vault (et éventuellement le timeout 10 s) compte.
- **Réduire la durée perçue** : optimiser Vault (réponse plus rapide) et/ou le backoff fetch_proof dans Odoo (déjà [1,2,4,8,20] s).
