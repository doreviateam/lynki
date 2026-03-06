# REVIEW — Comparaison des Alternatives DVIG/Vault pour STINGER (tenant `core`)

**Version** : v1.1  
**Date** : 2026-01-10  
**Statut** : ✅ Recommandation actée (court terme)  
**But** : Choisir une stratégie d'isolation STINGER *sans refonte plateforme prématurée*.

---

## 0) Point de correction (important)

⚠️ **Correction importante** : Dans les tableaux précédents, un postulat revenait :
> « Les tokens STINGER ne fonctionnent pas en PROD »

**C'est faux par défaut** tant que DVIG est partagé et charge tous les tokens.  
Un token est valide si son secret l'est. La "différence d'env" n'est qu'une donnée (source) **si aucune règle n'est appliquée**.

➡️ **Donc, quel que soit le scénario (Alt 1, 2, 3), la sécurité "env" doit être enforced (contrainte technique), pas "déduite".**

---

## 1) Problème réel à résoudre

> **Empêcher toute confusion STINGER/PROD** lors des opérations Vault (écriture + lecture + constats), même en cas d'erreur humaine ou bug de filtre.

---

## 2) Les alternatives

**4 Alternatives** :
1. **Alternative 1** : Garder architecture actuelle (DVIG/Vault partagés, isolation logique)
2. **Alternative 1.5** : Architecture actuelle + garde-fous techniques (enforcement env, namespace Vault) ⭐ **RECOMMANDÉ**
3. **Alternative 2** : Isolation partielle (DVIG partagé, Vault séparé)
4. **Alternative 3** : Séparation complète (DVIG/Vault séparés par environnement)

**Recommandation rapide** :
- **Court terme (recommandé)** → Alternative 1.5
- **Isolation données critiques requise** → Alternative 2
- **Isolation complète obligatoire** → Alternative 3

---

## 🎯 Vue d'Ensemble des Alternatives

### Alternative 1 : Architecture Actuelle

```
┌─────────────────────────────────┐
│ Tenant: core                     │
│                                  │
│ Platform (partagé) :             │
│   ┌───────────┐                 │
│   │ dvig-core │ ← Partagé        │
│   └───────────┘                 │
│   ┌───────────┐                 │
│   │ vault-core│ ← Partagé        │
│   └───────────┘                 │
│                                  │
│ Isolation : Logique (tokens)     │
│ Hostnames : Sans env             │
│ Ressources : 1x                  │
│ Modifications : Aucune            │
│ ⚠️ Pas de garde-fous techniques  │
└─────────────────────────────────┘
```

### Alternative 1.5 : Architecture Actuelle + Garde-fous ⭐ RECOMMANDÉ

```
┌─────────────────────────────────┐
│ Tenant: core                     │
│                                  │
│ Platform (partagé) :             │
│   ┌───────────┐                 │
│   │ dvig-core │ ← Partagé        │
│   │ + enforce │ ← Validation env │
│   │   env     │    (403 si mismatch)│
│   └───────────┘                 │
│   ┌───────────┐                 │
│   │ vault-core│ ← Partagé        │
│   │ + namespace│ ← Namespace par │
│   │   par env │    env (env=<env>)│
│   └───────────┘                 │
│                                  │
│ Isolation : Opérationnelle forte │
│ Hostnames : Sans env             │
│ Ressources : 1x                  │
│ Modifications : Garde-fous code   │
│ ✅ Enforcement technique         │
└─────────────────────────────────┘
```

### Alternative 2 : Isolation Partielle

```
┌─────────────────────────────────┐
│ Tenant: core                     │
│                                  │
│ Platform DVIG (partagé) :        │
│   ┌───────────┐                 │
│   │ dvig-core │ ← Partagé        │
│   └───────────┘                 │
│                                  │
│ Platform Vault (séparé) :        │
│   ┌───────────┐                 │
│   │ vault_lab │ ← Dédié LAB      │
│   └───────────┘                 │
│   ┌───────────┐                 │
│   │ vault_stinger│ ← Dédié STINGER│
│   └───────────┘                 │
│   ┌───────────┐                 │
│   │ vault_prod│ ← Dédié PROD     │
│   └───────────┘                 │
│                                  │
│ Isolation : DVIG logique,        │
│            Vault physique        │
│ Hostnames : DVIG sans env,       │
│            Vault avec env        │
│ Ressources : 2x                  │
│ Modifications : Vault uniquement │
└─────────────────────────────────┘
```

