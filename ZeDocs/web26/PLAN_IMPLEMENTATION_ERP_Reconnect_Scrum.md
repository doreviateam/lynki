# Plan d'implémentation — Vault Replay (ERP Reconnect) v1.2

**Format** : Backlog Scrum-like  
**Spec** : `SPEC_ERP_Reconnect_v1.2.md`  
**Suivi** : `SUIVI_IMPLEMENTATION_ERP_Reconnect_v1.2.md`  
**Annexe mapping/backfill/schémas** : `ANNEXE_Mapping_Backfill_Schema_JSON.md`  
**Date** : 2026-02-21  
**Amendements intégrés** : 1–6, A (dataset régression), B (limit max), annexe modules Odoo, spec §8 D–G (partner_ref, Runner, tenant), canonical JSON (🔐 A), partner_ref stabilité

---

## Épics

| Id | Epic | Objectif |
|----|------|----------|
| E1 | **economic_events + ingestion** | Table Vault + endpoint ingest + mapper canonique |
| E2 | **Replay feed + cursor** | API feed ordonnée avec filtres et cursor HMAC |
| E3 | **Backfill** | Migration données existantes → economic_events |
| E4 | **Jobs API** | CRUD jobs, logs, report |
| E5 | **Runner + dry-run** | Consommation feed, simulation sans ERP |
| E6 | **Adapter Odoo** | Modules `dorevia_core` + `dorevia_adapter_odoo18` + idempotence |
| E7 | **UX wizard** | Bouton « Rebrancher un ERP » + wizard |

---

## Sprint 1 — Fondations (economic_events + ingestion)

### E1‑US1 : Créer le schéma `economic_events` et `tenant_sequences`

**Story points** : 3  

**Description** : En tant que développeur, je crée les tables et index Vault pour stocker les événements économiques.

**Tasks** :
- [ ] Rédiger migration SQL (economic_events, tenant_sequences, index) — 1 SP
- [ ] Exécuter migration en dev/staging — 0.5 SP
- [ ] Documenter la migration dans le runbook — 0.5 SP

**Acceptance criteria** :
- Tables créées conformes à la spec (champs, contraintes, index)
- Migration idempotente (re-runnable sans erreur)

---

### E1‑US2 : Implémenter le calcul de hash canonique

**Story points** : 2  

**Description** : En tant que Vault, je calcule le hash sur une représentation déterministe du `payload_json` (🔐 A).

**Tasks** :
- [ ] Créer utilitaire `canonical_json(payload) → string` : clés triées, UTF-8, pas d'espaces, nombres sans format variable (1 pas 1.0) — 1 SP
- [ ] Créer utilitaire `compute_hash(canonical) → hex` (SHA-256 ou équivalent) — 0.5 SP
- [ ] Tests unitaires : mêmes données → même hash — 0.5 SP

**Acceptance criteria** :
- Deux encodages différents du même contenu → même hash
- Règle stabilité respectée : clés triées, UTF-8, pas d'espaces, nombres sans format variable (spec §2.1 🔐 A)

---

### E1‑US2bis : Calcul et chaînage prev_hash

**Story points** : 2  

**Description** : En tant que Vault, je chaîne les événements par prev_hash afin d'assurer l'intégrité du registre.

**Tasks** :
- [ ] Dans la transaction d'insertion, récupérer le dernier event du tenant (sequence max) — 0.5 SP
- [ ] prev_hash = last.hash (ou NULL si premier event) — 0.5 SP
- [ ] Tests unitaires : vérifier continuité de la chaîne — 0.5 SP
- [ ] Test multi-insert concurrent (1 writer/tenant garanti) — 0.5 SP

**Acceptance criteria** :
- Chaque événement référence le hash du précédent
- Aucun « trou » dans la chaîne
- La chaîne reste cohérente après backfill

---

### E1‑US3 : Endpoint ingest — accepter `source_payload_json` et mapper → canonique

**Story points** : 5  

**Description** : En tant que DVIG, je peux envoyer des événements raw à Vault ; Vault transforme et stocke en canonique.

**Tasks** :
- [ ] Définir contrat API ingest (POST, body, params) — 0.5 SP
- [ ] Mapper `invoice.posted` raw → `dorevia.economic_event.v1` (invoice_issued) — 1.5 SP
- [ ] Mapper `payment.posted` raw → `dorevia.economic_event.v1` (payment_received) — 1 SP
- [ ] Assigner `sequence` (tenant_sequences + FOR UPDATE) — 1 SP
- [ ] Calculer hash + prev_hash, insérer dans economic_events — 0.5 SP
- [ ] Idempotence via `ingest_idempotency_key` (skip si existe) — 0.5 SP

