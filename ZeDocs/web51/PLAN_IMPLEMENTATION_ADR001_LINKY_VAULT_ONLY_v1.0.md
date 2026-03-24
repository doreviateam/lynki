# Plan d’implémentation — ADR-001 Linky → Vault only (v1.0)

**Date :** 2026-03-15  
**Référence :** ADR-001 — Linky : Vault comme gateway unique (ERP-agnostique).  
**Document d’entrée :** ANALYSE_CONSEQUENCES_IMPLEMENTATION_ADR001.md (analyse des impacts, écarts, paliers).

**Objectif :** Plan opérationnel pour atteindre la conformité ADR-001 : Linky ne consomme que des endpoints exposés par le Vault ; plus aucune lecture de `DLP_URL` ni `DIVA_URL` côté Linky.

---

## 1. Critères de conformité (clôture)

**Principe :** La conformité à l’ADR-001 n’est atteinte que lorsque **Linky ne connaît plus DLP ni DIVA comme dépendances techniques**, mais uniquement le Vault comme contrat unique. La conformité se matérialise par la disparition complète de toute dépendance directe de Linky à DLP ou DIVA.

- [ ] **Critère principal :** Aucun code Linky ne lit `DLP_URL` ni `DIVA_URL` (recherche code + variables d’environnement déploiement). Aucun client ou helper Linky ne construit d’URL DLP/DIVA en dur ; aucun appel sortant (`fetch`, `axios`, helpers, clients HTTP partagés) ne vise un host DLP/DIVA hors Vault (évite tout contournement sans variable d’env).
- [ ] **Critère Vault :** Toutes les routes `/ui/dlp/*` et `/ui/diva/*` nécessaires aux usages Linky sont exposées par le Vault avec gestion homogène des erreurs, des timeouts et de la traçabilité (Vault assume réellement le rôle de gateway).
- [ ] Toutes les routes Linky qui consommaient DLP ou DIVA appellent désormais `VAULT_URL` + chemins stables (`/ui/dlp/*`, `/ui/diva/*` ou équivalent exposé par le Vault).
- [ ] **Contrat front inchangé :** Les composants UI continuent d’appeler les mêmes routes Next.js `/api/dlp/*` et `/api/diva/*`, sauf décision explicite contraire — la migration reste **interne au backend Linky/Vault**, sans faire dériver le front.
- [ ] Tuile Énergie stratégique (DLP), bloc DIVA (insight, prewarm, refresh, jobs), admin DLP (companies, dlps, perimeters, project-perimeter-map), sync-companies et dashboard-metrics fonctionnent via le Vault.
- [ ] Recette de non-régression passée ; erreurs Vault stables et observables (pas de fuite de la forme des erreurs DLP/DIVA vers le client Linky).

---

## 2. Backlog par lot

### Lot 0 — Prérequis (Vault)

| Id | Tâche | DoD |
|----|--------|-----|
| V0.1 | Config Vault : `DLP_URL`, `DIVA_URL`, timeouts optionnels (env ou fichier). | Config lue au démarrage ; doc déploiement à jour. |
| V0.2 | Contraintes gateway (doc) : headers à propager / ne pas relayer, auth centralisée, traçabilité (`X-Request-ID`, `X-Tenant`). | Règle documentée (ex. ANALYSE § 2.4) et reprise dans le code (commentaires ou README handlers). |
| V0.3 | Règle erreurs normalisées : 502/503 + body stable si timeout ou 5xx aval ; pas de propagation brute. Forme minimale du body d’erreur (convention Vault ou projet) : au moins `code`, `message`, `request_id`. | Règle documentée (ex. ANALYSE § 2.5) ; handlers retournent des réponses homogènes selon ce contrat minimal. |
| V0.4 | **Journalisation gateway DLP/DIVA** dans Vault : logs homogènes pour chaque appel aval. Ne pas logger les bodies complets des requêtes/réponses par défaut (contenu potentiellement verbeux ou sensible). | DoD : logs avec route cible, méthode, statut aval, durée, timeout éventuel, `request_id`, `tenant` — pas de body complet (observabilité et traçabilité exécutables, sans exposition de données sensibles). |

---

### Lot 1 — Palier 1 — Vault routes DLP/DIVA visibles

