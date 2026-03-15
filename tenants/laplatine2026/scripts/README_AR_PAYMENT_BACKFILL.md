# Backfill Délai moyen de paiement (AR Payment History)

Alimente la table Vault `ar_payment_history` pour que le **délai moyen de paiement** soit calculé par partenaire (colonne « Délai moy. paiement » dans Linky, au lieu de « n.d. »).

## Prérequis

- Vault déployé avec la migration **041_ar_payment_history** appliquée.
- Route Vault : `POST /ui/ar-payment-history/backfill`.
- Odoo avec factures clients (out_invoice) **payées** sur les 12 derniers mois.

## Exécution (shell Odoo)

**Option A — Script automatique (si le shell Odoo démarre correctement)**

```bash
cd /opt/dorevia-plateform/tenants/laplatine2026/scripts
chmod +x run_backfill_ar_payment_history.sh
./run_backfill_ar_payment_history.sh
```

**Option B — Exécution manuelle**

1. Copier le script dans le conteneur :  
   `docker cp .../backfill_ar_payment_history.py odoo_lab_laplatine2026:/tmp/`

2. Ouvrir le shell Odoo :  
   `docker exec -it odoo_lab_laplatine2026 odoo shell -d laplatine2026`

3. Dans le shell Python :  
   `exec(open("/tmp/backfill_ar_payment_history.py").read())`

**Note :** Si le shell Odoo affiche une erreur du type *Model 'hr.payslip' does not exist in registry*, le chargement des modules Odoo échoue (problème de dépendances, sans lien avec ce script). Il faut corriger l’environnement Odoo (modules manquants ou conflits), puis relancer le backfill.

Le script :

1. Récupère les factures clients **payées** des 12 derniers mois (date d’échéance + date de paiement).
2. Envoie les lignes au Vault via `POST /ui/ar-payment-history/backfill`.

Après exécution, rafraîchir la carte Business Linky : les partenaires avec au moins 3 factures payées sur 12 mois afficheront un **délai moyen de paiement** en jours au lieu de « n.d. ».

## Paramètres

- **TENANT** : `laplatine2026` (ou `ir.config_parameter` `dorevia.tenant`).
- **COMPANY_ID** : `odoo:1` (ou `env.company.id` dans le shell).
- **VAULT_URL** : URL du Vault (ex. `http://vault-core-stinger:8080`), depuis `dorevia.vault.url` ou variable d’environnement.

## Format API Vault

```json
POST /ui/ar-payment-history/backfill
{
  "tenant": "laplatine2026",
  "company_id": "odoo:1",
  "rows": [
    {
      "partner_id": "42",
      "partner_name": "Client ABC",
      "odoo_invoice_id": 1001,
      "invoice_date_due": "2025-06-15",
      "payment_date": "2025-07-02"
    }
  ]
}
```

Réponse : `{ "ok": true, "upserted": 123 }`.
