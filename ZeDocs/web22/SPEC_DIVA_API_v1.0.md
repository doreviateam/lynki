# SPEC — DIVA API `/diva/explain` (v1.1)

**Version** : 1.1  
**Date** : 2026-02-17  
**Statut** : Ready for implementation  
**Périmètre** : Lecture synthétique des KPI Linky (Flash ≤ 10s)  
**Hors scope** : DLP, historique, personnalisation, chat libre  
**Forme éditoriale** : `SPEC_DIVA_v2_Copilote_CODIR.md` — évolution narrative (JSON inchangé)

------------------------------------------------------------------------

# 1. Positionnement

DIVA est un **service dédié** (`units/diva/`) chargé de produire une lecture structurée des indicateurs Linky.

Il ne :
- ne génère pas de DLP
- n'écrit pas en base
- n'accède pas directement à Vault
- ne prend aucune décision

Il explique.

------------------------------------------------------------------------

# 2. Architecture

## 2.1 Déploiement

DIVA = service indépendant (Go, aligné Vault).

```
units/diva/
  ├── Dockerfile
  ├── docker-compose.yml
  ├── app/
```

Réseau : `dorevia-network`

------------------------------------------------------------------------

## 2.2 Flux complet

```
Frontend Linky
       ↓
Linky backend (/api/diva/explain proxy)
       ↓
Service DIVA
       ↓
Mistral (mistral-llamacpp:8000)
```

Jamais Linky → Mistral direct.

------------------------------------------------------------------------

# 3. Endpoint

## POST `/diva/explain`

### Headers

```
Content-Type: application/json
```

Auth v1 : réseau interne uniquement.

------------------------------------------------------------------------

# 4. Request

```json
{
  "context": {
    "tenant": "string",
    "company_id": 1,
    "date_start": "YYYY-MM-DD",
    "date_end": "YYYY-MM-DD",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "dashboard": {
    "cards": [
      {
        "key": "cash",
        "label": "Cash",
        "value": 123456.78,
        "unit": "EUR"
      }
    ]
  },
  "options": {
    "mode": "flash",
    "force_refresh": false
  }
}
```

`force_refresh` : si `true`, DIVA ignore le cache (`context_hash`) et appelle Mistral. Utilisé par le bouton « Rafraîchir l'analyse » (cf. `RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md`).

------------------------------------------------------------------------

# 5. Cache & context_hash

**Si `options.force_refresh=true`** : bypass du cache, appel Mistral systématique.

**Sinon** : SHA256 de :

```
tenant + company_id + date_start + date_end + JSON.stringify(cards triées par key)
```

- TTL : 5 minutes
- cache hit → pas d'appel Mistral

------------------------------------------------------------------------

# 6. Response

## Status codes

- 200 : OK
- 408 : timeout Mistral
- 503 : moteur indisponible
- 400 : request invalide

## Body (200)

```json
{
  "meta": {
    "request_id": "uuid",
    "context_hash": "sha256:...",
    "generated_at": "ISO8601",
    "cached": false,
    "model": "mistral-7b-instruct-v0.2.Q4_K_M",
    "latency_ms": 3400
  },
  "flash": {
    "headline": "string",
    "what_i_see": ["string", "string", "string"],
    "to_check": ["string", "string"],
    "confidence": "low | medium | high"
  }
}
```

------------------------------------------------------------------------

# 7. Confidence

| Valeur | Signification |
|--------|---------------|
| low | données partielles ou incohérentes |
| medium | données complètes, analyse prudente |
| high | données cohérentes et structurées |

------------------------------------------------------------------------

# 8. Paramètres Mistral

- temperature : 0.2
- max_tokens : 256
- timeout technique : 30s
- objectif UX : ≤ 10s
- réponse JSON strict

------------------------------------------------------------------------

# 9. Règles de génération

DIVA doit :
- produire 1 phrase headline
- 3 puces max `what_i_see`
- 2 puces max `to_check`
- ne jamais inventer de causes
- ne jamais donner d'injonction
- ne jamais formuler un avis juridique/comptable
- signaler données insuffisantes calmement

------------------------------------------------------------------------

# 10. Gestion des erreurs

```json
{
  "error": {
    "code": "MISTRAL_TIMEOUT",
    "message": "Lecture DIVA momentanément indisponible. Les cartes restent consultables."
  }
}
```

------------------------------------------------------------------------

# 11. Logs & Observabilité

- log technique : oui
- payload complet : non
- request_id obligatoire
- retention logs : 7–14 jours
- pas de données nominatives en v1

------------------------------------------------------------------------

# 12. UX Intégration Linky

- bloc sous la grille
- génération automatique (debounce 5 s)
- bouton « Rafraîchir l'analyse » (force_refresh=true) — cf. `RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md`
- ancienne synthèse conservée
- badge confidence discret
- disclaimer discret :

> Lecture assistée par DIVA. L'analyse finale relève de l'utilisateur.

------------------------------------------------------------------------

# 13. Hors scope v1

- DLP
- Historique
- Graphe décisionnel
- Personnalisation
- Embeddings
- Chat libre

------------------------------------------------------------------------

# 14. Annexe

`ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` — prompts v1.1 (JSON strict, logique confidence, garde-fous anti-hallucination).

------------------------------------------------------------------------

# 15. Références

| Document | Rôle |
|----------|------|
| `PRE_SPEC_DIVA_v0.1.md` | Expression du besoin |
| `AVIS_SPEC_DIVA_API_v1.0.md` | Avis et recommandations |
| `RAPPORT_IMPLEMENTATION_MISTRAL_2026-02-17.md` | Mistral opérationnel |
| `INDEX.md` | Index ZeDocs/web22 |
| `units/dorevia-linky/app/api/dashboard-metrics/route.ts` | Sources métriques Linky |
| `ANNEXE_PROMPT_DIVA_FLASH_v1.0.md` | Prompts v1.1, logique confidence, anti-hallucination |
| `PLAN_IMPLEMENTATION_DIVA_SCRUM_v1.0.md` | Plan d'implémentation Scrum (3 sprints) |
| `RECOMMANDATION_PRODUIT_DIVA_AUTO_REFRESH_v1.0.md` | Décision Auto + Refresh |

------------------------------------------------------------------------

**Fin du document.**
