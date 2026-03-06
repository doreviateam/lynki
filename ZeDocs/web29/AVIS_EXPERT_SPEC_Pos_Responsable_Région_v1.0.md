# Avis expert — SPEC Points de vente (Responsable Région) v1.0

**Date :** 2026-02-21  
**Référence :** ZeDocs/web29/SPEC_Pos_Responsable_Région_v1.0.md  
**Contexte :** Revue pour avis, amendements et questions avant implémentation  
**Cible :** Card "Points de vente" — Persona Responsable Région (Maxi Zoo)

---

## 1. Synthèse

La SPEC est **claire et bien alignée** sur le besoin métier (supervision opérationnelle en < 3 s). Plusieurs **écarts structurants** avec l’existant et des **blocages techniques** nécessitent des amendements avant implémentation.

| Thème | Avis | Priorité |
|-------|------|----------|
| Objectif et principes | ✅ Pertinent, design orienté exception | — |
| `expected_sessions` / planning | 🔴 Source inexistante | **Haute** |
| Verdict OK / WARNING / CRITICAL | ⚠️ Implémentable partiellement sans `expected_sessions` | **Haute** |
| Scope « région » | ⚠️ Non modélisé dans la stack | **Moyenne** |
| Granularité « aujourd’hui » | ⚠️ À clarifier | Moyenne |
| Alignement implémentation actuelle | ⚠️ Écarts majeurs | **Moyenne** |

---

## 2. Point bloquant : `expected_sessions`

### 2.1 Constat

La SPEC définit ( §4.1 ) :

- `expected_sessions` : sessions attendues (planning ouverture)
- `missing_sessions` = `expected_sessions` − `reported_sessions`
- `unsealed_sessions` = `reported_sessions` − `sealed_sessions`

Le verdict CRITICAL dépend de `missing_sessions > 0`, donc de `expected_sessions`.

### 2.2 État de la stack

- **Vault** : `GET /ui/aggregations/pos-sessions` ne retourne que des sessions **effectivement remontées** (`pos.session.closed`).
- **Réponse actuelle** : `total_sessions`, `sealed_sessions`, `pending_sessions`, `items[]`.
- Aucune source « planning ouverture » n’existe dans Odoo, Vault ou DVIG.

### 2.3 Options d’amendement

| Option | Description | Effort | Risque |
|--------|-------------|--------|--------|
| **A** | Créer une source « planning » (Odoo, config externe, etc.) | Élevé | Moyen |
| **B** | V1.0 sans `expected_sessions` : CRITICAL jamais atteint, verdict limité à OK / WARNING | Faible | Faible |
| **C** | Heuristique : `expected_sessions = reported_sessions` si aucune source planning | Faible | UX trompeuse (toujours 100 % remonté) |

**Recommandation :** Pour une v1.0 exploitable :

1. **Amender la SPEC** : distinguer explicitement une **phase 1** sans `expected_sessions`.
2. **Phase 1** : verdict seulement sur `unsealed_sessions` :
   - OK si tout scellé
   - WARNING si ≥ 1 session non scellée (pending / failed)
   - CRITICAL non utilisé en phase 1 (ou réservé à des cas extrêmes : 0 session remontée sur la journée avec magasins actifs, si cette info existe).
3. **Phase 2** : introduire une source de planning dès qu’elle est définie et disponible.

---

## 3. Scope « région » et multi-société

### 3.1 Constat

- Persona : Responsable **Région** (Lee — Maxi Zoo).
- La SPEC ne définit pas la notion de **région** dans le modèle de données.
- Actuellement : agrégation par `tenant`, pas de filtrage par région ni par société.

### 3.2 Questions pour le métier

1. **Région** : Correspond-elle à un périmètre Odoo (société, zone, autre) ? Où cette info est-elle stockée ?
2. **Multi-société** : Un responsable région voit-il une ou plusieurs sociétés ? `PosShopsView` reçoit `companies` mais ne filtre pas par `company_id`.
3. **Données manquantes** : Si un magasin n’a pas remonté de session sur la journée, comment le savoir sans planning ? (magasins actifs vs sessions remontées)

### 3.3 Amendement proposé

Ajouter en annexe un § « Périmètres » :

- Définition de « région » (mapping technique : champ Odoo, config, etc.).
- Comportement attendu en multi-société (filtre société, agrégation cross-company, etc.).
- Si non disponible en v1.0 : préciser « tenant = région » par défaut, avec évolution ultérieure.

---

## 4. Granularité temporelle « aujourd’hui »

### 4.1 Constat

Objectif produit (§1) :  
> Mes magasins fonctionnent-ils normalement **aujourd’hui** ?

- L’implémentation actuelle utilise une période configurable (`date_debut`, `date_fin`) : exercice, YTD, mois, etc.
- « Aujourd’hui » suggère une vue **jour courant** pour la supervision opérationnelle.

### 4.2 Recommandation

- **Amender la SPEC** : préciser la granularité par défaut pour cette card :
  - Option A : toujours « aujourd’hui » (date du jour).
  - Option B : période sélectionnée en header, avec **recommandation** « aujourd’hui » pour le persona Responsable Région.
