# RECO — Mistral On‑Prem CPU Optimisé (Option B)
## llama.cpp + modèle GGUF quantisé + API interne pour DIVA

Version : v1.1  
Date : 2026-02-17 — Paramètres calibrés serveur doreviateam (128 cœurs, 15 Go RAM)  
Portée : Recommandations d'architecture + runbook (CPU only)  
Contexte : Serveur `doreviateam` **sans GPU** (pas de périphérique NVIDIA détecté via `lspci`)  
Objectif : Déployer un LLM local performant pour DIVA sans dépendance cloud  

**Hors scope actuel :** Chat long, multi-utilisateur simultané, gros contexte — pas maintenant.

Référence : `SPEC_INSTALLATION_MISTRAL.v0.1.md` (option P1 vLLM CPU) — cette Option B est une alternative plus performante.

---

## 0. Profil serveur `doreviateam` (mesuré)

| Paramètre | Valeur | Impact |
|-----------|--------|--------|
| GPU | Aucun | Option B obligatoire |
| CPU | 128 cœurs | `--threads 16` à 32 (pas 128) |
| RAM | 15 Go total, ~8,8 Go dispo | Contexte 2048 recommandé |
| Swap | 1,7 Go / 2 Go utilisés | Surveiller latence si swap sollicité |

Ces paramètres influencent la configuration §5.

---

## 1. Décision d'architecture

### 1.1 Constat
Le serveur `doreviateam` ne dispose pas de GPU NVIDIA (commande `lspci | grep -i nvidia` vide).  
Un déploiement vLLM en CPU est possible mais souvent **trop lent** et **moins efficient** pour une charge interactive.

### 1.2 Choix recommandé (Option B)
Déployer Mistral en **CPU optimisé** via :
- **llama.cpp server** (inférence CPU performante)
- Modèle **GGUF quantisé** (réduction RAM + accélération)
- Exposition **interne uniquement** (réseau docker `dorevia-network`)
- API **OpenAI-compatible** si disponible (`/v1/chat/completions`), sinon mapping côté DIVA

Résultat attendu :
- Latence plus faible qu'un vLLM CPU
- Débit plus stable
- Empreinte RAM maîtrisée
- Installation simple (Docker)

---

## 2. Modèle : recommandations de quantification

### 2.1 Cible modèle
- Base : `Mistral-7B-Instruct-v0.2`
- Format : **GGUF**
- Quantization : **Q4_K_M** (recommandé)

### 2.2 Pourquoi Q4_K_M
- Bon compromis qualité / vitesse / RAM
- Suffisant pour :
  - synthèse contextuelle (DIVA)
  - qualification d'avis
  - formalisation DLP

### 2.3 Variantes
- `Q5_K_M` : meilleure qualité, +RAM, +latence
- `Q3_K_*` : plus rapide, qualité en baisse (déconseillé pour DLP)

---

## 3. Architecture réseau (rappel non négociable)

- Service LLM **non exposé** sur Internet
- Pas de `ports:` publics en production
- Accès uniquement via réseau docker interne : `dorevia-network`
- DIVA appelle l'IA par DNS docker : `http://mistral-llamacpp:8000/...`

---

## 4. Déploiement recommandé (Docker Compose)

### 4.1 Pré-requis
- Docker + docker compose installés
- Réseau `dorevia-network` existant (plateforme) :
```bash
docker network create dorevia-network
```

### 4.2 Arborescence recommandée
```
units/mistral/                    ← /opt/dorevia-plateform/units/mistral/
  docker-compose.yml
  models/
    mistral-7b-instruct-v0.2.Q4_K_M.gguf   # TheBloke, ~4,4 Go
```

Aligné avec les autres units (`units/gateway`, `units/odoo`, `units/dorevia-linky`, etc.).

### 4.3 Récupération du modèle GGUF
Télécharger un fichier GGUF quantisé (exemple attendu) :
- `mistral-7b-instruct-v0.2.Q4_K_M.gguf` (TheBloke)

Commande (depuis la racine projet) :
```bash
./units/mistral/scripts/download-model.sh
# ou : wget -O units/mistral/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf \
#   "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
```

> Important : ajouter `units/mistral/models/` au `.gitignore` (ne pas versionner les binaires GGUF).  
> Stockage local + sauvegarde séparée si nécessaire.

---

## 5. docker-compose.yml (CPU optimisé)

### 5.1 Configuration "safe" (réseau interne + logs rotatifs + healthcheck)

```yaml
services:
  mistral-llamacpp:
    image: ghcr.io/ggml-org/llama.cpp:server
    container_name: mistral-llamacpp
    command: >
      -m /models/mistral-7b-instruct-v0.2.Q4_K_M.gguf
      --host 0.0.0.0
      --port 8000
      --ctx-size 2048
      --threads 16
      --batch-size 512
      --parallel 1
      --mlock
    volumes:
      - ./models:/models:ro
    networks:
      - dorevia-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8000/health > /dev/null || exit 1"]
      interval: 20s
      timeout: 5s
      retries: 10
      start_period: 30s
    logging:
      driver: json-file
      options:
        max-size: "20m"
        max-file: "5"

networks:
  dorevia-network:
    external: true
```

