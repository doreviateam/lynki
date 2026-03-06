# Rapport détaillé — Intégration Mistral pour DIVA
## Installation locale, architecture et déploiement

Version : v1.2  
Date : 2026-02-16 — vLLM / Docker Mistral  
Contexte : Dorevia Platform — Phase DIVA (gouvernance par la preuve)  
Référence : VISION_TECHNIQUE_DOREVIA_v1.0.md  

---

# 1. Synthèse exécutive

**Mistral est installé localement** sur l’infrastructure Dorevia. Aucune utilisation de l’API cloud Mistral — toutes les données restent en interne.

Mistral sert de moteur IA pour le module DIVA : synthèse contextuelle, qualification des avis pour action, génération de DLP structurées. Le déploiement est **100 % on‑premise / local**.

---

# 2. Contexte Dorevia

## 2.1 Rôle de Mistral dans DIVA

Conformément à `DOREVIA_THE_BIG_PICTURE.md` et `VISION_TECHNIQUE_DOREVIA_v1.0.md` :

| Fonction | Description | Entrée Mistral | Sortie Mistral |
|----------|-------------|----------------|----------------|
| **Synthèse** | Résumé du contexte économique à partir des agrégats Vault | Agrégats (trésorerie, cash, taxes, etc.) | Texte structuré lisible |
| **Qualification** | Vérification pertinence, impact, conformité de l’avis | Avis humain + contexte | Validé / Rejeté + motif |
| **Formalisation** | Génération de 5 DLP structurées | Avis validé + snapshot | 5 propositions DLP (énoncé, catégorie, etc.) |

## 2.2 Contraintes architecturales

- **IA interne, non exposée** : Mistral n’est pas exposé en API publique
- **Pas d’accès direct** à la base Vault
- **Pas d’écriture** sur les données scellées
- **Pas de détention** de clés cryptographiques

## 2.3 Flux d’appel

```
Utilisateur (avis)
        │
        ▼
DIVA (service)
        │ 1. Récupère agrégats Vault (GET /ui/aggregations/*)
        │ 2. Construit prompt (contexte + avis)
        ▼
Mistral (installé localement)
        │ 3. Réponse : synthèse / qualification / DLP
        ▼
DIVA → Registre DLP (si validé)
```

---

# 3. Installation locale de Mistral

## 3.1 Principe

Mistral est **installé localement** sur l’infrastructure Dorevia : VM, Docker ou Kubernetes. Les modèles tournent sur le même réseau que Vault, DVIG et Linky. Toutes les données restent en interne — aucune connexion sortante vers l’API cloud Mistral.

## 3.2 Options de déploiement

### 3.2.1 vLLM (recommandé)

Serveur d’inférence haute performance, API compatible OpenAI. Adapté à la production avec GPU.

```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server \
  --model mistralai/Mistral-7B-Instruct-v0.2 \
  --port 8000
```

**Docker** : voir `SPEC_INSTALLATION_MISTRAL.v0.1.md` §8 pour la configuration complète (réseau `dorevia-internal`, `gpus: all`, pas de ports en prod).

Exemple minimal :
```yaml
services:
  mistral-vllm:
    image: vllm/vllm-openai:v0.6.3
    command: --model mistralai/Mistral-7B-Instruct-v0.2 --host 0.0.0.0 --port 8000
    environment:
      - HUGGING_FACE_HUB_TOKEN=${HF_TOKEN}
    volumes:
      - mistral_hf_cache:/root/.cache/huggingface
    networks:
      - dorevia-internal
    gpus: all
```

**API** : `http://mistral-vllm:8000/v1/chat/completions` (réseau interne, compatible OpenAI)

### 3.2.2 Option B — llama.cpp + GGUF (CPU optimisé, sans GPU)
Si le serveur n'a pas de GPU : déploiement via **llama.cpp** + modèle GGUF quantifié (Q4_K_M). Plus performant que vLLM CPU. Voir `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md`. DIVA configurera `MISTRAL_BASE_URL=http://mistral-llamacpp:8000/v1`.

