# Plan d'implémentation SCRUM — Mistral On-Prem (Option B)

**Version** : 1.1  
**Date** : 2026-02-17  
**Base** : `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md`, `SPEC_INSTALLATION_MISTRAL.v0.1.md`  
**Durée estimée** : 2–3 sprints (2–3 semaines)  
**Contexte** : Serveur `doreviateam` sans GPU — Option B (llama.cpp + GGUF Q4_K_M)  
**Équipe** : Ops / Plateforme  

**Statut** : ✅ **Phase 1 implémentée** (2026-02-17) — Mistral up, smoke test OK (~3,4 s latence)

---

## 1. Vue d'ensemble

### 1.1 Objectif

Déployer **Mistral on-prem** dans `units/mistral/` pour servir DIVA (synthèse, qualification, DLP) en **CPU optimisé** (llama.cpp + GGUF). Service interne uniquement, aucun port exposé.

### 1.2 Périmètre

| Inclus | Exclu |
|--------|-------|
| Unit `units/mistral/` (compose, README) | Implémentation DIVA |
| Modèle GGUF Mistral-7B Q4_K_M | Registre DLP |
| Réseau interne (`dorevia-network`) | Snapshot immuable |
| Healthcheck + logs rotatifs | Exposition Internet |
| Smoke test latence | Auth multi-utilisateur |

### 1.3 Definition of Done (DoD) globale

La Phase 1 Mistral est terminée si :

- [x] `units/mistral/` créé avec `docker-compose.yml`, `README.md`
- [x] Modèle GGUF présent dans `units/mistral/models/` (hors git)
- [x] Conteneur `mistral-llamacpp` démarre et répond à `GET /health`
- [x] Chat test (OpenAI-compatible ou fallback) réussi depuis le réseau interne
- [x] Aucun port public exposé
- [x] Smoke test latence exécuté et baseline documentée (~3,4 s)
- [x] Runbook opérationnel documenté

---

## 2. Structure des sprints

| Sprint | Durée | Objectif principal | Story Points |
|--------|-------|--------------------|--------------|
| **Sprint 1** | 3–5 jours | Structure unit + compose + modèle + premier run | 13 SP |
| **Sprint 2** | 2–3 jours | Validation complète + smoke test + runbook + intégration CLI (optionnel) | 8 SP |

**Total estimé** : 21 SP — 2–3 semaines

---

## 3. Sprint 1 : Structure, modèle et premier run (3–5 jours)

**Objectif** : Créer `units/mistral/`, télécharger le modèle GGUF, configurer le compose, lancer le service et valider le healthcheck.

### US-1.1 : Création de l'unit mistral — structure et compose

**En tant que** développeur plateforme  
**Je veux** une unit `units/mistral/` avec docker-compose (llama.cpp server), alignée sur les autres units  
**Afin de** déployer Mistral en CPU optimisé sur le réseau interne.

**Points** : 5

**Critères d'acceptation** :

- [x] Répertoire `units/mistral/` créé avec `docker-compose.yml`
- [x] Image : `ghcr.io/ggml-org/llama.cpp:server` (tag fixé)
- [x] Service `mistral-llamacpp` : réseau `dorevia-network`, aucun `ports:` exposé
- [x] Volumes : `./models:/models:ro`
- [x] Commandes : `-m /models/mistral-7b-instruct-v0.2.Q4_K_M.gguf`, `--ctx-size 2048`, `--threads 16`, `--mlock`
- [x] Healthcheck : `GET /health` (intervalle 20s, retries 10)
- [x] Logs rotatifs : max-size 20m, max-file 5

**Tâches techniques** :

- [x] Créer `units/mistral/docker-compose.yml` selon RECO §5
- [x] Réseau `dorevia-network` (aligné plateforme)
- [x] Tester `docker compose config` sans erreur

**Livrables** : `units/mistral/docker-compose.yml` validé

---

### US-1.2 : Téléchargement du modèle GGUF

**En tant que** opérateur  
**Je veux** avoir le modèle Mistral-7B Q4_K_M au format GGUF sur disque  
**Afin de** lancer le serveur llama.cpp sans dépendance cloud.

**Points** : 3

**Critères d'acceptation** :

- [x] Dossier `units/mistral/models/` créé
- [x] Fichier `mistral-7b-instruct-v0.2.Q4_K_M.gguf` présent (source TheBloke, ~4,4 Go)
- [x] `.gitignore` exclut `units/mistral/models/`
- [x] Procédure de téléchargement documentée dans README + script `scripts/download-model.sh`

