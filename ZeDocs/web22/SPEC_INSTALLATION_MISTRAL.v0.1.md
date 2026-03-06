# SPEC — Installation Mistral (On-Prem) pour DIVA
## Serveur `doreviateam` — vLLM / Docker — Réseau interne uniquement

Version : v1.3  
Date : 2026-02-17 — Option B implémentée (`units/mistral/`, ggml-org/llama.cpp, dorevia-network)  
Portée : Installation, architecture, sécurité, exploitation (runbook)  
Contexte : Dorevia Platform — Phase DIVA (IA interne, non exposée)  
Références : `VISION_TECHNIQUE_DOREVIA_v1.0.md`, `DOREVIA_THE_BIG_PICTURE.md`

---

## 1. Objectif

Déployer un moteur d’inférence **Mistral on‑prem** sur le serveur `doreviateam`, afin de :

- Servir DIVA en interne (synthèse, qualification, formalisation DLP)
- Garantir **zéro sortie** de données vers une API cloud
- Exposer une API **compatible OpenAI** (intégration simple côté DIVA)
- Ne **pas** exposer Mistral sur Internet (réseau privé uniquement)

---

## 2. Principes non négociables

1) **IA interne, non exposée**  
- Aucun port public Internet pour Mistral.
- Accès uniquement depuis les services Dorevia (DIVA / Linky API routes) sur réseau privé.

2) **Pas d’accès direct DB Vault**  
- Mistral/DIVA n’accèdent jamais au PostgreSQL du Vault.
- DIVA consomme uniquement les APIs Vault (lecture seule).

3) **Pas d’écriture sur données scellées**  
- Mistral n’écrit jamais dans Vault.
- DIVA écrit uniquement dans le futur **registre DLP**.

4) **Pas de clés cryptographiques**  
- Mistral ne détient aucune clé de signature / scellement.

---

## 3. Périmètre

### Inclus
- Déploiement Mistral via **Docker**
- Option **GPU** (NVIDIA) via vLLM (recommandée)
- Option **CPU** (mode dégradé) si aucun GPU
- Réseau interne Docker
- Cache persistant modèles (HuggingFace)
- Healthcheck + observabilité minimale
- Contrôles de sécurité + logs/rotation

### Exclu
- Implémentation DIVA (spec séparée)
- Registre DLP (spec séparée)
- Snapshot immuable (spec séparée)
- Auth multi‑utilisateur Linky (v1)

---

## 4. Hypothèses

- `doreviateam` exécute Docker + docker compose.
- Les services Dorevia partagent un réseau docker privé `dorevia-internal`.
- Un token Hugging Face est disponible si modèle téléchargé via hub.
- Si GPU : NVIDIA driver + runtime docker GPU disponibles.

---

## 5. Choix d’architecture

### 5.1 Option principale (P0) — vLLM + GPU (recommandé)
- Image : `vllm/vllm-openai:v0.6.3` (version figée)
- Modèle : `mistralai/Mistral-7B-Instruct-v0.2`
- API : `/v1/chat/completions` compatible OpenAI

### 5.2 Option fallback (P1) — CPU only (dégradé)
- Autorisé pour POC / faible charge
- Risque : latence élevée / débit faible avec vLLM CPU
- Même modèle (possibilité quantisation ultérieure)
- **Alternative recommandée (sans GPU)** : `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` (llama.cpp + GGUF Q4_K_M, plus performant)

---

## 6. Réseau & exposition

### 6.1 Réseau interne
- Service attaché au réseau docker : `dorevia-internal`
- **Aucun** `ports:` exposé en production

### 6.2 Accès
- DIVA appelle : `http://mistral-vllm:8000/v1`
- Tests via conteneur sur le même réseau (cf §10)

---

## 7. Configuration (variables d’environnement)

### 7.1 Variables obligatoires
- `HF_TOKEN` : token HF (utilisé comme `HUGGING_FACE_HUB_TOKEN`)
- `MISTRAL_MODEL` : ex `mistralai/Mistral-7B-Instruct-v0.2`

