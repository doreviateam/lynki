# SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0

**Document :** `SPEC_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.md`  
**Répertoire :** `ZeDocs/web50/`  
**Date :** 2026-03-15  
**Référence principale :** `SPEC_BACKEND_VAULT_EBE_OD_PAYROLL_v1.0`  
**Référence d’exécution :** `PLAN_IMPLEMENTATION_VAULT_EBE_OD_PAYROLL_v1.0`  
**Produit :** Dorevia Linky  
**Objet :** Adaptation frontend de la card EBE selon `payroll_source`  
**Statut :** Spécification normative front

---

## 1. Objectif

Faire évoluer le frontend Linky afin que la card **EBE** affiche une information exacte et non trompeuse sur la source des **charges de personnel**, en s’appuyant sur le nouvel indicateur backend :

- `payroll_source = "payslip" | "od" | "none"`

L’interface ne doit plus déduire l’état métier uniquement à partir de `payslipCount === 0`, car ce comportement est faux dans le cas où la paie est intégrée via **OD comptables**.

---

## 2. Contexte

Jusqu’ici, la card EBE dépend d’une lecture front implicite du type :

- si `payslipCount > 0` → charges de personnel disponibles ;
- sinon → message du type **« Aucun bulletin dans le Vault »**

Ce comportement est insuffisant, car après implémentation backend Lot 2, les charges de personnel pourront provenir de deux sources distinctes :

- **bulletins** (`payslip`)
- **OD comptables** (`od`)

Le frontend doit donc afficher :

1. un **état source exact** ;
2. une **microcopy cohérente** ;
3. un **comportement de repli** correct si l’API enrichie n’est pas encore déployée.

---

## 3. Périmètre

### 3.1 Inclus

- card **EBE** Linky ;
- badge / libellé de source paie ;
- message d’aide / de statut dans le bloc EBE ;
- logique d’affichage selon `payroll_source` ;
- fallback rétrocompatible tant que le backend n’expose pas encore `payroll_source`.

### 3.2 Exclus

- modification du calcul backend EBE ;
- redesign global de la card ;
- adaptation d’autres cards Linky ;
- stratégie DIVA d’explication ;
- refonte du wording global de tous les proxies du cockpit.

---

## 4. Principe produit

La card EBE doit distinguer explicitement :

- **source paie disponible via bulletins**
- **source paie disponible via OD comptables**
- **source paie indisponible**

Le frontend ne doit plus afficher un message spécifique aux bulletins si la source réelle n’est pas `payslip`.

---

## 5. Contrat frontend attendu

### 5.1 Endpoint concerné

Le frontend consomme l’agrégat paie via :

