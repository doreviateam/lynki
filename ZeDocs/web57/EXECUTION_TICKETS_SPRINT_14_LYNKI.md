# Tickets d'exécution — Sprint 14 Lynki

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_14_LYNKI.md`  
**Version :** 1.1 — mars 2026  
**Référence plan :** [PLAN_SPRINT_14_LYNKI.md](PLAN_SPRINT_14_LYNKI.md) **v1.1**  
**Référence rapport précédent :** [RAPPORT_SPRINT_13_LYNKI.md](RAPPORT_SPRINT_13_LYNKI.md) **v1.1**  
**Backlog :** [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.4**  
**Alignement :** [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.5**  
**Wireframes :** [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md) **v0.4**

**Séquence d'exécution :** T78 + T79 + T80 en parallèle → T81 → T82 → T83

---

## T78 — Chrome header — segmented control Pilotage / Synthèse

**Objectif :** matérialiser la bascule Pilotage / Synthèse comme un **segmented control visible sur une rangée dédiée du header**, conforme au wireframe BF §3.1, en remplacement de la tab bar actuellement positionnée sous le header.

### Prérequis

- Sprint 13 livré (navigation `?view=pilotage|synthese` fonctionnelle)
- Wireframes BF v0.4 (§3.1 desktop, §8.1 mobile)
- SPEC_UX_NAVIGATION v0.3 (§3, §4, §6)

### Règle fondamentale

**L'URL reste la source de vérité de `appView`** ; le segmented control est une surface de pilotage de cet état, pas un état parallèle. L'état React dérive du `searchParams` ; le clic met à jour l'URL via `router.push`, ce qui déclenche le re-rendu. La navigation arrière navigateur fonctionne nativement grâce à `useSearchParams`.

### Travaux attendus

#### 1. Supprimer la tab bar standalone sous le header

Dans `components/DashboardWithFilters.tsx`, la bascule actuelle est un `<div role="tablist">` positionné entre le header et le `<main>` (lignes ~492–509). Ce bloc doit être **supprimé** : le segmented control migre à l'intérieur du header.

#### 2. Ajouter le segmented control dans le header — rangée dédiée

Dans `components/ReportHeaderContentBody.tsx`, insérer une **rangée 2** entre la ligne identité (rangée 1) et la ligne filtres (rangée 3) :

**Desktop (sm+) :**

```text
rangée 1 : identité + contexte secondaire + tenant + menu
rangée 2 : [ Pilotage ] [ Synthèse comptable ]          ← NOUVEAU
rangée 3 : Société [▼]  Période [▼]  Année [▼]
```

**Mobile (< sm) :**

```text
Lynki                        [Menu]
[ Pilotage | Synthèse ]              ← NOUVEAU
Société [▼]   Période [▼]
```

Le segmented control :

- Conteneur : `role="tablist"`, `aria-label="Vue de l'application"`. Chaque segment : `role="tab"`, `aria-selected`. Note : le segmented control pilote une navigation d'application via URL ; l'implémentation conserve `tablist/tab` pour cohérence visuelle et accessibilité, sans introduire de `tabpanel` autonome (la surface entière sous le header change, pas un panneau local)
- L'élément actif a un fond accent (`bg-[var(--accent)]`), texte blanc ; l'inactif a un fond transparent, texte secondaire
- Rendu dans un `<div>` à bords arrondis (`rounded-lg`) avec fond subtil (`bg-[var(--surface)]`) pour l'effet "pill"
- Espacement : `mt-2 mb-1` entre rangée 1 et rangée 3
- **Accessibilité clavier :** Tab atteint chaque segment, Enter et Space activent la vue, focus visible obligatoire (`focus-visible:ring-2`)
- **Vigilance responsive :** vérifier que la rangée 2 ne provoque ni overlap ni compression des filtres société/période/année entre 640 px et 900 px

**En mode `chromeCompact` :** le segmented control est remplacé par un **badge cliquable** affichant le nom de la vue courante (ex. "Synthèse") dans le bandeau compact. Au clic, le badge **alterne directement vers l'autre vue** via mise à jour de l'URL (`onNavigateToAppView`). Aucun menu intermédiaire. Conforme au wireframe §8.2.

#### 3. Propager le callback `onNavigateToAppView`

Ajouter dans `ReportHeaderContent.types.ts` :

```typescript
onNavigateToAppView?: (view: "pilotage" | "synthese") => void;
```

**Sémantique :** le nom `onNavigateToAppView` (et non `onAppViewChange` ou `setAppView`) impose que le callback **effectue une navigation URL** (`router.push`), pas une mutation d'état React local. L'état rendu dérive exclusivement de `searchParams`. Le dev ne doit jamais créer un `useState` autonome piloté par ce callback.

Propagation :

- `DashboardWithFilters.tsx` → passe `setAppView` (qui fait `router.push`) comme `onNavigateToAppView`
- `ReportHeader.tsx` → transmet à `ReportHeaderContent`
- `ReportHeaderContentBody.tsx` → utilise au clic sur le segmented control

#### 4. Synchronisation `kpiMode`

Pas de changement de logique — `kpiMode` reste masqué en Synthèse (déjà implémenté). La transition Synthèse → Pilotage restaure le dernier `kpiMode` connu (comportement existant préservé via le state `viewMode` dans `DashboardWithFilters`).

#### 5. Ajuster la hauteur max du header

Le header passe de 3 à 3.5 rangées visuelles. Ajuster la `max-height` dans `ReportHeader.tsx` et le `maxHeight` dans le wrapper `DashboardWithFilters.tsx` :

- Desktop étendu : `max-h-[140px]` (au lieu de `110px`)
- Mobile étendu : laisser le contenu dicter la hauteur (pas de `max-h` fixe en mobile)
- Compact : inchangé (`max-h-[72px]`)

### Checkpoint

- [ ] Segmented control visible dans le header desktop (rangée dédiée)
- [ ] Segmented control visible dans le header mobile (sous la ligne identité)
- [ ] Tab bar standalone supprimée de `DashboardWithFilters`
- [ ] Au clic : URL `?view=` mise à jour, écran bascule
- [ ] Navigation arrière navigateur fonctionne (pilotage → synthèse → back = pilotage)
- [ ] `kpiMode` masqué en Synthèse, restauré au retour Pilotage
- [ ] Mode `chromeCompact` : badge vue courante cliquable
- [ ] Accessibilité : `role="tablist"`, `aria-label`, `aria-selected`, clavier (Tab, Enter, Space), focus visible
- [ ] Pas d'overlap ni de compression des filtres entre 640 px et 900 px
- [ ] Build Linky OK

### Fichiers concernés

- `components/ReportHeaderContentBody.tsx` — ajout rangée segmented control
- `components/ReportHeaderContent.types.ts` — prop `onNavigateToAppView`
- `components/ReportHeaderContent.tsx` — propagation
- `components/ReportHeader.tsx` — propagation callback, ajustement `max-h`
- `components/DashboardWithFilters.tsx` — suppression tab bar standalone, passage callback, ajustement `maxHeight`

---

## T79 — Rapport DOCX v2 — branding tenant + sections conditionnelles + comparatif enrichi

**Objectif :** faire passer le rapport DOCX de "preuve de faisabilité" (v1) à "livrable présentable à un tiers" (v2).

Le Sprint 14 livre un **branding léger** et une **composition documentaire conditionnelle**, sans ouvrir encore la personnalisation métier avancée par tenant (sections métier spécifiques, annexes configurables, formats alternatifs).

### Prérequis

- Sprint 13 livré (T75 : DOCX v1, `template_version = "1.0"`)
- `AccountingFactsPack` v1 (Sprint 12)
- `docx/generator.go` fonctionnel (pure Go, archive/zip + OpenXML)

### Travaux attendus

#### 1. Enrichir `BrandingConfig`

Dans `units/diva/internal/docx/generator.go`, enrichir la struct :

```go
type BrandingConfig struct {
    ProductName  string // ex. "Lynki by Dorevia"
    CompanyName  string // ex. "SARL La Platine"
    Baseline     string // ex. "Décidez sur des données vérifiables."
    TitleColor   string // hex sans #, ex. "1B3A5C"
    LogoPath     string // optionnel — chemin image (hors périmètre v2 : logo non embarqué dans le DOCX)
}
```

Le fallback reste `defaultBranding` quand `branding == nil` : `ProductName = "Dorevia Lynki"`, `CompanyName = "Dorevia"`, `Baseline` vide, `TitleColor = "1B3A5C"`.

**Logo :** le champ `LogoPath` est déclaré mais **pas rendu** dans le DOCX v2 (embarquer une image en OpenXML est significativement plus complexe). Le champ prépare la v3. Le DOCX v2 fonctionne sans logo.

#### 2. Page de titre structurée

Remplacer le début du document (simple heading + paragraphes) par un **bloc de titre visuellement structuré et centré** :

```text
          Synthèse comptable
          SARL La Platine

   Période : 01/01/2026 — 20/03/2026
   Généré le 20/03/2026
   par Lynki by Dorevia

   Décidez sur des données vérifiables.
