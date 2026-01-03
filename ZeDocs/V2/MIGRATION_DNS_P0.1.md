# 🌐 Plan de Migration DNS — Correction P0.1 (FQDN DVIG/Vault)

**Date** : 2025-12-31  
**Contexte** : Breaking change suite à correction P0.1 — Architecture DVIG/Vault  
**Priorité** : 🔴 **HAUTE** — Impact tous les tenants en production  
**Statut** : ⏳ **En attente coordination infrastructure**

---

## 📋 Résumé Exécutif

**Changement** : Les hostnames DVIG et Vault passent de `dvig.<env>.<tenant>` à `dvig.<tenant>` (sans environnement).

**Raison** : Architecture figée — 1 DVIG + 1 Vault par tenant (pas par environnement).

**Impact** : **Tous les tenants existants** (`core`, `dido`, `rozas`) + tous les futurs tenants.

**Durée estimée** : 1-2 heures (selon propagation DNS)

---

## 🎯 Objectif de la Migration

### Avant (Ancien Format)

```
dvig.lab.core.doreviateam.com     → IP serveur
dvig.stinger.core.doreviateam.com → IP serveur
dvig.prod.core.doreviateam.com    → IP serveur

vault.lab.core.doreviateam.com     → IP serveur
vault.stinger.core.doreviateam.com → IP serveur
vault.prod.core.doreviateam.com    → IP serveur
```

**Problème** : Multiplication inutile des enregistrements DNS (3 par service × 2 services × N tenants).

### Après (Nouveau Format)

```
dvig.core.doreviateam.com → IP serveur (1 seul enregistrement)
vault.core.doreviateam.com → IP serveur (1 seul enregistrement)
```

**Avantage** : 1 enregistrement par service par tenant (réduction de 66% des enregistrements).

---

## 📊 Scope de la Migration

### Tenants Concernés

| Tenant | Environnements Actifs | Enregistrements à Supprimer | Enregistrements à Créer |
|--------|----------------------|----------------------------|------------------------|
| `core` | lab, stinger, prod | 6 (3 env × 2 services) | 2 (dvig, vault) |
| `dido` | lab, stinger, prod | 6 (3 env × 2 services) | 2 (dvig, vault) |
| `rozas` | lab, stinger, prod | 6 (3 env × 2 services) | 2 (dvig, vault) |
| **Total** | - | **18 enregistrements** | **6 enregistrements** |

### Enregistrements DNS Détaillés

#### Tenant `core`

**À supprimer** :
- `dvig.lab.core.doreviateam.com` (A record)
- `dvig.stinger.core.doreviateam.com` (A record)
- `dvig.prod.core.doreviateam.com` (A record)
- `vault.lab.core.doreviateam.com` (A record)
- `vault.stinger.core.doreviateam.com` (A record)
- `vault.prod.core.doreviateam.com` (A record)

**À créer** :
- `dvig.core.doreviateam.com` (A record) → IP serveur
- `vault.core.doreviateam.com` (A record) → IP serveur

#### Tenant `dido`

**À supprimer** :
- `dvig.lab.dido.doreviateam.com` (A record)
- `dvig.stinger.dido.doreviateam.com` (A record)
- `dvig.prod.dido.doreviateam.com` (A record)
- `vault.lab.dido.doreviateam.com` (A record)
- `vault.stinger.dido.doreviateam.com` (A record)
- `vault.prod.dido.doreviateam.com` (A record)

**À créer** :
- `dvig.dido.doreviateam.com` (A record) → IP serveur
- `vault.dido.doreviateam.com` (A record) → IP serveur

#### Tenant `rozas`

**À supprimer** :
- `dvig.lab.rozas.doreviateam.com` (A record)
- `dvig.stinger.rozas.doreviateam.com` (A record)
- `dvig.prod.rozas.doreviateam.com` (A record)
- `vault.lab.rozas.doreviateam.com` (A record)
- `vault.stinger.rozas.doreviateam.com` (A record)
- `vault.prod.rozas.doreviateam.com` (A record)

**À créer** :
- `dvig.rozas.doreviateam.com` (A record) → IP serveur
- `vault.rozas.doreviateam.com` (A record) → IP serveur

---

## 🔧 Étapes de Migration

### Phase 1 : Préparation (Avant Migration)

#### 1.1 Vérifier l'état actuel

