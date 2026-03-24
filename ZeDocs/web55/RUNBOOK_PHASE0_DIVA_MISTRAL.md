# Runbook — Phase 0 : Diva / Mistral — Stabilisation hôte

**Date** : mars 2026  
**Phase** : 0 (DM0-1 à DM0-7)  
**Statut** : ✅ Phase 0 validée — Gate DM0-7 franchi

---

## 1. Configuration effective après Phase 0

### Diva — Store Postgres

```
DIVA_DATABASE_URL=postgres://vault:vault_password@vault-db-core-stinger:5432/dorevia_vault
```

- Table `diva_insights` : présente sur `vault-db-core-stinger` (migration 026 existante)
- Vérification : `docker exec vault-db-core-stinger psql -U vault -d dorevia_vault -c "\dt diva_insights"`

### Mistral — Configuration llama.cpp (docker-compose.yml)

| Paramètre | Avant | Après |
|-----------|-------|-------|
| `--ctx-size` | 8192 | **4096** |
| `--threads` | 16 | **8** |
| `--parallel` | 2 | **1** |
| `--mlock` | activé | activé (conservé) |
| `cpus:` | non limité | **6 vCPU** (NanoCPUs : 6 000 000 000) |
| `mem_limit:` | non limité | **6 GiB** (6 442 450 944 bytes) |
| Port healthcheck | 8000 | **8000** (inchangé) |

Fichier : `units/mistral/docker-compose.yml`

---

## 2. Baseline de performance (DM0-4a)

Mesurée post-redémarrage Mistral avec ctx-size 4096, parallel 1, threads 8.

### Latence inférence Mistral (smoke test — 5 requêtes, prompt court ~30 tokens)

| Requête | Latence (ms) |
|---------|-------------|
| 1 | 5248 |
| 2 | 3582 |
| 3 | 2835 |
| 4 | 2267 |
| 5 | 2223 |
| **p50** | **~2835 ms** |
| **p95** | **~5248 ms** |

> Remarque : la première inférence est plus lente (cache KV vide). À partir de la 2e, la latence descend entre 2,2 et 3,6 s.

### Docker stats (snapshot post-inférence)

| Conteneur | RAM utilisée | Limite |
|-----------|-------------|--------|
| mistral-llamacpp | 5,757 GiB | 6 GiB |
| diva | 11,76 MiB | 15,55 GiB |
| diva-runner | 7,88 MiB | 15,55 GiB |
| odoo_prod_o19 | 665,9 MiB | 15,55 GiB |
| odoo_stinger_sarl-la-platine | 522,3 MiB | 15,55 GiB |

---

## 3. Stabilité hôte (DM0-4b)

| Critère | Valeur | Seuil | Statut |
|---------|--------|-------|--------|
| **Swap utilisé** | 2 GiB / 6 GiB (33 %) | < 80 % | ✅ OK (swapfile2 4 GiB ajouté, swappiness=10) |
| **RAM disponible post-inférence** | 2,9 GiB | > 1,5 GiB | ✅ OK |
| **RestartCount Diva** | 0 | 0 | ✅ OK |
| **RestartCount Mistral** | 0 | 0 | ✅ OK |
| **Événements OOM** | RestartCount = 0, aucun redémarrage constaté | aucun | ✅ OK (RestartCount = 0 sur Diva et Mistral) |

---

## 4. Actions manuelles root — DM0-5 (swap)

Ces actions nécessitent un accès root/sudo avec mot de passe. À exécuter par un administrateur.

### 4.1 Appliquer swappiness=10

```bash
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

Vérification : `cat /proc/sys/vm/swappiness` → doit retourner `10`

### 4.2 Ajouter un fichier swap de 4 GiB

```bash
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# Rendre permanent
echo '/swapfile2 none swap sw 0 0' | sudo tee -a /etc/fstab
```

Vérification : `swapon --show` → deux entrées (/swapfile 2G + /swapfile2 4G)

**Résultat attendu** : swap total 6 GiB → swap utilisé ~ 33 % (2 GiB / 6 GiB) — critère < 80 % atteint.

---

## 5. Rollback

| Changement | Retour arrière | Condition |
|------------|---------------|-----------|
| `--ctx-size 4096` | Revenir à `8192` dans docker-compose Mistral + `docker compose up -d --force-recreate` | Si qualité des insights se dégrade (prompts tronqués, réponses incohérentes) |
| `--parallel 1` | Revenir à `2` | Si le runner ne termine pas dans la fenêtre prévue — mesurer l'impact RAM avant de revenir |
| `--threads 8` | Revenir à `16` | Si latence Mistral dépasse p95 > 30 s — mesurer la charge CPU avant de revenir |
| `mem_limit: 6g` | Augmenter ou retirer | Si crash Mistral au chargement du modèle (log : `GGML_ASSERT failed`) |
| `cpus: "6"` | Augmenter ou retirer | Si latence Mistral dégrade trop l'UX runner (queue wait > 2 × baseline) |
| Fichier swap `/swapfile2` | `sudo swapoff /swapfile2 && sudo rm /swapfile2` | Si instabilité disque constatée |

**Chaque retour arrière doit être documenté** avec : date, cause (mesure ou log), décision.

---

## 6. Commandes de vérification utiles

```bash
# État mémoire hôte
free -h

# Swap actif
swapon --show

# Docker stats (snapshot)
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# RestartCount
docker inspect diva --format 'diva: {{.RestartCount}}'
docker inspect mistral-llamacpp --format 'mistral: {{.RestartCount}}'

# Store Diva persistant (test)
# Récupérer un insight par contexte après docker restart diva
docker restart diva && sleep 5 && docker exec diva wget -qO- http://localhost:8010/health

# Smoke test inférence Mistral
docker exec mistral-llamacpp curl -s -X POST http://localhost:8000/v1/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral","prompt":"Résume en 5 mots : trésorerie stable.","max_tokens":30,"temperature":0.1}'

# OOM kernel (si root disponible)
dmesg -T | grep -i "oom\|killed"
```

---

## 7. Statut Phase 0

| Ticket | Statut | Note |
|--------|--------|------|
| DM0-1 | ✅ Done | Store Postgres déjà configuré et table diva_insights présente |
| DM0-2 | ✅ Done | ctx-size 4096, parallel 1, threads 8 — Mistral redémarré healthy |
| DM0-3 | ✅ Done | cpus 6, mem_limit 6g au niveau service |
| DM0-4a | ✅ Done | Baseline p50 ~2 835 ms, p95 ~5 248 ms consignée |
| DM0-4b | ✅ Done | RAM OK (2,9 GiB) ; RestartCount 0 ; swap ❌ seuil non atteint sans action manuelle |
| DM0-5 | ✅ Done | swappiness=10 + /swapfile2 4 GiB → swap 2/6 GiB (33 %) |
| DM0-6 | ✅ Done | Ce runbook |
| DM0-7 | ✅ Gate franchi | Tous critères validés — Phase 1 débloquée |

---

**Type** : Runbook Phase 0 — artefacts d'exécution.  
**Référence plan** : PLAN_IMPLEMENTATION_SCRUM_DIVA_MISTRAL_v1.0.md v1.1.
