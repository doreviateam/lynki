# Rapport d'analyse — Règles d'inférence DIVA (Cockpit vs Focus Card)

**Version :** 1.0  
**Date :** 2026-02-18  
**Référence :** `SPEC_REGLES_INFERENCE_DIVA_v1.0.md`, screenshot Focus Card Remboursements  
**Objectif :** Identifier les causes des violations et proposer des recommandations avant implémentation

---

## 1. Résumé exécutif

Des erreurs d'analyse ont été observées en mode Focus Card (ex. carte Remboursements) : DIVA produit une analyse de type cockpit (trésorerie validée, rapprochement bancaire, fiabilité globale) alors que le périmètre est strictement limité à une carte individuelle.

**Cause racine identifiée :** Le prompt système et l'instruction utilisateur sont identiques pour les deux modes. Aucune règle spécifique n'encadre le mode Focus Card. Le modèle extrapole à partir du contexte cockpit intégré dans le prompt.

**Impact :** Perte de crédibilité, affirmations non démontrables, confusion pour l'utilisateur.

---

## 2. Analyse du screenshot (Focus Card — Remboursements)

### 2.1 Contexte

| Élément | Valeur |
|---------|--------|
| Mode | Focus Card |
| Carte | Remboursements (`refunds`) |
| Données | Remboursements clients : -1 686,84 € ; Fournisseurs : +0,00 € ; Total : -1 686,84 € |

### 2.2 Texte généré par DIVA (actuel)

> La trésorerie validée montre un déficit de 1 686,84 € sur la période, ce qui ne permet pas de confirmer aucun flux par rapprochement bancaire. Les montants de remboursements à clients et de flux d'affaires sont significatifs et cohérents, leur fiabilité étant conditionnée par le niveau de rapprochement des écritures. Le détail des transactions avec les fournisseurs n'est pas disponible, ce qui limite l'analyse du cycle POS. La lecture globale demeure partielle en l'état.

### 2.3 Violations par rapport à la SPEC

| § SPEC | Règle | Violation observée |
|--------|-------|--------------------|
| **§3.2 Interdit** | Référence à la trésorerie validée si non incluse | « La trésorerie validée montre un déficit » — la carte est Remboursements, pas Trésorerie |
| **§3.2 Interdit** | Mention du rapprochement bancaire (carte non validation) | « confirmer aucun flux par rapprochement bancaire » |
| **§3.2 Interdit** | Conclusion sur la fiabilité générale | « leur fiabilité étant conditionnée », « lecture globale partielle » |
| **§3.2 Interdit** | Indicateurs absents du périmètre | « flux d'affaires », « cycle POS » — hors carte Remboursements |
| **§4.1** | Montant négatif ≠ déficit global | -1 686,84 € = sortie (remboursement client), pas « déficit » |
| **§4.3** | Rapprochement bancaire uniquement si trésorerie validée présente | Remboursements n'inclut pas trésorerie validée |

### 2.4 Analyse du montant négatif

Pour la carte Remboursements, un montant négatif (-1 686,84 €) signifie :
- **Correct :** Sortie de trésorerie (remboursement vers les clients), diminution du poste, régularisation.
- **Incorrect :** Déficit global, absence de flux, défaut de confirmation bancaire.

DIVA a confondu le signe négatif du flux de remboursement avec un déficit de position.

---

## 3. Cause racine — Analyse technique

### 3.1 Flux actuel (mode card)

1. **buildUserPrompt** : `mode = "card"` ; `effective` = 1 seule carte (celle en focus) ; `focusCardDetails` = détails de la carte (ex. `refunds: { clients, fournisseurs, flux, currency }`).
2. **Instruction utilisateur** (identique cockpit/card) : « Produis une synthèse transversale. Priorise le point critique, relie les indicateurs entre eux, conclus sur le niveau de certification. »
3. **Prompt système** : Structure cockpit (constat, flux, limites, conclusion globale). Exemple cockpit intégré. Aucune section « Mode Focus Card ».

### 3.2 Problème