```

Implémentation : un **tableau OpenXML sans bordures visibles**, centré, une seule colonne. L'objectif est une composition stable et sobre, pas un cadre graphique décoratif. Le titre utilise le style `Heading1` (couleur = `TitleColor` si configuré), le nom de société `Heading2`, les lignes de contexte en texte normal centré. Un saut de page (`w:pageBreakBefore`) sépare la page de titre du sommaire.

#### 3. Sommaire simplifié

Après la page de titre, générer un **sommaire numéroté** :

```text
1. Synthèse
2. Points de vigilance
3. Bilan
4. Compte de résultat
5. Balances tiers
6. Périmètre et couverture
```

La numérotation du sommaire **et** des `Heading1` dans le document est construite **dynamiquement après résolution des sections incluses** (sections conditionnelles — voir §4). Aucune rupture de séquence n'est admise : si le Bilan est omis, le Compte de résultat devient `3.` et non `4.`. Le sommaire est statique (pas un champ Word TOC — cohérent avec l'approche template-first).

#### 4. Sections conditionnelles

Chaque section du rapport vérifie la présence des données dans le `AccountingReport` :

| Section | Condition d'inclusion |
|---------|----------------------|
| Synthèse | Toujours (headline + what_i_see) |
| Vigilance | Toujours (to_check) |
| Bilan | `BalanceSheetTable != nil && len(Lines) > 0` |
| Compte de résultat | `IncomeStatementTable != nil && len(Lines) > 0` |
| Balances tiers | `AgedBalancesSummary != nil && (len(TopReceivables) > 0 \|\| len(TopPayables) > 0)` |
| Périmètre | Toujours |

Section omise → **pas de tableau vide**, pas de "Aucune donnée". Le sommaire reflète uniquement les sections effectivement présentes.

**Contenu minimum de la section Périmètre :**

- Période (date début — date fin)
- Tenant / société(s)
- Date de génération
- `template_version`
- `facts_hash`
- Référentiel (ex. PCG)
- Couverture par bloc (Bilan, CR, Tiers)
- Limitations éventuelles

#### 5. Comparatif N/N-1 enrichi

Dans les tableaux Bilan et CR, enrichir la colonne Variation :

| Colonne v1 | Colonne v2 |
|------------|------------|
| `"12.5%"` | `"+12,5 % ▲"` ou `"-8,3 % ▼"` (variation avec flèche directionnelle) |

Ajouter une colonne **Variation absolue** entre N-1 et Variation % :

```text
| Rubrique | N (EUR) | N-1 (EUR) | Écart (EUR) | Variation |
```

L'écart = `AmountN - AmountN1`. La flèche `▲` (hausse) ou `▼` (baisse) est calculée sur le signe de la variation.

**Règles de format documentaire (v2) :**

| Élément | Format | Exemple |
|---------|--------|---------|
| Montants | séparateur milliers espace insécable (`\u00A0`), décimales `,`, 2 chiffres. Vérifier que Word/LibreOffice affichent le séparateur sans retour à la ligne parasite. | `12 345,67` |
| Écart | signe explicite `+` / `-` | `+1 234,00` |
| Variation % | signe + 1 décimale + flèche | `+12,5 % ▲` |
| Variation stable | `|variation| < 0,1 %` | `0,0 %` (pas de flèche) |
| N-1 = 0 et N ≠ 0 | variation non calculable | `n/a` |
| N-1 = 0 et N = 0 | pas de variation | `—` |
| Flèche | hausse = `▲`, baisse = `▼`, stable ou n/a = aucune | |

#### 6. Branding depuis le payload handler

Dans `units/diva/internal/handlers/accounting_report.go`, le handler reçoit un branding optionnel dans le payload :

```go
type AccountingReportRequest struct {
    models.AccountingInsightRequest
    Branding *docx.BrandingConfig `json:"branding,omitempty"`
}
```

Si `Branding` est absent du payload, `docx.RenderReport` utilise le fallback par défaut (identique au v1).

#### 7. Bump `template_version`

Dans `units/diva/internal/facts/accounting_report.go` :

```go
const ReportTemplateVersion = "2.0"
```

### Checkpoint

- [ ] Branding tenant rendu dans la page de titre (nom société, baseline, couleur)
- [ ] Page de titre sous forme d'encadré structuré centré
- [ ] Sommaire numéroté dynamiquement (pas de rupture de séquence si section omise)
- [ ] Sections conditionnelles : bilan omis si données absentes, pas de tableau vide
- [ ] Comparatif N/N-1 : colonnes Écart + Variation % avec flèche
- [ ] Cas `N-1 = 0` : variation affichée `n/a`, pas de division par zéro
- [ ] Format monétaire conforme : `12 345,67`, signe explicite, flèches directionnelles
- [ ] `template_version = "2.0"` dans le DOCX et les headers HTTP
- [ ] Fallback branding sobre si non configuré
- [ ] DOCX ouvrable dans Word / LibreOffice, mise en page correcte
- [ ] Build Diva OK

### Fichiers concernés

- `units/diva/internal/docx/generator.go` — branding enrichi, page de titre, sommaire, sections conditionnelles, comparatif v2
- `units/diva/internal/facts/accounting_report.go` — `ReportTemplateVersion = "2.0"`, données comparatif enrichi
- `units/diva/internal/handlers/accounting_report.go` — parsing branding depuis payload

---

## T80 — Vault — migration + handlers archive FactsPack

**Objectif :** créer la table `facts_pack_archive` dans Vault et exposer les endpoints d'archivage et de consultation.

### Prérequis

- Sprint 13 livré (migration `050_accounting_periods.sql` est la dernière)
- `AccountingFactsPack` struct existante côté Diva

### Travaux attendus

#### 1. Migration Vault — table `facts_pack_archive`

Créer `sources/vault/migrations/051_facts_pack_archive.sql` :

```sql
CREATE TABLE IF NOT EXISTS facts_pack_archive (
    id               SERIAL PRIMARY KEY,
    tenant           TEXT NOT NULL,
    facts_hash       TEXT NOT NULL,
    pack_json        JSONB NOT NULL,
    source           TEXT NOT NULL CHECK (source IN ('insight', 'report')),
    template_version TEXT,
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant, facts_hash, source)
);

