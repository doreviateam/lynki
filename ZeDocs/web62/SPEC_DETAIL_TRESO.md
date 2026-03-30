# SPEC — Écran détail Trésorerie

**Fichier canonique :** `SPEC_DETAIL_TRESO.md`
**Version :** 1.0
**Date :** 30 mars 2026
**Références :** `SPEC_TUILE_TRESO.md`, `USER_STORIES_DETAIL_TRESO.md`, `EXECUTION_TICKETS_DETAIL_TRESO.md`, `RECETTE_MANUELLE_DETAIL_TRESO.md`, `EXECUTION_TICKET_T-TR-001.md`, doctrine UI Lynki

---

## 1. Objectif

L’écran détail **Trésorerie** prolonge la tuile cockpit en donnant au lecteur une compréhension exploitable de la position de trésorerie, de son niveau de confiance, des écarts résiduels et des actions prioritaires.

Il doit permettre de répondre rapidement à cinq questions :

* quelle est la position de trésorerie retenue à date ;
* de quoi cette position est-elle composée ;
* qu’est-ce qui n’est pas encore rapproché ou confirmé ;
* la situation s’améliore-t-elle ou se dégrade-t-elle ;
* où faut-il agir en priorité.

---

## 2. Rôle produit

L’écran détail Trésorerie n’est :

* ni une copie brute d’Odoo ;
* ni un simple relevé bancaire ;
* ni un dump comptable.

C’est un écran de **pilotage de trésorerie gouvernée**, destiné à transformer une lecture synthétique en compréhension décisionnelle.

Il articule cinq dimensions :

* **position**
* **qualité**
* **explication**
* **évolution**
* **action**

---

## 3. Positionnement métier

Pour un contrôleur de gestion, la trésorerie n’est pas seulement un solde à surveiller. Elle est un **levier de pilotage**, à condition que la lecture soit :

* fiable ;
* traçable ;
* expliquable ;
* actionnable.

L’écran détail Trésorerie doit donc permettre de juger simultanément :

* si la lecture peut être utilisée ;
* ce qui reste à rapprocher ;
* quel décalage résiduel subsiste ;
* si la dynamique s’améliore ;
* quelle décision ou quelle action recommander.

---

## 4. Périmètre

L’écran s’applique au périmètre courant défini par le header global Lynki :

* tenant
* société
* période
* année

Tous les montants, états, écarts, compteurs, tableaux et visuels doivent être cohérents avec ce périmètre.

L’écran doit rappeler explicitement ce périmètre dans sa zone de contexte.

Cette spec décrit la **cible produit** ; l’implémentation peut être **partielle** tant qu’elle documente les écarts par rapport à ces blocs.

---

## 5. Questions métier auxquelles l’écran répond

L’écran doit permettre à un lecteur métier de répondre à :

1. **Quelle trésorerie puis-je retenir aujourd’hui comme lecture de référence ?**
2. **Puis-je faire confiance à cette lecture ?**
3. **Qu’est-ce qui reste à rapprocher ?**
4. **Quel décalage reste à confirmer dans le solde ?**
5. **La situation progresse-t-elle ?**
6. **Quels comptes, flux ou anomalies doivent être traités en priorité ?**

---

## 6. Structure générale de l’écran

L’écran détail Trésorerie est structuré en **6 blocs principaux** :

* **Bloc A — Bandeau de synthèse**
* **Bloc B — Décomposition de la trésorerie**
* **Bloc C — Rapprochement bancaire**
* **Bloc D — Écart à confirmer**
* **Bloc E — Évolution de la trésorerie**
* **Bloc F — Vigilances et actions**

L’ordre de lecture attendu est :

1. position de référence ;
2. composition de la trésorerie ;
3. travail de rapprochement restant ;
4. décalage résiduel à confirmer ;
5. trajectoire ;
6. priorités d’action.

---

# 7. Bloc A — Bandeau de synthèse

## 7.1 Objectif

Assurer la **continuité** avec la tuile cockpit et donner en un seul regard la **position**, la **qualité de lecture** et les **deux indicateurs de gouvernance** — sans surcharge. Ce bandeau **donne le ton** de tout l’écran : ce qui n’est pas lisible ici ne doit pas être noyé plus bas sans raison.

## 7.2 Les cinq informations « cœur » (sans ambiguïté)

En zone principale du bandeau, l’utilisateur doit voir **exactement cinq lectures** alignées sur `SPEC_TUILE_TRESO.md` :

| # | Information | Forme attendue |
|---|-------------|------------------|
| 1 | **Solde validé** | Montant principal + sous-texte *Solde validé* |
| 2 | **État principal** | Badge `À confirmer` / `Partiel` / `Fiable` (ou états techniques **En attente** / **Indisponible** si pertinent) |
| 3 | **Couverture probante** | Pourcentage sur le périmètre affiché |
| 4 | **Montant à rapprocher** | Montant (même définition que la tuile et que le bloc C) |
| 5 | **Écart à confirmer** | Montant en **valeur absolue** dans le bandeau (même règle que la tuile ; le signe et l’explication vivent dans le bloc D et les infobulles) |

**Ordre des colonnes de synthèse (ligne des trois indicateurs sous le solde) :**  
**Couverture probante** → **Montant à rapprocher** → **Écart à confirmer** (même ordre que la tuile cockpit).

## 7.3 Méta secondaire (contexte et fraîcheur)

Sous ou à côté du titre, sans rivaliser avec le montant principal :

* **Périmètre** : rappel lisible (ex. tenant / société / période / année) — cohérent avec le header Lynki ;
* **Date et heure d’arrêté** de la lecture affichée ;
* **Synchro** : indicateur court du statut de synchronisation bancaire / agrégat (ex. *Synchro OK*, *Partiel*, *—* si inconnu).

Ces méta peuvent tenir sur **une à deux lignes** maximum en dessous du titre de page.

## 7.4 Ce qui ne va pas par défaut dans le bandeau minimal

Pour éviter la surcharge, les éléments suivants ne sont **pas** requis dans le bandeau **minimal** ; ils peuvent apparaître dans le **bloc C** (rapprochement), le **bloc B** ou une **infobulle** :

* nombre de **comptes** couverts ;
* nombre d’**opérations ouvertes** ;
* nombre de **journaux** ou instruments.

Ils peuvent toutefois être ajoutés au bandeau dans une **variante dense** (desktop large) si l’espace le permet, sous forme de **méta courte** (ex. *3 comptes · 27 op. ouvertes*) — jamais au détriment de la lisibilité des cinq infos cœur.

## 7.5 Couverture probante : pourcentage et barre

* Le **pourcentage** est **obligatoire** dans le bandeau (lecture immédiate).
* Une **barre compacte** (même sémantique que la tuile : couleur alignée sur l’état **À confirmer / Partiel / Fiable**) est **recommandée** pour la continuité visuelle cockpit → détail ; elle reste **secondaire** par rapport au chiffre (pas de demi-écran de barre).

Si l’espace est contraint (mobile), on peut n’afficher que le **%** et reporter la barre au bloc E ou la conserver en version très compacte une ligne.

## 7.6 Duplication avec les blocs C et D

* **Montant à rapprocher** et **Écart à confirmer** restent **visibles dans le bandeau** *et* développés dans les blocs C et D. Les **montants** sont les **mêmes** (même agrégats, même périmètre) ; les blocs inférieurs apportent le **détail** (lignes, explication, signe pour l’écart au bloc D), pas une autre définition.
* Aucun indicateur ne change de **signification** entre bandeau, tuile et bloc détaillé (cf. §14).

## 7.7 Structure ligne par ligne (référence mise en page)

Ordre de lecture vertical recommandé (desktop) :

1. **Ligne titre** : intitulé *TRÉSORERIE* (ou équivalent) + **badge d’état** à droite.
2. **Ligne périmètre** : synthèse tenant / société / période / année.
3. **Ligne fraîcheur** : *Arrêté :* date-heure · *Synchro* : statut (et autres méta courtes si variantes dense).
4. **Bloc montant** : montant principal en exergue ; sous-texte *Solde validé*.
5. **Ligne ou grille des trois indicateurs** : libellés **Couverture probante** | **Montant à rapprocher** | **Écart à confirmer** avec valeurs alignées ; barre compacte sous la couverture si retenue.

### Wireframe textuel de référence (Bloc A)

