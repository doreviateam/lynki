# Tuile 1 — Trésorerie

**Fichier :** `ZeDocs/web62/SPEC_TUILE_TRESO.md`  
**Alignement code (états §6, seuils 10 % / 80 %) :** [`EXECUTION_TICKET_T-TR-001.md`](./EXECUTION_TICKET_T-TR-001.md) — *implémentation historique non encore calée ; le ticket fait converger `computeCardStatuses` et les badges vers cette spec.*

---

## 1. Objectif

La tuile **Trésorerie** donne une lecture immédiate de la position de trésorerie du périmètre courant et du niveau de confiance associé.

Elle doit permettre de répondre rapidement à quatre questions :

* combien j’ai à date ;
* puis-je m’appuyer sur ce chiffre ;
* quelle part est réellement rapprochée / couverte ;
* que reste-t-il à traiter.

---

## 2. Rôle produit

La tuile Trésorerie n’est pas une reprise brute d’Odoo.
Elle transforme des signaux comptables et bancaires en **lecture de pilotage**.

Elle doit exprimer :

* une **position de référence** ;
* un **état principal de lecture** ;
* une **couverture probante** ;
* un **reste à rapprocher** puis un **écart à confirmer** ;
* un accès naturel au détail Trésorerie.

---

## 3. Périmètre de lecture

La tuile s’applique au périmètre courant :

* tenant,
* société,
* période,
* année,

tels que définis par le header global Lynki.

Tous les montants et états affichés doivent être cohérents avec ce périmètre.

---

## 4. Structure de la tuile

## 4.1 En-tête

Contient :

* le titre `TRÉSORERIE`
* un badge d’état principal

Exemples d’états :

* `À confirmer`
* `Partiel`
* `Fiable`

---

## 4.2 Valeur principale

Affiche le montant principal de trésorerie.

Exemple :
**118 179,42 €**

Ce montant est la **position de trésorerie validée** retenue comme lecture de référence sur le périmètre courant.

Sous-texte recommandé :
**Solde validé**

---

## 4.3 Bloc de couverture

Affiche la part des flux couverte par preuve bancaire / rapprochement sur la période affichée.

Libellé recommandé :
**Couverture probante**

Exemple :
**69 %**

Affichage recommandé :

* pourcentage lisible
* barre de progression ou repère visuel équivalent

---

## 4.4 Bloc de gouvernance

Le bloc de gouvernance affiche deux indicateurs secondaires permettant d’expliquer ce qui reste à traiter ou à confirmer dans la lecture de trésorerie.

L’ordre retenu est le suivant :

### A. Montant à rapprocher

Exemple :
**43 228,60 €**

**Définition produit**
Montant restant à traiter dans le rapprochement sur le périmètre affiché.

**Lecture utilisateur**

> Qu’est-ce qu’il reste à rapprocher ?

**Ancrage implémentation**
Dans l’implémentation actuelle, cet indicateur est alimenté à partir du montant restant non rapproché sur le périmètre courant.

---

### B. Écart à confirmer

Exemple :
**21 500,00 €**

**Définition produit**
Décalage restant à confirmer dans la lecture du solde affiché.

**Lecture utilisateur**

> Quel décalage reste encore à expliquer ou confirmer dans la lecture de trésorerie ?

**Ancrage implémentation**
Dans l’implémentation actuelle, cet indicateur correspond à l’écart entre le solde ERP et la position validée retenue pour la vue (`erp_balance − validated_balance`), affiché en valeur absolue dans la tuile visible.

**Règle UX**
Le libellé visible côté utilisateur reste métier (`Écart à confirmer`).
Le détail technique du calcul peut être explicité dans la spec, le tooltip, l’aide contextuelle ou l’écran détail, mais le libellé technique `Écart ERP − Vault` n’est pas retenu comme libellé principal dans la tuile.

---

## 4.5 Hiérarchie de lecture du bloc gouvernance

L’ordre de lecture du bloc gouvernance est le suivant :

1. **Montant à rapprocher**
2. **Écart à confirmer**

Cette hiérarchie est retenue car elle suit une logique de lecture métier plus naturelle :

* d’abord la **masse à traiter** dans le rapprochement,
* ensuite le **décalage résiduel** qui subsiste dans la lecture du solde.

---

## 5. Hiérarchie de lecture