L'instruction et l'exemple du prompt poussent DIVA vers une analyse cockpit même lorsque le payload ne contient qu'une carte. Le modèle :
- Projette les règles cockpit (trésorerie, rapprochement) sur un contexte local ;
- Invente des indicateurs absents (« flux d'affaires », « cycle POS ») ;
- Confond montant négatif (flux) avec déficit (position).

### 3.3 Vérification payload

En mode card, le JSON envoyé à Mistral contient :
- `mode: "card"` ;
- `context` : tenant, company_id, dates, etc. ;
- `cards` : **1 seule carte** (ex. Remboursements avec value, formatted, label, unit) ;
- `details` : focus_card_details (ex. clients, fournisseurs, flux, currency pour refunds).

**Conclusion :** Le payload est correct (une carte + ses détails). Le problème vient du prompt et de l'instruction, pas des données.

---

## 4. Recommandations

### 4.1 Priorité 1 — Adapter le prompt (obligatoire)

**Action :** Différencier explicitement les deux modes dans le system prompt.

**Contenu à ajouter :**

```
Mode Focus Card (mode = "card") — RÈGLES SPÉCIFIQUES

Périmètre strict : tu analyses UNIQUEMENT la carte fournie. Aucun autre indicateur.

Autorisé :
- Interpréter le signe (positif = entrée, négatif = sortie / régularisation).
- Mettre en perspective le volume (ex. clients vs fournisseurs).
- Explication comptable simple (ex. remboursement client = sortie de caisse).

Interdit :
- Référence à la trésorerie validée (sauf si la carte est treasury_validated_pct).
- Mention du rapprochement bancaire (sauf si carte trésorerie).
- Conclusion sur la fiabilité globale.
- Mention d'indicateurs absents (cash, business, POS, taxes, etc.).
```

**Instruction utilisateur :** Adapter selon le mode.
- Cockpit : « Produis une synthèse transversale... » (actuel).
- Card : « Analyse strictement la carte fournie. N'évoque aucun autre indicateur. Interprète le signe et le volume. »

### 4.2 Priorité 2 — Exemples par carte (recommandé)

**Action :** Ajouter un exemple Focus Card dans le prompt pour la carte Remboursements.

**Exemple cible :**

> Les remboursements clients s'élèvent à 1 686,84 € en sortie sur la période. Les remboursements fournisseurs sont nuls. Il s'agit d'un flux de régularisation vers les clients.

Éviter toute mention de trésorerie, rapprochement, fiabilité, POS, business.

### 4.3 Priorité 3 — Règles d'interprétation §4.1 et §4.2

**Action :** Intégrer les règles dans le prompt.

- **§4.1 Montant négatif :** « Un montant négatif = sortie, diminution ou régularisation. Ne jamais le qualifier de déficit global ou d'absence de flux. »
- **§4.2 Absence de données :** « Si une donnée est absente : mentionner qu'elle n'est pas disponible. Ne pas en déduire une anomalie. »
- **§4.3 Rapprochement bancaire :** « Ne mentionner le rapprochement bancaire que si la carte est treasury_validated_pct ou si le contexte inclut explicitement une information de validation. »

### 4.4 Priorité 4 — Filtre post-Mistral (optionnel)

**Action :** En mode card, filtrer les phrases contenant des termes interdits (trésorerie validée, rapprochement bancaire, lecture globale, fiabilité globale) si la carte n'est pas treasury_validated_pct.

**Risque :** Faux positifs si le filtre est trop strict. À évaluer.

### 4.5 Priorité 5 — Génération des insights Focus Card

**Constat :** Le runner ne génère actuellement que pour `treasury_validated_pct`, `cash`, `business`. Les cartes `refunds`, `taxes`, `credit_notes`, `pos_shops`, `pos_z` ne sont pas pré-générées.

**Recommandation :** 
- Soit étendre le runner pour inclure les cartes manquantes (spec §7.4) ;
- Soit déclencher un prewarm ciblé quand l'utilisateur ouvre une Focus Card (404 → POST /diva/generate avec focus_card).

---

## 5. Questions ouvertes

### 5.1 Génération des insights Focus Card

**Q1 :** Comment l'insight pour la carte Remboursements (screenshot) a-t-il été généré ? Le runner ne couvre que treasury, cash, business. Existe-t-il un autre chemin (prewarm avec focus_card, explain/async, tests manuels) ?

**Q2 :** Faut-il étendre le prewarm pour accepter `focus_card` et déclencher une génération ciblée quand l'utilisateur ouvre une Focus Card (et reçoit 404) ?

### 5.2 Périmètre des cartes autorisant le rapprochement bancaire

**Q3 :** La carte `treasury_validated_pct` est la seule à autoriser explicitement la mention du rapprochement bancaire. La carte `cash` pourrait-elle inclure une info de validation (ex. dans `_details`) ? Si oui, faut-il autoriser une mention limitée du rapprochement pour cash ?

### 5.3 Validation E2E

**Q4 :** Souhaitez-vous un test E2E ou un script de conformité qui :
- Envoie un payload Focus Card (ex. refunds) à POST /diva/generate ;
- Vérifie que la réponse ne contient pas « trésorerie validée », « rapprochement bancaire », « déficit », « cycle POS », « flux d'affaires » (hors contexte refunds) ?

### 5.4 Priorisation implémentation

**Q5 :** Ordre d'implémentation préféré ?
- A) Prompt uniquement (rapide, à valider en conditions réelles)
- B) Prompt + filtre post-Mistral (plus robuste, risque faux positifs)
- C) Prompt + extension prewarm Focus Card (couverture complète des cartes)

