# Avis expert — SPEC LINKY Carte « Trésorerie Validée » v1.1

**Date :** 2026-02-22  
**Référence :** ZeDocs/web29/SPEC_LINKY_Tresorerie_Validee_v1.1.md  
**Contexte :** Analyse, critique, amendements et alignement avec l'implémentation réalisée  
**Statut :** Implémenté (voir COMPTE_RENDU_Tresorerie_Validee_v1.1_2026-02-22.md) — amendements proposés pour cohérence future

---

## 1. Synthèse

La SPEC est **claire et bien structurée**. Elle transforme la carte Trésorerie en outil de pilotage avec verdict, métriques secondaires et CTAs. L’implémentation est déjà en place. Quelques **écarts**, **ambiguïtés** et **ajustements recommandés** sont identifiés pour renforcer la cohérence technique et documenter les choix effectués.

| Thème | Avis | Priorité |
|-------|------|----------|
| Objectifs fonctionnels | ✅ Pertinents, chaîne État → Diagnostic → Action | — |
| Impact technique (§9) | ⚠️ Sous-estime le rôle de Vault (bank-reconciliation-health) | **Moyenne** |
| Période des métriques secondaires | ⚠️ Non spécifiée — global vs filtré | **Haute** |
| CTAs « journal filtré » | ⚠️ Non implémenté (URL générique) | Moyenne |
| Répartition améliorée (§5) | ⚠️ Reportée (donut inchangé) | Faible |
| Extension Vault `oldest_unreconciled_date` | ⚠️ Champ manquant dans le handler Vault | **Haute** |

---

## 2. Alignement impact technique (§9)

### 2.1 Constat

La SPEC indique :
> Backend : Extension endpoint GET /api/dashboard-metrics … **Aucun changement Vault requis en v1.1**

### 2.2 Implémentation réelle

L’implémentation utilise deux appels parallèles :
- `GET /ui/aggregations/treasury` (existant)
- `GET /ui/system/bank-reconciliation-health` (route Vault de la SPEC web15)

La route `bank-reconciliation-health` est enregistrée dans Vault (`replay.go`) et appelle Odoo via `ODOO_BANK_RECONCILIATION_URL`. Elle fournit les métriques secondaires (lignes, journaux, dernier relevé).

### 2.3 Amendement proposé

Remplacer la phrase « Aucun changement Vault requis en v1.1 » par :

> **Réutilisation** de la route Vault `GET /ui/system/bank-reconciliation-health` (SPEC ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md).  
> La route Linky `/api/treasury` appelle en parallèle `treasury` et `bank-reconciliation-health`.  
> Vault peut nécessiter une **extension** pour transmettre `oldest_unreconciled_date` si Odoo l’expose (voir §5).

---

## 3. Période des métriques secondaires

### 3.1 Constat

- **Trésorerie** (`/ui/aggregations/treasury`) : reçoit `date_debut`, `date_fin` et transmet à Odoo.
- **Bank-reconciliation-health** : reçoit uniquement `tenant` et `company_id`, **pas de paramètres de période**.

Résultat : les montants principaux (validé, en attente, fiabilité) peuvent être filtrés par période, tandis que les métriques secondaires (lignes à rapprocher, plus ancien mouvement, etc.) sont de fait **globales** (état actuel, toutes périodes).

### 3.2 Risque

L’utilisateur peut sélectionner « Janvier 2026 » et voir une fiabilité calculée sur janvier, alors que « Lignes à rapprocher : 12 » et « Plus ancien mouvement : 15/12/2025 » correspondent à l’état global du rapprochement, pas à janvier. Risque de confusion métier.

### 3.3 Options d’amendement

| Option | Description | Effort | Recommandation |
|--------|-------------|--------|----------------|
| **A** | Métriques secondaires = globales ( état actuel). Documenter explicitement en SPEC. | Faible | ✅ Court terme |
| **B** | Étendre `bank-reconciliation-health` pour accepter `date_debut`/`date_fin` et Odoo pour filtrer. | Moyen | Phase ultérieure |
| **C** | Masquer le bloc secondaire si la période n’est pas « aujourd’hui » ou « mois en cours ». | Faible | Option UX |

