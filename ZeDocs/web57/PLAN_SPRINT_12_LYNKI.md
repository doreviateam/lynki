# Plan Sprint 12 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_12_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_11_LYNKI.md](RAPPORT_SPRINT_11_LYNKI.md) **v1.1** (consolidation multi-sociétés, comparatifs enrichis, schéma tiers V2 prêt)

**Sources :** [RAPPORT_SPRINT_11_LYNKI.md](RAPPORT_SPRINT_11_LYNKI.md) **v1.1** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v2.3** · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) **v2.4** · [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) **v2.2** (§4.3 bloc insights, §4.4 explicabilité, §5.3 rejouabilité) · [REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md) **v1.1** (§11–§12 balances tiers) · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) **v0.5** (§9 bloc insights) · **Exécution :** [EXECUTION_TICKETS_SPRINT_12_LYNKI.md](EXECUTION_TICKETS_SPRINT_12_LYNKI.md) **v1.0** · **Rapport :** `RAPPORT_SPRINT_12_LYNKI.md` *(à créer)*

---

## 1. Objectif du sprint

Le Sprint 11 a clos la **consolidation multi-sociétés V1** et préparé les **données tiers V2** dans le Vault (`date_maturity`, `full_reconcile_id`, `matching_number`).

Le Sprint 12 vise deux avancées majeures :

1. **Balances tiers V2** — rendre les balances âgées clients / fournisseurs plus comptablement fiables en utilisant l'échéance et le lettrage complet, au lieu d'une approximation purement fondée sur `line_date`.
2. **Insights comptables Diva v1** — introduire une première couche d'interprétation sur la Synthèse comptable, selon une approche **template-first, souveraineté locale first**, avec **Mistral interne** en reformulation optionnelle, sans dépendance à une IA externe.

Autrement dit :
- le Sprint 11 a rendu la Synthèse **complète et consolidée** ;
- le Sprint 12 doit la rendre **plus fiable sur les tiers** et **plus lisible pour un humain qui veut commenter la situation comptable**.

### Objectifs principaux

1. **Balances tiers V2** — clients et fournisseurs avec calcul d'ancienneté basé sur `date_maturity` si disponible, exclusion des lignes totalement lettrées (`full_reconcile_id`), limitation explicite sur les lettrages partiels.
2. **Diva comptable v1** — génération d'un **insight comptable** sur la Synthèse à partir des rubriques Bilan / CR, balances tiers et signaux de variation.
3. **Bloc insight Synthèse** — intégration UI d'un encart réduit, explicable et traçable, sans concurrencer le cockpit KPI.

### Objectifs secondaires

4. **Exports balances tiers V2** — CSV cohérents avec le nouveau périmètre et les nouvelles métadonnées.
5. **Observabilité / explicabilité** — payload de faits comptables journalisé côté Diva pour permettre l'audit du texte généré.
6. **Documentation** — ALIGNEMENT, BACKLOG, `RAPPORT_SPRINT_12_LYNKI.md`.

**Hors sprint sauf arbitrage :**

- IA externe pour Diva,
- netting tiers complet avec residual amount / appariement avancé,
- moteur d'explication libre multi-paragraphes,
- rejouabilité formelle complète,
- consolidation inter-sociétés retraitée.

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Lot 2 / données** | Balances tiers V2 — aged balances plus fiables |
| **Lot 2 / Diva** | Insight comptable v1 — template-first local-first |
| **Lot 2 / UI** | Bloc insight sur la Synthèse comptable |
| **Lot 3 (extension)** | Exports balances tiers V2 |
| **0 / transversal** | Non-régression, observabilité, doc |

---

## 3. Dépendances

```text
Sprint 11 livré
        │
        ├──> surface Synthèse complète
        ├──> multi-sociétés et comparatifs en place
        ├──> schéma tiers V2 prêt (date_maturity / full_reconcile_id / matching_number)
        │
        ▼
T66 — Vault : balances tiers V2 (maturity + lettrage complet)
        │
        ├──> T67 — Linky/UI : bloc balances tiers V2 + exports alignés
        │
        ▼
T68 — Diva : facts comptables v1 (payload structuré)
        │
        ├──> T69 — Diva : insight comptable v1 (template-first, Mistral local optionnel)
        │
        ▼
T70 — Linky/UI : encart insight Synthèse + refresh + traçabilité visible
        │
        ▼
T71 — Non-régression + doc + recette terrain
```

---

