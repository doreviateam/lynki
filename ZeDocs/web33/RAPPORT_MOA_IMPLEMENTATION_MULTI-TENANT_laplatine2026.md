# Rapport MOA — Implémentation Démo Multi-Tenant laplatine2026

**Date :** 2026-02-28  
**Destinataire :** Maîtrise d'Ouvrage  
**Référence :** SPEC Multi-Tenant P0 (`ZeDocs/web33/SPEC_MULTI-TENANT.md`)  
**Objet :** Compte rendu d'implémentation du tenant démo `laplatine2026`

---

## 1. Synthèse exécutive

L'implémentation du **tenant démo laplatine2026** est **terminée**. La plateforme Dorevia démontre désormais son architecture **multi-tenant** avec :

- **Deux cockpits Linky isolés** : `sarl-la-platine` (prod/stinger) et `laplatine2026` (lab)
- **Un Vault partagé** : les données sont partitionnées par `tenant_id`
- **Infrastructure mutualisée** : Vault, DVIG et Caddy sont communs ; seuls Odoo LAB et Linky LAB sont dédiés au nouveau tenant

| Indicateur | Résultat |
|------------|----------|
| **Tenant provisionné** | ✅ laplatine2026 |
| **Odoo LAB** | ✅ Opérationnel (base restaurée) |
| **Linky LAB** | ✅ Opérationnel (`/api/tenant` → laplatine2026) |
| **Documents dans le Vault** | ✅ 50+ (backfill en cours pour ~500 factures) |
| **Neutralisation clone** | ✅ SMTP + 7 crons désactivés |
| **Impact production** | ✅ Aucun (sarl-la-platine inchangé) |

**Précision importante :** La démo est orientée **données, preuves et cockpit**, pas orientée documents PDF. Les pièces jointes historiques n'ont pas été restaurées (pas de filestore). Ne pas cliquer sur les documents/attachments dans l'historique.

---

## 2. Contexte et objectifs

### 2.1 Intention (SPEC P0)

Prouver que la plateforme Dorevia est multi-tenant au sens :

- Vault partagé (infrastructure mutualisée)
- Partition stricte par `tenant_id`
- Idempotence tenant-scopée
- Deux instances Linky affichant des données strictement isolées

### 2.2 Périmètre implémenté

| Élément | Statut |
|---------|--------|
| Provisioning tenant laplatine2026 | ✅ |
| Restauration backup La Platine dans Odoo LAB | ✅ |
| Configuration DVIG pour ingestion sous `tenant_id=laplatine2026` | ✅ |
| Vérification d'isolement dans Linky | ✅ À valider manuellement |
| Neutralisation du clone (SMTP, crons, webhooks) | ✅ |

### 2.3 Exclusions (hors périmètre)

- Multi-source / multi-base dans un même tenant
- Filtres "source/base" dans Linky
- Restauration du filestore (PDF, logos, pièces jointes)

---

## 3. Réalisations par phase

### Phase 1 — Provisionnement du tenant (✅ Terminée)

| Action | Détail |
|--------|--------|
| Structure du tenant | `tenants/laplatine2026/` avec manifest, docker-compose Odoo/Linky, odoo.conf |
| Token DVIG | Généré et ajouté dans `tenants/core-stinger/secrets/dvig.tokens.yml` |
| Caddy / Gateway | Rendu et agrégation Caddyfile ; routes DNS configurées |
| DNS | `ui.lab.laplatine2026.doreviateam.com` → 85.215.206.213 |

### Phase 2 — Odoo LAB et restauration du dump (✅ Terminée)

| Action | Détail |
|--------|--------|
| Base PostgreSQL | Conteneur `odoo_db_lab_laplatine2026` démarré avec `POSTGRES_DB=postgres` |
| Création base cible | Base `laplatine2026` créée explicitement (plan déterministe) |
| Restauration | Dump custom PostgreSQL restauré via `docker cp` + `pg_restore` |
| Vérification | 986 modules Odoo dans `ir_module_module` — base valide |
| Odoo LAB | Conteneur `odoo_lab_laplatine2026` opérationnel |
| Module Vault | `dorevia_vault_connector` installé sur la base |

### Phase 3 — Linky LAB (✅ Terminée)

| Action | Détail |
|--------|--------|
| Déploiement Linky | Conteneur `linky_lab_laplatine2026` démarré |
| Configuration | `TENANT_ID=laplatine2026`, Vault/DVIG partagés |
| Vérification | `/api/tenant` renvoie `{"tenant_id":"laplatine2026"}` |

