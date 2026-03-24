# Plan de vérification — comportement insight Lynki / Diva

**Date** : 17 mars 2026
**Version** : 1.0
**Objet** : vérifier le comportement fonctionnel, narratif et UX de l’insight principal Lynki en présence d’un auto-reload silencieux et d’une génération Diva/Mistral à la demande.

---

## 1. Objectif

L’objectif de ces tests n’est pas seulement de vérifier que Diva génère un texte valide, mais de confirmer que l’insight Lynki se comporte comme un composant de lecture de gestion stable, traçable et gouvernable. Le succès du dispositif repose autant sur la justesse des chiffres que sur la maîtrise de la stabilité narrative, de la hiérarchie métier et de l’UX silencieuse.

Valider que l’insight principal :

* reste **cohérent avec les cards visibles**,
* reste **stable quand les données ne changent pas**,
* évolue **seulement quand c’est justifié par les données**,
* ne provoque **ni clignotement, ni contradiction, ni régression de ton**,
* se comporte correctement en cas d’erreur, de timeout ou de données incomplètes.

---

## 2. Modèle de comportement attendu

Le comportement cible est le suivant :

1. **Les cards Lynki sont la source de vérité visible.**
2. **Diva construit un FactsPack traçable.**
3. **Mistral n’est réveillé qu’à la demande** ou lorsqu’une régénération est justifiée.
4. **Si les données n’ont pas changé de manière significative**, l’insight doit rester identique ou quasi identique, sans contradiction.
5. **Si les données changent significativement**, l’insight doit évoluer en conservant :

   * la cohérence chiffrée,
   * la hiérarchie métier,
   * la stabilité éditoriale.

---

## 3. Axes de test à couvrir

Je te conseille de couvrir 6 axes :

| Axe                              | Objet                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| **A1 — Cohérence métier**        | L’insight raconte bien ce que montrent les cards            |
| **A2 — Stabilité**               | Pas de variation injustifiée à données identiques           |
| **A3 — Réactivité**              | L’insight évolue quand les données changent                 |
| **A4 — UX silencieuse**          | Pas de flash, pas de saut, pas de perturbation visuelle     |
| **A5 — Résilience**              | Bon comportement si Diva/Mistral échoue                     |
| **A6 — Isolation / gouvernance** | Pas de fuite entre tenants, pas d’incohérence multi-session |

---

## 4. Cas de test de référence

## 4.1. Stabilité à données identiques

| ID         | Scénario                                           | Précondition                        | Résultat attendu                                                                                 |
| ---------- | -------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| **BEH-01** | Auto-reload silencieux sans changement de données  | FactsPack identique pendant 10 min  | Le texte reste identique ; seul le libellé temporel change (`à l’instant`, `il y a 5 min`, etc.) |
| **BEH-02** | Rafraîchissement manuel sans changement de données | Même FactsPack, régénération forcée | Le message reste identique ou très proche, sans changer de chiffres ni de relation dominante     |
| **BEH-03** | Plusieurs cycles auto-reload consécutifs           | Aucun changement côté cards         | Aucune contradiction entre un insight N et N+1                                                   |
| **BEH-04** | Même FactsPack, plusieurs appels Mistral           | Mistral réveillé plusieurs fois     | Variabilité éditoriale tolérée, mais mêmes montants, même hiérarchie, même conclusion métier     |

### Critères d’acceptation BEH-01 à 04

* même paire dominante,
* mêmes montants,
* aucun chiffre hors manifest,
* pas de passage de “stable” à “alarmiste” sans raison,
* pas de modification purement cosmétique toutes les 1–5 minutes.

---

## 4.2. Réactivité à changement réel

| ID         | Scénario                                             | Précondition                                    | Résultat attendu                                                                          |
| ---------- | ---------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **BEH-05** | Variation mineure d’une métrique non dominante       | Ex. taxes changent légèrement                   | Le headline reste inchangé ; le détail peut évoluer si utile                              |
| **BEH-06** | Variation significative d’une métrique non dominante | Ex. encours augmente fortement                  | Le corps du message change ; le headline ne change que si le point dominant bascule       |
| **BEH-07** | Variation significative de la métrique dominante     | Ex. trésorerie baisse fortement sous l’activité | Le headline change dans le cycle suivant ; la nouvelle relation dominante devient visible |
| **BEH-08** | Apparition d’un nouveau signal critique              | Ex. encours > seuil ou BFR dégradé              | L’insight réordonne sa vigilance et fait remonter le nouveau point principal              |
| **BEH-09** | Disparition du point de vigilance dominant           | Ex. encours recouvre / baisse fortement         | L’insight cesse d’insister dessus et requalifie la lecture métier                         |

### Ce que tu valides ici

* la **sensibilité** du moteur,
* la **non-inertie excessive**,
* et surtout la **capacité à rehiérarchiser** le commentaire.

---

## 4.3. Traçabilité et conformité des montants

