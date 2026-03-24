# Plan Sprint 15 — Lynki

**Fichier canonique :** `PLAN_SPRINT_15_LYNKI.md`  
**Version :** 1.3 — mars 2026  
**Révision 1.1 :** source canonique provisoire (§3) ; contrat d’affichage T84 (§5.1) ; mécanique purge T86 tranchée (§5.3) ; deux scénarios e2e T85 (§5.2, §7).  
**Révision 1.2 :** doctrine sécurité route purge + observabilité minimale T86 (§5.3) ; règle « pas d’emplacement vide » T84 (§5.1).  
**Révision 1.3 :** lien vers [EXECUTION_TICKETS_SPRINT_15_LYNKI.md](EXECUTION_TICKETS_SPRINT_15_LYNKI.md) **v1.1** (gel exécution).  
**Sprint précédent :** [RAPPORT_SPRINT_14_LYNKI.md](RAPPORT_SPRINT_14_LYNKI.md) v1.2  
**Référence métier (obligatoire) :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) **v0.2**  
**Navigation :** [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) (référence générale)  
**Tickets d’exécution :** [EXECUTION_TICKETS_SPRINT_15_LYNKI.md](EXECUTION_TICKETS_SPRINT_15_LYNKI.md) v1.1

---

## 1. Contexte

Le Sprint 14 a livré **chrome Pilotage / Synthèse**, **DOCX v2**, **historisation FactsPack** — Lynki est plus lisible, documentable et traçable.

Un **écart produit** restait visible pour la MOA : les indicateurs de **rapprochement bancaire** existent et s’affichent en **Pilotage**, mais pas en **Synthèse comptable**, alors que la MOA y attend le même **niveau de confiance** sur les flux ([contrat §3.1](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md)).

Le **Sprint 15** ancre la Synthèse sur le **contrat métier v0.2** : livrer le bloc **« État du rapprochement bancaire »**, respecter les règles de **prudence**, **non-contradiction** avec le Pilotage et **traçabilité** ; traiter en parallèle une **dette Sprint 14** opérationnelle (rétention FactsPack).

---

## 2. Objectifs

| # | Objectif | Composant | Référence contrat |
|---|----------|-----------|-------------------|
| A | **Bloc « État du rapprochement bancaire »** en tête de Synthèse — indicateurs minimum, états (aligné / partiel / indisponible / non aligné), référence d’agrégation | Linky UI (+ réutilisation agrégats existants) | §3.1 C1–C7, §5, §6 |
| B | **Cohérence Pilotage × Synthèse** — pas de contradiction silencieuse ; non-alignement explicite si périmètre ou source diffèrent | Linky (données + tests) | §5.1, §5.2, §6.3–6.4 |
| C | **Rétention FactsPack** — TTL / purge (cible **90 jours** annoncée Sprint 14) | Vault (+ doc ops) | Dette [RAPPORT_SPRINT_14](RAPPORT_SPRINT_14_LYNKI.md) §6 |

**Optionnel (hors gate bloquante si charge) :** lien « Voir le détail en Pilotage » (contrat §3.1 C8 — V1.1 produit).

---

## 3. Périmètre

### Dans le sprint

- Intégration d’un bloc dédié dans `AccountingSummaryView` (ou équivalent), **au-dessus** des rubriques Bilan / CdR, libellé principal **État du rapprochement bancaire** ; sous-libellé **Confiance des flux** autorisé (contrat §5.3).
- Réutilisation prioritaire des chemins existants : `dashboard-metrics`, proxy `/api/...` déjà utilisés par les cartes Pilotage, `/ui/aggregations/treasury`, `bank-reconciliation-health` — **sans dupliquer la logique métier** côté front si évitable.
- Affichage des **états** attendus (contrat §3.1 tableau « États attendus ») : aucun silence UI sur indisponibilité ou partiel.
- **Gate recette** aligné sur [contrat §6](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) (critères d’acceptation globaux).
- **Rétention `facts_pack_archive`** : politique **90 jours** + purge selon le **mode opératoire figé** §5.3 (handler Vault + cron plateforme documenté).

### Hors sprint (sauf arbitrage explicite)

- **Gel définitif** des définitions §4.1 du contrat : l’**atelier MOA** peut être **en cours** pendant le sprint.  
- **Source canonique provisoire (Sprint 15) :** en l’**absence de définition MOA figée au démarrage du sprint** pour un indicateur donné (ex. le « 25 % »), le Sprint 15 s’appuie sur une **source canonique provisoire identique à celle du Pilotage** pour ce même indicateur (mêmes agrégats / mêmes routes ou proxies que les cartes trésorerie déjà affichées). Toute divergence ultérieure après atelier §4.1 sera reflétée dans le contrat, pas en silence UI.  
- L’implémentation V1 respecte les **états** et la **cohérence** avec le Pilotage (contrat §5.1–§5.2). La **v0.3 du contrat** (extension blocs canoniques complets) est **hors Sprint 15**.
- Rejouabilité v2 (régénération depuis pack archivé), logo DOCX embarqué, netting multi-devises, calendrier comptable v2 — restent en **backlog** ([PLAN_SPRINT_14 §11](PLAN_SPRINT_14_LYNKI.md)).