```text
TRÉSORERIE                                 [Partiel]
La Platine · Exercice à date · 2026
Arrêté : 30/03/2026 08:42 · Synchro OK

118 179,42 €
Solde validé

Couverture probante      Montant à rapprocher      Écart à confirmer
69 %                     43 228,60 €               21 500,00 €
```

*(Les valeurs sont des exemples ; chiffres d’illustration.)*

## 7.8 Règle UX

Le bandeau reste une **synthèse**, pas un tableau.
Le **montant principal** (solde validé) doit rester l’élément **dominant** visuellement.
Le badge d’état doit être visible sans **écraser** le montant (cf. `SPEC_TUILE_TRESO.md`, esprit des règles cockpit).

## 7.9 Cohérence avec la tuile cockpit

Les libellés et le sens des indicateurs sont **identiques** à la tuile :

* *Solde validé*
* *Couverture probante*
* *Montant à rapprocher*
* *Écart à confirmer*

Les tooltips du détail peuvent reprendre ou étendre les formulations du **§10** de `SPEC_TUILE_TRESO.md` (tooltips tuile) pour les mêmes indicateurs.

---

# 8. Bloc B — Décomposition de la trésorerie

## 8.1 Objectif

Montrer de quoi est composée la position de trésorerie retenue pour le périmètre affiché.

Le bloc **Décomposition de la trésorerie** doit permettre de passer d’un **solde global** à une lecture structurée par composantes :

* quels comptes portent l’essentiel du solde ;
* quelle part relève des banques, de la caisse ou d’autres instruments ;
* quels postes sont bien couverts et lesquels dégradent la lecture ;
* où se concentre la trésorerie utile à piloter.

Il constitue le bloc principal de **composition** et de **concentration du risque**.

---

## 8.2 Questions métier

Le bloc doit permettre de répondre à :

* quels comptes ou instruments composent la trésorerie affichée ?
* quels postes pèsent le plus dans le solde total ?
* quels comptes sont bien couverts ?
* quels comptes sont partiellement couverts ou dégradés ?
* la concentration de la trésorerie repose-t-elle sur un petit nombre de comptes ?

---

## 8.3 Les quatre lectures cœur du bloc

En zone visible du bloc, l’utilisateur doit retrouver au minimum :

| # | Information | Forme attendue |
|---|-------------|----------------|
| 1 | **Compte / journal / instrument** | Nom lisible de la composante |
| 2 | **Solde retenu** | Montant porté par la composante |
| 3 | **Couverture probante** | % ou état de couverture associé |
| 4 | **Contribution au solde** | Poids relatif dans le solde total |

Ces quatre lectures doivent suffire à comprendre :

* ce qui compose la trésorerie ;
* ce qui pèse le plus ;
* où la qualité de lecture est bonne ou dégradée.

---

## 8.4 Définition des indicateurs

### A. Compte / journal / instrument

Nom de la composante de trésorerie visible dans la décomposition.

Exemples :

* SG Pro
* BNP
* Caisse boutique
* Journal espèces
* Instrument spécifique

### B. Solde retenu

Montant de trésorerie retenu pour cette composante sur le périmètre affiché.

### C. Couverture probante

Part des flux / montants de cette composante couverts par preuve bancaire ou mécanisme équivalent.

### D. Contribution au solde

Part relative de cette composante dans le **solde validé total**.

La contribution au solde doit aider à lire rapidement :

* les composantes majeures ;
* les composantes marginales ;
* la concentration de la trésorerie.

---

## 8.5 Catégories de décomposition

Le bloc peut regrouper les composantes par grandes catégories :

* **Banques**
* **Espèces / caisse**
* **Autres instruments**
* **Éléments hors couverture** si pertinents

La catégorisation doit rester simple et compréhensible.  
Elle ne doit pas introduire une taxonomie technique inutile.

---

## 8.6 Contribution relative au solde total

Pour chaque ligne, le détail peut afficher la **contribution relative au solde total du périmètre**, en %.

Exemple :

* SG Pro : **81,8 %**
* BNP : **16,5 %**
* Caisse boutique : **1,7 %**

Cette lecture est importante car elle permet d’identifier immédiatement :

* les comptes structurants ;
* les comptes accessoires ;
* les comptes qui concentrent le risque de lecture.

---

## 8.7 Couverture par composante

Le bloc doit rendre lisible le fait qu’un compte puisse :

* porter une grande part du solde ;
* tout en étant peu ou moyennement couvert.

Cette combinaison est très importante pour un contrôleur de gestion.

Exemple typique :

* un compte pèse **80 % du solde**,
* mais n’est couvert qu’à **72 %**.

Le bloc doit permettre de voir cette tension sans devoir croiser manuellement plusieurs écrans.

---

## 8.8 Informations secondaires admises par ligne

Selon le niveau de densité retenu, chaque ligne peut aussi afficher :

* dernier relevé ;
* dernière synchro ;
* statut de rapprochement ;
* nombre d’opérations ouvertes ;
* indicateur de dégradation ou d’amélioration.

Ces informations restent secondaires par rapport aux quatre lectures cœur.

---

## 8.9 Hiérarchie du bloc

Ordre de lecture recommandé :

1. **nom du compte / journal**
2. **solde retenu**
3. **couverture probante**
4. **contribution au solde**
5. **métadonnées secondaires** si présentes

Le bloc doit permettre de répondre d’abord à :

* **qui porte la trésorerie ?**
* **avec quel poids ?**
* **avec quelle qualité de lecture ?**

---

## 8.10 Structure visuelle recommandée

Le bloc est organisé en **deux sous-zones** :

### A. Synthèse de répartition

* ventilation par catégorie ;
* total par catégorie si utile ;
* part relative.

### B. Détail par compte / journal

* lignes individuelles ;
* tri et lecture comparative.

---

## 8.11 Tri recommandé

Le tri par défaut devrait privilégier :

### Option recommandée

**Solde décroissant** ou **contribution décroissante**

Pourquoi :

* fait remonter les comptes qui portent la trésorerie ;
* met immédiatement en lumière les composantes majeures.

Tris secondaires possibles :

* couverture croissante ;
* comptes dégradés d’abord ;
* dernier relevé le plus ancien ;
* plus grand nombre d’opérations ouvertes.

---

## 8.12 Concentration du risque

Le bloc doit permettre de voir si la trésorerie est :

* répartie ;
* ou très concentrée sur un petit nombre de comptes.

Lorsque c’est pertinent, on peut faire ressortir une lecture du type :

* **Les 2 premiers comptes portent 98 % du solde**
* ou équivalent visuel

Cela aide le contrôleur de gestion à comprendre où se situe le vrai risque de lecture.

---

## 8.13 Règle UX principale

Le bloc ne doit pas être une simple liste de comptes.

Il doit rendre lisible :

* la **composition** ;
* la **concentration** ;
* la **qualité** par composante.

L’utilisateur doit pouvoir repérer immédiatement :

* le compte majeur ;
* le compte dégradé ;
* le compte bien couvert ;
* le compte qui mérite investigation.

---

## 8.14 Cohérence avec les autres blocs

Le bloc B doit être cohérent avec :

* **Bloc A** : le total des composantes doit expliquer le solde validé ;
* **Bloc C** : un compte faiblement couvert peut porter des opérations non rapprochées ;
* **Bloc D** : un compte important peut contribuer à l’écart à confirmer ;
* **Bloc F** : les comptes remontés comme vigilances doivent déjà être visibles ici.

Aucune composante majeure ne doit surgir dans les vigilances sans être identifiable dans la décomposition.

---

## 8.15 Vocabulaire autorisé / à éviter

### Vocabulaire principal autorisé

* **Banques**
* **Espèces / caisse**
* **Autres instruments**
* **Solde retenu**
* **Couverture probante**
* **Contribution au solde**

### À éviter en premier niveau

* jargon d’architecture ;
* identifiants techniques bruts ;
* libellés incompréhensibles sans contexte ;
* formules de calcul visibles.

---

## 8.16 Wireframe textuel de référence — Bloc B

```text
DÉCOMPOSITION DE LA TRÉSORERIE
Ce qui compose le solde validé

Catégorie        Compte / Journal        Solde        Couverture   Poids
────────────────────────────────────────────────────────────────────────
Banque           SG Pro                  96 679,42 €   72 %         81,8 %
Banque           BNP                     19 500,00 €   100 %        16,5 %
Espèces          Caisse boutique          2 000,00 €   100 %         1,7 %

[Voir détail par compte]   [Filtrer comptes dégradés]
```

