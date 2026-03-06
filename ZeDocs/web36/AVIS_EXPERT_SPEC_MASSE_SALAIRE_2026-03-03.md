# Avis d'expert — SPEC Masse Salariale (5 SMIC) vs implémentation actuelle

**Date :** 2026-03-03  
**Référence :** SPEC_MASSE_SALAIRE.md v1.0  
**Contexte :** Analyse de la SPEC au regard de ce qui est déjà implémenté (Card Trésorerie, dashboard-metrics, Vault)

---

## 1. Synthèse exécutive

| Élément | SPEC Masse Salariale | Implémenté | Écart |
|--------|----------------------|------------|-------|
| Position validée (Vault) | Entrée du calcul Couverture | ✅ Disponible | Aucun |
| Masse salariale (641+645) | 10 750 € / mois (moyenne) | ❌ Non disponible | **Blocant** |
| Indicateur Couverture | Position ÷ 10 750 € | ❌ Non implémenté | **À faire** |
| Affichage cockpit | Couverture (mois) | ❌ Aucune carte | **À faire** |
| Données ERP (OD, paiements) | 3 OD + 6 paiements | ❌ Hors périmètre Linky | Données à créer en ERP |

**Verdict :** La SPEC est **cohérente** avec l’architecture actuelle et **réutilise correctement** la Position validée. En revanche, **aucun élément spécifique à la masse salariale n’est implémenté**. L’indicateur de couverture salariale est faisable dès que la masse salariale est disponible.

---

## 2. Analyse détaillée

### 2.1 Ce qui est déjà en place (réutilisable)

La Card Trésorerie (Position) et l’API `dashboard-metrics` exposent :

- **`validated_balance`** (Position validée Vault) — exactement ce que la SPEC utilise pour le numérateur du ratio
- **`erp_balance`** — solde comptable (non requis pour la couverture)
- **`reconciliation_rate`** — taux de rapprochement (non requis pour la couverture)

L’endpoint `/api/treasury` et `_details.treasury` fournissent déjà `validated_balance`. Aucune évolution Vault n’est nécessaire pour cette donnée.

### 2.2 Ce qui manque

#### A. Source de la masse salariale

La SPEC prévoit :

> Moyenne des comptes 641 + 645 sur Janvier, Février, Mars = 10 750 €

**Problème :** Vault ne propose pas d’agrégation par compte comptable (641, 645). Les agrégations existantes concernent :

- `sales`, `purchases`, `payments-in`, `payments-out`, `adjustments`
- `treasury`, `ar-by-partner`, `sales-by-partner`, `pos-sessions`

Aucune ne couvre les comptes de charges (641, 645).

**Options :**

| Option | Description | Impact |
|--------|-------------|--------|
| **1. Valeur fixe (démo)** | Paramètre config : `masse_salariale_mensuelle = 10_750` | Rapide, limité au tenant laplatine2026 |
| **2. Endpoint Odoo** | Nouveau proxy Odoo : somme 641+645 sur période | Nécessite développement Odoo + Vault ou Linky |
| **3. Endpoint Vault** | Nouvelle agrégation `/ui/aggregations/payroll` ou `charges-641-645` | Modifie Vault (contraire à « Aucune modification Vault ») |

**Recommandation :** Pour le MVP P0 (démo & gouvernance), l’option 1 est suffisante : paramètre par tenant (ex. `MASSE_SALARIALE_MENSUELLE_EUR`) ou config dans le manifest tenant.

#### B. Calcul et affichage de la couverture

Formule :

```
Couverture (mois) = Position validée (Vault) ÷ 10 750 €
```

- **Calcul :** à faire côté Linky (comme prévu dans la SPEC)
- **Affichage :** aucune carte ou indicateur dédié n’existe aujourd’hui

**Proposition :** soit une ligne dans la Card Trésorerie (« Couverture salariale : X mois »), soit une petite carte dédiée « Couverture » à côté de la Trésorerie.

#### C. Données ERP (OD + paiements)

