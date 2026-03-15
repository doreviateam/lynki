# Plan d'implémentation — Port account_reconcile_oca vers Odoo 19

**Date :** 2026-03-07  
**Version :** 1.0 — prêt à exécution  
**Référence :** `ZeDocs/web39/SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`  
**Durée estimée :** 9,5–15,5 jours  
**Prérequis :** Tenant o19 opérationnel, budget accordé par la comptable

**Racine du projet :** `/opt/dorevia-plateform` — toutes les commandes sont exécutées depuis ce répertoire.

---

## 0. Vue d'ensemble

| Phase | Périmètre | Estimation | Dépendance |
|-------|-----------|------------|-------------|
| **Phase 0** | Préparation et sécurisation | 0,5 j | — |
| **Phase 1** | base_sparse_field | 0,5 j | Phase 0 |
| **Phase 2** | account_reconcile_model_oca | 2–4 j | Phase 1 |
| **Phase 3** | account_reconcile_oca — Python + XML | 3–5 j | Phase 2 |
| **Phase 4** | account_reconcile_oca — Widget JS | 3–5 j | Phase 3 |
| **Phase 5** | Intégration + dorevia_vault_connector | 1 j | Phase 4 |
| **Phase 6** | Tests + recette comptable | 2–3 j | Phase 5 |

**Total :** 9,5–15,5 jours

---

## Checks go/no-go

| # | Quand | Check | Commande |
|---|-------|-------|----------|
| 1 | Avant Phase 0 | o19 opérationnel | `docker ps -f name=odoo_lab_o19 --format '{{.Status}}'` |
| 2 | Avant Phase 1 | account_statement_base installé | `ls units/odoo/addons-o19/account_statement_base/` |
| 3 | Après Phase 4 | Modules installables | `docker compose run --rm --no-deps odoo odoo -c /etc/odoo/odoo.conf -d odoo_lab_o19 -i account_reconcile_oca --stop-after-init` |
| 4 | Après Phase 6 | Recette comptable validée | PV signé |

---

## Phase 0 — Préparation et sécurisation (0,5 j)

*Sur ce type de port, le retour arrière propre vaut de l'or.*

### 0.1 Créer branche Git dédiée

```bash
cd /opt/dorevia-plateform
git checkout -b port-account-reconcile-oca-o19
```

### 0.2 Snapshot / sauvegarde du tenant o19

```bash
# Dump base
cd tenants/o19/apps/odoo/lab
docker exec odoo_db_lab_o19 pg_dump -U odoo -Fc odoo_lab_o19 > /tmp/odoo_lab_o19_pre_port_$(date +%Y%m%d).dump

# Ou via script existant si disponible
# ./dump_laplatine2026.sh  # adapter pour o19
```

### 0.3 Noter les versions exactes des modules existants

```bash
docker exec odoo_lab_o19 odoo shell -d odoo_lab_o19 -c /etc/odoo/odoo.conf --no-http -c "
for m in ['account_statement_base','account_usability','queue_job','dorevia_vault_connector']:
    r = env['ir.module.module'].search([('name','=',m)])
    if r: print(m, r.state, r.latest_version)
"
```

### 0.4 Vérifier le retour arrière

- `reinstall_o19.sh` doit permettre une réinstallation propre sans les modules portés
- Documenter la procédure de rollback : suppression des dossiers addons-o19 (base_sparse_field, account_reconcile_*), réinstall

### 0.5 Critère de sortie

- [ ] Branche `port-account-reconcile-oca-o19` créée
- [ ] Snapshot base sauvegardé
- [ ] Versions modules notées
- [ ] Procédure de rollback documentée

---

## Phase 1 — base_sparse_field (0,5 j)

### 1.1 Vérifier la disponibilité OCA 19.0

```bash
cd /tmp
git clone --depth 1 --branch 19.0 https://github.com/OCA/server-tools.git server-tools-19
ls server-tools-19/base_sparse_field/
```

### 1.2 Copier dans addons-o19

```bash
cp -a /tmp/server-tools-19/base_sparse_field /opt/dorevia-plateform/units/odoo/addons-o19/
```

### 1.3 Installer et vérifier

```bash
cd /opt/dorevia-plateform/tenants/o19/apps/odoo/lab
docker compose run --rm --no-deps odoo odoo -c /etc/odoo/odoo.conf -d odoo_lab_o19 -i base_sparse_field --stop-after-init
```

### 1.4 Critère de sortie

- [ ] Module base_sparse_field installé sans erreur
- [ ] Aucune régression sur les modules existants

---

## Phase 2 — account_reconcile_model_oca (2–4 j)

### 2.1 Copier le module

```bash
cp -a /opt/dorevia-plateform/sources/oca/account-reconcile/account_reconcile_model_oca \
      /opt/dorevia-plateform/units/odoo/addons-o19/
```

