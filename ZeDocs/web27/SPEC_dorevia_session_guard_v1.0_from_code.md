# Spécification technique — Module `dorevia_session_guard`

**Version :** 1.0  
**Date :** 2026-02-21  
**Source :** Analyse du code — `units/odoo/custom-addons/dorevia_session_guard/`  
**Cible :** Odoo Community 18  

---

## Résumé

Le module **`dorevia_session_guard`** sécurise les sessions Odoo en s’appuyant sur l’OCA `web_session_auto_close`, puis redirige les utilisateurs « Linky » vers le cockpit Linky lors d’une déconnexion (volontaire ou par expiration) au lieu de les renvoyer vers l’écran de login Odoo.

---

## 1. Identité du module

| Attribut | Valeur |
|----------|--------|
| **Nom technique** | `dorevia_session_guard` |
| **Nom affiché** | Dorevia Session Guard |
| **Version** | 1.0.0 |
| **Catégorie** | Productivity |
| **Licence** | AGPL-3.0 |
| **Dépendances** | `web`, `web_session_auto_close` |

### Manifest (`__manifest__.py`)

```python
'depends': ['web', 'web_session_auto_close']
'data': [
    'security/ir.model.access.csv',
    'security/res_groups.xml',
    'data/ir_config_parameter.xml',
    'data/res_users_linky.xml',
]
```

---

## 2. Structure du module

```
dorevia_session_guard/
├── __manifest__.py
├── __init__.py              # imports models, controllers
├── controllers/
│   ├── __init__.py          # imports main
│   └── main.py              # Session, Home (logout, web_login)
├── models/
│   ├── __init__.py          # imports ir_http
│   └── ir_http.py           # IrHttp._dispatch, cookie helpers
├── data/
│   ├── ir_config_parameter.xml
│   └── res_users_linky.xml
├── security/
│   ├── ir.model.access.csv  # minimal (aucun modèle propre)
│   └── res_groups.xml
└── tests/
    ├── __init__.py
    └── test_session_guard.py
```

---

## 3. Groupe d’accès

**XML ID :** `dorevia_session_guard.group_linky_users`  
**Nom :** Linky Users

- Défini dans `security/res_groups.xml` avec `noupdate="1"`.
- `base.user_admin` est ajouté au groupe par défaut dans `data/res_users_linky.xml` (noupdate=0).

Un utilisateur est considéré comme « Linky » si :

```python
user.has_group('dorevia_session_guard.group_linky_users')
```

---

## 4. Paramètres de configuration

### 4.1 `dorevia_session_guard.cookie_domain`

- **Clé :** `dorevia_session_guard.cookie_domain`
- **Valeur par défaut :** vide
- **Rôle :** Domaine du cookie `dorevia_linky`. Si vide, l’attribut `Domain` n’est pas posé (scope automatique du navigateur).
- **Exemple prod :** `.doreviateam.com`

### 4.2 `dorevia_session_guard.logout_linky_url`

- **Clé :** `dorevia_session_guard.logout_linky_url`
- **Valeur par défaut :** `https://ui.lab.sarl-la-platine.doreviateam.com` (pour odoo.stinger sans odoo.lab)
- **Rôle :** URL fixe pour la redirection logout. Si défini et présent dans la whitelist, prioritaire sur le mapping host. Vide = mapping odoo.* → ui.*.

### 4.3 `dorevia_session_guard.linky_urls`

- **Clé :** `dorevia_session_guard.linky_urls`
- **Valeur par défaut :** `["https://ui.lab.sarl-la-platine.doreviateam.com"]`
- **Type :** JSON array
- **Rôle :** Whitelist stricte des URLs Linky autorisées (exact match uniquement).

---

## 5. Cookie `dorevia_linky`

### 5.1 Caractéristiques

| Attribut | Valeur |
|----------|--------|
| **Nom** | `dorevia_linky` |
| **Valeur** | `1` |
| **Path** | `/` |
| **Max-Age** | 2592000 (30 jours) |
| **Secure** | Oui si requête HTTPS (scheme ou X-Forwarded-Proto), sinon omis pour dev HTTP |
| **HttpOnly** | Oui |
| **SameSite** | Lax |
| **Domain** | Paramètre `cookie_domain` (optionnel) |

### 5.2 Pose du cookie

- **Où :** dans `IrHttp._dispatch()` après `super()._dispatch(endpoint)`.
- **Conditions :**
  - Réponse de type `Response` et `response.mimetype == 'text/html'` (pas de pose sur réponses JSON-RPC).
  - Session authentifiée (`request.session.uid` défini).
  - Utilisateur membre de `group_linky_users`.

