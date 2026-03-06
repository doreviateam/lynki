# Avis expert — SPEC v1.1 Complétude avant affichage

**Date :** 2026-03-03  
**Objet :** Évaluation de la SPEC par rapport à l'implémentation actuelle  
**Référence :** SPEC_COMPLETUDE_AVANT_AFFICHAGE_v1.1.md

---

## 1. Synthèse

La SPEC v1.1 formalise une **position produit exigeante et cohérente** : Vault = autorité, complétude probante (pas d'API), matérialisation sur événement, blocage global des cartes tant que les preuves ne sont pas complètes.

L'implémentation actuelle est en **phase transitoire** : elle pose les fondations (retries, `sealed_count_complete`, badge) mais **ne respecte pas encore** la règle centrale (cartes masquées si incomplet) ni l'architecture cible (expected_count interne Vault, matérialisation).

**Recommandation :** Valider la SPEC ; planifier une roadmap en 2 phases : Phase 1 (blocage UX conforme à la spec) sans attendre le Vault ; Phase 2 (complétude probante, expected_count, matérialisation) côté Vault.

---

## 2. Écart principal : blocage des cartes

| Aspect | Implémentation actuelle | SPEC v1.1 §4.2 |
|--------|-------------------------|----------------|
| **Cartes si `sealed_count_complete === false`** | Affichées (avec données partielles) | **Non affichées** |
| **Zone principale** | IconGrid / cartes détaillées visibles | « Synchronisation des preuves en cours… » + progression (223 / 516) |
| **Badge** | Toujours affiché (« X preuves (partiel) » en orange) | Non affiché ou indicateur neutre |

**Impact :** L'utilisateur voit aujourd'hui des chiffres potentiellement incomplets. La SPEC exige qu'aucun KPI stratégique ne soit affiché tant que la complétude n'est pas validée. C'est l'écart le plus visible et le plus critique.

---

## 3. Ce qui existe aujourd'hui (aligné ou partiel)

### 3.1 API dashboard-metrics

| Élément | Implémenté | Alignement SPEC |
|---------|------------|-----------------|
| `sealed_count` | Oui (somme des 5 sources) | Partiel — pas de comparaison à `expected_count` |
| `sealed_count_complete` | Oui (5 endpoints ont répondu) | §3.5 : complétude d'API seulement, pas probante |
| `sealed_count_sources` | Oui (sales, purchases, paymentsIn, paymentsOut, pos) | OK — utile pour diagnostic |
| Budget 5 s | Oui (2 tours × 2,5 s) | §5.1 OK |
| Retry frontend | Oui (1 fois après 2 s si incomplet) | §5.1 OK |
| Scope (tenant, société, période) | Oui (paramètres API) | §3.7 OK |

### 3.2 Badge IntegrityBadge

| Élément | Implémenté | Alignement SPEC |
|---------|------------|-----------------|
| Affichage si complet | « X preuves scellées » (vert) | §4.1 OK |
| Affichage si incomplet | « X preuves (partiel) » (orange) | §4.2 : spec demande « non affiché ou neutre » — léger écart |
| Icône / tooltip | Oui | OK |

### 3.3 Vault

| Élément | Implémenté | Alignement SPEC |
|---------|------------|-----------------|
| Endpoints `/ui/aggregations/*` | Oui (sales, purchases, payments-in, payments-out, pos-sessions) | §3.2 OK |
| `expected_count` par source | Non | §3.3 : requis pour complétude probante |
| Complétude matérialisée sur événement | Non (calcul à la requête) | §3.6 : écart majeur |
| `completeness_snapshot(scope)` | Non | §3.8 : à créer |

---

## 4. Évaluation détaillée

### 4.1 Points forts de la spec

| Élément | Avis |
|--------|------|
| **Vault = centre** | Complétude = état du Vault, pas des endpoints — invariant clair |
| **expected_count interne** | Pas de requête live ERP — évite latence, couplage, instabilité |
| **Matérialisation sur événement** | Stabilité, pas de saut au refresh — architecture mature |
| **Scope explicite** | tenant + société + période ; indépendance des scopes — évite les pièges |
| **Blocage global** | Rigueur > disponibilité partielle — cohérent avec la vision CFO |
| **Progression UX** | 223 / 516 — rassure sans tromper, pas un KPI |
| **Architecture logique** | ERP → DVIG → Vault → completeness_snapshot → Linky → Cartes — schéma clair |

### 4.2 Écarts d'implémentation (priorisation)

| Priorité | Écart | Effort estimé | Phase suggérée |
|----------|-------|---------------|----------------|
| **P0** | Cartes affichées même si incomplet | Faible (condition front) | Phase 1 |
| **P0** | Pas d'écran « Synchronisation en cours » + progression | Moyen (nouveau composant) | Phase 1 |
| **P1** | Complétude = API OK, pas vault_sealed == expected_count | Élevé (Vault) | Phase 2 |
| **P1** | Pas de matérialisation sur événement | Élevé (Vault) | Phase 2 |
| **P1** | expected_count non exposé par le Vault | Élevé (Vault + DVIG) | Phase 2 |
| **P2** | Badge affiché en mode « partiel » au lieu de masquer | Faible | Phase 1 |

### 4.3 Points à préciser (avant implémentation Phase 2)

| Élément | Question | Proposition |
|---------|----------|-------------|
| **expected_count** | D'où vient-il concrètement ? | DVIG : watermark par type d'événement ; ou table Vault `expected_counts(scope, source, count)` mise à jour par le connecteur |
| **Matérialisation** | Où stocker `completeness_snapshot` ? | Table Vault `completeness_snapshots(tenant, company_id, period_from, period_to, sealed_count, complete, updated_at)` ; trigger ou job après chaque scellement |
| **Périmètre POS** | POS n'a pas d'ERP « attendu » au sens strict | Définir expected_count POS : sessions créées dans l'ERP ? Ou count au moment du dernier sync DVIG ? |
| **Carte Trésorerie** | Position à date, pas liée à une période | La carte Trésorerie est-elle soumise à la complétude des 5 sources ? Spec §4.1 : oui. À confirmer avec le produit. |

---

## 5. Recommandations

### 5.1 Phase 1 — Conformité UX (sans attendre le Vault)

**Objectif :** Appliquer la règle « aucune carte si incomplet » avec la complétude d'API actuelle.

| Action | Fichier / Composant |
|--------|---------------------|
| Si `sealed_count_complete === false` : masquer IconGrid et cartes détaillées | DashboardWithFilters.tsx |
| Afficher écran « Synchronisation des preuves en cours… » + progression (sealed_count / — si expected inconnu) | Nouveau composant ou section dans DashboardWithFilters |
| Optionnel : masquer le badge ou le mettre en neutre quand incomplet | IntegrityBadge.tsx, ReportHeader.tsx |
| Bouton « Réessayer » en cas d'erreur durable | Déjà partiel via onRefresh — renforcer le message §6.3 |

**Risque assumé :** On bloque sur une « fausse » incomplétude (endpoints lents) mais on évite d'afficher des données partielles. Cohérent avec la spec.

### 5.2 Phase 2 — Complétude probante (côté Vault)

**Objectif :** Atteindre `vault_sealed_count == expected_count` et matérialisation.

| Action | Composant |
|--------|-----------|
| Définir et implémenter `expected_count` par source (DVIG ou connecteur) | Vault + DVIG |
| Exposer `completeness_snapshot(scope)` ou enrichir les agrégations | Vault |
| Recalculer / matérialiser à chaque événement scellé | Vault (trigger, job ou event handler) |
| Adapter dashboard-metrics pour consommer le snapshot (si exposé) ou conserver la logique actuelle en attendant | Linky |

### 5.3 Tests à prévoir

| Test | Objectif |
|------|----------|
| Carte masquée si une source en timeout | Valider blocage global |
| Progression affichée (X / —) pendant chargement incomplet | Valider UX §6.1 |
| Carte affichée dès sealed_count_complete === true | Valider transition |
| Comportement avec données cached (sessionStorage) | Éviter affichage stale si scope change |

---

## 6. Conclusion

La SPEC v1.1 est **solide, cohérente et alignée avec la vision produit** (Vault centre, rigueur CFO, pas de vérité partielle). L'implémentation actuelle en est à **~40 %** : fondations (API, retries, badge) posées, mais règle centrale (blocage des cartes) et architecture cible (expected_count, matérialisation) manquantes.

**Phase 1 (2–3 j)** peut livrer une UX conforme à la spec en bloquant les cartes lorsque `sealed_count_complete === false`, avec une complétude encore « technique » (endpoints OK).  
**Phase 2 (2–4 semaines)** requiert des évolutions Vault et DVIG pour la complétude probante et la matérialisation.

---

*Avis rédigé au regard de l'état du code (dashboard-metrics, DashboardWithFilters, IntegrityBadge, ReportHeader, Vault) au 2026-03-03.*
