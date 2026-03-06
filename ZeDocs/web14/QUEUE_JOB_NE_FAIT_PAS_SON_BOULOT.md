# Queue_job ne fait pas son boulot — Vérifications

**Symptôme** : vaultage en 1–2 min au lieu de ≤ 30 s ; dans le diagnostic on ne voit que « Reconciler proof » / « Refresh proof », jamais « Trigger DVIG worker » ni « Fetch proof for FAC/... » automatique.

**Cause probable** : le job runner queue_job ne tourne pas ou ne traite pas le channel `dorevia_vault`, donc seuls les CRON enqueuent/exécutent des jobs (Reconciler, etc.).

---

## 1. Vérifier que le job runner démarre

Le module OCA queue_job lance un **job runner** (thread ou processus) qui envoie les jobs aux workers Odoo. Il doit apparaître dans les logs au démarrage d’Odoo.

```bash
./scripts/check_queue_job_runner.sh
# ou manuellement :
docker logs odoo_stinger_sarl-la-platine 2>&1 | grep -i queue_job
# ou après un restart :
docker restart odoo_stinger_sarl-la-platine && sleep 15 && docker logs odoo_stinger_sarl-la-platine 2>&1 | tail -100 | grep -i queue
```

**À voir** : des lignes du type  
`queue_job.jobrunner.runner: starting`  
`queue job runner ready for db ...`

Si **rien** n’apparaît avec "queue_job" ou "jobrunner", le runner ne démarre pas (souvent parce que **workers &lt; 2** ou queue_job pas dans `server_wide_modules`).

---

## 2. Condition obligatoire : workers ≥ 2

D’après la doc OCA, le job runner ne s’active que si Odoo est lancé avec **au moins 2 workers**.

Dans `tenants/sarl-la-platine/apps/odoo/stinger/odoo.conf` vous avez déjà :

```ini
[options]
workers = 2
server_wide_modules = web,queue_job

[queue_job]
channels = root:2,dorevia_vault:2
```

- Si vous aviez `workers = 1` (ou 0), passer à **workers = 2** minimum, redémarrer Odoo, puis revérifier les logs (étape 1).
- Si le conteneur lance Odoo **sans** charger ce `odoo.conf` (autre fichier ou ligne de commande), corriger pour que `workers` et `server_wide_modules` soient bien pris en compte.

---

## 3. Channels : syntaxe possible en sous-canal

Les jobs vault sont enqueués avec `channel='dorevia_vault'`. Le runner doit connaître ce canal.

En cas de doute, essayer une config en **sous-canal de root** :

```ini
[queue_job]
channels = root:2,root.dorevia_vault:2
```

Puis redémarrer Odoo et retester (nouvelle facture + diagnostic).

---

## 4. Vérifier les logs à la validation

Après avoir activé les logs `[Vault]` dans le connecteur, **valider une facture** puis :

```bash
docker logs odoo_stinger_sarl-la-platine 2>&1 | tail -200 | grep -E "Vault|queue_job|Trigger|Worker DVIG"
```

- Si vous voyez **« [Vault] Trigger DVIG worker non enqueued : ... »** → le job n’est pas enqueué (cause indiquée : queue_job absent, token manquant, etc.).
- Si vous voyez **« Worker DVIG déclenché via queue_job »** mais toujours pas de job « Trigger DVIG worker » dans `diagnostic_vault_plus_de_120s.sh` → le job est enqueued mais pas exécuté (runner ou channel).

---

## 5. Résumé des contrôles

| Contrôle | Commande / Fichier | Attendu |
|----------|--------------------|--------|
| Runner dans les logs | `docker logs ... \| grep -i queue_job` | Lignes "starting" / "ready for db" |
| Workers ≥ 2 | `odoo.conf` → `[options]` → `workers = 2` | Présent et ≥ 2 |
| Channels | `odoo.conf` → `[queue_job]` → `channels = root:2,dorevia_vault:2` (ou `root.dorevia_vault:2`) | Cohérent avec le code |
| Enqueue à la validation | Logs après validation | « Worker DVIG déclenché via queue_job » (pas « non enqueued ») |
| Jobs exécutés | `./scripts/diagnostic_vault_plus_de_120s.sh` | Apparition de « Trigger DVIG worker » et « Fetch proof for FAC/... » |

Une fois le runner actif et les jobs visibles dans le diagnostic, le vaultage devrait redescendre vers ≤ 30 s (objectif ≤ 15 s).
