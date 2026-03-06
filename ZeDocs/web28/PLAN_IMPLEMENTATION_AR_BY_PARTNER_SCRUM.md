# Plan d'implémentation Scrum — AR by Partner (Encours & Retard) v1.0.1

**Version :** 1.3  
**Date :** 2026-02-22 (Sprint 4 : 2026-02-21)  
**Référence :** `SPEC_Vault_UI_Aggregations_AR_by_Partner_v1.0.1.md`, `AVIS_EXPERT_AR_BY_PARTNER_v1.0.md`  
**Compte rendu (S1–S4) :** `COMPTE_RENDU_AR_BY_PARTNER_Sprint1_2026-02-22.md`  
**Durée estimée :** 4 sprints (4–7 jours développeur)  
**Stack :** DVIG (Python), Vault (Go), Linky (Next.js / React)

---

## 0. Préconisations (règle d'or)

**Ne jamais sortir un AR mensonger.** Si `amount_residual` n'est pas maintenu, ce n'est pas un AR, c'est un « reste à payer au moment de l'émission ».  
→ P0 inclut le squelette `invoice.residual.changed` **avant** d'exposer l'AR dans Linky/DIVA.

**Séquence P0 recommandée :** Données → Événement residual (route + idempotence) → Agrégation → UI + DIVA.

---

## 1. Vue d'ensemble

| Sprint | Périmètre | Estimation | Livrable | Statut |
|--------|-----------|------------|----------|--------|
| **Sprint 1** | Données (DVIG + Vault) | 1,5–2 j | `amount_residual`, `invoice_date_due`, `partner_id` dans documents | ✅ (CR MOA 2026-02-22) |
| **Sprint 2** | Route residual + idempotence | 1–1,5 j | POST /api/v1/invoices/residual, update documents, garde-fou ordre | ✅ |
| **Sprint 2.5** | Émetteur (si dispo) | 0,5–1 j | Odoo/DVIG émet `invoice.residual.changed` ; sinon fallback snapshot assumé | ⬜ |
| **Sprint 3** | Agrégation Vault | 1 j | `GET /ui/aggregations/ar-by-partner` sur données « vivantes » | ✅ |
| **Sprint 4** | Linky + DIVA (P0 minimal) | 1–1,5 j | Proxy, tableaux, warnings UI, 1 insight DIVA | ✅ (2026-02-21) |

**Total :** 4,5–7 jours.

**DoD technique :** migrations ok, tests invariants ok, perf P95 acceptable (dataset TPE).  
**DoD produit :** si `freshness != "event_driven"` → Linky affiche « donnée snapshot » ; si `missing_due_date_count` élevé → warning discret « échéances manquantes » ; si `totals.open_amount == 0` → **ne pas afficher** la section « Clients à risque » (éviter tableaux vides anxiogènes).

---

## 2. Sprint 1 — Données (prérequis)

**Objectif :** Faire transiter `amount_residual`, `invoice_date_due`, `partner_id` de Odoo → DVIG → Vault et les persister dans `documents`.

| Tâche | Action |
|-------|--------|
| S1.1 | Vérifier connecteur Odoo → DVIG : amount_residual, invoice_date_due, partner_id dans invoice.posted |
| S1.2 | Enrichir format_vault_payload_invoices (meta) avec ces champs |
| S1.3 | Migration documents : amount_residual, invoice_date_due, partner_id + index + last_residual_event_at |
| S1.4 | InvoicesHandler : extraire et persister depuis payload.Meta |

### S1.3 Migration — colonne `last_residual_event_at` (préconisation 4)

Ajouter à la migration :
- `last_residual_event_at` (TIMESTAMPTZ, nullable) — pour garde-fou anti-régression d'ordre.

Règle : à réception de `invoice.residual.changed`, si `changed_at <= last_residual_event_at` → ignore (no-op). Protège contre arrivées asynchrones / replays.

---

## 3. Sprint 2 — Route residual + idempotence

**Objectif :** Créer la route Vault et la logique d'upsert **avant** l'agrégation. L'UI n'expose l'AR qu'une fois cette route en place (ou en mode snapshot assumé).

### S2.1 Route `POST /api/v1/invoices/residual`

**Estimation :** 0,5 j

