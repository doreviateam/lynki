# Rapport MOA — Indicateur « Reste à rapprocher (%) »

**Destinataire :** Maîtrise d'Ouvrage  
**Date :** 2026-03-03  
**Objet :** Livraison de l'indicateur « Reste à rapprocher » sur la Card Paiements (Linky)

---

## 1. Synthèse exécutive

L'indicateur **« Reste à rapprocher »** a été spécifié, analysé et **implémenté** sur la Card Paiements de Linky. Il affiche le pourcentage du volume de paiements **non encore rapprochés** sur la période sélectionnée, afin de qualifier la **fiabilité** de la Trésorerie.

**Statut :** Implémentation technique terminée. Backfill de confirmation exécuté pour laplatine2026. L'indicateur affiche des valeurs probantes (ex. 97,3 % reste à rapprocher, 10 750 € rapprochés sur 393 934 € total).

---

## 2. Objectif métier

| Besoin | Réponse |
|--------|---------|
| **Problème** | Linky affiche des montants (paiements, cash, banque) mais ne fournit pas d'indicateur direct de « reste à rapprocher ». |
| **Objectif** | Afficher un pourcentage probant indiquant la part des paiements non rapprochés, pour qualifier la fiabilité de la Trésorerie. |
| **Périmètre** | Card Paiements uniquement — aucun impact sur les autres cards. |

---

## 3. Ce qui a été livré

### 3.1 Spécification

- **SPEC** : `ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md`
- **Référentiel couleurs** : Vert (&lt; 10 %), Jaune (10–30 %), Orange (&gt; 30 %), Rouge (données non garanties uniquement)
- **Gouvernance** : Aucun indicateur affiché si la complétude des preuves n'est pas validée

### 3.2 Implémentation

| Composant | Statut | Description |
|-----------|--------|-------------|
| **Vault** | ✅ Livré | Calcul A (total paiements), R (rapprochés), reste % — réutilisation de l'existant (`financial_recon_deltas`) |
| **API** | ✅ Livré | Enrichissement de l'endpoint treasury avec `reconciliation_metrics` |
| **Linky** | ✅ Livré | Affichage « Reste à rapprocher : XX % » sur la Card Paiements, avec couleurs et texte « Fiabilité faible » si &gt; 30 % |

### 3.3 Documentation

- **Plan d'implémentation** : `ZeDocs/web38/PLAN_IMPLEMENTATION_RESTE_A_RAPPROCHER.md`
- **Runbook backfill** : `ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md` (inclut Option C — re-play après correction)
- **Rapport d'analyse expert** : `ZeDocs/web38/RAPPORT_ANALYSE_EXPERT_SPEC_RESTE_A_RAPPROCHER.md`
- **Tests d'acceptation AT1–AT5** : `ZeDocs/web38/TESTS_ACCEPTATION_AT1_AT5.md`
- **Script backfill** : `scripts/backfill_reconciliation_after_fix.py`

---

## 4. Décisions validées

| Décision | Choix |
|----------|-------|
| **Nouvelle table** | Non — réutilisation de `financial_recon_deltas` (existant) |
| **Règle « rapproché »** | `SUM(direction) > 0` — gère correctement le délettrage (rapproché puis délettré = non rapproché) |
| **Exposition API** | Extension de `/api/treasury` uniquement (pas d'endpoint isolé) |
| **Ratio C (couverture)** | Intégré en annexe de la SPEC — extraction ultérieure si réutilisation ailleurs |
| **Complétude vs table vide** | Table vide ≠ KO. Si complétude OK et aucune ligne → 100 % affiché (état métier : aucun rapprochement fait) |
| **Couleurs** | Rouge réservé au blocage exploitation (données non garanties). Jamais pour un « mauvais » KPI. |

---

## 5. Actions réalisées (2026-03-03)

### Contexte initial

Pour laplatine2026, la table des confirmations bancaires (`financial_recon_deltas`) était **vide** car les événements de rapprochement avaient été traités **avant** que les paiements existent dans le Vault.

### Actions réalisées

| Action | Statut | Détail |
|--------|--------|--------|
| Re-confirmation manuelle (paiements 678, 679) | ✅ Fait | 2 lignes insérées dans `financial_recon_deltas` |
| Rebuild image Vault | ✅ Fait | `reconciliation_metrics` désormais exposé dans l'API treasury |
| Correction `_traverse_to_impacted_documents` | ✅ Fait | Fallback `_all_partials_lines` pour écritures indirectes (lignes 7, 8) |
| Backfill confirmation | ✅ Fait | 2 lignes traitées, worker DVIG déclenché |
| Tests AT2, AT4 | ✅ Exécutés | Calcul correct, idempotence validée |

### État actuel laplatine2026

- **Total paiements (A) :** 393 934 €  
- **Rapprochés (R) :** 10 750 €  
- **Reste à rapprocher :** 97,3 % (383 184 €)

### Pour rattraper d'autres lignes (optionnel)

Si des lignes rapprochées n'ont pas encore d'`impacted_documents` (ex. lignes 7, 8 — écritures manuelles ou chaînes complexes), voir **Option C** du runbook : suppression des événements outbox concernés, réinitialisation du curseur, relance du backfill.

---

## 6. Lecture de l'indicateur (après backfill)

> Cet indicateur ne mesure pas la qualité comptable, mais la **couverture probante des flux par des preuves bancaires**.

| Reste à rapprocher | Couleur | Interprétation |
|--------------------|---------|----------------|
| &lt; 10 % | 🟢 Vert | Trésorerie fiabilisée |
| 10 % – 30 % | 🟡 Jaune | Attention, rapprochement en cours |
| &gt; 30 % | 🟠 Orange | Fiabilité faible — texte « Fiabilité faible » affiché |
| Données incomplètes | 🔴 Rouge | Indicateur masqué (gouvernance) |

---

## 7. Prochaines étapes

| Priorité | Action | Responsable | Statut |
|----------|--------|-------------|--------|
| ~~**P0**~~ | ~~Exécuter le backfill confirmation pour laplatine2026~~ | Ops | ✅ Fait |
| **P1** | Vérifier l'affichage sur Linky (Carte Paiements) | MOA / Ops | À faire |
| **P2** | Tests d'acceptation AT1, AT3, AT5 (AT2 et AT4 validés) | QA | Partiel |
| **Optionnel** | Extension dashboard-metrics si besoin DIVA / export | Dev | — |

---

## 8. Références

- SPEC : `ZeDocs/web38/SPEC_RESTE_A_RAPPROCHER.md`
- Runbook : `ZeDocs/RUNBOOK_BACKFILL_CONFIRMATION.md`
- Plan : `ZeDocs/web38/PLAN_IMPLEMENTATION_RESTE_A_RAPPROCHER.md`
- Tests AT1–AT5 : `ZeDocs/web38/TESTS_ACCEPTATION_AT1_AT5.md`
