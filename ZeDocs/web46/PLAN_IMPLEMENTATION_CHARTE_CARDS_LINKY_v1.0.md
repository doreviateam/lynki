# Plan d’implémentation — Charte commune des cards Linky

**Document :** PLAN_IMPLEMENTATION_CHARTE_CARDS_LINKY_v1.0  
**Référence :** [charte_commune_des_cards_Linky.md](./charte_commune_des_cards_Linky.md) (v2.0)  
**Date :** 14 mars 2026  
**Périmètre :** 12 instruments du cockpit Linky  
**Statut :** Plan d’exécution validé

---

## 1. Synthèse

| Phase | Objectif | Cards concernées | Effort estimé |
|-------|----------|------------------|---------------|
| **P0** | Verrouiller la base commune (chrome + décisions ouvertes) | Toutes | 1 j |
| **P1** | Aligner 9 cards sur InstrumentCardChrome | Encours, Paiements, EBE, BFR, Taxes, Notes de crédit, Remboursements, Points de vente | 3–4 j |
| **P2** | Refondre Z de caisse (variante D) | Z de caisse | 0,5 j |
| **P3** (optionnel) | Liseré gauche normalisé (charte §4.3) | Toutes | 1 j |

---

## 2. État actuel par card

### 2.1 Déjà conformes (structure charte)

| Card | Fichier | Contour | Header | Footer | Note |
|------|---------|---------|--------|--------|------|
| **Trésorerie** | `TresoreriePositionCard.tsx` | ✅ INSTRUMENT_CARD_BASE | ✅ InstrumentCardHeader + KPI droit | ✅ InstrumentCardFooter (contexte) | Référence |
| **Business** | `BusinessCard.tsx` | ✅ (sauf état erreur : border-l-2) | ✅ + badge Certifié | ✅ | À arbitrer : Certifié |
| **Flux net** | `FluxCashCard.tsx` | ✅ | ✅ | ✅ | Référence |

### 2.2 À aligner (même chrome, contour et footer à unifier)

| Card | Fichier(s) | Écart contour | Écart header | Écart footer |
|------|------------|---------------|--------------|--------------|
| **Encours** | `EncoursCard.tsx` | `radius-xl` + `border-l-4` + accent couleur | Structure manuelle (pas InstrumentCardHeader), pas de badge statut | Pas InstrumentCardFooter ; ligne "Données : freshness" en bas du body |
| **Paiements** | `TreasuryCardWithPolling.tsx` | `radius-card` + `border-l-4` + accent | Header custom, KPI droit présent | Pas de footer contextuel standardisé |
| **EBE** | `EbeCard.tsx` | `radius-xl` + `border-l-4` + accent | Header manuel, KPI droit ; pas de badge statut (Proxy/Complet) | Pas de footer |
| **BFR** | `WorkingCapitalCard.tsx` | `rounded-2xl` (différent), pas de border-l | **Titre long + sous-titre** au lieu de icône + titre court ; bouton "Détail" en header | Pas de footer |
| **Taxes** | `TaxesCard.tsx` | `radius-xl` + `border-l-4` | Header manuel, KPI droit | Pas de footer |
| **Notes de crédit** | `CreditNotesCard.tsx` | `radius-xl` + `border-l-4` | Idem Taxes | Pas de footer |
| **Remboursements** | `RefundsCard.tsx` | `radius-xl` + `border-l-4` | Idem | Pas de footer |
| **Points de vente** | `PosShopsView.tsx` | `radius-xl` + `border-l-4` + accent | Header sans KPI droit (optionnel charte) ; badge statut dans le body | Pas de footer |

### 2.3 À refondre (variante D)

| Card | Fichier | Écart |
|------|---------|--------|
| **Z de caisse** | `PosComingSoonView.tsx` | Titre **centré** dans le header ; pas de structure gauche/droite ; "Bientôt disponible" centré dans le body. Charte §10.5 : header standard (icône + titre à gauche), body minimal, bloc droit vide ou statut discret. |

---

## 3. Décisions à acter en P0 (avant P1)

