# Plan Sprint 06 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_06_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_05_LYNKI.md](RAPPORT_SPRINT_05_LYNKI.md) **v1.0**

**Sources :** [RAPPORT_SPRINT_05_LYNKI.md](RAPPORT_SPRINT_05_LYNKI.md) **v1.0** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.6** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v1.7**

---

## 1. Objectif du sprint

> Après la promotion du GL en route dédiée et le renforcement de Gate C, le Sprint 06 vise à **clore définitivement Gate B**, puis à faire entrer la Synthèse comptable dans une logique d'**usage sécurisé et exploitable**, grâce à un premier niveau de **rôles / habilitations** et à un **grand livre enrichi**.

Le Sprint 05 a livré le socle technique (route GL, navigation, export). Le Sprint 06 n'est plus "faire exister la Synthèse" : c'est **la rendre exploitable en production contrôlée**.

### Objectifs principaux

1. **Clore Gate B** — constater C5 en environnement de référence, archiver la preuve, fermer la formulation "conditionnelle" dans tous les documents.

2. **Sécuriser les accès** — premier niveau de rôles / habilitations :
   - protection des routes `/admin/*`,
   - différenciation minimale **Admin / Controller / Manager**.

3. **Enrichir le grand livre** — rendre la page GL vraiment exploitable en analyse :
   - filtres journal et partenaire,
   - pagination (> 10 000 lignes),
   - solde d'ouverture explicite.

### Objectifs secondaires

4. Export GL enrichi (si filtres et pagination stables).
5. Amorce Bilan / Compte de résultat (si Gate B pleine constatée et temps disponible).

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Gate / Validation** | Constat C5, clôture Gate B, mise à jour documentaire |
| **Lot 6** | Rôles / habilitations — Admin, Controller, Manager |
| **Lot 3** | GL enrichi — filtres, pagination, solde d'ouverture |
| **Lot 6 *(amorce)*** | Export GL enrichi si Lot 3 stable |
| **Lot 2 *(amorce)*** | Bilan / CR si Gate B pleine et temps disponible |

**Hors sprint sauf arbitrage :**

- Filtres avancés partenaire / date par écriture (au-delà du filtre journal),
- Réconciliation bancaire Phase 2,
- Tableau de bord multi-exercice,
- Rejouabilité utilisateur Phase 4.

---

## 3. Dépendances

```text
Constat C5 en env de référence (T31)
        │
        ├──> Gate B pleine + clôture documentaire
        │
        └──> base saine pour Lot 6 (rôles en production)
                         │
                         ▼
        Rôles / habilitations (T32)
                         │
                         ├──> protection /admin/*
                         └──> base Auth pour GL enrichi + export protégé
                                      │
                                      ▼
                        GL enrichi (T33 + T34)
                                      │
                                      ├──> filtres journal / partenaire
                                      ├──> pagination
                                      └──> export GL enrichi (T35 — conditionnel)
```

---

## 4. Tickets (Sprint 06)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T31** | **Constater C5** en env de référence + clôture Gate B (RAPPORT_SPRINT_05 v1.1 + RAPPORT_SPRINT_04 v1.2) | Gate | Sprint 05 livré | todo |
| **T32** | **Rôles / habilitations** — protection `/admin/*` + différenciation Admin / Controller / Manager | Lot 6 | T31 | todo |
| **T33** | **GL enrichi — filtres** : filtre journal (`journal_code`), filtre partenaire (si disponible), transmission côté Vault | Lot 3 | Sprint 05 | todo |
| **T34** | **GL enrichi — pagination** : page / offset Vault + pagination UI, gestion volumétrie > 10 000 lignes + solde d'ouverture | Lot 3 | T33 | todo |
| **T35** | **Export GL enrichi** : intègre les filtres journal/partenaire + pagination dans le CSV export | Lot 3 / 6 | T33–T34 | todo |
| **T36** | **Doc / gating** : ALIGNEMENT v1.8, BACKLOG v1.7, rapport Sprint 06, bilan Gate B pleine | transversal | T31–T35 | todo |

*(T35 conditionnel : à prioriser si T33–T34 sont stables avant la fin du sprint. T36 clôt le sprint.)*

---

