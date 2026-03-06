# Évaluation — SPEC_DOREVIA_ADJUSTMENTS_v1.0

**Document évalué** : SPEC_DOREVIA_ADJUSTMENTS_v1.0 (Avoirs & Remboursements)  
**Date** : 2026-02-10  
**Évaluateur** : revue technique alignée SPEC PAYMENTS v1.1 et implémentation actuelle.

---

## 1) Points forts

- **Objectif clair** : preuve immuable des corrections financières (avoirs + remboursements), sans modifier l’historique. Aligné avec le principe Event → Proof → Append-only.
- **Définitions métier (§1)** : Les 4 cas (avoir client, avoir fournisseur, remboursement client, remboursement fournisseur) sont bien distingués avec leur impact (cash ou non, sens).
- **Event types (§2.1)** : Noms explicites et cohérents avec le métier :
  - `credit_note.customer.issued` / `credit_note.supplier.received`
  - `refund.customer.paid` / `refund.supplier.received`
- **Mapping Odoo → Vault (§3)** : Correspondance claire (account.move move_type out_refund/in_refund pour avoirs ; account.payment is_refund + direction pour remboursements). Cohérent avec le connecteur actuel (is_refund, payment_direction).
- **Séparation Cash vs Correction (§7)** : Cash pur (Encaissements / Décaissements) vs corrections (Avoirs / Remboursements) est bien posée et correspond à la décision récente d’exclure `is_refund` de la card Décaissements (SPEC PAYMENTS §7.2).
- **Règles append-only (§5)** et **Sécurité (§10)** : Alignées avec la spec paiements (pas de modification après vault, blocage remise en brouillon).
- **Linky (§6, §11)** : Cards dédiées et KPIs (ratio Avoirs/CA, etc.) donnent une cible claire pour la projection CFO.
- **Audit (§8)** : Endpoint `GET /ui/aggregations/adjustments?list=1` et format `events[]` reprennent le pattern déjà mis en place pour payments-out (list=1).

---

## 2) Cohérence avec l’existant

| Existant | Spec Adjustments | Commentaire |
|----------|------------------|-------------|
| POST /api/v1/payments avec `is_refund` | Remboursements déjà ingérés comme paiements | Les remboursements sont déjà en base (source=payment, is_refund=true). La spec ajoute une **vue agrégée** (adjustments) et des event_type explicites. |
| DVIG / factures : out_refund, in_refund | Avoirs = credit_note.customer.issued / credit_note.supplier.received | Aujourd’hui les avoirs sont vaultés en `invoice.refund.posted` (DVIG). La spec introduit des libellés métier (credit_note.*). À trancher : réutiliser les docs existants avec un champ `event_type` dérivé, ou nouveau flux. |
| Card Décaissements exclut is_refund | Remboursements clients dans card dédiée | Cohérent : les remboursements ne sont plus dans Décaissements et doivent alimenter « Remboursements Clients ». |
| Idempotence payments (tenant + source_model + source_id) | §2.2 Idempotence obligatoire | À préciser : même schéma de clé pour adjustments (tenant + source_model + source_id) recommandé. |

---

## 3) Manques ou flous à clarifier

### 3.1 Modèle de stockage et ingestion

- **Avoirs** : Aujourd’hui les avoirs (out_refund, in_refund) passent par DVIG et sont stockés comme documents facture (source sales/purchase, move_type). La spec ne dit pas si :
  - on **réutilise** ces documents et on expose une agrégation « adjustments » qui filtre sur move_type in (out_refund, in_refund), avec event_type dérivé (credit_note.customer.issued / credit_note.supplier.received), **ou**
  - on crée un **nouveau flux** d’ingestion (ex. POST /api/v1/adjustments ou enrichissement du payload DVIG avec event_type métier).
- **Remboursements** : Déjà en base (payments avec is_refund). Il manque une décision explicite : même table `documents` avec un champ `event_type` (refund.customer.paid / refund.supplier.received) dérivé de (is_refund, direction), ou table/aggregation dédiée sans dupliquer les données.

