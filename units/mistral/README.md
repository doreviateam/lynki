# Unit Mistral — llama.cpp server (Option B CPU)

**SPEC** : `ZeDocs/web22/RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md`  
**Plan** : `ZeDocs/web22/PLAN_IMPLEMENTATION_MISTRAL_SCRUM_v1.0.md`  
**Rôle** : Moteur d'inférence locale pour DIVA (synthèse, qualification, DLP) — **réseau interne uniquement**, aucun port exposé.

---

## Structure

```
units/mistral/
  docker-compose.yml   # Service llama.cpp server
  models/              # Modèle GGUF (hors git)
    mistral-7b-instruct-v0.2.Q4_K_M.gguf
  README.md
```

- **Réseau** : `dorevia-network` (external)
- **Aucun** `ports:` exposé — accès uniquement depuis conteneurs sur le réseau
- **URL DIVA** : `http://mistral-llamacpp:8000/v1`

---

## Prérequis

- Docker et Docker Compose
- Réseau : `docker network create dorevia-network` (si absent)
- ~5 Go dispo pour le modèle GGUF
- RAM : ~8 Go recommandés (serveur doreviateam : 15 Go total, ctx 2048)

---

## Installation

### 1. Télécharger le modèle GGUF

**Option A** — Script (depuis la racine projet) :

```bash
./units/mistral/scripts/download-model.sh
```

**Option B** — Manuel :

```bash
mkdir -p units/mistral/models
cd units/mistral/models
wget -O mistral-7b-instruct-v0.2.Q4_K_M.gguf \
  "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf"
```

**Option C** — `huggingface-cli` (si token configuré) :

```bash
huggingface-cli download TheBloke/Mistral-7B-Instruct-v0.2-GGUF mistral-7b-instruct-v0.2.Q4_K_M.gguf --local-dir units/mistral/models
```

> **Taille** : ~4,4 Go. Le dossier `units/mistral/models/` est exclu du git (`.gitignore`).

### 2. Lancer le service

```bash
cd units/mistral
docker compose up -d
docker logs -f mistral-llamacpp
```

Attendre le démarrage complet (~30–60 s). Premier run : chargement du modèle en RAM.

---

## Runbook

### Démarrer

```bash
cd units/mistral
docker compose up -d
```

### Arrêter

```bash
cd units/mistral
docker compose down
```

### Vérifier le healthcheck

Depuis un conteneur sur le réseau :

```bash
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s http://mistral-llamacpp:8000/health
```

### Tester le chat (OpenAI-compatible)

```bash
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s http://mistral-llamacpp:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral","messages":[{"role":"user","content":"Dis bonjour en une phrase."}],"temperature":0.2,"max_tokens":64}'
```

> Si l'image llama.cpp n'expose pas `/v1/chat/completions`, tester `/completion` (endpoint natif). Voir [llama.cpp server](https://github.com/ggerganov/llama.cpp/tree/master/examples/server).

### Smoke test latence

```bash
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s -w "\nHTTP=%{http_code} TOTAL=%{time_total}s\n" -o /dev/null \
  -X POST -H "Content-Type: application/json" \
  -d '{"model":"mistral","messages":[{"role":"user","content":"Résume en 10 mots : Dorevia Vault scelle des preuves financières."}],"max_tokens":64,"temperature":0.2}' \
  http://mistral-llamacpp:8000/v1/chat/completions
```

Objectif : établir une baseline de latence (ex. < 15 s sur doreviateam).

**Script dédié** : `./scripts/smoke_test_mistral.sh` (depuis la racine projet).

---

## Dépannage

### Erreur `mlock` / permissions

Si le conteneur ne démarre pas (erreur `mlock` ou permissions) :

- Retirer `--mlock` du `command:` dans `docker-compose.yml`
- Le modèle pourra utiliser le swap — surveiller les performances

### RAM insuffisante

- Vérifier : `free -h`, `docker stats mistral-llamacpp`
- Réduire `--ctx-size` (ex. 1024 au lieu de 2048) dans le compose

### Réseau introuvable

```bash
docker network create dorevia-network
```

### Modèle absent

Vérifier que le fichier existe :

```bash
ls -la units/mistral/models/
# Attendu : mistral-7b-instruct-v0.2.Q4_K_M.gguf (~4,4 Go)
```

---

## Configuration DIVA (intégration future)

Pour que DIVA appelle Mistral :

```env
MISTRAL_BASE_URL=http://mistral-llamacpp:8000/v1
MISTRAL_MODEL=mistral-7b-instruct-v0.2.Q4_K_M.gguf
```

---

## Références

| Document | Rôle |
|----------|------|
| `ZeDocs/web22/INDEX.md` | Index ZeDocs/web22 |
| `ZeDocs/web22/RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Spec Option B |
| `ZeDocs/web22/SPEC_INSTALLATION_MISTRAL.v0.1.md` | Spec globale |
| [TheBloke/Mistral-7B-Instruct-v0.2-GGUF](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF) | Modèle GGUF |
| `ghcr.io/ggml-org/llama.cpp:server` | Image Docker llama.cpp |