### 3.2.3 Docker Mistral officiel

Images Mistral pour inference. Vérifier la documentation officielle pour les versions.

```yaml
services:
  mistral-inference:
    image: mistralai/mistral-inference  # à confirmer selon doc officielle
    environment:
      - HF_TOKEN=${HUGGINGFACE_TOKEN}
    ports:
      - "8080:8080"
```

### 3.2.3 Hugging Face + Transformers

Déploiement via script Python (FastAPI) avec `transformers` + modèle Mistral sur Hugging Face.

## 3.3 Prérequis matériels

| Modèle | RAM | GPU | Stockage |
|--------|-----|-----|----------|
| Mistral 7B | 16 GB | Optionnel (8 GB VRAM) | ~4 GB |
| Mistral 8x7B (Mixtral) | 48 GB | Recommandé (24 GB VRAM) | ~26 GB |
| Mistral Large | >64 GB | Fortement recommandé | ~50 GB |

## 3.4 Intégration au stack Dorevia

### Placement réseau

```
┌─────────────────────────────────────────────────────────────────┐
│  Réseau interne (ex: Docker compose Dorevia)                      │
│                                                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │  Vault  │  │  DVIG   │  │  Linky  │  │  DIVA + Mistral  │   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘   │
│                                                      │          │
│                                                      │ Appels   │
│                                                      │ locaux   │
│                                                      ▼          │
│                                              ┌─────────────────┐ │
│                                              │ Mistral (vLLM  │ │
│                                              │ ou Docker)      │ │
│                                              └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration DIVA (Mistral local)

```
MISTRAL_BASE_URL=http://mistral-vllm:8000/v1
MISTRAL_MODEL=mistralai/Mistral-7B-Instruct-v0.2
# MISTRAL_API_KEY optionnel (si auth requise côté inference)
```

## 3.5 Avantages de l’installation locale

| Critère | Détail |
|---------|--------|
| **Souveraineté** | Données jamais sortantes |
| **Conformité** | RGPD, sectoriel (finance) facilités |
| **Coût récurrent** | Pas de facturation à l’usage |
| **Latence** | Contrôlable (réseau local) |
| **Audit** | Traçabilité complète des appels |

## 3.6 Points d’attention

| Critère | Détail |
|---------|--------|
| **Coût initial** | GPU, stockage, maintenance |
| **Maintenance** | Mises à jour modèles, OS, conteneurs |
| **Scalabilité** | À dimensionner manuellement |
| **Disponibilité** | Dépend de l’infra Dorevia |

---

# 5. Intégration DIVA → Mistral local

## 5.1 Configuration

DIVA appelle Mistral via une URL **interne** (réseau local) :

```
MISTRAL_BASE_URL=http://mistral-vllm:8000/v1
MISTRAL_MODEL=mistralai/Mistral-7B-Instruct-v0.2
# MISTRAL_API_KEY si auth requise côté serveur inference
```

## 5.2 Client LLM (appel local)

```python
# diva/llm/client.py
import os
import httpx

