# Rapport d'audit - incoherences code HelloAsso

## Objet

Cette note formalise un audit cible du code HelloAsso dans Odoo, apres les evolutions recentes de la landing.

L'objectif n'est pas de relancer une refonte, mais de relever les incoherences les plus concretes entre :

- la logique metier attendue ;
- la separation par societe active ;
- les comportements reels du code.

---

## Point de cadrage a retenir

Le point important est le suivant :

- **LGZ** et **RGL** sont les deux perimetres structurants a distinguer dans Odoo ;
- **CCC** n'est pas une entite juridique autonome ;
- **CCC** doit donc etre lu comme un sous-perimetre metier rattache a **LGZ**, et non comme une troisieme societe equivalente.

En consequence, les sujets de separation technique et de visibilite portent d'abord sur **LGZ vs RGL**.

---

## 1. Constat principal

Le code HelloAsso est globalement bien structure, mais il subsiste plusieurs incoherences autour du **perimetre societe active**.

Ces incoherences ne remettent pas en cause le MVP dans son ensemble, mais elles peuvent produire des ecarts visibles pour l'utilisateur ou des rattachements discutables dans une base partagee.

---

## 2. Incoherences relevees

### 2.1. Ancienne vue d'ensemble HelloAsso encore globale

Le modele `dorevia.helloasso.landing` reste base sur une logique globale :

- recherches larges avec `sudo()`,
- comptages non explicitement filtres par societe active,
- semantique differente de la nouvelle landing `dorevia.helloasso.form.guide`.

Risque :

- entretenir deux lectures contradictoires du module HelloAsso ;
- reintroduire plus tard une vue non alignee avec la logique par societe active.

Lecture recommandee :

- soit supprimer cette ancienne vue si elle n'est plus utile ;
- soit l'aligner sur le meme perimetre societe que la landing actuelle.

---

### 2.2. Ecart possible entre le compteur d'adherents de la landing et la vue Adhésion

La landing actuelle compte les adherents avec un repli legacy sur `company_id` lorsque `helloasso_account_id` est vide.

La regle d'acces utilisateur sur les contacts HelloAsso, elle, s'appuie sur :

- `helloasso_account_id.company_id = company_id`

sans reprendre ce meme repli legacy.

Risque :

- la landing peut afficher un nombre d'adherents superieur a ce que l'utilisateur verra reellement dans la vue `Adhésion`.

Impact metier :

- incoherence visible pour l'utilisateur ;
- perte de confiance dans les compteurs.

Lecture recommandee :

- aligner la regle d'acces avec le meme repli legacy ;
- ou, a l'inverse, retirer ce repli des compteurs de landing.

---

### 2.3. Rapprochement payeur billetterie encore trop global

Dans la synchro billetterie, le payeur est rapproche par e-mail sur l'ensemble des contacts trouves, sans perimetre explicite de societe.

Risque :

- rattacher une commande HelloAsso de LGZ a un contact relevant de RGL si l'e-mail existe deja ;
- produire un rattachement techniquement stable mais metierement discutable.

Lecture recommandee :

- encadrer la recherche du payeur par la societe active et/ou le compte HelloAsso ;
- definir une regle de repli explicite en cas de doublon.

Ce point concerne surtout la separation **LGZ / RGL**.

---

### 2.4. Compteur billetteries de la landing fixe sur `Event`

La landing compte aujourd'hui les billetteries en utilisant uniquement :

- `form_type = Event`

alors que le module annonce un type de campagne par defaut paramettrable.

Risque :

- afficher `0` billetterie sur la landing alors que des campagnes existent avec un autre type ;
- rendre la landing trompeuse pour une societe qui n'utiliserait pas uniquement `Event`.

Lecture recommandee :

- compter toutes les billetteries de la societe active ;
- ou s'aligner sur le type configure pour cette societe.

---

## 3. Lecture metier corrigee avec CCC

Le sujet ne doit pas etre lu comme une separation entre trois entites equivalentes `LGZ / RGL / CCC`.

La bonne lecture est :

- **LGZ** et **RGL** : separation de perimetres societes ;
- **CCC** : segmentation metier interne a **LGZ**.

En pratique :

- les regles de separation du code doivent d'abord distinguer **LGZ** et **RGL** ;
- si des flux HelloAsso concernent **CCC**, ils doivent etre rattaches a **LGZ** puis distingues par campagne, formulaire, etiquetage ou vues metier.

---

## 4. Priorites de correction

Les deux priorites les plus importantes sont :

1. **aligner la landing et la vue Adhésion** sur le meme perimetre reel ;
2. **encadrer le rapprochement payeur billetterie** pour eviter un rattachement trop global.

Le sujet de l'ancienne vue d'ensemble HelloAsso et celui du compteur `Event` fixe restent importants, mais viennent ensuite.

---

## 5. Synthese

Le code HelloAsso reste globalement coherent pour un MVP, mais plusieurs points doivent etre gardes sous surveillance.

Le coeur du sujet est le suivant :

- la logique **par societe active** a bien progresse ;
- il reste encore quelques zones ou le code garde une lecture trop globale ;
- le vrai enjeu de separation porte surtout sur **LGZ** et **RGL** ;
- **CCC** doit etre traite comme un sous-perimetre de **LGZ**, pas comme une troisieme societe.

En l'etat, le MVP reste exploitable, mais il est utile de documenter ces incoherences pour les prochaines evolutions.
