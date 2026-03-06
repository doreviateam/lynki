# Évaluation — Amendements SPEC Company v1.1

**Document évalué** : Amendements architecturaux recommandés (SPEC Company dans le Vault et Filtre Company Linky v1.1)  
**Réf. base** : SPEC_VAULT_LINKY_COMPANY_v1.0.md  
**Date** : 2026-02-07

---

## Synthèse

| Verdict | Commentaire |
|--------|-------------|
| **Intégration recommandée** | Les amendements sont cohérents avec la v1.0, renforcent l’évolutivité et la traçabilité. Quelques points à préciser ou à aligner avec l’existant (nommage, idempotence). Convient d’intégrer en **v1.1** ou en **annexe normative** à la spec. |

---

## 1. Format normatif `company_id` (§1)

**Contenu** : `company_id` au format `<source_system>:<source_company_id>` (ex. `odoo.stinger.sarl-la-platine:1`).

**Évaluation**  
- **Fort** : Unicité globale, multi-ERP, pas de référentiel central obligatoire, audit clair.  
- **À prévoir** : La v1.0 laissait le type « à définir » ; ce format fixe le contrat et évite des migrations ultérieures douloureuses.  
- **Impact** : Odoo/DVIG doit produire ce préfixe (ex. `odoo.<env>.<tenant>:<company_id_odoo>`). À documenter dans la spec ingest / connecteur.

**Recommandation** : **Valider** et intégrer en spec normative (v1.1 ou annexe). Préciser en spec les règles de construction du préfixe (qui définit `source_system`, caractères autorisés, cas des ERP futurs).

---

## 2. Identité logique document (§2)

**Contenu** : Identité logique = tenant + source_id + company_id (si dispo) ; impact idempotence, déduplication, agrégations, retry/replay.

**Évaluation**  
- **Fort** : Évite les collisions inter-company pour un même `source_id` (ex. deux companies avec `odoo_id=1`).  
- **Existant** : Le Vault utilise aujourd’hui `(tenant, idempotency_key)` pour l’idempotence (events DVIG). La clé d’idempotence est fournie par l’émetteur ; si elle est déjà construite avec tenant+source_id (et éventuellement company), pas de changement. Si elle ne contient pas company_id, introduire company_id dans la règle d’unicité implique soit :  
  - que la clé fournie par DVIG inclut déjà company_id (recommandé),  
  - soit que le Vault construit une clé interne tenant+source_id+company_id pour déduplication.  
- **À trancher** : La spec v1.1 doit préciser si l’**idempotence** reste pilotée par la clé fournie (et donc que l’émetteur doit inclure company_id dans le calcul de la clé) ou si le Vault définit une unicité interne (tenant, source_id, company_id). Recommandation : exiger que la clé d’idempotence fournie soit construite avec (tenant, source_id, company_id) pour rester cohérent avec « la preuve porte le contexte ».

**Recommandation** : **Valider** le principe ; ajouter en spec la règle explicite d’idempotence (clé fournie inclut company_id, ou unicité Vault sur tenant+source_id+company_id).

---

## 3. Documents legacy `company_id = NULL` (§3)

**Contenu** : Aucun filtre → NULL inclus ; filtre company actif → NULL exclus. UI : message non bloquant si filtre actif et documents NULL.

**Évaluation**  
- **Aligné** avec la v1.0 (comportement déjà décrit).  
- **Plus-value** : Message utilisateur explicite (« Certaines pièces historiques ne sont pas encore associées à une société… ») améliore la transparence et évite les doutes sur les totaux.

**Recommandation** : **Valider** ; intégrer le libellé (ou variante validée produit) dans la spec Linky / comportement UI.

---

## 4. Période filtre vs couverture réelle (§4)

**Contenu** : Distinguer `filter_from` / `filter_to` (période demandée) et `coverage_from` / `coverage_to` (période réellement couverte par les documents). Usage : en-tête = période sélectionnée ; cartes = couverture réelle.

**Évaluation**  
- **Existant** : Le Vault expose déjà **`effective_from`** et **`effective_to`** dans les réponses d’agrégation (min/max `invoice_date` des documents trouvés). La v1.0 et Linky utilisent cela pour l’affichage « Toutes périodes ».  
- **Sémantique** : `effective_*` = couverture réelle ; `from` / `to` = plage de filtre demandée. L’amendement propose de renommer en `coverage_from`/`coverage_to` et `filter_from`/`filter_to` pour plus de clarté.  
- **Impact** : Renommage possible en v1.1 pour cohérence normative, en gardant une **rétrocompatibilité** (ex. conserver `effective_from`/`effective_to` en alias ou déprécier progressivement). Linky consomme déjà `effective_from`/`effective_to` ; un renommage côté Vault implique d’adapter Linky ou de maintenir les deux noms un temps.