La SPEC décrit des écritures et paiements à créer dans Odoo. Ce n’est pas du développement Linky/Vault, mais de la **saisie comptable** et de la **configuration ERP**. À traiter en amont par la MOA / équipe fonctionnelle.

---

## 3. Alignement avec les contraintes d’architecture

La SPEC indique :

> - Aucune modification Vault  
> - Aucun nouveau schéma  
> - Aucun nouveau endpoint  
> - Calcul effectué côté Linky  
> - Données source exclusivement issues de l’ERP et paiements banque  

**Constat :**

- **Vault :** respecté si la masse salariale est fournie par config ou par un proxy Odoo appelé depuis Linky (sans nouvel endpoint Vault).
- **Calcul côté Linky :** conforme.
- **Données source ERP :** pour un MVP avec valeur fixe, on s’écarte légèrement (« config dérivée de l’ERP » plutôt que flux temps réel). Acceptable pour P0.

---

## 4. Plan d’implémentation recommandé

### Phase 1 — Données ERP (MOA / fonctionnel)

1. Créer les 3 OD (Jan–Mar 2026) selon la procédure §4.1  
2. Enregistrer les 6 paiements banque (§4.2)  
3. Vérifier que les paiements sont visibles dans Vault et impactent la Position validée  

### Phase 2 — Linky (technique)

1. **Config masse salariale**  
   - Ajouter un paramètre (env ou manifest) : `masse_salariale_mensuelle_eur = 10750` pour le tenant cible  

2. **Calcul couverture**  
   - Dans `dashboard-metrics` ou dans un composant dédié :  
     `couverture_mois = validated_balance / masse_salariale_mensuelle`  

3. **Affichage**  
   - Intégrer « Couverture salariale : X mois » dans la Card Trésorerie ou dans une carte adjacente  
   - Gérer le cas `masse_salariale === 0` (pas d’affichage ou « — »)  

### Phase 3 — Évolution (optionnel)

- Remplacer la config fixe par un appel Odoo (somme 641+645) si besoin de données dynamiques  
- Intégrer la couverture dans DIVA pour les analyses assistées  

---

## 5. Risques et points d’attention

| Risque | Mitigation |
|--------|------------|
| Masse salariale réelle ≠ 10 750 € | Documenter que la valeur est une hypothèse de travail ; prévoir une mise à jour manuelle si l’effectif change |
| Division par zéro | Vérifier `masse_salariale > 0` avant calcul ; afficher « — » sinon |
| Multi-société | Si plusieurs sociétés, définir si la masse salariale est par société ou globale |
| Période | La SPEC fixe Jan–Mar 2026 ; la Position validée est une snapshot à date. Cohérent pour une couverture « au présent » |

---

## 6. Definition of Done — statut vs implémentation

| Critère | Statut | Commentaire |
|---------|--------|-------------|
| ✔ 3 OD créées (Jan–Mar 2026) | ⬜ | À faire en ERP |
| ✔ 6 paiements banque enregistrés | ⬜ | À faire en ERP |
| ✔ Paiements visibles dans Vault | ⬜ | Dépend des 2 précédents |
| ✔ Position validée impactée | ⬜ | Dépend des paiements |
| ✔ Indicateur de couverture calculable | ⬜ | À implémenter dans Linky (config + calcul + affichage) |

---

## 7. Conclusion

La SPEC Masse Salariale est **bien alignée** avec l’existant : elle réutilise la Position validée déjà exposée par la Card Trésorerie. Aucun développement spécifique masse salariale n’est en place aujourd’hui.

Pour un MVP P0 :

1. **MOA :** Créer les OD et paiements dans Odoo selon la procédure.  
2. **Technique :** Introduire une config `masse_salariale_mensuelle`, calculer la couverture dans Linky et l’afficher (dans la Card Trésorerie ou une carte dédiée).  

L’effort technique côté Linky reste limité (config + calcul + affichage). Le point critique est la disponibilité des données ERP (OD + paiements) et leur alignement avec la Position validée Vault.

---

**Fin de l’avis d’expert**
