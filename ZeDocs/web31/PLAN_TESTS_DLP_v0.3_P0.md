# Plan de tests — DLP v0.3 (P0)

**Périmètre :** Service DLP + Linky + Odoo connector  
**Objectif :** Valider le flux complet création → mapping → timesheet.validated → hit → energy-summary → card

---

## 0. Pré-requis & jeux de données

### Données minimales

- **1 tenant** laplatine (UUID connu)
- **1 company** La Platine (company_external_id / company_id connu)
- **2 perimeters** : Structuration (sort_order=0), Finance (sort_order=1)
- **1 DLP active** avec :
  - scope_companies = [La Platine]
  - scope_perimeters = [Structuration]
- **Mapping :**
  - (tenant, odoo, project_external_id=1001) → perimeter Structuration
  - (tenant, odoo, project_external_id=1002) → perimeter Finance

### Convention de test

- `source_system` = `"odoo"`
- `time_entry_external_id` = IDs contrôlés (ex. TE-001, TE-002)

---

## 1. Tests Service DLP — Migrations & intégrité DB

### T1.1 — Migrations OK

| Étape | Action |
|-------|--------|
| 1 | Lancer migrations sur DB vide |
| 2 | Vérifier tables + contraintes + index |

**Attendu :**
- Toutes les tables existent
- `UNIQUE(tenant_id, source_system, project_external_id)` sur mapping
- `UNIQUE(tenant_id, dlp_id, source_system, time_entry_external_id)` sur hits

**DoD :** Migration idempotente (relance = OK)

---

## 2. Tests API CRUD

*Convention : routes relatives au service DLP, préfixe `/api/v1` (ex. `POST /api/v1/companies`, `GET /api/v1/companies?tenant=...`).*

### T2.1 — CRUD Company

- **Étapes :** `POST /api/v1/companies` puis `GET /api/v1/companies?tenant=...`
- **Attendu :** Company créée, listée, tenant-scoped

### T2.2 — CRUD BusinessPerimeter

- **Étapes :** Créer 2 perimeters + vérifier sort_order
- **Attendu :** Tri stable par sort_order (si endpoint le promet)

### T2.3 — CRUD DLP

- **Étapes :** `POST /api/v1/dlps` (scope_companies + scope_perimeters) ; `PATCH /api/v1/dlps/:id` status=archived
- **Attendu :**
  - `archived_at` rempli si archived
  - `GET /api/v1/dlps?status=active` n'inclut plus la DLP archivée

---

## 3. Tests Mapping project_perimeter_map

### T3.1 — Create mapping

- **Étapes :** Upsert mapping project 1001 → Structuration
- **Attendu :** Mapping présent

### T3.2 — Unicité

- **Étapes :** Créer une seconde fois le même mapping (même tenant/source/project)
- **Attendu :**
  - Soit update propre (si upsert)
  - Soit 409/422 contrôlé (si pas upsert)
  - Mais jamais 2 lignes

### T3.3 — Multi-ERP readiness

- **Étapes :** Créer mapping `project_external_id=1001` avec `source_system="erpnext"`
- **Attendu :** Accepté (unicité inclut source_system), pas de collision

---

## 4. Tests ingestion timesheet.validated & Hits

### Politique P0 recommandée

