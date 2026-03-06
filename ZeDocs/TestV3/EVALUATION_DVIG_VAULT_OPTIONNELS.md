# 📊 Évaluation des Conséquences — DVIG/Vault Optionnels

**Date** : 2026-01-12  
**Objectif** : Rendre DVIG et Vault optionnels pour permettre une plateforme évolutive  
**Statut** : ⏳ En évaluation

---

## 🎯 Objectif

Permettre la création d'une instance Odoo avec un tenant **sans** activer/connecter DVIG et Vault, pour offrir une plateforme évolutive où ces services peuvent être ajoutés ultérieurement.

---

## 📋 État Actuel

### Contrainte Technique Actuelle

**Script `bin/dorevia.sh`** :
- Fonction `check_platform_up()` (lignes 1706-1731) **bloque** le démarrage d'une app Odoo si :
  1. Le fichier `docker-compose.yml` de la platform n'existe pas
  2. Les containers `dvig-<tenant>` et `vault-<tenant>` ne sont pas en cours d'exécution

**Impact** : ❌ **Impossible** de démarrer Odoo sans DVIG/Vault actuellement.

### Architecture Existante

**Système de manifest** :
- Le manifest (`tenants/<tenant>/state/manifest.json`) définit déjà `units.platform` comme un tableau
- Le script `lib/render/render_platform_compose.sh` génère uniquement les services présents dans `units.platform`
- ✅ **Déjà compatible** avec l'idée de services optionnels

**Exemple manifest actuel** :
```json
{
  "units": {
    "platform": ["dvig", "vault", "postgres"]
  }
}
```

**Manifest sans DVIG/Vault** (hypothétique) :
```json
{
  "units": {
    "platform": []
  }
}
```

---

## 🔍 Analyse des Dépendances

### 1. Modules Odoo Dépendants

#### Module `dorevia_vault_connector` (v1.1.0)

**Dépendances** :
- ✅ **Optionnel** : Module peut être installé ou non
- ✅ **Configuration requise** (si installé) :
  - `dorevia.dvig.url` : URL du DVIG
  - `dorevia.dvig.token` : Token Bearer
  - `dorevia.dvig.source` : Source au format `unit.env.tenant`
