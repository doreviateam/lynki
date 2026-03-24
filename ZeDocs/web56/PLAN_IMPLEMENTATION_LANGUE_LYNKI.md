# Plan d’implémentation — Normalisation langue Lynki

**Date** : mars 2026  
**Version** : 1.1  
**Répertoire** : `ZeDocs/web56`  
**Référence** : `Note_Normalisation_Langue_Lynki.md` (v1.1), §14 et avis d’expert

Ce document détaille l’**ordre des travaux** et les **tickets techniques** dérivés de la note de cadrage et de l’avis d’expert.

---

## 1. Ordre d’implémentation recommandé

| Ordre | Ticket | Contenu |
|-------|--------|---------|
| 1 | LANG-01 | Glossaire publié et référencé |
| 2 | LANG-02 | Nettoyer « cash » dans `engine.go` |
| 3 | LANG-03 | Normaliser libellés gouvernance (Label / StatusReason) |
| 4 | LANG-03b | Décider la source de vérité des libellés métier (Diva vs contrat amont Vault / agrégations) |
| 5 | LANG-04 | Prompts Mistral : formulations métier |
| 6 | LANG-05 | Post-traitement : étendre liste termes interdits |
| 7 | LANG-06 | Politique post-traitement par champ (voir détail ci‑dessous) |
| 8 | LANG-07 | UI Lynki : auditer et aligner libellés |
| 9 | LANG-08 | Recette éditoriale (échantillon + critères de succès) |
| 10 | LANG-09 | Validation MOA / relecteur métier |
| 11 | LANG-10 | **Gate** : validation du lot et décision validé / non validé |

---

## 2. Tickets techniques (à détailler / prioriser)

### 2.1 Glossaire et doc

- [x] **LANG-01** — Vérifier que `GLOSSAIRE_LYNKI_DIVA.md` est à jour et référencé dans la note et dans la recette.

### 2.2 Diva (Go)

- [x] **LANG-02** — Remplacer dans `units/diva/internal/facts/engine.go` les messages contenant « cash » (POINT DOMINANT, etc.) par « trésorerie disponible » ou « position de trésorerie ».
- [x] **LANG-03** — Normaliser les libellés injectés en gouvernance (watchCards, alertCards) : soit normaliser Label / StatusReason avant injection dans les facts, soit documenter le contrat amont (Vault / agrégations) pour fournir des libellés déjà propres.
- [x] **LANG-03b** — **Décider la source de vérité des libellés métier** : normalisation dans Diva (couche de nettoyage à l’entrée du FactsPack) ou contrat amont Vault / agrégations (libellés déjà propres en entrée). Décision d’architecture légère à documenter.

### 2.3 Prompts Mistral

- [x] **LANG-04** — Dans les prompts système (`units/diva/internal/mistral/client.go`), remplacer les mentions « business », « watch », « alert » dans les consignes par « activité », « à surveiller », « vigilance ».

### 2.4 Post-traitement

- [x] **LANG-05** — Étendre la liste des termes rejetés (forbiddenTerms ou liste dédiée « termes interdits Lynki ») avec les termes §7.2 du glossaire (business, cash, AR, watch, issue, payload, runner, etc.).
- [x] **LANG-06** — Définir et implémenter la **politique post-traitement par champ** (pas seulement « rejet ou remplacement » global) :
  - **headline** : rejet ou remplacement immédiat si terme interdit détecté ; pas d’affichage du texte non conforme.
  - **what_i_see / to_check** : remplacement ciblé si simple (ex. liste de substitutions), sinon fallback (phrase générique ou omission).
  - **Journaliser** toute occurrence de terme interdit détectée (log ou métrique) pour la recette et le suivi.

### 2.5 UI Lynki

- [x] **LANG-07** — Auditer les libellés UI (boutons, tooltips, messages d’état, erreur, états dégradés) dans `units/dorevia-linky` et aligner sur le glossaire.

### 2.6 Recette

- [x] **LANG-08** — Constituer l’échantillon d’insights (20–30 contextes) et exécuter la recette éditoriale. **Critères de succès explicites** :
  - **Zéro occurrence** en sortie user de : `business`, `cash`, `AR`, `watch`, `issue` (et autres termes interdits du glossaire).
  - **100 %** des headlines conformes au ton « assistant au contrôle de gestion / CODIR ».
  - Exceptions éventuelles **documentées** et validées.
- [ ] **LANG-09** — Validation MOA / relecteur métier et clôture des écarts. Les mêmes critères de succès s’appliquent (zéro terme interdit, ton CODIR, exceptions documentées).

### 2.7 Gate de clôture

- [ ] **LANG-10** — **Gate de validation langue Lynki** : LANG-01 à LANG-08 terminés. En attente : validation MOA (LANG-09). Artefacts : `GLOSSAIRE_LYNKI_DIVA.md`, `Note_Normalisation_Langue_Lynki.md` (v1.1), `engine.go`, `client.go`, `recette/recette_test.go`.

---

## 3. Suivi

- **Ordre recommandé** : LANG-01 → LANG-02 → LANG-03 → LANG-03b → LANG-04 → LANG-05 → LANG-06 → LANG-07 → LANG-08 → LANG-09 → LANG-10.
- **Dépendances** : LANG-01 avant recette ; LANG-02 et LANG-03 / LANG-03b avant génération d’insights propres ; LANG-05 et LANG-06 avant validation finale du headline ; LANG-10 après tous les autres.
