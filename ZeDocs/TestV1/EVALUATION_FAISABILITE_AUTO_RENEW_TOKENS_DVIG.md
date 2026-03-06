# 📊 Évaluation de Faisabilité — Auto-Renew Tokens DVIG (Caddy-like)

**Document** : Évaluation Technique & Faisabilité  
**Version** : v1.0  
**Date** : 2026-01-03  
**Spécification évaluée** : SPEC — Auto-Renew Tokens DVIG (Caddy-like) v1.0  
**Statut** : ✅ **FAISABLE** avec quelques points d'attention

---

## 🎯 Résumé Exécutif

**Verdict global** : ✅ **FAISABLE** — La spécification est techniquement réalisable et s'intègre bien avec l'architecture existante.

**Complexité estimée** : 🟡 **Moyenne** (3-4 sprints)

**Risques principaux** :
- Intégration côté Odoo (nécessite développement module)
- Coordination entre DVIG et applications (pull mode)
- Migration des tokens existants

**Recommandation** : ✅ **Approuver** avec planification en Phase 4

---

## 1. Analyse Technique — Base de Données

### 1.1 État Actuel

**Table `dvig_tokens` existante** :
```sql
- id SERIAL PRIMARY KEY
- tenant VARCHAR(50) NOT NULL
- env VARCHAR(20) NOT NULL
- token_hash VARCHAR(64) NOT NULL
- created_at TIMESTAMP DEFAULT NOW()
- revoked_at TIMESTAMP NULL
- accept_until TIMESTAMP NULL  -- Migration 003 (overlap)
- scope_unit VARCHAR(50) NULL   -- Migration 004
```

### 1.2 Modifications Requises

**Migration SQL nécessaire** :
```sql
-- Ajouter champs
ALTER TABLE dvig_tokens 
  ADD COLUMN expires_at TIMESTAMPTZ NULL,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'legacy',
  ADD COLUMN grace_until TIMESTAMPTZ NULL,
  ADD COLUMN replaces_token_id INTEGER NULL;

-- Index recommandés
CREATE INDEX idx_dvig_tokens_status 
  ON dvig_tokens(tenant, scope_unit, env, status) 
  WHERE status IN ('active', 'grace');

CREATE INDEX idx_dvig_tokens_expires_at 
  ON dvig_tokens(expires_at) 
  WHERE expires_at IS NOT NULL;

CREATE INDEX idx_dvig_tokens_grace_until 
  ON dvig_tokens(grace_until) 
  WHERE grace_until IS NOT NULL;
```

### 1.3 Faisabilité DB

✅ **FAISABLE** — Très simple
- Ajout de colonnes NULL (rétrocompatible)
- Migration des tokens existants : `UPDATE dvig_tokens SET status='legacy' WHERE expires_at IS NULL`
- Index optimisés pour les requêtes de validation
- Contrainte `replaces_token_id` peut référencer `id` (FK optionnelle)

**Effort estimé** : 0.5 jour

---

## 2. Analyse Technique — Validation (bearer.py)

### 2.1 État Actuel

**Code existant** (`sources/dvig/auth/bearer.py`) :
```python
# Validation avec support overlap (accept_until)
token_record = db.execute(
    select(DVIGToken)
    .where(DVIGToken.token_hash == token_hash)
    .where(
        or_(
            DVIGToken.revoked_at.is_(None),  # Token actif
            and_(
                DVIGToken.revoked_at.isnot(None),
                DVIGToken.accept_until > now  # Token en overlap
            )
        )
    )
).scalar_one_or_none()
```

### 2.2 Modifications Requises

**Nouvelle logique de validation** :
```python
# 1. Si status == revoked → refuser
# 2. Si expires_at IS NOT NULL et now >= expires_at → refuser
# 3. Si status == grace :
#    - si grace_until IS NULL → refuser
#    - si now >= grace_until → refuser
# 4. Sinon (active/legacy) → accepter
```

### 2.3 Faisabilité Validation

✅ **FAISABLE** — Extension naturelle
- Logique similaire à l'overlap existant (`accept_until`)
- Pas de refonte nécessaire, juste extension
- Rétrocompatibilité garantie (tokens legacy avec `status='legacy'`)

