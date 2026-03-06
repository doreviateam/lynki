# ✅ SPEC 1 — Vaulting `account.move` `posted` (v1.1 — corrigée & consolidée)

**Statut** : ✅ **Référence figée (définitive)**  
**Version** : 1.1  
**Date** : 2026-01-03  
**Date de validation** : 2026-01-03  
**Référence** : `REFLEXION_FACTURATION_MRR_VAULT_v2.1`  
**Périmètre** : Dorevia Vault — Ingestion documents comptables Odoo (`account.move` en `posted`)

> **⚠️ SPÉCIFICATION FIGÉE — RÉFÉRENCE DÉFINITIVE**  
> Cette spécification est **figée** et sert de **référence définitive** pour l'implémentation.  
> - ✅ La frontière **Vault / CORE** est **claire**  
> - ✅ La question **"qu'est-ce qu'on enregistre ?"** est **définitivement tranchée**  
> - ✅ Toute modification nécessitera une nouvelle version de la spécification

> Cette v1.1 corrige et consolide la v1.0 fournie en PJ, sans changer le fond, mais en supprimant des ambiguïtés et incohérences (notamment stockage `move_type`, idempotence, et conformité Factur‑X 2026).  
> Source : PJ "SPEC 1 : Vaulting account.move posted — v1.0".

---

## 1. Objectif

Spécifier l'implémentation du vaulting des objets `account.move` en état `posted` dans Dorevia Vault, conformément à la règle officielle scope v1.

Cette SPEC définit :
- les règles de filtrage strictes,
- les validations à implémenter,
- le format des données,
- les critères d'acceptation,
- la politique Factur‑X (2026) côté Vault (constat/étiquetage, jamais génération).

> **Note sur le périmètre** : La présente spécification couvre la brique de **conservation probante**. Les exigences liées à l'encaissement (NF525) seront traitées dans les évolutions intégrant le POS.

---

## 2. Architecture multi-tenant

### 2.1 Schéma architectural

Contexte multi-tenant avec Vaults distribués :

```
              ODOO CORE
        (admin / commercial)
                 ▲
                 │ constats
        ┌────────┼────────┐
        │        │        │
     Vault A  Vault B  Vault C
        ▲                 ▲
        │                 │
   Odoo client        Odoo client
   (souverain)        (souverain)
```

Caractéristiques :
- **Vaults distribués** : 1 Vault par tenant/client (A, B, C…)
- **Odoo clients souverains** : chaque tenant dispose de son propre Odoo
- **Odoo CORE centralisé** : instance unique recevant les constats de facturation
- **Isolation par tenant** : chaque Vault stocke uniquement les documents de son tenant

### 2.2 Rôle d'Odoo CORE (facturation centrale)

Odoo CORE reçoit les constats Vault, les rattache à un tenant et à un contrat, applique les règles contractuelles et fiscales via les objets standards Odoo, calcule les montants, et génère une facture par tenant et par période.

Odoo CORE exerce une **supervision administrative et commerciale** sur l'ensemble des tenants et des instances de la plateforme.

Il n'exerce **aucune autorité fonctionnelle ou opérationnelle** sur les applications métier des instances clientes, qui restent souveraines dans leur fonctionnement.

Odoo CORE est l'unique source de vérité commerciale et financière.

### 2.3 Implications pour le vaulting

- Chaque document `account.move` vaulté doit être associé à un **tenant**
- Les constats mensuels seront agrégés par tenant et envoyés vers Odoo CORE (**SPEC 2**)
- Le Vault ne calcule aucun montant : il constate uniquement les volumes
- Toute logique commerciale et comptable vit exclusivement dans Odoo CORE

---

## 3. Règle officielle de vaulting (scope v1)

Un objet doit être vaulté **si et seulement si** :
- `model = "account.move"`
- `state = "posted"`
- `move_type ∈ {"out_invoice","in_invoice","out_refund","in_refund"}`
- `meta.tenant` présent et non vide

Objets exclus :
- `draft`, `cancel`, états intermédiaires,
- devis/commandes/documents préparatoires,
- POS (tickets, sessions, Z) — hors scope v1 (encaissement NF525 traité dans évolutions POS).

---

## 4. Prérequis Odoo (fonctionnels)

La SPEC s'applique à une instance Odoo disposant des flux standards de facturation d'Achat et de Vente, matérialisés par des objets `account.move` en état `posted`.

