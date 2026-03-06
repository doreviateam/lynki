# SPEC — Complétude avant affichage

**Version :** 1.1  
**Date :** 2026-03-03  
**Statut :** Projeté  
**Périmètre :** Linky (cockpit financier)  
**Persona cible :** CFO (ex. Véréna, La Platine)  
**Évolution v1.0 → v1.1 :** Clarification sémantique (complétude = Vault a ingéré/scellé/validé, pas « endpoints ERP ont répondu ») ; matérialisation côté Vault (Linky lit un état stable) ; expected_count interne au Vault (pas de requête live ERP) ; complétude par scope (tenant + société + période) ; progression UX ; prérequis budget 5 s.

---

## 1. Position produit

### 1.1 Contexte

Dans un système fondé sur des données probantes, les cartes ne doivent jamais précéder la complétude des preuves.

Les cartes ne sont pas des estimations.  
Elles sont la conséquence d'un socle validé.

### 1.2 Formulation synthétique

> **Dans Dorevia, les cartes financières ne sont calculées et affichées que lorsque la complétude des preuves pour le périmètre sélectionné est validée.**  
> **À défaut, le système indique clairement que la synchronisation est en cours.**

### 1.3 Point de vue persona (CFO)

*Je ne cherche pas une tendance. Je cherche une base de décision.*

*Je veux savoir une chose simple : est-ce que les chiffres que je vois représentent la réalité complète de ma période ?*

Si toutes les preuves ne sont pas remontées et scellées, les cartes ne reflètent pas la réalité — elles reflètent un état intermédiaire. En finance, un état intermédiaire peut conduire à une mauvaise décision.

---

## 2. Règle produit

| Élément | Définition |
|--------|------------|
| **Les cartes** | Conséquence — rendu des données |
| **Les preuves** | Condition — socle validé |
| **Invariant** | Sans complétude des preuves, il n'y a pas d'indicateur stratégique |

### 2.5 Déblocage différé Trésorerie (Option C)

**Règle formelle :** Après un délai de 5 secondes en état incomplet, la carte Trésorerie (position à date) est débloquée en priorité. Les autres cartes restent bloquées.

```
// Logique des 3 états
if (complete && !loading && !error) {
  mode = "FULL"
} else if (!complete && elapsedTime <= 5000) {
  mode = "BLOCKED"
} else if (!complete && elapsedTime > 5000 && treasuryDataAvailable) {
  mode = "TREASURY_ONLY"
} else {
  mode = "BLOCKED"
}
```

**Condition stricte — Erreur fetch totale :** Si erreur fetch totale (snapshot indisponible, 503, timeout) → pas de Trésorerie. Option C ne s'active **que** si `dashboard-metrics` a répondu (données Trésorerie disponibles) mais `sealed_count_complete === false`. Protège contre l'affichage de données stale.

**Conditions strictes (à ne pas simplifier) :**

| Condition | Règle |
|-----------|-------|
| **Badge** | Pas de badge vert — badge masqué ou neutre |
| **Mention** | Mention discrète « Consolidation globale en cours » visible à proximité de la carte Trésorerie |
| **Autres cartes** | Restent bloquées (SyncInProgress pour le reste) |
| **Transition** | Si `sealed_count_complete` devient `true` → cockpit complet affiché sans refresh manuel |

**Justification :** Le délai de 5 secondes évite un affichage prématuré. La carte Trésorerie position (rapprochement bancaire) est prioritaire pour le pilotage quotidien ; elle peut être affichée alors que les flux ventes/achats/POS sont encore en consolidation.

**Constante technique :** `TREASURY_UNBLOCK_AFTER_MS = 5000` — ne pas modifier sans accord produit.

---

## 3. Définition de la complétude

### 3.1 Sémantique — Ce que la complétude signifie

**La complétude ne signifie pas :** Les endpoints ERP ont répondu.

**La complétude signifie :** Le Vault a ingéré, scellé et validé l'ensemble des preuves attendues pour le périmètre sélectionné.

Le centre de gravité est le **Vault**. Ce n'est pas une question de disponibilité des APIs. C'est une question d'état du Vault : a-t-il terminé son travail sur la période ?

### 3.2 Sources constitutives

| Source | Objet concerné | État attendu |
|--------|----------------|--------------|
| Ventes | Factures clients | Ingrées, scellées, validées par le Vault |
| Achats | Factures fournisseurs | Idem |
| Encaissements | Paiements entrants | Idem |
| Décaissements | Paiements sortants | Idem |
| POS | Sessions caisse | Idem |

### 3.3 Critère de validation (complétude probante)

