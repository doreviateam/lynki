# SPEC — Services Platform Optionnels (DVIG/Vault) v1.0

**Version** : v1.0  
**Statut** : Spécification d'implémentation  
**Date** : 2026-01-12  
**Dépendance** : `SPEC_Dorevia_Reference_v2.0.md`, `SPEC_dorevia_sh_v1.0.md`  
**Audience** : Dev plateforme / Exploitation / Architecture

---

## 0. Résumé Exécutif

Cette spécification définit les modifications nécessaires pour rendre les services platform (DVIG et Vault) **optionnels** lors de la création d'un tenant, permettant ainsi une plateforme évolutive où ces services peuvent être ajoutés ultérieurement selon les besoins.

**Objectif principal** : Permettre la création d'une instance Odoo avec un tenant **sans** activer/connecter DVIG et Vault, tout en conservant la possibilité de les ajouter ultérieurement.

**Impact** : 🟡 **MOYEN** — Modification de logique critique dans `dorevia.sh`, nécessite tests approfondis.

---

## 1. Portée

### 1.1 Inclus (IN SCOPE)

1. **Modification de `check_platform_up()`** : Vérification conditionnelle basée sur `units.platform` du manifest
2. **Support de `units.platform: []`** : Permettre un tableau vide (aucun service platform requis)
3. **Génération conditionnelle Caddyfile** : Routes DNS uniquement pour les services activés
4. **Documentation** : Mise à jour des guides et schémas

### 1.2 Exclus (OUT OF SCOPE)

- Migration automatique des tenants existants
- Validation automatique des modules Odoo dépendants
- Génération automatique des routes DNS (gestion manuelle ou script séparé)
- Support de services platform personnalisés (hors DVIG/Vault)

---

## 2. Définition de "Fait" (Definition of Done)

La spécification est considérée implémentée si :

- ✅ Un tenant peut être créé avec `units.platform: []` (vide)
- ✅ `dorevia.sh app up odoo <env> <tenant>` fonctionne sans DVIG/Vault
- ✅ `dorevia.sh platform up <tenant>` peut être exécuté ultérieurement pour ajouter les services
- ✅ Les routes Caddy/DNS ne sont générées que pour les services présents dans `units.platform`
- ✅ La documentation est mise à jour avec les nouveaux scénarios

---

## 3. Spécification — Manifest

### 3.1 Structure `units.platform`

**Format actuel** :
```json
{
  "units": {
    "platform": ["dvig", "vault", "postgres"]
  }
}
```

**Format supporté (nouveau)** :
```json
{
  "units": {
    "platform": []  // Vide = aucun service platform requis
  }
}
```

**Format partiel** :
```json
{
  "units": {
    "platform": ["dvig"]  // Seulement DVIG, sans Vault
  }
}
```

### 3.2 Validation

Le schéma `schemas/manifest.schema.json` doit être mis à jour pour :
- ✅ Permettre `units.platform: []` (tableau vide)
- ✅ Ne pas exiger la présence de `dvig` ou `vault`
- ✅ Valider que les valeurs sont dans l'enum autorisé : `["dvig", "vault", "postgres"]`

### 3.3 Comportement par défaut

**Si `units.platform` est absent ou vide** :
- Aucun service platform n'est requis
- `check_platform_up()` retourne success sans vérification
- Aucune route Caddy/DNS n'est générée pour DVIG/Vault

**Si `units.platform` contient des services** :
- Seuls les services listés sont requis et vérifiés
- Les routes Caddy/DNS sont générées uniquement pour ces services

---

## 4. Spécification — Script `dorevia.sh`

### 4.1 Fonction `check_platform_up()`

**Fichier** : `bin/dorevia.sh` (lignes 1706-1731)

**Comportement actuel** :
```bash
check_platform_up() {
  local tenant="$1"
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  # ❌ Bloque si docker-compose n'existe pas
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    error "Platform $tenant non configurée..."
  fi
  
  # ❌ Vérifie TOUJOURS dvig et vault
  local containers=(
    "$(_get_platform_container_name "dvig" "$tenant")"
    "$(_get_platform_container_name "vault" "$tenant")"
  )
  # ...
}
```

