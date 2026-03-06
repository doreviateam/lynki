# Rapport d'analyse — SPEC_LOGO_DOREVIA_LINKY_v2.0

**Document analysé :** SPEC_LOGO_DOREVIA_LINKY_v2.0.md  
**Date du rapport :** 15 février 2026  
**Objectif :** Analyse de conformité et recommandations d’implémentation

---

## 1. Synthèse exécutive

La spécification v2.0 définit une identité visuelle stricte pour le logo Dorevia Linky, orientée « infrastructure financière » et « cockpit décisionnel », à l’opposé d’un positionnement « startup gadget ». L’implémentation actuelle (Linky v1.54) n’est **pas conforme** à la spec : dégradé, glow et scale au survol sont explicitement interdits. Le rapport détaille les écarts et propose un plan de mise en conformité.

---

## 2. Analyse de la spécification

### 2.1 Points forts

| Aspect | Commentaire |
|--------|-------------|
| **Positionnement** | Alignement clair sur l’autorité, la rigueur comptable et la vérité financière scellée |
| **Hiérarchie** | DOREVIA (marque) + Linky (produit) distincts avec règles typographiques précises |
| **Tagline** | « BUILT ON SEALED FINANCIAL TRUTH » cohérente avec Vault, NF525, LNE 2026 |
| **Palette** | Slate/Gray maîtrisée ; accent limité (≤10 % du bloc visuel) |
| **Contraintes** | Interdictions explicites (gradient, glow, scale, icônes) pour limiter les dérives |
| **Écosystème** | Cohérence avec Dorevia Vault, DLP, DIVA |
| **Responsive** | Tailles minimales desktop/mobile, tagline optionnelle sur mobile |

### 2.2 Règles principales à respecter

| Section | Règle |
|---------|-------|
| §2.2 DOREVIA | Uppercase, Slate-400 (#94A3B8), 85–95 % de la taille de Linky, Medium (500), tracking +0.15em à +0.25em |
| §2.3 Linky | Casse normale, blanc #FFFFFF, Semibold/Bold, pas de gradient, pas d’italique |
| §3 Tagline | « BUILT ON SEALED FINANCIAL TRUTH », 45–60 % de Linky, accent Emerald ou Cyan |
| §4.1 Fond | Slate-900 (#0F172A) ou Gray-900 (#111827) ; pas de dégradé |
| §6 Tailles | Linky 18–22 px desktop, 16 px min mobile ; tagline 9–11 px |
| §8 Interdits | Gradient, glow exagéré, scale, icône, pictogramme, ombre lourde, 3D |
| §9 Hover | Légère variation luminosité +5 %, transition 150 ms ; pas de bounce ni scale excessif |

---

## 3. Conformité — Implémentation actuelle (Linky v1.54)

### 3.1 Écarts identifiés

| Spec | Implémentation actuelle | Conformité |
|------|-------------------------|------------|
| §2 DOREVIA + Linky distincts | Un seul bloc « Dorevia Linky » | ❌ |
| §2.2 DOREVIA Slate-400 | Même style que Linky | ❌ |
| §2.3 Linky blanc pur | Linky en dégradé bleu | ❌ |
| §3 Tagline | Absence de tagline | ❌ |
| §8 Gradient interdit | Dégradé accent → blue-400 | ❌ |
| §8 Glow interdit | drop-shadow bleu | ❌ |
| §9 Hover (luminosité +5 %) | scale(1.02) + glow accru | ❌ |
| §5 Zones de protection | Non vérifiées | ⚠️ |

### 3.2 Conformité globale

**Niveau de conformité : environ 15 %**

Les seuls éléments compatibles : lien vers l’accueil et position du logo dans le header.

---

## 4. Recommandations

### 4.1 Priorité P0 — Conformité minimale

1. **Supprimer le gradient** — Remplacer par Slate-400 pour DOREVIA et blanc pour Linky.
2. **Supprimer le glow** — Retirer toute `drop-shadow` ou effet lumineux.
3. **Adapter le hover** — Remplacer scale par une variation de luminosité (~+5 %, `filter: brightness(1.05)` ou équivalent), transition 150 ms ease-in-out.
4. **Structurer le logo** — Deux blocs distincts : `DOREVIA` (uppercase, Slate-400) puis `Linky` (blanc), espacement 4–8 px.

### 4.2 Priorité P1 — Complétude

5. **Ajouter la tagline** — « BUILT ON SEALED FINANCIAL TRUTH » sous le logo, 45–60 % de la taille de Linky, masquée sur mobile si espace limité.
6. **Ajuster les tailles** — Linky 18–22 px en desktop, 16 px minimum en mobile.
7. **Fond navbar** — Vérifier que `--card` ou le fond du header correspond à #0F172A ou #111827 en mode sombre.

### 4.3 Priorité P2 — Robustesse

8. **Mode clair** — Prévoir une variante monochrome (§7.3) si le thème clair reste utilisé (noir sur blanc).
9. **Zones de protection** — Assurer un clear space au moins égal à la hauteur du « L » autour du logo.
10. **Clarifier le spec** — Préciser si un léger contraste (ombre très subtile) est toléré pour la lisibilité sur fond sombre.

---

## 5. Plan d’action proposé

| Étape | Action | Fichiers concernés |
|-------|--------|--------------------|
| 1 | Restructurer le logo (DOREVIA + Linky) | `components/ReportHeader.tsx` |
| 2 | Appliquer la palette (Slate-400, blanc) | `components/ReportHeader.tsx`, évent. `globals.css` |
| 3 | Supprimer gradient et glow | `components/ReportHeader.tsx` |
| 4 | Corriger le hover (luminosité, pas de scale) | `components/ReportHeader.tsx` |
| 5 | Ajouter la tagline (desktop) | `components/ReportHeader.tsx` |
| 6 | Mettre à jour la documentation | `ZeDocs/web19/SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md` |

---

## 6. Références

| Document | Chemin |
|----------|--------|
| Spec logo v2.0 | `ZeDocs/web20/SPEC_LOGO_DOREVIA_LINKY_v2.0.md` |
| Spec logo v2.1 | `ZeDocs/web20/SPEC_LOGO_DOREVIA_LINKY_v2.1.md` |
| **BRAND_LOCK v1.0** | `ZeDocs/web20/BRAND_LOCK_DOREVIA_LINKY_LOGO_v1.0.md` — version figée |
| Spec graphiques (logo actuel) | `ZeDocs/web19/SPEC_LINKY_CARD_BUSINESS_GRAPHIQUE.md` §8.4 |
| Implémentation | `units/dorevia-linky/components/ReportHeader.tsx` |
| Variables CSS | `units/dorevia-linky/app/globals.css` |

---

## 7. Conclusion

La SPEC_LOGO_DOREVIA_LINKY_v2.0 est claire, cohérente et adaptée au positionnement « infrastructure financière ». La mise en conformité nécessite une refonte du logo dans ReportHeader (structure, couleurs, effets) et l’ajout de la tagline. La SPEC_LOGO_DOREVIA_LINKY_v2.1 a été implémentée (v1.55–1.56) avec tagline 1 ligne (masquée &lt;768px).

---

**Fin du rapport**
