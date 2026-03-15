# Procès-Verbal de recette — Port account_reconcile_oca Odoo 19

**Date de la recette :** *À compléter*  
**Objet :** Recette comptable du widget OCA de rapprochement bancaire sur le tenant o19 (Odoo 19)  
**Référence :** `ZeDocs/web39/SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`, `RAPPORT_MOA_PORT_ACCOUNT_RECONCILE_OCA_O19_2026-03-07.md`

---

## 1. Participants

| Rôle | Nom | Entité |
|------|-----|--------|
| Maîtrise d'ouvrage (MOA) / Comptable | *À compléter* | Dorevia |
| Maîtrise d'œuvre (MOE) | *À compléter* | Équipe technique |
| Recette | *À compléter* | — |

---

## 2. Périmètre

| Élément | Description |
|---------|-------------|
| **Modules** | account_reconcile_model_oca, account_reconcile_oca (port O19), dorevia_vault_connector (dépendance réactivée) |
| **Environnement** | Tenant o19 — Comptabilité → Relevés bancaires → Rapprochement |
| **Critères** | 3 scénarios standardisés + ergonomie + événements DVIG sans duplication |

---

## 3. Scénarios de recette (à exécuter sur o19)

### 3.1 Scénario 1 — Rapprochement exact

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Créer une facture client (montant ex. 100 €), la valider | Facture en état « Publié » |
| 2 | Créer un relevé bancaire, ajouter une ligne : même montant (100 €), même partenaire | Ligne « À rapprocher » |
| 3 | Ouvrir le rapprochement (bouton Rapprocher ou clic sur la ligne) | Widget OCA s’ouvre |
| 4 | Sélectionner la facture proposée (suggestion) ou l’ajouter manuellement | Ligne de contrepartie affichée |
| 5 | Cliquer sur « Rapprocher » | Statut « Rapproché », pas d’erreur |

**Résultat scénario 1 :** ☐ Conforme ☐ Non conforme ☐ Non testé — *Commentaire : …*

### 3.2 Scénario 2 — Rapprochement avec écart (write-off)

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Créer une facture client (ex. 100 €), valider | Facture publiée |
| 2 | Créer une ligne de relevé : montant légèrement différent (ex. 98 €) ou même montant + règle write-off | Ligne à rapprocher |
| 3 | Ouvrir le rapprochement, associer la facture | Écart affiché |
| 4 | Appliquer un modèle d’écart (write-off) si proposé, ou saisir l’écart | Écriture d’écart créée |
| 5 | Rapprocher | Rapprochement complet, statut « Rapproché » |

**Résultat scénario 2 :** ☐ Conforme ☐ Non conforme ☐ Non testé — *Commentaire : …*

### 3.3 Scénario 3 — Délettrage

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Partir d’une ligne déjà rapprochée (ex. après scénario 1) | Statut « Rapproché » |
| 2 | Ouvrir le rapprochement de cette ligne | Données du rapprochement affichées |
| 3 | Cliquer sur « Délettrer » / « Annuler le rapprochement » (confirmer si demandé) | Statut repasse à « À rapprocher » |
| 4 | Vérifier que la facture n’est plus marquée comme payée (si applicable) | Solde à recevoir à nouveau visible |

**Résultat scénario 3 :** ☐ Conforme ☐ Non conforme ☐ Non testé — *Commentaire : …*

---

## 4. Checklist ergonomie (MOA / Comptable)

| # | Critère | Résultat | Commentaire |
|---|---------|----------|-------------|
| 4.1 | Workflow perçu comme identique ou équivalent à Odoo 18 (laplatine2026) | ☐ Oui ☐ Non | |
| 4.2 | Widget de rapprochement — rapidité, lisibilité | ☐ Conforme ☐ Non conforme | |
| 4.3 | Suggestions automatiques (factures / paiements proposés) | ☐ Conforme ☐ Non conforme ☐ N/A | |
| 4.4 | Règles de rapprochement (invoice_matching, write-off) utilisables | ☐ Conforme ☐ Non conforme | |
| 4.5 | Gestion des écarts (write-off) claire | ☐ Conforme ☐ Non conforme | |
| 4.6 | Délettrage simple et sans erreur | ☐ Conforme ☐ Non conforme | |

---

## 5. Contrôle technique (optionnel)

| # | Critère | Résultat | Commentaire |
|---|---------|----------|-------------|
| 5.1 | Événements DVIG : après 1 rapprochement, 1 seul `bank.move.reconciled` pour la ligne | ☐ Conforme ☐ Non conforme | Requête outbox_events (voir rapport MOA § 9.2) |
| 5.2 | Après 1 délettrage, 1 seul `bank.move.unreconciled` pour la ligne | ☐ Conforme ☐ Non conforme | |
| 5.3 | reinstall_o19.sh installe bien account_reconcile_oca (+ account_reconcile_model_oca) | ☐ Conforme ☐ Non conforme | |

---

## 6. Synthèse

| Scénario / Lot | Conforme | Non conforme | Non testé |
|----------------|----------|--------------|-----------|
| Scénario 1 — Rapprochement exact | | | |
| Scénario 2 — Write-off | | | |
| Scénario 3 — Délettrage | | | |
| Ergonomie (4.1–4.6) | | | |
| Technique (5.1–5.3) | | | |

**Taux de conformité :** _____ %

---

## 7. Décision

| Décision | ☐ |
|----------|---|
| **Accepté** | |
| **Accepté sous réserve** (réserves : _____________________ ) | |
| **Refusé** (motif : _____________________ ) | |

**Signature MOA / Comptable :** _____________________ **Date :** __________

---

**Document préparé pour la Phase 6 du port account_reconcile_oca Odoo 19 (web39).**
