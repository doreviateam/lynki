# Note — Audit et optimisation Diva / Mistral

**Date** : mars 2026  
**Version** : 1.2  
**Répertoire** : ZeDocs/web55  
**Références** : `units/diva/README.md`, `units/mistral/README.md`, `ZeDocs/web22/RAPPORT_LOAD_TEST_DIVA_MISTRAL_2026-02-17.md`, `ZeDocs/web34/SPEC_DIVA_v1.2.md`

---

## Principe produit fondateur

> **Diva n'interprète pas la vérité métier ; elle la met en langage.**

Ce principe est la clé de voûte de toutes les décisions d'architecture présentées dans cette note.

### Souhait produit — Insight principal

Dans l’**insight principal** (bloc synthèse Diva du cockpit), on souhaite que Diva :

* renvoie un message **fondé exclusivement sur les données normalisées issues des 12 cartes** du dashboard (Trésorerie, Position trésorerie, Cash, Business, Taxes, Notes de crédit, Remboursements, POS, Z de caisse, BFR, Encours, EBE), et non sur une interprétation libre du LLM ;
* s’exprime comme un **contrôleur de gestion** : lecture factuelle des indicateurs, ton de pilotage, sobre et analytique ;
* produise une **lecture d’ensemble**, mettant en évidence les équilibres, tensions, incohérences éventuelles et points de vigilance ;
* reste **sans prescription, sans injonction et sans recommandation d’action** : uniquement une formulation analytique des signaux fournis ;
* soit **affichée en moins de 5 secondes** : l’utilisateur doit voir une réponse (insight calculé, synthèse déterministe ou message d’actualisation explicite) dans ce délai.

**Règle UX structurante** : en aucun cas l’affichage initial du bloc synthèse Diva ne doit dépendre d’une inférence Mistral synchrone.

**Affichage < 5 s** : avec l’architecture actuelle (lecture depuis le store, pas d’appel Mistral synchrone pour l’affichage), l’objectif est tenable si (1) l’insight est déjà pré-calculé via prewarm / runner, ce qui permet un affichage quasi instantané ; (2) sinon, le système affiche en moins de 5 secondes soit l’insight déterministe (Niveau 0), soit un état « actualisation en cours », puis met à jour le bloc dès que le store est prêt. En aucun cas l’utilisateur ne doit attendre 15–30 s d’inférence pour la première peinture.

**Faisabilité** : oui. Le payload envoyé à Mistral contient déjà les cartes et le FactsPack dérivé de ces indicateurs. L’évolution peut être engagée sans remise en cause de l’architecture, en renforçant les prompts système sur trois points : rôle explicite de **contrôleur de gestion**, ancrage exclusif sur les **12 indicateurs**, et interdiction de toute formulation prescriptive. Cette exigence relève principalement du **Lot 2** (qualité et latence), lors du passage au prompt JSON compact.

**Ligne éditoriale — vocabulaire** : pour éviter que Diva glisse vers la recommandation tout en restant utile au pilotage, on verrouille le vocabulaire comme suit. **Autorisé** : constat, tension, vigilance, équilibre, incohérence, exposition, dérive, lecture d’ensemble. **À éviter** : il faut, il convient de, priorité d’action, recommandation, plan d’action. En résumé : Diva peut dire **où se situe la tension**, mais pas **quoi faire**.

---

## 1. Audit — ce qui est déjà juste

L'architecture actuelle est déjà pensée dans le bon sens. Trois décisions structurantes sont en place et doivent être préservées.

### 1.1 Découplage UX / inférence

Linky lit un store (Postgres), pas le LLM en direct. La promesse produit reste tenable même quand Mistral est lent ou indisponible. **Diva n'est pas bloquante pour l'affichage** — c'est la décision architecturale la plus importante.

### 1.2 Mode dégradé exploitable

Le système n'est pas en « erreur ou succès » mais en « lecture intelligente (LLM) ou lecture sobre (déterministe) ». `DegradedFlashFromFactsPack` produit un flash lisible à partir du FactsPack seul. C'est exactement la bonne philosophie pour un cockpit financier.

### 1.3 Pré-calcul par contexte

Runner + prewarm + cache par `context_hash` : Diva est traitée comme une **couche de reformulation contextualisée**, pas comme un moteur synchrone de calcul. Le vrai moteur métier est ailleurs (Vault, Odoo, ERP). Diva ne doit jamais devenir une source de vérité.

---

## 2. Diagnostic — le vrai sujet

Le sujet n'est pas uniquement « optimiser Mistral ».  
Le vrai sujet est de **réduire la dépendance fonctionnelle à Mistral** :