| ID         | Scénario                                             | Précondition                      | Résultat attendu                                                              |
| ---------- | ---------------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------- |
| **BEH-10** | Montant visible dans le headline                     | Message généré                    | Chaque montant du headline existe dans `metrics`                              |
| **BEH-11** | Montant inventé par le LLM                           | Injection volontaire / simulation | Le headline est rejeté, fallback appliqué, log émis                           |
| **BEH-12** | Montant non traçable dans `what_i_see` ou `to_check` | Simulation                        | La phrase fautive est omise                                                   |
| **BEH-13** | Arrondi limite                                       | Écart ±0,01 / ±0,02 €             | Validation acceptée selon la tolérance définie                                |
| **BEH-14** | Relation stock / flux                                | Trésorerie vs activité            | Le vocabulaire reste conforme : pas de confusion entre trésorerie et flux net |

### Critères d’acceptation

* aucun montant hors manifest,
* aucune phrase avec chiffre non traçable,
* pas de retour de termes flous du type “flux net disponible” si ce n’est pas voulu.

---

## 4.4. UX et auto-reload silencieux

| ID         | Scénario                                 | Précondition            | Résultat attendu                                    |
| ---------- | ---------------------------------------- | ----------------------- | --------------------------------------------------- |
| **BEH-15** | Auto-reload silencieux visible à l’écran | Utilisateur sur la page | Pas de clignotement du bloc insight                 |
| **BEH-16** | Mise à jour de l’insight                 | Nouveau texte reçu      | Pas de saut de layout, pas de reflow brutal         |
| **BEH-17** | Message inchangé                         | Reload sans nouveauté   | Le bloc ne “rebondit” pas visuellement              |
| **BEH-18** | Changement du label temporel             | 0 min → 5 min → 9 min   | Seul le libellé temps évolue ; pas de reset du bloc |
| **BEH-19** | Version mobile                           | Petit viewport          | Même stabilité visuelle, pas de débordement texte   |

### Ici, tu testes du vrai produit

Ce n’est pas juste “est-ce que ça marche”, mais “est-ce que ça se comporte calmement”.

---

## 4.5. Résilience et erreurs

| ID         | Scénario                 | Précondition                    | Résultat attendu                                        |
| ---------- | ------------------------ | ------------------------------- | ------------------------------------------------------- |
| **BEH-20** | Timeout Mistral          | Mistral ne répond pas           | Le dernier insight valide reste affiché                 |
| **BEH-21** | Réponse Mistral invalide | JSON invalide / format cassé    | Fallback propre, pas d’écran vide                       |
| **BEH-22** | FactsPack incomplet      | Une card manque                 | Aucun chiffre inventé ; message dégradé ou plus prudent |
| **BEH-23** | Diva indisponible        | API KO                          | Le cockpit reste utilisable, sans casser les cards      |
| **BEH-24** | Réponse partielle        | Headline valide, corps invalide | Affichage dégradé mais propre, sans phrase incohérente  |

### Critère clé

L’insight ne doit **jamais dégrader le cockpit**.
S’il échoue, il doit échouer **proprement**.

---

## 4.6. Isolation, concurrence, multi-tenant

| ID         | Scénario                                | Précondition                 | Résultat attendu                                            |
| ---------- | --------------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| **BEH-25** | Deux onglets même tenant                | Deux sessions ouvertes       | Pas de comportement contradictoire ni de surcharge anormale |
| **BEH-26** | Deux tenants différents                 | Tenant A et tenant B ouverts | Aucun mélange d’insight ou de métriques                     |
| **BEH-27** | Changement de tenant                    | Tenant switch en UI          | L’insight se recalcule sur le bon contexte                  |
| **BEH-28** | Rafraîchissement simultané multi-tenant | Plusieurs sessions lab       | Pas de fuite de cache ni de texte croisé                    |

---

## 5. Cas de test métier prioritaires

Si tu veux aller à l’essentiel, voici les **8 tests minimum vitaux** :

| Priorité | ID     | Pourquoi                                                 |
| -------- | ------ | -------------------------------------------------------- |
| **P0**   | BEH-01 | Stabilité à données identiques                           |
| **P0**   | BEH-07 | Changement de headline si la relation dominante change   |
| **P0**   | BEH-10 | Traçabilité des montants                                 |
| **P0**   | BEH-11 | Rejet d’un montant inventé                               |
| **P0**   | BEH-15 | Pas de clignotement en auto-reload                       |
| **P0**   | BEH-20 | Conservation du dernier insight valide en cas de timeout |
| **P0**   | BEH-26 | Isolation multi-tenant                                   |
| **P0**   | BEH-14 | Respect stock vs flux                                    |

---

## 6. Recette éditoriale spécifique

En plus des tests techniques, je te recommande une mini recette éditoriale à part.

### Règles à vérifier

* une phrase principale = **une seule relation métier**,
* priorité au **point de vigilance le plus décisionnel**,
* pas d’anglicisme visible,
* pas de mot backend,
* pas de contradiction avec les cards,
* ton **assistant de contrôle de gestion**, pas “chatbot enthousiaste”.

### Cas éditoriaux utiles

* Trésorerie forte + encours élevé
* Trésorerie faible + activité soutenue
* Activité forte + flux net dégradé
* Taxes faibles mais risque client fort
* Situation stable sans tension majeure

---

## 7. Proposition d’automatisation

