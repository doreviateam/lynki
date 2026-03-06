# Plan d'implémentation — Règles d'inférence DIVA (Cockpit vs Focus Card)

**Version :** 1.0  
**Date :** 2026-02-18  
**Référence :** `SPEC_REGLES_INFERENCE_DIVA_v1.0.md` (v1.1), `RECOMMANDATIONS_GOUVERNANCE_INFERENCE_DIVA_v1.1.md`

**Objectif :** Corriger les dérives d'analyse (extrapolation, confusion cockpit/carte, interprétation erronée des montants négatifs) en cloisonnant strictement le périmètre d'analyse selon le mode et la carte.

---

## 1. Vue d'ensemble

| Phase | Périmètre | Estimation | Priorité |
|-------|-----------|------------|----------|
| **Phase 1** | Prompt différencié (cockpit vs focus_card) | 1–2 j | Immédiat |
| **Phase 2** | Extension prewarm Focus Card | 0,5–1 j | Après Phase 1 |
| **Phase 3** | Filtre post-Mistral (si nécessaire) | 0,5 j | Optionnel / ultérieur |
| **Phase 4** | Test E2E conformité sémantique | 0,5 j | Recommandé |

**Principe d'universalité :** Toutes les règles s'appliquent à **toutes les cartes** (treasury_validated_pct, cash, business, taxes, credit_notes, refunds, pos_shops, pos_z) dans leur contexte respectif.

---

## 2. Phase 1 — Prompt différencié (priorité absolue)

**Fichier cible :** `units/diva/internal/mistral/client.go`

### P1.1 — Section « Mode Focus Card » dans le system prompt

**Estimation :** 0,5 j

**Tâches :**
- Ajouter une section explicite « Mode Focus Card » après la section « Structure narrative (mode cockpit) » dans `systemPrompt`
- Inscrire les règles §3.2 de la SPEC :
  - Autoriser : interprétation du signe, mise en perspective relative au volume, explication comptable simple, mention des données explicitement présentes
  - Interdire : référence trésorerie validée (sauf carte treasury_validated_pct), rapprochement bancaire (sauf treasury_validated_pct ou payload avec champ validation), extrapolation globale, conclusion fiabilité générale, indicateurs absents du périmètre
- Rappeler la hiérarchie : « Analyse uniquement la carte affichée. N'intègre pas des indicateurs absents du périmètre. »

**Critères d'acceptation :**
- [ ] Le system prompt distingue clairement cockpit vs focus_card
- [ ] Les interdictions Focus Card sont explicites
- [ ] Les règles §4.1, §4.2, §4.3 sont référencées (montant négatif, absence de données, rapprochement bancaire)

---

### P1.2 — Instruction utilisateur selon le mode

**Estimation :** 0,5 j

**Tâches :**
- Modifier `buildUserPrompt` pour ajouter une instruction utilisateur **dynamique** selon `mode` :
  - **mode cockpit :** conserver l'instruction actuelle (synthèse transversale, priorise point critique, relie indicateurs, conclus sur certification)
  - **mode card :** remplacer par une instruction spécifique Focus Card :
    - « Analyse uniquement cette carte. Interprète le signe et les montants dans le contexte de la carte (ex. pour refunds : flux fournisseurs − clients = sortie ou entrée nette). N'évoque pas la trésorerie validée ni le rapprochement bancaire sauf si la carte est Trésorerie validée. Un montant négatif = sortie ou régularisation, jamais absence de flux ni déficit global. »
- S'assurer que l'instruction card mentionne le `focus_card_key` si pertinent (pour adapter le vocabulaire : refunds → remboursements, credit_notes → avoirs, etc.)

**Critères d'acceptation :**
- [ ] L'instruction cockpit reste inchangée fonctionnellement
- [ ] L'instruction card est distincte et injectée uniquement quand `mode == "card"`
- [ ] La règle « montant négatif » est intégrée dans l'instruction card

---

### P1.3 — Exemple Focus Card (refunds)

**Estimation :** 0,25 j

