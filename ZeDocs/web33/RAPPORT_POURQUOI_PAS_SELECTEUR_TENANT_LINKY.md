# Rapport — Pourquoi Linky ne permet pas de sélectionner un tenant parmi n

**Date :** 2026-02-26  
**Objet :** Explication de l’absence de sélecteur de tenant dans l’interface Linky  
**Contexte :** Plateforme Dorevia multi-tenant, cockpit financier Linky

---

## 1. Constat

Dans l’interface Linky, l’utilisateur dispose d’un **sélecteur de société** (ex. « SARL La Platine », « Sweet Manihot », « Tout ») mais **aucun sélecteur permettant de choisir un tenant parmi plusieurs**. Le tenant est affiché en lecture seule dans l’en-tête (ex. `sarl-la-platine`), sans possibilité de le changer depuis l’interface.

---

## 2. Architecture actuelle

### 2.1 Modèle « une instance par tenant »

| Élément | Comportement |
|---------|--------------|
| **Variable d’environnement** | Chaque déploiement Linky a une variable `TENANT_ID` (ex. `sarl-la-platine`, `core`) |
| **API `/api/tenant`** | Retourne `{ tenant_id: process.env.TENANT_ID }` — lecture seule, pas de paramètre utilisateur |
| **Source de vérité** | Le tenant est déterminé au **déploiement**, pas à l’exécution par l’utilisateur |

### 2.2 Flux de chargement

1. Au chargement, Linky appelle `GET /api/tenant`
2. La réponse donne le `tenant_id` (issu de `TENANT_ID`)
3. Toutes les requêtes suivantes (treasury, dashboard-metrics, companies, etc.) passent ce `tenant` en paramètre
4. L’utilisateur ne peut pas modifier ce tenant depuis l’interface

### 2.3 Accès multi-tenant par URL

Chaque tenant est exposé via une **URL distincte** (sous-domaine ou chemin) :

| Tenant | Exemple d’URL |
|--------|----------------|
| sarl-la-platine | `ui.lab.sarl-la-platine.doreviateam.com` |
| core | `ui.lab.core.doreviateam.com` (si déployé) |

Pour consulter le cockpit d’un autre tenant, l’utilisateur accède à l’URL correspondante — pas à un sélecteur dans l’application.

---

## 3. Raisons de l’absence de sélecteur de tenant

### 3.1 Choix d’architecture

- **Isolation par déploiement** : Chaque tenant a sa propre instance Linky (conteneur, processus). Cela permet une isolation forte (données, configuration, évolutions).
- **Sécurité** : Pas de risque de bascule accidentelle vers un autre tenant ; pas d’exposition croisée de données entre tenants.
- **Simplicité** : Pas de gestion des droits « voir tenant X » dans une même session ; l’authentification/routage se fait en amont (reverse proxy, DNS).

### 3.2 Différence tenant / société

| Notion | Périmètre | Sélecteur dans Linky |
|--------|-----------|----------------------|
| **Tenant** | Organisation / espace client (ex. sarl-la-platine, core) | ❌ Non — fixé par l’URL et `TENANT_ID` |
| **Société (company)** | Entité comptable dans Odoo (ex. SARL La Platine, Sweet Manihot) | ✅ Oui — menu déroulant dans l’en-tête |

Le sélecteur visible (« SARL La Platine » avec flèche) permet de changer de **société** au sein du tenant courant, pas de tenant.

### 3.3 Rôle de la couche routage

Le routage (Caddy, DNS, sous-domaines) détermine quelle instance Linky (et donc quel tenant) est atteinte. C’est le point d’entrée naturel pour le multi-tenant, avant même le chargement de Linky.

---

## 4. Fichiers concernés

| Fichier | Rôle |
|---------|------|
| `units/dorevia-linky/app/api/tenant/route.ts` | Retourne `tenant_id` depuis `process.env.TENANT_ID` |
| `units/dorevia-linky/components/DashboardWithFilters.tsx` | Charge le tenant via `/api/tenant`, pas de contrôle utilisateur |
| `tenants/<tenant>/apps/ui/lab/docker-compose.yml` | Définit `TENANT_ID` par déploiement |

---

## 5. Synthèse

**Pourquoi je ne peux pas sélectionner un tenant parmi n dans Linky ?**

Parce que l’architecture actuelle suppose **une instance Linky par tenant**, identifiée par l’URL et la variable `TENANT_ID`. Le tenant n’est pas une donnée modifiable par l’utilisateur, mais un paramètre de déploiement. Pour accéder à un autre tenant, il faut utiliser l’URL dédiée à ce tenant (ex. autre sous-domaine), ce qui charge une autre instance Linky.

---

## 6. Évolution possible

Pour permettre un sélecteur de tenant dans une même interface, il faudrait :

1. Exposer une API listant les tenants accessibles à l’utilisateur
2. Gérer l’authentification et les droits par tenant
3. Adapter Linky pour accepter un tenant dynamique (URL, query param ou contexte)
4. Garantir l’isolation des données entre tenants au niveau applicatif

Une telle évolution relève d’un chantier fonctionnel et technique dédié.

---

*Document créé le 2026-02-26.*
