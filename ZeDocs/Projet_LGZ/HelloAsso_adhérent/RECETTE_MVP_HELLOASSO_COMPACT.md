# Recette lab — MVP HelloAsso → Odoo (`res.partner`)

> **Code actuel** : le module `dorevia_helloasso_adherent` a été **retiré du dépôt**. La synchro et les tests utiles sont sous **`dorevia_helloasso_members`** et **`dorevia_helloasso_connector`**. Les chemins de fichiers ci-dessous qui mentionnent encore `dorevia_helloasso_adherent/` sont obsolètes — substituer par `dorevia_helloasso_members/`.

**Périmètre** : validation du MVP de synchro HelloAsso → contacts Odoo sur le lab.  
**Environnement** : lab (`glz-rgl` ou équivalent), base dédiée, credentials HelloAsso sandbox ou prod selon périmètre.  
**Référence** : avril 2026 — `dorevia_helloasso_members`, `dorevia_helloasso_connector`, `dorevia_partner_membership_fields`.

## Décision proposée

- MVP **validable** sur les scénarios principaux.
- Scénarios couverts : **§1 nominal**, **§2 rejouabilité**, **§3 rapprochement par email**, **§4 doublon email Odoo**.
- Point restant non bloquant : **§5 variation de payload**.
- La recette manuelle détaillée du §3 reste **optionnelle** si les tests Python du module sont verts.

## État de validation

| Zone | Statut |
|------|--------|
| §1 Cas nominal | OK — lab + tests auto |
| §2 Rejouabilité | OK — lab + tests auto |
| §3 Rapprochement par email | OK en comportement — tests auto ; preuve manuelle optionnelle |
| §4 Doublon d’email | OK en comportement — tests auto ; preuve manuelle optionnelle |
| §5 Variation de payload | Non couvert en auto |
| Automatisation planifiée (`ir.cron`) | OK — lab ; voir [rapport module + annexe validation](./VALIDATION_LAB_HELLOASSO_CRON.md) |

## Rappels produit

- L’API HelloAsso renvoie les **montants en centimes** ; Odoo stocke le champ montant en **euros**.
- La **prévisualisation** expose un rapport texte et des tableaux chemin/valeur.
- L’onglet **HelloAsso** sur le contact est réservé au groupe **Administration**.

## Préparation

- [x] Prévisualisation HelloAsso OK.
- [x] Références relevées : `formType`, `formSlug`, exemple `order.id`, exemple `payment.id`.

## 1. Cas nominal

**But** : créer un contact Odoo à partir d’un adhérent HelloAsso inexistant côté Odoo.

- [x] Lancer **Synchroniser les adhérents**
- [x] Vérifier qu’un **contact unique** est créé
- [x] Vérifier email / prénom / nom
- [x] Vérifier :
  - `helloasso_external_id`
  - `helloasso_order_id`
  - `helloasso_source_form`
  - `helloasso_sync_status = synced`
- [x] Vérifier `helloasso_payment_amount` en **euros**

## 2. Rejouabilité

**But** : relancer la synchro sans changement côté HelloAsso ni Odoo.

- [x] Relancer **Synchroniser les adhérents**
- [x] Vérifier : **aucun doublon**
- [x] Vérifier : même partenaire repris
- [x] Vérifier : aucun effet de bord

## 3. Rapprochement par email

**But** : si un contact Odoo existe déjà avec le même email, la synchro doit **mettre à jour** ce contact au lieu d’en créer un nouveau.

**Résultat attendu**

- [x] **0 création**
- [x] **1 mise à jour**
- [x] **0 ignoré**
- [x] Aucun nouveau `res.partner`
- [x] Enrichissement de la fiche existante avec :
  - `helloasso_external_id`
  - `helloasso_order_id`
  - `helloasso_source_form`
  - `helloasso_form_type`
  - `helloasso_payment_date`
  - `helloasso_payment_mean`
  - `helloasso_payment_amount`
  - `helloasso_sync_status = synced`
- [x] Montant cohérent en unité métier : **10,00 €** et non **1000,00**

**Statut**

- Validé par tests auto.
- Recette manuelle terrain possible en complément, non bloquante si CI verte.

## 4. Doublon d’email côté Odoo

**But** : si deux partenaires Odoo portent le même email, la synchro ne doit pas choisir arbitrairement.

**Résultat attendu**

- [x] Paiement **ignoré**
- [x] **Aucune création**
- [x] **Aucune mise à jour**
- [x] Avertissement dans les logs Odoo de type *email ambigu*
- [x] Notification cohérente avec compteur **Ignorés**

**Note**

- Le statut `pending_review` existe sur le modèle mais n’est pas encore posé automatiquement dans le MVP.

## 5. Variation de payload

À vérifier au besoin :

- [ ] filtre métier conforme
- [ ] absence de plantage si `items` absent
- [ ] gestion propre d’un champ manquant

## Synthèse de validation

Ordre recommandé :

1. **Cas nominal**
2. **Rejouabilité**
3. **Rapprochement par email**
4. **Doublon email**
5. **Payload**

## Ticket de clôture

À consigner après recette :

- date
- environnement / base
- scénarios OK / KO
- pour chaque KO : observé / attendu / log ou capture utile

## Références

- Modules : `dorevia_helloasso_members`, `dorevia_helloasso_connector`, `dorevia_partner_membership_fields`, `dorevia_res_config_dms_shim`
- SPEC : `SPEC_DOREVIA_HELLOASSO_ADHERENT.md`
- ADR : `ADR_DECISIONS_ARBITRAGE_HELLOASSO_ODOO_ADHERENTS.md`
- Logique synchro : `dorevia_helloasso_members/models/helloasso_sync.py`
- Tests : `dorevia_helloasso_members/tests/test_helloasso_sync.py`

---

## Checklist PR (≈ 30 s)

- [ ] Tests `dorevia_helloasso_members` verts (`--test-tags=/dorevia_helloasso_members`, base dédiée type `test_helloasso_mvp` si besoin).
- [ ] Lab : synchro nominale + montants affichés en **euros** (pas centimes bruts).
- [ ] §5 payload : **non bloquant** à ce stade ; ouvrir un ticket si un cas métier doit être approfondi.

*Version détaillée (recette longue, commandes Docker, historique cases) : `RECETTE_MVP_HELLOASSO.md`.*
