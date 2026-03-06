# Avis d'expert — SPEC AR by Partner v1.0 / v1.0.1

**Document :** Avis d'expert sur SPEC_Vault_UI_Aggregations_AR_by_Partner  
**Référence :** v1.0 (ZeDocs/web28/SPEC_Vault_UI_Aggregations_AR_by_Partner_v1.0.md)  
**Mise à jour :** v1.0.2 (SPEC) ; Plan v1.2 ; CR MOA Sprint 1 (2026-02-22)  
**Plan d'implémentation :** ZeDocs/web28/PLAN_IMPLEMENTATION_AR_BY_PARTNER_SCRUM.md  
**Compte rendu (S1–S3) :** ZeDocs/web28/COMPTE_RENDU_AR_BY_PARTNER_Sprint1_2026-02-22.md  
**Date :** 2026-02-22  
**Type :** Revue technique, amendements, questions ouvertes, conséquences infrastructure

---

## 1. Synthèse exécutive

La spécification AR by Partner est **pertinente** et alignée sur le pattern existant (sales-by-partner). Son implémentation nécessite toutefois des **évolutions significatives** du pipeline de données (DVIG → Vault), car les champs critiques `amount_residual` et `invoice_date_due` **ne sont pas aujourd'hui persistés** dans le Vault.

**Verdict :** Faisable en P0 sous réserve de mettre en place la chaîne complète d’enrichissement des données. Estimation d’effort : ~3–5 jours développeur (Vault + DVIG + Linky).

---

## 1bis. Mise à jour v1.0.1 (2026-02-22)

La v1.0.1 intègre la majorité des amendements et réponses aux questions ouvertes :

| Avis §2 / §3 | Statut v1.0.1 |
|--------------|---------------|
| **2.1** Conventions date_debut/date_fin | ✅ Paramètres officiels ; alias date_from/date_to avec warning |
| **2.2** Formule share_percent | ✅ Formalisée ; dénominateur=0 → 0 |
| **2.4** Default dates | ✅ 12 mois glissants (today - 365 → today) |
| **2.5** partner_key / partner_name | ✅ partner_id fallback ajouté |
| **2.3** data_quality | ✅ Conservé dans meta ; critères à préciser (optionnel) |
| **Q2** Mise à jour amount_residual | ✅ **Annexe A** : événement `invoice.residual.changed` |

**Nouvelles précisions v1.0.1 :**

- `totals.missing_due_date_count` : factures ouvertes sans `invoice_date_due`
- `meta.freshness` : `event_driven` | `snapshot` | `unknown`
- Index : ajout `(tenant, company_id, partner_id)`
- Devise P0 : montants en devise tenant

**Reste à préciser (implémentation) :**

- Émetteur de `invoice.residual.changed` (connecteur Odoo, webhook, autre)
- Déclencheur exact (paiement partiel, réconciliation, avoir…)
- Route Vault pour réception de l’événement

---

## 1ter. Préconisations v1.1 (2026-02-22)

| # | Préconisation | Statut |
|---|---------------|--------|
| **1** | Ne jamais sortir un AR mensonger. P0 inclut squelette residual avant UI. Snapshot OK si meta.freshness=snapshot + warning UI. | Plan réordonné |
| **2** | Réordonner : Données → Route residual → Agrégation → Linky + DIVA. | Plan v1.1 |
| **3** | Contrat documents : projection déterministe ; economic_events = source d'historique. | Spec Annexe B |
| **4** | Garde-fou ordre : last_residual_event_at ; si changed_at plus ancien → ignore. | Spec Annexe A |
| **5** | P0 EUR only. Facture non-EUR : meta.warnings + exclusion. | Spec §2.3 |
| **6** | group by partner_id P0 ; partner_key dérivé ; partner_name = affichage. | Spec §3 |
| **7** | P0 DIVA minimal : totals + top 5 ; 1 insight max. Règle 12 prompt → P1. | Plan S4.2 |
| **8** | DoD double : technique + produit (warnings UI). | Plan §1 |
| **9** | Émetteur : P0-A Odoo ; P0-B snapshot. Ne pas mélanger. | Plan S2.5 |

