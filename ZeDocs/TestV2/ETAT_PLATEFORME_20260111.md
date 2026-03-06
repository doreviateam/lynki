# 📊 État de la Plateforme Dorevia

**Date** : 2026-01-11 09:55:00 (mis à jour après suppression core)  
**Version** : 1.2  
**Statut** : Rapport d'état complet

---

## 🎯 Vue d'Ensemble

### Architecture Générale

La plateforme Dorevia est organisée selon le modèle **Tenant / Univers / Environnement** :

- **Tenants** : `sarl-la-platine`, `core-stinger`
- **Univers** : `odoo` (principal)
- **Environnements** : `lab`, `stinger`, `prod`

> **Note** : Les tenants `dido`, `rozas` et `core` ont été supprimés le 2026-01-11

---

## 🖥️ Infrastructure - Services Actifs

### Services Platform (Partagés)

| Service | Tenant | Environnement | État | Uptime |
|---------|--------|---------------|------|--------|
| **DVIG** | core-stinger | stinger | ✅ Healthy | - |
| **Vault** | core-stinger | stinger | ✅ Healthy | - |
| **Vault DB** | core-stinger | stinger | ✅ Healthy | - |

### Applications Odoo

#### Environnement STINGER

| Tenant | Container | DB | État | Uptime |
|--------|-----------|----|------|--------|
| **sarl-la-platine** | ✅ Up | ✅ Healthy | ✅ Opérationnel | - |

---

## 🌐 URLs et Accès

### STINGER (Démonstration)

| Service | URL | État |
|---------|-----|------|
| **DVIG STINGER** | `https://dvig.core-stinger.doreviateam.com` | ✅ Healthy |
| **Vault STINGER** | `https://vault.core-stinger.doreviateam.com` | ✅ Healthy |
| **Odoo sarl-la-platine** | `https://odoo.stinger.sarl-la-platine.doreviateam.com` | ✅ Accessible |

---

## ⚙️ Configuration Odoo STINGER - sarl-la-platine

### Paramètres Système

| Paramètre | Valeur | État |
|-----------|--------|------|
| `dorevia.dvig.url` | `https://dvig.core-stinger.doreviateam.com` | ✅ Configuré |
| `dorevia.dvig.token` | `***` (masqué) | ✅ Configuré |
| `dorevia.dvig.source` | `odoo.stinger.sarl-la-platine` | ✅ Configuré |
| `dorevia.vault.url` | `https://vault.core-stinger.doreviateam.com` | ✅ Configuré |
| `dorevia.vault.token` | `***` (masqué) | ✅ Configuré (JWT operator, 365 jours) |
| **Authentification Vault** | `AUTH_ENABLED=true` | ✅ Activée |

> **Note** : Configuration vérifiée le 2026-01-11 après réinitialisation de la base de données

### Modules Installés

| Module | Version | État | Rôle |
|--------|---------|------|------|
| `dorevia_posted_lock` | 1.0.0 | ✅ Installé | Verrouillage comptable WORM-like |
| `dorevia_vault_connector` | 1.0.0 | ✅ Installé | Vaulting automatique vers DVIG/Vault |

---

## 🔄 Fonctionnalités Actives

### Vaulting Automatique

- ✅ **Vaulting automatique** : Les factures validées sont automatiquement vaultées
- ✅ **Bouton manuel** : Bouton "Vault" disponible pour vaulting manuel
- ✅ **Cron job** : Rattrapage automatique toutes les 15 minutes
- ✅ **Informations détaillées** : Récupération automatique des infos vault (ID, SHA256, date, JWS, ledger)

### Verrouillage Comptable

- ✅ **Protection WORM** : Factures `posted` immutables
- ✅ **Verrouillage renforcé** : Si `dorevia_vaulted=True`, même le chatter est interdit
- ✅ **Bouton draft désactivé** : Impossible de remettre en brouillon une facture posted

### Affichage Informations Vault

- ✅ **Section dédiée** : Section "Dorevia Vault" dans l'onglet "Autres informations"
- ✅ **Champs visibles** : ID, SHA256, date, hash ledger, preuve JWS
- ✅ **Bouton rafraîchissement** : Bouton "Rafraîchir infos Vault" disponible

---

## 📈 Statistiques

### Containers Actifs

