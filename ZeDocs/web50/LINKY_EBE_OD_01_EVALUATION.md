# Évaluation — LINKY_EBE_OD_01 (Intégration OD de paie dans le calcul EBE)

**Document évalué :** `ZeDocs/web50/LINKY_EBE_OD_01.md`  
**Référentiel vérifié :** codebase Odoo laplatine2026 (tenant), Vault, Linky (dorevia-linky).  
**Date :** 2026-03-15

---

## 1. Synthèse

Le document **LINKY_EBE_OD_01** est **cohérent avec l’existant** et **correct sur le plan fonctionnel**. La vérification dans le code confirme :

- La paie EBE ne s’appuie que sur **bulletins (hr.payslip / payroll.charge.posted)**.
- Aucune source **OD comptables (comptes 641\*** / 645\*)** n’est utilisée aujourd’hui.
- Le message **« Aucun bulletin dans le Vault »** est bien celui affiché en Linky quand `payslipCount === 0`.
- La proposition (mapping 641/645 côté Vault + microcopy côté Linky) est pertinente et alignée avec l’architecture actuelle.

**Recommandation :** Valider le ticket tel quel et traiter la microcopy en attente d’implémentation backend (message temporaire §6.2) pour éviter toute ambiguïté pour La Platine.

---

## 2. Vérifications effectuées

### 2.1 Contexte document vs code

| Élément document | Vérification code | Statut |
|------------------|-------------------|--------|
| Paie La Platine par **OD** (pas module Payroll / bulletins Vault) | Tenant `laplatine2026` : pas de preuve dans le repo que la paie est en OD ; existence de `dorevia_vault_connector_hr_payroll` pour les tenants utilisant hr.payslip. Le doc décrit un cas d’usage **sans** bulletins. | **Cohérent** |
| Comptes 641100, 645100 (débit) ; 421\*, 431\* (crédit) | Aucune référence aux comptes 641, 645, 421, 431 dans `sources/vault` (recherche grep). | **Confirmé : non gérés aujourd’hui** |
| Message « Aucun bulletin dans le Vault » | `units/dorevia-linky/components/EbeCard.tsx` L.239 : `{payslipCount === 0 ? "Aucun bulletin dans le Vault" : "Hors périmètre"}`. | **Confirmé** |

### 2.2 Chaîne EBE actuelle (Linky + Vault)

1. **Linky (EbeCardWithPolling)**  
   - Appelle `/api/payroll` et `/api/ebe-evolution`.  
   - `payrollTotal` et `payslipCount` viennent **uniquement** de la réponse Vault `GET /ui/aggregations/payroll`.  
   - Si `payslipCount === 0` → affichage « Aucun bulletin dans le Vault » et EBE = proxy (marge brute sans charges personnel).

2. **Linky (api/payroll)**  
   - Proxy vers Vault `GET /ui/aggregations/payroll`.  
   - Commentaire explicite : *« Charges de personnel (odoo_model = 'hr.payslip', événement payroll.charge.posted). »*

3. **Vault (aggregations_payroll.go)**  
   - `PayrollAggregationHandler` appelle `db.PayrollAggregation(...)`.  
   - Commentaire : *« Retourne le total des charges de personnel (odoo_model = 'hr.payslip'). »*

4. **Vault (handlers/payroll.go)**  
   - Ingestion `POST /api/v1/payroll` : payload type bulletin (TotalCharges, DateFrom, etc.), stocké avec `odoo_model = "hr.payslip"`, `source = "payroll"`.  
   - Aucune lecture de `account.move.line` ni de comptes 641/645.

5. **Vault (ebe-evolution côté API Linky)**  
   - `app/api/ebe-evolution/route.ts` : appelle Vault sales, purchases, **payroll** ; EBE = ventes − achats − payroll.  
   - Si pas de données payroll → `payroll_unavailable: true`, série EBE sans charges personnel.

**Conclusion :** La chaîne EBE est bien **uniquement** alimentée par la source « bulletin / payroll » (hr.payslip). Aucun flux OD (écritures comptables 641/645) n’est utilisé. Le document a raison sur la cause du problème.

### 2.3 Odoo laplatine2026 — vérification instance

- **Config tenant :** `tenants/laplatine2026` (docker-compose UI lab, base `laplatine2026`, conteneur `odoo_lab_laplatine2026`).  
- **Vérification exécutée :** script `tenants/laplatine2026/scripts/verify_od_paie_641_645.py` exécuté via `docker exec` sur le conteneur Odoo (odoo shell -d laplatine2026). Résultat :

| Période | Lignes (641*+645*) | Total débit | Charge personnel |
|---------|--------------------|-------------|------------------|
| Janvier 2026 (31/01) | 2 lignes (641100 + 645100) | 10 750,00 € | **10 750,00 €** |
| Février 2026 (28/02) | 2 lignes (641100 + 645100) | 10 750,00 € | **10 750,00 €** |
| **Cumul YTD au 28/02/2026** | — | — | **21 500,00 €** |

Détail des écritures :
- **Janvier :** MISC/2026/01/0001 — 641100 Salaires et appointements 8 850 €, 645100 Cotisations URSSAF 1 900 € (débit).
- **Février :** MISC/2026/02/0001 — mêmes comptes, mêmes montants (OD de paie).

Les comptes 421000 et 431000 (contrepartie) sont bien présents dans le plan comptable ; les montants du document LINKY_EBE_OD_01 sont **confirmés sur l’instance Odoo laplatine2026**.

---

## 3. Points validés du document