### Alternative 3 : Séparation Complète

```
┌─────────────────────────────────┐
│ Tenant: core                     │
│                                  │
│ Platform LAB :                   │
│   ┌───────────┐                 │
│   │ dvig_lab  │ ← Dédié LAB      │
│   └───────────┘                 │
│   ┌───────────┐                 │
│   │ vault_lab │ ← Dédié LAB      │
│   └───────────┘                 │
│                                  │
│ Platform STINGER :              │
│   ┌───────────┐                 │
│   │ dvig_stinger│ ← Dédié STINGER│
│   └───────────┘                 │
│   ┌───────────┐                 │
│   │ vault_stinger│ ← Dédié STINGER│
│   └───────────┘                 │
│                                  │
│ Platform PROD :                 │
│   ┌───────────┐                 │
│   │ dvig_prod │ ← Dédié PROD     │
│   └───────────┘                 │
│   ┌───────────┐                 │
│   │ vault_prod│ ← Dédié PROD     │
│   └───────────┘                 │
│                                  │
│ Isolation : Physique complète    │
│ Hostnames : Avec env             │
│ Ressources : 3x                  │
│ Modifications : Complètes        │
└─────────────────────────────────┘
```

---

## 📊 Tableau Comparatif Détaillé

| Critère | Alt 1 (Actuelle) | Alt 1.5 (Garde-fous) ⭐ | Alt 2 (Partielle) | Alt 3 (Complète) |
|---------|------------------|-------------------------|-------------------|------------------|
| **🎯 Isolation DVIG** | ❌ Logique (tokens) | ✅ Opérationnelle (enforcement) | ❌ Logique (tokens) | ✅ Physique (séparé) |
| **🎯 Isolation Vault** | ❌ Logique (filtrage) | ✅ Opérationnelle (namespace) | ✅ Physique (séparé) | ✅ Physique (séparé) |
| **🔧 Modifications code** | ✅ Aucune | 🟡 Modérées (garde-fous) | 🟡 Modérées (Vault) | ❌ Majeures (DVIG + Vault) |
| **📦 Migration données** | ✅ Aucune | ✅ Aucune | 🟡 Partielle (Vault) | ❌ Complète (DVIG + Vault) |
| **💾 Ressources système** | ✅ 1x (moins) | ✅ 1x (moins) | 🟡 2x (modéré) | ❌ 3x (plus) |
| **🛠️ Maintenance** | ✅ Simple | ✅ Simple | 🟡 Modérée | ❌ Complexe |
| **⏱️ Temps développement** | ✅ 0 jour | 🟡 ~2 jours | 🟡 ~3 jours | ❌ ~5 jours |
| **⏱️ Fenêtre maintenance** | ✅ Aucune | ✅ Aucune | 🟡 1-2 heures | ❌ 2-4 heures |
| **🌐 Hostnames DVIG** | ❌ `dvig.core` (sans env) | ❌ `dvig.core` (sans env) | ✅ `dvig.stinger.core` (avec env) |
| **🌐 Hostnames Vault** | ❌ `vault.core` (sans env) | ✅ `vault.stinger.core` (avec env) | ✅ `vault.stinger.core` (avec env) |
| **🔑 Tokens** | ✅ Unifiés (1 fichier) | ✅ Unifiés (1 fichier) | ❌ Séparés (3 fichiers) |
| **📊 Bases de données Vault** | ❌ 1 (partagée) | ✅ 3 (séparées) | ✅ 3 (séparées) |
| **📊 Bases de données DVIG** | ✅ 0 (pas de DB) | ✅ 0 (pas de DB) | ✅ 0 (pas de DB) |
| **🗄️ Volumes Docker** | ✅ 5 volumes | 🟡 10 volumes | ❌ 15 volumes |
| **🔒 Risque pollution données** | ⚠️ Oui (si requête mal formulée) | ✅ Non (enforcement) | ✅ Non (Vault isolé) | ✅ Non (complètement isolé) |
| **🧪 Tests destructifs STINGER** | ❌ Non (risque) | ⚠️ Limité (namespace) | ✅ Oui (Vault isolé) | ✅ Oui (complètement isolé) |
| **📋 Conformité SPEC_STINGER** | ❌ Non | 🟡 Partielle (isolation opérationnelle) | 🟡 Partielle | ✅ Oui |
| **🔄 Breaking changes CLI** | ✅ Aucun | 🟡 Modéré (`platform up`) | ❌ Majeur (`platform up`) |
| **📚 Documentation** | ✅ Existante (valide) | 🟡 Partielle (à mettre à jour) | ❌ Complète (à réécrire) |
| **🎓 Courbe d'apprentissage** | ✅ Aucune | 🟡 Modérée | ❌ Élevée |