Dans un contexte Odoo standard, cela implique généralement :
- `sale_management` (facturation ventes)
- `purchase` (facturation achats)
- `l10n_fr` ou localisation équivalente

La SPEC reste applicable à toute instance Odoo produisant des `account.move` finalisés, indépendamment de la manière dont ces documents sont générés.

---

## 5. API — Endpoint & payload

### 5.1 Endpoint

`POST /api/v1/invoices`

### 5.2 Payload

```json
{
  "source": "sales|purchase",
  "model": "account.move",
  "odoo_id": 123,
  "state": "posted",
  "file": "base64_encoded_pdf_or_facturx_pdf",
  "meta": {
    "move_type": "out_invoice|in_invoice|out_refund|in_refund",
    "number": "FAC2026-001",
    "invoice_date": "2026-01-15",
    "total_ht": 1000.00,
    "total_ttc": 1200.00,
    "currency": "EUR",
    "seller_vat": "FR12345678901",
    "buyer_vat": "FR98765432109",
    "tenant": "laplatine",
    "correlation_id": "account.move_123_abc123",

    "facturx_present": true,
    "facturx_xml_b64": "optional_base64_xml_if_separate"
  }
}
```

### 5.3 Champs obligatoires

- `source` : `"sales"` ou `"purchase"`
- `model` : `"account.move"`
- `odoo_id` : int > 0
- `state` : `"posted"`
- `file` : base64 non vide (PDF ou PDF Factur‑X)
- `meta.move_type`
- `meta.tenant`

### 5.4 Champs optionnels (recommandés)

- `meta.number`, `meta.invoice_date`, `meta.currency`
- `meta.total_ht`, `meta.total_ttc` (**traçabilité uniquement**)
- `meta.seller_vat`, `meta.buyer_vat`
- `meta.correlation_id`
- `meta.facturx_present` (bool) + `meta.facturx_xml_b64` (si XML séparé)

---

## 6. Validations à implémenter

Ordre de validation (fail-fast, 400 immédiat) :
1. `model == "account.move"`
2. `state == "posted"`
3. `meta.move_type` ∈ liste autorisée
4. mapping `source` cohérent avec `move_type`
5. `meta.tenant` non vide
6. `file` base64 décodable, taille > 0, MIME "application/pdf" (si check MIME)

### 6.1 Mapping source ↔ move_type

- `move_type ∈ {"out_invoice","out_refund"}` → `source = "sales"`
- `move_type ∈ {"in_invoice","in_refund"}` → `source = "purchase"`

---

## 7. Comportement du Vault

### 7.1 Acceptation (succès)

Si toutes les validations passent :
- le document est stocké,
- les métadonnées sont enregistrées,
- les preuves d'intégrité sont générées (JWS, Ledger),
- la conformité Factur‑X est **constatée et étiquetée** (cf. §9),
- retour **200 OK** avec les informations du document.

### 7.2 Rejet

Si une validation échoue :
- le document n'est pas stocké,
- retour **400 Bad Request** explicite,
- aucune modification DB.

### 7.3 Idempotence (définitif)

Si un document avec le même `sha256` existe déjà **pour le même tenant** :
- retour **200 OK** avec document existant,
- aucune duplication.

> **Clé d'idempotence recommandée** : `(tenant, sha256)`.

---

## 8. Stockage des métadonnées (DB)

### 8.1 Champs stockés (table `documents`)

| Champ DB | Source | Description |
|---|---|---|
| source | payload.source | sales/purchase |
| odoo_model | payload.model | account.move |
| odoo_id | payload.odoo_id | ID Odoo |
| odoo_state | payload.state | posted |
| move_type | payload.meta.move_type | **stocké** (voir §8.2) |
| invoice_number | payload.meta.number | optionnel |
| invoice_date | payload.meta.invoice_date | optionnel |
| total_ht | payload.meta.total_ht | optionnel (traçabilité) |
| total_ttc | payload.meta.total_ttc | optionnel (traçabilité) |
| currency | payload.meta.currency | optionnel |
| seller_vat | payload.meta.seller_vat | optionnel |
| buyer_vat | payload.meta.buyer_vat | optionnel |
| tenant | payload.meta.tenant | obligatoire |
| correlation_id | payload.meta.correlation_id | optionnel |
| facturx_present | meta.facturx_present | bool |
| compliance_status | calcul Vault | `compliant` / `non_compliant_2026` / `out_of_scope` |