| Id | Tâche | DoD |
|----|--------|-----|
| V1.1 | Handler + route Vault **GET `/ui/dlp/energy-summary`** (gateway vers DLP). | Route enregistrée ; appel DLP avec query string ; erreurs normalisées. |
| V1.2 | Handlers + routes Vault **DIVA** : `/ui/diva/insights` (GET), `/ui/diva/generate` (POST), `/ui/diva/jobs/:contextHash` (GET). **À vérifier selon l’usage réel du bloc DIVA visible** : si un écran Palier 1 utilise déjà `explain` ou `explain/async`, inclure `/ui/diva/explain` et `/ui/diva/explain/async` dans le Palier 1 (sinon Palier 1 déclaré conforme mais incomplet). | Routes enregistrées ; appels DIVA ; timeouts et erreurs stables ; périmètre Palier 1 aligné sur les écrans réellement affichés. |

---

### Lot 2 — Palier 1 — Linky bascule DLP/DIVA visibles vers Vault

| Id | Tâche | DoD |
|----|--------|-----|
| L2.1 | `app/api/dashboard-metrics/route.ts` : tuile strategic_energy → `VAULT_URL + "/ui/dlp/energy-summary"`. | Plus d’usage de `DLP_URL` dans ce fichier. |
| L2.2 | `app/api/dlp/energy-summary/route.ts` : appel `VAULT_URL + "/ui/dlp/energy-summary"`. | Idem. |
| L2.3 | `app/api/diva/*` (insight, prewarm, refresh, jobs ; **+ explain / explain/async si l’usage réel du bloc DIVA visible le requiert**, cf. V1.2) : remplacer `DIVA_URL` par `VAULT_URL` + préfixe `/ui/diva/...`. | Plus d’usage de `DIVA_URL` dans ces routes ; périmètre aligné sur les écrans Palier 1. |
| L2.4 | `app/lib/dlpClient.ts` : pour les chemins utilisés par la grille / tuile (energy-summary), utiliser `VAULT_URL + "/ui/dlp/..."` ; ou adapter uniquement les routes appelées par le Palier 1. | Tuile Énergie et grille passent par Vault. |