### Variante enrichie possible

```text
Dernier relevé : 29/03/2026 · Statut : Partiel · 4 opérations ouvertes
```

---

## 8.17 Variante dense (desktop large)

En desktop large, le bloc peut ajouter :

* total par catégorie ;
* colonne « dernier relevé » ;
* colonne « opérations ouvertes » ;
* mini-indicateur de tendance ;
* surlignage des comptes dégradés.

Mais ces enrichissements ne doivent pas nuire à la lecture des quatre axes principaux :  
**compte / solde / couverture / poids**.

---

## 8.18 Version tactile

### iPad

Le bloc peut conserver :

* les catégories ;
* le solde ;
* la couverture ;
* le poids ;
* 3 à 5 lignes principales ;
* un bouton « Voir tous les comptes ».

### Phone

Le bloc doit privilégier :

* nom du compte ;
* solde ;
* couverture ;
* poids ;
* CTA vers le détail complet.

Les métadonnées secondaires peuvent être masquées ou repliées.

---

## 8.19 Critères d’acceptation — Bloc B

Le bloc Décomposition de la trésorerie est accepté si :

* il rend visible la composition du solde validé ;
* il permet d’identifier les comptes majeurs ;
* il permet de lire la contribution relative au solde total ;
* il rend visible la couverture par composante ;
* il permet de repérer une concentration du risque ;
* il reste cohérent avec les autres blocs de l’écran.

---

## 8.20 Recette minimale — Bloc B

### Cas 1 — Trésorerie concentrée

**Attendu :**

* un ou deux comptes portent l’essentiel du solde ;
* leur poids est visible ;
* leur couverture est lisible ;
* le risque de concentration est perceptible.

### Cas 2 — Trésorerie répartie

**Attendu :**

* plusieurs comptes se partagent le solde ;
* les contributions relatives sont lisibles ;
* aucun compte n’écrase la lecture.

### Cas 3 — Compte majeur dégradé

**Attendu :**

* le compte apparaît comme fortement pondéré ;
* sa couverture apparaît comme dégradée ;
* la tension composition / qualité est visible.

---

# 9. Bloc C — Rapprochement bancaire

## 9.1 Objectif

Expliquer ce qui reste à traiter pour améliorer la qualité de lecture de la trésorerie.

Le bloc Rapprochement bancaire doit transformer une information synthétique (« Montant à rapprocher ») en compréhension opérationnelle :

* quels flux restent ouverts ;
* sur quels comptes ;
* depuis quand ;
* pour quels montants ;
* avec quel impact sur la couverture probante.

Il constitue le bloc principal de **travail de fiabilisation** de la lecture — et explique concrètement pourquoi la lecture peut être **Partielle** ou **À confirmer**.

---

## 9.2 Questions métier

Le bloc doit permettre de répondre à :

* qu’est-ce qui n’est pas encore rapproché ;
* quelle masse reste à traiter ;
* où se concentre l’effort de rapprochement ;
* quels sont les éléments les plus anciens ou les plus significatifs ;
* quels comptes ou journaux dégradent le plus la couverture.

---

## 9.3 Les quatre lectures cœur du bloc

En zone de synthèse du bloc, l’utilisateur doit voir au minimum :

| # | Information | Forme attendue |
|---|-------------|------------------|
| 1 | **Montant à rapprocher** | Montant principal du bloc, cohérent avec le bandeau |
| 2 | **Opérations ouvertes** | Nombre d’éléments non rapprochés sur le périmètre |
| 3 | **Part non couverte** | Pourcentage ou part résiduelle non couverte |
| 4 | **Répartition par ancienneté** | Vue synthétique des masses ouvertes par âge |

Ces quatre lectures donnent :

* la masse ;
* le volume ;
* l’impact sur la qualité ;
* la profondeur temporelle du retard.

---

## 9.4 Définition des indicateurs

### A. Montant à rapprocher

Montant restant à traiter dans le rapprochement sur le périmètre affiché.

Il doit être strictement cohérent avec le même indicateur affiché :

* dans la tuile cockpit ;
* dans le bandeau du détail (§7).

### B. Opérations ouvertes

Nombre d’éléments non rapprochés actuellement portés par le périmètre affiché.

Cet indicateur donne une idée de **charge opérationnelle**, sans se substituer au montant.

### C. Part non couverte

Part des flux ou montants restant non couverts par preuve bancaire sur la période affichée.

Cet indicateur doit être cohérent avec :

* la **Couverture probante** du bandeau ;
* la logique d’état **À confirmer / Partiel / Fiable**.

### D. Répartition par ancienneté

Ventilation du montant restant à rapprocher selon l’âge des éléments ouverts.

Exemples de classes :

* `0–7 jours`
* `8–30 jours`
* `> 30 jours`

Les bornes exactes peuvent évoluer selon l’implémentation, mais la logique d’**aging** doit rester lisible.

---

## 9.5 Hiérarchie du bloc

Ordre de lecture recommandé :

1. **Montant à rapprocher**
2. **Opérations ouvertes**
3. **Part non couverte**
4. **Répartition par ancienneté**
5. **Tableau ou liste des éléments ouverts**

Le bloc doit d’abord montrer la **masse à traiter**, puis seulement le détail ligne à ligne.

---

## 9.6 Structure visuelle recommandée

Le bloc est organisé en **trois sous-zones** :

### A. Synthèse haute

* Montant à rapprocher
* Opérations ouvertes
* Part non couverte

### B. Répartition intermédiaire

* ancienneté ;
* éventuellement répartition par compte.

### C. Détail bas

* tableau / liste des éléments non rapprochés.

---

## 9.7 Vue détaillée des éléments non rapprochés

Le bloc doit pouvoir afficher un tableau ou une liste des opérations ouvertes.

### Colonnes / champs recommandés

* **Date**
* **Libellé**
* **Compte / journal**
* **Montant**
* **Ancienneté**
* **Statut**
* **Piste de rapprochement** ou contrepartie si disponible

### Tri recommandé par défaut

* montant décroissant  
  **ou**
* ancienneté décroissante

Le tri par défaut doit faire remonter soit :

* les éléments les plus risqués financièrement,
* soit les plus anciens,

selon la logique retenue en implémentation.

---

## 9.8 Vues utiles / filtres utiles

Le bloc peut proposer des vues ou filtres rapides :

* **Tous**
* **Par compte**
* **Par ancienneté**
* **Plus gros montants**
* **Les plus anciens**
* **Non rapprochés récemment**

Ces filtres doivent rester simples et orientés action.

---

## 9.9 Répartition par compte

Lorsque l’information est disponible, le bloc peut montrer quels comptes portent l’essentiel du rapprochement restant.

Exemple :

* SG Pro : 28 400 €
* BNP : 10 200 €
* Caisse : 4 628,60 €

Cette lecture aide à orienter immédiatement l’effort.

---

## 9.10 Répartition par ancienneté

La répartition par ancienneté doit être **visible sans ouvrir** le tableau détaillé.

Exemple :

* `0–7 j : 18 540 €`
* `8–30 j : 14 200 €`
* `>30 j : 10 488,60 €`

Cette information permet au contrôleur de gestion de distinguer :

* le retard normal ;
* le retard installé ;
* le sujet préoccupant.

---

## 9.11 Règle UX principale

Le bloc ne doit pas commencer par un tableau brut.

La première lecture doit être :

* combien reste-t-il à rapprocher ;
* combien d’éléments cela représente ;
* depuis quand cela dure ;
* où se concentre l’effort.

Le détail ligne à ligne vient ensuite.

---

## 9.12 Cohérence avec le bandeau et la tuile

Le **Montant à rapprocher** affiché dans le bloc C doit être **identique** à celui affiché :

* dans la tuile cockpit ;
* dans le bandeau de synthèse du détail.

Le bloc C **développe** cet indicateur ; il ne le redéfinit pas.

De même, la **Part non couverte** doit rester cohérente avec la **Couverture probante** du bandeau (logique complémentaire ou même assiette, selon l’implémentation — sans contradiction).

---

## 9.13 Ce qui ne doit pas apparaître en premier niveau

Le bloc C ne doit pas exposer d’abord :

* le jargon d’architecture ;
* les noms techniques de champs ;
* les formules de calcul ;
* une table exhaustive sans synthèse ;
* un nombre d’écritures isolé du montant.

Le langage visible reste métier :