---

## 4. Dépendances

| Dépendance | Source | Statut |
|------------|--------|--------|
| Sprint 14 livré (T78–T83) | [RAPPORT_SPRINT_14_LYNKI.md](RAPPORT_SPRINT_14_LYNKI.md) v1.2 | ✅ |
| Contrat Synthèse V1 v0.2 | [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) | ✅ Référence sprint |
| Agrégats trésorerie / bank-reconciliation-health | Vault + routes Linky existantes | ✅ |
| Composant `BankReconciliationIndicator` (base possible) | `units/dorevia-linky` | ⚠️ À réactiver / intégrer |

---

## 5. Détails techniques (indicatifs)

### 5.1 Bloc Synthèse — rapprochement (Objectif A)

- **Placement :** premier bloc métier de la zone Synthèse (sous le bandeau filtres / titre si présent).
- **Données :** même famille que `TresoreriePositionCard` / `TreasuryCard` / `dashboard-metrics` pour le taux, montants restants, lignes non rapprochées, date ancienne — avec **même périmètre** tenant / société que les filtres courants, ou message **non aligné** (contrat C3, C6). **Source canonique provisoire :** alignement Pilotage (§3).
- **UI :** badges `Partiel`, messages d’indisponibilité, ligne `Réf. …` comme les autres blocs.
- **Fichiers probables :** `AccountingSummaryView.tsx`, `BankReconciliationIndicator.tsx` (refactor ou remplacement), route API existante ou agrégation client ; pas de nouvelle brique Vault **sauf** besoin de normalisation périmètre (à trancher en tickets).

#### Contrat d’affichage (T84) — ordre vertical recommandé

Pour le ticket d’exécution et la reproductibilité QA, l’ordre d’affichage du bloc est :

1. **Libellé principal** — *État du rapprochement bancaire* (sous-libellé optionnel *Confiance des flux*, contrat §5.3).
2. **Zone valeur principale** — indicateur chiffré prioritaire lorsque la donnée est **disponible et alignée** (ex. taux ou part rapprochée).
3. **État** — badge ou bandeau explicite : `OK` / aligné, `Partiel`, `Indisponible`, `Non aligné` (contrat §3.1 « États attendus »).
4. **Métriques secondaires** — **2 à 3** lignes au plus (ex. reste à rapprocher, nombre d’écritures non rapprochées, date la plus ancienne) ; masquer ou regrouper si indisponible sans laisser des trous silencieux.
5. **Ligne `Réf. …`** — source / version / agrégation, comme les autres restitutions Lynki (contrat C7).

**Règle anti-trou UI (T84) :** en **indisponibilité** ou **non-alignement**, le **message d’état remplace la valeur principale** dans la zone prévue pour celle-ci : **aucun emplacement vide** (pas de « trou » entre le libellé et le badge d’état). Le libellé + le message d’état + le badge (si distinct) restent cohérents visuellement.

### 5.2 Cohérence Pilotage × Synthèse (Objectif B)

- Comparaison **à recette** : mêmes filtres → indicateurs compatibles ou explication affichée.
- Tests **e2e** (Playwright), **deux scénarios obligatoires (T85)** :
  1. **Cas aligné** — pour un périmètre où Pilotage et Synthèse reçoivent la même donnée : valeurs ou libellés **cohérents** (pas de contradiction silencieuse).
  2. **Cas non aligné** — périmètre ou source tels que la Synthèse **ne peut pas** afficher le même indicateur de façon fiable : la Synthèse affiche **explicitement** l’état **non aligné** (ou équivalent contrat), **sans** imposer un chiffre arbitraire. *Ce scénario est prioritaire pour la valeur du sprint.*

### 5.3 Rétention FactsPack (Objectif C) — mode opératoire cible

**Décision plan (Sprint 15) :** combinaison **handler Vault** + **cron plateforme documenté** (aligné sur l’esprit des jobs type snapshot trésorerie : route déclenchée par l’orchestration, pas une purge SQL manuelle ad hoc comme seul mode).