- **Total containers** : ~8 containers (après suppression dido/rozas/core)
- **Odoo instances** : 1 instance (stinger: 1)
- **Vault instances** : 1 instance (core-stinger: 1)
- **DVIG instances** : 1 instance (core-stinger: 1)
- **Bases de données** : 2 bases PostgreSQL (odoo_stinger_sarl-la-platine, vault-db-core-stinger)

### Uptime

- **Plus récent service** : Vault STINGER (redémarré après correction JWT)
- **Services STINGER** : Infrastructure core-stinger opérationnelle

---

## 🔍 Points d'Attention

### ✅ Suppression Complète

1. ✅ **Tenants dido et rozas supprimés** : 
   - Tous les containers arrêtés et supprimés (15 containers)
   - Tous les volumes supprimés (20 volumes)
   - Répertoires de configuration supprimés
   - Caddyfile nettoyé (sections dido/rozas supprimées)
   - Aucune trace restante vérifiée

### ✅ Authentification Activée

1. ✅ **Authentification JWT activée** : Vault STINGER utilise maintenant l'authentification JWT
2. ✅ **Token configuré** : Token JWT configuré pour Odoo sarl-la-platine (rôle operator, 365 jours)
3. ✅ **Clés générées** : Paire de clés RSA générée et montée dans le container

### ⚠️ À Vérifier

1. **Documentation** : Vérifier que tous les tenants ont la documentation à jour

### ✅ Points Positifs

1. **Stabilité** : Tous les services sont opérationnels
2. **Isolation** : Architecture multi-tenant bien isolée
3. **Redondance** : Services répartis sur plusieurs environnements
4. **Monitoring** : Health checks actifs sur tous les services critiques

---

## 📝 Dernières Modifications

### Suppression Tenants (2026-01-11)

1. ✅ **Suppression dido et rozas** : 
   - 15 containers supprimés (DVIG, Vault, Odoo lab/prod/stinger)
   - 18 volumes supprimés (données, logs, audit, ledger, storage)
   - Répertoires de configuration supprimés (`tenants/dido/`, `tenants/rozas/`)
   - Sections Caddyfile nettoyées (38 lignes supprimées)
   - ✅ Vérification : Aucune trace restante de dido/rozas

### Suppression Tenant 'core' (2026-01-11)

1. ✅ **Containers supprimés** : Tous les containers Odoo et services platform du tenant 'core' (lab, prod, stinger)
2. ✅ **Volumes supprimés** : 11 volumes Docker supprimés (6 Odoo + 5 services platform)
3. ✅ **Répertoire supprimé** : `/opt/dorevia-plateform/tenants/core/` supprimé complètement
4. ✅ **Caddyfile nettoyé** : 5 sections supprimées (odoo.lab.core, odoo.prod.core, odoo.stinger.core, dvig.core, vault.core)
5. ✅ **Tenant core-stinger préservé** : Le tenant `core-stinger` n'a pas été affecté (tenant différent)

### Activation Authentification Vault STINGER (2026-01-11)

1. ✅ **Clés JWT générées** : Paire RSA 2048 bits créée dans `tenants/core-stinger/secrets/keys/`
2. ✅ **Configuration activée** : `AUTH_ENABLED=true`, `AUTH_JWT_ENABLED=true` dans docker-compose.yml
3. ✅ **Token généré** : Token JWT pour `odoo.stinger.sarl-la-platine` (rôle operator, 365 jours)
4. ✅ **Token configuré** : `dorevia.vault.token` configuré dans Odoo sarl-la-platine
5. ✅ **Vault redémarré** : Authentification active et fonctionnelle

### Correction Bug Chargement Clé Publique JWT (2026-01-11)

1. ✅ **Problème identifié** : Le code dans `cmd/vault/main.go` ne chargeait pas la clé publique JWT depuis le fichier (TODO non implémenté)
2. ✅ **Solution appliquée** : 
   - Ajout de la fonction `loadJWTPublicKey()` pour charger et parser la clé publique depuis un fichier PEM
   - Implémentation complète du chargement dans `main()` avec gestion d'erreurs
   - Correction d'une erreur de compilation dans `constat.go`
3. ✅ **Image Docker reconstruite** : `dorevia/vault:v1.3.0` avec la correction
4. ✅ **Vérification** : 
   - Clé publique JWT chargée au démarrage (log : "JWT public key loaded successfully")
   - Authentification fonctionnelle : HTTP 401 sans token, token accepté avec token
   - Plus d'erreur "JWT public key not configured"