**Recommandation :** Adopter l’**option A** pour v1.1 : ajouter en SPEC un § « 4.1 Période » :

> Les métriques secondaires (lignes à rapprocher, plus ancien mouvement, journaux, dernier relevé) reflètent l’**état global** du rapprochement bancaire, indépendamment de la période sélectionnée. Les montants (validé, en attente) et la fiabilité sont filtrés par la période choisie.

---

## 4. Placeholder « aucune donnée »

### 4.1 Constat

La SPEC §4 indique : « Si aucune ligne → afficher "---" ».  
L’implémentation utilise le tiret cadratin « — » (caractère Unicode U+2014).

### 4.2 Amendement proposé

> « --- » ou « — » selon le design system Linky. L’implémentation actuelle utilise « — ».

Pas bloquant : préciser le choix dans la SPEC ou la direction artistique.

---

## 5. Champ `oldest_unreconciled_date` — chaîne complète

### 5.1 Constat

- La SPEC §3.2 définit `date_plus_ancienne_ligne_non_rapprochee`.
- Le COMPTE_RENDU indique qu’Odoo peut exposer `oldest_unreconciled_date`.
- Le handler Vault `BankReconciliationHealthHandler` ne gère que :
  - `reconciliation_rate`, `last_statement_date`, `unreconciled_entries`, `unreconciled_amount`, `bank_accounts_count`.
- Le champ `oldest_unreconciled_date` **n’est pas transmis** par Vault.

La route Linky `/api/treasury` tente de lire `health.oldest_unreconciled_date`, qui sera toujours `undefined` tant que Vault ne le renvoie pas.

### 5.2 Amendement proposé

**Vault** — Étendre `BankReconciliationHealthResponse` et le parsing Odoo :

```go
OldestUnreconciledDate *string `json:"oldest_unreconciled_date"`
```

**Odoo** — Documenter l’exposition de `oldest_unreconciled_date` (YYYY-MM-DD) dans le contrat `GET /dorevia/vault/linky_bank_reconciliation`.

**Priorité :** Moyenne — la carte reste exploitable sans cette métrique (« — » affiché). Utile pour le diagnostic d’ancienneté.

---

## 6. CTAs — « journal filtré »

### 6.1 Constat

La SPEC §6 précise :
> « Rapprocher maintenant » → redirection Odoo **(journal filtré)**

L’implémentation redirige vers :
- `/web#model=account.bank.statement.line` (sans filtre journal)
- `/web#model=account.bank.statement` (idem)

### 6.2 Gap

Sans filtre journal, l’utilisateur arrive sur la liste complète Odoo. En multi-journal, il devra filtrer manuellement.

### 6.3 Amendement proposé

**Option courte (v1.1) :** Documenter que les CTAs ouvrent Odoo sur le modèle cible **sans filtre journal**, avec évolution possible en v1.2 si un identifiant de journal est disponible dans l’API.

**Option cible (v1.2) :** Si `bank-reconciliation-health` ou l’agrégation treasury expose un `journal_id` principal, construire l’URL avec  
`/web#model=account.bank.statement.line&...&domain=[["journal_id","=",ID]]`.

---

## 7. Répartition améliorée (§5)

### 7.1 Constat

La SPEC propose deux options :
- A) Répartition par journal bancaire  
- B) Répartition par ancienneté (0–7 j, 8–30 j, 31–90 j, 90+ j)

L’implémentation conserve le donut actuel (validé vs en attente), sans segmentation.

### 7.2 Recommandation

Conserver le donut simple en v1.1. Préciser en SPEC que les options A et B sont **reportées en v1.2** ou ultérieur. Le bénéfice immédiat (verdict, métriques, CTAs) est suffisant.