| Élément | Choix |
|---------|--------|
| **Exécution de la purge** | **Route HTTP Vault** dédiée (ex. `POST` sous `/ui/jobs/…` ou équivalent), protégée par **secret / token interne** (même famille que les autres jobs Vault). Le handler exécute le `DELETE` (ou équivalent transactionnel) sur `facts_pack_archive` pour `generated_at < now() - interval '90 days'`. |
| **Planification** | **Cron documenté** côté plateforme (docker-compose `cron` / systemd / orchestrateur) qui appelle la route à fréquence définie (ex. quotidien). La doc ops décrit URL, en-têtes, variables d’environnement. |
| **Non-retenu comme mode principal** | Purge SQL **uniquement** manuelle sans route ni doc ; scheduler goroutine **interne** permanent dans Vault — *réservé à un arbitrage ultérieur si l’équipe standardise tous les jobs en interne.* |

**Doctrine sécurité (T86) :** la route de purge **ne doit jamais être exposée sans authentification technique explicite** (secret / token / équivalent réservé à l’orchestration) et **ne doit pas être invocable depuis le navigateur utilisateur** (pas d’appel Linky public, pas de cookie session seul). Elle est réservée au **cron / job interne plateforme** documenté.

**Observabilité minimale (T86) :** chaque exécution du job produit un **log structuré** (ou métrique équivalente) contenant au minimum : **date/heure d’exécution**, **nombre de lignes supprimées**, **seuil appliqué** (ex. `90j`), **statut** succès / erreur (et message d’erreur si échec). La doc ops référence ces champs pour le diagnostic.

- Pas de régression sur `GET` archive récente ; pas d’impact sur les insights hors table d’archive.

---

## 6. Tickets (proposition)

| # | Titre | Composant | Dépendance |
|---|-------|-----------|------------|
| T84 | Linky — bloc **État du rapprochement bancaire** en Synthèse (§3.1 contrat) | Linky UI | — |
| T85 | Linky — cohérence filtres / états non-alignement + tests e2e Pilotage × Synthèse | Linky | T84 |
| T86 | Vault — purge **90j** `facts_pack_archive` : **handler job + cron documenté** (§5.3) | Vault | — |
| T87 | Transversal — mise à jour **contrat v0.3 brouillon** ou annexe §4.1 post-atelier MOA + non-régression doc | ZeDocs / QA | T84–T86 (T87 peut chevaucher) |

**Séquence recommandée :** **T84 + T86** en parallèle → **T85** → **T87** (clôture sprint + recette MOA).

---

## 7. Definition of Done

- [ ] Bloc **État du rapprochement bancaire** visible en Synthèse, conforme [contrat §3.1](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) (C1–C7 minimum), **ordre d’affichage** conforme §5.1 (contrat d’affichage T84), **règle anti-trou UI** (message d’état remplace la valeur principale si besoin).
- [ ] **Source canonique provisoire** : alignement Pilotage tant que §4.1 MOA non figé (§3).
- [ ] États **partiel / indisponible / non aligné** explicites — pas de chiffre trompeur (§5.2).
- [ ] Référence d’agrégation / source affichée sur le bloc (C7).
- [ ] Recette : critères [contrat §6](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) couverts (manuel + e2e).
- [ ] **E2E T85 : deux scénarios** — **aligné** + **non aligné** (§5.2) ; le second couvert de façon explicite.
- [ ] Rétention FactsPack **90j** : **route job Vault + cron documenté** opérationnels (§5.3), **doctrine sécurité** respectée, **observabilité minimale** des exécutions (date, lignes supprimées, seuil, statut).
- [ ] Builds Vault + Linky OK ; non-régression Synthèse existante (BG, rubriques, Diva, tiers).

---

## 8. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| §4.1 MOA non figé à temps | Libellé « 25 % » interprété différemment | **Source canonique provisoire = Pilotage** (§3) + documenter l’écart dans le contrat après atelier |
| Périmètre date Société ≠ agrégat banque | Non-alignement fréquent | États C6 + message clair ; pas forcer un chiffre |
| Purge FactsPack trop agressive | Perte audit | TTL 90j uniquement sur archive ; pas toucher insights actifs ; backup / log avant purge |

---

## 9. Gates — cible fin Sprint 15

| Gate | Statut cible |
|------|--------------|
| **Gate A–C** | ✅ Inchangés (intégrité, ERP, surface Synthèse) |
| **Gate D — Synthèse V1 confiance** | ✅ **Close (périmètre Sprint 15)** — bloc rapprochement bancaire livré en Synthèse, règles de prudence respectées, rétention FactsPack opérationnelle |

---

## 10. Après ce sprint

- **Contrat v0.3** — extension blocs canoniques Bilan / CdR / Tiers / GL (déjà listée contrat §7 étape 5).
- **Rejouabilité v2** — régénération insight/rapport depuis pack archivé.
- **DOCX** — logo embarqué, résumé §3.1 en document (contrat §6.6).
- **Netting multi-devises**, **calendrier comptable v2** — backlog phase 2.

---

*Fin du plan Sprint 15 — référence métier : [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2.*
