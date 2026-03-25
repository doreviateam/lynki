# Recette Web60 — Linky (Pilotage)

**Fichier canonique :** `RECETTE_WEB60_LINKY.md`  
**Version :** 1.1.16 — mars 2026  
**Lot :** Web60  
**Statut :** protocole de validation publié  
**Plan :** [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) **v1.1.20** · **Doctrine :** [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) **v1.1.2** · **Spec maîtresses :** [`SPEC_CARTES_MAITRESSES_LINKY.md`](./SPEC_CARTES_MAITRESSES_LINKY.md) **v1.1.17** · **Backlog :** [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) **v1.1.9** · **Exécution :** [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1.18**  
**Référence créa figée :** `ZeDocs/web59/stitch_carole_61`  
**Axe backlog :** E (plan §7.5)  
**Environnement recette prioritaire :** [lab.linky — tenant laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026)

**Vérité déploiement :** la recette **Pilotage** se juge sur **cette URL publique**, servie par le conteneur **`linky_generic`** (Caddy : `lab.linky.doreviateam.com` → `linky_generic:3000`). Un `./scripts/deploy-linky-lab.sh` sur un poste de dev ne la met pas à jour : il faut **déployer sur l’hôte** qui sert ce nom (même script après `git pull` sur le commit voulu) : le script reconstruit **`linky_generic`** **et** **`linky_lab_laplatine2026`**. Preuve : en pied de page, **UI** + **hash court git** = commit déployé — voir [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **§ en-tête (environnement)**.

---

## 1. Objet

Ce document est le **protocole de validation** du cockpit Linky en régime **Pilotage** à la fermeture du lot Web60 : critères par zone (chrome, doctrine visible, cartes maîtresses, second rang), contrôles exécutables **R60-xxx**, personas, sortie **version montrable** et modèle de **compte rendu**.

Le dossier compte **six pièces maîtresses** : plan, doctrine, spec, backlog, **exécution par passes** ([`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md)), et **ce protocole** qui **ferme** le lot par des preuves reproductibles (**R60-xxx**, personas, version montrable).

---

## 2. Rôle dans le dossier Web60

### 2.1 Les six pièces

| Pièce | Fichier | Rôle |
|-------|---------|------|
| Cadre | [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) | Périmètre, priorités, phases, sortie attendue |
| Norme | [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) | États, lexique, précédence, mapping |
| Spec UI | [`SPEC_CARTES_MAITRESSES_LINKY.md`](./SPEC_CARTES_MAITRESSES_LINKY.md) | Trésorerie, Business, Flux net |
| Arbitrages | [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) | Décisions **W60-xxx** |
| Fermeture par blocs | [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) | **Passes**, **T-W60-xxx**, caps, critères de fin |
| **Validation** | **Ce fichier** | **R60-xxx**, personas, version montrable, CR |

### 2.2 Tableau consolidé (versions et statuts)

*À mettre à jour lors de chaque publication de pièce ; évite les dérives entre documents.*

| Document | Version | Statut |
|----------|---------|--------|
| [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) | **v1.1.20** | Cadrage publié |
| [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) | **v1.1.2** | Doctrine publiée (**§5.4** / **§5.4.7** langage visuel cartes principales) |
| [`SPEC_CARTES_MAITRESSES_LINKY.md`](./SPEC_CARTES_MAITRESSES_LINKY.md) | **v1.1.17** | Spécification publiée |
| [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) | **v1.1.9** | Backlog ouvert (**W60-101** à **W60-103** P0 Trésorerie **Fait**) |
| [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) | **v1.1.18** | Guide d’exécution publié (**§5** Passe 2 P0 clos ; **§13** ; **lab public** / **UI hash** ; **§4.2** **W60-005** ; **§14** trame **T-W60-002**) |
| [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) | **v1.1.16** | Protocole de validation publié |

---

## 3. Références normatives

* **Plan** : §9 (critères de succès), **§9.5 Sortie attendue**, phase 4 §10 (recette de fermeture).  
* **Doctrine** : précédence §9.4, Annexe A (mapping), règles de sobriété et de niveau (principal / secondaire).  
* **Spec cartes maîtresses** : §3 à §11, §13, **§13.1 Recette par persona**.  
* **Backlog** : **W60-501 … W60-506** ([§10](./BACKLOG_WEB60_LINKY.md)) ; **P0** [§11](./BACKLOG_WEB60_LINKY.md).  
* **Contrôles R60-001 … R60-010** : mini-recette §10 (recoupement volontaire avec les P0 et le chrome).  
* **Exécution** : [`EXECUTION_TICKETS_WEB60_LINKY.md`](./EXECUTION_TICKETS_WEB60_LINKY.md) **v1.1.18** — **§13** journal ; **lab public** = vérité recette + **UI hash** ; **§4.2** **W60-005** ; **§5** Passe 2 P0 **W60-101–103** ; **§14** trio + trame **T-W60-002** ; **R60** §10 ; **lab** + **`laplatine2026`**.

---

## 4. Principes de passation

1. **Contexte figé** : tenant, période, viewport notés pour chaque série de captures — par défaut **lab** + **`laplatine2026`** ([URL de référence](https://lab.linky.doreviateam.com/?tenant=laplatine2026)), sauf mention contraire.  
2. **Verdict par bloc** : chrome, doctrine à l’écran, T / B / F, second rang → *OK* / *À corriger* / *Assumé documenté*.  
3. **Personas en contrôle croisé** : passage « œil Max » (3–5 s) + « œil Véréna » (badges, détail) ; Esther sur méthodo et continuité.  
4. **Écart = backlog** : toute contradiction avec la doctrine ou la spec sans arbitrage **Assumé** (W60-505) est un **W60-xxx** à créer ou rouvrir.  
5. **Synthèse comptable** : hors noyau ; **smoke** si navigation ou libellés partagés impactés.

---

## 5. Recette — Chrome global

Checklist dédiée à la barre haute, trust bar, signaux transverses et cohabitation avec les cartes.

* [ ] **Arrêté / fraîcheur** : l’utilisateur comprend *quoi* est lu et *à quelle date* sans jargon inutile (cf. backlog W60-010, W60-004).  
* [ ] **Répartition carte vs global** : pas de duplication confuse d’un même état en principal sur la carte et au global (W60-004).  
* [x] **Preuves / scellés** : distinction lisible entre indicateur de confiance, volume de preuves et statut technique (**W60-005** Fait — microcopy vue / cumulées).  
* [ ] **Cohérence visuelle** : le chrome ne compète pas les montants des cartes maîtresses.

**Verdict bloc chrome :** OK / À corriger / Assumé documenté — *préciser :*

---

## 6. Recette — Doctrine d’état visible

Contrôle de ce qui est **vu** sur le Pilotage par rapport à [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md).

* [ ] **Lexique** : pas de synonymes concurrents pour un même sens (W60-001, W60-002).  
* [ ] **Niveaux** : état **principal**, **secondaire** et signal **global** distinguables visuellement et sémantiquement (W60-003).  
* [ ] **Mapping** : les libellés affichés correspondent aux intentions de l’Annexe A (ou écart documenté).  
* [ ] **Sobriété** : pas de sur-badging de signaux positifs redondants (W60-009).  
* [ ] **Vigilance** : tons des états de vigilance stables et non ambigus avec la performance du montant (W60-008 ; Flux net cf. spec §7).

**Verdict bloc doctrine visible :** OK / À corriger / Assumé documenté — *préciser :*

---

## 7. Recette — Les trois cartes maîtresses

### 7.1 Trésorerie (spec §5)

* [x] **Dominance** : première lecture incontestable du cockpit (W60-101).  
* [x] **État principal** : qualité de lecture (**Fiable**, **Partiel**, **En attente**, **Indisponible** selon cas) — pas « Synchro OK » seul comme badge unique structurant (W60-102, W60-103).  
* [ ] **Secondaire** : si « Synchro OK » présent, il est bien **secondaire** et hiérarchisé (W60-104).  
* [ ] **Matière** : fond structurant sans faux graphe ni concurrence avec le chiffre (W60-105).  
* [ ] **Dégradés** : partiel / attente / indispo lisibles (W60-107).  
* [ ] **Clic → détail** : aligné avec la promesse (solde, gouvernance, couverture) (W60-106).

**Verdict Trésorerie :** OK / À corriger / Assumé documenté — *préciser :*

### 7.2 Business (spec §6)

* [ ] **Carte habitée** : repère ou matière utile, pas carte vide « décorative » (W60-201, W60-205).  
* [ ] **État principal** : lecture **Fiable** / **Partiel** / **À confirmer** / **Indisponible** selon cas (W60-202, W60-207).  
* [ ] **Certifié** : en **secondaire** si présent, pas seule lecture dominante (W60-203).  
* [ ] **Repère contextuel** : MTD / période / variation — stable et non redondant avec les filtres (W60-204).  
* [ ] **Détail** : cohérent avec le volume d’activité (W60-206).

**Verdict Business :** OK / À corriger / Assumé documenté — *préciser :*

### 7.3 Flux net (spec §7)

* [ ] **Libellé** : **Proxy** affiché, pas « Proxy data » (W60-301).  
* [ ] **Prominence** : le montant domine le badge ; le badge reste lisible sans « cri » visuel (W60-302).  
* [ ] **Méthode** : honnêteté proxy sans dramatisation (W60-303).  
* [ ] **Signe vs état** : pas d’amalgame couleur d’état / signe du flux (W60-305).  
* [ ] **Détail** : encaissements, décaissements, méthode, caractère proxy explicite (W60-306).  
* [ ] **Dégradés** : partiel / indisponible (W60-307).

**Verdict Flux net :** OK / À corriger / Assumé documenté — *préciser :*

---

## 8. Recette — Second rang et cohérence d’ensemble

* [ ] **B vs C** : hiérarchie et regroupement perceptibles (W60-401).  
* [ ] **Zéro / indispo** : plus de couple ambigu « — » + **Fiable** là où la lecture doit être **Indisponible** ou **Vide utile** (W60-402, W60-403).  
* [ ] **Badges** : pas de badges inutiles sur cartes déjà claires (W60-404).  
* [ ] **Lecture A / B / C** : rangs décodables en un coup d’œil pour Max (W60-405).  
* [ ] **Synthèse comptable** : continuité acceptable pour Esther si parcours touché (W60-406).

**Verdict second rang / ensemble :** OK / À corriger / Assumé documenté — *préciser :*

---

## 9. Recette par persona (spec §13.1)

Noter écarts en une phrase + **W60-xxx** si nouveau ticket.

### 9.1 Max

* [ ] Les **trois** cartes maîtresses sont comprises en quelques secondes.  
* [ ] Pas de jargon bloquant sur la surface.  
* [ ] Hiérarchie visuelle sans ouvrir le détail.  
* [ ] Ce qui mérite attention (vigilance) est repérable sans confondre avec la « performance » du chiffre.

### 9.2 Véréna

* [ ] Qualité de lecture (**Fiable**, **Partiel**, **Proxy**, etc.) immédiate.  
* [ ] Cohérence **carte → détail** (promesse, états, libellés).  
* [ ] Badges sans double positif redondant sans hiérarchie.  
* [ ] Synchro OK et Certifié bien **secondaires** lorsque présents.

### 9.3 Esther

* [ ] **Proxy** / **Partiel** / **Indisponible** vs zéro métier : pas d’ambiguïté.  
* [ ] Continuité avec vues analytiques / synthèse.  
* [ ] Pas de raccourci visuel trompeur (spéc. Flux net).  
* [ ] Chaque carte relie à une explication dans le détail.

**Verdict personas :** OK / À corriger / Assumé documenté — *préciser :*

---

## 10. Mini-recette exécutable — contrôles R60-001 à R60-010

Passage court **oui/non** (ou N/A). En cas de **non**, référencer un **W60-xxx** ou une décision **Assumée**.

| ID | Contrôle | OK | N/A | Réf. backlog (indicative) |
|----|----------|----|-----|-------------------------|
| **R60-001** | Chrome : barre haute et signaux globaux compréhensibles (arrêté, preuves sans confusion) | ☐ | ☐ | W60-004, W60-005, W60-010 |
| **R60-002** | Aucun synonyme concurrent d’état sur la grille Pilotage | ☐ | ☐ | W60-001, W60-002 |
| **R60-003** | Principal / secondaire / global visuellement distingués | ☐ | ☐ | W60-003 |
| **R60-004** | Trésorerie : dominance + état de qualité principal + pas « Synchro OK » seul comme lecture structurante | ☑ | ☐ | W60-101, W60-102, W60-103 |
| **R60-005** | Business : carte non vide « décorative » + « Certifié » non dominant seul | ☐ | ☐ | W60-201, W60-203, W60-205 |
| **R60-006** | Flux net : libellé **Proxy** + badge sans domination sur le montant | ☐ | ☐ | W60-301, W60-302 |
| **R60-007** | Second rang : pas de couple « — » + **Fiable** ambigu ; B vs C lisible | ☐ | ☐ | W60-401, W60-402 |
| **R60-008** | Cohérence cockpit → détail pour **Trésorerie**, **Business**, **Flux net** (un aller-retour chacun) | ☐ | ☐ | W60-503 |
| **R60-009** | Cohabitation états positifs / vigilance sans surcharge ni confusion | ☐ | ☐ | W60-504, W60-009 |
| **R60-010** | Passe Max 5 s + une phrase oralisable sur l’état du cockpit ; Véréna valide les badges | ☐ | ☐ | W60-501, W60-502, W60-108, W60-208 |

---

## 11. Critères de sortie — « Version montrable »

La sortie est **montrable** si **toutes** les conditions suivantes sont remplies :

* Les **P0** du [backlog §11](./BACKLOG_WEB60_LINKY.md) sont **OK** (ou **Assumés** avec entrée W60-505).  
* La **mini-recette R60-001 … R60-010** est **OK** (ou N/A justifié + aucun **non** bloquant).  
* Les **verdicts par bloc** §5 à §9 sont **OK** ou **Assumé documenté**.  
* Une **démo 5–10 min** (W60-506) est rejouée sans correction live.  
* Les critères **plan §9.4** (démonstration) et **§9.5** (sortie attendue) sont tenus à l’usage.

Sinon : **Correctifs ciblés** (liste de W60-xxx) ou **Report** (motif documenté).

---

## 12. Alignement backlog — W60-501 … W60-506

| ID | Intention | Preuve / sortie attendue |
|----|-----------|---------------------------|
| **W60-501** | Mini-recette par persona | §9 complété + date / auteur |
| **W60-502** | Lisibilité à distance | Capture « vue cockpit entière » + résolution |
| **W60-503** | Cohérence cockpit → détail | Capture détail par carte T / B / F + phrase de cohérence |
| **W60-504** | Positif vs vigilance | Cas testés sans confusion de dominance |
| **W60-505** | Arbitrages assumés | Liste dans §16 ou référence décision |
| **W60-506** | Version montrable | Démo sans correction live ; verdict §16 |

---

## 13. Checklist synthétique — sujets P0 (backlog §11)

* [ ] **W60-001** — lexique d’état normalisé  
* [ ] **W60-003** — principal / secondaire / global lisibles  
* [x] **W60-101** — dominance Trésorerie  
* [x] **W60-102** — pas de « Synchro OK » seul comme lecture principale  
* [x] **W60-103** — état principal de qualité cohérent (Trésorerie)  
* [ ] **W60-201** — Business plus habitée  
* [ ] **W60-203** — « Certifié » en secondaire si présent  
* [ ] **W60-301** — libellé **Proxy**  
* [ ] **W60-302** — badge proxy ne domine pas le montant  
* [ ] **W60-402** — plus de couple ambigu « — » + Fiable (cas concernés)  

---

## 14. Parcours à rejouer

* [ ] Arrivée `/` — chrome, sidebar, grille Pilotage  
* [ ] Lecture des trois maîtresses sans scroll (viewport de référence)  
* [ ] Clic **Trésorerie** → détail → retour  
* [ ] Clic **Business** → détail → retour  
* [ ] Clic **Flux net** → détail → retour  
* [ ] Changement période / société — recheck états et repères  
* [ ] Second rang : scan B vs C  
* [ ] Synthèse comptable : *smoke si touché*

---

## 15. Captures / preuves

| Date | Contexte (tenant, période, viewport) | Lien / fichier | Verdict |
|------|--------------------------------------|----------------|---------|
| | | | |

---

## 16. Synthèse — verdict de lot et compte rendu

### 16.1 Verdict

| Élément | Verdict |
|---------|---------|
| Date de la passe | |
| R60-001 … R60-010 | OK / KO / N/A : |
| P0 (§13) | OK / KO partiel : |
| Blocs §5–§8 | OK / KO partiel : |
| Personas (§9) | OK / KO partiel : |
| W60-501 … W60-506 | OK / KO partiel : |
| **Décision finale** | **Montrable** / **Correctifs ciblés** / **Report** — motif : |

**Arbitrages assumés (W60-505) :**

* *À compléter si applicable.*

### 16.2 Modèle court de compte rendu

À coller et compléter après une passe :

```
Recette Web60 — [date]
Contexte : tenant […] · période […] · viewport […] · exécutant […]

R60 : [x/10 OK]  P0 : [x/10 OK]
Chrome : OK / À corriger / Assumé — [1 phrase]
Doctrine visible : …
Trésorerie / Business / Flux net : …
Second rang : …
Personas (Max / Véréna / Esther) : …

Écarts ouverts : [W60-xxx …]
Décision : Montrable | Correctifs ciblés | Report
```

---

## 17. Formule de cap

> **La recette Web60 ne juge pas le goût : elle vérifie que le cockpit dit la vérité produit de façon stable, lisible et montrable.**

---

## Historique des versions

| Version | Contenu |
|---------|---------|
| **1.0** | Cadrage publié : principes, personas, W60-501…506, checklist P0, parcours. |
| **1.1** | Protocole par blocs (chrome, doctrine, T/B/F, second rang), **R60-001 … R60-010**, critères « version montrable » §11, tableau consolidé §2.2, modèle de CR §16.2. |
| **1.1.1** | Tableau §2.2 : ligne **EXECUTION_TICKETS** ; §3 renvoi guide chantier ; plan **v1.1.5**. |
| **1.1.3** | **Six pièces** §2.1 ; consolidation **v1.1.6** / **EXECUTION v1.1** / backlog **v1.0.4** ; lien **Passe 1** ↔ R60. |
| **1.1.4** | Environnement recette prioritaire : **lab** + tenant **`laplatine2026`** (URL canonique). |
| **1.1.5** | Renvoi **EXECUTION v1.1.2** (régimes d’usage, raccord **R60**) ; plan **v1.1.8**. |
| **1.1.6** | Renvoi **EXECUTION v1.1.3** (**Passe 1 ouverte**, **§14** trio PR) ; plan **v1.1.9**, backlog **v1.0.7**, spec **v1.1.7**. |
| **1.1.7** | Renvoi **EXECUTION v1.1.4** (**§13.1** post-lab **T-W60-001**) ; plan **v1.1.10**, backlog **v1.0.8**. |
| **1.1.8** | Renvoi **EXECUTION v1.1.5** (**§13** journal / **§13.1** gabarit) ; plan **v1.1.11**, backlog **v1.0.9**. |
| **1.1.9** | Backlog **v1.1.0**, **EXECUTION v1.1.7**, spec **v1.1.10**, plan **v1.1.12** ; tableau §2.2 aligné (**T-W60-001** Fait). |
| **1.1.10** | Backlog **v1.1.1**, **EXECUTION v1.1.9**, plan **v1.1.14**, spec **v1.1.11** ; checklist §5 **W60-005** cochée (preuves vue / cumulées) ; renvois en-tête §2 / §3. |
| **1.1.11** | **EXECUTION v1.1.13**, plan **v1.1.15**, backlog **v1.1.4**, spec **v1.1.12** ; paragraphe **Vérité déploiement** (lab public ≠ deploy local ; **UI hash**) ; renvois §2 / §3. |
| **1.1.12** | **EXECUTION v1.1.14**, plan **v1.1.16**, backlog **v1.1.5**, spec **v1.1.13** ; **Vérité déploiement** : **linky_generic** + **`deploy-linky-lab.sh`** (deux conteneurs) ; renvois §2 / §3. |
| **1.1.13** | **EXECUTION v1.1.15**, backlog **v1.1.6** ; **W60-101** / **W60-102** **En cours** (Passe 2) ; renvois §2 / §3. |
| **1.1.14** | **EXECUTION v1.1.16**, backlog **v1.1.7** ; **W60-103** **En cours** ; renvois §2 / §3. |
| **1.1.15** | **EXECUTION v1.1.17**, plan **v1.1.19**, backlog **v1.1.8**, spec **v1.1.16**, doctrine **v1.1.2** ; **§5.3.1** ; renvois §2 / §3. |
| **1.1.16** | **EXECUTION v1.1.18**, plan **v1.1.20**, backlog **v1.1.9**, spec **v1.1.17** ; **R60-004** **OK** ; **W60-103** **Fait** ; renvois §2 / §3. |

---

**Fin du document**