- ⚠️ **Comportement** : Si configuré mais DVIG indisponible → erreurs dans les CRONs (gestion d'erreurs soft/hard existante)

**Impact** : 🟢 **FAIBLE** — Module optionnel, gestion d'erreurs existante

#### Module `dorevia_billing_core`

**Dépendances** :
- ✅ **Optionnel** : Module peut être installé ou non
- ⚠️ **Configuration requise** (si installé) :
  - `dorevia_billing.core_api_token` : Token API pour authentifier les requêtes du Vault
- 📝 **Fonctionnalité** : Réception de constats via API REST (`POST /api/v1/constats`) depuis le Vault

**Impact** : 🟢 **FAIBLE** — Module optionnel, fonctionnalité métier spécifique

#### Module `dorevia_posted_lock`

**Dépendances** :
- ✅ **Aucune dépendance** à DVIG/Vault
- ✅ **Indépendant** : Verrouille les factures validées

**Impact** : 🟢 **AUCUN** — Module indépendant

---

### 2. Dépendances Infrastructure

#### Gateway (Caddy)

**Configuration actuelle** :
- Routes DVIG : `dvig.<tenant>.doreviateam.com`
- Routes Vault : `vault.<tenant>.doreviateam.com`

**Impact** : 🟡 **MOYEN** — Routes DNS/Caddy doivent être conditionnelles selon le manifest

**Solution** : Générer les routes Caddy uniquement si les services sont dans `units.platform`

#### Réseau Docker

**Impact** : 🟢 **FAIBLE** — Les containers Odoo peuvent fonctionner sans DVIG/Vault sur le même réseau

#### Tokens DVIG

**Impact** : 🟢 **FAIBLE** — Fichier `tenants/<tenant>/secrets/dvig.tokens.yml` n'est requis que si DVIG est activé

---

## 🔧 Modifications Requises

### 1. Script `bin/dorevia.sh`

#### Fonction `check_platform_up()` (lignes 1706-1731)

**Modification nécessaire** :

```bash
# AVANT (actuel)
check_platform_up() {
  local tenant="$1"
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    error "Platform $tenant non configurée..."
  fi
  
  # Vérifie TOUJOURS dvig et vault
  local containers=(
    "$(_get_platform_container_name "dvig" "$tenant")"
    "$(_get_platform_container_name "vault" "$tenant")"
  )
  # ...
}

# APRÈS (proposé)
check_platform_up() {
  local tenant="$1"
  local platform_dir="$TENANTS_DIR/$tenant/platform"
  
  # Lire le manifest pour déterminer les services requis
  local manifest="$(_read_manifest "$tenant")"
  local units_platform=$(echo "$manifest" | jq -r '.units.platform[]? // empty')
  
  # Si aucun service platform requis, skip la vérification
  if [[ -z "$units_platform" ]]; then
    return 0  # Pas de platform requise
  fi
  
  # Si docker-compose n'existe pas mais des services sont requis
  if [[ ! -f "$platform_dir/docker-compose.yml" ]]; then
    error "Platform $tenant non configurée..."
  fi
  
  # Vérifier uniquement les services présents dans units.platform
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
  # ...
}
```

**Impact** : 🟡 **MOYEN** — Modification de logique critique, nécessite tests

---

### 2. Génération Caddyfile

**Fichier** : `units/gateway/Caddyfile` (génération automatique ou manuelle)

**Modification nécessaire** :
- Générer les routes DVIG/Vault uniquement si présents dans `units.platform` du manifest

**Impact** : 🟡 **MOYEN** — Nécessite script de génération ou documentation

---

### 3. Documentation

**Fichiers à mettre à jour** :
- `docs/GUIDE_CREATION_TENANT.md` : Mentionner que DVIG/Vault sont optionnels
- `schemas/manifest.schema.json` : Clarifier que `units.platform` peut être vide

**Impact** : 🟢 **FAIBLE** — Documentation uniquement

---

## ⚠️ Risques et Considérations

### 1. Risques Techniques

#### Risque : Modules Odoo configurés mais services absents

**Scénario** : 
- Module `dorevia_vault_connector` installé
- Paramètres `dorevia.dvig.*` configurés
- Mais DVIG non démarré

**Conséquence** :
- ⚠️ CRONs échouent avec erreurs `failed_soft` (retry automatique)
- ⚠️ Logs d'erreur dans Odoo
- ✅ **Gestion existante** : Backoff exponentiel, classification erreurs

**Mitigation** :
- Documentation claire : Ne pas installer les modules si services absents
- Validation optionnelle : Vérifier la présence des paramètres avant d'installer les modules

#### Risque : Routes DNS/Caddy orphelines

**Scénario** :
- Routes DNS pointent vers DVIG/Vault
- Mais services non démarrés

**Conséquence** :
- ⚠️ Erreurs 502/503 pour les URLs `dvig.*` et `vault.*`
- ⚠️ Confusion utilisateur

**Mitigation** :
- Génération conditionnelle des routes Caddy
- Documentation : Ne créer les DNS que si services activés

---

### 2. Risques Fonctionnels

#### Risque : Perte de fonctionnalités métier

**Scénario** :
- Tenant créé sans DVIG/Vault
- Besoin ultérieur de vaulting de factures

**Conséquence** :
- ⚠️ Nécessité de recréer la platform et reconfigurer

**Mitigation** :
- ✅ **Déjà supporté** : `dorevia.sh platform up <tenant>` peut être exécuté ultérieurement
- Documentation : Guide d'ajout de services après création

---

### 3. Risques Opérationnels

#### Risque : Incohérence entre environnements

**Scénario** :
- Tenant avec LAB sans DVIG/Vault
- Mais STINGER avec DVIG/Vault

**Conséquence** :
- ⚠️ Confusion sur la configuration
- ⚠️ Modules Odoo peuvent fonctionner différemment selon l'environnement

**Mitigation** :
- Documentation : Recommandation d'uniformiser la configuration entre environnements
- Validation optionnelle : Alerter si incohérence détectée

---

## ✅ Avantages

### 1. Flexibilité

- ✅ **Démarrage rapide** : Créer un tenant Odoo sans infrastructure complexe
- ✅ **Évolutivité** : Ajouter DVIG/Vault ultérieurement selon les besoins
- ✅ **Coûts** : Réduire les ressources pour les tenants sans besoin de vaulting

### 2. Cas d'Usage

- ✅ **Développement** : Environnements de test sans besoin de vaulting
- ✅ **Démo** : Démonstrations Odoo sans infrastructure complète
- ✅ **Migration progressive** : Migrer vers Dorevia Platform progressivement

---

## 📊 Matrice d'Impact

| Composant | Impact | Complexité | Priorité |
|-----------|--------|------------|----------|
| `check_platform_up()` | 🟡 Moyen | 🟡 Moyenne | 🔴 Haute |
| Génération Caddyfile | 🟡 Moyen | 🟢 Faible | 🟡 Moyenne |
| Documentation | 🟢 Faible | 🟢 Faible | 🟢 Basse |
| Validation modules Odoo | 🟢 Faible | 🟢 Faible | 🟡 Moyenne |

---

## 🎯 Recommandations

### Phase 1 : Modification Script (Priorité Haute)

1. ✅ Modifier `check_platform_up()` pour lire le manifest
2. ✅ Vérifier uniquement les services présents dans `units.platform`
3. ✅ Permettre `units.platform: []` (vide)

**Tests requis** :
- Créer tenant avec `units.platform: []`
- Vérifier que `app up odoo lab <tenant>` fonctionne
- Vérifier que `platform up <tenant>` peut être exécuté ultérieurement

### Phase 2 : Génération Caddyfile (Priorité Moyenne)

1. ⚠️ Script de génération conditionnelle des routes Caddy
2. ⚠️ Ou documentation claire pour configuration manuelle

**Tests requis** :
- Vérifier que les routes DNS ne sont pas créées si services absents
- Vérifier que les routes fonctionnent après ajout de services

### Phase 3 : Documentation (Priorité Basse)

1. 📝 Mettre à jour `GUIDE_CREATION_TENANT.md`
2. 📝 Ajouter section "Services optionnels"
3. 📝 Guide "Ajouter DVIG/Vault à un tenant existant"

---

## 🔄 Scénarios de Migration

### Scénario 1 : Tenant sans DVIG/Vault → Ajout ultérieur

**Étapes** :
1. Créer tenant avec `units.platform: []`
2. Démarrer Odoo : `dorevia.sh app up odoo lab <tenant>`
3. Utiliser Odoo normalement
4. **Plus tard** : Modifier manifest → `units.platform: ["dvig", "vault", "postgres"]`
5. Générer platform : `dorevia.sh platform up <tenant>`
6. Configurer modules Odoo si nécessaire

**Faisabilité** : ✅ **FAISABLE** — Architecture déjà supportée

### Scénario 2 : Tenant avec DVIG/Vault → Suppression

**Étapes** :
1. Arrêter platform : `dorevia.sh platform down <tenant>`
2. Modifier manifest : `units.platform: []`
3. Désinstaller modules Odoo dépendants
4. Supprimer routes Caddy/DNS

**Faisabilité** : ✅ **FAISABLE** — Nécessite nettoyage manuel

---

## 📝 Conclusion

### Faisabilité Technique

✅ **FAISABLE** — L'architecture existante (manifest + units.platform) supporte déjà cette approche.

### Effort Estimé

- **Phase 1** (Script) : 2-4 heures
- **Phase 2** (Caddyfile) : 1-2 heures
- **Phase 3** (Documentation) : 1-2 heures
- **Tests** : 2-4 heures

**Total** : 6-12 heures

### Recommandation Finale

✅ **RECOMMANDÉ** — Permet une plateforme évolutive et flexible, avec un impact technique maîtrisé.

---

**Prochaine étape** : Valider cette analyse avant de procéder aux modifications.