### 5.2 Ajustements (serveur doreviateam)
- `--threads 16` : calibré pour 128 cœurs (au-delà de 32, gains négligeables)
- `--ctx-size 2048` : RAM limitée (~8,8 Go dispo) — 4096 risquerait le swap
- `--parallel 1` : stabilité CPU, usage DIVA Phase 1
- `--mlock` : évite le swap (retirer si le conteneur ne démarre pas : erreur permissions)

---

## 6. Runbook d'installation

### 6.1 Lancer le service
Depuis la racine projet (`/opt/dorevia-plateform`) :
```bash
cd units/mistral
docker compose up -d
docker logs -f mistral-llamacpp
```

### 6.2 Vérifier le health
Sans exposer de port :
```bash
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s http://mistral-llamacpp:8000/health
```

### 6.3 Tester chat (OpenAI-compatible si disponible)
```bash
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s http://mistral-llamacpp:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral","messages":[{"role":"user","content":"Dis bonjour en une phrase."}],"temperature":0.2,"max_tokens":64}'
```

> Si `/v1/chat/completions` n'est pas exposé par l'image utilisée, utiliser l'endpoint natif (cf §7).

---

## 7. Contrat API et stratégie de fallback

### 7.1 Contrat cible (OpenAI-compatible)
- `POST /v1/chat/completions`

DIVA peut utiliser le client OpenAI-like existant.

### 7.2 Fallback (endpoint natif llama.cpp)
Selon image/tag, llama.cpp expose souvent :
- `POST /completion` (ou `/v1/completions`)

Stratégie :
- DIVA détecte à l'initialisation si `/v1/models` ou `/v1/chat/completions` répond
- Sinon, DIVA bascule vers un adaptateur "llama.cpp completion" (mapping simple)

---

## 8. Paramètres d'exploitation (recommandés)

### 8.1 Bornes DIVA (pour éviter blocage UI)
- timeout : 30–60s max
- max_tokens : borné (ex 256–512)
- temperature : 0.1–0.3 (stabilité)

### 8.2 Politique logs
- Ne pas logger prompts complets (avis humain)
- Conserver logs techniques (latence, erreurs)

### 8.3 Rotation logs docker
Déjà incluse dans compose (max-size / max-file).

---

## 9. Perf smoke test (latence)

```bash
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s -w "\nHTTP=%{http_code} TOTAL=%{time_total}s\n" -o /dev/null \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"mistral","messages":[{"role":"user","content":"Résume en 10 mots : Dorevia Vault scelle des preuves financières."}],"max_tokens":64,"temperature":0.2}' \
  http://mistral-llamacpp:8000/v1/chat/completions
```

Objectif : établir une baseline de latence pour DIVA (phase 1).

---

## 10. Checklist de validation

- [x] Le modèle GGUF est présent sur disque (`units/mistral/models/mistral-7b-instruct-v0.2.Q4_K_M.gguf`)
- [x] Le conteneur `mistral-llamacpp` démarre sans erreur
- [x] `GET /health` répond
- [x] Chat test répond (OpenAI-compatible)
- [x] Aucun port public exposé (pas de `ports:`)
- [x] Logs rotatifs activés
- [x] Latence mesurée : ~3,4 s (baseline DIVA)
- [x] RAM/swap surveillés pendant smoke test

---

## 11. Risques & limites

- **RAM 15 Go** : Mistral 7B Q4_K_M + ctx 2048 ≈ 6–7 Go — marge faible si autres services actifs
- **Swap** : si le modèle utilise le swap, latence forte — surveiller `free -h` et `vmstat 1` pendant les tests
- CPU-only : montée en charge limitée (multi‑tenant simultané = hors scope)
- Qualité dépend du niveau de quantification
- Choix du repo GGUF : vérifier licence, intégrité, provenance
- `--mlock` peut nécessiter permissions (sinon le retirer)

---

## 12. Recommandation finale (P0)

Pour Dorevia Phase 1 (résumé périodique + DLP ponctuelles, **pas** chat long / multi-user), ce déploiement est **suffisant** et cohérent :

- souverain
- interne
- maîtrisé
- performant sur CPU

Évolution ultérieure possible :
- ajout d'un serveur GPU dédié si usage "chat" intensif
- montée en gamme modèle (Mixtral) si ressources augmentent

---

## 13. Cohérence avec les autres documents

| Document | Relation |
|----------|----------|
| `INDEX.md` | Index ZeDocs/web22 |
| `SPEC_DIVA_API_v1.0.md` | Consommateur Mistral (service DIVA) |
| `PLAN_IMPLEMENTATION_MISTRAL_SCRUM_v1.0.md` | Plan d'implémentation Scrum (2–3 sprints) |
| `SPEC_INSTALLATION_MISTRAL.v0.1.md` | Option B (CPU) alternative à §8.3 vLLM CPU — **recommandé si pas de GPU** |
| `VISION_TECHNIQUE_DOREVIA_v1.0.md` | Même principe : Mistral local, non exposé, DIVA consomme par HTTP interne |
| `RAPPORT_INTEGRATION_MISTRAL_DIVA_v1.0.md` | Rapport intégration (Option B documentée §3.2.2) |
| Configuration DIVA | `MISTRAL_BASE_URL=http://mistral-llamacpp:8000/v1` (remplacer `mistral-vllm` par `mistral-llamacpp`) |

---

Fin du document.
