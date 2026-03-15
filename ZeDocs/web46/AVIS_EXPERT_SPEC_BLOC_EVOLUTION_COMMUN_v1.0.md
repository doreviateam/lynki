# Avis d’expert — SPEC Bloc Évolution commun des cards Linky

**Document :** AVIS_EXPERT_SPEC_BLOC_EVOLUTION_COMMUN_v1.0  
**Date :** 14 mars 2026  
**Référence :** SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0.md  
**Produit :** Dorevia Linky  
**Objet :** Analyse pour implémentation, revue card par card

---

## 1. Synthèse de l’avis

La SPEC est **solide, alignée avec la charte commune et directement implémentable**. La règle « bloc Évolution obligatoire sur toute card instrument » est cohérente avec l’objectif cockpit (profondeur temporelle, lecture verticale uniforme). L’existant (composant `CardChartSection`, libellé « Évolution », Afficher/Réduire, états replié/déplié) est déjà très proche du modèle cible ; l’effort principal portera sur **les cards sans bloc Évolution aujourd’hui** et sur la **normalisation du composant** (état vide, erreur, chargement, libellé unique).

**Recommandation :** acter la décision produit (§16 de la SPEC), mettre à jour la charte et le plan d’implémentation comme prévu, puis traiter les écarts card par card en priorisant Trésorerie, Encours, EBE et BFR.

---

## 2. Adéquation SPEC / charte et plan

| Aspect | Avis |
|--------|------|
| **Structure canonique** | La séquence Header → Synthèse → Bloc Évolution → Footer est claire et renforce la charte sans la contredire. |
| **Règles UI non négociables** | La SPEC propose d’ajouter le bloc Évolution comme 6ᵉ règle ; c’est cohérent avec le tableau actuel (header, footer, contour, badges, métadonnées). |
| **Variantes A/B/C/D** | Le positionnement « replié par défaut / déplié selon valeur analytique » pour variante A vs B est opérationnel. |
| **DoD et grille de conformité** | Les critères proposés (présence du bloc, état documenté, pas de suppression pour absence de données) sont mesurables et utiles pour la recette. |

Aucun conflit identifié avec la charte commune ni avec le plan d’implémentation actuel ; les mises à jour prévues en §12 et §13 de la SPEC sont pertinentes.

---

## 3. État de l’existant technique

### 3.1 Composant actuel : `CardChartSection`

Le composant existant couvre déjà une grande partie de la SPEC :

- **Ligne d’entrée** : libellé configurable (`sectionTitle`, défaut `"Évolution"`), chevron, bouton « Afficher » / « Réduire ». Conforme à la SPEC (§5.1, §5.2).
- **Repliable** : état expand/collapse via contexte global ou `sessionStorage`. Aligné avec « replié / déplié » (§5.3).
- **Contrôles** : granularité (Semaine / Mois / Trimestre), type (barre / courbe / camembert), Montants / %. Conforme à §8.1.
- **Texte de lecture** : ligne d’interprétation générée (ex. « Lecture : tendance hebdomadaire ») ou override. Aligné avec §9.

**Manques par rapport à la SPEC :**

1. **États normalisés** : le composant suppose toujours du contenu (graphique). Il n’encapsule pas les états **vide** (§6.3), **à venir** (§6.4), **erreur** (§6.5), **chargement** (§6.6). Ces états sont aujourd’hui gérés (ou non) dans chaque card.
2. **Nom du composant** : la SPEC recommande un nom du type `InstrumentCardEvolutionBlock` ; `CardChartSection` est orienté « chart ». Un alias ou un wrapper nommé `InstrumentCardEvolutionBlock` qui délègue à `CardChartSection` (ou un renommage) clarifierait l’intention.
3. **Libellé strict** : la SPEC impose le libellé **`Évolution`** ; certaines cards utilisent déjà « Évolution », une utilise « Répartition » (Paiements). Il faudra soit un libellé unique « Évolution » avec sous-titre optionnel (« Répartition » pour Paiements), soit documenter « Répartition » comme alias pour cette card.

Conclusion : **réutiliser et étendre** `CardChartSection` (ou son équivalent renommé) en y intégrant les états vide / erreur / chargement / à venir, plutôt que de repartir de zéro.

---

## 4. Revue card par card

### 4.1 Trésorerie (TresoreriePositionCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.1) | **Absent** | Non conforme. |
| Attendus : évolution trésorerie validée, ou Vault/ERP, ou couverture probante | — | À implémenter. |