**Acceptance criteria** :
- Endpoint accepte `source_payload_json` ; conserve en BDD
- `payload_json` = version canonique
- `schema_version`, `ingest_source` renseignés
- Idempotence : 2 requêtes identiques → 1 seule ligne

---

### E1‑US4 : Validation des types raw supportés

**Story points** : 1  

**Description** : En tant que Vault, je valide que le type d'événement raw reçu est supporté (ex : invoice.posted, payment.posted).

**Tasks** :
- [ ] Définir liste des raw types supportés (MVP : invoice.posted, payment.posted) — 0.25 SP
- [ ] Rejeter tout autre type (HTTP 400) — 0.5 SP
- [ ] Tests : raw type inconnu → rejet — 0.25 SP

**Acceptance criteria** :
- Ingestion accepte uniquement raw types connus
- `schema_version` est toujours `dorevia.economic_event.v1` (généré par Vault)

---

## Sprint 2 — Replay feed + Backfill

### E3‑US0 : Implémenter Write Barrier (tenant lock)

**Story points** : 2  

**Description** : En tant que Vault, je bloque l'ingestion pour un tenant pendant le backfill.

**Tasks** :
- [ ] Créer table tenant_locks ou flag backfill_lock — 0.5 SP
- [ ] Refuser ingestion (409) si lock actif — 0.5 SP
- [ ] Activer lock au début du backfill — 0.25 SP
- [ ] Désactiver lock en fin de backfill — 0.25 SP
- [ ] Tests concurrence — 0.5 SP

**Acceptance criteria** :
- Aucun nouvel événement accepté pendant backfill
- Pas de conflit de sequence
- Lock visible dans logs

---

### E2‑US1 : GET /api/v1/replay/events — query + filtres

**Story points** : 5  

**Description** : En tant que Runner, je peux récupérer des événements ordonnés par sequence avec filtres.

**Tasks** :
- [ ] Endpoint GET avec params tenant, from, to, types, limit — 1 SP
- [ ] Limit max configurable (ex: 500) ; si limit > max → clamp — 0.25 SP
- [ ] Implémenter SQL (spec §4) avec filtres — 2 SP
- [ ] Tests : filtres from/to/types — 0.75 SP
- [ ] Docs OpenAPI / Swagger — 0.5 SP

**Acceptance criteria** :
- Réponse ordonnée par `sequence ASC`
- Filtres appliqués : from (>=), to (<), types (vide = tous)
- Limit borné : requêtes énormes évitées (ex: limit=10000 → clamp à 500)

---

### E2‑US2 : Cursor signé HMAC pour pagination

**Story points** : 3  

**Description** : En tant que Runner, je peux paginer via un cursor opaque et vérifié.

**Tasks** :
- [ ] Format cursor : base64(json) + '.' + base64(HMAC) — 1 SP
- [ ] Génération cursor à la fin de la réponse — 0.5 SP
- [ ] Paramètre `cursor` : vérifier HMAC avant décoder — 1 SP
- [ ] SQL : `sequence > cursor_sequence` — 0.5 SP

**Acceptance criteria** :
- Cursor manipulé → 400 ou réponse vide
- Pagination : suite d’appels retourne tous les événements sans doublon ni omission

---

### E3‑US1a : Backfill invoices (documents)

**Story points** : 4  

**Dépendances** : E3‑US0  

**Description** : En tant qu'opérateur, je peux lancer un backfill des factures (documents) vers `economic_events`.

**Tasks** :
- [ ] Extraire documents (table existante) — 1 SP
- [ ] Tri déterministe : timestamp ASC, event_id ASC — 0.5 SP
- [ ] Mapper documents → `dorevia.economic_event.v1` (invoice_issued) — 1.5 SP
- [ ] Insérer avec sequence incrémentale, idempotent (skip si event_id existe) — 0.5 SP
- [ ] Activer/désactiver write barrier — 0.5 SP

**Acceptance criteria** :
- Backfill idempotent
- Ordre respecté

---

### E3‑US1b : Backfill payments

**Story points** : 3  

**Dépendances** : E3‑US0  

