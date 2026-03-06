# Rapport d’analyse — SPEC_POS_STRUCTURE_LINKY_v1.0

**Date :** 15 février 2026  
**Document analysé :** SPEC_POS_STRUCTURE_LINKY_v1.0.md  
**Auteur de l’analyse :** Assistant IA

---

## 1. Synthèse

La spec est **claire, cohérente et alignée** avec la posture cockpit financier de Linky. Les principes directeurs sont pertinents. Plusieurs recommandations mineures peuvent toutefois la compléter.

**Avis général :** ✅ **Approuvé avec recommandations**

---

## 2. Points forts

### 2.1 Hiérarchie unique

La suppression du bloc « Sessions point de vente » en tant que niveau distinct est **pertinente**. Les sessions sont bien un attribut du point de vente, pas un second module. Cela évite la redondance et la double lecture.

### 2.2 Pattern Synthèse → Détail → Évolution

Le pattern « Synthèse → Détail par entité → Évolution → Analyse » est **aligné** avec les cartes comptables existantes (Cash, Business, etc.) et facilite une lecture homogène.

### 2.3 Lecture en 5 secondes

L’objectif de lecture rapide (nombre de shops, sessions, sécurisées, montant par shop) sans ouverture de sous-sections est **pertinent** pour un cockpit. Les KPI doivent rester visibles sans clic.

### 2.4 Vision produit

La distinction « instrument de contrôle » vs « interface de caisse » est **bien posée** et guide correctement les choix UX.

### 2.5 Interdictions explicites

Les interdictions (double titre, emoji sablier, bloc densifié type ERP) sont **utiles** pour éviter la dérive vers une interface trop opérationnelle ou ludique.

---

## 3. Recommandations

### 3.1 Ordre des cartes (§ 8)

**Observation :** La spec indique :

```
1. Trésorerie validée
2. Cash
3. Business
4. Points de vente
5. Taxes
6. Notes de crédit
7. Remboursements
```

**Implémentation actuelle :** Trésorerie → Cash → **Remboursements** → Business → Taxes → Notes de crédit → Points de vente → Sessions → Z de caisse

**Recommandation :** Préciser si l’ordre de la spec est **normatif** ou **indicatif**. Si normatif, mettre à jour `DashboardWithFilters` pour respecter cette séquence. Éventuellement documenter la règle de classement (ex. flux d’abord, puis ventes/achats, puis corrections, puis POS).

### 3.2 Séparateur "•" vs "—"

**Observation :** La spec impose le séparateur « • » pour la sous-ligne synthèse. Actuellement, les cartes utilisent plutôt des espaces ou tirets.

**Recommandation :** Valider et appliquer le « • » de manière homogène dans toutes les synthèses Linky (pas seulement POS) pour une cohérence globale.

### 3.3 Emoji ✓ dans « ✓ X sécurisées »

**Observation :** La spec conserve le ✓ pour « sécurisées » mais interdit ⏳ pour « en attente ».

**Recommandation :** Vérifier la cohérence avec SPEC_TYPOGRAPHY_LINKY ou BRAND_LOCK : soit aucun emoji, soit un jeu très limité (ex. ✓ uniquement). Documenter pour éviter les incohérences futures.

### 3.4 Total chiffré

**Observation :** La spec ne mentionne pas le **total général** (somme de tous les points de vente) dans la synthèse.

**Implémentation actuelle :** Un total « Total : X XXX,XX € » est affiché à droite de la ligne synthèse.

**Recommandation :** Ajouter explicitement le total dans la spec, par exemple :

```
X points de vente • Y sessions • Z sécurisées • N en attente          Total : M MM,MM €
```

### 3.5 Z de caisse

**Observation :** La spec ne traite pas du bloc « Z de caisse » (placeholder « Bientôt disponible »).

**Recommandation :** Préciser si « Z de caisse » reste un bloc distinct sous « Points de vente », ou s’il est hors périmètre de cette spec.

### 3.6 Navigation (onglets / viewMode)

**Observation :** Le header Linky propose actuellement des vues : Tout, Cash, Business, Corrections, Points de vente, Sessions, Z de caisse. La spec supprimant « Sessions » comme bloc visible, la navigation doit évoluer.

**Recommandation :** Mettre à jour la spec ou un document de navigation pour :
- soit retirer l’onglet « Sessions point de vente » ;
- soit le remplacer par « Détail » (drill-down dans la carte Point de vente).

### 3.7 Ordre Évolution / Détail

**Observation :** La spec impose l’ordre « > Évolution » puis « > Détail ».

**Implémentation actuelle :** L’ordre est respecté dans PosShopsView (Évolution puis Détail implicite via expansion). Dans PosSessionsView, avant fusion, l’ordre était Évolution puis Détail.

**Recommandation :** ✅ OK si la fusion conserve cet ordre.

---

## 4. Écarts implémentation ↔ spec

| Élément | Spec | Implémentation actuelle |
|--------|------|--------------------------|
| Bloc « Sessions point de vente » | ❌ Supprimé | ✅ Présent (PosSessionsView) |
| Structure unique POS | 1 bloc « Points de vente » | 2 blocs (Points + Sessions) |
| Séparateur synthèse | • | Espaces / pas de • |
| Total chiffré | Non précisé | ✅ Présent |
| Emoji ⏳ | ❌ Interdit | ✅ Utilisé |
| Ordre des cartes | Spec § 8 | Différent |

**Action prioritaire :** Fusionner PosShopsView et PosSessionsView en un seul bloc « Points de vente », avec « Détail » intégré dans chaque carte (liste des sessions par shop). Supprimer PosSessionsView en tant que section racine.

---

## 5. Conclusion

La spec est **solide et cohérente**. Les principales actions à prévoir :

1. **Fusionner** Points de vente et Sessions en un bloc unique.
2. **Retirer** l’onglet « Sessions » du header ou le redéfinir.
3. **Documenter** le total chiffré et le séparateur « • ».
4. **Supprimer** l’emoji ⏳ pour « en attente ».
5. **Clarifier** l’ordre des cartes et l’emplacement de « Z de caisse ».

Le document peut servir de base normative pour l’implémentation à condition d’intégrer ces compléments.
