# Avis expert — SPEC Business Card v2

**Date :** 2026-02-22  
**Référence :** ZeDocs/web29/SPEC_Business_Card_v2.md  
**Contexte :** Revue pour avis et amendements avant évolution des cards une par une  
**Statut :** Amendements validés et intégrés en SPEC v2.1 (2026-02-22)

---

## 1. Synthèse

La SPEC Business Card v2 est **solide et bien alignée** avec la chaîne AR by Partner. Quelques **clarifications** et **amendements** sont proposés pour éviter des ambiguïtés à l'implémentation.

| Bloc | Avis | Priorité amendement |
|------|------|---------------------|
| **A** Création de valeur | ✅ Cohérent avec l'existant | Faible |
| **B** Qualité encaissement | ⚠️ Définition de "Concentration AR" à préciser | **Moyenne** |
| **C** Signal de risque | ⚠️ `share_percent` vs concentration retard à clarifier | **Haute** |

---

## 2. Alignement avec l'existant

### 2.1 État actuel (`BusinessCard.tsx`)

| Élément | Existant | SPEC v2 |
|---------|----------|---------|
| Marge / Net | `net = salesTotal - purchasesTotal` affiché en en-tête | Bloc A : Marge brute + Taux |
| Ventes / Achats | Déjà présents | Même logique |
| AR | `ArByPartnerSection` (Encours, Clients à risque, tableaux dépliables) | Bloc B synthétique + Bloc C badge |
| Warnings | "Donnée snapshot", "X factures sans échéance" | Conservés §4.2.3 |
| Section Clients à risque | Masquée si `open_amount == 0` | Bloc B masqué si `open_amount == 0` |

**Conclusion :** L'existant couvre déjà une large part. La SPEC ajoute le **taux de marge**, un **bloc AR synthétique** compact, et le **badge signal**.

---

## 3. Amendements recommandés

### 3.1 Bloc C — Clarifier la concentration pour le badge

**Problème :** La SPEC utilise `partners[].share_percent` pour le badge. Dans l'agrégation AR :

- `share_percent` = part du partenaire dans **l'encours total** (`partner.open_amount / totals.open_amount`)
- Le "risque concentré" concerne le **retard**, pas l'encours total

**Amendement proposé :**

Remplacer la logique §4.3.1 par :

| Condition | Badge |
|-----------|-------|
| `overdue_amount == 0` | Vert : "Marge sécurisée" |
| `overdue_amount > 0` ET `overdue_concentration >= 50` | Orange : "Risque concentré" |
| `overdue_amount > 0` ET `overdue_concentration < 50` | Orange léger : "Marge partiellement exposée" |

Avec : **`overdue_concentration`** = part du retard détenue par le premier partenaire en retard, soit  
`max(partner.overdue_amount / totals.overdue_amount * 100)` pour les partenaires avec `overdue_amount > 0`.

**Alternative (si on garde share_percent) :** préciser en SPEC que pour le badge, on utilise la part du **principal débiteur en retard** dans le retard total (et non sa part dans l'encours global).

---

### 3.2 Bloc B — Définir "Concentration AR : Z %"

**Problème :** La SPEC mentionne "Concentration AR : Z % (si Z > 0)" sans définir Z.

**Amendement proposé :**

> **Concentration AR** = part du retard détenue par le premier partenaire (en % du `overdue_amount` total).  
> Affichage : "Concentration AR : Z %" avec Z = 100 * (overdue_amount du 1er partenaire) / totals.overdue_amount.  
> Si `overdue_amount == 0` → ne pas afficher cette ligne.

---

### 3.3 Source des données Bloc A

**Observation :** La SPEC indique « Depuis `dashboard-metrics` : ventes_ht, achats_ht ». La Business Card étendue est alimentée par `BusinessCardWithPolling` qui appelle `/api/sales` et `/api/purchases`, pas `dashboard-metrics`.

**Amendement proposé :**

> **4.1.1 Données source**  
> Ventes HT et Achats HT : agrégats depuis les API sales/purchases (ou `_details.business` de dashboard-metrics si disponibles). Les deux sources produisent des montants cohérents pour la marge.

**Impact :** Aucun changement fonctionnel, précision rédactionnelle pour l’implémentation.

---

### 3.4 Bloc B — Ordre d’affichage par rapport à l’existant

**Observation :** La SPEC ajoute un bloc AR synthétique (3 lignes). La carte actuelle contient déjà `ArByPartnerSection` avec tableaux dépliables.

**Recommandation :**  
Conserver la hiérarchie §5.2 : Marge brute → Taux → **Bloc AR synthétique** (3 lignes) → Tableaux dépliables (Encours détail, Clients à risque) → Badge.

L’implémentation pourrait être :

1. Bloc synthétique toujours visible (si `open_amount > 0` et `freshness != unknown`)
2. Tableaux dépliables inchangés en dessous, pour le détail

---

### 3.5 Cas `freshness == unknown`

**Observation :** La SPEC prévoit "Bloc masqué + message AR non exploitable". L’existant n’affiche pas explicitement ce cas.

**Amendement proposé :**

Si `freshness == "unknown"` et données AR présentes : masquer le bloc AR et afficher un court message du type « Données AR non exploitables pour cette période » (ton neutre, non bloquant).

---

### 3.6 Meta.warnings (multi-devise)

**Observation :** La SPEC mentionne "Warning existant conservé" pour la multi-devise. L’agrégation peut renvoyer `meta.warnings: ["multi_currency_ignored_p0"]`.

**Amendement proposé :**

Ajouter au tableau §4.2.3 :

| Condition | Action |
|-----------|--------|
| `meta.warnings` contient `multi_currency_ignored_p0` | Afficher le warning "Factures non-EUR exclues (P0)" |

---

## 4. Points de vigilance (non bloquants)

1. **Taux de marge négatif** (ventes < achats) : la SPEC couvre `ventes_ht == 0` (taux non affiché). À préciser : si ventes > 0 mais marge < 0, le taux peut être négatif (−12,5 %). À valider en UX (affichage du signe).

2. **Badge "Marge sécurisée"** : vert peut induire en erreur si encours > 0 mais tout à jour. Le libellé est correct : pas d’amendement proposé.

3. **Accessibilité** : badges et couleurs à vérifier pour le contraste et les alternatives texte (WCAG).

---

## 5. Critères d’acceptation — Compléments

S’ajoutant à la §11 de la SPEC :

- [ ] Bloc C utilise `overdue_concentration` (part du retard du 1er partenaire), pas `share_percent` encours
- [ ] Bloc B "Concentration AR" défini comme indiqué en §3.2
- [ ] Cas `freshness == unknown` : bloc masqué + message explicite
- [ ] `meta.warnings` multi-devise affiché si présent

---

## 6. Conclusion

La SPEC est prête pour implémentation après intégration des amendements **§3.1** et **§3.2** (concentration retard). Les autres points sont des précisions ou des évolutions mineures.

**Recommandation :** Valider les amendements §3.1 et §3.2 avec la MOA, puis lancer l’implémentation de la Business Card v2.

---

*Fin du document*
