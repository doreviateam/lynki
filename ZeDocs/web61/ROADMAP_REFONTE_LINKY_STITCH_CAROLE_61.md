# Roadmap — refonte Lynki (réf. créa `stitch_carole_61`)

**Objectif.** Refondre l’UI / l’expérience de Linky (`units/dorevia-linky`) en restant **au plus près** du cahier des charges [`cdcf.md`](./cdcf.md) : mêmes vues, mêmes règles de contexte, grammaire des tuiles (§5), instruments (§6), découpage des vues détail (ex. **§7** Trésorerie).

**Réf. créa.** Le dossier `ZeDocs/web59/stitch_carole_61` fournit la **matière visuelle** (composition, hiérarchie, tons) pour **implémenter** le CDCF à l’écran — pas l’inverse.

**Principe d’exécution.** Livrer par **jalons** ; chaque jalon a un **écran Stitch canon** comme aide à la mise en forme et des **critères d’acceptation** tirés en priorité des **sections correspondantes du CDCF**, complétés par un seuil visuel (§4 de cette roadmap).

---

## État du CDCF Web61 (`cdcf.md`)

Le cahier des charges a été **nettoyé, restructuré et approfondi** :

* **§1 à §4** : Dashboard, header global, vue Pilotage, vue Synthèse comptable.
* **§5** : *Grammaire d’une tuile Pilotage* — référence unique pour la structure minimale d’une tuile (intitulé, valeur, contexte, disponibilité, confiance, détail).
* **§6** : *Fiche détaillée — Tuile Pilotage « Trésorerie »* — référence produit détaillée pour cette tuile :

  * finalité métier
  * données d’entrée
  * calcul métier
  * valeur principale
  * contexte d’interprétation
  * signal de confiance
  * variantes d’état
  * contenu attendu de la vue détaillée

* **§7** : *Vue détaillée Trésorerie — découpage par blocs d’écran* — blocs **7.2.1** à **7.2.9**, états par bloc (§7.3), hors périmètre page (§7.4), lien Stitch (§7.5).

  Le **Jalon D** et le registre [`TABLEAU_TRACE_CDCF6_TRESORERIE.md`](./TABLEAU_TRACE_CDCF6_TRESORERIE.md) s’appuient sur **§6 + §7** pour la page `/tresorerie`.

---

## 1. Documents de référence (ordre de priorité)

| Priorité | Document / dossier | Rôle |
|----------|-------------------|------|
| 1 | `ZeDocs/web61/cdcf.md` | **Norme supérieure** : tout écran livré doit être vérifiable section par section (§1–§7…). |
| 2 | `ZeDocs/web59/stitch_carole_61/stitch/**/code.html` | Traduction **visuelle** du CDCF ; ne définit pas de périmètre métier supplémentaire sans arbitrage. |
| 3 | `ZeDocs/web59/stitch_carole_61/design_system_*.html`, `lynki_design_brief_summary.html`, `stitch/lynki_sovereign/DESIGN.md` | Tokens, intention produit, cohérence transverses. |
| 4 | `ZeDocs/web60/DOCTRINE_ETATS_UI_LINKY.md`, `SPEC_CARTES_MAITRESSES_LINKY.md` | États, contours, cartes maîtresses — à réconcilier avec Stitch et avec le CDCF Web61. |

**Règle de préséance.** En cas de tension : **1)** [`cdcf.md`](./cdcf.md) (structure fonctionnelle, libellés métier, états, confiance) ; **2)** doctrine / specs Web60 là où le CDCF renvoie à la fiabilité ou aux cartes maîtresses et n’a pas encore tout détaillé ; **3)** Stitch pour le **comment** visuel. Toute dérogation au CDCF = **décision produit écrite** (registre Trésorerie, amendement CDCF, ou backlog).

---

## 2. Matrice « écran app → fichier Stitch canon »

Utiliser **un seul fichier canon par surface** pour l’implémentation ; les `*_it_ration_*` servent d’historique ou de comparaison, pas de source principale sauf arbitrage explicite.

| Surface produit (cible) | Référence Stitch canon (à jour) | Rappel CDCF |
|-------------------------|--------------------------------|-------------|
| Cockpit desktop (12 tuiles, header fusionné) | `stitch/pilotage_desktop_v_r_na_canon_v5/code.html` | §3 hiérarchie A/B/C ; §5 grammaire tuile. |
| Grille / détail des 12 tuiles | `stitch/pilotage_desktop_v_r_na_12_tuiles/code.html` | Si le canon v5 ne suffit pas tuile par tuile. |
| Cockpit desktop (secours) | `stitch/pilotage_desktop_v_r_na/code.html` | Si le canon v5 est incomplet pour un bloc précis. |
| Cockpit mobile | `stitch/pilotage_mobile_max_canon_v5/code.html` | Persona Max (§3.3 CDCF). |
| Synthèse comptable desktop | `stitch/synth_se_desktop_esther_canon_v5/code.html` | §4. |
| Synthèse comptable (variantes) | `stitch/synth_se_comptable_esther_v_r_na/code.html` | Si le canon v5 ne couvre pas un écran réel. |
| Détail trésorerie | `stitch/d_tail_tr_sorerie_v_r_na_canon_v5/code.html` | §6, **§7** (blocs 7.2.x). |
| Alertes & signaux | `stitch/alertes_signaux_max_canon_v5/code.html` | Complément possible : `alerts_signals_max/code.html`. |

Chemin racine des fichiers : `ZeDocs/web59/stitch_carole_61/`.

---

## 3. Jalons de livraison (ordre recommandé)