* **Montant à rapprocher**
* **Opérations ouvertes**
* **Part non couverte**
* **Ancienneté**

---

## 9.14 Wireframe textuel de référence — Bloc C

```text
RAPPROCHEMENT BANCAIRE
Ce qui reste à traiter pour améliorer la qualité de lecture

Montant à rapprocher     Opérations ouvertes     Part non couverte
43 228,60 €              27                      31 %

Répartition par ancienneté
0–7 j : 18 540 €   8–30 j : 14 200 €   >30 j : 10 488,60 €

Principaux éléments non rapprochés
Date        Libellé                         Compte        Montant   Âge
28/03/2026  VIR CLIENT X                    SG Pro        8 400 €   2 j
25/03/2026  CB FOURNISSEUR Y                SG Pro        5 780 €   5 j
12/03/2026  REMISE CHÈQUES                  BNP           4 200 €   18 j

[Voir toutes les opérations]   [Voir par compte]   [Voir par ancienneté]
```

---

## 9.15 Variante dense (desktop large)

En desktop large, le bloc peut ajouter :

* une mini-répartition par compte ;
* un rappel de la couverture du compte ;
* une colonne « piste de rapprochement ».

Mais ces enrichissements ne doivent pas nuire à la lecture de la masse principale.

---

## 9.16 Version tactile

### iPad

Le bloc peut conserver :

* la synthèse haute ;
* l’aging ;
* les 3 à 5 principales lignes ouvertes ;
* un bouton « Voir toutes les opérations ».

### Phone

Le bloc doit se concentrer sur :

* Montant à rapprocher
* Opérations ouvertes
* aging
* 3 plus gros éléments
* CTA vers le détail complet

Le tableau exhaustif peut devenir une liste simplifiée.

---

## 9.17 Critères d’acceptation — Bloc C

Le bloc Rapprochement bancaire est accepté si :

* il affiche clairement la **masse à rapprocher** ;
* il permet d’identifier la **charge opérationnelle** ;
* il rend visible l’**ancienneté** des sujets ouverts ;
* il permet d’accéder aux éléments les plus significatifs ;
* il reste cohérent avec la tuile et le bandeau ;
* il privilégie la compréhension avant l’exhaustivité.

---

## 9.18 Recette minimale — Bloc C

### Cas 1 — Masse significative

**Attendu :**

* Montant à rapprocher visible
* part non couverte visible
* aging visible
* principaux éléments ouverts visibles

### Cas 2 — Faible masse

**Attendu :**

* bloc toujours lisible
* peu d’éléments ouverts
* message non dramatique
* cohérence avec un état **Fiable** possible

### Cas 3 — Données partielles

**Attendu :**

* synthèse affichée si possible
* tableau détaillé partiellement disponible ou honnêtement indisponible
* pas de contradiction avec le bandeau

---

# 10. Bloc D — Écart à confirmer

## 10.1 Objectif

Expliquer le **décalage résiduel** qui subsiste dans la lecture du solde affiché.

Le bloc **Écart à confirmer** ne doit pas seulement exposer un montant.  
Il doit permettre de comprendre :

* entre **quels agrégats** le décalage existe ;
* **quelle est sa direction** ;
* **quelle est sa nature** ;
* **s’il est normal, transitoire, ou préoccupant** ;
* et **quelles pistes permettent de l’expliquer**.

Ce bloc constitue le cœur de la **compréhension du doute résiduel** dans la lecture de trésorerie.

---

## 10.2 Questions métier

Le bloc doit permettre de répondre à :

* d’où vient l’écart affiché ?
* entre quoi et quoi est-il calculé ?
* est-ce un écart normal de temporalité ou un signal à investiguer ?
* cet écart est-il stable, en réduction ou en aggravation ?
* quelles masses ou quels événements l’expliquent en priorité ?

---

## 10.3 Les quatre lectures cœur du bloc

En zone de synthèse du bloc, l’utilisateur doit voir au minimum :

| # | Information | Forme attendue |
|---|-------------|----------------|
| 1 | **Écart à confirmer** | Montant principal du bloc, en **valeur absolue** |
| 2 | **Solde ERP** | Lecture comptable ERP sur le périmètre |
| 3 | **Position validée** | Lecture retenue comme référence |
| 4 | **Écart signé** | Sens du décalage, visible au moins dans le détail |

Ces quatre lectures doivent suffire à comprendre :

* ce qui est comparé ;
* combien sépare ces deux lectures ;
* dans quel sens se fait l’écart.

---

## 10.4 Définition des indicateurs

### A. Écart à confirmer

Décalage restant à confirmer dans la lecture du solde affiché.

Dans la tuile et dans le bandeau, cet indicateur est affiché en **valeur absolue**.  
Dans le détail, on peut rappeler en plus le **signe** pour expliciter la direction de l’écart.

### B. Solde ERP

Lecture de trésorerie portée par l’ERP pour le périmètre affiché.

### C. Position validée

Lecture de trésorerie retenue comme référence dans Lynki pour le périmètre affiché.

### D. Écart signé

Différence directionnelle entre la lecture ERP et la position validée.

Le signe ne doit pas être mis en avant dans la tuile cockpit, mais il est légitime ici pour expliquer :

* si le solde ERP est inférieur à la position validée ;
* ou l’inverse.

---

## 10.5 Définition produit

L’**Écart à confirmer** exprime le décalage restant à confirmer dans la lecture du solde affiché.

Dans l’implémentation actuelle, cet indicateur peut correspondre à l’écart entre :

* le **solde ERP** ;
* et la **position validée** retenue pour la vue.

Le bloc D doit rendre cette logique compréhensible **sans imposer le jargon technique** comme intitulé principal.

---

## 10.6 Qualification simple de l’écart

Lorsque l’information est disponible, le bloc peut qualifier l’écart selon une lecture simple :

* **Écart transitoire**
* **Écart à investiguer**

Cette qualification reste indicative.  
Elle ne remplace ni l’analyse métier, ni l’examen des éléments explicatifs.

### Intention des deux statuts

* **Écart transitoire** : l’écart paraît compatible avec un décalage normal de temporalité, de rapprochement ou d’intégration.
* **Écart à investiguer** : l’écart paraît trop important, trop ancien ou trop peu expliqué pour être tenu comme normal.

---

## 10.7 Les trois sous-zones du bloc

Le bloc est organisé en **trois sous-zones** :

### A. Synthèse haute

* Écart à confirmer
* Solde ERP
* Position validée
* Écart signé

### B. Qualification et contexte

* qualification simple ;
* ancienneté de l’écart si disponible ;
* tendance : stable / en réduction / en hausse.

### C. Éléments explicatifs

* principaux postes ou événements expliquant l’écart ;
* liens vers les flux, relevés ou opérations concernés.

---

## 10.8 Hiérarchie du bloc

Ordre de lecture recommandé :

1. **Écart à confirmer**
2. **Solde ERP**
3. **Position validée**
4. **Écart signé**
5. **Qualification**
6. **Éléments explicatifs**

Le lecteur doit d’abord comprendre :

* qu’il existe un décalage ;
* de quelle taille ;
* entre quelles lectures ;

puis seulement entrer dans les causes.

---

## 10.9 Éléments explicatifs attendus

Le bloc doit aider à comprendre si l’écart vient, par exemple :

* d’un **relevé non encore intégré** ;
* de **mouvements non rapprochés** ;
* d’**écritures en attente** ;
* d’un **décalage temporel** entre comptabilité et validation ;
* d’une **anomalie potentielle**.

Les éléments explicatifs ne doivent pas être une liste opaque.  
Ils doivent faire ressortir les **principales masses explicatives**.

---

## 10.10 Structure des explications

Les explications peuvent être présentées sous la forme :

### Variante A — postes explicatifs

* Relevé en attente : `21 500,00 €`
* Flux non rapprochés significatifs : `8 400,00 €`
* Écritures en attente : `3 200,00 €`

### Variante B — événements majeurs

* Dernier relevé bancaire non absorbé dans la lecture ERP
* Virement client non rapproché
* Pièce comptable manquante ou non lettrée

### Variante C — mix des deux

Un poste chiffré + une phrase explicative.

---

## 10.11 Ancienneté de l’écart

Lorsque l’information est disponible, le bloc peut afficher :

* depuis quand l’écart existe ;
* s’il est nouveau ;
* s’il se résorbe ;
* s’il stagne.

Exemples de micro-lectures :

