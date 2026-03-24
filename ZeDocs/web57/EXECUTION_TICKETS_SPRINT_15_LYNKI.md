# Tickets d'exécution — Sprint 15 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_15_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Révision 1.1 :** relecture ticket par ticket — fallback valeur principale (T84), contrat e2e + layout (T85), payload / idempotence / transaction (T86), Gate D + contrat §4.1 + héritage Sprint 14 (T87).  
**Post-validation :** gel **confirmé** pour exécution — notes T84 / T86 § « Post-validation gel v1.1 ».  
**Référence plan :** [PLAN_SPRINT_15_LYNKI.md](PLAN_SPRINT_15_LYNKI.md) **v1.2**  
**Référence métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) **v0.2**  
**Sprint précédent :** [RAPPORT_SPRINT_14_LYNKI.md](RAPPORT_SPRINT_14_LYNKI.md) **v1.2**  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)

**Séquence d'exécution :** **T84 + T86** en parallèle → **T85** → **T87**

---

## T84 — Linky — bloc « État du rapprochement bancaire » en Synthèse

**Objectif :** intégrer dans la vue **Synthèse comptable** un bloc métier dédié au **rapprochement bancaire**, visible en tête de zone, conforme au **contrat métier v0.2** et au **contrat d’affichage** du plan v1.2 §5.1.

### Prérequis

- Sprint 14 livré (chrome Pilotage / Synthèse, DOCX v2, archivage FactsPack)
- Contrat métier v0.2 validé comme référence de sprint
- Agrégats existants disponibles côté Pilotage / Vault / proxies Linky
- `AccountingSummaryView` et/ou composants de synthèse en place

### Règle fondamentale

Tant que les définitions MOA §4.1 ne sont pas figées, **la source canonique provisoire du bloc est identique à celle du Pilotage** pour le même indicateur.  
**Aucune logique métier parallèle ne doit être réinventée côté front** si elle existe déjà via une route ou un agrégat canonique.

### Travaux attendus

#### 1. Ajouter le bloc en tête de Synthèse

Dans `AccountingSummaryView` (ou équivalent), insérer un bloc visible **au-dessus** des rubriques Bilan / CdR.

**Libellé principal obligatoire :**
- **État du rapprochement bancaire**

**Sous-libellé autorisé :**
- **Confiance des flux**

#### 2. Alimenter le bloc avec la source canonique provisoire

Réutiliser prioritairement les données déjà exposées pour le Pilotage :

- `dashboard-metrics`
- `/ui/aggregations/treasury`
- `bank-reconciliation-health`
- proxies Linky déjà en place

Le bloc doit afficher, selon disponibilité :

- **Valeur principale prioritaire :** **taux / part rapprochée** si la donnée est **disponible et alignée** ; **à défaut**, la **zone principale affiche directement l’état métier explicite** (message d’état — pas de valeur chiffrée arbitraire).
- **2 à 3 métriques secondaires max** :
  - montant ou solde restant à rapprocher
  - nombre d’écritures non rapprochées
  - date la plus ancienne non rapprochée

**États dégradés (`Indisponible`, `Non aligné`, etc.) :** les métriques secondaires **absentes** ne doivent **pas** produire de **lignes vides** ni d’emplacements fantômes ; seules les informations **fiables** restantes sont affichées.

#### 3. Respecter le contrat d’affichage

Ordre vertical obligatoire (plan §5.1) :

1. **Libellé principal**
2. **Zone valeur principale** (indicateur chiffré **ou** message d’état si indispo / non aligné — **aucun trou UI**)
3. **État** (badge / bandeau : OK / aligné, Partiel, Indisponible, Non aligné, etc.)
4. **Métriques secondaires** (2 à 3 max)
5. **Ligne `Réf. …`**

**Règle UI importante (plan v1.2) :**  
si la donnée **n’est pas fiable** ou **pas alignée** avec le périmètre, **l’état métier remplace la valeur principale** dans la zone prévue — **aucun emplacement vide** entre libellé et lecture utile.

#### 4. Gérer les états métier

Le bloc doit gérer explicitement les états suivants :

- **OK / aligné**
- **Partiel**
- **Indisponible**
- **Non aligné**
- éventuellement **Contradictoire / douteux** si la donnée ne peut pas être présentée proprement

**Aucun silence UI** n’est admis.

#### 5. Afficher la référence d’agrégation

Comme les autres blocs Lynki, afficher une ligne type :

- `Réf. vX.Y — source …`
- ou équivalent stable

Cette ligne doit permettre à la MOA de comprendre :
- quelle source est utilisée
- si le bloc est partiel
- si le périmètre est aligné ou non

