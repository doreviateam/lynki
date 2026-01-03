# 📘 Préconisations d'Exécution — STINGER  
## DVIG P1 Auth / Token

**Version** : v1.0  
**Date** : 2025-01-28  
**Statut** : ✅ Recommandations validées (post-LAB)

---

## 🎯 Objectif du document

Ce document formalise les **préconisations d'exécution pour l'environnement STINGER** dans le cadre du déploiement de **DVIG P1 Auth / Token**, après validation complète de l'environnement LAB.

👉 STINGER est une **pré-production stricte**, servant à valider :
- les conditions réelles d'exploitation,
- la configuration finale PROD,
- la robustesse runtime (Docker, reload, logs, restart).

---

## 🔁 Rappel du pipeline officiel

```text
LAB  →  STINGER  →  PROD
```

| Environnement | Rôle | Statut P1 |
|--------------|------|-----------|
| LAB | Validation fonctionnelle & sécurité | ✅ VALIDÉ |
| STINGER | Validation conditions réelles | ⏳ À FAIRE |
| PROD | Exploitation | ⛔ Bloqué tant que STINGER non validé |

---

## 🧱 Principes fondamentaux STINGER

### 1️⃣ Même image que PROD
- STINGER **DOIT utiliser la même image Docker que PROD**
- Aucune image spécifique "-stinger"

📌 Recommandation :
```text
dorevia/dvig:0.1.2-auth
```

---

### 2️⃣ Séparation stricte des secrets
- Tokens **STINGER distincts** de LAB et PROD
- Fichier `tokens.yml` dédié STINGER
- Volume monté **read-only**

---

### 3️⃣ Configuration PROD-like
- Docs **désactivées**
- OpenAPI **désactivé**
- Logs **format PROD**
- Reload tokens **actif**

---

## ⚙️ Configuration recommandée STINGER

### Variables d'environnement

```bash
DVIG_AUTH_ENABLED=1
DVIG_TOKENS_FILE=/etc/dvig/tokens.yml

DVIG_DOCS_ENABLED=0
DVIG_OPENAPI_ENABLED=0

DVIG_LOG_FORMAT=json
DVIG_LOG_LEVEL=info

DVIG_TOKENS_RELOAD_INTERVAL=60
DVIG_TOKENS_RELOAD_ON_SIGHUP=1

DVIG_HEALTH_PROTECTED=0
```

---

## 🧪 Checklist de validation STINGER (exécutable)

### 1️⃣ Démarrage service
- [ ] Container démarre sans erreur
- [ ] `docker logs` sans stacktrace
- [ ] `/health` → 200

---

### 2️⃣ Smoke tests API (strict minimum)
- [ ] `/docs` → 404
- [ ] `/openapi.json` → 404
- [ ] `/ingest` sans token → 401
- [ ] `/ingest` token valide → 201

---

### 3️⃣ Tokens & reload runtime
- [ ] Modification `tokens.yml` **sans restart**
- [ ] Reload par intervalle validé
- [ ] Reload par `docker kill --signal=HUP` validé
- [ ] Continuité de service (aucun downtime)

---

### 4️⃣ Logs & audit
- [ ] Logs visibles via `docker logs`
- [ ] Présence `event_id`, `tenant`, `univers`, `token_id`
- [ ] Absence token brut / hash
- [ ] Format JSON conforme

---

### 5️⃣ Robustesse minimale
- [ ] `docker restart dvig` → OK
- [ ] `docker stop/start` → OK
- [ ] Tokens bien rechargés après restart

---

## 🏁 Critère de sortie STINGER (DoD)

STINGER est **VALIDÉ** si :
- tous les smoke tests passent,
- le reload fonctionne sans redémarrage,
- les logs sont exploitables et sûrs,
- aucun incident bloquant n'est observé.

---

## ✍️ Formulation officielle de validation STINGER

À consigner une fois validé :

> **DVIG P1 Auth/Token — STINGER VALIDÉ**  
> Le service a été déployé dans des conditions équivalentes à la production.  
> Les mécanismes d'authentification, de reload des tokens, de logs et de redémarrage ont été validés sans régression.

---

## 🚀 Suite logique

Une fois STINGER validé :
- ✅ Passage en **PROD autorisé**
- 🏷️ Tag de release gelé
- 🔐 Politique tokens PROD appliquée

---

## 📌 Notes finales

- Aucun test unitaire ou d'intégration n'est requis en STINGER
- STINGER valide **l'exploitation**, pas la logique métier
- Toute modification après STINGER invalide la validation

---

**Fin du document**

