# Plan Sprint 07 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_07_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3** (Gate B pleine et close — §8)

**Sources :** [RAPPORT_SPRINT_06_LYNKI.md](RAPPORT_SPRINT_06_LYNKI.md) **v1.3** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.8** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v1.9** · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) · **Exécution :** [EXECUTION_TICKETS_SPRINT_07_LYNKI.md](EXECUTION_TICKETS_SPRINT_07_LYNKI.md) **v1.0** · **Rapport (squelette) :** [RAPPORT_SPRINT_07_LYNKI.md](RAPPORT_SPRINT_07_LYNKI.md) **v1.0**

---

## 1. Objectif du sprint

Après **clôture de Gate B** (doctrine Vault, chaîne Linky → Vault sans stub silencieux en environnement de référence), le Sprint 07 vise à **étendre la Synthèse comptable au-delà de la balance générale** en ouvrant les **premières restitutions Bilan** et **Compte de résultat**, tout en **renforçant la qualité des données GL** (partenaires côté Odoo → Vault) et les **habilitations** sur les surfaces comptables.

### Objectifs principaux

1. **Connecteur Odoo enrichi** — alimenter `partner_id` / `partner_name` dans le Vault (`account_move_lines`) pour rendre exploitables filtres et colonnes GL côté UI.
2. **Restitutions comptables** — premier incrément **`lynki.accounting.balance_sheet`** (Bilan) et **`lynki.accounting.income_statement`** (Compte de résultat), alignés sur le dictionnaire / référentiel.
3. **Sécurité fonctionnelle** — habilitations fines sur les routes **`/accounting/*`** (cohérence avec Admin / Controller / Manager).
4. **GL** — derniers enrichissements utiles restants (ex. filtre partenaire en UI une fois données disponibles, ajustements UX).

### Objectifs secondaires

5. Documentation : ALIGNEMENT, BACKLOG, **RAPPORT_SPRINT_07_LYNKI.md**.
6. Recette : contrôles non-régression BG / GL / exports.

**Hors sprint sauf arbitrage :**

- Multi-exercice avancé, rejouabilité Phase 4,
- Réconciliation bancaire,
- RBAC dynamique hors les trois rôles existants.

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Connecteur Odoo** | `partner_id` / `partner_name` → Vault |
| **Lot 2** | Bilan + Compte de résultat — premier incrément |
| **Lot 6** | Habilitations fines `/accounting/*` |
| **Lot 3** | GL — UI partenaire + enrichissements restants |
| **0 / transversal** | Doc, ALIGNEMENT, backlog, rapport sprint |

---

## 3. Dépendances

```text
Gate B pleine et close (Sprint 06 §8)
        │
        ├──> données de confiance (Vault) pour étendre les restitutions
        │
        ▼
Connecteur Odoo T37 (partner_id / partner_name)
        │
        ├──> T38 — GL filtre / affichage partenaire en UI
        │
        └──> base données pour agrégats Bilan / CR (T39–T40 selon modèle)
        │
        ▼
T39–T40 — balance_sheet / income_statement (premier incrément)
        │
        ▼
T41 — middleware / guards sur /accounting/*
        │
        ▼
T42 — doc + alignement + rapport Sprint 07
```

---

## 4. Tickets (Sprint 07)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T37** | **Connecteur Odoo** | Connecteur | Gate B close | todo |
| | Pousser `partner_id` / `partner_name` vers Vault (`account_move_lines`) | | | |
| **T38** | **Vault / Linky / UI** | Lot 3 | T37 | todo |
| | Exploiter `partner_name` dans le GL et filtres UI (aligné D15 Sprint 06) | | | |
| **T39** | **`lynki.accounting.balance_sheet`** — premier incrément | Lot 2 | Vault + référentiel | todo |
| | Contrat API, handler Vault, route Linky, bloc Synthèse minimal | | | |
| **T40** | **`lynki.accounting.income_statement`** — premier incrément | Lot 2 | T39 ou parallèle | todo |
| | Même schéma d’incrément que Bilan (cohérence dictionnaire) | | | |
| **T41** | **Habilitations fines** sur `/accounting/*` | Lot 6 | T32 Sprint 06 | todo |
| | Middleware ou guards : Admin / Controller / Manager selon règles produit | | | |
| **T42** | **Doc / gating** | transversal | T37–T41 | todo |
| | `ALIGNEMENT` (bump post-sprint, ex. **v2.0**), `BACKLOG` (ex. **v1.9**), `RAPPORT_SPRINT_07_LYNKI.md`, liens Gate C / D — cf. [EXECUTION_TICKETS_SPRINT_07_LYNKI.md](EXECUTION_TICKETS_SPRINT_07_LYNKI.md) §9 | | | |

