# Plan Sprint 05 — Lynki (Phase 2)

**Fichier canonique :** `PLAN_SPRINT_05_LYNKI.md`  
**Version :** 1.0 — mars 2026  
**Date :** 20 mars 2026  
**Statut :** sprint exécutable — suite du [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) **v1.1**

**Sources :** [RAPPORT_SPRINT_04_LYNKI.md](RAPPORT_SPRINT_04_LYNKI.md) **v1.1** · [PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md](PLAN_IMPLEMENTATION_CONSOLIDE_LYNKI.md) **v1.1.1** · [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md) **v1.4** · [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) · [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)

---

## 1. Objectif du sprint

Le Sprint 04 a livré :

- l'extension de la **balance générale** via `account_move_lines`,
- l'activation conditionnelle de **`complete=true`**,
- l'export **BG CSV**,
- l'homogénéisation de **`referentiel_version`**,
- et un statut **Gate B prononcée conditionnellement**.

Le Sprint 05 vise à **clore proprement ce palier** et à **faire franchir un cap UX / produit** au **grand livre**.

### Objectifs principaux

1. **Valider C5 en environnement de référence**  
   Confirmer que la chaîne **Vault réel → Linky** fonctionne sans dépendance au stub en environnement de référence, avec `LINKY_ACCOUNTING_STRICT=1`.

2. **Prononcer Gate B pleine**  
   Transformer la prononciation conditionnelle de Gate B en **validation pleine**, ou documenter explicitement la condition restante si un blocage subsiste.

3. **Promouvoir le grand livre (GL)**  
   Faire passer le GL d'un **panneau latéral** à une **surface dédiée ou route dédiée**, afin d'améliorer :
   - la lisibilité,
   - la profondeur d'analyse,
   - la stabilité de navigation,
   - la préparation à l'export GL et aux droits.

### Objectifs secondaires

4. **Préparer l'export GL** (si faisable dans le sprint)  
5. **Stabiliser les breadcrumbs / retour arrière** dans la chaîne BG → GL  
6. **Tracer le prononcé Gate B dans la documentation de référence**

---

## 2. Périmètre (lots / epics)

| Lot | Epic |
|-----|------|
| **Validation env de référence** | C5, strict mode, suppression de toute ambiguïté stub / réel |
| **3** | Promotion **BG → GL** vers une route / page dédiée |
| **6** *(amorce)* | Export GL si le socle route dédiée est assez stable |
| **0 / transversal** | Doc, ALIGNEMENT, backlog, prononcé Gate B pleine |

**Hors sprint sauf arbitrage :**

- rôles / habilitations complets,
- extension Bilan / Compte de résultat,
- filtres avancés GL (journal, partenaire, pagination fine),
- rejouabilité utilisateur Phase 4.

---

## 3. Dépendances

```text
C5 validé en environnement de référence
        │
        ├──> Gate B pleine
        │
        └──> stabilité doctrine Vault / fin du doute stub
                         │
                         ▼
       promotion GL route/page dédiée
                         │
                         ├──> navigation comptable plus robuste
                         ├──> export GL possible
                         └──> base saine pour rôles / habilitations ultérieurs
```

---

## 4. Tickets (Sprint 05)

| # | Titre | Lot | Dépend de | Statut |
|---|-------|-----|-----------|--------|
| **T26** | **Valider C5** en environnement de référence (`LINKY_ACCOUNTING_STRICT=1`, Vault UP, `data_source=vault`, absence de stub) | Validation / Gate | Sprint 04 livré | todo |
| **T27** | **Promouvoir GL** : route / page dédiée (`/accounting/gl/[account_code]` ou équivalent canonique) à partir du drill BG | 3 | Sprint 03 + Sprint 04 | todo |
| **T28** | **Adapter la navigation BG → GL** : breadcrumbs, retour au niveau comptable précédent, cohérence période / périmètre / compte | 3 | T27 | todo |
| **T29** | **Export GL** minimal (CSV en priorité) — Vault + Linky + bouton UI | 6 | T27 | todo |
| **T30** | **Doc / gating** : mise à jour [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md), [BACKLOG_PHASE2_LYNKI.md](BACKLOG_PHASE2_LYNKI.md), prononcé **Gate B pleine** si T26 OK | transversal | T26–T29 | todo |

*(T29 peut être repoussé si T27–T28 consomment tout le sprint ; dans ce cas, le noter explicitement dans le rapport.)*

