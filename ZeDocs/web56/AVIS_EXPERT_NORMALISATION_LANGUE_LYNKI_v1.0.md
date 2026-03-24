# Avis d’expert — Note normalisation langue Lynki

**Document évalué** : `ZeDocs/web56/Note_Normalisation_Langue_Lynki.md` (v1.0)  
**Date** : mars 2026  
**Type** : Évaluation technique et produit + recommandations

---

## 1. Synthèse

La note est **solide, bien cadrée et directement exploitable**. Le principe de chaîne linguistique (« le français propre doit être préparé par le système, pas espéré du modèle ») est le bon levier. Le glossaire est cohérent avec l’existant et avec les corrections déjà faites (headline activité / flux net, fait encours vs trésorerie nette). L’avis est **favorable** pour mise en œuvre, avec les compléments et précisions ci‑dessous.

---

## 2. Points forts

### 2.1 Positionnement produit

- La phrase boussole **« Lynki est un assistant au contrôle de gestion qui rend compte au CODIR »** donne un critère clair pour la langue et le ton.
- La distinction « ne pas parler comme / parler comme » (chatbot, debug, dump vs assistant contrôle de gestion) est opérationnelle pour les prompts et la recette.

### 2.2 Principe de chaîne

- Insister sur **normalisation en amont** (code → payload) plutôt que sur « faire écrire du français au LLM » seul évite le syndrome « bon chiffre, mauvaise paire de concepts » déjà corrigé côté headline.
- Ordre Code → Payload → LLM → Post-traitement → UI est aligné avec l’architecture actuelle (BuildFactsPack → factsPackPayloadV2 → Mistral → validateAndBuildFlash / sanitizeHeadline → DivaFlashBlock).

### 2.3 Glossaire

- La table de correspondance (business → activité commerciale, cash → trésorerie disponible, AR → créances ouvertes, etc.) est **en phase avec les libellés déjà utilisés** dans `engine.go` pour les messages de faits (activité commerciale, trésorerie disponible, créances en retard, etc.).
- Les listes « interdits en sortie user » et « préférés » sont exploitables pour :
  - étendre les regex de post-traitement (forbiddenTerms / détection anglais) ;
  - auditer les derniers endroits où un terme backend peut encore fuiter.

### 2.4 Règles éditoriales (§8)

- « Préférer le métier au technique » et « formulations explicites » renforcent ce qui est déjà demandé dans les prompts Mistral (phrases complètes, pas d’étiquettes seules, « créances en retard » jamais « AR à risque »).
- « Une couleur n’est pas un mot » est une bonne règle pour éviter de dupliquer dans le texte ce que le visuel porte déjà.

### 2.5 Périmètre

- In / out clairement définis (pas de changement de modèle, pas de refonte Diva, pas de DLP ni multilingue). Ça permet de prioriser sans dériver.

---

## 3. Écarts et compléments recommandés

### 3.1 Erreur de référence

- **§1 Répertoire** : indiqué « ZeDocs/web55 » ; à corriger en **ZeDocs/web56**.

### 3.2 Suite de la note (§9)

- La note s’arrête après l’exemple de payload attendu. Il manque (même sous forme de « à rédiger ») :
  - **Post-traitement** : comment les termes interdits du glossaire sont-ils appliqués en sortie LLM (liste noire, remplacement, rejet du flash) ; lien avec `forbiddenTerms` / `englishDetect` et éventuelle extension.
  - **Recette éditoriale** : critères de validation (ex. « zéro occurrence de business/cash/AR/watch en texte affiché »), type d’échantillon (nombre d’insights, contextes), qui valide.
  - **Plan d’implémentation** : ordre recommandé (ex. 1. engine.go + HeadlineCandidate, 2. prompts, 3. post-traitement, 4. UI + glossaire doc).

### 3.3 Couche UI Lynki

- La note inclut l’UI dans le périmètre mais ne détaille pas les **libellés côté front** (boutons « Actualiser », tooltips, messages d’erreur, labels des cartes). Recommandation : ajouter une sous-section « Libellés UI Lynki » ou référencer un fichier de copies (ou un extrait du glossaire dédié UI) pour éviter que des termes techniques (refresh, fallback, etc.) réapparaissent dans l’interface.

