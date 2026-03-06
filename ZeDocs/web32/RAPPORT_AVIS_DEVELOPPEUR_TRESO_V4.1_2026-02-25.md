# Rapport-Avis Développeur — Carte Trésorerie v4.1

**Date :** 2026-02-25  
**Rédacteur :** Équipe développement  
**Objet :** Avis technique sur l'implémentation v4.1, constats terrain et adéquation avec la redéfinition des métriques (confirmation bancaire)

---

## 1. Contexte

La carte Trésorerie v4.1 (spec hybride Position + Process) a été déployée sur le tenant sarl-la-platine. Lors de la qualification, plusieurs constats ont mis en évidence un décalage entre le modèle de données actuel et l'interprétation métier attendue.

Ce document formalise l'avis développement : état technique, limites identifiées et recommandations au regard de la **redéfinition des métriques** proposée (base = événements financiers vaultés, indicateur = taux de confirmation bancaire).

---

## 2. État technique au 2026-02-25

### 2.1 Données Vault (tenant sarl-la-platine)

| Entité | Table / Source | Volume | Montant (€) |
|--------|----------------|--------|-------------|
| **Paiements vaultés** | `documents` (source=payment, odoo_model=account.payment) | 73 | 2 403 503,01 |
| **Lignes rapprochées** | `bank_reconciliation_projection` (is_reconciled=true) | 5 | 483 400,60 (volume) / -477 320 (solde net) |
| **Lignes non rapprochées** | `bank_reconciliation_projection` (is_reconciled=false) | 0 | 0 |

### 2.2 Architecture v4.1 actuelle

- **Position** : `validated_balance` (projection RECONCIL) + `erp_balance` (proxy Odoo)
- **Process** : `reconciled_volume` / `unreconciled_volume` — source projection RECONCIL, avec **fallback Odoo** lorsque projection `unreconciled_volume = 0` alors qu'Odoo signale des montants en attente

### 2.3 Problèmes rencontrés en qualification