**Visibilité :** la ligne `Réf. …` doit **rester affichée** même en **état dégradé** (Partiel, Indisponible, Non aligné, etc.), **sauf impossibilité technique totale** d’en déduire une source.

#### 6. Préparer le lien vers Pilotage

Optionnel Sprint 15 :

- lien discret **« Voir le détail en Pilotage »**
- même URL, `?view=pilotage`
- ancre / scroll si possible

Non bloquant pour la clôture du sprint.

### Checkpoint

- [ ] Bloc visible en tête de Synthèse
- [ ] Libellé principal conforme : **État du rapprochement bancaire**
- [ ] Source canonique provisoire = même famille de données que le Pilotage
- [ ] Valeur principale ou message d’état affiché **sans trou UI** (plan v1.2)
- [ ] États **Partiel / Indisponible / Non aligné** explicitement rendus
- [ ] 2 à 3 métriques secondaires max ; **aucune ligne fantôme** en état dégradé
- [ ] Ligne `Réf. …` affichée (y compris état dégradé si possible techniquement)
- [ ] Build Linky OK

### Fichiers concernés

- `units/dorevia-linky/components/AccountingSummaryView.tsx`
- `units/dorevia-linky/components/BankReconciliationIndicator.tsx` *(refactor / réactivation possible)*
- `units/dorevia-linky/components/...` *(si extraction d’un nouveau bloc dédié)*
- routes API existantes si adaptation mineure nécessaire

---

## T85 — Linky — cohérence Pilotage × Synthèse + tests e2e

**Objectif :** garantir qu’à périmètre identique, la Synthèse n’entre pas en contradiction silencieuse avec le Pilotage, et qu’en cas d’écart de source ou de périmètre, l’état explicite (**Non aligné**, **Partiel**, etc.) est rendu visible (plan §5.2 — **deux scénarios e2e obligatoires**).

### Prérequis

- T84 livré
- Contrat métier v0.2
- Jeux de données ou tenants permettant au moins :
  - un cas aligné
  - un cas non aligné / partiel

### Règle fondamentale

Le sprint ne cherche pas à masquer les limites de la donnée.  
Il cherche à **les rendre lisibles sans mentir**.

### Travaux attendus

#### 1. Vérifier la cohérence des filtres

Pour un même :

- tenant
- société
- période
- exercice

les indicateurs du bloc Synthèse doivent être :

- **compatibles** avec le Pilotage
- ou accompagnés d’un **message explicite** de non-alignement

#### 2. Ajouter deux scénarios e2e obligatoires

Créer ou enrichir des tests Playwright pour couvrir :

##### Cas 1 — Aligné
- ouvrir Lynki sur un périmètre connu
- relever l’indicateur côté Pilotage
- passer en Synthèse
- vérifier la **cohérence métier** entre les deux vues

**Contrat de comparaison e2e (cas aligné) :** la comparaison porte sur la **valeur principale** (ou son absence justifiée) et sur le **statut d’état** attendu — **pas** sur une identité textuelle stricte **pixel-perfect** ni sur du wording secondaire (libellés peuvent varier tant que le sens métier est cohérent).

##### Cas 2 — Non aligné (ou partiel)
- ouvrir Lynki sur un périmètre où la Synthèse ne peut pas reprendre proprement l’indicateur
- vérifier que la Synthèse **n’affiche pas un chiffre arbitraire**
- vérifier présence explicite d’un état qui rend **impossible une comparaison fiable** — le libellé exact peut être **`Non aligné`** ou **`Partiel`** (ou équivalent validé) selon le cas métier couvert.

**Ce second scénario est prioritaire** (crédibilité produit).

#### 3. Vérifier la non-régression de la zone Synthèse

S’assurer que l’ajout du bloc ne casse pas :

- Balance générale
- Bilan
- Compte de résultat
- Insight Diva
- balances tiers
- comparatifs existants

Vérifier aussi que l’**insertion du bloc en tête** ne casse pas l’**ordre de lecture** (haut de page) ni le **rendu responsive** de la vue Synthèse (pas de chevauchement, pas de compression abusive des filtres / blocs suivants).

### Checkpoint

- [ ] Cas e2e **aligné** couvert
- [ ] Cas e2e **non aligné** couvert (**prioritaire**)
- [ ] Pas de contradiction silencieuse entre Pilotage et Synthèse
- [ ] En cas d’écart, état explicite rendu
- [ ] Non-régression Synthèse validée (contenu **et** structure / responsive)
- [ ] Build / tests Linky OK

### Fichiers concernés

- `units/dorevia-linky/tests/e2e/...`
- `units/dorevia-linky/components/AccountingSummaryView.tsx`
- éventuels helpers / fixtures de test