```bash
# Vérifier que les Caddyfiles sont régénérés avec le nouveau format
for tenant in core dido rozas; do
  for env in lab stinger prod; do
    if [ -f "tenants/$tenant/rendered/$env/caddy/Caddyfile" ]; then
      echo "=== $tenant/$env ==="
      grep -E "^(dvig|vault)\." "tenants/$tenant/rendered/$env/caddy/Caddyfile"
    fi
  done
done
```

**Résultat attendu** : Tous les Caddyfiles doivent contenir `dvig.<tenant>` et `vault.<tenant>` (sans `<env>`).

#### 1.2 Vérifier la gateway

```bash
# Vérifier que la gateway est agrégée
dorevia.sh gateway aggregate

# Vérifier le Caddyfile global
grep -E "^(dvig|vault)\." units/gateway/Caddyfile | head -10
```

#### 1.3 Identifier l'IP serveur

**IP serveur** : `85.215.206.213`

**Note** : Tous les tenants (`core`, `dido`, `rozas`) pointent vers la même IP serveur.

---

### Phase 2 : Migration DNS (Coordination Infrastructure)

#### 2.1 Créer les nouveaux enregistrements

**Action** : Créer les 6 nouveaux enregistrements (2 par tenant × 3 tenants)

**Format** :
```
Type: A
Name: dvig.<tenant>.doreviateam.com
Value: 85.215.206.213
TTL: 300 (ou valeur standard)

Type: A
Name: vault.<tenant>.doreviateam.com
Value: 85.215.206.213
TTL: 300 (ou valeur standard)
```

**Exemple pour `core`** :
```
dvig.core.doreviateam.com    A    85.215.206.213    300
vault.core.doreviateam.com   A    85.215.206.213    300
```

#### 2.2 Vérifier la propagation DNS

**Attendre** : Propagation DNS (généralement 5-15 minutes, max 48h selon TTL)

**Vérification** :
```bash
# Vérifier résolution DNS pour chaque tenant
for tenant in core dido rozas; do
  echo "=== Tenant: $tenant ==="
  dig +short dvig.$tenant.doreviateam.com
  dig +short vault.$tenant.doreviateam.com
done
```

**Résultat attendu** : Toutes les requêtes doivent retourner l'IP du serveur.

#### 2.3 Supprimer les anciens enregistrements

**⚠️ IMPORTANT** : Supprimer **APRÈS** vérification que les nouveaux fonctionnent.

**Action** : Supprimer les 18 anciens enregistrements (6 par tenant × 3 tenants)

**Liste complète à supprimer** :
```
dvig.lab.core.doreviateam.com
dvig.stinger.core.doreviateam.com
dvig.prod.core.doreviateam.com
vault.lab.core.doreviateam.com
vault.stinger.core.doreviateam.com
vault.prod.core.doreviateam.com

dvig.lab.dido.doreviateam.com
dvig.stinger.dido.doreviateam.com
dvig.prod.dido.doreviateam.com
vault.lab.dido.doreviateam.com
vault.stinger.dido.doreviateam.com
vault.prod.dido.doreviateam.com

dvig.lab.rozas.doreviateam.com
dvig.stinger.rozas.doreviateam.com
dvig.prod.rozas.doreviateam.com
vault.lab.rozas.doreviateam.com
vault.stinger.rozas.doreviateam.com
vault.prod.rozas.doreviateam.com
```

---

### Phase 3 : Validation Post-Migration

#### 3.1 Tests de connectivité

```bash
# Test healthcheck DVIG pour chaque tenant
for tenant in core dido rozas; do
  echo "=== DVIG $tenant ==="
  curl -I https://dvig.$tenant.doreviateam.com/health
done

# Test healthcheck Vault pour chaque tenant
for tenant in core dido rozas; do
  echo "=== Vault $tenant ==="
  curl -I https://vault.$tenant.doreviateam.com/health
done
```

**Résultat attendu** : HTTP 200 ou 401 (authentification requise) pour tous les endpoints.

#### 3.2 Vérifier la gateway

```bash
# Recharger la gateway
dorevia.sh gateway reload

# Vérifier les logs Caddy
docker logs gateway-caddy --tail 50
```

#### 3.3 Tests fonctionnels

**Tests à effectuer** :
- [ ] Accès DVIG via nouveau hostname
- [ ] Accès Vault via nouveau hostname
- [ ] Génération de tokens DVIG fonctionne
- [ ] Upload de documents Vault fonctionne
- [ ] Intégrations Odoo → DVIG fonctionnent

