# NOTE D’IMPLÉMENTATION — Positionnement Lynki + normalisation linguistique Diva / Mistral

**Date** : mars 2026  
**Version** : 1.1  
**Répertoire** : `ZeDocs/web56`  
**Statut** : Cadrage consolidé — à implémenter  
**Type** : Note de cadrage technique et produit  
**Périmètre** : Lynki (UI), Diva (Go), prompts Mistral, payloads d’insight, post-traitements de sortie, libellés amont

**Références** :
- `ZeDocs/web55/Note_Diva_Mistral_Optimisation.md`
- `ZeDocs/web55/AVIS_EXPERT_DIVA_MISTRAL_v1.0.md`
- `ZeDocs/web55/SPEC_DIVA_Mistral_Infrastructure_Exploitation_v1.0.md`
- `ZeDocs/web55/PLAN_IMPLEMENTATION_SCRUM_DIVA_MISTRAL_v1.0.md`
- `ZeDocs/web56/AVIS_EXPERT_NORMALISATION_LANGUE_LYNKI_v1.0.md`
- `ZeDocs/web56/GLOSSAIRE_LYNKI_DIVA.md` *(référence normative autonome)*
- `ZeDocs/web56/PLAN_IMPLEMENTATION_LANGUE_LYNKI.md` *(ordre des travaux + tickets)*

---

## 1. Objet

Cette note formalise l’évolution suivante :

1. **Ancrer explicitement le positionnement produit de Lynki** :
   > **Lynki est un assistant au contrôle de gestion qui rend compte au CODIR.**

2. **Normaliser la langue produite par Diva / Mistral** afin d’obtenir :
   - un français de gestion ;
   - une terminologie stable ;
   - une voix sobre, lisible et non prescriptive ;
   - la suppression des anglicismes et libellés backend visibles ;
   - une cohérence entre payload, prompt, post-traitement et UI.

3. **Programmer cette évolution** dans la chaîne complète :
   - préparation des données côté Go ;
   - prompts système ;
   - validation / post-traitement de sortie ;
   - restitution UI Lynki ;
   - recette éditoriale.

Cette note ne redéfinit pas l’architecture Diva/Mistral.  
Elle s’inscrit **au-dessus** du chantier déjà mené sur :
- la stabilisation hôte,
- le store Postgres,
- le payload structuré Niveau 1,
- la fraîcheur,
- la logique store-first.

---

## 2. Contexte

L’architecture actuelle permet déjà :

- une lecture **store-first** des insights ;
- un payload structuré pré-calculé côté Go ;
- un insight principal orienté cockpit ;
- une latence de lecture courte ;
- une séparation saine entre :
  - **code** = calcul et hiérarchisation,
  - **LLM** = reformulation.

Cependant, plusieurs défauts persistent ou réapparaissent dans les sorties Diva :

| Catégorie | Symptôme observé |
|----------|-------------------|
| **Langue** | anglicismes, libellés techniques, formulations hybrides |
| **Ton** | style encore trop backend, pas assez “contrôle de gestion” |
| **Lisibilité** | phrases parfois propres mais encore trop “payloadisées” |
| **Terminologie** | variation entre `business`, `activité`, `cash`, `trésorerie`, `AR`, `créances` |
| **Sortie UI** | vocabulaire parfois compréhensible par l’équipe technique mais pas optimal pour un CODIR |
| **Risque éditorial** | le LLM reformule des termes non stabilisés au lieu de partir d’un langage métier propre |

Le problème n’est donc plus seulement technique.  
Il devient un problème de **langage produit**, de **positionnement**, et de **discipline de la chaîne de génération**.

---

## 3. Principe produit supérieur

> **Lynki est un assistant au contrôle de gestion qui rend compte au CODIR.**

Cette phrase constitue la boussole de toute l’évolution.

### Conséquences

La langue produite par Diva / Lynki doit être :

- **sobre**
- **factuelle**
- **métier**
- **précise**
- **lisible**
- **non prescriptive**
- **sans jargon backend**
- **sans familiarité**
- **sans effets de style inutiles**

Le système ne doit pas parler :

- comme un chatbot conversationnel ;
- comme un outil de debug ;
- comme un dump analytique brut ;
- comme un conseil stratégique automatisé.

Le système doit parler :

- comme un **assistant au contrôle de gestion** ;
- avec un niveau de langue **compatible avec une restitution au CODIR**.

---

## 4. Principe de chaîne linguistique

> **Le français propre doit être préparé par le système, pas espéré du modèle.**

La chaîne cible est la suivante :

1. **Code** : normalise les termes source ;
2. **Payload** : transmet des libellés métier propres ;
3. **LLM** : reformule à partir de ce vocabulaire stabilisé ;
4. **Post-traitement** : détecte et corrige les termes interdits restants ;
5. **UI** : affiche une langue française cohérente.

