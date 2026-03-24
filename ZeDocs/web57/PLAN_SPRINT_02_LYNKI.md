# Plan Sprint 02 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_02_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Date :** 20 mars 2026  
**Révision 1.1 (gel) :** chemin HTTP vs identifiant canonique **sans ambiguïté** (T11) ; T14 GL **minimal mais canonique** (filtres compte + période + périmètre) ; sortie sprint **stub** — pas de secours silencieux en env de référence.  
**Statut :** sprint exécutable — suite logique du [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md).  
**Exécution terrain :** [EXECUTION_TICKETS_SPRINT_02_LYNKI.md](EXECUTION_TICKETS_SPRINT_02_LYNKI.md).

**Sources :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.1** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md) **v1.1**

---

## 1. Objectif du sprint

Après la **livraison technique** du Sprint 01 (navigation, contrat `lynki.accounting.trial_balance`, bloc BG avec stub documenté), le Sprint 02 vise à :

1. **Matérialiser la doctrine Vault** sur la **balance générale** : dans **`sources/vault`**, exposition HTTP **`GET /api/accounting/trial-balance`** dont le payload respecte la restitution canonique **`lynki.accounting.trial_balance`** (contrat déjà figé côté Linky).
2. **Retirer le chemin stub** dès que le Vault répond conformément (comportement documenté en [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md) §5 D1).
3. **Ouvrir le Lot 4B** : au minimum **traçabilité / versioning** du référentiel sur les réponses API concernées (cf. plan consolidé §3.4 et exigences référentiel).
4. **Amorcer le Lot 3** : **première profondeur BG → GL** (chaîne de preuve : au moins une navigation ou un panneau depuis une ligne de balance vers le **grand livre** ou un équivalent minimal documenté), sans prétendre couvrir l’écran Synthèse entier.

**Prérequis non bloquant pour coder** mais **à boucler en parallèle** : recette **T3** du Sprint 01 et **prononcé Gate A** lorsque R1–R7 sont verts ([RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md) §4, §8).

---

## 2. Périmètre (lots / epics retenus)

| Lot | Epic (rappel backlog) |
|-----|----------------------|
| **Vault** *(transversal)* | Handler + exposition HTTP **`GET /api/accounting/trial-balance`** — restitution canonique **`lynki.accounting.trial_balance`** — données **réelles** BG |
| **4A** *(clôture)* | Fin du mode **stub** côté `units/dorevia-linky` lorsque le Vault est joignable et conforme au contrat |
| **4B** *(début)* | Version référentiel / journalisation sur payloads `lynki.accounting.*` concernés ; réconciliation minimale documentée (ex. bilan ↔ BG si déjà disponible côté données — sinon périmètre réduit explicite) |
| **3** *(amorce)* | **BG → GL** : premier incrément UX + API nécessaire (identifiants de ligne, période, compte) |

**Hors sprint ou optionnel** : repositionnement des onglets dans le chrome header (Décision D2 — arbitrage UX) ; blocs Bilan / CR / tiers complets ; Lot 5 DICO KPI ; Lot 6 rôles / exports.

---

## 3. Dépendances entre items

```
Recette T3 / Gate A (Sprint 01) ──> (parallèle) validation produit navigation
         │
Vault trial_balance (réel) ──> retrait stub Linky ──> confiance données BG
         │
         ├──> 4B (versioning API) sur trial_balance (+ autres si prêt)
         │
         └──> 3 amorce (drill BG → GL) — lignes BG stables + **`lynki.accounting.general_ledger`** filtré **compte + période + périmètre**
```

---

## 4. Tickets (à recopier dans l’outil avec IDs)

| # | Titre | Lot | Dépend de | Statut |
|---|--------|-----|-----------|--------|
| **T10** | Clôture recette **T3** / prononcé **Gate A** (R1–R7) — recopie résultats dans rapport ou fichier trace | 1 | Sprint 01 livré | todo |
| **T11** | **Vault** : implémenter la source de vérité `trial_balance` (handler, requêtes, erreurs) ; exposition HTTP **`GET /api/accounting/trial-balance`** correspondant à la restitution canonique **`lynki.accounting.trial_balance`** | Vault | Contrat Sprint 01 (T5) | todo |
| **T12** | **Linky** : consommation **données réelles** ; désactivation du **stub** quand `complete: true` (ou règle équivalente) ; tests / recette sur états chargement / erreur | 4A | T11 | todo |
| **T13** | **4B** : exposer / journaliser **version référentiel** sur la réponse `trial_balance` (+ log d’audit si prévu plan) | 4B | T11 | todo |
| **T14** | **3** : incrément **minimal mais canonique** — contrat **`lynki.accounting.general_ledger`** (à figer si variante backlog), **filtré par compte + période + périmètre** ; route Vault + **premier lien UI** ligne BG → écritures GL (pas de drill flou ; critères d’acceptation écrits) | 3 | T11, T12 | todo |
| **T15** | **Doc** : mettre à jour [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) / backlog — cases cochées ; noter fin de stub | 0 / transversal | T12–T14 | todo |

