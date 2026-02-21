# Dorevia Vault Connector

**Version** : 1.2.2  
**Module Odoo** : Connecteur vaulting factures (DVIG) et paiements (Vault direct) vers Dorevia Vault

---

## 📋 Description

Ce module vaultériser automatiquement les factures (`account.move`) en état `posted` vers Dorevia Vault via DVIG, conformément à la **SPEC v1.1**.

### Fonctionnalités v1.1

- ✅ **Machine d'état complète** : todo, pending_proof, vaulted, failed_soft, failed_hard
- ✅ **Vaulting 100% asynchrone** : Aucun appel réseau dans `action_post()`
- ✅ **CRON #1** : Envoi DVIG automatique (toutes les 5 min)
- ✅ **CRON #2** : Récupération preuve automatique (toutes les 5 min)
- ✅ **Idempotence garantie** : Clé SHA256 pour éviter les doublons
- ✅ **Backoff exponentiel** : Retry intelligent avec délais progressifs
- ✅ **Classification erreurs** : Distinction failed_soft (retry) vs failed_hard (blocage)
- ✅ **Observabilité native** : Métriques automatiques (total_sent, success, failed_soft, failed_hard, backlog)
- ✅ **Interface utilisateur** : Bloc informatif avec statut, mode debug pour admins
- ✅ **Support** : `out_invoice`, `in_invoice`, `out_refund`, `in_refund`

### Fonctionnalités v1.2.0 (paiements)

- ✅ **Vaulting des paiements** : Envoi à Vault `POST /api/v1/payments` à la validation du paiement (`account.payment`)
- ✅ **Vue formulaire** : Bloc « Sécurité du paiement » sur les paiements clients/fournisseurs (aligné factures)
- ✅ **Téléchargement attestation** : Bouton « Télécharger l'attestation » pour les paiements protégés
- ✅ **Configuration** : `dorevia.vault.url` (obligatoire pour paiements), `dorevia.vault.token`, `dorevia.vault.tenant`

### Fonctionnalités v1.2.2 (alignement spec payments v1.1)

- ✅ **Bouton « Remettre en brouillon »** : Masqué lorsque le paiement est en `in_process` ou `paid` (SPEC §10.2)
- ✅ **États éligibles au vault** : `posted`, `paid`, `in_process` (constat POS/Account, SPEC §10.1)
- ✅ **Cron rattrapage** : `cron_vault_send_payments` (toutes les 5 min) pour envoyer au Vault les paiements déjà validés non encore vaultés

---

## 🔄 Mise à jour du module

Après avoir mis à jour le code du module (version 1.2.0 ou supérieure) :

**Option 1 — Interface Odoo**  
Applications → Dorevia Vault Connector → bouton **Mettre à jour** (ou « Upgrade »).

**Option 2 — Ligne de commande (Docker)**  
Depuis la racine du projet, en adaptant `<tenant>` et `<database>` :

```bash
# Exemple : tenant sarl-la-platine, base odoo_stinger_sarl-la-platine
cd tenants/sarl-la-platine/apps/odoo/stinger   # ou lab selon l'env
docker compose run --rm odoo odoo -c /etc/odoo/odoo.conf -d odoo_stinger_sarl-la-platine -u dorevia_vault_connector --stop-after-init
```

**Option 3 — Script existant**  
```bash
./scripts/deploy_spec_v1_1_1.sh odoo_stinger_sarl-la-platine staging
```

Après mise à jour, configurer `dorevia.vault.url` (et optionnellement `dorevia.vault.token`, `dorevia.vault.tenant`) pour activer le vaulting des paiements.

---

## ⚙️ Configuration

### Paramètres système requis

Configurer dans **Paramètres → Technique → Paramètres → Paramètres Système** :

| Clé | Description | Exemple | Obligatoire |
|-----|-------------|---------|-------------|
| `dorevia.dvig.url` | URL du DVIG | `https://dvig.core-stinger.doreviateam.com` | ✅ Oui |
| `dorevia.dvig.token` | Token Bearer pour authentification | `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g` | ✅ Oui |
| `dorevia.dvig.source` | Source au format `unit.env.tenant` | `odoo.stinger.sarl-la-platine` | ✅ Oui |
| `dorevia.vault.url` | URL du Vault (preuves + **paiements** v1.2) | `https://vault.core-stinger.doreviateam.com` | ✅ Oui pour paiements |
| `dorevia.vault.token` | Token Bearer pour authentification Vault (si requis) | `vault_token_...` | ⚠️ Optionnel |
| `dorevia.vault.tenant` | Tenant par défaut (paiements ; sinon dérivé de la société) | `core`, `sarl-la-platine` | ⚠️ Optionnel |

### Format de la source

La source doit être au format : `unit.env.tenant`

- **unit** : Identifiant de l'unité émettrice (ex: `odoo`)
- **env** : Environnement (ex: `stinger`, `lab`, `prod`)
- **tenant** : Identifiant du tenant (ex: `sarl-la-platine`)