def complete(prompt: str, system: str | None = None) -> str:
    base_url = os.getenv("MISTRAL_BASE_URL", "http://localhost:8000/v1")
    model = os.getenv("MISTRAL_MODEL", "mistralai/Mistral-7B-Instruct-v0.2")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    resp = httpx.post(
        f"{base_url.rstrip('/')}/chat/completions",
        json={"model": model, "messages": messages},
        timeout=60.0
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]
```

L’API vLLM et Mistral inference est compatible OpenAI — pas de SDK Mistral cloud requis.

---

# 6. Sécurité et conformité

## 6.1 Données transmises à Mistral

Comme Mistral est **installé localement**, les données ne sortent jamais du réseau Dorevia :

| Donnée | Sensibilité | Statut local |
|--------|-------------|--------------|
| Agrégats Vault (montants, ratios) | Moyenne | Reste sur l’infra interne |
| Avis humain (texte libre) | Variable | Reste sur l’infra interne |
| Réponse DLP | Moyenne | Reste sur l’infra interne |

## 6.2 Recommandations

- **Réseau** : Mistral dans le même réseau privé que Vault/DIVA — pas d’exposition internet.
- **Logs** : Éviter de logger les prompts complets contenant des données sensibles.

## 6.3 Authentification (Mistral local)

En production :

- Déployer Mistral dans le **réseau interne** (aucune exposition externe)
- Ou placer derrière un reverse proxy (Caddy) avec auth + token pour DIVA

---

# 7. Plan de déploiement (Mistral local)

## Phase 1 — Installation (1–2 semaines)

1. **Déployer Mistral localement**
   - Option vLLM : serveur inference (Docker ou natif) — recommandé
   - Option Docker Mistral officiel ou Hugging Face / Transformers
2. **Intégrer au stack**
   - Ajouter le service Mistral au `docker-compose` (ou équivalent)
   - Configurer `MISTRAL_BASE_URL` pointant vers le service local
3. **Validation** : DIVA appelle Mistral en local ; pas de sortie internet

## Phase 2 — Intégration DIVA (2–4 semaines)

1. Implémenter couche LLM (appel HTTP local)
2. Premier flux : synthèse contexte → qualification avis → génération DLP
3. Tests : Vault → DIVA → Mistral local → registre DLP

## Phase 3 — Production

1. Dimensionner selon charge (GPU si nécessaire)
2. Monitoring : disponibilité, latence, erreurs
3. Procédures de mise à jour des modèles

---

# 8. Checklist d’intégration (Mistral local)

| Étape | Statut |
|-------|--------|
| Installation Mistral (Option B : llama.cpp + GGUF) | ✅ |
| Téléchargement modèle Mistral (units/mistral/models/) | ✅ |
| Variables MISTRAL_BASE_URL, MISTRAL_MODEL | Documenté (README units/mistral) |
| Client LLM (appel HTTP local) | Mistral exposé, DIVA l’appellera |
| Spec DIVA API v1.1 | ✅ `SPEC_DIVA_API_v1.0.md` (units/diva/, POST /diva/explain) |
| Intégration DIVA (synthèse Flash) | ✅ Implémenté (2026-02-17) — `RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md` |
| Intégration DIVA (qualification) | Hors scope v1 |
| Intégration DIVA (génération DLP) | Hors scope v1 |
| Tests : Linky → DIVA → Mistral local | ✅ `scripts/smoke_test_diva_e2e.sh` |
| Pas d’exposition externe (réseau interne) | ✅ |

---

# 9. Références

| Document | Rôle |
|----------|------|
| `INDEX.md` | Index ZeDocs/web22 |
| `SPEC_DIVA_API_v1.0.md` | Spec API DIVA (v1.1, Flash) |
| `ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` | Prompts Mistral (v1.1) |
| `RAPPORT_IMPLEMENTATION_DIVA_2026-02-17.md` | Rapport implémentation DIVA |
| `VISION_TECHNIQUE_DOREVIA_v1.0.md` | Architecture, place de Mistral |
| `DOREVIA_THE_BIG_PICTURE.md` | Rôle de DIVA |
| `RECOMMANDATIONS_VISION_TECHNIQUE_v1.0.md` | Isolation IA, registre DLP |
| [Mistral AI Documentation](https://docs.mistral.ai/) | API, modèles |
| [vLLM](https://docs.vllm.ai/) | Serveur inference local Mistral |
| `SPEC_INSTALLATION_MISTRAL.v0.1.md` | Spec d’installation (compose, runbook, DoD) |
| `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Option B CPU (llama.cpp + GGUF) si pas de GPU |

---

**Fin du rapport.**