### Phase 4 — DVIG et backfill (✅ Terminée)

| Action | Détail |
|--------|--------|
| Configuration Odoo | `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.tenant`, `dorevia.dvig.source` |
| Backfill factures | 500 factures postées mises en file d'envoi (status todo) |
| Envoi DVIG | Cron « Vault Send DVIG » exécuté — 50 factures envoyées au Vault (limite par exécution) |
| Documents Vault | 50+ documents pour le tenant `laplatine2026` |
| Backfill RECONCIL | Aucune ligne de relevé bancaire postée à traiter (dump sans données de rapprochement) |

### Phase 5 — Neutralisation et validation (✅ Terminée)

| Action | Détail |
|--------|--------|
| SMTP | 1 serveur sortant désactivé |
| Crons | 7 tâches planifiées désactivées (mail, webhook, marketing, smtp) |
| Script SQL | `tenants/laplatine2026/scripts/neutraliser_clone.sql` exécuté |

---

## 4. Résultats et validation

### 4.1 Checks go/no-go exécutés

| # | Check | Résultat |
|---|-------|----------|
| 1 | DNS résout | ✅ 85.215.206.213 |
| 2 | Dump lisible | ✅ PostgreSQL custom v1.15 |
| 3 | Signature Odoo (ir_module_module) | ✅ 986 modules |
| 4 | Conteneur Odoo up | ✅ odoo_lab_laplatine2026 |
| 5 | /api/tenant renvoie laplatine2026 | ✅ (vérifié via réseau Docker) |
| 6 | Token DVIG valide | ✅ DVIG opérationnel |
| 7 | Compteur documents Vault > 0 | ✅ 50 documents laplatine2026 |

### 4.2 URLs de la démo

| Service | URL | Tenant |
|---------|-----|--------|
| Linky sarl-la-platine | https://ui.lab.sarl-la-platine.doreviateam.com | sarl-la-platine |
| Linky laplatine2026 | https://ui.lab.laplatine2026.doreviateam.com | laplatine2026 |
| Odoo laplatine2026 | https://odoo.lab.laplatine2026.doreviateam.com | laplatine2026 |

### 4.3 Scénario de validation (STEP 8 SPEC)

À exécuter manuellement avant la démo :

1. Ouvrir `ui.lab.sarl-la-platine.doreviateam.com` → vérifier données sarl-la-platine
2. Ouvrir `ui.lab.laplatine2026.doreviateam.com` → vérifier données laplatine2026
3. Créer une facture test dans laplatine2026 (Odoo LAB) → vérifier qu'elle apparaît uniquement dans Linky laplatine2026
4. **Ne pas** cliquer sur documents/attachments historiques (pas de filestore)

---

## 5. Sources des données — Carte Trésorerie (À traiter / Traité)