**Effort estimé** : 1 jour (incluant tests)

---

## 3. Analyse Technique — API DVIG

### 3.1 État Actuel

**Architecture FastAPI** :
- Router `/api/v1/auth` existant
- Structure modulaire (`sources/dvig/dvig/api_fastapi/routes/`)
- Authentification Bearer déjà en place

### 3.2 Nouveaux Endpoints Requis

**1. `GET /auth/token-status`** :
- Nécessite authentification (token valide)
- Retourne état actif + recommandation de renouvellement
- **Complexité** : 🟢 Faible (requête DB simple)

**2. `POST /auth/renew`** :
- Nécessite authentification (token valide)
- Génère nouveau token + transition old→grace
- Retourne token en clair (une seule fois)
- **Complexité** : 🟡 Moyenne (génération + transition atomique)

### 3.3 Faisabilité API

✅ **FAISABLE** — FastAPI facilite l'ajout
- Structure modulaire existante
- Dépendances d'authentification réutilisables
- Gestion d'erreurs standardisée
- **Point d'attention** : Sécurité du token en clair (ne jamais logger)

**Effort estimé** : 2 jours (incluant tests)

---

## 4. Analyse Technique — CLI (dorevia.sh)

### 4.1 État Actuel

**Commandes token existantes** :
- `token issue` — Création
- `token list` — Liste
- `token revoke` — Révocation
- `token rotate` — Rotation (existe déjà)

### 4.2 Modifications Requises

**Nouvelles commandes** :
- `token status <univers> <env> <tenant>` — Statut + recommandation
- `token renew <univers> <env> <tenant>` — Renouvellement
- Extension `token issue` avec `--ttl` optionnel

### 4.3 Faisabilité CLI

✅ **FAISABLE** — Extension du code existant
- Structure de commandes déjà en place
- Fonctions utilitaires réutilisables (`generate_token_raw`, `add_token_to_yaml`)
- **Point d'attention** : Gestion du token en clair (affichage unique)

**Effort estimé** : 1 jour

---

## 5. Analyse Technique — Intégration Odoo

### 5.1 Contrat API (DVIG)

✅ **FAISABLE** — API stable et documentée
- Endpoints `/auth/token-status` et `/auth/renew` bien définis
- Format JSON clair
- Authentification Bearer standard

### 5.2 Module Odoo Requis

⚠️ **HORS SCOPE v1.0** — Nécessite développement séparé

**Fonctionnalités nécessaires** :
- Appel périodique `GET /auth/token-status` (cron Odoo)
- Détection `should_renew == true`
- Appel `POST /auth/renew`
- Stockage nouveau token (ir.config_parameter ou secret file)
- Basculer usage sur nouveau token

**Complexité estimée** : 🟡 Moyenne (module Odoo custom)
- Nécessite connaissance Odoo
- Gestion des erreurs réseau
- Retry logic
- Logging structuré

**Effort estimé** : 3-5 jours (module Odoo)

### 5.3 Recommandation

👉 **Phase 4.1** : Implémenter API DVIG (contrat stable)  
👉 **Phase 4.2** : Développer module Odoo (intégration)

---

## 6. Analyse Technique — Rétrocompatibilité

### 6.1 Tokens Legacy

✅ **GARANTIE** — Design rétrocompatible
- Tokens existants : `status='legacy'`, `expires_at=NULL`
- Validation : tokens legacy acceptés comme aujourd'hui
- Migration automatique : `UPDATE dvig_tokens SET status='legacy' WHERE expires_at IS NULL`

### 6.2 Politique de Migration

**Recommandation** :
- Laisser tokens legacy fonctionner indéfiniment
- Forcer migration lors de prochaine émission (`token issue` ou `renew`)
- Option : script de migration batch (hors scope v1.0)

---

## 7. Analyse Technique — Sécurité

### 7.1 Points Critiques

✅ **GÉRÉS** dans la spec :
- Token en clair retourné **une seule fois** (POST /auth/renew)
- Ne jamais logger token en clair
- Limitation à 2 tokens acceptés par scope (active + grace)
- Logs d'audit structurés

### 7.2 Recommandations Supplémentaires

