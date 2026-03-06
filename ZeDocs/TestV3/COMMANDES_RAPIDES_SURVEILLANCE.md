# ⚡ Commandes Rapides — Surveillance Test Facture

## 🚀 Démarrage Rapide

### 1. Script de Surveillance Automatique

```bash
# Utiliser le script de surveillance
./scripts/surveillance_facture.sh FAC/2026/XXXXX

# Ou directement
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT 
    name,
    state,
    dorevia_vault_status,
    dorevia_vault_attempt_count,
    dorevia_vault_last_try_at,
    dorevia_vault_proof_hash,
    dorevia_vault_proof_url
FROM account_move 
WHERE name = 'FAC/2026/XXXXX';
"
```

### 2. Vérifier l'État de la Facture

```bash
# Remplacer FAC/2026/XXXXX par le numéro de votre facture
FACTURE="FAC/2026/XXXXX"

docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT 
    name,
    state,
    dorevia_vault_status,
    dorevia_vault_attempt_count,
    dorevia_vault_last_try_at
FROM account_move 
WHERE name = '$FACTURE';
"
```

### 3. Voir les Jobs en Cours

```bash
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "
SELECT 
    name,
    state,
    date_created,
    date_started,
    date_done
FROM queue_job 
WHERE (name LIKE '%vault%' OR name LIKE '%proof%')
  AND date_created > NOW() - INTERVAL '10 minutes'
ORDER BY date_created DESC;
"
```

### 4. Surveiller les Logs Odoo

```bash
docker logs -f odoo_stinger_sarl-la-platine | grep -E "vault|proof|dorevia"
```

### 5. Surveiller les Logs DVIG

```bash
docker logs -f dvig-core-stinger | grep -E "outbox|forward|vault"
```

### 6. Vérifier les Métriques DVIG

```bash
# Backlog
curl -s http://localhost:8080/metrics | grep dvig_outbox_backlog

# Succès
curl -s http://localhost:8080/metrics | grep dvig_forward_success_total

# Erreurs
curl -s http://localhost:8080/metrics | grep dvig_forward_failed
```

---

## 📋 Checklist Rapide

```bash
# 1. État facture
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "SELECT name, state, dorevia_vault_status FROM account_move WHERE name = 'FAC/2026/XXXXX';"

# 2. Jobs récents
docker exec odoo_db_stinger_sarl-la-platine psql -U odoo -d odoo_stinger_sarl-la-platine -c "SELECT name, state FROM queue_job WHERE date_created > NOW() - INTERVAL '5 minutes' ORDER BY date_created DESC LIMIT 5;"

# 3. Logs DVIG
docker logs dvig-core-stinger --tail 10 | grep -E "outbox|forward"

# 4. Métriques
curl -s http://localhost:8080/metrics | grep -E "dvig_outbox|dvig_forward"
```

---

**Astuce** : Utilisez le script `./scripts/surveillance_facture.sh` pour une surveillance automatique en temps réel !
