# Dossier d’handoff design — Lynki (V1)

## 1. Objet du document

Ce dossier **n’est pas** le design lui-même (pas de copie des écrans ici).

Il a pour objet d’expliquer **comment lire**, **prioriser** et **utiliser** les **sources canoniques du dépôt** : spécifications en HTML à la racine de `stitch_carole_61/`, maquettes Stitch (`stitch/<écran>/code.html`), captures (`screen.png`), et l’**inventaire détaillé** [`INVENTAIRE_STITCH_CAROLE_61.md`](./INVENTAIRE_STITCH_CAROLE_61.md).

**Public** : produit, **intégration**, développement front, QA, toute personne qui doit intégrer ou valider l’UI sans ouvrir chaque fichier HTML à l’aveugle.

**Principe** : la **vérité d’intégration** est dans le dépôt (HTML + PNG). Un export PDF éventuel (présentation, archivage) n’est qu’un **dérivé** : il ne remplace pas les chemins ci-dessous.

---

## 2. Statut du document

* **Version** : V1
* **Statut** : Référence officielle de handoff design — **V1 figée** (révisions mineures : corrections, liens, arbitrages ponctuels ; pas de refonte créative dans ce document)
* **Ligne canon gelée** : `stitch_carole_61/` et maquettes `*_canon_v5` — évolution par **nouveau lot design** ou **canon V6** uniquement
* **Auteur / responsable** : équipe produit Lynki (Dorevia) — à préciser le nom si besoin de contact unique
* **Source canon actuelle** : `ZeDocs/web59/stitch_carole_61/`
* **Dernière mise à jour** : 23 mars 2026
* **Prochaine révision** : à l’ouverture d’une ligne canon V6 ou d’un nouveau lot design (mettre à jour en parallèle [`INVENTAIRE_STITCH_CAROLE_61.md`](./INVENTAIRE_STITCH_CAROLE_61.md))

---

## 3. Ordre de lecture recommandé

Mode d’emploi pour une première prise en main (chemins relatifs à `ZeDocs/web59/stitch_carole_61/` sauf mention contraire) :

1. Lire `design_system_lynki_sp_cifications_handoff_v1.html` (règles d’intégration et de sens).
2. Lire `design_system_visuel_lynki_v0.html` (identité visuelle et composants).
3. Lire `lynki_canon_produit_v0.html` (personas, 12 tuiles, régimes de lecture).
4. (Optionnel) Parcourir `lynki_design_brief_summary.html` pour le rappel du brief mission.
5. Consulter [`INVENTAIRE_STITCH_CAROLE_61.md`](./INVENTAIRE_STITCH_CAROLE_61.md) (vue d’ensemble des dossiers et variantes).
6. Ouvrir les maquettes **canon V5** dans `stitch/<dossier>/code.html` (voir § 7 — fiches écran).
7. Utiliser **ce dossier** (handoff) pour arbitrer priorités, variantes et cas limites ; en cas de doute, appliquer le § 13.

---

## 4. Périmètre

### Inclus (V1 handoff design)

* Les **règles de sens** communes à tous les écrans : personas, hiérarchie des tuiles, états de donnée, doctrine des graphes, responsive, composants canoniques.
* Les **cinq familles d’écran** couvertes par les maquettes Stitch (cockpit pilotage desktop et mobile, détail tuile, synthèse comptable, alertes).
* La **ligne de référence « Canon V5 »** et le rôle des **itérations** (`it_ration_3`, `it_ration_4`) comme explorations successives.

### Hors périmètre de ce fichier

* La charte couleur pixel-perfect ou les fichiers Figma (s’ils existent en dehors du dépôt).
* Le code applicatif Lynki (`units/dorevia-linky`) — régi par le brief maître produit (`ZeDocs/web58`).

### Emplacement des sources dans le dépôt

```
ZeDocs/web59/
├── INVENTAIRE_STITCH_CAROLE_61.md                       # Tableau dossier → assets → titres
├── DOSSIER_HANDOFF_DESIGN_LYNKI_V1.md                   # Ce fichier (méthode de lecture)
└── stitch_carole_61/
    ├── design_system_lynki_sp_cifications_handoff_v1.html   # Spécifications handoff (texte)
    ├── design_system_visuel_lynki_v0.html                     # Canon visuel V0 (texte)
    ├── lynki_design_brief_summary.html
    ├── lynki_canon_produit_v0.html
    └── stitch/                                               # Maquettes HTML (une arborescence par écran)
            <nom_ecran>/
                code.html          # Maquette Tailwind (référence intégration)
                screen.png         # Capture (présente pour chaque maquette inventoriée)
```

