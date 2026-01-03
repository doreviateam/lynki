# 🔍 Analyse d'Impact — Spécification de Référence v2.0

**Version** : 1.0  
**Date** : 2025-01-29  
**SPEC Analysée** : DOREVIA — Spécification de Référence v2.0  
**Statut** : Analyse complète — Rapport de conformité

---

## 📋 Résumé Exécutif

### Verdict Global

La spécification de référence v2.0 définit les **principes fondamentaux** et les **concepts normatifs** de la plateforme Dorevia. L'implémentation actuelle présente des **écarts significatifs** sur plusieurs principes critiques, notamment la séparation intention/exécution et la configuration déclarative complète.

**Niveau de conformité** : 🟡 **PARTIELLE** — Écarts importants sur principes fondamentaux

### Écarts Critiques Identifiés

| Principe/Concept v2.0 | État Actuel | Conformité | Impact |
|----------------------|-------------|------------|--------|
| **Séparation intention/exécution** | CLI exécute directement | ❌ **NON CONFORME** | 🔴 Critique |
| **Configuration déclarative complète** | Templates partiels | ⚠️ **PARTIELLE** | 🔴 Critique |
| **Distinction Univers/Unit** | Confusion conceptuelle | ⚠️ **PARTIELLE** | 🟡 Important |
| **Services cœur (DVIG/Vault)** | Hostnames sans ENV | ❌ **NON CONFORME** | 🟡 Important |
| **Hostnames canoniques/alias** | Non géré | ❌ **NON CONFORME** | 🟡 Important |
| **Auditabilité complète** | Partielle | ⚠️ **PARTIELLE** | 🟡 Important |
| **Aucun comportement implicite** | Logique implicite présente | ⚠️ **PARTIELLE** | 🟡 Important |

---

## 1. Analyse des Principes Non Négociables

### 1.1 Principe 1 : Séparation stricte intention/exécution

#### Spécification v2.0

> L'intention est humaine, explicite, capturée via un outil. Elle **ne modifie jamais le système**.  
> L'exécution est non interactive, lit uniquement la configuration, est déterministe et auditable.

#### État Actuel

**Conformité** : ❌ **NON CONFORME**

**Implémentation actuelle** :
- CLI `dorevia.sh` exécute directement les déploiements
- Pas de séparation entre intention et exécution
- Pas de capture d'intention structurée
- Pas de configuration déclarative complète générée avant exécution

**Exemple actuel** :
```bash
# Commande actuelle : exécution directe
dorevia.sh app up odoo lab core
# → Lance immédiatement docker compose up -d
```

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. Refonte CLI pour séparer intention et exécution
2. Mode interactif pour capture d'intention
3. Génération configuration déclarative complète
4. Mode exécution non interactive (lecture config uniquement)

---

### 1.2 Principe 2 : Configuration déclarative comme source de vérité

#### Spécification v2.0

> La configuration est la **source de vérité**, versionnable, relisible à froid, décrit intégralement l'exécution.

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Templates Docker Compose (`docker-compose.yml.template`)
- ✅ `manifest.json` minimal (existe pour `core` uniquement)
- ❌ Configuration **partielle** : manque domains, alias, units explicites
- ❌ Logique implicite dans `dorevia.sh` (génération de noms, volumes)
- ❌ Caddyfile **manuellement édité** (pas de génération depuis config)

**Exemple `manifest.json` actuel** :
```json
{
  "tenant": "core",
  "created_at": "2025-01-28T00:00:00Z",
  "images": {...},
  "tokens_source": "..."
}
```

**Manque** :
- `univers` déclarés
- `environments` déclarés
- `domains` (default + client)
- `alias` (hostnames supplémentaires)
- `units` (briques techniques)
- `deployment` (serveur, localisation)

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. Enrichir `manifest.json` avec structure complète
2. Générer Caddyfile depuis configuration
3. Éliminer logique implicite dans `dorevia.sh`
4. Versionner configuration avant exécution