**Description** : En tant qu'opérateur, je peux lancer un backfill des paiements vers `economic_events`.

**Tasks** :
- [ ] Extraire payments (table existante) — 1 SP
- [ ] Mapper payments → `dorevia.economic_event.v1` (payment_received) — 1 SP
- [ ] Insérer avec sequence (après invoices si même batch), idempotent — 0.5 SP
- [ ] Write barrier — 0.5 SP

**Acceptance criteria** :
- Backfill idempotent
- Séquence cohérente avec E3‑US1a si backfill combiné

---

### E3‑US1c : Backfill legacy events

**Story points** : 3  

**Dépendances** : E3‑US0  

**Description** : En tant qu'opérateur, je peux lancer un backfill des events legacy vers `economic_events`.

**Tasks** :
- [ ] Extraire events (table existante) — 1 SP
- [ ] Mapper events → `dorevia.economic_event.v1` — 1 SP
- [ ] Insérer avec sequence incrémentale, idempotent — 0.5 SP
- [ ] Write barrier — 0.5 SP

**Acceptance criteria** :
- Backfill idempotent
- Permet livraison incrémentale et validation mapping par type

---

## Sprint 3 — Jobs API + Runner dry-run

**Runner** : Processus intégré au service Vault (Go) recommandé pour le MVP (spec §8 F). Un Odoo par tenant (spec §8 G).

### E4‑US1 : Tables replay_jobs + replay_job_logs

**Story points** : 2  

**Tasks** :
- [ ] Migration SQL — 1 SP
- [ ] Modèles / entités applicatives — 0.5 SP
- [ ] Index pour requêtes par tenant, status — 0.5 SP

---

### E4‑US2 : POST /api/v1/replay/jobs — créer un job

**Story points** : 3  

**Description** : En tant qu’utilisateur Vault, je peux créer un job de replay.

**Tasks** :
- [ ] Endpoint POST, body : tenant, mode (dry_run|apply), range (from/to), options (ex: odoo_url pour ERP cible ; 1 Odoo par tenant, spec §8 G) — 1.5 SP
- [ ] Validation : tenant existe, range valide — 0.5 SP
- [ ] Créer entrée dans replay_jobs (status = queued) — 0.5 SP
- [ ] Retourner job_id — 0.5 SP

---

### E4‑US3 : GET /api/v1/replay/jobs/{id} — statut + progression

**Story points** : 2  

**Tasks** :
- [ ] Endpoint GET — 0.5 SP
- [ ] Retourner status, progress (events_processed, etc.), dates — 1 SP
- [ ] 404 si job inconnu — 0.5 SP

---

### E4‑US4 : GET /api/v1/replay/jobs/{id}/logs + /report

**Story points** : 3  

**Tasks** :
- [ ] Endpoint logs : pagination, niveaux — 1 SP
- [ ] Endpoint report : JSON (MVP), CSV/PDF en P1 — 1.5 SP
- [ ] Structure rapport : compteurs, warnings, erreurs — 0.5 SP

---

### E5‑US1 : Runner — poll jobs + consommer feed

**Story points** : 5  

**Description** : En tant que processus Runner, je poll les jobs en attente et consomme le replay feed.

**Tasks** :
- [ ] Poll jobs status = queued (intervalle configurable) — 1 SP
- [ ] Pour chaque job : GET replay/events avec cursor — 1.5 SP
- [ ] Vérifier schema_version ; refuser si non supporté (🔁 B) — 0.5 SP
- [ ] En mode dry_run : simuler sans appeler l’ERP — 1 SP
- [ ] Mettre à jour progress, logs — 0.5 SP
- [ ] Checkpoints : sauvegarder cursor en cas de crash — 0.5 SP

**Acceptance criteria** :
- Runner process standalone ou intégré
- Dry-run : aucun appel ERP, rapport avec compteurs simulés

---

### E5‑US2 : Ordonnancement des événements avant apply

**Story points** : 2  

**Description** : En tant que Runner, j'applique les événements dans l'ordre : Partners → Invoices → Payments → Balances. L'ordonnancement est ma responsabilité ; Odoo reste passif.

**Règles (spec §8)** : Partner dérivé des payloads (🧠 C). `partner_ref` = valeur stable du raw (partner_id, vat…), jamais générée dynamiquement (§8 D). Runner extrait counterparty et appelle `partner/upsert` avant l'event.

