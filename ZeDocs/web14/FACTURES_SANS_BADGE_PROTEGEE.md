# Factures sans (véritable) protection « Facture protégée » — sarl-la-platine

**Date** : 2026-02-07  
**Contexte** : incohérence entre le badge affiché dans Odoo et la présence réelle dans le Vault.

---

## Incohérence

- **Dans Odoo** : toutes les factures clients postées ont `dorevia_vault_status = 'vaulted'` → **toutes** affichent le badge « Facture protégée ».
- **Dans le Vault** (vault-core-stinger) : seules **28** factures clients existent en base ; **2** factures postées dans Odoo sont **absentes** du Vault.

Donc **2 factures portent le badge « Facture protégée » dans Odoo alors qu’elles ne sont pas enregistrées dans le Vault** : le badge est trompeur pour ces deux numéros.

---

## Factures concernées (sans protection réelle)

Ce sont les factures qui **ne sont pas** réellement protégées (pas de document dans le Vault), même si le badge s’affiche :

| Numéro         | Date facture | Total TTC     | Statut Odoo | Dans le Vault |
|----------------|--------------|---------------|-------------|---------------|
| **FAC/2026/00001** | 2026-01-11   | **427 951,20 €** | vaulted     | **Non**       |
| **FAC/2026/00002** | 2026-01-11   | **132 559,20 €** | vaulted     | **Non**       |
| **Total**      |              | **560 510,40 €** |             |               |

**Réponse à la question « quelles factures ne portent pas le badge Facture protégée ? »**  
- **Côté interface Odoo** : aucune — toutes ont le badge.  
- **Côté garantie réelle** : **FAC/2026/00001** et **FAC/2026/00002** ne sont pas protégées (absentes du Vault).

---

## Synthèse

| Critère                         | Nombre | Détail                                      |
|---------------------------------|--------|---------------------------------------------|
| Factures clients postées Odoo   | 30     | 914 093,53 €                                |
| Avec badge « Facture protégée » (Odoo) | 30 | Toutes                                      |
| Présentes dans le Vault         | 28     | 353 583,13 €                                |
| **Sans protection réelle** (badge trompeur) | **2** | FAC/2026/00001, FAC/2026/00002 (560 510,40 €) |

---

## Pistes pour rétablir la cohérence

1. **Rattraper le Vault** : ré-envoyer les 2 factures vers le Vault (remettre en `todo` + CRON, ou script de backfill) pour créer les documents manquants et aligner Odoo ↔ Vault.
2. **Ou aligner Odoo sur la réalité** : si on ne peut pas les recréer dans le Vault, repasser ces 2 factures en statut non-vaulted (ex. `todo` ou `failed_hard`) pour que le badge ne s’affiche plus et reflète l’absence de preuve.

Voir aussi : **FACTURES_POSTED_NON_VAULTED_SARL_LA_PLATINE.md**.
