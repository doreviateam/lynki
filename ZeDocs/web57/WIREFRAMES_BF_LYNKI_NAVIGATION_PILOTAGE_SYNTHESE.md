# Wireframes BF — Lynki Navigation : Pilotage × Synthèse comptable

**Fichier canonique (unique) :** `WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md`  
**Version document :** 0.2 — mars 2026  
**Révision 0.4 :** note **branding** (Lynki / Dorevia = placeholder BF) ; **annexe** correspondance indicative wireframe ↔ composants code.  
**Révision 0.3 :** **un seul fichier** wireframes BF (nom sans suffixe `v0.x`) ; anciens `WIREFRAMES_BF_*_v0.1.md` / `*_v0.2.md` supprimés.  
**Révision 0.2 :** wireframes ASCII complets (desktop/mobile, drill-down BG/GL, transitions) ; références **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** v0.3 et **[INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md)** v2.1+ ; **normalisation `view`** explicite (§2.3, §11.4).  
**Révision 0.1 :** première rédaction (structure, périmètre).  
**Statut :** Wireframes basse fidélité — navigation et structure d’écran (référence BF pour cette navigation).  
**Fondement :** **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** (v0.3), **[INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md)** (v2.6+), **[NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md)** (v2.7+)

---

## 1. Objet

Ce document propose des **wireframes basse fidélité** pour la navigation Lynki autour de deux lectures principales :

* **Pilotage**
* **Synthèse comptable**

Il ne décrit pas encore le détail complet des écrans comptables. Il vise à rendre visible :

* la place du switch dans le header,
* la coexistence avec les filtres actuels,
* la séparation entre **`appView`** et **`kpiMode`**,
* les comportements desktop / mobile,
* la logique de drill-down vers la preuve.

### 1.1 Note — libellé « Lynki / Dorevia » dans les ASCII

Dans les schémas **desktop** (§3), la rangée supérieure mentionne **« Lynki / Dorevia »** à titre de **placeholder basse fidélité** : ce n’est **pas** une décision de branding figée. Le produit pourra retenir **Lynki** seul, **Lynki by Dorevia**, **logo + nom**, etc. — à trancher avec la charte. Ce document **ne** impose pas le libellé final.

---

## 2. Rappels de navigation

### 2.1 États de référence

| Niveau          | Nom       | Valeurs                                           | Rôle                               |
| --------------- | --------- | ------------------------------------------------- | ---------------------------------- |
| Vue primaire    | `appView` | `pilotage` / `synthese`                           | Choisit la grande surface centrale |
| Mode secondaire | `kpiMode` | `all`, `cash`, `business`, `corrections`, `pos_*` | Ne s’applique qu’à la vue Pilotage |

### 2.2 Valeurs UI / URL

| Libellé UI         | Valeur technique |
| ------------------ | ---------------- |
| Pilotage           | `pilotage`       |
| Synthèse comptable | `synthese`       |

### 2.3 Valeur par défaut et normalisation du paramètre `view`

| Cas | Comportement attendu |
|-----|----------------------|
| Paramètre **`view` absent** de l’URL | **`pilotage`** (défaut). |
| **`view` inconnue ou invalide** (typo, valeur obsolète, toute valeur autre que `pilotage` \| `synthese`) | **Normaliser vers `pilotage`** ; corriger l’URL si la navigation est synchronisée avec `searchParams`. |
| **`view=pilotage`** ou **`view=synthese`** (valeurs reconnues) | Appliquer la vue correspondante ; si **`synthese`** et Synthèse **non exposée** pour le tenant → **§11.4**. |

*(Aligné avec **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** §6.1.1, §6.2.1, §6.3.)*

---

## 3. Wireframe desktop — header partagé

### 3.1 Variante recommandée : segmented control sur une rangée dédiée

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Lynki / Dorevia                  [Intégrité] [Fraîcheur] [Tenant] [Aide] [Menu]  │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [ Pilotage ] [ Synthèse comptable ]                                                │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Société [▼]      Période [▼]      Année [▼]                                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Lecture

* **rangée 1** : identité + contexte secondaire + accès hamburger
* **rangée 2** : bascule de vue primaire
* **rangée 3** : filtres globaux

### Intention

* rendre la bascule **visible sans ouvrir le menu** ;
* éviter de faire porter à la même ligne : titre + switch + filtres + actions ;
* préserver une lecture stable du chrome.

---

### 3.2 Variante alternative : segmented control dans la ligne principale

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Lynki / Dorevia   [Pilotage|Synthèse comptable]   Société[▼] Période[▼] Année[▼] │
│                                                [Intégrité] [Fraîcheur] [Menu]     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Réserve

Cette variante est plus dense. Elle n’est acceptable que si le design system permet une bonne respiration et que les tests desktop restent lisibles.

### Recommandation

Préférer la **variante 3.1**.

---

