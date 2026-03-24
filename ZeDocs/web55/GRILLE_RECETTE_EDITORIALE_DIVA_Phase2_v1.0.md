# Grille de recette éditoriale — Diva Phase 2

**Date** : 16 mars 2026  
**Artefact** : DM2-6  
**Version payload** : FactsPack 2.0.0 (headline_candidate + top 3 facts + top 2 alerts)  
**System prompt** : contrôleur de gestion senior (Phase 2)

---

## Critères de la grille

| # | Critère | Attendu |
|---|---------|---------|
| C1 | Ton factuel | Aucun conseil, prescription, injonction |
| C2 | Absence d'anglicismes interdits | Aucun terme de la liste `forbiddenTerms` / `englishDetect` |
| C3 | Pas de calcul autonome | Le LLM n'invente pas de valeurs non fournies dans le payload |
| C4 | Ancrage cartes disponibles | Les inducteurs cités sont dans les cartes transmises |
| C5 | Headline ≤ 140 caractères | Troncature évitée |
| C6 | Gouvernance couverte | Statuts `watch`/`alert` reflétés dans headline ou to_check |
| C7 | Vocabulaire conforme | "représente", "s'élève à", "écart de", "non rapproché", ratios présents |
| C8 | Format JSON valide | Retour parseable, 4 champs présents |

---

## Insight 1 — sarl-la-platine / company 1 / janv. 2026 (1ère génération)

**Headline :** "Le solde de trésorerie net après impôts s'élève à 4 500 €, l'activité commerciale totale (48 000 €) dépasse ce montant de plus de 35 500…"  
**what_i_see :**  
- "Le solde net de trésorerie après impôts est de 4 500 €."  
- "L'activité commerciale totale (48 000 €) dépasse le solde net de trésorerie (4 500 €) d'une somme supplémentaire de 43 500 €."  
- "Les taxes (9 200 €) representent un pourcentage élevé de 19,2% du chiffre d'affaires."  

**to_check :**  
- "Gouvernance : absence de validation bancaire"  
- "Gouvernance : ratio des charges fiscales élevé"  

| Critère | Résultat | Note |
|---------|----------|------|
| C1 – Ton factuel | ✅ | Pas de prescription |
| C2 – Anglicismes | ✅ | — |
| C3 – Pas de calcul autonome | ⚠️ | "43 500 €" est une recalculation du modèle (attendu : 35 500 € fourni dans le fact écart) |
| C4 – Ancrage cartes | ✅ | cash, taxes, business présents |
| C5 – Headline ≤ 140 | ⚠️ | Headline tronqué ("…") — maxHeadlineChars atteint |
| C6 – Gouvernance | ✅ | treasury_validated_pct=alert dans to_check |
| C7 – Vocabulaire | ⚠️ | "pourcentage élevé" = qualificatif non chiffré interdit (règle 5) |
| C8 – JSON valide | ✅ | — |

**Bilan I1 : 5/8 ✅ — 3 non-conformités mineures**

---

## Insight 2 — sarl-la-platine / company 1 / janv. 2026 (2e appel, cache différent)

**Headline :** "La trésorerie nette post-impôts est inférieure de 32 700 € à l'activité commerciale…"

| Critère | Résultat | Note |
|---------|----------|------|
| C1 – Ton factuel | ✅ | — |
| C2 – Anglicismes | ✅ | — |
| C3 – Pas de calcul autonome | ⚠️ | "32 700 €" n'est pas dans les facts envoyés (attendu : 35 500 € ou 43 500 €) |
| C4 – Ancrage cartes | ✅ | — |
| C5 – Headline ≤ 140 | ✅ | — |
| C6 – Gouvernance | ✅ | alerts reflétés |
| C7 – Vocabulaire | ✅ | "inférieure de" acceptable |
| C8 – JSON valide | ✅ | — |

**Bilan I2 : 7/8 ✅ — 1 non-conformité (recalcul autonome)**

---

## Insight 3 — laplatine2026 / company 2 / fév. 2026

**Headline :** "La trésorerie nette après impôts est inférieure de 16 200 € à l'activité commerciale totale de 22 000 €"  
**what_i_see :**  
- "L'écart entre la trésorerie de 5 800 € et l'activité commerciale de 22 000 € s'élève à 16 200 €"  
- "Les taxes de 4 100 €, qui représentaient 18,6% du chiffre d'affaires, ont contribué à ce déficit"  

**to_check :**  
- "Gouvernance : la trésorerie inférieure à attendus"

| Critère | Résultat | Note |
|---------|----------|------|
| C1 – Ton factuel | ✅ | Pas de prescription |
| C2 – Anglicismes | ✅ | — |
| C3 – Pas de calcul autonome | ✅ | 16 200 = 22 000 - 5 800 ← fourni dans le fact |
| C4 – Ancrage cartes | ✅ | — |
| C5 – Headline ≤ 140 | ✅ | — |
| C6 – Gouvernance | ⚠️ | "la trésorerie inférieure à attendus" — formulation vague ; status_reason non reflété précisément |
| C7 – Vocabulaire | ✅ | "s'élève à", "représentaient X%" |
| C8 – JSON valide | ✅ | — |

**Bilan I3 : 7/8 ✅ — 1 non-conformité (reformulation gouvernance imprécise)**

---

## Insight 4 — o19 / company 5 / janv. 2026 (POS + alertes)

