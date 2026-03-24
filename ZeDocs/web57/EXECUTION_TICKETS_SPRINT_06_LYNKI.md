# Exécution tickets — Sprint 06 Lynki (Phase 2)

**Fichier canonique :** `EXECUTION_TICKETS_SPRINT_06_LYNKI.md`  
**Sprint de référence :** [PLAN_SPRINT_06_LYNKI.md](PLAN_SPRINT_06_LYNKI.md) **v1.0**  
**Date :** 20 mars 2026  
**Version :** 1.0  
**Statut :** exécution terrain — ordre strict de traitement

---

## 1. Objet

Ce document transforme le **Plan Sprint 06** en **séquence terrain exécutable**.

Principe directeur du sprint :

> **T31 d'abord.**  
> Aucun démarrage de **T32, T33, T34, T35** tant que **T31** n'est pas clos et que **Gate B pleine** n'est pas constatée et tracée.

---

## 2. Ordre d'exécution impératif

| Ordre | Ticket | Intitulé | Règle |
|-------|--------|----------|-------|
| 1 | **T31** | Constat **C5** en environnement de référence | **Bloquant** pour tout le reste |
| 2 | **T32** | Rôles / habilitations minimum | Seulement après T31 clos |
| 3 | **T33** | GL enrichi — filtres | Seulement après T32 ouvert |
| 4 | **T34** | GL enrichi — pagination + solde d'ouverture | Après T33 |
| 5 | **T35** | Export GL enrichi | Conditionnel, après T34 stable |
| 6 | **T36** | Doc / gating / clôture sprint | En fin de sprint |

---

## 3. Dépendance structurante

```text
T31 (C5 constaté)
   ↓
Gate B pleine et close
   ↓
T32 (rôles / habilitations)
   ↓
T33 (filtres GL)
   ↓
T34 (pagination + solde d'ouverture)
   ↓
T35 (export GL enrichi)
   ↓
T36 (doc, alignement, rapport)
```

---

## 4. Ticket T31 — Constat C5 en environnement de référence

### 4.1 Objet

Vérifier en **environnement de référence** que la chaîne comptable Lynki fonctionne en **mode strict réel**, sans dépendance au stub.

Le ticket est considéré comme clos uniquement si la preuve est **archivée** dans :

* `RAPPORT_SPRINT_05_LYNKI.md` **v1.1**
* `RAPPORT_SPRINT_04_LYNKI.md` **v1.2**

---

### 4.2 Préconditions

Avant exécution, vérifier :

* environnement de référence identifié ;
* Vault accessible ;
* Linky pointant vers le bon Vault ;
* variable `LINKY_ACCOUNTING_STRICT=1` active ;
* données comptables présentes sur le périmètre testé ;
* tenant / période / company_id de recette connus.

#### Paramètres de recette à renseigner

| Champ | Valeur |
|-------|--------|
| Environnement | … |
| Tenant | … |
| Company ID | … |
| Date début | … |
| Date fin | … |
| URL Linky | … |
| URL Vault | … |
| Date / heure du constat | … |
| Réalisé par | … |

---

### 4.3 Routes à contrôler

#### Route 1 — Balance générale

* `lynki.accounting.trial_balance`
* chemin HTTP Linky / Vault selon l'implémentation en place

#### Route 2 — Grand livre

* `lynki.accounting.general_ledger`
* chemin HTTP Linky / Vault selon l'implémentation en place

---

### 4.4 Critères C5 à vérifier

| Contrôle | Attendu | Résultat |
|----------|---------|----------|
| `LINKY_ACCOUNTING_STRICT=1` | actif | ⬜ |
| Vault joignable | réponse 2xx | ⬜ |
| `data_source` | `vault` | ⬜ |
| Header `X-Lynki-Accounting-Source` | `vault` | ⬜ |
| Stub silencieux | absent | ⬜ |
| Réponse comptable | exploitable | ⬜ |
| Trace datée archivée | oui | ⬜ |

---

### 4.5 Procédure terrain

#### Étape 1 — Vérification configuration

* vérifier la variable `LINKY_ACCOUNTING_STRICT=1`
* vérifier l'URL du Vault utilisée par Linky
* vérifier que le tenant de recette possède des données

#### Étape 2 — Test Balance générale

* appeler la route Linky de `trial_balance`
* vérifier :
  * statut HTTP OK
  * `data_source = vault`
  * header `X-Lynki-Accounting-Source = vault`
  * absence de comportement stub

#### Étape 3 — Test Grand livre

* appeler la route Linky de `general_ledger`
* vérifier les mêmes points :
  * statut HTTP OK
  * `data_source = vault`
  * header = `vault`
  * aucune réponse de secours

#### Étape 4 — Test de résistance

* confirmer qu'en mode strict, si le Vault devient indisponible, le système **ne bascule pas silencieusement** sur un stub
* le comportement attendu est une erreur explicite, pas un faux succès

#### Étape 5 — Archivage