---

## 🎯 Matrice de Décision

### Critères de Sélection

#### 1. Besoin d'Isolation

| Besoin | Alternative 1 | Alternative 2 | Alternative 3 |
|--------|---------------|--------------|---------------|
| **Isolation logique suffisante** | ✅ **Recommandé** | ⚠️ Possible | ❌ Trop |
| **Isolation données critiques (Vault)** | ❌ Insuffisant | ✅ **Recommandé** | ⚠️ Possible |
| **Isolation complète (DVIG + Vault)** | ❌ Insuffisant | ❌ Insuffisant | ✅ **Recommandé** |

#### 2. Type de Tests STINGER

| Type de tests | Alternative 1 | Alternative 2 | Alternative 3 |
|---------------|---------------|--------------|---------------|
| **Tests fonctionnels non destructifs** | ✅ **Recommandé** | ⚠️ Possible | ❌ Trop |
| **Tests destructifs (charge, migration)** | ❌ Risqué | ✅ **Recommandé** | ⚠️ Possible |
| **Tests de régression destructifs** | ❌ Risqué | ✅ **Recommandé** | ⚠️ Possible |

#### 3. Ressources Disponibles

| Ressources | Alternative 1 | Alternative 2 | Alternative 3 |
|------------|---------------|--------------|---------------|
| **Ressources limitées** | ✅ **Recommandé** | ⚠️ Possible | ❌ Trop |
| **Ressources modérées** | ✅ Possible | ✅ **Recommandé** | ⚠️ Possible |
| **Ressources importantes** | ✅ Possible | ✅ Possible | ✅ **Recommandé** |

#### 4. Conformité SPEC_STINGER

| Conformité | Alternative 1 | Alternative 2 | Alternative 3 |
|------------|---------------|--------------|---------------|
| **Non obligatoire** | ✅ **Recommandé** | ⚠️ Possible | ❌ Trop |
| **Partielle acceptable** | ✅ Possible | ✅ **Recommandé** | ⚠️ Possible |
| **Obligatoire** | ❌ Non conforme | ❌ Non conforme | ✅ **Recommandé** |

#### 5. Complexité Acceptable

| Complexité | Alternative 1 | Alternative 2 | Alternative 3 |
|------------|---------------|--------------|---------------|
| **Simplicité maximale** | ✅ **Recommandé** | ❌ Trop | ❌ Trop |
| **Complexité modérée** | ✅ Possible | ✅ **Recommandé** | ❌ Trop |
| **Complexité élevée acceptable** | ✅ Possible | ✅ Possible | ✅ **Recommandé** |

---

## 🔍 Guide de Décision par Scénario

### Scénario 1 : Tests STINGER Non Destructifs

**Contexte** :
- Tests fonctionnels simples
- Validation de flux métier
- Pas de tests de charge ou migration

**Recommandation** : ✅ **Alternative 1**

**Justification** :
- Isolation logique (tokens) suffisante
- Aucune modification nécessaire
- Simplicité maximale
- Ressources minimales

---

### Scénario 2 : Tests STINGER Destructifs (Données Critiques)

**Contexte** :
- Tests de charge
- Tests de migration
- Tests de régression destructifs
- Données Vault critiques (factures, documents)

**Recommandation** : ✅ **Alternative 2**

**Justification** :
- Isolation physique Vault (données critiques)
- DVIG reste simple (tokens unifiés)
- Ressources modérées (2x au lieu de 3x)
- Compromis optimal

---

### Scénario 3 : Simulation PROD-like Complète

**Contexte** :
- STINGER = copie exacte de PROD
- Isolation complète requise
- Conformité SPEC_STINGER obligatoire
- Hostnames explicites requis

