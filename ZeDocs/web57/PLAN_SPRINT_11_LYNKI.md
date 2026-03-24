# Plan Sprint 11 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_11_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) **v1.0** (lecture comparative décisionnelle — N/N-1, SIG, exports tiers)

**Sources :** [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) **v1.0** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.2** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.3** · [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** (§4.4 comparaisons, §5.3 rejouabilité) · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) **v0.5** · **Exécution :** `EXECUTION_TICKETS_SPRINT_11_LYNKI.md` *(à créer)* · **Rapport :** `RAPPORT_SPRINT_11_LYNKI.md` *(à créer)*

---

## 1. Objectif du sprint

Le Sprint 10 a transformé la Synthèse comptable Lynki en **surface de lecture décisionnelle** :

- comparatif **N / N-1**,
- **SIG optionnels**,
- exports balances tiers,
- sélecteur de période minimal.

Le Sprint 11 vise à renforcer la **capacité d'analyse transverse** et la **robustesse produit** sur trois axes :

1. **Consolidation multi-sociétés** — permettre une lecture agrégée sur plusieurs sociétés d'un même tenant.
2. **Comparatifs plus riches** — trimestre, semestre, personnalisé, avec persistance en URL et export comparatif.
3. **Préparation du netting tiers V2** — enrichir le schéma et le connecteur pour rendre les balances tiers plus comptablement fiables.

Le sprint quitte donc la logique "une vue structurée pour une société donnée" pour entrer dans une logique **pilotage comptable consolidé et comparatif**.

### Objectifs principaux

1. **Multi-sociétés** — Bilan, CR, BG, balances tiers et exports supportent une sélection multi-sociétés.
2. **Comparatifs enrichis** — période trimestre, semestre, personnalisé ; comparatif exportable.
3. **Netting tiers V2 — fondations** — migration de schéma et connecteur Odoo pour `date_maturity`, `full_reconcile_id`, `matching_number`.

### Objectifs secondaires

4. **Exports comparatifs** — Bilan / CR en CSV avec colonnes N, N-1, Δ, Δ%.
5. **Persistance URL** — la période et le mode comparatif doivent être partageables.
6. **Documentation** — ALIGNEMENT, BACKLOG, `RAPPORT_SPRINT_11_LYNKI.md`.

**Hors sprint sauf arbitrage :**