- **Rate limiting** sur `/auth/renew` (éviter abus)
- **Rotation forcée** si token compromis (commande `revoke` existante)
- **Monitoring** : alertes si token expiré utilisé (tentative d'accès)

---

## 8. Estimation Globale

### 8.1 Répartition des Efforts

| Composant | Effort | Complexité |
|-----------|--------|------------|
| Migration DB | 0.5j | 🟢 Faible |
| Validation (bearer.py) | 1j | 🟢 Faible |
| API DVIG (endpoints) | 2j | 🟡 Moyenne |
| CLI (dorevia.sh) | 1j | 🟢 Faible |
| Tests unitaires | 1.5j | 🟡 Moyenne |
| Tests intégration | 1.5j | 🟡 Moyenne |
| Documentation | 1j | 🟢 Faible |
| **TOTAL (DVIG)** | **8.5j** | 🟡 **Moyenne** |
| Module Odoo (hors scope) | 3-5j | 🟡 Moyenne |

### 8.2 Planning Recommandé

**Phase 4.1 — DVIG (Sprint 1-2)** :
- Semaine 1 : Migration DB + Validation
- Semaine 2 : API + CLI + Tests

**Phase 4.2 — Intégration Odoo (Sprint 3)** :
- Semaine 3 : Module Odoo + Tests

**Total** : 3 sprints (3 semaines)

---

## 9. Risques Identifiés

### 9.1 Risques Techniques

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Token en clair exposé dans logs | Faible | 🔴 Critique | Code review strict + tests |
| Race condition lors du renew | Moyenne | 🟡 Moyen | Transaction DB atomique |
| Application Odoo ne renouvelle pas | Moyenne | 🟡 Moyen | Monitoring + alertes |
| Migration tokens legacy échoue | Faible | 🟢 Faible | Script de migration testé |

### 9.2 Risques Opérationnels

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Applications non mises à jour | Moyenne | 🟡 Moyen | Documentation + support |
| Tokens expirés en production | Faible | 🟡 Moyen | Monitoring + alertes proactives |
| Coordination DVIG ↔ Odoo | Moyenne | 🟡 Moyen | Contrat API stable + tests |

---

## 10. Points d'Attention

### 10.1 Décisions à Trancher

1. **Identifiant token** : UUID vs PK existante (SERIAL)
   - **Recommandation** : Garder SERIAL (simplicité, rétrocompatibilité)

2. **Stockage token en clair** : Format exact
   - **Recommandation** : Format actuel (`dvig_<base64url>`)

3. **Job de nettoyage** : Cron interne DVIG vs CLI
   - **Recommandation** : CLI (`dorevia.sh token cleanup`) + cron externe

4. **Valeurs par défaut** : Hardcode vs config
   - **Recommandation** : Variables d'environnement DVIG (flexibilité)

### 10.2 Améliorations Futures (Phase 5+)

- Webhooks "push" DVIG → applications (évite polling)
- UI dédiée pour gestion tokens
- Rotation automatique orchestrée (DVIG initie le renew)
- HSM/KMS pour stockage sécurisé

---

## 11. Conclusion

### 11.1 Faisabilité Globale

✅ **FAISABLE** — La spécification est techniquement solide et s'intègre bien avec l'architecture existante.

**Points forts** :
- Architecture rétrocompatible
- Extension naturelle du code existant
- API FastAPI facilite l'implémentation
- Sécurité bien pensée (token en clair une seule fois)

**Points d'attention** :
- Intégration Odoo nécessite développement séparé
- Coordination entre DVIG et applications (pull mode)
- Migration des tokens existants

### 11.2 Recommandation Finale

✅ **APPROUVER** la spécification avec :
- Planification en **Phase 4** (après Phase 3 complète)
- Priorisation : **Phase 4.1** (DVIG) puis **Phase 4.2** (Odoo)
- Estimation : **3 sprints** (3 semaines)
- Risques identifiés et mitigations en place

### 11.3 Prochaines Étapes

1. ✅ Valider cette évaluation avec l'équipe technique
2. 📋 Créer tickets Jira/GitHub pour Phase 4.1
3. 📝 Finaliser spécification technique détaillée
4. 🚀 Démarrer implémentation Phase 4.1 (DVIG)

---

**Fin de l'évaluation**