---

## 2. Amendements proposés (v1.0 — partiellement intégrés en v1.0.1)

### 2.1 Conventions de nommage (cohérence Vault) — ✅ v1.0.1

| Champ spec actuel | Amendement | Justification |
|------------------|------------|---------------|
| `date_from` / `date_to` | **Option A** : Conserver et documenter l’écart. **Option B** : Aligner sur `date_debut` / `date_fin` (usage sales-by-partner, treasury, etc.) | L’existant Vault utilise `date_debut` / `date_fin`. L’unification réduit les erreurs côté consumers (Linky, DIVA). |

**Recommandation :** Option B — **intégré en v1.0.1** (paramètres officiels date_debut/date_fin).

---

### 2.2 Schéma `share_percent` — ✅ v1.0.1

**Amendement :** Formaliser la formule de calcul.

```
share_percent = (partner.open_amount / totals.open_amount) * 100
```
Si `overdue=true` :
```
share_percent = (partner.overdue_amount / totals.overdue_amount) * 100
```

Préciser le comportement lorsque `totals.open_amount == 0` (ou `totals.overdue_amount == 0`) : retourner `0` ou `null`.  
**→ v1.0.1** : dénominateur = 0 → share_percent = 0.

---

### 2.3 Schéma `data_quality` — ✅ v1.0.1

**Amendement :** Définir les critères des niveaux.

| Niveau | Critères proposés |
|--------|--------------------|
| `high` | ≥ 95 % des partenaires avec `partner_name` non null |
| `medium` | 50–95 % avec `partner_name` |
| `low` | &lt; 50 % avec `partner_name` ou données partielles |

---

### 2.4 Comportement par défaut `date_from` / `date_to` — ✅ v1.0.1

**Amendement :** Remplacer « toute la période disponible » par une règle explicite.

Proposition : si absents, utiliser l’**exercice fiscal courant** du tenant (ex. `2026-01-01` → `2026-12-31` si exercice calendrier), ou une fenêtre glissante (ex. 12 derniers mois). Documenter la source de la règle (config tenant, paramètre, etc.).  
**→ v1.0.1** : default 12 mois glissants (today - 365 → today).

---

### 2.5 `partner_key` vs `partner_name` — ✅ v1.0.1

**Amendement :** En P0, autoriser le groupement par `partner_name` si `partner_key` n’est pas disponible, avec un fallback.

- Si `partner_key` existe : l’utiliser comme identifiant stable.
- Sinon : `partner_key` peut être dérivé (ex. `partner:odoo:res.partner:{partner_id}`) ou laisser null avec groupement par `partner_name` uniquement.

Actuellement, le Vault et sales-by-partner utilisent `partner_name` pour le regroupement. La spec introduit `partner_key` sans garantir sa présence partout.  
**→ v1.0.1** : partner_id fallback ajouté.

---

## 3. Questions ouvertes

### Q1. Source des champs `amount_residual` et `invoice_date_due`

Où ces champs sont-ils aujourd’hui exposés ?

- **Odoo** : `account.move.amount_residual`, `account.move.invoice_date_due` existent.
- **DVIG** : Le format `format_vault_payload_invoices` **ne les envoie pas** actuellement (cf. `outbox_worker.py`).
- **Vault** : La table `documents` **ne stocke pas** ces colonnes.

**Question :** Le connecteur Odoo → DVIG émet-il déjà ces champs dans `invoice.posted` ? Si non, quel est le plan pour les ajouter ?

---

### Q2. Mise à jour de `amount_residual` (événements de règlement)

L’encours d’une facture change lors des paiements. Actuellement :

- `invoice.posted` est émis à la validation de la facture.
- Les paiements partiels ne semblent pas déclencher de nouveau `invoice.posted` ou d’événement dédié.

**Question :** Comment obtenir un `amount_residual` à jour ? Options possibles :

1. Événement `invoice.updated` ou `invoice.payment.received` côté DVIG.
2. Polling Odoo par le Vault (hors scope actuel).
3. Accepter un encours figé au dernier `invoice.posted` (limitation documentée).