---

## 6. Plan d'implémentation suggéré

| Étape | Action | Estimation |
|-------|--------|-------------|
| 1 | Créer `SPEC_REGLES_INFERENCE_DIVA_v1.0.md` (document de référence) | 0,5 h |
| 2 | Adapter le system prompt : section « Mode Focus Card » avec règles §3.2, §4.1, §4.2, §4.3 | 1 h |
| 3 | Différencier l'instruction utilisateur selon mode (cockpit vs card) dans `buildUserPrompt` | 0,5 h |
| 4 | Ajouter exemple Focus Card Remboursements dans le prompt | 0,5 h |
| 5 | Reconstruire DIVA, purger cache, tests manuels Focus Card | 0,5 h |
| 6 | (Optionnel) Filtre post-Mistral pour mode card | 1 h |
| 7 | (Optionnel) Extension prewarm pour focus_card | 1 h |

**Total minimale (étapes 1–5) :** ~3 h

---

## 7. Conclusion

Les violations observées sont structurelles et liées au prompt. Le payload est correct ; l'absence de règles spécifiques au mode Focus Card conduit le modèle à appliquer une logique cockpit inappropriée.

La mise à jour du prompt avec une section dédiée « Mode Focus Card » et une instruction différenciée constitue la priorité. Les options filtrage et extension prewarm peuvent être traitées dans un second temps selon les réponses aux questions ouvertes.

---

## 8. Validation stratégique

**Référence :** `RECOMMANDATIONS_GOUVERNANCE_INFERENCE_DIVA_v1.1.md`, `RECOMMANDATIONS_CONSOLIDATION_FOCUS_CARD_v1.2.md`

Les recommandations v1.1 et v1.2 valident le diagnostic et précisent l'ordre d'implémentation :
- **Phase 1 :** Prompt différencié uniquement (priorité absolue)
- **Phase 2 :** Extension prewarm Focus Card
- **Phase 3 :** Filtre post-Mistral uniquement si nécessaire (à éviter en première intention)

---

## 9. Annexes

### A. Documents liés

| Document | Rôle |
|----------|------|
| `SPEC_REGLES_INFERENCE_DIVA_v1.0.md` | Règles formelles cockpit vs Focus Card |
| `RECOMMANDATIONS_GOUVERNANCE_INFERENCE_DIVA_v1.1.md` | Validation stratégique, ordre des phases |
| `RECOMMANDATIONS_CONSOLIDATION_FOCUS_CARD_v1.2.md` | Consolidation Focus Card, hiérarchie produit (Card → Section → Cockpit) |

### B. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `units/diva/internal/mistral/client.go` | systemPrompt, buildUserPrompt |
| `ZeDocs/web23/INVENTAIRE_DONNEES_IA_PAR_CARTE.md` | Données par carte, focus_card_details |
| `units/diva/internal/hashinput/build.go` | buildFocusCardDetails (refunds: clients, fournisseurs, flux) |

### C. Cartes et autorisation rapprochement bancaire

| Carte | Autorise rapprochement bancaire ? | Détails |
|-------|-----------------------------------|---------|
| treasury_validated_pct | ✓ Oui | reconciled, unreconciled, total |
| cash | ❌ Non (sauf si détail validation ajouté) | encaissements, decaissements, net |
| business | ❌ Non | ventes, achats, net |
| taxes | ❌ Non | — |
| credit_notes | ❌ Non | clients, fournisseurs, flux |
| refunds | ❌ Non | clients, fournisseurs, flux |
| pos_shops | ❌ Non | — |
| pos_z | ❌ Non | — |

---

**Fin du rapport.**
