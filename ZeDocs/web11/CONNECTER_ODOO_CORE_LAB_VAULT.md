# Connecter Odoo core lab à Dorevia Vault

**Objectif** : que les factures validées (posted) sur **Odoo lab core** soient envoyées vers **DVIG** puis **Vault** (preuve horodatée).

**Chaîne** : Odoo (facture postée) → **DVIG** (ingest) → **Vault** (preuve).

---

## 1. Prérequis

- **Odoo core lab** : https://odoo.lab.core.doreviateam.com (déjà en place).
- **DVIG** : https://dvig.core.doreviateam.com (doit être déployé pour le tenant `core`).
- **Vault** : https://vault.core.doreviateam.com (doit être déployé pour le tenant `core`).
- **Module Odoo** : `dorevia_vault_connector` (présent dans `units/odoo/custom-addons/` et monté dans le conteneur Odoo).

---

## 2. Créer un token DVIG pour Odoo lab core

La source au format `unit.env.tenant` pour Odoo lab core est : **`odoo.lab.core`**.

Sur la machine plateforme (où tourne `dorevia.sh`) :

```bash
bin/dorevia.sh token issue odoo lab core
```

- Crée (ou complète) `tenants/core/secrets/dvig.tokens.yml` avec un token actif pour la source `odoo.lab.core`.
- Recharge DVIG si nécessaire.
- **Affiche une seule fois** le token brut (ex. `dvig_xxxx...`) : **le copier tout de suite** pour le mettre dans Odoo (étape 4).

Si un token existe déjà pour `odoo.lab.core`, la commande refuse sauf avec `--force`. Pour lister les tokens :  
`bin/dorevia.sh token list core`.

---

## 3. Installer le module dans Odoo

1. Se connecter à **https://odoo.lab.core.doreviateam.com** (compte admin).
2. **Paramètres** (ou **Apps**) → **Mettre à jour la liste des applications** (mode développeur si besoin).
3. Rechercher **« Dorevia Vault Connector »** (ou `dorevia_vault_connector`).
4. **Installer** le module.

---

## 4. Configurer les paramètres système Odoo

**Paramètres → Technique → Paramètres → Paramètres système** (ou **Configuration → Paramètres** selon version).

Ajouter ou modifier :

| Clé | Valeur | Obligatoire |
|-----|--------|-------------|
| `dorevia.dvig.url` | `https://dvig.core.doreviateam.com` | ✅ Oui |
| `dorevia.dvig.token` | *(token affiché à l’étape 2)* | ✅ Oui |
| `dorevia.dvig.source` | `odoo.lab.core` | ✅ Oui |
| `dorevia.vault.url` | `https://vault.core.doreviateam.com` | Optionnel (récup. preuves) |
| `dorevia.vault.token` | *(si Vault exige un Bearer)* | Optionnel |

**Format de la source** : `unit.env.tenant` → pour Odoo lab core = **`odoo.lab.core`**.

---

## 5. Vérifications

1. **DVIG / Vault** : Vérifier que DVIG et Vault sont bien démarrés pour le tenant `core` et accessibles depuis le serveur Odoo (réseau / DNS).
2. **Token** : Le token DVIG doit être actif pour la source `odoo.lab.core` dans `tenants/core/secrets/dvig.tokens.yml`.
3. **Odoo** : Après configuration, valider une facture (action « Valider ») : elle doit passer en statut `todo` puis `pending_proof` puis `vaulted` (CRON toutes les 5 min). Vérifier dans la fiche facture le bloc « Dorevia Vault » et les logs Odoo (`vault`, `dvig`).

---

## 6. Résumé

| Étape | Action |
|-------|--------|
| 1 | DVIG + Vault déployés pour `core` |
| 2 | `bin/dorevia.sh token issue odoo lab core` → copier le token |
| 3 | Installer le module `dorevia_vault_connector` dans Odoo |
| 4 | Paramètres Odoo : `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.dvig.source` = `odoo.lab.core` |
| 5 | Tester en validant une facture et en vérifiant le statut vault |

**Références** : `units/odoo/custom-addons/dorevia_vault_connector/README.md`, `sources/vault/docs/CONNECTEUR_ODOO_SPEC1.md`.