**Comportement requis** :
```bash
check_platform_up() {
  local tenant="$1"
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  # Lire le manifest pour déterminer les services requis
  local manifest="$(_read_manifest "$tenant")"
  local units_platform=$(echo "$manifest" | jq -r '.units.platform[]? // empty')
  
  # ✅ Si aucun service platform requis, skip la vérification
  if [[ -z "$units_platform" ]]; then
    return 0  # Pas de platform requise
  fi
  
  # Si docker-compose n'existe pas mais des services sont requis
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    error "Platform $tenant non configurée. Démarrer avec: dorevia.sh platform up $tenant (E04)" "$E04"
  fi
  
  # ✅ Vérifier uniquement les services présents dans units.platform
  local containers=()
  if echo "$units_platform" | grep -q "^dvig$"; then
    containers+=("$(_get_platform_container_name "dvig" "$tenant")")
  fi
  if echo "$units_platform" | grep -q "^vault$"; then
    containers+=("$(_get_platform_container_name "vault" "$tenant")")
  fi
  
  # Si aucun container à vérifier, skip
  if [[ ${#containers[@]} -eq 0 ]]; then
    return 0
  fi
  
  # Vérifier que les containers requis sont running
  local all_up=true
  for container in "${containers[@]}"; do
    if ! docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
      all_up=false
      break
    fi
  done
  
  if [[ "$all_up" != "true" ]]; then
    error "Platform $tenant n'est pas démarrée. Démarrer avec: dorevia.sh platform up $tenant (E04)" "$E04"
  fi
}
```

### 4.2 Fonction `cmd_platform_up()`

**Fichier** : `bin/dorevia.sh` (lignes 1465-1600)

**Comportement requis** :
- ✅ Générer `docker-compose.yml` uniquement pour les services présents dans `units.platform`
- ✅ Si `units.platform: []`, ne pas générer de `docker-compose.yml` (ou générer un fichier vide avec message informatif)

**Note** : Le script `lib/render/render_platform_compose.sh` gère déjà cette logique conditionnelle.

### 4.3 Fonction `cmd_app_up()`

**Fichier** : `bin/dorevia.sh` (lignes 1865-1920)

**Comportement requis** :
- ✅ Appeler `check_platform_up()` qui peut maintenant retourner success si aucun service requis
- ✅ Permettre le démarrage d'Odoo même si `units.platform: []`

---

## 5. Spécification — Génération Caddyfile

### 5.1 Routes conditionnelles

**Fichier** : `units/gateway/Caddyfile`

**Comportement requis** :
- ✅ Générer les routes `dvig.<tenant>.doreviateam.com` uniquement si `dvig` est dans `units.platform`
- ✅ Générer les routes `vault.<tenant>.doreviateam.com` uniquement si `vault` est dans `units.platform`

**Format des routes** :
```caddyfile
# Généré uniquement si dvig ∈ units.platform
dvig.<tenant>.doreviateam.com {
  reverse_proxy dvig-<tenant>:8080
}

# Généré uniquement si vault ∈ units.platform
vault.<tenant>.doreviateam.com {
  reverse_proxy vault-<tenant>:8080
}
```

### 5.2 Implémentation

**Option 1** : Script de génération automatique
- Lire le manifest de chaque tenant
- Générer les routes conditionnellement

**Option 2** : Documentation manuelle
- Documenter que les routes doivent être ajoutées manuellement si services activés
- Fournir un template pour chaque service

**Recommandation** : Option 1 (génération automatique) pour cohérence avec l'approche déclarative.

---

## 6. Spécification — Modules Odoo

### 6.1 Modules dépendants

#### Module `dorevia_vault_connector`

**Comportement** :
- ✅ **Optionnel** : Peut être installé ou non
- ⚠️ **Si installé** : Requiert configuration `dorevia.dvig.*`
- ⚠️ **Si configuré mais DVIG absent** : CRONs échouent avec `failed_soft` (retry automatique)

**Recommandation** :
- Ne pas installer le module si DVIG/Vault ne sont pas activés
- Documenter cette dépendance dans la documentation du module

#### Module `dorevia_billing_core`

**Comportement** :
- ✅ **Optionnel** : Peut être installé ou non
- ⚠️ **Si installé** : Requiert configuration `dorevia_billing.core_api_token`
- ⚠️ **Si configuré mais Vault absent** : Réception de constats échoue

**Recommandation** :
- Ne pas installer le module si Vault n'est pas activé
- Documenter cette dépendance

### 6.2 Validation (optionnelle)

**Fonctionnalité future** : Validation automatique avant installation de modules
- Vérifier que les services requis sont présents dans `units.platform`
- Afficher un avertissement si configuration incohérente

**Statut** : ⚠️ **OUT OF SCOPE** pour v1.0 — Documentation uniquement

---

## 7. Spénification — Scénarios d'Usage

### 7.1 Scénario 1 : Tenant sans DVIG/Vault

**Objectif** : Créer un tenant Odoo minimal sans services platform

