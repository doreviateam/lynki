# Cadrage — version mobile Lynki

**Fichier :** `ZeDocs/web61/CADRAGE_VERSION_MOBILE_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Statut :** cadrage d’application — **complément** au CDCF, **sans** le substituer  
**Primauté :** en cas d’écart sur le fond fonctionnel, **[`cdcf.md`](./cdcf.md) prime** — notamment **§3.19** (mode phone mobile — persona Max).  
**Articulation :** ce document **opérationnalise** l’intention produit mobile pour l’équipe conception / implémentation ; la norme détaillée phone reste au **CDCF §3.19**.  
**Spec générale :** [`SPEC_GENERALE_PILOTAGE_LINKY.md`](./SPEC_GENERALE_PILOTAGE_LINKY.md) (**§8.0** à **§8.3**, **§17**).  
**Rappel :** Lynki distingue **quatre** régimes d’écran (Desktop, Laptop, Tablette, Phone) — **§8.0** de la spec générale et **§3.18.0** du CDCF ; le présent fichier ne couvre que le **phone** au-delà du CDCF.

---

## 1. Objet

La version mobile de Lynki a pour objet de permettre une **lecture rapide, fiable et exploitable** du cockpit financier sur téléphone.

Elle ne cherche pas à reproduire toute la densité desktop.  
Elle doit préserver :

* la logique de **Pilotage** ;
* la hiérarchie des **tuiles maîtresses** ;
* la lecture du **contexte actif** ;
* l’accès au **détail** ;
* l’évaluation de la **confiance**.

---

## 2. Principe général

Sur mobile, Lynki doit être pensé comme un enchaînement vertical de blocs, selon cet ordre :

1. **Top bar**
2. **Bloc de contexte**
3. **Tuiles maîtresses**
4. **Tuiles secondaires**
5. **Blocs de prolongement**
6. **Navigation mobile**

La règle centrale est simple :

**sur mobile, on compacte, on priorise, on séquence.**

On ne cherche pas à tout afficher d’un coup.

---

## 3. Rôle de la version mobile

La version mobile doit servir d’abord à :

* vérifier rapidement la situation ;
* lire les 3 sujets majeurs ;
* repérer un signal ou un écart ;
* décider s’il faut approfondir ;
* ouvrir un détail utile.

Elle n’a pas vocation à devenir :

* une version analytique exhaustive ;
* un écran de paramétrage riche ;
* une console d’administration ;
* un ERP réduit.

---

## 4. Navigation mobile cible

### 4.1 Principe

La navigation mobile doit rester **courte, stable et compréhensible**.

À ce stade, elle peut se limiter à :

* **Pilotage**
* **Synthèse**
* **Lexique**
* **Aide**

### 4.2 Forme recommandée

Le plus naturel est une **bottom navigation** sur mobile.

Pourquoi :

* elle est plus accessible au pouce ;
* elle évite une surcharge en haut ;
* elle convient à un périmètre réduit ;
* elle permet de garder le contenu comme priorité.

### 4.3 Ce qu’on exclut

À ce stade, on évite :

* le menu burger comme navigation principale ;
* les entrées métier non stabilisées ;
* les actions de création type FAB `+` ;
* les menus profonds.

---

## 5. Header mobile

### 5.1 Principe

Le header mobile doit rester plus simple que le header desktop, tout en conservant la logique CDCF.

Il doit répondre à deux questions :

* **où suis-je ?**
* **dans quel contexte je lis ?**

### 5.2 Structure cible

#### Niveau 1 — orientation

Il contient :

* le titre de la vue : **Pilotage** ;
* l’avatar ou l’identité de session.

#### Niveau 2 — contexte

Il contient :

* **Tenant**
* **Société**
* **Période**
* **Année**

Sur mobile, ce deuxième niveau peut être présenté :

* soit sous forme de **chips / sélecteurs compacts** ;
* soit sous forme d’un **bloc filtre compact** ;
* soit sous forme d’un **sheet / panneau contextuel** si l’espace manque.

### 5.3 Règle de sobriété

Le header mobile ne doit pas accumuler :

* recherche ;
* badge preuves ;
* date de mise à jour ;
* icônes système multiples ;
* actions secondaires.

Ces éléments peuvent exister ailleurs, mais pas au cœur du header mobile.

---

## 6. Ordre de lecture mobile

L’ordre de lecture mobile doit être :

1. **Pilotage**
2. **Bloc contexte**
3. **Trésorerie**
4. **Business**
5. **Flux net**
6. **Tuiles secondaires**
7. **Accès détail / alertes**
8. **Navigation basse**

Cette séquence doit rester stable.

---

## 7. Hiérarchie des cartes sur mobile

### 7.1 Niveau A — cartes maîtresses

Les cartes maîtresses restent :

* Trésorerie
* Business
* Flux net

Sur mobile, elles doivent être :

* affichées en premier ;
* empilées verticalement ;
* plus riches que les autres ;
* visuellement dominantes.

### 7.2 Niveau B/C — cartes secondaires

Les cartes secondaires doivent être :

* plus compactes ;
* plus uniformes ;
* plus courtes ;
* moins bavardes.

Le bon format mobile est souvent une **grille 2 colonnes**, ou une **colonne simple** si la lisibilité l’exige.

---

## 8. Grammaire mobile d’une carte

Chaque carte mobile doit garder la grammaire Lynki :

* intitulé ;
* valeur principale ;
* contexte court ;
* badge ou état de confiance ;
* accès au détail si pertinent.

Mais elle doit être **resserrée**.

### 8.1 Ce qu’on garde

* la valeur principale ;
* l’état de confiance ;
* un contexte utile ;
* la cohérence des badges.

### 8.2 Ce qu’on réduit

* les breakdowns trop nombreux ;
* les lignes secondaires longues ;
* les explications bavardes ;
* les actions parasites.

---

## 9. Carte Trésorerie mobile

### 9.1 Rôle

La carte Trésorerie reste la carte héro mobile.

C’est elle qui doit donner le premier signal de confiance.

### 9.2 Contenu recommandé

Elle doit afficher :

* intitulé : **Trésorerie** ;
* valeur principale ;
* contexte court : ex. `Solde validé (Vault)` ;
* badge état : `Partiel`, `Fiable`, etc. ;
* signal court de couverture ;
* un nombre limité d’éléments secondaires.

### 9.3 Règle

La carte héro mobile doit rester **plus simple que la desktop**, mais pas appauvrie au point de perdre sa fonction.

---

## 10. Blocs de prolongement mobile

Après les cartes, la version mobile peut proposer deux prolongements prioritaires :

* **Détail trésorerie**
* **Alertes & signaux**

Ces blocs doivent être :

* lisibles ;
* plus proches de listes / cartes d’accès ;
* moins « dashboard » ;
* plus orientés lecture suivante.

---

## 11. Footer / métadonnées système sur mobile

Sur mobile, les métadonnées système doivent être fortement réduites.

Le footer système complet desktop ne doit pas être repris tel quel.

On peut envisager :

* soit rien ;
* soit une métadonnée discrète dans un écran secondaire ;
* soit un panneau « info technique » séparé.

La priorité mobile est la lecture métier, pas l’exposition système.

---

## 12. Direction esthétique mobile

La version mobile doit conserver :

* le **dark theme** comme référence ;
* la sensation de cockpit ;
* la sobriété ;
* la confiance ;
* la netteté typographique.

Elle ne doit pas glisser vers :

* une app financière « grand public » ;
* une app de productivité générique ;
* un dashboard marketing ;
* une interface ludique.

---

## 13. Ce qu’on garde de l’inspiration Carole mobile

On garde :

* la compacité des labels ;
* les badges courts ;
* le rythme vertical ;
* la hiérarchie carte héro / cartes secondaires ;
* la qualité du duo typo ;
* la propreté d’un bottom nav restreint.

**Maquettes de référence (statiques)** :

* [`references/carole_suggest_01.html`](./references/carole_suggest_01.html) — exploration initiale (desktop / bandeau).
* [`references/carole_suggest_02.html`](./references/carole_suggest_02.html) — **Pilotage mobile Lynki** aligné CDCF **§3.19** / cadrage : A → alertes → B → C repliable, header + contexte, bottom nav, sans placeholder « ajouter un indicateur ».
* [`references/carole_suggest_03.html`](./references/carole_suggest_03.html) — **Pilotage tablette / iPad** aligné CDCF **§3.20** : header cockpit enrichi (Tenant → Année), grille A panoramique, B + C en colonne, bottom nav ; suite logique du mobile sans équivaloir « phone agrandi ».

---

## 14. Ce qu’on n’importe pas

On n’importe pas :

* le bouton flottant `+` ;
* « Ajouter un indicateur » ;
* la logique produit configurable ;
* le burger menu comme base principale ;
* les artifices d’app mobile trop génériques.

---

## 15. Version mobile Lynki cible

En synthèse, la version mobile cible doit ressembler à cela :

### Haut de page

* **Pilotage**
* avatar

### Bloc contexte

* Tenant
* Société
* Période
* Année

### Corps

* Trésorerie
* Business
* Flux net
* tuiles secondaires compactes
* Détail trésorerie
* Alertes & signaux

### Bas de page

* navigation : **Pilotage**, **Synthèse**, **Lexique**, **Aide**

---

## 16. Principe directeur

La version mobile de Lynki doit être conçue comme :

**un cockpit compact de lecture décisionnelle**,  
et non comme une version simplifiée d’un ERP ou une app mobile à effets.

Elle doit permettre :

* de voir vite ;
* de comprendre juste ;
* d’évaluer la confiance ;
* d’approfondir si nécessaire.

---

*Document prêt à être complété par une intégration normative ultérieure au CDCF si le produit valide ce cadrage.*