## 4. Wireframe desktop — vue Pilotage

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Header partagé                                                                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ kpiMode : [Tout] [Cash] [Business] [Corrections] [POS]                            │
├────────────────────────────────────────────────────────────────────────────────────┤
│ KPI 1      KPI 2      KPI 3      KPI 4                                             │
│ KPI 5      KPI 6      KPI 7      KPI 8                                             │
│ KPI 9      KPI 10     KPI 11     KPI 12                                            │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Bloc insights                                                                      │
│ - headline                                                                         │
│ - what_i_see                                                                       │
│ - to_check                                                                         │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Footer métriques / UX / version / fraîcheur                                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Règles

* Le **`kpiMode`** n’est visible que dans cette vue.
* Le bloc insights garde sa place actuelle sous la grille.
* Le drill-down par carte remplace la grille centrale, sans changer le header partagé.

---

## 5. Wireframe desktop — Pilotage avec détail d’un indicateur

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Header partagé                                                                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ kpiMode : [Cash] [Business] [Corrections] ...                                      │
├────────────────────────────────────────────────────────────────────────────────────┤
│ ← Retour au cockpit                                                                │
│                                                                                    │
│ [Titre de l’instrument]                                                            │
│ Valeur principale / variation / statut                                             │
│                                                                                    │
│ Graphes / listes / aide contextuelle                                               │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Règle

Le retour revient à la vue Pilotage avec le **dernier `kpiMode` mémorisé**.

---

## 6. Wireframe desktop — vue Synthèse comptable

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Header partagé                                                                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Synthèse comptable                                                                 │
│                                                                                    │
│ [ Structure financière / Bilan ]                                                   │
│  - Rubrique 1                                                                      │
│  - Rubrique 2                                                                      │
│  - Rubrique 3                                                                      │
│  → Voir comptes / balance générale                                                 │
│                                                                                    │
│ [ Performance comptable / Compte de résultat ]                                     │
│  - Rubrique 1                                                                      │
│  - Rubrique 2                                                                      │
│  - Résultat                                                                        │
│  → Voir comptes / balance générale                                                 │
│                                                                                    │
│ [ Balance clients ]   [ Balance fournisseurs ]                                     │
│                                                                                    │
│ [ Balance générale ]                                                               │
│  → Ouvrir détail comptable                                                         │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Footer métriques / version référentiel / fraîcheur                                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Règles

* Les modes **`kpiMode`** sont **masqués**.
* La surface centrale n’utilise pas la grille 12 cards comme navigation principale.
* Le détail comptable suit une logique de **rubriques / tableaux / niveaux de preuve**.
* La présence éventuelle d’un bloc insights spécifique n’est **pas traitée ici**.

---

## 7. Wireframe desktop — drill-down comptable

### 7.1 Niveau balance générale

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Header partagé                                                                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Synthèse comptable > Balance générale                                              │
│                                                                                    │
│ Compte      Libellé               Ouverture   Débit   Crédit   Solde               │
│ 401000      Fournisseurs          ...         ...     ...      ...                 │
│ 411000      Clients               ...         ...     ...      ...                 │
│ 445710      TVA collectée         ...         ...     ...      ...                 │
│ ...                                                                                │
│                                                                                    │
│ [Ouvrir grand livre filtré]                                                        │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Niveau grand livre

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│ Header partagé                                                                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ Synthèse comptable > Balance générale > Compte 411000 > Grand livre                │
│                                                                                    │
│ Date        Journal   Pièce      Libellé         Débit   Crédit   Solde            │
│ ...                                                                                │
│ ...                                                                                │
│ ...                                                                                │
│                                                                                    │
│ [Retour balance générale]                                                          │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### Règles

* le **grand livre** n’apparaît jamais comme vue primaire ;
* la navigation doit garder le fil comptable lisible ;
* le retour ne renvoie pas au cockpit KPI par défaut, mais au niveau comptable précédent.

---

## 8. Wireframe mobile — header partagé

### 8.1 Variante recommandée

```text
┌──────────────────────────────────────┐
│ Lynki                        [Menu]  │
│ [ Pilotage | Synthèse ]             │
│ Société [▼]   Période [▼]           │
└──────────────────────────────────────┘
```

### Règles

* le switch **reste visible** ;
* il ne doit pas être enfoui dans le menu ;
* les filtres peuvent rester condensés / simplifiés selon le comportement mobile déjà présent.

---

### 8.2 Variante compacte si contrainte forte

```text
┌──────────────────────────────────────┐
│ Lynki                [Pilotage|Syn.] │
│ [Menu]  Société[▼]  Période[▼]       │
└──────────────────────────────────────┘
```

### Réserve

Moins lisible. À utiliser seulement si les contraintes d’espace sont fortes.

### Recommandation

Préférer la **variante 8.1**.

---

## 9. Wireframe mobile — Pilotage

