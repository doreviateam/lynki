# Spec d’écran — Synthèse comptable Lynki

**Fichier canonique (unique) :** `SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md`  
**Version document :** 0.5 — mars 2026  
**Révision 0.5 :** cohérence §11 (comportements **v0.5**) ; **§2.1** — pas de lecture directe « à la volée » des amont pour l’affichage de référence ; **§11.2** — période, périmètre, version référentiel / mapping (preuve).  
**Révision 0.4 :** principe **Vault** = source de **restitution Lynki** et de **preuve** ; **systèmes amont** = sources **opérationnelles d’origine** (§2.1).  
**Révision 0.3 :** **numérotation alignée** (version document = état courant) ; **BG = charnière** synthèse / preuve ; **fraîcheur globale vs par bloc** (§11) ; **§4** balances tiers = lecture complémentaire (pas seulement « après » le bilan).  
**Révision 0.2 :** blocs (Balances clients et fournisseurs), pivot BG, profondeur 3 niveaux, états d’écran, lien bilan / tiers ; **fichier unique** sans suffixe `v0.x` (anciens `*_v0.1` / `*_v0.2` supprimés).  
**Révision 0.1 :** structure initiale de la surface Synthèse.  
**Statut :** Spécification de surface (structure, blocs, lecture, preuve, états) — **pas** maquette pixel-perfect  
**Périmètre :** vue **`appView = synthese`** uniquement (le **Pilotage** et le **chrome header** sont cadrés ailleurs).

**Triptyque UX / navigation (référence) :**  
**[NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md)** · **[INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md)** · **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** · **[WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md)**

