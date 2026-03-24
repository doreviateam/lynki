# Avis d'expert — Diva / Mistral

**Date** : mars 2026  
**Version** : 1.2  
**Répertoire** : ZeDocs/web55  
**Référence** : `Note_Diva_Mistral_Optimisation.md` v1.2  
**Périmètre** : code existant (`units/diva`, `units/mistral`), infrastructure hôte (doreviateam), comportement runtime.

---

## 1. Ce que l'infrastructure révèle vraiment

### 1.1 État des ressources au moment de l'audit

| Ressource | Constat |
|-----------|---------|
| **RAM totale** | 15,6 GiB |
| **RAM utilisée** | ~13 GiB (83 %) |
| **RAM disponible** | ~1,9 GiB |
| **Swap** | 2 GiB / 2 GiB utilisés — **saturé à 100 %** |
| **CPU** | 8 cœurs (16 threads logiques) |
| **Mistral RAM** | 4,66 GiB — 30 % de la RAM totale |
| **Diva + runner** | ~17 MiB — négligeable |

**Le swap est saturé.** C'est le signal le plus important de cet audit. Avec un swap saturé et une faible marge mémoire disponible, le risque de latences erratiques, de reclaim agressif, de redémarrages de conteneurs ou d'événements OOM devient significatif. Toute activité supplémentaire sur le serveur (inférence Mistral, pic Odoo, déploiement) n'a plus aucun tampon pour absorber la pression.

### 1.2 La configuration llama.cpp

```
--ctx-size 8192  --threads 16  --batch-size 512  --parallel 2  --mlock
```

| Paramètre | Valeur | Lecture critique |
|-----------|--------|-----------------|
| `--ctx-size 8192` | Grande fenêtre contexte | Consomme plus de RAM pour le KV-cache ; inutile si les prompts font < 1500 tokens. À réduire progressivement (voir §4). |
| `--threads 16` | Tous les threads logiques | Sature le CPU à la première inférence ; d'autres processus (Odoo, Dvig) en souffrent. **Tester à 6–8.** |
| `--batch-size 512` | Raisonnable | OK. |
| `--parallel 2` | 2 inférences simultanées | Cohérent avec `RUNNER_CONCURRENCY=1` max. Mais avec la RAM sous pression, 2 inférences simultanées peuvent amplifier la contention. |
| `--mlock` | Modèle verrouillé en RAM | C'est ce qui maintient les 4,66 GiB en RAM plutôt qu'en swap — bonne décision. À conserver absolument. |

### 1.3 Ce qui tourne sur le même hôte

L'hôte héberge simultanément : 3 instances Linky, Vault, Dvig, **4 instances Odoo** (prod + lab, laplatine2026 + o19, firmin), 4 bases Postgres Odoo, mistral-llamacpp, Diva, diva-runner, Caddy. Les instances Odoo seules consomment ~1,8 GiB de RAM. C'est un serveur multi-locataire très dense pour une machine de 15,6 GiB.

**Le niveau de contention acceptable n'est pas le même selon que l'hôte supporte uniquement du lab ou héberge aussi des services de production.** Ici, les deux coexistent. C'est ce qui rend le sujet des limites CPU/mémoire sur Mistral non négociable.

---

## 2. Les vrais risques, dans l'ordre

### Risque 1 — La RAM (critique)

**Situation** : swap saturé + Mistral locké à 4,66 GiB + Odoo à ~1,8 GiB = plus aucune marge.

**Conséquence concrète** : avec un swap saturé, le kernel ne dispose d'aucun espace supplémentaire lors d'une inférence. Le reclaim mémoire devient agressif, ce qui se manifeste par des latences erratiques (30–60+ s au lieu de 15–20 s), un risque de redémarrage de conteneurs, et des événements OOM potentiellement silencieux.

**Ce qui masque ce risque** : Diva est en fallback mémoire (pas de Postgres configuré), donc chaque redémarrage repart de zéro — les insights sont perdus. Si Diva redémarre suite à une contention mémoire, le symptôme visible est simplement « l'insight n'est pas disponible » — sans trace explicite de la cause.