L’ordre de lecture attendu est :

1. **TRÉSORERIE**
2. **montant principal**
3. **état principal**
4. **couverture probante**
5. **montant à rapprocher**
6. **écart à confirmer**

La tuile doit rester lisible en 2 à 3 secondes.

---

## 6. États principaux

La tuile Trésorerie exprime un **état principal de lecture** parmi trois niveaux métier :

* **À confirmer**
* **Partiel**
* **Fiable**

Ces états décrivent le **degré de robustesse de la lecture affichée** sur le périmètre courant.  
Ils sont déterminés à partir du **taux de couverture probante** sur la période affichée ou, à défaut, d’un indicateur équivalent de rapprochement en montant cohérent avec l’implémentation.

Le triptyque n’exprime pas seulement un montant ; il exprime le **niveau de confiance de la lecture**, au regard du rapprochement et de la preuve bancaire disponible.

---

## 6.1 À confirmer

**Définition produit**  
La lecture existe, mais le rapprochement est encore trop incomplet pour la tenir comme suffisamment fiable.

**Lecture utilisateur**

> Ce chiffre existe, mais je ne peux pas encore le considérer comme stabilisé.

**Interprétation métier**  
La couverture probante est encore très faible ; une part trop importante des flux ou montants du périmètre n’est pas encore rapprochée.

**Seuil**  
`couverture probante ≤ 10 %`

**Couleur associée**  
Rouge

**Ancrage implémentation**  
Dans l’implémentation cockpit, cet état correspond à un statut dégradé calculé par `computeCardStatuses` lorsque les indicateurs de couverture / rapprochement signalent une robustesse insuffisante de la lecture.

---

## 6.2 Partiel

**Définition produit**  
La lecture est exploitable, mais les montants ERP ne sont pas encore totalement rapprochés sur le périmètre affiché.

**Lecture utilisateur**

> J’ai une base utile, mais tout n’est pas encore totalement rapproché.

**Interprétation métier**  
Une partie significative des flux est déjà couverte par preuve bancaire, mais la couverture reste incomplète et appelle encore vigilance.

**Seuil**  
`couverture probante > 10 % et ≤ 80 %`

**Couleur associée**  
Orange

**Ancrage implémentation**  
Dans l’implémentation cockpit, cet état correspond à un statut de vigilance calculé par `computeCardStatuses` lorsque la part restante non couverte ou le montant à rapprocher reste significatif sans rendre la lecture inutilisable.

---

## 6.3 Fiable

**Définition produit**  
La lecture de trésorerie peut être utilisée avec confiance sur le périmètre affiché.

**Lecture utilisateur**

> Je peux m’appuyer sur ce chiffre.

**Interprétation métier**  
La grande majorité des flux ou montants significatifs du périmètre est rapprochée ou suffisamment couverte pour fournir une lecture robuste.

**Seuil**  
`couverture probante > 80 %`

**Couleur associée**  
Vert

**Ancrage implémentation**  
Dans l’implémentation cockpit, cet état correspond à un statut favorable calculé par `computeCardStatuses` (`units/dorevia-linky/app/api/dashboard-metrics/route.ts`) lorsque la part non couverte / restant à rapprocher ne déclenche plus de vigilance significative.

---

## 6.4 Règle de cohérence

Le libellé d’état visible dans la tuile reste **métier** (`À confirmer`, `Partiel`, `Fiable`).  
Les **seuils** ci-dessus définissent la **doctrine produit** attendue pour la Trésorerie.

L’implémentation doit s’aligner sur cette logique en s’appuyant prioritairement sur la **couverture probante** ou, à défaut, sur un indicateur équivalent de rapprochement en montant cohérent avec le périmètre affiché.

La tuile n’expose pas les formules ou détails de calcul ; ceux-ci relèvent de l’implémentation, de la spec détaillée ou du détail Trésorerie.

---

## 6.5 États techniques complémentaires

Pour les cas non métier, la tuile peut aussi afficher :

* **En attente**
* **Indisponible**

Ces états couvrent l’absence de données, l’attente de calcul ou l’impossibilité de produire une lecture exploitable.  
Ils ne remplacent pas le triptyque principal **`À confirmer` / `Partiel` / `Fiable`**.

---

## Note de méthode

