# Resultats reset Vault DB lab + campagnes SLA (2026-03-09)

## Perimetre execute

1. Reset Vault DB lab (volume PostgreSQL Vault).
2. Remigration automatique au redemarrage Vault.
3. Relance des evenements en echec (lot 107-126, dont 17 anciens `failed_soft`).
4. Campagne de validation 20.
5. Campagnes SLA 100 puis 500.

## Etat plateforme apres reset

- `vault-db-core-stinger`: healthy.
- `vault-core-stinger`: healthy.
- Migrations appliquees jusqu'a `040_expected_counts_generated_at`.
- Routes de vaulting actives: `/api/v1/payments`, `/api/v1/proof/*`, etc.
- Verification endpoints:
  - `GET /health` -> `200`
  - `GET /api/v1/payments` -> `405` (normal sur GET)

## Relance des 17 evenements + lot 20 (IDs 107-126)

- DVIG outbox:
  - `forwarded = 20`
  - `failed_soft = 0`
- Odoo:
  - `vaulted = 20 / 20`
- Vault:
  - Ingestions confirmees dans les logs sans erreur storage.

## Campagne 100 (IDs 127-226)

- DVIG outbox: `forwarded = 100`
- Odoo: `vaulted = 100`
- SLA ERP event captured -> Vault sealed:
  - P50: `583.57 ms`
  - P95: `1013.15 ms`
  - P99: `1040.50 ms`
  - Min: `67.82 ms`
  - Max: `1058.12 ms`
  - Mean: `568.69 ms`

## Campagne 500 (IDs 227-726)

- DVIG outbox: `forwarded = 500`
- Odoo: `vaulted = 500`
- SLA ERP event captured -> Vault sealed:
  - P50: `567.52 ms`
  - P95: `1017.96 ms`
  - P99: `1055.40 ms`
  - Min: `68.19 ms`
  - Max: `1074.30 ms`
  - Mean: `565.50 ms`

## Controle global o19 (payment.posted)

- DVIG outbox: `forwarded = 728`
- Aucun `failed_soft` restant.

## Conclusion

- Le blocage storage PostgreSQL est contourne par reset lab propre.
- Le pipeline ERP -> DVIG -> Vault est de nouveau stable.
- Objectif SLA `ERP event captured -> Vault sealed <= 5 s` largement respecte en P95 sur 100 et 500 evenements.

## Addendum post-recette MOA (2026-03-09)

- Apres les campagnes SLA, les donnees de test Odoo `SLA-*` ont ete retirees pour revenir a un environnement de demonstration metier.
- Etat fonctionnel retenu pour la recette cockpit:
  - Paiements: `4 387,00 EUR` total, `996,00 EUR` rapproche, `3 391,00 EUR` a rapprocher.
  - Tresorerie: `Position validee (Vault) = 996,00 EUR`.