* **Apparu il y a 2 jours**
* **Stable depuis 10 jours**
* **En réduction depuis J-7**
* **En hausse sur la semaine**

Cette lecture est très utile pour distinguer :

* un écart normal de clôture ;
* un écart problématique installé.

---

## 10.12 Règle UX principale

Le bloc ne doit pas donner l’impression d’une « anomalie magique ».  
Il doit rendre l’écart **explicable**.

L’utilisateur doit sortir du bloc avec une réponse à :

* **ce que compare Lynki ;**
* **pourquoi il y a encore un écart ;**
* **si cet écart est acceptable à court terme ou non.**

---

## 10.13 Cohérence avec la tuile et le bandeau

L’**Écart à confirmer** affiché dans le bloc D doit être **identique** à celui affiché :

* dans la tuile cockpit ;
* dans le bandeau du détail.

La différence est la suivante :

* **tuile / bandeau** : valeur absolue, lecture synthétique ;
* **bloc D** : valeur absolue + écart signé + explication.

Le bloc D **développe** l’indicateur, il ne le redéfinit pas.

---

## 10.14 Vocabulaire autorisé / vocabulaire à éviter

### Vocabulaire principal autorisé

* **Écart à confirmer**
* **Solde ERP**
* **Position validée**
* **Écart signé**
* **Écart transitoire**
* **Écart à investiguer**

### À éviter en premier niveau

* `Écart ERP − Vault` comme titre principal ;
* jargon de composant interne ;
* noms de variables ou de champs ;
* formules de calcul dans la zone principale.

Le détail technique peut exister :

* dans une infobulle ;
* dans une aide contextuelle ;
* dans une section secondaire.

---

## 10.15 Wireframe textuel de référence — Bloc D

```text
ÉCART À CONFIRMER
Décalage résiduel dans la lecture du solde

Écart à confirmer
21 500,00 €

Lecture comptable (ERP)      Position validée      Écart signé
96 679,42 €                  118 179,42 €          -21 500,00 €

Qualification : [Écart transitoire]

Principaux postes explicatifs
- Relevé en attente : 21 500,00 €
- Flux non rapprochés significatifs : 8 400,00 €
- Décalage de temporalité comptable : en cours de résorption

[Voir le détail du calcul]   [Voir les éléments explicatifs]
```

---

## 10.16 Variante dense (desktop large)

En desktop large, le bloc peut ajouter :

* une mini-série temporelle de l’écart ;
* une ventilation des principales causes ;
* un rappel du dernier changement significatif.

Mais ces enrichissements ne doivent pas masquer la lecture principale :  
**écart → comparatifs → qualification → explication**.

---

## 10.17 Version tactile

### iPad

Le bloc peut conserver :

* Écart à confirmer ;
* Solde ERP ;
* Position validée ;
* qualification ;
* 2 à 3 explications majeures ;
* bouton « Voir le détail ».

### Phone

Le bloc doit se concentrer sur :

* Écart à confirmer ;
* ERP vs position validée ;
* qualification ;
* 1 ou 2 causes principales ;
* CTA vers l’explication complète.

L’écart signé peut être affiché de façon secondaire.

---

## 10.18 Critères d’acceptation — Bloc D

Le bloc Écart à confirmer est accepté si :

* il rend visible l’existence et la taille du décalage ;
* il permet de comprendre entre quelles lectures l’écart est mesuré ;
* il distingue valeur absolue visible et sens signé détaillé ;
* il propose une qualification simple lorsque l’information existe ;
* il donne des pistes explicatives compréhensibles ;
* il reste cohérent avec la tuile et le bandeau ;
* il n’impose pas le jargon technique comme vocabulaire principal.

---

## 10.19 Recette minimale — Bloc D

### Cas 1 — Écart faible ou explicable

**Attendu :**

* bloc lisible ;
* qualification possible « transitoire » ;
* explication simple disponible ;
* pas de dramatisation inutile.

### Cas 2 — Écart significatif

**Attendu :**

* écart mis en avant ;
* comparaison ERP / position validée claire ;
* qualification « à investiguer » possible ;
* causes principales visibles.

### Cas 3 — Écart présent mais informations explicatives partielles

**Attendu :**

* montant affiché ;
* comparatifs affichés ;
* explication partielle honnête ;
* pas de faux niveau de certitude.

---

# 11. Bloc E — Évolution de la trésorerie

## 11.1 Objectif

Faire passer la lecture de la trésorerie d’une **photo** à une **trajectoire**.

Le bloc **Évolution de la trésorerie** doit permettre de comprendre :

* si la position de trésorerie s’améliore, se dégrade ou stagne ;
* si la couverture probante progresse réellement ;
* si le rapprochement avance ou se fige ;
* si l’écart à confirmer se résorbe ou se creuse.

Il constitue le bloc principal de **dynamique** et de **mise en perspective temporelle**.

---

## 11.2 Questions métier

Le bloc doit permettre de répondre à :

* la trésorerie monte-t-elle, baisse-t-elle ou reste-t-elle stable ?
* la qualité de lecture progresse-t-elle réellement ?
* le rapprochement avance-t-il ou ralentit-il ?
* l’écart à confirmer se réduit-il ou s’installe-t-il ?
* y a-t-il eu une rupture ou une anomalie récente ?

---

## 11.3 Les quatre lectures cœur du bloc

En zone visible du bloc, l’utilisateur doit retrouver au minimum :

| # | Information | Forme attendue |
|---|-------------|----------------|
| 1 | **Évolution de la trésorerie** | Série / courbe de la position sur la période |
| 2 | **Évolution de la couverture probante** | Série / repère de progression |
| 3 | **Évolution du montant à rapprocher** | Tendance de la masse restant à traiter |
| 4 | **Vélocité du rapprochement** | Indicateur court de progression récente |

Ces quatre lectures permettent de répondre à :

* où on en est ;
* comment on y est arrivé ;
* si la qualité de lecture progresse ;
* si l’effort de rapprochement produit un effet tangible.

---

## 11.4 Définition des indicateurs

### A. Évolution de la trésorerie

Variation de la **position validée** sur la période affichée.

Il s’agit de la trajectoire du montant principal, et non d’un simple point de comparaison comptable.

### B. Évolution de la couverture probante

Variation dans le temps de la **couverture probante** sur le périmètre affiché.

Cette série permet d’apprécier l’amélioration ou la dégradation de la robustesse de lecture.

### C. Évolution du montant à rapprocher

Variation dans le temps de la masse restant à traiter dans le rapprochement.

Cet indicateur permet de voir si :

* le backlog se résorbe ;
* stagne ;
* ou s’aggrave.

### D. Vélocité du rapprochement

Mesure courte de progression du rapprochement sur une période récente, par exemple :

* `+6 points sur 7 jours`
* `−3 800 € de montant à rapprocher sur 7 jours`

La vélocité n’a pas vocation à remplacer les séries ; elle les résume.

---

## 11.5 Définition produit

Le bloc Évolution de la trésorerie donne une lecture **temporelle** de la position et de sa qualité.

Il ne doit pas seulement montrer une courbe de solde.  
Il doit relier :

* la **position validée** ;
* la **couverture probante** ;
* le **montant à rapprocher** ;
* l’**effort de rapprochement récent**.

Il sert à répondre à une question décisive pour le contrôleur de gestion :

> **La situation se corrige-t-elle, ou se dégrade-t-elle ?**

---

## 11.6 Les trois sous-zones du bloc

Le bloc est organisé en **trois sous-zones** :

### A. Position de trésorerie

Courbe ou série de la trésorerie sur la période.

### B. Qualité de lecture

Évolution de la couverture probante et, si utile, de l’état principal.

### C. Dynamique de rapprochement

Évolution du montant à rapprocher et indicateur de vélocité récente.

---

## 11.7 Hiérarchie du bloc

Ordre de lecture recommandé :

1. **Évolution de la trésorerie**
2. **Évolution de la couverture probante**
3. **Évolution du montant à rapprocher**
4. **Vélocité du rapprochement**
5. **Points de rupture ou événements notables**

Le lecteur doit d’abord voir la **trajectoire globale**, puis la **qualité**, puis l’**effort opérationnel**.

---

## 11.8 Visualisations recommandées

Le bloc peut inclure :

* une **courbe** de trésorerie sur la période ;
* une **courbe** ou série compacte de couverture probante ;
* une **courbe** ou série du montant à rapprocher ;
* une **pastille de vélocité** ou une mini-synthèse sur la période courte.