**Exemples** :
- `odoo.stinger.sarl-la-platine`
- `odoo.lab.core`
- `odoo.prod.core`

---

## 🔄 Fonctionnement (SPEC v1.1)

### Flux de vaulting asynchrone

1. **Validation de facture** : L'utilisateur valide une facture (`action_post()`)
2. **Initialisation** : Le système initialise `dorevia_vault_status='todo'` (aucun appel réseau)
3. **CRON #1** (toutes les 5 min) : Envoi vers DVIG
   - Sélection : `status IN (todo, failed_soft)` ET `next_retry_at <= now()`
   - Batch : 50 max
   - Succès : `status = pending_proof`, stockage `event_id`
   - Échec : Classification + backoff
4. **CRON #2** (toutes les 5 min) : Récupération preuve depuis Vault
   - Sélection : `status = pending_proof`
   - Batch : 50 max
   - Succès : `status = vaulted`, stockage preuves
   - Échec : Classification + backoff (si soft)
5. **Finalisation** : Statut `vaulted` avec toutes les preuves stockées

**Aucune intervention utilisateur requise** ✅

### Format du payload DVIG

```json
{
  "source": {
    "unit": "odoo",
    "tenant": "sarl-la-platine",
    "env": "stinger",
    "component": "account.move",
    "connector": "dorevia-vault-connector",
    "version": "1.0.0"
  },
  "event": {
    "type": "invoice.posted",
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "occurred_at": "2026-01-10T14:30:00.123456+00:00"
  },
  "data": {
    "move_id": 1,
    "move_name": "FAC/2026/00001",
    "move_type": "out_invoice",
    "state": "posted",
    "invoice_date": "2026-01-10",
    "amount_total": 1000.00,
    "currency_name": "EUR",
    ...
  }
}
```

---

## 📦 Dépendances

- `base` : Module de base Odoo
- `account` : Module comptabilité Odoo
- `dorevia_posted_lock` : Pour le champ `dorevia_vaulted`

---

## 🚀 Installation

1. **Copier le module** dans `custom-addons/`
2. **Mettre à jour la liste des modules** : Paramètres → Applications → Mettre à jour la liste des applications
3. **Installer le module** : Rechercher "Dorevia Vault Connector" et installer
4. **Configurer les paramètres** : Voir section Configuration ci-dessus

---

## 🐛 Dépannage

### La facture n'est pas vaultée

**Vérifications** :
1. ✅ Le module est installé et activé
2. ✅ Les 3 paramètres `dorevia.dvig.*` sont configurés
3. ✅ Le format de `dorevia.dvig.source` est correct (`unit.env.tenant`)
4. ✅ Le token DVIG est valide
5. ✅ L'URL DVIG est accessible depuis Odoo

**Logs** :
- Vérifier les logs Odoo pour les erreurs de vaulting
- Rechercher "Erreur lors du vaulting" ou "Erreur DVIG"

### Erreur d'authentification (401)

- Vérifier que `dorevia.dvig.token` est correct
- Vérifier que le token est actif dans `dvig.tokens.yml`

### Erreur de validation (400)

- Vérifier le format de `dorevia.dvig.source`
- Vérifier que la source correspond au token (tenant/univers)

---

## 📚 Documentation

- **Guide utilisateur** : `GUIDE_VAULTING_AUTO_v1.1.md`
- **Documentation technique** : `DOCUMENTATION_TECHNIQUE_v1.1.md`
- **Migration v1.0 → v1.1** : `MIGRATION_V1.0_TO_V1.1.md`
- **Attestation (comptable / responsable financier / contrôleur fiscal)** : `ATTESTATION_USAGE_COMPTABLE_FISCAL.md`
- **Compte rendu session 2026-02-09 (spec payments, Vault, Linky)** : `ZeDocs/web14/COMPTE_RENDU_SPEC_PAYMENTS_VAULT_LINKY_2026-02-09.md`

## 📝 Notes

- Le vaulting est **100% asynchrone** : aucun appel réseau dans `action_post()`
- Les erreurs sont loggées et gérées automatiquement (retry avec backoff)
- Le champ `dorevia_vaulted` est mis à jour uniquement en cas de succès (rétrocompatibilité)
- Les informations détaillées du vault sont automatiquement récupérées par CRON #2
- Les boutons manuels sont masqués par défaut (mode debug pour admins uniquement)
- L'idempotence est garantie via clé SHA256 (pas de doublons)

## 🔄 Migration v1.0 → v1.1

Après mise à jour du module, exécuter la migration :

```python
env['account.move'].migrate_vault_status_v1_1()
```

Voir `MIGRATION_V1.0_TO_V1.1.md` pour les détails.

---

**Version** : 1.2.2  
**Date** : 2026-02-09  
**Auteur** : Dorevia Team