CREATE INDEX IF NOT EXISTS idx_facts_pack_archive_tenant_hash
    ON facts_pack_archive (tenant, facts_hash);
CREATE INDEX IF NOT EXISTS idx_facts_pack_archive_generated_at
    ON facts_pack_archive (generated_at);
```

**Déduplication :** la contrainte `UNIQUE (tenant, facts_hash, source)` permet à un même `facts_hash` d'avoir **deux archives distinctes** (une `insight`, une `report`), car la source documentaire diffère. Les deux coexistent.

#### 2. Storage layer

Créer `sources/vault/internal/storage/facts_pack_archive.go` :

```go
type FactsPackArchiveRow struct {
    ID              int       `json:"id"`
    Tenant          string    `json:"tenant"`
    FactsHash       string    `json:"facts_hash"`
    PackJSON        []byte    `json:"pack_json"`        // JSONB brut
    Source          string    `json:"source"`            // "insight" | "report"
    TemplateVersion string    `json:"template_version"`
    GeneratedAt     time.Time `json:"generated_at"`
}

type FactsPackArchiveUpsert struct {
    Tenant          string
    FactsHash       string
    PackJSON        []byte
    Source          string
    TemplateVersion string
}
```

Fonctions :

- `UpsertFactsPackArchive(ctx, upsert *FactsPackArchiveUpsert) error` — INSERT … ON CONFLICT (tenant, facts_hash, source) DO UPDATE SET pack_json = EXCLUDED.pack_json, template_version = EXCLUDED.template_version, generated_at = NOW()
- `GetFactsPackArchive(ctx, tenant string, factsHash string) ([]FactsPackArchiveRow, error)` — retourne toutes les archives pour ce tenant + hash (peut être 1 ou 2 lignes)

#### 3. Handler — `POST /api/accounting/facts-pack/archive`

Créer `sources/vault/internal/handlers/facts_pack_archive.go` :

```go
func FactsPackArchiveHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler
```

- Body JSON :
  ```json
  {
    "tenant": "laplatine2026",
    "facts_hash": "abc123...",
    "pack_json": { ... },
    "source": "insight",
    "template_version": "2.0"
  }
  ```
- **Validation handler :**
  - `tenant` non vide (sinon 400)
  - `facts_hash` non vide (sinon 400)
  - `pack_json` objet JSON valide (sinon 400)
  - `source ∈ {"insight", "report"}` (sinon 400 — vérifié côté handler en plus du CHECK SQL)
- Appelle `UpsertFactsPackArchive`
- Retourne `201 { "status": "archived", "facts_hash": "...", "source": "..." }`
- Log : `event=facts_pack_archived, tenant, facts_hash, source, template_version, size_bytes`

#### 4. Handler — `GET /api/accounting/facts-pack/:hash`

```go
func FactsPackGetHandler(db *storage.DB, log *zerolog.Logger) fiber.Handler
```

- Params : `:hash` (path), `tenant` (query, requis), `source` (query, optionnel : `"insight"` | `"report"`)
- Validation handler : `tenant` non vide (sinon 400), `source` si fourni doit être `∈ {"insight", "report"}` (sinon 400)
- Appelle `GetFactsPackArchive(ctx, tenant, hash)`
- **Résolution :**
  - Si `source` fourni → retourne l'archive correspondante
  - Si `source` absent et **une seule archive** existe → retourne cette archive
  - Si `source` absent et **plusieurs archives** → retourne `409 { "error": { "code": "AMBIGUOUS_SOURCE", "message": "Plusieurs sources disponibles (insight, report). Préciser ?source=insight ou ?source=report.", "available_sources": ["insight", "report"] } }`
- Si non trouvé : `404 { "error": { "code": "NOT_FOUND" } }`

#### 5. Routes Vault

Enregistrer dans `sources/vault/internal/server/replay.go` (fonction `RegisterUiAggregations`) :

```go
// Sprint 14 T80 — Historisation FactsPack
app.Post("/api/accounting/facts-pack/archive", handlers.FactsPackArchiveHandler(db, log))
app.Get("/api/accounting/facts-pack/:hash", handlers.FactsPackGetHandler(db, log))
```

### Checkpoint

- [ ] Migration appliquée, table `facts_pack_archive` créée avec index
- [ ] `POST /api/accounting/facts-pack/archive` accepte et stocke le pack
- [ ] Déduplication `(tenant, facts_hash, source)` : upsert sans erreur
- [ ] Coexistence insight + report pour un même `facts_hash`
- [ ] `GET /api/accounting/facts-pack/:hash?tenant=X&source=insight` retourne le pack archivé
- [ ] GET sans `source` et une seule archive → retourne l'archive
- [ ] GET sans `source` et deux archives → 409 avec `available_sources`
- [ ] 404 si hash inconnu
- [ ] 400 si `tenant` absent ou `source` invalide
- [ ] Build Vault OK

### Fichiers concernés

- `sources/vault/migrations/051_facts_pack_archive.sql` — **NOUVEAU**
- `sources/vault/internal/storage/facts_pack_archive.go` — **NOUVEAU**
- `sources/vault/internal/handlers/facts_pack_archive.go` — **NOUVEAU**
- `sources/vault/internal/server/replay.go` — routes

---

## T81 — Diva — archivage FactsPack après insight et report

**Objectif :** après chaque génération d'insight ou de rapport DOCX, Diva envoie automatiquement le `AccountingFactsPack` en archive vers Vault.

### Prérequis

- T80 livré (endpoint `POST /api/accounting/facts-pack/archive` opérationnel)

### Travaux attendus

#### 1. Client d'archivage — wrapper async dédié

Créer `units/diva/internal/archive/client.go` avec **deux fonctions** :

```go
// archiveFactsPack effectue le POST synchrone vers Vault (usage interne).
func archiveFactsPack(vaultURL, tenant, factsHash, source, templateVersion string, packJSON []byte) error

