# Avis et analyse — SPEC_DIVA_v2_Copilote_CODIR

**Document évalué** : `SPEC_DIVA_v2_Copilote_CODIR.md` v2.1  
**Date** : 2026-02-17  
**Références** : `units/diva/` (mistral/client.go, models/models.go), `units/dorevia-linky/components/DivaFlashBlock.tsx`

---

## 1. Avis général

La spec est **claire, bien structurée et alignée sur le positionnement « copilote CODIR »**. Elle définit une **forme éditoriale** (lecture narrative, liste factuelle, confiance) compatible avec la structure JSON existante — aucune évolution d’architecture requise.

| Critère | Appréciation |
|---------|--------------|
| **Cadre éditorial** | ✅ Bien défini — ton, interdictions, exemple conforme |
| **Cohérence interne** | ✅ Les 3 sections (A, B, C) sont complémentaires et non redondantes |
| **Compatibilité SMS** | ✅ Section A utilisable seule, B pour traçabilité, C pour prudence |
| **Portée** | ✅ Forme éditoriale uniquement — architecture v1 conservée |

---

## 2. Portée : forme éditoriale uniquement (architecture inchangée)

**Précision produit** : la spec v2 vise une évolution **éditoriale**, pas architecturale. On conserve le modèle de données et l’API actuels.

### 2.1 Mapping spec → structure existante

| Spec v2 (forme) | Champ existant | Adaptation |
|-----------------|----------------|------------|
| **A. Lecture narrative** (3–5 phrases) | `headline` | Remplir avec un paragraphe narratif au lieu d’une phrase courte |
| **B. Données utilisées** (liste KPI : valeur) | `what_i_see` | Format factuel « KPI : valeur unité » |
| **C. Niveau de confiance** (phrase + justification) | `confidence` | Enum inchangé ; justification intégrée au `headline` ou affichage existant |
| Pistes, points à vérifier | `to_check` | Conservé tel quel |

**Changements requis** :
- Adapter le **prompt Mistral** pour produire un contenu conforme à la forme v2 dans la structure JSON existante.
- Augmenter `max_tokens` (ex. 400) pour permettre 3–5 phrases dans `headline`.
- Adapter **DivaFlashBlock** : paragraphe A (multiline), séparateur, « Données utilisées » compact, badge (voir §4.6).

### 2.2 Contraintes Mistral

- **max_tokens** : passer de 256 à ~400 pour le paragraphe narratif.
- **Prompt** : très structuré, très contraint, très formaté (Mistral 7B peut répéter, tourner en rond, alourdir les phrases).
- **Fallback JSON strict** : conserver la logique actuelle (extraction, validation, `fallbackFlash()`).

---

## 3. Points forts de la spec

1. **Posture claire** : « Copilote qui met en récit », pas auditeur ni conseiller. Les interdictions (pas d’hypothèse causale, pas de conseil) sont explicites.

2. **Exemple conforme** : L’exemple §5 démontre bien le style attendu — verbes neutres (« s’établit », « atteint », « demeure »), liaison entre indicateurs (« ce qui signifie que… »).

3. **Traçabilité** : La section B garantit que les chiffres affichés sont identifiables. Important pour la conformité et l’audit.

4. **Compatibilité SMS/Email** : La section A seule est envoyable — critère de design pertinent pour un envoi automatique futur.

5. **Hors scope v2** : Paramétrage détail, style par profil, alertes — bien délimité pour éviter le scope creep.

---

## 4. Risques et recommandations

### 4.1 Risque modèle (Mistral 7B)

Mistral 7B Q4 peut :
- **Répéter** les mêmes formulations
- **Tourner en rond** sans progression
- Produire des **phrases lourdes** ou maladroites

**Mesures obligatoires** : Le prompt doit être **très structuré**, **très contraint** et **très formaté** pour canaliser le modèle. Conserver le **fallback JSON strict** (regex, extraction du bloc `{...}`, validation, sanitization) — ne pas s’en départir.

### 4.2 Parsing JSON

- Conserver le fallback JSON strict existant (extraction, `fallbackFlash()` en cas d’échec).

### 4.3 Contrôle taille (prompt, pas backend)

- **Supprimer** toute troncature backend — un truncate silencieux peut casser une phrase.
- Le prompt cadre : **max 5 phrases, max 900 caractères** pour la lecture narrative. Le token cap ne discipline pas toujours la prose.
- **Recommandation** : `max_tokens: 400` ; si le prompt produit ~220 tokens réels, la latence reste proche de v1. Levier : prompt précis → sortie compacte.

### 4.4 Format `what_i_see` (section B)

- La spec demande « KPI : valeur + unité », une ligne par KPI max, pas de phrase complète.
- **Recommandation** : Indiquer dans le prompt un format canonique (ex. « Trésorerie disponible : 1 400 952 € »). Les labels des cartes (`Card.Label`) servent de base.

### 4.5 Champ `to_check`

- Règle éditoriale : **factuel, non prescriptif**. Interdit « Il serait pertinent de… », injonctions, conseils. Formuler en « À vérifier : … » ou « Piste : … » uniquement. **Si aucune piste factuelle détectable, laisser vide** — ne pas inventer pour remplir.

### 4.6 Affichage UI

**Structure visuelle recommandée** — ne pas faire un bloc énorme :

1. **Paragraphe principal** (A / headline) — lecture narrative
2. **Ligne de séparation légère**
3. **« Données utilisées »** en petit texte compact (`what_i_see`)
4. **Badge confiance** (`confidence`)

Propre. Lisible. Pas bavard.

---

## 5. Plan d’implémentation (forme éditoriale uniquement)

| Phase | Tâche | Effort |
|-------|-------|--------|
| **1** | Réécrire le prompt Mistral (très structuré, contraint, formaté) selon v2 + fallback JSON strict conservé | 1 j |
| **2** | Supprimer truncate backend (aucune limite), max_tokens 400, prompt : max 5 phrases / 900 car., UI multiline | 0.25 j |
| **3** | Adapter DivaFlashBlock : paragraphe A, séparateur léger, « Données utilisées » compact, badge | 0.25 j |
| **4** | Tests manuels sur cas réels (sarl-la-platine) | 0.5 j |

**Total estimé** : 2 j. Pas de modification d’API ni de modèle de données.

---

## 6. Conclusion

La spec v2 est **solide et prête pour l’implémentation**. En limitant la portée à la **forme éditoriale** (sans changement d’architecture), l’effort se réduit à une réécriture du prompt Mistral et un ajustement de `max_tokens`.

**Recommandation** : Valider la spec en l’état, puis implémenter en ~2 j (prompt + UI compacte).

---

## 7. Checklist implémentation

- [ ] Valider la spec éditoriale
- [ ] Ne pas casser le JSON v1
- [ ] Supprimer truncate backend sur headline (aucune limite côté code)
- [ ] Adapter prompt + max_tokens (400), règle : max 5 phrases, max 900 car.
- [ ] UI : bloc multiline pour paragraphe A
- [ ] Adapter UI
- [ ] Tester sur données réelles
- [ ] Cache awareness : tester avec force_refresh après déploiement (cache TTL 5 min masque les nouvelles réponses sinon)