**Tâches :**
- Créer route pour `invoice.residual.changed`.
- Valider payload (Annexe A) : tenant, company_id, source.id, invoice.amount_residual, invoice.invoice_date_due, partner.partner_id, change.changed_at, idempotency.event_id.
- Logique : UPSERT document (tenant + source.model + source.id).
- **Garde-fou ordre (préconisation 4) :** stocker `last_residual_event_at` ; si `changed_at <= last_residual_event_at` → no-op (ignorer).
- Idempotence : ignorer si `event_id` déjà traité.

**Critères d'acceptation :**
- [ ] Réception payload → mise à jour documents.
- [ ] Ordre : événement plus ancien ignoré.
- [ ] 400 si payload invalide.

---

### S2.2 Multi-devise fail-safe (préconisation 5)

P0 = EUR only. Règle simple :
- **Agrégation** : exclut les factures non-EUR (filtre sur currency au moment du calcul).
- **meta.warnings** : au niveau de la **réponse** (pas par invoice). Si au moins une facture non-EUR exclue → `meta.warnings += ["multi_currency_ignored_p0"]`.

---

## 4. Sprint 2.5 — Émetteur (optionnel, si main Odoo)

**Option P0-A :** Hook Odoo (reconciliation/payment) → DVIG → Vault.  
**Option P0-B :** Snapshot assumé + `freshness=snapshot` + Sprint dédié plus tard.  
Ne pas mélanger : soit event-driven, soit snapshot.

---

## 5. Sprint 3 — Agrégation Vault

**Objectif :** `GET /ui/aggregations/ar-by-partner` sur données maintenant « vivantes » (ou snapshot assumé).

### S3.1 Storage + Handler

- **EPS :** considérer facture ouverte si `amount_residual > EPS` (EPS = 0,01). Règle explicite pour éviter ambiguïtés.
- **Source :** table `documents` uniquement (pas de jointure `economic_events`).
- **group by `partner_id`** en P0 (préconisation 6). `partner_key` dérivé côté Vault (facultatif). `partner_name` = attribut d'affichage.
- **meta.freshness** — règle exacte :
  - `event_driven` = au moins un residual event reçu pour la période
  - `snapshot` = aucun residual event reçu
  - `unknown` = fallback technique (ex. données legacy, erreur lookup)

*(Tâches S2.1, S2.2, S2.3 de l'ancien plan — agrégation, modèles, tests.)*

---

## 6. Sprint 4 — Linky + DIVA (P0 minimal)

### S4.1 Proxy + BusinessCard

- Route proxy `/api/ar-by-partner`.
- Tableaux Encours / Clients à risque.
- **Warnings UI (préconisation 1 + 8) :**
  - Si `meta.freshness != "event_driven"` → afficher « donnée snapshot ».
  - Si `meta.missing_due_date_count` élevé → warning discret « échéances manquantes ».
  - Si `totals.open_amount == 0` → ne pas afficher la section « Clients à risque ».

### S4.2 DIVA P0 minimal (préconisation 7)

| Élément | P0 | P1 (exclu) |
|---------|-----|------------|
| dashboard-metrics | ar_by_partner.totals + top 5 overdue partners | — |
| hash_input | Résumé stable (totals + top keys/amounts) pour invalidation | — |
| computeInsights | **1 insight max** : concentration du risque + montant en retard + plus gros retard | — |
| system prompt (règle 12) | — | P1 |
| Textes longs, scoring, relance | — | P1 |

**Pourquoi P0 minimal :** risque CFO = dire trop et se tromper. Factuel, sobre.

---

## 7. Contrat `documents` (préconisation 3)

**À formaliser dans spec + avis :**

> `documents` est une projection déterministe (dernier état connu) d'un flux d'événements immuable.  
> `economic_events` reste la source d'historique.

---

## 8. Dépendances (graphe)

```
S1 (Données) ──► S2 (Route residual + idempotence)
                      │
                      └─► S2.5 (Émetteur, si dispo)
                              │
                              └─► S3 (Agrégation) ──► S4 (Linky + DIVA)
```

---

## 9. Références

- `ZeDocs/web28/SPEC_Vault_UI_Aggregations_AR_by_Partner_v1.0.1.md`
- `ZeDocs/web28/AVIS_EXPERT_AR_BY_PARTNER_v1.0.md`
- `ZeDocs/web28/COMPTE_RENDU_AR_BY_PARTNER_Sprint1_2026-02-22.md` — point MOA (Sprints 1 à 4)
- Préconisations 1–9 (ci-dessus, §0–§7)
