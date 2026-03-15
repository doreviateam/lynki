# Plan d’implémentation — Bloc Évolution commun des cards Linky

**Document :** PLAN_IMPLEMENTATION_BLOC_EVOLUTION_COMMUN_v1.0  
**Date :** 14 mars 2026  
**Références :**
- [SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0.md](./SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0.md)
- [AVIS_EXPERT_SPEC_BLOC_EVOLUTION_COMMUN_v1.0.md](./AVIS_EXPERT_SPEC_BLOC_EVOLUTION_COMMUN_v1.0.md)
- [charte_commune_des_cards_Linky.md](./charte_commune_des_cards_Linky.md) (v2.0)

**Périmètre :** 12 instruments du cockpit Linky  
**Statut :** Plan d’exécution

---

## 1. Synthèse

| Phase | Objectif | Livrables | Effort estimé |
|-------|----------|-----------|---------------|
| **P0** | Acter la décision produit + mettre à jour charte et plan charte | Charte §3 bis mise à jour ; plan charte avec critère 11 ; règle transverse | 0,5 j |
| **P1** | Normaliser le composant Évolution (états + DoD) | Composant avec états empty/error/loading/coming_soon/partial ; libellé fixe « Évolution » ; DoD composant respectée | 1,5–2 j |
| **P2** | Ajouter le bloc sur les 4 cards sans Évolution | Trésorerie, Encours, EBE, BFR : bloc présent (état C minimum si pas de séries) | 2–2,5 j |
| **P3** | Aligner Paiements sur le libellé commun | Titre bloc = « Évolution » ; « Répartition » en sous-titre ou lecture uniquement | 0,25 j |
| **P4** | Recette et grille de conformité | Grille mise à jour ; état du bloc documenté par card ; DoD card vérifiée | 0,5–1 j |

**Total estimé :** 5–6,5 j.

**Ordre impératif :** P0 → P1 → P2 → P3 → P4. Ne pas traiter les cards (P2) avant d’avoir le composant avec états (P1), pour éviter de dupliquer la logique d’état dans chaque card.

---

## 2. Décision produit à acter (prérequis)

Avant de démarrer P1, la décision suivante doit être actée (SPEC §16) :

> **Le bloc Évolution devient obligatoire sur toutes les cards Linky en production.**  
> Toute card sans bloc Évolution est considérée comme incomplète du point de vue de la structure cockpit, même si sa synthèse métier est correcte.

**Règle ferme sur le libellé :** le titre du bloc est **toujours « Évolution »**. Aucun libellé métier (ex. « Répartition ») ne remplace le titre ; les libellés métiers sont autorisés en sous-titre ou en phrase de lecture dans le contenu du bloc uniquement.

---

## 3. État actuel par card

### 3.1 Cards conformes (bloc Évolution présent, libellé « Évolution »)

| Card | Fichier | Composant actuel | État bloc | Action plan |
|------|---------|------------------|-----------|-------------|
| Flux net | `FluxCashCard.tsx` | CardChartSection | available | P4 : documenter état ; à terme migrer vers InstrumentCardEvolutionBlock si harmonisation souhaitée |
| Taxes | `TaxesCard.tsx` | CardChartSection | available | P4 ; idem |
| Business | `BusinessCard.tsx` | CardChartSection | available | P4 ; idem |
| Notes de crédit | `CreditNotesCard.tsx` | CardChartSection | available | P4 ; idem |
| Remboursements | `RefundsCard.tsx` | CardChartSection | available | P4 ; idem |
| Points de vente | `PosShopsView.tsx` | CardChartSection (par shop) | available | P4 ; idem |

*Les cards déjà conformes utilisent aujourd’hui `CardChartSection` directement. Le plan impose `InstrumentCardEvolutionBlock` pour les **nouvelles** intégrations (P2) et pour Paiements (P3). La migration des 6 cards conformes vers `InstrumentCardEvolutionBlock` peut être traitée en P4 ou dans un chantier ultérieur d’harmonisation.*

### 3.2 Cards sans bloc Évolution (non conformes)

| Card | Fichier | Action plan |
|------|---------|-------------|
| **Trésorerie** | `TresoreriePositionCard.tsx` | P2 : ajouter bloc ; état C (vide) si pas de série temporelle, sinon évolution solde / couverture probante |
| **Encours** | `EncoursCard.tsx` | P2 : ajouter bloc ; état C si pas de série, sinon évolution créances / échus |
| **EBE** | `EbeCard.tsx` | P2 : ajouter bloc ; état C ou B (partiel) selon données |
| **BFR** | `WorkingCapitalCard.tsx` | P2 : ajouter bloc ; état C si pas de série, sinon évolution BFR / AR–AP |

