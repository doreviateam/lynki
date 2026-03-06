# Plan d'implémentation — Linky Redirect + web_session_auto_close

**Date :** 2026-02-21  
**Spec de référence :** `SPEC_Dorevia_LinkyRedirect_web_session_auto_close_OdooCE18_v1.0.1.md`  
**Objectif :** Implémenter l'auto-déconnexion OCA et le module `dorevia_session_guard`  
**Rapport d'audit :** `RAPPORT_AUDIT_OdooCE18_LinkyRedirect_v1.0.1.md` (signatures validées CE 18)  
**Stabilisation :** `RECOMMANDATIONS_STABILISATION_LinkyRedirect_v1.0.1.md` (checklist S5, runbook)

---

**Amendements CE 18 (post-audit) :** Contrôleurs dans `session.py` et `home.py` (pas `main.py`). Signature `_dispatch(cls, endpoint)` validée — paramètre `endpoint` obligatoire.

---

## Vue d'ensemble des sprints

| Sprint | Objectif | Stories |
|--------|----------|---------|
| **Sprint 0** | Prérequis & audit | S0 |
| **Sprint 1** | Squelette module & OCA | S1, S2 |
| **Sprint 2** | Cookie & redirections | S3, S4 |
| **Sprint 3** | Tests & déploiement | S5, S5 bis, S6 |

---

## Sprint 0 — Prérequis

### STORY S0 — Audit Odoo CE 18 et prérequis

**Priorité :** P0 | **Effort :** S | **Risque :** faible

#### 1) Routes cibles et points d'override

**A. `/web/session/logout`**
- Contrôleur : addon `web`
- Fichier (CE 18) : `odoo/addons/web/controllers/session.py` — classe `Session`, méthode `logout()`
- Commande pour retrouver sur ton instance :
  ```bash
  rg -n "route\('/web/session/logout'" -S /usr/lib/python3/dist-packages/odoo/addons/web/controllers
  # ou si Odoo depuis /opt/odoo/odoo :
  rg -n "route\('/web/session/logout'" -S /opt/odoo/odoo/addons/web/controllers
  ```

**B. `/web/login`**
- Contrôleur : addon `web`
- Fichier (CE 18) : `odoo/addons/web/controllers/home.py` — classe `Home`, méthode `web_login()`, route `@http.route('/web/login', type='http', auth='none', ...)`
- GET vs POST : le code teste `request.httprequest.method == 'GET'` (et POST pour soumission)
- Commande :
  ```bash
  rg -n "route\('/web/login'" -S /usr/lib/python3/dist-packages/odoo/addons/web/controllers
  ```
