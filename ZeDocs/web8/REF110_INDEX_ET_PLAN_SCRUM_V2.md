# 🗂️ Index des Documents de Référence — Dorevia-Vault V2

Ce document répertorie tous les actifs stratégiques, UX et conceptuels créés pour la refonte de la Landing Page et la définition du socle produit.

| Réf | Document | Description |
| :--- | :--- | :--- |
| **REF00** | [auditux.md](auditux.md) | Diagnostic UX "à froid" et identification des verrous de compréhension. |
| **REF01** | [NOTE_STRATEGIE_V2.md](NOTE_STRATEGIE_V2.md) | Note d'intention stratégique (Pivot "Linky", Inversion de la pyramide). |
| **REF04** | [REF4_Copywriting_LandingV2.md](REF4_Copywriting_LandingV2.md) | Contenu textuel intégral (Hero, Sections 1-3, Footer, Disclaimer). |
| **REF11** | [REF11_wireframe HTML_CSS.md](REF11_wireframe HTML_CSS.md) | Maquette interactive (HTML/CSS) respectant le Design System. |
| **REF12** | [REF12_Benchmark_UX.md](REF12_Benchmark_UX.md) | Analyse des standards B2B (Pennylane, Stripe, Veeva, Datadog). |
| **REF13** | [REF13_DesignSystem.md](REF13_DesignSystem.md) | Charte graphique et règles UX non négociables (Tokens, Composants). |
| **REF100** | [REF100_SPEC_SOCLE_DOREVIA_VAULT.md](REF100_SPEC_SOCLE_DOREVIA_VAULT.md) | Constitution du produit (IUUP, Principes fondateurs, Conformité). |
| **ASSETS** | [CATALOGUE_VISUELS_SVG.md](CATALOGUE_VISUELS_SVG.md) | Liste des SVGs à produire et [RAPPORT_PROMPTS_VISUELS.md](RAPPORT_PROMPTS_VISUELS.md). |

---

# 🚀 Plan d'Implémentation SCRUM — Landing V2

**Objectif :** Déployer la Landing Page V2 en 3 Sprints courts (1 semaine par Sprint).

## 🏃 SPRINT 1 : Fondations & Structure (Semaine 1)
*Focus : Mise en place technique et intégration du socle textuel.*

*   **User Story 1 :** En tant que visiteur, je veux une structure de page claire pour comprendre l'offre en < 5s.
    *   *Tâche :* Intégration du Layout HTML/CSS basé sur `REF11`.
    *   *Tâche :* Mise en place des Design Tokens (Couleurs, Typo) de `REF13`.
*   **User Story 2 :** En tant que CFO, je veux lire un discours expert qui me rassure sur mes douleurs métier.
    *   *Tâche :* Intégration du Copywriting intégral de `REF4`.
    *   *Tâche :* Configuration des ancres de navigation (`#top`, `#conformite`, etc.).

## 🎨 SPRINT 2 : Visuels & Réassurance (Semaine 2)
*Focus : Tangibilisation du produit par l'image et la conformité.*

*   **User Story 3 :** En tant qu'utilisateur, je veux "voir" le produit pour réduire ma charge mentale.
    *   *Tâche :* Production/Intégration des SVGs P0 (`flux`, `compteur-vault`).
    *   *Tâche :* Intégration des badges de conformité LNE 2026 / NF525.
*   **User Story 4 :** En tant que décideur, je veux comprendre la souveraineté du dispositif.
    *   *Tâche :* Intégration du visuel `ecosysteme-souverain.svg` et des mentions légales du Footer.

## 📈 SPRINT 3 : Conversion & Finitions (Semaine 3)
*Focus : Tunnel de diagnostic et optimisation.*

*   **User Story 5 :** En tant que prospect, je veux demander un diagnostic sans friction.
    *   *Tâche :* Finalisation du formulaire de contact/diagnostic (Backend integration).
    *   *Tâche :* Mise en place des micro-interactions et smooth scroll.
*   **User Story 6 :** En tant qu'éditeur, je veux m'assurer que le site est performant et accessible.
    *   *Tâche :* Audit Lighthouse (Performance/SEO) et corrections A11y.
    *   *Tâche :* Recette finale avec la `SPEC_SOCLE` (REF100).

---
**Statut du Plan :** Prêt pour lancement Backlog.
