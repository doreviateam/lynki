# Spec UX — Navigation Lynki : Pilotage × Synthèse comptable

**Fichier canonique (unique) :** `SPEC_UX_NAVIGATION_LYNKI.md`  
**Version document :** 0.3 — mars 2026  
**Révision 0.3 :** **valeur par défaut** et **normalisation** URL (`pilotage` si absent / inconnu) ; **compatibilité historique navigateur** ; **tableau label UI ↔ valeur technique** (`Pilotage` / `Synthèse comptable`).  
**Révision 0.2 :** noms d’état **`appView`** / **`kpiMode`** figés ; **valeurs URL** `?view=pilotage|synthese` **sans ambiguïté** ; **fallback** tenant sans Synthèse ; **insights Synthèse** explicitement **hors périmètre** de cette spec navigation.  
**Révision 0.1 :** première rédaction (switch header, modes, persistance, surfaces, mobile, grand livre).  
**Statut :** Spécification de navigation (pas de maquette d’écran comptable détaillé)  
**Fondement :** constats **[INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md)** v2.6+ (code `units/dorevia-linky`), intention **[NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md)**, alignement **[CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md)** / **[DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md)**.

---

## 1. Objectif de ce document

Trancher **comment** l’utilisateur navigue entre :

- **Pilotage** — lecture KPI (grille, insights, drill-down indicateurs) ;
- **Synthèse comptable** — lecture restitutions structurantes (bilan, CdR, balances, balance générale, etc.) ;

sans surcharger le **menu hamburger** ni imposer une **refonte** du shell Next.js (`app/layout.tsx` reste minimal ; le chrome métier vit au niveau **page** — voir inventaire §2).

---

## 2. Prérequis issus de l’inventaire (rappel)

| Constat | Implication pour cette spec |
|--------|-------------------------------|
| Chrome métier dans `DashboardWithFilters` / `ReportHeader` | Le switch **Pilotage / Synthèse** se place **dans cette zone**, pas dans le menu latéral seul. |
| Menu hamburger déjà chargé (tenant, modes, Odoo, DLP, POS…) | **Ne pas** y ajouter la bascule vue primaire comme solution par défaut. |
| `viewMode` actuel = filtres d’affichage KPI (`all`, `cash`, `business`, `corrections`, POS…) | Renommé conceptuellement **`kpiMode`** — **mode secondaire du Pilotage**, orthogonal à **`appView`**. |
| Persistance aujourd’hui surtout **state** ; `tenant` déjà en URL | MVP agile en state ; **cible URL** pour `view` alignée sur le modèle `tenant`. |

---

## 3. Modèle mental : deux niveaux d’état (noms figés)

Pour éviter le mélange **vue globale** / **filtres pilotage**, les noms **internes** retenus sont :

| Niveau | Nom **unique** | Valeurs | S’applique à |
|--------|----------------|---------|--------------|
| **Vue primaire** | **`appView`** | `pilotage` \| `synthese` | Toute la surface centrale sous le header partagé. |
| **Mode secondaire (pilotage)** | **`kpiMode`** (ex-`viewMode` dans le code actuel) | `all` \| `cash` \| `business` \| `corrections` \| `pos_shops` \| … | **Uniquement** lorsque **`appView === "pilotage"`**. |

*Ne pas utiliser* `surface` comme alias : **`appView`** est le terme de référence (code, revues, doc).

**Règle produit :** en **Synthèse comptable**, les modes KPI **ne s’affichent pas** et **n’influent pas** sur le rendu (sauf décision ultérieure de sous-filtres comptables dédiés, hors périmètre de cette spec).

**Implémentation (indication) :** séparer explicitement dans le state (et dans l’URL pour `appView` en cible) **`appView`** et **`kpiMode`** ; ne pas surcharger un seul `viewMode` avec les deux sens.

### 3.1 Libellé produit (UI) ↔ valeur technique

Alignement **produit / front / QA** — éviter toute ambiguïté entre le texte affiché et `appView` / `view` :

| Libellé UI (recommandé) | Valeur technique (`appView`, `view=`) |
|-------------------------|---------------------------------------|
| **Pilotage** | `pilotage` |
| **Synthèse comptable** | `synthese` |

*Les libellés exacts peuvent être ajustés par copywriting ; les **valeurs** `pilotage` et `synthese` restent la référence code et URL.*

---

## 4. Position et forme du switch (header)

### 4.1 Où

