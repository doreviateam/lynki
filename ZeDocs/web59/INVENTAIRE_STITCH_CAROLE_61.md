# Inventaire — `ZeDocs/web59/stitch_carole_61`

Retour design (Carole) : maquettes **Stitch** (HTML + Tailwind), spécifications en pseudo-HTML, captures PNG.

**Dernière passe d’inventaire** : structure du dépôt (fichiers présents localement).

---

## 1. Vue d’ensemble

| Zone | Rôle |
|------|------|
| **Racine** `stitch_carole_61/` | Textes de cadrage exportés en `.html` (contenu majoritairement Markdown dans des fichiers HTML) |
| **`stitch/`** | Un **sous-dossier par écran** ou variante ; chaque variante contient `code.html` (maquette) et, sauf exception, `screen.png` |
| **`stitch/lynki_sovereign/`** | Métadonnées thème « Fidelity » (`DESIGN.md`, anglais) — export générique lié à l’outil |

**Convention de nommage des dossiers** (synthèse) :

| Suffixe / motif | Signification |
|-----------------|---------------|
| **`*_canon_v5`** | Ligne de référence alignée sur le handoff V1 (« Canon V5 ») |
| **`it_ration_3`**, **`it_ration_4`** | Itérations de design sur le même type d’écran |
| **`_12_tuiles`** | Variante cockpit pilotage avec grille explicite des 12 tuiles |
| **`synth_se_*`** | Synthèse comptable (Esther) — « se » = synthèse |
| **`d_tail_*`** | Détail d’une tuile — *note : typo `tr_sorerie` au lieu de `trésorerie` dans le nom du dossier* |
| **`alertes_*` / `alerts_*`** | Même intention (alertes Max) — doublon de langue (FR / EN) |

---

## 2. Fichiers à la racine (`stitch_carole_61/`)

| Fichier | Contenu |
|---------|---------|
| `design_system_lynki_sp_cifications_handoff_v1.html` | Spécifications handoff V1 : personas, 12 tuiles, états de donnée, graphes, composants, responsive. |
| `design_system_visuel_lynki_v0.html` | Canon visuel V0 : palette, tuiles maîtresses/secondaires, grammaire de confiance, composants métier. |
| `lynki_canon_produit_v0.html` | Abrégé canon produit (promesse, personas, 2 régimes, hiérarchie 12 tuiles, états). |
| `lynki_design_brief_summary.html` | Résumé du brief mission (personas, pilotage / synthèse, identité attendue). |

---

## 3. Maquettes dans `stitch/` (par dossier)

Chaque ligne = un dossier sous `stitch/`. **Fichiers** : `code.html` = maquette interactive ; `screen.png` = capture (présente pour tous les dossiers listés ci-dessous au moment de l’inventaire).

