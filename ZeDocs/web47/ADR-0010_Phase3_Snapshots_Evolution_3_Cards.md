# ADR-0010 : Architecture Phase 3 — Snapshots Évolution (Trésorerie, Encours, BFR)

> **Document remplacé par la version acceptée :** [ADR-0010_v1.1_ACCEPTEE.md](./ADR-0010_v1.1_ACCEPTEE.md)

**Statut** : 📋 **Projet** (en attente validation atelier)  
**Date** : 2026-03-13  
**Décideurs** : Équipe Dorevia (produit + technique)  
**Contexte** : Bloc Évolution 3 cards Linky — séries temporelles Trésorerie, Encours, BFR (Phase 3 data)

**Références :**
- [SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md](./SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md) (v1.1.1)
- [PLAN_IMPLEMENTATION_SCRUM_BLOC_EVOLUTION_3_CARDS_v1.0.md](./PLAN_IMPLEMENTATION_SCRUM_BLOC_EVOLUTION_3_CARDS_v1.0.md) (Epic E0)
- [PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md](../web46/PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md) (§4 Phase 3)

---

## Contexte

### Problème

Les cards Trésorerie, Encours et BFR ont un bloc Évolution en état **empty** tant qu’aucune série temporelle fiable n’est exposée. La Phase 3 du plan data prévoit une **historisation** (snapshots) puis des endpoints de série. Pour implémenter E2, E3 et E4 (tables, jobs, endpoints, front), l’équipe doit trancher :

- **Où** stocker les snapshots (tables) ?
- **Qui** héberge et exécute les jobs de snapshotting ?
- **Comment** les séries sont exposées (Vault vs API Linky, contrat) ?
- **Quelle** convention de date (dernier jour calendaire vs ouvré) ?
- **Quelle** granularité pour la v1 (actée : mensuelle) ?
- **Source des données** : acter la règle « Vault = source exclusive ».

Sans ces décisions, les epics E2, E3, E4 restent bloquées.

### Périmètre

- **Snapshots concernés :** Trésorerie (position), Encours (AR), BFR (AR + AP).
- **Usage :** alimentation des blocs Évolution Linky (format aligné spec consolidée §11).
- **Règle d’architecture (spec §2.0) :** toutes les données métier affichées par Linky proviennent **exclusivement du Vault** (ou de tables alimentées par des jobs qui s’appuient sur le Vault). Aucune autre source pour les montants ou agrégats.

---

## Décisions (à acter en atelier)

Les paragraphes ci-dessous formalisent les **six décisions** de l’Epic E0. Les options sont documentées ; la **décision effective** doit être inscrite en atelier et ce document mis à jour (statut → **Accepté**).

### 1. Emplacement des tables

**Options :**

| Option | Description | Avantages / inconvénients |
|--------|-------------|---------------------------|
| **A. Vault** | Tables de snapshots dans la BDD du service Vault | Cohérence données métier au même endroit ; jobs dans le même service. Dépend du modèle et des migrations Vault. |
| **B. BDD dédiée** | Base dédiée (ex. « linky_snapshots » ou service dédié) | Séparation des responsabilités ; Linky peut lire sans passer par Vault. Nécessite hébergement et jobs (cron ou autre). |
| **C. Autre** | Ex. tables dans une BDD existante partagée (Odoo, etc.) | À documenter si retenu ; attention à la règle « source = Vault » (les jobs doivent toujours s’appuyer sur le Vault pour les montants). |

**Décision :** _[À ACTER — choisir A, B ou C et documenter le lieu exact (schéma, noms de tables)]_

---

### 2. Responsabilité des jobs

- **Qui héberge les jobs de snapshotting ?** (cron sur un hôte, scheduler dans Vault, orchestrateur externe, autre.)
- **Fréquence v1 :** **mensuelle** actée (ex. 1er du mois à 00:05 pour le mois précédent). Pas de snapshot journalier en v1.
- **Idempotence :** tout job doit faire **UPSERT** (ou équivalent) sur la clé naturelle `(tenant, company_id, as_of_date)` pour éviter les doublons en cas de relance.

**Décision :** _[À ACTER — hébergeur des jobs, fréquence exacte (cron expression ou équivalent), propriétaire opérationnel]_

---

### 3. Contrat d’exposition (séries)

