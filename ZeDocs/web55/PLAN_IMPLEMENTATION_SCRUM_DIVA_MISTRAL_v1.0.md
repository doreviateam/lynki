# Plan d'implémentation Scrum — Diva / Mistral (infrastructure et exploitation)

**Date** : mars 2026  
**Version** : 1.1  
**Répertoire** : ZeDocs/web55  
**Référence** : `SPEC_DIVA_Mistral_Infrastructure_Exploitation_v1.0.md` (la version interne est indiquée dans l'en-tête du document).

**Objectif** : transformer la spec Diva/Mistral en backlog exécutable avec tickets par phase, Definition of Done par ticket et ordre de passage obligatoire. Base de suivi d'avancement et de recette. Chaque critère validé doit être appuyé par un artefact minimal (log, mesure, capture, config, sortie de commande).

**Ce plan n'est pas seulement un backlog de réalisation ; il sert aussi de support de validation inter-phase.** Un ticket n'est terminé que si son DoD et son artefact minimal sont disponibles.

**Règle de passage** : on n'ouvre pas la Phase N+1 tant que la Phase N n'est pas validée (critères + artefacts). Le ticket « DoD Phase N » est un **gate formel** : revue des critères, artefacts regroupés, décision « phase validée / non validée ».

---

## Légende

| Symbole | Signification |
|---------|---------------|
| **ID** | Identifiant court pour suivi (Jira, GitHub Issues). Préfixe **DM** = Diva Mistral. |
| **Statut** | Todo | In progress | Blocked | Done — à mettre à jour en cours d'exécution. |
| **Dép.** | Dépendance(s) : ID des tickets qui doivent être terminés avant de démarrer celui-ci. |
| **Blocant** | Oui = ticket dont l'échec bloque la phase ; Non = ticket important mais pas bloquant pour le gate. |
| **Artefact attendu** | Type de preuve à produire : config, log, capture, sortie de commande, rapport recette. |
| **DoD** | Definition of Done — critères à valider avant de considérer le ticket terminé. |
| **Phase** | 0, 1, 2, 3A, 3B (aligné sur la spec). Phase 3A et 3B optionnelles et indépendantes. |
| **Priorité** | P0 = blocant / socle (Phase 0 et 1) ; P1 = livrable cœur (Phase 2) ; P2 = optionnel (Phase 3A/3B). |
| **SP** | Story points (estimation pour sprint planning). |
| **Owner** | Infra, Dev Diva, ou Fullstack (à affecter selon l'équipe). |
| **DoR** | Definition of Ready (pour certains gros tickets) — conditions pour démarrer le ticket. |

---

## Phase 0 — Stabilisation minimale de l'hôte

**Objectif** : store Postgres actif, pression mémoire réduite, limites Mistral, baseline mesurée. Aucune phase applicative ne démarre avant validation Phase 0.

| ID | Titre | Statut | Dép. | Blocant | Artefact attendu | Description | DoD |
|----|--------|--------|------|---------|-----------------|-------------|-----|
| **DM0-1** | Configurer DIVA_DATABASE_URL et migration diva_insights | — | — | Oui | config, sortie GET | Brancher `DIVA_DATABASE_URL` sur la base Postgres du Vault (dorevia-network). Créer la table `diva_insights` si nécessaire (migration SQL). Redémarrer Diva avec store Postgres. | [ ] Variable configurée dans docker-compose Diva. [ ] Migration exécutée. [ ] Après `docker restart diva`, GET insight par contexte retourne l'insight précalculé (store persistant validé). |
| **DM0-2** | Réduire ctx-size et parallel Mistral | — | — | Oui | config, sortie cmd | Passer `--ctx-size` à 4096 (puis 2048 si prompts < plafond après mesure). Passer `--parallel 1`. Redémarrer le conteneur Mistral. | [ ] Paramètres appliqués dans docker-compose ou CMD Mistral. [ ] Conteneur redémarré. |
| **DM0-3** | Limites CPU et mémoire sur Mistral | — | — | Oui | config | Ajouter `cpus: "6"` et `mem_limit: 6g` au niveau service (pas `deploy.resources` seul) dans docker-compose Mistral. | [ ] Limites appliquées. [ ] Aucun crash au redémarrage Mistral. |
| **DM0-4a** | Baseline performance (latence, stats) | — | DM0-2, DM0-3 | Oui | sortie cmd, capture | Relever `docker stats` (Mistral, Diva, Odoo). Mesurer latence Mistral p50/p95 (N ≥ 5, ex. smoke test). Consigner comme **nouvelle baseline**. | [ ] Latence p50/p95 consignée. [ ] docker stats relevés. |
| **DM0-4b** | Validation stabilité hôte (seuils) | — | DM0-2, DM0-3 | Oui | sortie cmd | Vérifier : swap < 80 %, RAM disponible > 1,5 GiB après inférence type ; `docker inspect RestartCount` (Diva, Mistral) inchangé pendant le test ; `dmesg \| grep -i oom` sans événement. | [ ] Swap < 80 %. [ ] RAM > 1,5 GiB après inférence. [ ] RestartCount inchangé. [ ] Pas d'OOM. |
| **DM0-5** | (Recommandé) Leviers swap | — | — | Non | config, sortie cmd | swappiness 10, et/ou fichier swap 4 GiB, et/ou arrêt conteneurs lab inutilisés. | [ ] Au moins un levier appliqué et documenté. |
| **DM0-6** | Documenter rollback Phase 0 et runbook | — | — | Non | rapport / doc | Runbook ou doc avec config effective (ports, endpoints healthcheck Mistral). Tableau rollback (ctx-size, parallel, mem_limit, cpus) avec conditions de retour arrière. | [ ] Runbook à jour. [ ] Rollback documenté. |
| **DM0-7** | **Gate Phase 0** — DoD Phase 0 | — | DM0-1 à DM0-6 | Oui | dossier artefacts | Revue des critères Phase 0 ; artefacts regroupés ; décision « phase validée / non validée » ; Phase 1 débloquée. | [ ] Spec §4.2 tous les items cochés. [ ] Artefacts Phase 0 disponibles. [ ] Phase validée actée. |

---

## Phase 1 — Lot 1 applicatif (robustesse)

**Prérequis** : Phase 0 terminée et validée.

| ID | Titre | Statut | Dép. | Blocant | Artefact attendu | Description | DoD |
|----|--------|--------|------|---------|-----------------|-------------|-----|
| **DM1-1** | Single-flight par context_hash | — | DM0-1 (store actif) | Oui | log, capture | Lock par `context_hash` avant envoi Mistral ; appels concurrents attendent le job en cours ou lisent le store. Implémenter ou renforcer le mécanisme (Postgres UpsertProcessing si store actif). | [ ] 5 requêtes concurrentes même context_hash → 1 seule inférence Mistral. [ ] 5 requêtes sur 5 contextes distincts → concurrence maîtrisée (pas de pic CPU incontrôlé, pas de timeouts en cascade). Vérification via logs et docker stats. |
| **DM1-2** | Queue priorisée | — | — | Oui | log | File priorisée : refresh user > prewarm > runner ; max 1–2 inférences parallèles. | [ ] Priorité respectée sur un scénario type. [ ] Pas plus de 2 inférences simultanées. |
| **DM1-3** | Logs enrichis | — | — | Oui | log | Exposer dans les logs au moins : `queue_wait_ms`, `cache_hit`, `generation_reason`, `fallback_level`. | [ ] Champs présents pour un échantillon de requêtes. |
| **DM1-4** | Timeouts Mistral et Vault | — | — | Oui | config, log | Revoir timeout client Mistral (ex. 90 s). Aligner `DIVA_TIMEOUT_MS` côté Vault. En cas de dépassement, Diva dégrade en Niveau 0 sans crash. | [ ] Timeout configuré. [ ] Dépassement → fallback déterministe, pas de crash. |
| **DM1-5** | RefreshGuard sur /generate | — | — | Non | — | Vérifier que `RefreshGuard` couvre aussi `/generate` (Avis expert §3). Étendre si besoin. | [ ] Guard actif sur generate ; pas de surcharge concurrente non maîtrisée. |
| **DM1-6** | Non-régression latence | — | DM0-4a | Oui | rapport / métriques | Mesurer latence de réponse store/fallback. **Régression significative** = hausse > 10–15 % sur la latence store/fallback par rapport à la baseline Phase 0, ou dégradation visible sur la première peinture. | [ ] Pas de hausse > 10–15 % sur latence store/fallback. [ ] Pas de dégradation visible sur première peinture. Comparaison baseline vs post-Phase 1. |
| **DM1-7** | **Gate Phase 1** — DoD Phase 1 | — | DM1-1 à DM1-6 | Oui | dossier artefacts | Revue des critères Phase 1 ; artefacts regroupés ; décision « phase validée / non validée » ; Phase 2 débloquée. | [ ] Spec §5.2 tous les items cochés. [ ] Artefacts Phase 1 disponibles. [ ] Phase validée actée. |

---

## Phase 2 — Lot 2 applicatif (qualité et latence)

**Prérequis** : Phase 1 terminée et validée.

| ID | Titre | Statut | Dép. | Blocant | Artefact attendu | Description | DoD |
|----|--------|--------|------|---------|-----------------|-------------|-----|
| **DM2-1** | Synthèse déterministe (headline, facts, alerts) | — | — | Oui | — | Diva produit `headline_candidate`, `facts[]`, `alerts[]` rankés côté Go avant tout appel LLM. S'appuyer sur FactsPack existant ; compléter si besoin. | [ ] Payload Go structuré produit systématiquement avant envoi Mistral. [ ] Aucun calcul de hiérarchie laissé au LLM. |
| **DM2-2** | Payload Mistral en JSON Niveau 1 | — | DM2-1 | Oui | config, métriques | Remplacer la soupe cartes + texte par le JSON structuré (scope, headline_candidate, facts, alerts, instruction). **DoR** : DM2-1 terminé ; payload actuel documenté ; jeu de contexte de test disponible. | [ ] Mistral reçoit uniquement le JSON Niveau 1. [ ] Taille prompt réduite (tokens) mesurée. |
| **DM2-3** | Ranking de signaux côté Go | — | DM2-1 | Oui | — | Score d'importance (variation, montant, criticité, contradictions, données manquantes). Envoi au LLM limité à top 3 faits + top 2 vigilances. | [ ] Ranking implémenté. [ ] Top 3 + top 2 respectés dans le payload. |
| **DM2-4** | System prompt : contrôleur de gestion et 12 cartes | — | — | Oui | config, doc | Rôle explicite **contrôleur de gestion**, ancrage **12 indicateurs**, interdiction formulations prescriptives. Vocabulaire autorisé / à éviter documenté (ligne éditoriale Note). | [ ] Prompt mis à jour. [ ] Vocabulaire documenté et intégré au prompt. |
| **DM2-5** | Réduction du system prompt | — | DM2-4 | Non | log, métriques | Supprimer règles redondantes ; conserver format, ton, interdits, non-invention. | [ ] Nombre de règles / tokens réduit. [ ] Comportement stable. |
| **DM2-6** | Grille de recette éditoriale | — | DM2-4 | Oui | rapport recette | Rédiger et exécuter la grille sur au moins 5 insights : ton factuel ; absence de prescription ; absence d'anglicismes interdits ; ancrage 12 cartes ; absence d'invention ; lisibilité contrôleur de gestion. | [ ] Document ou checklist produit. [ ] 5 insights passés en revue ; non conformités documentées le cas échéant. |
| **DM2-7** | Critère UX < 5 s et < 1 s serveur | — | — | Oui | capture, métriques | Réponse visible utilisateur en < 5 s ; idéalement insight store ou fallback en < 1 s côté serveur. Pas d'inférence Mistral synchrone pour l'affichage initial. | [ ] Mesure ou démonstration sur un parcours type. [ ] Store ou fallback utilisé pour première peinture. |
| **DM2-8** | Tests multi-contextes | — | — | Oui | rapport, logs | Tests manuels ou automatisés sur au moins 2 tenants × 1 société. | [ ] Au moins 2 contextes validés. |
| **DM2-9** | **Gate Phase 2** — DoD Phase 2 | — | DM2-1 à DM2-8 | Oui | dossier artefacts | Revue des critères Phase 2 ; artefacts regroupés ; décision « phase validée / non validée » ; Phase 3 débloquée. | [ ] Spec §6.2 tous les items cochés. [ ] Artefacts Phase 2 disponibles. [ ] Phase validée actée. |

---

## Phase 3A — Optionnel : Fraîcheur et UX

**Prérequis** : Phase 2 terminée. Indépendant de la Phase 3B.

| ID | Titre | Statut | Dép. | Blocant | Artefact attendu | Description | DoD |
|----|--------|--------|------|---------|-----------------|-------------|-----|
| **DM3A-1** | facts_version et invalidation | — | — | Oui | log | Dériver `facts_version` de `aggregation_updated_at_max` ; invalider l'insight si les données ont changé. | [ ] Version exposée ; invalidation testée. |
| **DM3A-2** | Indicateurs UX âge et état | — | — | Oui | capture | Afficher âge de l'insight (« Calculé il y a X min ») et état « actualisation en cours » dans l'UI. | [ ] Utilisateur voit l'âge et l'état. |
| **DM3A-3** | Métriques insight_age et facts_version exposées | — | DM3A-1 | Non | log, extrait API | Exposer `insight_age_seconds` et `facts_version` dans les logs et l'API insight. | [ ] Métriques disponibles pour le debug. |
| **DM3A-4** | **Gate Phase 3A** — DoD Phase 3A | — | DM3A-1 à DM3A-3 | Oui | dossier artefacts | Revue des critères 3A ; artefacts regroupés ; décision « phase validée / non validée ». | [ ] Spec §7A critères cochés. [ ] Artefacts 3A disponibles. [ ] Phase validée actée. |

---

## Phase 3B — Optionnel : Start/stop planifié Mistral

**Prérequis** : Phase 2 terminée ; store Postgres obligatoire (Phase 0). Indépendant de la Phase 3A.

| ID | Titre | Statut | Dép. | Blocant | Artefact attendu | Description | DoD |
|----|--------|--------|------|---------|-----------------|-------------|-----|
| **DM3B-1** | Script et cron start/stop Mistral | ✅ DONE | DM0-1 (store actif) | Oui | `scripts/mistral_window.sh`, crontab | Script : démarrage Mistral → attente healthcheck → fenêtre runner (idle 5 min ou timeout 60 min) → arrêt Mistral. Cron 6h lun-ven. | [x] Script exécutable. [x] Cron configuré (6h lun-ven). [x] Après arrêt, insights via store OK. [x] Dry-run exit_code: 0. |
| **DM3B-2** | Règle /explain hors fenêtre | ✅ DONE | DM3B-1 | Oui | `RUNBOOK_PHASE3B_MISTRAL_STARTSTOP.md` | Hors fenêtre : `/explain` cockpit → flash dégradé déterministe (`degraded=true`) ; `/explain` card → HTTP 503 documenté ; store toujours disponible. Pas d'attente infinie. | [x] Comportement documenté. [x] Recette hors fenêtre validée (test réel). |
| **DM3B-3** | Mesure RAM libérée | ✅ DONE | DM3B-1 | Non | `RUNBOOK_PHASE3B_MISTRAL_STARTSTOP.md` | RAM avant arrêt : 3,3 GiB dispo / Mistral 4,332 GiB. RAM après arrêt : 7,6 GiB dispo. **~4,3 GiB libérés.** | [x] Réduction mesurable documentée. |
| **DM3B-4** | **Gate Phase 3B** — DoD Phase 3B | ✅ DONE | DM3B-1 à DM3B-3 | Oui | dossier artefacts 3B | Revue des critères 3B ; artefacts regroupés ; décision « phase validée ». | [x] Spec §7B critères cochés. [x] Artefacts 3B disponibles. [x] Phase 3B validée — 16 mars 2026. |

---

## Priorités et estimation (sprint planning)

| Phase | Priorité | SP (suggestion) | Owner type |
|-------|----------|-----------------|------------|
| 0 | P0 | 5 | Infra / Dev |
| 1 | P0 | 8 | Dev Diva |
| 2 | P1 | 13 | Dev Diva |
| 3A | P2 | 3 | Dev Diva / Front |
| 3B | P2 | 3 | Infra / Dev Diva |

- **Phase 0** = P0 (socle ; sans elle, les phases suivantes ne sont pas mesurables).
- **Phase 1** = P0 (robustesse ; single-flight et logs indispensables avant Lot 2).
- **Phase 2** = P1 (cœur produit : prompt JSON, contrôleur de gestion, grille éditoriale).
- **Phases 3A et 3B** = P2 optionnel ; découplées, à planifier selon priorité produit/infra.

À ajuster selon vélocité et taille des sprints.

---

## Récapitulatif par phase

| Phase | Tickets | Priorité | Gate | DoD phase |
|-------|---------|----------|------|------------|
| 0 | DM0-1 à DM0-7 (dont 4a, 4b) | P0 | DM0-7 | Store Postgres actif ; seuils validés (swap < 80 %, RAM > 1,5 GiB, baseline p50/p95) ; artefacts regroupés ; phase validée actée |
| 1 | DM1-1 à DM1-7 | P0 | DM1-7 | Single-flight (test 5+5), logs enrichis, dégradation propre, latence stable (< 10–15 % régression) ; artefacts regroupés ; phase validée actée |
| 2 | DM2-1 à DM2-9 | P1 | DM2-9 | Prompt JSON compact, persona contrôleur de gestion, grille éditoriale, < 5 s ; artefacts regroupés ; phase validée actée |
| 3A | DM3A-1 à DM3A-4 | P2 | DM3A-4 | Âge insight, état actualisation, métriques exposées ; artefacts regroupés ; phase validée actée |
| 3B | DM3B-1 à DM3B-4 | P2 | DM3B-4 | Script + cron, règle /explain hors fenêtre, RAM libérée mesurée ; artefacts regroupés ; phase validée actée |

---

## Ordre d'exécution recommandé

1. **Phase 0** — Store Postgres, ctx-size/parallel, limites Mistral, baseline, leviers swap, runbook et rollback. **Valider tous les critères et artefacts avant de passer en Phase 1.**
2. **Phase 1** — Single-flight, queue, logs enrichis, timeouts, RefreshGuard, non-régression latence. **Valider avant Phase 2.**
3. **Phase 2** — Synthèse déterministe, payload JSON Niveau 1, ranking, system prompt contrôleur de gestion, grille de recette éditoriale, UX < 5 s, tests multi-contextes. **Valider avant toute Phase 3.**
4. **Phase 3A** (optionnel) — Fraîcheur métier, indicateurs UX, métriques.
5. **Phase 3B** (optionnel) — Start/stop planifié Mistral, règle /explain hors fenêtre.

Les phases 3A et 3B peuvent être traitées dans l'ordre choisi par l'équipe, ou une seule des deux.

---

## Points de vigilance recette

- **Passage de phase** : ne pas ouvrir la Phase N+1 sans validation explicite de la Phase N (spec + artefacts).
- **Single-flight** : test 5 requêtes même contexte → 1 inférence ; 5 requêtes 5 contextes → concurrence maîtrisée. Vérifier via logs et `docker stats`.
- **Store persistant** : après tout redémarrage Diva, l'insight doit rester lisible (GET par contexte).
- **Rollback Phase 0** : en cas de dégradation (qualité, runner, stabilité), appliquer le tableau rollback de la spec et documenter la cause.
- **Ligne éditoriale** : pas de prescription ; Diva dit où est la tension, pas quoi faire. Grille de recette obligatoire sur 5 insights en Phase 2.
- **Artefacts** : chaque critère validé s'appuie sur un artefact minimal (log, mesure, capture, config, sortie de commande). Regrouper par phase (dossier ou runbook).

---

## Documents de référence

| Document | Rôle |
|----------|------|
| `SPEC_DIVA_Mistral_Infrastructure_Exploitation_v1.0.md` | Spec de référence (phases, livrables, critères, seuils, rollback) — version en en-tête du fichier |
| `Note_Diva_Mistral_Optimisation.md` | Cadrage produit, 3 lots, ligne éditoriale |
| `AVIS_EXPERT_DIVA_MISTRAL_v1.0.md` | Diagnostic infra, leviers swap, start/stop, vérifications |

---

**Version** : 1.1  
**Type** : Plan d'implémentation Scrum (backlog exécutable).  
**Référence spec** : SPEC_DIVA_Mistral_Infrastructure_Exploitation_v1.0.md.