Les visualisations doivent rester sobres et comparables.

---

## 11.9 Fenêtres temporelles

Le bloc peut proposer plusieurs fenêtres de lecture :

* période courante ;
* J-7 ;
* J-30 ;
* début de période → aujourd’hui ;
* comparaison courte vs longue.

La fenêtre active doit rester cohérente avec le périmètre affiché et clairement visible.

---

## 11.10 Mise en évidence des ruptures

Le bloc doit permettre de signaler, lorsque l’information existe :

* une variation significative de trésorerie ;
* une chute ou hausse soudaine de couverture ;
* un ralentissement du rapprochement ;
* une aggravation de l’écart à confirmer ;
* une amélioration nette récente.

Ces ruptures doivent être visibles sans devoir lire toutes les séries en détail.

---

## 11.11 Lecture de stagnation

Le bloc doit permettre de distinguer :

* une amélioration réelle ;
* une dégradation ;
* une stagnation.

La stagnation est une lecture importante : une couverture qui reste plate ou un montant à rapprocher qui ne baisse pas doit pouvoir être perçu comme un signal.

Exemples de micro-lectures :

* **Couverture stable depuis 10 jours**
* **Montant à rapprocher en baisse**
* **Écart à confirmer inchangé sur la semaine**
* **Progression du rapprochement ralentie**

---

## 11.12 Vélocité du rapprochement

La vélocité du rapprochement est un indicateur synthétique de progression récente.

Elle peut être exprimée :

* en **points de couverture gagnés** ;
* en **montant rapproché sur une courte période** ;
* ou dans une forme mixte si cela reste lisible.

Exemples :

* `+6 points de couverture sur 7 jours`
* `−4 500 € de montant à rapprocher sur 7 jours`

La forme exacte peut dépendre de l’implémentation, mais elle doit rester courte et compréhensible.

---

## 11.13 Cohérence avec les autres blocs

Le bloc E doit être cohérent avec :

* **Bloc A** : la situation actuelle est le point d’arrivée de la trajectoire ;
* **Bloc C** : la baisse du montant à rapprocher doit se lire aussi dans la dynamique ;
* **Bloc D** : la tendance de l’écart à confirmer ne doit pas contredire sa qualification ;
* **Bloc F** : une dégradation récente doit pouvoir faire remonter une vigilance.

Aucune tendance majeure ne doit surgir ici sans cohérence avec les autres blocs.

---

## 11.14 Vocabulaire autorisé / à éviter

### Vocabulaire principal autorisé

* **Évolution de la trésorerie**
* **Évolution de la couverture**
* **Évolution du rapprochement**
* **Vélocité du rapprochement**
* **En hausse / en baisse / stable**
* **Rupture**
* **Stagnation**

### À éviter en premier niveau

* jargon de calcul ;
* formulations trop statistiques ;
* légendes ambiguës ;
* accumulation de séries sans titre explicite.

---

## 11.15 Règle UX principale

Le bloc ne doit pas être une galerie de graphiques.

Il doit rendre immédiatement lisible :

* la trajectoire de la trésorerie ;
* la trajectoire de la qualité ;
* l’efficacité récente du rapprochement.

Le lecteur doit comprendre en quelques secondes :

* si la situation va dans le bon sens ;
* si l’amélioration est réelle ;
* ou si le pilotage stagne.

---

## 11.16 Wireframe textuel de référence — Bloc E

```text
ÉVOLUTION DE LA TRÉSORERIE
Tendance de la position et de la qualité de lecture

[Courbe trésorerie]
130k ┤                            ●
120k ┤                      ●
110k ┤                ●
100k ┤          ●
 90k ┤    ●
     └────────────────────────────────
      début période           aujourd’hui

Évolution de la couverture probante
J-30  42 %   J-15  55 %   J-7  63 %   Aujourd’hui 69 %

Évolution du montant à rapprocher
58 100 €  →  51 300 €  →  43 228,60 €

Vélocité du rapprochement
+6 points sur 7 jours

[Voir la période complète]   [Comparer à J-7]
```

---

## 11.17 Variante dense (desktop large)

En desktop large, le bloc peut ajouter :

* une mini-série de l’écart à confirmer ;
* des marqueurs de rupture ;
* une comparaison entre plusieurs fenêtres ;
* un bandeau de synthèse complémentaire (`en hausse`, `stable`, `en réduction`).

Mais ces enrichissements ne doivent pas casser la hiérarchie :

**trésorerie → couverture → rapprochement → vélocité**

---

## 11.18 Version tactile

### iPad

Le bloc peut conserver :

* une courbe principale de trésorerie ;
* une série compacte de couverture ;
* une série du montant à rapprocher ;
* la vélocité du rapprochement ;
* un bouton « Voir la période complète ».

### Phone

Le bloc doit se concentrer sur :

* une courbe principale ou un résumé de tendance ;
* la couverture actuelle vs J-7 ;
* le montant à rapprocher actuel vs J-7 ;
* une phrase courte de vélocité.

Sur phone, si plusieurs graphes nuisent à la lisibilité, privilégier :

* **1 courbe principale**
* **2 résumés de tendance**
* **1 vitesse de rapprochement**

---

## 11.19 Critères d’acceptation — Bloc E

Le bloc Évolution de la trésorerie est accepté si :

* il rend visible la trajectoire de la trésorerie ;
* il permet de lire la progression ou non de la couverture probante ;
* il permet de suivre l’évolution du montant à rapprocher ;
* il donne une indication claire de vélocité récente ;
* il permet de distinguer amélioration, stagnation et dégradation ;
* il reste cohérent avec les autres blocs de l’écran.

---

## 11.20 Recette minimale — Bloc E

### Cas 1 — Amélioration réelle

**Attendu :**

* trésorerie stable ou en progression ;
* couverture en hausse ;
* montant à rapprocher en baisse ;
* vélocité positive lisible.

### Cas 2 — Stagnation

**Attendu :**

* courbes peu mobiles ou plateaux visibles ;
* montant à rapprocher stable ;
* couverture peu évolutive ;
* lecture explicite de stagnation possible.

### Cas 3 — Dégradation

**Attendu :**

* baisse de couverture ou hausse du montant à rapprocher ;
* tension visible dans la trajectoire ;
* cohérence possible avec des vigilances dans le bloc F.

---

# 12. Bloc F — Vigilances et actions

## 12.1 Objectif

Transformer la lecture de trésorerie en **priorités d’action concrètes**.

Le bloc **Vigilances et actions** ne doit pas seulement signaler des problèmes.  
Il doit aider le lecteur à comprendre :

* **où agir en premier** ;
* **ce qui menace la qualité de lecture** ;
* **ce qui menace l’exploitation de la trésorerie** ;
* **quelles actions permettent d’améliorer rapidement la situation**.

Il constitue le bloc principal de **priorisation opérationnelle** de l’écran détail Trésorerie.

---

## 12.2 Questions métier

Le bloc doit permettre de répondre à :

* quel compte, flux ou poste demande une action immédiate ?
* quelle anomalie ou quel retard dégrade le plus la lecture ?
* quel sujet est simplement à surveiller ?
* quelles actions doivent être menées maintenant ?
* vers quel écran ou quelle liste faut-il basculer pour traiter ?

---

## 12.3 Les quatre lectures cœur du bloc

En zone de synthèse du bloc, l’utilisateur doit voir au minimum :

| # | Information | Forme attendue |
|---|-------------|----------------|
| 1 | **Vigilances critiques** | Alertes bloquantes ou à fort impact |
| 2 | **Vigilances importantes** | Sujets à surveiller ou à traiter rapidement |
| 3 | **Informations d’amélioration** | Points non bloquants mais utiles |
| 4 | **Actions prioritaires** | CTA ou liens de traitement |

Ces quatre lectures donnent :

* le niveau de risque ;
* l’ordre de priorité ;
* la nature des sujets ;
* la porte d’entrée vers le traitement.

---

## 12.4 Définition des niveaux de vigilance

### A. Critique / bloquant

Sujet susceptible de compromettre fortement :

* la qualité de lecture ;
* la fiabilité de la trésorerie affichée ;
* ou la capacité à décider sereinement.

Exemples :

* montant significatif non rapproché depuis longtemps ;
* écart à confirmer important et non expliqué ;
* compte principal sans relevé récent ;
* chute forte de couverture probante.

### B. Important / à surveiller