**Mapping absent** → 202 Accepted + log "mapping_missing" (pas d'erreur bloquante)

### T4.1 — Ingestion nominale (hit créé)

- **Étapes :** `POST /api/v1/timesheet-validated` avec :
  - company = La Platine
  - project_external_id=1001
  - time_entry_external_id=TE-001
  - Vérifier table hits
- **Attendu :**
  - 1 hit inséré
  - hit.company_id = La Platine
  - hit.business_perimeter_id = Structuration
  - hit.hit_at = payload.hit_at (ou now si absent)

### T4.2 — Idempotence (rejeu)

- **Étapes :** Reposter exactement le même event TE-001
- **Attendu :**
  - Toujours 1 hit en DB (pas de doublon)
  - Pas de double incrément des hit_count

### T4.3 — Mapping absent

- **Étapes :** `POST /api/v1/timesheet-validated` avec project_external_id=9999 non mappé
- **Attendu :**
  - Pas de hit
  - Réponse non bloquante (200/202)
  - Log/metric "mapping_missing"

### T4.4 — DLP inactive (archived)

- **Étapes :** Archiver la DLP Structuration ; POST TE-002 sur project 1001
- **Attendu :** 0 hit (ou hit_count non incrémenté) ; ingestion toujours OK

### T4.5 — Scope company non inclus

- **Étapes :** POST TE-003 avec company_id ≠ scope_companies
- **Attendu :** 0 hit

### T4.6 — Scope perimeter non inclus

- **Étapes :** DLP scope_perimeters=[Structuration] ; POST TE-004 sur project 1002 (Finance)
- **Attendu :** 0 hit

### T4.7 — Multi-DLP match (1 event → N hits)

- **Étapes :**
  - Créer 2 DLP actives sur même company + perimeter Structuration
  - POST TE-005 sur project 1001
- **Attendu :**
  - 2 hits (un par DLP)
  - Idempotence au rejouage (toujours 2)

---

## 5. Tests energy-summary

### T5.1 — Résumé vide

- **Étapes :** `GET /api/v1/dlp/energy-summary?tenant=...&period_days=90` sur DB vide hits
- **Attendu :**
  - hits_total=0
  - by_company=[], by_perimeter=[]
  - dlp_active_count conforme

### T5.2 — Agrégation & pourcentages

- **Préparer :** 3 hits sur Structuration, 1 hit sur Finance (même company)
- **Attendu :**
  - hits_total=4
  - pct : Structuration=75, Finance=25 (arrondi défini)
  - Tri : sort_order puis hits desc

### T5.3 — Filtre company_id

- **Étapes :** Ajouter une seconde company + hits ; appeler `GET /api/v1/dlp/energy-summary` avec company_id
- **Attendu :** Ne retourne que les hits de cette company

### T5.4 — Fenêtre period_days

- **Étapes :** hit_at vieux de 100 jours ; `GET /api/v1/dlp/energy-summary` avec period_days=90
- **Attendu :** Hit exclu

---

## 6. Tests Linky UI

### T6.1 — CRUD via UI

- **Étapes :** Créer perimeter, créer DLP, créer mapping
- **Attendu :**
  - Opérations persistées
  - Messages d'erreur clairs si API down

### T6.2 — Card StrategicEnergyCard

- **Étapes :** Afficher dlp_active_count, hits_total, by_perimeter, by_company ; disclaimer visible
- **Attendu :**
  - Valeurs cohérentes avec API
  - Aucun affichage d'heures / individus

---

## 7. Tests Odoo dorevia_dlp_connector

### T7.1 — Déclenchement sur validation

- **Étapes :** Valider une timesheet dans Odoo
- **Attendu :** POST vers service DLP ; hit créé

### T7.2 — Résilience (service DLP down)

- **Étapes :** Couper le service DLP ; valider une timesheet
- **Attendu :**
  - Odoo ne bloque pas
  - Log d'erreur seulement
  - (Optionnel) retry via queue/cron si implémenté

### T7.3 — Idempotence côté Odoo

- **Étapes :** Rejouer la validation (ou double hook) ; vérifier que DLP ne double pas
- **Attendu :** Contrainte unique protège

---

## 8. E2E "happy path" (scénario de référence)

1. **Linky :** Créer perimeter "Test"
2. **Linky :** Mapper project Odoo X → "Test"
3. **Linky :** Créer DLP scope [company La Platine] + [Test]
4. **Odoo :** Valider une timesheet sur projet X
5. **Linky :** Ouvrir card "Énergie stratégique"

**Attendu :** 1 hit ; 100 % sur "Test"

---

## Critères d'acceptation P0 (DoD global)

- [ ] Un event timesheet.validated crée 0..N hits selon scopes
- [ ] Idempotence garantie (pas de double hit, pas de double incrément)
- [ ] energy-summary cohérent et filtrable (tenant, period_days, company_id)
- [ ] Linky affiche card + disclaimer
- [ ] Odoo connector ne bloque jamais l'utilisateur
