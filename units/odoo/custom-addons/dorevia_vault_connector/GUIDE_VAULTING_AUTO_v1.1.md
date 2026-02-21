# 📘 Guide Utilisateur — Dorevia Vaulting Automatique v1.1

**Version** : 1.0  
**Date** : 2026-01-11  
**Module** : `dorevia_vault_connector`

---

## 🎯 Vue d'Ensemble

Le module **Dorevia Vault Connector v1.1** vaultériser automatiquement les factures (`account.move`) en état `posted` vers Dorevia Vault via DVIG, de manière **100% asynchrone** et **transparente** pour l'utilisateur.

**Philosophie** : *La sécurité doit être invisible pour l'utilisateur.*

---

## 🔄 Fonctionnement Automatique

### Flux de Vaulting

1. **Validation de facture** : L'utilisateur valide une facture (`action_post()`)
2. **Initialisation** : Le système initialise automatiquement le statut `todo` (aucun appel réseau)
3. **CRON #1** (toutes les 5 min) : Envoi vers DVIG
4. **CRON #2** (toutes les 5 min) : Récupération de la preuve depuis Vault
5. **Finalisation** : Statut `vaulted` avec stockage des preuves

**Aucune intervention utilisateur requise** ✅

---

## 📊 Statuts du Vaulting

### Machine d'État

| Statut | Description | Action |
|--------|-------------|--------|
| **todo** | À traiter | CRON #1 enverra vers DVIG |
| **pending_proof** | En attente de preuve | CRON #2 récupérera la preuve |
| **vaulted** | Vaulté avec succès | ✅ Finalisé |
| **failed_soft** | Échec temporaire | Retry automatique avec backoff |
| **failed_hard** | Échec définitif | ❌ Pas de retry (vérifier configuration) |

### Affichage dans l'Interface

Le statut est affiché dans l'onglet **"Autres informations"** de la facture :

- ✅ **Vaulté** : Message vert avec informations détaillées
- ⏳ **En cours** : Message bleu (todo ou pending_proof)
- ⚠️ **Échec temporaire** : Message orange (failed_soft)
- ❌ **Échec définitif** : Message rouge (failed_hard)

---

## 🔍 Informations Affichées

### Pour les Utilisateurs

- **Statut** : État actuel du vaulting
- **Date de vault** : Date et heure du vaulting réussi
- **Hash SHA256** : Hash du document vaulté
- **Vault ID** : Identifiant unique dans Dorevia Vault
- **Hash Ledger** : Hash dans le ledger (si disponible)
- **Preuve JWS** : Preuve cryptographique (si disponible)

### Mode Debug (Admins uniquement)

Les administrateurs voient également :

- **Dernière tentative** : Date/heure de la dernière tentative
- **Nombre de tentatives** : Compteur de tentatives
- **Prochaine tentative** : Date/heure de la prochaine tentative (backoff)
- **DVIG Event ID** : Identifiant de l'événement DVIG
- **Clé d'idempotence** : Clé SHA256 pour éviter les doublons
- **Dernière erreur** : Message d'erreur détaillé (si échec)

---

## ⚙️ Configuration

### Paramètres Système Requis

Configurer dans **Paramètres → Technique → Paramètres → Paramètres Système** :

| Clé | Description | Exemple | Obligatoire |
|-----|-------------|---------|-------------|
| `dorevia.dvig.url` | URL du DVIG | `https://dvig.core-stinger.doreviateam.com` | ✅ Oui |
| `dorevia.dvig.token` | Token Bearer | `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g` | ✅ Oui |
| `dorevia.dvig.source` | Source (format: unit.env.tenant) | `odoo.stinger.sarl-la-platine` | ✅ Oui |
| `dorevia.vault.url` | URL du Vault | `https://vault.core-stinger.doreviateam.com` | ⚠️ Optionnel |
| `dorevia.vault.token` | Token Vault | `vault_token_...` | ⚠️ Optionnel |

### Format de la Source