**Tâches :**
- Ajouter dans le system prompt un bloc « Exemple Focus Card (refunds) » :
  - Données : value = −1686, focus_card_details = { clients: 500, fournisseurs: 2186, flux: −1686 }
  - Réponse attendue : « Flux net négatif de 1 686 € : les remboursements fournisseurs dépassent les remboursements clients. Sortie nette de trésorerie liée aux remboursements. »
  - Réponse interdite : « Trésorerie validée nulle », « rapprochement bancaire », « cycle POS », « déficit global », « absence de flux »

**Critères d'acceptation :**
- [ ] L'exemple est intégré dans le system prompt
- [ ] L'exemple illustre explicitement les interdictions

---

### P1.4 — Règle §4.3 : rapprochement bancaire par carte

**Estimation :** 0,25 j

**Tâches :**
- Intégrer dans l'instruction ou le system prompt la règle fine :
  - treasury_validated_pct : autorisé (carte dédiée)
  - cash : interdit (focus_card_details = encaissements, decaissements, net → pas de champ validation)
  - Toutes les autres : interdit
- Option : injecter une ligne conditionnelle dans l'instruction selon `focus_card_key` : si `focus_card_key != "treasury_validated_pct"` → « Ne mentionne jamais le rapprochement bancaire. »

**Critères d'acceptation :**
- [ ] La carte Cash ne doit pas provoquer de mention du rapprochement bancaire
- [ ] La carte Trésorerie validée peut le mentionner

---

### Définition of Done Phase 1

- [ ] Tests manuels sur cockpit : pas de régression
- [ ] Tests manuels sur cartes refunds, cash, business : absence des termes interdits (trésorerie validée, rapprochement bancaire pour cartes non treasury, déficit global, cycle POS hors pos_shops)
- [ ] Montant négatif (ex. refunds −1686) interprété correctement (sortie nette, régularisation) et non comme absence de flux
- [ ] Code review, SPEC référencée dans les commentaires

---

## 3. Phase 2 — Extension prewarm Focus Card

**Fichiers cibles :**  
- `units/dorevia-linky/app/api/diva/prewarm/route.ts`  
- `units/dorevia-linky/components/DivaFlashBlock.tsx` (ou équivalent)

### P2.1 — Prewarm avec focus_card

**Estimation :** 0,5 j

**Tâches :**
- Modifier la route prewarm pour accepter un paramètre optionnel `focus_card` (card_key)
- Si 404 sur GET insight et mode card : déclencher POST `/diva/generate` avec `focus_card` dans le body (en plus du payload standard)
- S'assurer que le runner ou le prewarm envoie le payload adapté (une seule carte + focus_card_details si disponible)
- Limiter le déclenchement : 1 appel prewarm par contexte (cockpit ou card) pour éviter les boucles

**Critères d'acceptation :**
- [ ] 404 Focus Card refunds → POST /diva/generate avec mode=card, focus_card=refunds
- [ ] 404 cockpit → POST /diva/generate cockpit (inchangé)
- [ ] Pas de boucle de requêtes
- [ ] Insight disponible au refresh suivant (ou délai court)

---

### P2.2 — Alignement runner (si pertinent)

**Estimation :** 0,5 j (optionnel)

**Tâches :**
- Vérifier si le runner actuel alimente les cartes refunds, taxes, credit_notes, pos_shops, pos_z
- Si non : prioriser les cartes à fort usage ; étendre le runner ou le prewarm pour couvrir les cartes manquantes
- Référence : `PLAN_IMPLEMENTATION_DIVA_INSIGHTS_SCRUM.md` §8 « Étendre runner à 8 cartes »

**Critères d'acceptation :**
- [ ] Cartes couvertes par prewarm ou runner selon priorité produit
- [ ] Documentation à jour

---

## 4. Phase 3 — Filtre post-Mistral (optionnel)

**Recommandation :** Ne pas implémenter en première intention. Envisager uniquement si Phase 1 ne suffit pas après plusieurs itérations de prompt.

