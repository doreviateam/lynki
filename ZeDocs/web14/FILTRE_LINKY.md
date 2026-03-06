# SPEC — Filtres d’en-tête Linky (Tenant / Company / Période)

**Version** : v1.0  
**Statut** : Spécification produit validée  
**Périmètre** : UI Linky (rapports financiers certifiés)  
**Objectif** : Garantir que tout indicateur affiché est toujours accompagné de son contexte explicite.

---

## 1. Contexte et problème

Linky affiche des indicateurs financiers issus de données **vaultées** (événements scellés).  
Ces indicateurs ne sont **jamais absolus** : ils sont vrais **dans un contexte donné**.

Sans affichage clair de ce contexte, un chiffre devient :
- ambigu,
- difficilement opposable,
- source de confusion métier.

---

## 2. Principe fondamental

> **Un chiffre sans son contexte n’est pas un chiffre.**

Dans Linky, le contexte est défini par **3 axes indissociables** :

1. **Tenant** — périmètre de vérité  
2. **Company** — périmètre juridique / comptable  
3. **Période** — périmètre temporel de lecture  

Ces axes doivent être **visibles, explicites et stables**.

---

## 3. Positionnement des filtres (UX)

### 3.1 Emplacement

- Les filtres sont affichés **en en-tête du rapport / dashboard**.
- Ils sont visibles **avant toute carte d’indicateur**.
- Ils ne sont **jamais cachés** dans un menu secondaire.

Objectif : permettre une lecture immédiate du cadre de vérité.

---

## 4. Filtres définis (v1)

### 4.1 Filtre Tenant

#### Rôle
- Définir la **source de vérité Vault** utilisée.
- Garantir l’isolation des données.

#### Comportement
- **Affiché**
- **Non modifiable** dans la majorité des cas (un utilisateur = un tenant)

#### Valeur par défaut
- Le tenant courant de la session (ex. `sarl-la-platine`)

#### Affichage recommandé
- Libellé lisible du tenant (ex. identifiant technique ou nom d’organisation), visible en en-tête.

---

### 4.3 Filtre Période

#### Rôle
La **Période** définit la fenêtre temporelle selon laquelle
les documents vaultés sont **lus et agrégés**.

Elle ne modifie jamais les données scellées ;
elle restreint uniquement le **champ de lecture**.

#### Comportement v1
- Filtre **affiché et sélectionnable**.
- La période sélectionnée est **unique et globale** :
  - elle s’applique à toutes les cartes (Ventes, Achats, Marge, etc.),
  - aucune carte ne définit sa propre période.

#### Valeur par défaut
- **Toutes périodes**

Justification :
- lecture la plus stable,
- cohérente avec une vision de vérité cumulée,
- évite toute ambiguïté initiale.

#### Presets disponibles (v1)
- Toutes périodes
- Mois en cours
- Trimestre en cours
- Année en cours (YTD)
- Année précédente
- Période personnalisée (date de début / date de fin)

#### Format d’affichage
La période **effective utilisée** est toujours affichée explicitement.

Exemples :
- *Toutes périodes*
- *01/01/2026 – 31/12/2026* (année en cours)
- *01/01/2026 – 31/01/2026* (mois de janvier 2026)

---

## 5. Héritage du contexte

> **Les cartes d’indicateurs n’ont aucun filtre propre.**

Toutes les cartes héritent strictement :
- du tenant,
- de la company sélectionnée,
- de la période sélectionnée.

Cela garantit :
- cohérence globale,
- comparabilité,
- opposabilité.

---

## 6. Périmètre fonctionnel v1 (clair)

### Inclus
- Tenant : affiché, non modifiable
- Company :
  - ancrée dans la donnée vaultée
  - affichée
  - sélectionnable si multi-company
- Période : affichée et sélectionnable

### Exclus
- Multi-tenant dynamique
- Comparaisons inter-tenants

---

## 7. Préconisations d’évolution (roadmap logique)

### Phase 2 — Consolidation avancée
- Sélection multi-company explicite
- Consolidation groupe
- Marges par société

### Phase 3 — Lecture temporelle avancée
- Comparaison N / N-1
- Période certifiée vs période sélectionnée
- Alertes sur couverture partielle

### Phase 4 — Gouvernance
- Historisation des contextes de lecture
- Export / partage de rapports opposables
- Signature de rapport (hash du contexte)

---

## 8. Phrase de référence (produit)

> *Dans Linky, un chiffre est toujours vrai  
> pour une organisation,  
> pour une entité légale,  
> et pour une période explicitement affichées.*
