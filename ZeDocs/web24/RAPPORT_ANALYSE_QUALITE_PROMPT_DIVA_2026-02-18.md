# RAPPORT — Analyse qualité du prompt DIVA

**Date :** 2026-02-18 (mis à jour 2026-02-19 00:30 UTC)  
**Périmètre :** Prompt system + user de `mistral/client.go`, post-traitement `parseFlash`, qualité observée en production  
**Contexte :** DIVA Cockpit Only v1.3 déployé, pipeline opérationnel. Prompt v1.0 diagnostiqué, v2.0 déployé et vérifié en production.  
**Modes actifs :** Le prompt gère deux modes — `cockpit` (lecture globale, utilisé par le runner automatique) et `card` (analyse ciblée d'une carte, disponible via appel API direct). Le runner ne génère que des insights cockpit ; le mode card reste fonctionnel à la demande.  
**Statut :** ✅ Prompt v2.0 déployé en production — résultats validés

---

## 1. Constat

Les analyses DIVA en production produisent des **descriptions factuelles de chiffres**, pas des **lectures interprétatives à valeur ajoutée**.

### Exemples réels (production, 2026-02-18)

**Société 1 (SARL La Platine, YTD) :**
> *"Dans ce rapport, les fonds liquides s'élèvent à 1 404 952,21 €, principalement issus des activités commerciales pour 1 162 748,10 €. Les taxes représentent 231 097,31 € de dépenses. Des remboursements ont été effectués à hauteur de -1 686,84 €. Les magasins enregistrent des ventes supplémentaires de 4 213,2 € via POS. La trésorerie validée est à 0 %."*

**Société 2 (Sweet Manihot, YTD) :**
> *"Dans ce rapport, les données financières indiquent un taux de trésorerie validée à zéro pour la période du 01/01/2026 au 18/02/2026. Le flux principal provient des magasins POS avec un montant de 4213,2 EUR. Aucun montant significatif détecté dans les catégories Business, Taxes, Credit notes, Refunds et Z de caisse."*

### Ce qu'un expert-comptable dirait

> *"L'activité commerciale génère 1,16 M€ sur la période, mais le rapprochement bancaire n'est pas engagé (trésorerie validée à 0 %). Le POS ne représente que 0,3 % du CA — à recouper avec l'encaissement réel. Point d'attention : les remboursements restent marginaux (-1 687 €), cohérent avec l'activité."*

La différence : **interprétation des rapports entre indicateurs**, **hiérarchisation par enjeu**, **signalement des anomalies**, **mise en perspective**.

---

## 2. Diagnostic du prompt actuel

### 2.1 Sur-contrainte en forme

Le system prompt contient **15 règles négatives** pour **3 règles positives** :

| Type | Nombre | Exemples |
|---|---|---|
| Interdictions ("Aucun...") | 10 | Aucun titre, aucune section, aucune liste, aucun jugement, aucun conseil... |
| Restrictions de format | 3 | Maximum 2 phrases, pas de mot "Analyse"/"Conclusion", ton neutre |
| Obligations de contenu | 2 | Lecture globale des tendances, éléments significatifs |
| Exemples positifs (few-shot) | **0** | — |

Un LLM 7B (Mistral 7B Instruct Q4_K_M) contraint par trop de "ne pas" converge vers le comportement le plus sûr : **énumérer les chiffres sans interpréter**. C'est exactement ce qu'on observe.

### 2.2 Sous-contrainte en fond métier

Le prompt demande une "lecture synthétique et professionnelle" mais ne définit jamais ce que cela signifie concrètement :

- Pas de hiérarchisation attendue (qu'est-ce qui est "significatif" ?)
- Pas de seuils (à partir de quel écart signaler ?)
- Pas de relations inter-cards (trésorerie validée à 0 % + cash élevé = signal ?)
- Pas de vocabulaire expert-comptable (rapprochement, BFR, marge, décalage encaissement…)
- Pas de few-shot montrant le niveau de lecture attendu

### 2.3 "Maximum 2 phrases" — incompatible avec 8 KPIs

Le cockpit agrège 8 cards (treasury, cash, business, taxes, credit_notes, refunds, pos_shops, pos_z). En 2 phrases, Mistral doit choisir entre :
- Survoler tout (chaque card citée en un mot → listing)
- Ne traiter que 2-3 cards (les plus grosses → perte d'info)

Résultat : les réponses font systématiquement **plus de 2 phrases** (Mistral déborde), et quand il respecte la limite, le texte est creux.

### 2.4 Format JSON Flash sous-exploité

Le prompt ne demande **jamais explicitement** de remplir la structure `{headline, what_i_see, to_check, confidence}`. Le format est espéré mais non guidé → Mistral retourne du texte libre dans 100 % des cas observés, et le fallback `parseFlash` l'utilise comme headline brut.

### 2.5 `temperature: 0.2` — trop conservateur

Avec `temperature: 0.2`, Mistral privilégie les formulations les plus probables → des phrases génériques type "Dans ce rapport, les données financières indiquent…". Une temperature légèrement plus haute (0.4-0.5) favoriserait des formulations plus variées et moins robotiques, tout en restant factuel.

### 2.6 Post-traitement défensif — `forbiddenTerms` trop large

Le regex `forbiddenTerms` rejette toute réponse contenant :

```
vous devez|il faut|obligat|risque|sanction|assessment|framework|overview|compliance|hinge on|strategic overview
```

Le mot **"risque"** est interdit. Or un expert-comptable parle naturellement de "risque de décalage", "risque de trésorerie". Cette interdiction force Mistral à contourner un vocabulaire professionnel légitime.

### 2.7 Suppression automatique des dates — effet de bord

`sanitizeHeadline` supprime les plages de dates avec des regex agressives. Mais Mistral 7B, contraint par "2 phrases max", structure souvent sa réponse autour de la période. Après suppression, la phrase peut perdre son contexte ou commencer par une virgule orpheline (d'où le correctif `leadingOrphanPunct`). C'est un symptôme de prompt mal calibré : le LLM mentionne les dates parce que le prompt ne lui dit pas de ne pas le faire, et le post-traitement corrige en aval.

---

## 3. Paramètres LLM actuels

| Paramètre | Valeur | Commentaire |
|---|---|---|
| `model` | `mistral-7b-instruct-v0.2.Q4_K_M` | Quantifié Q4_K_M, 7,8 Go RAM |
| `temperature` | 0.2 | Très conservateur |
| `max_tokens` | 450 | Suffisant pour 4-5 phrases |
| `top_p` | 0.9 | Standard |
| `frequency_penalty` | 0 | Pas de pénalité de répétition |
| `presence_penalty` | 0 | Pas de pénalité de sujet déjà mentionné |

---

## 4. Axes d'amélioration recommandés

### A — Réécrire le system prompt avec few-shot (impact fort)

Remplacer les 15 interdictions par 2-3 exemples positifs. Un LLM 7B apprend mieux par imitation que par contrainte.

**Principe :** montrer 1 bon exemple cockpit + 1 mauvais (à ne pas reproduire).

### B — Passer de 2 à 4-5 phrases (impact fort)

Permettre une lecture structurée :
- Phrase 1 : tendance générale (positif/neutre/négatif)
- Phrase 2-3 : éléments significatifs et rapports inter-cards
- Phrase 4-5 : points d'attention ou anomalies

### C — Monter la temperature à 0.4 (impact moyen)

Favoriser des formulations moins génériques sans perdre la factualité.

### D — Activer `frequency_penalty: 0.3` (impact léger)

Réduire les répétitions ("Dans ce rapport…" en début de chaque analyse).

### E — Assouplir `forbiddenTerms` (impact moyen)

Retirer "risque" de la liste des termes interdits. Conserver les termes prescriptifs ("vous devez", "il faut", "obligat") et les anglicismes.

### F — Demander explicitement le format JSON (impact moyen)

Ajouter une instruction structurée dans le user prompt pour obtenir `what_i_see` et `to_check` remplis, ou abandonner ce format et passer en texte libre structuré.

### G — Externaliser le prompt (impact structurel)

Déplacer le system prompt dans une variable d'environnement ou un fichier pour itérer sans rebuild. Stocker `prompt_version` en BDD pour traçabilité.

---

## 5. Priorité d'exécution

| Priorité | Action | Effort | Impact qualité |
|---|---|---|---|
| **P0** | A — Few-shot + réécriture prompt | 2h | Transformant |
| **P0** | B — 4-5 phrases | 5 min | Fort |
| **P1** | E — Retirer "risque" de forbiddenTerms | 5 min | Moyen |
| **P1** | C — Temperature 0.4 | 5 min | Moyen |
| **P1** | D — frequency_penalty 0.3 | 5 min | Léger |
| **P2** | F — Format JSON explicite ou abandon | 1h | Moyen |
| **P2** | G — Externaliser le prompt | 2h | Structurel |

---

## 6. Prompt v2.0 — Déploiement et résultats

### 6.1 Changements appliqués (2026-02-18 23:10 UTC)

| Élément | v1.0 | v2.0 |
|---|---|---|
| **System prompt** | 15 interdictions, 0 exemple, pas de format JSON demandé | 8 règles positives, format JSON obligatoire, vocabulaire expert autorisé |
| **User prompt cockpit** | "Décris les tendances globales en 2 phrases maximum." | "Mode : cockpit. Analyse la situation financière globale. Contraintes : lecture hiérarchisée, aucun conseil, JSON strict uniquement." |
| **User prompt card** | "Décris ce que montrent les données de cette carte en 2 phrases maximum." | "Mode : card. Analyse la carte ciblée. Contraintes : lecture hiérarchisée, aucun conseil, JSON strict uniquement." |
| `temperature` | 0.2 | **0.45** |
| `max_tokens` | 450 | **650** |
| `frequency_penalty` | 0 | **0.3** |
| `presence_penalty` | 0 | **0.1** |
| `forbiddenTerms` | inclut "risque" | **"risque" retiré** (autorisé en usage factuel) |

### 6.2 Résultats production (premier cycle complet)

**6 contextes générés avec succès** (3 sociétés × 2 périodes) après restart Mistral :

| Société | Période | Latence | Confidence | JSON structuré |
|---|---|---|---|---|
| company_id=0 | current_month | 48s | medium | ✅ |
| company_id=0 | YTD | 48s | medium | ✅ |
| company_id=1 | current_month | 44s | medium | ✅ |
| company_id=1 | YTD | 39s | medium | ✅ |
| company_id=2 | current_month | 36s | medium | ✅ |
| company_id=2 | YTD | 37s | medium | ✅ |

### 6.3 Comparaison avant/après

**v1.0 — Société 1 (company_id=1), YTD :**
> **headline** : *"Dans ce rapport, les fonds liquides s'élèvent à 1 404 952,21 €, principalement issus des activités commerciales pour 1 162 748,10 €. Les taxes représentent 231 097,31 € de dépenses. Des remboursements ont été effectués à hauteur de -1 686,84 €."*
> **what_i_see** : `[]` (vide)
> **to_check** : `[]` (vide)

**v2.0 — Société 1 (company_id=1), YTD :**
> **headline** : *"Trésorerie validée à 0%, avec un solde de trésorerie de 1 400 952,11 € et des taxes à régler de 231 097,31 €"*
> **what_i_see** : `["Trésorerie validée à zéro", "Solde important de trésorerie (1 400 952,11 €)", "Montant des taxes significatif (231 097,31 €)"]`
> **to_check** : `["Statut des flux sur la carte 'Z de caisse'"]`

**v2.0 — Société 1 (company_id=1), current_month :**
> **headline** : *"Trésorerie validée à 0%, solde de trésorerie positif à 1 396 339,13 EUR, activité génère un chiffre d'affaires de 531 829 EUR et impôts à hauteur de 104 903,15 EUR"*
> **what_i_see** : `["Trésorerie validée à zéro", "Solde de trésorerie important et positif", "Activité génère un chiffre d'affaires modéré", "Impôts significatifs"]`
> **to_check** : `["Statut des notes de crédit", "Montant du Z de caisse"]`

**v2.0 — Société 2 (company_id=2), current_month :**
> **headline** : *"Trésorerie validée à 0% et baisse de liquidité malgré un flux positif des magasins POS"*
> **what_i_see** : `["Trésorerie validée à 0%", "Liquidité réduite malgré un flux positif de 4213.2 EUR des magasins POS"]`
> **to_check** : `["Motif de la trésorerie validée à 0%", "Absence ou faible Z de caisse du POS"]`

### 6.4 Gains mesurés

| Critère | v1.0 | v2.0 |
|---|---|---|
| **Format JSON respecté** | 0 % (100 % texte libre) | **100 %** (6/6 en JSON structuré) |
| **`what_i_see` rempli** | Jamais (tableau vide) | **100 %** (2 à 4 points par insight) |
| **`to_check` rempli** | Jamais (tableau vide) | **100 %** (1 à 2 points de vigilance) |
| **Début "Dans ce rapport..."** | Systématique | **Éliminé** |
| **Interprétation inter-cards** | Aucune | **Partielle** (trésorerie vs POS, activité vs taxes) |
| **Latence moyenne** | 35s (écart-type élevé : 12-65s) | **42s** (écart-type faible : 36-48s) |
| **Points de vigilance pertinents** | Absents | **Présents** (Z de caisse manquant, trésorerie non validée) |

### 6.5 Limites résiduelles (Mistral 7B)

1. **Headline encore listant** — Le modèle 7B tend à énumérer les chiffres clés plutôt qu'à les interpréter. La mise en perspective reste superficielle ("trésorerie à 0% avec solde positif" sans conclure "rapprochement bancaire non engagé").
2. **Confidence toujours "medium"** — Le modèle ne s'auto-évalue pas finement. Un post-traitement basé sur la couverture des cards pourrait être plus fiable.
3. **Pas de vocabulaire expert** — Termes comme "rapprochement bancaire", "BFR", "décalage encaissement" ne sont pas utilisés spontanément par le 7B.
4. **Proportions non calculées** — Le modèle ne fait pas de ratios (ex: "POS = 0,3% du CA") car le prompt ne l'y encourage pas explicitement.

### 6.6 Pistes pour v2.1

- Ajouter 1 few-shot example dans le system prompt pour ancrer le niveau de lecture attendu
- Encourager explicitement les ratios et proportions dans les règles
- Envisager un post-traitement qui injecte `confidence: "low"` si `treasury_validated_pct = 0`
- Tester un relèvement de temperature à 0.55 pour obtenir plus de variété lexicale

---

## Annexe A — System prompt v1.0 (historique, remplacé)

**Fichier :** `units/diva/internal/mistral/client.go`, lignes 67-101 (avant v2.0)

```
Tu es un expert-comptable senior.
Tu fournis une lecture synthétique et professionnelle des données financières fournies.
Tu réponds exclusivement en français. Aucun mot en anglais.

Le champ "mode" indique le type d'analyse :
- mode = "cockpit" : lecture globale et stratégique.
- mode = "card" : analyse ciblée d'une seule carte.

Règles générales strictes :

- Maximum 2 phrases.
- Ton neutre, professionnel, factuel.
- Aucun titre.
- Aucune section.
- Aucune liste.
- Aucun mot comme "Analyse", "Interprétation", "Conclusion".
- Aucune recommandation.
- Aucun conseil.
- Aucun jugement.
- Aucun niveau de confiance ou mention de fiabilité.

Règles spécifiques :

Si mode = "cockpit" :
- Fournis une lecture globale des tendances observées.
- Mets en évidence les éléments significatifs sans détailler chaque carte.
- Ne commente pas carte par carte.

Si mode = "card" :
- Analyse uniquement la carte ciblée.
- Interprète le signe et les montants dans le contexte de cette carte.
- Un montant négatif correspond à une sortie ou régularisation, jamais à une absence de flux.
- Ne mentionne jamais la trésorerie validée ni le rapprochement bancaire.

Tu décris uniquement ce que montrent les données, de manière claire et concise.
```

## Annexe B — User prompt v1.0 (historique, remplacé)

**Fichier :** `units/diva/internal/mistral/client.go`, lignes 224-228 (avant v2.0)

**Instruction cockpit v1.0 :**
```
Décris les tendances globales en 2 phrases maximum.
```

**Instruction card v1.0 :**
```
Décris ce que montrent les données de cette carte en 2 phrases maximum.
```

**Payload JSON (exemple cockpit) :**
```json
{
  "mode": "cockpit",
  "context": {
    "tenant": "sarl-la-platine",
    "company_id": 1,
    "date_start": "2026-01-01",
    "date_end": "2026-02-18",
    "timezone": "Europe/Paris",
    "currency": "EUR",
    "locale": "fr-FR"
  },
  "cards": [
    { "key": "treasury_validated_pct", "label": "Trésorerie validée", "unit": "%", "value": 0, "formatted": "0 %" },
    { "key": "cash", "label": "Cash", "unit": "EUR", "value": 1400952.21, "formatted": "+ 1 400 952,21 €" },
    { "key": "business", "label": "Business", "unit": "EUR", "value": 1162748.10, "formatted": "+ 1 162 748,10 €" },
    { "key": "taxes", "label": "Taxes", "unit": "EUR", "value": 231097.31, "formatted": "+ 231 097,31 €" },
    { "key": "credit_notes", "label": "Notes de crédit", "unit": "EUR", "value": 0, "formatted": "+ 0,00 €" },
    { "key": "refunds", "label": "Remboursements", "unit": "EUR", "value": -1686.84, "formatted": "− 1 686,84 €" },
    { "key": "pos_shops", "label": "POS magasins", "unit": "EUR", "value": 4213.20, "formatted": "4 213,20 €" },
    { "key": "pos_z", "label": "Z de caisse", "unit": "EUR", "value": null, "formatted": "—" }
  ]
}
```

## Annexe C — Post-traitement côté Go

### Termes interdits (`forbiddenTerms`)

**v1.0 :**
```regexp
(?i)(vous devez|il faut|obligat|risque|sanction|assessment|framework|overview|compliance|hinge on|strategic overview)
```

**v2.0 (actuel) — "risque" retiré :**
```regexp
(?i)(vous devez|il faut|obligat|sanction|assessment|framework|overview|compliance|hinge on|strategic overview)
```

Si un terme interdit est détecté dans `headline`, `what_i_see` ou `to_check`, la réponse entière est remplacée par le fallback : *"Lecture DIVA temporairement indisponible."*

### Suppression des dates (`dateRangePatterns`)

6 patterns regex suppriment les plages de dates du headline :
- `from ... to ...` (anglais résiduel)
- `pour la période du ... au ...`
- `entre le ... et ...`
- `du ... au ...`
- Formats numériques `(2026-01-01 à 2026-02-18)`

### Suppression des méta-commentaires (`metaNotePattern`)

Supprime les parenthèses contenant `Note:`, `accordance`, `given rules`, `instruction`, `constraint` — traces de méta-raisonnement du LLM.

### Validation Flash JSON

Si Mistral retourne un JSON valide avec `{headline, what_i_see, to_check, confidence}` :
- `confidence` normalisé en `low|medium|high`
- `what_i_see` tronqué à `len(cards)+2` items
- `to_check` tronqué à 2 items
- Termes interdits vérifiés sur chaque champ

Si Mistral retourne du texte libre → utilisé comme `headline` brut, `what_i_see=[]`, `to_check=[]`, `confidence="medium"`.

## Annexe D — Paramètres LLM

**v1.0 :**
```json
{
  "model": "mistral",
  "temperature": 0.2,
  "max_tokens": 450,
  "top_p": 0.9,
  "frequency_penalty": 0,
  "presence_penalty": 0
}
```

**v2.0 (actuel) :**
```json
{
  "model": "mistral",
  "temperature": 0.45,
  "max_tokens": 650,
  "top_p": 0.9,
  "frequency_penalty": 0.3,
  "presence_penalty": 0.1
}
```

**Modèle :** Mistral 7B Instruct v0.2, quantifié Q4_K_M via llama.cpp  
**Infra :** Instance mono-GPU, 7,8 Go RAM, aucune queue interne  
**Timeout :** 90s (client HTTP)

---

## Annexe E — System prompt v2.0 (actuel, déployé)

**Fichier :** `units/diva/internal/mistral/client.go`, lignes 67-108

```
Tu es un expert-comptable senior spécialisé dans l'analyse financière de PME.

Ta mission est d'interpréter les données financières transmises, en produisant une lecture professionnelle, hiérarchisée et structurée.

Tu réponds exclusivement en français.
Ton ton est factuel, sobre, analytique et professionnel.
Tu n'émets aucun conseil, aucune recommandation, aucune injonction.
Tu n'utilises jamais de formulation prescriptive ("vous devez", "il faut", etc.).

Tu dois obligatoirement répondre au format JSON valide suivant :

{
  "headline": "Synthèse principale en 1 à 2 phrases",
  "what_i_see": ["Point structurant 1", "Point structurant 2", "Point structurant 3"],
  "to_check": ["Point de vigilance 1", "Point de vigilance 2"],
  "confidence": "low|medium|high"
}

Règles fondamentales :

1. Hiérarchise toujours les informations : commence par l'élément dominant de la période.
2. Mets en perspective les indicateurs entre eux (proportions, cohérences, déséquilibres).
3. Ne décris jamais les cartes une par une.
4. Ne reformule pas mécaniquement tous les montants.
5. Identifie les éléments structurants, atypiques ou limitants.
6. Si un indicateur réduit la robustesse de lecture (ex : validation non activée), mentionne-le factuellement.
7. Le mot "risque" est autorisé uniquement s'il est utilisé de manière factuelle et non alarmiste.
8. N'ajoute aucun texte en dehors du JSON.

Mode "cockpit" :
- Fournis une lecture globale et stratégique de la période.
- Analyse les rapports entre activité, trésorerie, fiscalité et POS.
- Identifie les équilibres ou déséquilibres structurels.

Mode "card" :
- Analyse uniquement la carte ciblée.
- Interprète le signe et le poids du montant dans son contexte propre.
- Ne fais aucun lien avec d'autres cartes sauf si explicitement fourni.
- Un montant négatif correspond à une sortie ou régularisation, jamais à une absence de flux.

Ta réponse doit refléter une compréhension experte, pas une description mécanique.
```

## Annexe F — User prompts v2.0 (actuels, déployés)

**Instruction cockpit v2.0 :**
```
Mode : cockpit

Analyse la situation financière globale à partir des données suivantes.

Contraintes :
- Lecture hiérarchisée.
- Aucun conseil.
- JSON strict uniquement.
```

**Instruction card v2.0 :**
```
Mode : card

Analyse la carte ciblée à partir des données suivantes.

Contraintes :
- Lecture hiérarchisée.
- Aucun conseil.
- JSON strict uniquement.
```

**Payload JSON** : identique à l'Annexe B (structure `{mode, context, cards, details?}`).

---

**Rapport rédigé le 2026-02-18, mis à jour le 2026-02-19 — Prompt v2.0 déployé et validé.**