**Fichier cible :** `units/diva/internal/mistral/client.go` — `parseFlash` ou nouvelle fonction `validateSemantics(mode, focusCardKey, content)`

**Tâches (si activé) :**
- Définir une liste de termes interdits par carte (ex. refunds : trésorerie validée, rapprochement bancaire, cycle POS, déficit global)
- Après réception de la réponse Mistral : si `mode == "card"` et présence d'un terme interdit pour cette carte → fallback ou réécriture minimale
- Logger les occurrences pour analyse (amélioration prompt)

**Critères d'acceptation :**
- [ ] Filtre désactivé par défaut (feature flag)
- [ ] Pas de faux positifs sur des formulations légitimes

---

## 5. Phase 4 — Test E2E conformité sémantique

**Estimation :** 0,5 j

**Tâches :**
- Créer un script ou test E2E : payload Focus Card (ex. refunds) → POST /diva/generate → vérifier absence de termes interdits dans la réponse
- Termes à détecter selon carte (refunds) : trésorerie validée, rapprochement bancaire, déficit global, cycle POS, lecture globale
- Option : intégrer dans CI ou exécution manuelle périodique
- Référence : RECOMMANDATIONS_GOUVERNANCE §4 Q4

**Critères d'acceptation :**
- [ ] Script exécutable manuellement
- [ ] Au moins 1 carte couverte (refunds)
- [ ] Sortie : FAIL si terme interdit détecté, OK sinon

---

## 6. Dépendances et ordre d'exécution

```
Phase 1 (Prompt différencié)
   │
   ├─► P1.1 system prompt Mode Focus Card
   ├─► P1.2 instruction utilisateur selon mode
   ├─► P1.3 exemple refunds
   └─► P1.4 règle rapprochement par carte
         │
         └─► Tests manuels → validation produit
                    │
                    ├─► Phase 2 (Prewarm Focus Card) — si besoin UX
                    ├─► Phase 4 (Test E2E) — recommandé
                    └─► Phase 3 (Filtre) — uniquement si Phase 1 insuffisant
```

---

## 7. Fichiers impactés

| Fichier | Phase | Modifications |
|---------|-------|----------------|
| `units/diva/internal/mistral/client.go` | P1 | systemPrompt, buildUserPrompt |
| `units/dorevia-linky/app/api/diva/prewarm/route.ts` | P2 | paramètre focus_card, corps POST |
| `units/dorevia-linky/components/DivaFlashBlock.tsx` | P2 | appel prewarm avec focus_card si 404 |
| `scripts/test_diva_conformite_refunds.sh` (nouveau) | P4 | test sémantique |
| `ZeDocs/web23/INVENTAIRE_DONNEES_IA_PAR_CARTE.md` | — | Référence pour focus_card_details |

---

## 8. Risques et mitigation

| Risque | Mitigation |
|--------|------------|
| Régression cockpit | Conserver instruction cockpit inchangée ; tests manuels cockpit avant/après |
| Modèle ignore le prompt | Itérer sur formulation ; exemple concret ; Phase 3 en secours |
| Prewarm surcharge Mistral | Limiter 1 prewarm par contexte ; timeout court |
| Faux positifs filtre (Phase 3) | Désactivé par défaut ; liste de termes conservative |

---

## 9. Références

| Document | Rôle |
|----------|------|
| `SPEC_REGLES_INFERENCE_DIVA_v1.0.md` | Règles §3, §4, universalité |
| `RECOMMANDATIONS_GOUVERNANCE_INFERENCE_DIVA_v1.1.md` | Ordre phases, validation stratégique |
| `RECOMMANDATIONS_CONSOLIDATION_FOCUS_CARD_v1.2.md` | Hiérarchie produit |
| `RAPPORT_ANALYSE_REGLES_INFERENCE_DIVA_2026-02-18.md` | Causes, diagnostic |
| `INVENTAIRE_DONNEES_IA_PAR_CARTE.md` | focus_card_details par carte |
| `PLAN_IMPLEMENTATION_DIVA_INSIGHTS_SCRUM.md` | Contexte runner, prewarm existant |
