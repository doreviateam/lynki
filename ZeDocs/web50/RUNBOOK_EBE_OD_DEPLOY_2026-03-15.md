# Runbook — Déploiement EBE OD Paie (LINKY-EBE-OD-01)

**Date :** 2026-03-15  
**Prérequis :** Images Docker construites (`dorevia/vault:ebe-od-payroll-2026-03-15`, `dorevia/linky:laplatine-ebe-od-2026-03-15`).  
**Référence :** RAPPORT_AVANCEMENT_EBE_OD_PAYROLL_2026-03-15.md, SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md

---

## 1. Déployer le Vault (core-stinger)

La plateforme **core-stinger** héberge le Vault partagé. Le fichier `tenants/core-stinger/platform/docker-compose.yml` référence l’image `dorevia/vault:ebe-od-payroll-2026-03-15`.

```bash
cd /opt/dorevia-plateform/tenants/core-stinger/platform
docker compose pull vault   # si l’image est sur un registry
docker compose up -d vault  # ou restart si déjà lancé
```

- Au démarrage, la **migration 043** (table `payroll_od_lines`) est appliquée automatiquement.
- Vérifier les logs : `docker logs vault-core-stinger` (aucune erreur au démarrage).

---

## 2. Lancer le backfill laplatine2026

Les conteneurs **odoo_lab_laplatine2026** et **vault-core-stinger** doivent être sur le même réseau Docker (`dorevia-network`) pour que le script Python (exécuté dans le shell Odoo) puisse appeler `http://vault-core-stinger:8080`.

```bash
cd /opt/dorevia-plateform/tenants/laplatine2026/scripts
./run_backfill_payroll_od_lines.sh
```

- Variables optionnelles : `ODOO_CONTAINER=odoo_lab_laplatine2026`, `ODOO_DB=laplatine2026`.  
- Le script lit les OD 641\*/645\* (période par défaut 2026-01-01 → 2026-02-28) et envoie les lignes à `POST /api/v1/payroll-od-lines` (header `X-Tenant: laplatine2026`).  
- En cas d’erreur réseau (Vault injoignable depuis Odoo), vérifier que les deux conteneurs sont bien sur `dorevia-network`.

**Vérification rapide après backfill :**

```bash
curl -s "http://localhost:8080/ui/aggregations/payroll?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-02-28" \
  -H "Host: vault-core-stinger" | jq '.payroll_source, .total_charges'
# Attendu : "od" et 21500
```

(Adapter l’URL si le Vault est exposé sur un autre host/port.)

---

## 3. Déployer Linky laplatine2026

Le fichier `tenants/laplatine2026/apps/ui/lab/docker-compose.yml` référence l’image `dorevia/linky:laplatine-ebe-od-2026-03-15`.

```bash
cd /opt/dorevia-plateform/tenants/laplatine2026/apps/ui/lab
docker compose pull linky   # si l’image est sur un registry
docker compose up -d linky  # ou restart si déjà lancé
```

- Vérifier que `VAULT_URL` pointe bien vers le Vault (ex. `http://vault-core-stinger:8080` si routage par Caddy/réseau).

---

## 4. Recette

Suivre **SPEC_RECETTE_EBE_OD_PAYROLL_BACKEND_FRONT_v1.0.md** :

- **S-BE-1 à S-BE-4** (backend)  
- **S-FR-1 à S-FR-5** (front)  
- **S-E2E-1** (La Platine : OD → API → affichage EBE)  
- **S-E2E-2** (non-régression tenant bulletins)

Renseigner les statuts (PASS/FAIL/N/A/BLOCKED) dans le tableau §5 de la spec de recette. **Le lot 2 a été livré, validé et clôturé (2026-03-15)**. Recette v1.0 = flux paie par OD comptables ; scénarios source payslip N/A hors périmètre. Ce runbook reste la référence pour (re)déploiement.

---

## 5. En cas de problème

| Problème | Piste |
|----------|--------|
| Migration 043 non appliquée | Vérifier les logs Vault au démarrage ; lancer `docker exec vault-core-stinger ./vault migrate` si la commande existe dans l’image. |
| Backfill : connexion refusée vers Vault | Vérifier que `odoo_lab_laplatine2026` et `vault-core-stinger` sont sur le même réseau Docker. |
| `payroll_source` toujours `none` après backfill | Vérifier que les lignes ont bien été insérées (table `payroll_od_lines`) et que la période (date_debut/date_fin) correspond aux dates des OD. |
| Linky n’affiche pas « Source paie : OD comptables » | Vérifier que l’API `/api/payroll` (proxy Vault) renvoie bien `payroll_source: "od"` pour le tenant et la période. |

---

*ZeDocs/web50 — Runbook déploiement EBE OD Paie — 2026-03-15.*