Le LLM ne doit pas être chargé de “traduire” librement un backend mal nommé.  
Il doit reformuler une lecture déjà préparée dans une langue métier stable.

---

## 5. Objectifs de l’évolution

### 5.1 Objectifs produit

- donner à Lynki une **voix identifiable** ;
- produire des textes compatibles avec une lecture **CODIR** ;
- renforcer la **crédibilité métier** de Diva ;
- éviter la sur-assistance et la sur-interprétation ;
- rendre les insights plus lisibles sans les rendre bavards.

### 5.2 Objectifs techniques

- normaliser les libellés avant LLM ;
- durcir les prompts système ;
- filtrer les sorties non conformes ;
- stabiliser les termes affichés dans l’UI ;
- documenter le glossaire métier comme référence normative.

### 5.3 Objectifs de recette

- réduire à zéro les anglicismes interdits visibles ;
- stabiliser la terminologie sur un panel d’insights ;
- vérifier l’alignement du ton avec le positionnement “assistant au contrôle de gestion” ;
- garantir que le texte final reste compatible avec une lecture CODIR.

---

## 6. Périmètre

### 6.1 Dans le périmètre
- Diva (service Go)
- prompts Mistral
- payloads d’insight
- post-traitement de sortie
- UI Lynki
- documentation de référence (glossaire)

### 6.2 Hors périmètre
- changement de modèle LLM
- refonte architecture Diva/Mistral
- nouveaux endpoints
- refonte complète des cards
- chantier DLP
- stratégie multilingue au-delà du français

---

## 7. Glossaire de normalisation — règles à intégrer

### 7.1 Table de correspondance normative

| Terme source | Terme français préféré | Règle d’usage |
|---|---|---|
| business | activité commerciale | Toujours en sortie user |
| cash | trésorerie disponible | Si on parle de liquidité mobilisable |
| cash position | position de trésorerie | Si on parle de position au sens large |
| net cash | trésorerie nette | Toujours |
| post-tax cash | trésorerie nette post-taxes | Si taxes déjà déduites |
| net flow | flux net | Toujours |
| cash flow | flux de trésorerie | Pour texte explicatif long |
| AR | créances ouvertes | Toujours en sortie user |
| receivables | créances clients | Toujours |
| overdue receivables | créances en retard | Toujours |
| at-risk receivables | créances à risque | Si le risque est qualifié |
| watch | à surveiller | Ne jamais afficher “watch” |
| warning | vigilance | Préférer “vigilance” |
| alert | vigilance | Préférer “vigilance” |
| critical | critique | Seulement si règle métier explicite |
| issue | point de vigilance | Ne jamais afficher “issue” |
| driver | inducteur | À utiliser avec parcimonie |
| business driver | inducteur d’activité | Rare ; sinon reformuler |
| payload | données transmises | Jamais côté user final |
| headline | phrase d’ouverture | Jamais côté user |
| insight | lecture / insight | “Insight” toléré comme terme interne produit |
| explain | explication détaillée | Toujours |
| refresh | actualiser | Toujours |
| stale | périmé / ancien | Selon contexte |
| fresh | à jour / récent | Selon contexte |
| data completeness | complétude des données | Doc interne ou tooltip |
| fallback | mode dégradé | Si vraiment nécessaire |
| cache hit | lecture store | Jamais côté user |
| runner | moteur de précalcul | Doc technique uniquement |
| store | stockage persistant / store | “Store” toléré en doc technique |
| default | par défaut | Toujours |
| benchmark | référence de mesure | Toujours |

### 7.2 Termes interdits en sortie user

Les termes suivants ne doivent pas apparaître dans un texte affiché dans Lynki, sauf exception validée :

- business
- cash
- AR
- watch
- issue
- payload
- runner
- cache hit
- fallback
- prompt
- headline
- stale
- refresh job
- debug
- critical, si non justifié

### 7.3 Termes préférés en sortie user

À privilégier :

- activité commerciale
- trésorerie disponible
- trésorerie nette
- trésorerie nette post-taxes
- flux net
- créances ouvertes
- créances en retard
- créances à risque
- retards de paiement
- point de vigilance
- actualisation en cours
- calculé il y a X min
- données utilisées
- position nette
- encours client
- chiffre d’affaires
- part significative
- concentration du risque client
- partenaire principal en retard
- créances en recouvrement
- montant en attente d’encaissement

---

## 8. Règles éditoriales associées

### 8.1 Préférer le métier au technique

Dire :
- `créances en retard`
- `activité commerciale`
- `point de vigilance`

Éviter :
- `AR à risque`
- `business`
- `issue`

