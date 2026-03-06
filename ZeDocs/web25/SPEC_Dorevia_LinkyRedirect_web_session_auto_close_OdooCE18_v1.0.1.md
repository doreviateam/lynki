# SPEC — Dorevia Linky Redirect + OCA `web_session_auto_close` (Odoo CE 18)

**Version :** 1.0.1  
**Date :** 2026-02-21  
**Cible :** Odoo Community 18 (backend) + Linky (Next.js)  
**Objectif :** Sécuriser les sessions Odoo par auto-déconnexion sur inactivité (OCA) **et** rediriger vers Linky **uniquement** pour les utilisateurs "concernés Linky", en cas de déconnexion volontaire **ou** d'expiration automatique.

---

## Changelog

### v1.0.1
Amendements intégrés suite au rapport d'analyse du 2026-02-21 :
- Dépendance `web_session_auto_close` rendue **obligatoire**.
- Domaine du cookie précisé et configurable.
- Nettoyage du cookie au logout.
- Whitelist d'URLs Linky stricte (v1.0).
- Sélection de l'URL Linky en fonction du `Host` (stinger/lab).
- Ajout du bypass `?force_login=1`.
- Pose du cookie limitée aux réponses HTML (page load) plutôt qu'aux JSON-RPC.

---

## 0. Résumé exécutif

Cette spécification décrit l'intégration de deux briques :

1. **OCA `web_session_auto_close`** : fermeture automatique de session Odoo après un délai d'inactivité configurable (par base), côté navigateur, via destruction de session (`/web/session/destroy`) puis rechargement de page.
2. **Module Odoo custom `dorevia_session_guard`** : redirection vers Linky lors d'un logout ou d'un retour sur `/web/login` après expiration **uniquement** si l'utilisateur appartient au périmètre Linky (piloté par **groupe** + **cookie**).

**Pourquoi :** certains utilisateurs (ex. Véréna) ne se déconnectent jamais volontairement, ce qui crée un risque sécurité (poste partagé, session persistante).  
**Contraintes :** tout le monde n'est pas concerné par Linky → pas de redirection globale.

---

## 1. Portée

### 1.1 Dans le scope
- Odoo CE 18, UI backend.
- Installation et configuration de `web_session_auto_close` (obligatoire).
- Création d'un module `dorevia_session_guard` :
  - Création d'un groupe "Linky Users".
  - Pose d'un cookie "marqueur Linky" sur les navigateurs des utilisateurs Linky.
  - Redirection conditionnelle vers Linky :
    - Déconnexion volontaire (`/web/session/logout`).
    - Expiration/auto-close (retour sur `/web/login` après `destroy` + `reload`).
- Whitelist de redirection stricte (anti open-redirect).
- Bypass `?force_login=1` pour afficher le login Odoo.

### 1.2 Hors scope
- SSO, OAuth2, SAML.
- Iframe / embedding Odoo dans Linky.
- Multi-tenant multi-domaine (sera abordé en v1.1).

---

## 2. Définitions

- **Utilisateur Linky** : utilisateur Odoo membre du groupe `dorevia_session_guard.group_linky_users`.
- **Cookie Linky** : cookie navigateur qui marque que ce navigateur appartient à un utilisateur Linky, afin de survivre à la destruction de session (expiration).
- **Retour Linky** : redirection HTTP 302 vers l'URL Linky (ex. `https://ui.stinger...`).

---

## 3. Exigences fonctionnelles

### 3.1 Auto-déconnexion (OCA)
- Le système DOIT déconnecter automatiquement un utilisateur Odoo après **X secondes** d'inactivité configurées.
- Configuration par base :
  - `web_session_auto_close.timeout` (secondes)
- Valeur par défaut : 600 s (10 min).

### 3.2 Redirection Linky (module Dorevia)
- La redirection vers Linky NE DOIT concerner que les navigateurs "Linky".
- Le système DOIT rediriger vers Linky dans deux cas :
  1) Déconnexion volontaire (`/web/session/logout`)
  2) Session expirée via auto-close (retour `/web/login`)

### 3.3 Préservation du comportement Odoo standard
- Non-Linky : logout/expiration → écran login Odoo.
- Accès direct à Odoo reste possible via bypass.

---

## 4. Exigences non fonctionnelles

### 4.1 Sécurité
- Anti open-redirect : aucune URL construite depuis des paramètres utilisateur.
- Cookies : `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`. Domaine : voir §6.4.
- **Pas** d'info user ni d'ID tenant dans le cookie — `dorevia_linky=1` suffit.
- Journalisation : log INFO minimal des redirects (sans données nominatives).

### 4.2 Maintenabilité
- Aucun fork de OCA.
- Module Dorevia versionné et déployé uniquement sur les bases Linky (recommandé).

---

## 5. Architecture cible

### 5.1 Modules
- **OCA** : `web_session_auto_close`
- **Dorevia** : `dorevia_session_guard`

### 5.2 Interaction

Auto-close (OCA) :
- inactivité ≥ timeout → `/web/session/destroy` → `location.reload()` → `/web/login`

Redirect (Dorevia) :
- si cookie `dorevia_linky=1` ET pas `force_login=1` → 302 vers Linky
- sinon → comportement Odoo standard

---

## 6. Spécification détaillée — Module `dorevia_session_guard`

### 6.1 Identité
- **Nom technique :** `dorevia_session_guard`
- **Licence :** AGPL-3.0
- **Dépendances :**
  - `web`
  - `web_session_auto_close` (**obligatoire**)