**DoD lot 2 :** Recette manuelle ou automatisée : tuile Énergie stratégique + bloc DIVA (insight, prewarm) affichés correctement ; grep code + env confirme qu’aucune lecture de `DLP_URL` ni `DIVA_URL` dans les chemins critiques (dashboard-metrics, energy-summary, diva/*).

---

### Lot 3 — Palier 2 — Vault routes DLP admin

| Id | Tâche | DoD |
|----|--------|-----|
| V3.1 | Routes Vault `/ui/dlp/companies`, `/ui/dlp/dlps`, `/ui/dlp/dlps/:id`, `/ui/dlp/perimeters`, `/ui/dlp/perimeters/:id`, `/ui/dlp/project-perimeter-map`, `/ui/dlp/project-perimeter-map/:id` (GET, POST, PATCH, DELETE selon analyse). | Toutes enregistrées ; gateway vers DLP ; headers et erreurs selon 2.4 / 2.5. |

---

### Lot 4 — Palier 2 — Linky admin DLP et sync-companies

| Id | Tâche | DoD |
|----|--------|-----|
| L4.1 | Toutes les routes `app/api/dlp/*` (companies, dlps, perimeters, project-perimeter-map, decisions, sync-companies) appellent `VAULT_URL + "/ui/dlp/..."`. | Plus d’appel direct à DLP depuis Linky. |
| L4.2 | `app/lib/dlpClient.ts` : **décision de design** à tracer — **option A** : conserver comme client interne vers Vault (`VAULT_URL` + `/ui/dlp/...`) ; **option B** : supprimer si la mutualisation ne sert plus (appels directs dans chaque route). | Aucune référence à `DLP_URL` ; choix A ou B documenté. |

**DoD lot 4 :** Admin DLP (companies, dlps, perimeters, project-perimeter-map), décisions, sync-companies fonctionnent via Vault ; recette manuelle ou scénario E2E.

---

### Lot 5 — Nettoyage et conformité finale

| Id | Tâche | DoD |
|----|--------|-----|
| L5.1 | Suppression des variables d’environnement de **connectivité** : `DLP_URL`, `DIVA_URL`, `DIVA_TIMEOUT_MS`, `DIVA_PREWARM_TIMEOUT_MS`, `DIVA_REFRESH_TIMEOUT_MS`. Pour **`DIVA_PREWARM_ENABLED`** (flag fonctionnel, pas uniquement connectivité) : vérifier si la feature prewarm reste pilotée côté Linky (sans URL directe vers DIVA), si le flag migre côté Vault, ou s’il disparaît. **Règle :** pour chaque variable DIVA restante, trancher si elle relève d’un paramétrage de connectivité interdit côté Linky, ou d’un feature flag encore légitime. | Doc et runbooks à jour ; Linky ne requiert plus les variables de connectivité ; sort des flags documenté. |
| L5.2 | Vérification code : `grep -r "DLP_URL\|DIVA_URL" units/dorevia-linky` (et env dans CI/deploy) → aucun résultat. Vérification complémentaire : aucun client/helper ne construit d’URL DLP/DIVA en dur ; **aucun appel sortant** (`fetch`, `axios`, helpers maison, clients HTTP partagés) ne vise un host DLP/DIVA hors Vault. | Conformité ADR vérifiée ; pas de contournement possible. |
| L5.3 | **Contrôle CI :** Ajouter un contrôle qui **échoue** si `DLP_URL` ou `DIVA_URL` apparaît encore dans `units/dorevia-linky` (script ou step CI). Évite qu’un futur commit réintroduise un couplage direct par accident. | CI en place ; build/PR échoue en cas de régression. |
| L5.4 | Mise à jour des tests (unit / e2e) pour utiliser uniquement VAULT_URL pour les flux DLP/DIVA (mocks ou contrat Vault). | Tests verts ; pas de référence aux URLs DLP/DIVA dans les tests. |

---

## 3. Tests de recette

### 3.1 Recette Palier 1 (conformité minimale)

| Scénario | Attendu |
|----------|---------|
| Dashboard Linky — tuile Énergie stratégique | Données affichées ; requête va vers Vault (pas DLP direct). |
| Bloc DIVA — insight | Insight chargé ; requête vers Vault. |
| Bloc DIVA — prewarm / refresh | Pas d’erreur ; appels vers Vault. |
| Grille / synthèse utilisant energy-summary | Données cohérentes via Vault. |
| Critère env | Linky déployé sans `DLP_URL` ni `DIVA_URL` pour ces flux ; seul `VAULT_URL` utilisé. |

### 3.2 Recette Palier 2 (convergence complète)

| Scénario | Attendu |
|----------|---------|
| Admin DLP — companies | CRUD companies via Vault. |
| Admin DLP — dlps, perimeters, project-perimeter-map | CRUD opérationnel via Vault. |
| Sync-companies | Synchronisation Vault → DLP (via Vault) réussie. |
| Bloc DIVA — explain / explain async / jobs | Fonctionnel via Vault. |
| Critère final | Aucune variable `DLP_URL` / `DIVA_URL` dans le code ni dans la config déployée de Linky. |

### 3.3 Robustesse et erreurs

| Scénario | Attendu |
|----------|---------|
| DLP ou DIVA indisponible / timeout | Linky reçoit une réponse stable (ex. 502/503) et un body d’erreur lisible ; pas de stack ou message brut du service aval exposé au client. |
| Logs / traçabilité | Request-ID ou tenant visible dans les logs Vault pour le diagnostic. |

---

## 4. Ordre d’exécution recommandé

1. **Lot 0** (prérequis Vault).
2. **Lot 1** (routes Vault Palier 1).
3. **Lot 2** (Linky Palier 1) → **recette Palier 1**.
4. **Lot 3** (routes Vault Palier 2).
5. **Lot 4** (Linky Palier 2) → **recette Palier 2**.
6. **Lot 5** (nettoyage + critère « Linky ne lit plus DLP_URL / DIVA_URL ») → **recette finale**.

---

## 5. Références

- **ADR-001** : `ZeDocs/web51/ADR-001_LINKY_VAULT_GATEWAY_UNIQUE.md`
- **Analyse des impacts** : `ZeDocs/web51/ANALYSE_CONSEQUENCES_IMPLEMENTATION_ADR001.md` (écarts, fichiers, paliers, contraintes gateway et erreurs)
- **Note technique** : `ZeDocs/web51/NOTE_LINKY_VAULT_GATEWAY_UNIQUE_ERP_AGNOSTIQUE.md`

---

**Boussole d’exécution :** *La conformité ADR-001 est atteinte lorsque Vault est l’unique dépendance technique exposée à Linky pour les flux DLP et DIVA, sans changement du contrat front.*

*ZeDocs/web51 — Plan implémentation ADR-001 Linky Vault only v1.0 — 2026-03-15.*