## 4. Tickets (Sprint 12)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T66** | **Vault — balances tiers V2** | Lot 2 données | Sprint 11 clos | todo |
| | Faire évoluer `aged-receivables` et `aged-payables` pour utiliser `date_maturity` si disponible, exclure les lignes avec `full_reconcile_id` non nul, conserver une transparence explicite sur les lettrages partiels encore imparfaits. `coverage` et `v2_limitations` doivent refléter le vrai périmètre. | | | |
| **T67** | **Linky / UI — balances tiers V2 + exports** | Lot 2 UI / Lot 3 | T66 | todo |
| | Mettre à jour les blocs balances tiers, badges, légendes, bannières de limites V2, routes export CSV, et exposer clairement si l'ancienneté est calculée sur `date_maturity` ou en fallback `line_date`. | | | |
| **T68** | **Diva — facts comptables v1** | Lot 2 Diva | Sprint 11 clos | todo |
| | Construire un `AccountingFactsPack` structuré à partir de la Synthèse : rubriques Bilan/CR N et N-1, variations majeures, balances tiers (top partenaires / tranches sensibles), périmètre tenant/sociétés/période, métadonnées référentiel. Journalisation et hash de contexte inclus. | | | |
| **T69** | **Diva — insight comptable v1** | Lot 2 Diva | T68 | todo |
| | Générer un insight comptable court, selon une approche **template-first** ; option de reformulation par **Mistral interne** uniquement si activée. Pas d'IA externe dans ce sprint. Sortie attendue : `headline`, `what_i_see`, `to_check`, `scope_note`, `generated_at`. | | | |
| **T70** | **Linky / UI — encart insight Synthèse** | Lot 2 UI | T69 | todo |
| | Intégrer un encart réduit sur la page Synthèse comptable (position sobre, non concurrente du cockpit 12 cards), avec état de fraîcheur, bouton de reformulation / refresh si disponible, et accès minimal à la trace (`facts_hash`, période, périmètre). | | | |
| **T71** | **Non-régression + doc + recette terrain** | transversal | T66–T70 | todo |
| | Contrôles balances tiers V2, non-régression Synthèse/BG/GL/exports, mise à jour `ALIGNEMENT`, `BACKLOG`, `RAPPORT_SPRINT_12`, et validation de la posture "local first" sur Diva. | | | |

---

## 5. Détail technique

### 5.1 Balances tiers V2 (T66)

#### Évolution de la règle d'ancienneté

Ordre de calcul :

1. utiliser `date_maturity` si présente ;
2. sinon fallback sur `line_date`.

**Formule d'âge :**

```text
age_days = as_of_date - COALESCE(date_maturity, line_date)
```

#### Lettrage complet

Les lignes avec `full_reconcile_id` non nul sont exclues du calcul V2.

#### Lettrage partiel

**Limitation Sprint 12 :**

* si `matching_number` existe mais pas de montant résiduel fiable, la ligne reste dans le périmètre avec transparence explicite ;
* pas de reconstitution complète du résiduel dans ce sprint.

#### Réponses API attendues

* `restitution_id = "lynki.accounting.aged_receivables"` ou `"lynki.accounting.aged_payables"`
* `coverage`
* `complete`
* `aging_basis = "date_maturity"` ou `"line_date_fallback"` ou `"mixed"`
* `v2_limitations`
* `as_of_date`
* `referentiel_version`

---

### 5.2 Insights comptables Diva v1 (T68 / T69)

#### Principe produit

Le Sprint 12 ne vise **pas** un assistant libre multi-usage.
Il vise un **encart comptable court, utile et explicable**.

#### Architecture cible

1. `AccountingFactsPack`

   * période
   * tenant
   * company_ids
   * rubriques Bilan / CR N
   * rubriques Bilan / CR N-1
   * principaux deltas
   * balances tiers V2 (agrégats et top alertes)
   * signaux de qualité / couverture
   * version référentiel
   * hash de contexte

2. `AccountingInsightEngine`

   * règles déterministes / template-first
   * détection de signaux simples :

     * hausse / baisse marquée
     * tension clients
     * dette fournisseurs concentrée
     * dégradation du résultat
     * amélioration de trésorerie / structure
   * sortie structurée

3. **Mistral interne** *(optionnel)*

   * reformulation du texte
   * jamais source de calcul
   * désactivable
   * si désactivé : sortie template brute

#### Sortie attendue

```json
{
  "headline": "...",
  "what_i_see": "...",
  "to_check": "...",
  "scope_note": "...",
  "facts_hash": "...",
  "generated_at": "..."
}
```

#### Règle non négociable

Le texte doit rester **adossé aux faits**.
Aucune génération ne doit masquer l'absence de données ou une couverture partielle.

---

### 5.3 UI Synthèse — bloc insight (T70)

#### Placement

Bloc discret dans la Synthèse comptable, sans concurrencer :

* ni le cockpit 12 cards,
* ni les blocs Bilan / CR / Balances tiers / BG.

#### Contenu minimal