### 8.2 Préférer les formulations explicites

Dire :
- `Les taxes représentent 0,6 % du chiffre d’affaires.`
- `Une part significative des créances en retard est portée par Export My Island.`

Éviter :
- `Inducteur fiscal : 0,6 % du CA`
- `AR risk principal debtor`

### 8.3 Ne pas surqualifier sans règle

Dire :
- `retard significatif`
- `point de vigilance`
- `sujet à surveiller`

Éviter :
- `retard critique`
- `situation alarmante`
- `alerte majeure`

sauf si règle métier formelle.

### 8.4 Préférer les phrases simples

Dire :
- `L’activité commerciale dépasse la trésorerie disponible.`
- `Les taxes pèsent sur la trésorerie.`

Éviter :
- les phrases nominales trop techniques ;
- les concaténations de labels ;
- les formulations qui sentent le payload.

### 8.5 Une couleur n’est pas un mot

Le texte ne doit pas répéter inutilement :
- orange
- vert
- bleu
- rouge

La couleur attire l’œil ; le texte explique le signal.

---

## 9. Évolution à programmer côté Go

### 9.1 Objectif

Faire en sorte que les données transmises au LLM soient **déjà exprimées dans un vocabulaire métier français stabilisé**.

### 9.2 Travaux attendus

#### A. Normalisation des libellés entrants
Avant construction du payload :
- remplacer les termes anglais ou backend ;
- utiliser systématiquement les termes préférés du glossaire ;
- documenter les exceptions.

#### B. Durcissement du payload
Le payload transmis au LLM doit contenir :
- `headline_candidate`
- `facts[]`
- `alerts[]`

mais avec des textes déjà nettoyés.

Exemple attendu :

```json
{
  "headline_candidate": "La trésorerie nette post-taxes reste faible au regard de l’activité commerciale.",
  "facts": [
    "L’activité commerciale s’élève à 94 663,78 €.",
    "La position nette de trésorerie post-taxes est de 7 448,61 €.",
    "Les taxes représentent 0,6 % du chiffre d’affaires."
  ],
  "alerts": [
    "Une part significative des créances en retard est portée par Export My Island."
  ]
}
```

---

## 10. Provenance des libellés — normalisation amont

**Principe** : La normalisation ne s’applique pas seulement aux textes générés par Diva. Elle s’applique aussi aux **libellés amont** injectés dans les facts et affichés dans Lynki.

### 10.1 D’où viennent les libellés

- **Cartes (cards)** : les champs `Label`, `StatusReason`, `Formatted` proviennent du **pipeline Vault / agrégations / cockpit**. Ils alimentent les messages de gouvernance (watchCards, alertCards) et peuvent contenir des termes backend (« Cash non validé », « watch », « Trésorerie non validée (0 %) »).
- **Détails (details)** : les structures `pos_shops`, `business.ar_by_partner`, etc. viennent de Vault ou des API Lynki. Les libellés partenaires, statuts, priorités peuvent être techniques.
- **Facts** : construits côté Diva à partir de ces cartes et détails. Tout terme non normalisé en entrée peut se retrouver dans les messages de faits puis dans le payload et la sortie LLM.

### 10.2 Règle à appliquer

> **La normalisation s’applique aussi aux libellés amont injectés dans les facts.**

Avant d’injecter un libellé externe (Label, StatusReason, libellé partenaire, etc.) dans un message destiné au payload ou à l’UI :
- le traiter comme une **entrée à normaliser** selon le glossaire ;
- remplacer les termes interdits par les termes préférés ;
- documenter les sources (Vault, agrégation, carte) pour lesquelles un contrat de libellés « propre » est défini, afin de remonter la normalisation au plus tôt si besoin.

---

## 11. Libellés UI Lynki

L’interface Lynki (boutons, tooltips, messages d’état, erreurs, états dégradés) doit respecter le même niveau de langue que les insights Diva.

### 11.1 Périmètre

| Zone | Exemples | Règle |
|------|----------|--------|
| **Boutons** | Actualiser, Explication détaillée, Rafraîchir | Termes du glossaire (actualiser, pas « refresh »). |
| **Tooltips** | Sur les cartes, sur le bloc Diva, sur les filtres | Français métier ; pas de « cache hit », « fallback », « payload ». |
| **Messages d’état** | « Actualisation en cours », « Calcul en cours » | Préférés : « actualisation en cours », « calculé il y a X min ». |
| **Messages d’erreur** | Indisponible, erreur de lecture | Sobre, pas de « timeout », « 500 », « runner » côté user. |
| **États dégradés** | Pas d’insight, mode dégradé | « Lecture indisponible », « Mode dégradé » si le terme est validé ; éviter « fallback » en libellé visible. |

### 11.2 Référence

