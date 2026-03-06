# Rapport technique — DIVA Cockpit Only

**Date :** 2026-02-18  
**Document de référence :** `ZeDocs/web24/DIVA_Cockpit_Only.md` (SPEC v1.3)  
**Statut :** Analyse de faisabilité, risques et plan d'exécution

---

## 1) Synthèse de la spec

DIVA ne fournit plus qu'**une seule analyse décisionnelle au niveau cockpit**, fondée sur l'ensemble des cards. Les cards individuelles conservent leurs données financières mais n'affichent plus de texte IA. Les principes architecturaux (GET = DB only, génération IA asynchrone, jamais de 404) sont maintenus.

---

## 2) Conformité avec l'existant

| Principe (spec) | État actuel | Verdict |
|---|---|---|
| Séparation Linky / DIVA / Mistral | Implémenté | ✅ Conforme |
| GET = lecture BDD uniquement | Implémenté | ✅ Conforme |
| Jamais de 404, toujours `state` (ready/pending) | Implémenté | ✅ Conforme |
| Refresh = relecture BDD, jamais d'appel Mistral synchrone | Implémenté | ✅ Conforme |
| Génération IA = runner en tâche de fond | Implémenté | ✅ Conforme |

---

## 3) Périmètre exact de la modification

| Composant | Ce qui change | Ce qui NE change PAS |
|---|---|---|
| **Runner** (Go) | Ne génère plus d'insights pour les focus cards | Continue de générer les insights cockpit |
| **Linky** (Next.js) | Ne monte plus `DivaFlashBlock` sur les cards | Les cards affichent toujours leurs données financières |
| **Table `diva_insights`** | Phase 0 : rien. Phase 3 : ajout colonne `error_code` | Index et contraintes existantes : inchangés |
| **DIVA API** | Rien | Endpoints GET/POST restent compatibles (rétrocompatibilité) |
| **Mistral** | ÷4 appels par cycle | Même prompt, même modèle |

---

## 4) Lacunes de la v1.0 — corrigées en v1.1

La spec v1.0 présentait 5 lacunes. La v1.1 les a corrigées, puis la v1.2 a ajouté 3 blindages supplémentaires :

| Lacune v1.0 | Statut | Section |
|---|---|---|
| `company_id` absent | ✅ Intégré dans la clé de contexte et rendu obligatoire | §2 |
| Liste des 8 cards non fournie | ✅ 8 cards rendues obligatoires dans le payload | §5 |
| TTL non spécifié | ✅ Formalisé à 3 minutes | §4 |
| Endpoint POST non décrit | ✅ Formalisé (interne runner uniquement) | §6 |
| JSON non fermé | ✅ Fences corrigées | §5 |

| Blindage v1.2 | Section |
|---|---|
| `context_scope` explicite dans la clé (extensibilité future) | §2 |
| Comportement société supprimée (expiration naturelle, pas de purge) | §3.4 |
| État `failed` → retry automatique au cycle suivant | §6 |
| Invariants `payload_hash` (JSON canonicalisé, arrondis stables, `company_id` inclus) | §7 |

| Blindage v1.3 | Section |
|---|---|
| `context_scope` dans le payload Mistral (collision hash inter-scope) | §5 |
| Mistral indisponible → `failed` + `error_code`, aucun message technique en UI | §6 |
| Contrainte Go : canonicalisation via struct typée, pas de `map` brut | §7 |

### 4.1 Focus : gestion multi-société (company_id)

**Contexte actuel :** Le tenant `sarl-la-platine` contient 2 sociétés :
- `company_id=1` — La Platine
- `company_id=2` — Sweet Manihot (non encore couvert par le runner)
- `company_id=0` — vue consolidée (toutes les sociétés)

Le runner est configuré via `RUNNER_TENANT_CONFIG=sarl-la-platine:0,1`. Sweet Manihot (`company_id=2`) n'est pas couvert.

**La spec v1.3 impose (§3) :** Découverte dynamique des sociétés à chaque tick. Le runner interroge Linky pour obtenir la liste des `company_id` actifs. La configuration statique `RUNNER_TENANT_CONFIG` est explicitement interdite (§3.3). En cas de société supprimée côté Odoo, les insights expirent naturellement sans purge (§3.4).