**Headline :** "Le solde net de trésorerie après impôts ne représente que 400 €, contre 18 500 € d'activité commerciale totale qui n'a pas été validée…"  
**what_i_see :**  
- "Le solde net de trésorerie après impôts est de 400 €."  
- "L'écart entre le total des activités commerciales (18 500 €) et le solde de trésorerie (3 200 €) s'élève à 15 300 €."  
- "Toutes les facturations proviennent exclusivement du POS, aucune facturation classique n'a été enregistrée."  

**to_check :**  
- "Il y a une absence de validation bancaire des sessions."  
- "Il n'y a pas de rapprochement des données de santé bancaire."

| Critère | Résultat | Note |
|---------|----------|------|
| C1 – Ton factuel | ✅ | Pas de prescription |
| C2 – Anglicismes | ✅ | — |
| C3 – Pas de calcul autonome | ✅ | 15 300 = 18 500 - 3 200 ← fourni dans le fact |
| C4 – Ancrage cartes | ✅ | POS bien intégré |
| C5 – Headline ≤ 140 | ⚠️ | Tronqué ("…") |
| C6 – Gouvernance | ✅ | Alertes reflétées |
| C7 – Vocabulaire | ⚠️ | "Il y a une absence / Il n'y a pas de" — formulation maladroite ; préférer "Absence de validation" |
| C8 – JSON valide | ✅ | — |

**Bilan I4 : 6/8 ✅ — 2 non-conformités mineures**

---

## Insight 5 — sarl-la-platine / company 3 / déc. 2025 (credit_notes + rapprochement partiel)

**Headline :** "La position nette de trésorerie post-taxes s'élève à 13 200 €, avec un écart entre les 110 000 € d'activité commerciale totale et le…" (tronqué)  
**what_i_see :**  
- "L'activité commerciale totale de 110 000 € dépasse le solde de trésorerie de 28 000 € d'un écart de 82 000 €"  

**to_check :**  
- "Point d'attention : absence de notes de crédit"  
- "Point d'attention : possible rapprochement partiel"

| Critère | Résultat | Note |
|---------|----------|------|
| C1 – Ton factuel | ✅ | — |
| C2 – Anglicismes | ✅ | — |
| C3 – Pas de calcul autonome | ✅ | 82 000 = 110 000 - 28 000 ✅ ; 13 200 = 28 000 - 18 000 + 3 200 ✅ |
| C4 – Ancrage cartes | ✅ | — |
| C5 – Headline ≤ 140 | ⚠️ | Tronqué ("…") |
| C6 – Gouvernance | ⚠️ | "possible rapprochement partiel" : "possible" atténue une réalité factuelle (72 % validé = rapprochement partiel, pas "possible") |
| C7 – Vocabulaire | ✅ | "s'élève à", "dépasse", "écart de" |
| C8 – JSON valide | ✅ | what_i_see n'a qu'1 ligne (attendu 3 min) — JSON valide mais contenu insuffisant |

**Bilan I5 : 5/8 ✅ — 3 non-conformités (headline tronqué, gouvernance atténuée, what_i_see insuffisant)**

---

## Synthèse de recette

| Critère | I1 | I2 | I3 | I4 | I5 | Taux |
|---------|----|----|----|----|-----|------|
| C1 – Ton factuel | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| C2 – Anglicismes | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| C3 – Pas de calcul autonome | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | 3/5 |
| C4 – Ancrage cartes | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| C5 – Headline ≤ 140 | ⚠️ | ✅ | ✅ | ⚠️ | ⚠️ | 2/5 |
| C6 – Gouvernance | ✅ | ✅ | ⚠️ | ✅ | ⚠️ | 3/5 |
| C7 – Vocabulaire | ⚠️ | ✅ | ✅ | ⚠️ | ✅ | 3/5 |
| C8 – JSON valide | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |

**Score global : 31/40 (77,5 %)**

---

## Non-conformités récurrentes et actions

| Non-conformité | Fréquence | Sévérité | Action recommandée |
|---------------|-----------|----------|--------------------|
| Headline tronqué (> 140 chars) | 3/5 | Faible | Renforcer l'instruction "headline 1 phrase courte ≤ 100 caractères" dans le prompt |
| Recalcul autonome (C3) | 2/5 | Modérée | Renforcer la règle "utilise UNIQUEMENT les valeurs fournies" + vérifier que l'écart est explicitement dans les facts envoyés |
| Qualificatif non chiffré ("élevé", "possible") | 2/5 | Faible | Ajouter au vocabulaire interdit côté prompt, ou intercepter côté code dans `validateAndBuildFlash` |
| Gouvernance imprécise en to_check | 2/5 | Faible | Passer le `status_reason` brut comme texte de l'alert dans le payload — le modèle a tendance à le paraphraser approximativement |

---

## Verdict Phase 2 — DM2-6

- C1 (ton factuel) et C2 (anglicismes) : **100 % conformes** — le filtre code (`forbiddenTerms`, `englishDetect`) et le prompt jouent leur rôle.
- C8 (JSON valide) : **100 % conformes** — parsage stable.
- C3 (pas de calcul autonome) : **60 %** — recalcul de valeurs non transmises dans 2/5 cas. Correctif attendu en Phase 3A ou lors d'une itération prompt.
- C5 (headline ≤ 140) : **40 %** — headline souvent trop long. La troncature en aval (`sanitizeHeadline`) évite l'affichage cassé, mais la phrase est coupée.

**Grille de recette Phase 2 validée** — non-conformités documentées, aucune bloquante pour le gate.

---

**Artefact** : `GRILLE_RECETTE_EDITORIALE_DIVA_Phase2_v1.0.md`  
**Statut** : DM2-6 Done  
**Produit par** : exécution automatisée Phase 2 — mars 2026