*(T39–T40 peuvent être légèrement séquentiels si un seul socle agrégation ; arbitrage en cours de sprint.)*

---

## 5. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T37** | Odoo envoie `partner_id` / `partner_name` ; upsert Vault idempotent ; recette sur échantillon réel |
| **T38** | Filtre / affichage partenaire sur page GL si données présentes ; pas de régression journal / pagination |
| **T39** | Endpoint documenté ; `data_source` explicite ; pas de stub silencieux si `LINKY_ACCOUNTING_STRICT=1` |
| **T40** | Idem T39 pour le compte de résultat ; libellés produit honnêtes (périmètre « premier incrément ») |
| **T41** | Routes `/accounting/*` couvertes par la même discipline que `/admin/*` ; matrice documentée |
| **T42** | ALIGNEMENT + BACKLOG + rapport sprint synchronisés ; Gate C / D mises à jour |

---

## 6. Recette — contrôles Sprint 07

### 6.1 Connecteur Odoo (T37)

| Contrôle | Attendu |
|----------|---------|
| Lignes Vault | `partner_id` / `partner_name` non vides quand Odoo les fournit |
| Idempotence | Pas de doublons sur re-push |
| Erreurs | Loggées ; pas de corruption tenant |

### 6.2 GL / UI (T38)

| Contrôle | Attendu |
|----------|---------|
| Filtre partenaire | Cohérent avec filtre Vault |
| Export | Colonnes partenaire si filtre actif |

### 6.3 Bilan / CR (T39–T40)

| Contrôle | Attendu |
|----------|---------|
| `restitution_id` | `lynki.accounting.balance_sheet` / `lynki.accounting.income_statement` |
| Source | Vault ; `referentiel_version` exposé |
| Strict | `502` si Vault indisponible, pas de stub trompeur |

### 6.4 Habilitations (T41)

| Contrôle | Attendu |
|----------|---------|
| Manager | Accès conforme à la matrice (lecture vs export) |
| Non-régression | Cockpit inchangé |

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| Bilan / CR trop ambitieux pour un sprint | Livrer un **premier incrément** à périmètre réduit ; documenter explicitement les limites |
| Données partenaires incomplètes dans Odoo | Tolérance `NULL` ; message produit clair |
| Complexité middleware `/accounting/*` | Réutiliser le modèle cookie / rôle de Sprint 06 |

---

## 8. Sortie attendue (fin de sprint)

* **Connecteur** : `partner_id` / `partner_name` alimentés ;
* **GL** : filtre / affichage partenaire opérationnel côté UI (si données) ;
* **Bilan + CR** : premier incrément exposé (Vault + Linky + Synthèse) ;
* **Habilitations** : `/accounting/*` couvertes ;
* **`RAPPORT_SPRINT_07_LYNKI.md`** rédigé ;
* **ALIGNEMENT** et **BACKLOG** mis à jour.

---

## 9. Gates — cible fin Sprint 07

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | **close** — inchangée |
| **Gate C** | **renforcée** — Bilan + CR + GL enrichi |
| **Gate D** | **renforcée** — habilitations fines + connecteur |

---

## 10. Après ce sprint

Suite logique :

1. Périmètre **Bilan / CR** élargi (rubriques, filtres, export).
2. **Tableau de bord** multi-période / multi-société.
3. **Plan Sprint 08** — consolidation recette et performance.

---

*Document d'exécution — extension Synthèse après Gate B.*  
*Tickets terrain : [EXECUTION_TICKETS_SPRINT_07_LYNKI.md](EXECUTION_TICKETS_SPRINT_07_LYNKI.md) **v1.0** — ordre recommandé T37 → T38 → T39 → T40 → T41 → T42 (parallélisations T39/T40 vs T37 : voir exécution §1).*