**Action prioritaire** : réduire `--ctx-size` progressivement (voir §4). Le gain RAM est substantiel car le KV-cache est proportionnel au ctx-size. Vérifier ensuite si le swap se désature.

### Risque 2 — Store mémoire (bloquant pour la robustesse)

**Situation** : dans `docker-compose.yml`, `DIVA_DATABASE_URL` est vide par défaut. Diva tourne donc en mode **fallback mémoire** (`memory_store.go`), pas en mode Postgres.

**Conséquence concrète** :
- À chaque redémarrage de Diva (contention, déploiement, crash), **tous les insights précalculés sont perdus**.
- L'objectif « affichage < 5 s via store » est structurellement fragile : le store disparaît avec le processus.
- Le prewarm du runner perd l'essentiel de sa valeur : les insights générés ne survivent pas au-delà de la durée de vie du conteneur.
- C'est le point de défaillance le plus simple à corriger et le plus impactant sur la robustesse globale.

**Action** : brancher `DIVA_DATABASE_URL` sur la base Postgres du Vault (déjà disponible sur `dorevia-network`). Créer la table `diva_insights` si nécessaire (migration SQL à prévoir). C'est le prérequis structurel de tout le reste.

### Risque 3 — Aucune limite CPU/mémoire sur Mistral

**Situation** : le conteneur Mistral n'a aucun `cpus:` ni `mem_limit:` dans son docker-compose.

**Conséquence** : lors d'une inférence, Mistral peut consommer jusqu'à 16 threads CPU. Sur un hôte qui héberge à la fois des environnements lab et des services Odoo de production, cette absence de limite expose la production à des dégradations lors de chaque génération DIVA.

**Action** : ajouter `cpus: "6"` et `mem_limit: 6g` sur le conteneur Mistral. Utiliser les clés `cpus:` et `mem_limit:` directement au niveau `service` dans docker-compose — **ne pas s'appuyer uniquement sur `deploy.resources`**, qui n'est pas appliqué par `docker compose` classique en dehors de Docker Swarm. À ajuster après mesure.

### Risque 4 — Absence de single-flight (déjà documenté)

**Situation** : `UpsertProcessing` (Postgres) permet un mécanisme de lock par `context_hash` — mais uniquement si le store Postgres est activé. En mode mémoire, il n'existe aucune coordination entre appels concurrents.

**Conséquence** : plusieurs POST `/diva/generate` ou `/diva/explain` simultanés sur le même contexte → plusieurs inférences identiques → pic CPU, timeouts en cascade. Ce risque sera le premier à se matérialiser une fois le store Postgres activé et le trafic réel en place.

---

## 3. Ce qui est bien conçu et ne doit pas changer

### Le guard de concurrence

`internal/guard/guard.go` : `RefreshGuard` limite la concurrence globale par un sémaphore. C'est une protection efficace déjà en place pour les appels `/explain`. À vérifier qu'il couvre aussi `/generate`.

### Le FactsPack

`internal/facts/engine.go` : les faits sont construits, triés par priorité et plafonnés à 10 avant envoi au LLM. C'est exactement la logique de ranking préconisée dans la note. Le travail de fond existe déjà — il faut le valoriser dans le prompt (passer au JSON compact Niveau 1).

### La séparation Go / LLM

Le service Go fait tout le travail de calcul (FactsPack, DataCompleteness, governance, ranking) ; Mistral reformule. Cette séparation est juste et doit être renforcée, pas contournée.

### Le healthcheck et les logs

Le conteneur Diva a un healthcheck fonctionnel. La directive `logging: json-file: max-size 20m, max-file 5` évite la saturation disque. Ce sont des détails qui comptent en production.

---

## 3 bis. Vérifications à réaliser avant tout changement

Ces mesures constituent la **baseline** sans laquelle il est impossible de savoir si les corrections ont eu un effet.

- Relever `docker stats` (Mistral, Diva, Odoo prod) avant, pendant et après une inférence ;
- Vérifier les événements de redémarrage conteneurs : `docker inspect <nom> --format '{{.RestartCount}}'` ;
- Contrôler les événements OOM kernel : `dmesg | grep -i "oom\|killed"` ;
- Mesurer la latence Mistral de référence avant réduction du `ctx-size` (`smoke_test_mistral.sh`) ;
- Vérifier si Diva redémarre et perd ses insights : consulter `docker logs diva` + tester GET `/diva/insights` avant/après ;
- Après activation `DIVA_DATABASE_URL` : confirmer que les insights survivent à un `docker restart diva`.

