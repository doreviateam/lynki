# Rapport de Sprint 13 — Lynki

**Fichier canonique :** `RAPPORT_SPRINT_13_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Plan :** [PLAN_SPRINT_13_LYNKI.md](PLAN_SPRINT_13_LYNKI.md) v1.1  
**Tickets :** [EXECUTION_TICKETS_SPRINT_13_LYNKI.md](EXECUTION_TICKETS_SPRINT_13_LYNKI.md) v1.0  
**Sprint précédent :** [RAPPORT_SPRINT_12_LYNKI.md](RAPPORT_SPRINT_12_LYNKI.md) v1.1

---

## 1. Résumé exécutif

Le Sprint 13 fait converger trois axes majeurs : la **vérité calendaire ERP**, la **fiabilité des balances tiers V2+**, et la **sortie documentaire structurée DOCX**. Pour la première fois, Lynki produit un document formel exploitable hors écran — généré strictement en template-first, sans intervention LLM.

**6 tickets livrés (T72–T77)**, tous builds propres (Vault, Diva, Linky).

---

## 2. Tickets livrés

| # | Titre | Statut |
|---|-------|--------|
| T72 | Vault — calendrier comptable aligné ERP | ✅ Livré |
| T73 | Linky/UI — sélecteur période enrichi + statut clôture | ✅ Livré |
| T74 | Vault — balances tiers V2+ (résiduel lettrage partiel) | ✅ Livré |
| T75 | Diva — rapport structuré DOCX v1 | ✅ Livré |
| T76 | Linky/UI — export rapport DOCX + proxy téléchargement | ✅ Livré |
| T77 | Non-régression + doc Sprint 13 | ✅ Livré |

---

## 3. Détails par axe

### 3.1 Calendrier comptable aligné ERP (T72 + T73)

**Vault :**

- Nouvelle table `accounting_periods` (migration 050), avec `company_id TEXT` homogène avec le modèle existant
- Endpoint `GET /api/accounting/periods` : retourne les mois avec statut (`open`, `closed`, `locked`, `partial`)
- Endpoint `POST /api/accounting/periods/sync` : upsert idempotent depuis le connecteur Odoo
- **Détection d'hétérogénéité multi-sociétés** : lorsque deux sociétés ont des statuts divergents pour le même mois, le champ `heterogeneous: true` est exposé et le statut consolidé est `"partial"`

**Le calendrier comptable est défini au niveau société.** En multi-sociétés, si les dates d'ouverture d'exercice ou les statuts de clôture divergent, Lynki consulte la période demandée mais affiche un avertissement explicite sur l'hétérogénéité du périmètre.

**Connecteur Odoo :**

- Nouveau modèle `dorevia.accounting.periods.push` avec cron quotidien
- Lecture des `period_lock_date` et `fiscalyear_lock_date` au niveau société pour déterminer le statut
- Company ID transmis au format `"odoo:<id>"` (homogène avec le reste du modèle Vault)

**Linky UI :**

- Route proxy `/api/accounting/periods` avec fallback `{ periods: [] }`
- Hook `useAccountingPeriods` — cache invalidé au changement de tenant/company/année
- **Libellés enrichis** dans le `<select>` de période : mois fermés/verrouillés suffixés par 🔒, mois hétérogènes par ⚠️
- **Texte contextuel** sous le sélecteur : "Période clôturée le DD/MM/YYYY" ou "Période partiellement clôturée (hétérogénéité multi-sociétés)"
- Pas de tooltip sur `<option>` (fiabilité navigateur insuffisante)

### 3.2 Balances tiers V2+ (T74)

Évolution majeure du calcul des balances âgées :

- **CTE `matching_residuals`** : les lignes partageant un `matching_number` sont regroupées par `(tenant, company_id, partner_id, account_code, matching_number)` et leur résiduel algébrique est calculé
- **Groupe complet** (résiduel ≈ 0) → **exclu automatiquement** du calcul d'ancienneté
- **Groupe partiel** (résiduel > seuil 0.005) → **seul le résiduel** est placé dans la tranche d'ancienneté, daté au `MAX(COALESCE(date_maturity, line_date))` du groupe
- **Lignes sans `matching_number`** → comportement V2 inchangé
- **Multi-devises** dans un même groupe matching → fallback V2 (lignes individuelles conservées), limitation documentée

Nouvelles données exposées :

- `partial_matching_coverage: "residual_computed"` dans la réponse JSON
- Colonne `partial_matching` dans l'export CSV
- Mise à jour des `v2_limitations` (retrait de l'ancienne limitation sur matching_number)

### 3.3 Rapport structuré DOCX v1 (T75 + T76)

**Diva — template report engine :**

- `GenerateAccountingReport(pack, generatedAt)` → struct `AccountingReport` complet
- Sections : en-tête, synthèse (headline + what_i_see), vigilance (to_check), tableaux Bilan et CR avec N/N-1/variation%, top 5 partenaires >90j (clients + fournisseurs), périmètre et couverture
- Constante `ReportTemplateVersion = "1.0"` — traçabilité dans l'en-tête et le pied de page
- **Template-first strict** : aucun appel Mistral, tout le texte vient du moteur déterministe

**Diva — génération DOCX :**

- Rendu DOCX pur Go (`archive/zip` + OpenXML) — zéro dépendance externe
- Document sobre : titres hiérarchiques, tableaux avec bordures fines, montants formatés EUR alignés à droite
- Pied de page : `facts_hash | template_version | date | Dorevia Lynki — template-first`
- **Branding fallback** : si la configuration branding du tenant est absente, fallback sobre "Dorevia Lynki"

**Règle d'exécution :** le contenu du rapport DOCX est exclusivement produit par le moteur template-first à partir du `AccountingFactsPack`. Mistral n'intervient à aucun moment dans la génération du document.

**Linky — export et téléchargement :**

- Route proxy `POST /api/diva/accounting-report` — passthrough binaire DOCX, timeout 30s
- Filename : `synthese-comptable-{tenant}-{period_from}_{period_to}.docx`
- Bouton "Télécharger le rapport" dans `AccountingInsightBlock` avec états : disabled (pas d'insight), loading (spinner), done, error
- Même payload que l'insight → même périmètre → même `facts_hash`

---

## 4. Non-régression

| Périmètre | Statut |
|-----------|--------|
| Surface 4 blocs Synthèse | ✅ Inchangé |
| Encart insight (+ bouton DOCX ajouté) | ✅ OK |
| Comparatif N/N-1 | ✅ Inchangé |
| Multi-sociétés additive | ✅ Inchangé |
| Drill rubrique → BG → GL | ✅ Inchangé |
| Exports CSV (BG, GL, rubriques, balances tiers) | ✅ Inchangé (+ colonne `partial_matching`) |
| Habilitations `/accounting/*` | ✅ Inchangé |
| Navigation Pilotage / Synthèse (SPEC_UX_NAVIGATION) | ✅ Conforme |
| Build Vault | ✅ `go build ./...` OK |
| Build Diva | ✅ `go build ./...` OK |
| Build Linky | ✅ `next build` OK (image Docker `sprint13-2026-03-20`) |

---

## 5. Gates — cible fin Sprint 13

| Gate | Statut | Périmètre |
|------|--------|-----------|
| **Gate A** | ✅ Close — intégrité vaulting, trace scellée | inchangé |
| **Gate B** | ✅ Close — rejouabilité ERP, backfill | inchangé |
| **Gate C** | ✅ Close (périmètre Phase 2 V1) — surface Synthèse complète avec consolidation multi-sociétés, comparatifs enrichis, exports | inchangé |
| **Gate D** | ✅ **Close (périmètre Sprint 13)** — tiers V2+ (résiduel), rapport structuré documentaire, calendrier comptable |

---

## 6. Limitations connues

- **Multi-devises** : groupes matching multi-devises → fallback V2 (Sprint 13 ne résout pas ce cas, il est documenté)
- **Calendrier comptable** : synchronisation quotidienne (pas temps réel) ; dépend de la configuration `period_lock_date` / `fiscalyear_lock_date` dans Odoo
- **DOCX v1** : rapport sobre et fonctionnel ; pas encore de personnalisation par tenant, pas de sections optionnelles conditionnelles, pas de logo
- **Balances tiers V2+** : le résiduel est calculé sur les données en base ; une ligne Odoo non encore synchronisée peut impacter temporairement le calcul

---

## 7. Après ce sprint

- **Balances tiers — netting avancé** : résolution multi-devises, appariement croisé
- **Rapport DOCX v2** — enrichissement du template, branding tenant, sections conditionnelles, comparatif détaillé
- **Rejouabilité formelle** : lecture à date, historisation des FactsPack
- **Calendrier comptable v2** : clôtures intermédiaires, alertes délai de clôture

---

*Fin du rapport Sprint 13.*
