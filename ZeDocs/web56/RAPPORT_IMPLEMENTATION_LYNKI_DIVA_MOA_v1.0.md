# Rapport d’implémentation — Lynki / Diva (insight cockpit)

**Date** : 17 mars 2026  
**Version** : 1.0  
**Répertoire** : `ZeDocs/web56`  
**Destinataire** : MOA (profil tech)  
**Références** : `Note_Normalisation_Langue_Lynki.md`, `PLAN_IMPLEMENTATION_LANGUE_LYNKI.md`, `GLOSSAIRE_LYNKI_DIVA.md`

---

## 1. Synthèse exécutive

L’insight principal affiché dans le cockpit Lynki est généré par la chaîne **Diva (Go) + Mistral (LLM)**. Deux lots d’évolution ont été livrés et déployés :

| Lot | Objectif | Statut | Impact |
|-----|----------|--------|--------|
| **Lot 1 — Normalisation langue** | Terminologie métier stable, suppression anglicismes/backend, post-traitement Lynki | ✅ Livré (LANG-01 → LANG-10) | Texte présentable, langue CODIR |
| **Lot 2 — Rigueur métrique** | Chiffres de l’insight 100 % traçables aux cards du cockpit | ✅ Livré (METRIC-01 → METRIC-06) | Cohérence chiffrée, une phrase = une paire de concepts |
| **Lot 2bis — Formulation stock/flux** | Headline « contrôle de gestion » quand trésorerie vs activité | ✅ Livré | Élégance métier (stock vs flux) |

**Verdict MOA retenu** : *« Présentable et crédible ; cohérence chiffres ✅, lisibilité ✅, vigilance client ✅, langue CODIR presque ✅, élégance métier encore un cran possible (règle stock/flux ajoutée). »*

---

## 2. Périmètre technique

- **Diva** : `units/diva` (Go) — construction du FactsPack, règles métier, appel Mistral, validation de sortie.
- **Mistral** : modèle local (llama.cpp) — reformulation à partir du payload structuré.
- **Lynki** : `units/dorevia-linky` (Next.js) — dashboard, cartes KPI, appel API Diva via Vault, affichage de l’insight.
- **Vault** : gateway vers Diva ; pas de changement métier dans ce rapport.

---

## 3. Problématique initiale (avant correctifs)

L’insight affichait des **montants et concepts non alignés** avec les cartes du cockpit :

- Card **Business** : 94 663,78 € → Diva parlait d’« activité commerciale totale » = 97 740,28 € (somme business + POS).
- Card **Flux net** : 7 825,71 € → Diva utilisait « flux net disponible » pour désigner une autre grandeur (trésorerie/cash interne).
- **Headline** : une seule phrase mélangeant activité, flux net et trésorerie nette post-taxes, avec des écarts (ex. 22 936,27 €) non déductibles des cards visibles.
- **Phrase d’ouverture** : terminaison par « ... » (sortie instable).

Cause racine :  
- Moteur de faits (Go) qui comparait **cash** (flux net) à l’activité en le nommant « trésorerie disponible ».  
- Pas de **solde trésorerie** (card TRÉSORERIE = 118 179,42 €) utilisé en comparaison.  
- Pas de **manifest** des montants autorisés → le LLM pouvait reformuler avec des chiffres non présents dans le cockpit.  
- Headline candidate réécrit avec un alias « flux net disponible » créant la confusion avec la card FLUX NET.

---

## 4. Lot 1 — Normalisation langue (rappel)

Objectif : un français de gestion stable, sans termes backend ni anglicismes visibles.

| Ticket | Contenu technique |
|--------|-------------------|
| LANG-01 | Glossaire `GLOSSAIRE_LYNKI_DIVA.md` publié et référencé |
| LANG-02 | Dans `engine.go` : « cash » → « trésorerie disponible » (puis affiné en Lot 2) |
| LANG-03 | Normalisation des libellés gouvernance (watch/alert) via `normalizeLabel()` sur Label / StatusReason |
| LANG-03b | Décision : source de vérité des libellés = Diva (normalisation à l’entrée du FactsPack) |
| LANG-04 | Prompts Mistral : « business » → « activité commerciale », « watch » → « à surveiller », etc. |
| LANG-05 | Liste `lynkiForbiddenUserTerms` (regex) pour rejet/substitution en sortie |
| LANG-06 | Politique par champ : headline = rejet si terme interdit ; what_i_see / to_check = substitution puis omission si résidu |
| LANG-07 | Audit UI Lynki (boutons, tooltips, messages) — alignement glossaire |
| LANG-08 | Recette éditoriale (tests Go `recette_test.go`, échantillons + critères) |
| LANG-09 / LANG-10 | Validation MOA + gate de clôture du lot |

