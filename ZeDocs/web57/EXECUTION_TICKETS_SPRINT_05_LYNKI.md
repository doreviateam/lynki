# Exécution tickets — Sprint 05 Lynki (Phase 2)

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_05_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_05_LYNKI.md](PLAN_SPRINT_05_LYNKI.md) **v1.0**  
**Date :** 20 mars 2026  
**Version :** 1.0 — mars 2026  
**Statut :** document d'exécution terrain — ordre d'attaque, checks, preuves attendues, points de contrôle

**Sources :**  
[PLAN_SPRINT_05_LYNKI.md](PLAN_SPRINT_05_LYNKI.md) · [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)

---

## 1. Objet

Ce document transforme le **plan Sprint 05** en **séquence terrain exécutable**.

Il sert à :

- ordonner les tickets **T26 → T30** ;
- préciser les **preuves attendues** ;
- éviter les ambiguïtés entre :
  - **validation C5 / Gate B pleine**,
  - **promotion UX du GL**,
  - **export GL**,
  - **mise à jour documentaire**.

Ce fichier n'est **pas** un nouveau cadrage produit.  
Il est la **checklist d'exécution** du sprint.

---

## 2. Résultat visé en une phrase

> **Fin de Sprint 05 : Gate B pleine prononcée, GL promu en route/page dédiée, navigation BG → GL stabilisée, export GL minimal livré ou explicitement reporté.**

---

## 3. Ordre d'attaque recommandé

Ordre d'exécution terrain :

1. **T26** — valider **C5** en environnement de référence  
2. **T27** — promouvoir le **GL** en route / page dédiée  
3. **T28** — stabiliser la navigation **BG → GL**  
4. **T29** — livrer l'**export GL minimal** si la route dédiée est stable  
5. **T30** — mettre à jour **ALIGNEMENT / BACKLOG / RAPPORT** et prononcer **Gate B pleine**

### Règle terrain

- **Ne pas** communiquer "Gate B pleine" avant **T26**.
- **Ne pas** élargir le GL (filtres avancés, pagination riche, rôles fins) avant que **T27–T28** soient stables.
- **T29** est **sacrifiable** si T27–T28 consomment le sprint, mais le report doit être **explicite** dans le rapport.

---

## 4. Tableau de pilotage sprint

| # | Titre | Priorité | Dépend de | Sortie attendue |
|---|-------|----------|-----------|-----------------|
| **T26** | Valider C5 en environnement de référence | P0 | Sprint 04 livré | preuve factuelle "Vault réel, pas de stub" |
| **T27** | Promouvoir GL en route / page dédiée | P0 | Sprint 03–04 | route GL utilisable |
| **T28** | Stabiliser navigation BG → GL | P0 | T27 | breadcrumbs + retour cohérents |
| **T29** | Export GL minimal | P1 | T27 | CSV téléchargeable |
| **T30** | Doc / gating / clôture sprint | P0 | T26–T29 | rapport + ALIGNEMENT + BACKLOG |

---

## 5. Ticket T26 — Validation C5 / Gate B pleine

### 5.1 Objet

Valider, en **environnement de référence**, que la chaîne :

**Vault réel → Linky → Synthèse comptable**

fonctionne **sans dépendance au stub**, avec :

- `LINKY_ACCOUNTING_STRICT=1`
- Vault joignable
- `data_source=vault`
- aucun fallback silencieux

### 5.2 Entrées

- Sprint 04 livré
- environnement de référence disponible
- Vault démarré et joignable
- Linky configuré avec `VAULT_URL`
- `LINKY_ACCOUNTING_STRICT=1`

### 5.3 Actions terrain

- vérifier la config runtime de Linky ;
- ouvrir la vue Synthèse ;
- appeler la route Linky `trial-balance` ;
- vérifier réponse HTTP, headers et payload ;
- vérifier que l'UI affiche une source réelle Vault ;
- tester l'absence de chemin stub silencieux.