### 3.3 Card à réaligner (bloc présent, libellé incorrect)

| Card | Fichier | Écart | Action plan |
|------|---------|-------|-------------|
| **Paiements** | `TreasuryCardWithPolling.tsx` | Titre bloc = « Répartition » au lieu de « Évolution » | P3 : titre = « Évolution » ; « Répartition » en sous-titre ou phrase de lecture |

### 3.4 Exception documentée

| Card | Fichier | Motif | Action plan |
|------|---------|-------|-------------|
| Z de caisse | `PosComingSoonView.tsx` | Module non disponible (SPEC §10.12) | Aucune tant que module inactif ; à l’activation, ajouter bloc (état D puis C/A). |

---

## 4. Phase P0 — Charte et plan (préalable)

### 4.1 Mise à jour de la charte commune

- **Fichier :** `ZeDocs/web46/charte_commune_des_cards_Linky.md`
- **Action :** Dans la section **« 3 bis. Règles UI non négociables »**, ajouter une 6ᵉ règle :

| Règle | Description |
|--------|-------------|
| **Bloc Évolution obligatoire** | Sur toute card instrument en production, un bloc Évolution est présent (structure : ligne d’entrée « Évolution », zone de contenu ou état vide/erreur/chargement). Absence admise uniquement pour placeholder « bientôt disponible » ou exception documentée. |

- **Référence SPEC :** §12.

### 4.2 Mise à jour du plan charte (optionnel mais recommandé)

- **Fichier :** `ZeDocs/web46/PLAN_IMPLEMENTATION_CHARTE_CARDS_LINKY_v1.0.md`
- **Action :** Dans la grille de conformité (§9), ajouter le critère :

**11. Bloc Évolution présent, lisible et conforme à l’état réel des données (available / partial / empty / coming_soon / error / loading).**

- **Référence SPEC :** §13.2.

### 4.3 Definition of Done — P0

- [ ] Décision produit « Bloc Évolution obligatoire » actée.
- [ ] Charte mise à jour avec la règle « Bloc Évolution obligatoire ».
- [ ] Plan charte mis à jour avec le critère 11 (grille de conformité) ou documenté dans ce plan.

---

## 5. Phase P1 — Composant Évolution (états + DoD)

### 5.1 Objectif

Créer **`InstrumentCardEvolutionBlock`** comme **API produit officielle** du bloc Évolution. La charte et le plan parlent du « bloc Évolution » ; les cards consomment ce composant. En interne, il peut déléguer à `CardChartSection` (implémentation technique). Cette séparation clarifie le système : un seul point d’entrée produit, une implémentation réutilisable en dessous.

### 5.2 DoD composant — InstrumentCardEvolutionBlock

Le composant est conforme lorsqu’il respecte :

| Critère | Exigence |
|--------|----------|
| **Ligne d’entrée** | Toujours visible, quel que soit l’état (available, empty, error, etc.). |
| **Libellé principal** | Toujours « Évolution ». Pas de prop permettant de remplacer par un libellé métier (ex. « Répartition »). Sous-titre ou lecture métier optionnels dans le contenu. |
| **États** | Support explicite : `available` \| `partial` \| `empty` \| `coming_soon` \| `error` \| `loading`, avec rendu dédié pour chacun. |
| **Actions** | Toute action (ex. Réessayer) dans le **body** du bloc uniquement ; aucune action du bloc dans le header ou le footer de la card. |
| **Isolation** | Le composant n’impacte ni le header ni le footer ; il vit dans le body de la card. |
| **Hauteur minimale** | Les états `empty`, `loading`, `error`, `coming_soon` conservent une **hauteur minimale cohérente** avec la présence d’un bloc analytique, pour éviter l’effet « card amputée ». |

### 5.3 Travaux techniques

1. **Créer `InstrumentCardEvolutionBlock` (composant canonique)**  
   - Ce composant est l’**API produit** que les cards utilisent. Il fixe le libellé « Évolution », accepte la prop **`state`** (`'available' | 'partial' | 'empty' | 'coming_soon' | 'error' | 'loading'`), et délègue à `CardChartSection` pour le rendu (ligne d’entrée, repliable, contrôles).  
   - `CardChartSection` reste l’implémentation technique (graphique, granularité, type de chart) ; elle est étendue pour gérer la prop `state` et les rendus d’état quand `state` n’est pas available/partial.