### 8.2 Correction importante (v1.0 → v1.1)

La v1.0 indiquait : "move_type non stocké (déduit)". C'est **incorrect** et source d'ambiguïté :

- `source` ne permet pas de reconstituer précisément le `move_type` (invoice vs refund)  
- `move_type` est une métadonnée de preuve, doit être conservée **telle que reçue**

➡️ **Décision** : `move_type` est **stocké**.

### 8.3 Montants

`total_ht` / `total_ttc` :
- stockés **uniquement** à des fins de traçabilité et lecture humaine,
- **ne participent à aucun calcul** (MRR/facture = Odoo CORE).

---

## 9. Conformité Factur‑X (politique 2026)

### 9.1 Principe

En 2026, pour les flux **B2B France** soumis à la réforme, Factur‑X est une exigence réglementaire.

Le Vault :
- **ne génère ni ne transforme** les formats,
- **constate**, **scelle**, et **étiquette** la conformité,
- informe Odoo CORE via les constats (SPEC 2) / ou webhook (si prévu).

### 9.2 Détection "B2B soumis"

Critère minimal (v1) : `buyer_vat` présent **et** `seller_vat` présent → considérer "B2B probable".

> La qualification "soumis / hors scope" reste de la responsabilité de CORE. Le Vault fait un **constat technique**.

### 9.3 États de conformité (`compliance_status`)

- `compliant` : Factur‑X présent (PDF Factur‑X ou XML fourni)
- `non_compliant_2026` : B2B probable + Factur‑X absent
- `out_of_scope` : B2C / non qualifié

---

## 10. Intégration Odoo (connecteur)

### 10.1 Déclencheur

Sur `action_post()` (après `super()`), condition :
- `state='posted'`
- `move_type ∈ {'out_invoice','in_invoice','out_refund','in_refund'}`

Action :
- construction du payload,
- génération du PDF (et Factur‑X si dispo),
- POST vers Vault.

### 10.2 Exemple (indicatif)

L'exemple v1.0 était volontairement simplifié. En implémentation réelle :
- `vault_token` doit venir de `ir.config_parameter` ou `odoo.conf` (pas en clair dans le code),
- `get_pdf()` doit utiliser le moteur de report Odoo,
- le champ `vault_id` nécessite un champ custom (sinon omettre).

---

## 11. Tests & critères d'acceptation

### 11.1 Fonctionnels (Vault)

- AC‑1..AC‑10 : accept/reject/idempotence
- AC‑17 : Factur‑X présent → `compliance_status=compliant`
- AC‑18 : B2B probable sans Factur‑X → `compliance_status=non_compliant_2026` + information CORE (via SPEC 2)

### 11.2 Intégration

- AC‑11..AC‑14 : intégration Odoo + isolation tenant + preuves JWS/Ledger

---

## 12. Implémentation technique (Vault Go)

### 12.1 Validation

Fichier : `sources/vault/internal/handlers/invoices.go`

- Ajouter `validateAccountMovePayload(payload *InvoicePayload) error`
- Appliquer la validation **avant** toute persistance

### 12.2 Idempotence

- Calculer `sha256` sur le binaire PDF décodé
- Rechercher un existant sur `(tenant, sha256)`
- Retourner 200 + document existant si trouvé

---

## 13. Rétrocompatibilité

- Les documents non-`account.move` continuent de fonctionner
- L'API `/api/v1/invoices` reste compatible
- Aucune migration de données nécessaire (hors ajout champs DB si manquants : `move_type`, `compliance_status`, `facturx_present`)

---

## 14. DoD (Definition of Done)

- [ ] Validation `account.move posted` implémentée
- [ ] Idempotence `(tenant, sha256)` validée
- [ ] Tests unitaires AC‑1..AC‑10 OK
- [ ] Tests d'intégration AC‑11..AC‑14 OK
- [ ] Politique Factur‑X (étiquetage) testée AC‑17/18
- [ ] Docs API + docs connecteur Odoo à jour
- [ ] Déploiement environnement de test validé

---

## 15. Suite

- **SPEC 2** : Vault → Constat mensuel (volumes + conformité + preuves) — Voir `SPEC2_VAULT_CONSTAT_MENSUEL_v1.0.md`
- **SPEC 3** : `dorevia_billing_core` (CORE only)

**Fin de la SPEC 1 (v1.1).**
