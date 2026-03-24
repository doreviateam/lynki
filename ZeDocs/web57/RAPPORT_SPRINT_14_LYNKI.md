# Rapport de Sprint 14 — Lynki

**Fichier canonique :** `RAPPORT_SPRINT_14_LYNKI.md`  
**Version :** 1.3 — mars 2026  
**Révision 1.2 :** lien vers [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) en §7 (après ce sprint).  
**Révision 1.3 :** lien [PLAN_SPRINT_15_LYNKI.md](PLAN_SPRINT_15_LYNKI.md) en §7 (v1.2).  
**Plan :** [PLAN_SPRINT_14_LYNKI.md](PLAN_SPRINT_14_LYNKI.md) v1.1  
**Tickets :** [EXECUTION_TICKETS_SPRINT_14_LYNKI.md](EXECUTION_TICKETS_SPRINT_14_LYNKI.md) v1.1  
**Sprint précédent :** [RAPPORT_SPRINT_13_LYNKI.md](RAPPORT_SPRINT_13_LYNKI.md) v1.1

---

## 1. Résumé exécutif

Le Sprint 14 transforme Lynki en produit **plus explicite à l'écran, plus présentable sur document, et plus traçable dans son moteur d'interprétation**.

Trois axes livrés :

1. **Chrome header conforme wireframes BF** — le segmented control Pilotage / Synthèse est désormais intégré au header, visible en permanence, avec l'URL comme source de vérité.
2. **Rapport DOCX v2** — page de titre structurée, branding tenant, sommaire numéroté, sections conditionnelles, comparatif N/N-1 enrichi (écart + variation + flèches).
3. **Historisation FactsPack** — chaque insight et chaque rapport archive le pack de faits dans Vault, posant la brique de rejouabilité et d'audit.

**6 tickets livrés (T78–T83)**, tous builds propres (Vault, Diva, Linky).

---

## 2. Tickets livrés

| # | Titre | Statut |
|---|-------|--------|
| T78 | Chrome header — segmented control Pilotage / Synthèse | ✅ Livré |
| T79 | Rapport DOCX v2 — branding tenant + sections conditionnelles + comparatif enrichi | ✅ Livré |
| T80 | Vault — migration + handlers archive FactsPack | ✅ Livré |
| T81 | Diva — archivage FactsPack après insight et report | ✅ Livré |
| T82 | Linky — proxy consultation archive FactsPack | ✅ Livré |
| T83 | Non-régression + doc Sprint 14 | ✅ Livré |

---

## 3. Détails par axe

### 3.1 Chrome header — segmented control (T78)

**Invariant d'architecture :** l'URL est la source unique de vérité de `appView`. Le callback s'appelle `onNavigateToAppView` et effectue un `router.push` — pas d'état React autonome.

**Changements UI :**

- La tab bar standalone entre le header et le `<main>` est supprimée
- Un **segmented control** est intégré dans le header sur une rangée dédiée (rangée 2, entre identité et filtres)
- Desktop (`sm+`) : boutons "Pilotage" / "Synthèse comptable" centrés, fond accent pour l'actif
- Mobile (`< sm`) : même segmented control avec padding réduit
- `chromeCompact` : badge cliquable qui alterne directement vers l'autre vue, aucun menu intermédiaire
- Accessibilité : `role="tablist"`, `aria-label="Vue de l'application"`, `aria-selected`, clavier (Tab, Enter, Space), focus visible
- `max-height` header étendu : `140px` (au lieu de `110px`)

**Navigation :** au clic, l'URL `?view=` est mise à jour, l'écran bascule. La navigation arrière navigateur fonctionne nativement. `kpiMode` reste masqué en Synthèse, restauré au retour Pilotage.

### 3.2 Rapport DOCX v2 (T79)

**`template_version = "2.0"`** — montée en gamme du document de "sortie technique" à "livrable présentable".

| Aspect | v1 (Sprint 13) | v2 (Sprint 14) |
|--------|----------------|----------------|
| Branding | Fallback "Dorevia Lynki" | Config tenant : nom société, baseline, couleur titre |
| Page de titre | Texte sobre | Bloc structuré centré (table OpenXML sans bordures) |
| Sommaire | Absent | Numéroté dynamiquement (sections effectivement présentes) |
| Sections | Toutes présentes | Conditionnelles : bilan omis si absent, pas de tableau vide |
| Comparatif | Colonne variation % simple | 5 colonnes : N, N-1, Écart (signé), Variation % + flèche ▲/▼ |
| Cas N-1 = 0 | Division par zéro possible | `n/a` |
| Logo | Absent | `LogoPath` déclaré (non rendu v2 — préparation v3) |

**Règles de format documentaire :** montants `12 345,67` (espace insécable), écart avec signe explicite, variation `+12,5 % ▲` ou `-8,3 % ▼`, stable `0,0 %` sans flèche.

**Numérotation dynamique :** sommaire et Heading1 renumérotés après résolution des sections conditionnelles. Aucune rupture de séquence.