- **Dans le header / bandeau de rapport** (`ReportHeader` / alignement titre + filtres), **visible sans ouvrir le menu**.
- **Pas** comme simple entrée supplémentaire du menu hamburger (surcharge, faible découvrabilité).

### 4.2 Forme recommandée

| Option | Usage | Recommandation |
|--------|--------|----------------|
| **Segmented control** (2 segments) | Bascule rapide entre 2 surfaces | **Préféré** — compact, pattern familier pour « deux lectures du même périmètre ». |
| **Onglets** | Même intention, plus d’emprise verticale | Acceptable si design system Lynki les standardise déjà. |

### 4.3 Contrainte header (micro-point inventaire §3)

Le bandeau accueille déjà titre, filtres (dont partie **masquée** sur petit écran), intégrité, etc. Le switch **ne doit pas être « collé » sans respiration** :

- prévoir soit une **rangée dédiée** sous le titre (switch + contexte court),
- soit un **segmented** **compact** dans la ligne d’actions principale, avec **réorganisation légère** des blocs existants (atelier design).

*Objectif :* lisibilité desktop **et** mobile sans explosion du hamburger.

---

## 5. Cohabitation avec les modes actuels (cash, business, corrections, POS)

| Situation | Comportement |
|-----------|----------------|
| **`appView` = Pilotage** | Les modes **`kpiMode`** restent **accessibles** là où ils le sont aujourd’hui (menu / chrome pilotage — à ne pas densifier davantage le hamburger si une alternative existe pour le MVP). |
| **`appView` = Synthèse comptable** | **`kpiMode`** **masqué** ; pas de double lecture « je suis en cash ET en synthèse » au sens de cette spec. |
| Changement **Pilotage → Synthèse** | Le **`kpiMode`** peut rester **mémorisé** en mémoire pour le retour sur Pilotage, **sans** l’appliquer à la Synthèse. |
| Changement **Synthèse → Pilotage** | Restaurer l’affichage pilotage avec le **dernier** **`kpiMode`** connu (comportement attendu utilisateur). |

---

## 6. Persistance et URL cible

### 6.1 Paramètre et valeurs **figées** (ne pas rouvrir le débat sans motif majeur)

| Élément | Valeur |
|---------|--------|
| Nom du query param | **`view`** |
| Pilotage | **`?view=pilotage`** |
| Synthèse comptable | **`?view=synthese`** |

Exemple : `...?tenant=xyz&view=synthese` (ordre des params libre côté implémentation).

### 6.1.1 Valeur par défaut et normalisation

| Cas | Comportement attendu |
|-----|---------------------|
| **Valeur par défaut** | **`pilotage`** — toute entrée sur la page sans intention explicite de Synthèse doit se comporter comme **Pilotage**. |
| Paramètre **`view` absent** de l’URL | Interpréter comme **`view=pilotage`** (équivalent sémantique ; l’URL peut être **normalisée** en `?view=pilotage` si l’équipe dev choisit d’écrire systématiquement le paramètre). |
| Valeur **`view` inconnue** (typo, ancienne valeur, paramètre obsolète) | **Normaliser vers `pilotage`** (et corriger l’URL si synchronisation `searchParams`). |

Ces règles **complètent** le fallback « tenant sans Synthèse » (**§6.3**) : dans tous les cas d’erreur ou d’ambiguïté sur la **vue primaire**, le comportement sûr est **Pilotage**.

### 6.2 Phases

| Phase | Mécanisme | Commentaire |
|-------|-----------|-------------|
| **MVP** | State React (`appView` / `kpiMode`), éventuellement mirroring partiel vers l’URL pour tests | Itération rapide, cohérent avec l’existant. |
| **Cible** | Même sémantique que **§6.1** : **`view=pilotage`** \| **`view=synthese`** | Aligné sur **`?tenant=`** ; partage, retour navigateur, deep link. |

### 6.2.1 Historique navigateur (cible URL)

En **cible**, tout changement d’**`appView`** (action utilisateur : segmented control, lien, etc.) doit **pousser une entrée d’historique** compatible avec le **retour arrière** du navigateur (**Précédent** / **Suivant**) : l’utilisateur retrouve l’**URL** et l’**état d’écran** cohérents avec la vue précédente (y compris `view` et, le cas échéant, autres params stabilisés). *Implémentation :* `history.pushState` / navigation Next.js équivalente — **à trancher côté dev** ; l’exigence produit est la **cohérence** entre URL, historique et **`appView`**.

### 6.3 Fallback (feature flag / tenant)

