# SPEC — DIVA Cockpit Cards Governance v1.0

**Date :** 2026-02-18  
**Scope :** Linky + Runner + DIVA  
**Complément de :** DIVA Cockpit Only v1.3

---

## 1. Objectif

Permettre l'ajout, la modification ou la suppression de cards cockpit  
**sans casser DIVA**, sans régression serveur, et sans incohérence UI/backend.

La liste des cards cockpit ne doit jamais être codée en dur dans le runner.

---

## 2. Source de vérité des cards

La liste des cards cockpit est définie par Linky.

### Endpoint officiel

```
GET /api/cockpit/cards?tenant=<t>
```

Note : `company_id` n'est pas un paramètre — la liste de cards est identique pour toutes les sociétés d'un même tenant. Si un besoin futur de cards par société émerge, le paramètre pourra être ajouté.

### Réponse

```json
{
  "schema": "dorevia.cockpit_cards.v1",
  "cards_version": "2026-02-18.1",
  "cards": [
    {
      "key": "treasury_validated_pct",
      "label": "Trésorerie validée",
      "unit": "percent",
      "required": true
    },
    {
      "key": "cash",
      "label": "Cash",
      "unit": "currency",
      "required": true
    },
    {
      "key": "business",
      "label": "Business",
      "unit": "currency",
      "required": true
    },
    {
      "key": "taxes",
      "label": "Taxes",
      "unit": "currency",
      "required": true
    },
    {
      "key": "credit_notes",
      "label": "Notes de crédit",
      "unit": "currency",
      "required": true
    },
    {
      "key": "refunds",
      "label": "Remboursements",
      "unit": "currency",
      "required": true
    },
    {
      "key": "pos_shops",
      "label": "POS magasins",
      "unit": "currency",
      "required": false
    },
    {
      "key": "pos_z",
      "label": "Z de caisse",
      "unit": "currency",
      "required": false
    }
  ]
}
```

Les keys correspondent exactement au `CARD_MAPPING` défini dans le code Linky (`app/api/diva/prewarm/route.ts`). Les cards POS sont `required=false` car leur disponibilité dépend de l'activation du module POS côté Odoo.

---

## 3. Règles Runner

### 3.1 Découverte dynamique

Le runner doit :

1. Appeler `/api/cockpit/cards`
2. Construire dynamiquement le payload Mistral à partir de cette liste

Interdiction :

- ❌ Liste de cards codée en dur
- ❌ Hypothèse "il y a toujours 8 cards"

### 3.2 Règles `required`

- Si `required=true` :
  - La card doit être présente dans le payload
  - Si absente → `state=failed`, `error_code=INVALID_PAYLOAD`

- Si `required=false` :
  - Peut être `null`
  - Doit inclure `details.reason`
  - Ne bloque pas la génération

---

## 4. Impact sur le `payload_hash`

Le payload envoyé à Mistral doit inclure :

```json
"cards_spec": {
  "version": "2026-02-18.1",
  "keys": ["business", "cash", "credit_notes", "pos_shops", "pos_z", "refunds", "taxes", "treasury_validated_pct"],
  "required": ["business", "cash", "credit_notes", "refunds", "taxes", "treasury_validated_pct"]
}
```

Note : `keys` et `required` sont triés alphabétiquement (invariant §7).

**Tous les champs de `cards_spec`** (`version`, `keys`, `required`) sont inclus dans le calcul du `payload_hash`.

Effet :

- Ajout d'une card → `keys` change → nouveau hash → régénération automatique
- Suppression d'une card → `keys` change → nouveau hash → régénération
- Modification `required` → `required` change → nouveau hash → régénération
- Changement de version sans modification de liste → `version` change → régénération

---

## 5. Ajout d'une nouvelle card (processus officiel)

### Étape 1 — UI

Ajouter la card dans Linky.  
`required=false` dans un premier temps.

### Étape 2 — Backend prêt

Une fois la donnée disponible partout :

- Passer `required=true`

### Étape 3 — Déploiement

Le runner détecte automatiquement la nouvelle card via :

- Changement `cards_version`
- Changement `cards_spec.keys`
- Hash modifié

Aucune modification runner requise.

---

## 6. Suppression d'une card

Si une card est retirée de Linky :

- Elle disparaît de `/api/cockpit/cards`
- Le hash change
- Les insights existants expirent via TTL
- Aucune purge manuelle requise

---

## 7. Invariants de stabilité

- `cards_version` obligatoire
- `cards_spec.keys` et `cards_spec.required` triés alphabétiquement **côté backend** (jamais délégué au frontend — deux environnements doivent produire le même hash)
- Ordre stable
- Clés uniques
- Les `key` sont **case-sensitive** et doivent être en **snake_case ASCII** (ex. `treasury_validated_pct`, jamais `Treasury_Validated_Pct` ni `treasuryValidatedPct`)
- Les `unit` utilisent des valeurs normalisées : `currency`, `percent`, `count` (jamais `EUR`, `%`, `nb`)

---

## 8. Definition of Done

- [ ] Endpoint `/api/cockpit/cards` implémenté
- [ ] Runner consomme dynamiquement la liste
- [ ] `cards_spec` inclus dans payload Mistral
- [ ] `payload_hash` inclut `cards_spec` (`version` + `keys` + `required`)
- [ ] Ajout d'une card ne nécessite aucun changement runner
- [ ] Suppression d'une card ne casse pas DIVA

---

**SPEC validée — prête commit.**