Les libellés UI doivent être alignés sur le **glossaire** (§7) et les **termes interdits / préférés** (§7.2 et §7.3). Tout nouveau libellé (bouton, message, tooltip) doit être vérifié contre cette liste avant mise en production.

---

## 12. Post-traitement de sortie

Après la réponse du LLM, une couche de **validation et correction** garantit que les textes affichés restent conformes.

### 12.1 Objectifs

- **Détecter** les termes interdits (liste §7.2) dans le headline et, si possible, dans what_i_see / to_check.
- **Rejeter ou corriger** : soit rejeter le flash et utiliser un fallback déterministe, soit appliquer des remplacements ciblés (ex. « cash » → « trésorerie disponible ») selon la politique retenue.
- **Aligner** avec le code existant : `forbiddenTerms`, `englishDetect` (Mistral client) doivent être complétés par les termes du glossaire « interdits en sortie user ».

### 12.2 Règles techniques

- **Headline** : déjà filtré par `forbiddenTerms` et `englishDetect`. Étendre ces listes (ou une liste dédiée « termes interdits Lynki ») avec business, cash, AR, watch, issue, payload, runner, etc. Si un terme interdit est détecté → rejet du headline et usage du headline_candidate nettoyé ou du fallback dégradé.
- **Corps (what_i_see, to_check)** : si l’API renvoie ces champs au front, appliquer la même liste noire (filtrage ou remplacement) avant affichage, ou documenter la décision de ne traiter que le headline.
- **Documentation** : décrire la politique (rejet vs remplacement) et l’emplacement du code (ex. `units/diva/internal/mistral/` validateAndBuildFlash, sanitizeHeadline) dans le plan d’implémentation.

---

## 13. Recette éditoriale

### 13.1 Critères de validation

- **Zéro occurrence** des termes interdits (§7.2) dans tout texte affiché à l’utilisateur (headline, what_i_see, to_check, libellés UI).
- **Terminologie stable** sur un panel d’insights : les mêmes concepts sont désignés par les mêmes termes (activité commerciale, trésorerie disponible, créances en retard, etc.).
- **Ton** : lecture à froid par une personne « CODIR » ; le texte doit sembler produit par un assistant au contrôle de gestion, pas par un outil technique.

### 13.2 Échantillon et méthode

- Produire ou récupérer un **échantillon** d’insights (ex. 20–30 contextes variés : tenant, période, cartes watch/ok/alert).
- Vérifier chaque insight et chaque zone UI (boutons, messages) contre le glossaire et la liste interdite.
- Consigner les écarts dans un support de recette (liste de bugs éditoriaux ou checklist).

### 13.3 Validation

- **Qui valide** : responsable produit ou MOA, avec possibilité d’appui par un relecteur métier (contrôle de gestion).
- **Critère de passage** : aucun terme interdit visible ; terminologie alignée sur le glossaire ; ton validé sur un sous-ensemble d’exemples.

---

## 14. Ordre d’implémentation

La mise en œuvre recommandée raccorde la note au code, à l’UI et à la recette dans un ordre qui évite les régressions.

### 14.1 Étapes

1. **Publier le glossaire** comme document de référence autonome (`GLOSSAIRE_LYNKI_DIVA.md`) et le citer dans la note.
2. **Côté Go (Diva)**  
   - Nettoyer les derniers messages contenant « cash » dans `engine.go` (remplacer par « trésorerie disponible » ou « position de trésorerie »).  
   - Normaliser les libellés injectés en gouvernance (watchCards, alertCards) : Label et StatusReason ne doivent pas contenir de termes interdits en l’état ; ajouter une couche de normalisation à l’entrée du FactsPack ou documenter le contrat amont.
3. **Prompts Mistral**  
   - Remplacer dans les prompts les exemples ou consignes qui mentionnent « business », « watch », « alert » par les formulations métier (« activité », « à surveiller », « vigilance »).
4. **Post-traitement**  
   - Étendre `forbiddenTerms` (ou liste dédiée) avec les termes « interdits en sortie user » du glossaire.  
   - Définir la politique (rejet du flash vs remplacement) et l’implémenter.
5. **UI Lynki**  
   - Auditer boutons, tooltips, messages d’état et d’erreur, états dégradés ; aligner sur le glossaire.
6. **Recette**  
   - Exécuter la recette éditoriale sur l’échantillon ; traiter les écarts ; valider avec la MOA.

### 14.2 Tickets et plan détaillé

Le détail des **tickets techniques** (nettoyage engine.go, gouvernance, prompts, extension forbiddenTerms, glossaire, recette) est à consigner dans **`PLAN_IMPLEMENTATION_LANGUE_LYNKI.md`**, qui dérive directement de cette note et de l’avis d’expert.