Fichiers impactés (Lot 1) : `units/diva/internal/facts/engine.go`, `units/diva/internal/mistral/client.go`, `units/diva/recette/recette_test.go`, docs ZeDocs/web56.

---

## 5. Lot 2 — Rigueur métrique (détail technique)

Objectif : **tout montant affiché dans l’insight doit être traçable à une card du cockpit ou à une métrique dérivée documentée** ; **une phrase principale = une seule paire de concepts**.

### 5.1 Analyse de cause

- **treasury_validated_pct** (envoyé par Lynki) contient en pratique le **solde trésorerie** en EUR (118 179,42 €), pas un pourcentage.
- **cash** = flux net (encaissements − décaissements) = 7 825,71 € (card FLUX NET).
- Le moteur utilisait uniquement `cash` pour la comparaison « trésorerie vs activité » et l’appelait « trésorerie disponible », d’où incohérence avec les cards.
- BFR, Encours, EBE n’étaient pas envoyés à Diva (absents du `CARD_MAPPING` Lynki).

### 5.2 Modifications par composant

#### 5.2.1 Diva — `internal/facts/types.go`

- **FactsPack** : ajout du champ `Metrics map[string]float64` (manifest de traçabilité). Clés = noms de métriques (cards ou dérivées : `trésorerie`, `flux_net`, `activité_commerciale`, `activité_commerciale_totale`, `trésorerie_nette_post_taxes`, `flux_net_post_taxes`, etc.).
- **HeadlineCandidate()** : simplification. Retourne le premier fait (nettoyé du préfixe « POINT DOMINANT ») **sans** réécriture ni alias (« flux net disponible » supprimé). Les montants du headline restent ainsi strictement ceux du FactsPack.

#### 5.2.2 Diva — `internal/facts/engine.go`

- **buildMetrics()** : nouvelle fonction qui remplit `FactsPack.Metrics` à partir des cards (valeurs présentes) et des métriques dérivées (activité_commerciale_totale = business + pos, trésorerie_nette_post_taxes, flux_net_post_taxes, **écart_trésorerie_activité** = |trésorerie − activité_commerciale_totale|).
- **buildFacts()** :
  - Distinction explicite **trésorerie** (stock, key `treasury_validated_pct`) vs **flux net** (key `cash`). Si trésorerie > 0, elle est utilisée pour la comparaison principale ; sinon fallback sur flux net.
  - Libellés dans les messages : « trésorerie » quand on utilise le solde, « flux net » quand on utilise `cash`. Plus d’appellation « trésorerie disponible » pour le flux net.
  - Comparaison principale : **trésorerie (ou flux net en fallback) vs activité commerciale (totale si POS > 0)**. Même logique pour encours vs trésorerie nette post-taxes / flux net post-taxes.
- Tous les montants injectés dans les faits proviennent des cards ou de calculs documentés → traçabilité.

#### 5.2.3 Diva — `internal/mistral/client.go`

- **Payload** : le champ `metrics` (manifest) est envoyé à Mistral dans le JSON user (factsPackPayloadV2).
- **Prompt** : règles renforcées — (1) headline = une seule paire de concepts, un seul montant ; (2) **traçabilité absolue** : tout montant en € dans le headline doit figurer dans `metrics` ; (3) exemples mis à jour.
- **Validation post-LLM** : `validateAndBuildFlash(raw, cards, metrics)`. Extraction des montants en € du headline (regex format français « 1 234,56 € ») ; pour chaque montant, vérification qu’il existe dans le manifest (±0,02 €). Sinon → rejet du headline, fallback dégradé + log `METRIC headline rejeté: montant non traçable`. **what_i_see et to_check** : toute phrase contenant un montant non traçable est **omise** (et loggée `METRIC item omis: montant non traçable`), afin d’éviter des écarts faux (ex. 23 814,68 € au lieu de 23 515,64 €) dans le corps de l’insight.

#### 5.2.4 Lynki — `app/api/diva/explain/route.ts` et `explain/async/route.ts`