// ArchiveFactsPackAsync lance l'archivage en goroutine (usage handlers).
// Encapsule : timeout, client HTTP, log start/end/error, recover panic.
func ArchiveFactsPackAsync(vaultURL, tenant, factsHash, source, templateVersion string, packJSON []byte)
```

**`ArchiveFactsPackAsync`** :

- Lance une goroutine avec `recover` pour capturer toute panic
- POST vers `{vaultURL}/api/accounting/facts-pack/archive`
- Body JSON conforme au format T80
- Timeout : 5 s
- **Fire-and-forget** : l'échec d'archivage ne doit PAS bloquer la réponse insight/report
- **Log succès :** `event=facts_pack_archive_sent, tenant, facts_hash, source, template_version, duration_ms`
- **Log échec :** `event=facts_pack_archive_failed, tenant, facts_hash, source, error, duration_ms` (niveau WARNING, pas ERROR — c'est un best-effort)

Le pattern goroutine dispersé (`go func() { ... }()`) dans les handlers est **interdit** : toujours passer par `ArchiveFactsPackAsync` pour centraliser l'observabilité.

#### 2. Intégration dans le handler insight

Dans `units/diva/internal/handlers/insights.go` (ou le handler `accounting-insight` pertinent) :

- Après génération réussie du `AccountingFactsPack` et de l'insight
- Sérialiser le pack en JSON (`json.Marshal(pack)`)
- Appeler `archive.ArchiveFactsPackAsync(vaultURL, tenant, pack.FactsHash, "insight", facts.ReportTemplateVersion, packJSON)`

**Note sur `templateVersion` :** côté Diva, la constante `facts.ReportTemplateVersion` est utilisée comme version du contrat documentaire, quelle que soit la source (insight ou report). Le nom "Report" est historique (Sprint 13) ; la valeur est commune au contrat de rendu.

#### 3. Intégration dans le handler report

Dans `units/diva/internal/handlers/accounting_report.go` :

- Après génération réussie du rapport, avant le `return c.Send(docxBytes)`
- Sérialiser le pack en JSON
- Appeler `archive.ArchiveFactsPackAsync(vaultURL, tenant, pack.FactsHash, "report", facts.ReportTemplateVersion, packJSON)`

#### 4. Règle de coexistence

Si un même `facts_hash` produit à la fois un insight et un report, les deux archives coexistent (la contrainte d'unicité inclut `source`). Pas de déduplication cross-source.

#### 5. Configuration Vault URL

La variable `VAULT_URL` (ou équivalent dans `runner.Config`) doit être accessible depuis les handlers. Vérifier qu'elle est déjà injectée ; si non, la propager depuis la config Diva. **Si `VAULT_URL` est vide ou absent au démarrage, l'archivage est sauté silencieusement avec log `event=facts_pack_archive_skipped, reason=vault_url_missing`.** Aucune panic, aucune erreur — le service fonctionne normalement sans archivage.

### Checkpoint

- [ ] Archivage insight : pack envoyé à Vault après chaque insight généré
- [ ] Archivage report : pack envoyé à Vault après chaque DOCX généré
- [ ] Fire-and-forget : échec d'archivage loggé (WARNING `facts_pack_archive_failed`) mais ne bloque pas la réponse
- [ ] Pattern : aucun `go func()` dispersé dans les handlers — uniquement `ArchiveFactsPackAsync`
- [ ] Deux archives coexistent pour le même `facts_hash` (insight + report)
- [ ] Build Diva OK

### Fichiers concernés

- `units/diva/internal/archive/client.go` — **NOUVEAU** (client HTTP d'archivage)
- `units/diva/internal/handlers/insights.go` — appel archive après insight
- `units/diva/internal/handlers/accounting_report.go` — appel archive après report
- `units/diva/internal/server/server.go` — injection config Vault URL si nécessaire

---

## T82 — Linky — proxy consultation archive FactsPack

**Objectif :** permettre à l'UI Linky de consulter un pack archivé via un proxy vers Vault.

### Prérequis

- T80 livré (endpoint Vault `GET /api/accounting/facts-pack/:hash`)

### Travaux attendus

#### 1. Route proxy Linky

Créer `units/dorevia-linky/app/api/accounting/facts-pack/[hash]/route.ts` :

```typescript
// GET /api/accounting/facts-pack/:hash?tenant=X
// Proxy vers VAULT_URL/api/accounting/facts-pack/:hash?tenant=X
```

- Extraire `hash` depuis les params dynamiques Next.js `[hash]`
- Passer `tenant` et `source` (optionnel) depuis le query string
- **Validation :** si `tenant` absent → `400 { error: "BAD_REQUEST", message: "tenant requis" }` (ne pas envoyer un appel incomplet vers Vault)
- Timeout 5 s
- **Gestion d'erreurs HTTP :**
  - Vault 404 → Linky `404 { error: "NOT_FOUND" }`
  - Vault 409 → Linky `409` (proxy transparent du payload `available_sources`)
  - Vault timeout / indisponible → Linky `502 { error: "UPSTREAM_UNAVAILABLE" }`
  - Vault 400 → Linky `400` (proxy transparent)
- Retourne le JSON brut du pack archivé

#### 2. Indicateur dans `AccountingInsightBlock`

Optionnel Sprint 14 — si livré : après le `facts_hash` affiché dans l'encart insight, ajouter un badge discret "Archivé" si le pack est archivé (vérification par appel au proxy). Si non livré dans ce sprint, le badge sera ajouté en Sprint 15.

### Checkpoint

- [ ] Route proxy fonctionnelle : `GET /api/accounting/facts-pack/:hash?tenant=X`
- [ ] Retourne le pack JSON si trouvé, 404 sinon
- [ ] 400 si `tenant` absent
- [ ] 502 si Vault indisponible
- [ ] 409 transparent si sources multiples
- [ ] Timeout 5 s
- [ ] Build Linky OK

### Fichiers concernés

- `units/dorevia-linky/app/api/accounting/facts-pack/[hash]/route.ts` — **NOUVEAU**
- `units/dorevia-linky/components/AccountingInsightBlock.tsx` — badge optionnel

---

## T83 — Non-régression + doc Sprint 14

**Objectif :** valider l'intégralité du sprint, vérifier la non-régression, mettre à jour la documentation.

### Prérequis

- T78–T82 livrés

### Travaux attendus

#### 1. Builds

- [ ] Build Vault : `go build ./...` dans `sources/vault` → OK
- [ ] Build Diva : `go build ./...` dans `units/diva` → OK
- [ ] Build Linky : `npx next build` dans `units/dorevia-linky` → OK

#### 2. Gates bloquantes (release)

Ces points **doivent** être validés avant de considérer le sprint livré :

- [ ] Builds Vault + Diva + Linky OK (§1)
- [ ] Segmented control visible dans le header desktop et mobile
- [ ] Bascule Pilotage ↔ Synthèse : URL `?view=` mise à jour, navigation arrière cohérente
- [ ] Tab bar standalone supprimée
- [ ] DOCX v2 ouvrable dans Word / LibreOffice
- [ ] `template_version = "2.0"` dans le document et headers HTTP
- [ ] Table `facts_pack_archive` créée avec index
- [ ] Archivage automatique après insight (`source=insight`) et report (`source=report`)
- [ ] Échec d'archivage : ne bloque pas la réponse (fire-and-forget)
- [ ] `GET /api/accounting/facts-pack/:hash?tenant=X&source=insight` fonctionnel
- [ ] Proxy Linky fonctionnel (y compris 400/404/409/502)

#### 3. Gates qualité (améliorable post-sprint si nécessaire)

- [ ] Rendu DOCX élégant (page de titre, sommaire, comparatif)
- [ ] Fallback branding sobre si non configuré
- [ ] Sommaire numéroté sans rupture de séquence
- [ ] Sections conditionnelles : bilan omis si données absentes
- [ ] Comparatif enrichi : colonnes Écart + Variation % + flèche + cas `N-1=0` → `n/a`
- [ ] `kpiMode` masqué en Synthèse, restauré au retour Pilotage
- [ ] Mode chromeCompact : badge vue courante fonctionnel (toggle direct)
- [ ] Badge "Archivé" dans AccountingInsightBlock (optionnel)

#### 4. Scénario d'intégration transverse canonique

Ce scénario valide la chaîne complète Sprint 14. Il doit être exécuté au moins une fois avant clôture :

1. Naviguer vers Linky, vérifier le **segmented control** dans le header
2. Basculer Pilotage → Synthèse → Pilotage, vérifier URL et `kpiMode`
3. Générer un **insight comptable** (Synthèse → encart Diva)
4. Noter le `facts_hash` affiché
5. Vérifier côté Vault que le pack est archivé : `GET /api/accounting/facts-pack/:hash?tenant=X&source=insight` → 200
6. Générer un **rapport DOCX** (bouton Télécharger le rapport)
7. Vérifier que le DOCX s'ouvre, que la page de titre et le sommaire sont corrects
8. Vérifier côté Vault que le **même `facts_hash`** a maintenant **deux archives** : `source=insight` + `source=report`
9. Appeler `GET /api/accounting/facts-pack/:hash?tenant=X` **sans source** → doit retourner `409` avec `available_sources`
10. Consulter via **proxy Linky** : `GET /api/accounting/facts-pack/:hash?tenant=X&source=report` → 200

> **Note :** ce scénario suppose un même périmètre, une même période et un pack identique entre insight et report. Si le pack diffère (données fraîchies entre les deux appels), les `facts_hash` peuvent diverger et les étapes 8–9 doivent être adaptées.

#### 5. Non-régression

- [ ] Surface 4 blocs Synthèse inchangée
- [ ] Encart insight existant + bouton DOCX inchangés (+ upgrade v2)
- [ ] Comparatif N/N-1 dans les blocs Synthèse inchangé
- [ ] Multi-sociétés inchangé
- [ ] Drill rubrique → BG → GL inchangé
- [ ] Exports existants (CSV BG, GL, rubriques, balances tiers) inchangés
- [ ] Habilitations `/accounting/*` inchangées
- [ ] Navigation Pilotage / Synthèse fonctionnelle (maintenant via segmented control header)
- [ ] Calendrier comptable (Sprint 13) : indicateurs période toujours visibles
- [ ] Balances tiers V2+ : résiduel toujours calculé

#### 6. Documentation

- [ ] Rédiger `RAPPORT_SPRINT_14_LYNKI.md` v1.0, avec les rubriques suivantes :
  - Objectifs du sprint
  - Tickets livrés (T78–T83), avec écarts éventuels
  - Détails d'implémentation (§3) — chrome header, DOCX v2, historisation
  - Non-régression (§4) — tableau synthétique
  - Gates (§5) — statut final
  - Dette / report vers Sprint 15 (§6)
  - Après ce sprint (§7) — prochaines étapes
- [ ] Mettre à jour `BACKLOG_PHASE2_LYNKI.md` (T78–T83 livrés, Gates)
- [ ] Mettre à jour `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` (Sprint 14 livré)

### Fichiers concernés

- `ZeDocs/web57/RAPPORT_SPRINT_14_LYNKI.md` — **NOUVEAU**
- `ZeDocs/web57/BACKLOG_PHASE2_LYNKI.md` — mise à jour
- `ZeDocs/web57/ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` — mise à jour

---

## Vigilances spéciales (rappel plan v1.1 + corrections v1.1 tickets)

| Sujet | Point d'attention |
|-------|-------------------|
| **URL source de vérité** | `appView` dérive de `searchParams.get("view")`. Le callback s'appelle `onNavigateToAppView` — il fait `router.push`, pas de `useState` autonome. Navigation arrière native. |
| **Callback sémantique** | Nommer le callback "navigate", pas "set" ou "change". Ça protège l'invariant URL-only dans le code. |
| **Responsive 640–900 px** | Vérifier que la rangée segmented control ne compresse pas les filtres sur tablettes et petits laptops. |
| **Branding vs composition** | Le Sprint 14 livre un branding léger + composition conditionnelle. Pas de personnalisation métier avancée par tenant. |
| **Logo DOCX** | `LogoPath` déclaré dans `BrandingConfig` mais **non rendu** dans v2 (complexité OpenXML image). Préparation v3. |
| **Format monétaire DOCX** | Règles formalisées : `12 345,67`, signe explicite, `N-1=0` → `n/a`, flèches `▲`/`▼`. |
| **Numérotation dynamique** | Sommaire + Heading1 renumérotés après résolution des sections conditionnelles. Pas de trou. |
| **Archivage fire-and-forget** | Toujours via `ArchiveFactsPackAsync` — jamais de `go func()` dispersé. Log WARNING structuré si échec. |
| **GET FactsPack — filtre source** | Sans `?source=`, le GET retourne 409 si insight + report coexistent. Le proxy Linky propage le 409. |
| **Déduplication source** | Un même `facts_hash` peut avoir 2 archives (insight + report). La contrainte UNIQUE inclut `source`. |
| **Index facts_pack_archive** | Trois index dès le départ : PK, `(tenant, facts_hash)`, `(generated_at)`. La rétention (TTL 90j) viendra en Sprint 15. |

---

## Suite logique

1. **Rejouabilité v2** — re-génération d'insight/rapport depuis un pack archivé (lecture à date)
2. **Netting multi-devises** — résolution des groupes matching multi-devises dans les balances tiers
3. **Rapport DOCX v3** — logo embarqué, sections métier configurables, export PDF
4. **Calendrier comptable v2** — clôtures intermédiaires, alertes délai, deadline ERP
5. **Rôles fins** — RAF / DAF / Consultant, feature flags tenant
6. **Rétention FactsPack** — TTL 90j, purge automatique, dashboards d'audit