### 2.2 Adapter le manifest

**Fichier :** `units/odoo/addons-o19/account_reconcile_model_oca/__manifest__.py`

- Changer `"version": "18.0.1.1.0"` → `"version": "19.0.1.0.0"`
- Vérifier `depends`: `["account"]` (inchangé)
- Vérifier `excludes`: `["account_accountant"]` (inchangé)

### 2.3 Méthode itérative

1. **Installer** — faire émerger les erreurs :
   ```bash
   docker compose run --rm --no-deps odoo odoo -c /etc/odoo/odoo.conf -d odoo_lab_o19 -i account_reconcile_model_oca --stop-after-init 2>&1 | tee /tmp/install_model.log
   ```

2. **Corriger** les erreurs runtime (Python, XML) :
   - `_sql_constraints` → `model.Constraint` si applicable
   - Imports, API deprecated
   - Vues XML (xpath, attributs)

3. **Réinstaller** jusqu'à succès

### 2.4 Fichiers à auditer

| Fichier | Points d'attention |
|---------|-------------------|
| `models/account_reconcile_model.py` | API account.move, account.move.line |
| `models/account_bank_statement_line.py` | Méthodes de matching |
| `views/account_reconcile_model_views.xml` | Structure XML Odoo 19 |

### 2.5 Critère de sortie

- [ ] Module account_reconcile_model_oca installé
- [ ] Modèle `account.reconcile.model` accessible
- [ ] Vues des règles de rapprochement fonctionnelles

---

## Phase 3 — account_reconcile_oca — Python + XML (3–5 j)

### 3.1 Copier le module

```bash
cp -a /opt/dorevia-plateform/sources/oca/account-reconcile/account_reconcile_oca \
      /opt/dorevia-plateform/units/odoo/addons-o19/
```

### 3.2 Adapter le manifest

**Fichier :** `units/odoo/addons-o19/account_reconcile_oca/__manifest__.py`

- `"version": "18.0.1.0.16"` → `"version": "19.0.1.0.0"`
- `depends`: `["account_statement_base", "account_reconcile_model_oca", "base_sparse_field"]`

### 3.3 Ordre de correction (méthode itérative)

1. **Installer** — identifier les erreurs :
   ```bash
   docker compose run --rm --no-deps odoo odoo -c /etc/odoo/odoo.conf -d odoo_lab_o19 -i account_reconcile_oca --stop-after-init 2>&1 | tee /tmp/install_oca.log
   ```

2. **Corriger Python** (priorité) :
   - `models/account_reconcile_abstract.py`
   - `models/account_bank_statement_line.py` — `reconcile_bank_line`, `unreconcile_bank_line`, `_seek_for_lines`
   - `models/account_journal.py`, `account_move_line.py`, etc.
   - `_sql_constraints` → `model.Constraint`

3. **Corriger XML** :
   - Vues, xpath, attributs dépréciés
   - `views/account_bank_statement_line.xml` (form reconcile)

4. **Ignorer temporairement les assets JS** si blocage — les traiter en Phase 4

### 3.4 Points critiques Python

| Méthode / Élément | Fichier | Risque Odoo 19 |
|-------------------|---------|----------------|
| `_seek_for_lines` | account_bank_statement_line | Peut être dans account_statement_base 19.0 ? Vérifier |
| `reconcile_bank_line` | account_bank_statement_line | API account.move.line.reconcile() |
| `_reconcile_move_line_vals` | account_bank_statement_line | Champs account.move.line |
| `model.Constraint` | Tous les modèles | Remplacer _sql_constraints |

### 3.5 Critère de sortie (explicites)

- [ ] **Module charge côté Python** — aucune erreur d'import ou de modèle
- [ ] **Vues principales installées** — aucune erreur XML au chargement
- [ ] **Menu / action accessibles** — entrée « Rapprocher » visible dans l'UI
- [ ] **API appelable** — `reconcile_bank_line()` / `unreconcile_bank_line()` exécutables (même si widget incomplet)
- [ ] Le widget JS peut être cassé à ce stade — Phase 4

*Priorité :* dès que la Phase 3 passe, attaquer immédiatement la validation visuelle du widget (Phase 4), même incomplète. Ne pas attendre la « fin théorique » du port JS pour ouvrir l'écran réel.

---

## Phase 4 — account_reconcile_oca — Widget JS (3–5 j)

### 4.1 Contexte

Le widget repose sur `static/src/js/reconciliation` et des composants OWL. Odoo 19 utilise **OWL v2 + ES modules**.

### 4.2 Audit des assets

```bash
ls -la units/odoo/addons-o19/account_reconcile_oca/static/src/js/
```