| Problème | Cause | Impact |
|----------|-------|--------|
| Affichage « 0 € en attente » alors qu'Odoo indique 5 760 € | Projection RECONCIL ne contient aucune ligne non rapprochée (0) | Fallback Odoo ajouté |
| Incohérence Position vs Process (200 € d'écart) | Mix validated_balance (Vault) + reconciled_balance (Odoo) — formules différentes | Alignement forcé sur \|validated_balance\| pour reconciled_volume en fallback |
| Interprétation « j'ai validé peu de factures » vs 477 k€ affichés | Confusion factures / rapprochement bancaire ; projection ne reflète pas le périmètre « événements financiers » | Clarification nécessaire |
| Mélange de sources (Vault + Odoo) | Pas de single source of truth pour Process lorsque projection incomplète | Logique de fallback difficile à maintenir |

---

## 3. Adéquation avec la redéfinition des métriques

### 3.1 Nouvelle définition (résumé)

| Métrique | Formule | Signification |
|----------|---------|---------------|
| **X (Base)** | Σ montants événements financiers vaultés | Engagement financier total validé et scellé |
| **Y (Confirmé)** | Σ montants événements dont is_reconciled = true | Part confirmée par rapprochement bancaire |
| **Z (Non confirmé)** | X − Y | Part non encore confrontée à la réalité bancaire |
| **Taux** | Y / X | Taux de confirmation bancaire |

### 3.2 Mapping avec les données actuelles

| Métrique | Donnée Vault actuelle | Valeur | Commentaire |
|----------|------------------------|--------|-------------|
| **X** | Σ montants des paiements vaultés (`documents`, payload_json->amount) | 2 403 503,01 € | Direct |
| **Y** | Proxy : Σ \|amount\| des lignes rapprochées (projection RECONCIL) | 483 400,60 € | **Proxy** — pas de lien paiement↔rapprochement dans le Vault |
| **Z** | X − Y | 1 920 102,41 € | Cohérent |
| **Taux** | Y / X | 20,1 % | Cohérent avec la nouvelle logique |

### 3.3 Limitation technique : Y est un proxy

La définition stricte de Y suppose :

> Σ montants des **événements financiers** (paiements, POS, etc.) dont le statut `is_reconciled = true`

Le Vault **n'a pas aujourd'hui** de liaison explicite entre :
- documents paiements (événements financiers) ;
- et statut de rapprochement bancaire.

La projection RECONCIL stocke des **lignes de relevé bancaire** (`account.bank.statement.line`), pas des paiements. Un rapprochement associe une ligne de relevé à des écritures comptables ; un paiement génère une écriture qui peut être rapprochée — mais le lien n'est pas matérialisé dans le Vault.

**En pratique**, la somme des montants des lignes rapprochées constitue une approximation de Y. Elle est cohérente tant que :
- les paiements vaultés et les lignes de relevé couvrent le même périmètre financier ;
- les montants rapprochés correspondent bien à des paiements (pas à des écritures techniques hors périmètre).

---

## 4. Avis technique

### 4.1 Faisabilité court terme

**Oui**, la nouvelle métrique peut être exposée **dès maintenant** avec le proxy actuel :

- **X** : agrégation des montants des documents `source=payment` (éventuellement enrichie avec POS, autres événements financiers vaultés).
- **Y** : somme des montants des lignes de la projection RECONCIL avec `is_reconciled = true`.
- **Z** et **taux** : calculés à partir de X et Y.

**Effort estimé** : 1 à 2 jours (nouveau handler ou extension du handler Treasury, exposition des champs `confirmation_bancaire` dans l'API).

### 4.2 Evolution à moyen terme

Pour atteindre une définition stricte de Y (événements financiers marqués rapprochés) :

1. **Option A — Enrichissement RECONCIL**  
   Lors de l'ingestion des événements `bank.move.reconciled`, associer les identifiants des paiements (ou `account.move`) impliqués. Nécessite évolution du payload DVIG / Odoo et du modèle de données Vault.

2. **Option B — Requête Odoo**  
   Exposer côté Odoo un endpoint retournant, pour un tenant, la liste des paiements vaultés avec leur statut `is_reconciled`. Le Vault agrègerait ces données. Moins vault-centric, mais plus rapide à mettre en place.

3. **Option C — Backfill + déduction**  
   Maintenir le proxy actuel et documenter la sémantique (Y = montant des lignes de relevé rapprochées, utilisé comme approximation des événements financiers confirmés). Acceptable si le périmètre reste aligné.

### 4.3 Risques et points de vigilance

| Risque | Mitigation |
|--------|------------|
| X ne couvre que `account.payment` (pas POS, pas autres flux) | Étendre la base X à tous les types d'événements financiers vaultés ; documenter le périmètre |
| Y proxy ≠ Y strict (double comptage, manques) | Documenter l'approximation ; envisager Option A ou B si la précision devient critique |
| Projection RECONCIL incomplète (ex. 5 lignes vs 73 paiements) | Relancer backfill RECONCIL ; vérifier le flux temps réel Odoo → DVIG → Vault |

---

## 5. Recommandations

### 5.1 Produit

1. **Acter la redéfinition** des métriques (base = événements financiers vaultés, indicateur = taux de confirmation bancaire) comme référentiel produit.
2. **Documenter** dans la spec que Y est, en V1, un proxy (lignes rapprochées) et non une agrégation directe sur les événements financiers.
3. **Décider** du périmètre exact de X : paiements uniquement, ou paiements + POS + autres mouvements financiers vaultés.

### 5.2 Technique

1. **Court terme** : Implémenter l'exposition X, Y, Z, taux (avec proxy Y) dans l'API Treasury ou via un nouvel endpoint dédié.
2. **Nettoyer** la logique de fallback v4.1 actuelle (mix Odoo/Vault) une fois la nouvelle métrique en place — éviter de maintenir deux logiques divergentes.
3. **Planifier** l'évolution du modèle (lien paiement↔rapprochement) si la précision stricte de Y est requise.

### 5.3 Données

1. **Vérifier** que la projection RECONCIL est à jour : backfill complet, flux temps réel opérationnel.
2. **Contrôler** la cohérence des montants : sommes paiements vs sommes lignes de relevé, pour détecter d'éventuels écarts structurels.

---

## 6. Conclusion

La redéfinition des métriques (confirmation bancaire des événements financiers vaultés) est **cohérente avec les données actuelles** et **faisable à court terme** en s'appuyant sur un proxy pour Y.

L'implémentation v4.1 actuelle, centrée sur les lignes de relevé bancaire, peut être complétée ou remplacée par cette nouvelle logique. Il est recommandé de trancher rapidement sur le périmètre (X = paiements seuls ou étendu) et sur le niveau de précision attendu pour Y (proxy acceptable vs évolution du modèle).

---

## 7. Références

- Spec v4.1 : `ZeDocs/web32/Carte_Trésorerie_Validée_v4.1_Hybride.md`
- Rapport MOA : `ZeDocs/web32/RAPPORT_MOA_TRESO_V4.1_2026-02-25.md`
- Redéfinition métriques : (à formaliser dans un document dédié si acté)

---

*Document rédigé à l'issue de la qualification v4.1 et de l'analyse de la redéfinition des métriques (2026-02-25).*