**Étapes** :
1. Créer manifest avec `units.platform: []`
2. Exécuter : `dorevia.sh app up odoo lab <tenant>`
3. ✅ Odoo démarre sans erreur
4. Utiliser Odoo normalement (sans fonctionnalités de vaulting)

**Résultat attendu** :
- ✅ Odoo accessible via `https://odoo.lab.<tenant>.doreviateam.com`
- ✅ Aucune route `dvig.*` ou `vault.*` générée
- ✅ Aucun container DVIG/Vault démarré

### 7.2 Scénario 2 : Ajout de DVIG/Vault ultérieur

**Objectif** : Ajouter les services platform à un tenant existant

**Étapes** :
1. Modifier manifest : `units.platform: ["dvig", "vault", "postgres"]`
2. Générer tokens DVIG : `dorevia.sh token issue odoo lab <tenant>`
3. Exécuter : `dorevia.sh platform up <tenant>`
4. Ajouter routes Caddy/DNS si nécessaire
5. Configurer modules Odoo si nécessaire

**Résultat attendu** :
- ✅ Containers DVIG/Vault démarrés
- ✅ Routes Caddy/DNS fonctionnelles
- ✅ Modules Odoo peuvent être configurés

### 7.3 Scénario 3 : Tenant partiel (DVIG uniquement)

**Objectif** : Activer seulement DVIG sans Vault

**Étapes** :
1. Créer manifest avec `units.platform: ["dvig", "postgres"]`
2. Exécuter : `dorevia.sh platform up <tenant>`
3. ✅ Seul DVIG est démarré

**Résultat attendu** :
- ✅ Container DVIG démarré
- ✅ Aucun container Vault
- ✅ Route `dvig.*` générée, pas de route `vault.*`

**Note** : Ce scénario est possible mais peu recommandé (DVIG nécessite généralement Vault).

---

## 8. Spécification — Migration

### 8.1 Tenants existants

**Comportement** :
- ✅ **Rétrocompatibilité** : Tenants existants avec `units.platform: ["dvig", "vault", "postgres"]` continuent de fonctionner
- ✅ **Aucune migration automatique** : Les tenants existants ne sont pas modifiés

**Recommandation** :
- Laisser les tenants existants inchangés
- Nouveaux tenants peuvent utiliser `units.platform: []` si souhaité

### 8.2 Suppression de services (non recommandé)

**Scénario** : Retirer DVIG/Vault d'un tenant existant

**Étapes** :
1. Arrêter platform : `dorevia.sh platform down <tenant>`
2. Modifier manifest : `units.platform: []`
3. Désinstaller modules Odoo dépendants
4. Supprimer routes Caddy/DNS manuellement

**Statut** : ⚠️ **NON RECOMMANDÉ** — Risque de perte de données, nécessite nettoyage manuel

---

## 9. Spécification — Tests

### 9.1 Tests unitaires

**Tests requis** :
- ✅ `check_platform_up()` avec `units.platform: []` → success
- ✅ `check_platform_up()` avec `units.platform: ["dvig"]` → vérifie seulement DVIG
- ✅ `check_platform_up()` avec `units.platform: ["vault"]` → vérifie seulement Vault
- ✅ `check_platform_up()` avec services absents → erreur E04

### 9.2 Tests d'intégration

**Tests requis** :
- ✅ Créer tenant avec `units.platform: []`
- ✅ Démarrer Odoo : `dorevia.sh app up odoo lab <tenant>`
- ✅ Vérifier qu'Odoo est accessible
- ✅ Ajouter services : Modifier manifest → `dorevia.sh platform up <tenant>`
- ✅ Vérifier que DVIG/Vault démarrent correctement

### 9.3 Tests de régression

**Tests requis** :
- ✅ Tenant existant avec `units.platform: ["dvig", "vault", "postgres"]` continue de fonctionner
- ✅ `dorevia.sh platform status <tenant>` fonctionne avec services optionnels
- ✅ `dorevia.sh app status odoo lab <tenant>` fonctionne sans platform

---

## 10. Spécification — Documentation

### 10.1 Fichiers à mettre à jour

#### `docs/GUIDE_CREATION_TENANT.md`

**Modifications** :
- ✅ Mentionner que DVIG/Vault sont optionnels
- ✅ Ajouter section "Services optionnels"
- ✅ Guide "Ajouter DVIG/Vault à un tenant existant"

#### `schemas/manifest.schema.json`

**Modifications** :
- ✅ Permettre `units.platform: []` (tableau vide)
- ✅ Clarifier que `dvig` et `vault` sont optionnels
- ✅ Ajouter exemples avec tableau vide

#### `units/odoo/custom-addons/dorevia_vault_connector/README.md`