```text
GET /api/payroll
````

Cet endpoint proxyfie la réponse Vault enrichie.

### 5.2 Champs attendus

Le frontend doit être capable de lire :

```json
{
  "total": 21500.00,
  "count": 2,
  "currency": "EUR",
  "payroll_source": "od",
  "payroll_unavailable": false,
  "breakdown": {
    "accounts_641": 17700.00,
    "accounts_645": 3800.00
  }
}
```

### 5.3 Champs utilisés côté front

Champs minimaux :

* `total`
* `count`
* `payroll_source`
* `payroll_unavailable`

Champs optionnels utiles :

* `breakdown.accounts_641`
* `breakdown.accounts_645`

---

## 6. États UI normatifs

Le frontend doit gérer **4 états** :

1. `payslip`
2. `od`
3. `none`
4. `legacy_fallback` (API ancienne sans `payroll_source`)

---

## 7. Règles d’affichage par état

### 7.1 État `payslip`

#### Condition

```text
payroll_source === "payslip"
```

#### Sens métier

Les charges de personnel sont disponibles via la source bulletins.

#### Affichage attendu

* la card EBE considère la composante paie comme **disponible** ;
* le badge source affiche une mention explicite bulletins ;
* aucun message d’absence de paie ne doit apparaître.

#### Microcopy normative

**Badge source :**

```text
Source paie : bulletins
```

**Texte d’aide :**

```text
Charges de personnel intégrées via les bulletins de paie.
```

#### Règle d’interface

Ne jamais afficher :

```text
Aucun bulletin dans le Vault
```

dans cet état.

---

### 7.2 État `od`

#### Condition

```text
payroll_source === "od"
```

#### Sens métier

Les charges de personnel sont disponibles via des OD comptables éligibles.

#### Affichage attendu

* la card EBE considère la composante paie comme **disponible** ;
* le badge source doit mentionner explicitement les OD comptables ;
* l’interface ne doit pas suggérer une absence de paie.

#### Microcopy normative

**Badge source :**

```text
Source paie : OD comptables
```

**Texte d’aide :**

```text
Charges de personnel intégrées via les OD comptables.
```

**Texte d’aide long optionnel :**

```text
Les charges de personnel sont calculées à partir des OD comptables éligibles de la période.
```

#### Règle d’interface

Ne jamais afficher :

```text
Aucun bulletin dans le Vault
```

dans cet état.

#### Affichage breakdown (optionnel)

Si `breakdown` est disponible, le frontend peut afficher dans un niveau de détail secondaire :

```text
Salaires (641*) : X €
Charges sociales (645*) : Y €
```

Ce breakdown est **facultatif** en v1.0.

---

### 7.3 État `none`

#### Condition

```text
payroll_source === "none"
```

ou

```text
payroll_unavailable === true
```

#### Sens métier

Aucune source paie exploitable n’est disponible sur la période.

#### Affichage attendu

* la card EBE doit afficher un état d’indisponibilité partielle de la composante paie ;
* le message doit rester **générique et exact** ;
* le frontend ne doit pas supposer que l’absence de paie signifie absence de bulletins uniquement.

#### Microcopy normative

**Badge source :**

```text
Source paie indisponible
```

**Texte d’aide principal :**

```text
Charges de personnel non disponibles sur la période.
```

**Texte d’aide secondaire :**

```text
Aucun bulletin ni OD de paie intégrés n’ont été trouvés pour cette période.
```

#### Règle d’interface

Le message historique :

```text
Aucun bulletin dans le Vault
```

doit être supprimé dans cet état.

---

### 7.4 État `legacy_fallback`

#### Condition

API ancienne ou réponse ne contenant pas `payroll_source`.

Exemple :

```text
typeof payroll_source === "undefined"
```

#### Sens métier

Le frontend ne peut pas connaître exactement la source réelle.

#### Affichage attendu

* ne pas afficher de message spécifique aux bulletins ;
* utiliser une microcopy **générique de compatibilité** ;
* conserver un comportement sûr tant que le backend enrichi n’est pas déployé.

#### Microcopy normative

**Badge source :**

```text
Source paie actuelle non disponible
```

**Texte d’aide :**

```text
Charges de personnel non disponibles via la source paie actuelle.
```

**Texte d’aide secondaire :**

```text
Les OD comptables ne sont peut-être pas encore intégrées à ce calcul.
```

#### Règle d’interface

Cet état est transitoire et existe uniquement pour la compatibilité descendante.

---

## 8. Règles d’affichage du montant EBE

### 8.1 Principe

Le frontend ne doit pas décider seul si l’EBE est “proxy”, “complet” ou “indisponible” à partir du seul type de source paie.
Il doit s’appuyer sur les données métiers déjà exposées par les APIs utilisées par la card.

### 8.2 Conséquence immédiate

L’arrivée de `payroll_source = "od"` signifie uniquement :

* que la composante paie est disponible ;
* pas que toutes les autres composantes de l’EBE sont nécessairement complètes.

### 8.3 Comportement attendu

* si le calcul EBE renvoie un montant exploitable, l’afficher normalement ;
* si l’écran reste en mode “proxy” pour d’autres raisons, l’indiquer sans blâmer la source paie ;
* la source paie ne doit plus être le motif d’absence dès lors que `payroll_source` vaut `payslip` ou `od`.

---

## 9. Emplacements UI concernés

### 9.1 Badge source

Le badge ou libellé de source doit être placé dans la zone de statut de la card EBE, à proximité du bloc de détail ou du sous-titre.

### 9.2 Message d’aide

Le texte d’aide doit apparaître :

* dans le bloc explicatif / composantes manquantes ;
* ou dans la zone d’état secondaire de la card EBE.

### 9.3 Priorité visuelle

Ordre recommandé :

1. montant / statut EBE
2. badge source paie
3. message d’aide
4. détail breakdown éventuel

---

## 10. Mapping UI normatif

| `payroll_source`  | Badge                                 | Message principal                                                   | Message secondaire                                                                            |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `payslip`         | `Source paie : bulletins`             | `Charges de personnel intégrées via les bulletins de paie.`         | —                                                                                             |
| `od`              | `Source paie : OD comptables`         | `Charges de personnel intégrées via les OD comptables.`             | `Les charges de personnel sont calculées à partir des OD comptables éligibles de la période.` |
| `none`            | `Source paie indisponible`            | `Charges de personnel non disponibles sur la période.`              | `Aucun bulletin ni OD de paie intégrés n’ont été trouvés pour cette période.`                 |
| `legacy_fallback` | `Source paie actuelle non disponible` | `Charges de personnel non disponibles via la source paie actuelle.` | `Les OD comptables ne sont peut-être pas encore intégrées à ce calcul.`                       |

---

## 11. Règles d’implémentation frontend

### 11.1 Logique de dérivation

Pseudo-code recommandé :

```ts
type PayrollSourceUi = "payslip" | "od" | "none" | "legacy_fallback";