**Tâches techniques** :

- [ ] `mkdir -p units/mistral/models`
- [ ] Documenter l’URL du GGUF (ex. Hugging Face `TheBloke/Mistral-7B-Instruct-v0.2-GGUF`)
- [ ] Commande `wget` ou `curl` pour téléchargement (avec checksum si disponible)
- [ ] Tester intégrité du fichier (taille attendue ~4,2 Go pour Q4_K_M)

**Livrables** : Modèle sur disque ; procédure README

---

### US-1.3 : Premier run et validation healthcheck

**En tant que** opérateur  
**Je veux** lancer le service Mistral et vérifier qu’il répond au healthcheck  
**Afin de** valider le déploiement de base.

**Points** : 3

**Critères d'acceptation** :

- [x] `cd units/mistral && docker compose up -d` démarre sans erreur
- [x] Conteneur `mistral-llamacpp` en état `running`
- [x] `GET /health` répond (depuis conteneur sur `dorevia-network`)
- [x] Logs ne montrent pas d’erreur OOM ou permission (--mlock)
- [x] Procédure alternative documentée si échec `--mlock` (retrait du flag)

**Tâches techniques** :

- [ ] Exécuter depuis racine projet : `cd units/mistral && docker compose up -d`
- [ ] Vérifier health : `docker run --rm --network dorevia-internal curlimages/curl -s http://mistral-llamacpp:8000/health`
- [ ] Surveiller RAM/swap pendant démarrage : `free -h`, `docker stats mistral-llamacpp`

**Livrables** : Service démarré ; healthcheck OK

---

### US-1.4 : Test chat (OpenAI-compatible ou fallback)

**En tant que** développeur  
**Je veux** vérifier que l’API chat répond (OpenAI-compatible ou endpoint natif llama.cpp)  
**Afin de** valider le contrat attendu par DIVA.

**Points** : 2

**Critères d'acceptation** :

- [x] Test `POST /v1/chat/completions` avec payload minimal retourne une réponse
- [x] API OpenAI-compatible exposée par l'image ggml-org
- [x] Réponse contient du texte généré
- [x] Contrat documenté dans README

**Tâches techniques** :

- [ ] Tester : `curl -s -X POST ... http://mistral-llamacpp:8000/v1/chat/completions -d '{"model":"mistral","messages":[{"role":"user","content":"Dis bonjour."}],"max_tokens":64}'`
- [ ] Si 404 : tester `/completion` ou `/v1/completions` (selon image llama.cpp)
- [ ] Documenter le contrat réel dans README

**Livrables** : Test chat OK ; contrat API documenté

---

**Sprint 1 — Definition of Done** :

- [x] `units/mistral/` opérationnel (compose + modèle)
- [x] Service démarre et healthcheck OK
- [x] Test chat réussi (API OpenAI-compatible)
- [x] Aucune régression sur les autres units

---

## 4. Sprint 2 : Validation, smoke test et runbook (2–3 jours)

**Objectif** : Valider tous les critères DoD, mesurer la latence, rédiger le runbook et, optionnellement, intégrer à `dorevia.sh`.

### US-2.1 : Smoke test latence et baseline

**En tant que** opérateur  
**Je veux** un smoke test de latence documenté et exécuté  
**Afin de** établir une baseline pour DIVA et détecter les régressions.

**Points** : 2

**Critères d'acceptation** :

- [x] Commande smoke test documentée (curl + mesure `time_total`)
- [x] Script `scripts/smoke_test_mistral.sh` créé et exécutable
- [x] Latence mesurée : ~3,4 s (prompt court, max_tokens=64)
- [x] Baseline documentée

**Tâches techniques** :

- [ ] Exécuter : `curl -s -w "\nHTTP=%{http_code} TOTAL=%{time_total}s\n" -o /dev/null -X POST ... http://mistral-llamacpp:8000/v1/chat/completions -d '{"model":"mistral","messages":[...],"max_tokens":64,"temperature":0.2}'`
- [ ] Documenter résultat dans README ou rapport
- [ ] Optionnel : script `scripts/smoke_test_mistral.sh` réutilisable

**Livrables** : Baseline latence documentée ; script optionnel

---

### US-2.2 : README et runbook opérationnel

**En tant que** opérateur  
**Je veux** un README et un runbook dans `units/mistral/`  
**Afin de** installer, lancer, valider et dépanner le service sans documentation externe.

