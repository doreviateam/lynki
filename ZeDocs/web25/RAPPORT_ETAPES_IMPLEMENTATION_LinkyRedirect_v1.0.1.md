# Rapport d'étapes d'implémentation — Linky Redirect + web_session_auto_close

**Instant T :** 2026-02-21  
**Dernière mise à jour :** 2026-02-21  
**Plan de référence :** `PLAN_IMPLEMENTATION_LinkyRedirect_web_session_auto_close_v1.0.1.md`  
**Spec :** `SPEC_Dorevia_LinkyRedirect_web_session_auto_close_OdooCE18_v1.0.1.md`  
**Objet :** État d'avancement de l'implémentation à l'instant T

---

## 1. Vue d'ensemble

| Story | Description | Statut | Commentaire |
|-------|-------------|--------|-------------|
| **S0** | Audit Odoo CE 18 et prérequis | ✅ Fait | Rapport d'audit complété |
| **S1** | Création du squelette `dorevia_session_guard` | ✅ Fait | Module créé et installable |
| **S2** | Installation et configuration OCA `web_session_auto_close` | ✅ Fait | Installé sur stinger sarl-la-platine |
| **S3** | Pose et suppression du cookie `dorevia_linky` | ✅ Fait | `models/ir_http.py` |
| **S4** | Redirection logout et login | ✅ Fait | `controllers/main.py` |
| **S5** | Tests fonctionnels (T1–T5, sécurité) | ⬜ À faire | Après S2 |
| **S5 bis** | Tests automatisés (optionnel) | ✅ Fait | 6 tests HttpCase, 0 failed |
| **S6** | Déploiement et documentation | 🔄 En cours | Stinger fait, admin par défaut, runbook dans RECOMMANDATIONS §6 |

---

## 2. Détail par story

### S0 — Audit (Fait)

| Tâche plan | Statut | Livrable |
|------------|--------|----------|
| Rapport d'audit complété | ✅ | `RAPPORT_AUDIT_OdooCE18_LinkyRedirect_v1.0.1.md` |
| Chemins routes (logout, login, _dispatch) | ✅ | session.py, home.py, ir_http |
| Signatures méthodes | ✅ | Documentées dans le rapport |
| Décisions d'override figées | ✅ | Re-route, GET vs POST, filtre HTML |

---

### S1 — Squelette module (Fait)

| Tâche plan | Statut | Fichier / détail |
|------------|--------|------------------|
| Créer `dorevia_session_guard/` | ✅ | `units/odoo/custom-addons/dorevia_session_guard/` |
| `__manifest__.py` | ✅ | depends: web, web_session_auto_close, licence AGPL-3 |
| `__init__.py` racine | ✅ | Import models, controllers |
| `models/__init__.py`, `controllers/__init__.py` | ✅ | Créés |
| Groupe `group_linky_users` | ✅ | `security/res_groups.xml` |
| Admin Odoo par défaut dans le groupe | ✅ | `data/res_users_linky.xml` (base.user_admin) |
| `security/ir.model.access.csv` | ✅ | Vide (pas de modèle propre) |
| Dossier `tests/` | ✅ | `tests/__init__.py`, `tests/test_session_guard.py` |
| `data/ir_config_parameter.xml` | ✅ | `cookie_domain` vide, `linky_urls` JSON |

**Structure livrée :**

```
dorevia_session_guard/
├── __manifest__.py
├── __init__.py
├── models/
│   ├── __init__.py
│   └── ir_http.py
├── controllers/
│   ├── __init__.py
│   └── main.py
├── security/
│   ├── ir.model.access.csv
│   └── res_groups.xml
├── data/
│   ├── ir_config_parameter.xml
│   └── res_users_linky.xml
└── tests/
    ├── __init__.py
    └── test_session_guard.py
```

---

### S2 — OCA web_session_auto_close (Fait)

| Tâche plan | Statut | Détail |
|------------|--------|--------|
| Vérifier symlink / présence du module | ✅ | `web_session_auto_close` dans `/mnt/extra-addons` (oca_flatten) |
| Installer sur base stinger sarl-la-platine | ✅ | `docker compose run --rm odoo -i web_session_auto_close --stop-after-init` |
| Configurer `web_session_auto_close.timeout` | ✅ | 900 s (15 min) |
| Installer `dorevia_session_guard` | ✅ | Idem |
| Test manuel inactivité → déconnexion | ⬜ | À faire (S5 T3/T4) |

---

### S3 — Cookie dorevia_linky (Fait)

| Tâche plan | Statut | Implémentation |
|------------|--------|----------------|
| `models/ir_http.py`, `_inherit = 'ir.http'` | ✅ | Présent |
| Surcharge `_dispatch()` avec post-traitement | ✅ | `response = super()._dispatch(endpoint)` |
| Filtre Response HTML uniquement | ✅ | `isinstance(response, Response) and response.mimetype == 'text/html'` |
| Condition user + groupe Linky | ✅ | `user.has_group('dorevia_session_guard.group_linky_users')` |
| Cookie : Secure, HttpOnly, SameSite=Lax, Path=/, Max-Age=2592000 | ✅ | `_set_linky_cookie()` |
| Domain : vide → pas de Domain ; configuré → appliqué | ✅ | `_get_cookie_domain()` |
| `_set_linky_cookie()`, `_clear_linky_cookie()` | ✅ | Implémentés |

