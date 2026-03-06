# Rapport — Backfill ventilation Espèces/Banque (paiements historiques)

**Date :** 2026-03-02  
**Objet :** Correction rétroactive de la ventilation Espèces/Virements pour les paiements historiques  
**Statut :** ✅ Réalisé, déployé et contrôlé  
**Tenant :** laplatine2026

---

## 1. Synthèse exécutive

| Élément | Valeur |
|--------|-------|
| **Objectif** | Réattribuer la méthode (cash/transfer/check) aux paiements historiques vaultés sans `method` |
| **Solution** | Table d’override `payment_method_overrides` + backfill basé sur Odoo |
| **Overrides créés** | 253 (espèces) |
| **Durée backfill** | ~1,4 s |
| **Erreurs** | 0 |
| **Sanity-check** | ✅ Vault et Linky alignés ; 1 paiement Odoo non vaulté identifié (50 €) |

---

## 2. Contexte

Suite au déploiement de la ventilation **Espèces / Virements** dans Linky (rapport MOA 2026-02-28), les **paiements historiques** déjà vaultés n’avaient pas de `method` enregistré et étaient tous comptabilisés en « Virements ».

**Impact :** La carte Cash affichait 0 € en Espèces pour laplatine2026 alors qu’Odoo contient de nombreux paiements espèces.

**Solution retenue :** Table d’override `payment_method_overrides` — les documents Vault restent intacts (immutabilité), l’agrégation lit l’override en priorité.

---

## 3. Travail réalisé

### 3.1 Composants

| Composant | Détail |
|-----------|--------|
| **Migration 038** | Table `payment_method_overrides` (document_id, method, reason) + index |
| **Agrégation Vault** | `LEFT JOIN` override, `COALESCE(o.method, payload->>'method', 'transfer')` |
| **Endpoint Odoo** | `GET /dorevia/vault/payment_journal_types?payment_ids=...` |
| **Commande backfill** | `vault backfill payment-methods --tenant X --odoo-url Y` |
| **Tuile Cash Linky** | Net espèces calculé via `by_method` quand disponible |

### 3.2 Exécution backfill (2026-03-02)

| Métrique | Valeur |
|----------|--------|
| Documents lus | 665 |
| Overrides créés | 253 (cash) |
| Sans source_id | 0 |
| Erreurs | 0 |
| Durée | ~1,4 s |

---

## 4. Sanity-check SQL — comparaison Vault / Odoo / Linky

**Période :** 2026-01-01 → 2026-03-02

### 4.1 Résultats par direction et méthode

| Direction | Method | Vault (n / €) | Odoo (n / €) | Statut |
|-----------|--------|----------------|--------------|--------|
| inbound | cash | 47 / 21 085,15 | 47 / 21 085,15 | ✅ Aligné |
| inbound | transfer | 98 / 48 460,22 | 98 / 48 460,22 | ✅ Aligné |
| outbound | cash | 48 / 12 982,06 | **49 / 13 032,06** | ⚠️ 1 paiement écart |
| outbound | transfer | 75 / 27 187,60 | 75 / 27 187,60 | ✅ Aligné |

### 4.2 Écart identifié

- **Paiement Odoo non vaulté :** `PCSH1/2026/00008` (id 406), 50 € outbound, 2026-01-01, journal Espèces.
- Cause : gap de synchronisation historique DVIG → Vault.
- Impact : négligeable (50 €) ; Linky affiche les données Vault, source de vérité pour le dashboard.

### 4.3 Totaux Linky (cohérents avec Vault)

| Métrique | Valeur |
|----------|-------|
| Encaissements espèces | 21 085,15 € |
| Encaissements virements | 48 460,22 € |
| Décaissements espèces | 12 982,06 € |
| Décaissements virements | 27 187,60 € |
| **Net espèces** | **+8 103,09 €** |

---

## 5. Déploiement

| Composant | Version |
|-----------|---------|
| Vault | `dorevia/vault:backfill-especes-2026-02-28` |
| Linky | `dorevia/linky:cash-tile-especes-2026-03-02` |
| Environnement | core-stinger (Vault), laplatine2026 |

---

## 6. Vérifications effectuées

- [x] Backfill exécuté sans erreur
- [x] Overrides créés et visibles en base
- [x] Sanity-check SQL Vault vs Odoo vs Linky réalisé
- [x] Tuile Cash : affichage net espèces (by_method)
- [x] Écart Odoo/Vault documenté (1 paiement 50 € non vaulté)

---

## 7. Références et scripts

| Document | Chemin |
|----------|--------|
| Spec backfill | `ZeDocs/web34/SPEC_BACKFILL_PAIEMENTS_ESPECES_BANQUE_v1.0.md` |
| Plan d’implémentation | `ZeDocs/web34/PLAN_IMPLEMENTATION_BACKFILL_ESPECES_BANQUE_2026-02-28.md` |
| Script sanity-check | `tenants/laplatine2026/scripts/sanity_check_sql_payment_methods.sh` |