### 6.2 Paramètres (ir.config_parameter)
- `dorevia_session_guard.cookie_domain` (ex. `.doreviateam.com`, **vide par défaut** pour dev → navigateur scope auto)
- `dorevia_session_guard.linky_urls` (JSON list, v1.0 : stinger + lab stricts)

> Note : v1.0 autorise "hardcode safe" **si** la whitelist est stricte.  
> Recommandation : utiliser `ir.config_parameter` même en v1.0, pour éviter rebuild/redeploy au changement d'URL.

### 6.3 Groupe
- XML ID : `dorevia_session_guard.group_linky_users`
- Nom : `Linky Users`

### 6.4 Cookie
- Nom : `dorevia_linky`
- Valeur : `"1"` (suffisant — pas d'info user, pas d'ID tenant)
- Attributs : `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`
- Domaine :
  - Si `cookie_domain` param **vide** → **ne pas** définir l'attribut `Domain` → le navigateur scopera automatiquement (host courant). Indispensable en dev/localhost/lab/stinger custom.
  - Si `cookie_domain` param renseigné (ex. `.doreviateam.com`) → appliquer cette valeur.
  - v1.1 : liste de domaines autorisée
- Durée :
  - v1.0 : 30 jours (renouvelée à chaque page HTML)
- Suppression :
  - logout DOIT supprimer le cookie (`Max-Age=0`)

### 6.5 Pose/renouvellement du cookie (optimisée)
- Le cookie DOIT être posé uniquement sur des réponses **HTML** (page load), pas sur JSON-RPC :
  - Ex : route `/web` (HTML) et/ou post-login redirect
- Condition :
  - session authentifiée (`request.session.uid`)
  - user ∈ groupe Linky

### 6.6 Sélection URL Linky (v1.0)
La redirection Linky est choisie en fonction du host Odoo :

- `odoo.stinger.sarl-la-platine.doreviateam.com` → `https://ui.stinger.sarl-la-platine.doreviateam.com`
- `odoo.lab.sarl-la-platine.doreviateam.com` → `https://ui.lab.sarl-la-platine.doreviateam.com`

**Host normalisé :** `host = request.httprequest.host.split(':')[0]` — évite un faux négatif si test en `:8069`.  
**Convention URL :** `allowed_urls` et host_map stockés **sans slash final** — sinon exact-match punira.

### 6.7 Whitelist stricte (v1.0)
Liste autorisée (**exact match uniquement**) :

- `https://ui.stinger.sarl-la-platine.doreviateam.com`
- `https://ui.lab.sarl-la-platine.doreviateam.com`

**Convention :** `allowed_urls` et host_map **sans slash final** (`https://...com` et non `https://...com/`).  
**⚠️ Validation impérative :** `if url in allowed_urls` (exact match). **Jamais** `url.startswith(...)` ou `allowed_url in url` — sinon ouverture à `https://ui.stinger.doreviateam.com.evil.com`.

### 6.8 Redirection — règles

#### 6.8.1 Bypass
- Si querystring `force_login=1` est présent → ne jamais rediriger (afficher login Odoo).

#### 6.8.2 `/web/session/logout`
- **Ordre impératif** : lire `uid`, `user`, `is_linky` (groupe), `has_cookie` **avant** tout appel à `request.session.logout()`. Sinon le contexte user est perdu.
- `request.session.logout()`
- supprimer cookie `dorevia_linky`
- si cookie présent AVANT suppression OU user Linky → redirect Linky
- sinon → redirect `/web/login`

#### 6.8.3 `/web/login`
- Route Odoo : `@http.route('/web/login', type='http', auth='none')`. Redéfinir mal = casser le login standard.
- **Intercepter uniquement si** : GET **et** pas `force_login=1` **et** cookie `dorevia_linky=1` → redirect Linky.
- Sinon (POST, ou force_login=1, ou pas de cookie) → `super()` direct.

---

## 7. Paramétrage OCA — `web_session_auto_close`

### 7.1 Paramètre principal
- `web_session_auto_close.timeout` (secondes)

### 7.2 Valeurs recommandées
- 900 s (15 min) : sécurité stricte
- 1800 s (30 min) : confort + sécurité

---

## 8. Déploiement

### 8.1 Périmètre recommandé
- Installer `dorevia_session_guard` uniquement sur les bases qui utilisent Linky (ex : `sarl-la-platine` stinger/lab).

### 8.2 Installation
1) Installer `web_session_auto_close`
2) Configurer `web_session_auto_close.timeout`
3) Installer `dorevia_session_guard`
4) Assigner le groupe "Linky Users" aux utilisateurs concernés (ex. Véréna)

---

## 9. Tests (DoD)

### 9.1 Fonctionnels
- T1 : non-Linky → logout → login Odoo
- T2 : Linky → logout → Linky
- T3 : non-Linky → inactivité → login Odoo
- T4 : Linky → inactivité → Linky
- T5 : bypass `?force_login=1` fonctionne

### 9.2 Sécurité — checklist
- Cookie : `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`
- Pas d'info user ni d'ID tenant dans le cookie — `dorevia_linky=1` suffit
- Redirect uniquement vers whitelist (exact match)
- Suppression cookie au logout

---

## 10. Roadmap v1.1
- multi-domaine cookie (cmh-projects.fr + doreviateam.com)
- URL Linky configurable par tenant (param + validation)
- extension événements activité (scroll/click/touch) si nécessaire
