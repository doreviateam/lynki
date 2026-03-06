# 🔍 Vérification — Refonte HERO & "Ce que vous gagnez"

**Date** : 2026-01-19  
**Spec** : SPEC — Refonte des sections HERO & « Ce que vous gagnez » v1.0

---

## ✅ État Actuel — Section HERO

### Badge
- **Attendu** : `COFFRE-FORT NUMÉRIQUE`
- **Actuel** : `COFFRE-FORT NUMÉRIQUE` ✅

### H1
- **Attendu** : `De la vente à la banque, chaque décision devient une preuve`
- **Actuel** : `De la vente à la banque, chaque décision devient une preuve` ✅

### Baseline (H2)
- **Attendu** : `Vos événements financiers deviennent des preuves vérifiables et opposables.`
- **Actuel** : `Vos événements financiers deviennent des preuves vérifiables et opposables.` ✅

### Description (optionnelle)
- **Attendu** : `Dorevia-Vault transforme ce que vous faites déjà en preuves exploitables.`
- **Actuel** : `Dorevia-Vault transforme ce que vous faites déjà en preuves exploitables.` ✅

### CTA principal
- **Attendu** : `👉 Voir la démo`
- **Actuel** : `👉 Voir la démo` ✅
- **Second CTA** : Supprimé ✅

### Schéma visuel (colonne droite)
- **Modifié** : Simplifié, orienté résultat
  - Card 1 : "Vos événements" (Factures, paiements, écritures)
  - Card 2 : "Transformation" (Automatique et transparente)
  - Card 3 : "Preuve exploitable" (Vérifiable et opposable)
- **Détails techniques supprimés** : ✅ (hash, horodatage, journal immuable retirés)

---

## ✅ État Actuel — Section "Ce que vous gagnez"

### Titre
- **Attendu** : `Ce que vous gagnez`
- **Actuel** : `Ce que vous gagnez` ✅

### Carte 1 : Conformité
- **Attendu** : `Répondez aux exigences réglementaires sans effort.`
- **Actuel** : `Répondez aux exigences réglementaires sans effort.` ✅

### Carte 2 : Sécurité juridique
- **Attendu** : `Produisez des preuves solides en cas de litige.`
- **Actuel** : `Produisez des preuves solides en cas de litige.` ✅

### Carte 3 : Transparence
- **Attendu** : `Tracez chaque action métier dans un journal immuable.`
- **Actuel** : `Tracez chaque action métier dans un journal immuable.` ✅

### Carte 4 : Auditabilité
- **Attendu** : `Un tiers peut vérifier sans vous faire confiance.`
- **Actuel** : `Un tiers peut vérifier sans vous faire confiance.` ✅

### Simplicité
- **Attendu** : Supprimée
- **Actuel** : Supprimée ✅

---

## ⚠️ Points à Vérifier

### 1. Schéma visuel Hero
- **Question** : Le schéma visuel simplifié est-il conforme à la spec ?
- **Spec dit** : "Le HERO doit exprimer le résultat, pas le fonctionnement."
- **Actuel** : Schéma simplifié orienté résultat (Vos événements → Transformation → Preuve exploitable)
- **Note** : La spec ne mentionne pas explicitement le schéma visuel. Doit-on le garder ou le supprimer ?

### 2. Description optionnelle
- **Question** : La description est-elle bien positionnée et stylée ?
- **Actuel** : Utilise la classe `.hero-description` existante
- **Note** : Le CSS existant utilise `color: rgba(255, 255, 255, 0.86)` (fond sombre). À vérifier selon le design.

### 3. Accessibilité
- **Question** : Les modifications respectent-elles l'accessibilité ?
- **Actuel** : 
  - ARIA labels conservés ✅
  - Structure sémantique respectée ✅
  - Schéma visuel : `aria-label="Schéma orienté résultat"` ✅

---

## 📋 Checklist Spec

- [x] HERO sans jargon technique
- [x] Aucun doublon avec "Comment ça fonctionne"
- [x] Auditabilité présente
- [x] Simplicité supprimée
- [x] Message orienté résultat (Hero)
- [x] CTA unique "👉 Voir la démo"

---

## ❓ Questions Ouvertes

1. **Schéma visuel Hero** : Doit-on le garder simplifié ou le supprimer complètement ?
2. **Description optionnelle** : Le style CSS est-il adapté au fond du Hero ?
3. **Icônes** : Les icônes LineIcons utilisées sont-elles appropriées ?

---

**Fin de la vérification**
