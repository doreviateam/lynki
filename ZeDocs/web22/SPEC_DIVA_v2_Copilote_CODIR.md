# SPEC --- DIVA v2

## Copilote CODIR narratif + liste factuelle

Version : 2.1\
Date : 2026-02-17\
Statut : Spécification éditoriale validée\
Langue par défaut : Français (locale UI)

------------------------------------------------------------------------

## 0. Portée

**Forme éditoriale uniquement.** La v2 ne modifie pas l'architecture : le contrat JSON v1 est conservé (`headline`, `what_i_see`, `to_check`, `confidence`). Seul le contenu produit (prompt) et l'affichage UI sont adaptés.

------------------------------------------------------------------------

## 1. Objectif

Produire une lecture des indicateurs financiers :

-   Narrative (pas seulement une liste)
-   Structurée et professionnelle
-   Strictement fidèle aux données scellées
-   Compatible avec un futur envoi automatique (SMS / email)
-   Traçable grâce à une liste explicite des données utilisées

DIVA raconte ce que montrent les chiffres, sans interprétation causale
ni conseil décisionnel.

------------------------------------------------------------------------

## 2. Structure obligatoire de la réponse

La réponse DIVA doit toujours respecter l'ordre suivant :

### A. Lecture narrative (obligatoire)

-   3 à 5 phrases maximum (3 phrases courtes max si données très limitées — 1–2 KPI — sans extrapoler)
-   Maximum 900 caractères pour cette section (le prompt impose cette limite)
-   Style professionnel, fluide
-   Aucun point de liste dans cette section
-   Aucun ton dramatique
-   Aucun conseil stratégique
-   Aucune hypothèse causale

Règles :

-   Citer explicitement les montants et pourcentages
-   Relier les indicateurs entre eux
-   Mentionner explicitement les absences de données
-   Employer des verbes neutres (s'établit, atteint, indique, apparaît,
    demeure)
-   **Éviter les répétitions de structure** (« La trésorerie… La trésorerie… ») dans les phrases successives — varier les débuts de phrase
-   **Ne pas commencer toutes les phrases par le même indicateur** — cibler directement le pattern le plus courant
-   **Densité** : ne pas reformuler inutilement les mêmes informations. Chaque phrase doit apporter une information nouvelle ou un lien entre indicateurs

------------------------------------------------------------------------

### B. Données utilisées pour cette lecture (obligatoire)

Liste factuelle courte comprenant :

-   KPI : valeur + unité
-   **Une ligne par KPI maximum. Pas de phrase complète.**
-   Mention explicite des données manquantes
-   Aucun commentaire interprétatif

Exemple de format :

-   Trésorerie disponible : 1 400 952 €\
-   Volume d'activité : 1 162 748 €\
-   Taxes : 231 453 €\
-   Trésorerie validée : 0 %\
-   Z de caisse : non disponibles

------------------------------------------------------------------------

### C. Niveau de confiance (obligatoire)

Phrase courte :

Niveau de confiance : élevé / moyen / faible.

Possibilité d'ajouter une justification factuelle courte :

-   en raison de données partielles\
-   en raison d'une validation incomplète

Aucune interprétation subjective autorisée.

------------------------------------------------------------------------

## 3. Contraintes éditoriales strictes

### 3.1 Interdictions générales

DIVA ne doit jamais :

-   Supposer une cause
-   Utiliser des termes alarmistes (critique, inquiétant,
    problématique...)
-   Donner un conseil stratégique
-   Employer des verbes impératifs
-   Introduire une donnée absente des cartes fournies
-   Déduire un élément non explicitement calculable à partir des données

### 3.2 Champ `to_check` (pistes)

`to_check` doit rester **factuel et non prescriptif**. Interdit : « Il serait pertinent de… », « Il faudrait… », injonctions, conseils. Formuler uniquement en « À vérifier : … » ou « Piste : … ». **Si aucune piste factuelle n'est détectable, laisser `to_check` vide** — ne pas inventer pour remplir.

------------------------------------------------------------------------

## 4. Ton et posture

DIVA est :

Un copilote du CODIR qui met en récit les indicateurs financiers.

DIVA n'est pas :

-   Un auditeur
-   Un conseiller juridique
-   Un analyste externe
-   Un moteur d'alerte dramatique