## 5. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T31** | Constat C5 archivé dans `RAPPORT_SPRINT_05_LYNKI.md` **v1.1** (daté, env, checks) ; `RAPPORT_SPRINT_04_LYNKI.md` **v1.2** mis à jour avec Gate B pleine. |
| **T32** | Routes `/admin/*` protégées (middleware ou guard) ; rôles Admin / Controller / Manager définis et appliqués sur au moins un endpoint sensible ; documentation du modèle de rôle. |
| **T33** | `GET /api/accounting/general-ledger` accepte `journal_code` (opt) et `partner_id` (opt) côté Vault ; page GL propose les filtres ; les paramètres sont transmis sans dérive. |
| **T34** | Pagination `page` / `limit` opérationnelle côté Vault ; UI pagine sans recharger l'entête ; solde d'ouverture calculé et affiché avant la première ligne de la page. |
| **T35** | Export CSV reprend les filtres journal/partenaire ; mention des filtres actifs dans les headers CSV. |
| **T36** | `RAPPORT_SPRINT_06_LYNKI.md` rédigé et cohérent avec le code livré ; Gate B prononcée pleine (ou blocage documenté) ; ALIGNEMENT v1.8 + BACKLOG v1.7 à jour. |

---

## 6. Recette — contrôles Sprint 06

### 6.1 Gate B pleine (T31)

| Contrôle | Attendu |
|----------|---------|
| `LINKY_ACCOUNTING_STRICT=1` | actif en env de référence |
| `data_source` | `vault` sur toutes les routes `lynki.accounting.*` |
| `X-Lynki-Accounting-Source` | `vault` |
| Stub silencieux | absent |
| Trace datée | dans `RAPPORT_SPRINT_05_LYNKI.md` v1.1 + `RAPPORT_SPRINT_04_LYNKI.md` v1.2 |

### 6.2 Rôles / habilitations (T32)

| Contrôle | Attendu |
|----------|---------|
| `/admin/*` sans auth | 401 ou redirection login |
| Rôle Admin | accès complet |
| Rôle Controller | accès Synthèse + GL ; pas d'admin système |
| Rôle Manager | accès lecture Synthèse ; pas d'export ni GL |
| Régression routes existantes | aucune |

### 6.3 GL enrichi (T33–T34)

| Contrôle | Attendu |
|----------|---------|
| Filtre `journal_code` | lignes filtrées côté Vault |
| Filtre `partner_id` | lignes filtrées si dispo |
| Pagination page 2+ | solde d'ouverture = solde fin page 1 |
| URL filtrée | partageable et bookmarkable |
| Export avec filtres | colonnes `filter_journal` + `filter_partner` dans le CSV |

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| C5 bloqué côté infra (env de référence non dispo) | Traiter T31 en J1 ; ne pas engager T32–T35 sur une Gate B non close |
| Modèle de rôle trop complexe dès le premier sprint | Rester sur 3 rôles fixes (Admin / Controller / Manager) ; pas de RBAC dynamique en Sprint 06 |
| Pagination GL : solde d'ouverture coûteux côté Vault | Calculer le solde d'ouverture par requête `SUM` pré-page plutôt qu'en mémoire |
| T35 export enrichi : volume + filtres = lenteur | Conserver la limite 10 000 lignes filtrées ; avertissement si résultat tronqué |
| Régression BG ou GL existants | Tests de non-régression avant merge T33–T34 |

---

## 8. Sortie attendue (fin de sprint)

* **C5 constaté** → **Gate B pleine et close** ;
* **rôles Admin / Controller / Manager** opérationnels sur `/admin/*` et routes GL sensibles ;
* **GL enrichi** : filtres journal + pagination + solde d'ouverture ;
* **export GL enrichi** livré ou explicitement reporté avec motif ;
* **`RAPPORT_SPRINT_06_LYNKI.md`** rédigé ;
* **ALIGNEMENT v1.8** et **BACKLOG v1.7** à jour.

---

## 9. Gates — cible fin Sprint 06

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | **pleine et close** |
| **Gate C** | renforcée — GL filtrée et paginée ; complétion : export enrichi, Bilan/CR |
| **Gate D** | non ciblée dans ce sprint |

---

## 10. Après ce sprint

Si **Gate B pleine** est prononcée et Lot 6 amorçé, la suite naturelle :

1. **Bilan / Compte de résultat** (Lot 2 extension) — première restitution structurée au-delà de la BG.
2. **Export GL enrichi** si non livré en Sprint 06.
3. **Lot 6 approfondi** — politiques de rôle fine, audit trail des accès.
4. **Plan Sprint 07** — [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0** (Bilan / CR, connecteur partenaire, habilitations `/accounting/*`, GL).

---

*Document d'exécution — Gate B pleine, sécurisation accès, GL enrichi.*  
*Tickets terrain : [EXECUTION_TICKETS_SPRINT_06_LYNKI.md](EXECUTION_TICKETS_SPRINT_06_LYNKI.md) **v1.0** — priorité absolue T31.*  
*Suite : [PLAN_SPRINT_07_LYNKI.md](PLAN_SPRINT_07_LYNKI.md) **v1.0**.*
