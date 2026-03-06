# Plan d'implémentation SCRUM — DIVA v2 (forme éditoriale)

**Version** : 1.0  
**Date** : 2026-02-17  
**Base** : `SPEC_DIVA_v2_Copilote_CODIR.md` v2.1, `AVIS_SPEC_DIVA_v2_Copilote_CODIR_2026-02-17.md`  
**Durée estimée** : 1 sprint (2 jours)  
**Contexte** : DIVA v1 opérationnel (`units/diva/`, proxy Linky, bloc UI). Évolution **éditoriale uniquement** — pas de modification d'API.  
**Équipe** : Dev / Plateforme  

---

## 0. Ajustements et contraintes

1. **JSON v1 conservé** : `headline`, `what_i_see`, `to_check`, `confidence` — aucun changement de contrat API.
2. **headline** : 3–5 phrases (paragraphe narratif). **Supprimer complètement** la troncature backend — aucune limite côté code. Le prompt impose : max 5 phrases, max 900 caractères.
3. **to_check** : Factuel, non prescriptif. Interdit « Il serait pertinent de… », injonctions. Formuler en « À vérifier : … » ou « Piste : … ». **Si aucune piste factuelle détectable, laisser vide** — ne pas inventer pour remplir.
4. **Fallback JSON strict** : Conserver extraction, validation, `fallbackFlash()` — ne pas s'en départir.

---

## 1. Vue d'ensemble

### 1.1 Objectif

Adapter la **forme éditoriale** de DIVA (lecture narrative copilote CODIR) sans modifier l'architecture : nouveau prompt Mistral, retrait limite headline, UI compacte (paragraphe, séparateur, données utilisées, badge).

### 1.2 Périmètre

| Inclus | Exclu |
|--------|-------|
| Prompt Mistral (system + user) selon spec v2 | Modification API, modèle de données |
| max_tokens 400, retrait truncate 120 | Nouveaux champs JSON |
| DivaFlashBlock : structure §7, multiline | Refonte architecture |
| Tests sur données réelles (sarl-la-platine) | |

### 1.3 Definition of Done (DoD) globale

DIVA v2 éditorial est terminé si :

- [ ] Prompt produit une lecture narrative (3–5 phrases) dans `headline`
- [ ] `what_i_see` au format « KPI : valeur unité »
- [ ] Limite 120 car. retirée (backend + prompt)
- [ ] max_tokens = 400
- [ ] UI : paragraphe A, séparateur léger, « Données utilisées » compact, badge
- [ ] Tests manuels sur sarl-la-platine OK

---

## 2. Structure du sprint

| Phase | Durée | Objectif | Story Points |
|-------|-------|----------|---------------|
| **Backend + Prompt** | 1–1,5 j | Prompt v2, retrait truncate, max_tokens | 5 SP |
| **UI** | 0,5 j | DivaFlashBlock structure §7, multiline | 2 SP |
| **Recette** | 0,5 j | Tests manuels, validation éditoriale | 1 SP |

**Total estimé** : 8 SP — 2 jours

---

## 3. User Stories

### US-v2.1 : Réécriture du prompt Mistral (forme narrative)

**En tant que** utilisateur CODIR  
**Je veux** une lecture narrative (3–5 phrases) au lieu d'une phrase courte  
**Afin de** comprendre les indicateurs dans leur contexte, sans interprétation causale.

**Points** : 3

**Critères d'acceptation** :

- [ ] System prompt adapté selon `SPEC_DIVA_v2_Copilote_CODIR.md` §1–5
- [ ] headline : 3–5 phrases, max 900 car., verbes neutres, pas de dates (déjà dans header)
- [ ] what_i_see : format « KPI : valeur unité », une ligne par KPI max, pas de phrase complète (labels des cards)
- [ ] to_check : factuel, non prescriptif. Si aucune piste détectable, laisser vide. « À vérifier : … » ou « Piste : … » uniquement.
- [ ] Interdictions éditoriales intégrées (spec §3)
- [ ] **Anti-répétition** : éviter les répétitions de structure (« La trésorerie… La trésorerie… ») — varier les débuts de phrase
- [ ] **Syntaxe** : ne pas commencer toutes les phrases par le même indicateur (pattern le plus courant)
- [ ] **Densité** : chaque phrase apporte une information nouvelle ou un lien entre indicateurs — pas de reformulation inutile
- [ ] **what_i_see** : une ligne par KPI max, pas de phrase complète
- [ ] **Données limitées** : si 1–2 KPI seulement, produire quand même 3 phrases courtes max, sans extrapoler (évite invention de lien, phrase unique, ou remplissage artificiel)
- [ ] Prompt très structuré, contraint, formaté (canaliser Mistral 7B)

**Tâches techniques** :

- [ ] Remplacer `systemPrompt` dans `units/diva/internal/mistral/client.go`
- [ ] Adapter `buildUserPrompt` si nécessaire (format cartes, consignes)
- [ ] Référence : spec §5 (exemple conforme), ANNEXE v1.1 (structure JSON conservée)

**Livrables** : `client.go` avec prompt v2 éditorial

---

### US-v2.2 : Suppression truncate + max_tokens

**En tant que** service DIVA  
**Je veux** accepter un headline de 3–5 phrases sans troncature backend  
**Afin de** produire une lecture narrative complète, sans couper une phrase au milieu.

**Points** : 2