**Recommandation** : ✅ **Alternative 3**

**Justification** :
- Isolation physique complète (DVIG + Vault)
- Conformité SPEC_STINGER
- Hostnames explicites avec environnement
- Tests destructifs sans risque

---

### Scénario 4 : Ressources Limitées

**Contexte** :
- Serveur avec ressources limitées
- Budget contraint
- Maintenance minimale souhaitée

**Recommandation** : ✅ **Alternative 1**

**Justification** :
- Ressources minimales (1x)
- Maintenance simple
- Aucun coût de développement
- Aucune migration

---

### Scénario 5 : Conformité Réglementaire

**Contexte** :
- Réglementation exige séparation physique
- Audit de sécurité requis
- Traçabilité complète par environnement

**Recommandation** : ✅ **Alternative 3**

**Justification** :
- Séparation physique complète
- Isolation totale entre environnements
- Audit facilité
- Traçabilité complète

---

## 📋 Checklist de Décision

### Questions à se poser

#### 1. Isolation

- [ ] L'isolation logique (tokens) est-elle suffisante ?
- [ ] L'isolation physique des données Vault est-elle requise ?
- [ ] L'isolation physique complète (DVIG + Vault) est-elle requise ?

#### 2. Tests STINGER

- [ ] Les tests STINGER sont-ils non destructifs ?
- [ ] Les tests STINGER incluent-ils des tests de charge ?
- [ ] Les tests STINGER incluent-ils des tests de migration ?

#### 3. Ressources

- [ ] Les ressources sont-elles limitées ?
- [ ] Les ressources sont-elles modérées ?
- [ ] Les ressources sont-elles importantes ?

#### 4. Conformité

- [ ] La conformité SPEC_STINGER est-elle obligatoire ?
- [ ] Les hostnames explicites sont-ils requis ?
- [ ] La réglementation exige-t-elle une séparation physique ?

#### 5. Complexité

- [ ] La simplicité est-elle prioritaire ?
- [ ] Une complexité modérée est-elle acceptable ?
- [ ] Une complexité élevée est-elle acceptable ?

---

### Matrice de Score

**Attribuer un score de 1 à 3 pour chaque alternative selon vos réponses** :

| Critère | Poids | Alt 1 | Alt 2 | Alt 3 |
|---------|-------|-------|-------|-------|
| Isolation suffisante | 3 | ? | ? | ? |
| Tests destructifs | 2 | ? | ? | ? |
| Ressources disponibles | 2 | ? | ? | ? |
| Conformité SPEC_STINGER | 1 | ? | ? | ? |
| Simplicité | 1 | ? | ? | ? |
| **TOTAL** | | **?** | **?** | **?** |

**L'alternative avec le score le plus élevé est recommandée.**

---

## 🎯 Recommandations Finales

### Recommandation Générale

**Pour la plupart des cas** : ✅ **Alternative 2 (Isolation Partielle)**

**Justification** :
- Compromis optimal entre simplicité et isolation
- Isolation des données critiques (Vault)
- Simplicité DVIG (tokens unifiés)
- Ressources modérées (2x)
- Modifications limitées (Vault uniquement)

---

### Recommandations Spécifiques

#### Choisir Alternative 1 si :
- ✅ Tests STINGER non destructifs
- ✅ Isolation logique suffisante
- ✅ Ressources limitées
- ✅ Simplicité prioritaire
- ✅ Pas de conformité SPEC_STINGER obligatoire

#### Choisir Alternative 2 si :
- ✅ Tests STINGER destructifs (données critiques)
- ✅ Isolation données Vault requise
- ✅ Simplicité DVIG souhaitée
- ✅ Ressources modérées
- ✅ Hostnames mixtes acceptables

#### Choisir Alternative 3 si :
- ✅ Isolation complète obligatoire
- ✅ Conformité SPEC_STINGER obligatoire
- ✅ Hostnames explicites requis
- ✅ Ressources importantes
- ✅ Tests destructifs complets

---

## 📊 Comparaison Coûts/Bénéfices

### Alternative 1 : Architecture Actuelle

**Coûts** :
- ✅ Aucun coût de développement
- ✅ Aucun coût de migration
- ✅ Ressources minimales