Sujet non bloquant immédiatement, mais suffisamment significatif pour appeler une action ou une surveillance rapprochée.

Exemples :

* plusieurs opérations significatives ouvertes ;
* couverture en dégradation ;
* compte secondaire faiblement couvert ;
* ancienneté anormale sur une masse non critique.

### C. Information / amélioration possible

Sujet utile à signaler, sans caractère d’urgence.

Exemples :

* compte désormais totalement couvert ;
* amélioration récente de la couverture ;
* nombre d’opérations ouvertes en baisse ;
* sujet déjà en voie de résorption.

---

## 12.5 Types de vigilances attendues

Le bloc peut faire remonter, par exemple :

* **retard de rapprochement** sur un compte majeur ;
* **montant significatif non rapproché** ;
* **baisse de couverture probante** ;
* **écart à confirmer qui se creuse** ;
* **absence de relevé récent** ;
* **concentration du risque sur un seul compte** ;
* **ancienneté élevée d’éléments ouverts** ;
* **dégradation de la vélocité du rapprochement**.

Les vigilances doivent rester liées au sens métier de l’écran Trésorerie.

---

## 12.6 Les trois sous-zones du bloc

Le bloc est organisé en **trois sous-zones** :

### A. Vigilances critiques

Liste courte des points les plus urgents ou les plus risqués.

### B. Vigilances importantes et informations

Liste des sujets à surveiller, puis des points informatifs.

### C. Actions prioritaires

Zone de CTA ou de liens vers les écrans de traitement :

* opérations non rapprochées ;
* compte concerné ;
* paiements ;
* encours ;
* autres écrans pertinents.

---

## 12.7 Hiérarchie du bloc

Ordre de lecture recommandé :

1. **Critique / bloquant**
2. **Important / à surveiller**
3. **Information / amélioration**
4. **Actions prioritaires**

Le lecteur doit d’abord voir :

* ce qui menace le plus la qualité ou la lecture ;
* puis seulement les sujets secondaires ;
* puis les liens d’action.

---

## 12.8 Forme des vigilances

Chaque vigilance doit idéalement comporter :

* un **niveau** (critique / important / information) ;
* un **intitulé court** ;
* un **montant**, une **ancienneté** ou un **indicateur** si pertinent ;
* un **compte** ou un **périmètre** concerné si utile ;
* une **explication très courte**.

### Exemple de format

* **Compte SG Pro : 8 400 € non rapprochés depuis 18 jours**
* **Couverture probante inférieure à 70 %**
* **BNP désormais couverte à 100 %**

La vigilance doit être lue en **une ligne ou deux maximum**.

---

## 12.9 Actions prioritaires

Le bloc doit proposer des actions concrètes, par exemple :

* **Traiter les opérations non rapprochées**
* **Ouvrir le compte SG Pro**
* **Voir les paiements liés**
* **Consulter Encours**
* **Ouvrir les alertes**
* **Voir le détail de l’écart à confirmer**

Les actions proposées doivent être :

* peu nombreuses ;
* directement liées aux vigilances affichées ;
* prioritaires et non encyclopédiques.

---

## 12.10 Règle de priorisation

Le bloc ne doit pas afficher toutes les anomalies possibles.

Il doit faire ressortir :

* **3 à 5 vigilances maximum** d’emblée ;
* **3 actions maximum** en priorité.

Les autres sujets peuvent être :

* masqués derrière « Voir plus » ;
* ou accessibles via des écrans dédiés.

---

## 12.11 Règle UX principale

Le bloc doit aider à décider **quoi faire ensuite**.

Il ne doit pas devenir :

* une console d’alertes illisible ;
* un journal exhaustif des problèmes ;
* un second écran de détail comptable.

La lecture doit rester :

* orientée priorité ;
* orientée impact ;
* orientée action.

---

## 12.12 Cohérence avec les autres blocs

Le bloc F doit être cohérent avec :

* **Bloc A** : état principal, couverture, montants de synthèse ;
* **Bloc C** : opérations non rapprochées ;
* **Bloc D** : écart à confirmer ;
* **Bloc E** (**§11**) : dynamique / dégradation ou amélioration.

Une vigilance ne doit pas contredire la lecture des blocs amont.

Exemples :

* pas de vigilance « couverture critique » si l’écran affiche **Fiable** sans autre explication ;
* pas d’action prioritaire sur un compte absent des blocs B/C si ce n’est pas justifié.

---

## 12.13 Vocabulaire autorisé / à éviter

### Vocabulaire principal autorisé

* **Vigilances**
* **Actions prioritaires**
* **Critique / bloquant**
* **Important / à surveiller**
* **Information / amélioration possible**

### À éviter en premier niveau

* jargon d’architecture ;
* identifiants techniques sans contexte ;
* formules de calcul ;
* messages trop longs ;
* accumulation d’alertes non hiérarchisées.

---

## 12.14 Wireframe textuel de référence — Bloc F

```text
VIGILANCES ET ACTIONS
Priorités opérationnelles pour améliorer la lecture de trésorerie

🔴 Critique / bloquant
• Compte SG Pro : 8 400 € non rapprochés depuis 18 jours
• Écart à confirmer significatif sur la période courante

🟠 Important / à surveiller
• Couverture probante inférieure à 70 %
• 3 opérations > 5 000 € toujours ouvertes

🔵 Information / amélioration possible
• BNP désormais couverte à 100 %
• Montant à rapprocher en baisse sur 7 jours

Actions prioritaires
[Traiter les opérations non rapprochées]
[Ouvrir le compte SG Pro]
[Voir les paiements liés]
```

---

## 12.15 Variante dense (desktop large)

En desktop large, le bloc peut ajouter :

* une colonne **compte concerné** ;
* une colonne **ancienneté** ;
* une colonne **montant impacté** ;
* une section « améliorations récentes ».

Mais ces enrichissements ne doivent pas masquer :

* le niveau de criticité ;
* la lisibilité des actions.

---

## 12.16 Version tactile

### iPad

Le bloc peut conserver :

* les trois niveaux de vigilance ;
* 2 à 3 actions prioritaires ;
* un bouton « Voir toutes les vigilances ».

### Phone

Le bloc doit privilégier :

* 1 ou 2 vigilances critiques ;
* 1 ou 2 vigilances importantes ;
* 2 CTA maximum.

Les informations secondaires peuvent être repliées.

---

## 12.17 Critères d’acceptation — Bloc F

Le bloc Vigilances et actions est accepté si :

* il hiérarchise clairement les sujets par criticité ;
* il met en avant les sujets réellement prioritaires ;
* il ne noie pas le lecteur dans trop d’alertes ;
* il propose des actions concrètes et pertinentes ;
* il reste cohérent avec les autres blocs de l’écran ;
* il aide effectivement à décider quoi faire ensuite.

---

## 12.18 Recette minimale — Bloc F

### Cas 1 — Situation dégradée

**Attendu :**

* au moins une vigilance critique visible ;
* actions prioritaires directement liées ;
* pas d’ambiguïté sur le sujet principal à traiter.

### Cas 2 — Situation intermédiaire

**Attendu :**

* sujets « important / à surveiller » lisibles ;
* priorités claires sans dramatisation excessive ;
* liens d’action pertinents.

### Cas 3 — Situation saine

**Attendu :**

* peu ou pas de vigilances critiques ;
* informations orientées amélioration ou suivi ;
* actions plus légères ou absentes si non nécessaires.

---

# 13. Libellés recommandés

## 13.1 Bandeau de synthèse

Structure et règles détaillées : **§7**.

* **Solde validé**
* **État principal** (badge)
* **Couverture probante**
* **Montant à rapprocher**
* **Écart à confirmer**

## 13.2 Décomposition de la trésorerie (Bloc B)

Structure et règles détaillées : **§8**.

* **Banques** / **Espèces / caisse** / **Autres instruments**
* **Solde retenu** · **Couverture probante** · **Contribution au solde**

## 13.3 Rapprochement bancaire (Bloc C)

Structure et règles détaillées : **§9**.

* **Montant à rapprocher**
* **Opérations ouvertes**
* **Part non couverte**
* **Ancienneté** (répartition)
* **Compte** / **Journal** (détail lignes)

## 13.4 Écart à confirmer (Bloc D)

Structure et règles détaillées : **§10**.

* **Écart à confirmer** (absolu en synthèse, signé au détail)
* **Solde ERP**
* **Position validée**
* **Écart signé**
* **Écart transitoire** / **Écart à investiguer** (qualification si disponible)

