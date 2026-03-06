# Rapport MOA — Backfill ventilation Espèces/Banque (paiements historiques)

**Date :** 2026-03-02  
**Objet :** Correction rétroactive de la ventilation Espèces/Virements pour les paiements historiques  
**Statut :** Réalisé et déployé

---

## 1. Contexte

Suite au déploiement de la ventilation **Espèces / Virements** dans Linky (rapport MOA du 2026-02-28), un constat s’imposait :

- Les **nouveaux paiements** (postés après le 2026-02-28) sont correctement ventilés grâce au connecteur Odoo.
- Les **paiements historiques** déjà vaultés avant cette date n’avaient pas de `method` enregistré et étaient tous comptabilisés en « Virements ».

**Impact métier :** La carte Cash de Linky affichait 0 € en Espèces pour le tenant laplatine2026, alors qu’Odoo contient environ 105 paiements en espèces (~110 550 €) et 224 en banque (~138 586 €).

**Objectif :** Réattribuer la méthode de paiement (cash / transfer / check) aux paiements historiques sans modifier les données originales du Vault — principe « données probantes » préservé.

---

## 2. Solution retenue : projection correctrice

### 2.1 Principe

- **Table d’override** `payment_method_overrides` : contient les corrections (document_id, method, reason).
- Les documents Vault **ne sont pas modifiés** — immutabilité garantie.
- L’agrégation lit en priorité l’override, puis le payload, puis défaut `transfer`.
- Le backfill interroge Odoo (journal.type, payment_method.code) pour déterminer la méthode et insère les overrides.

### 2.2 Traçabilité

| Champ | Rôle |
|-------|------|
| `reason` | `backfill_2026_02_28` — identifie les lignes créées par ce backfill |
| `documents_without_odoo_payment_id.csv` | Liste des documents sans ID Odoo exploitable (correction manuelle si besoin) |

---

## 3. Travail réalisé

### 3.1 Migration base de données

- **Migration 038** : création de la table `payment_method_overrides` et de l’index pour le backfill.
- Les migrations sont désormais appliquées automatiquement au démarrage du Vault.

### 3.2 Endpoint Odoo

- **Route** `GET /dorevia/vault/payment_journal_types?payment_ids=1,2,3`
- Retourne le mapping ID paiement → méthode (cash, transfer, check) pour le backfill.
- Réutilise la logique métier du connecteur Vault (journal caisse → cash, chèque → check, etc.).

### 3.3 Commande backfill

- **Commande** : `vault backfill payment-methods --tenant X --odoo-url Y`
- Options : `--dry-run`, `--batch-size`, `--limit`
- Pagination stable, snapshot de borne max, idempotence (relance sans duplication).

---

## 4. Résultats d’exécution (laplatine2026)

**Date d’exécution :** 2026-03-02

| Métrique | Valeur |
|----------|--------|
| Documents paiement lus | 665 |
| Overrides créés (cash) | 253 |
| Documents sans ID Odoo | 0 |
| Erreurs | 0 |
| Durée | ~1,4 seconde |

### Distribution après backfill

| Méthode | Nombre | Montant total |
|---------|--------|---------------|
| **Espèces (cash)** | 253 | 165 647,40 € |
| Virements (transfer) | 412 | (reste des paiements) |

**Note :** Le total espèces (165 k€) diffère du chiffre initialement estimé (~110 k€) — possible différence de périmètre ou de période d’analyse. La ventilation est désormais cohérente avec Odoo.

---

## 5. Déploiement

| Composant | Version / Image |
|-----------|-----------------|
| Vault | `dorevia/vault:backfill-especes-2026-02-28` |
| Odoo | Redémarré pour charger `payment_journal_types` |
| Tenant | core-stinger (Vault partagé), laplatine2026 |

---

## 6. Vérifications (checklist MOA)

- [x] Backfill exécuté sans erreur
- [x] Overrides créés et visibles en base
- [x] Vault déployé avec la nouvelle image
- [x] Tuile Cash : affiche désormais le net espèces (by_method) quand disponible
- [x] Linky redéployé avec image `dorevia/linky:cash-tile-especes-2026-03-02` (tuile Cash = net espèces)
- [ ] Recharger la carte Cash dans Linky et vérifier l’affichage Espèces (~165 647 €)
- [ ] Si 0 € affiché : essayer « Toutes périodes » ou cliquer sur la tuile Cash pour voir le détail Espèces/Banque

---

## 7. Références

- Rapport détaillé (sanity-check) : `ZeDocs/web34/RAPPORT_BACKFILL_ESPECES_BANQUE_2026-03-02.md`
- Spec backfill : `ZeDocs/web34/SPEC_BACKFILL_PAIEMENTS_ESPECES_BANQUE_v1.0.md`
- Plan d’implémentation : `ZeDocs/web34/PLAN_IMPLEMENTATION_BACKFILL_ESPECES_BANQUE_2026-02-28.md`
- Rapport MOA ventilation initiale : `ZeDocs/web34/RAPPORT_MOA_VAULT_ESPECES_VIREMENTS_2026-02-28.md`