**Points** : 3

**Critères d'acceptation** :

- [x] `units/mistral/README.md` : objectif, prérequis, procédure d’installation (modèle, compose)
- [x] Commandes runbook : up, down, health, test chat, smoke test
- [x] Dépannage : `--mlock`, RAM, réseau
- [x] Références vers RECO, INDEX, TheBloke

**Tâches techniques** :

- [ ] Rédiger README (structure type `units/appsmith/README.md`)
- [ ] Section Runbook : start, stop, healthcheck, smoke test, logs
- [ ] Section Dépannage : erreurs courantes (OOM, mlock, réseau)

**Livrables** : `units/mistral/README.md` complet

---

### US-2.3 : Checklist de validation finale

**En tant que** product owner  
**Je veux** une checklist de validation alignée sur la RECO  
**Afin de** confirmer que tous les critères DoD sont remplis.

**Points** : 1

**Critères d'acceptation** :

- [x] Checklist RECO §10 exécutée et cochée
- [x] Aucun port public exposé
- [x] Logs rotatifs actifs
- [x] Configuration DIVA documentée : `MISTRAL_BASE_URL=http://mistral-llamacpp:8000/v1`

**Tâches techniques** :

- [ ] Parcourir la checklist RECO §10
- [ ] Documenter la config DIVA (pour intégration future)

**Livrables** : Checklist validée ; config DIVA documentée

---

### US-2.4 : Intégration dorevia.sh (optionnel)

**En tant que** développeur plateforme  
**Je veux** une commande `dorevia.sh mistral up|down|status` (ou équivalent)  
**Afin de** gérer Mistral comme les autres services de la plateforme.

**Points** : 2 (optionnel)

**Critères d'acceptation** :

- [ ] `dorevia.sh mistral up` lance `docker compose up -d` dans `units/mistral`
- [ ] `dorevia.sh mistral down` stoppe le service
- [ ] `dorevia.sh mistral status` affiche l’état du conteneur
- [ ] Réseau `dorevia-internal` créé automatiquement si absent (ou vérification explicite)

**Tâches techniques** :

- [ ] Étendre `bin/dorevia.sh` avec sous-commande `mistral`
- [ ] Exécuter compose depuis `units/mistral`
- [ ] Documenter dans README mistral et aide dorevia.sh

**Livrables** : Intégration CLI optionnelle ; aide mise à jour

---

**Sprint 2 — Definition of Done** :

- [x] Smoke test exécuté et baseline documentée
- [x] README et runbook complets
- [x] Checklist RECO validée
- [ ] (Optionnel) Intégration dorevia.sh

---

## 5. Récapitulatif et ordre d'exécution

| Ordre | Sprint | Résumé |
|-------|--------|--------|
| 1 | Sprint 1 | Unit mistral + modèle GGUF + compose + premier run + health + test chat |
| 2 | Sprint 2 | Smoke test + README + runbook + checklist + (optionnel) CLI |

---

## 6. Risques et limites (rappel)

- **RAM 15 Go** : Marge faible si d’autres services actifs — surveiller `free -h`
- **Swap** : Si utilisé, latence forte — surveiller pendant les tests
- **--mlock** : Peut exiger `ulimit` ou capabilities ; retirer si erreur permissions
- **Réseau** : Si `dorevia-internal` n’existe pas, créer avant : `docker network create dorevia-internal`

---

## 7. Backlog v1.1+ (hors scope Phase 1)

- Intégration DIVA (appels Mistral, synthèse, qualification, DLP)
- Script smoke test automatisé (CI ou cron)
- Montée en gamme modèle (Mixtral) si ressources augmentent
- Serveur GPU dédié si charge intensive
- Monitoring (Prometheus/Grafana) latence, erreurs

---

## 8. Références

| Document | Rôle |
|----------|------|
| `INDEX.md` | Index ZeDocs/web22 |
| `RECO_MISTRAL_CPU_LLAMACPP_OPTION_B_v1.0.md` | Spec Option B (compose, runbook) |
| `SPEC_INSTALLATION_MISTRAL.v0.1.md` | Spec globale (vLLM + Option B) |
| `RAPPORT_INTEGRATION_MISTRAL_DIVA_v1.0.md` | Contexte intégration DIVA |
| `VISION_TECHNIQUE_DOREVIA_v1.0.md` | Architecture Dorevia |

---

**Fin du plan.**