**Constat :** La card Trésorerie n’a pas de bloc Évolution. La SPEC indique explicitement que cette absence est non conforme.

**Recommandation :** Priorité haute. Introduire un bloc Évolution (même replié par défaut) avec au choix : (1) évolution du solde validé Vault sur la période, (2) comparaison Vault / ERP si disponible, (3) à défaut évolution du taux de couverture probante. En attendant les séries temporelles, afficher l’**état C (vide standardisé)** avec le message prévu par la SPEC, sans supprimer le bloc.

---

### 4.2 Flux net (FluxCashCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.2) | **Présent** : `CardChartSection` titre « Évolution » | Conforme. |
| Attendus : encaissements, décaissements, flux net, granularité | DualSeriesChart, granularité, type barre/courbe/camembert | Conforme. |

**Constat :** Card en conformité avec la SPEC. Vérifier que le texte de lecture (interprétation) et les contrôles restent secondaires par rapport à la lecture de tendance.

**Recommandation :** Aucun changement structurel. Optionnel : documenter l’état du bloc (A – disponible) dans la grille de conformité.

---

### 4.3 Taxes (TaxesCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.3) | **Présent** : `CardChartSection` « Évolution » | Conforme. |
| Attendus : collectées vs déductibles, montant/%, tendance | TaxesChart (DualSeriesChart), granularité | Conforme. |

**Constat :** Conforme. Le bloc existe, repliable, avec contrôles et série.

**Recommandation :** Conserver tel quel. S’assurer que l’état « partiel » (données proxy ou incomplètes) est géré avec un badge ou une note si un jour applicable (§6.2).

---

### 4.4 Encours (EncoursCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.4) | **Absent** | Non conforme. |
| Attendus : créances ouvertes, échus, taux échéance dépassée, top créanciers | — | À implémenter. |

**Constat :** Aucun bloc Évolution. Données AR (ar-by-partner) et agrégations Vault peuvent fournir des séries temporelles (évolution encours, échus).

**Recommandation :** Priorité haute. Ajouter un bloc Évolution (replié par défaut pour variante B dense). Contenu cible : évolution des créances ouvertes et des échus sur la période ; si pas de série temporelle encore disponible, afficher **état C (vide standardisé)** avec le message de la SPEC jusqu’à ce que l’API expose l’historique.

---

### 4.5 Business (BusinessCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.5) | **Présent** : `CardChartSection` « Évolution » | Conforme. |
| Attendus : marge, ventes/achats, concentration/exposition | BusinessChart (DualSeriesChart) | Conforme. |

**Constat :** Conforme. Bloc présent avec graphique métier.

**Recommandation :** Aucun changement requis. Documenter l’état (A – disponible) en grille de conformité.

---

### 4.6 EBE (EbeCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.6) | **Absent** | Non conforme. |
| Attendus : marge brute/EBE, badge proxy si besoin, indication composantes manquantes | — | À implémenter. |

**Constat :** Pas de bloc Évolution. L’EBE peut être en mode « proxy » (marge brute + avoirs) ; la SPEC prévoit l’état B (partiel) avec badge.

**Recommandation :** Priorité haute. Ajouter un bloc Évolution. Si les séries temporelles EBE/marge brute existent côté API, les afficher ; sinon **état C (vide)** ou **état B (partiel)** avec message du type « Évolution EBE à venir » ou « Données proxy, évolution partielle ». Ne pas laisser la card sans bloc.

---

### 4.7 BFR (WorkingCapitalCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.7) | **Absent** | Non conforme. |
| Attendus : évolution BFR, AR/AP, taux échus clients | — | À implémenter. |

**Constat :** Pas de bloc Évolution. Les données ar-by-partner / ap-by-partner pourraient alimenter une évolution du BFR (AR − AP) dans le temps si l’API le permet.

**Recommandation :** Priorité haute. Ajouter un bloc Évolution (replié par défaut). Contenu : évolution du BFR et/ou AR vs AP sur la période ; si pas d’historique, **état C (vide standardisé)**. Ne pas supprimer le bloc.

---

### 4.8 Paiements (TreasuryCardWithPolling)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.8) | **Présent** : `CardChartSection` titre « Répartition » | Conforme sous réserve. |
| Attendus : couverture probante dans le temps, rapproché/à rapprocher, complétude | Donut/barres rapproché vs à rapprocher | Sémantiquement aligné. |

**Constat :** Un bloc repliable existe, avec graphique (répartition rapproché / à rapprocher). La SPEC demande un libellé **« Évolution »** ; ici le titre est « Répartition ». Sémantiquement, c’est bien une forme d’évolution (état de rapprochement sur la période).

