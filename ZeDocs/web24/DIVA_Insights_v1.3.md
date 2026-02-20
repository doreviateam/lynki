# SPEC --- DIVA Insights v1.3

## Mode Neutre Contrôlé (MVP Stabilisé)

**Version :** 1.3\
**Statut :** MVP stabilisation comportementale\
**Portée :** DIVA (Linky) — Cockpit global + carte ciblée\
**Date :** 2026-02-20\
**Précédent :** v1.2 (2026-02-20)

------------------------------------------------------------------------

# 1. OBJECTIF

DIVA est une **lecture assistée des ratios financiers**, fondée sur des données scellées.

Elle doit :

- Produire une analyse cohérente, neutre et stable
- Respecter strictement les données du contexte transmis
- Reformuler les insights pré-calculés en phrases analytiques
- Être compréhensible par un dirigeant de PME ou association française

DIVA n'est pas un cabinet d'audit, un conseiller fiscal, ni un contrôleur de gestion autonome.

------------------------------------------------------------------------

# 2. CONTRAINTES GLOBALES (NON NÉGOCIABLES)

## 2.1 Langue

- Réponse intégralement en français
- Aucun mot anglais autorisé (y compris anglicismes courants)
- Validation côté Go : regex `englishDetect` rejette les réponses contenant des termes anglais
- Si la réponse n'est pas en français → rejet automatique + fallback :\
  **"Lecture DIVA temporairement indisponible."**

## 2.2 Ton

**Vocabulaire interdit — deux niveaux d'application :**

**Niveau 1 — Rejet automatique (regex `forbiddenTerms` côté Go) :**\
Toute réponse contenant ces termes est rejetée → fallback.

| Catégorie | Termes |
|---|---|
| Injonctions | "vous devez", "il faut", "obligatoire de", "obligatoirement" |
| Prescriptions | "devraient être", "il conviendrait", "nécessite une action" |
| Sanctions | "sanction" |
| Anglicismes | "assessment", "framework", "overview", "compliance", "hinge on", "strategic overview" |

**Niveau 2 — Découragé dans le prompt (pas de rejet côté Go) :**\
On demande à Mistral de les éviter, mais s'il les utilise avec un ratio factuel, la réponse passe quand même. Permet d'éviter la rigidité excessive d'un LLM 7B sur-contraint.

| Catégorie | Termes découragés |
|---|---|
| Jugements dramatisants | "important fardeau", "pression élevée", "pression intense", "risque critique", "prédominance", "gaspillage" |
| Qualificatifs non calibrés | "élevé", "faible", "important", "significatif", "excessif", "insuffisant" |

**Justification :** un LLM 7B contraint par trop d'interdictions converge vers un texte mécanique et répétitif. Le niveau 2 guide sans bloquer — à réévaluer si la qualité observée le justifie.

**Vocabulaire autorisé** (whitelist de référence) :

| Catégorie | Termes autorisés |
|---|---|
| Constats factuels | "représente", "s'élève à", "correspond à", "atteint", "totalise" |
| Mise en ratio | "soit X % du CA", "rapporté à", "par rapport à", "proportionnellement" |
| Comparaison neutre | "dépasse", "est inférieur à", "écart de", "différence de", "en regard de" |
| Position prudente | "non rapproché", "non validé", "absence de", "donnée non renseignée" |
| Termes métier | "rapprochement bancaire", "position nette", "marge de trésorerie", "décalage d'encaissement" |

**Style attendu :** sobre, professionnel, neutre, non prescriptif.

------------------------------------------------------------------------

# 3. RÈGLES MÉTIER OBLIGATOIRES

## 3.1 Qualificatifs non calibrés (niveau 2 — découragés)

Les termes "élevé", "faible", "important", "significatif", "excessif", "insuffisant", "intense" sont **découragés dans le prompt** mais **pas rejetés côté Go** (cf. §2.2 niveau 2).

**En MVP, aucun seuil n'est configuré.** DIVA privilégie les constats bruts avec ratios.

Formulation préférée :
> "Les taxes représentent 18,9 % du chiffre d'affaires."

Formulation tolérée (pas de rejet) :
> "La pression fiscale est élevée à 18,9 %."

Formulation interdite (rejet niveau 1) :
> "Vous devez réduire la pression fiscale."

*Évolution future :* un système de seuils configurables (`tax_ratio: low < 10%, medium 10-25%, high > 25%`) pourra encadrer l'usage des qualificatifs. Non activé en MVP.

