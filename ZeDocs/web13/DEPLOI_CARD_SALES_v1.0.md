# Déploiement — Card Ventes certifiées (GET /ui/aggregations/sales)

**Image** : `dorevia/vault:v1.4.0-card-sales` (contient le main `cmd/vault` et la route `/ui/aggregations/sales`).

---

## 1. Build image (déjà fait une fois)

```bash
cd /opt/dorevia-plateform/sources/vault
docker build -t dorevia/vault:v1.4.0-card-sales .
```

---

## 2. Déployer

### Option A — Core (lab)

La plateforme core utilise déjà cette image :

```bash
cd /opt/dorevia-plateform/tenants/core/platform
docker compose pull vault
docker compose up -d vault
```

Test : `https://vault.core.doreviateam.com/ui/aggregations/sales?tenant=core&date_debut=2026-01-01&date_fin=2026-02-06&granularity=month`

### Option B — sarl-la-platine (Caddy attend vault-sarl-la-platine)

Créer le réseau si besoin, puis lancer la platform sarl-la-platine :

```bash
docker network create dorevia-network 2>/dev/null || true
cd /opt/dorevia-plateform/tenants/sarl-la-platine/platform
docker compose up -d
```

Test : `https://vault.sarl-la-platine.doreviateam.com/ui/aggregations/sales?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-02-06&granularity=month`

---

## 3. Tester

```bash
# Avec la variable d'environnement (sarl-la-platine par défaut)
VAULT_URL=https://vault.sarl-la-platine.doreviateam.com ./scripts/test_ui_aggregations_sales.sh

# Ou core
VAULT_URL=https://vault.core.doreviateam.com TENANT=core ./scripts/test_ui_aggregations_sales.sh
```

Réponse attendue (exemple) : `{"tenant":"sarl-la-platine","scope":"invoice.posted","currency":"EUR","total":0,"from":"2026-01-01","to":"2026-02-06","granularity":"month","series":[],"verifiable":true}` (total et series à 0 si aucune facture vaultée sur la période).

---

## 4. Appsmith

Suivre `CHECKLIST_APPSMITH_CARD_VENTES_CERTIFIEES_v1.0.md` : créer l’API REST vers l’URL du Vault du tenant, puis la card avec montant, période, badge « Données certifiées ».

---

Version : v1.0