---

## T86 — Vault — rétention 90j `facts_pack_archive` + doc ops

**Objectif :** mettre en place une politique opérationnelle de rétention **90 jours** pour `facts_pack_archive`, via **handler Vault dédié + cron plateforme documenté** (plan §5.3).

### Prérequis

- Sprint 14 livré (table `facts_pack_archive` en place)
- Routes jobs / patterns de sécurité internes Vault connus
- Accès à la documentation d’exploitation plateforme

### Règle fondamentale

La purge ne doit jamais être :

- déclenchable depuis le navigateur utilisateur
- exposée sans authentification technique explicite
- réduite à une opération SQL manuelle non documentée

**Doctrine sécurité (plan v1.2) :** la route **ne doit jamais être exposée sans authentification technique explicite** et **ne doit pas être invocable depuis le navigateur utilisateur** (pas d’appel Linky public, pas de session cookie seule). Réservée au **cron / job plateforme** documenté.

### Travaux attendus

#### 1. Ajouter une route de job Vault dédiée

Créer une route interne de type job, par exemple :

- `POST /ui/jobs/facts-pack-retention`
- ou équivalent selon conventions Vault

Cette route :

- exige un **secret / token interne**
- n’est pas destinée à l’usage utilisateur
- exécute la purge transactionnelle de `facts_pack_archive`

**Contrat de réponse HTTP (succès) :** corps JSON du type (noms exacts adaptables au style Vault existant) :

`{ "status": "ok", "deleted_count": <int>, "threshold_days": 90, "executed_at": "<ISO-8601>" }`

En **échec** : code HTTP explicite + corps ou message d’erreur exploitable par le cron et la doc ops.

**Idempotence :** deux exécutions consécutives **sans lignes supplémentaires à purger** ne doivent **pas** produire d’erreur (succès avec `deleted_count: 0` acceptable).

**Robustesse :** la route doit rester **courte et sûre** en exécution planifiée ; encapsuler la purge dans une **transaction** bornée, **loggée** avant/après (en cas de volume, documenter limite ou batch dans le ticket d’implémentation).

#### 2. Implémenter la purge 90 jours

Règle :

- supprimer les archives dont `generated_at < now() - interval '90 days'`

La purge ne touche que :

- `facts_pack_archive`

Elle ne doit pas affecter :

- les insights courants
- les documents actifs hors archive
- les autres tables Vault

#### 3. Logger l’exécution

**Observabilité minimale (plan v1.2) :** logs structurés contenant au minimum :

- date / heure d’exécution
- seuil appliqué (`90j`)
- nombre de lignes supprimées
- statut succès / erreur (et message d’erreur si échec)

La doc ops doit référencer ces champs pour le diagnostic.

#### 4. Documenter le cron plateforme

Ajouter une documentation ops claire :

- URL appelée
- méthode HTTP
- secret / en-têtes requis
- fréquence recommandée (ex. quotidienne)
- variable(s) d’environnement
- exemple de commande `curl` ou équivalent

### Checkpoint

- [ ] Route de purge job Vault créée
- [ ] Route protégée par authentification technique explicite ; **non exposée au navigateur utilisateur**
- [ ] Purge 90 jours fonctionnelle
- [ ] Logs structurés présents (champs plan v1.2)
- [ ] Documentation ops rédigée
- [ ] Vérification explicite (manuelle ou auto) : une **archive récente** (`generated_at` dans la fenêtre de rétention) **n’est pas supprimée** ; `GET` archive récente inchangé
- [ ] Build Vault OK

### Fichiers concernés

- `sources/vault/internal/handlers/...` *(job retention)*
- `sources/vault/internal/server/...` *(enregistrement route)*
- éventuelle migration SQL si nécessaire
- documentation ops / ZeDocs associée

---

## T87 — Transversal — clôture sprint, contrat, documentation, non-régression

**Objectif :** fermer proprement le Sprint 15, vérifier la non-régression, et refléter les arbitrages MOA / techniques dans les documents canoniques.

### Prérequis

- T84 à T86 livrés

### Travaux attendus

#### 1. Builds

- [ ] Build Vault : `go build ./...`
- [ ] Build Linky : `npx next build`

#### 2. Recette métier

Vérifier les critères du contrat v0.2 et du plan v1.2 §7 (DoD) :

- bloc visible en Synthèse
- pas de contradiction silencieuse
- états explicites
- référence d’agrégation
- prudence respectée
- e2e aligné + non aligné
- rétention / sécurité / observabilité purge

#### 3. Mise à jour documentaire

Mettre à jour selon résultat du sprint :

