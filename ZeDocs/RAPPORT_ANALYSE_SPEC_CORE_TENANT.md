# 📊 Rapport d'Analyse - SPEC CORE Tenant + Clarification Contractuelle

**Date** : 2025-01-28  
**Documents Analysés** :
- SPEC — Plateforme Dorevia — CORE (tenant) + Environnements Odoo LAB/STINGER/PROD v1.0
- Clarification Contractuelle — Tenant / Univers / Source v1.0

**Statut** : Analyse complète avec impacts critiques identifiés

---

## 🎯 Résumé Exécutif

### Conformité Globale

| Élément | État Actuel | Conformité | Priorité |
|---------|-------------|------------|----------|
| **DNS** | Convention en place | ✅ **CONFORME** | 🟢 Faible |
| **Validation Source** | Trop permissive | ❌ **NON CONFORME** | 🔴 Critique |
| **Tokens** | `tenant: "rehtse"` | ❌ **NON CONFORME** | 🔴 Critique |
| **Validation Tenant** | Manquante | ❌ **NON CONFORME** | 🔴 Critique |
| **Architecture** | Instances séparées | ⚠️ **À MIGRER** | 🟡 Important |
| **STINGER** | Supprimé | ⚠️ **À RECRÉER** | 🟡 Important |
| **PROD** | Non déployé | ⚠️ **À DÉPLOYER** | 🟡 Important |

---

## 🔴 Points Critiques Identifiés

### 1. Validation Source (NON CONFORME)

**Problème** :
- Validation actuelle accepte `odoo.xxx` (trop permissive)
- Ne vérifie pas le format strict `univers.env.tenant`
- Ne vérifie pas le `tenant` du source

**Impact** : 🔴 **CRITIQUE** - Violation du contrat contractuel

**Action Requise** :
- Implémenter validation format strict `univers.env.tenant`
- Ajouter vérification `tenant` source = `tenant` token
- Valider environnements `{lab, stinger, prod}`

**Effort** : 🟡 **MOYEN** (1-2h)

---

### 2. Tokens DVIG (NON CONFORME)

**Problème** :
- Tokens actuels : `tenant: "rehtse"` (tenant métier)
- Doit être : `tenant: "core"` (tenant DNS)
- Violation : Le tenant DVIG ne correspond pas au tenant DNS

**Impact** : 🔴 **CRITIQUE** - Violation du contrat contractuel

**Action Requise** :
- Régénérer tous les tokens avec `tenant: "core"`
- Créer tokens distincts : LAB, STINGER, PROD
- Mettre à jour `tokens.yml`

**Effort** : 🟢 **FAIBLE** (30min)

---

### 3. Validation Tenant (NON CONFORME)

**Problème** :
- Validation actuelle ne vérifie **pas** le `tenant` du source
- Règle contractuelle : `tenant` source = `tenant` token

**Impact** : 🔴 **CRITIQUE** - Validation incomplète

**Action Requise** :
- Ajouter vérification `tenant` dans `validate_source_univers`
- Rejeter si `tenant` source ≠ `tenant` token

**Effort** : 🟢 **FAIBLE** (inclus dans validation source)

---

## ⚠️ Changements Majeurs Requis

### 1. Architecture Services Partagés

**Actuel** :
- DVIG LAB : Instance séparée (port 18120)
- DVIG PROD : Configuration présente, non déployée

**Cible** :
- DVIG : Instance unique partagée (LAB/STINGER/PROD)
- Vault : Instance unique partagée (LAB/STINGER/PROD)

**Impact** : ⚠️ **CHANGEMENT MAJEUR**
- Migration DVIG LAB vers instance partagée
- Configuration multi-environnements

**Effort** : 🟡 **MOYEN** (2-3h)

---

### 2. Odoo STINGER