---

## 5. Sources de référence dans le dépôt

### 5.1 Rôle des fichiers

| Intention | Fichier ou zone dans le dépôt |
|-----------|-------------------------------|
| **Inventaire complet** (noms de dossiers, variantes, `code.html` / `screen.png`, titres `<title>` quand présents) | [`INVENTAIRE_STITCH_CAROLE_61.md`](./INVENTAIRE_STITCH_CAROLE_61.md) |
| Règles handoff intégration | `stitch_carole_61/design_system_lynki_sp_cifications_handoff_v1.html` |
| Identité visuelle (palette, tuiles, confiance) | `stitch_carole_61/design_system_visuel_lynki_v0.html` |
| Canon produit (personas, 12 tuiles) | `stitch_carole_61/lynki_canon_produit_v0.html` |
| Résumé du brief mission | `stitch_carole_61/lynki_design_brief_summary.html` |
| Écran par écran (maquette + capture) | `stitch_carole_61/stitch/<dossier>/code.html` et `screen.png` |

### 5.2 Ligne « Canon V5 »

Les maquettes dont le dossier contient **`canon_v5`** constituent la **ligne canon** alignée sur les spécifications handoff V1. Les dossiers **`it_ration_3`** / **`it_ration_4`** sont des **itérations** à comparer au canon pour comprendre les choix retenus ou abandonnés.

---

## 6. Principes de lecture

1. **Lire les HTML de cadrage** (handoff + visuel + canon produit, § 5.1) **avant** d’ouvrir les `code.html` des maquettes : saisir l’intention, pas seulement le CSS.
2. **Toujours identifier le persona** de l’écran (Max / Véréna / Esther) : la densité et la navigation changent.
3. **Distinguer Pilotage et Synthèse** : deux régimes de lecture (voir brief produit `ZeDocs/web58` si besoin).
4. **Prioriser Canon V5** pour l’intégration ; utiliser les itérations comme **historique de design**.
5. **Ne pas traiter un `code.html` comme la spec API** : les données sont illustratives ; le contrat métier reste côté produit / back.
6. **La confiance est un composant** : tout KPI peut devoir afficher un état de donnée — les spécifications HTML handoff le rappellent systématiquement.

---

## 7. Les cinq fiches écran

Chaque fiche regroupe **un type d’écran** et pointe vers la maquette **canon** dans le dépôt. Les variantes `it_ration_*` explorent la même intention avec des ajustements de mise en page ou de densité.

### Fiche 1 — Cockpit Pilotage desktop (Véréna, RAF)

* **Persona** : Véréna — desktop pilotage.
* **Question métier** : « Que dois-je voir pour piloter sur la période ? »
* **Contenu attendu** : grille des **12 tuiles** avec hiérarchie maîtresses / B / C, en-tête (société, période, intégrité), accès synthèse / export si prévu.
* **Maquette canon (HTML)** : `stitch/pilotage_desktop_v_r_na_canon_v5/code.html`
* **Capture canon (PNG)** : `stitch/pilotage_desktop_v_r_na_canon_v5/screen.png`
* **Variante référence explicite 12 tuiles** : `stitch/pilotage_desktop_v_r_na_12_tuiles/code.html` — capture : `stitch/pilotage_desktop_v_r_na_12_tuiles/screen.png`
* **Itérations** : `pilotage_desktop_v_r_na_it_ration_3`, `pilotage_desktop_v_r_na_it_ration_4`, `pilotage_desktop_v_r_na` (version antérieure possible) — chaque dossier a son `screen.png`.

---

### Fiche 2 — Cockpit Pilotage mobile (Max, CEO)

* **Persona** : Max — mobile-first.
* **Question métier** : « Quels signaux essentiels en quelques secondes ? »
* **Contenu attendu** : liste ou grille compacte, tuiles maîtresses mises en avant, navigation bas d’écran si applicable.
* **Maquette canon (HTML)** : `stitch/pilotage_mobile_max_canon_v5/code.html`
* **Capture canon (PNG)** : `stitch/pilotage_mobile_max_canon_v5/screen.png`
* **Autres variantes** : `pilotage_mobile_max/`, `pilotage_mobile_max_it_ration_3/`, `pilotage_mobile_max_it_ration_4/` — dans chaque dossier : `code.html` + `screen.png`.

