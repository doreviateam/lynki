# SPEC --- Démo Multi-Tenant Linky (P0)

**Version :** v0.1\
**Date :** 28/02/2026\
**Statut :** P0 --- Implémentable / Exécutable\
**Objectif :** Démontrer le multi-tenant backend (Vault partagé) + 2
cockpits Linky mono-tenant

------------------------------------------------------------------------

## 1. Intention

Prouver que la plateforme Dorevia est **multi-tenant**, au sens suivant
:

-   **Vault partagé** (infrastructure mutualisée)\
-   **Partition stricte par `tenant_id`**\
-   **Idempotence tenant-scopée**\
-   **Deux instances Linky** affichant des données strictement isolées

### Démo attendue

-   `ui.lab.laplatine.doreviateam.com` → `TENANT_ID=laplatine`\
-   `ui.lab.laplatine2026.doreviateam.com` → `TENANT_ID=laplatine2026`

------------------------------------------------------------------------

## 2. Périmètre

### Inclus (P0)

-   Provisioning d'un nouveau tenant `laplatine2026`\
-   Restauration d'un backup La Platine dans un Odoo LAB dédié\
-   Configuration DVIG pour ingestion vers Vault sous
    `tenant_id=laplatine2026`\
-   Vérification d'isolement dans Linky

### Exclu (hors P0)

-   Multi-source / multi-base dans un même tenant\
-   Filtres "source/base" dans Linky\
-   Refactor des scripts de backup prod\
-   Optimisation performance / monitoring / alerting

------------------------------------------------------------------------

## 3. Définitions

  -----------------------------------------------------------------------
  Terme                      Définition
  -------------------------- --------------------------------------------
  Tenant (Dorevia)           Partition logique dans Vault identifiée par
                             `tenant_id`

  Instance Linky             UI mono-tenant (variable `TENANT_ID`)
                             pointant vers Vault

  Odoo LAB                   Environnement de restauration et génération
                             d'événements pour la démo
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 4. Nommage & conventions

-   `tenant_id` : `laplatine2026`\
-   Linky UI : `ui.lab.laplatine2026.doreviateam.com`\
-   DB Odoo LAB : `laplatine2026`\
-   Filestore Odoo LAB : `filestore/laplatine2026`

------------------------------------------------------------------------

## 5. Architecture cible P0

    Odoo PROD (laplatine)        ──DVIG──► Vault (shared) ──► Linky (TENANT_ID=laplatine)
    Odoo LAB  (laplatine2026)    ──DVIG──► Vault (shared) ──► Linky (TENANT_ID=laplatine2026)

------------------------------------------------------------------------

## 6. Étapes d'exécution

### STEP 1 --- Provisionner le tenant

-   Créer le tenant `laplatine2026`
-   Générer API key DVIG dédiée
-   Initialiser séquences si nécessaire

### STEP 2 --- Déployer Linky LAB

-   `TENANT_ID=laplatine2026`
-   `VAULT_BASE_URL=...`

### STEP 3 --- Préparer Odoo LAB

-   Créer DB `laplatine2026`
-   Préparer volume filestore correspondant

### STEP 4 --- Restaurer backup

-   Restore dump DB
-   Restore filestore

### STEP 5 --- Neutraliser clone

-   Désactiver SMTP
-   Désactiver crons sensibles
-   Couper intégrations externes

### STEP 6 --- Configurer DVIG

-   `tenant_id=laplatine2026`
-   Endpoint Odoo LAB
-   API key dédiée

### STEP 7 --- Ingestion / Backfill

-   Lancer backfill
-   Vérifier events \> 0

### STEP 8 --- Validation

-   Isolation stricte entre tenants
-   Nouvelle facture test visible uniquement dans `laplatine2026`

------------------------------------------------------------------------

## 7. Definition of Done

1.  Tenant opérationnel côté Vault\
2.  UI fonctionnelle\
3.  Isolation parfaite des données\
4.  Idempotence tenant-scopée validée\
5.  Aucun impact sur prod

------------------------------------------------------------------------

## 8. Plan de rollback

-   Stop DVIG `laplatine2026`
-   Stop Linky `laplatine2026`
-   Suppression tenant si nécessaire
-   Aucun impact sur `laplatine`

------------------------------------------------------------------------

*Document généré automatiquement le 28/02/2026 à 13:46*