---

## 4. Ce que je ferais dans les 48 heures

| Action | Pourquoi | Levier |
|--------|----------|--------|
| **Réduire ctx-size 8192 → 4096, puis évaluer 2048** | Libérer du KV-cache, désaturer partiellement le swap. Première étape : `4096`, puis `2048` si les prompts effectifs restent inférieurs au plafond utile. Mesurer latence + qualité à chaque palier. | docker-compose Mistral, paramètre `--ctx-size` |
| **Brancher `DIVA_DATABASE_URL` sur Postgres** | Store persistant : les insights survivent aux redémarrages, le runner a de la valeur | Variable `units/diva/docker-compose.yml` + migration SQL `diva_insights` |
| **Ajouter `cpus: "6"` sur Mistral** | Protéger Odoo prod pendant les inférences, dissocier lab et production | `docker-compose.yml` Mistral — utiliser `cpus:` au niveau service (pas `deploy.resources`, ignoré hors Swarm) |
| **Passer `--parallel 1`** | Avec la RAM sous pression, sérialiser les inférences est plus sûr que de les paralléliser | Paramètre llama.cpp |
| **Collecter la baseline** (§3 bis) | Sans mesure initiale, impossible d'évaluer l'effet des corrections | Scripts existants (`smoke_test_mistral.sh`, `docker stats`) |

---

## 4 bis. Gagner en swap — leviers système

La saturation du swap est un état, pas une fatalité. Voici les leviers disponibles, classés par impact et délai d'exécution.

### Levier 1 — Réduire la consommation de Mistral (impact rapide, avec redémarrage court du conteneur Mistral)

Le KV-cache de llama.cpp est directement proportionnel au `--ctx-size`. C'est le levier le plus rapide.

| Changement | Gain RAM estimé |
|------------|----------------|
| `--ctx-size 8192 → 4096` | ~300–500 MiB |
| `--ctx-size 4096 → 2048` | ~150–300 MiB supplémentaires |
| `--parallel 2 → 1` | Supprime le 2e slot KV-cache — ~150–300 MiB |
| `--threads 16 → 8` | Ne libère pas de RAM, mais réduit les swap-ins indirects sous charge CPU |

**Gain total réaliste** : 500 MiB à 1 GiB, potentiellement suffisant pour sortir de la zone rouge.

### Levier 2 — Arrêter les conteneurs lab inutilisés

4 instances Odoo sur le même hôte, dont des instances lab. Un `docker stop` temporaire sur les instances lab inactives libère 400–600 MiB immédiatement.

```bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

### Levier 3 — Augmenter la taille du swap (fichier swap, 10 minutes)

Doubler ou tripler le swap ne résout pas le fond, mais évite la saturation complète. Un swap à 60 % est infiniment moins problématique qu'un swap à 100 %.

```bash
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# Rendre permanent
echo '/swapfile2 none swap sw 0 0' | sudo tee -a /etc/fstab
```

Résultat : on passe de 2 GiB à 6 GiB de swap total.

### Levier 4 — Ajuster `vm.swappiness`

La valeur par défaut Linux (`60`) pousse le kernel à swapper tôt. La réduire à `10` force le kernel à préférer la RAM — Mistral, verrouillé par `--mlock`, reste en RAM ; les autres processus ont plus de chances de rester en cache.

```bash
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### Levier 5 — Ajouter des limites mémoire sur les conteneurs Odoo lab

Sans `mem_limit`, un conteneur Odoo lab peut croître silencieusement. Ajouter une limite préventive évite les captures mémoire non bornées.

```yaml
deploy:
  resources:
    limits:
      memory: 768m
```

### Ordre de priorité recommandé