**Tasks** :
- [ ] Grouper events par type — 0.5 SP
- [ ] Extraire counterparty des payloads (invoice, payment) et appeler partner/upsert avant — 0.5 SP
- [ ] Appliquer ordre : Partners (dérivés) → Invoices → Payments → Balances — 0.5 SP

**Acceptance criteria** :
- Odoo reçoit les événements déjà ordonnés ; partner créé avant invoice qui le référence
- Aucune logique d'ordonnancement côté Adapter Odoo

---

## Sprint 4 — Adapter Odoo + UX

**Prérequis modules ERP** : Sur l'ERP cible : `dorevia_core` + `dorevia_adapter_odoo18` (dépendances : account, product). Sur l'ERP source : `dorevia_vault_connector`. Voir spec §7 + annexe.

**État final cible** : Dorevia Linky continue de tourner ; Odoo accessible à `https://odoo.stinger.sarl-la-platine.doreviateam.com` (admin/admin).

### E6‑US1 : Modules dorevia_core + dorevia_adapter_odoo18 — structure

**Story points** : 3  

**Tasks** :
- [ ] Créer module `dorevia_core` (config, paramètres Vault) — 0.5 SP
- [ ] Créer module `dorevia_adapter_odoo18` (depends: dorevia_core, account, product) — 0.5 SP
- [ ] Modèle `dorevia.replay.mapping` (event_id, tenant, model, res_id, status, details_json) — 0.5 SP
- [ ] Helper : event_id déjà appliqué → skip — 0.5 SP
- [ ] Config : URL Vault, URL Odoo cible ; credentials Odoo (admin/admin par défaut, secret manager en prod) — 0.5 SP
- [ ] Documenter installation (runbook : Apps → dorevia_core, dorevia_adapter_odoo18 → Installer) — 0.25 SP

**Acceptance criteria** :
- Modules installables sur Odoo 18 (CE 18)

---

### E6‑US2 : Endpoint partner/upsert

**Story points** : 3  

**Tasks** :
- [ ] Endpoint POST partner/upsert (payload : name, partner_ref obligatoires ; partner_ref = valeur stable du raw, jamais dynamique) — 1 SP
- [ ] Création ou mise à jour partner — 1 SP
- [ ] Idempotence par (tenant, partner_ref) — pas d'entrée dans dorevia.replay.mapping (spec §8 D) — 0.5 SP

**Acceptance criteria** :
- partner_ref accepté uniquement si issu du raw (partner_id, vat, etc.) — pas de nom ou hash dynamique

---

### E6‑US3 : Endpoint invoice/create_synth

**Story points** : 5  

**Tasks** :
- [ ] Endpoint POST invoice/create_synth — 1 SP
- [ ] Créer facture avec 1 ligne « Vente HT (Vault) » synthétique — 2 SP
- [ ] Stratégie `generic_sale_line` — 0.5 SP
- [ ] Mapping event_id → account.move — 0.5 SP
- [ ] Idempotence — 0.5 SP

---

### E6‑US4 : Endpoint payment/create + balances/recompute

**Story points** : 4  

**Tasks** :
- [ ] Endpoint payment/create — 1.5 SP
- [ ] Stratégie FIFO best-effort — 1 SP
- [ ] Endpoint balances/recompute — 1 SP
- [ ] Mapping + idempotence — 0.5 SP

---

### E6‑US4bis : Journal des allocations FIFO

**Story points** : 2  

**Description** : Même en MVP, tracer les allocations paiement → factures pour auditabilité.

**Tasks** :
- [x] Stocker mapping payment → invoices (JSON ou table) — 1 SP
- [x] Exposer dans report replay — 0.5 SP
- [ ] Tests : paiement partiel, multi-factures — 0.5 SP

**Acceptance criteria** :
- Chaque allocation FIFO est tracée
- Rapport replay contient le détail payment → invoices

---

### E7‑US1 : Bouton « Rebrancher un ERP » + wizard minimal

**Story points** : 5  

**Description** : En tant qu’utilisateur, je peux lancer un replay depuis l’UI Vault.

**Tasks** :
- [x] Bouton dans l’UI (tenant context) — 0.5 SP
- [x] Wizard : ERP cible (Odoo), période (from/to), mode (dry_run/apply) — 2 SP
- [x] Soumission → POST /replay/jobs — 0.5 SP
- [x] Redirection vers détail job (GET /jobs/{id}) — 0.5 SP
- [x] Affichage statut, progression, lien vers logs/report — 1 SP