### 3.4 Origine des libellés des cartes

- Les **StatusReason** et **Label** des cartes (ex. « Cash non validé », « Trésorerie non validée (0 %) », « watch ») viennent du **pipeline en amont** (Vault / agrégation). Si on ne normalise que dans Diva, tout ce qui est injecté dans les facts à partir de ces champs peut encore introduire « cash », « watch », etc. Recommandation : préciser dans la note que la normalisation doit aussi s’appliquer aux **libellés des cartes utilisés dans les messages** (ou documenter une source de vérité côté Vault/Linky pour les labels affichés).

---

## 4. Confrontation avec le code actuel

### 4.1 Déjà aligné

- **engine.go** : les messages de faits utilisent déjà « activité commerciale totale », « trésorerie disponible », « Position nette de trésorerie post-taxes », « créances ouvertes », « créances en retard », « part significative », etc. En grande partie conforme au glossaire.
- **Prompts Mistral** : interdiction « AR à risque », usage « créances en retard », « recouvrement », phrases complètes, headline lié au headline_candidate.
- **Post-traitement** : rejet des headlines contenant `forbiddenTerms` ou `englishDetect` ; sanitization (troncature, suppression plages de dates).

### 4.2 À faire ou à préciser

| Zone | État | Action suggérée |
|------|------|------------------|
| **engine.go** | « cash » encore présent dans quelques messages (POINT DOMINANT: « cash modeste », « cash %s ») | Remplacer par « trésorerie disponible » ou « position de trésorerie » dans les chaînes affichées. |
| **Gouvernance (watchCards, alertCards)** | Les faits GOUVERNANCE reprennent `c.Label` et `c.StatusReason` (peuvent contenir « watch », « Cash non validé ») | Soit normaliser ces champs avant de les injecter dans les facts (couche Diva ou contrat en amont), soit ajouter une étape de nettoyage des libellés à l’entrée du FactsPack. |
| **Prompts système** | Mentionnent encore « business », « watch/alert » comme noms de concepts pour le LLM | Remplacer par des formulations « activité », « statut à surveiller / vigilance » dans les consignes, tout en gardant les clés JSON (headline, etc.) si besoin. |
| **Liste forbiddenTerms / anglais** | Actuellement ciblée sur injonctions et structurel anglais | Étendre avec les termes « interdits en sortie user » du glossaire (business, cash, AR, watch, issue, payload, etc.) pour le post-traitement du headline et des champs affichés. |
| **Glossaire** | Présent uniquement dans la note | Le porter dans un fichier de référence (ex. `ZeDocs/web56/GLOSSAIRE_LYNKI_DIVA.md` ou `units/diva/docs/glossaire.md`) et le citer dans la note pour maintenance et recette. |

---

## 5. Recommandations d’implémentation

1. **Corriger** la référence ZeDocs web55 → web56 en en-tête de la note.
2. **Compléter la note** avec les sections manquantes : post-traitement (règles + lien avec code), recette éditoriale, ordre des travaux (plan par étapes).
3. **Documenter** l’origine des libellés des cartes (Vault / Lynki) et le périmètre de normalisation (Diva seul vs contrat amont).
4. **Implémenter en priorité** :
   - Normalisation des derniers messages engine.go contenant « cash » (texte utilisateur).
   - Extension de la couche de rejet / correction en sortie (headline + what_i_see / to_check) à partir de la liste « interdits en sortie user ».
   - Mise à jour des prompts pour ne plus donner au LLM de termes backend (business, watch, etc.) comme exemples.
5. **Publier le glossaire** comme document de référence et l’utiliser comme base de tests (recette « zéro occurrence » des termes interdits).

---

## 6. Conclusion

La note est **prête à servir de cadrage** pour la normalisation linguistique de Lynki/Diva. Elle est cohérente avec l’architecture et les choix déjà faits (chaîne store-first, payload structuré, rigueur métier du headline). Les écarts identifiés sont surtout des **compléments** (post-traitement, recette, plan, UI, provenance des libellés) et des **ajustements ciblés** dans le code (quelques chaînes « cash », gouvernance, prompts). Avec ces compléments, la note peut être considérée comme une base normative stable pour l’évolution de la langue produit Lynki.
