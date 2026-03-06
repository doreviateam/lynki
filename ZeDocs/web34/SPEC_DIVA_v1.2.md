# SPEC --- DIVA v1.2

## Modèle "Facts Pack" --- Analyse par le code, rédaction par le LLM

**Date :** 2026-03-01\
**Statut :** P1 --- Implémentation prioritaire\
**Auteur :** Dorevia --- Architecture & Produit

------------------------------------------------------------------------

# 1. Vision et Objectif

## 1.1 Contexte

DIVA v1.1 repose sur une analyse partiellement effectuée par le LLM
(Mistral 7B Q4 en local). Cette approche génère : - Latence élevée (CPU
inference) - Timeouts occasionnels - Prompt volumineux (cartes +
règles + insights) - Dépendance forte à la génération longue

## 1.2 Objectif v1.2

Adopter le principe :

> Faire analyser par le code.\
> Faire rédiger par le LLM.

Cela permet : - Réduction drastique des tokens - Stabilité temporelle -
Maintien de la souveraineté IA (local) - Architecture rejouable et
résiliente

------------------------------------------------------------------------

# 2. Architecture cible

Vault → Linky → DIVA (Facts Engine) → Mistral (Rédacteur)

## 2.1 Responsabilités

  Composant           Rôle
  ------------------- ---------------------------
  Vault               Vérité financière scellée
  DIVA Facts Engine   Analyse déterministe
  Mistral             Reformulation stylistique
  degradedFlash       Fallback sans LLM

------------------------------------------------------------------------

# 3. Facts Engine

## 3.1 Nouveau module

Créer :

    units/diva/internal/facts/

Déplacer : - computeInsights() - Logique ratios - Logique priorisation -
Détection anomalies

## 3.2 Structure FactsPack

``` go
type FactsPack struct {
    Mode             string
    Context          ContextMeta
    Facts            []Fact
    DataCompleteness string
}

type Fact struct {
    Priority  int
    Category  string  // governance | treasury | tax | pos | ar
    Message   string
}
```

Contraintes : - 8 à 12 faits maximum - Tri strict par priorité - Aucun
calcul laissé au LLM

------------------------------------------------------------------------

# 4. Payload envoyé à Mistral

Exemple JSON minimal :

``` json
{
  "mode": "short",
  "facts": [
    "POINT DOMINANT: cash 26 838 € — flux sans validation bancaire",
    "Position nette post-taxes: 26 234 €",
    "Inducteur fiscal: 604 € (1,1 % CA)",
    "POS: 7 sessions scellées (100 %)"
  ],
  "data_completeness": "complete"
}
```

Suppression : - Cartes brutes - Valeurs redondantes - Données inutiles
au LLM

------------------------------------------------------------------------

# 5. Nouveau System Prompt

    Tu reformules des faits financiers en langage naturel.
    Réponds STRICTEMENT en JSON :

    {
      "headline": "...",
      "what_i_see": ["...", "...", "..."],
      "to_check": ["..."],
      "confidence": "low|medium|high"
    }

    Règles :
    - Français uniquement
    - Aucun calcul
    - Aucun conseil stratégique
    - Utilise UNIQUEMENT les faits fournis
    - Maximum 3 points dans what_i_see
    - Réponse concise

------------------------------------------------------------------------

# 6. Modes de sortie

## 6.1 Mode Short (Défaut Cockpit)

  Paramètre    Valeur
  ------------ ---------------
  max_tokens   250
  Usage        diva-runner
  Objectif     \< 30-60s CPU

## 6.2 Mode Professional

  Paramètre    Valeur
  ------------ ------------------
  max_tokens   500
  Usage        Analyse manuelle

## 6.3 Mode Deep (Async futur)

  Paramètre    Valeur
  ------------ ----------------
  max_tokens   1024
  Usage        Export Rapport

------------------------------------------------------------------------

# 7. Ajustements Techniques

## 7.1 max_tokens dynamique

``` go
if mode == "short" {
    maxTokens = 250
}
```

## 7.2 Timeout

Conserver : 180 secondes\
Objectif réel : \< 60 secondes

## 7.3 Cache recommandé

Clé :

    tenant + date_range + hash(FactsPack)

------------------------------------------------------------------------

# 8. Mode Dégradé

degradedFlash() devient fallback officiel basé sur FactsPack.

Garantit : - Zéro blocage - Cohérence parfaite - Indépendance LLM

------------------------------------------------------------------------

# 9. KPIs de validation

  KPI                    Cible
  ---------------------- ---------------------
  Latence moyenne        -30 %
  Timeouts               \< 2 %
  CPU load               Réduction mesurable
  Cohérence sémantique   Maintenue

------------------------------------------------------------------------

# 10. Roadmap Implémentation

  Phase                     Durée
  ------------------------- ----------
  Extraction Facts Engine   1 jour
  Simplification prompt     1 jour
  Mode short par défaut     0.5 jour
  Tests comparatifs         1 jour

Total estimé : \~3 jours.

------------------------------------------------------------------------

# 11. Conclusion

DIVA v1.2 clarifie les responsabilités : - Vérité → Vault - Analyse →
Code - Style → LLM

Cette version renforce : - Stabilité - Souveraineté - Scalabilité
multi-tenant - Maîtrise produit

------------------------------------------------------------------------

*Document généré automatiquement --- Dorevia Architecture*