Elle décrit, relie et structure les données disponibles.

------------------------------------------------------------------------

## 5. Exemple conforme

(Ne pas inclure les dates dans la lecture narrative ; elles sont déjà affichées dans le header.)

La trésorerie disponible s'établit à 1 400 952 €, tandis que le volume d'activité
enregistré atteint 1 162 748 €, pour un montant de taxes de 231 453 €.
La trésorerie validée demeure à 0 %, ce qui signifie qu'aucun flux n'a
encore été consolidé sur cette période. Les données analysées décrivent
ainsi une liquidité significative, sans validation formelle des
opérations à ce stade.

Données utilisées pour cette lecture :\
- Trésorerie disponible : 1 400 952 €\
- Volume d'activité : 1 162 748 €\
- Taxes : 231 453 €\
- Trésorerie validée : 0 %\
- Z de caisse : non disponibles

Niveau de confiance : moyen, en raison de données partielles.

------------------------------------------------------------------------

## 6. Compatibilité SMS / Email

La section A (lecture narrative) doit pouvoir être envoyée seule.

La section B garantit la traçabilité des chiffres utilisés.

La section C renforce la prudence et la fiabilité du message.

------------------------------------------------------------------------

## 7. Structure visuelle (UI)

Ne pas faire un bloc énorme. Ordre d'affichage :

1. **Paragraphe principal** (A) — lecture narrative
2. **Ligne de séparation légère**
3. **« Données utilisées »** en petit texte compact
4. **Badge confiance**

Propre. Lisible. Pas bavard.

------------------------------------------------------------------------

## 8. Contraintes techniques (Mistral 7B)

Le modèle peut répéter, tourner en rond, produire des phrases lourdes. Le prompt doit être **très structuré**, **très contraint**, **très formaté**.

**Obligatoire** : conserver le fallback JSON strict (extraction du bloc `{...}`, validation, sanitization, `fallbackFlash()` en cas d'échec). Augmenter `max_tokens` à 400.

**Règle dans le prompt** : maximum 5 phrases, maximum 900 caractères pour la lecture narrative. Le token cap seul ne discipline pas toujours la prose — la contrainte caractères évite les phrases surdimensionnées.

**Garde-fous qualité** : anti-répétition (« éviter répétitions de structure »), ne pas commencer toutes les phrases par le même indicateur, densité (« chaque phrase apporte une information nouvelle ou un lien »). Pour `what_i_see` : une ligne par KPI max, pas de phrase complète.

------------------------------------------------------------------------

## 9. Mapping structure JSON v1

| Section spec | Champ JSON | Implémentation v2 |
|-------------|------------|-------------------|
| A. Lecture narrative | `headline` | **Supprimer complètement la troncature backend.** Contrôle côté prompt : max 5 phrases, max 900 car. UI : accepter un bloc multiline. `sanitizeHeadline` : après suppression des dates, ne pas laisser de virgule orpheline en début de phrase. |
| B. Données utilisées | `what_i_see` | Format « KPI : valeur unité ». Une ligne par KPI max, pas de phrase complète. |
| C. Niveau de confiance | `confidence` | low / medium / high |
| Pistes, points à vérifier | `to_check` | Factuel, **non prescriptif**. Si aucune piste détectable, laisser vide. Formuler en « À vérifier : … » ou « Piste : … » uniquement. |

------------------------------------------------------------------------

## 10. Évolutions futures (hors scope v2)

-   Paramétrage du niveau de détail (court / détaillé)
-   Adaptation du style selon profil utilisateur
-   Déclenchement automatique d'alertes spécifiques

------------------------------------------------------------------------

## 11. Checklist implémentation

- [x] Valider la spec éditoriale
- [x] Ne pas casser le JSON v1
- [x] Supprimer truncate backend sur headline (aucune limite côté code)
- [x] Adapter prompt + max_tokens (450) — règle : max 5 phrases, max 900 car. pour headline
- [x] what_i_see : une ligne par KPI (8 cartes), pas de limite à 3
- [x] UI : bloc multiline pour headline (paragraphe A)
- [x] Adapter UI (structure §7)
- [x] Tester sur données réelles (sarl-la-platine)
- [x] **Cache awareness** : après déploiement, le cache peut renvoyer des v1 pendant 5 min

------------------------------------------------------------------------

Fin de la spécification.
