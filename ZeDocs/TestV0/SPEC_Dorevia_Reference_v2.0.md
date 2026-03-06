# 📘 DOREVIA — Spécification de Référence (v2.0)

**Statut :** SPEC SOCLE (normative)  
**Audience :** Architecture, AMOA, exploitation, développement plateforme  
**Portée :** Plateforme Dorevia — Lab / Stinger / Prod

---

## 0. Rôle de ce document

Cette spécification définit **ce qu’est Dorevia**, indépendamment :

- des scripts
- des outils
- des environnements clients
- des choix d’implémentation transitoires

Elle constitue la **référence normative** du projet.  
Tout autre document (process, CLI, checklist, analyse d’impact) est **subordonné** à cette SPEC.

---

## 1. Principes non négociables

1. Séparation stricte **intention / exécution**  
2. Configuration déclarative comme **source de vérité**  
3. Standard SaaS par défaut  
4. Extension client **sans remise en cause du standard**  
5. Auditabilité systématique  
6. Aucun comportement implicite  
7. Distinction stricte **métier / technique**  

Toute implémentation qui viole ces principes est **non conforme**.

---

## 2. Concepts fondamentaux

### 2.1 Tenant

Un **tenant** est l’unité :
- contractuelle
- d’isolation logique et technique
- de responsabilité des données

Un tenant est **immuable dans son identité**.

Il est indépendant :
- des domaines
- des serveurs
- des environnements
- des modes d’hébergement

---

### 2.2 Univers

Un **univers** est une **application fonctionnelle exposée** rattachée à un tenant.

Caractéristiques :
- visible par les utilisateurs ou intégrations
- structure les **URLs publiques**
- structure les **tokens d’accès**
- stable dans le temps

Exemples normatifs :
- `odoo`
- `pos`
- `sylius`

Les URLs sont **toujours construites à partir des univers**.

---

### 2.3 Unit

Une **unit** est une **brique technique déployable** de la plateforme.

Caractéristiques :
- interne à la plateforme
- non nécessairement exposée publiquement
- versionnable indépendamment
- orchestrée par Dorevia

Exemples normatifs :
- `odoo`
- `dvig`
- `vault`
- `postgres`
- `caddy`
- `redis`

---

### 2.4 Relation Univers / Unit

- Un univers est implémenté par **une ou plusieurs units**
- Une unit peut servir **plusieurs univers**
- Les univers et les units sont **orthogonaux**

---

## 3. Environnements

| Environnement | Rôle |
|--------------|------|
| `lab` | Développement |
| `stinger` | Pré-production |
| `prod` | Production |

Propriétés :
- isolation stricte
- déploiement indépendant
- conventions de nommage identiques

---

## 4. Standard SaaS Dorevia

### Pattern normatif
```
<univers>.<environnement>.<tenant>.doreviateam.com
```

Exemples :
- `odoo.lab.rehtse.doreviateam.com`
- `odoo.stinger.rehtse.doreviateam.com`
- `odoo.prod.rehtse.doreviateam.com`

Ce standard :
- s’applique à Lab, Stinger et Prod
- constitue la règle par défaut
- reste valide même en cas d’extension client

---

## 5. Extension production — Domaine et/ou serveur client

En **production uniquement**, un tenant peut être déployé :
- sur un serveur client
- avec un domaine client

### Pattern étendu
```
<univers>.prod.<tenant>.<domain_client>
```

Exemples :
- `odoo.prod.rehtse.client.com`
- `dvig.prod.rehtse.client.com`
- `vault.prod.rehtse.client.com`

Invariants :
- le tenant ne change pas
- les univers ne changent pas
- Lab et Stinger restent sur `doreviateam.com`

---

## 6. Services cœur (hors univers)

Services normatifs :
- `dvig`
- `vault`

### Exposition standard
```
dvig.<env>.<tenant>.doreviateam.com
vault.<env>.<tenant>.doreviateam.com
```

Ils :
- ne sont pas des univers métier
- peuvent supporter plusieurs hostnames
- sont critiques pour la sécurité et l’audit

---

## 7. Hostnames canoniques et alias

### 7.1 Canonique

Chaque service exposé possède :
- un **hostname canonique unique**
- utilisé pour logs, métriques et audit
- toujours fonctionnel

---

### 7.2 Alias

Un **alias** est un hostname supplémentaire :
- pointant vers le même service
- accepté explicitement
- sans création de tenant

Exemples :
- `erp.client.com`
- `api.client.com`

---

## 8. Intention, configuration et exécution

### 8.1 Intention

L’intention est :
- humaine
- explicite
- capturée via un outil

Elle **ne modifie jamais le système**.

---

### 8.2 Configuration déclarative

La configuration :
- est la **source de vérité**
- est versionnable
- est relisible à froid
- décrit intégralement l’exécution

---

### 8.3 Exécution

L’exécution :
- est non interactive
- lit uniquement la configuration
- est déterministe
- est auditable

---

## 9. Pré-requis et responsabilités

La plateforme peut :
- vérifier les pré-requis
- proposer une installation contrôlée

Elle ne gère jamais implicitement :
- le système d’exploitation
- la sécurité réseau client
- le DNS externe

---

## 10. Auditabilité

Tout état doit permettre :
- reconstitution de l’intention
- traçabilité des actions
- reproduction à l’identique
- justification a posteriori

---

## 11. Périmètre de la SPEC

Cette SPEC :
- définit le cadre
- ne décrit pas les workflows
- ne décrit pas les scripts
- ne décrit pas les outils

Ces éléments font l’objet de documents dérivés.

---

## 12. Conclusion

Cette spécification définit Dorevia comme :

- une plateforme SaaS maîtrisée
- extensible vers des environnements clients
- audit-ready
- stable dans ses concepts
- claire pour l’AMOA comme pour l’exploitant

Elle constitue la **référence absolue** du projet.
