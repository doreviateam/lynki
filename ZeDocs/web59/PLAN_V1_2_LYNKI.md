# Plan V1.2 — Lynki

*Ce document ouvre le chantier **Lynki V1.2** après validation de **V1** et stabilisation **V1.1**. Il ne réouvre pas le cadrage profond du produit : il organise une suite courte, utile et visible, à partir des sujets déjà tracés en V2 dans `RECETTE_V1_LYNKI_PASSE1.md`.*

---

## 1. Objet du document

Ce document a pour objet de définir le périmètre, l'ordre d'exécution et les critères de sortie de **Lynki V1.2**.

La logique de V1.2 est simple :

* **prolonger la V1 sans la casser** ;
* traiter des sujets déjà identifiés comme utiles ;
* livrer des améliorations visibles côté usage ;
* conserver un chantier raisonnable.

V1.2 n'est pas une refonte.
C'est une **extension contrôlée**.

---

## 2. Point de départ

À l'ouverture de V1.2, l'état de référence est le suivant :

* **V1** : validée en *Go V1 avec réserves* ;
* **V1.1** : stabilisation finalisée ;
* **repo local** : propre, figé sur `7f123bd4` ;
* **branche locale** : `port-account-reconcile-oca-o19` ;
* **tags locaux** : `lynki-v1-go-r1`, `lynki-v1.1`.

---

## 3. Intention de V1.2

L'objectif de V1.2 est d'améliorer l'utilité opérationnelle de Lynki sur trois axes :

### A. Navigation et profondeur

Permettre de passer plus naturellement du cockpit vers le détail.

### B. Lecture et action

Mieux exploiter les alertes et les signaux dans une logique de tri, lecture et action.

### C. Enrichissement mesuré

Ajouter certains compléments attendus sans rouvrir le socle :

* projections,
* exports,
* enrichissements légers de tuiles.

---

## 4. Périmètre candidat V1.2

Les sujets déjà identifiés comme candidats naturels sont :

1. **Navigation détail depuis d'autres tuiles desktop que Trésorerie**
2. **Filtre lecture urgence / vigilance / suivi dans Alertes**
3. **Deux tuiles C manquantes dans le canon desktop**
4. **Projection J+30 Trésorerie**
5. **Export CSV / rapport**
6. **Mini-graphes dans les tuiles secondaires mobile**

---

## 5. Arbitrage de périmètre recommandé

### Périmètre retenu en priorité haute

* **V1.2-1** : navigation détail multi-tuiles desktop
* **V1.2-2** : filtre et lecture des alertes
* **V1.2-3** : projection J+30 Trésorerie

### Périmètre retenu en priorité moyenne

* **V1.2-4** : amélioration / complétion desktop sur les tuiles C
* **V1.2-5** : export CSV / rapport

### Périmètre optionnel ou à repousser si besoin

* **V1.2-6** : mini-graphes tuiles secondaires mobile

---

## 6. Hors périmètre V1.2

Sauf décision contraire, V1.2 n'inclut pas :

* refonte du shell Lynki ;
* refonte design large ;
* réécriture profonde de la synthèse ;
* nouveau système d'alertes complet côté backend ;
* extension massive du design system ;
* changements d'architecture hors nécessité locale.

---

## 7. Ordre d'exécution recommandé

### Étape 1

**V1.2-1 — Navigation détail multi-tuiles desktop**

Pourquoi en premier :

* visible immédiatement ;
* cohérent avec la logique cockpit ;
* amélioration forte du parcours utilisateur ;
* peu risqué structurellement.

### Étape 2

**V1.2-2 — Filtre lecture des alertes**

Pourquoi ensuite :

* améliore l'usage concret des alertes ;
* renforce la lecture dirigeant / RAF ;
* sujet bien circonscrit.

### Étape 3

**V1.2-3 — Projection J+30 Trésorerie**

Pourquoi ensuite :

* forte valeur produit ;
* visible ;
* mais nécessite plus de rigueur sur la donnée et le sens métier.