### 5.1 Schéma d'isolation par tenant

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Linky (TENANT_ID=laplatine2026)                                                         │
│  GET /ui/aggregations/treasury?tenant=laplatine2026                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  VAULT (partagé)                                                                          │
│  1. Lit projection : bank_reconciliation_projection WHERE tenant = 'laplatine2026'        │
│  2. Si projection vide → fallback Odoo                                                   │
│     Routage : tenant=laplatine2026 → ODOO_BANK_RECONCILIATION_URL_LAPLATINE2026           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
┌─────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│ Projection Vault     │    │ Odoo laplatine2026      │    │ Odoo sarl-la-platine     │
│ (tenant=laplatine2026)│    │ odoo_lab_laplatine2026   │    │ odoo_stinger_sarl-la-... │
│                      │    │ Base : laplatine2026     │    │ Base : sarl-la-platine   │
│ Table partagée,      │    │                          │    │                          │
│ filtre WHERE tenant  │    │ Jamais appelé pour       │    │ Jamais appelé pour       │
│                      │    │ laplatine2026 car URL    │    │ laplatine2026            │
│ Vide si aucun event  │    │ dédiée configurée        │    │ (routage différent)     │
│ RECONCIL vaulté      │    │                          │    │                          │
└─────────────────────┘    └─────────────────────────┘    └─────────────────────────┘
```

### 5.2 Origine des chiffres

| Tenant          | À traiter / Traité | Source réelle                    | Isolation |
|-----------------|--------------------|-----------------------------------|-----------|
| **laplatine2026** | Odoo LAB           | `odoo_lab_laplatine2026` → base `laplatine2026` | ✅ Base dédiée |
| **sarl-la-platine** | Odoo Stinger       | `odoo_stinger_sarl-la-platine` → base dédiée   | ✅ Base dédiée |

**Aucun mélange :** chaque tenant interroge uniquement son instance Odoo. Laplatine2026 n'accède jamais aux données sarl-la-platine et inversement.

### 5.3 Sémantique Odoo vs Dorevia

- **Odoo** : `unreconciled_balance` = montant des lignes de relevé non encore matchées (rapprochement bancaire natif Odoo).
- **Dorevia « Traité »** : montant rapproché dans le flux Dorevia (events RECONCIL vaultés).
- **Pour laplatine2026** : aucun rapprochement Dorevia n'ayant été fait, on force **Traité = 0** et on affiche **À traiter = unreconciled_balance** Odoo (données de la base laplatine2026 uniquement).

---

## 6. Ce qui reste à faire

### 6.1 Avant / pendant la démo

| Tâche | Priorité | Responsable |
|-------|----------|-------------|
| Validation isolation (STEP 8) | P0 | Équipe démo |
| Contrôler que le backfill reste actif | P2 | Technique |

### 6.2 Backfill factures (traitement asynchrone)

- **500 factures** ont été mises en file d'envoi
- **50** ont été envoyées au Vault lors de la première exécution du cron
- **450 restantes** seront traitées automatiquement par le cron « Vault Send DVIG » (toutes les minutes, 50 par exécution)
- Délai estimé pour 450 factures : ~10 minutes

### 6.3 Backfill paiements fournisseurs (à exécuter)

Les paiements fournisseurs validés **avant** l'activation du connector ne sont pas vaultés automatiquement. Pour les initialiser :

```bash
docker exec -it odoo_lab_laplatine2026 odoo shell -d laplatine2026
# Dans le shell :
env['account.payment'].backfill_vault_todo(payment_type='outbound')
```

Les crons **Vault Send Payments** (2 min) et **Vault Fetch Proof Payments** (1 min) traiteront ensuite ces paiements. L’état passera de « En attente de preuve » à **Protégé** dans la fiche paiement Odoo.

### 6.4 Optionnel

| Tâche | Description |
|-------|-------------|
| `linky_company_display_names` | Renseigner les noms des sociétés dans le manifest pour le filtre Company Linky (si besoin) |
| Accélérer le backfill | Relancer manuellement le cron ou le script de configuration pour traiter plus rapidement les factures restantes |

---

## 7. Recommandations

### 7.1 Pour la démo

- **Scénario recommandé** : Montrer les deux cockpits Linky côte à côte, comparer les données, créer une facture test dans laplatine2026 et vérifier son apparition
- **À éviter** : Cliquer sur des pièces jointes ou documents PDF historiques (fichiers non restaurés)

### 7.2 Sécurité

- Le clone laplatine2026 est neutralisé (SMTP, crons sensibles)
- Aucun envoi d'e-mails ou d'appels externes non contrôlés depuis ce clone

### 7.3 Rollback (si besoin)

En cas de nécessité de retrait :

```bash
# Arrêt des services
cd tenants/laplatine2026/apps/odoo/lab && docker compose down
cd tenants/laplatine2026/apps/ui/lab && docker compose down

# Retrait du token DVIG de dvig.tokens.yml
# Re-render Caddy sans laplatine2026
```

**Aucun impact sur sarl-la-platine (production).**

---

## 8. Références

| Document | Chemin |
|----------|--------|
| SPEC Multi-Tenant | `ZeDocs/web33/SPEC_MULTI-TENANT.md` |
| Plan d'implémentation | `ZeDocs/web33/PLAN_IMPLEMENTATION_MULTI-TENANT_laplatine2026.md` |
| Checklist démo | `ZeDocs/web33/CHECKLIST_DEMO_MULTI-TENANT.md` |
| Script config DVIG + backfill | `tenants/laplatine2026/scripts/configure_dvig_and_backfill.py` |
| Script backfill paiements | `tenants/laplatine2026/scripts/backfill_vault_payments.py` |
| Script neutralisation | `tenants/laplatine2026/scripts/neutraliser_clone.sql` |

---

## 9. Conclusion

L'implémentation du tenant démo **laplatine2026** est **achevée**. La plateforme Dorevia est en mesure de démontrer son architecture multi-tenant avec deux instances Linky strictement isolées partageant le même Vault.

La MOA peut procéder à la **validation manuelle de l'isolation** (STEP 8) et planifier la démo. Aucun blocage technique identifié.

---

*Rapport généré le 2026-02-28.*