**Recommandation :** Règle ferme : le **libellé du bloc est toujours « Évolution »**. « Répartition » ne doit pas être le titre du bloc ; il devient un **sous-titre** ou une **phrase de lecture métier** (ex. « Répartition rapproché / à rapprocher ») dans le contenu du bloc. Aucune exception : ouvrir une brèche sur le libellé commun fragiliserait la règle sur toutes les cards. Aligner Paiements en conséquence (titre = « Évolution », sous-titre ou lecture = « Répartition »).

---

### 4.9 Notes de crédit (CreditNotesCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.9) | **Présent** : `CardChartSection` « Évolution » | Conforme. |
| Attendus : volume/montant avoirs, client/fournisseur si pertinent | DualSeriesChart, séries | Conforme. |

**Constat :** Conforme. Bloc présent avec graphique.

**Recommandation :** Aucun changement. Documenter en grille (état A).

---

### 4.10 Remboursements (RefundsCard)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.10) | **Présent** : `CardChartSection` « Évolution » | Conforme. |
| Attendus : évolution remboursements, ventilation client/fournisseur | DualSeriesChart | Conforme. |

**Constat :** Conforme.

**Recommandation :** Aucun changement. Documenter en grille (état A).

---

### 4.11 Points de vente (PosShopsView)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Bloc Évolution obligatoire (§10.11) | **Présent** : `CardChartSection` « Évolution » par magasin | Conforme. |
| Attendus : sessions, scellées, CA/tickets | DualSeriesChart / PosSessionChart par shop | Conforme. |

**Constat :** Chaque point de vente a son bloc Évolution (Évolution / Répartition). Structure conforme.

**Recommandation :** Aucun changement. Si une vue agrégée « tous magasins » est ajoutée plus tard, y inclure aussi un bloc Évolution (ou état vide standardisé).

---

### 4.12 Z de caisse (PosComingSoonView)

| Critère SPEC | État actuel | Avis |
|--------------|-------------|------|
| Exception (§10.12) | Card « bientôt disponible », pas de bloc | Exception admise. |

**Constat :** La SPEC autorise l’absence du bloc tant que le module n’est pas disponible. Dès activation du module, la card devra intégrer un bloc Évolution (ou état D puis C/A selon les données).

**Recommandation :** Aucune action tant que le module reste en placeholder. Lors du passage en actif, ajouter le bloc avec état D puis état C ou A selon les données.

---

## 5. Synthèse des écarts par card

| Card | Bloc Évolution présent | Conforme SPEC | Action recommandée |
|------|------------------------|---------------|---------------------|
| Trésorerie | Non | Non | Ajouter bloc (état C si pas de série, sinon évolution) |
| Flux net | Oui | Oui | Aucune |
| Taxes | Oui | Oui | Aucune |
| Encours | Non | Non | Ajouter bloc (état C ou séries si API) |
| Business | Oui | Oui | Aucune |
| EBE | Non | Non | Ajouter bloc (état C/B selon données) |
| BFR | Non | Non | Ajouter bloc (état C ou séries) |
| Paiements | Oui (« Répartition ») | Non (libellé) | Titre bloc = « Évolution » ; « Répartition » en sous-titre ou lecture uniquement |
| Notes de crédit | Oui | Oui | Aucune |
| Remboursements | Oui | Oui | Aucune |
| Points de vente | Oui | Oui | Aucune |
| Z de caisse | Non (placeholder) | Exception | Aucune tant que module inactif |

**Résumé :** 4 cards sans bloc (Trésorerie, Encours, EBE, BFR) à traiter en priorité ; 1 card à réaligner (Paiements : titre bloc = « Évolution », « Répartition » en sous-titre/lecture uniquement) ; 7 cards déjà conformes ; 1 exception (Z de caisse).

---

## 6. Recommandations d’implémentation

### 6.0 Definition of Done — composant InstrumentCardEvolutionBlock

Le composant (ou son équivalent canonique, ex. `CardChartSection` élevé à ce rôle) est considéré conforme lorsqu’il respecte la DoD suivante :

| Critère | Exigence |
|--------|----------|
| **Ligne d’entrée** | Toujours visible, quel que soit l’état du bloc (available, empty, error, etc.). |
| **Libellé principal** | Toujours « Évolution ». Aucun libellé métier (ex. « Répartition ») ne remplace le titre du bloc. |
| **États** | Support explicite des états `available` \| `partial` \| `empty` \| `coming_soon` \| `error` \| `loading`, avec rendu adapté pour chacun. |
| **Actions** | Toute action (ex. Réessayer en cas d’erreur) est placée dans le **body** du bloc uniquement ; aucune action du bloc dans le header ou le footer de la card. |
| **Isolation** | Le composant ne modifie ni le header ni le footer de la card ; il appartient au body uniquement. |