Si l’URL ou l’action utilisateur demande **`view=synthese`** pour un **tenant** qui **n’expose pas encore** la surface Synthèse comptable (feature flag, droit, rollout) :

- **fallback automatique** vers **`view=pilotage`** (et mise à jour de l’URL si la navigation est synchronisée avec `searchParams`) ;
- optionnel : message discret du type « non disponible pour ce périmètre » — **hors détail UX ici**, mais le comportement par défaut est **ne pas laisser l’utilisateur sur une vue vide ou bloquée**.

**Extension future (hors périmètre navigation ici) :** `?rubric=…`, `?card=…` pour deep links métier — voir inventaire §6, §8.1 #5.

---

## 7. Structure des surfaces centrales

### 7.1 Pilotage

- **Grille** des cartes KPI (12 tuiles / équivalent actuel).
- **Bloc insights** (`DivaFlashBlock`) selon règles actuelles (visibilité liée au mode grille / focus carte).
- **Drill-down** par carte → instrument / détail métier (pattern `focusedCardId`).

### 7.2 Synthèse comptable

- Surface dédiée aux **restitutions structurantes** (bilan, compte de résultat, balances, **balance générale** comme niveau de navigation dans la synthèse — détail fonctionnel dans CDC / référentiel).
- **Pas** de réutilisation directe de la grille 12 cartes comme navigation **primaire** de la Synthèse (autre grammaire : rubriques / tableaux / sections).

**Bloc insights (Diva) spécifique à la Synthèse comptable :** la présence, l’absence ou une variante d’insights **n’est pas tranchée** par la présente spec — elle relève d’**inventaire §8.1** / atelier produit. **Le silence ici ne vaut pas validation implicite.**

### 7.3 Grand livre

- **Drill-down uniquement** depuis la Synthèse (ex. depuis balance générale ou lien contextualisé) — **pas** d’entrée de navigation primaire équivalente à Pilotage / Synthèse.
- Retour arrière : rester dans le **fil de lecture comptable** (breadcrumb / bouton retour) sans confondre avec le retour « cockpit » du pilotage.

---

## 8. Comportement mobile

| Sujet | Règle |
|-------|--------|
| Switch Pilotage / Synthèse | **Toujours visible** dans le chrome header (segmented compact ou équivalent), **pas** enfoui dans le hamburger. |
| Menu hamburger | Réservé au **secondaire** (tenant, liens outils, modes KPI **si** on ne les a pas sortis ailleurs en Pilotage, etc.) — **ne pas** y ajouter le switch **`appView`**. |
| Filtres société / période | Conserver la logique actuelle (dont masquage `sm`) ; l’inventaire signale un point **atelier** — la spec navigation **ne** préjuge pas du refactor filtres, mais exige que le **switch vue** reste utilisable une main / un pouce. |

---

## 9. Synthèse décisionnelle (pour revue produit)

| # | Sujet | Décision |
|---|--------|----------|
| 1 | Switch dans le header ? | **Oui** (chrome `ReportHeader`, pas menu seul). |
| 2 | Forme | **Segmented control** (ou onglets si standard produit). |
| 3 | Modes cash / business / … | **Pilotage uniquement** ; **masqués** en Synthèse (`kpiMode`). |
| 4 | Modèle d’état | **`appView`** + **`kpiMode`** distincts. |
| 5 | Persistance | **MVP state** → **cible `?view=pilotage` / `?view=synthese`**. |
| 5bis | Défaut / URL | **Défaut `pilotage`** ; **`view` absent ou invalide** → **`pilotage`**. |
| 6 | Fallback sans Synthèse | **`view=synthese`** → **`pilotage`** si non exposé. |
| 6bis | Historique navigateur | Changement d’**`appView`** → navigation **compatible retour arrière** (cible URL). |
| 7 | Grand livre | **Drill-down** depuis la Synthèse, pas nav primaire. |
| 8 | Insights en Synthèse | **Hors périmètre** de cette spec navigation (pas de présupposé). |

---

## 10. Liens et suite

- Inventaire UX : **[INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md)** (v2.6+).  
- Arbitrages encore ouverts : **inventaire §8.1** — insights en Synthèse, feature flags, droits.  
- Wireframes basse fidélité : **[WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md)** (ASCII : header, Pilotage + détail KPI, Synthèse, BG/GL, mobile, transitions).  
- Spec d’écran Synthèse comptable : **[SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)** (structure, profondeur, BG pivot, GL, états).

---

*À faire évoluer après atelier design / validation dev. — l’historique des révisions est en tête de document.*