---

## 5. Definition of Done (opérationnelle)

| Ticket | DoD minimum |
|--------|-------------|
| **T26** | Vérification documentée en environnement de référence : `LINKY_ACCOUNTING_STRICT=1`, Vault joignable, `data_source=vault`, aucun fallback stub ; trace archivée dans le rapport sprint. |
| **T27** | Le GL est accessible via une route / page dédiée, avec filtres explicites **compte + période + périmètre**, sans casser le drill depuis la BG. |
| **T28** | L'utilisateur peut revenir du GL vers la BG sans perdre le fil comptable ; breadcrumbs et contexte cohérents. |
| **T29** | Export GL téléchargeable depuis la vue GL ; pas d'export depuis stub ; format minimal exploitable en recette. |
| **T30** | Gate B **pleine** prononcée ou blocage restant explicitement documenté ; ALIGNEMENT + BACKLOG + rapport sprint synchronisés. |

---

## 6. Recette — contrôles Sprint 05

### 6.1 Contrôles C5 / Gate B

| Contrôle | Attendu |
|----------|---------|
| `LINKY_ACCOUNTING_STRICT=1` | Activé en environnement de référence |
| Vault disponible | Réponse 2xx |
| `data_source` | `vault` |
| `X-Lynki-Accounting-Source` | `vault` |
| Stub | Aucun fallback silencieux |
| `complete` | Conforme au périmètre réellement couvert |
| `coverage` | Conforme aux sources effectivement actives |

### 6.2 Contrôles GL dédié

| Contrôle | Attendu |
|----------|---------|
| Drill depuis ligne BG | Ouvre la page / route GL du bon compte |
| `account_code` | Identique à la ligne BG source |
| `date_debut` / `date_fin` | Repris sans dérive |
| `company_id` | Conservé si présent |
| Retour / breadcrumb | Revient à la BG, pas au cockpit KPI |
| Régression Pilotage | Aucune |

### 6.3 Contrôles export GL (si T29)

| Contrôle | Attendu |
|----------|---------|
| Téléchargement | OK |
| Source | `vault` uniquement |
| Colonnes minimales | date, journal, pièce, libellé, débit, crédit, solde, compte, referentiel_version |
| Erreur Vault | pas d'export de secours trompeur |

---

## 7. Risques

| Risque | Mitigation |
|--------|------------|
| C5 échoue en environnement de référence malgré le code Sprint 04 | Traiter T26 en tout début de sprint ; ne pas engager la communication "Gate B pleine" avant preuve. |
| Promotion GL plus coûteuse que prévu | Prioriser route dédiée + navigation stable avant enrichissements visuels. |
| Export GL trop ambitieux | CSV minimal d'abord ; pagination et raffinements hors sprint si besoin. |
| Régression UX entre panneau latéral et page dédiée | Garder le panneau comme fallback temporaire tant que la route n'est pas validée. |

---

## 8. Sortie attendue (fin de sprint)

* **C5 validé** en environnement de référence ;
* **Gate B pleine prononcée** ;
* **GL promu** en route / page dédiée ;
* **navigation BG → GL stabilisée** ;
* **export GL minimal** livré **ou** explicitement reporté avec motif ;
* **RAPPORT_SPRINT_05_LYNKI.md** rédigé ;
* **ALIGNEMENT** et **BACKLOG** mis à jour.

---

## 9. Gates — cible fin Sprint 05

| Gate | Cible |
|------|-------|
| **Gate A** | inchangée |
| **Gate B** | **pleine** |
| **Gate C** | renforcée significativement par la promotion GL |
| **Gate D** | non ciblée directement dans ce sprint |

---

## 10. Après ce sprint

Si **Gate B pleine** est validée, la suite logique devient :

1. **Rôles / habilitations** (Lot 6 profond)
2. **Export GL enrichi** / pagination / filtres journaux
3. **Bilan / Compte de résultat** comme extension forte de la Synthèse
4. **Plan Sprint 06** orienté consolidation comptable + accès

---

*Document d'exécution — focalisé sur C5, Gate B pleine et promotion GL.*  
*Tickets terrain : [EXECUTION_TICKETS_SPRINT_05_LYNKI.md](EXECUTION_TICKETS_SPRINT_05_LYNKI.md) v1.0 — ordre d'attaque, preuves attendues, contrôles de recette.*