* `headline`
* `what_i_see`
* `to_check`
* fraîcheur
* périmètre
* bouton refresh / reformulation si exposé
* référence de trace (`facts_hash` ou équivalent lisible)

#### États

* chargement
* non disponible
* partiel
* erreur
* disponible

#### Ton produit

Sobre, utile, contrôlé.
Pas de "storytelling IA" inutile.

---

### 5.4 Exports balances tiers V2 (T67)

Les exports CSV doivent refléter V2 :

| Colonne | Description |
|---------|-------------|
| `partner_id` | identifiant partenaire |
| `partner_name` | libellé |
| `not_due` | non échu |
| `range_0_30` | 0–30 jours |
| `range_31_60` | 31–60 jours |
| `range_61_90` | 61–90 jours |
| `range_91_180` | 91–180 jours |
| `range_over_180` | >180 jours |
| `total` | total |
| `aging_basis` | `date_maturity` / fallback |
| `as_of_date` | date d'observation |
| `tenant` | tenant |
| `referentiel_version` | version |
| `coverage` | périmètre |
| `generated_at` | horodatage |

---

## 6. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T66** | Balances tiers utilisent `date_maturity` si disponible ; lignes totalement lettrées exclues ; `v2_limitations` explicite ; build Vault OK |
| **T67** | Bloc balances tiers V2 visible ; exports CSV alignés ; badges et légendes cohérents ; pas de régression V1/V2 silencieuse |
| **T68** | `AccountingFactsPack` structuré produit ; hash de contexte disponible ; journalisation minimale en place |
| **T69** | Insight comptable v1 généré sans IA externe ; sortie structurée stable ; option Mistral local documentée |
| **T70** | Encart insight visible dans la Synthèse ; fraîcheur et périmètre affichés ; refresh / reformulation si disponible |
| **T71** | Non-régression documentée ; `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` + `BACKLOG_PHASE2_LYNKI.md` + `RAPPORT_SPRINT_12_LYNKI.md` synchronisés |

---

## 7. Recette — contrôles Sprint 12

### 7.1 Balances tiers V2 (T66 / T67)

| Contrôle | Attendu |
|----------|---------|
| `date_maturity` présente | ancienneté calculée sur échéance |
| `date_maturity` absente | fallback `line_date` explicite |
| `full_reconcile_id` non nul | ligne exclue |
| `matching_number` sans résiduel | ligne gardée avec limite documentée |
| Export CSV | colonnes V2 présentes |

### 7.2 Insights comptables Diva (T68 / T69 / T70)

| Contrôle | Attendu |
|----------|---------|
| Facts pack | période, périmètre, deltas, tiers présents |
| Insight | `headline`, `what_i_see`, `to_check` présents |
| IA externe | non utilisée |
| Mistral interne désactivé | sortie template toujours disponible |
| Trace | `facts_hash` visible ou journalisé |

### 7.3 Non-régression (T71)

| Contrôle | Attendu |
|----------|---------|
| Surface 4 blocs Synthèse | inchangée |
| Comparatif N/N-1 | inchangé |
| Multi-sociétés | inchangé |
| Drill rubrique → BG → GL | inchangé |
| Exports existants | inchangés |
| Habilitations `/accounting/*` | inchangées |

---

## 8. Risques

| Risque | Mitigation |
|--------|------------|
| Lettrage partiel insuffisamment modélisé | Assumer V2 comme amélioration, pas comme netting complet ; documenter la limite |
| Insight Diva trop "magique" | Template-first obligatoire ; Mistral local seulement en reformulation |
| Bloc insight trop envahissant | Encart réduit, ton sobre, position secondaire |
| Divergence entre faits et texte | `AccountingFactsPack` canonique + `facts_hash` |
| Débordement vers IA externe | Hors sprint, explicitement exclu |

---

## 9. Sortie attendue (fin de sprint)

* **balances tiers V2** plus fiables
* **exports tiers V2** alignés
* **insight comptable Diva v1** en local-first
* **encart insight** visible sur la Synthèse
* **`RAPPORT_SPRINT_12_LYNKI.md`** rédigé

---

## 10. Gates — cible fin Sprint 12

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | close — inchangée |
| **Gate C** | close — consolidée par fiabilisation tiers et lecture interprétée |
| **Gate D** | substantiellement renforcée — données V2 + première couche d'insight comptable |

---

## 11. Après ce sprint

Suite logique :

1. **Balances tiers V2+** avec meilleure prise en compte du résiduel / lettrage partiel
2. **Insights comptables Diva** plus riches, toujours local-first
3. Premiers travaux de **rapport structuré** généré à partir du FactsPack
4. **Consolidation avancée** si besoin métier
5. Premiers jalons de **rejouabilité formelle**