Chaque jalon se termine par : recette sur **lab** (`./scripts/deploy-linky-lab.sh` depuis la racine du dépôt si applicable), capture d’écran comparée au Stitch, mise à jour d’une ligne dans `ZeDocs/web60/EXECUTION_TICKETS_WEB60_LINKY.md` ou d’un tableau de suivi Web61 dédié si vous le créez.

### Jalon A — Fondations design system dans l’app

* Extraire du Stitch / `DESIGN.md` : palette, typo, rayons, échelle d’espacement, surfaces (light/dark si applicable).
* Les mapper sur les **variables CSS** déjà utilisées par Linky (`--accent`, `--card`, etc.) ou documenter les renommages.
* **Definition of done.** Une page « kitchen sink » ou Storybook minimal (optionnel) ; aucune régression sur les routes existantes.

### Jalon B — Shell : sidebar, header global, navigation

* Aligner sidebar + zone principale + header contexte sur le **canon pilotage desktop v5** (et mobile pour le breakpoint correspondant).
* Vérifier CDCF §2 : tenant, société, période, année, titre de vue, session.
* **Definition of done.** Même structure fonctionnelle qu’aujourd’hui ; apparence et hiérarchie conformes au Stitch au **seuil défini au §4** de cette roadmap.

### Jalon C — Vue Pilotage (grille 12 tuiles)

* Refondre `CockpitDesktopView` / `CockpitMobileView` (et cartes associées) selon canon Stitch + hiérarchie A/B/C du CDCF §3 + **grammaire §5**.
* Réconcilier la liste des tuiles par un **tableau de correspondance** unique entre brief, Stitch et implémentation.
* **Definition of done.** 12 tuiles navigables, états chargement / vide / partiel / erreur visibles, signaux de confiance présents où le CDCF l’exige.

### Jalon D — Vue détail instrument (Trésorerie en premier)

* **Fonctionnel** : respecter le CDCF **§6** (tuile + §6.9) et **§7** (blocs **7.2.1–7.2.9**, états **§7.3**).

* **Créa** : `d_tail_tr_sorerie_v_r_na_canon_v5`.
* **Découpage écran** : vérifier la page contre le CDCF **§7.2** (chaque bloc) et tenir le registre **S7-xx** à jour.
* Enchaîner ensuite business, flux net, encours, etc., selon la même logique (canon Stitch par famille si disponible ; sinon extrapolation design system + §5).

### Jalon E — Synthèse comptable

* Implémenter ou réaligner `synthese` sur `synth_se_desktop_esther_canon_v5`.
* Respecter CDCF §4 :

  * vue d’ensemble
  * tiers
  * balance âgée
  * masses
  * restitution / export

### Jalon F — Alertes & signaux

* Aligner sur `alertes_signaux_max_canon_v5`.

### Jalon G — Finitions transverses

* Accessibilité (focus, contrastes, `aria` sur filtres et tuiles).
* Performance (pas de régression LCP sur le cockpit).
* Documentation : lien bidirectionnel optionnel **CDCF ↔ roadmap**.
* Changelog produit court.

---

## 4. Critères de conformité Stitch

### 4.1 Niveau sémantique (obligatoire)

* Même **ordre de blocs** que le HTML canon (header → zone principale → CTA / footer chrome si présent).
* Même **hiérarchie typographique** relative (titre page > titres de cartes > valeurs > légendes).
* Mêmes **intitulés** ou synonymes validés produit.
* **Comportements** : filtres, navigation détail, retour cockpit, conservation du contexte.

### 4.2 Niveau visuel (seuil pragmatique)

* **Spacings et grilles** : même logique ; écart acceptable ±8 px après conversion rem si les tokens diffèrent légèrement.
* **Couleurs** : même famille ; tolérance sur nuances si le thème app utilise `color-mix` pour le dark mode.
* **Typo** : même famille que le Stitch ; si la stack produit impose une autre police, documenter l’**équivalence** dans le jalon A.

### 4.3 Ce qu’on ne cherche pas au départ

* **Pixel-perfect** sur chaque ombre / blur par rapport à un export figé, sauf exigence marketing explicite.
* Recopie littérale des **assets inline** du HTML si remplacés par des composants React équivalents.

---

## 5. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Stitch et code actuel divergent sur le nombre ou le nom des tuiles | Tableau de correspondance + mise à jour du CDCF §3.6. |
| Double maintenance Web60 / Web61 | Après jalon C, fusionner ou pointer explicitement une **doctrine unique** pour les états UI. |
| Big bang | Respecter strictement l’ordre A→G ; pas de refonte globale sans jalon livré. |
| Données manquantes pour un bloc Stitch | Marquer « N/A » en UI avec état vide explicite (CDCF §3.15 / §5.7), pas de donnée fictive non signalée. |
| Vue détail Trésorerie encore trop générique | Vérifier couverture **§7.2** dans le registre S7-xx ; compléter le CDCF si un bloc manque. |

---

## 6. Prochaines actions concrètes

1. **Registre** : aligner les lignes **S7-01 … S7-09** du [`TABLEAU_TRACE_CDCF6_TRESORERIE.md`](./TABLEAU_TRACE_CDCF6_TRESORERIE.md) sur l’implémentation réelle et marquer les écarts §7.2.
2. Valider en revue courte la **matrice §2** avec produit / design.
3. Ouvrir le **Jalon A** (tokens) avec une PR dédiée aux variables / thème.
4. Tracer les écarts **Stitch vs écran actuel** pour le cockpit desktop (capture côte à côte + liste de tâches).
5. Remplir le gabarit **`ZeDocs/web61/TABLEAU_TRACE_CDCF6_TRESORERIE.md`** (CDCF §6 ↔ composants UI ↔ source de données), puis maintenir les statuts à chaque jalon.

---

*Document mis à jour pour refléter le CDCF Web61 restructuré et approfondi (§5–§6) ; à faire évoluer au fil des arbitrages produit.*