---

### Fiche 3 — Détail tuile : Trésorerie (Véréna)

* **Persona** : Véréna — approfondissement depuis le cockpit.
* **Question métier** : « Comment la position de trésorerie et les signaux associés se lisent-ils en détail ? »
* **Contenu attendu** : KPI principal, graphique d’évolution, blocs de confiance / rapprochement, navigation retour cockpit.
* **Maquette canon (HTML)** : `stitch/d_tail_tr_sorerie_v_r_na_canon_v5/code.html`
* **Capture canon (PNG)** : `stitch/d_tail_tr_sorerie_v_r_na_canon_v5/screen.png`
* **Variante** : `stitch/d_tail_tr_sorerie_v_r_na/code.html` — capture : `stitch/d_tail_tr_sorerie_v_r_na/screen.png` (nom de dossier avec typo « tr_sorerie » — conserver tel quel dans le dépôt).

---

### Fiche 4 — Synthèse comptable desktop (Esther, CDG)

* **Persona** : Esther — desktop synthèse / restitution.
* **Question métier** : « Comment la situation se lit-elle de façon structurée et exportable ? »
* **Contenu attendu** : sections type résumé, rubriques, tableaux, qualité / confiance, actions type export PDF si présentes dans la maquette.
* **Maquette canon (HTML)** : `stitch/synth_se_desktop_esther_canon_v5/code.html`
* **Capture canon (PNG)** : `stitch/synth_se_desktop_esther_canon_v5/screen.png`
* **Variantes** : `synth_se_comptable_esther_v_r_na/`, `synth_se_comptable_esther_it_ration_3/`, `synth_se_comptable_esther_it_ration_4/` — `code.html` + `screen.png` dans chaque dossier.

---

### Fiche 5 — Alertes et signaux financiers (Max)

* **Persona** : Max (priorité lecture alertes) ; transposable en partie à Véréna.
* **Question métier** : « Quelles anomalies ou signaux prioriser maintenant ? »
* **Contenu attendu** : liste ou cartes d’alertes, niveaux de criticité, lien vers le détail ou le cockpit.
* **Maquette canon (HTML)** : `stitch/alertes_signaux_max_canon_v5/code.html`
* **Capture canon (PNG)** : `stitch/alertes_signaux_max_canon_v5/screen.png`
* **Variantes** : `alerts_signals_max/`, `alertes_signaux_max_it_ration_3/`, `alertes_signaux_max_it_ration_4/` — `code.html` + `screen.png` dans chaque dossier.

---

## 8. États de donnée (grammaire de la confiance)

Ces états sont **obligatoires** au niveau conceptuel : tout indicateur sensible doit pouvoir les porter (cf. `design_system_lynki_sp_cifications_handoff_v1.html`).