function resolvePayrollSourceUi(payroll: any): PayrollSourceUi {
  if (payroll?.payroll_source === "payslip") return "payslip";
  if (payroll?.payroll_source === "od") return "od";
  if (payroll?.payroll_source === "none" || payroll?.payroll_unavailable === true) return "none";
  return "legacy_fallback";
}
```

### 11.2 Single source of truth

Le frontend doit baser toute la microcopy source paie sur `resolvePayrollSourceUi(...)`, et non sur :

* `payslipCount === 0`
* `total === 0`
* l’absence de breakdown
* une heuristique locale

### 11.3 Suppression du wording obsolète

Toute occurrence front du message :

```text
Aucun bulletin dans le Vault
```

doit être supprimée ou remplacée par la logique normative ci-dessus.

---

## 12. Critères d’acceptation frontend

### AC1 — Affichage payslip

Étant donné une réponse API avec `payroll_source = "payslip"`,
quand l’utilisateur ouvre la card EBE,
alors le badge affiche :

```text
Source paie : bulletins
```

et aucun message d’absence de paie n’est visible.

### AC2 — Affichage OD

Étant donné une réponse API avec `payroll_source = "od"`,
quand l’utilisateur ouvre la card EBE,
alors le badge affiche :

```text
Source paie : OD comptables
```

et le texte d’aide indique que les charges de personnel sont intégrées via les OD comptables.

### AC3 — Affichage none

Étant donné une réponse API avec `payroll_source = "none"`,
quand l’utilisateur ouvre la card EBE,
alors l’interface affiche :

```text
Source paie indisponible
```

et ne fait plus référence à l’absence de bulletins uniquement.

### AC4 — Compatibilité API ancienne

Étant donné une réponse API sans champ `payroll_source`,
quand l’utilisateur ouvre la card EBE,
alors le frontend utilise l’état `legacy_fallback` et affiche une microcopy générique non trompeuse.

### AC5 — Suppression wording legacy

Étant donné n’importe quel état UI,
quand la card EBE est rendue,
alors la chaîne :

```text
Aucun bulletin dans le Vault
```

n’apparaît plus dans l’interface.

### AC6 — Breakdown optionnel

Étant donné `payroll_source = "od"` et un `breakdown` fourni,
quand le détail de la card est affiché,
alors le frontend peut afficher les sous-totaux `641*` et `645*` sans altérer le rendu principal.

---

## 13. Recommandations d’implémentation

### 13.1 Composant

Le composant EBE doit centraliser la logique de mapping UI dans une fonction dédiée, afin d’éviter la dispersion des conditions dans le JSX.

### 13.2 Structure recommandée

Créer un mapping du type :

```ts
const PAYROLL_SOURCE_UI = {
  payslip: {...},
  od: {...},
  none: {...},
  legacy_fallback: {...},
};
```

Puis consommer ce mapping dans le rendu.

### 13.3 Robustesse

Le frontend doit tolérer :

* absence de `breakdown`
* absence de `count`
* absence de `currency`
* ancienne API sans `payroll_source`

---

## 14. Hors périmètre explicite

Cette spec ne couvre pas :

* le calcul backend des montants paie ;
* la détection métier des OD ;
* la fusion de sources `payslip + od` ;
* la qualification “EBE complet” vs “EBE proxy” hors source paie ;
* le design détaillé responsive du composant.

---

## 15. Définition of Done

La mise à jour front est terminée lorsque :

* la card EBE lit `payroll_source` ;
* les 4 états UI (`payslip`, `od`, `none`, `legacy_fallback`) sont gérés ;
* la chaîne **« Aucun bulletin dans le Vault »** a disparu ;
* la microcopy correspond exactement à la source réelle quand elle est connue ;
* l’ancienne API reste supportée sans message trompeur ;
* le breakdown OD reste optionnel et non bloquant.

---

## 16. Résumé exécutable

Le frontend Linky doit :

* remplacer la logique implicite basée sur `payslipCount` ;
* consommer `payroll_source` comme source de vérité ;
* distinguer `payslip`, `od`, `none`, et `legacy_fallback` ;
* afficher une microcopy exacte et non trompeuse ;
* supprimer définitivement le message :
  **« Aucun bulletin dans le Vault »**

---

*Référence d’exécution : `PLAN_IMPLEMENTATION_FRONT_LINKY_EBE_PAYROLL_SOURCE_v1.0.md`.*