**→ v1.0.1** : **Annexe A** — événement `invoice.residual.changed` définit le flux de mise à jour. Reste à implémenter : émetteur (Odoo/DVIG), déclencheur, route Vault.

---

### Q3. Table cible : `documents` vs `economic_events`

La spec suggère une « table de projection invoices ».

- **`documents`** : utilisée par sales-by-partner, contient les factures avec `invoice_date`, `total_ht`, `partner_name`. **Manque** `amount_residual`, `invoice_date_due`, `partner_key`.
- **`economic_events`** : contient `payload_json` (invoice + payment) mais structure différente et pas de projection dédiée « invoices ».

**Question :** Faut-il :

- A) Étendre `documents` avec `amount_residual`, `invoice_date_due`, `partner_key` ?
- B) Créer une vue/projection dédiée sur `economic_events` ?
- C) Créer une table `invoice_snapshots` ?

**Recommandation :** Option A (extension de `documents`) pour rester aligné avec sales-by-partner et limiter la complexité.

---

### Q4. Devise et `amount_residual`

Dans un contexte multi-devises, `amount_residual` peut être dans la devise de la facture. La spec indique une tolérance en « devise de la facture ».

**Question :** Les totaux (`totals.open_amount`, etc.) doivent-ils être convertis en devise du tenant (ex. EUR) ou rester en devise source par facture ? Clarifier le comportement multi-devises pour P0.

---

## 4. Conséquences sur l’infrastructure

### 4.1 DVIG (Odoo → Vault)

| Composant | Impact | Action |
|-----------|--------|--------|
| **Connecteur Odoo** | Exposer `amount_residual`, `invoice_date_due`, `partner_id` dans l’event `invoice.posted` | Vérifier/modifier le connecteur Odoo |
| **Outbox worker** | Enrichir `format_vault_payload_invoices` avec ces champs | Ajouter `amount_residual`, `invoice_date_due`, `partner_id` dans `meta` |
| **Routage** | Inchangé (`invoice.posted` → POST /api/v1/invoices) | — |

---

### 4.2 Vault

| Composant | Impact | Action |
|-----------|--------|--------|
| **Migration BDD** | Nouvelles colonnes sur `documents` | Migration : `amount_residual`, `invoice_date_due`, `partner_key` (ou dérivé de `partner_id`) |
| **Modèle `Document`** | Nouveaux champs | `AmountResidual`, `InvoiceDateDue`, `PartnerKey` (ou `PartnerID`) |
| **InvoicesHandler** | Persister les nouveaux champs | Extraire et stocker depuis `payload.Meta` |
| **Storage** | Nouvelle agrégation | `aggregations_ar_by_partner.go` (pattern proche de sales-by-partner) |
| **Handlers** | Nouveau handler | `aggregations_ar_by_partner.go` |
| **Routes** | Nouvelle route | `GET /ui/aggregations/ar-by-partner` dans `replay.go` |
| **Index** | Performance | Index sur `(tenant, company_id, invoice_date_due)`, `(tenant, company_id, amount_residual)` |

---

### 4.3 Linky

| Composant | Impact | Action |
|-----------|--------|--------|
| **API** | Nouvelle route proxy | `GET /api/ar-by-partner` |
| **Business card** | Nouveaux tableaux | Section « Encours clients » et « Clients à risque » (overdue) |
| **Types** | Nouveaux types TS | `ArByPartnerResponse`, `ArByPartnerItem` |

---

### 4.4 DIVA (P0 minimal — préconisation 7)

| Composant | P0 | P1 |
|-----------|-----|-----|
| **dashboard-metrics** | ar_by_partner.totals + top 5 overdue partners | — |
| **hash_input** | Résumé stable (totals + top keys/amounts) pour invalidation | — |
| **computeInsights** | **1 insight max** : concentration du risque + montant en retard + plus gros retard | — |
| **Prompt Mistral (règle 12)** | — | P1 |

Risque CFO = dire trop et se tromper. P0 factuel, sobre.

---

### 4.5 Tableau récapitulatif des changements