### 5.3 Suppression du cookie

- **Où :** dans le handler `logout` uniquement (via `IrHttp._clear_linky_cookie()`).  
  Le handler `/web/login` ne supprime pas le cookie (lors d’une redirection vers Linky, le cookie est conservé pour les prochaines visites).
- **Méthode :** en-tête `Set-Cookie` avec `Max-Age=0` et le même `Path`/`Domain` que pour la pose.

---

## 6. Mapping Host Odoo → URL Linky

Mapping codé en dur dans `controllers/main.py` :

| Host Odoo | URL Linky |
|-----------|-----------|
| `odoo.stinger.sarl-la-platine.doreviateam.com` | via `logout_linky_url` (ui.lab, pas de ui.stinger) |
| `odoo.lab.sarl-la-platine.doreviateam.com` | `https://ui.lab.sarl-la-platine.doreviateam.com` |

**Extraction du host :** `request.httprequest.host.split(':')[0].strip()` (port ignoré).

**Validation :** l’URL cible doit être présente dans la whitelist (`target in allowed_urls`) — comparaison stricte, sans `startswith` ni `in url`.

---

## 7. Comportement des routes

### 7.1 `/web/session/logout`

**Classe :** `Session` (hérite de `odoo.addons.web.controllers.session.Session`)

**Ordre d’exécution :**

1. Capturer `uid`, `user`, `is_linky`, `has_cookie` **avant** `logout()`.
2. Appeler `request.session.logout(keep_db=True)`.
3. Récupérer l’URL Linky via `_get_linky_redirect_url()`.
4. Si `(is_linky OR has_cookie)` ET `target_url` valide :
   - Redirect 302 vers Linky.
   - Supprimer le cookie.
5. Sinon :
   - Redirect 303 vers `/web/login`.
   - Supprimer le cookie.

### 7.2 `/web/login`

**Classe :** `Home` (hérite de `odoo.addons.web.controllers.home.Home`)

**Route :** `@http.route('/web/login', type='http', auth='none')`

**Comportement :** Délégation complète à `super()` — toujours affichage du formulaire Odoo, sans redirection vers Linky (évite les boucles de redirection).

---

## 8. Logique de whitelist

**Fonction :** `_get_allowed_urls()` dans `controllers/main.py`

- Lit `ir.config_parameter` `dorevia_session_guard.linky_urls`.
- Parse JSON (list). Si vide ou erreur → retourne `DEFAULT_LINKY_URLS`.
- **Règle :** `target in allowed_urls` — exact match uniquement.

**Règle de sécurité :** pas de `startswith`, `in url`, ni construction d’URL à partir de paramètres utilisateur, pour éviter les open-redirects.

---

## 9. Tests automatisés

**Fichier :** `tests/test_session_guard.py`  
**Tag :** `/dorevia_session_guard`  
**Classe :** `TestSessionGuard` (HttpCase, post_install)

| Test | Description |
|------|-------------|
| `test_logout_redirects_to_login` | Logout → 303 vers `/web/login` |
| `test_logout_linky_redirects_to_login` | User Linky logout → 303 vers `/web/login` |
| `test_login_shows_form` | GET /web/login → formulaire Odoo (200) |

**Commande d’exécution :**

```bash
odoo -i dorevia_session_guard --test-enable --test-tags=/dorevia_session_guard --stop-after-init
```

---

## 10. Dépendance à `web_session_auto_close`

- `web_session_auto_close` gère la déconnexion automatique après inactivité.
- Après expiration : appel à `/web/session/destroy`, puis rechargement vers `/web/login`.
- `dorevia_session_guard` ne redirige plus ; le formulaire Odoo s'affiche toujours.

**Ordre d’installation :** `web_session_auto_close` doit être installé avant `dorevia_session_guard`.

---

## 11. Récapitulatif des matrices de comportement

### Logout

| Contexte | Résultat |
|----------|----------|
| User Linky ou cookie présent + host `odoo.*` mappé dans whitelist | 302 → URL Linky (`ui.*`) |
| Sinon | 303 → `/web/login` |

### GET /web/login

| Contexte | Résultat |
|----------|----------|
| Tous | Formulaire Odoo (pas de redirect Linky) |

---

## 12. Points d’extension et évolutions

- **Réactivation redirect Linky :** les paramètres `linky_urls` et `cookie_domain` restent en base ; la logique de redirection peut être réactivée.
- **Multi-domaine cookie :** prévu en v1.1 (ex. `cmh-projects.fr` + `doreviateam.com`).