- **Certifié (Business)** : **trancher en P0**. Soit c’est une **information de confiance produit transverse** → composant standard documenté ; soit info locale peu déterminante → **supprimer**. En l’état, cela reste une exception de card ; la règle recommandée est de supprimer sauf preuve forte qu’il sert la compréhension.
- **Liseré gauche** : la charte v2.0 autorise un accent vertical **normalisé** (§4.3). Traiter comme **option produit**, pas comme condition de conformité. **Sans liseré = baseline conforme** ; **avec liseré = enrichissement éventuel** (P3), jamais prérequis.
- **Footer sur états vides** : **facultatif**. Absent si aucune métadonnée utile ; pas de footer factice pour remplir visuellement.

---

## 4. Phase P0 — Base commune et corrections mineures

### 4.1 Unifier les tokens de contour

- **Objectif :** une seule constante de contour pour toutes les cards.
- **Fichier :** `components/InstrumentCardChrome.tsx`.
- **Action :** confirmer que `INSTRUMENT_CARD_BASE` utilise `--radius-card` (déjà le cas). Vérifier que `--radius-card` et `--radius-xl` sont alignés dans `globals.css` (actuellement tous deux 0.75rem → OK). Documenter dans la charte ou dans un commentaire que la silhouette de base est `INSTRUMENT_CARD_BASE` sans ajout de bordure structurelle, sauf si P3 (liseré) est acté.

### 4.2 Corriger l’état erreur Business

- **Fichier :** `components/BusinessCard.tsx`.
- **Action :** remplacer `border-l-2 border-l-[var(--negative)]` par uniquement `bg-[var(--negative-soft)]` sur l’état erreur, pour respecter « contour commun » (pas d’accent structurel différent).

### 4.3 Documenter les composants recommandés

- **Fichier :** `components/InstrumentCardChrome.tsx` (ou README).
- **Action :** ajouter en en-tête le lien vers la charte et la liste des composants (InstrumentCardHeader, InstrumentCardStatusBadge, InstrumentCardFooter). Optionnel : renommer ou aliaser vers les noms charte §12 (InstrumentCardHeaderLeft/Right si besoin plus tard).

### 4.4 Definition of Done — P0

- Aucune card ne porte de `border-l-*` structurel non autorisé (état erreur inclus).
- État erreur Business sans rupture de contour (pas de `border-l-2`).
- Décision actée sur **Certifié** (conserver documenté ou supprimer).
- Décision actée sur présence/absence du **liseré** (baseline = sans liseré).
- Décision actée sur **footer des états vides** (facultatif, absent si pas de contexte utile).
- Paiements : aucun bouton « Rafraîchir » restant nulle part.

---

## 5. Phase P1 — Alignement des 9 cards

Pour chaque card, appliquer dans l’ordre :

1. Remplacer le contour par `INSTRUMENT_CARD_BASE` (et, si P3 acté, un wrapper avec accent).
2. Remplacer le header par `InstrumentCardHeader` (icône, titre, badges optionnels, KPI droit si applicable).
3. Ajouter `InstrumentCardFooter` avec une ligne de contexte (date/source/période).
4. Supprimer toute action en header (ex. bouton « Détail » sur BFR) ou la déplacer dans le body si elle reste nécessaire.

### Variante A — Compact KPI card (pattern mutualisé)

Les cards **Taxes**, **Notes de crédit** et **Remboursements** relèvent d’un même pattern. Le formaliser évite de « corriger 3 fois le même problème ».

- **Header** : standard (InstrumentCardHeader, titre, KPI droit).
- **Body** : 2 à 4 lignes métier ; au plus 1 section repliable (ex. graphique).
- **Footer** : contextuel court (période, source).
- **Aucun** bouton en header, **aucun** footer actionnel.

Appliquer ce pattern en priorité sur ces trois cards (P1.1).

### 5.1 Encours

- **Fichier :** `components/EncoursCard.tsx`.
- **Contour :** `CARD_BASE` → `INSTRUMENT_CARD_BASE` (supprimer `border-l-4` et `accentColor` sur la section ; la sémantique reste dans le badge/KPI).
- **Header :** utiliser `InstrumentCardHeader` avec titre `ENCOURS`, KPI droit « Créances ouvertes » + valeur. Badge optionnel selon `overdueAmount` / `freshness` (ex. « À surveiller » si retard).
- **Footer :** remplacer la ligne « Données : freshness » par `InstrumentCardFooter` avec meta du type `Source : Vault · ar-by-partner` et fraîcheur si pertinent.
- **Body :** inchangé (synthèse échus/non échus, top partenaires, alertes).