```text
┌──────────────────────────────────────┐
│ Header partagé                       │
├──────────────────────────────────────┤
│ kpiMode [▼]                          │
├──────────────────────────────────────┤
│ KPI 1                                │
│ KPI 2                                │
│ KPI 3                                │
│ ...                                  │
├──────────────────────────────────────┤
│ Bloc insights                        │
└──────────────────────────────────────┘
```

### Règle

Le `kpiMode` peut être condensé en sélecteur unique sur mobile.

---

## 10. Wireframe mobile — Synthèse comptable

```text
┌──────────────────────────────────────┐
│ Header partagé                       │
├──────────────────────────────────────┤
│ Synthèse comptable                   │
│                                      │
│ [Bilan]                              │
│ [Compte de résultat]                 │
│ [Balance clients]                    │
│ [Balance fournisseurs]               │
│ [Balance générale]                   │
└──────────────────────────────────────┘
```

### Règle

Sur mobile, la logique de sections empilées est préférable à une densité tabulaire trop forte au premier niveau.

---

## 11. Transitions d’état

### 11.1 Pilotage → Synthèse comptable

```text
État initial : appView=pilotage, kpiMode=business
Action : clic sur [Synthèse comptable]
Résultat : appView=synthese, kpiMode mémorisé mais masqué
```

### 11.2 Synthèse comptable → Pilotage

```text
État initial : appView=synthese
Action : clic sur [Pilotage]
Résultat : appView=pilotage, restauration du dernier kpiMode connu
```

### 11.3 URL cible

```text
/...?tenant=laplatine&view=pilotage
/...?tenant=laplatine&view=synthese
```

*(Seules **`view=pilotage`** et **`view=synthese`** sont des valeurs reconnues ; les autres cas → **§2.3** et **§11.4**.)*

### 11.4 Fallback et normalisation `view`

```text
• view absent              → appView = pilotage (défaut)
• view invalide / inconnue → appView = pilotage ; URL corrigée si synchro searchParams

• view=synthese ET Synthèse non exposée pour le tenant :
  → fallback view=pilotage
  → optionnel : message discret
```

*(Même logique que **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** §6.1.1 et §6.3.)*

---

## 12. Décisions visuelles retenues à ce stade

| Sujet              | Décision BF                              |
| ------------------ | ---------------------------------------- |
| Position du switch | Header partagé                           |
| Forme              | Segmented control préféré                |
| Modes KPI          | Dans Pilotage uniquement                 |
| Grille 12 cards    | Pilotage uniquement                      |
| Synthèse comptable | Surface dédiée, autre grammaire visuelle |
| Grand livre        | Drill-down uniquement                    |
| Mobile             | Switch visible hors hamburger            |

---

## 13. Points hors périmètre de ce document

Ce document ne tranche pas encore :

* la présence d’un **bloc insights** spécifique à la Synthèse comptable ;
* la hiérarchie détaillée des blocs comptables ;
* la structure précise des tableaux de balance / grand livre ;
* les droits fins RAF / DAF / Consultant ;
* les feature flags tenant.

---

## 14. Suite recommandée

À partir de ces wireframes BF, les prochains livrables recommandés sont :

1. validation produit / design du **header desktop et mobile** ;
2. validation dev du couple **`appView` + `kpiMode`** ;
3. **[SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)** — structure de la vue Synthèse, blocs, profondeur, BG pivot, états, drill-down, grand livre ;
4. décision sur la présence ou non d’un bloc insights côté Synthèse.

---

En synthèse :

> **Lynki peut accueillir deux lectures majeures — Pilotage et Synthèse comptable — dans le même chrome, à condition de traiter la bascule comme une navigation primaire visible, et de réserver les modes KPI au seul Pilotage.**

---

## 15. Annexe — Correspondance indicative wireframe ↔ composants code

*À usage design → dev / tickets d’implémentation — les noms futurs restent des propositions.*

| Zone wireframe (ce document) | Composants / modules actuels ou cibles (`units/dorevia-linky`) |
|------------------------------|----------------------------------------------------------------|
| Header partagé, segmented Pilotage / Synthèse | `ReportHeader`, `ReportHeaderContentBody` ; état **`appView`** dans `DashboardWithFilters` |
| Filtres société / période / année | Même bandeau que le cockpit : `DashboardWithFilters` + `ReportHeader` |
| Vue Pilotage — grille KPI | `IconGrid`, cartes `*CardWithPolling`, etc. |
| Bloc insights | `DivaFlashBlock` |
| Vue Synthèse comptable — surface centrale | **À créer** — ex. `AccountingSummaryView` / équivalent (pas la grille 12 cards) |
| Drill-down BG / GL | **À créer** — vues ou routes dédiées sous le même `appView=synthese` ; breadcrumb métier |

*Voir aussi **[SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)** pour le détail fonctionnel des blocs Synthèse.*