- moins demander au LLM de produire la **substance**
- plus lui demander de **mettre en forme** une substance déjà calculée

C'est là que se trouvent les gains les plus importants en latence, robustesse et cohérence.

---

## 3. Architecture cible — 3 niveaux

### Niveau 0 — déterministe pur (toujours disponible)

Produit côté Diva en Go, sans LLM, à partir du FactsPack :

- `headline_candidate` : règle simple (plus forte variation, risque dominant, signal contradictoire)
- `facts[]` : 2 à 4 faits hiérarchisés par score d'importance
- `alerts[]` : 1 à 2 points de vigilance issus des règles de gouvernance

**Critères de ranking** :
- intensité de variation (écart relatif)
- montant absolu
- criticité métier (trésorerie > business > taxes > encours)
- caractère contradictoire (flux positifs + encours tendu)
- donnée manquante critique

Ce niveau doit être **rapide (< 50 ms), déterministe, et déjà acceptable à lire**. Il constitue le fallback de base et l'entrée du Niveau 1.

### Niveau 1 — LLM de reformulation

Mistral ne calcule rien. Il reçoit un objet JSON structuré et compact :

```json
{
  "scope": {
    "tenant": "laplatine2026",
    "company_id": 1,
    "period": "2026-YTD"
  },
  "headline_candidate": "La trésorerie progresse mais l'encours client reste tendu",
  "facts": [
    {"kind": "cash",    "label": "Cash brut",      "value": 147000, "trend": "up"},
    {"kind": "ar",      "label": "Encours client", "value": 42000,  "trend": "stable"},
    {"kind": "overdue", "label": "Retards",        "value": 12000,  "severity": "medium"}
  ],
  "alerts": [
    "Concentration client élevée",
    "Une partie de l'encours est ancienne"
  ],
  "instruction": {
    "language": "fr",
    "style": "direct, sobre, contrôle de gestion",
    "max_items": 3
  }
}
```

**Mission du LLM** :
- reformuler en français naturel
- condenser, améliorer la fluidité
- éviter les répétitions

**Ce que le LLM ne fait plus** : calculer, hiérarchiser, interpréter.

Mistral travaille mieux quand les signaux sont déjà hiérarchisés, le schéma compact, et la tâche rédactionnelle — pas analytique.

### Niveau 2 — explication approfondie à la demande

