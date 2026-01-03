# 📘 Clarification Contractuelle — Tenant / Univers / Source

**Projet**: Dorevia Platform  
**Version**: v1.0  
**Date**: 2025-01-28  
**Statut**: Document de clarification — à annexer à la SPEC d'architecture

---

## 1. Objectif du document

Ce document a pour objectif de **lever toute ambiguïté contractuelle et technique** entre les notions de :

- **Tenant**
- **Univers**
- **Source**

dans la plateforme Dorevia, en particulier dans les flux **Odoo → DVIG → Vault**.

Il constitue une **référence normative** : toute implémentation doit s'y conformer.

---

## 2. Définitions normatives

### 2.1 Tenant

**Définition**  
Le **tenant** est une **entité DNS et contractuelle**.

Il représente :
- une plateforme cliente ou interne,
- une isolation logique et juridique,
- un périmètre de responsabilité et d'audit.

**Caractéristiques**
- Le tenant est porté par le **DNS**
- Le tenant est transmis à DVIG et Vault
- Le tenant est **stable dans le temps**

**Exemples**
- Tenant interne Dorevia : `core`
- Tenant client futur : `laplatine`, `bds`, etc.

**Règle absolue**
> Le tenant DVIG **DOIT correspondre exactement** au tenant DNS.

---

### 2.2 Univers

**Définition**  
L'**univers** désigne l'**application source** des événements métiers.

Il permet à DVIG de rester **ERP‑agnostique**.

**Exemples**
- `odoo`
- `sylius`
- `pos`
- (futur) `erpnext`, etc.

**Caractéristiques**
- L'univers est **fonctionnel**
- L'univers ne porte **aucune notion d'environnement**
- L'univers ne porte **aucune notion de client**

**Règle**
> Un token DVIG est toujours scopé à **un univers unique**.

---

### 2.3 Environnement

**Définition**  
L'**environnement** qualifie le **contexte d'exécution** d'une application.

**Valeurs autorisées**
- `lab` → développement
- `stinger` → démonstration client
- `prod` → production

L'environnement **n'est jamais** :
- un tenant
- un univers

---

### 2.4 Source

**Définition**  
La **source** est l'**identité complète** d'un producteur d'événements.

Elle est transmise dans chaque requête DVIG.

**Format normatif**
```
<univers>.<environnement>.<tenant>
```

**Exemples valides**
- `odoo.lab.core`
- `odoo.stinger.core`
- `odoo.prod.core`

**Exemples invalides**
- `core.odoo.lab` ❌
- `odoo.core` ❌
- `odoo.lab` ❌
- `odoo.prod.rehtse` ❌ (tenant incorrect)

---

## 3. Contrat DVIG — règles de validation

### 3.1 Règles contractuelles

Pour chaque requête entrante :

1. Le **token DVIG** définit :
   - `tenant`
   - `univers`

2. La **source** fournie dans la requête :
   - DOIT respecter le format exact `univers.env.tenant`
   - DOIT correspondre au `tenant` du token
   - DOIT correspondre à l'`univers` du token

### 3.2 Politique de validation

| Environnement | Politique |
|---------------|-----------|
| LAB | Validation stricte recommandée (tolérance possible temporaire) |
| STINGER | Validation stricte obligatoire |
| PROD | Validation stricte obligatoire |

---

## 4. Tokens DVIG — contrat formel

### 4.1 Structure minimale d'un token

```yaml
id: "tok_prod_core_001"
token_hash: "sha256:…"
tenant: "core"
univers: "odoo"
status: "active"
```

### 4.2 Règles

- Un token ≠ un environnement, mais :
  - **un environnement = une source**
- Les tokens LAB / STINGER / PROD sont **distincts**
- Les tokens sont **non interchangeables**

---

## 5. Contrat Vault — traçabilité

### 5.1 Données minimales transmises à Vault

Chaque événement transmis à Vault DOIT contenir :

- `tenant`
- `source`
- `timestamp`
- `payload métier`

### 5.2 Conséquences

- La preuve Vault est **auditée par tenant**
- La preuve Vault est **attribuable à une source unique**
- Une preuve `odoo.prod.core` a une **valeur juridique supérieure**
  à une preuve `odoo.lab.core`

---

## 6. Valeur contractuelle et juridique

La combinaison suivante constitue un **contrat implicite fort** :

```
Tenant + Source + Token + Horodatage + Preuve Vault
```

Ce contrat permet :
- la séparation juridique LAB / STINGER / PROD
- la traçabilité des démonstrations client
- l'audit PDP/PPF et NF525
- la non‑répudiation des événements de production

---

## 7. Invariants à ne jamais violer

1. Le tenant DNS ≡ tenant DVIG ≡ tenant Vault
2. Une source est toujours **complète** (`univers.env.tenant`)
3. Un token LAB ne doit jamais produire une preuve PROD
4. Un environnement n'est jamais un tenant
5. Un univers n'est jamais un environnement

---

## 8. Conclusion

Cette clarification contractuelle est **structurante** pour Dorevia :

- elle verrouille la lisibilité technique,
- elle protège juridiquement la production,
- elle permet l'industrialisation multi‑clients.

Toute évolution future (multi‑tenant, on‑prem, partenaires) **DOIT respecter ce contrat**.

---

**Fin du document**