**Modifications** :
- ✅ Mentionner que DVIG/Vault doivent être activés pour utiliser le module
- ✅ Ajouter section "Prérequis infrastructure"

#### `units/odoo/custom-addons/dorevia_billing_core/README.md`

**Modifications** :
- ✅ Mentionner que Vault doit être activé pour utiliser le module
- ✅ Ajouter section "Prérequis infrastructure"

---

## 11. Spécification — Risques et Mitigations

### 11.1 Risques Techniques

#### Risque : Modules Odoo configurés mais services absents

**Scénario** :
- Module `dorevia_vault_connector` installé
- Paramètres `dorevia.dvig.*` configurés
- Mais DVIG non démarré

**Conséquence** :
- ⚠️ CRONs échouent avec erreurs `failed_soft` (retry automatique)
- ⚠️ Logs d'erreur dans Odoo

**Mitigation** :
- ✅ Documentation claire : Ne pas installer les modules si services absents
- ✅ Gestion d'erreurs existante : Backoff exponentiel, classification erreurs

#### Risque : Routes DNS/Caddy orphelines

**Scénario** :
- Routes DNS pointent vers DVIG/Vault
- Mais services non démarrés

**Conséquence** :
- ⚠️ Erreurs 502/503 pour les URLs `dvig.*` et `vault.*`
- ⚠️ Confusion utilisateur

**Mitigation** :
- ✅ Génération conditionnelle des routes Caddy
- ✅ Documentation : Ne créer les DNS que si services activés

### 11.2 Risques Fonctionnels

#### Risque : Perte de fonctionnalités métier

**Scénario** :
- Tenant créé sans DVIG/Vault
- Besoin ultérieur de vaulting de factures

**Conséquence** :
- ⚠️ Nécessité d'ajouter les services ultérieurement

**Mitigation** :
- ✅ **Déjà supporté** : `dorevia.sh platform up <tenant>` peut être exécuté ultérieurement
- ✅ Documentation : Guide d'ajout de services après création

### 11.3 Risques Opérationnels

#### Risque : Incohérence entre environnements

**Scénario** :
- Tenant avec LAB sans DVIG/Vault
- Mais STINGER avec DVIG/Vault

**Conséquence** :
- ⚠️ Confusion sur la configuration
- ⚠️ Modules Odoo peuvent fonctionner différemment selon l'environnement

**Mitigation** :
- ✅ Documentation : Recommandation d'uniformiser la configuration entre environnements
- ✅ Validation optionnelle : Alerter si incohérence détectée (futur)

---

## 12. Spécification — Plan d'Implémentation

### Phase 1 : Modification Script (Priorité Haute)

**Tâches** :
1. ✅ Modifier `check_platform_up()` pour lire le manifest
2. ✅ Vérifier uniquement les services présents dans `units.platform`
3. ✅ Permettre `units.platform: []` (vide)

**Durée estimée** : 2-4 heures  
**Tests requis** : Tests unitaires + tests d'intégration

### Phase 2 : Génération Caddyfile (Priorité Moyenne)

**Tâches** :
1. ⚠️ Script de génération conditionnelle des routes Caddy
2. ⚠️ Ou documentation claire pour configuration manuelle

**Durée estimée** : 1-2 heures  
**Tests requis** : Vérifier génération conditionnelle

### Phase 3 : Documentation (Priorité Basse)

**Tâches** :
1. 📝 Mettre à jour `GUIDE_CREATION_TENANT.md`
2. 📝 Mettre à jour `schemas/manifest.schema.json`
3. 📝 Mettre à jour README des modules Odoo

**Durée estimée** : 1-2 heures

### Phase 4 : Tests (Priorité Haute)

**Tâches** :
1. ✅ Tests unitaires `check_platform_up()`
2. ✅ Tests d'intégration complets
3. ✅ Tests de régression

**Durée estimée** : 2-4 heures

**Total estimé** : 6-12 heures

---

## 13. Références

- `SPEC_Dorevia_Reference_v2.0.md` : Spécification de référence
- `SPEC_dorevia_sh_v1.0.md` : Spécification de l'orchestrateur
- `EVALUATION_DVIG_VAULT_OPTIONNELS.md` : Analyse d'impact détaillée
- `docs/GUIDE_CREATION_TENANT.md` : Guide de création de tenant
- `schemas/manifest.schema.json` : Schéma de validation du manifest

---

## 14. Historique des Versions

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| v1.0 | 2026-01-12 | Dorevia Team | Création initiale |

---

**Statut** : ✅ **PRÊT POUR IMPLÉMENTATION**

**Prochaine étape** : Valider cette spécification avant de procéder aux modifications.
