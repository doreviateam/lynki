# Analyse — PHASE_0_DOREVIA_UI_PREREQUIS_v1.0

**Document analysé** : `ZeDocs/web13/PHASE_0_DOREVIA_UI_PREREQUIS_v1.0.md`  
**Contexte** : Plan d’implémentation Dorevia-UI, VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE, unit_appSmith.

---

## 1. Synthèse

Le document **PHASE_0** est clair et actionnable : objectif (prérequis + validation données + décision architecture), checklist détaillée (infra, données Vault, sécurité, contrat API), décision actée (service dédié `units/dorevia-ui-api/`), et livrables Phase 0. Il est **aligné** avec le plan d’implémentation et la spec agrégations. Quelques **ajustements** sont recommandés : titre (typo), alignement des noms de champs avec le schéma Vault, et clarification du périmètre Phase 0 (prérequis seuls vs prérequis + API + première card).

---

## 2. Points forts

| Aspect | Commentaire |
|--------|-------------|
| **Objectif** | Préparer Dorevia-UI avant les cards : prérequis techniques, disponibilité données Vault, décision architecture. |
| **Tenant cible** | sarl-la-platine explicite — utile pour prioriser les validations. |
| **Checklist** | Infra (Appsmith, volumes, Caddy, URL, HTTPS), données Vault, sécurité, contrat API minimal. |
| **Décision d’architecture** | Option retenue = **service dédié Dorevia-UI API** (`units/dorevia-ui-api/`) avec motifs (séparation, sécurité, évolutivité, Vault = source de vérité). |
| **Sécurité** | API read-only, token tenant-scoped, pas d’accès direct Appsmith → DB Vault, signup Appsmith contrôlé, secrets hors git. |
| **Convention paiements** | `payment.posted` validé — cohérent avec SPEC vaulting payments et évaluation. |
| **Suite logique** | Phase 1 (card Ventes + filtres), puis impayés, ratios, cash brut, cash net. |

---

## 3. Cohérence avec les autres documents

| Référence | Alignement | Remarque |
|-----------|------------|----------|
| **Plan d’implémentation** | ✅ | Décision “service dédié” correspond à l’option “microservice dédié” du plan (Phase 0.4). |
| **Plan — DoD Phase 0** | ⚠️ | Le plan limite Phase 0 à : Appsmith OK, DNS, Hello Dorevia-UI, **choix d’architecture**. Le doc PHASE_0 inclut en livrable : **API déployée**, **endpoint /ui/aggregations accessible**, **Appsmith consomme l’API**, **première card “Ventes certifiées”**. Donc le doc PHASE_0 a un périmètre Phase 0 plus large (prérequis + première tranche livrable). À harmoniser : soit le plan étend la Phase 0, soit le doc PHASE_0 restreint les livrables à “prérequis + décision” et reporte “API + première card” en Phase 1. |
| **VERIFICATION_VAULT** | ⚠️ | Voir §4 (noms de champs). |
| **SPEC agrégations** | ✅ | Filtres (scope, date_debut, date_fin, granularity) et convention payment.posted cohérents. |

---

## 4. Noms de champs “Données Vault”

Le doc liste les **champs requis** pour les données Vault :

- tenant_id  
- event_type  
- occurred_at  
- amount_total  
- currency  
- scale  

**Dans le schéma Vault actuel** (table `documents`, cf. VERIFICATION_VAULT_DATE_AMOUNT_PAR_SCOPE) :

| Doc PHASE_0 | Vault (documents) | Commentaire |
|-------------|-------------------|-------------|
| tenant_id | **tenant** | Même notion ; nom de colonne = `tenant`. |
| event_type | Pas de colonne unique | Type déduit par **odoo_model** + **source** (ex. `account.move`, `payment`). |
| occurred_at | **invoice_date** (factures) ; **created_at** (tous) ; **payload_json->>'payment_date'** (paiements) | Pas de colonne générique `occurred_at`. |
| amount_total | **total_ttc** / **total_ht** (factures) ; **payload_json->>'amount'** (paiements) | Pas de colonne générique `amount_total`. |
| currency | **currency** | OK. |
| scale | — | Non présent dans le schéma ; à définir (échelle décimale ? devise ?). |