### 5.2 Paiements (TreasuryCardWithPolling)

- **Fichier :** `components/TreasuryCardWithPolling.tsx`.
- **Contour :** `CARD_BASE` → `INSTRUMENT_CARD_BASE` (supprimer `border-l-4`).
- **Header :** extraire la zone titre + KPI dans `InstrumentCardHeader` (icône Paiements, titre `PAIEMENTS`, KPI droit selon complétude / reste à rapprocher). Badge si `completeness_check.badge` ou statut proxy.
- **Footer :** ajouter `InstrumentCardFooter` (ex. `Lecture au DD/MM · Source Vault · Complétude X %` ou message complétude).
- **Body :** conserver graphiques et blocs métier.

### 5.3 EBE

- **Fichier :** `components/EbeCard.tsx`.
- **Contour :** remplacer `CARD_BASE` + `accentColor` par `INSTRUMENT_CARD_BASE`.
- **Header :** `InstrumentCardHeader` avec titre `EBE`, KPI droit = valeur EBE (complète ou proxy), badge « Proxy » si `!isFullEbe`.
- **Footer :** `InstrumentCardFooter` (ex. `Source : Vault · Marge brute − Charges personnel` ou `Proxy : marge brute + avoirs`).
- **Body :** conserver décomposition (marge brute, charges, etc.).

### 5.4 BFR (WorkingCapitalCard)

**Règle explicite :** header = identifiant instrument **court** ; body = expansion éditoriale. Sinon BFR risque de recontaminer la charte avec un header trop éditorial.

- **Fichier :** `components/WorkingCapitalCard.tsx`.
- **Contour :** remplacer `rounded-2xl` et styles par `INSTRUMENT_CARD_BASE`.
- **Header :** **refonte** : icône + titre court **`BFR`** uniquement. KPI droit = valeur BFR (signée). Badge statut (ex. « Créances > dettes », « BFR négatif »). **Supprimer** le bouton « Détail » du header ; si besoin, le déplacer dans le body (lien discret) ou le supprimer.
- **Body (haut) :** expansion éditoriale : « Besoin en fonds de roulement », « Cycle d’exploitation · AR − AP » (ou équivalent), barres, détail AR/AP.
- **Footer :** `InstrumentCardFooter` (ex. `Cycle d'exploitation · AR − AP · Source Vault`).

### 5.5 Taxes

- **Fichier :** `components/TaxesCard.tsx`.
- **Contour :** `CARD_BASE` → `INSTRUMENT_CARD_BASE` (supprimer `border-l-4`).
- **Header :** `InstrumentCardHeader` avec titre `TAXES`, KPI droit = solde taxes (ou libellé + valeur). Pas de badge si pas de statut métier.
- **Footer :** `InstrumentCardFooter` (ex. `Période : exercice à date · Source Odoo / Vault`).
- **Body :** conserver graphique et lignes.

### 5.6 Notes de crédit

- **Fichier :** `components/CreditNotesCard.tsx`.
- **Contour :** idem Taxes.
- **Header :** titre `NOTES DE CRÉDIT`, KPI droit = solde ou montant synthèse.
- **Footer :** contexte (période, source).
- **Body :** inchangé.

### 5.7 Remboursements

- **Fichier :** `components/RefundsCard.tsx`.
- **Contour :** idem.
- **Header :** titre `REMBOURSEMENTS`, KPI droit.
- **Footer :** contexte.
- **Body :** inchangé.

### 5.8 Points de vente

- **Fichier :** `components/PosShopsView.tsx`.
- **Contour :** `INSTRUMENT_CARD_BASE` (supprimer `border-l-4` et accent couleur sur la section).
- **Header :** `InstrumentCardHeader` avec titre `POINTS DE VENTE`. KPI droit optionnel (ex. « Sessions scellées » / total). Badge statut (OK / Warning) peut rester à côté du titre via `InstrumentCardStatusBadge`.
- **Footer :** `InstrumentCardFooter` (ex. `Données : instantané · Source POS`).
- **Body :** conserver verdict, liste shops, graphiques.

