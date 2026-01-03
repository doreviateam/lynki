# 📋 Avis Expert — Modèle d'Auto-Audit Normatif

**Date** : Janvier 2025  
**Document analysé** : Modèle vierge d'auto-audit normatif Dorevia Vault  
**Statut** : ✅ **Excellent document, quelques suggestions d'amélioration**

---

## ✅ Points Forts du Document

### 1. Structure Complète et Professionnelle

- ✅ **10 domaines couvrant tous les aspects** : Intégrité, journalisation, gestion documentaire, PAF, signature, archivage, interopérabilité, sécurité, cycle de vie, gouvernance
- ✅ **Références normatives pertinentes** : NF Z42-013, ISO 14641, eIDAS, RFC 7515, BOFiP/PAF
- ✅ **Grille d'évaluation claire** : Statuts (Conforme/Partiel/Non conforme) + Scores (0-5)
- ✅ **Traçabilité des preuves** : Colonnes "Preuves attendues" et "Observations"

### 2. Alignement avec Dorevia Vault

Le document est **parfaitement aligné** avec les fonctionnalités de Dorevia Vault :

- ✅ **Domaine 1 (Intégrité)** : Correspond au Ledger hash-chaîné + JWS
- ✅ **Domaine 2 (Journalisation)** : Correspond au module Audit (logs signés JSONL)
- ✅ **Domaine 3 (Gestion Documentaire)** : Correspond aux handlers invoices/payments/pos-tickets
- ✅ **Domaine 5 (Signature)** : Correspond au module JWS (RFC 7515)
- ✅ **Domaine 7 (Interopérabilité)** : Correspond aux APIs REST + JSON

---

## 🔍 Suggestions d'Amélioration

### 1. Compléter les Domaines Manquants

Les domaines 4, 5, 6, 7, 8, 9, 10 sont mentionnés mais non détaillés. Suggestion de structure :

#### Domaine 4 : Piste d'Audit Fiable (PAF)

**Références normatives :**
- BOFiP / PAF — Piste d'audit fiable pour ventes/paiements
- NF Z42-013 §6 — Traçabilité des opérations

**Exigences suggérées :**
- E4.1 : Traçabilité complète des opérations (vaultérisation, modifications, consultations)
- E4.2 : Horodatage horloge fiable (synchronisation NTP)
- E4.3 : Identification unique des opérateurs/systèmes
- E4.4 : Conservation des preuves d'audit (durée légale)
- E4.5 : Export des pistes d'audit (format standardisé)

#### Domaine 5 : Signature & Non-Répudiation

**Références normatives :**
- eIDAS — Signature électronique
- RFC 7515 — JWS (JSON Web Signature)
- NF Z42-013 §7 — Preuve d'intégrité