```
sealed_count_complete = true
  ⟺
  Pour chaque source S ∈ { sales, purchases, paymentsIn, paymentsOut, pos } :
    le Vault a ingéré, scellé et validé l'ensemble des preuves attendues pour S sur le scope (tenant, société, période)
```

**Vérification opérationnelle :** Pour savoir si le Vault a terminé son travail, on compare le nombre de preuves scellées au nombre attendu :

```
∀ source S : vault_sealed_count(S, scope) == expected_count(S, scope)
```

**Origine de `expected_count` :** Donnée **interne au Vault**. Pas de requête live ERP — sinon on réintroduit latence, instabilité, dépendance externe et risque de timeout.

`expected_count` doit provenir de : DVIG (watermark), curseur d'ingestion, ou compteur matérialisé côté Vault. Idéal : nombre d'objets déclarés par le connecteur comme devant exister pour le scope.

### 3.4 Prérequis technique (insuffisant pour la complétude)

Pour évaluer la complétude, Linky interroge le Vault (endpoints `/ui/aggregations/*`). Si ces endpoints ne répondent pas ou sont en erreur, on ne peut pas conclure — donc `sealed_count_complete = false`.

**Mais :** Le fait que les endpoints Vault aient répondu ne suffit pas. La complétude est l'état du Vault (ingestion + scellement + validation), pas la disponibilité du service.

### 3.5 Référence technique actuelle (écart v1.1)

L'implémentation actuelle de `GET /api/dashboard-metrics` ne vérifie que la **réponse des endpoints Vault** :
- `sealed_count_complete` = les 5 endpoints ont répondu

**Évolution à prévoir :** Le Vault doit exposer une vérification de complétude réelle : pour chaque source, `vault_sealed_count` vs `expected_count`. La complétude est une propriété du Vault, pas de la couche API.

### 3.6 Architecture : matérialisation côté Vault

**La complétude est recalculée et matérialisée par le Vault à chaque nouvel événement scellé.**

Linky ne déclenche pas de calcul de complétude ; il ne fait que lire un état matérialisé, stable et horodaté.

**Conséquence :** Les compteurs et badges ne varient que lorsqu’un événement réel modifie le socle de preuves. Pas de saut à chaque rafraîchissement — stabilité garantie tant que les preuves n’ont pas changé.

### 3.7 Scope et indépendance

La complétude est évaluée indépendamment pour chaque scope (tenant + société + période).

**La complétude d'un scope n'implique pas celle d'un autre.** Ce découpage explicite évite les ambiguïtés futures (mélange de périodes, agrégats partiels).

### 3.8 Architecture logique (vue macro)

```
ERP → DVIG → Vault (preuves scellées)
                  ↓
          expected_count (interne)
                  ↓
       completeness_snapshot(scope)
                  ↓
               Linky
                  ↓
              Cartes
```

Cette couche intermédiaire `completeness_snapshot(scope)` rend le système stable, audit-compatible, testable et déterministe.

**Timeout 5 secondes :** Linky appelle le snapshot avec un timeout de 5 s. Si la récupération dépasse ce délai, l'état reste « loading » et les cartes restent bloquées (§5.1).

---

## 4. Comportement attendu

### 4.1 Complétude validée (`sealed_count_complete === true`)

| Élément | Comportement |
|---------|--------------|
| **Badge** | Affichage « X preuves scellées » (vert) |
| **Cartes** | Calcul et affichage des 8 KPIs (Trésorerie, Cash, Business, etc.) |
| **Grille** | Toutes les cartes accessibles |
| **DIVA** | Analyse disponible |

### 4.2 Complétude non validée (`sealed_count_complete === false`)

| Élément | Comportement |
|---------|--------------|
| **Badge** | Non affiché ou indicateur neutre |
| **Cartes** | **Non affichées** — aucun KPI stratégique |
| **Zone principale** | Message + progression (cf. §6.1) |
| **DIVA** | Non déclenchée (pas de base complète) |

### 4.3 États intermédiaires

| Situation | Affichage |
|-----------|-----------|
| Chargement initial | « Synchronisation des preuves en cours… » + progression (cf. §6.1) |
| Retry en cours | Idem |
| Erreur irrécupérable | « Impossible de garantir la complétude des données. Réessayez plus tard. » |

### 4.4 Choix produit : blocage global

**Si une des 5 sources n'est pas complète → aucune carte affichée.**

C'est un choix exigeant. Exemple : POS retardé, ventes OK, paiements OK, trésorerie OK — le cockpit reste bloqué.

**Position assumée :** Rigueur > disponibilité partielle. Cohérent avec l'ADN Dorevia. Pas d'affichage partiel, pas de vérité intermédiaire.

---

## 5. Contraintes techniques