### 5.9 Definition of Done — P1

- Les 9 cards sont migrées sur le chrome commun (INSTRUMENT_CARD_BASE, InstrumentCardHeader, InstrumentCardFooter).
- Aucun bouton dans le header (aucune action parasite).
- Aucun footer actionnel (contexte uniquement).
- Toutes les cards passent la grille de conformité §11 (charte).
- Régression visuelle effectuée après P1.1 et P1.2 (voir §5.10).

### 5.10 Régression visuelle (après P1.1 et P1.2)

Après chaque sous-phase, prévoir une **vérification visuelle** pour éviter les micro-divergences.

- **Capture** : toutes les cards concernées (états normal, chargement, erreur si pertinent).
- **Grille de vérification** :
  - hauteur header homogène ;
  - alignement KPI droit cohérent ;
  - densité footer homogène ;
  - aucune action en header ou footer (hors body) ;
  - homogénéité du contour (pas de `border-l-*` ou radius local).
- Documenter les écarts et les corriger avant de passer à la phase suivante.

---

## 6. Phase P2 — Z de caisse (variante D)

- **Fichier :** `components/PosComingSoonView.tsx`.
- **Charte §10.5 :** header standard avec icône + titre à **gauche** ; body minimal « Bientôt disponible » ; pas de centrage libre.

**Actions :**

1. Remplacer le contenu par une structure en deux blocs :
   - **Header :** `InstrumentCardHeader` avec `icon={<IconZReport />}`, `title="Z DE CAISSE"` (ou titre passé en prop), pas de KPI droit (ou libellé discret « Bientôt disponible » à droite).
2. **Body :** un paragraphe ou bloc court : « Bientôt disponible » (aligné à gauche, pas centré).
3. **Footer :** la variante D **peut ne pas avoir de footer** si aucun contexte utile n’existe. **Préférer pas de footer** plutôt qu’un footer factice du type « Module à venir ». Plus propre et conforme à la charte (footer = contexte d’interprétation).
4. Contour : `INSTRUMENT_CARD_BASE` (+ éventuellement liseré gris si P3).

### Definition of Done — P2

- Header standard (icône + titre à gauche), body minimal aligné à gauche, pas de centrage libre.
- Pas de footer factice ; footer absent si pas de métadonnée utile.

---

## 7. Phase P3 (optionnel) — Liseré gauche normalisé

Si la décision produit est d’introduire l’accent vertical (§4.3 charte) :

1. **Composant :** ajouter `InstrumentCardAccent` (ou prop `tone` sur un wrapper) dans `InstrumentCardChrome.tsx`.
   - Props : `tone?: 'neutral' | 'positive' | 'warning' | 'danger' | 'muted'`.
   - Rendu : même radius que la card, liseré vertical fin (ex. 3–4 px), couleur selon §4.4 (bleu, vert, orange, rouge, gris).
2. **Usage :** chaque card utilise `INSTRUMENT_CARD_BASE` + `InstrumentCardAccent` (ou un seul composant `InstrumentCard` qui compose les deux).
3. **Mapping :** Trésorerie vigilance → warning ; Flux net positif/négatif → positive/danger ; Encours retard → warning/danger ; EBE → positive/negative ; etc. Cards « bientôt disponible » → muted.

**Règle produit :** sans liseré = **baseline conforme**. Avec liseré = **enrichissement éventuel**, jamais prérequis pour la conformité à la charte.

### Definition of Done — P3 (si acté)

- Composant `InstrumentCardAccent` (ou équivalent) documenté et utilisé de façon homogène.
- Mapping tone → couleur documenté ; aucune card n’introduit de contour structurel hors ce système.

---

## 8. Ordre d’exécution recommandé

1. **P0** (1 j) : corrections Business erreur, doc chrome, décisions Certifié / liseré / footer vide.
2. **P1.1** — Cards « synthèse compacte » (variante A) : Taxes, Notes de crédit, Remboursements (même pattern, peu de logique).
3. **P1.2** — Cards « analytique dense » (variante B) : Encours, EBE, BFR, Paiements (TreasuryCardWithPolling), puis Points de vente.
4. **P2** — Z de caisse (refonte courte).
5. **P3** — Si acté : liseré normalisé sur toutes les cards.