- Préciser si la période peut rester modifiable (YTD, mois, etc.) ou si la card est figée sur « aujourd’hui ».

---

## 5. Alignement avec l’implémentation actuelle

### 5.1 Écarts principaux

| Élément SPEC | Implémentation actuelle |
|--------------|-------------------------|
| Bloc synthétique : X magasins, **Y attendues**, Z sécurisées | Pas de « sessions attendues » ; affichage : X magasins • Y sessions • Z sécurisées • N en attente |
| Verdict global (OK / WARNING / CRITICAL) | Pas de verdict ; bordure verte si shops > 0 |
| Hiérarchie : verdict → intégrité → localisation → volume | Volume (total €) en tête ; intégrité ensuite |
| Bloc détail : nominal / non scellée / manquante | Volume par magasin d’abord ; détail sessions en expand |
| Sessions manquantes par magasin | Non supporté (pas de `expected` par shop) |

### 5.2 Ce qui est déjà en place

- Nombre de magasins actifs ✓
- Sessions remontées ✓
- Sessions sécurisées ✓
- Sessions en attente (pending) ✓
- Volume € par magasin ✓
- Détail sessions (expand) ✓
- Statuts : sealed, pending, failed, missing ✓

### 5.3 Amendements UX proposés

1. **Hiérarchie** : Mettre le verdict (bloc synthétique) **avant** le volume dans la card.
2. **Bloc synthétique** : Adapter le libellé à la phase 1 :
   - Remplacer « Y sessions attendues » par « Y sessions remontées » tant que `expected_sessions` n’existe pas.
   - Ou : « Y sessions remontées (Z attendues si planning disponible) ».
3. **Verdict** (phase 1) :
   - OK : 100 % des sessions remontées sont scellées.
   - WARNING : ≥ 1 session non scellée.
   - CRITICAL : réservé à la phase 2 (avec planning), sauf cas explicite (ex. 0 session alors que des magasins étaient ouverts).

---

## 6. Clarifications techniques

### 6.1 `vault_status` : sémantique de « missing »

Dans le modèle actuel : `vault_status` ∈ {sealed, pending, failed, **missing**} :

- **SPEC** : « session manquante » = session **non remontée** (jamais reçue).
- **Vault/Linky** : `missing` peut signifier « non vaultée » pour une session déjà connue.

**Recommandation :** Documenter précisément dans la SPEC :

- `missing` côté Vault : session connue mais non vaultée.
- « Session manquante » métier : session attendue (planning) mais jamais remontée → notion distincte, dépendante de `expected_sessions`.

### 6.2 API Vault — extensions possibles

Pour une future phase avec planning, l’API pourrait évoluer ainsi :

```json
{
  "expected_sessions": 20,
  "reported_sessions": 18,
  "sealed_sessions": 17,
  "pending_sessions": 1,
  "missing_sessions": 2,
  "items": [ ... ]
}
```

Ou bien exposition de `expected_sessions` par magasin si le planning est granulé.

---

## 7. Cohérence avec les SPEC existantes

- **ZeDocs/web18/sessions.md** : définit la réponse `pos-sessions` actuelle (sans `expected_sessions`).
- **ZeDocs/web20/SPEC_POS_STRUCTURE_LINKY_v1.0.md** : structure UX POS (synthèse → détail → évolution).

**Recommandation :** Faire référencer ces specs et préciser que la SPEC Responsable Région en est une **évolution ciblée** (persona, verdict, hiérarchie), sans les invalider.

---

## 8. Évolutions futures (§9) — remarques

Les évolutions listées (baisse anormale de volume, comparaison semaine, heatmap, alerting) sont cohérentes. Suggérer d’ajouter :

- **Intégration planning ouverture** (pour débloquer `expected_sessions` et le verdict CRITICAL).

---

## 9. Résumé des amendements proposés

| § | Amendement | Priorité |
|---|------------|----------|
| 4.1 | Introduire une **phase 1 sans `expected_sessions`** ; verdict limité à OK / WARNING | Haute |
| 4.2 | Phase 2 : documenter la source et le format de `expected_sessions` | Haute |
| — | Ajouter un § « Périmètres » (région, multi-société) | Moyenne |
| 3.1 | Clarifier la granularité par défaut (« aujourd’hui » vs période) | Moyenne |
| 5 | Inverser la hiérarchie : verdict avant volume ; adapter libellés | Moyenne |
| 6.1 | Distinguer « session manquante » métier vs `vault_status: missing` | Faible |
| — | Référencer web18/sessions et web20/SPEC_POS_STRUCTURE | Faible |

---

## 10. Conclusion

La SPEC est **solide sur le plan métier** et le design orienté exception. Le principal point bloquant est l’absence de **source pour `expected_sessions`**.

**Recommandation :** Valider une **SPEC v1.1** avec :

1. Phase 1 sans `expected_sessions`, verdict OK / WARNING uniquement.
2. Clarifications sur région, multi-société et granularité temporelle.
3. Ajustements UX pour mettre le verdict en premier et adapter les libellés.

L’implémentation peut démarrer dès que ces amendements sont intégrés. La phase 2 (CRITICAL, sessions manquantes) pourra suivre quand une source de planning sera disponible.

---

*Fin du document*
