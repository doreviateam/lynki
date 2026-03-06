# Configuration CRON Expected Counts Push (Phase DVIG)

**CRON :** « Expected Counts Push (Phase DVIG) » — `ir_cron_expected_counts_push`  
**Fichier :** `units/odoo/custom-addons/dorevia_vault_connector/data/ir_cron.xml`  
**Fréquence :** 2 minutes

---

## Paramètres Odoo requis

Le CRON appelle `dorevia.dvig.service.push_expected_counts()`. Paramètres lus via `ir.config_parameter` :

| Clé | Obligatoire | Description | Défaut si vide |
|-----|-------------|-------------|----------------|
| `dorevia.dvig.url` | ✅ | URL base DVIG (sans slash final) | — |
| `dorevia.dvig.internal.token` | ✅* | Token Bearer pour POST /internal/expected-counts | Fallback : `dorevia.dvig.token` |
| `dorevia.dvig.token` | ✅* | Token Bearer (si internal.token non défini) | — |
| `dorevia.tenant` | ✅* | Tenant ID (ex. `core`, `sarl-la-platine`) | Fallback : `dorevia.vault.tenant` puis `dorevia.dvig.source` (dernier segment) |
| `dorevia.vault.tenant` | Optionnel | Alternative à dorevia.tenant | — |
| `dorevia.dvig.source` | Optionnel | Source au format `unit.env.tenant` ; tenant dérivé si dorevia.tenant vide | — |

\* Au moins un token (internal ou classique) et un moyen d'obtenir le tenant doivent être configurés.

---

## Où configurer

**Odoo** → **Paramètres** → **Technique** → **Paramètres** → **Paramètres système**

Ou via requête :

```
UPDATE ir_config_parameter SET value = 'https://dvig.xxx.doreviateam.com' WHERE key = 'dorevia.dvig.url';
UPDATE ir_config_parameter SET value = 'dvig_xxx_TOKEN' WHERE key = 'dorevia.dvig.internal.token';
UPDATE ir_config_parameter SET value = 'core' WHERE key = 'dorevia.tenant';
```

---

## Vérification

1. **Logs Odoo** : Si `push_expected_counts_skip: dvig url ou token manquant` → config incomplète.
2. **Linky** : Si « X / — preuves » (Y absent) → CRON n'alimente pas ou config manquante.
3. **Actions planifiées** : CRON « Expected Counts Push (Phase DVIG) » doit être **Actif**.

---

## Références

- `units/odoo/custom-addons/dorevia_vault_connector/models/dorevia_dvig_service.py` (méthode `push_expected_counts`)
- SPEC_ALIMENTATION_EXPECTED_COUNTS_DVIG_v1.0.md