Structure typique :
- `reconcile/` — composants principaux
- `reconcile_form/` — formulaire de rapprochement
- `reconcile_move_line/` — lignes
- `widgets/` — reconcile_data_widget, reconcile_chatter_field, etc.

### 4.3 Points d'attention OWL 18 → 19

- `owl` import — version OWL v2
- `@odoo/owl` — package ES module
- Composants : `setup()`, `props`, `useState`, `onMounted`
- Templates : syntaxe OWL v2
- Référence : https://github.com/odoo/owl

### 4.4 Stratégie

1. **Lancer Odoo** avec le module — vérifier les erreurs console navigateur
2. **Corriger** les imports et la syntaxe OWL
3. **Tester visuellement** — créer un relevé, ouvrir le widget de rapprochement
4. **Itérer** jusqu'à affichage correct

### 4.5 Critère de sortie — assets réellement chargés

*Piège Odoo 19 :* module installé, aucun traceback Python, mais widget absent car assets non bundlés.

- [ ] Les assets `web.assets_backend` incluent les fichiers du module
- [ ] Aucune erreur JS bloquante dans la console navigateur
- [ ] Ouverture de l'écran sans écran blanc / composant vide
- [ ] Widget de rapprochement s'affiche
- [ ] Sélection des lignes fonctionne
- [ ] Bouton « Rapprocher » exécute `reconcile_bank_line()`
- [ ] Validation visuelle par le développeur (recette comptable en Phase 6)

### 4.6 Validation navigateur

- Ouvrir le widget depuis l'UI Odoo (Comptabilité → Relevés bancaires → ligne → Rapprocher)
- Ouvrir la console navigateur (F12)
- Capturer les erreurs JS exactes
- Corriger par itérations courtes

*Note :* `docker logs` ne suffit pas pour les erreurs front — la console navigateur est indispensable.

---

## Phase 5 — Intégration dorevia_vault_connector (1 j)

### 5.1 Réactiver la dépendance

**Fichier :** `units/odoo/custom-addons/dorevia_vault_connector/__manifest__.py`

Si le connecteur a une dépendance optionnelle ou commentée vers `account_reconcile_oca`, la réactiver :

```python
"depends": [
    "account",
    "account_reconcile_oca",  # Réactivé après port
],
```

### 5.2 Vérifier le flux DVIG

Le connecteur override `reconcile_bank_line()` et `unreconcile_bank_line()`. Avec OCA installé, ces méthodes existent — vérifier que :

- L'override appelle bien `super()`
- Les événements `bank.move.reconciled` / `bank.move.unreconciled` sont émis
- **Aucune duplication** (critère 7) — partial_reconcile puis full_reconcile ne doivent pas produire 2× bank.move.reconciled

### 5.3 Règle explicite de non-duplication

Pour une même `account_bank_statement_line` :

- Un **rapprochement complet** ne doit produire qu'**un seul** `bank.move.reconciled`
- Un **délettrage** ne doit produire qu'**un seul** `bank.move.unreconciled`

Le flux reconcile → partial_reconcile → full_reconcile ne doit pas émettre 2× `bank.move.reconciled` pour la même ligne.

```bash
# Créer un rapprochement partiel puis complet
# Vérifier dans DVIG :
docker exec dvig-db-core-stinger psql -U dvig_user -d dvig_db -c \
  "SELECT id, payload->>'event_type', payload->>'source_id', created_at FROM outbox_events 
   WHERE payload->>'event_type' IN ('bank.move.reconciled','bank.move.unreconciled') 
   ORDER BY created_at DESC LIMIT 10;"
# Une ligne = un événement. Pas de doublon (même source_id, même type).
```

### 5.4 Test de compatibilité connecteur

- Rapprochement via widget OCA
- Vérifier que le hook Dorevia passe bien par `super()` (override correct)
- Vérifier que l'événement émis contient : **bonne ligne** (source_id), **bon tenant** (o19), **bon sens métier** (reconciled vs unreconciled)

Autrement dit : pas seulement « un événement existe », mais **« le bon événement existe »**.

### 5.5 Mise à jour reinstall_o19.sh

Ajouter `account_reconcile_oca` (et ses dépendances) dans la liste des modules à installer à l'étape 7.

### 5.6 Critère de sortie

- [ ] dorevia_vault_connector fonctionne avec account_reconcile_oca
- [ ] Événements DVIG émis sans duplication (règle 1 ligne = 1 événement)
- [ ] Le bon événement (ligne, tenant, sens) est émis
- [ ] reinstall_o19.sh inclut account_reconcile_oca

---

## Phase 6 — Tests et recette comptable (2–3 j)

### 6.1 Jeu de données minimal — 3 scénarios standardisés

Figer ces 3 scénarios pour une recette robuste et reproductible :