### Étape 4

**V1.2-4 — Tuiles C desktop**
Puis :
**V1.2-5 — Export CSV / rapport**

### Étape 5

**V1.2-6 — Mini-graphes mobile**
Seulement si le reste est proprement avancé.

---

## 8. Fiches courtes par sujet

### V1.2-1 — Navigation détail multi-tuiles desktop

**Objectif** : depuis plusieurs tuiles du cockpit desktop, accéder à une vraie vue de détail ou à une destination claire.
**Bénéfice** : le cockpit devient plus actionnable.
**Risque** : ouvrir des routes de détail pas encore assez mûres.
**Règle** : mieux vaut un lien explicite vers une vue existante qu'un faux détail inline.

### V1.2-2 — Filtre alertes

**Objectif** : permettre de filtrer les alertes par niveau ou type (urgence / vigilance / suivi).
**Bénéfice** : meilleure lecture et priorisation.
**Risque** : complexifier un écran encore simple.
**Règle** : garder un usage rapide.

### V1.2-3 — Projection J+30 Trésorerie

**Objectif** : afficher une projection courte et utile.
**Bénéfice** : vrai gain de pilotage.
**Risque** : faire croire à une précision non tenue.
**Règle** : si projection, elle doit être explicitement marquée comme telle.

### V1.2-4 — Tuiles C desktop

**Objectif** : mieux couvrir le canon desktop.
**Bénéfice** : cockpit plus complet.
**Risque** : bruit visuel si ces tuiles n'apportent pas assez.
**Règle** : ne pas encombrer.

### V1.2-5 — Export CSV / rapport

**Objectif** : permettre des sorties utiles de certaines vues.
**Bénéfice** : usage comité / partage / analyse externe.
**Risque** : ouvrir un faux export pauvre ou incohérent.
**Règle** : commencer petit et utile.

### V1.2-6 — Mini-graphes mobile

**Objectif** : enrichir certaines tuiles secondaires.
**Bénéfice** : lecture plus riche.
**Risque** : surcharge mobile.
**Règle** : si ça ralentit la lecture, on ne le fait pas.

---

## 9. Critères de réussite de V1.2

V1.2 sera considérée comme réussie si :

* le cockpit desktop devient plus navigable ;
* les alertes deviennent plus exploitables ;
* la projection Trésorerie, si livrée, reste crédible et clairement qualifiée ;
* les ajouts ne dégradent pas la lisibilité V1/V1.1 ;
* le produit reste cohérent entre Max, Véréna et Esther ;
* aucun faux signal ou faux détail n'est introduit.

---

## 10. Critères de non-régression

Chaque sujet V1.2 devra être validé contre ces points :

* pas de régression sur les vues canoniques V1 ;
* pas de réintroduction de données mockées visibles ;
* pas de hardcodes trompeurs ;
* pas de confusion entre donnée réelle, proxy et projection ;
* pas de dégradation du responsive ;
* pas de perte de cohérence visuelle produit.

---

## 11. Livrables attendus

Pour V1.2, on vise des livrables plus légers que pour V1 :

* un **mini plan d'exécution V1.2** ;
* un **petit backlog V1.2** ;
* des **tickets ciblés** ;
* une **mini recette V1.2** par sujet ;
* et un **changelog V1.2** en fin de séquence.

---

## 12. Première décision recommandée

> **V1.2-1 — Navigation détail depuis les tuiles desktop prioritaires**

C'est le meilleur point d'entrée :

* concret ;
* rapide ;
* visible ;
* et sans surcharger le produit.

---

## 13. Formule finale

> V1.2 doit prolonger Lynki avec des améliorations visibles et utiles, sans rouvrir les fondations stabilisées en V1.1.

---

*Plan V1.2 ouvert le 24 mars 2026.*
*Référence backlog : [`BACKLOG_V1_2_LYNKI.md`](./BACKLOG_V1_2_LYNKI.md)*
