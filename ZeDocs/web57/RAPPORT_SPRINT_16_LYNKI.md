# Rapport de Sprint 16 — Lynki

**Fichier canonique :** `RAPPORT_SPRINT_16_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Plan :** [PLAN_SPRINT_16_LYNKI.md](PLAN_SPRINT_16_LYNKI.md) v1.1  
**Tickets :** [EXECUTION_TICKETS_SPRINT_16_LYNKI.md](EXECUTION_TICKETS_SPRINT_16_LYNKI.md) v1.0  
**Contrat métier :** [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2.1  
**Sprint précédent :** [RAPPORT_SPRINT_15_LYNKI.md](RAPPORT_SPRINT_15_LYNKI.md) v1.1  

---

## 1. Résumé exécutif

Le Sprint 16 **structure la lecture haute** de la Synthèse comptable : **4 cartes KPI** (sources Vault existantes), **fil d’Ariane réel** sur la Synthèse et sur la page Grand livre, et **note contractuelle §4.1** pour l’arbitrage métier minimal en attendant l’atelier Esther complet.

**T91 (graphique optionnel)** : **non livré** — aucune série métier unique n’a été retenue comme suffisamment claire pour éviter un rendu décoratif ; report assumé au Sprint 17 (prudence produit, Gate D).

---

## 2. Tickets livrés

| # | Titre | Statut |
|---|-------|--------|
| T88 | Linky — 4 KPI cards Synthèse | Livré |
| T89 | Linky — breadcrumb drill-down réel | Livré |
| T90 | MOA / produit — contrat §4.1 / ordre des blocs | Livré (note + version 0.2.1 ; atelier MOA à planifier) |
| T91 | Premier graphique optionnel | Reporté explicitement |
| T92 | Clôture, Gate D, rapport | Livré |

---

## 3. Détail technique

### 3.1 KPI cards (T88)

- Composant `AccountingSummaryKpiCards.tsx` : agrégations en parallèle depuis les routes existantes.
- **Bilan** : `total_actif` — `GET /api/accounting/balance-sheet/rubrics`
- **Compte de résultat** : somme des montants des rubriques CdR (résultat net indicatif)
- **Tiers** : nombre de `partner_id` distincts (AR ∪ AP) — `aged-receivables` + `aged-payables` au `as_of_date` = fin de période
- **Grand livre** : **proxy** = nombre de **comptes** sur la balance générale (`trial-balance` lines), avec libellé explicite *« Comptes actifs (balance générale) »* et référence indiquant que le détail des écritures est au GL par compte

Ordre UI : bloc confiance (S15) → KPI → balance générale et suite.

### 3.2 Breadcrumb (T89)

- `AccountingSummaryBreadcrumb.tsx` sur la Synthèse : **Synthèse** → **Balance générale** (scroll `#balance-generale`, efface le filtre drill si actif) → segment rubrique si drill depuis Bilan/CdR.
- `TrialBalanceBlock` : attribut `id="balance-generale"` sur tous les états de chargement / erreur / données.
- Page **Grand livre** : fil d’Ariane aligné **Synthèse → Balance générale → Grand livre → compte** (remplace l’ancien « Cockpit »).

### 3.3 Contrat (T90)

- §4.1 : note Sprint 16 + version document **0.2.1** ; tableau des décisions figées toujours à compléter avec la MOA.

### 3.4 T91

- Non livré ; documenté ici et conforme au plan (absence de chart ≠ échec).

---

## 4. Gate D — Lecture haute Synthèse

| Critère | Statut |
|---------|--------|
| KPI cards visibles et cohérentes | OK |
| Breadcrumb fonctionnel, état réel | OK |
| §4.1 annoté (arbitrages minimaux) | OK (note + v0.2.1) |
| Aucun chart décoratif | OK (aucun chart livré) |

**Gate D — Close (périmètre Sprint 16) : OK** sous réserve de recette MOA sur les libellés des KPI (notamment proxy GL).

---

## 5. Builds et déploiement

- **Linky** : `npx next build` — OK
- **Image Docker** : `dorevia/linky:sprint16-2026-03-21` (build depuis `units/dorevia-linky/`)
- **Compose** : tag `sprint16-2026-03-21` dans les `docker-compose.yml` Linky des tenants (lab / stinger / generic) ; `docker compose up -d` exécuté pour recréer les conteneurs

---

## 6. Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `components/AccountingSummaryKpiCards.tsx` | **nouveau** — bande KPI |
| `components/AccountingSummaryBreadcrumb.tsx` | **nouveau** — fil d’Ariane Synthèse |
| `components/AccountingSummaryView.tsx` | Intégration KPI + breadcrumb ; ordre des blocs |
| `app/accounting/gl/.../GeneralLedgerPageClient.tsx` | Breadcrumb Grand livre |
| `CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md` | v0.2.1, note §4.1 |

---

## 7. Suite logique

1. Atelier Esther : compléter le tableau §4.1 (taux, seuils).
2. Sprint 17 : charts + hiérarchie renforcée + éventuellement métrique « écritures » si exposée par le Vault.
3. Sprint 18 : design system / polish.

---

*Rapport Sprint 16 — mars 2026.*