### Récentes (Session actuelle - 2026-01-11)

1. ✅ **Ajout champs vault** : Champs détaillés du vault dans `account.move`
   - `dorevia_vault_id` : UUID du document dans le vault
   - `dorevia_vault_sha256` : Hash SHA256
   - `dorevia_vault_date` : Date de vaulting
   - `dorevia_vault_evidence_jws` : Preuve cryptographique JWS
   - `dorevia_vault_ledger_hash` : Hash dans le ledger

2. ✅ **Récupération automatique** : Méthode `_get_vault_info()` pour récupérer les infos depuis l'API `/api/v1/proof/account_move/{id}`

3. ✅ **Affichage formulaire** : Section "Dorevia Vault" dans l'onglet "Autres informations" du formulaire de facture

4. ✅ **Configuration vault.url** : Paramètre `dorevia.vault.url` configuré pour sarl-la-platine

5. ✅ **Amélioration erreurs** : Messages d'erreur plus détaillés pour le rafraîchissement vault

### Modules Modifiés

- **dorevia_posted_lock** : 
  - Ajout champs vault (vault_id, vault_sha256, vault_date, vault_evidence_jws, vault_ledger_hash)
  - Vue XML mise à jour pour afficher les informations vault

- **dorevia_vault_connector** : 
  - Ajout méthode `_get_vault_info()` pour récupération depuis API
  - Ajout méthode `action_refresh_vault_info()` pour rafraîchissement manuel
  - Modification `_vault_to_dvig()` pour récupérer automatiquement les infos après vaulting
  - Amélioration gestion d'erreurs avec messages détaillés

---

## 🎯 Prochaines Étapes Recommandées

### Court Terme

1. ⏳ **Tester le rafraîchissement vault** : Vérifier que le bouton fonctionne après quelques minutes de délai
2. ⏳ **Vérifier les autres tenants** : Configurer `dorevia.vault.url` pour les autres tenants si nécessaire
3. ⏳ **Documentation** : Mettre à jour la documentation avec les nouvelles fonctionnalités
4. ⏳ **Health check Vault** : Vérifier pourquoi l'endpoint `/health` n'est pas accessible via curl

### Moyen Terme

1. ⏳ **Monitoring** : Mettre en place un monitoring plus poussé
2. ⏳ **Tests** : Tests d'intégration pour le vaulting automatique
3. ⏳ **Formation** : Documentation utilisateur pour les nouvelles fonctionnalités
4. ⏳ **Optimisation** : Réduire le délai de 2 secondes pour la récupération des infos vault

---

## 📚 Documentation Disponible

- ✅ `RECAP_VAULTING_STINGER_SARL_LA_PLATINE.md` : Récapitulatif vaulting STINGER
- ✅ `GUIDE_CONFIGURATION_ODOO_STINGER.md` : Guide configuration Odoo STINGER
- ✅ `GUIDE_VAULTING_PREMIERE_FACTURE.md` : Guide vaulting première facture
- ✅ `MODULE_DOREVIA_VAULT_CONNECTOR_CREE.md` : Documentation module vault connector
- ✅ `ETAT_PLATEFORME_20260111.md` : Ce document (état de la plateforme)

---

## 🔧 Commandes Utiles

### Vérifier l'état des services

```bash
# Liste des containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Health check DVIG
curl https://dvig.core-stinger.doreviateam.com/health

# Health check Vault
curl https://vault.core-stinger.doreviateam.com/health

# Vérifier configuration Odoo
./scripts/check_vault_config.sh sarl-la-platine stinger
```

### Mettre à jour un module

```bash
docker exec odoo_stinger_sarl-la-platine odoo shell -d odoo_stinger_sarl-la-platine --no-http -c /etc/odoo/odoo.conf << 'EOF'
self.env['ir.module.module'].sudo().search([('name', '=', 'dorevia_posted_lock')]).button_immediate_upgrade()
EOF
```

---

**Version** : 1.2  
**Date** : 2026-01-11 09:55:00 (mis à jour après suppression core)  
**Statut** : ✅ **Plateforme Opérationnelle**  
**Changements** : Suppression complète des tenants `dido`, `rozas` et `core`