**Critères d'acceptation** :

- [ ] **Supprimer complètement** `truncate(raw.Headline, ...)` — pas de limite côté backend
- [ ] `max_tokens` passé de 256 à 400 dans l'appel Mistral
- [ ] Dans le prompt : règle explicite **max 5 phrases, max 900 caractères** pour la lecture narrative (le token cap seul ne discipline pas toujours la prose)
- [ ] `sanitizeHeadline` (suppression dates) conservé — après suppression, ne pas laisser de virgule orpheline en début (« Pour la période …, la trésorerie » → pas « , la trésorerie »)
- [ ] Fallback JSON strict inchangé

**Tâches techniques** :

- [ ] Supprimer l'appel `truncate` sur headline dans `parseFlash` (`client.go`)
- [ ] Modifier `payload` : `max_tokens: 400`
- [ ] Ajouter dans le system prompt : « headline : 3–5 phrases max, 900 caractères max »
- [ ] Vérifier `sanitizeHeadline` : les patterns de dates incluent la virgule suivante ; nettoyer toute virgule orpheline en début (`leadingOrphanPunct`)

**Livrables** : Backend sans troncature, prompt qui cadre la taille, ponctuation préservée

---

### US-v2.3 : Adapter DivaFlashBlock (structure §7)

**En tant que** utilisateur Linky  
**Je veux** un bloc synthèse compact : paragraphe principal, séparateur, données utilisées, badge  
**Afin de** lire la synthèse sans surcharge visuelle.

**Points** : 2

**Critères d'acceptation** :

- [ ] Paragraphe principal (A / headline) affiché en bloc multiline (pas truncate visuel)
- [ ] Ligne de séparation légère entre paragraphe et données
- [ ] « Données utilisées » en petit texte compact (`what_i_see`)
- [ ] Badge confiance inchangé
- [ ] Propre. Lisible. Pas bavard.
- [ ] `to_check` affiché si non vide (optionnel, format « À vérifier » / « Piste »)

**Tâches techniques** :

- [ ] Modifier `DivaFlashBlock.tsx` : structure visuelle selon spec §7
- [ ] headline : `whitespace-pre-wrap` ou équivalent pour multiline
- [ ] Séparateur : `border-t` ou `hr` discret
- [ ] Section « Données utilisées » : `text-xs` ou `text-sm`, liste compacte

**Livrables** : UI conforme spec §7

---

### US-v2.4 : Recette et validation éditoriale

**En tant que** responsable produit  
**Je veux** valider la forme éditoriale sur données réelles  
**Afin de** garantir la conformité à la spec avant mise en production.

**Points** : 1

**Critères d'acceptation** :

- [ ] Tests manuels sur sarl-la-platine (lab)
- [ ] Vérifier : lecture narrative (3–5 phrases), pas de dates dans headline, format données utilisées
- [ ] Vérifier : pas de « Il serait pertinent de… » dans to_check
- [ ] Latence acceptable (max_tokens 400 → ~5–15 s selon charge)
- [ ] Bouton Rafraîchir et cache opérationnels
- [ ] **Cache awareness** : après déploiement, le cache TTL 5 min peut renvoyer des réponses v1. Tester avec **force_refresh manuel** (bouton Rafraîchir) ou prévoir un clear cache au déploiement — sinon on croira que le prompt ne fonctionne pas
- [ ] **Parsing JSON** : vérifier que le modèle respecte strictement la structure JSON attendue (prompt plus long → risque de sortie du cadre). Le fallback est conservé, risque maîtrisé.

**Tâches techniques** :

- [ ] Redéployer DIVA + Linky avec `./scripts/redeploy_diva_stack.sh --linky`
- [ ] Tester plusieurs contextes (entreprise, période)
- [ ] Documenter tout écart éditorial observé

**Livrables** : Validation manuelle effectuée, éventuels correctifs prompt

---

## 4. Récapitulatif

| Ordre | US | Résumé |
|-------|-----|--------|
| 1 | US-v2.1 | Prompt Mistral v2 éditorial |
| 2 | US-v2.2 | Suppression truncate, max_tokens 400 |
| 3 | US-v2.3 | DivaFlashBlock structure §7, multiline |
| 4 | US-v2.4 | Recette sarl-la-platine |

---

## 5. Risques et limites

- **Mistral 7B** : répétitions, tourner en rond — prompt très contraint obligatoire.
- **Latence** : Le coût CPU de 400 tokens n'est pas linéaire — il dépend de la sortie effective. Si le prompt produit ~220 tokens réels, la latence reste proche de v1. **Levier** : prompt précis → sortie compacte.
- **Cache** : TTL 5 min. Après déploiement, prévoir **force_refresh manuel** pour tester le nouveau prompt, ou clear cache au déploiement — sinon les anciennes réponses v1 masquent le résultat.

---

## 6. Références

| Document | Rôle |
|----------|------|
| `SPEC_DIVA_v2_Copilote_CODIR.md` | Spec éditoriale v2.1 |
| `AVIS_SPEC_DIVA_v2_Copilote_CODIR_2026-02-17.md` | Avis, checklist |
| `SPEC_DIVA_API_v1.0.md` | Contrat API (inchangé) |
| `units/diva/internal/mistral/client.go` | Cible prompt + parsing |
| `units/dorevia-linky/components/DivaFlashBlock.tsx` | Cible UI |

---

**Fin du plan.**