| # | Scénario | Données | Résultat attendu |
|---|----------|---------|------------------|
| 1 | **Rapprochement exact** | 1 ligne bancaire + 1 facture, même montant | Rapprochement en 1 clic, statut « Rapproché » |
| 2 | **Rapprochement avec écart / write-off** | 1 ligne bancaire + montant légèrement différent | Écriture d'écart proposée, write-off appliqué |
| 3 | **Délettrage** | Rapprochement déjà fait | Annulation / unreconcile, statut « À rapprocher » |

### 6.2 Tests techniques

| Test | Commande / Action |
|------|-------------------|
| Installation propre | `./reinstall_o19.sh` (sans dump) |
| Scénario 1 | Rapprochement exact (6.1) |
| Scénario 2 | Rapprochement avec write-off (6.1) |
| Scénario 3 | Délettrage (6.1) |
| API programmatique | Script Python appelant `reconcile_bank_line()` |
| Événements DVIG | Vérifier outbox_events après rapprochement |
| Pas de duplication | Rapprochement partiel → complet, 1 seul événement par ligne |

### 6.3 Recette comptable (MOA)

**Checklist pour la comptable :**

- [ ] Workflow identique à Odoo 18 (laplatine2026)
- [ ] Widget de rapprochement — rapidité, ergonomie
- [ ] Suggestions automatiques — factures proposées
- [ ] Règles de rapprochement — invoice_matching, writeoff
- [ ] Gestion des écarts — write-off
- [ ] Délettrage — unreconcile fonctionne

### 6.4 PV de recette

Rédiger un PV de recette (template similaire à `PV_RECETTE_TENANT_O19_2026-03-06.md`) avec :

- Résultats des 3 scénarios standardisés
- Validation comptable (rapidité, ergonomie, workflow)
- Réserves éventuelles
- Décision : accepté / accepté sous réserve / refusé

### 6.5 Critère de sortie

- [ ] Tous les critères d'acceptation de la SPEC validés
- [ ] PV de recette signé par la comptable

---

## 7. Commandes de référence

```bash
# Racine projet
cd /opt/dorevia-plateform

# Réinstallation o19 (après intégration)
cd tenants/o19/apps/odoo/lab && ./reinstall_o19.sh

# Installation manuelle d'un module
docker compose run --rm --no-deps odoo odoo -c /etc/odoo/odoo.conf -d odoo_lab_o19 -i MODULE_NAME --stop-after-init

# Vérifier les événements DVIG
docker exec dvig-db-core-stinger psql -U dvig_user -d dvig_db -c \
  "SELECT id, payload->>'event_type', created_at FROM outbox_events 
   WHERE payload->>'event_type' IN ('bank.move.reconciled','bank.move.unreconciled') 
   ORDER BY created_at DESC LIMIT 10;"

# Logs Odoo (erreurs JS)
docker logs odoo_lab_o19 2>&1 | tail -100
```

---

## 8. Récapitulatif des livrables

| Livrable | Phase | Fichier / Emplacement |
|----------|-------|------------------------|
| base_sparse_field | 1 | `units/odoo/addons-o19/base_sparse_field/` |
| account_reconcile_model_oca | 2 | `units/odoo/addons-o19/account_reconcile_model_oca/` |
| account_reconcile_oca | 3, 4 | `units/odoo/addons-o19/account_reconcile_oca/` |
| dorevia_vault_connector (dépendance réactivée) | 5 | `units/odoo/custom-addons/dorevia_vault_connector/` |
| reinstall_o19.sh (mis à jour) | 5 | `tenants/o19/apps/odoo/lab/reinstall_o19.sh` |
| PV recette | 6 | `ZeDocs/web39/PV_RECETTE_ACCOUNT_RECONCILE_OCA_O19.md` |

---

## 9. Contribution OCA (post-stabilisation)

Après validation de la recette :

1. Fork OCA/account-reconcile
2. Créer branche 19.0 à partir du port
3. Proposer PR pour account_reconcile_model_oca
4. Proposer PR pour account_reconcile_oca
5. Maintenir branche interne en parallèle jusqu'à merge OCA

---

## 10. Références

- **Spécification :** `ZeDocs/web39/SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`
- **Recommandation :** `ZeDocs/web39/RECOMMANDATION_STRATEGIE_RAPPROCHEMENT_BANCAIRE_O19.md`
- OCA account-reconcile : https://github.com/OCA/account-reconcile
- OCA server-tools : https://github.com/OCA/server-tools
- OWL v2 : https://github.com/odoo/owl
- Changelog Odoo 19 : https://www.odoo.com/documentation/19.0/

---

## 11. Note stratégique

Ce plan ne porte pas juste un module OCA pour le plaisir technique. Il porte un **composant critique d'adoption utilisateur**. C'est un **chantier d'adoption comptable**.

Le vrai champ de bataille sera le **widget JS** et sa cohabitation propre avec `dorevia_vault_connector`.
