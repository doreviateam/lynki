# Annexe Normative — Contraintes Architecturales Company (v1.2)

**Document** : Annexe Normative — Contraintes Architecturales Company  
**Référence principale** : SPEC_VAULT_LINKY_COMPANY v1.1  
**Version** : v1.2 (Normative)  
**Statut** : Obligatoire pour toute nouvelle implémentation  
**Date** : 2026-02  
**Auteur** : Dorevia Team  
**Classification** : Normatif

---

## 0. Objectif de cette annexe

Cette annexe définit les **contraintes architecturales obligatoires** liées à la gestion de la notion de **Company** dans :

- Dorevia Vault
- DVIG
- Connecteurs ERP (Odoo et futurs ERP)
- Dorevia Linky
- Toute brique future manipulant des documents vaultés

Elle vise à garantir :

- l’opposabilité juridique des données
- la cohérence multi-company
- la stabilité des agrégations financières
- la compatibilité multi-ERP future
- la reproductibilité audit / export / preuve

---

## 1. Invariant #1 — Immutabilité du `company_id`

### Règle normative

Le champ **company_id** est **IMMUTABLE** après ingestion dans le Vault.

### Définition

Une fois un document vaulté avec un `company_id` :

- **Il est interdit de** :
  - modifier le company_id
  - corriger le company_id
  - réaffecter le document à une autre company

### Mode de correction autorisé

Toute correction doit passer par :

1. Annulation métier (si applicable)
2. Contre-écriture
3. Nouveau document vaulté avec le bon contexte

### Justification

Garantit : intégrité de la preuve, cohérence hash / signature, auditabilité historique, conformité réglementaire.

---

## 2. Invariant #2 — Idempotence incluant le `company_id`

### Règle normative

Toute clé d’idempotence **DOIT** inclure :

- tenant
- source_system
- source_document_id
- company_id

### Exemple

```
idempotency_key = hash(tenant + source_system + source_document_id + company_id)
```

### Portée

| Composant      | Obligation                                      |
|----------------|--------------------------------------------------|
| Connecteur ERP | DOIT générer la clé avec company_id              |
| DVIG           | DOIT transmettre la clé complète                 |
| Vault          | DOIT considérer cette clé comme référence d’idempotence |

### Justification

Évite : collisions inter-company, déduplication incorrecte, corruption agrégations, incohérence replay / retry.

---

## 3. Invariant #3 — Stabilité du endpoint Companies

### Règle normative

**GET /ui/companies** DOIT retourner une liste **triée de façon stable** par `company_id`.

### Implémentation recommandée

```sql
ORDER BY company_id ASC
```

### Justification

Garantit : stabilité UX, reproductibilité exports, cohérence audit, stabilité tests automatisés.

---

## 4. Portée système

Ces invariants s’appliquent à :

| Domaine         | Impact                |
|-----------------|------------------------|
| Vault Storage   | Structure documents   |
| Vault Ingest    | Validation payload    |
| DVIG            | Propagation idempotence |
| Connecteurs ERP | Construction clés    |
| Linky           | Consommation companies |

---

## 5. Invariant #4 — company_id obligatoire pour nouveaux events

### Règle normative

Pour **tout nouvel event** ou document ingéré après l’entrée en vigueur de cette règle, le champ **company_id** est **obligatoire**. Le connecteur / DVIG DOIT fournir un `company_id` au format normatif ; le Vault DOIT rejeter ou traiter comme invalide tout ingest concerné sans `company_id`.

### Legacy

Les documents déjà présents en base avec `company_id = NULL` restent inchangés et ne sont pas rejetés.

---

## 6. Compatibilité legacy

Ces règles :

- **N’imposent PAS** : re-hash, re-signature, migration des preuves existantes.
- **Autorisent** : `company_id = NULL` pour le legacy ; gestion UI spécifique si filtrage company actif (documents NULL exclus du périmètre).

---

## 7. Principe directeur produit

La preuve financière Dorevia porte toujours son **contexte juridique complet**.  
Une preuve sans company déterminée n’est pas juridiquement exploitable dans un contexte multi-entités.

---

## 8. Statut d’application

Ces règles sont :

- **Obligatoires** pour toute nouvelle implémentation
- **Obligatoires** pour toute évolution DVIG / Connecteurs
- **Référence** pour audits techniques et fonctionnels

---

## 9. Références

- SPEC_VAULT_LINKY_COMPANY v1.1 — ZeDocs/web14/SPEC_VAULT_LINKY_COMPANY_v1.0.md
- FILTRE_LINKY.md — ZeDocs/web14/FILTRE_LINKY.md
- PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md — ZeDocs/web14/PLAN_IMPLEMENTATION_FILTRES_LINKY_SCRUM.md
- INDICATEUR_CERTIFIE_LINKY.md — ZeDocs/web14/INDICATEUR_CERTIFIE_LINKY.md

---

## 10. Décision architecturale

Cette annexe constitue :

- soit une **extension normative** de la SPEC Company v1.1
- soit une **base pour une SPEC v1.2 unifiée**

---

## 11. Historique des versions

| Version | Date    | Description                          |
|---------|---------|--------------------------------------|
| v1.2    | 2026-02 | Première version normative ZeDocs    |