Réservé aux appels `/explain`, analyses de carte, drill-down CFO, questions utilisateur.  
→ vrai appel LLM riche, latence acceptable (l'utilisateur fait un geste explicite).

**Séparation nette** :
| Usage | Niveau | Latence attendue |
|-------|--------|-----------------|
| Flash cockpit | 0 + 1 | < 1 s (lecture store) |
| Refresh cockpit | 1 | 15–30 s (asynchrone, invisible) |
| Explain carte | 2 | 20–60 s (synchrone, accepté) |

---

## 4. Gains techniques prioritaires

### 4.1 Single-flight par `context_hash` ← gain immédiat

**Problème actuel** : 3 requêtes sur le même contexte → 3 générations quasi-parallèles → CPU pic + timeout.

**Solution** : si une génération est déjà en cours pour un `context_hash`, les autres appels se branchent sur le même job, aucune duplication.

C'est le **meilleur gain immédiat** côté charge CPU.

### 4.2 Queue priorisée

Toutes les générations ne se valent pas.

| Priorité | Type |
|----------|------|
| 1 | Refresh explicite utilisateur |
| 2 | Contextes cockpit très consultés (CODIR, YTD) |
| 3 | Runner périodique |
| 4 | Explain non critique |

Règle : **1 génération Mistral à la fois** (ou 2 max) sur CPU-only. La concurrence apparente donne souvent une UX pire qu'une file propre (timeouts en cascade).

### 4.3 Fraîcheur métier plutôt que TTL seul

**Problème** : le TTL ne reflète pas toujours la réalité métier. On peut régénérer inutilement (données inchangées) ou pas assez tôt (données fraîches).

**Solution** : ajouter un hash ou version métier dans la clé de contexte :

```
context_key = tenant + company + period + view + facts_version
```

`facts_version` dérivé de `aggregation_updated_at_max` ou d'un hash des valeurs KPI.

- données inchangées → pas de régénération même si TTL expiré
- données fraîches → régénération justifiée avant TTL

Le TTL devient un filet de sécurité secondaire, pas la logique principale.

---

## 5. Optimisation des prompts

### À retirer

- règles redondantes ou rarement déclenchées
- rappels de calcul que Diva sait déjà faire côté Go
- textes longs de contexte déjà présents dans les faits
- contraintes stylistiques répétées plusieurs fois

### À conserver

- format de sortie JSON strict
- ton (factuel, sobre, contrôle de gestion)
- interdits lexicaux (injonctions, anglicismes)
- règle de non-invention (ne rien déduire au-delà des faits)
- priorité à ce qui est matérialisé dans les faits

### Principe clé

Envoyer du **JSON structuré** (Niveau 1), pas une soupe textuelle. La qualité perçue de Diva dépend **plus du ranking amont** que du modèle lui-même.

---

## 6. Observabilité — métriques manquantes

**Métriques actuelles** : `prompt_chars`, `llm_latency_ms`, `degraded`.

**À ajouter** :

| Métrique | Utilité |
|----------|---------|
| `queue_wait_ms` | Temps passé en file avant exécution |
| `cache_hit` | Taux de lecture sans génération |
| `generation_reason` | `prewarm`, `runner`, `manual_refresh`, `explain` |
| `singleflight_joined` | Nombre d'appels dédupliqués |
| `insight_age_seconds` | Fraîcheur de l'insight lu |
| `facts_version` | Identifiant version données |
| `fallback_level` | `none`, `deterministic`, `llm_timeout`, `llm_invalid_json` |

Ces métriques permettent de distinguer si un problème vient du modèle, de la file, du manque de prewarm ou d'un prompt trop lourd.

---

## 7. Plan d'action en 3 lots

### Lot 1 — Robustesse immédiate (court terme)

| Action | Description | Impact |
|--------|-------------|--------|
| **Single-flight** | Lock par `context_hash` avant envoi Mistral ; les appels concurrents attendent le job en cours | CPU, UX |
| **Queue simple** | File priorisée (refresh user > prewarm > runner) ; max 1–2 inférences parallèles sur CPU | CPU, timeouts |
| **Logs enrichis** | Ajouter `queue_wait_ms`, `cache_hit`, `generation_reason`, `fallback_level` | Observabilité |
| **Timeouts** | Revoir timeout Mistral client Diva (ex. 90 s au lieu de 180 s) pour dégrader plus tôt ; aligner DIVA_TIMEOUT_MS Vault | Robustesse |

### Lot 2 — Qualité et latence (moyen terme)

| Action | Description | Impact |
|--------|-------------|--------|
| **Synthèse déterministe** | Diva produit `headline_candidate`, `facts[]`, `alerts[]` ranked avant tout appel LLM | Qualité, latence |
| **Prompt compact JSON** | Remplacer le payload cartes + soupe d'insights par le JSON structuré Niveau 1 (scope, headline_candidate, facts, alerts, instruction) | Taille prompt, stabilité |
| **Ranking de signaux** | Calculer score d'importance côté Go (variation, montant, criticité, contradictions, données manquantes) ; n'envoyer que top 3 faits + top 2 vigilances au LLM | Bruit, répétitions |
| **Réduire system prompt** | Supprimer règles redondantes ; garder format, ton, interdits, non-invention | Tokens, latence |

### Lot 3 — Fraîcheur et UX (optionnel)

| Action | Description | Impact |
|--------|-------------|--------|
| **Fraîcheur métier** | Dériver `facts_version` de `aggregation_updated_at_max` ; invalider si données ont changé, même avant TTL | Pertinence |
| **Indicateurs UX** | Afficher âge de l'insight (ex. "Calculé il y a 4 min"), état "actualisation en cours" | Maîtrise cockpit |
| **TTL en filet** | Conserver TTL (ex. 10 min) comme sécurité secondaire seulement | Cohérence |
| **Métriques `insight_age`** | Exposer `insight_age_seconds` et `facts_version` dans les logs et l'API insight | Debugging |

---

## 8. Verdict

L'architecture de base est déjà solide. Le prochain palier de maturité n'est pas :
- changer de modèle,
- empiler plus de prompt engineering.

C'est de faire de Diva un **moteur de synthèse déterministe piloté par règles, avec Mistral comme couche de formulation**.

> Le système le plus robuste est celui où le LLM est le dernier à intervenir, pas le premier.

Plus robuste, plus explicable, plus multi-tenant, plus cohérent avec la philosophie Linky.

---

**Version** : 1.2  
**Type** : Note d'audit et plan d'action (3 lots).  
**Documents liés** : `ZeDocs/web34/SPEC_DIVA_v1.2.md`, `ZeDocs/web22/SPEC_DIVA_Warmup_Runner_CODIR_v1.0.md`, `ZeDocs/web22/RAPPORT_LOAD_TEST_DIVA_MISTRAL_2026-02-17.md`.