Cette DoD verrouille l’industrialisation du bloc et évite les dérives (libellés locaux, actions hors body).

### 6.1 Composant et états

1. **Créer ou étendre un composant `InstrumentCardEvolutionBlock`** (ou conserver `CardChartSection` et documenter qu’il en est l’implémentation) avec une prop **`state`** : `'available' | 'partial' | 'empty' | 'coming_soon' | 'error' | 'loading'`.
2. **Centraliser dans ce composant** le rendu des états C, D, E, F :
   - **empty** : message type « Aucune donnée d’évolution disponible pour la période » + sous-texte optionnel « La card reste pilotable sur l’état courant ».
   - **coming_soon** : « Bloc Évolution à venir » ou équivalent.
   - **error** : message court + action « Réessayer » dans le body du bloc uniquement.
   - **loading** : skeleton ou placeholder de graphique.
3. **Garder** la ligne d’entrée (libellé « Évolution », chevron, Afficher/Réduire) même en état vide/erreur/chargement, pour que la structure reste visible.

### 6.2 Données et API

4. **Cartographier les APIs** : pour Trésorerie, Encours, EBE, BFR, vérifier si des séries temporelles existent (treasury, ar-by-partner, dashboard-metrics, etc.). Si oui, brancher les graphiques ; si non, livrer d’abord le bloc en état C (vide) pour être conforme à la structure.
5. **Ne pas conditionner l’affichage du bloc** à la présence de données : le bloc est toujours rendu, avec l’état adapté (A, B, C, D, E ou F).

### 6.3 Charte et plan

6. **Mettre à jour la charte commune** : ajouter la règle « Bloc Évolution obligatoire » dans la section « Règles UI non négociables » (comme en §12 de la SPEC).
7. **Mettre à jour le plan d’implémentation** : ajouter le critère de conformité « Bloc Évolution présent, lisible et conforme à l’état réel des données » et le DoD par card (bloc présent, état documenté).

### 6.4 Ordre de traitement suggéré

- **Phase 1 (structure)** : Extension du composant avec états empty/error/loading/coming_soon ; mise à jour charte + plan.
- **Phase 2 (cards sans bloc)** : Trésorerie, Encours, EBE, BFR — ajout du bloc avec état C (vide) minimum, puis branchement des séries dès que les APIs le permettent.
- **Phase 3 (alignement)** : Paiements — titre du bloc = « Évolution » ; « Répartition » en sous-titre ou phrase de lecture uniquement (règle ferme, pas d’exception).
- **Phase 4 (recette)** : Grille de conformité et vérification DoD pour toutes les cards.

---

## 7. Risques et points d’attention

| Risque | Mitigation |
|--------|------------|
| APIs sans séries temporelles pour Trésorerie / Encours / EBE / BFR | Livrer le bloc en état vide (C) ; la SPEC l’autorise et l’exige. |
| Surcharge visuelle si toutes les cards ont le bloc déplié | Respecter « replié par défaut » pour les cards compactes / denses ; la SPEC le recommande. |
| Divergence de libellés (« Répartition » vs « Évolution ») | Règle ferme : libellé du bloc = toujours « Évolution » ; « Répartition » = sous-titre ou lecture métier uniquement. Aucune exception. |
| Réessai (erreur) placé en header ou footer | Contraire à la SPEC ; garder l’action « Réessayer » uniquement dans le body du bloc. |

---

## 8. Conclusion

La SPEC est **prête pour implémentation**. Elle est cohérente avec la charte, le plan et l’existant. L’effort principal concerne **quatre cards sans bloc Évolution** (Trésorerie, Encours, EBE, BFR) et la **normalisation des états** (vide, erreur, chargement, à venir) dans un composant commun. Le libellé du bloc est **toujours « Évolution »** ; Paiements doit être aligné en conséquence (« Répartition » en sous-titre ou lecture uniquement). Recommandation : acter la décision produit, mettre à jour charte et plan, verrouiller la DoD composant (§6.0), puis exécuter les phases 1 à 4 en priorisant les quatre cards manquantes et l’alignement Paiements.

---

*Fin du document — AVIS_EXPERT_SPEC_BLOC_EVOLUTION_COMMUN_v1.0*