---

### 1.3 Principe 3 : Standard SaaS par défaut

#### Spécification v2.0

> Pattern normatif : `<univers>.<environnement>.<tenant>.doreviateam.com`  
> S'applique à Lab, Stinger et Prod.  
> Reste valide même en cas d'extension client.

#### État Actuel

**Conformité** : ✅ **CONFORME**

**Implémentation actuelle** :
- ✅ Pattern respecté : `odoo.lab.core.doreviateam.com`
- ✅ Pattern respecté : `odoo.stinger.core.doreviateam.com`
- ✅ Pattern respecté : `odoo.prod.core.doreviateam.com`
- ✅ Appliqué à tous les tenants (core, dido, rozas)

**Exemple Caddyfile actuel** :
```caddy
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab_core:8069
}
```

**Impact** : ✅ Aucun changement requis

---

### 1.4 Principe 4 : Extension client sans remise en cause du standard

#### Spécification v2.0

> En production uniquement, un tenant peut être déployé sur un serveur client avec un domaine client.  
> Pattern étendu : `<univers>.prod.<tenant>.<domain_client>`  
> Invariants : le tenant ne change pas, les univers ne changent pas, Lab et Stinger restent sur `doreviateam.com`.

#### État Actuel

**Conformité** : ❌ **NON CONFORME** — Non implémenté

**Implémentation actuelle** :
- ❌ Pas de support domaine client
- ❌ Pas de support serveur client
- ❌ Tous les environnements sur même serveur

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Support domaines clients (PROD uniquement)
2. Support serveur client (PROD uniquement)
3. Validation invariants (tenant/univers inchangés)

---

### 1.5 Principe 5 : Auditabilité systématique

#### Spécification v2.0

