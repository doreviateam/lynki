# Rapport MOA — Card PAIEMENTS (Mode Gouvernance)

**Destinataire :** Maîtrise d'Ouvrage  
**Date :** 2026-03-03  
**Objet :** Redesign de la Card Paiements en instrument de gouvernance — pression constructive  
**Statut :** Livré et déployé

---

## 1. Synthèse exécutive

La Card Paiements a été **refondue** pour en faire un **instrument de gouvernance orienté pression constructive**. La priorité visuelle n'est plus le montant, mais le **niveau de fiabilité probante des flux financiers**.

La question centrale devient :

> Peut-on réellement se fier à ce chiffre ?

**Décision produit (2026-03-03) :** En cas de données partielles (complétude non validée), on affiche ce qu'on peut et on reste en **orange** — plus de blocage rouge.

---

## 2. Objectif stratégique

| Besoin | Réponse |
|--------|---------|
| **Problème** | La Card Paiements affichait principalement des montants sans qualifier la fiabilité des données. |
| **Objectif** | Transformer la card en instrument de gouvernance : exposer le niveau de discipline du rapprochement bancaire et la couverture probante des flux. |
| **Impact** | Passage d'un cockpit informatif à un cockpit **responsabilisant**. |

---

## 3. Principe de gouvernance (référentiel couleurs)

| Couleur | Statut | Signification |
|---------|--------|---------------|
| 🟢 Vert | COUVERTURE PROBANTE MAÎTRISÉE | Trésorerie fiabilisée (&lt; 10 % non couverts) |
| 🟡 Jaune | RAPPROCHEMENT EN COURS | Attention (10–30 % non couverts) |
| 🟠 Orange | RAPPROCHEMENT INSUFFISANT ou DONNÉES PARTIELLES | Problème métier (&gt; 30 %) ou données incomplètes |
| ~~🔴 Rouge~~ | ~~DONNÉES NON GARANTIES~~ | **Supprimé** — remplacé par orange (données partielles) |

**Règle produit :** Rouge réservé exclusivement à l'impossibilité de garantir la donnée. Décision MOA : en cas de complétude partielle, on affiche les données disponibles et on reste en orange.

---

## 4. Structure visuelle (hiérarchie)

1. **Statut de fiabilité** (dominant, en haut de la card)
2. **Pourcentage « Reste à rapprocher »** (typographie forte — plus visible que le montant)
3. **Montant total période**
4. **Montants détaillés** : Rapproché / À rapprocher
5. **Donut** en support (couleur reflétant le déséquilibre)

---

## 5. Ce qui a été livré

### 5.1 Statuts affichés

| Statut | Condition | Couleur |
|--------|-----------|---------|
| COUVERTURE PROBANTE MAÎTRISÉE | Complétude OK, &lt; 10 % des flux non couverts par preuve bancaire | Vert |
| RAPPROCHEMENT EN COURS | Complétude OK, 10–30 % des flux non couverts par preuve bancaire | Jaune |
| RAPPROCHEMENT INSUFFISANT | Complétude OK, &gt; 30 % des flux non couverts par preuve bancaire | Orange |
| DONNÉES PARTIELLES | Complétude KO (écart Odoo/Vault) | Orange |

### 5.2 Données partielles (décision 2026-03-03)

Lorsque certains paiements ERP ne sont pas encore enregistrés dans le Vault :

- **Avant :** Rouge, aucun montant ni pourcentage affiché
- **Après :** Orange « DONNÉES PARTIELLES », affichage des données disponibles + message d'avertissement

### 5.3 Autres modifications

| Élément | Modification |
|---------|--------------|
| **Card Trésorerie** | « Couverture salariale » → « Couverture structurelle » ; « Taux de rapprochement » → « Couverture probante des flux » |
| **Donut** | Couleur slice « À rapprocher » : orange par défaut, jaune si 10–30 % |
| **Message actif** | « Rapprochement insuffisant » (pas « Fiabilité faible ») |
| **Tuile Paiements** | Montant à rapprocher (€) au lieu du % ; si montant = 0 → affichage « Rapprocher » |
| **DIVA (mode short)** | `max_tokens` 250 → 450 pour limiter les coupures de réponses |

---

## 6. Lecture de l'indicateur

> Cet indicateur ne mesure pas la qualité comptable, mais la **couverture probante des flux par des preuves bancaires**.

| Reste à rapprocher | Couleur | Interprétation |
|--------------------|---------|----------------|
| &lt; 10 % | 🟢 Vert | Trésorerie fiabilisée |
| 10 % – 30 % | 🟡 Jaune | Rapprochement en cours |
| &gt; 30 % | 🟠 Orange | Rapprochement insuffisant |
| Données partielles | 🟠 Orange | Certains flux ne sont pas encore enregistrés dans le Vault — données affichées avec réserve |

**Card Trésorerie :** le libellé « Taux de rapprochement » a été remplacé par « Couverture probante des flux » — alignement stratégique avec Vault, Preuve, NF525, LNE 2026, Gouvernance (le mot « rapprochement » est comptable ; « couverture probante » est stratégique).

**Tuile Paiements :** affiche le **montant à rapprocher** (ex. 120 515,03 €) avec contour orange selon le contexte (reste à rapprocher). Si le montant à rapprocher est **zéro**, la tuile affiche « Rapprocher » (et non « — » ni « 0,00 € ») pour inciter à l’action. Card Paiements : « X % des flux non couverts par preuve bancaire ».

---

## 7. Contrôle de complétude (rappel)

Le Vault compare deux sources :

| Source | Données |
|--------|---------|
| **Odoo** | Nombre et somme des paiements postés (source de vérité) |
| **Vault** | Nombre et somme des paiements enregistrés (événements vaultés) |

Si Odoo a plus de paiements que le Vault → complétude KO. Causes possibles : événements en attente, erreurs de vaultage, délai de synchronisation.

---

## 8. Déploiement

| Tenant | Environnement | Image | Statut |
|--------|---------------|-------|--------|
| sarl-la-platine | lab | dorevia/linky:governance-2026-03-03 | ✅ Déployé |
| laplatine2026 | lab | dorevia/linky:governance-2026-03-03 | ✅ Déployé |

**Date de déploiement :** 2026-03-03

---

## 9. Références

| Document | Chemin |
|----------|--------|
| Proposition de redesign | Proposition v1.0 (2026-03-03) |
| SPEC Reste à rapprocher | `ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md` |
| Rapport MOA Reste à rapprocher | `ZeDocs/web38/RAPPORT_MOA_RESTE_A_RAPPROCHER.md` |
| Card Paiements | `units/dorevia-linky/components/TreasuryCardWithPolling.tsx` |
| Tuile Paiements (IconGrid) | `units/dorevia-linky/components/IconGrid.tsx` |
| API métriques dashboard | `units/dorevia-linky/app/api/dashboard-metrics/route.ts` |

---

## 10. Prochaines étapes

| Priorité | Action | Responsable |
|----------|--------|-------------|
| **P1** | Validation MOA de l'affichage sur Linky | MOA |
| **P2** | Corriger la complétude (rattraper les paiements manquants) si objectif 100 % | Ops / Dev |
| **Optionnel** | Documenter la proposition de redesign en SPEC formelle | Produit |