- **§3 Hypothèse de cause** : correcte. Le moteur EBE dépend bien d’une source de type bulletin / événement payroll, pas des OD.
- **§4 Objectif** : clair (intégrer les charges de personnel issues des OD comptables).
- **§5 Règles fonctionnelles** : cohérentes (641\*/645\* à intégrer, 421\*/431\* à exclure, sens débit, période = date comptable).
- **§6 Microcopy** : le message actuel est bien celui du code ; la proposition §6.2 (message temporaire) et §6.3 (après intégration) est pertinente.
- **§8 Critères d’acceptation** : AC1–AC6 sont testables et alignés avec la chaîne actuelle (détection comptable, exclusion contreparties, cumul, affichage EBE, message exact, non-régression payroll).
- **§9 Notes d’implémentation** : Backend (mapping 641/645, rattachement EBE, extournes) et Front (microcopy, EBE complet / partiel / indisponible) sont conformes à l’architecture Vault + Linky.

---

## 4. Écart / action recommandée (microcopy)

En l’état, tant que le **backend (Vault)** n’intègre pas les OD 641/645 :

- Le document recommande (§6.2) d’afficher :  
  **« Charges de personnel présentes en OD comptables, non encore intégrées au calcul EBE »**  
  au lieu de **« Aucun bulletin dans le Vault »** lorsque la paie est en OD.

Aujourd’hui, Linky ne peut pas distinguer « pas de paie du tout » et « paie en OD non encore intégrée ». Donc :

- **Option A (recommandée)** : Implémenter côté Linky un **message générique** du type :  
  *« Charges de personnel : source bulletin (Vault) ou OD comptables à venir. »*  
  pour éviter de laisser « Aucun bulletin dans le Vault » comme seul message, en attendant le mapping 641/645.
- **Option B** : Ne pas modifier la microcopy avant que le Vault expose une info du type `payroll_source: "payslip" | "od" | "none"` (ou équivalent), puis afficher le message §6.2 uniquement quand `payroll_source === "od"` (à définir avec le backend).

---

## 5. Définition of Done (§10)

Les critères DoD du document sont **clairs et cohérents** avec le code :

- Moteur EBE prenant en compte les OD de paie (à faire côté Vault).
- Comptes 641\* et 645\* intégrés ; 421\* et 431\* exclus (à faire côté Vault).
- Microcopy corrigée (côté Linky, voir §4).
- Test La Platine : 21 500 € charges personnel cumulées au 28/02/2026 (à valider après implémentation + données Odoo réelles).
- Tuile EBE cohérente avec les données (déjà le cas pour le proxy ; à confirmer pour EBE complet avec OD).

---

## 6. Version backlog (§11)

La formulation proposée est **claire et suffisante** pour le backlog :

> Intégrer la paie saisie par OD dans le calcul EBE. Le moteur doit reconnaître les comptes 641\*/645\* comme charges de personnel, exclure les comptes de contrepartie (421\*/431\*), et remplacer le message « Aucun bulletin dans le Vault », non adapté au modèle comptable réel.

---

## 7. Décision projet

**Décision :** le ticket **LINKY-EBE-OD-01** est **validé**.

L’architecture actuelle EBE ne prend en compte que la source payroll (`hr.payslip` / `payroll.charge.posted`) et ignore les OD comptables de paie pourtant présentes sur le tenant La Platine. Le correctif est donc confirmé : intégrer les comptes 641\*/645\* dans la chaîne d’agrégation Vault pour alimenter les charges de personnel EBE, exclure les comptes de contrepartie 421\*/431\*, et corriger la microcopy Linky afin de ne plus afficher « Aucun bulletin dans le Vault » dans un contexte de paie saisie par OD.

**Traitement en 2 temps :**

| Lot | Contenu | Statut |
|-----|---------|--------|
| **Lot 1 — Quick win UI** | Microcopy générique : ne plus afficher « Aucun bulletin dans le Vault » ; afficher un message neutre (source paie actuelle non disponible / OD non encore intégrées). | **Implémenté** (EbeCard, message d’aide sous le bloc composantes manquantes). |
| **Lot 2 — Backend + Front** | Vault : lecture OD, mapping 641\*/645\* → charges de personnel, exclusion 421\*/431\*, agrégation, API `payroll_source` ; Linky : card EBE selon source (OD / bulletins / none). | **Implémenté ; validé et clos** (2026-03-15). Recette v1.0 = flux paie par OD ; scénarios payslip N/A hors périmètre. |

**Ordre d’exécution retenu :** 1) microcopy générique, 2) mapping Vault, 3) enrichissement UI par source.

---

## 8. Conclusion

- **Document :** aligné avec le code (Vault, Linky, tenant laplatine2026). Aucune incohérence relevée.  
- **Instance Odoo laplatine2026 :** vérifiée par requête directe (script `verify_od_paie_641_645.py`) : OD de paie MISC/2026/01/0001 et MISC/2026/02/0001, comptes 641100 (8 850 €) et 645100 (1 900 €) par mois, **cumul 21 500 € au 28/02/2026** — conforme au document.  
- **Implémentation actuelle :** EBE = ventes − achats − **payroll (hr.payslip uniquement)**.  
- **Lot 1 (microcopy) :** en place — badge « Source paie actuelle non disponible (OD non intégrées) » et paragraphe « Charges de personnel non disponibles via la source paie actuelle. Les OD comptables ne sont pas encore intégrées au calcul EBE. »  
- **Suite :** Lot 2 (mapping Vault 641/645), puis adaptation UI selon indicateur de source. **Mise à jour :** Lot 2 livré et validé sur le périmètre OD La Platine (2026-03-15). Recette v1.0 = flux paie par OD comptables ; tests source payslip N/A hors périmètre (voir RAPPORT_AVANCEMENT_EBE_OD_PAYROLL_2026-03-15.md).