- **CARD_MAPPING** :
  - `treasury` → specKey `treasury_validated_pct`, label « Trésorerie », unit « EUR » (solde).
  - `treasury_position` → label « Couverture trésorerie », unit « % ».
  - `cash` → label « Flux net », unit « EUR ».
  - `business` → label « Activité commerciale ».
  - Ajout des cards **working_capital** → `bfr`, **encours** → `encours`, **ebitda** → `ebe` pour que Diva reçoive BFR, Encours, EBE et produise des faits traçables.

### 5.3 Récapitulatif Lot 2

| Ticket | Description |
|--------|-------------|
| METRIC-01 | Analyse engine/types : identification cash vs treasury, alias « flux net disponible » |
| METRIC-02 | FactsPack.Metrics + HeadlineCandidate simplifié |
| METRIC-03 | engine.go : terminologie trésorerie/flux net, buildMetrics, comparaisons traçables |
| METRIC-04 | CARD_MAPPING Lynki : labels, BFR/encours/EBE |
| METRIC-05 | client.go : payload metrics, prompt une-paire + traçabilité, validation montants |
| METRIC-06 | Build & déploiement Diva + Lynki |

---

## 6. Lot 2bis — Formulation stock vs flux

Constat MOA : la phrase « La trésorerie dépasse l’activité commerciale » est correcte mathématiquement mais compare un **stock** (trésorerie) à un **flux** (activité). Pour un ton « contrôle de gestion », des formulations plus naturelles sont préférées.

Modifications dans **systemPromptFactsPack** (`client.go`) :

- **Règle 1 (headline)** : quand la comparaison porte sur trésorerie (stock) et activité commerciale (flux), privilégier par exemple :
  - « La trésorerie (X €) reste supérieure au niveau d’activité commerciale (Y €) observé sur la période »
  - « La trésorerie couvre le niveau d’activité commerciale (écart +Z €) »
- **Règle 9 (nouvelle)** : STOCK vs FLUX — préférer ces formulations en gardant les mêmes montants ; éviter « dépasse l’activité » si une variante plus élégante est possible.

Aucun changement de logique ni de chiffres ; uniquement le style de la phrase principale.

---

## 7. Recette et validation

- **Tests Go** : `units/diva` — `go test ./...` (facts, mistral, recette). Assertions mises à jour pour les nouveaux libellés (trésorerie, flux net, activité commerciale, post-taxes).
- **Recette éditoriale** : `units/diva/recette/recette_test.go` — interdiction de termes du glossaire, présence de termes préférés (trésorerie, flux net, activité commerciale).
- **Validation manuelle MOA** : capture cockpit avec vérification ligne à ligne (Trésorerie 118 179,42 €, Business 94 663,78 €, écart 23 515,64 € ; trésorerie nette post-taxes 117 574,94 € ; vigilance Export My Island). Verdict : cohérence chiffrée ✅, lisibilité ✅.

---

## 8. Déploiement et versions

| Composant | Image / version | Date |
|-----------|------------------|------|
| Diva | `dorevia/diva:stock-flux-2026-03-17` | 17 mars 2026 |
| Diva-runner | `dorevia/diva:stock-flux-2026-03-17` | 17 mars 2026 |
| Lynki (tous tenants) | `dorevia/linky:metric-trace-2026-03-17` | 17 mars 2026 |

Environnements concernés : linky-generic, laplatine2026 lab, o19 lab, sarl-la-platine lab et stinger. Conteneurs Diva et Lynki recréés avec les images ci-dessus.

---

## 9. Synthèse pour la MOA

- **Cohérence chiffrée** : les montants de l’insight sont désormais tous traçables aux cards ou aux métriques dérivées ; une validation rejette tout headline contenant un montant hors manifest.
- **Une phrase = une relation** : headline limité à une paire de concepts et un montant ; plus de mélange activité + flux net + trésorerie nette dans une seule phrase.
- **Terminologie** : trésorerie (stock) vs flux net (flux) clarifiée côté moteur et côté prompt ; formulation stock/flux pour le cas trésorerie vs activité.
- **Langue et gouvernance** : normalisation Lynki (Lot 1) conservée ; vigilances (ex. créances en retard, Export My Island) restent présentes et non lissées.

Suites possibles (hors périmètre actuel) : affiner davantage les formulations selon retours CODIR ; étendre le manifest à d’autres métriques si de nouvelles cards sont exposées ; documenter le contrat d’API Lynki → Diva (CARD_MAPPING) dans une spec dédiée.

---

*Document généré pour la MOA (profil tech). Références : Note_Normalisation_Langue_Lynki.md, PLAN_IMPLEMENTATION_LANGUE_LYNKI.md, GLOSSAIRE_LYNKI_DIVA.md.*