- **Note critique** : si tu overrides un controller, tu dois **re-décorer la route** (`@http.route(...)`) sinon comportements bizarres (surtout si d'autres modules comme website touchent à la route).

#### 2) Hook headers/cookies sur HTML : `ir.http._dispatch()`
- Cible : modèle `ir.http` — fichier `odoo/addons/base/models/ir_http.py`
- Méthode : `IrHttp._dispatch(cls, endpoint)` (classmethod) — **signature CE 18 : le paramètre `endpoint` est obligatoire**
- Filtrer : `isinstance(response, Response) and response.mimetype == 'text/html'`
- Commandes :
  ```bash
  rg -n "class IrHttp" -S /usr/lib/python3/dist-packages/odoo
  rg -n "def _dispatch\(" -S /usr/lib/python3/dist-packages/odoo
  ```

#### 3) Vérif OCA `web_session_auto_close` (compat CE 18)
- Module OCA/web 18.0, version 18.0.1.0.1
- Commandes :
  ```bash
  test -d sources/oca/web/web_session_auto_close && echo OK || echo MISSING
  rg -n "web_session_auto_close" -S sources/oca/web
  ```

#### 4) Décisions d'audit (à figer)
- Override cookie : `models/ir_http.py` → `_dispatch(cls, endpoint)` post-process — **passer `endpoint` à `super()._dispatch(endpoint)`**
- Override logout/login : `controllers/main.py` → héritage de `Session` (`odoo.addons.web.controllers.session`) et `Home` (`odoo.addons.web.controllers.home`)
- Règle GET/POST : intercepter GET uniquement sur `/web/login` (laisser POST à `super()`)
- Redirect safety : whitelist strict equality (`target_url in allowed_urls`) — jamais `startswith`
- **Convention URL :** `allowed_urls` et host_map doivent être stockés **sans slash final** — sinon exact-match punira (`https://ui.stinger.../` ≠ `https://ui.stinger...`).

#### 5) Definition of Done S0
- [x] Fichier `ZeDocs/web25/RAPPORT_AUDIT_OdooCE18_LinkyRedirect_v1.0.1.md` complété avec :
  - Chemins exacts trouvés par `rg`
  - Signatures des méthodes (`logout`, `web_login`, `_dispatch`)
  - Notes d'override (re-route obligatoire, GET vs POST, filtre Response HTML)

**Critère d'acceptation :** Rapport d'audit complet ; prêt pour implémentation.

---

## Sprint 1 — Squelette module & OCA

### STORY S1 — Création du squelette `dorevia_session_guard`

**Priorité :** P0 | **Effort :** S | **Risque :** faible

**Tâches :**

- [x] Créer `units/odoo/custom-addons/dorevia_session_guard/`
- [x] `__manifest__.py` : nom, version 1.0.0, depends `['web', 'web_session_auto_close']`, licence AGPL-3.0
- [x] `__init__.py` (package racine)
- [x] `models/__init__.py`, `controllers/__init__.py` (ajouter les imports des sous-modules quand S3/S4 créent ir_http et main)
- [x] Créer le groupe `res.groups` : XML ID `group_linky_users`, nom "Linky Users"
- [x] Fichier `data/res_users_linky.xml` : ajouter `base.user_admin` au groupe par défaut (noupdate=0)
- [x] Fichier `security/ir.model.access.csv` (vide ou minimal si pas de modèle propre)
- [x] Fichier `data/` pour le groupe (post_install ou data)
- [x] Dossier `tests/` avec `__init__.py` (squelette pour S5 bis)
- [x] Fichier `data/ir_config_parameter.xml` : `cookie_domain` **vide** par défaut (dev OK), `linky_urls` (JSON). En prod : configurer `cookie_domain=.doreviateam.com`

**Critère d'acceptation :** Le module s'installe sans erreur ; le groupe apparaît dans Paramètres > Utilisateurs ; les config_parameter sont créés.

---

### STORY S2 — Installation et configuration OCA `web_session_auto_close`

**Priorité :** P0 | **Effort :** XS | **Risque :** faible

**Tâches :**

- [x] Vérifier que `web_session_auto_close` est symlinké via `oca_flatten.sh` (présent dans `sources/oca/web/`)
- [x] Installer le module sur la base Odoo stinger sarl-la-platine (UI ou CLI)
- [x] Configurer `web_session_auto_close.timeout` (ex. 900 s) via Paramètres > Général ou `ir.config_parameter`
- [ ] Tester manuellement : inactivité 15 min → déconnexion et redirection vers `/web/login` (→ S5 T3/T4)

**Critère d'acceptation :** L'auto-déconnexion fonctionne ; l'utilisateur non-Linky voit l'écran login Odoo après expiration.

---

## Sprint 2 — Cookie & redirections

### STORY S3 — Pose et suppression du cookie `dorevia_linky`

**Priorité :** P0 | **Effort :** M | **Risque :** moyen

**Tâches :**

- [x] Créer `models/ir_http.py` avec `_inherit = 'ir.http'`
- [x] Surcharger `IrHttp._dispatch(cls, endpoint)` (méthode de classe) : `response = super()._dispatch(endpoint)` puis post-traitement
- [x] **Contrôle critique** : `_dispatch()` peut retourner un `werkzeug.wrappers.Response` (HTML) **ou** un `dict` (JSON-RPC). Ne poser le cookie **que si** :
  ```python
  from werkzeug.wrappers import Response
  if isinstance(response, Response) and response.mimetype == 'text/html':
  ```
  Sinon → bug subtil (cookie posé sur réponses RPC).
- [x] Condition supplémentaire : `request.session.uid` défini ET user dans le groupe `group_linky_users`
- [x] Poser le cookie : `dorevia_linky=1`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=2592000` (30 jours). Pas d'info user ni tenant — valeur `1` suffit.
- [x] **Domain** : si `cookie_domain` param vide → **ne pas** définir `Domain` (navigateur scope auto = OK localhost/lab/stinger). Si renseigné (ex. `.doreviateam.com`) → appliquer. Sinon cookie non posé silencieusement en dev.
- [x] Implémenter une fonction utilitaire `_set_linky_cookie(response)` et `_clear_linky_cookie(response)`

**Critère d'acceptation :**

| Contexte | Cookie posé ? |
|----------|---------------|
| User Linky, page HTML `/web` | Oui |
| User Linky, RPC JSON | Non |
| User non-Linky | Non |
| User anonyme | Non |

---

### STORY S4 — Redirection logout et login

**Priorité :** P0 | **Effort :** M | **Risque :** moyen

**Tâches :**

- [x] Créer `controllers/main.py` : hériter **Session** de `odoo.addons.web.controllers.session`, **Home** de `odoo.addons.web.controllers.home`
- [x] Surcharger `logout` : **ordre impératif** — lire le user **avant** `logout()` sinon on perd le contexte :
  1. `uid = request.session.uid`
  2. `user = request.env.user if uid else None`
  3. `is_linky = user and user.has_group('dorevia_session_guard.group_linky_users')`
  4. `has_cookie = request.httprequest.cookies.get('dorevia_linky') == '1'`
  5. `request.session.logout()` — **seulement après** les captures
  6. Supprimer cookie (header `Set-Cookie` avec `dorevia_linky=; Max-Age=0; Path=/` + `Domain=` si défini à la pose)
  7. Si `is_linky or has_cookie` → redirect Linky ; sinon → 302 `/web/login`
- [x] Surcharger le handler `/web/login` : route `auth='none'`. **N'intercepter que si** GET (pas POST) et pas `force_login=1` et cookie `dorevia_linky=1` → 302 Linky. Sinon → `super()` direct (POST = soumission formulaire, ne pas casser).
- [x] Implémenter la whitelist : **exact match uniquement** — `if url in allowed_urls`. **Jamais** `startswith` ou `in url` → sinon attaque type `...doreviateam.com.evil.com`
- [x] Mapping Host Odoo → URL Linky (spec §6.6) — `host = request.httprequest.host.split(':')[0]` pour ignorer le port (ex. :8069)
- [x] Log INFO minimal sur redirect (sans données nominatives)
- [x] Valider : `target_url in allowed_urls` (exact match) avant toute redirect — pas de `startswith`
- [x] **Convention URL :** `allowed_urls` et host_map stockés **sans slash final**

**Critère d'acceptation :**

| Scénario | Comportement attendu |
|----------|----------------------|
| User Linky, logout | Redirect vers ui.stinger.* ou ui.lab.* |
| User non-Linky, logout | Redirect `/web/login` |
| User Linky, expiration, /web/login | Redirect Linky |
| User Linky, /web/login?force_login=1 | Formulaire login Odoo |
| User non-Linky, /web/login | Formulaire login Odoo |

---

## Sprint 3 — Tests & déploiement

### STORY S5 — Tests fonctionnels (DoD §9)

**Priorité :** P0 | **Effort :** M | **Risque :** faible  
**Référence détaillée :** `RECOMMANDATIONS_STABILISATION_LinkyRedirect_v1.0.1.md` (checklist complète, tests robustesse)

**Tâches :**

- [ ] **T1** : User non-Linky → logout → vérifier redirect `/web/login`
- [ ] **T2** : User Linky (aller sur `/web` pour poser cookie) → logout → vérifier redirect Linky
- [ ] **T3** : User non-Linky → timeout 60 s → attendre >60s → refresh → login Odoo (puis remettre timeout 900)
- [ ] **T4** : User Linky → timeout 60 s → attendre >60s → refresh → redirect Linky
- [ ] **T5** : User Linky → accéder `/web/login?force_login=1` → vérifier formulaire Odoo affiché
- [ ] **Robustesse** : Restart container → retester T1/T2 ; multi-onglet ; utilisateur non-admin
- [ ] **Sécurité** : Checklist cookie (Secure, HttpOnly, SameSite=Lax, Path=/) ; anti open-redirect (whitelist exact match)

**Critère d'acceptation :** Tous les tests T1–T5 passent ; comportement stable après restart ; checklist sécurité validée.

---

### STORY S5 bis — Tests automatisés dans le module (optionnel)

**Priorité :** P2 | **Effort :** M | **Risque :** faible

**Tâches :**

- [x] Créer `tests/test_session_guard.py` avec `HttpCase`
- [x] Test whitelist : URL type `.evil.com` → rejetée (assertNotIn, piège startswith)
- [x] Test logout : user Linky → redirect 302 Linky ; user non-Linky → redirect 303 `/web/login`
- [x] Test login GET : cookie présent, pas force_login → redirect Linky ; force_login=1 → pas de redirect
- [x] Test login POST : super() appelé (pas d'interception)
- [x] Importer `test_session_guard` dans `tests/__init__.py`

**Critère d'acceptation :** `odoo -i dorevia_session_guard --test-enable --test-tags=/dorevia_session_guard` exécute les tests sans erreur. ✅

---

### STORY S6 — Déploiement et documentation

**Priorité :** P1 | **Effort :** S | **Risque :** faible  
**Runbook :** `RECOMMANDATIONS_STABILISATION_LinkyRedirect_v1.0.1.md` §6

**Tâches :**

- [x] Déployer sur Odoo stinger sarl-la-platine
- [x] Admin Odoo (`base.user_admin`) dans le groupe Linky Users par défaut (via `data/res_users_linky.xml`)
- [ ] Assigner le groupe aux autres utilisateurs concernés si besoin (admin déjà inclus)
- [x] Rédiger/valider le runbook : installation, upgrade, paramètres, rollback (dans RECOMMANDATIONS §6)
- [x] Mettre à jour le rapport d'implémentation avec statut et éventuels écarts
- [ ] Déployer sur Odoo lab sarl-la-platine si pertinent

**Critère d'acceptation :** Module en production sur stinger ; runbook disponible ; utilisateurs Linky configurés.

---

## Backlog — Hors scope v1.0 (v1.1)

| ID | Description | Priorité |
|----|-------------|----------|
| B1 | Multi-domaine cookie (cmh-projects.fr) | P2 |
| B2 | URL Linky configurable par tenant (param) | P2 |
| B3 | Extension événements activité (scroll, click, touch) | P2 |
| B4 | Message Linky "Session Odoo expirée" (UX) | P3 |

---

## Récapitulatif des efforts

| Story | Effort | Sprint |
|-------|--------|--------|
| S0 | S | 0 |
| S1 | S | 1 |
| S2 | XS | 1 |
| S3 | M | 2 |
| S4 | M | 2 |
| S5 | M | 3 |
| S5 bis | M | 3 (optionnel) |
| S6 | S | 3 |

**Légende effort :** XS = 1–2 h, S = 0.5 j, M = 1 j

---

## Dépendances

```
S0 (audit) ──┬──► S1 (squelette) ──┬──► S3 (cookie) ──► S4 (redirect) ──► S5 (tests) ──► S6 (deploy)
             │                    │         │                    │
             └──► S2 (OCA) ───────┘         └──► S5 bis (tests auto, P2 optionnel)
             
  - web_session_auto_close doit être dans addons_path avant d'installer dorevia_session_guard.
  - S2 doit être installé avant S5 (tests d'expiration). S1 et S2 peuvent être parallèles.
```