- consolidation inter-tenants,
- rejouabilité formelle Phase 4,
- insights comptables Diva,
- netting tiers complet (moteur d'appariement / avoirs / lettrages partiels complexes),
- multi-devises.

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Lot 2 (extension)** | Consolidation multi-sociétés — Vault + UI |
| **Lot 2 (extension)** | Comparatifs enrichis — trimestre / semestre / personnalisé |
| **Lot 3 (extension)** | Exports comparatifs Bilan / CR |
| **Lot 2 / données** | Préparation netting tiers V2 — schéma + connecteur |
| **0 / transversal** | Non-régression, doc, recette terrain |

---

## 3. Dépendances

```text
Sprint 10 livré (comparatif N/N-1, SIG, exports tiers)
        │
        ├──> rubriques Bilan/CR stables
        ├──> surface Synthèse complète (4 blocs)
        ├──> périodes courante / N-1 déjà en place
        │
        ▼
T59 — Vault : multi-sociétés (company_ids[])
        │
        ├──> T60 — Linky : sélecteur multi-sociétés + persistance URL
        │
        ▼
T61 — Comparatifs enrichis (trimestre / semestre / personnalisé)
        │
        ├──> T62 — Exports comparatifs Bilan / CR
        │
        ▼
T63 — Migration schéma tiers V2 (date_maturity / reconcile)
        │
        ├──> T64 — Connecteur Odoo enrichi (date_maturity / reconcile)
        │
        ▼
T65 — Non-régression + doc + recette terrain
```

---

## 4. Tickets (Sprint 11)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T59** | **Vault — consolidation multi-sociétés** | Lot 2 | Sprint 10 clos | todo |
| | Les endpoints `trial-balance`, `balance-sheet/rubrics`, `income-statement/rubrics`, `aged-receivables`, `aged-payables` acceptent `company_ids` (CSV) en plus de `company_id`. Si `company_ids` est fourni, l'agrégation est faite sur le périmètre union des sociétés demandées. | | | |
| **T60** | **Linky / UI — sélecteur multi-sociétés + persistance URL** | Lot 2 UI | T59 | todo |
| | Le shell Synthèse permet de sélectionner "Toutes les sociétés" ou une sélection multiple explicite. Les paramètres sont portés dans l'URL (`company_ids=1,2,3`). Les blocs se rechargent sur ce périmètre consolidé. | | | |
| **T61** | **Comparatifs enrichis — trimestre / semestre / personnalisé** | Lot 2 | Sprint 10 clos | todo |
| | Le sélecteur de période s'élargit : exercice courant, exercice N-1, T1/T2/T3/T4, S1/S2, personnalisé. Le comparatif reste N/N-1 à durée équivalente. La logique de calcul de période est centralisée et réutilisée par tous les blocs. | | | |
| **T62** | **Exports comparatifs Bilan / CR** | Lot 3 | T61 | todo |
| | `GET /api/accounting/balance-sheet/rubrics/export?compare=n-1` et idem CR. Colonnes CSV : `rubric_id`, `label`, `section`, `amount_current`, `amount_previous`, `delta`, `delta_percent`, `period_from`, `period_to`, `period_previous_from`, `period_previous_to`, `tenant`, `referentiel_version`. | | | |
| **T63** | **Migration schéma tiers V2** | Lot données | Sprint 09 clos | todo |
| | Ajouter à `account_move_lines` : `date_maturity`, `full_reconcile_id`, `matching_number`. Migration SQL idempotente + lecture Vault. Pas encore de netting complet, mais schéma prêt. | | | |
| **T64** | **Connecteur Odoo enrichi — échéance / lettrage** | Lot données | T63 | todo |
| | Le connecteur Odoo pousse `date_maturity`, `full_reconcile_id`, `matching_number` dans le Vault. Objectif : préparer Sprint 12 pour balances tiers V2 plus fines. | | | |
| **T65** | **Non-régression + doc + recette terrain** | transversal | T59–T64 | todo |
| | Contrôle multi-sociétés, comparatifs enrichis, exports comparatifs, schéma tiers V2 sans régression. Mise à jour `ALIGNEMENT`, `BACKLOG`, `RAPPORT_SPRINT_11`. | | | |

---

## 5. Détail technique

### 5.1 Consolidation multi-sociétés (T59 / T60)

#### Contrat API

Les endpoints compatibles consolidation acceptent :

* `company_id` (historique, single company)
* **ou**
* `company_ids` (CSV : `1,2,3`)

**Règle :**

* si `company_ids` est présent, il prime sur `company_id`
* si aucun des deux n'est présent : périmètre "toutes sociétés du tenant"

#### SQL / agrégation

Le Vault doit convertir `company_ids` en tableau d'entiers et filtrer avec :

```sql
company_id = ANY($N)
```

ou équivalent, selon le driver.

#### UI

Le shell Synthèse propose :

* "Toutes les sociétés"
* sélection multiple
* répercussion en URL
* badge de périmètre visible dans le header ou la zone Synthèse

**Point de vigilance :** la consolidation n'est pas une simple somme aveugle si des règles spécifiques apparaissent plus tard ; en Sprint 11, elle est définie comme **agrégation additive sur le périmètre sélectionné**.

---

### 5.2 Comparatifs enrichis (T61)

#### Périodes cibles

| Mode | Exemple |
|------|---------|
| `current_year` | 2025-01-01 → 2025-12-31 |
| `previous_year` | 2024-01-01 → 2024-12-31 |
| `quarter` | 2025-01-01 → 2025-03-31 |
| `semester` | 2025-01-01 → 2025-06-30 |
| `custom` | dates libres |

#### Règle de comparatif

Toujours comparer à une période **de même durée**, décalée d'un an.

Exemples :

* T1 2025 → T1 2024
* S1 2025 → S1 2024
* période personnalisée 2025-02-15 → 2025-05-15 → comparaison 2024-02-15 → 2024-05-15

#### Persistance URL

Paramètres attendus :

* `period_mode=current_year|previous_year|quarter|semester|custom`
* `period_from=YYYY-MM-DD`
* `period_to=YYYY-MM-DD`
* `compare=n-1`

**Décision :** l'URL devient la source de vérité du périmètre de lecture.

---

### 5.3 Exports comparatifs (T62)

Les exports comparatifs Bilan / CR réutilisent le pattern Sprint 08, avec enrichissement :

| Colonne | Description |
|---------|-------------|
| `rubric_id` | identifiant rubrique |
| `label` | libellé |
| `section` | section métier |
| `amount_current` | montant période courante |
| `amount_previous` | montant N-1 |
| `delta` | variation absolue |
| `delta_percent` | variation relative |
| `period_from` / `period_to` | période courante |
| `period_previous_from` / `period_previous_to` | période comparée |
| `tenant` | tenant |
| `referentiel_version` | version référentiel |

**Règle :**

* si N-1 absent : colonnes previous / delta vides, pas de zéro trompeur

---

### 5.4 Préparation netting tiers V2 (T63 / T64)

Le but du Sprint 11 n'est pas de livrer le netting final, mais d'éviter que Sprint 12 parte d'un schéma insuffisant.

#### Colonnes à introduire

| Colonne | Rôle |
|---------|------|
| `date_maturity` | calcul d'ancienneté plus fiable |
| `full_reconcile_id` | détection des lignes totalement lettrées |
| `matching_number` | information complémentaire de rapprochement / lettrage |

#### Principe

* migration SQL idempotente
* lecture / upsert côté Vault
* alimentation depuis Odoo
* pas encore de logique métier finale de netting dans ce sprint

**Succès attendu :**
à la fin du sprint, les données nécessaires sont présentes dans le Vault pour améliorer les balances tiers au sprint suivant.

---

## 6. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T59** | Les endpoints comptables ciblés acceptent `company_ids` ; agrégation multi-sociétés fonctionnelle ; pas de régression single company |
| **T60** | Sélecteur multi-sociétés en UI ; URL partageable ; tous les blocs de Synthèse suivent le périmètre |
| **T61** | Modes période trimestre / semestre / personnalisé fonctionnels ; comparatif N/N-1 cohérent ; pas de régression exercice courant |
| **T62** | Exports comparatifs Bilan / CR téléchargeables ; colonnes current / previous / delta présentes |
| **T63** | Migration SQL idempotente ; schéma `account_move_lines` enrichi ; build Vault OK |
| **T64** | Connecteur Odoo alimente `date_maturity`, `full_reconcile_id`, `matching_number` ; upsert idempotent |
| **T65** | Non-régression documentée ; ALIGNEMENT + BACKLOG + RAPPORT synchronisés |

---

## 7. Recette — contrôles Sprint 11

### 7.1 Multi-sociétés (T59 / T60)

| Contrôle | Attendu |
|----------|---------|
| `company_ids=1,2` | Agrégation sur les 2 sociétés |
| `company_id=1` seul | Comportement inchangé |
| UI multi-sociétés | Tous les blocs rechargés sur le périmètre choisi |
| URL | Rejoue exactement le périmètre |

### 7.2 Comparatifs enrichis (T61)

| Contrôle | Attendu |
|----------|---------|
| Trimestre | Comparatif sur même trimestre N-1 |
| Semestre | Comparatif sur même semestre N-1 |
| Personnalisé | Comparatif sur même durée décalée d'un an |
| Pas de données N-1 | `—`, pas de faux zéro |

### 7.3 Exports comparatifs (T62)

| Contrôle | Attendu |
|----------|---------|
| Export Bilan comparatif | Colonnes current / previous / delta / delta% |
| Export CR comparatif | Idem |
| Header | `X-Lynki-Accounting-Source: vault` |

### 7.4 Schéma tiers V2 (T63 / T64)

| Contrôle | Attendu |
|----------|---------|
| Migration SQL | Appliquée sans régression |
| Ingest Vault | Colonnes remplies si Odoo les fournit |
| Re-push | Pas de doublons |

### 7.5 Non-régression (T65)

| Contrôle | Attendu |
|----------|---------|
| Surface 4 blocs | Inchangée |
| Drill rubrique → BG → GL | Inchangé |
| Exports existants | Inchangés |
| Habilitations `/accounting/*` | Inchangées |

---

## 8. Risques

| Risque | Mitigation |
|--------|------------|
| Consolidation multi-sociétés ambiguë | Rester sur une agrégation additive simple en Sprint 11 ; documenter la limite |
| Sélecteur de période trop ambitieux | Prioriser trimestre / semestre avant personnalisé |
| Export comparatif volumineux | CSV simple, sans sophistication supplémentaire |
| Colonnes tiers V2 absentes d'Odoo selon les lignes | Tolérance `NULL`, sans casser l'upsert |
| Dérive de sprint vers netting complet | Rappeler que T63/T64 ne sont qu'une préparation |

---

## 9. Sortie attendue (fin de sprint)

* **Synthèse multi-sociétés** opérationnelle
* **comparatifs enrichis** (trimestre, semestre, personnalisé)
* **exports comparatifs** Bilan / CR
* **schéma tiers V2 prêt** dans le Vault
* **connecteur Odoo enrichi**
* **`RAPPORT_SPRINT_11_LYNKI.md`** rédigé

---

## 10. Gates — cible fin Sprint 11

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | close — inchangée |
| **Gate C** | proche de la clôture formelle — lecture comparative consolidée |
| **Gate D** | renforcée — base données et périmètres plus robustes |

---

## 11. Après ce sprint

Suite logique :

1. **Balances tiers V2** avec meilleure prise en compte du lettrage / échéance
2. **Consolidation multi-sociétés avancée** si règles métier supplémentaires
3. **Insights comptables Diva** sur la Synthèse
4. **Rejouabilité formelle** à date
5. **Plan Sprint 12** — netting tiers V2 + premiers insights comptables

---

*Document d'exécution — pilotage comptable consolidé et comparatif, aligné CDC §4.4/§5.3 et REFERENTIEL §10.3.*  
*Précédent : [PLAN_SPRINT_10_LYNKI.md](PLAN_SPRINT_10_LYNKI.md) **v1.0** · [RAPPORT_SPRINT_10_LYNKI.md](RAPPORT_SPRINT_10_LYNKI.md) **v1.0***