Recommandation : préciser en §3 ou §4 que **phase 1** = réutilisation des données existantes (payments avec is_refund ; factures out_refund/in_refund) et agrégations Vault + Linky qui dérivent les event_type ; **phase 2** éventuelle = payload canonique enrichi à l’ingestion.

### 3.2 Endpoint GET /ui/aggregations/adjustments

- **Paramètres** : tenant, date_debut, date_fin, event_type (filtrer par type ?), company_id, granularity ?
- **Forme de la réponse** : total, count, series (comme payments), plus `events[]` quand list=1. Préciser le format (aligné sur payments-out).
- **Filtre event_type** : optionnel pour ne retourner qu’un sous-ensemble (ex. seulement refund.customer.paid).

### 3.3 Idempotence

- **Clé** : indiquer explicitement la formule (ex. `tenant_id | source_model | source_id` pour paiements remboursements ; pour avoirs, déjà géré par DVIG avec idempotency_key facture). Éviter toute ambiguïté pour les nouveaux event types.

### 3.4 Remboursement fournisseur (inbound + is_refund)

- En Odoo, un remboursement fournisseur (argent reçu) = paiement **inbound** avec partner_type fournisseur. Le connecteur actuel envoie `payment_direction` (inbound/outbound) et `is_refund`. Pour avoir refund.supplier.received il faut **is_refund=true et direction=inbound**. Vérifier que le connecteur envoie bien is_refund pour les paiements inbound (remboursement reçu fournisseur) ; si aujourd’hui is_refund n’est vrai que pour outbound+customer, compléter le mapping.

### 3.5 Formatage du document

- Échappements en fin de ligne (ex. `v1.0\`) : à nettoyer pour un markdown plus lisible (retours à la ligne normaux ou paragraphes).

---

## 4) Recommandations

1. **Ajouter un § « Implémentation (phases) »** : Phase 1 = agrégations Linky + Vault sur données existantes (payments is_refund ; factures out_refund/in_refund) avec event_type dérivé. Phase 2 = éventuel enrichissement du payload à l’ingestion (event_type, invoice_origin_id, etc.).
2. **Détailler le contrat de GET /ui/aggregations/adjustments** : paramètres requis/optionnels, forme de la réponse (total, payment_count, series, events si list=1), et filtres event_type.
3. **Documenter la clé d’idempotence** pour chaque type (avoirs = existant DVIG ; remboursements = comme payments).
4. **Vérifier le mapping Odoo** pour remboursement fournisseur (inbound + is_refund) et l’indiquer en §3.4 si besoin.
5. **Référencer la spec** depuis SPEC_DOREVIA_PAYMENTS_v1.1 (ex. dans §7.2 ou une section « Cards dédiées ») pour lier Cash (payments) et Adjustments (avoirs/remboursements).

---

## 5) Synthèse

La spec est **solide sur le fond** (définitions, event types, règles, Linky) et **alignée** avec la séparation Cash / Correction et l’existant (payments, DVIG). Pour une **implémentation sans ambiguïté**, il reste à préciser : modèle de stockage / réutilisation des données, contrat exact de l’endpoint adjustments, idempotence et mapping Odoo remboursement fournisseur. Avec ces compléments, le document est prêt pour une phase 1 (agrégations + cards Linky sur données déjà vaultées).

---

## 6) Addendum (post-évaluation)

**ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0** formalise la décision d’architecture : Phase 1 = **modèle dérivé** (aucun nouveau flux d’ingestion, réutilisation des documents payments + invoices, event_type dérivé dans la couche agrégation). Il précise le contrat de `GET /ui/aggregations/adjustments`, l’idempotence, le mapping remboursement fournisseur et la règle « pas de duplication ». Il répond aux points 3.1, 3.2 et 3.3 de la présente évaluation. Réf. : `ZeDocs/web14/ADDENDUM_IMPL_PHASES_ADJUSTMENTS_v1.0.md`.