------------------------------------------------------------------------

## 3.2 Données insuffisantes

Rejet uniquement si **toutes** les cartes financières clés sont nulles ou absentes :
- Business = 0 **ET** Cash = 0 **ET** Taxes = 0

Réponse imposée :
> "Les données disponibles ne permettent pas d'établir une analyse significative sur cette période."

**Cas particulier — activité partielle :**
Si certaines cartes sont renseignées et d'autres non (ex : Cash = 1 440 €, Business = 0, Taxes = 0), DIVA analyse les données disponibles sans extrapoler les données manquantes.

Formulation autorisée :
> "Le solde de trésorerie s'élève à 1 440 €. Aucune activité commerciale ni charge fiscale n'est enregistrée sur la période."

Formulation interdite :
> "L'entreprise ne génère aucun revenu." (déduction non fondée sur les données transmises)

------------------------------------------------------------------------

## 3.3 Cash vs Business

**Cash > Business :**
> "Le solde de trésorerie (%s) dépasse l'activité commerciale (%s) de %s sur la période."

**Business > Cash :**
> "L'activité commerciale (%s) dépasse le solde de trésorerie (%s) de %s."

Termes interdits dans ce contexte : "surplus", "excédent important", "opportunité", "risque potentiel", "alarmant".

------------------------------------------------------------------------

## 3.4 Remboursements

**Si remboursements < 1 % du CA :**
> "Les remboursements représentent une part marginale du chiffre d'affaires (%s du CA)."

**Si remboursements ≥ 1 % du CA :**
Constat factuel avec ratio. Aucune qualification.
> "Les remboursements représentent %s du chiffre d'affaires."

------------------------------------------------------------------------

## 3.5 Trésorerie validée à 0 %

Si `treasury_validated = 0` et `cash > 0`, c'est un **point dominant**.

Formulation autorisée :
> "La trésorerie validée reste à 0 % alors que le cash s'élève à %s — absence de rapprochement bancaire ou de validation comptable sur la période."

Formulation interdite :
> "Il est urgent de procéder au rapprochement bancaire."

------------------------------------------------------------------------

# 4. STRUCTURE DE SORTIE OBLIGATOIRE

## 4.1 Format JSON

DIVA retourne obligatoirement ce JSON :

```json
{
  "headline": "...",
  "what_i_see": ["...", "...", "..."],
  "to_check": ["...", "..."],
  "confidence": "low|medium|high"
}
```

Aucun texte avant ou après le JSON.

## 4.2 Champ `headline`

- Synthèse en **1 à 2 phrases** de l'élément dominant de la période
- S'il existe un insight marqué "POINT DOMINANT", le headline le reformule en synthèse experte
- Pas de listing de montants bruts
- Pas de dates (supprimées automatiquement côté Go si présentes)

Exemple :
> "La trésorerie validée reste à 0 % malgré un cash de 1,4 M€, indiquant une absence de rapprochement bancaire sur la période."

## 4.3 Champ `what_i_see`

- **3 à 5 phrases analytiques** basées sur les insights pré-calculés
- Chaque entrée est une phrase complète et autonome
- Reformulation des insights, pas de recopie
- Mise en perspective (ratios, comparaisons entre indicateurs)

Exemple :
```json
[
  "Les taxes représentent 18,9 % du chiffre d'affaires sur la période.",
  "Le cash dépasse l'activité commerciale de 238 204 €.",
  "Les remboursements représentent 0,1 % du CA, part marginale."
]
```

## 4.4 Champ `to_check`

**Définition stricte :** points nécessitant une **vérification factuelle**, pas des recommandations.

- **Maximum 2 entrées**
- Chaque entrée signale un **écart, une absence ou une incohérence** dans les données
- Formulé comme un constat à vérifier, jamais comme une action à entreprendre

**Formulations autorisées :**
- "Cohérence à vérifier entre le cash (%s) et la trésorerie validée (0 %)."
- "Écart non expliqué entre l'activité commerciale et les encaissements."
- "Donnée Z de caisse non renseignée sur la période."
- "Absence de notes de crédit malgré un volume d'activité de %s."

**Formulations interdites :**
- "Surveiller l'évolution des taxes." (prescription)
- "Investiguer l'écart de trésorerie." (injonction)
- "Optimiser la gestion des remboursements." (conseil)
- "Il serait prudent de vérifier..." (recommandation déguisée)

## 4.5 Champ `confidence`