**Branding depuis le payload :** le handler accepte un `branding` optionnel dans le JSON. Si absent, fallback sobre "Dorevia Lynki".

### 3.3 Historisation FactsPack (T80 + T81 + T82)

**Vault (T80) :**

- Migration `051_facts_pack_archive.sql` — table avec `UNIQUE (tenant, facts_hash, source)`, index `(tenant, facts_hash)` et `(generated_at)`
- `POST /api/accounting/facts-pack/archive` — validation handler complète (tenant, facts_hash, pack_json JSON valide, source ∈ {insight, report}), upsert idempotent
- `GET /api/accounting/facts-pack/:hash` — filtre `source` optionnel, résolution : source fournie → retourne l'archive ; source absente + 1 archive → retourne ; source absente + 2 archives → `409 AMBIGUOUS_SOURCE` avec `available_sources`

**Diva (T81) :**

- Nouveau package `archive` avec `ArchiveFactsPackAsync` — goroutine fire-and-forget, recover panic, log structuré succès/échec
- Intégré dans le handler `accounting-insight` (source = "insight") et le handler `accounting-report` (source = "report")
- `VAULT_URL` vide → archivage non tenté, avec log `facts_pack_archive_skipped`

**Linky (T82) :**

- Route proxy `GET /api/accounting/facts-pack/[hash]?tenant=X&source=Y`
- Validation `tenant` (400 si absent)
- Gestion d'erreurs : 404, 409 transparent, 502 si Vault indisponible, timeout 5 s

**Règle de coexistence :** un même `facts_hash` peut avoir deux archives distinctes (insight + report). La contrainte d'unicité inclut `source`.

**Scénario transverse canonique Sprint 14 :** insight → archivage Vault (source=insight) → génération DOCX → seconde archive (source=report) → consultation directe et via proxy Linky — exécuté avec succès.

---

## 4. Non-régression

| Périmètre | Statut |
|-----------|--------|
| Surface 4 blocs Synthèse | ✅ Inchangé |
| Encart insight + bouton DOCX (upgrade v2) | ✅ OK |
| Comparatif N/N-1 dans les blocs Synthèse | ✅ Inchangé |
| Multi-sociétés additive | ✅ Inchangé |
| Drill rubrique → BG → GL | ✅ Inchangé |
| Exports CSV (BG, GL, rubriques, balances tiers) | ✅ Inchangé |
| Habilitations `/accounting/*` | ✅ Inchangé |
| Navigation Pilotage / Synthèse | ✅ Conforme (segmented control header) |
| Calendrier comptable (Sprint 13) | ✅ Indicateurs toujours visibles |
| Balances tiers V2+ (Sprint 13) | ✅ Résiduel toujours calculé |
| Build Vault | ✅ `go build ./...` OK |
| Build Diva | ✅ `go build ./...` OK |
| Build Linky | ✅ `next build` OK (`tsc --noEmit` également vérifié) |

---

## 5. Gates — cible fin Sprint 14

| Gate | Statut | Périmètre |
|------|--------|-----------|
| **Gate A** | ✅ Close — inchangé | intégrité vaulting, trace scellée |
| **Gate B** | ✅ Close — inchangé | rejouabilité ERP, backfill |
| **Gate C** | ✅ Close — inchangé | surface Synthèse complète, consolidation multi-sociétés |
| **Gate D** | ✅ **Close (périmètre Sprint 14)** — chrome produit aligné, rapport documentaire v2 livrable, historisation FactsPack opérationnelle |

---

## 6. Dette / report vers Sprint 15

- **Logo DOCX** : `LogoPath` déclaré mais non rendu (complexité OpenXML image) — Sprint 15 ou v3
- **Badge "Archivé"** dans AccountingInsightBlock : optionnel, non livré dans ce sprint
- **Rétention FactsPack** : pas de TTL / purge automatique — prévu Sprint 15 (90j)
- **Rejouabilité v2** : re-génération depuis un pack archivé — pas encore implémentée

---

## 7. Après ce sprint

- **Plan Sprint 15** — [PLAN_SPRINT_15_LYNKI.md](PLAN_SPRINT_15_LYNKI.md) v1.2 (référence métier : [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) v0.2)
- **Rejouabilité v2** — re-génération d'insight/rapport depuis un pack archivé (lecture à date)
- **Contrat métier Synthèse comptable V1** — document canonique : [CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md](CONTRAT_METIER_SYNTHESE_COMPTABLE_V1_LYNKI.md) (v0.1) — blocs Bilan / CR / Tiers / BG + **bloc confiance / rapprochement bancaire** obligatoire V1 ; atelier MOA pour figer définitions (§4.1)
- **Netting multi-devises** — résolution des groupes matching multi-devises dans les balances tiers
- **Rapport DOCX v3** — logo embarqué, sections métier configurables, export PDF
- **Rétention FactsPack** — TTL 90j, purge automatique, dashboards d'audit

---

*Fin du rapport Sprint 14.*
