# Plan Sprint 14 — Lynki

**Fichier canonique :** `PLAN_SPRINT_14_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Sprint précédent :** [RAPPORT_SPRINT_13_LYNKI.md](RAPPORT_SPRINT_13_LYNKI.md) v1.1  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) v2.4  
**Alignement :** [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) v2.5  
**Wireframes :** [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md) v0.4

---

## 1. Contexte

Avec le Sprint 13, Lynki a franchi un cap : **calendrier comptable ERP**, **tiers V2+ résiduel**, et surtout le **premier document formel DOCX** généré template-first.

Le produit n'est plus seulement une surface de consultation — il commence à **produire des livrables exploitables hors écran**.

Le Sprint 14 prolonge cette trajectoire sur trois axes :

1. **Header chrome conforme aux wireframes BF** — le segmented control Pilotage / Synthèse n'est pas encore matérialisé visuellement ; la bascule repose sur le hamburger ou le `?view=` URL. Les wireframes (§3.1) recommandent une rangée dédiée visible en permanence.
2. **Rapport DOCX v2** — le v1 est sobre et fonctionnel, mais sans branding tenant, sans logo, sans sections conditionnelles. Le v2 rend le document livrable à un tiers (commissaire aux comptes, direction).
3. **Historisation des FactsPack** — pour asseoir la rejouabilité formelle, chaque insight et chaque rapport DOCX doit pouvoir être re-généré à partir du même pack de faits. L'archivage côté Vault pose la brique.

---

## 2. Objectifs

| # | Objectif | Composant |
|---|----------|-----------|
| A | Chrome header — segmented control Pilotage / Synthèse conforme wireframes BF §3.1 | Linky UI |
| B | Rapport DOCX v2 — branding tenant, sections conditionnelles, comparatif N/N-1 détaillé | Diva |
| C | Historisation FactsPack — archivage pour rejouabilité et audit | Vault + Diva |

---

## 3. Périmètre

### Dans le sprint

- Implémentation du segmented control visible (desktop + mobile) sans passer par le hamburger
- Alignement strict avec `SPEC_UX_NAVIGATION_LYNKI.md` §5 et wireframes BF §3.1 / §8.1
- DOCX v2 : en-tête avec branding tenant, logo optionnel, sections conditionnelles (bilan absent → section omise), comparatif N/N-1 complet dans les tableaux
- Table `facts_pack_archive` dans Vault, avec `facts_hash`, `pack_json`, `generated_at`, `source` (insight / report)
- Endpoint de consultation `GET /api/accounting/facts-pack/:hash`

### Hors sprint

- Netting multi-devises (prévu Sprint 15+)
- Calendrier comptable v2 (clôtures intermédiaires, alertes délai)
- Rôles fins RAF / DAF / Consultant
- Feature flags tenant pour sections Synthèse

---

## 4. Dépendances

| Dépendance | Source | Statut |
|------------|--------|--------|
| Sprint 13 livré (T72–T77) | [RAPPORT_SPRINT_13_LYNKI.md](RAPPORT_SPRINT_13_LYNKI.md) v1.1 | ✅ |
| SPEC_UX_NAVIGATION_LYNKI.md v0.3 | Spec navigation | ✅ Stable |
| Wireframes BF v0.4 | Wireframes navigation | ✅ Référence |
| AccountingFactsPack v1 | Diva facts engine | ✅ Livré Sprint 12 |
| Rapport DOCX v1 | Diva docx generator | ✅ Livré Sprint 13 |

---

## 5. Détails techniques

### 5.1 Chrome header — segmented control (Objectif A)

**Principe :** remplacer la bascule implicite (hamburger / URL) par un **segmented control visible** sur une rangée dédiée du header, conforme au wireframe §3.1.

**Structure desktop (rappel wireframe) :**

```
rangée 1 : identité + contexte secondaire + tenant + menu
rangée 2 : [ Pilotage ] [ Synthèse comptable ]         ← NOUVEAU
rangée 3 : Société [▼]  Période [▼]  Année [▼]
```

**Structure mobile (wireframe §8.1) :**

```
Lynki                        [Menu]
[ Pilotage | Synthèse ]             ← NOUVEAU
Société [▼]   Période [▼]
```

**Règles :**

- **L'URL reste la source de vérité de `appView`** ; le segmented control est une surface de pilotage de cet état, pas un état parallèle. L'état React dérive du `searchParams` ; le clic met à jour l'URL, ce qui déclenche le re-rendu. La navigation arrière navigateur fonctionne nativement.
- Le segmented control est toujours visible (pas dans le hamburger)
- L'état actif est visuellement distinct (fond accent, texte contrasté)
- Au clic : mise à jour de `appView` + URL `?view=` synchronisée
- `kpiMode` reste dans le hamburger, visible uniquement en Pilotage (inchangé)
- En mode `chromeCompact`, le segmented control est réduit à un badge cliquable (ex. "Synthèse")
- Transition Synthèse → Pilotage : restauration du dernier `kpiMode` mémorisé

**Fichiers impactés :**

- `components/ReportHeaderContentBody.tsx` — ajout rangée segmented control
- `components/ReportHeaderContent.types.ts` — prop `onAppViewChange`
- `components/ReportHeader.tsx` — propagation callback
- `components/DashboardWithFilters.tsx` — handler changement appView + URL sync

### 5.2 Rapport DOCX v2 (Objectif B)

**Enrichissements par rapport au v1 :**

| Aspect | v1 (Sprint 13) | v2 (Sprint 14) |
|--------|----------------|----------------|
| Branding | Fallback "Dorevia Lynki" | Config tenant : nom, baseline, couleur titre |
| Logo | Absent | Optionnel (chemin image configurable) |
| Sections | Toutes présentes | Conditionnelles : bilan omis si absent, tiers omis si vides |
| Comparatif | Colonne N-1 simple | Variation absolue + pourcentage + flèche direction |
| Page de titre | Texte sobre | Encadré structuré avec période, tenant, date |
| Table des matières | Absente | Sommaire simplifié (sections numérotées) |
| `template_version` | `1.0` | `2.0` |

**Branding config :**

```go
type ReportBrandingConfig struct {
    ProductName  string // ex. "Lynki by Dorevia"
    CompanyName  string // ex. "SARL La Platine"
    Baseline     string // ex. "Décidez sur des données vérifiables."
    TitleColor   string // hex, ex. "1B3A5C"
    LogoPath     string // optionnel
}
```

Le branding est résolu depuis la config tenant (`tenantConfig.chrome.branding`). Si absent, fallback v1 ("Dorevia Lynki").

Le Sprint 14 livre un **branding léger** et une **composition documentaire conditionnelle**, sans ouvrir encore la personnalisation métier avancée par tenant (sections métier spécifiques, annexes configurables, formats alternatifs).

**Sections conditionnelles :** chaque section du rapport vérifie la présence des données dans le `AccountingFactsPack`. Si un bloc est `nil` ou vide, la section est omise proprement (pas de tableau vide ni de "Aucune donnée").

**Fichiers impactés :**

- `units/diva/internal/docx/generator.go` — enrichissement rendu, branding, sections conditionnelles
- `units/diva/internal/facts/accounting_report.go` — `ReportTemplateVersion = "2.0"`, branding dans header
- `units/diva/internal/handlers/accounting_report.go` — résolution branding depuis payload

### 5.3 Historisation FactsPack (Objectif C)

**Objectif :** permettre la relecture et la re-génération d'un insight ou d'un rapport à partir du même pack de faits (rejouabilité formelle, piste d'audit).

**Migration Vault :**

```sql
CREATE TABLE IF NOT EXISTS facts_pack_archive (
    id           SERIAL PRIMARY KEY,
    tenant       TEXT NOT NULL,
    facts_hash   TEXT NOT NULL,
    pack_json    JSONB NOT NULL,
    source       TEXT NOT NULL CHECK (source IN ('insight', 'report')),
    template_version TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant, facts_hash, source)
);