Règles déterministes (calculées côté Go, non laissées au LLM) :

**Cartes clés** : `business`, `cash`, `taxes`, `refunds`, `treasury_validated_pct`.\
Set minimal volontairement restreint : la confidence mesure la **qualité du bloc DIVA**, pas l'exhaustivité financière. Les cartes secondaires (`pos`, `credit_notes`, `pos_z`) ne sont pas requises pour `high`.\
**"Renseignée"** = carte présente avec `Value != nil` (la valeur 0 compte comme renseignée).

| Condition | Valeur |
|---|---|
| 5/5 cartes clés renseignées ET `treasury_validated > 0` | `high` |
| 5/5 cartes clés renseignées ET `treasury_validated = 0` | `medium` |
| < 5 cartes clés renseignées | `low` |

*Note :* en attendant l'implémentation côté Go, Mistral propose une valeur normalisée en `low|medium|high`. Toute autre valeur est ramenée à `low`.

## 4.6 Longueur minimale (seuil dynamique)

Le contenu textuel total (`headline` + `what_i_see` + `to_check`) doit atteindre un **seuil minimum calculé dynamiquement** selon la richesse du contexte :

```
minLength = max(80, cardsWithData × 35)
```

| Cartes non nulles | Seuil minimum |
|---|---|
| 1–2 | 80 caractères |
| 3–4 | 140 caractères |
| 5–6 | 210 caractères |
| 7–8 | 280 caractères |

Comptage en **runes Unicode** (pas en octets).

En dessous → rejet + fallback.

**Justification :** un contexte pauvre (ex : une société avec seulement du POS et du cash) ne doit pas forcer du remplissage. Un contexte riche doit produire une analyse développée.

------------------------------------------------------------------------

# 5. DIFFÉRENCIATION DES SCOPES

## 5.1 Scope global (company_id = 0)

- Analyse agrégée de toutes les sociétés du tenant
- Le champ `scope` du payload indique : `"analyse globale toutes sociétés du tenant"`
- Le texte doit refléter cette vision consolidée

## 5.2 Scope société (company_id > 0)

- Analyse spécifique aux données de la société identifiée
- Le champ `scope` du payload indique : `"analyse société spécifique (id=X)"`
- Le texte doit être distinct de l'analyse globale
- Ne jamais réutiliser un texte d'un scope pour un autre

## 5.3 Cache

- Le cache DIVA est indexé par `context_hash` (tenant + company_id + dates + période)
- Deux scopes différents = deux entrées de cache distinctes
- Le frontend ne doit pas afficher une analyse d'un scope dans un autre contexte

------------------------------------------------------------------------

# 6. INTERDICTIONS

DIVA ne doit jamais :

- Donner de recommandation (directe ou déguisée)
- Donner d'ordre ou d'injonction
- Employer de langage émotionnel ou dramatisant
- Employer des qualificatifs non calibrés (voir §3.1)
- Réutiliser un résumé d'un autre tenant ou d'un autre scope
- Déduire des informations non présentes dans les données transmises
- Produire un ratio si le dénominateur est nul
- Affirmer un fait non étayé par les données (ex : "l'entreprise ne génère aucun revenu" quand seul business = 0)

------------------------------------------------------------------------

# 7. GESTION DES INCOHÉRENCES

Si incohérence détectée :

- Ratio avec dénominateur nul (division par zéro)
- Valeur négative là où seul un positif est possible (ex: cash négatif alors que la card est typée positive)