**Recommandation** : **Valider** l’intention (distinction claire filtre / couverture). Soit : (a) adopter `coverage_from`/`coverage_to` + `filter_from`/`filter_to` en v1.1 avec rétrocompatibilité (ex. garder `from`/`to` et `effective_*` en parallèle), soit (b) documenter dans la spec que `from`/`to` = filtre et `effective_from`/`effective_to` = couverture, sans renommer tout de suite.

---

## 5. Endpoint Companies — contrat minimal (§5)

**Contenu** : `GET /ui/companies?tenant=<tenant_id>` ; réponse minimale `[{ company_id, documents_count }]`.

**Évaluation**  
- **Utile** : Alimente le sélecteur Linky sans référentiel externe ; `documents_count` aide au debug et peut servir à l’UX (ex. afficher le nombre de pièces par société).  
- **Aligné** avec la v1.0 (endpoint optionnel listant les companies du tenant).  
- **Libellé** : Le §6 (roadmap) prévoit d’afficher d’abord `company_id` brut ; pas de libellé dans le contrat minimal, cohérent.

**Recommandation** : **Valider** et figer ce contrat dans la spec (v1.1 ou annexe). À implémenter en même temps que le filtre Company Linky.

---

## 6. Stratégie libellé Company — roadmap (§6)

**Contenu** : v1 = afficher `company_id` brut ; v1.1+ = mapping optionnel (Odoo, API Dorevia, référentiel).

**Évaluation**  
- **Pragmatique** : Livre la valeur (filtre par company) sans bloquer sur un référentiel. Évolutivité claire.

**Recommandation** : **Valider**.

---

## 7. Migration et legacy (§7)

**Contenu** : Aucune modification des documents déjà vaultés ; company_id nullable ; backfill optionnel ; pas de re-signature / re-hash.

**Évaluation**  
- **Identique** à la philosophie v1.0 et à l’évaluation déjà faite (colonne nullable, pas de réécriture).

**Recommandation** : **Valider** ; rappel utile en annexe normative.

---

## 8. Philosophie et impact produit (§8–10)

**Contenu** : Hiérarchie Tenant → Company → Période ; preuve porte le contexte ; SIG, audit, multi-ERP, consolidation, lecture CFO-grade ; compatibilité future.

**Évaluation**  
- **Utile** pour alignement produit et équipes ; ne change pas le contrat technique mais renforce la cohérence des choix.

**Recommandation** : **Conserver** en préambule ou section « Principes » de la spec v1.1.

---

## 9. Statut et forme (§11–12)

**Contenu** : Intégrer comme SPEC Company v1.1 (amendements architecturaux) ou comme annexe « Contraintes architecturales obligatoires ».

**Évaluation**  
- Deux options raisonnables :  
  - **Option A** : Publier un unique document **SPEC_VAULT_LINKY_COMPANY_v1.1.md** qui inclut la v1.0 + les amendements (format company_id, identité logique, legacy, endpoint companies, coverage/filter, UI legacy, principes).  
  - **Option B** : Garder la v1.0 comme spec de base et ajouter un document **Annexe — Contraintes architecturales (v1.1)** référencé par la v1.0, pour les règles normatives (format company_id, idempotence, contrat companies, comportement NULL).

**Recommandation** : **Option B** si on veut distinguer « fonctionnalité filtre Company » (v1.0) et « règles d’architecture pour la suite » (annexe v1.1). **Option A** si on préfère une seule spec à jour pour les nouveaux développements.

---

## 10. Points d’attention pour l’implémentation

| Sujet | Action recommandée |
|-------|---------------------|
| **Format company_id** | Documenter dans la spec la règle de construction du préfixe (ex. `odoo.<env>.<tenant>`) et les caractères autorisés. |
| **Idempotence** | Décider : clé fournie par DVIG doit inclure company_id, ou unicité Vault (tenant, source_id, company_id). Documenter dans la spec et adapter le connecteur / Vault en conséquence. |
| **Coverage / filter** | Soit renommer en coverage_from/to et filter_from/to avec rétrocompatibilité, soit officialiser dans la spec que from/to = filtre et effective_from/to = couverture. |
| **Message UI legacy** | Valider le libellé exact avec produit avant implémentation Linky. |

---

## Conclusion

Les amendements sont **solides, cohérents avec la v1.0** et **recommandés pour intégration**. Ils sécurisent l’unicité et l’évolutivité multi-ERP, clarifient le comportement legacy et améliorent la lisibilité pour l’audit. Les seuls ajustements à prévoir concernent : (1) la règle d’idempotence (inclusion de company_id dans la clé ou unicité côté Vault), (2) le nommage filtre/couverture (alignement avec l’existant ou renommage planifié), (3) la documentation du format `company_id` et du préfixe. Une fois ces points figés dans la spec v1.1 ou l’annexe, l’implémentation peut suivre de façon alignée.
