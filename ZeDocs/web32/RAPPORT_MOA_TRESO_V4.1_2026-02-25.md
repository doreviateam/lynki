# Rapport MOA — Carte Trésorerie v4.1 (Hybride)

**Date :** 2026-02-25  
**Destinataire :** Maîtrise d'Ouvrage  
**Objet :** Livraison de l'évolution « Carte Trésorerie » (spec v4.1) — synthèse et statut

---

## 1. Synthèse exécutive

La **carte Trésorerie** du cockpit Linky a été enrichie selon la spécification v4.1 : elle offre désormais **deux angles de lecture complémentaires** sans remplacement brutal du modèle existant.

| Bénéfice | Description |
|----------|-------------|
| **Position probante** | Montant de trésorerie validée par rapprochement bancaire et écart avec l'ERP |
| **Santé du process** | Volume traité (rapproché) vs en attente — indicateur de qualité opérationnelle |
| **Données temps réel** | Chaîne événementielle < 10 secondes (Odoo → Vault) ; affichage « Données actualisées il y a Xs » |
| **Architecture unifiée** | Linky ne consulte que le Vault — une seule source de vérité |

---

## 2. Ce qui a été livré

### 2.1 Deux axes de lecture (complément, pas rupture)

| Axe | Indicateurs | Interprétation |
|-----|-------------|----------------|
| **Position (financier)** | Trésorerie validée, Exposition non validée, Solde ERP, Couverture probante | « Ma position est-elle confirmée par le rapprochement ? » |
| **Process (opérationnel)** | Volume rapproché, Volume en attente, Taux de traitement | « Mes relevés sont-ils traités à quel niveau ? » |

### 2.2 Badges d'alerte (logique côté Vault)

| Badge | Signification |
|-------|---------------|
| **Signes incohérents** | Position ERP et position validée de signes opposés |
| **Écart important** | Écart ERP/Vault dépasse un seuil hybride (500€ ou 5 % du solde) |
| **Écart structurel** | Couverture probante > 100 % (ex. écritures non vaultées, OD) |

### 2.3 Mode dégradé (fiabilité)

En cas d'indisponibilité Odoo, la carte reste exploitable :
- Les données vaultées (position, volumes) s'affichent
- Les champs dépendants de l'ERP (erp_balance, couverture) passent en « — »
- Aucune valeur trompeuse (ex. « 100 % » sans donnée réelle)

---

## 3. Principes validés

| Principe | Statut |
|----------|--------|
| Linky ne connaît pas Odoo — tout passe par le Vault | ✅ Acté |
| Données vaultables en Vault sous 10 secondes | ✅ Contrainte documentée |
| Périmètre bancaire explicite (journaux bank actifs, posted uniquement) | ✅ Verrouillé en spec et en code |
| Seuil « écart important » hybride (absolu 500€ + relatif 5 %) | ✅ Implémenté |
| Arrondi 2 décimales côté Vault, pas en SQL | ✅ Appliqué |
| Mode dégradé Odoo down (champs null, flags neutralisés) | ✅ Implémenté |

---

## 4. Périmètre technique réalisé

| Composant | Détail |
|-----------|--------|
| **Vault** | Agrégats position (net) + process (volume) ; appel Odoo erp_balance ; réponse v4.1 ; helpers (RoundMoney2, ComputeLargeDeltaThreshold) |
| **Odoo** | Exposition `erp_balance` en standard ; périmètre bancaire documenté |
| **Linky** | Proxy unique vers Vault ; UI 2 blocs ; badges ; horodatage « actualisé il y a Xs » |
| **Tests** | Test unitaire sur ComputeLargeDeltaThreshold ; build Vault OK |

---

## 5. Points d'attention pour la MOA

### 5.1 Tuile « Trésorerie validée » (cockpit) — Décision actée

**Décision : Option A — Taux de traitement** (`reliability_volume`)

La tuile affiche la part du volume des relevés bancaires effectivement rapprochée (qualité du process). La couverture probante (position vs ERP) reste visible dans la carte détaillée.

### 5.2 Données comparatives (ERP vs Vault)

Un **delta ERP/Vault** est possible et normal (ledger Odoo vs lignes de relevé rapprochées). Les badges (écart important, écart structurel) expliquent ces situations et évitent les interprétations erronées.

### 5.3 Rétrocompatibilité

Les champs legacy (ex. `reconciled_balance`, `reliability_rate`) sont conservés et documentés comme deprecated. Les consommateurs (ex. dashboard-metrics) peuvent migrer progressivement vers `position` et `process`.

---

## 6. Suite recommandée

| Action | Priorité | Statut |
|--------|----------|--------|
| Valider le choix tuile « Trésorerie validée » (Option A) | P1 | ✅ Acté |
| Documenter la limite ERP vs Vault pour les utilisateurs finaux | P2 | ✅ Fait (`NOTE_UTILISATEUR_DELTA_ERP_VAULT.md`) |
| Tester en environnement de qualification (sarl-la-platine) | P1 | ✅ Complet — Vault + Odoo erp_balance opérationnels |
| Acter la décision produit : carte 2 axes comme référentiel officiel | P2 | À faire |

---

## 7. Références

- Spec : `ZeDocs/web32/Carte_Trésorerie_Validée_v4.1_Hybride.md`
- Plan Scrum : `ZeDocs/web32/PLAN_IMPLEMENTATION_TRESO_V4.1_SCRUM.md`
- Analyse préalable : `ZeDocs/web32/RAPPORT_ANALYSE_SPEC_TRESO_V4_VS_EXISTANT.md`
- Note utilisateur (delta ERP vs Vault) : `ZeDocs/web32/NOTE_UTILISATEUR_DELTA_ERP_VAULT.md`

---

*Document rédigé à l'issue de l'implémentation v4.1 (2026-02-25).*