- `RAPPORT_SPRINT_15_LYNKI.md` — doit expliciter le statut de la **Gate D — Synthèse V1 confiance** (plan Sprint 15), avec mention des **cas e2e aligné / non aligné** et de la **rétention FactsPack** (route + cron + observabilité).
- `BACKLOG_PHASE2_LYNKI.md`
- `CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md`
  - soit annexe / complément **§4.1** après atelier MOA
  - soit version **0.3** brouillon si matière suffisante
  - **si l’atelier MOA n’a pas permis de figer §4.1 :** mise à jour **minimale** avec la mention de la **source canonique provisoire réellement utilisée pendant Sprint 15** (alignement Pilotage — plan §3), pour que la doc reste honnête sans décision finale sur les définitions métier.

#### 4. Non-régression

Vérifier que restent inchangés :

- navigation Pilotage / Synthèse
- blocs existants de Synthèse
- comparatifs N/N-1 existants
- DOCX v2
- archivage FactsPack Sprint 14
- proxy consultation archive
- habilitations `/accounting/*`

**Héritage Sprint 14 après T86 :** vérifier explicitement que **DOCX v2**, **archivage FactsPack** et **proxy consultation archive** restent **fonctionnels** après ajout de la rétention / purge (pas d’effet de bord sur les flux hors table d’archive).

### Checkpoint

- [ ] Builds Vault + Linky OK
- [ ] Recette contrat v0.2 + plan v1.2 OK
- [ ] Rapport Sprint 15 rédigé (Gate D + e2e + rétention)
- [ ] Backlog mis à jour
- [ ] Contrat métier mis à jour si arbitrages MOA obtenus
- [ ] Non-régression validée

### Fichiers concernés

- `ZeDocs/.../RAPPORT_SPRINT_15_LYNKI.md`
- `ZeDocs/.../BACKLOG_PHASE2_LYNKI.md`
- `ZeDocs/.../CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md`

---

## Vigilances spéciales

| Sujet | Point d’attention |
|-------|-------------------|
| **Source canonique provisoire** | Tant que §4.1 n’est pas figé, la Synthèse reprend la même source que le Pilotage pour l’indicateur concerné. |
| **Prudence produit** | Un état explicite vaut mieux qu’un chiffre trompeur. |
| **Non-alignement** | Le cas non aligné n’est pas un bug à masquer ; c’est un état métier à rendre lisible. |
| **Contrat d’affichage** | Aucun trou visuel : si pas de valeur principale fiable, le message d’état prend sa place (plan v1.2). |
| **Sécurité purge** | Route technique, authentifiée, non accessible depuis l’UI utilisateur (plan v1.2). |
| **Observabilité purge** | Date exécution, lignes supprimées, seuil 90j, statut succès/erreur (plan v1.2). |
| **Rétention** | La purge 90j ne concerne que `facts_pack_archive`. |
| **Non-régression** | Le bloc rapprochement ne doit pas dégrader la surface comptable déjà livrée. |

### Post-validation gel v1.1 — points d’attention à l’exécution

*Rappels d’implémentation — ne rouvrent pas le cadrage des tickets.*

| Point | Vigilance |
|-------|-----------|
| **T84 — Sobriété** | Garder une **lecture courte et nette** pour la MOA ; éviter de **surcharger** le bloc avec trop de micro-métriques — la force du livrable est la **lisibilité**, pas la densité. |
| **T86 — Conventions Vault** | Vérifier **tôt** en intégration que la route de purge **s’aligne** sur la logique et les **conventions** des jobs Vault existants (chemins, auth, patterns), pour éviter un décalage au **branchement ops**. |

---

## Suite logique

1. **Contrat v0.3** — extension aux 4 blocs canoniques complets  
2. **Rejouabilité v2** — régénération depuis FactsPack archivé  
3. **DOCX** — résumé du rapprochement dans le document  
4. **Netting multi-devises / calendrier comptable v2** — backlog phase 2

---

## Gel documentaire

| Version | Contenu |
|---------|---------|
| **v1.0** | Première rédaction alignée [PLAN_SPRINT_15_LYNKI.md](PLAN_SPRINT_15_LYNKI.md) v1.2. |
| **v1.1** | Relecture ticket par ticket : fallback valeur principale et métriques dégradées (T84) ; contrat e2e + layout responsive + vocabulaire Partiel / non aligné (T85) ; payload HTTP, idempotence, transaction (T86) ; Gate D dans rapport, contrat si §4.1 non figé, non-régression Sprint 14 (T87). **Gel confirmé** pour exécution ; post-notes T84/T86 (sobriété, conventions jobs). |

---

*Fin des tickets d’exécution Sprint 15 — version **1.1** gelée pour exécution.*
