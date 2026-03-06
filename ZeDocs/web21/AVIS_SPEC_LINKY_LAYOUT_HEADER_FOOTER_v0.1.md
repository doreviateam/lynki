# Avis et recommandations — SPEC_LINKY_LAYOUT_HEADER_FOOTER_v0.1

**Document analysé :** SPEC_LINKY_LAYOUT_HEADER_FOOTER_v0.1.md  
**Date d'analyse :** 16 février 2026  
**Auteur :** Analyse technique

---

## 1. Synthèse

La spec pose des **bases pertinentes** (contexte, objectifs, non-objectifs) et une structure header claire pour desktop. Elle est **incomplète** (mobile tronqué, footer absent) et mérite d’être complétée avant implémentation. L’implémentation actuelle (ReportHeader) est déjà proche sur plusieurs points.

**Verdict global :** Spécification partielle mais bien orientée. Recommandation : **compléter la spec**, puis aligner le code.

---

## 2. Points forts

### 2.1 Cadrage

- **Contexte** clair : Linky comme cockpit fondé sur des données scellées.
- **Principes** bien posés : institutionnel, pas de marketing, pas de dépendance ERP.
- **Non-objectifs** explicites : pas de monitoring détaillé, logs, alertes temps réel, IA.

### 2.2 Structure Header Desktop

- **Séparation en 2 lignes** lisible :
  - Ligne 1 : identité (logo, tenant, menu)
  - Ligne 2 : contexte opérationnel (société, module, période, intégrité)
- **Badge intégrité** (✔ Données scellées / ⚠ Données partielles) : cohérent avec la promesse Linky.
- **Positionnement** Gauche / Centre / Droite : clair pour le design.

### 2.3 Alignement avec l’existant

L’implémentation actuelle couvre déjà :

- Logo Dorevia + Linky
- Badge tenant
- Menu utilisateur / burger
- Société sélectionnée
- Sélecteur période (mois, année)
- Indicateurs (VaultageIndicator, BankReconciliationIndicator)

---

## 3. Lacunes et points à clarifier

### 3.1 Spec tronquée

- **Section 3.2 Structure Mobile** : se termine à « Ligne 1 » sans contenu.
- **Footer** : absent alors qu’il est dans le titre du document.
- **Version** : titre v0.1 vs « Version: v1.0 » en en-tête — à harmoniser.

### 3.2 Éléments manquants ou flous

| Élément | Statut spec | Recommandation |
|---------|-------------|----------------|
| **Logo Dorevia** | Texte uniquement | Préciser : logo image ou typo (comme aujourd’hui) |
| **Module actif** | Mentionné (ex. Points de vente) | Définir affichage : breadcrumb, label, onglet actif |
| **Badge intégrité** | ✔ / ⚠ | Lier aux APIs existantes (VaultageIndicator, BankReconciliationIndicator) |
| **« Données partielles »** | Non défini | Définir critères (ex. % non scellé, rapprochement incomplet) |
| **Sources connectées** | Objectif sans détail | Préciser : liste de sources (Vault, Odoo, etc.) et emplacement |
| **État infrastructure** | Objectif sans détail | Préciser : health check, métriques minimales, ou lien vers statut |

### 3.3 Footer

Le titre annonce un footer, mais aucun contenu n’est décrit. À préciser :

- Contenu : identité, lien vers Dorevia, version, mentions légales ?
- Comportement mobile : fixe en bas, ou scrollable ?
- Intégration avec BottomNav actuel (Board / Performance) si conservé.

---

## 4. Recommandations

### 4.1 Avant implémentation

1. **Finaliser la spec**
   - Rédiger la section Mobile (ligne(s) du header, priorités, menu).
   - Ajouter une section FOOTER avec structure et contenu.
   - Harmoniser la version (v0.1 vs v1.0).

2. **Détailler les badges intégrité**
   - Cas « ✔ Données scellées » : critères (ex. 100 % scellé).
   - Cas « ⚠ Données partielles » : seuils et messages.
   - Rôle des indicateurs existants (VaultageIndicator, BankReconciliationIndicator).

3. **Définir « Module actif »**
   - Mapping viewMode → libellé (ex. `pos_shops` → « Points de vente »).
   - Emplacement : ligne 2 gauche, comme prévu par la spec.

### 4.2 Sur le design actuel

1. **Ligne 1 / Ligne 2**
   - Sur desktop, séparer clairement :
     - Ligne 1 : Logo, Linky, tagline (optionnel), badge tenant, badge intégrité, menu.
     - Ligne 2 : Société, module actif, sélecteurs période (mois, année).
   - Aujourd’hui tout est dans une seule zone ; une séparation visuelle renforcerait la lisibilité.

2. **Tagline « BUILT ON SEALED FINANCIAL TRUTH »**
   - La spec ne l’évoque pas.
   - Recommandation : le garder si jugé pertinent pour l’identité, ou le supprimer pour rester plus sobre.

3. **Badge intégrité unifié**
   - Remplacer ou regrouper VaultageIndicator et BankReconciliationIndicator par un badge unique « ✔ Données scellées » ou « ⚠ Données partielles ».
   - Définir les règles de passage d’un état à l’autre.

### 4.3 Mobile

- Prévoir une structure simplifiée :
  - Ligne 1 : Logo, Linky, badge tenant, menu burger.
  - Ligne 2 (ou drawer) : Société, période, module.
- Éviter la surcharge : badges secondaires (intégrité) pourraient être accessibles via le menu ou un tooltip.

---

## 5. Comparatif rapide : spec vs implémentation actuelle

| Élément | Spec | Actuel |
|--------|------|--------|
| Logo + Linky | ✓ | ✓ |
| Badge tenant | ✓ | ✓ |
| Menu burger | ✓ | ✓ |
| Société | Ligne 2 gauche | ✓ (desktop : droite ligne 1 ; mobile : ligne 2) |
| Module actif | Ligne 2 gauche | Implicite (onglet du menu) |
| Sélecteur mois/année | Ligne 2 centre | ✓ (desktop : droite ; mobile : ligne 2) |
| Badge intégrité | Ligne 2 droite | VaultageIndicator + BankReconciliationIndicator |
| Footer | — | Absent |
| Structure 2 lignes | Oui | Partielle (tout serré en 1 zone sur desktop) |

---

## 6. Plan d’action suggéré

1. Compléter la spec (mobile + footer) et corriger la cohérence de version.
2. Clarifier les critères du badge intégrité et le rôle des indicateurs existants.
3. Appliquer la structure 2 lignes sur desktop.
4. Implémenter le footer selon la spec complétée.
5. Ajuster le layout mobile selon les spécifications finales.

---

**Fin du rapport**
