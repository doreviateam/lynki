# Tickets d'exécution — Sprint 13 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_13_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Référence plan :** [PLAN_SPRINT_13_LYNKI.md](PLAN_SPRINT_13_LYNKI.md) **v1.1**  
**Référence rapport précédent :** [RAPPORT_SPRINT_12_LYNKI.md](RAPPORT_SPRINT_12_LYNKI.md) **v1.1**  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.4**  
**Alignement :** [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.5**

**Séquence d'exécution :** T72 → T73 → T74 → T75 → T76 → T77

---

## T72 — Vault — calendrier comptable aligné ERP

**Objectif :** exposer les périodes comptables Odoo (exercice, mois, statut de clôture) via un nouvel endpoint Vault.

### Prérequis

- Sprint 12 livré (connecteur Odoo enrichi avec `date_maturity`, `matching_number`)
- Table `account_move_lines` en place avec données Odoo

### Travaux attendus

#### 1. Migration Vault — table `accounting_periods`

Créer `sources/vault/migrations/050_accounting_periods.sql` :

```sql
CREATE TABLE IF NOT EXISTS accounting_periods (
    id           SERIAL PRIMARY KEY,
    tenant       TEXT NOT NULL,
    company_id   TEXT NOT NULL,   -- TEXT : clé externe Odoo composite "odoo:<id>", homogène avec account_move_lines.company_id
    fiscal_year_start DATE NOT NULL,
    fiscal_year_end   DATE NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year  INTEGER NOT NULL,
    status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'locked')),
    closed_at    TIMESTAMPTZ,
    synced_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant, company_id, period_year, period_month)
);
```

> **Note :** `company_id` est de type `TEXT` pour rester homogène avec le reste du modèle Vault où les identifiants de société sont des clés externes composites (format `"odoo:<id>"`). Pas de conversion entière dans ce sprint.

#### 2. Connecteur Odoo — push périodes comptables

Enrichir `units/odoo/custom-addons/dorevia_vault_connector` pour pousser les périodes vers le Vault :

- Lire `account.fiscal.year` (ou déduire depuis les écritures si le module fiscal year n'est pas installé)
- Déterminer le statut de chaque mois :
  - **closed** : tous les journaux du mois ont le flag `lock_date` ≥ dernier jour du mois
  - **locked** : `fiscalyear_lock_date` de la société couvre ce mois
  - **open** : sinon
- Endpoint Vault pour réception : `POST /api/accounting/periods/sync`

#### 3. Handler Vault — `GET /api/accounting/periods`

Créer `sources/vault/internal/handlers/accounting_periods.go` :

- Paramètres : `tenant` (requis), `company_ids` (optionnel), `year` (optionnel, défaut = année courante)
- Réponse : JSON conforme au §5.1 du plan
- **Multi-sociétés** : si `company_ids` contient plusieurs sociétés, agréger les périodes et détecter l'hétérogénéité (mois clôturé chez l'une, ouvert chez l'autre) ; exposer un champ `heterogeneous: true/false` par période

#### 4. Route Vault

Enregistrer dans `sources/vault/internal/server/replay.go` :

```go
app.Get("/api/accounting/periods", handlers.AccountingPeriodsHandler(db, log))
app.Post("/api/accounting/periods/sync", handlers.AccountingPeriodsSyncHandler(db, log))
```

### Checkpoint

- [ ] Migration appliquée
- [ ] Connecteur Odoo pousse les périodes
- [ ] `GET /api/accounting/periods?tenant=laplatine2026` retourne les mois avec statut
- [ ] Hétérogénéité multi-sociétés détectée et exposée
- [ ] Build Vault OK

### Fichiers concernés

- `sources/vault/migrations/050_accounting_periods.sql` — **NOUVEAU**
- `sources/vault/internal/handlers/accounting_periods.go` — **NOUVEAU**
- `sources/vault/internal/server/replay.go` — route
- `units/odoo/custom-addons/dorevia_vault_connector/` — push périodes

---

## T73 — Linky/UI — sélecteur de période enrichi + statut clôture

**Objectif :** afficher le statut de clôture dans le sélecteur de période et informer l'utilisateur du niveau de fiabilité de la période consultée.

### Prérequis

- T72 livré (endpoint `/api/accounting/periods`)

### Travaux attendus

#### 1. Route proxy Linky

Créer `units/dorevia-linky/app/api/accounting/periods/route.ts` :

- Proxy vers `VAULT_URL/api/accounting/periods`
- Passe `tenant`, `company_ids`, `year`
- Timeout 5 s, fallback `{ periods: [] }` si erreur

#### 2. Hook React — `useAccountingPeriods`

Créer un hook ou intégrer dans `DashboardWithFilters` :

- Appel au chargement et au changement de tenant/company/année
- Retourne `Map<string, PeriodStatus>` (clé = `"YYYY-MM"`, valeur = `{ status, closed_at, heterogeneous }`)
- Cache simple en mémoire (invalidé au changement de paramètres)

#### 3. Enrichissement du sélecteur de période

Dans `ReportHeaderContentBody.tsx` ou le composant sélecteur de période :

- Chaque `<option>` de mois affiche un **libellé enrichi** (pas de tooltip — les `title` sur `<option>` sont peu fiables selon navigateurs) :
  - Mois clôturé : libellé `"Mars 🔒"` ou `"Mars (clôturé)"`
  - Mois ouvert : libellé standard, pas de suffixe
  - Hétérogène : libellé `"Mars ⚠️"` ou `"Mars (partiel)"`
- **Texte de contexte sous le sélecteur** : quand un mois est sélectionné, afficher un court texte sous le sélecteur : "Période clôturée le DD/MM/YYYY" ou "Période partiellement clôturée — société X : clôturée, société Y : ouverte"

#### 4. Badge de contexte sous le header

Quand l'utilisateur est en Synthèse comptable (`appView === "synthese"`) et que la période sélectionnée est clôturée :

- Badge discret : "Période clôturée" (vert) ou "Période partiellement clôturée" (orange)
- Position : sous la barre d'onglets Pilotage/Synthèse, aligné avec le titre "Synthèse comptable"

#### 5. Dégradation gracieuse

Si `/api/accounting/periods` échoue ou retourne un tableau vide :

- Sélecteur = comportement actuel (pas d'indicateur)
- Pas de badge de contexte
- Pas d'erreur visible pour l'utilisateur

### Checkpoint

- [ ] Route proxy fonctionnelle
- [ ] Indicateur de clôture visible dans le sélecteur
- [ ] Hétérogénéité multi-sociétés signalée (⚠️)
- [ ] Badge de période clôturée visible en Synthèse
- [ ] Dégradation gracieuse si API absente
- [ ] Build Linky OK

### Fichiers concernés

- `units/dorevia-linky/app/api/accounting/periods/route.ts` — **NOUVEAU**
- `units/dorevia-linky/components/ReportHeaderContentBody.tsx` — indicateur dans le sélecteur
- `units/dorevia-linky/components/DashboardWithFilters.tsx` — hook périodes + badge

---

## T74 — Vault — balances tiers V2+ (résiduel lettrage partiel)

**Objectif :** calculer le résiduel des lignes partiellement lettrées au lieu de les garder intégralement dans les balances âgées.

### Prérequis

- Sprint 12 livré (V2 : `COALESCE(date_maturity, line_date)`, exclusion `full_reconcile_id`)
- Champ `matching_number` présent dans `account_move_lines`

### Travaux attendus

#### 1. Fonction de calcul résiduel

Dans `sources/vault/internal/storage/aged_balance.go`, avant la requête SQL principale :

**Étape préalable** — CTE ou sous-requête pour matérialiser les résiduels :

```sql
WITH matching_residuals AS (
    SELECT
        tenant,
        COALESCE(partner_id, 0) AS partner_id,
        COALESCE(partner_name, 'Partenaire inconnu') AS partner_name,
        account_code,
        matching_number,
        SUM(debit - credit) AS residual,
        MAX(COALESCE(date_maturity, line_date)) AS residual_date
    FROM account_move_lines
    WHERE tenant = $1
      AND matching_number IS NOT NULL
      AND full_reconcile_id IS NULL
      -- filtre company_ids, account_code (receivable/payable)
    GROUP BY tenant, partner_id, partner_name, account_code, matching_number
    HAVING ABS(SUM(debit - credit)) > 0.005
)
```

Les lignes issues de `matching_residuals` remplacent les lignes individuelles du même `matching_number` dans le calcul d'ancienneté. Les lignes sans `matching_number` restent inchangées.

**Regroupement homogène :** `tenant`, `company_id`, `partner_id`, `account_code`, `matching_number` — conforme au §5.3 du plan.

#### 2. Impact sur la réponse API

- `v2_limitations` : retirer "Lignes avec matching_number conservées intégralement" si V2+ actif
- Ajouter `partial_matching_coverage: "residual_computed" | "none"` dans la réponse JSON
- `aging_basis` : inchangé

#### 3. Impact export CSV

- Les montants exportés reflètent les résiduels (pas les montants bruts des lignes individuelles)
- Nouvelle colonne optionnelle `partial_matching` : `"residual"` | `"original"`

#### 4. Limitation multi-devises

Si les lignes d'un groupe `matching_number` ont des `currency_id` différents :

- Fallback V2 : conserver les lignes individuellement
- Ajouter "Multi-devise non résolu" dans `v2_limitations`

### Checkpoint

- [ ] CTE matching_residuals fonctionnel
- [ ] Groupe complet (résiduel ≈ 0) → exclu
- [ ] Groupe partiel → résiduel seul dans l'ancienneté
- [ ] Lignes sans matching_number → inchangées
- [ ] `partial_matching_coverage` exposé dans la réponse
- [ ] Export CSV reflète les résiduels
- [ ] Fallback multi-devises documenté
- [ ] Build Vault OK

### Fichiers concernés

- `sources/vault/internal/storage/aged_balance.go` — CTE matching_residuals, logique V2+
- `sources/vault/internal/handlers/accounting_aged_balance.go` — `partial_matching_coverage`
- `sources/vault/internal/handlers/accounting_aged_balance_export.go` — colonne `partial_matching`

---

## T75 — Diva — rapport structuré DOCX v1

**Objectif :** générer un document DOCX de synthèse comptable à partir du `AccountingFactsPack`, en approche template-first stricte.

### Prérequis

- Sprint 12 livré (T68 : `AccountingFactsPack`, T69 : template engine insight)

### Travaux attendus

#### 1. Template report engine

Créer `units/diva/internal/facts/accounting_report.go` :

- Fonction `GenerateAccountingReport(pack *AccountingFactsPack) (*AccountingReport, error)`
- Produit un struct `AccountingReport` contenant les sections structurées :
  - `Header` : période, tenant, sociétés, date, `facts_hash`, `template_version`
  - `ExecutiveSummary` : `headline` + `what_i_see` (réutilise `GenerateAccountingInsight`)
  - `Vigilance` : `to_check` (réutilise idem)
  - `BalanceSheetTable` : lignes rubriques N / N-1 / variation, séparées Actif / Passif
  - `IncomeStatementTable` : lignes rubriques N / N-1 / variation, résultat net
  - `AgedBalancesSummary` : top 5 clients et fournisseurs par montant > 90j
  - `Scope` : référentiel, couverture par bloc, limitations, `facts_hash`, `template_version`
- Constante `ReportTemplateVersion = "1.0"`

#### 2. Génération DOCX

Créer `units/diva/internal/docx/generator.go` :

- Fonction `RenderReport(report *AccountingReport, branding *BrandingConfig) ([]byte, error)`
- En l'absence de branding tenant spécifique (`branding == nil`), fallback sobre "Dorevia Lynki" — le ticket ne doit pas être bloqué par l'absence de configuration branding
- Utilise une bibliothèque Go DOCX (ex. `github.com/nguyenthenguyen/docx` ou `baliance.com/gooxml`)
- Produit un document sobre :
  - Page de titre avec nom tenant, période, date
  - Sections avec titres hiérarchiques (Heading 1 / Heading 2)
  - Tableaux avec bordures fines, montants alignés à droite, formatage EUR
  - Pied de page : `facts_hash | template_version | date | Dorevia Lynki — template-first`
- Pas d'appel Mistral — le texte vient exclusivement du template engine

#### 3. Handler — `POST /diva/accounting/report`

Créer `units/diva/internal/handlers/accounting_report.go` :

- Même payload que `POST /diva/accounting/insight` (`AccountingInsightRequest`)
- Construit le FactsPack → génère le rapport → rend le DOCX
- Journalise : `event=accounting_report_generated`, `facts_hash`, `template_version`, `duration_ms`
- Retourne le DOCX binaire avec les headers Content-Type / Content-Disposition appropriés

#### 4. Route Diva

Enregistrer dans `units/diva/internal/server/server.go` :

```go
app.Post("/diva/accounting/report", handlers.AccountingReportHandler(mc))
```

### Checkpoint

- [ ] `AccountingReport` struct complet avec toutes les sections
- [ ] `ReportTemplateVersion` constante exposée
- [ ] DOCX généré et ouvrable dans Word / LibreOffice
- [ ] Tableaux Bilan et CR lisibles avec montants formatés
- [ ] `facts_hash` et `template_version` présents dans le document
- [ ] Aucun contenu LLM dans le DOCX
- [ ] Journalisation de la génération
- [ ] Build Diva OK

### Fichiers concernés

- `units/diva/internal/facts/accounting_report.go` — **NOUVEAU** : template report engine
- `units/diva/internal/docx/generator.go` — **NOUVEAU** : rendu DOCX
- `units/diva/internal/handlers/accounting_report.go` — **NOUVEAU** : handler POST
- `units/diva/internal/server/server.go` — route
- `units/diva/go.mod` / `go.sum` — dépendance bibliothèque DOCX

---

## T76 — Linky/UI — export rapport DOCX + proxy téléchargement

**Objectif :** permettre le téléchargement du rapport DOCX depuis l'encart insight de la Synthèse.

### Prérequis

- T75 livré (endpoint `POST /diva/accounting/report`)

### Travaux attendus

#### 1. Route proxy Linky

Créer `units/dorevia-linky/app/api/diva/accounting-report/route.ts` :

- Proxy `POST` vers `VAULT_URL/diva/accounting/report` (via le gateway Vault → Diva)
- Timeout 30 s (la génération DOCX peut être plus lente qu'un insight)
- Retourne le DOCX binaire tel quel (stream passthrough), avec les headers :
  - `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `Content-Disposition: attachment; filename="synthese-comptable-{tenant}-{period_from}_{period_to}.docx"`
  - Exemple : `synthese-comptable-laplatine2026-2026-01-01_2026-03-20.docx`

#### 2. Bouton téléchargement dans `AccountingInsightBlock`

Enrichir `units/dorevia-linky/components/AccountingInsightBlock.tsx` :

- Ajouter un bouton "Télécharger le rapport" après le scope note et le `facts_hash`
- Icône document (📄) + texte
- **États** :
  - `disabled` : si l'insight n'est pas disponible (pas de données, erreur, loading)
  - `loading` : la génération DOCX est en cours (spinner sur le bouton)
  - `ready` : téléchargement disponible
- **Comportement au clic** :
  1. Envoie le même payload que l'insight vers `POST /api/diva/accounting-report`
  2. Récupère le blob DOCX
  3. Crée un lien temporaire `URL.createObjectURL(blob)` et déclenche le téléchargement
  4. Revient à l'état `ready`

#### 3. Habilitations

Le bouton hérite des habilitations existantes de la Synthèse (`/api/diva/*` déjà protégé par le middleware). Pas de contrôle d'accès supplémentaire dans ce sprint — le rapport est accessible aux mêmes rôles que l'insight.

### Checkpoint

- [ ] Route proxy retourne le binaire DOCX
- [ ] Bouton visible dans l'encart insight
- [ ] Téléchargement déclenché au clic
- [ ] Bouton désactivé quand insight non disponible
- [ ] Spinner pendant la génération
- [ ] Build Linky OK

### Fichiers concernés

- `units/dorevia-linky/app/api/diva/accounting-report/route.ts` — **NOUVEAU**
- `units/dorevia-linky/components/AccountingInsightBlock.tsx` — bouton téléchargement

---

## T77 — Non-régression + doc Sprint 13

**Objectif :** valider l'intégralité du sprint, vérifier la non-régression, mettre à jour la documentation.

### Prérequis

- T72–T76 livrés

### Travaux attendus

#### 1. Builds

- [ ] Build Vault : `go build ./...` dans `sources/vault` → OK
- [ ] Build Diva : `go build ./...` dans `units/diva` → OK
- [ ] Build Linky : `npx next build` dans `units/dorevia-linky` → OK

#### 2. Contrôles Sprint 13

**Calendrier comptable (T72/T73) :**
- [ ] Endpoint périodes retourne les mois avec statut
- [ ] Hétérogénéité multi-sociétés détectée
- [ ] Indicateur clôture dans le sélecteur
- [ ] Dégradation gracieuse si API indisponible

**Balances tiers V2+ (T74) :**
- [ ] Groupe matching complet → exclu
- [ ] Groupe matching partiel → résiduel uniquement
- [ ] Sans matching → inchangé
- [ ] Export CSV reflète les résiduels

**Rapport DOCX (T75/T76) :**
- [ ] DOCX ouvrable dans Word / LibreOffice
- [ ] Sections conformes (en-tête, résumé, vigilance, Bilan, CR, tiers, scope)
- [ ] `facts_hash` + `template_version` présents
- [ ] Bouton téléchargement fonctionnel dans l'encart insight

#### 3. Non-régression

- [ ] Surface 4 blocs Synthèse inchangée
- [ ] Encart insight existant inchangé (+ bouton DOCX ajouté)
- [ ] Comparatif N/N-1 inchangé
- [ ] Multi-sociétés inchangé
- [ ] Drill rubrique → BG → GL inchangé
- [ ] Exports existants (CSV BG, GL, rubriques, balances tiers) inchangés
- [ ] Habilitations `/accounting/*` inchangées
- [ ] Navigation Pilotage / Synthèse conforme SPEC_UX_NAVIGATION

#### 4. Documentation

- [ ] Rédiger `RAPPORT_SPRINT_13_LYNKI.md` v1.0
- [ ] Mettre à jour `BACKLOG_PHASE2_LYNKI.md` (T72–T77 livrés, Gates)
- [ ] Mettre à jour `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` (Sprint 13 livré)

### Fichiers concernés

- `ZeDocs/web57/RAPPORT_SPRINT_13_LYNKI.md` — **NOUVEAU**
- `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md` — mise à jour
- `ZeDocs/web57/ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` — mise à jour

---

## Vigilances spéciales (rappel plan v1.1)

| Sujet | Point d'attention |
|-------|-------------------|
| **Multi-sociétés × exercice** | Le calendrier comptable est défini au niveau société. Détecter et signaler l'hétérogénéité quand les statuts divergent. |
| **Regroupement résiduel** | Strictement par (`tenant`, `company_id`, `partner_id`, `account_code`, `matching_number`). Pas de mélange entre comptes ou partenaires. |
| **Traçabilité DOCX** | `facts_hash` + `template_version` dans chaque document. Le template n'appelle jamais Mistral. |
| **Multi-devises** | Hors Sprint 13 pour le résiduel. Fallback V2 si devises mélangées dans un groupe matching. |

---

## Suite logique

1. **Balances tiers — netting avancé** multi-devises, appariement croisé
2. **Rapport DOCX v2** — personnalisation tenant, sections optionnelles, comparatif N/N-1
3. **Rejouabilité formelle** — lecture à date, historisation des FactsPack
4. **Calendrier comptable v2** — clôtures intermédiaires, alertes délai
5. **Export PDF** — variante DOCX pour diffusion contrôlée
