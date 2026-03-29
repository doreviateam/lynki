# Écart maquette « Observatory » ↔ CDCF web61 (Lynki)

**Référence** : fichier statique `ZeDocs/web61/references/observatory-mock.html` (typo Manrope + Inter, dark slate, structure illustrative).

**Portée** : ce document trace les **écarts intentionnels** après arbitrage « mix » : Lynki conserve l’architecture CDCF (header deux niveaux, rail §2.13, vocabulaire Tenant, thème dans Outils). Seuls **typographie des titres** et **proximité d’ambiance** dark peuvent s’inspirer de la maquette HTML.

| Zone | Maquette Observatory | CDCF (réf.) | Statut Lynki |
|------|----------------------|-------------|----------------|
| **Typo titres** | Manrope | §2 / §3 : hiérarchie lisible, pas de police imposée | **Aligné (mix)** : `font-headline` (Manrope) sur titres page / marque rail |
| **Typo corps / UI** | Inter | Stitch / Fidelity historique Inter | **Aligné** : `sans` = Inter |
| **Header** | Titre + sous-texte simple, pas de bandeau contexte | §2.12.1 deux niveaux ; §2.8 sélecteurs | **Écart volontaire** : Lynki = orientation + contexte (tenant, société, période, année) |
| **Navigation** | Rail générique « Menu / Outils » | §2.13 Dashboard (Pilotage, Synthèse), Outils (Lexique, Aide, Thème), Session | **Écart volontaire** : périmètre CDCF strict |
| **Grille cockpit** | 2 cartes fictives | §3.4, §3.6 douze tuiles, §3.13 hiérarchie A/B/C | **Écart** : maquette non représentative |
| **Confiance / preuves** | Absent | §3.16, tuiles §5.8 | **Écart** : hors maquette |
| **Thème clair / sombre** | `class="dark"` fixe | §2.12.1 Thème dans Outils | **Écart volontaire** : Lynki bascule utilisateur |
| **Couleurs** | Slate Tailwind-ish (`#0f172a`, `#1e293b`) | Tokens `--bg`, `--surface` cockpit (SPEC visuelle Lynki) | **Proche ambiance** ; pas de recopie pixel-perfect des hex maquette |

## Implémentation code (mix)

- Polices : `units/dorevia-linky/app/layout.tsx` (`Inter` + `Manrope`, variables CSS).
- Tailwind : `font-headline` dans `tailwind.config.js`.
- Titres cockpit : `COCKPIT_T1_PAGE_TITLE` dans `app/lib/cockpit/cockpit-typography.ts` ; `CockpitAppBarRow` h1 ; marque « Lynki » dans `Sidebar.tsx`.

## Non repris de la maquette (rappel)

- Chat / assistant, recherche globale type produit IA, sous-navigation métier non spécifiée CDCF.
- Toute évolution fonctionnelle doit repasser par mise à jour du `cdcf.md` et des maquettes canon Stitch si besoin.