```
┌─────────────────┬────────────────────────────────────────────────────────────┐
│ Couche          │ Changements                                                │
├─────────────────┼────────────────────────────────────────────────────────────┤
│ Odoo connector  │ Émettre amount_residual, invoice_date_due, partner_id      │
│ DVIG outbox     │ format_vault_payload_invoices : meta enrichi               │
│ Vault migration │ documents + amount_residual, invoice_date_due, partner_key  │
│ Vault Invoices  │ Extraire et persister les nouveaux champs                  │
│ Vault storage   │ aggregations_ar_by_partner.go (nouvelle agrégation)         │
│ Vault routes    │ GET /ui/aggregations/ar-by-partner                         │
│ Linky API       │ GET /api/ar-by-partner (proxy)                             │
│ Linky UI        │ Tableaux Encours / Retards dans la card Business           │
│ Linky dashboard │ Appel ar-by-partner ; _details.business.ar_by_partner       │
│ DIVA            │ 1 insight AR ; hash_input ar_aggregates (règle 12 → P1)         │
└─────────────────┴────────────────────────────────────────────────────────────┘
```

---

## 5. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| `amount_residual` obsolète (pas de mise à jour après paiement) | Réduite (v1.0.1) | Données trompeuses | **v1.0.1 Annexe A** : événement `invoice.residual.changed` ; implémentation à planifier |
| `partner_name` null sur factures anciennes | Élevée | UX dégradée | Fallback §6.2 de la spec ; backfill progressif (P1) |
| Performance sur gros volumes | Moyenne | P95 &gt; 300 ms | Index recommandés ; `limit`/`min_amount` ; monitoring |
| Données Odoo incomplètes (invoice_date_due null) | Moyenne | Factures exclues du retard | Traiter en `open` uniquement ; `data_quality: low` si fort taux de null |

---

## 6. Plan d’implémentation recommandé

### Phase 1 — Données (prérequis)

1. Vérifier le connecteur Odoo → DVIG : `amount_residual`, `invoice_date_due`, `partner_id` dans `invoice.posted`.
2. Adapter `format_vault_payload_invoices` pour inclure ces champs.
3. Migration Vault : colonnes `amount_residual`, `invoice_date_due`, `partner_id`, `last_residual_event_at` sur `documents`.
4. Adapter `InvoicesHandler` pour les persister.

### Phase 2 — Route residual + idempotence (avant agrégation)

5. Créer route `POST /api/v1/invoices/residual`. Idempotence + garde-fou ordre.
6. Émetteur Odoo/DVIG (Sprint 2.5) si dispo ; sinon fallback snapshot assumé.

### Phase 3 — Agrégation Vault (données vivantes)

7. Implémenter `aggregations_ar_by_partner.go`. Route `GET /ui/aggregations/ar-by-partner`. Tests invariants.

### Phase 4 — Linky + DIVA (P0 minimal)

8. Route proxy. Tableaux Encours / Clients à risque. Warnings UI (snapshot ; échéances manquantes).
9. DIVA : totals + top 5 overdue ; 1 insight max ; hash_input ar_aggregates.



### Phase 5 — Optionnel (P1)

10. Backfill `partner_name`. Règle 12 prompt Mistral. Enrichissements DIVA.

*Plan détaillé : PLAN_IMPLEMENTATION_AR_BY_PARTNER_SCRUM.md v1.2*

---

## 6bis. Avancement implémentation (2026-02-22)

**Sprints 1–3 :** Livrés. Compte rendu transmis à la MOA : `COMPTE_RENDU_AR_BY_PARTNER_Sprint1_2026-02-22.md`.  
En attente validation MOA et exécution migrations pour lancer Sprint 4 (Linky + DIVA).

---

## 7. Conclusion

La spec AR by Partner est **solide et alignée** avec l’architecture actuelle. Les **préconisations v1.1** renforcent :

1. **Confiance CFO** : événement residual avant UI ; jamais d'AR mensonger.
2. **Contrat** : `documents` = projection courante ; `economic_events` = source d'historique.
3. **P0 minimal** : DIVA factuel, 1 insight, warnings UI, pas de sur-interprétation.

En suivant le plan v1.1, l’implémentation reste maîtrisable et cohérente avec le reste de la plateforme.
