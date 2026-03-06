# Rapport d'audit — Odoo CE 18 (Linky Redirect / dorevia_session_guard)

**Date :** 2026-02-21  
**Spec :** `SPEC_Dorevia_LinkyRedirect_web_session_auto_close_OdooCE18_v1.0.1.md`  
**Objectif :** Identifier les chemins exacts et signatures pour l'implémentation du module `dorevia_session_guard`

---

## 1. Méthode de recherche (zéro-blabla)

Sur ton instance Odoo, exécuter les commandes ci-dessous en adaptant le chemin racine (`/usr/lib/python3/dist-packages/odoo` ou `/opt/odoo/odoo` selon ton installation).

---

## 2. `/web/session/logout`

### Commande
```bash
rg -n "route\('/web/session/logout'" -S /usr/lib/python3/dist-packages/odoo/addons/web/controllers
# ou :
rg -n "route\('/web/session/logout'" -S /opt/odoo/odoo/addons/web/controllers
```

### Résultat (à compléter)
| Champ | Valeur |
|-------|--------|
| Fichier | odoo/addons/web/controllers/session.py |
| Classe | Session |
| Méthode | logout |

### Signature (à copier depuis le source)
```python
@http.route('/web/session/logout', type='http', auth='none', readonly=True)
def logout(self, redirect='/odoo'):
    request.session.logout(keep_db=True)
    return request.redirect(redirect, 303)
```

---

## 3. `/web/login`

### Commande
```bash
rg -n "route\('/web/login'" -S /usr/lib/python3/dist-packages/odoo/addons/web/controllers
# ou :
rg -n "route\('/web/login'" -S /opt/odoo/odoo/addons/web/controllers
```

### Résultat (à compléter)
| Champ | Valeur |
|-------|--------|
| Fichier | odoo/addons/web/controllers/home.py |
| Classe | Home |
| Méthode | web_login |

### Signature (à copier depuis le source)
```python
@http.route('/web/login', type='http', auth='none')
def web_login(self, *args, **kw):
    ...
```

### GET vs POST
Le code source teste-t-il `request.httprequest.method == 'GET'` ? Oui (notre module intercepte GET uniquement)

---

## 4. Hook `ir.http._dispatch()`

### Commandes
```bash
rg -n "class IrHttp" -S /usr/lib/python3/dist-packages/odoo
rg -n "def _dispatch\(" -S /usr/lib/python3/dist-packages/odoo
```

### Résultat (validé CE 18)
| Champ | Valeur |
|-------|--------|
| Fichier | `odoo/addons/base/models/ir_http.py` |
| Classe | IrHttp |

### Signature **exacte** du core Odoo CE 18 (source GitHub 18.0)
```python
@classmethod
def _dispatch(cls, endpoint):
    result = endpoint(**request.params)
    if isinstance(result, Response) and result.is_qweb:
        result.flatten()
    return result
```

### Override attendu (notre module)
```python
@classmethod
def _dispatch(cls, endpoint):
    response = super()._dispatch(endpoint)  # ← endpoint OBLIGATOIRE
    # post-processing...
    return response
```

**Validation critique :** La signature core prend bien `(cls, endpoint)`. Passer `endpoint` à `super()._dispatch(endpoint)` est **impératif**. Une signature `_dispatch(cls)` sans paramètre provoquerait une erreur ou un comportement inattendu.

---

## 5. OCA `web_session_auto_close`

### Commande
```bash
test -d sources/oca/web/web_session_auto_close && echo OK || echo MISSING
```

### Résultat
| Champ | Valeur |
|-------|--------|
| Présent | OK (confirmé dans le dépôt) |
| Version | 18.0.1.0.1 |

---

## 6. Décisions d'audit (figées)

| Décision | Implémentation |
|----------|----------------|
| Override cookie | `models/ir_http.py` → `_dispatch()` post-process |
| Override logout | `controllers/main.py` → héritage de `Session` |
| Override login | `controllers/main.py` → héritage de `Home` |
| Re-décorer la route | Obligatoire sur override controller |
| GET vs POST | Intercepter **GET uniquement** sur `/web/login` ; POST → `super()` |
| Filtre Response | `isinstance(response, Response) and response.mimetype == 'text/html'` |
| Whitelist | `target_url in allowed_urls` (exact match) — jamais `startswith` |
| Convention URL | `allowed_urls` et host_map **sans slash final** |
| Host normalisé | `host = request.httprequest.host.split(':')[0]` |

---

## 7. Notes d'override

### Session.logout
- Lire `uid`, `user`, `is_linky`, `has_cookie` **avant** `request.session.logout()`
- Conserver le décorateur `@http.route(...)` sur la méthode surchargée

### Home.web_login
- Tester `request.httprequest.method == 'GET'` avant interception
- Si POST ou `force_login=1` ou pas de cookie → `super()` direct

### IrHttp._dispatch
- **Signature :** `def _dispatch(cls, endpoint)` — le paramètre `endpoint` est obligatoire
- `response = super()._dispatch(endpoint)` puis post-traitement
- Condition : `isinstance(response, Response) and response.mimetype == 'text/html'`

---

**Statut :** Complété — 2026-02-21 (implémentation S1–S4)