* capturer la preuve :
  * copie de réponse,
  * headers,
  * capture d'écran si utile,
  * date et environnement
* reporter le constat dans :
  * `RAPPORT_SPRINT_05_LYNKI.md` **v1.1**
  * `RAPPORT_SPRINT_04_LYNKI.md` **v1.2**

---

### 4.6 Résultat attendu

#### T31 est **DONE** si :

* tous les contrôles C5 sont verts ;
* la preuve est archivée ;
* **Gate B pleine** peut être prononcée sans réserve.

#### T31 est **NON DONE** si :

* `data_source` n'est pas `vault` ;
* le header n'est pas cohérent ;
* un stub peut encore répondre silencieusement ;
* l'environnement de référence n'a pas été réellement constaté ;
* la preuve n'est pas archivée dans les rapports.

---

### 4.7 Bloc de constat à recopier dans les rapports

#### Constat C5 — environnement de référence

| Champ | Valeur |
|-------|--------|
| Environnement | … |
| Tenant | … |
| Company ID | … |
| Période | … |
| `LINKY_ACCOUNTING_STRICT` | 1 |
| Route BG | OK / NOK |
| Route GL | OK / NOK |
| `data_source` | vault / autre |
| Header source | vault / autre |
| Stub silencieux | absent / présent |
| Conclusion | C5 validé / non validé |
| Date | … |
| Auteur | … |

#### Formulation de clôture proposée

> **C5 constaté en environnement de référence.**  
> Les routes comptables Lynki testées répondent avec `data_source=vault`, le header `X-Lynki-Accounting-Source=vault`, sans fallback stub silencieux, avec `LINKY_ACCOUNTING_STRICT=1`.  
> **Gate B est prononcée pleine et close.**

---

## 5. Ticket T32 — Rôles / habilitations minimum

> **Ne démarrer que si T31 est clos.**

### Objet

Mettre en place le premier niveau de sécurité produit :

* protection `/admin/*`
* rôles fixes :
  * **Admin**
  * **Controller**
  * **Manager**

### Résultat attendu

* Admin : accès complet
* Controller : accès Synthèse + GL
* Manager : accès lecture Synthèse, pas d'admin, pas d'export GL

### Statut

Bloqué tant que T31 n'est pas clos : **⬜**

---

## 6. Ticket T33 — GL enrichi : filtres

> **Ne démarrer que si T32 est ouvert.**

### Objet

Ajouter au GL :

* filtre `journal_code`
* filtre `partner_id` si disponible

### Résultat attendu

* filtres transmis jusqu'au Vault
* URL partageable
* aucune dérive sur compte / période / périmètre

### Statut

Bloqué tant que T32 n'est pas entamé : **⬜**

---

## 7. Ticket T34 — GL enrichi : pagination + solde d'ouverture

> **Après T33.**

### Objet

Ajouter :

* pagination `page` / `limit`
* solde d'ouverture calculé côté Vault avant la première ligne paginée

### Résultat attendu

* page 2+ cohérente
* solde d'ouverture exact
* pas de recalcul fragile en mémoire côté UI

### Statut

Bloqué tant que T33 n'est pas stable : **⬜**

---

## 8. Ticket T35 — Export GL enrichi

> **Conditionnel.**

### Objet

Étendre l'export GL :

* filtres pris en compte
* métadonnées de filtre dans le CSV
* pas d'export si source non Vault

### Résultat attendu

* CSV exploitable en recette
* cohérent avec la vue filtrée

### Statut

À ouvrir seulement si T33–T34 sont stabilisés : **⬜**

---

## 9. Ticket T36 — Documentation / clôture sprint

### Objet

Synchroniser :

* `ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md`
* `BACKLOG_PHASE2_LYNKI.md`
* `RAPPORT_SPRINT_06_LYNKI.md`

### Résultat attendu

* Gate B pleine documentée
* état réel des tickets consigné
* écarts restants clairs

### Statut

Fin de sprint : **⬜**

---

## 10. Point de contrôle quotidien

| Point | Oui / Non | Commentaire |
|-------|-----------|-------------|
| T31 lancé | ⬜ | |
| T31 clos | ⬜ | |
| Gate B pleine prononcée | ⬜ | |
| T32 ouvert | ⬜ | |
| T33 ouvert | ⬜ | |
| T34 ouvert | ⬜ | |
| T35 maintenu / reporté | ⬜ | |
| Doc synchronisée | ⬜ | |

---

## 11. Règle de discipline sprint

Tant que **T31** n'est pas constaté et archivé :

* on **ne communique pas** "Gate B pleine" ;
* on **ne présente pas** la Synthèse comme entièrement stabilisée en production ;
* on **ne banalise pas** le mode strict comme acquis.

---

## 12. Sortie attendue du sprint

Si tout se passe bien :

1. **T31** clos
2. **Gate B pleine et close**
3. **T32** livré
4. **T33–T34** livrés
5. **T35** livré ou report proprement documenté
6. **T36** clôturé

---

*Document d'exécution terrain. Priorité absolue : T31.*