**Exigences suggérées :**
- E5.1 : Signature cryptographique (RS256) pour chaque evidence
- E5.2 : JWKS public pour vérification externe
- E5.3 : Non-répudiation (impossibilité de nier l'origine)
- E5.4 : Gestion des clés (rotation, révocation)
- E5.5 : Preuve d'intégrité vérifiable indépendamment

#### Domaine 6 : Archivage Probant & Conservation Long Terme

**Références normatives :**
- NF Z42-013 — Archivage électronique probant
- ISO 14641 — Long-term preservation
- BOFiP — Conservation fiscale (10 ans)

**Exigences suggérées :**
- E6.1 : Stratégie de conservation (durée, format)
- E6.2 : Migration de formats (si nécessaire)
- E6.3 : Sauvegarde et réplication
- E6.4 : Plan de continuité d'activité (PCA)
- E6.5 : Rétention et destruction sécurisée

#### Domaine 7 : Interopérabilité & Structure des Données

**Références normatives :**
- RFC 8259 — JSON
- RFC 7515 — JWS
- API REST — Standards HTTP

**Exigences suggérées :**
- E7.1 : Format JSON standardisé et documenté
- E7.2 : API REST conforme aux standards
- E7.3 : Versioning des APIs
- E7.4 : Documentation OpenAPI/Swagger
- E7.5 : Support Factur-X (EN 16931)

#### Domaine 8 : Sécurité, Clés & Accès

**Références normatives :**
- ISO 27001 — Management de la sécurité
- eIDAS — Gestion des clés
- NF Z42-013 §8 — Sécurité

**Exigences suggérées :**
- E8.1 : Authentification forte (JWT/API Keys)
- E8.2 : Autorisation granulaire (RBAC)
- E8.3 : Gestion sécurisée des clés (HashiCorp Vault / HSM)
- E8.4 : Chiffrement au repos et en transit
- E8.5 : Protection contre les attaques (DoS, injection, path traversal)
- E8.6 : Rotation des clés et révocation

#### Domaine 9 : Cycle de Vie Documentaire & Conservation

**Références normatives :**
- ISO 15489 — Records management
- NF Z42-013 — Cycle de vie

**Exigences suggérées :**
- E9.1 : Gestion des versions de documents
- E9.2 : Règles de rétention par type de document
- E9.3 : Destruction sécurisée (conformité RGPD)
- E9.4 : Archivage définitif (si applicable)
- E9.5 : Traçabilité des opérations de cycle de vie

#### Domaine 10 : Gouvernance, Documentation & Processus

**Références normatives :**
- ISO 15489 — Governance
- NF Z42-013 — Documentation

**Exigences suggérées :**
- E10.1 : Documentation technique complète
- E10.2 : Procédures opérationnelles documentées
- E10.3 : Plan de formation des opérateurs
- E10.4 : Processus de gestion des incidents
- E10.5 : Revue régulière de conformité

---

### 2. Ajouter des Critères Spécifiques à Dorevia Vault

#### Pour le Domaine 1 (Intégrité)

**E1.5** : Double chaînage cryptographique (Z-Reports)
- **Critère** : Vérifier chaînage `hash_prev` entre Z-Reports + `last_ticket_hash` avec tickets POS
- **Preuve** : Export ledger filesystem + tests de chaînage

**E1.6** : Idempotence métier (tickets POS)
- **Critère** : Vérifier que doublons métier sont détectés et rejetés
- **Preuve** : Tests d'idempotence avec même `source_id + pos_session`

#### Pour le Domaine 2 (Journalisation)

**E2.5** : Signature journalière des logs d'audit
- **Critère** : Vérifier présence de signature JWS quotidienne
- **Preuve** : Fichiers `audit-YYYY-MM-DD.jsonl.sig`

**E2.6** : Export paginé des logs d'audit
- **Critère** : Vérifier endpoint `/audit/export` avec pagination
- **Preuve** : Tests d'export JSON/CSV avec filtres date

#### Pour le Domaine 3 (Gestion Documentaire)

**E3.5** : Validation Factur-X (EN 16931)
- **Critère** : Vérifier validation automatique des factures Factur-X
- **Preuve** : Tests avec factures Factur-X valides/invalides

**E3.6** : Support multi-formats (PDF, JSON pour tickets POS)
- **Critère** : Vérifier stockage cohérent de différents formats
- **Preuve** : Tests avec PDF, JSON (tickets POS), Z-Reports

---

### 3. Améliorer la Grille d'Évaluation

#### Ajouter une Colonne "Priorité"

| Code | Exigence | Priorité | Statut | Score | Preuves | Observations |
|------|----------|----------|--------|-------|---------|--------------|
| E1.1 | ... | Critique | ☐ | /5 | ... | ... |

**Légende Priorité :**
- **Critique** : Exigence légale obligatoire
- **Élevée** : Exigence recommandée fortement
- **Moyenne** : Exigence recommandée
- **Faible** : Amélioration continue

#### Ajouter une Colonne "Maturité"

| Code | Exigence | Maturité | Statut | Score | Preuves | Observations |
|------|----------|----------|--------|-------|---------|--------------|
| E1.1 | ... | Production | ☐ | /5 | ... | ... |

**Légende Maturité :**
- **Production** : Déployé et opérationnel
- **Test** : Implémenté mais en test
- **Planifié** : Prévu mais non implémenté
- **Non prévu** : Non planifié

---

### 4. Ajouter des Sections Complémentaires

#### Section "Métriques de Conformité"

- **Taux de conformité par domaine** : X% conforme, Y% partiel, Z% non conforme
- **Score moyen pondéré** : (Score × Priorité) / Σ Priorités
- **Tendances** : Évolution depuis audit précédent

#### Section "Preuves Collectées"

- **Liste des preuves** : Fichiers, exports, rapports, captures d'écran
- **Références** : Liens vers documentation, code source, tests
- **Date de collecte** : Pour traçabilité

#### Section "Plan d'Action Correctif"

- **Actions court terme** (< 1 mois)
- **Actions moyen terme** (1-3 mois)
- **Actions long terme** (> 3 mois)
- **Responsables** : Qui pilote chaque action
- **Échéances** : Dates cibles

---

## 📊 Mapping Dorevia Vault ↔ Exigences Normatives

### Domaine 1 : Intégrité & Chaînage

| Exigence | Fonctionnalité Dorevia Vault | Statut Actuel |
|----------|----------------------------|---------------|
| E1.1 Hash univoque | SHA256 sur chaque document | ✅ Implémenté |
| E1.2 Chaînage chronologique | Ledger hash-chaîné PostgreSQL | ✅ Implémenté |
| E1.3 Détection altération | Endpoint `/api/v1/ledger/verify/:id` | ✅ Implémenté |
| E1.4 Continuité chaîne | Vérification via script `reconcile` | ✅ Implémenté |
| E1.5 Double chaînage | Z-Reports (`hash_prev` + `last_ticket_hash`) | ✅ Implémenté (Sprint 7) |

**Score estimé** : **4.5/5** (excellent niveau)

### Domaine 2 : Journalisation & Audit Trail

| Exigence | Fonctionnalité Dorevia Vault | Statut Actuel |
|----------|----------------------------|---------------|
| E2.1 Horodatage précis | Timestamps UTC (RFC3339) | ✅ Implémenté |
| E2.2 Identification acteur | Champs `source`, `source_system` | ✅ Implémenté |
| E2.3 Protection journaux | Logs signés JWS quotidiennement | ✅ Implémenté (Sprint 4) |
| E2.4 Audit trail complet | Export paginé `/audit/export` | ✅ Implémenté (Sprint 4) |
| E2.5 Signature journalière | Module `audit/sign.go` | ✅ Implémenté |
| E2.6 Export paginé | Endpoint `/audit/export` JSON/CSV | ✅ Implémenté |

**Score estimé** : **4.5/5** (excellent niveau)

### Domaine 3 : Gestion Documentaire

| Exigence | Fonctionnalité Dorevia Vault | Statut Actuel |
|----------|----------------------------|---------------|
| E3.1 Hiérarchie PDF probant | Support Factur-X (EN 16931) | ✅ Implémenté (Sprint 5) |
| E3.2 Unicité document | Idempotence par SHA256 | ✅ Implémenté |
| E3.3 Cohérence métadonnées | Validation Factur-X + extraction | ✅ Implémenté |
| E3.4 Traçabilité versions | Ledger immuable (pas de modification) | ✅ Implémenté |
| E3.5 Validation Factur-X | Module `validation/facturx.go` | ✅ Implémenté (Sprint 5) |
| E3.6 Support multi-formats | PDF (factures) + JSON (tickets POS) | ✅ Implémenté |

**Score estimé** : **4/5** (bon niveau)

---

## 🎯 Recommandations

### 1. Prioriser les Domaines

**Phase 1 (Immédiat)** : Compléter les domaines 1, 2, 3 (déjà bien couverts)

**Phase 2 (Court terme)** : Détailler domaines 4, 5, 7 (PAF, Signature, Interopérabilité)

**Phase 3 (Moyen terme)** : Détailler domaines 6, 8, 9, 10 (Archivage, Sécurité, Cycle de vie, Gouvernance)

### 2. Créer un Template de Preuves

Pour chaque exigence, créer un template de preuve :

```markdown
### Preuve E1.1 : Hash univoque

**Fichier** : `tests/integration/hash_verification_test.go`
**Commande** : `go test ./tests/integration -run TestHashUniqueness`
**Résultat attendu** : Tous les documents ont un hash SHA256 unique
**Date vérification** : [À remplir]
**Validateur** : [À remplir]
```

### 3. Ajouter des Tests de Conformité

Créer une suite de tests spécifiques pour valider chaque exigence :

```bash
# Tests de conformité normatifs
go test ./tests/compliance -run TestNFZ42_013
go test ./tests/compliance -run TestISO14641
```

### 4. Documenter les Écarts

Ajouter une section "Écarts identifiés" pour chaque domaine :

- **Écart mineur** : Amélioration recommandée
- **Écart majeur** : Action corrective requise
- **Non applicable** : Justification de non-applicabilité

---

## ✅ Conclusion

Le document est **excellent** et **très pertinent** pour Dorevia Vault. Il couvre tous les aspects essentiels de conformité normative.

**Points forts** :
- ✅ Structure professionnelle et complète
- ✅ Références normatives pertinentes
- ✅ Grille d'évaluation claire
- ✅ Alignement avec les fonctionnalités de Dorevia Vault

**Améliorations suggérées** :
- 📝 Compléter les domaines 4-10 avec la même structure que 1-3
- 📝 Ajouter des critères spécifiques à Dorevia Vault (double chaînage, idempotence métier)
- 📝 Ajouter colonnes "Priorité" et "Maturité"
- 📝 Créer templates de preuves et tests de conformité

**Score global du document** : **4.5/5** (excellent, avec quelques compléments à apporter)

---

**Prochaine étape recommandée** : Compléter les domaines 4-10 avec la même rigueur que les domaines 1-3, puis procéder à un premier audit interne de conformité.