### 7.2 Variables recommandées (DIVA)
- `MISTRAL_BASE_URL=http://mistral-vllm:8000/v1`
- `MISTRAL_MODEL=mistralai/Mistral-7B-Instruct-v0.2`

### 7.3 Exemple `.env`
```env
HF_TOKEN=***REDACTED***
MISTRAL_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

**Sécurité :** `.env` doit être dans `.gitignore` (ne jamais versionner le token).

---

## 8. Déploiement Docker Compose (référence)

> Le réseau `dorevia-internal` doit exister avant le déploiement (cf §9.0).  
> **Important GPU :** la section `deploy:` est souvent ignorée hors Swarm. Cette v1.2 fournit une configuration **compatible docker compose**.

### 8.1 Compose — GPU (P0) — recommandé hors Swarm

```yaml
services:
  mistral-vllm:
    image: vllm/vllm-openai:v0.6.3
    container_name: mistral-vllm
    command: >
      --model ${MISTRAL_MODEL}
      --host 0.0.0.0
      --port 8000
    environment:
      - HUGGING_FACE_HUB_TOKEN=${HF_TOKEN}
    volumes:
      - mistral_hf_cache:/root/.cache/huggingface
    networks:
      - dorevia-internal
    gpus: all
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "python -c 'import urllib.request; urllib.request.urlopen(\"http://localhost:8000/v1/models\", timeout=2).read()' || exit 1"]
      interval: 20s
      timeout: 5s
      retries: 10
    logging:
      driver: json-file
      options:
        max-size: "20m"
        max-file: "5"

volumes:
  mistral_hf_cache:

networks:
  dorevia-internal:
    external: true
```

### 8.2 Variante GPU — si `gpus:` non supporté

Si votre `docker compose` ne supporte pas `gpus: all`, utiliser :

```yaml
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=compute,utility
```

Puis valider impérativement avec `docker exec mistral-vllm nvidia-smi` (cf §10.4).

### 8.3 Compose — CPU (P1)

```yaml
services:
  mistral-vllm:
    image: vllm/vllm-openai:v0.6.3
    container_name: mistral-vllm
    command: >
      --model ${MISTRAL_MODEL}
      --host 0.0.0.0
      --port 8000
      --dtype float32
    environment:
      - HUGGING_FACE_HUB_TOKEN=${HF_TOKEN}
    volumes:
      - mistral_hf_cache:/root/.cache/huggingface
    networks:
      - dorevia-internal
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "python -c 'import urllib.request; urllib.request.urlopen(\"http://localhost:8000/v1/models\", timeout=2).read()' || exit 1"]
      interval: 30s
      timeout: 8s
      retries: 10
    logging:
      driver: json-file
      options:
        max-size: "20m"
        max-file: "5"

volumes:
  mistral_hf_cache:

networks:
  dorevia-internal:
    external: true
```

---

## 9. Procédure d’installation (runbook)

### 9.0 Création du réseau (première installation)
```bash
docker network create dorevia-internal
```
À exécuter une seule fois. Si le réseau existe déjà, la commande peut échouer sans impact.

### 9.1 Pré-check (serveur)
1) Docker présent :
```bash
docker --version
docker compose version
```

2) Ressources :
```bash
free -h
df -h
```

3) GPU (si applicable) :
```bash
nvidia-smi
docker run --rm --gpus all nvidia/cuda:12.2.0-base-ubuntu22.04 nvidia-smi
```

### 9.2 Déploiement
1) Créer/éditer `.env` avec `HF_TOKEN` et `MISTRAL_MODEL`  
2) Ajouter le service `mistral-vllm` au `docker-compose.yml` du stack  
3) Lancer :
```bash
docker compose up -d mistral-vllm
docker logs -f mistral-vllm
```

> Premier run : téléchargement du modèle (quelques Go), prévoir stockage et temps.

---

## 10. Tests de validation

### 10.1 Tests réseau (sans port publié)
1) Lister les modèles (depuis un conteneur du même réseau) :
```bash
docker run --rm --network dorevia-internal curlimages/curl:latest \
  curl -s http://mistral-vllm:8000/v1/models
