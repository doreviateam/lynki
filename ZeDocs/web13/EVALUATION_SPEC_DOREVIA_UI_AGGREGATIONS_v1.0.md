# Évaluation — SPEC_DOREVIA_UI_AGGREGATIONS_v1.0

**Document évalué** : `ZeDocs/web13/SPEC_DOREVIA_UI_AGGREGATIONS_v1.0.md`  
**Contexte** : Dorevia-UI (Appsmith), événements Vault/DVIG, unit_appSmith.md.

---

## 1. Synthèse

La spec pose un **socle clair** pour les agrégations temporelles (filtres période + granularité, modèle logique, scopes par type d’événement). Elle est **alignée** avec l’objectif “compteur” et “données certifiées” de Dorevia-UI, **cohérente** avec l’existant Vault/DVIG sur les `event_type`, et **implémentable** à condition de préciser l’origine des données (API Dorevia-UI à définir) et un détail de nomenclature. **POS est reporté** : on verra le POS après (hors périmètre v1 / phase actuelle).

---

## 2. Points forts

| Aspect | Commentaire |
|--------|-------------|
| **Objectif et périmètre** | Objectif explicite (agrégation temporelle sur événements certifiés) et réutilisation pour plusieurs cards (ventes, impayés, paiements, POS, ratios). |
| **Principes** | Source vault en priorité, données non vaultées “indicatives”, filtrage temporel et groupement par granularité : cohérent avec “pas d’ERP bis” et “preuve certifiée”. |
| **Filtres** | `date_debut` / `date_fin` + granularité (day / week / month) : suffisant pour une v1 et exploitable en SQL/API. |
| **Modèle logique** | Pseudo-SQL `time_bucket` + `SUM(amount)` par `event_type` : compréhensible et proche de ce qu’une API ou un backend pourra exécuter. |
| **Rendu UI** | Card simple (montant, période, badge “Données certifiées”) + mini-graph par granularité : adapté à une UI mobile-first type Appsmith. |
| **Règles produit** | Valeurs critiques = vault ; non vaultées = différenciées ; ratios sur bases certifiées : bon cadrage. |

---

## 3. Cohérence avec la plateforme

- **Vault / DVIG** : Les `event_type` utilisés côté Vault et DVIG incluent déjà `invoice.posted` (et variantes). La spec réutilise ce modèle → **cohérent**.
- **Paiements** : La spec cite `payment.captured` ; la SPEC vaulting payments (web12) et le code parlent de **`payment.posted`**. À **unifier** (recommandation : retenir `payment.posted` partout et l’indiquer en spec).
- **POS** : reporté à plus tard (hors périmètre v1). `ticket.closed` restera le scope prévu quand on traitera le POS.
- **Architecture** : “Appsmith consomme uniquement une API Dorevia-UI read-only” (unit_appSmith) est respectée : la spec ne parle pas d’accès direct à la DB, seulement d’agrégation sur “événements” → **compatible**.

---

## 4. Manques / à préciser (v1.0)

| Point | Suggestion |
|-------|------------|
| **Origine des données** | La spec ne dit pas **d’où** viennent `events` (table, API). À préciser : “API Dorevia-UI” (read-only, tenant-scoped) avec un endpoint du type `GET /aggregations?scope=...&date_debut=...&date_fin=...&granularity=...`. |
| **Nom des champs** | Aligner le nom du champ de date (spec : `event_date` ; côté Vault/events le nom peut être `timestamp` ou `occurred_at`). Documenter le mapping. |
| **Montant** | Préciser le champ utilisé pour `SUM(amount)` (ex. `amount_total`, `amount_signed`) selon le type d’événement (facture vs paiement vs ticket). |
| **Tenant** | Rappeler que toutes les requêtes sont **tenant-scoped** (comme dans unit_appSmith), sans accès inter-tenant. |
| **payment.posted vs payment.captured** | Choisir une seule dénomination (recommandation : **payment.posted**) et la mettre à jour dans la spec + exemples. |
| **Achats** | unit_appSmith mentionne “factures achats validées + vaultées”. Ajouter un scope type `invoice.posted` filtré par “achats” (ou un `event_type` dédié si le modèle le prévoit). |

---

## 5. Faisabilité

- **Backend** : Une couche “Dorevia-UI API” (read-only) qui agrège à partir des événements Vault (ou d’une vue matérialisée / table dérivée) est réaliste : requêtes du type décrit dans la spec, avec `time_bucket` (PostgreSQL) ou équivalent.
- **Appsmith** : Les cards et mini-graphs décrits sont réalisables (widgets, appels API REST, binding des filtres période / granularité).
- **Données** : Tant que les événements ont bien `event_type`, une date, et un montant, le modèle tient. À valider pour les scopes v1 : factures OK, paiements à confirmer selon implémentation Vault. POS : à traiter plus tard.

---

## 6. Recommandations

1. **Unifier** : `payment.captured` → **`payment.posted`** dans la spec (ou documenter explicitement si vous gardez “captured” côté métier).
2. **Compléter** : Ajouter un court § “Source des données” : API Dorevia-UI read-only, tenant-scoped, alimentée par les événements Vault (et éventuellement vues agrégées).
3. **Documenter** : Pour chaque scope (ventes, paiements ; POS plus tard), indiquer le `event_type` exact et le champ de montant utilisé pour l’agrégation.
4. **Optionnel** : Prévoir un paragraphe “Achats” (scope ou filtre) pour alignement avec unit_appSmith.
5. **Version** : Conserver la version v1.0 et, après ajustements, publier un patch (ex. v1.0.1) ou une section “Clarifications” en bas de document.

---

## 7. Verdict

| Critère | Note |
|--------|------|
| Clarté | ✅ Bonne |
| Complétude | ⚠️ À compléter (source API, champs, tenant) |
| Cohérence plateforme | ✅ Bonne (nomenclature payment à unifier) |
| Faisabilité | ✅ Oui |

**Conclusion** : La spec est **solide et utilisable** comme socle. Avec les précisions ci-dessus (API, champs, `payment.posted`, tenant, achats), elle peut servir de référence unique pour les cards d’agrégation Dorevia-UI et pour la conception de l’API read-only.