**Fondement navigation / BF :**  
**[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** (v0.3) · **[WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md)** · **[INVENTAIRE_UX_EXISTANT_LYNKI.md](INVENTAIRE_UX_EXISTANT_LYNKI.md)** (v2.6+)

**Fondement métier / données :**  
**[CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md)** (restitutions structurantes, § UI) · **[DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md)** · **[REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md](REFERENTIEL_COMPTABLE_RESTITUTION_LYNKI.md)** · **[ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)**

---

## 1. Objectif

Décrire la **structure de la surface centrale** lorsque l’utilisateur est en **Synthèse comptable** :

* **blocs** et **ordre de lecture** ;
* articulation bilan / compte de résultat / balances / **balance générale** ;
* règles de **drill-down** vers le détail comptable et le **grand livre** ;
* **profondeur d’information** au premier niveau ;
* **états d’écran** (chargement, vide, partiel, erreur / fraîcheur) ;
* **question des insights** (Diva ou équivalent) : critères de décision sans préjuger du copy ;
* ce qui reste **hors périmètre** à ce stade (droits fins, micro-colonnes tableaux).

---

## 2. Principes hérités de la navigation (rappel)

| Principe | Référence |
|----------|-----------|
| Pas de **`kpiMode`** dans cette vue | Spec navigation §5, wireframes §6 |
| Grand livre **jamais** entrée de navigation primaire | Spec §7.3 |
| **`view=synthese`** en URL cible ; fallback si non exposé | Spec §6 |
| Mobile : sections **empilées** plutôt que tableaux denses au premier niveau | Wireframes §10 |

### 2.1 Vault et sources amont (nuance à conserver)

| Rôle | Qui |
|------|-----|
| **Restitution Lynki** et **preuve** exposées dans l’UI (Synthèse, BG, grand livre côté Lynki) | Le **Vault** est la **source** de ces restitutions et de cette preuve au sens produit Lynki (données servies, cohérentes avec le périmètre et les APIs consommées par Lynki). |
| **Données d’origine** au sens opérationnel (saisie, ERP, pièces, journaux en amont) | Les **systèmes amont** restent les **sources opérationnelles d’origine** ; le Vault les **agrège / transforme** pour Lynki **sans** les substituer dans leur rôle métier en amont. |

*Cette distinction évite de confondre « ce que Lynki affiche et prouve » (chemin Vault) et « où la donnée vit en premier » (amont).*

**Verrouillage produit / archi —** La vue **Synthèse comptable** ne doit **pas** dépendre, pour son **affichage de référence**, d’une **lecture directe à la volée** des **systèmes amont** : Lynki s’appuie sur les **restitutions et agrégats issus du Vault** (cf. alignement implémentation).

---

## 3. Structure globale de la vue (premier niveau)

Ordre de lecture **proposé** (à valider avec produit / expert-comptable) :

| # | Bloc (intitulé utilisateur) | Rôle | Renvoi données |
|---|----------------------------|------|----------------|
| 1 | **Structure financière / Bilan** | Vue agrégée patrimoine / structure | Identifiants et rubriques : **dictionnaire** (`lynki.accounting.*`) + référentiel |
| 2 | **Performance comptable / Compte de résultat** | Charges / produits / résultat | Idem |
| 3 | **Balances clients et fournisseurs** | Synthèses **tiers** (recouvrement / décaissement) | Listes / balances selon périmètre CDC ; *métier : balances **auxiliaires** (ou « balances tiers »)* |
| 4 | **Balance générale** | **Vue pivot de preuve** — tableau des comptes | **Pivot** vers grand livre par compte |

*Variante de libellé pour le bloc 3 : **« Balances tiers »** si le produit préfère un terme plus court — le fond reste : clients / fournisseurs et lecture orientée encours.*

*Les libellés exacts, regroupements et sous-sections sont **figés** dans le référentiel / dictionnaire — cette spec en fixe l’**intention** et l’**ordre de lecture**.*

### 3.1 Balances clients / fournisseurs et bilan

Les **balances clients et fournisseurs** **complètent** la lecture du **bilan** par une **vue tiers** orientée **recouvrement** et **décaissement** (encours, liquidités à court terme côté relation commerciale) — elles ne remplacent pas le bilan ; elles en sont le complément pour la lecture opérationnelle des postes concernés.

---

## 4. Ordre de lecture et hiérarchie

1. **Lecture descendante** : de la **synthèse** (bilan / CdR) vers les **balances tiers**, puis la **balance générale**.
2. **Balances clients et fournisseurs** : ce n’est pas seulement un bloc « placé après » le bilan dans l’ordre d’affichage — c’est une **lecture complémentaire** des **postes tiers** (encours, recouvrement, décaissement), **en parallèle** de la lecture agrégée du bilan et du CdR.
3. **Preuve** : l’utilisateur doit pouvoir enchaîner **rubrique → compte(s) → balance générale → grand livre** sans repasser par le Pilotage.
4. **Cohérence filtres** : société, période, exercice — **mêmes filtres globaux** que le reste de Lynki (cf. inventaire §4).

---

## 5. Principe de profondeur au premier écran

Pour éviter une **surcharge** de la vue Synthèse :

| Niveau | Contenu | Exigence |
|--------|---------|----------|
| **1 — Premier écran (scroll)** | Synthèse **structurée** par blocs (bilan, CdR, balances tiers, annonce BG) | Chaque bloc reste **lisible** sans exposer **immédiatement** tout le détail comptable (pas de tableau complet « tout compte » dès l’ouverture). |
| **2** | **Balance générale** et vues de **détail** intermédiaires (listes, sous-totaux, filtres par compte) | Accès explicite depuis le bloc ou lien depuis restitutions. |
| **3** | **Grand livre** | **Drill-down** depuis la BG (ou lien contextualisé), jamais comme densité du niveau 1. |

*Référence lecture produit : **Pilotage** = décision rapide ; **Synthèse comptable** = lecture structurée / réconciliation ; **Grand livre** = preuve.*

---

## 6. Place de la balance générale

La **balance générale** est la **vue pivot** entre les **restitutions synthétiques** (bilan, CdR, balances tiers) et le **grand livre** : c’est le point où l’utilisateur passe de la **lecture agrégée** à la **liste de comptes** puis aux **écritures**.

> **Principe fort —** La balance générale est la **charnière** entre **lecture comptable synthétique** et **preuve détaillée** (écritures). Elle sert d’**arbitrage UX** : tout ce qui est « avant » reste agrégé ; tout ce qui est « après » (grand livre) est la preuve au compte.

| Sujet | Règle |
|-------|--------|
| Position | Bloc **dédié** en Synthèse (pas seulement lien caché) ; accès depuis les restitutions qui y renvoient (cf. wireframes §6–7). |
| Fonction | Liste (ou tableau) des **comptes** avec soldes / mouvements selon périmètre — **colonnes minimales** en **v0.6** ou référentiel. |
| Transition | Sélection d’un **compte** → **grand livre** filtré sur ce compte (drill-down). |

---

## 7. Place du grand livre

| Sujet | Règle |
|-------|--------|
| Navigation | **Drill-down uniquement** depuis la BG (ou lien contextualisé depuis une balance / rubrique), jamais onglet primaire « Grand livre » au même niveau que Pilotage / Synthèse. |
| Contenu | Écritures : date, journal, pièce, libellé, débit, crédit, solde courant — **granularité** et champs **à caler** sur CDC / implémentation. |
| Retour | Vers le **niveau comptable précédent** (ex. BG), pas vers le **cockpit KPI** par défaut. |

---

## 8. Drill-down : chaîne de preuve

```text
Synthèse (bilan / CdR / balances tiers) → rubrique ou compte → Balance générale → Grand livre (compte filtré)
```

*Les identifiants de routes internes (`?rubric=`, compte, etc.) sont **hors scope** navigation pure — voir inventaire §6, spec navigation §6 extension future.*

---

## 9. Bloc insights (Diva) — question ouverte

| Option | Intérêt | Risque |
|--------|---------|--------|
| **Aucun** bloc insights en Synthèse | Lisibilité, pas de confusion avec le Pilotage | Moins d’explication « contextuelle » sur la même page |
| **Encart réduit** (résumé / alerte) | Continuité du service Diva sans concurrencer la grille KPI | Charge éditoriale, critères d’affichage |
| **Bloc équivalent Pilotage** | Cohérence « une page = insights » | Surcharge cognitive sur une vue déjà dense |

**Décision :** **non tranchée** — arbitrage **inventaire §8.1** / atelier produit. *Critères utiles :* valeur ajoutée par rapport au pilotage, volumétrie, droits, coût API.

---

## 10. Desktop vs mobile

| Desktop | Mobile |
|---------|--------|
| Plusieurs blocs visibles avec scroll ; tableaux possibles pour BG / GL. | Sections **empilées** ; BG / GL en **écran plein** après action utilisateur ; pas de tableau illisible au premier niveau. |

---

## 11. États d’écran (premier niveau)

Même sans figer les **micro-copies** ni les composants UI, la Synthèse doit prévoir des comportements explicites :

| État | Comportement attendu (v0.5) |
|------|----------------------------|
| **Chargement** | Indicateur de chargement par bloc ou pour la surface ; éviter flash vide prolongé. |
| **Aucune donnée** | Message clair (périmètre vide, pas d’écriture sur la période, etc.) — distinction possible « vrai zéro » vs « pas encore calculé ». |
| **Données partielles** | Signalement si une source ou un sous-ensemble manque (ex. agrégat incomplet) — sans bloquer toute la page si le reste est exploitable. |
| **Erreur de source / fraîcheur insuffisante** | Message d’erreur ou d’avertissement ; lien avec **fraîcheur** / intégrité (alignement possible avec métriques existantes Lynki). |

### 11.1 Fraîcheur : globale et par bloc

* La surface peut afficher une **fraîcheur globale** (alignée sur le footer / métriques Lynki existantes).
* Si les **sources diffèrent** par bloc (bilan vs balance tiers vs BG), chaque **bloc comptable** peut exposer sa **propre fraîcheur** ou son propre statut — **à trancher** selon granularité des APIs (éviter la surcharge si une seule date de run suffit).

### 11.2 Période, périmètre et version du référentiel / mapping (preuve / rejouabilité)

Pour **ancrer** la promesse de preuve et la **rejouabilité** des restitutions, la surface Synthèse doit pouvoir exposer, **directement ou indirectement** (footer, bandeau, en-tête de bloc, tooltip, etc.) :

| Information | Rôle |
|---------------|------|
| **Période** | Période couverte par les chiffres affichés (cohérente avec les filtres globaux). |
| **Périmètre** | Ex. **société** / entité / tenant — aligné sur le périmètre métier de la restitution. |
| **Version du référentiel / mapping** | Identifiant ou libellé permettant de savoir **sous quelle version** du référentiel ou du mapping comptable les agrégats Vault ont été produits. |

*Emplacement UI et format exact — **v0.6** (peut être combiné avec les colonnes BG/GL).*

*Précision des textes, codes erreur et stratégie de retry (§11) : **v0.6** ou design system.*

---

## 12. Mapping implémentation (indicatif)

Aligné sur l’**annexe** des wireframes (§15) — à affiner en tickets.

| Rôle | Composant / module cible |
|------|---------------------------|
| Chrome page, filtres, `appView` | `DashboardWithFilters`, `ReportHeader`, `ReportHeaderContentBody` |
| Pilotage (hors ce doc) | `IconGrid`, `DivaFlashBlock`, cartes `*CardWithPolling` |
| **Surface Synthèse comptable** | **À créer** — ex. `AccountingSummaryView` (ou équivalent) rendu quand `appView === "synthese"` |
| **Sous-vues BG / GL** | **À créer** — routes ou panneaux enfants sous la même vue ; breadcrumbs métier |
| Données | **Vault** : restitution + preuve Lynki (cf. §2.1) ; **pas** de dépendance d’affichage à une requête directe amont (cf. §2.1) ; alignement **[ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)** |
| **Contexte de preuve** (période, périmètre, version référentiel / mapping) | Exposer selon **§11.2** ; liaison possible avec métadonnées Vault / APIs |

---

## 13. Hors périmètre document courant (explicitement)

* Décision finale **encart insights** Synthèse (voir §9).
* **Colonnes minimales** détaillées BG/GL, tri, export, pagination (**v0.6**).
* Règle détaillée **fraîcheur par bloc** vs globale seule (§11.1) selon capacités API.
* Droits RAF / DAF / consultant, masquage de lignes.
* Jeux de données multi-devises, segments analytiques (si hors CDC actuel).
* **Micro-copy** exacte des états §11 (ton, libellés boutons).

---

## 14. Suite

1. Valider **§3–§6** avec produit / expert-comptable.
2. **v0.6** (dans **ce même fichier**) : colonnes minimales BG/GL, affinage états §11 / §11.1 / §11.2, décision insights §9.
3. Lien **implémentation** : `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md` ; tickets à partir du **§12**.

---

*L’historique des révisions est en tête de document — **version document courante : 0.5**.*