**Bénéfices** :
- ✅ Simplicité maximale
- ✅ Maintenance minimale
- ✅ Aucun risque de migration

**Risques** :
- ⚠️ Isolation logique uniquement
- ⚠️ Risque de pollution données (si requête mal formulée)
- ⚠️ Tests destructifs risqués

---

### Alternative 2 : Isolation Partielle

**Coûts** :
- 🟡 ~3 jours de développement
- 🟡 Migration Vault (1-2 heures)
- 🟡 Ressources modérées (2x)

**Bénéfices** :
- ✅ Isolation données critiques (Vault)
- ✅ Simplicité DVIG
- ✅ Tests destructifs possibles (Vault isolé)

**Risques** :
- ⚠️ Complexité intermédiaire
- ⚠️ Logique de routage DVIG
- ⚠️ Hostnames mixtes

---

### Alternative 3 : Séparation Complète

**Coûts** :
- ❌ ~5 jours de développement
- ❌ Migration complète (2-4 heures)
- ❌ Ressources importantes (3x)

**Bénéfices** :
- ✅ Isolation complète (DVIG + Vault)
- ✅ Conformité SPEC_STINGER
- ✅ Tests destructifs sans risque
- ✅ Hostnames explicites

**Risques** :
- ⚠️ Complexité élevée
- ⚠️ Maintenance importante
- ⚠️ Breaking changes majeurs

---

## 📎 Références

- `ZeDocs/TestV2/SPEC_GARDEFOUS_ENV_DVIG_VAULT_v1.0.md` — Alternative 1.5 (spécification garde-fous) ⭐
- `ZeDocs/TestV2/ADR-0009_Stinger_Isolation_Strategy.md` — Décision architecturale (Alternative 1.5 retenue)
- `ZeDocs/TestV2/ALTERNATIVE_1_ARCHITECTURE_ACTUELLE_v1.0.md` — Alternative 1 détaillée
- `ZeDocs/TestV2/ALTERNATIVE_2_ISOLATION_PARTIELLE_v1.0.md` — Alternative 2 détaillée
- `ZeDocs/TestV2/ANALYSE_IMPACT_DVIG_VAULT_PAR_ENV_v1.0.md` — Alternative 3 détaillée
- `ZeDocs/TestV2/SPEC_STINGER_v1.0.md` — Spécification STINGER

---

## 3) L'option manquante dans le comparatif (celle qui simplifie tout)

### Alternative 1.5 — DVIG/Vault partagés **+ garde-fous + namespace Vault**

C'est **Alternative 1**, mais rendue "safe by design", sans x3 infra.

**Principe** :
- DVIG exige `env` explicite (header/champ) et refuse mismatch
- Vault écrit et lit dans un **namespace par env**
- API constats exige `env` obligatoire
- Purge STINGER = purge namespace STINGER (safe)

✅ Tu obtiens :
- isolation opérationnelle forte
- pas de migration lourde
- pas de DNS supplémentaires
- pas de DVIG routeur
- pas de x3 DB/volumes

---

## 4) Recommandation (claire)

### Court terme (ton contexte actuel) : ✅ Alternative 1.5

Parce que :
- tu avances vite sans chantier plateforme
- tu sécurises l'essentiel (zéro mélange STINGER/PROD)
- tu gardes la porte ouverte à Alt 3 plus tard

### Quand basculer vers Alt 3

- tests destructifs réels (migration DB, charge lourde, purge/retention ledger)
- montée en charge + ops déléguées
- exigences audit/compliance/SLA plus fortes

---

## ✅ Conclusion

**Décision actée** : ✅ **Alternative 1.5 (Partagé + garde-fous + namespace)**

**Justification** :
- Isolation opérationnelle forte (enforcement technique)
- Pas de migration lourde (architecture actuelle)
- Ressources minimales (pas de x3 infra)
- Porte ouverte vers Alt 3 plus tard

**Voir** :
- `SPEC_GARDEFOUS_ENV_DVIG_VAULT_v1.0.md` — Spécification garde-fous
- `ADR-0009_Stinger_Isolation_Strategy.md` — Décision architecturale

---

**Version** : 1.1  
**Date** : 2026-01-10  
**Statut** : ✅ **Recommandation actée (Alternative 1.5)**