- **Où sont exposées les séries ?** Endpoint(s) **Vault** (ex. `GET /ui/aggregations/treasury-series`) **ou** **API Linky** (ex. `GET /api/treasury-evolution`) qui lit les tables et agrège.
- **Format de réponse :** aligné sur la spec consolidée **§11** (exemple de payload) : `metric`, `granularity`, `period`, `currency`, `scope`, `points[]` avec `date`, `value`, `secondary` optionnel, `state` / `partial_reason` si besoin.
- En **v1**, la granularité renvoyée peut être **`month`** uniquement ; le contrat API doit l’indiquer (ex. `granularity: "month"` dans la réponse ou la doc).

**Décision :** _[À ACTER — Vault seul, Linky seul, ou les deux (Linky en proxy vers Vault/tables) ; URL(s) cible(s) ; propriétaire du contrat]_

---

### 4. Convention de date

- **as_of_date** d’un snapshot mensuel : **dernier jour calendaire du mois** (ex. 2026-01-31 pour janvier) **ou** dernier jour ouvré ?
- Cette convention doit être **documentée** et **reflétée dans l’API** (ex. `points[].date` = dernier jour de la période).

**Décision :** _[À ACTER — dernier jour calendaire recommandé pour simplicité ; dernier jour ouvré si exigence métier]_

---

### 5. Choix v1 — granularité

**Déjà acté** dans le plan Scrum (convention v1) :

- **Granularité livrée en v1 :** **mensuelle** uniquement.
- **Cible normative long terme (spec) :** journalière ; évolution possible en v2.
- **Visibilité :** (1) contrat API doit exprimer la granularité (ex. `granularity: "month"`) ; (2) recette doit couvrir des cas sur granularité mois.

**Décision :** ✅ **Granularité mensuelle pour la v1** (pas de changement attendu dans cet ADR).

---

### 6. Source des données — Vault source exclusive

**Déjà acté** (spec §2.0, plan Scrum) :

- Les jobs de snapshotting **s’appuient exclusivement sur le Vault** pour les montants et agrégats (appels aux endpoints treasury, ar-by-partner, ap-by-partner, etc.).
- Les endpoints de série lisent soit le Vault en direct, soit des **tables alimentées par ces jobs** (donc dérivées du Vault).
- **Tracé de données :**  
  **Vault (source)** → **jobs de snapshotting** → **tables de snapshots** → **endpoints de série** → **Linky (affichage)**.  
  Aucune autre source métier (BDD Linky, autre microservice) pour les montants affichés sur les blocs Évolution.

**Décision :** ✅ **Vault = source exclusive** ; tracé ci-dessus documenté et à respecter dans l’implémentation E2–E4.

---

## Conséquences

### Une fois les décisions 1–4 actées

- **E2, E3, E4** peuvent démarrer : emplacement des tables et des jobs connu, contrat d’exposition et convention de date fixés.
- **Implémentation :** créer les tables (migrations), implémenter les jobs (UPSERT, fréquence mensuelle), exposer les endpoints (format §11), brancher le front (TresoreriePositionCard, EncoursCard, WorkingCapitalCard) avec `COVERAGE_PARTIAL_THRESHOLD` pour le state partial (Trésorerie).
- **Recette :** idempotence des jobs (relance sans doublon), granularité `month` visible dans l’API et la recette.

### Risques si report

- Sans ADR acté, E2–E4 restent bloqués ; risque de décisions implicites ou divergentes entre devs.

---

## Implémentation (après validation)

1. **Mettre à jour ce document** : remplacer tous les _[À ACTER]_ par les décisions validées ; passer le statut en **Accepté**.
2. **Inscrire la référence** à cet ADR dans le plan Scrum (section E0 / références).
3. **Communiquer** aux devs (emplacement tables, responsabilité jobs, URLs d’exposition, convention de date).
4. **Démarrer E2** (Trésorerie) puis E3 (Encours), E4 (BFR) selon le backlog.

---

## Références

- `ZeDocs/web47/SPEC_CONSOLIDEE_BLOC_EVOLUTION_3_CARDS_v1.0.md` — §2.0 (Vault source exclusive), §11 (contrat API)
- `ZeDocs/web47/PLAN_IMPLEMENTATION_SCRUM_BLOC_EVOLUTION_3_CARDS_v1.0.md` — Epic E0 (E0-US1), E2–E4
- `ZeDocs/web46/PLAN_IMPLEMENTATION_DATA_EVOLUTION_VAULT_LINKY_v1.0.md` — §4 Phase 3 (tables, jobs, endpoints)
- `ZeDocs/web46/ANALYSE_DONNEES_EVOLUTION_VAULT_LINKY.md` — séries vs snapshots, source Vault

---

**Version** : 1.0  
**Date** : 2026-03-13  
**Statut** : 📋 **Projet** — En attente atelier de validation (décisions 1–4)