> Tout état doit permettre :
> - reconstitution de l'intention
> - traçabilité des actions
> - reproduction à l'identique
> - justification a posteriori

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Logs Docker (partiels)
- ✅ Manifest minimal (partiel)
- ❌ Pas de journal intentions
- ❌ Pas de journal exécutions
- ❌ Pas de bundle d'audit
- ❌ Pas de traçabilité complète

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Journal intentions (capture d'intention)
2. Journal exécutions (traçabilité actions)
3. Bundle d'audit (config + logs + versions)
4. Documentation complète pour justification a posteriori

---

### 1.6 Principe 6 : Aucun comportement implicite

#### Spécification v2.0

> Toute décision doit être explicite, aucune logique cachée.

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ⚠️ Logique implicite dans `dorevia.sh` :
  - Génération noms containers (convention, pas déclaratif)
  - Génération noms volumes (convention, pas déclaratif)
  - Génération noms DB (convention, pas déclaratif)
- ⚠️ Caddyfile édité manuellement (pas de génération depuis config)

**Exemple logique implicite** :
```bash
# Dans dorevia.sh : génération implicite
CONTAINER_NAME="odoo_${ENV}_${TENANT}"
DB_NAME="odoo_${ENV}_${TENANT}"
```

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Déclarer explicitement tous les noms dans configuration
2. Générer Caddyfile depuis configuration
3. Éliminer logique implicite dans scripts

---

### 1.7 Principe 7 : Distinction stricte métier/technique

#### Spécification v2.0

> Distinction Univers (métier) / Unit (technique).  
> Les univers structurent les URLs publiques.  
> Les units sont des briques techniques déployables.

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ⚠️ Confusion conceptuelle :
  - `odoo` est à la fois univers (métier) et unit (technique)
  - Pas de distinction claire dans code/config
- ✅ URLs basées sur univers (`odoo.lab.core.doreviateam.com`)
- ⚠️ Units non déclarées explicitement

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Clarifier distinction Univers/Unit dans documentation
2. Déclarer units explicitement dans configuration
3. Documenter relation Univers/Unit

---

## 2. Analyse des Concepts Fondamentaux

### 2.1 Tenant

#### Spécification v2.0

> Un tenant est l'unité contractuelle, d'isolation logique et technique, de responsabilité des données.  
> Un tenant est **immuable dans son identité**.  
> Il est indépendant des domaines, serveurs, environnements, modes d'hébergement.

#### État Actuel

**Conformité** : ✅ **CONFORME**

**Implémentation actuelle** :
- ✅ Isolation par tenant (containers, volumes, DB séparés)
- ✅ Tenant immuable (pas de changement d'identité)
- ✅ Tenant indépendant des environnements (LAB/STINGER/PROD séparés)
- ⚠️ Pas encore testé avec domaines/serveurs clients (extension future)

**Impact** : ✅ Aucun changement requis

---

### 2.2 Univers

#### Spécification v2.0

> Un univers est une application fonctionnelle exposée rattachée à un tenant.  
> Caractéristiques : visible par les utilisateurs, structure les URLs publiques, structure les tokens d'accès, stable dans le temps.  
> Exemples : `odoo`, `pos`, `sylius`.  
> Les URLs sont **toujours construites à partir des univers**.

#### État Actuel

**Conformité** : ✅ **CONFORME** (partiellement)

**Implémentation actuelle** :
- ✅ URLs basées sur univers : `odoo.lab.core.doreviateam.com`
- ✅ Tokens basés sur univers : `odoo.lab.core` (format source)
- ✅ Univers stable (pas de changement)
- ⚠️ Univers non déclaré explicitement dans configuration
- ⚠️ Un seul univers actuellement (`odoo`)

**Impact** : 🟢 **FAIBLE** — Déclarer univers explicitement

**Actions requises** :
1. Déclarer univers dans `manifest.json`
2. Préparer support multi-univers (pos, sylius)

---

### 2.3 Unit

#### Spécification v2.0

> Une unit est une brique technique déployable de la plateforme.  
> Caractéristiques : interne à la plateforme, non nécessairement exposée publiquement, versionnable indépendamment, orchestrée par Dorevia.  
> Exemples : `odoo`, `dvig`, `vault`, `postgres`, `caddy`, `redis`.

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Units déployées : `odoo`, `dvig`, `vault`, `postgres`, `caddy`
- ❌ Units non déclarées explicitement dans configuration
- ❌ Relation Univers/Unit non documentée
- ⚠️ Confusion : `odoo` est à la fois univers et unit

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Déclarer units dans configuration
2. Documenter relation Univers/Unit
3. Clarifier distinction Univers/Unit

---

### 2.4 Relation Univers / Unit

#### Spécification v2.0

> Un univers est implémenté par **une ou plusieurs units**.  
> Une unit peut servir **plusieurs univers**.  
> Les univers et les units sont **orthogonaux**.

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ⚠️ Relation non documentée
- ⚠️ Relation non déclarée dans configuration
- ✅ Exemple actuel : univers `odoo` implémenté par units `odoo` + `postgres`

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Documenter relation Univers/Unit
2. Déclarer relation dans configuration
3. Préparer support multi-units par univers

---

## 3. Analyse Environnements

### Spécification v2.0

> Environnements : `lab` (développement), `stinger` (pré-production), `prod` (production).  
> Propriétés : isolation stricte, déploiement indépendant, conventions de nommage identiques.

### État Actuel

**Conformité** : ✅ **CONFORME**

**Implémentation actuelle** :
- ✅ Environnements : `lab`, `stinger`, `prod`
- ✅ Isolation stricte (DB, volumes, containers séparés)
- ✅ Déploiement indépendant
- ✅ Conventions de nommage identiques

**Impact** : ✅ Aucun changement requis

---

## 4. Analyse Standard SaaS Dorevia

### Spécification v2.0

> Pattern normatif : `<univers>.<environnement>.<tenant>.doreviateam.com`  
> S'applique à Lab, Stinger et Prod.  
> Constitue la règle par défaut.  
> Reste valide même en cas d'extension client.

### État Actuel

**Conformité** : ✅ **CONFORME**

**Implémentation actuelle** :
- ✅ Pattern respecté : `odoo.lab.core.doreviateam.com`
- ✅ Appliqué à tous les environnements (lab, stinger, prod)
- ✅ Appliqué à tous les tenants (core, dido, rozas)
- ✅ Règle par défaut respectée

**Exemple Caddyfile** :
```caddy
odoo.lab.core.doreviateam.com {
  reverse_proxy odoo_lab_core:8069
}
odoo.stinger.core.doreviateam.com {
  reverse_proxy odoo_stinger_core:8069
}
odoo.prod.core.doreviateam.com {
  reverse_proxy odoo_prod_core:8069
}
```

**Impact** : ✅ Aucun changement requis

---

## 5. Analyse Extension Production — Domaine et/ou Serveur Client

### Spécification v2.0

> En production uniquement, un tenant peut être déployé :
> - sur un serveur client
> - avec un domaine client
> 
> Pattern étendu : `<univers>.prod.<tenant>.<domain_client>`  
> Invariants : le tenant ne change pas, les univers ne changent pas, Lab et Stinger restent sur `doreviateam.com`.

### État Actuel

**Conformité** : ❌ **NON CONFORME** — Non implémenté

**Implémentation actuelle** :
- ❌ Pas de support domaine client
- ❌ Pas de support serveur client
- ❌ Tous les environnements sur même serveur
- ❌ Tous les domaines sur `doreviateam.com`

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Support domaines clients (PROD uniquement)
2. Support serveur client (PROD uniquement)
3. Validation invariants (tenant/univers inchangés)
4. Documentation processus déploiement serveur client

---

## 6. Analyse Services Cœur (DVIG / Vault)

### Spécification v2.0

> Services normatifs : `dvig`, `vault`.  
> Exposition standard : `dvig.<env>.<tenant>.doreviateam.com`, `vault.<env>.<tenant>.doreviateam.com`.  
> Ils ne sont pas des univers métier, peuvent supporter plusieurs hostnames, sont critiques pour la sécurité et l'audit.

### État Actuel

**Conformité** : ❌ **NON CONFORME** — Hostnames sans ENV

**Implémentation actuelle** :
- ❌ Hostnames actuels : `dvig.<tenant>.doreviateam.com` (sans ENV)
- ❌ Hostnames actuels : `vault.<tenant>.doreviateam.com` (sans ENV)
- ✅ Services critiques (sécurité, audit)
- ✅ Support multi-hostnames (préparé mais non utilisé)

**Exemple Caddyfile actuel** :
```caddy
dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
vault.core.doreviateam.com {
  reverse_proxy vault-core:8080
}
```

**Spécification attendue** :
```caddy
dvig.lab.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
dvig.stinger.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
dvig.prod.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
```

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Ajouter ENV dans hostnames DVIG/Vault
2. Mettre à jour Caddyfile
3. Mettre à jour DNS (si nécessaire)
4. Documenter changement (breaking change potentiel)

---

## 7. Analyse Hostnames Canoniques et Alias

### 7.1 Hostname Canonique

#### Spécification v2.0

> Chaque service exposé possède :
> - un **hostname canonique unique**
> - utilisé pour logs, métriques et audit
> - toujours fonctionnel

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Hostnames canoniques définis (ex: `odoo.lab.core.doreviateam.com`)
- ⚠️ Hostnames canoniques non déclarés explicitement
- ⚠️ Utilisation pour logs/métriques non documentée

**Impact** : 🟢 **FAIBLE**

**Actions requises** :
1. Déclarer hostnames canoniques dans configuration
2. Documenter utilisation pour logs/métriques

---

### 7.2 Alias

#### Spécification v2.0

> Un alias est un hostname supplémentaire :
> - pointant vers le même service
> - accepté explicitement
> - sans création de tenant
> 
> Exemples : `erp.client.com`, `api.client.com`

#### État Actuel

**Conformité** : ❌ **NON CONFORME** — Non implémenté

**Implémentation actuelle** :
- ❌ Pas de support alias
- ❌ Pas de configuration alias
- ❌ Caddyfile ne supporte pas multi-hostnames

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Support alias dans configuration
2. Génération Caddyfile avec alias
3. Validation alias (format, DNS)
4. Documentation processus alias

---

## 8. Analyse Intention, Configuration et Exécution

### 8.1 Intention

#### Spécification v2.0

> L'intention est :
> - humaine
> - explicite
> - capturée via un outil
> 
> Elle **ne modifie jamais le système**.

#### État Actuel

**Conformité** : ❌ **NON CONFORME**

**Implémentation actuelle** :
- ❌ Pas de capture d'intention structurée
- ❌ CLI exécute directement (pas de séparation)
- ❌ Pas d'outil de capture d'intention

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. Créer outil capture d'intention (CLI interactif)
2. Générer configuration depuis intention
3. Séparer intention et exécution

---

### 8.2 Configuration Déclarative

#### Spécification v2.0

> La configuration :
> - est la **source de vérité**
> - est versionnable
> - est relisible à froid
> - décrit intégralement l'exécution

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Configuration versionnable (Git)
- ⚠️ Configuration partielle (templates, pas déclaratif complet)
- ⚠️ Logique implicite dans scripts
- ⚠️ Caddyfile édité manuellement

**Impact** : 🔴 **CRITIQUE**

**Actions requises** :
1. Configuration déclarative complète
2. Éliminer logique implicite
3. Générer Caddyfile depuis config
4. Versionner avant exécution

---

### 8.3 Exécution

#### Spécification v2.0

> L'exécution :
> - est non interactive
> - lit uniquement la configuration
> - est déterministe
> - est auditable

#### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Non interactive (docker compose)
- ✅ Déterministe
- ⚠️ Lit configuration partielle (templates)
- ⚠️ Auditabilité partielle

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Lire configuration déclarative complète
2. Améliorer auditabilité (journaux, bundle)

---

## 9. Analyse Pré-requis et Responsabilités

### Spécification v2.0

> La plateforme peut :
> - vérifier les pré-requis
> - proposer une installation contrôlée
> 
> Elle ne gère jamais implicitement :
> - le système d'exploitation
> - la sécurité réseau client
> - le DNS externe

### État Actuel

**Conformité** : ✅ **CONFORME**

**Implémentation actuelle** :
- ✅ `dorevia.sh doctor` vérifie prérequis (Docker, Compose)
- ✅ Installation contrôlée (Docker, Compose)
- ✅ Pas d'installation automatique OS/réseau/DNS

**Impact** : ✅ Aucun changement requis

---

## 10. Analyse Auditabilité

### Spécification v2.0

> Tout état doit permettre :
> - reconstitution de l'intention
> - traçabilité des actions
> - reproduction à l'identique
> - justification a posteriori

### État Actuel

**Conformité** : ⚠️ **PARTIELLE**

**Implémentation actuelle** :
- ✅ Logs Docker (partiels)
- ✅ Manifest minimal (partiel)
- ❌ Pas de journal intentions
- ❌ Pas de journal exécutions
- ❌ Pas de bundle d'audit
- ❌ Pas de traçabilité complète

**Impact** : 🟡 **IMPORTANT**

**Actions requises** :
1. Journal intentions (capture d'intention)
2. Journal exécutions (traçabilité actions)
3. Bundle d'audit (config + logs + versions)
4. Documentation complète pour justification a posteriori

---

## 11. Synthèse des Écarts par Priorité

### Priorité 1 (Critique) — Principes Fondamentaux

1. **Séparation intention/exécution** : ❌ NON CONFORME
   - Refonte CLI requise
   - Mode interactif pour intention
   - Mode non interactif pour exécution

2. **Configuration déclarative complète** : ⚠️ PARTIELLE
   - Enrichir manifest.json
   - Générer Caddyfile depuis config
   - Éliminer logique implicite

### Priorité 2 (Important) — Concepts et Fonctionnalités

3. **Services cœur (DVIG/Vault)** : ❌ NON CONFORME
   - Ajouter ENV dans hostnames
   - Mettre à jour Caddyfile
   - Breaking change potentiel

4. **Hostnames alias** : ❌ NON CONFORME
   - Support alias dans configuration
   - Génération Caddyfile avec alias

5. **Extension client** : ❌ NON CONFORME
   - Support domaines clients (PROD)
   - Support serveur client (PROD)

6. **Auditabilité complète** : ⚠️ PARTIELLE
   - Journaux intentions/exécutions
   - Bundle d'audit

7. **Distinction Univers/Unit** : ⚠️ PARTIELLE
   - Clarifier distinction
   - Déclarer dans configuration

8. **Aucun comportement implicite** : ⚠️ PARTIELLE
   - Déclarer explicitement tous les noms
   - Générer depuis configuration

### Priorité 3 (Faible) — Améliorations

9. **Univers déclaré explicitement** : 🟢 FAIBLE
   - Déclarer dans manifest.json

10. **Hostnames canoniques déclarés** : 🟢 FAIBLE
    - Déclarer dans configuration

---

## 12. Plan d'Alignement Recommandé

### Phase 1 : Fondations (2-3 semaines)

1. **Configuration déclarative complète** :
   - Enrichir `manifest.json` (univers, domains, alias, units)
   - Éliminer logique implicite dans `dorevia.sh`
   - Générer Caddyfile depuis configuration

2. **Services cœur (DVIG/Vault)** :
   - Ajouter ENV dans hostnames
   - Mettre à jour Caddyfile
   - Documenter breaking change

### Phase 2 : Séparation Intention/Exécution (2-3 semaines)

3. **CLI interactif (intention)** :
   - Mode prompt pour capture d'intention
   - Génération configuration déclarative
   - Validation avant génération

4. **CLI non interactif (exécution)** :
   - Mode apply (lecture config uniquement)
   - Exécution déterministe
   - Logs structurés

### Phase 3 : Extensions (2-3 semaines)

5. **Support alias** :
   - Configuration alias
   - Génération Caddyfile avec alias
   - Validation DNS

6. **Extension client** :
   - Support domaines clients (PROD)
   - Support serveur client (PROD)
   - Validation invariants

### Phase 4 : Auditabilité (1-2 semaines)

7. **Journaux et traçabilité** :
   - Journal intentions
   - Journal exécutions
   - Bundle d'audit

---

## 13. Conclusion

### Verdict Final

L'implémentation actuelle est **partiellement conforme** à la spécification de référence v2.0. Les **principes fondamentaux** (séparation intention/exécution, configuration déclarative complète) nécessitent une **refonte significative**, tandis que les **concepts de base** (tenant, univers, environnements) sont **largement conformes**.

**Niveau de conformité** : 🟡 **PARTIELLE** — Écarts importants sur principes fondamentaux

### Points Clés

1. **Conformité** : Concepts de base (tenant, univers, environnements) ✅
2. **Non-conformité** : Principes fondamentaux (intention/exécution, config déclarative) ❌
3. **Non-conformité** : Services cœur (hostnames sans ENV) ❌
4. **Non-conformité** : Extensions (alias, domaine client) ❌
5. **Partielle** : Auditabilité, distinction Univers/Unit ⚠️

### Prochaines Étapes

1. **Décision** : Aligner avec SPEC v2.0 complète ou approche progressive ?
2. **Priorisation** : Phase 1 (fondations) en premier
3. **Planification** : 6-10 semaines selon approche choisie

---

**Document généré le** : 2025-01-29  
**Auteur** : Analyse automatique  
**Version** : 1.0

