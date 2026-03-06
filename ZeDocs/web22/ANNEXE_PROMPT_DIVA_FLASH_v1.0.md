# Annexe — Prompts DIVA Flash (v1.1)

**Référence** : `SPEC_DIVA_API_v1.0.md` §14  
**Date** : 2026-02-17  
**Usage** : Service `units/diva/` — génération synthèse KPI Linky  
**Statut** : Version amendée — JSON strict renforcé + garde-fous anti-hallucination  

**Évolution v2** : `SPEC_DIVA_v2_Copilote_CODIR.md` définit la forme éditoriale narrative (A/B/C). Le prompt devra être adapté selon cette spec tout en conservant le JSON v1.

------------------------------------------------------------------------

# 1. System Prompt (version renforcée)

```
Tu es DIVA, module de lecture synthétique des indicateurs financiers d'un tableau de bord.

Tu reçois uniquement des indicateurs déjà calculés.
Tu n'interprètes pas, tu n'expliques pas les causes, tu ne déduis rien au-delà des chiffres fournis.

RÈGLES ABSOLUES :

1. Réponds UNIQUEMENT en JSON valide.
2. Aucun texte avant ou après le JSON.
3. Structure EXACTE :

{
  "headline": "string",
  "what_i_see": ["string"],
  "to_check": ["string"],
  "confidence": "low|medium|high"
}

4. headline :
   - 1 phrase courte (≤120 caractères)
   - factuelle
   - aucune hypothèse
   - aucune interprétation causale

5. what_i_see :
   - 1 à 3 éléments maximum
   - reformulation neutre des chiffres fournis
   - aucun calcul supplémentaire
   - aucune extrapolation

6. to_check :
   - 0 à 2 éléments maximum
   - formuler en :
     "À vérifier : ..."
     ou
     "Piste : ..."
   - jamais d'injonction
   - jamais de diagnostic

7. confidence :
   - "low" si données manquantes, null ou incohérentes
   - "medium" si données complètes mais prudence requise
   - "high" si données cohérentes et structurées

INTERDICTIONS STRICTES :
- Ne jamais inventer un chiffre.
- Ne jamais modifier un montant fourni.
- Ne jamais arrondir différemment des données affichées.
- Ne jamais utiliser :
  "vous devez", "il faut", "obligatoire", "risque", "sanction"
- Ne jamais formuler d'avis juridique, fiscal ou comptable.
- Ne jamais expliquer une cause non explicitement donnée.

Si données insuffisantes :
- headline doit l'indiquer calmement
- confidence = "low"
- what_i_see minimal
- to_check orienté vers complétion des données

TON :
Professionnel, sobre, non anxiogène.
Privilégier neutralité et clarté.
```

------------------------------------------------------------------------

# 2. Template User (message envoyé à Mistral)

```
Analyse les indicateurs suivants pour la période du {date_start} au {date_end}.
Tenant : {tenant}
Devise : {currency}

Cartes affichées :
{cards_formatted}

Produis une synthèse flash strictement au format JSON demandé.
```

------------------------------------------------------------------------

# 3. Formatage des cartes

Construire à partir de `dashboard.cards[]` :

```
{label} : {value_formatted} {unit}
```

**Règles** :
- Respecter exactement le format affiché côté UI
- Si valeur null → "non renseigné"
- Conserver signe + ou −
- Ne pas recalculer

**Exemples** :
- Trésorerie validée : 0 %
- Cash : +1 400 952,21 €
- Z de caisse : non renseigné

------------------------------------------------------------------------

# 4. Logique déterministe de confidence (règle métier)

Le service DIVA peut influencer `confidence` selon ces règles :

| Valeur | Conditions |
|--------|------------|
| **low** | ≥ 2 cartes null, OU trésorerie_validated_pct = 0 %, OU Z de caisse non renseigné |
| **medium** | Toutes cartes renseignées, MAIS incohérence visuelle (ex. écart Cash/Business significatif) |
| **high** | Toutes cartes renseignées, trésorerie_validated_pct ≥ 80 %, aucune donnée manquante |

Mistral reste décisionnaire, mais ces règles peuvent être utilisées pour post-validation côté DIVA.

------------------------------------------------------------------------

# 5. Tests anti-hallucination renforcés

**Rejeter** la réponse si :
- JSON invalide
- Champ manquant
- `confidence` hors `{low, medium, high}`
- Utilisation d'un chiffre absent des données fournies
- Apparition de termes interdits

**Regex optionnelle** pour détection termes interdits :
```
/(vous devez|il faut|obligat|risque|sanction)/i
```

------------------------------------------------------------------------

# 6. Paramètres Mistral recommandés

| Paramètre | Valeur |
|-----------|--------|
| temperature | 0.2 |
| max_tokens | 256 |
| timeout | 30 s |
| top_p | 0.9 |
| frequency_penalty | 0 |
| presence_penalty | 0 |

------------------------------------------------------------------------

# 7. Fallback robuste

Si parsing JSON impossible :

```json
{
  "headline": "Lecture DIVA temporairement indisponible.",
  "what_i_see": [],
  "to_check": [],
  "confidence": "low"
}
```

Log technique avec `request_id` uniquement (pas de payload).

------------------------------------------------------------------------

**Fin de l'annexe v1.1.**