---

## 8. Référencement des specs existantes

### 8.1 Spécifications à référencer

- **ZeDocs/web15/SPEC_INDICATEUR_CONFIANCE_RAPPROCHEMENT_BANCAIRE_LINKY_v1.0.md** : définit la route Vault `bank-reconciliation-health` et le contrat Odoo.
- **ZeDocs/web27/AUDIT_SOURCES_DONNEES_LINKY_CARDS.md** : chaîne Trésorerie (Linky → Vault → Odoo).

### 8.2 Amendement proposé

Ajouter un § « Références » en fin de SPEC :

> - web15 : Indicateur Confiance Rapprochement (route `bank-reconciliation-health`, contrat Odoo)  
> - web27 : Audit sources données cartes Linky (chaîne Trésorerie)

---

## 9. Endpoint Odoo — double appel

### 9.1 Constat

Linky effectue deux appels :
1. `GET /ui/aggregations/treasury` → Vault → Odoo `ODOO_BANK_RECONCILIATION_URL` (avec `date_debut`, `date_fin`)
2. `GET /ui/system/bank-reconciliation-health` → Vault → Odoo même URL (sans dates)

Odoo peut donc être appelé deux fois. Si l’URL est la même, un même endpoint peut gérer les deux cas (avec/sans dates) ou deux endpoints distincts peuvent coexister.

### 9.2 Recommandation

Documenter dans le compte rendu ou la SPEC Odoo que l’endpoint `linky_bank_reconciliation` doit :
- Accepter `date_debut` et `date_fin` (utilisés par treasury) ;
- Retourner les champs health (unreconciled_entries, etc.) ;
- Comportement sur les dates : si présentes → filtrer montants par période ; si absentes → état global pour les métriques comptage (lignes, journaux).

---

## 10. Variable d’environnement et build

La SPEC ne mentionne pas `NEXT_PUBLIC_ODOO_URL`. Le COMPTE_RENDU la documente correctement.

**Amendement :** Ajouter au §9 (Impact technique) ou à un nouveau § « Configuration » :

> **Linky** : `NEXT_PUBLIC_ODOO_URL` — URL de base Odoo pour les CTAs (fixée au build via `--build-arg`).

---

## 11. Résumé des amendements proposés

| § | Amendement | Priorité |
|---|------------|----------|
| 9 Impact technique | Préciser réutilisation de `bank-reconciliation-health` et possible extension Vault pour `oldest_unreconciled_date` | Moyenne |
| 4 | Ajouter § 4.1 Période : métriques secondaires = globales, montants = filtrés | **Haute** |
| 4 | « --- » vs « — » : aligner sur design system | Faible |
| 5 (Vault/Odoo) | Étendre Vault et Odoo pour `oldest_unreconciled_date` | Moyenne |
| 6 CTAs | Documenter que les CTAs n’appliquent pas de filtre journal en v1.1 | Moyenne |
| 5 Répartition | Acter le report des options A/B (donut inchangé) | Faible |
| — | Ajouter § Références (web15, web27) | Faible |
| — | Documenter `NEXT_PUBLIC_ODOO_URL` | Faible |

---

## 12. Conclusion

La SPEC Trésorerie v1.1 est **solide et exploitable**. L’implémentation actuelle en respecte l’essentiel. Les amendements proposés visent à :

1. **Aligner la doc** avec l’architecture réelle (Vault, bank-reconciliation-health).
2. **Clarifier la sémantique des périodes** (global vs filtré) pour éviter les malentendus métier.
3. **Compléter la chaîne** pour `oldest_unreconciled_date` (Vault + Odoo) si souhaité.
4. **Documenter les choix** (CTAs sans filtre journal, répartition reportée).

**Recommandation :** Intégrer en priorité l’amendement §4.1 (période des métriques secondaires) et la précision sur l’impact Vault. Les autres points peuvent être traités en marge des prochaines évolutions.

---

*Fin du document*