Je ferais 3 niveaux.

## Niveau 1 — tests unitaires

Côté `units/diva` :

* `buildMetrics()`
* `buildFacts()`
* validation des montants
* logique de rejet / omission
* choix de la paire dominante

## Niveau 2 — tests d’intégration

Entre Lynki et Diva :

* conformité `CARD_MAPPING`
* contrat du payload
* comportement avec métriques absentes
* timestamp / stale label

## Niveau 3 — tests E2E

Dans Lynki :

* chargement initial,
* auto-reload silencieux,
* absence de flicker,
* maintien du dernier insight valide,
* changement réel d’insight après mutation du dataset.

---

## 8. Critères de validation globale

Le comportement est considéré comme **validé** si :

1. **À données identiques**, l’insight reste stable.
2. **À changement significatif**, l’insight évolue dans le bon sens.
3. **Aucun montant non traçable** n’est affiché.
4. **Aucun auto-reload** ne perturbe la lecture.
5. **En cas d’erreur**, le cockpit reste utilisable.
6. **Aucun mélange de tenant** n’est possible.
7. Le ton reste **CODIR / contrôle de gestion**.

---

## 9. Recommandation produit supplémentaire

Je te conseille d’ajouter un concept simple dans la logique de test :

### “changement significatif”

Parce qu’en vrai, tout l’enjeu est là.

Tu peux formaliser qu’un réveil ou une réécriture n’est justifié que si :

* la **relation dominante** change,
* ou l’**écart principal** franchit un seuil,
* ou un **nouveau point de vigilance** dépasse un seuil métier,
* ou la **fraîcheur** du commentaire dépasse une durée maximale.

Ça t’évitera un insight trop bavard ou trop nerveux.

---
## 4.8. Règle de priorisation des vigilances

*Formalisée le 17 mars 2026 — validée sur écran réel laplatine2026.*

### Contexte

Quand plusieurs vigilances sont disponibles (client nominatif, rapprochement bancaire, fiscal), le bloc `to_check` est limité à 2 items. La règle suivante détermine lesquels afficher.

### Ordre de priorité

| Rang | Type | Critère | Exemple |
|------|------|---------|---------|
| **1** | **Risque client nominatif** | Un partenaire avec créances en retard > seuil (ex : > 10 k€ ou > 60 jours) | "Export My Island : 12 589 € en retard depuis 199 jours" |
| **2** | **Signal de qualité des données** | Rapprochement bancaire partiel, données non confirmées | "Une fraction des encaissements reste à confirmer…" |
| **3** | **Signal fiscal** | Taxes significatives par rapport à l'activité | "Le poids fiscal mérite attention…" |

### Règle métier

> **Le risque client nominatif prime toujours sur le signal fiscal**, parce qu'il déclenche une action concrète (appel de recouvrement, relance), alors que la taxe est généralement un constat sans action immédiate.

### Cas particuliers

- Si **aucun risque client nominatif** : afficher rang 2 + rang 3.
- Si **rapprochement complet** (100 % validé) : sauter le rang 2, afficher rang 1 + rang 3.
- Si **un seul signal disponible** : `to_check` avec 1 item, pas de padding artificiel.
- Si **aucun signal actionnable** : `to_check` vide — ne pas inventer de vigilance.

### Implémentation côté moteur (engine.go)

Le `PriorityGovernance` est utilisé pour les faits de gouvernance. La priorité interne est :
- Faits `ar` (comptes clients) → `PriorityTreasury` (rang 2 dans le tri, avant gouvernance)
- Faits `governance` → `PriorityGovernance` (rang 1, après treasury mais avant tax/pos)

Le tri `SortFacts` garantit que les créances nominatives remontent avant les signaux de statut.

---
## 4.7. Retour au nominal après incident d'infrastructure

| ID         | Scénario                                                     | Précondition                                                 | Résultat attendu                                                                       |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **BEH-29** | Retour au nominal après collision de projet Compose          | Conteneur vault recréé par interférence entre deux stacks    | Cards et insight réapparaissent sans mélange de tenant ni incohérence résiduelle       |
| **BEH-30** | Redémarrage partiel d'une stack (vault seul)                 | Vault redémarré, Linky non affecté                           | Cockpit utilisable pendant la coupure ; insight servi depuis cache navigateur          |
| **BEH-31** | Isolation de projet Compose entre deux tenants sur même hôte | Deux stacks `platform/` coexistent sans directive `name:`    | Un `docker compose up` sur un tenant ne touche jamais les conteneurs d'un autre tenant |

### Leçon infrastructure — incident du 17 mars 2026

Deux fichiers `platform/docker-compose.yml` sans directive `name:` explicite partageaient le même nom de projet Docker Compose (`platform`). Chaque `docker compose up` sur l'un recréait ou supprimait les conteneurs de l'autre.

**Correction appliquée :** `name: dorevia_core-stinger_platform` ajouté dans le compose core-stinger, correspondant au nom d'origine de ses volumes.

**Règle préventive :** tout fichier `docker-compose.yml` d'une stack platform doit porter une directive `name:` unique de la forme `dorevia_<tenant>_<env>`.