| Dossier | `code.html` | `screen.png` | Balise `<title>` (extrait du `code.html`) |
|---------|-------------|--------------|---------------------------------------------|
| `pilotage_desktop_v_r_na` | ✓ | ✓ | `Véréna RAF - Pilotage Dashboard` |
| `pilotage_desktop_v_r_na_12_tuiles` | ✓ | ✓ | `Véréna RAF - Cockpit Pilotage` |
| `pilotage_desktop_v_r_na_canon_v5` | ✓ | ✓ | `Lynki Desktop Cockpit - Véréna RAF` |
| `pilotage_desktop_v_r_na_it_ration_3` | ✓ | ✓ | `Lynki Desktop Cockpit - Pilotage Véréna` |
| `pilotage_desktop_v_r_na_it_ration_4` | ✓ | ✓ | `Lynki Cockpit - Pilotage Véréna` |
| `pilotage_mobile_max` | ✓ | ✓ | `Sobriété Financial - Pilotage Dashboard` |
| `pilotage_mobile_max_canon_v5` | ✓ | ✓ | *(pas de `<title>` dans l’en-tête au moment de l’inventaire)* |
| `pilotage_mobile_max_it_ration_3` | ✓ | ✓ | `Max \| CEO Cockpit - Canon Lynki` |
| `pilotage_mobile_max_it_ration_4` | ✓ | ✓ | *(pas de `<title>` dans l’en-tête au moment de l’inventaire)* |
| `d_tail_tr_sorerie_v_r_na` | ✓ | ✓ | `Lynki - Détail Trésorerie` |
| `d_tail_tr_sorerie_v_r_na_canon_v5` | ✓ | ✓ | `RAF Véréna - Détail Trésorerie` |
| `synth_se_comptable_esther_v_r_na` | ✓ | ✓ | *(pas de `<title>` dans l’en-tête au moment de l’inventaire)* |
| `synth_se_comptable_esther_it_ration_3` | ✓ | ✓ | `Lynki Desktop Cockpit - Synthèse Comptable` |
| `synth_se_comptable_esther_it_ration_4` | ✓ | ✓ | `Synthèse Comptable Esther - Lynki Cockpit` |
| `synth_se_desktop_esther_canon_v5` | ✓ | ✓ | `Lynki Desktop Cockpit - Reporting Esther (CDG)` |
| `alertes_signaux_max_canon_v5` | ✓ | ✓ | `Lynki Cockpit - Alerts & Signals` |
| `alertes_signaux_max_it_ration_3` | ✓ | ✓ | *(pas de `<title>` dans l’en-tête au moment de l’inventaire)* |
| `alertes_signaux_max_it_ration_4` | ✓ | ✓ | `Lynki - Alertes & Signaux Max` |
| `alerts_signals_max` | ✓ | ✓ | `Alerts & Financial Signals - Sobriété Financial` |

### Autre

| Chemin | Contenu |
|--------|---------|
| `stitch/lynki_sovereign/DESIGN.md` | Thème « Fidelity » : couleurs hex, Inter, arrondis — texte **anglais**, export générique. |

---

## 4. Regroupement par intention produit

| Intention | Dossiers concernés (priorité canon en **gras**) |
|-----------|--------------------------------------------------|
| **Cockpit pilotage desktop (Véréna)** | `pilotage_desktop_v_r_na`, `pilotage_desktop_v_r_na_12_tuiles`, **`pilotage_desktop_v_r_na_canon_v5`**, `…_it_ration_3`, `…_it_ration_4` |
| **Cockpit pilotage mobile (Max)** | `pilotage_mobile_max`, **`pilotage_mobile_max_canon_v5`**, `…_it_ration_3`, `…_it_ration_4` |
| **Détail Trésorerie (Véréna)** | `d_tail_tr_sorerie_v_r_na`, **`d_tail_tr_sorerie_v_r_na_canon_v5`** |
| **Synthèse comptable (Esther)** | `synth_se_comptable_esther_v_r_na`, `synth_se_comptable_esther_it_ration_3`, `synth_se_comptable_esther_it_ration_4`, **`synth_se_desktop_esther_canon_v5`** |
| **Alertes / signaux (Max)** | `alerts_signals_max`, **`alertes_signaux_max_canon_v5`**, `alertes_signaux_max_it_ration_3`, `alertes_signaux_max_it_ration_4` |

---

## 5. Fichiers système à ignorer

* `.DS_Store` (macOS) — pas de valeur métier.

---

## 6. Utilisation pour l’handoff

1. **Référence d’intégration** : `code.html` dans les dossiers **`*_canon_v5`** lorsqu’ils existent pour l’écran.
2. **Spécifications textuelles** : `design_system_lynki_sp_cifications_handoff_v1.html` + `design_system_visuel_lynki_v0.html` à la racine.
3. **Revues sans navigateur** : `screen.png` par dossier.
4. **Historique** : dossiers `it_ration_*` et variantes sans `canon_v5`, `…_v_r_na` sans suffixe canon.

---

*Document d’inventaire : à compléter si de nouveaux dossiers sont ajoutés sous `stitch/`.*