La source doit être au format : `unit.env.tenant`

- **unit** : Identifiant de l'unité émettrice (ex: `odoo`)
- **env** : Environnement (ex: `stinger`, `lab`, `prod`)
- **tenant** : Identifiant du tenant (ex: `sarl-la-platine`)

**Exemples** :
- `odoo.stinger.sarl-la-platine`
- `odoo.lab.core`
- `odoo.prod.core`

---

## 🔧 Actions Disponibles

### Mode Normal

**Aucun bouton visible** — Le vaulting est 100% automatique.

### Mode Debug (Admins)

Les administrateurs peuvent utiliser :

- **Vault (Debug)** : Vaulting manuel (si statut = todo)
- **Rafraîchir infos Vault (Debug)** : Rafraîchir les informations depuis Vault (si vaulted)

> **Note** : Ces boutons sont uniquement visibles pour les administrateurs (`base.group_system`).

---

## 📈 Métriques et Observabilité

### Métriques Collectées

Le système collecte automatiquement les métriques suivantes :

- **Total envoyé** : Nombre total de factures envoyées vers DVIG
- **Succès** : Nombre de factures vaultées avec succès
- **Échecs temporaires** : Nombre d'échecs temporaires (failed_soft)
- **Échecs définitifs** : Nombre d'échecs définitifs (failed_hard)
- **Backlog** : Nombre de factures en attente de traitement

### Accès aux Métriques

Les métriques sont calculées automatiquement toutes les heures via un CRON dédié.

> **P1** : Dashboard de visualisation des métriques (à venir)

---

## ❓ Questions Fréquentes

### Q : Pourquoi ma facture n'est pas vaultée immédiatement ?

**R** : Le vaulting est **100% asynchrone** pour éviter de bloquer l'utilisateur. Les factures sont traitées par les CRON toutes les 5 minutes.

### Q : Combien de temps faut-il pour vaultériser une facture ?

**R** : En général, une facture est vaultée en **5-10 minutes** :
- CRON #1 (5 min) : Envoi vers DVIG
- CRON #2 (5 min) : Récupération preuve

### Q : Que faire si une facture est en "failed_hard" ?

**R** : Vérifier :
1. La configuration DVIG (URL, token, source)
2. Les logs Odoo pour l'erreur détaillée
3. La connexion réseau vers DVIG/Vault

### Q : Puis-je vaultériser manuellement une facture ?

**R** : Oui, en mode debug (admins uniquement), un bouton "Vault (Debug)" est disponible.

### Q : Les factures sont-elles vaultées plusieurs fois ?

**R** : Non, l'idempotence est garantie via une clé SHA256 unique par facture.

---

## 🚨 Dépannage

### Facture bloquée en "todo"

**Cause** : CRON #1 ne s'exécute pas ou configuration manquante.

**Solution** :
1. Vérifier que les CRON sont actifs (Paramètres → Technique → Automatisation → CRON)
2. Vérifier la configuration DVIG
3. Vérifier les logs Odoo

### Facture bloquée en "pending_proof"

**Cause** : CRON #2 ne récupère pas la preuve ou Vault n'a pas encore traité le document.

**Solution** :
1. Attendre quelques minutes (le Vault peut prendre du temps)
2. Vérifier que l'URL du Vault est configurée
3. Vérifier les logs Odoo

### Erreur "Configuration DVIG incomplète"

**Cause** : Un des paramètres système requis est manquant.

**Solution** :
1. Vérifier les paramètres système (voir section Configuration)
2. Vérifier que `dorevia.dvig.url`, `dorevia.dvig.token`, et `dorevia.dvig.source` sont configurés

---

## 📚 Références

- **SPEC** : `SPEC_DOREVIA_VAULTIG_AUTO_v1.1.md`
- **Migration** : `MIGRATION_V1.0_TO_V1.1.md`
- **Documentation technique** : À venir

---

**Document créé** : 2026-01-11  
**Auteur** : Dorevia Team