Le terme **couverture probante** est retenu comme assiette prioritaire des seuils, car il reflète mieux la robustesse réelle de la lecture de trésorerie qu’un simple pourcentage en **nombre d’écritures rapprochées**. En cas de contrainte d’implémentation, un indicateur de rapprochement en **montant** peut être utilisé à condition de rester cohérent avec cette logique produit.

---

## 7. Libellés visibles recommandés

### Titre

**TRÉSORERIE**

### Sous-texte valeur principale

**Solde validé**

### Bloc preuve

**Couverture probante**

### Bloc secondaire 1

**Montant à rapprocher**

### Bloc secondaire 2

**Écart à confirmer**

### Badge d’état

* `À confirmer`
* `Partiel`
* `Fiable`

---

## 8. Libellés explicitement écartés

Ne pas afficher dans la tuile visible :

* `Écart ERP–Vault`
* jargon d’architecture
* vocabulaire interne de calcul
* labels trop techniques pour un lecteur métier

Ces formulations peuvent exister :

* en tooltip,
* dans le détail,
* dans la documentation,
  mais pas en lecture principale.

---

## 9. Source logique des indicateurs

## 9.1 Montant principal

Position de trésorerie validée retenue comme référence pour la vue.

## 9.2 État principal

État de gouvernance calculé à partir du niveau de rapprochement / couverture.

## 9.3 Couverture probante

Part des flux couverte par preuve bancaire sur la période affichée.

## 9.4 Montant à rapprocher

Masse restant à traiter dans le rapprochement sur le périmètre affiché (montant non rapproché restant).

## 9.5 Écart à confirmer

Décalage entre le solde ERP et la position validée retenue pour la vue (`erp_balance − validated_balance`), affiché en valeur absolue dans la tuile visible.

---

## 10. Tooltips / aides contextuelles

## 10.1 Principe général

Les tooltips et aides contextuelles de la tuile Trésorerie ont pour rôle de **rendre explicite la lecture métier** sans réintroduire dans la tuile visible un vocabulaire d’architecture ou de calcul.

Elles doivent :

* expliciter la signification du chiffre ou de l’état affiché ;
* rester compréhensibles par un lecteur métier ;
* rester cohérentes avec le détail Trésorerie ;
* éviter les formulations internes de type `ERP`, `Vault`, `computeCardStatuses`, sauf dans l’aide détaillée ou la spec.

Les tooltips ne doivent pas transformer la tuile en documentation technique.

---

## 10.2 Solde validé

**Libellé visible :** `Solde validé`

**Tooltip recommandé :**

> Position de trésorerie retenue comme lecture de référence pour le périmètre affiché.

**Variante détaillée admise :**

> Position de trésorerie validée retenue comme lecture de référence à la date et sur le périmètre affichés.

---

## 10.3 Couverture probante

**Libellé visible :** `Couverture probante`

**Tooltip recommandé :**

> Part des flux couverts par preuve bancaire sur la période affichée.

**Variante détaillée admise :**

> Indique la part des flux de la période affichée déjà couverte par preuve bancaire.

---

## 10.4 Montant à rapprocher

**Libellé visible :** `Montant à rapprocher`

**Tooltip recommandé :**

> Montant restant à traiter dans le rapprochement sur le périmètre affiché.

---

## 10.5 Écart à confirmer

**Libellé visible :** `Écart à confirmer`

**Tooltip recommandé :**

> Décalage restant à confirmer entre la lecture ERP et la position validée retenue pour le périmètre affiché.

**Variante détaillée admise :**

> Cet indicateur reflète l’écart entre le solde ERP et la position validée retenue pour la vue ; il est affiché en valeur absolue dans la tuile.

**Règle UX :**  
Le tooltip peut expliciter le sens du décalage ; le libellé technique « Écart ERP − Vault » ne doit pas être le libellé principal de la tuile.

---

## 10.6 État À confirmer

**Libellé visible :** `À confirmer`

**Tooltip recommandé :**

> Le rapprochement est encore trop incomplet pour tenir cette lecture comme pleinement fiable.

**Variante détaillée admise :**

> La lecture existe, mais elle ne peut pas encore être tenue comme suffisamment stabilisée.

---

## 10.7 État Partiel

**Libellé visible :** `Partiel`

**Tooltip recommandé :**

> Les montants ERP ne sont pas encore totalement rapprochés sur le périmètre affiché.

**Variante détaillée admise :**