**Actuel** :
- ❌ Supprimé (problèmes d'architecture)

**Cible** :
- ✅ Recréer avec isolation complète
- ✅ Base `odoo_stinger`, volumes dédiés
- ✅ Aucun partage avec LAB/PROD

**Impact** : ⚠️ **RECRÉATION COMPLÈTE**

**Effort** : 🔴 **ÉLEVÉ** (2-3h)

---

### 3. Odoo PROD

**Actuel** :
- ⚠️ Configuration présente, non déployée

**Cible** :
- ✅ Déployer avec isolation complète
- ✅ Base `odoo_prod`, volumes dédiés
- ✅ Version taggée (pas `latest`)

**Impact** : ⚠️ **DÉPLOIEMENT**

**Effort** : 🔴 **ÉLEVÉ** (2-3h)

---

### 4. Routage Caddy

**Actuel** :
- `host.docker.internal:port` (ports exposés)

**Cible** :
- `service_name:port` (réseau Docker)
- Pas de ports exposés sur hôte

**Impact** : ⚠️ **CHANGEMENT NÉCESSAIRE**

**Effort** : 🟡 **MOYEN** (1-2h)

---

## 📋 Plan d'Action Recommandé

### Phase 1 : Corrections Critiques (4-7h)

**Priorité** : 🔴 **CRITIQUE**

1. **Régénérer tokens** (30min)
   - Générer tokens LAB, STINGER, PROD avec `tenant: "core"`
   - Mettre à jour `tokens.yml`

2. **Renforcer validation** (1-2h)
   - Implémenter validation format strict `univers.env.tenant`
   - Ajouter vérification `tenant` source = `tenant` token
   - Ajouter validation environnements
   - Tester avec nouveaux tokens

3. **Tests** (1-2h)
   - Tests unitaires validation
   - Tests d'intégration avec nouveaux tokens
   - Tests de non-conformité (rejet sources invalides)

### Phase 2 : Services Partagés (2-3h)

**Priorité** : 🟡 **IMPORTANT**

1. Créer réseau Docker `dorevia-network`
2. Migrer DVIG vers instance partagée
3. Configurer Vault partagé
4. Mettre à jour Caddy (routage)

### Phase 3 : Odoo STINGER (2-3h)

**Priorité** : 🟡 **IMPORTANT**

1. Recréer avec isolation complète
2. Initialiser base `odoo_stinger`
3. Tester intégration DVIG

### Phase 4 : Odoo PROD (2-3h)

**Priorité** : 🟡 **IMPORTANT**

1. Déployer avec isolation complète
2. Initialiser base `odoo_prod`
3. Tester intégration DVIG

---

## 📊 Estimation Globale

| Phase | Effort | Priorité |
|-------|--------|----------|
| **Phase 1 : Corrections Critiques** | 4-7h | 🔴 Critique |
| **Phase 2 : Services Partagés** | 2-3h | 🟡 Important |
| **Phase 3 : Odoo STINGER** | 2-3h | 🟡 Important |
| **Phase 4 : Odoo PROD** | 2-3h | 🟡 Important |
| **TOTAL** | **10-16h** | - |

---

## 🔍 Documents de Référence

### Documents Créés

1. **`ZeDocs/ANALYSE_SPEC_CORE_TENANT.md`** (1147 lignes)
   - Analyse complète SPEC CORE Tenant
   - Impacts par composant
   - Plan de migration détaillé

2. **`ZeDocs/CLARIFICATION_TENANT_UNIVERS_SOURCE.md`**
   - Document de clarification contractuelle
   - Définitions normatives
   - Règles de validation

3. **`ZeDocs/IMPACT_CLARIFICATION_CONTRACTUELLE.md`**
   - Analyse impact clarification
   - Corrections requises
   - Tests de conformité

4. **`ZeDocs/RAPPORT_ANALYSE_SPEC_CORE_TENANT.md`** (ce document)
   - Rapport de synthèse
   - Résumé exécutif
   - Plan d'action

---

## ✅ Critères d'Acceptation SPEC

### URLs HTTPS

- [ ] `https://odoo.lab.core.doreviateam.com` → ✅ Opérationnel
- [ ] `https://odoo.stinger.core.doreviateam.com` → ⚠️ À recréer
- [ ] `https://odoo.prod.core.doreviateam.com` → ⚠️ À déployer
- [ ] `https://dvig.core.doreviateam.com` → ⚠️ À créer
- [ ] `https://vault.core.doreviateam.com` → ⚠️ À créer

### Isolation Données

- [ ] Odoo LAB : DB + filestore séparés
- [ ] Odoo STINGER : DB + filestore séparés (aucun partage)
- [ ] Odoo PROD : DB + filestore séparés (aucun partage)

### Tokens DVIG

- [ ] Token LAB : `tenant: "core"`, source `odoo.lab.core` → ✅ Fonctionne
- [ ] Token STINGER : `tenant: "core"`, source `odoo.stinger.core` → ✅ Fonctionne
- [ ] Token PROD : `tenant: "core"`, source `odoo.prod.core` → ✅ Fonctionne
- [ ] Test : Token LAB sur `source=odoo.prod.core` → ❌ Refusé (403)

### Versions Tagged

- [ ] STINGER : Image Odoo taggée (pas `latest`)
- [ ] PROD : Image Odoo taggée (pas `latest`)
- [ ] DVIG : Version taggée
- [ ] Vault : Version taggée

---

## 🎯 Recommandations

### 1. Approche Progressive

**Recommandation** : Migration en plusieurs phases pour minimiser les risques :

1. **Phase 1** : Corrections critiques (tokens + validation)
2. **Phase 2** : Services partagés (DVIG/Vault)
3. **Phase 3** : Odoo STINGER
4. **Phase 4** : Odoo PROD

### 2. Validation Source

**Recommandation** : Déploiement progressif :

1. **LAB** : Validation stricte avec tolérance temporaire (warning)
2. **STINGER** : Validation stricte obligatoire
3. **PROD** : Validation stricte obligatoire

### 3. Tests Exhaustifs

**Recommandation** : Tests complets avant déploiement :

1. Tests unitaires validation
2. Tests d'intégration avec nouveaux tokens
3. Tests de non-conformité (rejet sources invalides)
4. Tests end-to-end (Odoo → DVIG → Vault)

---

## 📝 Prochaines Étapes

1. **Valider approche** avec équipe
2. **Régénérer tokens** avec `tenant: "core"`
3. **Renforcer validation** source (format strict)
4. **Créer services partagés** (DVIG/Vault)
5. **Recréer STINGER** avec isolation complète
6. **Déployer PROD** avec isolation complète
7. **Valider critères d'acceptation** SPEC

---

## 🔗 Références

- **SPEC CORE Tenant** : Document source fourni
- **Clarification Contractuelle** : Document source fourni
- **Analyse détaillée** : `ZeDocs/ANALYSE_SPEC_CORE_TENANT.md`
- **Impact clarification** : `ZeDocs/IMPACT_CLARIFICATION_CONTRACTUELLE.md`

---

**Dernière mise à jour** : 2025-01-28