---

### S4 — Redirections logout et login (Fait)

| Tâche plan | Statut | Implémentation |
|------------|--------|----------------|
| Héritage Session et Home | ✅ | `web_session.Session`, `web_home.Home` |
| Ordre impératif au logout (uid, user, is_linky, has_cookie avant logout) | ✅ | Respecté |
| Suppression cookie au logout | ✅ | `IrHttp._clear_linky_cookie(response)` |
| Redirect Linky si is_linky ou has_cookie | ✅ | `_get_linky_redirect_url()` |
| Interception /web/login GET uniquement | ✅ | `request.httprequest.method == 'GET'` |
| Bypass force_login=1 | ✅ | Test dans web_login |
| Whitelist exact match | ✅ | `target_url in allowed_urls` |
| Mapping Host → URL Linky (spec §6.6) | ✅ | `HOST_TO_LINKY` |
| Log INFO redirect | ✅ | Sans données nominatives |

---

### S5 — Tests fonctionnels (À faire)

| Tâche plan | Statut |
|------------|--------|
| T1 : non-Linky → logout → /web/login | ⬜ |
| T2 : Linky → logout → Linky | ⬜ |
| T3 : non-Linky → inactivité → login Odoo | ⬜ |
| T4 : Linky → inactivité → Linky | ⬜ |
| T5 : force_login=1 → formulaire Odoo | ⬜ |
| Checklist sécurité cookie | ⬜ |
| Vérification anti open-redirect | ⬜ |

---

### S5 bis — Tests automatisés (Fait)

| Tâche plan | Statut |
|------------|--------|
| `tests/test_session_guard.py` | ✅ 6 tests HttpCase |
| Tests whitelist, logout, login | ✅ T1–T5 + whitelist |
| Exécution | `odoo -i dorevia_session_guard --test-enable --test-tags=/dorevia_session_guard` (units/odoo + conf odoo.test.conf) |

---

### S6 — Déploiement (En cours)

| Tâche plan | Statut | Détail |
|------------|--------|--------|
| Déployer sur stinger | ✅ | Installé sur stinger sarl-la-platine |
| Admin par défaut dans groupe Linky Users | ✅ | `data/res_users_linky.xml` — ajout automatique à l'install/upgrade |
| Assigner groupe Linky Users (autres users) | ⬜ | Via Paramètres > Utilisateurs si nécessaire |
| Runbook installation/config/rollback | ✅ | `RECOMMANDATIONS_STABILISATION_*` §6 |
| Mise à jour rapport implémentation | ✅ | En cours |
| Déploiement lab si pertinent | ⬜ | À décider |

---

## 3. Écarts et notes

| Point | Statut |
|-------|--------|
| Contrôleurs Odoo 18 | En CE 18, les contrôleurs sont dans `session.py` et `home.py` (pas `main.py`). Imports ajustés : `odoo.addons.web.controllers.session`, `odoo.addons.web.controllers.home`. |
| Dépendance S2 | `web_session_auto_close` doit être dans addons_path avant d'installer `dorevia_session_guard`. S2 doit être installé avant S5 (tests d'expiration). |
| **_dispatch(cls, endpoint)** | **Validé** : signature core Odoo CE 18 = `def _dispatch(cls, endpoint)`. Notre appel `super()._dispatch(endpoint)` est correct. Vérification : `odoo/addons/base/models/ir_http.py` (source GitHub 18.0). |
| **Host sans port** | `host = request.httprequest.host.split(':')[0]` (spec §6.6). |
| **URLs sans slash final** | `allowed_urls` et host_map stockés sans slash final (exact-match). |
| **Admin par défaut** | Utilisateur `base.user_admin` ajouté au groupe Linky Users via `data/res_users_linky.xml` (noupdate=0). |

---

## 4. Prochaines actions

1. **S5** : Exécuter les tests T1–T5 et la checklist sécurité (tests manuels).
2. **S6** : Assigner le groupe Linky Users à d'autres utilisateurs si nécessaire. Déployer sur lab si pertinent.

**Référence :** `RECOMMANDATIONS_STABILISATION_LinkyRedirect_v1.0.1.md` — checklist détaillée, tests robustesse, audit sécurité, runbook (§6).

---

**Statut global à l'instant T :** Stories S0, S1, S2, S3, S4, S5 bis complètes. S6 partiellement fait (déploiement stinger, admin par défaut, runbook dans RECOMMANDATIONS). Modules en production sur stinger sarl-la-platine. S5 (tests manuels T1–T5), S6 (lab si pertinent) en attente.