### 5.4 Preuves attendues

- capture ou log de configuration montrant `LINKY_ACCOUNTING_STRICT=1`
- réponse `200` côté Linky
- payload avec `data_source: "vault"`
- header `X-Lynki-Accounting-Source: vault`
- aucun cas observé de fallback stub en silence

### 5.5 Critères de passage

| Contrôle | Attendu |
|----------|---------|
| Vault UP | oui |
| Linky strict | oui |
| `data_source` | `vault` |
| Header source | `vault` |
| Stub silencieux | absent |
| `complete` | cohérent avec le périmètre réel |
| `coverage` | cohérente avec les sources actives |

### 5.6 Sortie

- **C5 validé** ou
- blocage résiduel documenté avec cause précise

---

## 6. Ticket T27 — Promotion GL en route / page dédiée

### 6.1 Objet

Faire passer le **grand livre** d'un **panneau latéral** à une **surface dédiée**.

### 6.2 Intention produit

Le GL n'est plus seulement une preuve secondaire "ouverte à côté".  
Il devient une **surface de lecture comptable stable**, partageable, navigable, préparée pour :

- export,
- rôle / habilitation,
- filtres enrichis,
- URL explicite.

### 6.3 Attendu minimal

Une route du type :

- `/accounting/gl/[account_code]`
- ou équivalent canonique validé

avec conservation du contexte :

- `tenant`
- `date_debut`
- `date_fin`
- `company_id` si présent

### 6.4 Actions terrain

- créer la route/page dédiée ;
- injecter les filtres depuis la ligne BG source ;
- remplacer ou compléter l'ouverture en panneau latéral ;
- vérifier la non-régression du drill depuis la BG.

### 6.5 Preuves attendues

- fichier route/page créé
- navigation réelle depuis une ligne BG
- affichage GL dédié avec compte et période corrects
- capture desktop de la nouvelle route

### 6.6 DoD terrain

| Contrôle | Attendu |
|----------|---------|
| Accès depuis BG | oui |
| `account_code` | identique à la ligne source |
| période | identique |
| périmètre | conservé |
| route stable | oui |
| régression BG | non |

---

## 7. Ticket T28 — Stabilisation navigation BG → GL

### 7.1 Objet

Rendre la navigation comptable **lisible** et **réversible**.

### 7.2 Attendu UX minimal

- breadcrumb explicite
- retour au niveau comptable précédent
- pas de retour parasite vers le cockpit KPI
- conservation du contexte comptable

### 7.3 Actions terrain

- ajouter breadcrumb / libellé de fil
- gérer bouton retour
- vérifier comportement navigateur
- tester aller-retour BG ↔ GL

### 7.4 Preuves attendues

- capture du breadcrumb
- scénario test :
  - ouvrir BG
  - drill vers GL
  - revenir vers BG
  - conserver le contexte

### 7.5 DoD terrain

| Contrôle | Attendu |
|----------|---------|
| Breadcrumb | présent |
| Retour vers BG | correct |
| Retour vers cockpit KPI | non par défaut |
| période / compte conservés | oui |
| UX claire | oui |

---

## 8. Ticket T29 — Export GL minimal

### 8.1 Objet

Permettre un **export GL minimal** depuis la vue GL dédiée.

### 8.2 Périmètre minimal recommandé

**CSV** en priorité.

### 8.3 Colonnes minimales

- date
- journal
- pièce
- libellé
- débit
- crédit
- solde
- compte
- `referentiel_version`

### 8.4 Doctrine non négociable

- **pas d'export depuis stub**
- si Vault indisponible : erreur explicite
- pas de faux export "de secours"

### 8.5 Actions terrain

- exposer route export côté Vault ou proxy Linky selon architecture retenue
- brancher un bouton export dans la vue GL
- tester téléchargement
- tester cas d'erreur Vault

### 8.6 Preuves attendues

- fichier CSV réel
- capture du bouton d'export
- capture ou trace d'erreur si Vault indisponible
- vérification des colonnes

