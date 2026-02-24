# Checklist — Activation DLP pour un nouveau tenant

**Référence :** SPEC_DLP_v0.3.md  
**Date :** 2026-02-24

---

## 1. Services

- [ ] DLP démarré (`cd units/dlp && docker compose up -d`)
- [ ] DLP joignable depuis le réseau (`curl http://dlp:8020/health`)
- [ ] Linky déployé avec `DLP_URL` (injecté par render ou manifest)

---

## 2. Odoo (tenant lab ou stinger)

- [ ] Modules `project` et `hr_timesheet` installés  
  - Vérifier : `./scripts/check_odoo_phase0_dlp.sh <tenant> <env>`
  - Installer si besoin : `./scripts/install_odoo_modules_dlp.sh <tenant> <env>`
- [ ] Module `dorevia_dlp_connector` installé
- [ ] Paramètres système configurés :
  - `dorevia.dlp.service.url` = `http://dlp:8020`
  - `dorevia.dlp.tenant.id` = `<tenant_slug>` (ex. `sarl-la-platine`)

---

## 3. Données DLP (page Linky /dlp)

- [ ] **Sociétés** : créer avec `external_id` type `odoo:1`, `odoo:2` (ID Odoo res.company)
- [ ] **Périmètres métier** : créer rattachés aux sociétés (ex. Retail, Export)
- [ ] **DLP** : créer avec intention, hypothèse, scope (sociétés + périmètres)
- [ ] **Mapping** : associer chaque projet Odoo (project_id) à un périmètre

---

## 4. Test E2E

1. [ ] Créer une ligne de timesheet sur un projet mappé dans Odoo
2. [ ] Vérifier logs Odoo : `docker logs odoo_<env>_<tenant> 2>&1 | grep dlp`
3. [ ] Ouvrir Linky → card « Énergie stratégique »
4. [ ] Vérifier qu'un hit apparaît (DLP actives, répartition par périmètre)

---

## 5. Références

- Runbook : `ZeDocs/web31/RUNBOOK_DLP.md`
- Gestion DLP dans Linky : `/dlp` (depuis la card Énergie stratégique)
