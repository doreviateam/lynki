# SPEC — Indicateur « Reste à rapprocher (%) » — Card PAIEMENTS (P0)

**Version :** v1.0
**Date :** 2026-03-03
**Scope :** Linky (UI) + Vault (projection)
**Périmètre UI :** Card PAIEMENTS uniquement — on ne touche qu’à la card Paiements.
**Objectif :** Afficher un pourcentage probant indiquant la part du volume de paiements **non encore rapprochés**, afin de qualifier la **fiabilité** de la Trésorerie.

---

## 1. Contexte

La Trésorerie est considérée “fiable” uniquement si les paiements ERP vaultés sont **couverts** par des preuves de rapprochement bancaire (lignes de relevé rapprochées).
Aujourd’hui, Linky affiche des montants (paiements, cash, banque) mais ne fournit pas un indicateur direct de “reste à rapprocher”.

> **Périmètre sémantique** : Cet indicateur ne mesure pas la qualité comptable, mais la **couverture probante des flux par des preuves bancaires**.

---

## 2. Principe de gouvernance

> **Aucun indicateur de rapprochement ne doit être affiché si la complétude des preuves n’est pas validée.**

En cas de complétude non validée, Linky affiche l’état “Données incomplètes” et **masque** le pourcentage.

---

## 3. Définitions (P0)

### 3.1 Périmètre temporel

L’indicateur est calculé sur la **période sélectionnée** (par défaut mois N-1), filtrée par :

* tenant
* société(s) sélectionnée(s) si applicable
* **date de paiement** : `payment_date` (champ payload) — date de paiement comptable Odoo. Point final P0.

### 3.2 Paiement éligible

Un paiement est éligible si :

* document Vault `source = 'payment'`
* statut logique = `posted` (ou équivalent déjà filtré par DVIG/backfill)
* montant disponible (payload `amount` exploitable)

### 3.3 Paiement rapproché (définition probante)

Un paiement est **rapproché** s’il existe une **preuve Vault** matérialisant un lien explicite entre :

* un paiement (document payment)
* une ligne de relevé bancaire `account.bank.statement.line` (ou identifiant équivalent)
* issue d’un événement `bank.move.reconciled`

> Pas d’inférence : **sans lien explicite**, le paiement est compté **non rapproché**.

---

## 4. Données nécessaires (Vault)

### 4.1 Projection (P0) — réutilisation existante

**Pas de nouvelle table.** La projection payment ↔ ligne de relevé est matérialisée par la table existante **`financial_recon_deltas`**.

Champs utilisés :

* `tenant`, `document_id` (payment), `bank_statement_line_id`
* `direction` : `+` = reconciled, `-` = unreconciled
* `occurred_at`

### 4.2 Règle « paiement rapproché » (P0 robuste)

Un paiement est **rapproché** si :

```
SUM(direction) > 0  pour (tenant, document_id)
```

Avec `direction` converti : `+` → 1, `-` → -1.

Cela couvre :

* seul `+` → rapproché
* `+` puis `-` (délettrage) → 0 → non rapproché
* split (plusieurs `+`) → > 0 → rapproché

> Plus robuste que « existence d’un + » car gère correctement le délettrage.

### 4.3 Matérialisation

Lors de l’ingestion d’un event `bank.move.reconciled` / `unreconciled`, le Vault insère dans `financial_recon_deltas` via le handler `confirmation-events` (impacted_documents).

> **Ordre critique** : les paiements doivent exister dans le Vault **avant** les confirmations. Sinon `GetDocumentByTenantOdooModelID` ne trouve rien → table vide. Voir `ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md`.

---

## 5. Calcul de l’indicateur

### 5.1 Variables

Sur la période P :

* **A** = volume total des paiements éligibles
  `A = Σ |amount(payment)|`

* **R** = volume des paiements rapprochés
  `R = Σ |amount(payment)| WHERE COALESCE(SUM(direction), 0) > 0` (via `financial_recon_deltas`)

* **reste_a_rapprocher_pct** :

  * si `A = 0` → valeur spéciale “N/A”
  * sinon `reste = 1 - (R / A)`

### 5.2 Forme d’affichage

* Pourcentage arrondi à 1 décimale
* Exemple : `Reste à rapprocher : 96,3 %`

### 5.3 Option (P0 recommandé)

Afficher aussi les montants :

* `Rapproché : R €`
* `Total : A €`
* (Optionnel) `Non rapproché : A − R`

---

## 6. API (Vault → Linky)

### 6.1 Endpoint — extension dashboard-metrics

**Ne pas créer d’endpoint isolé.** Étendre `dashboard-metrics` :

* le % dépend de la complétude (déjà orchestrée par le dashboard)
* évite un call supplémentaire
* cohérence avec le reste du cockpit

`GET /api/v1/dashboard-metrics?tenant=...&from=...&to=...`

Réponse — enrichissement existant :

```json
{
  "tenant": "laplatine2026",
  "reconciliation_metrics": {
    "total_amount_abs": 393934.02,
    "reconciled_amount_abs": 14500.00,
    "remaining_amount_abs": 379434.02,
    "remaining_ratio": 0.9632,
    "generated_at": "2026-03-03T16:20:00Z"
  },
  "completeness": {
    "ok": true,
    "sources": {
      "payments": true,
      "bank_reconciliation": true
    }
  }
}
```