### 8.7 DoD terrain

| Contrôle | Attendu |
|----------|---------|
| téléchargement | OK |
| format | CSV |
| source | vault uniquement |
| colonnes minimales | présentes |
| export stub | interdit |

---

## 9. Ticket T30 — Documentation / prononcé Gate B pleine

### 9.1 Objet

Clore le sprint dans les artefacts de référence.

### 9.2 Documents à mettre à jour

- [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)
- [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md)
- `RAPPORT_SPRINT_05_LYNKI.md`

### 9.3 Attendu

- état réel des tickets T26–T29
- Gate B **pleine** prononcée si T26 OK
- Gate C mise à jour si T27–T29 avancent significativement
- écarts restants explicitement listés

### 9.4 DoD terrain

| Contrôle | Attendu |
|----------|---------|
| rapport sprint rédigé | oui |
| ALIGNEMENT synchronisé | oui |
| BACKLOG synchronisé | oui |
| Gate B | prononcée ou blocage explicite |
| suite logique sprint 06 | formulée |

---

## 10. Contrôles de recette consolidés

### 10.1 C5 / Gate B

| CP | Contrôle | Attendu |
|----|----------|---------|
| **CP1** | `LINKY_ACCOUNTING_STRICT=1` | actif |
| **CP2** | Vault joignable | oui |
| **CP3** | `data_source` | `vault` |
| **CP4** | `X-Lynki-Accounting-Source` | `vault` |
| **CP5** | stub silencieux | absent |

### 10.2 GL dédié

| CP | Contrôle | Attendu |
|----|----------|---------|
| **CP6** | clic ligne BG | ouvre la bonne route GL |
| **CP7** | `account_code` | cohérent |
| **CP8** | période | conservée |
| **CP9** | breadcrumb | présent |
| **CP10** | retour BG | correct |

### 10.3 Export GL

| CP | Contrôle | Attendu |
|----|----------|---------|
| **CP11** | téléchargement CSV | OK |
| **CP12** | colonnes minimales | OK |
| **CP13** | source export | vault |
| **CP14** | export si Vault KO | erreur explicite |

---

## 11. Check de sortie sprint

| Élément | Attendu fin sprint | État |
|---------|--------------------|------|
| C5 validé | oui | ⬜ |
| Gate B pleine | oui | ⬜ |
| GL route dédiée | oui | ⬜ |
| navigation BG → GL stabilisée | oui | ⬜ |
| export GL minimal | oui / report explicite | ⬜ |
| rapport sprint 05 | oui | ⬜ |
| alignement doc | oui | ⬜ |

---

## 12. Risques terrain

| Risque | Action |
|--------|--------|
| C5 échoue malgré Sprint 04 | traiter T26 avant tout le reste |
| route GL plus coûteuse qu'anticipé | livrer version minimale avant embellissement |
| export GL trop lourd | limiter au CSV simple |
| régression UX | conserver le panneau latéral en secours temporaire tant que la route n'est pas validée |

---

## 13. Décision de fin de sprint

À renseigner à la clôture :

| Sujet | Décision |
|-------|----------|
| Gate B | ⬜ pleine / ⬜ conditionnelle / ⬜ non prononcée |
| GL dédié | ⬜ livré / ⬜ partiel / ⬜ reporté |
| Export GL | ⬜ livré / ⬜ reporté |
| Sprint 06 | ⬜ rôles / ⬜ GL enrichi / ⬜ Bilan/CR / ⬜ autre |

---

## 14. Suite logique

Si Sprint 05 est réussi :

1. **Gate B pleine** officialisée
2. **Plan Sprint 06** orienté :
   - rôles / habilitations,
   - export GL enrichi,
   - filtres journaux / pagination,
   - extension Bilan / Compte de résultat

---

*Document terrain — exécution directe du Sprint 05, centré sur C5, Gate B pleine et promotion GL.*
