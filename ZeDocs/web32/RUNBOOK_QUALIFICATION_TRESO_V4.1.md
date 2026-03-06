# Runbook — Qualification Trésorerie v4.1

**Date :** 2026-02-25  
**Objectif :** Valider le flux complet Trésorerie v4.1 (Vault + Odoo + Linky) sur tenant sarl-la-platine

---

## 1. Prérequis

- Docker, docker-compose
- Réseau `dorevia-network` existant
- Odoo stinger sarl-la-platine déjà démarré (odoo_stinger_sarl-la-platine)
- Backfill RECONCIL effectué (lignes de relevé dans `bank_reconciliation_projection`)

---

## 2. Rebuild et déploiement

### 2.1 Rebuild image Vault (avec code v4.1)

```bash
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:treasury-v4.1 .
```

### 2.2 Rebuild image Linky (UI v4.1 — 2 blocs, badges, « Données actualisées »)

```bash
cd /opt/dorevia-plateform
docker build -t dorevia/linky:build-local -f units/dorevia-linky/Dockerfile units/dorevia-linky
```

Puis recréer les conteneurs Linky (lab et stinger) :

```bash
# Lab
cd tenants/sarl-la-platine/apps/ui/lab
docker compose -p dorevia_ui_lab_sarl-la-platine up -d linky --force-recreate

# Stinger
cd tenants/sarl-la-platine/apps/ui/stinger
docker compose -p dorevia_ui_stinger_sarl-la-platine up -d linky --force-recreate
```

### 2.3 Mise à jour core-stinger (Vault)

Modifier `tenants/core-stinger/platform/docker-compose.yml` :

```yaml
# Avant
image: dorevia/vault:vaulting-routes

# Après (temporaire qualif)
image: dorevia/vault:treasury-v4.1
```

### 2.4 Redémarrer les services

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose -p dorevia_core-stinger_platform up -d vault
# Attendre healthcheck OK
docker compose ps
```

### 2.5 Redémarrer Odoo (pour recharger dorevia_vault_connector avec erp_balance)

Le module est monté en volume ; un **restart** suffit pour charger le nouveau code :

```bash
cd /opt/dorevia-plateform/tenants/sarl-la-platine/apps/odoo/stinger
docker compose -p dorevia_odoo_stinger_sarl-la-platine restart odoo
```

---

## 3. Tests fonctionnels

### 3.1 Treasury API (Vault direct)

```bash
curl -s "http://localhost:8080/ui/aggregations/treasury?tenant=sarl-la-platine" | jq .
```

**Vérifications :**
- [ ] Présence de `position` (validated_balance, erp_balance, unvalidated_exposure, reliability_position)
- [ ] Présence de `process` (reconciled_volume, unreconciled_volume, reliability_volume)
- [ ] Présence de `flags` (sign_mismatch, large_delta, structural_delta)
- [ ] Présence de `generated_at`
- [ ] `erp_balance` non null si Odoo joignable

### 3.2 Mode dégradé (Odoo down)

Arrêter Odoo ou pointer vers une URL invalide, puis :

```bash
curl -s "http://localhost:8080/ui/aggregations/treasury?tenant=sarl-la-platine" | jq '.position'
```

**Vérification :** `erp_balance`, `unvalidated_exposure`, `reliability_position` doivent être `null`.

### 3.3 Linky (carte Trésorerie)

1. Ouvrir Linky (stinger sarl-la-platine)
2. Aller sur le cockpit / dashboard
3. Afficher la carte « Trésorerie validée »

**Vérifications :**
- [ ] Bloc Position (Trésorerie validée, Exposition non validée, Solde ERP, Couverture probante)
- [ ] Bloc Process (Volume rapproché, Volume en attente, Taux de traitement)
- [ ] « Données actualisées il y a Xs » affiché si `generated_at` < 5 min
- [ ] Badges visibles en cas de sign_mismatch, large_delta, structural_delta

### 3.4 Flux end-to-end (raccourcissement temps réel)

1. Noter les valeurs actuelles (volume rapproché, taux)
2. Dans Odoo : rapprocher une ligne de relevé bancaire
3. Attendre ≤ 10 s (DVIG → Vault)
4. Rafraîchir Linky (ou attendre le polling)

**Vérification :** Volume rapproché et taux mis à jour.

---

## 4. Statut qualification (2026-02-25)

| Test | Résultat |
|------|----------|
| Vault build | ✅ OK |
| Treasury API structure v4.1 | ✅ position, process, flags, generated_at, last_reconcil_event_at |
| Mode dégradé (erp_balance null) | ✅ OK — Odoo indisponible → champs dérivés null |
| Odoo erp_balance | ✅ OK — Redémarrage Odoo pour recharger `dorevia_vault_connector` |
| Réponse complète | ✅ erp_balance, validated_balance, unvalidated_exposure, reliability_position, flags (structural_delta) |
| Linky UI v4.1 | ✅ Rebuild + recreate — 2 blocs Position/Process, badges, « Données actualisées » |

**Actions effectuées :** Restart Odoo (recharger addon) ; Rebuild + recreate Linky (nouvelles UI).

---

## 5. Rollback

En cas de régression, restaurer l'image précédente :

```yaml
image: dorevia/vault:vaulting-routes
```

Puis `docker compose -p dorevia_core-stinger_platform up -d vault`.

---

## 6. Checklist finale

| Item | Statut |
|------|--------|
| Vault build OK | |
| Treasury API retourne structure v4.1 | |
| Mode dégradé (erp null) OK | |
| Carte Linky affiche 2 blocs | |
| Badges affichés si conditions remplies | |
| « Données actualisées » affiché | |
| Flux E2E rapprochement validé | |