| État | Rôle pour l’utilisateur | Repère couleur (handoff V1) |
|------|-------------------------|-----------------------------|
| **Fiable / confirmée** | Lecture pour arbitrage en confiance | Vert (#10B981) |
| **Partielle** | Lecture possible, périmètre incomplet | Ambre (#F59E0B) |
| **Estimée / proxy** | Chiffre utile mais non définitif | Style adouci + label type « ESTIMÉE » |
| **À rapprocher** | Flux ou lignes non totalement réconciliés | Bleu (#3B82F6) |
| **Indisponible** | Pas de lecture exploitable | État vide + action (ex. relancer) |
| **Anomalie détectée** | Donnée présente mais incohérente / critique | Rouge (#EF4444) |

**Règle** : la qualité de la donnée est une **couche transverse** du produit, pas un ornement.

---

## 9. États d’interface

Complément des états de **donnée** : états **UI** que le système doit prévoir pour rester utilisable (alignés brief produit et maquettes).

| État | Comportement attendu |
|------|----------------------|
| **Normal** | Lecture standard sans friction. |
| **Alerte** | Vigilance — ne pas confondre avec « anomalie donnée » ; peut être purement UI (seuil métier). |
| **Critique** | Mise en avant forte — action ou investigation prioritaire. |
| **Chargement** | Le produit indique que la donnée arrive (skeleton, spinner contextualisé). |
| **Donnée partielle** | Lisibilité préservée + qualification visible de la limite. |
| **Donnée indisponible** | Pas d’effet « écran cassé » ; message et action de secours si pertinent. |
| **Placeholder produit** | Emplacement prévu mais fonction pas encore active (ex. **Z de caisse**). |

---

## 10. Doctrine des graphes

Les graphes **ne sont pas décoratifs** ; ils servent un **verbe de lecture** (signal, structure, analyse).

| Contexte | Types privilégiés | Objectif |
|----------|-------------------|----------|
| **Pilotage** (mobile / desktop) | Sparklines, barres duales (entrées / sorties) | Signal rapide, tendance |
| **Synthèse comptable** | Répartition (donut), waterfall (écarts), aging (balances âgées) | Structure, masses, échéance |
| **Détail tuile** | Courbes d’évolution, projections en pointillés si prévues | Analyse, contexte temporel |

**Règle** : l’évolution complète souvent la lecture ; elle n’est pas toujours le KPI principal sur le premier écran.

---

## 11. Règles responsive

* **Compactage** : sur mobile, passage d’une **grille** à une **liste verticale** pour les tuiles.
* **Hiérarchie** : sur le premier niveau mobile, **seules les tuiles maîtresses** gardent des graphes visibles immédiatement si la place est limitée.
* **Navigation** : **menu latéral** sur desktop pilotage / synthèse ; **barre d’onglets ou navigation basse** sur mobile (selon maquette Max).
* **Max** : le mobile n’est pas un desktop réduit — **parcours managérial court** ; densité réduite, signaux d’abord.
* **Véréna** : **desktop pilotage** — densité plus forte, **lecture simultanée de plusieurs tensions** sur le cockpit, **accès rapide au détail** (tuile → approfondissement) sans perdre le contexte période / entité.
* **Esther** : **desktop synthèse** — **structure tabulaire** et rubriques, **logique de justification** (qualité, complétude), **priorité à la restitution** (lecture structurée, export si prévu).

---

## 12. Composants canoniques

Liste minimale à couvrir par le système UI (détail dans `design_system_lynki_sp_cifications_handoff_v1.html` et `design_system_visuel_lynki_v0.html`) :

* **Tuiles** : maîtresses (hero), secondaires B, secondaires C (formats différenciés).
* **Badges** : statut, qualité de donnée, priorité — forme pillule, texte lisible, couleur sémantique.
* **Filtres et sélecteurs** : période, entité / société, vue (pilotage / synthèse).
* **Tableaux** : montants alignés à droite, **chiffres tabulaires** (Inter + `font-variant-numeric: tabular-nums`).
* **Cartes** : bordures discrètes, ombre légère, focus sur la donnée.
* **Bloc de confiance** : état de la donnée, rapprochement, intégrité — lisible au même titre qu’un KPI (voir § 8).
* **Bloc de synthèse** : résumé structuré (texte court + repères chiffrés) pour cadrer la lecture avant le détail.
* **Vue détail** : écran ou panneau d’approfondissement depuis une tuile (KPI principal, série temporelle, actions) — cohérent avec le cockpit d’origine.
* **Graphes analytiques** : visualisations au service d’un verbe de lecture (tendance, structure, échéance) — pas décoratives (voir § 10).
* **Insights** : blocs narratifs (icône type ampoule), fond très léger, ne remplacent pas la preuve chiffrée.
* **Alertes** : synthétiques, priorisées, orientées action.
* **États globaux** : loading, empty, erreur, partiel, indisponible, placeholder.

---

## 13. Règle d’arbitrage (ce qui fait foi en cas de divergence)

En cas d’écart entre une capture PNG, un HTML de maquette, un document de cadrage, ou une interprétation d’intégration, l’ordre de priorité est :

1. **Canon produit** et règles de sens (`lynki_canon_produit_v0.html`, brief `ZeDocs/web58`).
2. **Spécifications handoff V1** (`design_system_lynki_sp_cifications_handoff_v1.html`, complété par `design_system_visuel_lynki_v0.html` pour le visuel).
3. **HTML canon V5** (`stitch/<dossier>_canon_v5/code.html` pour l’écran concerné).
4. **PNG de capture** (`screen.png` du même dossier — revue rapide ; si le HTML a évolué sans régénération du PNG, le HTML prime).
5. **Itérations précédentes** (`it_ration_*`, variantes sans suffixe canon) — matériel d’historique et de comparaison, pas de vérité seule.

En cas de doute persistant : trancher avec le produit et mettre à jour le canon (maquette ou spec), pas l’inverse.

---

## 14. Points ouverts

À clarifier ou tracer explicitement lors du prochain cycle :

1. **Alignement** entre couleurs hex du handoff (#10B981, etc.) et **tokens** / thème Tailwind du code produit (`dorevia-linky`).
2. **Renommage optionnel** du dossier `d_tail_tr_sorerie_*` (typo) pour éviter les erreurs de chemin — à valider pour ne pas casser des liens externes.
3. **Z de caisse** : maquette placeholder — comportement final et données à brancher côté produit.
4. **Exports PDF** (fonction produit) : boutons présents sur certaines maquettes — périmètre fonctionnel exact (synthèse, pilotage) à valider avec le métier.
5. **Itérations 3 / 4** : décision de **conserver ou archiver** ces dossiers une fois le canon V5 validé en intégration.
6. **Export présentation** : si un PDF ou un livret est produit hors dépôt pour réunion ou investisseur, le traiter comme **dérivé** des fichiers listés au § 5.1 — pas comme source d’intégration.

---

## 15. Prochaine étape (passage au cahier des charges d’intégration)

Ce dossier de handoff design constitue la **base de transmission** vers :

* le [**cahier des charges d’intégration front — Lynki V1**](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md) ;
* le **découpage en lots de développement** ;
* la **recette design / produit / dev**.

Le **cahier des charges d’intégration** ne repose pas uniquement sur ce handoff : il s’appuie **autant** sur l’**existant implémenté** (code applicatif réel — typiquement `units/dorevia-linky`, composants, flux, contraintes techniques vécues) que sur la **volonté d’évolution** exprimée ici (canon Stitch, grammaire de confiance, fiches écran, doctrine des graphes). L’intégration consiste à **rapprocher** cible design et réalité produit : inventaire de l’existant, écarts, lots pour combler sans tout repartir de zéro.

Ce document ne décrit pas encore :

* les contrats d’API ni les schémas de données ;
* les comportements techniques détaillés (performances, erreurs réseau, etc.) ;
* les **priorités de sprint** ni l’ordonnancement des livrables.

Ces éléments sont traités dans le [**cahier des charges d’intégration front — Lynki V1**](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md) (document distinct, en prolongement direct de celui-ci).

---

## 16. Références croisées ZeDocs

* Cahier des charges d’intégration front V1 : [`ZeDocs/web59/CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md`](./CAHIER_CHARGES_INTEGRATION_FRONT_LYNKI_V1.md)
* Plan de lots dev V1 : [`ZeDocs/web59/PLAN_LOTS_DEV_LYNKI_V1.md`](./PLAN_LOTS_DEV_LYNKI_V1.md)
* Mapping front ↔ données V1 : [`ZeDocs/web59/MAPPING_FRONT_DONNEES_LYNKI_V1.md`](./MAPPING_FRONT_DONNEES_LYNKI_V1.md)
* Checklist de recette détaillée V1 : [`ZeDocs/web59/CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md`](./CHECKLIST_RECETTE_DETAILLEE_LYNKI_V1.md)
* Backlog d’implémentation V1 : [`ZeDocs/web59/BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md)
* Template de ticket implémentation : [`ZeDocs/web59/TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md`](./TEMPLATE_TICKET_IMPLEMENTATION_LYNKI_V1.md)
* Annexe endpoints / champs V1 : [`ZeDocs/web59/ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md`](./ANNEXE_ENDPOINTS_CHAMPS_LYNKI_V1.md)
* Inventaire maquettes Stitch : `ZeDocs/web59/INVENTAIRE_STITCH_CAROLE_61.md`
* Brief mission designeuse : `ZeDocs/web58/BRIEF_DESIGN_LYNKI_MISSION_DESIGNER.md`
* Design system produit (V0) : `ZeDocs/web58/DESIGN_SYSTEM_PRODUIT_LYNKI_V0.md`
* Principes produit V1 (court) : `ZeDocs/web58/PRODUCT_DESIGN_SYSTEM_PRINCIPLES_LYNKI_V1.md`
* Brief maître interne (périmètre technique) : `ZeDocs/web58/SQUELETTE_BRIEF_DESIGN_FRONT_END_LYNKI.md`

---

*Document rédigé pour structurer l’usage des sources Stitch et des HTML handoff sous `ZeDocs/web59`. À mettre à jour lors d’un changement de ligne canon (V6, etc.) ou d’ajout de maquettes — mettre alors à jour [`INVENTAIRE_STITCH_CAROLE_61.md`](./INVENTAIRE_STITCH_CAROLE_61.md).*
