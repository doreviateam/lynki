# 🚀 Rapport : Prompts de Génération pour les Visuels V2

Ce rapport fournit les spécifications et les prompts détaillés pour la création des visuels de Dorevia-Vault, classés par priorité stratégique.

---

## 🛑 P0 : PRIORITÉ ABSOLUE (Compréhension Immédiate)
*Ces visuels doivent lever le verrou de l'abstraction technique dès les premières secondes.*

### 1. `flux-valeur-probante.svg` (Le Flux de Vérité)
- **Intention :** Matérialiser la transformation de la donnée ERP en preuve immuable.
- **Prompt (Midjourney/DALL-E style) :**
    > "Minimalist infographic, horizontal flow, flat design style. Left: icon representing Odoo ERP data lines. Middle: a glowing high-tech vault symbol with a cryptographic lock. Right: a certified legal document icon with a gold seal. Connect with smooth dynamic lines. Professional B2B color palette: Deep navy (#0b1220), Emerald green (#10b981), and White. Clean vector lines, white background."
- **Contrainte :** Doit être lisible en petite taille sur mobile.

### 2. `metaphore-compteur-vault.svg` (Le Totem "Linky")
- **Intention :** Incarner le Vault comme un objet de mesure et de scellage fiable.
- **Prompt :**
    > "Isometric illustration of a sleek, futuristic industrial meter device. It looks robust like a professional server unit. Features a small digital display showing 'ENCRYPTION ACTIVE', a green status LED, and a physical security seal. Style: Soft flat design, semi-transparent overlays, professional technology look. Colors: Slate blue, glass textures, emerald green accents."
- **Usage :** Section Hero et section "Comment ça marche".

### 3. `objet-preuve-scellee.svg` (Tangibilisation)
- **Intention :** Montrer ce qu'est une "preuve" de manière granulaire.
- **Prompt :**
    > "Macro view of a single row of digital data representing a financial invoice. The row is encapsulated in a glowing blue shield. Next to it, a precise timestamp '2026-01-24 14:32:12.450' and a green checkmark badge labeled 'SEALED'. Background is clean white. High-tech legal and financial aesthetics."

---

## 📈 P1 : CONVERSION & RÉASSURANCE
*Ces visuels servent à valider la décision et à rassurer sur la conformité.*

### 4. `metaphore-ecran-ui.svg` (Dorevia UI)
- **Intention :** Montrer la simplicité de l'interface en lecture seule.
- **Prompt :**
    > "Modern web dashboard interface on a floating tablet screen. Clean layout, financial charts showing cash flow, a list of events with green 'Verified' badges. A prominent label on the top corner says 'READ-ONLY ACCESS'. Minimalist, airy design, soft shadows. Colors: Navy and white."

### 5. `badge-conformite-lne.svg` (Sceau Légal)
- **Intention :** Crédibilité réglementaire.
- **Prompt :**
    > "Hexagonal badge design, professional certification style. Center text 'LNE 2026 / NF525'. Outer ring says 'COMPLIANCE READY'. Metallic silver and emerald green colors. Clean vector logo."

### 6. `ecosysteme-souverain.svg` (Souveraineté)
- **Intention :** Confiance sur l'hébergement et l'IA (DIVA).
- **Prompt :**
    > "Stylized map of France made of small dots. A shield icon in the center with a French flag ribbon. Floating icons of secure servers and a subtle brain/AI node representing DIVA. Professional, secure, sovereign atmosphere."

---

## ✨ P2 : PROJECTION ÉMOTIONNELLE
*Pour aider le client à se projeter dans un futur sans stress.*

### 7. `scene-cfo-rassure.svg` (Le bénéfice humain)
- **Intention :** Incarner la sérénité du CFO.
- **Prompt :**
    > "Stylized illustration of a confident CFO or Financial Director looking at a clean dashboard. They look relaxed and in control. Behind them, a safe vault is visible. Modern flat illustration style, corporate but warm. Focus on clarity and peace of mind."

### 8. `scene-controle-fiscal.svg` (Le moment de vérité)
- **Intention :** Montrer la facilité de réponse lors d'un audit.
- **Prompt :**
    > "Split screen illustration. Left: A tax auditor asking for proof. Right: The company owner instantly handing over a digital 'Proof Dossier' with one click. Simple, powerful, efficient. High contrast, clean vector style."

---

## 🎨 Spécifications de Production pour l'Intégrateur

1. **Format de sortie :** SVG (vectoriel) pour tous les schémas et icônes.
2. **Naming :** Utiliser exactement les noms de fichiers spécifiés ci-dessus.
3. **Optimisation :** Passer tous les SVGs dans `svgo` pour supprimer les balises inutiles.
4. **Cohérence :** Tous les visuels doivent utiliser les tokens de design (Couleurs : #0b1220, #e9eefc, #10b981).

---
*Fin du rapport. Ce document est prêt pour être transmis au studio graphique ou utilisé avec DIVA/Génération IA.*
