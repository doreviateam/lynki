# RUNBOOK_ALERTES_UX_SPRINT3

Date: 2026-03-09  
Périmètre: Linky `tenant=o19` (lab)  
Objet: règles d’alerte UX et procédure d’escalade Sprint 3

## 1) Signal surveillé

Source:

- `GET /api/ux-metrics?tenant=o19&lookback_minutes=30`

Champs utilisés:

- `count`
- `p95_ms`
- `p99_ms`
- `slo_state`

## 2) Seuils opérationnels

- **OK**: `p95_ms <= 2000` et `p99_ms <= 4000`
- **WATCH**: `p95_ms <= 3000` et `p99_ms <= 6000`
- **ALERT**: au-delà des seuils WATCH
- **INSUFFICIENT_DATA**: `count < 20` (pas de verdict SLO exploitable)

## 3) Politique de déclenchement

- Fréquence de contrôle recommandée: toutes les 5 minutes.
- Déclenchement:
  - WATCH si 2 mesures consécutives en `watch`.
  - ALERT si 1 mesure en `alert`.
  - INSUFFICIENT_DATA si `count < 20` pendant > 15 minutes.

## 4) Escalade (RACI simplifié)

- **Niveau 1 (MCO on-call)**:
  - prend en charge WATCH/ALERT,
  - collecte la preuve (JSON `/api/ux-metrics`, timestamp, tenant, scope).
- **Niveau 2 (Linky owner)**:
  - intervient si ALERT persiste > 15 min ou 3 ALERT en 1 h.
- **Niveau 3 (MOE plateforme)**:
  - intervient si dérive croise aussi SLA ERP->Vault ou incident inter-service.

## 5) Actions de remédiation guidées

1. Vérifier état service Linky:
   - container up/healthy,
   - temps de réponse API `/api/dashboard-metrics`.
2. Vérifier dépendances non critiques:
   - timeouts DLP,
   - appels annexes qui peuvent polluer le critical path.
3. Vérifier disponibilité Vault:
   - `/ui/system/vault-health`,
   - latence et erreurs.
4. Si besoin: activer mode dégradé/fail-fast sur composants non critiques.
5. Rejouer une mini-campagne (20 requêtes) pour confirmer retour à `ok`.

## 6) Journal d’alerte (format attendu)

Pour chaque incident, consigner:

- `timestamp`
- `tenant`
- `count`, `p95_ms`, `p99_ms`, `slo_state`
- symptôme observé (UI/API)
- cause supposée puis cause confirmée
- action corrective
- heure de retour à `ok`

## 7) Preuve de simulation Sprint 3

Cas de dérive reproduit:

- Avant optimisation: `count=61`, `p95_ms=5130`, `p99_ms=5134.4`, `slo_state=alert`.
- Cause identifiée: timeout DLP trop élevé (`5000 ms`) sur chemin non critique.
- Correctif: fail-fast DLP à `800 ms`.
- Résultat post-correctif: `count=60`, `p95_ms=905.25`, `p99_ms=920.28`, `slo_state=ok`.

## 8) Critère de clôture Sprint 3 (volet alerting)

- Règles WATCH/ALERT formalisées.
- Procédure d’escalade validée.
- Au moins une simulation dérive + retour à `ok` documentée.

## 9) Addendum (2026-03-09)

Le runbook UX est inchangé dans son principe.  
Les mises a jour de recette MOA concernent la coherence des donnees metier affichees (paiements/tresorerie), sans impact sur les seuils UX ni la procedure d'escalade.
