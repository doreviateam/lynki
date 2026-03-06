# Rapport MOA — Intégration Masse Salariale (5 SMIC)

**Date :** 2026-03-03  
**Objet :** Indicateur de couverture salariale dans le cockpit Linky  
**Statut :** Réalisé et déployé (Janvier + Février 2026)  
**Référence :** SPEC_MASSE_SALAIRE.md v1.0

---

## 1. Contexte

### 1.1 Objectif

Relier la **Position validée** (preuve financière Vault) à la **responsabilité employeur** (masse salariale) via un indicateur de gouvernance :

> « Combien de mois de salaires ma trésorerie peut-elle couvrir ? »

**Formule :** Couverture (mois) = Position validée (Vault) ÷ 10 750 €

### 1.2 Hypothèses financières

- 5 salariés au SMIC
- Masse salariale mensuelle : **10 750 €** (coût employeur 2 150 € × 5)
- Répartition : 641 (8 850 €) + 645 (1 900 €) → 421 (7 000 €) + 431 (3 750 €)

---

## 2. Solution livrée

### 2.1 Indicateur Couverture salariale

**Emplacement :** Card Trésorerie (en tête du cockpit Linky)

**Nouvelle ligne affichée :**

| Libellé | Valeur | Source |
|---------|--------|--------|
| 💼 Couverture salariale | X mois | Position validée ÷ 10 750 € |

**Configuration :** Valeur fixe par tenant (`MASSE_SALARIALE_MENSUELLE_EUR=10750`)

### 2.2 Contraintes d'architecture respectées

- ✅ Aucune modification Vault
- ✅ Aucun nouvel endpoint
- ✅ Calcul côté Linky
- ✅ Données source : ERP + paiements banque (Vault)

---

## 3. Données ERP réalisées

### 3.1 OD (Opérations Diverses)

| Pièce | Date | Montant | Statut |
|-------|------|---------|--------|
| MISC/2026/01/0001 | 31/01/2026 | 10 750 € | Comptabilisé |
| MISC/2026/02/0001 | 28/02/2026 | 10 750 € | Comptabilisé |

**Total :** 21 500 € (Janvier + Février ; Mars à créer en mars 2026)

### 3.2 Paiements banque

| Mois | Compte | Montant | Odoo ID | Vault |
|------|--------|---------|---------|-------|
| Janvier | 421 Personnel | 7 000 € | 676 | ✅ |
| Janvier | 431 URSSAF | 3 750 € | 677 | ✅ |
| Février | 421 Personnel | 7 000 € | 678 | ✅ |
| Février | 431 URSSAF | 3 750 € | 679 | ✅ |

**Total :** 21 500 € — les 4 paiements sont présents dans le Vault.

### 3.3 Procédure de création des paiements

Le menu **Paiements fournisseurs** n'étant pas accessible dans l'interface Odoo (erreur « Action manquante »), les 4 paiements ont été créés via un **script Python** exécuté en shell Odoo :

- **Script :** `tenants/laplatine2026/scripts/create_salary_payments_from_od.py`
- **Commande :** `cat .../create_salary_payments_from_od.py | docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http`

---

## 4. Flux de données

```
OD (écritures 421, 431)
        ↓
Paiements créés (script ou manuel)
        ↓
Paiements validés → Connecteur Odoo → DVIG → Vault (automatique)
        ↓
Position validée + Couverture salariale (Linky)
```

| Étape | Automatique ? |
|-------|----------------|
| OD → Paiements | ❌ Manuel (script ou interface) |
| Paiements → Vault | ✅ Automatique (connecteur) |
| Vault → Linky | ✅ Automatique (API) |

---

## 5. Où voir les données dans Linky

| Card | Indicateur |
|------|------------|
| **Trésorerie** | Couverture salariale : X mois |
| **Trésorerie** | Position validée (Vault) |
| **Cash** | Décaissements (inclut les 21 500 € salaires) |

---

## 6. Points d'attention

### 6.1 Création des paiements

- **Problème :** Menu Paiements fournisseurs inaccessible dans Odoo (action 228 manquante ou restreinte)
- **Contournement :** Script `create_salary_payments_from_od.py` à exécuter manuellement
- **Évolution possible :** Automatisation (cron Odoo ou script planifié) pour les mois suivants

### 6.2 Mars 2026

- OD à créer en mars 2026 (même structure)
- 2 paiements à créer (421 + 431) — via script ou interface si corrigée

### 6.3 Position validée et rapprochement

La **Position validée** dépend du rapprochement bancaire. Les paiements vaultés contribuent à la position une fois rapprochés avec les relevés bancaires.

### 6.4 Stabilisation (2026-03)

Pour corriger « Solde comptable : non configuré », « Taux 0 % » et « Couverture -2 mois » :

1. **Platform core-stinger** : ajout de `ODOO_BANK_RECONCILIATION_URL_LAPLATINE2026=http://odoo_lab_laplatine2026:8069/dorevia/vault/linky_bank_reconciliation` dans le Vault.
2. **Linky** : couverture salariale plafonnée à 0 mois lorsque la position validée est négative (évite l’affichage « -2 mois »).
3. **Backfill** (si lettrage déjà effectué) : exécuter `backfill_reconciliation_confirmation_events` dans Odoo pour envoyer les rapprochements au Vault.
4. **Vault** : correction inversion À traiter/Traité — `processReconciled` = rv (reconciled), `processUnreconciled` = uv (unreconciled) ; fallback `uv = vol` (pas rv) ; `reliability_volume` = rv/total. Image `dorevia/vault:atraitre-traite-fix-2026-03-03`.

---

## 7. Definition of Done — statut

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| ✔ OD créées (Jan–Fév) | ✅ | 2 OD, Mars à venir |
| ✔ Paiements banque | ✅ | 4 paiements créés |
| ✔ Paiements dans Vault | ✅ | Vérifié |
| ✔ Position validée impactée | ✅ | Via rapprochement |
| ✔ Indicateur couverture calculable | ✅ | Affiché dans Card Trésorerie |

---

## 8. Documents de référence

| Document | Rôle |
|----------|------|
| `SPEC_MASSE_SALAIRE.md` | Spécification fonctionnelle |
| `AVIS_EXPERT_SPEC_MASSE_SALAIRE_2026-03-03.md` | Avis d'expert |
| `DIAGNOSTIC_PAIEMENTS_SALAIRES_ABSENTS_VAULT.md` | Diagnostic initial |
| `create_salary_payments_from_od.py` | Script création paiements |

---

## 9. Synthèse

L'indicateur **Couverture salariale** est opérationnel dans Linky. Les données Janvier et Février (2 OD + 4 paiements) sont créées et vaultées. La création des paiements à partir des OD reste manuelle (script) en raison de l'inaccessibilité du menu Paiements dans l'interface Odoo. Une évolution vers l'automatisation est envisageable pour les mois suivants.

---

**Fin du rapport MOA**