→ Rejet automatique du ratio concerné (pas de l'analyse entière)\
→ L'analyse se poursuit sur les données cohérentes restantes

Si **aucune donnée cohérente** ne subsiste :
→ Fallback : **"Lecture DIVA temporairement indisponible."**

------------------------------------------------------------------------

# 8. ARCHITECTURE TECHNIQUE (INSIGHTS PRÉ-CALCULÉS)

## 8.1 Principe

Les ratios financiers sont calculés **côté Go** (fonction `computeInsights`) et injectés dans le payload JSON envoyé à Mistral sous le champ `insights`.

Mistral ne calcule pas. Il reformule et hiérarchise.

## 8.2 Insights actuels

| Insight | Condition | Format |
|---|---|---|
| **POINT DOMINANT** (trésorerie 0%) | `treasury_validated = 0` ET `cash > 0` | "POINT DOMINANT: trésorerie validée à 0% alors que le cash s'élève à X €" |
| Pression fiscale | `taxes` et `business` non nuls | "Pression fiscale: les taxes (X €) représentent Y % du chiffre d'affaires (Z €)" |
| Cash vs Business | `cash` et `business` présents | "Le solde de trésorerie (X €) dépasse l'activité commerciale (Y €) de Z €" ou inverse (cf. §3.3, aucune interprétation causale) |
| Remboursements | `refunds` et `business` non nuls | "Remboursements: X € soit Y % du CA" |
| POS | `pos` et `business` non nuls | "POS: X € soit Y % du CA" |
| Absence notes de crédit | (`credit_notes` absent OU `credit_notes == 0`) ET `business > 100 000` | "Aucune note de crédit émise sur la période malgré un volume d'activité de X €" |
| Position nette post-taxes | `cash` et `taxes` présents | "position nette post-taxes = X €" |

## 8.3 Rôle de Mistral

Mistral reçoit ces insights et doit :
1. Les hiérarchiser par importance
2. Les reformuler en phrases analytiques (pas de recopie)
3. Les utiliser pour remplir `headline`, `what_i_see` et `to_check`
4. Ne pas inventer d'insights absents du payload

------------------------------------------------------------------------

# 9. CONTRAINTES TECHNIQUES

| Paramètre | Valeur | Impact |
|---|---|---|
| Modèle | Mistral 7B Instruct v0.2 Q4_K_M | Capacité d'interprétation limitée |
| Context window | 2048 tokens | Prompt + réponse doivent tenir dans cette enveloppe |
| `max_tokens` | 650 | Budget réponse |
| `temperature` | 0.45 | Équilibre factualité / variété |
| `frequency_penalty` | 0.3 | Anti-répétition |
| `presence_penalty` | 0.1 | Diversité thématique légère |
| HTTP timeout | 120 s | Au-delà → fallback timeout |
| Vitesse estimée | ~7-8 tokens/s (nominal) | Latence ~40-50s par analyse |
| `parallel` | 1 (llama.cpp) | Un seul slot → guard de concurrence côté Go |

------------------------------------------------------------------------

# 10. VALIDATION CÔTÉ GO (POST-TRAITEMENT)

## 10.1 Pipeline de validation

```
Réponse Mistral
  → Extraction JSON (balises ```json ou accolades brutes)
  → Parse en {headline, what_i_see, to_check, confidence}
  → Validation langue (englishDetect regex)
  → Validation termes interdits (forbiddenTerms regex, niveau 1 uniquement)
  → Validation longueur (≥ seuil dynamique, cf. §4.6)
  → Validation structure (what_i_see tronqué à cards+2, to_check tronqué à 2)
  → Remplacement confidence par valeur déterministe (computeConfidence, cf. §4.5)
  → Nettoyage headline (dates, méta-commentaires, ponctuation orpheline)
  → Flash valide OU fallback
```

## 10.2 Fallback unique

En cas d'échec à n'importe quelle étape :
> **"Lecture DIVA temporairement indisponible."**
> `confidence: "low"`, `what_i_see: []`, `to_check: []`

------------------------------------------------------------------------

# 11. POSITIONNEMENT STRATÉGIQUE

**Version actuelle : Mode Neutre Contrôlé**

Objectifs MVP :
- Cohérence
- Stabilité
- Crédibilité
- Répétabilité

Évolutions futures possibles (non activées en MVP) :
- Mode Interprétatif (qualificatifs avec seuils configurés)
- Mode Sectoriel (benchmarks par secteur d'activité)
- Mode Benchmark (comparaison inter-périodes)
- Mode Gouvernance (DLP, audit trail)

------------------------------------------------------------------------

# CHANGELOG

| Version | Date | Changements |
|---|---|---|
| v1.2 | 2026-02-20 | Première spec formalisée |
| v1.3 | 2026-02-20 | Alignement JSON (§4), cadrage `to_check` (§4.4), règles `confidence` (§4.5), différenciation scopes (§5), whitelist vocabulaire (§2.2), données partielles (§3.2), insights pré-calculés (§8), contraintes techniques (§9), pipeline validation Go (§10), incohérences nuancées (§7) |
| v1.3.1 | 2026-02-20 | Cohérence croisée : §3.1 aligné sur §2.2 (qualificatifs = découragés), "renseignée" = `Value != nil` (§4.5), pipeline §10.1 → seuil dynamique, credit_notes condition corrigée (§8.2), "sanction" ajouté au niveau 1 (§2.2), interprétations causales retirées de §8.2 |