**Action lors de l'implémentation :**
- Implémenter un endpoint ou requête de découverte des sociétés actives
- Valider que chaque `company_id` (0, 1, 2) génère un insight cockpit distinct
- Vérifier la couverture sur tout ajout futur de société

---

## 5) Risques

### R1 — Suppression boucle cards dans le runner (FAIBLE)

Retirer la boucle sur les 3 focus cards dans `runner.go`. Risque d'affecter la génération cockpit si le code est mal découpé.

**Mitigation :** Vérifier qu'un insight cockpit apparaît en BDD après redéploiement.

### R2 — Oubli d'un montage DivaFlashBlock card dans Linky (FAIBLE)

Si un montage `DivaFlashBlock` avec `focusCardId` est oublié, il affichera "Analyse en cours." indéfiniment.

**Mitigation :** Recherche exhaustive de toutes les occurrences de `DivaFlashBlock` avec `focusCardId`.

### R3 — Mistral 7,8 Go RAM permanente (MODÉRÉ — existant)

`mistral-llamacpp` occupe 7,8 Go même au repos. Le passage cockpit only réduit les appels mais pas l'empreinte mémoire.

**Mitigation :** Arrêter Mistral entre les cycles ou passer le runner en mode `once` déclenché par cron.

### R4 — Insights card orphelins en BDD (NÉGLIGEABLE)

Les 12 insights card existants expirent naturellement en 10 minutes. Purge optionnelle.

### Matrice consolidée

| ID | Risque | Probabilité | Impact | Criticité |
|---|---|---|---|---|
| R1 | Erreur suppression boucle runner | Faible | Pas de génération | 🟡 Faible |
| R2 | Oubli montage DivaFlashBlock | Faible | "Analyse en cours." permanent | 🟡 Faible |
| R3 | Mistral 7,8 Go RAM | Certaine | 50% RAM serveur | ⚠️ Modéré |
| R4 | Insights card orphelins | Certaine | Aucun | 🟢 Négligeable |

**Aucun risque critique.**

---

## 6) Plan d'exécution

Le plan d'exécution complet est documenté dans `PLAN_IMPLEMENTATION_DIVA_COCKPIT_ONLY_2026-02-18.md` (4 phases, 11-14h).

Résumé :

| Phase | Contenu | Effort |
|---|---|---|
| **0** | Supprimer cards IA (runner + Linky) | 1h |
| **1** | TTL 3 min + context_key + company_id=2 | 2h |
| **2** | Découverte dynamique sociétés + cards | 4-6h |
| **3** | État failed + error_code + retry | 2-3h |
| **4** | Tests + mesure de charge | 2h |

---

## 7) Conclusion

Le passage à DIVA Cockpit Only est une opération à **faible risque**. La Phase 0 ne modifie ni le schéma ni l'API. Les phases suivantes introduisent une migration légère (colonne `error_code` en Phase 3) et un changement de format `context_key` (Phase 1, avec purge préalable).

Gain immédiat : ÷4 appels Mistral, temps de génération réduit de ~10 min à ~2-3 min par cycle.

La spec v1.3 a corrigé les lacunes de la v1.0 et ajouté des blindages progressifs (v1.2 : context_scope, société supprimée, état failed, invariants payload_hash ; v1.3 : scope dans le payload, comportement Mistral down, contrainte canonicalisation Go). L'implémentation devra ajuster le TTL de 10 min (existant) à 3 min (spec v1.3), implémenter la découverte dynamique des sociétés, et garantir le retry sur état `failed`.

### Note de cohérence inter-documents

Le rapport de remise en conformité initial (`ZeDocs/web23/RAPPORT_REMISE_EN_CONFORMITE_DIVA_INSIGHTS_2026-02-18.md`) valide un comportement `404` attendu sur `GET /api/diva/insight` sans donnée. Ce comportement a été modifié depuis : le code actuel renvoie `200` avec `state: "pending"` (jamais de 404), conformément à la spec v1.1 §6. Le rapport web23 reflète l'état antérieur à cette correction.
