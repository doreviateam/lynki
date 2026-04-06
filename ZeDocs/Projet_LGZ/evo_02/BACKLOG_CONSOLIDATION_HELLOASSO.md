# Backlog de consolidation - HelloAsso

## Objet

Cette note transforme le rapport d'audit HelloAsso en mini backlog d'actions de consolidation.

Le principe retenu est simple :

- ne pas relancer une refonte ;
- traiter quelques incoherences concretes ;
- garder une logique de correction progressive.

Doctrine cible :

> toute information affichee ou exploitee dans les flux HelloAsso doit etre lisible dans un perimetre societe explicite, sauf cas metier documente.

---

## Ticket 1 - Aligner la landing et la vue Adhésion

### Priorite

**Priorite immediate**

### Objectif

Supprimer l'ecart possible entre :

- le nombre d'adherents affiche dans la landing ;
- et les adherents reellement visibles dans la vue `Adhésion`.

### Risque evite

- compteur juge incoherent par l'utilisateur ;
- perte de confiance dans la landing HelloAsso.

### Resultat attendu

Les chiffres de la landing et la vue metier `Adhésion` reposent sur le meme perimetre fonctionnel.

### Critere de cloture

Meme population entre landing et vue `Adhésion` sur un jeu de test LGZ / RGL.

---

## Ticket 2 - Encadrer le rapprochement payeur billetterie

### Priorite

**Priorite proche**

### Objectif

Eviter qu'une commande billetterie HelloAsso soit rattachee a un contact trouve trop largement dans la base partagee.

### Risque evite

- mauvais rattachement de payeur entre LGZ et RGL ;
- erreur discrete mais penible a corriger ensuite.

### Resultat attendu

Le rapprochement du payeur est effectue selon une regle explicite, compatible avec le perimetre societe attendu.

### Critere de cloture

Un payeur n'est plus rapproche hors perimetre societe sans regle explicite.

---

## Ticket 3 - Clarifier le statut de l'ancienne vue d'ensemble HelloAsso

### Priorite

**Priorite de consolidation**

### Objectif

Eviter de conserver une ancienne vue HelloAsso qui reste globale alors que la landing actuelle est pensee par societe active.

### Risque evite

- coexistence de deux lectures contradictoires du module ;
- retour futur d'une logique globale non voulue.

### Resultat attendu

Une seule logique de lecture HelloAsso reste en place :

- soit l'ancienne vue est supprimee ;
- soit elle est alignee sur le meme cadre que la landing actuelle.

### Critere de cloture

Une seule vue HelloAsso de reference reste exposee ou maintenue explicitement.

---

## Ticket 4 - Revoir le compteur billetteries de la landing

### Priorite

**Priorite de consolidation**

### Objectif

Verifier si le compteur `Billetteries` de la landing doit rester borne au type `Event` ou s'aligner sur le type de campagne configure.

### Risque evite

- afficher `0` campagne alors que la societe utilise un autre type de formulaire HelloAsso ;
- rendre la landing trompeuse.

### Resultat attendu

Le compteur `Billetteries` reflete mieux la realite fonctionnelle de la societe active.

### Critere de cloture

Le compteur `Billetteries` correspond au parametrage fonctionnel retenu.

---

## Synthese

Le backlog de consolidation propose reste volontairement court.

Il s'organise en trois niveaux :

1. **Priorite immediate** : alignement landing / vue `Adhésion`
2. **Priorite proche** : rapprochement payeur billetterie
3. **Priorite de consolidation** : ancienne vue globale et compteur billetterie

Cela permet de corriger les incoherences les plus sensibles sans sortir du cadre MVP.