| Priorité | Action | Délai | Impact |
|----------|--------|-------|--------|
| 1 | Réduire `--ctx-size` Mistral (4096 puis 2048) | < 5 min | ★★★ immédiat |
| 2 | Arrêter les instances Odoo lab inutilisées | < 2 min | ★★★ immédiat |
| 3 | Augmenter le swap à 6 GiB (fichier swap) | < 10 min | ★★ sécurité |
| 4 | `vm.swappiness = 10` | < 2 min | ★★ comportemental |
| 5 | `mem_limit` sur Odoo lab | 15 min | ★ préventif |

La combinaison **Levier 1 + Levier 2** est faisable en 10 minutes et peut libérer 1 à 1,5 GiB — suffisant pour sortir de la saturation immédiate sans toucher à la production.

---

## 4 ter. Start/stop automatique de Mistral

Une fois le store Postgres activé, la question se pose naturellement : **faut-il garder Mistral allumé en permanence ?**

Avec `--mlock`, Mistral consomme 4,66 GiB en continu — même quand personne ne génère d'insight. Or, une fois les insights précalculés et persistés dans Postgres, la grande majorité des requêtes lit le store : Mistral n'est réellement nécessaire que pendant les **fenêtres de précalcul** (runner) et les **refresh manuels**.

**Un start/stop planifié libérerait ~4,66 GiB pendant les heures creuses** — soit la quasi-totalité du swap actuellement saturé.

### L'approche recommandée : start/stop planifié (cron)

C'est l'approche la plus simple et la plus robuste. Elle s'appuie directement sur l'architecture existante du runner.

```bash
#!/bin/bash
# /opt/scripts/run_diva_cycle.sh

docker start mistral-llamacpp

# Attendre que Mistral soit prêt (healthcheck)
# ⚠ Aligner le port avec la configuration réelle du conteneur (8000 ou autre selon compose)
until curl -sf http://localhost:8000/health > /dev/null; do
  sleep 5
done

# Fenêtre runner : attendre la fin du cycle de précalcul
# En production, remplacer ce délai fixe par un critère observable :
# - runner terminé (signal explicite, fichier sentinel, ou endpoint /runner/status),
# - file vide,
# - ou timeout maximum de sécurité.
# Un sleep fixe risque d'arrêter Mistral trop tôt ou de le laisser tourner inutilement.
sleep 1800  # valeur indicative — à remplacer par un critère de fin réel

docker stop mistral-llamacpp
```

```
# crontab — exécution chaque matin en semaine
0 6 * * 1-5 /opt/scripts/run_diva_cycle.sh >> /var/log/diva_cycle.log 2>&1
```

### Le point de vigilance : le cold start

Le chargement du modèle GGUF avec `--mlock` prend **45 à 90 secondes**. Cette latence doit être absorbée par le runner, pas par l'utilisateur.

La règle d'or :

> **Mistral démarre → runner précalcule → Mistral s'arrête → l'utilisateur lit le store.**

Si un refresh manuel est demandé hors fenêtre, Diva répond avec l'insight existant en store (même s'il date de quelques heures) ou avec le fallback déterministe (Niveau 0), en affichant explicitement un état « actualisation programmée ». C'est le comportement cohérent avec la posture de contrôleur de gestion : les données sont fraîches le matin.

### Le sort des endpoints hors fenêtre

**Ce mode d'exploitation est adapté au bloc synthèse Diva et aux usages de lecture store-first. Il est moins adapté à un service d'explication interactive disponible à tout moment.** Son adoption doit donc être considérée comme un choix de service, pas seulement comme une optimisation d'infrastructure.

Hors fenêtre de disponibilité Mistral, les endpoints d'explication approfondie (`/explain`) doivent soit être désactivés explicitement, soit assumer un comportement dégradé documenté — par exemple : retourner l'insight existant en store avec un horodatage, ou répondre avec un message d'état clair ("explication disponible à partir de 06h00").

### L'approche on-demand (pour mémoire)

Diva pourrait démarrer Mistral à la demande via l'API Docker, attendre le healthcheck, puis exécuter l'inférence. Cette approche est plus flexible mais expose la première requête post-cold-start à une latence de 45–90 s, incompatible avec l'exigence UX < 5 s. À réserver à un usage avancé, une fois l'infrastructure stabilisée.

### Synthèse

