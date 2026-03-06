# Rapport détaillé — Implémentation Mistral On-Prem (Option B)

**Date** : 2026-02-17  
**Version** : 1.0  
**Statut** : Phase 1 terminée — Mistral opérationnel  
**Références** : `PLAN_IMPLEMENTATION_MISTRAL_SCRUM_v1.0.md`, `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md`

---

# 1. Synthèse exécutive

L’**Option B** (llama.cpp + GGUF) pour Mistral on-prem a été implémentée et déployée sur la plateforme Dorevia. Le service est **opérationnel** dans `units/mistral/`, accessible uniquement sur le réseau interne `dorevia-network`, avec une latence baseline d’environ **3,4 s** pour un prompt court (max_tokens=64).

| Critère | Résultat |
|---------|----------|
| **Déploiement** | ✅ Conteneur `mistral-llamacpp` en cours d’exécution |
| **Modèle** | ✅ Mistral-7B Q4_K_M (4,1 Go, TheBloke) |
| **API** | ✅ `/v1/chat/completions` compatible OpenAI |
| **Exposition** | ✅ Aucun port public — réseau interne uniquement |
| **Documentation** | ✅ README, runbook, scripts |

---

# 2. Contexte

## 2.1 Objectif

Déployer un moteur d’inférence Mistral **100 % local** pour servir DIVA (synthèse contextuelle, qualification des avis, génération de DLP) sans aucune connexion sortante vers une API cloud.

## 2.2 Contraintes

- **Serveur doreviateam** : 128 cœurs CPU, 15 Go RAM, **pas de GPU**
- **Architecture** : Option B (llama.cpp + GGUF) recommandée à la place de vLLM CPU
- **Emplacement** : `units/mistral/` — aligné avec les autres units (gateway, odoo, dorevia-linky)

---

# 3. Choix techniques

## 3.1 Stack retenue

| Élément | Valeur |
|---------|--------|
| **Image Docker** | `ghcr.io/ggml-org/llama.cpp:server` |
| **Modèle** | `mistral-7b-instruct-v0.2.Q4_K_M.gguf` (TheBloke, Hugging Face) |
| **Quantification** | Q4_K_M (~4,4 Go) |
| **Réseau** | `dorevia-network` (réseau plateforme) |
| **Contexte** | 2048 tokens |
| **Threads** | 16 |

## 3.2 Paramètres serveur

- `--ctx-size 2048` : RAM limitée (~8,8 Go dispo)
- `--threads 16` : calé pour 128 cœurs (gains négligeables au-delà)
- `--parallel 1` : stabilité CPU, usage DIVA Phase 1
- `--mlock` : évite le swap (à retirer en cas d’erreur permissions)

## 3.3 Correction image

L’image initialement prévue (`ghcr.io/ggerganov/llama.cpp:server`) n’est plus disponible. Remplacement par `ghcr.io/ggml-org/llama.cpp:server`.

---

# 4. Structure implémentée

## 4.1 Arborescence

```
units/mistral/
├── docker-compose.yml       # Service mistral-llamacpp
├── README.md                # Runbook complet
├── models/                  # Modèle GGUF (hors git)
│   └── mistral-7b-instruct-v0.2.Q4_K_M.gguf   (4,1 Go)
└── scripts/
    └── download-model.sh    # Téléchargement automatique du modèle

scripts/
└── smoke_test_mistral.sh    # Smoke test health + latence
```

## 4.2 Fichiers créés ou modifiés

| Fichier | Action |
|---------|--------|
| `units/mistral/docker-compose.yml` | Créé |
| `units/mistral/README.md` | Créé |
| `units/mistral/scripts/download-model.sh` | Créé |
| `scripts/smoke_test_mistral.sh` | Créé |
| `.gitignore` | Ajout `units/mistral/models/` |
| `ZeDocs/web22/RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Mis à jour (image, modèle, réseau) |

---

# 5. Procédure déroulée

## 5.1 Étapes exécutées

1. **Réseau** : vérification `dorevia-network` (préexistant)
2. **Modèle** : exécution `./units/mistral/scripts/download-model.sh` — ~55 s
3. **Image** : `docker pull ghcr.io/ggml-org/llama.cpp:server`
4. **Compose** : correction image (ggerganov → ggml-org)
5. **Démarrage** : `cd units/mistral && docker compose up -d`
6. **Validation** : healthcheck, test chat, smoke test latence

## 5.2 Commandes de validation

```bash
# Healthcheck
docker run --rm --network dorevia-network curlimages/curl:latest \
  curl -s http://mistral-llamacpp:8000/health

