# Implémentation Vault — Ventilation paiements espèces vs banque

**Date**: 2026-02-28  
**Objectif**: Distinguer les paiements en espèces et en banque dans le Vault / Linky.

## Changements réalisés

### 1. Odoo — `dorevia_vault_connector`
- **Fichier**: `models/account_payment.py`
- **P0.2** : Mapping journal + payment_method (minuscule) :
  - `journal_id.type == 'cash'` → `method: 'cash'`
  - `payment_method.code == 'check'` → `method: 'check'`
  - bank/general/autre → `method: 'transfer'`
  - (card non identifié sans config dédiée → transfer)

### 2. Vault
- **models/aggregations.go**: `ByMethod map[string]float64`
- **storage/aggregations_payments.go**: `LOWER(COALESCE(NULLIF(TRIM(...), ''), 'transfer'))` pour null/absent/casse
- **handlers/payments.go**: Normalisation minuscule à l'ingestion

### 3. Linky
- **types/aggregations.ts**: `by_method?: Record<string, number>`
- **FluxCashCard.tsx**: Libellés **"Espèces / Virements"** (jamais "Banque") + Chèques si pertinent
- Message rétroactivité : "Ventilation espèces/virements disponible pour les paiements postérieurs au 2026-02-28" si données anciennes

## Images Docker

| Composant | Image |
|----------|-------|
| Vault | `dorevia/vault:cash-bank-method-2026-02-28` |
| Linky | `dorevia/linky:cash-bank-method-2026-02-28` |

## Déploiement

Fichiers mis à jour :
- `tenants/core-stinger/platform/docker-compose.yml` (Vault)
- `tenants/sarl-la-platine/platform/docker-compose.yml` (Vault)
- `tenants/sarl-la-platine/apps/ui/lab/docker-compose.yml` (Linky)
- `tenants/sarl-la-platine/apps/ui/stinger/docker-compose.yml` (Linky)

### Commandes de déploiement

```bash
# Platform (Vault partagé)
./bin/dorevia.sh platform up stinger core-stinger

# UI Linky (sarl-la-platine)
./bin/dorevia.sh app up ui lab sarl-la-platine
# ou
./bin/dorevia.sh app up ui stinger sarl-la-platine
```

### Odoo (addon)

Le connecteur Vault est dans `units/odoo/custom-addons/dorevia_vault_connector`.  
Redémarrer Odoo ou mettre à jour l’addon pour appliquer la dérivation `method` :

```bash
# Redémarrage Odoo après mise à jour du code
./bin/dorevia.sh app restart odoo stinger sarl-la-platine
```

## Données existantes

Les paiements déjà enregistrés avant cette mise à jour conservent `method: 'transfer'`.  
Seuls les **nouveaux paiements** postés après le redémarrage d’Odoo bénéficieront de la ventilation correcte (cash/transfer).

## API Vault

Les endpoints `GET /ui/aggregations/payments-in` et `payments-out` retournent désormais :

```json
{
  "total": 15000,
  "payment_count": 42,
  "by_method": {
    "cash": 2000,
    "transfer": 13000,
    "check": 500
  },
  "series": [...]
}
```

## Checklist de validation (P0.2)

- [ ] Poster 1 paiement sur journal cash → Vault `method` = `cash` → Linky « Espèces » varie
- [ ] Poster 1 paiement sur journal bank → `method` = `transfer` → Linky « Virements » varie
- [ ] Vérifier qu’un paiement ancien sans `method` ne casse pas l’API (fallback `transfer`)
- [ ] Vérifier la casse : envoi `Cash` → stocké `cash`