2. **Rendu des états dans le composant**  
   - **empty** : message « Aucune donnée d’évolution disponible pour la période. » + sous-texte optionnel « La card reste pilotable sur l’état courant. »  
   - **coming_soon** : « Bloc Évolution à venir. » ou « L’historique sera disponible dans une prochaine version. »  
   - **error** : message court (ex. « Impossible de charger l’évolution pour le moment. ») + bouton « Réessayer » dans le body du bloc (callback optionnel).  
   - **loading** : skeleton ou placeholder de graphique.  
   - **partial** : affichage du contenu fourni + badge ou note explicite (ex. « Données partielles »).  
   - Pour **empty**, **loading**, **error**, **coming_soon** : appliquer une **hauteur minimale** du bloc (zone de contenu) pour éviter l’effet « card amputée » ; pas de chiffre imposé dans ce plan, mais le principe est explicite.

3. **Ligne d’entrée**  
   - Conservée pour tous les états : libellé **« Évolution »** (fixe dans `InstrumentCardEvolutionBlock`), chevron, « Afficher » / « Réduire ».  
   - Ne pas cacher le bloc ni la ligne d’entrée quand `state` est empty/error/loading.

4. **Documentation**  
   - En tête de `InstrumentCardEvolutionBlock` : indiquer qu’il est le **bloc Évolution** de la charte (SPEC_LINKY_BLOC_EVOLUTION_COMMUN_v1.0) et référencer la DoD composant. `CardChartSection` peut documenter qu’elle est utilisée comme implémentation par ce bloc.

### 5.4 Fichiers impactés

| Fichier | Rôle | Modification |
|---------|------|--------------|
| `components/InstrumentCardEvolutionBlock.tsx` | **API produit officielle** | Création. Fixe libellé « Évolution », prop `state`, délègue à `CardChartSection` ; gère le rendu des états empty/error/loading/coming_soon (ou les transmet à CardChartSection). |
| `components/CardChartSection.tsx` | Implémentation technique | Prop `state`, rendu des états empty/error/loading/coming_soon/partial ; hauteur minimale pour ces états ; libellé « Évolution » par défaut. Appelé par `InstrumentCardEvolutionBlock`. |

### 5.5 Definition of Done — P1

- [ ] `InstrumentCardEvolutionBlock` créé et exposé comme API produit (les cards l’utilisent).
- [ ] Prop `state` disponible et utilisée ; délégation à `CardChartSection` en interne.
- [ ] Rendu des états empty, coming_soon, error, loading, partial implémenté et testé visuellement.
- [ ] Hauteur minimale du bloc respectée pour les états empty, loading, error, coming_soon (pas d’effet « card amputée »).
- [ ] Ligne d’entrée toujours visible pour tous les états ; libellé = « Évolution » (fixe dans le composant canonique).
- [ ] Action « Réessayer » (si présente) uniquement dans le body du bloc.
- [ ] DoD composant (§5.2) vérifiée et documentée.

---

## 6. Phase P2 — Cards sans bloc Évolution (Trésorerie, Encours, EBE, BFR)

Pour chaque card, le bloc est **toujours rendu** via **`InstrumentCardEvolutionBlock`** ; l’état du bloc dépend des données (available si séries présentes, sinon empty ou partial).

### 6.1 Trésorerie (TresoreriePositionCard)

- **Fichier :** `components/TresoreriePositionCard.tsx` (et éventuellement `TresoreriePositionCardWithPolling.tsx` si le bloc est intégré côté polling).
- **Composant :** `InstrumentCardEvolutionBlock` (API produit).
- **Placement :** Dans le body, après la synthèse métier (solde, indicateurs), avant le footer.
- **Contenu cible :**  
  - Si série temporelle « trésorerie validée » ou « couverture probante » disponible (API treasury ou équivalent) : graphique évolution (état **available**).  
  - Sinon : bloc en état **empty** avec message standard (« Aucune donnée d’évolution disponible pour la période. »).
- **Replié par défaut :** Oui (recommandation variante compacte / synthèse).
- **DoD card :** Bloc Évolution présent ; état documenté (available ou empty).

### 6.2 Encours (EncoursCard)