## 13.5 Évolution (Bloc E)

Structure et règles détaillées : **§11**.

* **Évolution de trésorerie**
* **Évolution de la couverture**
* **Évolution du rapprochement**

## 13.6 Vigilances et actions (Bloc F)

Structure et règles détaillées : **§12**.

* **Vigilances** (critique / important / information)
* **Actions prioritaires** (CTA)

---

# 14. Relations avec la tuile cockpit

L’écran détail doit prolonger la tuile sans changer le sens des indicateurs.

Correspondances attendues :

* **Solde validé** → bandeau + décomposition (**§8**)
* **Couverture probante** → bandeau + décomposition + rapprochement + évolution (**§11**)
* **Montant à rapprocher** → bloc rapprochement (**§9**)
* **Écart à confirmer** → bloc explicatif dédié (**§10**)
* **État principal** → bandeau + éventuelles vigilances (**§12**)

Aucun indicateur ne doit changer de signification entre la tuile et le détail.

---

# 15. Tooltips / aides contextuelles

Les aides contextuelles de l’écran détail doivent rester cohérentes avec celles de la tuile.

Principes :

* expliquer le sens avant le calcul ;
* rester métier en premier niveau ;
* réserver les détails techniques à l’aide avancée ;
* ne pas réintroduire du jargon d’architecture comme vocabulaire principal.

---

# 16. Ce que l’écran ne doit pas devenir

L’écran détail Trésorerie ne doit pas :

* recopier Odoo sans valeur ajoutée ;
* afficher des blocs sans hiérarchie ;
* imposer le jargon d’architecture à l’utilisateur ;
* mélanger sans ordre photo, rapprochement, forecast et BFR ;
* se transformer en tableau comptable illisible ;
* noyer la lecture de trésorerie dans trop de détails secondaires.

---

# 17. Critères d’acceptation

L’écran détail Trésorerie est accepté si :

## 17.1 Position

* il permet de retrouver immédiatement la lecture de référence du cockpit ;
* le solde validé est visible et contextualisé.

## 17.2 Qualité

* la couverture probante est visible ;
* l’état principal reste compréhensible ;
* les raisons d’un état `Partiel` ou `À confirmer` deviennent lisibles.

## 17.3 Décomposition

*(Critères détaillés du bloc B : **§8.19** et recette **§8.20**.)*

* la composition du solde est visible par compte / instrument ;
* les comptes majeurs sont identifiables ;
* la contribution relative au solde total peut être lue.

## 17.4 Rapprochement

*(Critères détaillés du bloc C : **§9.17** et recette **§9.18**.)*

* le montant à rapprocher est expliqué ;
* les opérations non rapprochées sont accessibles et lisibles ;
* les principaux éléments bloquants peuvent être identifiés.

## 17.5 Écart

*(Critères détaillés du bloc D : **§10.18** et recette **§10.19**.)*

* l’écart à confirmer est expliqué sans jargon excessif ;
* l’origine du décalage devient compréhensible ;
* une qualification simple de l’écart peut être affichée si disponible.

## 17.6 Évolution

*(Critères détaillés du bloc E : **§11.19** et recette **§11.20**.)*

* l’écran permet de juger si la situation s’améliore, se dégrade ou stagne ;
* la progression du rapprochement est visible ou déductible.

## 17.7 Action

*(Critères détaillés du bloc F : **§12.17** et recette **§12.18**.)*

* les priorités d’action sont visibles ;
* des passerelles existent vers les zones à traiter.

---

# 18. Recette minimale

## Cas 1 — Lecture partielle

**Attendu :**

* bandeau cohérent avec la tuile ;
* bloc rapprochement significatif ;
* bloc écart explicatif ;
* vigilance visible.

## Cas 2 — Lecture fiable

**Attendu :**

* couverture forte ;
* faible reste à rapprocher ;
* écart faible ou expliqué ;
* écran plus orienté suivi que correction.

## Cas 3 — Lecture à confirmer

**Attendu :**

* bandeau dégradé ;
* mise en avant du manque de rapprochement ;
* écart / incertitude clairement expliqués ;
* actions prioritaires explicites.

## Cas 4 — Données incomplètes

**Attendu :**

* états `En attente` ou `Indisponible` ;
* pas de confusion avec une lecture métier normale ;
* messages honnêtes.

---

# 19. Wireframe textuel de référence

## Bloc A — Bandeau de synthèse

*(Détail : **§7** — wireframe complet et décisions UX.)*

* Titre + badge d’état
* Périmètre (ligne synthèse)
* Arrêté · synchro
* Solde validé (montant dominant)
* Couverture probante · Montant à rapprocher · Écart à confirmer (triptyque, même ordre que la tuile)

## Bloc B — Décomposition de la trésorerie

*(Détail : **§8** — quatre lectures cœur, wireframe, recette.)*

* Catégories · lignes compte/journal
* Solde · couverture · contribution (poids)
* Tri, concentration du risque, filtres dégradés

## Bloc C — Rapprochement bancaire

*(Détail : **§9** — quatre lectures cœur, wireframe, recette.)*

* Synthèse : montant à rapprocher · opérations ouvertes · part non couverte
* Aging puis détail (tableau / liste)
* Filtres et répartition par compte si disponible

## Bloc D — Écart à confirmer

*(Détail : **§10** — quatre lectures cœur, wireframe, recette.)*

* Synthèse : écart absolu · ERP · position validée · écart signé
* Qualification · ancienneté / tendance si dispo
* Postes ou événements explicatifs + liens

## Bloc E — Évolution de la trésorerie

*(Détail : **§11** — quatre lectures cœur, wireframe, recette.)*

* Courbe ou série de la position validée
* Évolution de la couverture probante
* Évolution du montant à rapprocher
* Vélocité du rapprochement

## Bloc F — Vigilances et actions

*(Détail : **§12** — quatre lectures cœur, wireframe, recette.)*

* Trois niveaux : critique · important · information
* Actions prioritaires (CTA) alignées sur les vigilances

---

## Récapitulatif synthétique — blocs A à F

Vue de pilotage du document : chaque ligne relie l’intention du bloc aux sections utiles pour le vocabulaire, l’implémentation et la recette.

| Bloc | Nom | Intention (synthèse) | Spec produit | Libellés | Critères & recette (bloc) | Critères d’acceptation (§17) |
|------|-----|----------------------|--------------|----------|---------------------------|------------------------------|
| **A** | Bandeau de synthèse | Continuité cockpit : position de référence, qualité de lecture, indicateurs de synthèse | **§7** | **§13.1** | *(cf. wireframe **§7** / **§19**)* | **§17.1** · **§17.2** |
| **B** | Décomposition de la trésorerie | Composition par catégories et comptes ; poids, couverture par ligne | **§8** | **§13.2** | **§8.19** · **§8.20** | **§17.3** |
| **C** | Rapprochement bancaire | Reste à rapprocher, opérations ouvertes, aging et leviers de traitement | **§9** | **§13.3** | **§9.17** · **§9.18** | **§17.4** |
| **D** | Écart à confirmer | Explication du décalage résiduel, qualification, liens vers le détail | **§10** | **§13.4** | **§10.18** · **§10.19** | **§17.5** |
| **E** | Évolution de la trésorerie | Trajectoire : position validée, couverture, montant à rapprocher, vélocité | **§11** | **§13.5** | **§11.19** · **§11.20** | **§17.6** |
| **F** | Vigilances et actions | Priorisation, niveaux de risque, passerelles d’action | **§12** | **§13.6** | **§12.17** · **§12.18** | **§17.7** |

**Renvois transverses :** continuité tuile ↔ détail **§14** ; recette d’écran **§18** ; formulation canonique **§20** ; journal court **§21**.

---

# 20. Formulation produit canonique

> L’écran détail Trésorerie donne au contrôleur de gestion une lecture gouvernée de la trésorerie à date : position de référence, composition par comptes, qualité de rapprochement, écart résiduel à confirmer, évolution dans le temps et priorités d’action. Il transforme la tuile cockpit en compréhension décisionnelle.

---

# 21. Journal — formulation courte

> L’écran détail Trésorerie prolonge la tuile cockpit par une lecture structurée en six blocs : synthèse, composition, rapprochement, écart, évolution et actions, afin de transformer une position de trésorerie synthétique en compréhension pilotable et actionnable.