*(Ajuster la granularité : T14 peut être découpé en sous-tâches back / front.)*

---

## 5. Definition of Done par ticket (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T10** | Tableau §4 du rapport Sprint 01 complété ou équivalent ; **Gate A** explicitement **atteint** ou report daté. |
| **T11** | Appel end-to-end depuis l’environnement cible : JSON conforme aux types `lynki.accounting.trial_balance` ; erreurs HTTP cohérentes ; **aucune** lecture comptable contournant le Vault pour ce flux. |
| **T12** | Plus de stub par défaut quand Vault disponible en **environnement de référence** ; **aucun stub silencieux** : tout fallback hors référence = **documenté** + **visible** (UI ou trace) ; états chargement / erreur testables ; **critères de recette** copiables. |
| **T13** | Champ(s) de version ou mécanisme équivalent **visible** consommateur ou **journalisé** selon règle produit ; correspondance avec [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (ou bump documenté). |
| **T14** | Au moins **un** scénario utilisateur : depuis une **ligne** de balance, accès à la **preuve GL** via **`lynki.accounting.general_ledger`** avec filtres **compte + période + périmètre** explicites ; identifiants stables ; pas de régression Gate A. |
| **T15** | Traçabilité doc ↔ code ; lien vers ce plan et vers [RAPPORT_SPRINT_01_LYNKI.md](RAPPORT_SPRINT_01_LYNKI.md). |

**Renvoi plan consolidé :** [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) §8 (DoD lots), §11 (gates **B** / **C** en préparation).

---

## 6. Risque principal du sprint

| Risque | Mitigation |
|--------|------------|
| **Données BG indisponibles ou partielles** dans le Vault (qualité, périmètre entité) | Périmètre **tenant / période** explicite ; erreurs claires ; ne pas élargir l’UI au-delà du bloc BG + amorce GL sans stabilisation données. |
| **4B trop large** | Limiter au **premier** endpoint métier (`trial_balance`) + règle de versioning documentée ; étendre ensuite. |

---

## 7. Sortie attendue (fin de sprint)

* **Vault** : endpoint **`trial_balance`** **réel** et consommé par Linky ; **stub** retiré en **environnement de référence** dès que le Vault répond — **pas de stub silencieux** : tout mode secours restant (ex. env sans Vault) = **documenté** et **visible** (pas de confusion avec du réel).
* **4B** : **version référentiel** (ou équivalent) sur au moins les réponses `trial_balance`.
* **Lot 3** : **première profondeur BG → GL** livrée avec critères d’acceptation écrits.
* **Gate A** : si pas déjà fait en T10, ne pas confondre avec **Gate B/C** — le sprint 02 prépare **Gate C** (traçabilité + chaîne de preuve).

---

## 8. Après ce sprint

* **Clôture :** [RAPPORT_SPRINT_02_LYNKI.md](RAPPORT_SPRINT_02_LYNKI.md) **v1.1** (vocabulaire **BG pilote / périmètre partiel**, recette §11).
* Passer en revue **Gate B** : **partiel** tant que la BG n’est pas **complète** — voir rapport §1.1.
* Suite : **[PLAN_SPRINT_03_LYNKI.md](PLAN_SPRINT_03_LYNKI.md)** — **`lynki.accounting.general_ledger`** + drill **BG → GL** ; **extension** couverture `trial_balance` au-delà de `payroll_od_lines`.
* Étendre **4B** aux autres `lynki.accounting.*` selon priorité backlog.
* Approfondir **drill-down** (rubrique → compte → BG → GL) selon [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md).

---

*Document d’exécution — doctrine Vault : [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) §3.1. — tickets terrain : [EXECUTION_TICKETS_SPRINT_02_LYNKI.md](EXECUTION_TICKETS_SPRINT_02_LYNKI.md).*