---

## 9. Grille de conformité (rappel charte §11)

Après mise en œuvre, chaque card doit satisfaire :

1. Silhouette identique aux autres.
2. Accent latéral (si présent) selon règle commune.
3. Header structure gauche/droite.
4. Titre aligné à gauche.
5. KPI principal à droite quand il existe.
6. Aucune action parasite en header.
7. Footer contextuel, non actionnel.
8. Actions métier dans le body uniquement.
9. Couleur sans casser la structure commune.
10. Card lisible comme membre de la même famille.

---

## 10. Fichiers impactés (résumé)

| Fichier | Phase | Modification principale |
|---------|-------|-------------------------|
| `InstrumentCardChrome.tsx` | P0, P3 | Doc, optionnel InstrumentCardAccent |
| `BusinessCard.tsx` | P0 | Suppression border-l état erreur |
| `EncoursCard.tsx` | P1 | Chrome commun + footer |
| `TreasuryCardWithPolling.tsx` | P1 | Chrome commun + footer |
| `EbeCard.tsx` | P1 | Chrome commun + badge Proxy + footer |
| `WorkingCapitalCard.tsx` | P1 | Refonte header (titre court, pas de bouton Détail) + footer |
| `TaxesCard.tsx` | P1 | Chrome commun + footer |
| `CreditNotesCard.tsx` | P1 | Chrome commun + footer |
| `RefundsCard.tsx` | P1 | Chrome commun + footer |
| `PosShopsView.tsx` | P1 | Chrome commun + footer |
| `PosComingSoonView.tsx` | P2 | Header standard + body non centré |

Les wrappers `*WithPolling` n’ont pas besoin d’être modifiés tant que les props des cards sous-jacentes restent compatibles (éventuellement déprécier `footer` slot si le footer est désormais géré en interne).

---

## 11. Risques et points de vigilance

Ces points aident à **défendre la charte dans le temps** et à éviter les régressions silencieuses.

- **Dérive de variantes locales** : malgré le chrome commun, des écarts (titres longs, sous-titres en header, radius ou padding locaux) peuvent réapparaître par instrument. Rester strict sur la règle « header = identité courte, body = contenu ».
- **Réintroduction d’actions dans le header** : lors d’évolutions fonctionnelles, risque de rajouter un bouton « Rafraîchir », « Détail » ou CTA en header. Rappel : aucune action parasite en header ; actions métier dans le body uniquement.
- **Faux footers** : remplir visuellement le bas des cards avec un footer factice (« Module à venir », « À venir », etc.) au lieu de laisser absent quand il n’y a pas de contexte utile. Préférer **pas de footer** à un footer non informatif.
- **Badges non documentés** : création de badges locaux (couleur, libellé) non alignés avec le système InstrumentCardStatusBadge et les sévérités documentées. Tout nouveau badge doit être soit un usage du système commun, soit documenté comme exception.
- **Retour de contours spécifiques** : via états erreur / warning / loading, réintroduction de `border-l-*` ou de barres colorées dans le header. La baseline est **contour commun pour tous les états** ; la sémantique reste dans le contenu (badge, couleur du KPI, body).

---

## 12. Décisions recommandées (arbitrage produit)

Pour débloquer la mise en œuvre sans laisser flotter les décisions, l’arbitrage suivant peut être acté :

| Décision | Recommandation |
|----------|----------------|
| **Certifié (Business)** | Supprimer sauf preuve forte qu’il sert la compréhension. |
| **Liseré gauche** | Rester **sans liseré** pour le moment ; P3 seulement si décision produit explicite. |
| **Footer sur états vides** | **Facultatif** ; absent si aucune métadonnée utile. |
| **BFR** | Titre court en header (`BFR`) ; explicitation (Besoin en fonds de roulement, cycle) dans le body. |
| **Paiements** | Supprimer définitivement tout bouton « Rafraîchir » si encore présent. |

---

*Plan d’implémentation v1.0 — Charte commune des cards Linky — 14 mars 2026*