- **Fichier :** `components/EncoursCard.tsx` (et wrapper si besoin).
- **Composant :** `InstrumentCardEvolutionBlock`.
- **Placement :** Après la synthèse (créances ouvertes, échus, top partenaires), avant le footer.
- **Contenu cible :**  
  - Si séries temporelles encours / échus disponibles (ex. ar-by-partner avec historique ou API dédiée) : graphique évolution créances / échus (état **available**).  
  - Sinon : bloc en état **empty**.
- **Replié par défaut :** Oui.
- **DoD card :** Bloc Évolution présent ; état documenté.

### 6.3 EBE (EbeCard)

- **Fichier :** `components/EbeCard.tsx`.
- **Composant :** `InstrumentCardEvolutionBlock`.
- **Placement :** Après la synthèse (EBE, marge brute, charges), avant le footer.
- **Contenu cible :**  
  - Si évolution EBE / marge brute disponible : graphique (état **available** ou **partial** si proxy).  
  - Sinon : état **empty** ou **partial** avec message adapté (ex. « Données proxy, évolution partielle à venir »).
- **Replié par défaut :** Oui.
- **DoD card :** Bloc Évolution présent ; état documenté.

### 6.4 BFR (WorkingCapitalCard)

- **Fichier :** `components/WorkingCapitalCard.tsx`.
- **Composant :** `InstrumentCardEvolutionBlock`.
- **Placement :** Après la synthèse (BFR, AR/AP, barres), avant le footer.
- **Contenu cible :**  
  - Si évolution BFR ou AR/AP dans le temps disponible : graphique (état **available**).  
  - Sinon : état **empty**.
- **Replié par défaut :** Oui.
- **DoD card :** Bloc Évolution présent ; état documenté.

### 6.5 APIs et séries temporelles

Avant ou pendant P2, cartographier pour chaque card :

- **Trésorerie :** API treasury (treasury) — champs de type `position`, `reconciliation_metrics`, ou séries par période si existantes.
- **Encours :** ar-by-partner, dashboard-metrics — agrégations par période ou par date pour construire une série.
- **EBE / BFR :** dashboard-metrics, Vault — vérifier si des séries EBE, marge, BFR, AR, AP par période sont exposées.

Si aucune série n’existe pour une card, livrer le bloc en **état empty** ; ne pas retarder la conformité structurelle.

### 6.6 Definition of Done — P2

- [ ] Trésorerie : bloc Évolution présent (état available ou empty).
- [ ] Encours : bloc Évolution présent (état available ou empty).
- [ ] EBE : bloc Évolution présent (état available, partial ou empty).
- [ ] BFR : bloc Évolution présent (état available ou empty).
- [ ] Pour chaque card, l’état du bloc est documenté (dans le code ou la grille de conformité).
- [ ] Aucune card ne conditionne l’affichage du bloc à la présence de données : le bloc est toujours rendu.

---

## 7. Phase P3 — Alignement Paiements (libellé)

### 7.1 Objectif

Conformer la card Paiements à la règle : **titre du bloc = toujours « Évolution »** ; « Répartition » ne doit pas être le titre du bloc.

### 7.2 Travaux

- **Fichier :** `components/TreasuryCardWithPolling.tsx`
- **Action :**  
  - Remplacer `sectionTitle="Répartition"` par `sectionTitle="Évolution"` (ou ne pas passer `sectionTitle` pour utiliser le défaut « Évolution »).  
  - Ajouter un **sous-titre** ou une **phrase de lecture** dans le contenu du bloc (ex. « Répartition rapproché / à rapprocher » ou dans `whyContent` / texte d’interprétation) pour garder la clarté métier.

### 7.3 Definition of Done — P3

- [ ] Le titre de la ligne d’entrée du bloc sur la card Paiements est « Évolution ».
- [ ] L’information « Répartition » (rapproché / à rapprocher) reste visible en sous-titre ou en lecture dans le contenu du bloc.

---

## 8. Phase P4 — Recette et grille de conformité

### 8.1 Grille de conformité — Bloc Évolution

Après mise en œuvre, chaque card (hors exception Z de caisse tant que module inactif) doit satisfaire :

**Critère 11 (Bloc Évolution) :**  
Bloc Évolution présent, lisible et conforme à l’état réel des données.

- **11.1** Bloc présent (ligne d’entrée « Évolution » + zone de contenu ou état vide/erreur/chargement/à venir).
- **11.2** Libellé de la ligne d’entrée = « Évolution » (aucune exception non documentée).
- **11.3** État du bloc cohérent avec les données (available / partial / empty / coming_soon / error / loading).
- **11.4** Aucune action du bloc dans le header ou le footer de la card.
- **11.5** État du bloc documenté (code ou grille).