# Smoke test
./scripts/smoke_test_mistral.sh
```

---

# 6. Résultats des tests

## 6.1 Healthcheck

- **Endpoint** : `GET /health`
- **Résultat** : HTTP 200 ✅

## 6.2 Test chat

- **Endpoint** : `POST /v1/chat/completions`
- **Payload** : `{"model":"mistral","messages":[{"role":"user","content":"Dis bonjour."}],"max_tokens":64}`
- **Résultat** : JSON avec `choices[0].message.content` ✅

## 6.3 Smoke test latence

| Métrique | Valeur |
|----------|--------|
| **Prompt** | « Résume en 10 mots : Dorevia Vault scelle des preuves financières. » |
| **max_tokens** | 64 |
| **temperature** | 0,2 |
| **Latence mesurée** | **~3,4 s** |
| **HTTP** | 200 |

Objectif : < 15 s — **atteint**.

---

# 7. Configuration pour DIVA

Pour l’intégration future avec DIVA :

```env
MISTRAL_BASE_URL=http://mistral-llamacpp:8000/v1
MISTRAL_MODEL=mistral-7b-instruct-v0.2.Q4_K_M.gguf
```

DIVA pourra utiliser un client OpenAI-like pour appeler Mistral sur le réseau interne.

---

# 8. Sécurité et exposition

| Critère | Statut |
|---------|--------|
| Ports exposés sur Internet | Aucun ✅ |
| Accès réseau | Uniquement `dorevia-network` ✅ |
| Modèle hors git | `units/mistral/models/` dans `.gitignore` ✅ |
| Logs rotatifs | max-size 20m, max-file 5 ✅ |

---

# 9. Points d’attention

## 9.1 RAM et swap

- **RAM totale** : 15 Go (serveur doreviateam)
- **Contexte 2048** : ~6–7 Go pour le modèle
- **Surveillance** : `free -h`, `docker stats mistral-llamacpp` en cas de latence élevée

## 9.2 Healthcheck Docker

Le healthcheck Docker peut afficher `unhealthy` selon la charge ou le délai de réponse. L’endpoint `/health` répond correctement en conditions normales. Si besoin : augmenter `start_period` ou `timeout` dans le compose.

## 9.3 Option `--mlock`

Si le conteneur ne démarre pas (erreur permissions) : retirer `--mlock` du `command:` dans `docker-compose.yml`. Le modèle pourra utiliser le swap — latence potentiellement plus élevée.

---

# 10. Checklist Definition of Done

| Critère | Statut |
|---------|--------|
| `units/mistral/` créé avec docker-compose.yml, README.md | ✅ |
| Modèle GGUF présent (hors git) | ✅ |
| Conteneur démarre et répond à GET /health | ✅ |
| Chat test réussi (OpenAI-compatible) | ✅ |
| Aucun port public exposé | ✅ |
| Smoke test latence exécuté et baseline documentée | ✅ |
| Runbook opérationnel | ✅ |

---

# 11. Livrables et références

## 11.1 Documentation mise à jour

- `ZeDocs/web22/INDEX.md` — Statut Mistral
- `ZeDocs/web22/PLAN_IMPLEMENTATION_MISTRAL_SCRUM_v1.0.md` — DoD cochées
- `ZeDocs/web22/RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` — Image, modèle, réseau
- `ZeDocs/web22/RAPPORT_INTEGRATION_MISTRAL_DIVA_v1.0.md` — Checklist
- `ZeDocs/web22/VISION_TECHNIQUE_DOREVIA_v1.0.md` — Référence units/mistral
- `ZeDocs/web22/SPEC_INSTALLATION_MISTRAL.v0.1.md` — v1.3 Option B implémentée

## 11.2 Références techniques

| Document | Rôle |
|----------|------|
| `units/mistral/README.md` | Runbook unit Mistral |
| `ZeDocs/web22/RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Spec Option B |
| `ZeDocs/web22/PLAN_IMPLEMENTATION_MISTRAL_SCRUM_v1.0.md` | Plan Scrum |
| [TheBloke/Mistral-7B-Instruct-v0.2-GGUF](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF) | Modèle GGUF |
| [ghcr.io/ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) | Image Docker |

---

**Fin du rapport.**