```

2) Test chat minimal :
```bash
docker run --rm --network dorevia-internal curlimages/curl:latest \
  curl -s http://mistral-vllm:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"mistralai/Mistral-7B-Instruct-v0.2","messages":[{"role":"user","content":"Dis bonjour en une phrase."}]}'
```

Résultat attendu : JSON contenant `choices[0].message.content`.

### 10.2 Debug temporaire (optionnel)
Uniquement en debug, publier en loopback :
```yaml
ports:
  - "127.0.0.1:8000:8000"
```
Puis :
```bash
curl http://127.0.0.1:8000/v1/models
```
À retirer immédiatement ensuite.

### 10.3 Perf smoke test (latence)
```bash
docker run --rm --network dorevia-internal curlimages/curl:latest \
  curl -s -w "\nHTTP=%{http_code} TOTAL=%{time_total}s\n" -o /dev/null \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"mistralai/Mistral-7B-Instruct-v0.2","messages":[{"role":"user","content":"Résume en 10 mots : Dorevia Vault scelle des preuves financières."}],"max_tokens":64,"temperature":0.2}' \
  http://mistral-vllm:8000/v1/chat/completions
```

### 10.4 Validation GPU effective (P0)
Depuis le host :
```bash
docker exec -it mistral-vllm nvidia-smi
```

Attendu : affichage GPU NVIDIA. Si échec, le conteneur tourne probablement en CPU.

---

## 11. Sécurité

### 11.1 Réseau
- Aucun `ports:` exposé en production.
- Service accessible seulement via `dorevia-internal`.

### 11.2 Journalisation
- Ne pas logger les prompts complets (surtout avis humains).
- Conserver logs techniques : latence, codes, erreurs.
- Activer rotation logs Docker (cf `logging` dans compose).

### 11.3 Reverse proxy (optionnel)
Si nécessaire (rare) :
- Caddy interne uniquement
- Auth token + allowlist IP
- Jamais d’exposition publique sans justification

---

## 12. Observabilité minimale

- Healthcheck Docker OK
- Restart count surveillé (`docker ps`, `docker inspect`)
- Logs : erreurs 5xx, OOM, timeouts
- Latence (smoke test régulier)

---

## 13. Contrat d’intégration DIVA

### 13.1 Endpoints
- `POST {MISTRAL_BASE_URL}/chat/completions`
- `GET  {MISTRAL_BASE_URL}/models`

### 13.2 Paramètres recommandés
- `temperature` : 0.1–0.3 (stabilité)
- `max_tokens` : borné
- `timeout` : 30–60s
- **Jamais** de secrets dans les prompts

### 13.3 Interdits
- Aucun accès DB Vault
- Aucune écriture Vault
- Aucune clé crypto côté IA

---

## 14. Critères d’acceptation (DoD)

- [ ] Mistral tourne sur `doreviateam` via Docker
- [ ] API accessible uniquement en interne (réseau docker)
- [ ] `GET /v1/models` répond
- [ ] `POST /v1/chat/completions` répond
- [ ] Cache persistant OK (pas de re‑download à chaque restart)
- [ ] Healthcheck OK
- [ ] Aucun port public exposé
- [ ] Logs rotatifs activés
- [ ] (GPU) `docker exec mistral-vllm nvidia-smi` OK

---

## 15. Risques connus

- CPU-only : latence élevée / débit faible (POC uniquement)
- Téléchargement modèle : stockage + token nécessaires
- GPU : dépendances NVIDIA runtime à maintenir
- GPU non pris en compte si compose ignore la config → validation obligatoire (cf §10.4)

---

## 16. Références

| Document | Rôle |
|----------|------|
| `INDEX.md` | Index ZeDocs/web22 |
| `VISION_TECHNIQUE_DOREVIA_v1.0.md` | Architecture |
| `DOREVIA_THE_BIG_PICTURE.md` | Rôle DIVA |
| `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Option B CPU optimisé (llama.cpp + GGUF) — **recommandé si pas de GPU** |
| `RAPPORT_INTEGRATION_MISTRAL_DIVA_v1.0.md` | Rapport détaillé intégration |

---

Fin de SPEC.
