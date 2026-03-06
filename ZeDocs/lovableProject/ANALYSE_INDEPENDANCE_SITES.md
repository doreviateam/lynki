# 🔍 Analyse d'indépendance — Sites core vs lovable44

**Date** : 2026-01-22  
**Sites** :
- `https://sylius.lab.core.doreviateam.com/` (Dorevia-Vault)
- `https://sylius.lab.lovable44.doreviateam.com/` (Lov'Arbitre)

---

## ❌ Réponse : NON, ils ne sont PAS indépendants

### Ce qui est partagé

#### 1. Infrastructure Docker
- ✅ **Même conteneur Nginx** : `sylius_lab_core_nginx`
- ✅ **Même conteneur PHP-FPM** : `sylius_lab_core_php-fpm`
- ✅ **Même base de données PostgreSQL** : `sylius_lab_core_postgres` / `sylius_db`
- ✅ **Même réseau Docker** : `dorevia-network`

#### 2. Code source
- ✅ **Même code Symfony** : fichiers partagés dans `units/sylius/src/`
- ✅ **Mêmes templates** : `units/sylius/templates/`
- ✅ **Mêmes assets** : `units/sylius/public/`

#### 3. Données
- ✅ **Même base de données** : table `leads`, `articles`, etc. partagées
- ✅ **Pas de séparation par tenant** dans la base de données

#### 4. Configuration
- ✅ **Même configuration Symfony** : `config/`
- ✅ **Même cache** : `var/cache/`

---

## ✅ Ce qui est séparé

### 1. Contenu affiché
- ✅ **Détection automatique** via hostname dans `HomeController`
- ✅ **Templates différents** : `home/v2-complete.html.twig` vs `lovable/lovarbitre.html.twig`
- ✅ **URLs différentes** : DNS séparés

### 2. Certificats SSL
- ✅ **Certificats SSL séparés** : un par domaine

---

## ⚠️ Risques d'indépendance

### 1. Disponibilité
- ❌ Si `sylius_lab_core_php-fpm` plante → **les deux sites sont down**
- ❌ Si `sylius_lab_core_nginx` plante → **les deux sites sont down**
- ❌ Si la base de données plante → **les deux sites sont down**

### 2. Données
- ❌ **Pas de séparation des données** : si un formulaire de contact existe, les leads sont mélangés
- ❌ **Pas de filtrage par tenant** dans les requêtes SQL

### 3. Déploiements
- ❌ **Mise à jour de code** → affecte les deux sites
- ❌ **Migration de base de données** → affecte les deux sites

### 4. Performance
- ❌ **Charge partagée** : un site qui consomme beaucoup de ressources affecte l'autre
- ❌ **Cache partagé** : vidage de cache affecte les deux

---

## 💡 Solutions pour une vraie indépendance

### Option A : Isolation complète (Recommandé pour production)

**Créer une instance Sylius séparée pour `lovable44`** :

```
units/sylius-lovable44/
├── docker-compose.yml          # Instance séparée
├── src/                        # Code dédié (ou symlink)
├── templates/                  # Templates dédiés
└── public/                     # Assets dédiés
```

**Avantages** :
- ✅ Isolation complète (conteneurs, base de données)
- ✅ Déploiements indépendants
- ✅ Pas d'impact mutuel

**Inconvénients** :
- ⚠️ Plus de ressources (2 instances)
- ⚠️ Maintenance plus complexe

---

### Option B : Multi-tenant avec isolation base de données

**Ajouter un champ `tenant_id` dans toutes les tables** :

```sql
ALTER TABLE leads ADD COLUMN tenant_id VARCHAR(50);
CREATE INDEX idx_leads_tenant_id ON leads(tenant_id);
```

**Filtrer par tenant dans les requêtes** :

```php
// Dans LeadRepository
public function findByTenant(string $tenantId): array
{
    return $this->createQueryBuilder('l')
        ->where('l.tenantId = :tenantId')
        ->setParameter('tenantId', $tenantId)
        ->getQuery()
        ->getResult();
}
```

**Avantages** :
- ✅ Données séparées
- ✅ Même infrastructure
- ✅ Moins de ressources

**Inconvénients** :
- ⚠️ Code plus complexe
- ⚠️ Risque d'erreur (oubli de filtre)
- ⚠️ Pas d'isolation au niveau infrastructure

---

### Option C : Statu quo (Acceptable pour lab/développement)

**Garder la configuration actuelle** si :
- ✅ Sites en développement/test
- ✅ Pas de données sensibles
- ✅ Pas de besoin d'isolation stricte

**Avantages** :
- ✅ Simple
- ✅ Moins de ressources
- ✅ Maintenance facile

**Inconvénients** :
- ❌ Pas d'isolation réelle
- ❌ Risque de mélange de données

---

## 📊 Comparaison

| Critère | Actuel | Option A (Isolation) | Option B (Multi-tenant) |
|---------|--------|---------------------|------------------------|
| **Infrastructure** | ❌ Partagée | ✅ Séparée | ⚠️ Partagée |
| **Base de données** | ❌ Partagée | ✅ Séparée | ⚠️ Partagée (filtrée) |
| **Code** | ❌ Partagé | ✅ Séparé | ⚠️ Partagé |
| **Déploiements** | ❌ Couplés | ✅ Indépendants | ⚠️ Couplés |
| **Ressources** | ✅ Faible | ❌ Élevé | ✅ Faible |
| **Complexité** | ✅ Simple | ❌ Complexe | ⚠️ Moyenne |

---

## 🎯 Recommandation

**Pour l'instant (lab/développement)** :
- ✅ **Option C (Statu quo)** : Acceptable
- ✅ Sites fonctionnent correctement
- ✅ Pas de données critiques

**Pour la production** :
- ✅ **Option A (Isolation complète)** : Recommandé
- ✅ Isolation garantie
- ✅ Pas de risque de mélange

---

## 📝 Conclusion

**Réponse directe** : Non, les sites ne sont **pas indépendants** actuellement.

Ils partagent :
- Infrastructure (conteneurs Docker)
- Base de données
- Code source
- Cache

Ils sont seulement séparés au niveau :
- Contenu affiché (détection hostname)
- URLs DNS

**Pour une vraie indépendance** : Créer une instance Sylius séparée pour `lovable44`.
