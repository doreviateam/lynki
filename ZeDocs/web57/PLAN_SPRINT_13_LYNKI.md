# Plan Sprint 13 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_13_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Date :** 21 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_12_LYNKI.md](RAPPORT_SPRINT_12_LYNKI.md) **v1.1** (balances tiers V2, Diva comptable v1, encart insight Synthèse)

**Sources :** [RAPPORT_SPRINT_12_LYNKI.md](RAPPORT_SPRINT_12_LYNKI.md) **v1.1** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.4** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.5** · [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** (§5.3 rejouabilité, §4.4 explicabilité, §6.5 référentiel) · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (§11–§12 balances tiers) · **Exécution :** `EXECUTION_TICKETS_SPRINT_13_LYNKI.md` *(à créer)* · **Rapport :** `RAPPORT_SPRINT_13_LYNKI.md` *(à créer)*

---

## 1. Objectif du sprint

Le Sprint 12 a livré les **balances tiers V2** plus fiables et une première couche d'**insight comptable Diva** (template-first, local-first) sur la Synthèse.

Le Sprint 13 vise trois avancées :

1. **Calendrier comptable aligné ERP** — exposer les périodes comptables Odoo (exercices, mois, statut ouvert / clôturé) dans le Vault et dans l'UI, pour que la lecture de données soit ancrée dans le calendrier réel de l'entreprise et non plus seulement dans des plages de dates arbitraires.
2. **Balances tiers V2+** — améliorer la fiabilité des balances âgées en calculant un montant résiduel pour les lignes partiellement lettrées, au lieu de les conserver intégralement dans le périmètre.
3. **Rapport structuré DOCX** — générer un document comptable de synthèse à partir du `AccountingFactsPack`, en approche **template-first, local-first**, téléchargeable depuis l'UI.

Autrement dit :
- le Sprint 12 a rendu la Synthèse **plus fiable sur les tiers** et **lisible** (insight Diva) ;
- le Sprint 13 doit **ancrer la lecture comptable dans le calendrier ERP**, **affiner les tiers** et **produire un premier livrable documentaire** exploitable hors écran.

### Objectifs principaux

1. **Calendrier comptable ERP** — synchronisation des périodes comptables Odoo (exercice, mois, statut clôture) dans Vault et Linky ; sélecteur de période enrichi.
2. **Balances tiers V2+** — résiduel lettrage partiel calculé côté Vault ; `v2plus_coverage` documenté.
3. **Rapport structuré DOCX v1** — génération côté Diva depuis le FactsPack, téléchargement depuis Linky.

### Objectifs secondaires

4. **UI période enrichie** — indicateur visuel du statut de clôture par mois ; cohérence sélecteur ↔ calendrier ERP.
5. **Observabilité** — journalisation de la génération DOCX (template, hash, durée).
6. **Documentation** — ALIGNEMENT, BACKLOG, `RAPPORT_SPRINT_13_LYNKI.md`.

**Hors sprint sauf arbitrage :**

- Consolidation inter-sociétés retraitée,
- IA externe pour Diva,
- rejouabilité formelle complète,
- rapport multi-paragraphes libre (au-delà du template structuré),
- netting tiers complet avec appariement avancé multi-devises.

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Lot 2 / données** | Calendrier comptable ERP (périodes Odoo → Vault → Linky) |
| **Lot 2 / données** | Balances tiers V2+ — résiduel lettrage partiel |
| **Lot 2 / Diva** | Rapport structuré DOCX v1 — template-first local-first |
| **Lot 2 / UI** | Sélecteur de période enrichi + export DOCX |
| **0 / transversal** | Non-régression, observabilité, doc |

---

## 3. Dépendances

```text
Sprint 12 livré
        │
        ├──> balances tiers V2 (date_maturity, full_reconcile_id)
        ├──> AccountingFactsPack + insight comptable v1
        ├──> Connecteur Odoo enrichi (date_maturity, matching_number)
        │
        ▼
T72 — Vault : calendrier comptable ERP (périodes, statut clôture)
        │
        ├──> T73 — Linky/UI : sélecteur de période enrichi + indicateur clôture
        │
        ▼
T74 — Vault : balances tiers V2+ (résiduel lettrage partiel)
        │
        ▼
T75 — Diva : rapport structuré DOCX v1 (template-first depuis FactsPack)
        │
        ├──> T76 — Linky/UI : bouton export DOCX + proxy téléchargement
        │
        ▼
T77 — Non-régression + doc + recette
```

---

## 4. Tickets (Sprint 13)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T72** | **Vault — calendrier comptable aligné ERP** | Lot 2 données | Sprint 12 clos | todo |
| | Exposer les périodes comptables Odoo dans le Vault : exercice fiscal, mois, statut (ouvert / clôturé / verrouillé). Le connecteur Odoo pousse ces métadonnées ; le Vault les sert via un nouveau endpoint. Objectif : le sélecteur de période Linky peut s'appuyer sur le calendrier réel et non plus seulement sur des plages arbitraires. | | | |
| **T73** | **Linky/UI — sélecteur de période enrichi + statut clôture** | Lot 2 UI | T72 | todo |
| | Enrichir le sélecteur de période pour afficher le statut de chaque mois (ouvert / clôturé). Indicateur visuel discret (cadenas, pastille) sur les mois clôturés. Comportement produit : un mois clôturé est sélectionnable (consultation) mais marqué visuellement ; aucun blocage fonctionnel. | | | |
| **T74** | **Vault — balances tiers V2+ (résiduel lettrage partiel)** | Lot 2 données | Sprint 12 clos | todo |
| | Améliorer le calcul des balances âgées pour les lignes partiellement lettrées : reconstituer le résiduel à partir des groupes `matching_number`, et n'inclure que le montant non encore apparié dans le calcul d'ancienneté. Mettre à jour `v2_limitations` pour refléter la couverture améliorée. Les lignes sans `matching_number` restent inchangées (pas de résiduel inventé). | | | |
| **T75** | **Diva — rapport structuré DOCX v1** | Lot 2 Diva | Sprint 12 clos (FactsPack) | todo |
| | Générer un document DOCX de synthèse comptable à partir du `AccountingFactsPack`, en approche **template-first, local-first**. Sections : en-tête (période, périmètre, société, date), résumé exécutif (headline + what_i_see), points de vigilance (to_check), tableau Bilan simplifié, tableau CR simplifié, balances tiers résumées (top partenaires), scope note, `facts_hash`. Pas de contenu libre LLM dans le DOCX — le texte vient du moteur template existant. | | | |
| **T76** | **Linky/UI — export rapport DOCX + proxy téléchargement** | Lot 2 UI | T75 | todo |
| | Bouton "Télécharger le rapport" dans l'encart insight de la Synthèse. Route proxy `POST /api/diva/accounting-report` → Diva ; retourne le binaire DOCX en téléchargement direct. États : désactivé (pas de données), chargement (génération en cours), prêt (téléchargement). | | | |
| **T77** | **Non-régression + doc** | transversal | T72–T76 | todo |
| | Contrôles : calendrier ERP, balances tiers V2+, rapport DOCX, non-régression Synthèse/BG/GL/exports. Mise à jour `ALIGNEMENT`, `BACKLOG`, `RAPPORT_SPRINT_13`. | | | |

---

## 5. Détail technique

### 5.1 Calendrier comptable ERP (T72)

#### Données Odoo à capturer

| Champ | Source Odoo | Description |
|-------|-------------|-------------|
| `fiscal_year` | `account.fiscal.year` | Exercice fiscal (date début, date fin) |
| `period_month` | Dérivé de `date_range` ou pratique Odoo | Mois comptable (1–12) |
| `status` | Statut de clôture des journaux | `open` / `closed` / `locked` |

#### Connecteur Odoo → Vault

Enrichir le connecteur existant pour pousser les périodes comptables vers le Vault. Migration Vault : nouvelle table `accounting_periods` (ou extension de la table de métadonnées existante).

#### Endpoint Vault

`GET /api/accounting/periods?tenant=xxx`

```json
{
  "tenant": "laplatine2026",
  "fiscal_year": { "start": "2026-01-01", "end": "2026-12-31" },
  "periods": [
    { "month": 1, "year": 2026, "status": "closed", "closed_at": "2026-02-05T10:00:00Z" },
    { "month": 2, "year": 2026, "status": "closed", "closed_at": "2026-03-03T14:00:00Z" },
    { "month": 3, "year": 2026, "status": "open", "closed_at": null }
  ],
  "generated_at": "..."
}
```

#### Règle produit

Le calendrier ERP est **informatif** dans ce sprint. Il n'empêche pas la consultation de données sur un mois ouvert ou clôturé. L'objectif est la **transparence** : l'utilisateur sait si les données qu'il consulte portent sur une période close ou encore en mouvement.

**Le calendrier comptable est défini au niveau société.** En multi-sociétés, si les dates d'ouverture d'exercice ou les statuts de clôture divergent, Lynki consulte la période demandée mais affiche un avertissement explicite sur l'hétérogénéité du périmètre (ex. "Période partiellement clôturée — société X : clôturée, société Y : ouverte").

---

### 5.2 Sélecteur de période enrichi (T73)

#### Enrichissement UI

- Le sélecteur de période appelle `/api/accounting/periods` au chargement.
- Chaque mois affiche un indicateur discret de statut :
  - **Clôturé** : icône cadenas (🔒) ou pastille verte — données stabilisées
  - **Ouvert** : aucun marqueur spécial (ou pastille orange optionnelle)
- Tooltip sur le mois : "Clôturé le DD/MM/YYYY" si disponible.

#### Comportement

| Situation | Comportement |
|-----------|--------------|
| Mois clôturé sélectionné | Consultation normale, badge "période clôturée" discret sous le header |
| Mois ouvert sélectionné | Consultation normale, pas de badge particulier |
| API périodes indisponible | Fallback : sélecteur actuel sans indicateur de clôture (dégradation gracieuse) |

---

### 5.3 Balances tiers V2+ (T74)

#### Résiduel lettrage partiel

**Principe :** lorsqu'un `matching_number` regroupe plusieurs lignes (facture + paiement partiel), le Vault calcule la somme algébrique du groupe pour obtenir le résiduel, et n'inclut **que le résiduel** dans l'ancienneté.

**Algorithme :**

Le calcul de résiduel s'effectue sur des groupes homogènes (`tenant`, `company_id`, `partner_id`, `account_code`, `matching_number`) afin d'éviter tout mélange comptable indésirable.

```text
POUR chaque groupe (tenant, company_id, partner_id, account_code, matching_number) :
  residual = SUM(amount) des lignes du groupe
  SI |residual| > 0.005 :
    conserver UNE ligne synthétique avec amount = residual,
    date = MAX(date) du groupe (la plus récente)
  SINON :
    exclure tout le groupe (lettrage complet)

POUR les lignes sans matching_number :
  conserver tel quel (pas de résiduel inventé)
```

#### Impact API

- `aging_basis` inchangé (toujours COALESCE sur date_maturity)
- `v2_limitations` : suppression de "matching_number sans résiduel" si V2+ actif
- Nouveau champ optionnel : `partial_matching_coverage` = `"residual_computed"` | `"none"`

#### Limitation Sprint 13

Pas de gestion multi-devises sur le calcul du résiduel. Si les lignes d'un groupe `matching_number` ont des devises différentes, elles sont conservées individuellement (fallback V2).

---

### 5.4 Rapport structuré DOCX v1 (T75)

#### Architecture

1. **Entrée** : `AccountingFactsPack` (existant, Sprint 12 T68)
2. **Template engine** : nouveau `facts/accounting_report.go`
   - Construit les sections du document à partir du pack
   - Aucune génération LLM — template-first strict
3. **Génération DOCX** : bibliothèque Go pour produire le binaire
4. **Endpoint** : `POST /diva/accounting/report` → retourne le DOCX

#### Sections du document

| Section | Contenu | Source FactsPack |
|---------|---------|------------------|
| **En-tête** | Période, tenant, sociétés, date de génération, `facts_hash`, `template_version` | `Context` |
| **Résumé exécutif** | `headline` + `what_i_see` | Template engine (existant) |
| **Points de vigilance** | `to_check` | Template engine (existant) |
| **Bilan simplifié** | Tableau Actif / Passif (rubriques top-level N et N-1, variation) | `BalanceSheet` + `Deltas` |
| **Compte de résultat simplifié** | Tableau rubriques N et N-1, résultat net | `IncomeStatement` + `Deltas` |
| **Balances tiers** | Top 5 clients / fournisseurs par montant > 90j | `AgedReceivables` / `AgedPayables` |
| **Scope** | Référentiel, couverture, limitations, `facts_hash` | `Quality` + `Context` |

#### Règle non négociable

Le DOCX est un **miroir structuré** du FactsPack et de l'insight template. Il ne contient aucun texte généré par LLM. C'est un **document de travail comptable**, pas un rapport narratif IA.

#### Format

- En-tête avec logo/nom tenant (paramétrable via branding config)
- Police sobre (Calibri / Liberation Sans)
- Tableaux avec bordures fines, montants alignés à droite
- Pied de page : `facts_hash`, `template_version`, date, "Généré par Dorevia Lynki — template-first"

---

### 5.5 Export DOCX depuis Linky (T76)

#### Route proxy

`POST /api/diva/accounting-report` → proxy vers Diva → retourne le binaire DOCX avec headers :

```
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
Content-Disposition: attachment; filename="synthese-comptable-{tenant}-{period_from}_{period_to}.docx"
```

#### UI

Bouton "Télécharger le rapport" :
- **Position** : dans l'encart `AccountingInsightBlock`, après le scope note
- **États** : désactivé si pas de données insight / loading si en cours / actif sinon
- **Comportement** : envoie le même payload que l'insight (context + blocs comptables) mais vers la route rapport ; le navigateur déclenche le téléchargement

---

## 6. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T72** | Endpoint `/api/accounting/periods` fonctionnel ; données Odoo synchronisées ; build Vault OK |
| **T73** | Sélecteur de période enrichi avec indicateur de clôture ; fallback gracieux si API indisponible ; build Linky OK |
| **T74** | Résiduel calculé pour les groupes `matching_number` ; lignes individuelles préservées si pas de matching ; `v2_limitations` mis à jour ; build Vault OK |
| **T75** | DOCX généré depuis FactsPack sans LLM ; sections conformes ; `facts_hash` présent ; build Diva OK |
| **T76** | Bouton téléchargement dans l'encart insight ; proxy fonctionnel ; build Linky OK |
| **T77** | Non-régression documentée ; `ALIGNEMENT` + `BACKLOG` + `RAPPORT_SPRINT_13` synchronisés |

---

## 7. Recette — contrôles Sprint 13

### 7.1 Calendrier comptable ERP (T72 / T73)

| Contrôle | Attendu |
|----------|---------|
| Endpoint périodes | Retourne les mois avec statut clôture |
| Sélecteur UI | Indicateur visuel sur les mois clôturés |
| Mois ouvert | Sélectionnable, pas de badge spécial |
| Mois clôturé | Sélectionnable, badge "période clôturée" |
| API indisponible | Sélecteur classique (dégradation gracieuse) |

### 7.2 Balances tiers V2+ (T74)

| Contrôle | Attendu |
|----------|---------|
| Groupe `matching_number` complet | Exclu (résiduel ≈ 0) |
| Groupe `matching_number` partiel | Résiduel seul retenu dans l'ancienneté |
| Ligne sans `matching_number` | Inchangée (comportement V2) |
| `partial_matching_coverage` | `"residual_computed"` si applicable |
| Export CSV | Résiduel reflété dans les montants |

### 7.3 Rapport DOCX (T75 / T76)

| Contrôle | Attendu |
|----------|---------|
| DOCX généré | Ouverture OK dans Word / LibreOffice |
| Sections | En-tête, résumé, vigilance, Bilan, CR, tiers, scope |
| Contenu LLM | Absent — template-first uniquement |
| `facts_hash` | Présent dans le document |
| Téléchargement UI | Bouton fonctionnel dans l'encart insight |

### 7.4 Non-régression (T77)

| Contrôle | Attendu |
|----------|---------|
| Surface 4 blocs Synthèse | Inchangée |
| Encart insight | Inchangé (+ bouton DOCX) |
| Comparatif N/N-1 | Inchangé |
| Multi-sociétés | Inchangé |
| Drill rubrique → BG → GL | Inchangé |
| Exports existants | Inchangés |
| Habilitations `/accounting/*` | Inchangées |

---

## 8. Risques

| Risque | Mitigation |
|--------|------------|
| Données de clôture Odoo incomplètes (pas de `date_range`) | Déduire le statut depuis les journaux ; fallback "tous ouverts" si absent |
| Résiduel lettrage multi-devises | Hors Sprint 13 ; documenter la limite, fallback V2 par ligne |
| Génération DOCX lente sur gros FactsPack | Timeout 30 s ; pagination si nécessaire ; structure sobre |
| Qualité DOCX insuffisante (mise en page) | Template sobre, pas de complexité graphique dans v1 |
| Dérive vers rapport narratif IA | Template-first strict ; aucun appel Mistral dans le DOCX |

---

## 9. Sortie attendue (fin de sprint)

* **Calendrier comptable ERP** visible dans le sélecteur de période
* **Balances tiers V2+** avec résiduel lettrage partiel
* **Rapport structuré DOCX v1** téléchargeable depuis la Synthèse
* **`RAPPORT_SPRINT_13_LYNKI.md`** rédigé

---

## 10. Gates — cible fin Sprint 13

| Gate | Cible |
|------|-------|
| **Gate A** | Inchangée |
| **Gate B** | Close — inchangée |
| **Gate C** | Close — renforcée par l'ancrage calendrier ERP et l'export DOCX |
| **Gate D** | **Close (périmètre Sprint 13)** — tiers V2+ (résiduel), rapport structuré documentaire, calendrier comptable |

---

## 11. Après ce sprint

Suite logique :

1. **Netting tiers avancé** — multi-devises, appariement croisé
2. **Rapport DOCX v2** — personnalisation par tenant, sections optionnelles, comparatif N/N-1 dans le document
3. **Rejouabilité formelle** — lecture à date, historisation des FactsPack
4. **Calendrier comptable v2** — alignement avec les clôtures intermédiaires, alertes délai de clôture
5. **Export PDF** — variante du DOCX pour diffusion contrôlée