**Recommandation** :  
- Soit **préciser** que la liste décrit le **contrat de l’API Dorevia-UI** (ce que l’API exposera), et que le service dédié fera le **mapping** depuis Vault (invoice_date → occurred_at, total_ttc → amount_total, etc.).  
- Soit **aligner** la checklist “Données Vault” sur le schéma réel : “Pour factures : tenant, odoo_model, invoice_date, total_ttc, currency. Pour paiements : tenant, source='payment', payload_json (payment_date, amount), currency.”  
- **scale** : à définir ou retirer si non utilisé en Phase 0.

---

## 5. Contrat API — chemin et paramètres

- **Chemin** : doc = `GET /ui/aggregations` ; plan = `GET /api/v1/aggregations` (ou `/api/v1/ui/aggregations`). Recommandation : **fixer une seule forme** (ex. `/api/v1/ui/aggregations` ou `/ui/aggregations`) et la reprendre partout.  
- **Paramètres** : scope, date_debut, date_fin, granularity — **OK**, cohérents avec la spec agrégations. Le **tenant** peut être déduit du token ou passé en paramètre ; à préciser dans le contrat (header vs query).

---

## 6. Livrables Phase 0 (Definition of Done)

Le doc indique comme livrables Phase 0 :

- [ ] API Dorevia-UI déployée (service dédié)  
- [ ] Endpoint `/ui/aggregations` accessible pour sarl-la-platine  
- [ ] Appsmith consomme l’API  
- [ ] Première card “Ventes certifiées” affichée  

**Point d’attention** : cela revient à livrer en Phase 0 une **première tranche fonctionnelle** (API + une card), et non uniquement les “prérequis”. C’est cohérent avec une approche “Phase 0 = mise en route jusqu’à première valeur”, mais il faut que le **plan d’implémentation** le reflète (Phase 0 = prérequis + décision + API + première card), ou alors restreindre le doc PHASE_0 aux seuls prérequis et déplacer “API + première card” dans une “Phase 0b” ou “Phase 1” selon le plan.

**Recommandation** : Soit mettre à jour le plan pour que Phase 0 inclue explicitement “API déployée + première card Ventes certifiées”, soit scinder le doc PHASE_0 en “Prérequis (DoD stricte)” et “Première tranche (API + card)” et aligner les intitulés de phases.

---

## 7. Détails mineurs

| Élément | Suggestion |
|--------|------------|
| **Titre du document** | Corriger `PHASE_0\_DOREVIA_UI_PREREQUIS` → `PHASE_0_DOREVIA_UI_PREREQUIS` (retirer le backslash d’échappement). |
| **Format** | Les séparateurs `--------` peuvent être uniformisés en `---` (Markdown standard). |
| **Références croisées** | Ajouter en en-tête les liens vers le plan d’implémentation et VERIFICATION_VAULT pour faciliter la navigation. |

---

## 8. Verdict

| Critère | Note |
|--------|------|
| Clarté | ✅ Bonne |
| Complétude | ✅ Bonne (checklist, décision, DoD) |
| Cohérence | ⚠️ À harmoniser (champs Vault, périmètre Phase 0 vs plan, chemin API) |
| Actionnabilité | ✅ Oui |

**Conclusion** : Le document **PHASE_0** est solide et utilisable. Recommandations prioritaires : (1) aligner la checklist “Données Vault” avec le schéma réel ou préciser qu’il s’agit du contrat API ; (2) harmoniser le périmètre Phase 0 avec le plan (prérequis seuls vs prérequis + API + première card) ; (3) fixer le chemin d’API et le titre du document.