| Critère | Sans start/stop | Avec start/stop planifié |
|---------|----------------|--------------------------|
| RAM libérée hors fenêtre | 0 MiB | ~4,66 GiB |
| Complexité | nulle | faible (script + cron) |
| Risque UX | — | nul si store Postgres activé |
| Prérequis bloquant | — | **store Postgres obligatoire** |

**Ce levier n'a de sens qu'après l'activation du store Postgres.** Sans store persistant, Mistral doit rester allumé pour pouvoir répondre à toute demande en dehors des fenêtres planifiées.

---

## 5. Ce que je ferais dans le mois

| Action | Raison |
|--------|--------|
| **Lot 1 (note v1.2)** : single-flight + queue priorisée | Les risques de duplication sont réels, surtout une fois le store Postgres activé et le trafic réel en place |
| **Lot 2** : passage au prompt JSON compact + rôle contrôleur de gestion + ancrage 12 cartes | C'est le gain qualité le plus visible pour l'utilisateur, et le plus accessible techniquement |
| **Monitorer** `swap`, `docker stats`, latence Mistral après chaque changement | On avance à l'aveugle sans baseline de performance post-correction |

---

## 6. Ce que je ne ferais pas maintenant

- **Changer de modèle** : Mistral-7B Q4_K_M est adapté au matériel. Un modèle plus grand aggraverait la pression RAM. Un modèle plus petit dégraderait la qualité sans garantie de gain sur un CPU sous swap.
- **Augmenter la concurrence** : avec la RAM sous pression, augmenter `--parallel` ou `RUNNER_CONCURRENCY` serait contre-productif.
- **Déplacer vers GPU** : aucun GPU disponible, et ce n'est pas le bon moment pour ce changement d'infrastructure.
- **Empiler des règles dans les prompts** : le system prompt est déjà dense (17 règles numérotées). Ajouter des règles avant de nettoyer celles qui sont redondantes est une erreur classique — et elle aggrave la latence.

---

## 7. Verdict net

**Le dispositif Diva/Mistral est correctement architecturé** — la philosophie est bonne, le code Go est propre, la séparation LLM / logique métier est juste.

**Mais il tourne sur un hôte en limite de RAM, avec un swap saturé, un store mémoire éphémère, et sans contrainte CPU sur Mistral.**

Ces trois points — RAM, store, CPU — sont des problèmes d'exploitation, pas d'architecture. Ils sont corrigeables rapidement, sans toucher au code applicatif.

**L'ordre de priorité est donc : infrastructure d'abord, code ensuite.**

Si le store Postgres n'est pas activé et si la RAM n'est pas libérée, les améliorations du Lot 2 (prompts, qualité, < 5 s) seront masquées par l'instabilité de l'hôte. Les écarts de qualité ou de latence observés resteront ambigus — on risque de diagnostiquer des problèmes de LLM qui sont en réalité des problèmes de swap.

> **Corriger l'infrastructure d'abord. Améliorer les prompts ensuite. Mesurer à chaque étape.**

---

## 8. Condition de succès des lots applicatifs

Les lots applicatifs (single-flight, prompt JSON compact, persona contrôleur de gestion, affichage < 5 s) ne doivent être évalués qu'**après stabilisation minimale de l'hôte**.

Cette stabilisation minimale suppose au moins :

* un store persistant activé pour Diva ;
* une pression mémoire redevenue acceptable (swap non saturé) ;
* des limites CPU explicites sur Mistral ;
* une mesure de latence post-correction servant de nouvelle baseline.

Sans cela, les écarts de qualité ou de latence observés resteront ambigus, car ils pourront provenir davantage de la contention système que du comportement applicatif. Les lots applicatifs ne sont pas en cause — ils n'ont simplement pas encore les conditions pour exprimer leur effet.

---

**Version** : 1.2  
**Type** : Avis d'expert (code + infrastructure).  
**Documents liés** : `Note_Diva_Mistral_Optimisation.md` v1.2, `units/diva/docker-compose.yml`, `units/mistral/README.md`, `ZeDocs/web22/RAPPORT_LOAD_TEST_DIVA_MISTRAL_2026-02-17.md`.