### 6.2 Filtres métier (P0)

* **Période** : exercice à date / custom — identique au filtre dashboard déjà appliqué
* **Société** : scope actuel (ne pas introduire de divergence)
* **Devise** : EUR only (P0, ex. laplatine2026)

### 6.3 Contrat de gouvernance

Si `completeness.ok = false` :

* `remaining_ratio` peut être null
* Linky doit afficher “Données incomplètes” et **masquer** le %

---

## 7. UI — Card PAIEMENTS

### 7.1 Placement

En haut à droite de la card (zone déjà utilisée par “— des paiements rapprochés”) :

* `Reste à rapprocher : XX%`

### 7.2 États

* **OK** : affichage % + donut (réconcilié vs restant)
* **Incomplet** : message existant + % masqué (ou “—”)
* **A=0** : “Aucun paiement sur la période”

### 7.3 Couleurs & états (référentiel Dorevia)

**Principe gouvernance** : Le rouge ne correspond jamais à un mauvais KPI. Il correspond uniquement à une **impossibilité de garantir la donnée**.

> 🔴 Rouge = blocage exploitation (données non garanties). 🟡 Jaune = attention (KPI affiché mais à surveiller).

| Couleur | Usage |
|---------|-------|
| 🔴 Rouge | Arrêt / blocage gouvernance — données non garanties |
| 🟢 Vert | Maîtrisé |
| 🟡 Jaune | Attention |
| 🟠 Orange | Fiabilité faible (> 30 % reste à rapprocher) |

**Table « Reste à rapprocher (%) »** :

| Reste à rapprocher | Couleur | Lecture |
|--------------------|---------|---------|
| < 10 % | 🟢 Vert | Trésorerie fiabilisée |
| 10 % – 30 % | 🟡 Jaune | Attention, rapprochement en cours |
| > 30 % | 🟠 Orange fort | Fiabilité faible |
| Complétude KO | 🔴 Rouge | Indicateur bloqué (gouvernance) |

**Recommandation UX** : Pour > 30 %, couleur 🟠 orange fort + texte dynamique « Fiabilité faible » ou « Rapprochement insuffisant ». *Couleur = niveau | Texte = interprétation*

---

## 8. Requêtes SQL de référence (Vault)

### 8.1 A : total paiements

```sql
SELECT ROUND(SUM(ABS((d.payload_json->>'amount')::numeric))::numeric, 2) AS total_amount_abs
FROM documents d
WHERE d.tenant = $1
  AND d.source = 'payment'
  AND (payload_json->>'payment_date')::timestamptz::date BETWEEN $2 AND $3;
```

> **Période** : filtrée sur `payment_date` (champ payload), date de paiement comptable Odoo.  
> Pas de filtre `state` : tous les paiements en Vault sont postés (Odoo n’envoie que `payment.posted`).

### 8.2 R : paiements rapprochés (règle SUM(direction) > 0)

> **COALESCE obligatoire** : si `financial_recon_deltas` est vide, le sous-select renvoie NULL → sans COALESCE(..., 0), le paiement serait exclu du WHERE. Avec COALESCE, NULL → 0 → non rapproché (comportement attendu).

```sql
SELECT ROUND(SUM(ABS((d.payload_json->>'amount')::numeric))::numeric, 2) AS reconciled_amount_abs
FROM documents d
WHERE d.tenant = $1
  AND d.source = 'payment'
  AND (payload_json->>'payment_date')::timestamptz::date BETWEEN $2 AND $3
  AND COALESCE((
    SELECT SUM(CASE WHEN f.direction = '+' THEN 1 ELSE -1 END)
    FROM financial_recon_deltas f
    WHERE f.tenant = d.tenant AND f.document_id = d.id
  ), 0) > 0;
```

---

## 9. Tests d’acceptation (AT)

### AT1 — Masquage si complétude KO

* Given snapshot completeness ok=false
* Then la card affiche “Données incomplètes”
* And le % est “—” (non affiché)

### AT2 — Calcul correct

* Given 10 paiements total A=1000
* And 4 paiements rapprochés R=250
* Then reste = 75%

### AT3 — A=0

* Given aucun paiement sur période
* Then “Aucun paiement sur la période”
* And pas de %.

### AT4 — Idempotence projection

* Rejouer 2 fois le même event `bank.move.reconciled`
* Then `financial_recon_deltas` n’a pas de doublons (event_uid unique).

---

## 10. Hors scope (P1+)

* Rapprochement partiel (split payment)
* Frais bancaires et écarts
* Matching probabiliste

---

## Annexe A — Ratio C (P0)

### A.1 Définition

**C** = part des paiements couverts par des lignes de relevé rapprochées.

```
C = B / A
```

* **A** = volume total paiements (déjà défini §5)
* **B** = volume des lignes de relevé rapprochées (bank_reconciliation_projection)

### A.2 Intégration

Intégré ici en annexe (P0). Si utilisé ailleurs plus tard → extraction dans un document dédié.