### 8.2 Tableau de suivi par card

| Card | Bloc présent | Libellé « Évolution » | État documenté | Conforme |
|------|--------------|------------------------|----------------|----------|
| Trésorerie | ☐ | ☐ | ☐ | ☐ |
| Flux net | ☐ | ☐ | ☐ | ☐ |
| Taxes | ☐ | ☐ | ☐ | ☐ |
| Encours | ☐ | ☐ | ☐ | ☐ |
| Business | ☐ | ☐ | ☐ | ☐ |
| EBE | ☐ | ☐ | ☐ | ☐ |
| BFR | ☐ | ☐ | ☐ | ☐ |
| Paiements | ☐ | ☐ | ☐ | ☐ |
| Notes de crédit | ☐ | ☐ | ☐ | ☐ |
| Remboursements | ☐ | ☐ | ☐ | ☐ |
| Points de vente | ☐ | ☐ | ☐ | ☐ |
| Z de caisse | — | — | Exception | ☐ |

### 8.3 Definition of Done — P4

- [ ] Grille de conformité (critère 11 et sous-critères) remplie pour toutes les cards concernées.
- [ ] État du bloc documenté pour chaque card (available / partial / empty / coming_soon / error / loading).
- [ ] Recette visuelle : toutes les cards affichent un bloc Évolution identifiable (ou exception documentée).
- [ ] Aucune régression sur le reste de la charte (header, footer, contour).

---

## 9. Fichiers impactés (résumé)

| Fichier | Phase | Modification principale |
|---------|-------|--------------------------|
| `charte_commune_des_cards_Linky.md` | P0 | Règle « Bloc Évolution obligatoire » dans §3 bis |
| `PLAN_IMPLEMENTATION_CHARTE_CARDS_LINKY_v1.0.md` | P0 | Critère 11 grille de conformité (optionnel) |
| `InstrumentCardEvolutionBlock.tsx` | P1 | **Création** — API produit officielle du bloc Évolution ; fixe libellé « Évolution », prop `state`, délègue à CardChartSection |
| `CardChartSection.tsx` | P1 | Prop `state`, rendu états, hauteur minimale états vides, libellé « Évolution » par défaut (implémentation technique) |
| `TresoreriePositionCard.tsx` | P2 | Ajout `InstrumentCardEvolutionBlock` (état empty ou available) |
| `EncoursCard.tsx` | P2 | Ajout `InstrumentCardEvolutionBlock` (état empty ou available) |
| `EbeCard.tsx` | P2 | Ajout `InstrumentCardEvolutionBlock` (état empty / partial / available) |
| `WorkingCapitalCard.tsx` | P2 | Ajout `InstrumentCardEvolutionBlock` (état empty ou available) |
| `TreasuryCardWithPolling.tsx` | P3 | Utiliser « Évolution » comme titre du bloc ; « Répartition » en sous-titre/lecture uniquement |

---

## 10. Risques et points de vigilance

| Risque | Mitigation |
|--------|------------|
| APIs sans séries temporelles pour les 4 cards P2 | Livrer le bloc en état **empty** ; la SPEC l’autorise et l’exige. Ne pas retarder la conformité structurelle. |
| Surcharge visuelle (tous blocs déplié) | Replié par défaut pour les cards concernées (recommandation SPEC §5.3). |
| Libellé « Répartition » réintroduit ailleurs | Règle ferme : titre bloc = toujours « Évolution » ; documenter dans la DoD composant et en charte. |
| Action « Réessayer » en header ou footer | DoD composant : action uniquement dans le body du bloc. Vérifier en recette. |
| Dérive de composants locaux (bloc custom par card) | Utiliser uniquement **InstrumentCardEvolutionBlock** (API produit) ; pas de duplication de la logique d’états ni d’usage direct de CardChartSection pour le bloc Évolution depuis les cards. |

---

## 11. Dépendances avec le plan charte

- Ce plan **s’appuie** sur la charte commune (header, footer, contour) déjà implémentée ou en cours (PLAN_IMPLEMENTATION_CHARTE_CARDS_LINKY_v1.0).
- Toute nouvelle card migrée vers le chrome commun doit **aussi** vérifier la présence du bloc Évolution (règle transverse SPEC §13.1).
- La grille de conformité de ce plan (critère 11) peut être fusionnée avec la grille du plan charte (critère 11 ajouté en P0).

---

*Plan d’implémentation v1.0 — Bloc Évolution commun — 14 mars 2026*