**Acceptance criteria** :
- Parcours complet : bouton → wizard → job créé → suivi

---

## Sprint 5 — Intégration + DoD P0

### E5‑US0 : Dataset de test déterministe

**Story points** : 2  

**Description** : Base de régression reproductible pour valider ingest + replay.

**Tasks** :
- [ ] Seed : 10 invoices + 5 payments (données déterministes) — 0.5 SP
- [ ] Lancer ingest → economic_events peuplé — 0.25 SP
- [ ] Lancer replay dry-run — 0.25 SP
- [ ] Vérifier séquence attendue (snapshot ou assertions) — 0.75 SP
- [ ] Documenter comme base de régression — 0.25 SP

**Acceptance criteria** :
- Dataset reproductible (même seed → même résultat)
- Test automatisé dans CI/CD

---

### E5‑US3 : Runner apply mode — appeler Adapter Odoo

**Story points** : 5  

**Dépendances** : E5‑US2, E6‑US1 à E6‑US4bis (modules dorevia_core + dorevia_adapter_odoo18)

**Tasks** :
- [ ] Mode apply : appeler endpoints Odoo au lieu de simuler — 2 SP
- [ ] Gestion erreurs : retry, échec partiel, rapport — 1.5 SP
- [ ] Mettre à jour job status (running → completed/failed) — 0.5 SP
- [ ] Test E2E : job apply sur Odoo de test — 1 SP

---

### E7‑US2 : Intégration DVIG → Vault ingest

**Story points** : 3  

**Description** : Le flux Odoo → DVIG envoie désormais vers l’endpoint ingest Vault.

**Tasks** :
- [ ] Adapter DVIG : après outbox, appeler Vault ingest — 1 SP
- [ ] Mapper payload DVIG → format attendu par ingest — 1 SP
- [ ] Tests : événement Odoo → economic_events peuplé — 0.5 SP
- [ ] Gérer les erreurs (retry, dead letter) — 0.5 SP

---

### DoD P0 — Validation finale ✅ (2026-02-21)

**Story points** : 3  

**Tasks** :
- [x] Backfill validé sur jeu de données réel (staging) — 1 SP
- [x] Dry-run end-to-end : job créé → rapport cohérent — 0.5 SP
- [x] Apply end-to-end : job → Odoo peuplé, idempotence vérifiée — 1 SP
- [x] Documentation runbook opérationnel — 0.5 SP

**Procédure** : `DOD_P0_VALIDATION_STAGING.md` ; script `run_dod_p0_validation.sh`. Base Odoo : `dorevia_p0` avec `account,dorevia_core,dorevia_adapter_odoo18`.

---

## Récapitulatif par Sprint

| Sprint | Épics | Stories | SP total |
|--------|-------|---------|----------|
| S1 | E1 | 5 (US1, US2, US2bis, US3, US4) | 13 |
| S2 | E2, E3 | 6 (E3‑US0, E2‑US1, E2‑US2, E3‑US1a, E3‑US1b, E3‑US1c) | 22 |
| S3 | E4, E5 | 7 | 24 |
| S4 | E6, E7 | 7 (US1–US4, US4bis, E7‑US1) | 29 |
| S5 | E5, E7, DoD | 4 (E5‑US0, E5‑US3, E7‑US2, DoD) | 13 |

**Total** : ~101 SP (amendements 1–6 + micro-points A/B + annexe modules Odoo intégrés).

---

## Dépendances (graphe)

```
E1 (ingestion) ──────────────────────────────────────────────┐
     │                                                         │
E2 (feed) ◄── E1                                               │
     │                                                         │
E3‑US0 (write barrier)                                        │
     │                                                         │
E3‑US1a/b/c (backfill) ◄── E3‑US0, E1                         │
     │                                                         │
E4 (jobs API) ──────────────────────────────────────────────┐
     │                                                         │
E5 (runner) ◄── E2, E4                                         │
  ├─ E5‑US2 : ordonnancement (Sprint 3)                        │
  └─ E5‑US3 : apply mode ◄── E5‑US2, E6 (Sprint 5)             │
     │                                                         │
E6 (adapter) ─────────────────────────────────────────────────┘
     │  E6‑US4bis : journal allocations FIFO
     │
E7 (UX) ◄── E4
```