### 5.1 Budget temps (< 5 s)

**Règle gouvernance :** Si la récupération du snapshot dépasse 5 secondes, l'état est considéré comme « loading » et les cartes restent bloquées. Aucune carte affichée tant que la réponse n'est pas reçue ou que le timeout n'est pas atteint.

| Contrainte | Valeur | Justification |
|------------|--------|---------------|
| Complétude garantie | < 5 s | L'utilisateur ne doit pas rafraîchir manuellement |
| Retry backend | 2 tours | Tour 1 : 5 sources en parallèle ; Tour 2 : sources en échec uniquement |
| Retry frontend | 1 fois après 2 s | Si `sealed_count_complete === false` au premier fetch |

### 5.2 Prérequis pour atteindre < 5 s

La contrainte < 5 s est réaliste **uniquement si** :

| Prérequis | Rôle |
|-----------|------|
| **Complétude sur événement** | La complétude est recalculée et matérialisée à chaque événement scellé, pas à chaque requête. Linky lit un état déjà calculé. |
| **expected_count déjà connu** | `expected_count` est une donnée interne au Vault (DVIG, curseur d'ingestion, compteur matérialisé). Pas de requête live ERP au moment du fetch. |
| **Agrégations indexées** | Les queries Vault par scope (tenant, société, période) sont performantes. |
| **Sources parallélisées** | Les 5 sources sont interrogées en parallèle, pas séquentiellement. |

Si ces prérequis ne sont pas assurés, le budget 5 s devient un combat.

### 5.3 Antipatterns à éviter

- Indicateur qui évolue à chaque rafraîchissement
- Compteur dont la portée est incompréhensible
- Carte affichée avec valeur « 100 % » alors que le socle n'est pas garanti
- Affichage de cartes avec données partielles

---

## 6. Interface utilisateur

### 6.1 État « Synchronisation en cours »

- **Texte principal :** « Synchronisation des preuves en cours… »
- **Ton :** Neutre, pas d'alarme
- **Progression (recommandé) :** Un indicateur de progression rassure cognitivement le CFO sans afficher de KPI :
  - Ex. : « 223 / 516 preuves scellées »
  - Pas un pourcentage stratégique.
  - Pas une carte.
  - Juste une progression — réduit l'angoisse de l'attente.
- **Optionnel :** Spinner discret

### 6.2 Transition vers affichage des cartes

- Dès que `sealed_count_complete === true`, affichage immédiat des cartes
- Pas de délai artificiel
- Le badge « X preuves scellées » peut apparaître en même temps que les cartes

### 6.3 Erreur durable

- Si après retries la complétude n'est toujours pas atteinte :
  - Message : « Impossible de garantir la complétude des données. Réessayez plus tard. »
  - Bouton « Réessayer » pour relancer le fetch

### 6.4 Tests d'acceptabilité — Sprint 1 (UX blocage)

**Objectif :** Garantir qu'aucune donnée partielle n'est visible tant que la complétude n'est pas validée.

```gherkin
Feature: Blocage strict — aucune carte si incomplet

  Scenario: AT1 — Blocage strict si incomplet
    Given sealed_count_complete est false
    And au moins une des 5 sources (sales, purchases, paymentsIn, paymentsOut, pos) a échoué ou timeout
    When l'utilisateur ouvre le Dashboard
    Then aucune carte n'est visible
    And IconGrid n'est pas visible
    And les cartes détaillées (Trésorerie, Cash, Business, POS, etc.) ne sont pas visibles
    And DIVA et DecisionsBlock ne sont pas visibles
    And l'écran SyncInProgress est visible
    And le message "Synchronisation des preuves en cours…" est affiché
    And la progression affiche "sealed_count / —"

  Scenario: AT2 — Blocage strict pendant loading
    Given metricsLoading est true
    When l'utilisateur ouvre le Dashboard
    Then aucune carte n'est visible
    And SyncInProgress est visible
    And un spinner est affiché si activé

  Scenario: AT3 — Blocage strict en cas d'erreur réseau
    Given une erreur fetch (503, offline, CORS, etc.)
    And metricsError est true
    When l'utilisateur ouvre le Dashboard
    Then aucune carte n'est visible
    And SyncInProgress est visible
    And le ton est neutre (pas d'alerte rouge)
    And le bouton "Réessayer" est visible si attemptCount >= 1

  Scenario: AT4 — "Réessayer" relance un fetch
    Given SyncInProgress est affiché
    And attemptCount >= 1
    When l'utilisateur clique sur "Réessayer"
    Then onRefreshMetrics est déclenché
    And metricsLoading passe à true pendant le fetch
    And en cas de succès les cartes sont affichées
    And en cas d'échec SyncInProgress reste visible et attemptCount augmente

  Scenario: AT5 — Badge neutre (anti-vert trompeur)
    Given sealed_count_complete est false OU metricsLoading OU metricsError
    When l'utilisateur ouvre le Dashboard
    Then IntegrityBadge est absent ou neutre
    And aucun chiffre partiel n'est affiché (pas de "X preuves" si incomplet)

  Scenario: AT6 — Cache scope (anti-stale)
    Given le Dashboard est ouvert sur le scope A (tenant, société, période)
    When l'utilisateur change de scope puis revient au scope A
    Then le cache est invalidé au changement de scope
    And il n'y a pas d'affichage "ancien" (pas de flash de cartes)
    And SyncInProgress reste visible jusqu'au fetch du scope courant

  Scenario: AT7 — Happy path : complétude OK
    Given sealed_count_complete est true
    And metricsLoading est false
    And metricsError est false
    When l'utilisateur ouvre le Dashboard
    Then les cartes sont visibles
    And le badge est vert
    And SyncInProgress n'est pas visible

  Scenario: AT8 — Transition complète sans rechargement
    Given au départ sealed_count_complete est false
    And SyncInProgress est affiché
    When le retry automatique ou manuel aboutit à sealed_count_complete true
    Then la transition SyncInProgress vers les cartes s'effectue sans refresh manuel de la page
```

### 6.5 Tests d'acceptabilité — Sprint 2 (complétude probante)

```gherkin
Feature: Complétude probante — stabilité et matérialisation

  Scenario: AT9 — Stabilité au refresh (pas de variation fantôme)
    Given aucun nouvel événement scellé n'a eu lieu
    When l'utilisateur rafraîchit le dashboard 5 fois
    Then sealed_count reste identique à chaque refresh

  Scenario: AT10 — Matérialisation à l'événement
    Given un snapshot de complétude connu (X / Y)
    When un document est scellé (invoice ou payment)
    Then le snapshot est mis à jour (X+1 / Y) dans un délai <= 1 min
    And sans scellage aucune variation n'apparaît au refresh

  Scenario: AT11 — Progression X / Y quand expected_count disponible
    Given expected_count est renseigné pour le scope
    When l'utilisateur ouvre le Dashboard
    Then l'affichage montre "X / Y preuves scellées"
    And pas "X / —"

  Scenario: AT12 — Fallback si endpoint snapshot indisponible
    Given l'endpoint /ui/completeness-snapshot est indisponible
    When l'utilisateur ouvre le Dashboard
    Then le système fait fallback vers la logique actuelle (5 endpoints)
    And le blocage strict reste actif tant que non complet
```

---

## 7. Compatibilité avec les specs existantes

### 7.1 Carte Paiements (SPEC_CARTE_PAIEMENTS)

La Carte Paiements a son propre contrôle de complétude (ERP vs Vault).  
**Hiérarchie :** La présente spec (complétude probante des 5 sources) est un **préalable**. Si `sealed_count_complete === false`, aucune carte n'est affichée. Si `sealed_count_complete === true`, la Carte Paiements applique ensuite ses règles propres.

### 7.2 Autres cartes

Trésorerie, Cash, Business, Taxes, Notes de crédit, Remboursements, POS, Z de caisse : toutes soumises à la règle « complétude avant affichage ».

---

## 8. Résumé exécutif

| Question | Réponse |
|----------|---------|
| **Quand afficher les cartes ?** | Uniquement lorsque `sealed_count_complete === true` (complétude probante) |
| **Que montrer sinon ?** | « Synchronisation des preuves en cours… » + progression (ex. 223 / 516) |
| **Complétude = ?** | Le Vault a ingéré, scellé et validé l'ensemble des preuves attendues ; pas « endpoints ont répondu » |
| **Qui calcule ?** | Le Vault matérialise à chaque événement scellé ; Linky lit cet état, ne déclenche aucun calcul |
| **Stabilité** | Compteurs et badges ne varient que lorsqu'un événement réel modifie le socle de preuves |
| **Par scope** | Complétude évaluée pour tenant + société + période ; chaque scope est indépendant |
| **expected_count** | Donnée interne au Vault (DVIG, curseur d'ingestion) — pas de requête live ERP |
| **Blocage global** | Une source incomplète → aucune carte ; Rigueur > disponibilité partielle |
| **Pourquoi ?** | Une vérité partielle, en finance, est une source d'erreur. |
| **Contrainte UX** | < 5 s réaliste : Linky lit un état matérialisé, pas de calcul lourd au fetch |

---

*Spec v1.1 — évolution produit (complétude probante), UX (progression), prérequis techniques.*