CREATE INDEX IF NOT EXISTS idx_facts_pack_archive_tenant_hash
    ON facts_pack_archive (tenant, facts_hash);
CREATE INDEX IF NOT EXISTS idx_facts_pack_archive_generated_at
    ON facts_pack_archive (generated_at);
```

**Flux :**

1. Diva génère le `AccountingFactsPack` (existant)
2. Avant de retourner l'insight ou le DOCX, Diva envoie le pack en archive via `POST /api/accounting/facts-pack/archive`
3. Vault stocke le pack en JSONB, dédupliqué par `(tenant, facts_hash, source)`. **Si un même `facts_hash` produit à la fois un insight et un report, les deux archives coexistent** — la contrainte d'unicité inclut `source`, ce qui préserve la traçabilité de chaque usage documentaire.
4. Endpoint de consultation : `GET /api/accounting/facts-pack/:hash?tenant=X` retourne le pack archivé (le plus récent si plusieurs sources existent)

**Limitation Sprint 14 :** pas de re-génération automatique depuis le pack archivé (Sprint 15+). L'archive est consultable et garantit la traçabilité.

**Fichiers impactés :**

- `sources/vault/migrations/051_facts_pack_archive.sql` — **NOUVEAU**
- `sources/vault/internal/storage/facts_pack_archive.go` — **NOUVEAU**
- `sources/vault/internal/handlers/facts_pack_archive.go` — **NOUVEAU**
- `sources/vault/internal/server/replay.go` — routes
- `units/diva/internal/handlers/accounting_insight.go` — appel archive après génération
- `units/diva/internal/handlers/accounting_report.go` — appel archive après génération

---

## 6. Tickets

| # | Titre | Composant | Dépendance |
|---|-------|-----------|------------|
| T78 | Chrome header — segmented control Pilotage / Synthèse | Linky UI | — |
| T79 | Rapport DOCX v2 — branding tenant + sections conditionnelles + comparatif enrichi | Diva | — |
| T80 | Vault — migration + handlers archive FactsPack | Vault | — |
| T81 | Diva — archivage FactsPack après insight et report | Diva | T80 |
| T82 | Linky — proxy consultation archive FactsPack | Linky UI | T80 |
| T83 | Non-régression + doc Sprint 14 | Transversal | T78–T82 |

**Séquence recommandée :** T78 + T79 + T80 en parallèle → T81 → T82 → T83

---

## 7. Definition of Done

- [ ] Segmented control visible desktop et mobile, sans hamburger
- [ ] Transition Pilotage ↔ Synthèse fluide, URL synchronisée, `kpiMode` restauré
- [ ] DOCX v2 ouvrable dans Word / LibreOffice, avec branding tenant si configuré
- [ ] Sections conditionnelles : bilan omis si absent, pas de tableau vide
- [ ] Comparatif N/N-1 détaillé avec variation absolue + pourcentage
- [ ] `template_version = "2.0"` dans le DOCX
- [ ] Table `facts_pack_archive` en place, déduplication par `(tenant, facts_hash, source)`
- [ ] Archivage automatique à chaque insight et chaque rapport
- [ ] Endpoint `GET /api/accounting/facts-pack/:hash` fonctionnel
- [ ] Builds Vault + Diva + Linky OK
- [ ] Non-régression : surface existante inchangée, DOCX v1 toujours fonctionnel (v2 = upgrade)

---

## 8. Risques

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Segmented control trop dense en mobile | UX dégradée | Variante compacte wireframes §8.2 comme fallback |
| Branding tenant non configuré | DOCX sans personnalisation | Fallback v1 ("Dorevia Lynki") — déjà en place |
| Volume d'archivage FactsPack | Croissance table JSONB | Rétention 90j en Sprint 15, TTL index |
| Logo manquant pour certains tenants | DOCX incomplet | Logo optionnel, page titre fonctionnelle sans |

---

## 9. Impact navigation UX

Le segmented control (T78) est le premier alignement concret avec les wireframes BF. Il rend la bascule Pilotage / Synthèse **explicite et permanente**, là où elle était auparavant implicite (URL ou hamburger).

Cet alignement prépare :
- les tests utilisateurs avec deux lectures visibles,
- l'ajout futur de vues supplémentaires (ex. "Gestion" / "Paie") sans surcharger le hamburger.

---

## 10. Gates — cible fin Sprint 14

| Gate | Statut cible |
|------|-------------|
| **Gate A** | ✅ Close — inchangé |
| **Gate B** | ✅ Close — inchangé |
| **Gate C** | ✅ Close — inchangé |
| **Gate D** | ✅ **Close (périmètre Sprint 14)** — chrome produit aligné, rapport documentaire v2 livrable, historisation FactsPack |

---

## 11. Après ce sprint

- **Rejouabilité v2** — re-génération d'insight/rapport depuis un pack archivé (lecture à date)
- **Netting multi-devises** — résolution des groupes matching multi-devises dans les balances tiers
- **Calendrier comptable v2** — clôtures intermédiaires, alertes délai, deadline ERP
- **Rôles fins** — RAF / DAF / Consultant, feature flags tenant
- **Vues additionnelles** — extension du segmented control (Gestion, Paie)

---

*Fin du plan Sprint 14.*