---

## ⚠️ Risques et Mitigation

### Risque 1 : Période de transition (anciens + nouveaux enregistrements)

**Impact** : Les deux formats fonctionnent simultanément pendant la transition.

**Mitigation** : 
- Créer les nouveaux enregistrements en premier
- Vérifier qu'ils fonctionnent
- Supprimer les anciens après validation

**Durée** : 24-48h maximum (selon TTL)

### Risque 2 : Propagation DNS lente

**Impact** : Certains clients peuvent encore résoudre les anciens hostnames.

**Mitigation** :
- Attendre propagation complète avant suppression
- Monitorer les résolutions DNS
- Garder les anciens enregistrements 48h après création des nouveaux

### Risque 3 : Intégrations externes utilisant les anciens hostnames

**Impact** : Applications tierces peuvent casser si elles utilisent les anciens hostnames.

**Mitigation** :
- Audit des intégrations avant migration
- Communication aux équipes utilisatrices
- Plan de rollback si nécessaire

---

## 📅 Planning Recommandé

### Option 1 : Migration Progressive (Recommandée)

**Jour 1** :
- 09:00 - Créer nouveaux enregistrements DNS
- 09:15 - Vérifier propagation DNS
- 09:30 - Tests de connectivité nouveaux hostnames
- 10:00 - Recharger gateway
- 10:30 - Tests fonctionnels complets

**Jour 2** :
- 09:00 - Vérifier que tout fonctionne
- 09:30 - Supprimer anciens enregistrements DNS
- 10:00 - Validation finale

### Option 2 : Migration Rapide (Si fenêtre de maintenance)

**Fenêtre de maintenance** (2 heures) :
- 00:00 - Créer nouveaux enregistrements DNS
- 00:15 - Attendre propagation (15 min)
- 00:30 - Tests de connectivité
- 00:45 - Recharger gateway
- 01:00 - Tests fonctionnels
- 01:30 - Supprimer anciens enregistrements
- 02:00 - Validation finale

---

## 📞 Contacts et Responsabilités

### Équipe Infrastructure

**Responsabilités** :
- Création/suppression enregistrements DNS
- Vérification propagation DNS
- Gestion TTL et cache DNS

**Contact** : [À compléter]

### Équipe Plateforme

**Responsabilités** :
- Validation Caddyfiles régénérés
- Tests de connectivité
- Rechargement gateway
- Tests fonctionnels

**Contact** : [À compléter]

### Équipe Développement

**Responsabilités** :
- Audit intégrations externes
- Communication changements
- Support post-migration

**Contact** : [À compléter]

---

## ✅ Checklist de Migration

### Pré-Migration

- [ ] Caddyfiles régénérés pour tous les tenants (✅ Fait)
- [ ] Gateway agrégée (✅ Fait)
- [ ] IP serveur identifiée
- [ ] Audit intégrations externes
- [ ] Communication équipes utilisatrices
- [ ] Fenêtre de maintenance planifiée

### Migration

- [ ] Nouveaux enregistrements DNS créés
- [ ] Propagation DNS vérifiée
- [ ] Tests de connectivité nouveaux hostnames
- [ ] Gateway rechargée
- [ ] Tests fonctionnels complets
- [ ] Anciens enregistrements DNS supprimés

### Post-Migration

- [ ] Validation finale tous les tenants
- [ ] Monitoring 24h post-migration
- [ ] Documentation mise à jour
- [ ] Communication migration réussie

---

## 🔄 Plan de Rollback

**Si problème détecté** :

1. **Immédiat** : Recréer les anciens enregistrements DNS
2. **Gateway** : Recharger avec ancien Caddyfile (si sauvegardé)
3. **Investigation** : Identifier la cause du problème
4. **Correction** : Appliquer correctif
5. **Re-migration** : Relancer migration après correctif

**Temps de rollback estimé** : 15-30 minutes

---

## 📚 Références

- **Rapport Corrections P0** : `ZeDocs/V2/RAPPORT_CORRECTIONS_P0.md`
- **Code Review Phase 2** : `ZeDocs/V2/REVUE_CODE_PHASE2.md`
- **Spécification Architecture** : `ZeDocs/SPEC_Dorevia_Reference_v2.0.md`

---

**Document créé le** : 2025-12-31  
**Dernière mise à jour** : 2025-12-31  
**Statut** : ⏳ **En attente coordination infrastructure**