> La lecture est déjà exploitable, mais tout le périmètre n’est pas encore totalement rapproché.

---

## 10.8 État Fiable

**Libellé visible :** `Fiable`

**Tooltip recommandé :**

> La lecture est suffisamment couverte pour être utilisée avec confiance.

---

## 10.9 États techniques complémentaires

### En attente

**Tooltip recommandé :**

> Les données nécessaires à cette lecture ne sont pas encore disponibles.

### Indisponible

**Tooltip recommandé :**

> Cette lecture ne peut pas être produite sur le périmètre affiché.

---

## 10.10 Règle de cohérence tuile ↔ détail

Les formulations visibles et les tooltips de la tuile doivent rester cohérents avec le détail Trésorerie :

* la tuile donne une **lecture synthétique** ;
* le détail explicite les éléments de rapprochement, de couverture et de gouvernance ;
* un même indicateur ne doit pas changer de sens entre la tuile et l’écran détail ;
* un libellé métier retenu dans la tuile doit rester prioritaire dans le détail, même si la documentation technique explicite ensuite le calcul sous-jacent.

---

## 10.11 Règle de style

Les tooltips doivent :

* rester courts ;
* privilégier la lecture métier ;
* éviter le jargon d’architecture ;
* ne pas exposer de formules de calcul dans la tuile ;
* expliciter le sens, pas l’implémentation.

---

## 10.12 Alignement avec les seuils du §6

La doctrine **À confirmer / Partiel / Fiable** et les seuils de **couverture probante** (≤ 10 %, > 10 % et ≤ 80 %, > 80 %), ainsi que les couleurs associées, sont fixés au **§6**. Les textes des **§10.6 à 10.8** restent des formulations métier pour infobulles : ils **ne remplacent pas** l’exposé des seuils (ni les pourcentages en microcopy obligatoire sur la tuile).

---

## 11. Drill-down attendu

Le clic sur la tuile ouvre le détail **Trésorerie**.

Le détail doit permettre de retrouver :

* position de trésorerie à date ;
* comptes / journaux / instruments concernés ;
* éléments rapprochés et non rapprochés ;
* montant restant à rapprocher ;
* éventuels écarts expliquant l’état ;
* trajectoire d’amélioration de la couverture.

La tuile reste donc une **lecture de synthèse**, pas un mini-détail comptable.

---

## 12. Règles UX

* la valeur principale doit dominer visuellement ;
* le badge d’état doit être visible sans écraser le montant ;
* la couverture probante doit être lisible d’un coup d’œil ;
* les deux lignes secondaires doivent rester courtes et stables ;
* pas de surcharge de badges secondaires ;
* pas de prose longue dans la tuile.

---

## 13. Version canonique de la tuile

### Structure visible

**TRÉSORERIE** `Partiel`

**118 179,42 €**
*Solde validé*

**Couverture probante**
**69 %**

**Montant à rapprocher**
**43 228,60 €**

**Écart à confirmer**
**21 500,00 €**

---

## 14. Definition of Done

La spec de la tuile Trésorerie est considérée validée si :

* la tuile répond clairement à la question “combien j’ai à date et avec quel niveau de confiance ?” ;
* le vocabulaire est métier et non technique ;
* les trois métier **`À confirmer` / `Partiel` / `Fiable`** sont définis avec seuils de **couverture probante** (§6) : ≤ 10 %, > 10 % et ≤ 80 %, > 80 %, et couleurs associées (rouge / orange / vert) ;
* `Partiel` est explicitement relié à un rapprochement incomplet dans la plage intermédiaire ;
* le bloc gouvernance affiche d’abord **`Montant à rapprocher`**, puis **`Écart à confirmer`** (ordre §4.5) ;
* les libellés visibles sont métier ; les libellés techniques du type « Écart ERP − Vault » ne sont pas utilisés comme titres principaux de la tuile ;
* la hiérarchie de lecture est stable ;
* le drill-down attendu est cohérent avec la promesse de la tuile.

---

## 15. Formulation produit canonique

> La tuile Trésorerie affiche la position de trésorerie validée pour le périmètre courant, son état principal de lecture, la couverture probante des flux, le montant restant à rapprocher puis l’écart à confirmer dans la lecture du solde. Elle constitue la lecture de référence de la disponibilité financière immédiate dans Lynki.
