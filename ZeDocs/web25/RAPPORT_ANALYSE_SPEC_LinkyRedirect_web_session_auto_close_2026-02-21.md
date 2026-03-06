# Rapport d'analyse — SPEC Linky Redirect + web_session_auto_close

**Document analysé :** `ZeDocs/web25/SPEC_Dorevia_LinkyRedirect_web_session_auto_close_OdooCE18_v1.0.1.md`  
**Date :** 2026-02-21  
**Version spec :** 1.0.1  
**Dernière mise à jour :** 2026-02-21  

---

## 1. Synthèse

La spécification v1.0.1 décrit l'intégration de deux briques :

1. **OCA `web_session_auto_close`** : déconnexion automatique après inactivité configurable
2. **Module Dorevia `dorevia_session_guard`** : redirection des utilisateurs Linky vers le cockpit (logout ou expiration)

Les amendements issus de l'analyse initiale ont été intégrés. La spec est **prête pour l'implémentation**. Ce rapport conserve l'analyse critique, les incidences techniques et les points de vigilance.

---

## 2. Incidences sur l'architecture

### 2.1 Contexte actuel

| Composant | État actuel | Incidence |
|-----------|-------------|-----------|
| **Odoo sarl-la-platine** | Stinger + Lab, CE, OCA via `oca_flatten.sh` | Périmètre cible unique avec Linky |
| **Linky** | `ui.stinger.*`, `ui.lab.*` (sarl-la-platine) | Cibles de redirection |
| **OCA web_session_auto_close** | Présent dans `sources/oca/web/` | À installer et configurer par base |
| **Modules Dorevia** | `units/odoo/custom-addons/` | Lieu de création de `dorevia_session_guard` |
| **Caddy** | Routage par host | Aucune modification |

### 2.2 Points techniques

#### Routes Odoo à surcharger

| Route | Action du module |
|-------|------------------|
| `/web/session/logout` | Logout → supprimer cookie → redirect Linky si cookie présent avant suppression, sinon `/web/login` |
| `/web/login` | Intercepter **uniquement** si GET (pas POST) et pas `force_login=1` et cookie Linky → 302 ; sinon `super()` |
| Réponses HTML `/web` | Pose/renouvellement cookie si user authentifié + membre groupe Linky |

**Hooks à implémenter :**

- Contrôleur `web` : surcharge de `logout` et du handler `web/login`
- `ir.http` : override pour poser le cookie sur réponses HTML uniquement (ex. `_post_dispatch` ou équivalent CE 18)

#### Domaine du cookie

**⚠️ Règle critique :** Si `cookie_domain` est vide → **ne pas** définir l'attribut `Domain` (le navigateur scopera sur le host courant). Sinon en lab (cmh-projects.fr), stinger custom, localhost → cookie non posé **silencieusement**. En prod avec `cookie_domain=.doreviateam.com` → cookie partagé sur `*.doreviateam.com`. Valeur par défaut du paramètre : **vide** pour faciliter le dev.

#### Intégration addons

- OCA : symlinks dans `/mnt/extra-addons`
- Dorevia : `/mnt/custom-addons` (priorité dans `addons_path`)
- Pas de conflit prévu

---

## 3. Amendements intégrés (v1.0.1)

Les propositions de l'analyse initiale ont été retenues dans la spec :

| Amendement | Statut |
|------------|--------|
| Dépendance `web_session_auto_close` obligatoire | ✅ §6.1 |
| Domaine cookie : vide par défaut, `.doreviateam.com` si configuré (évite galère dev) | ✅ §6.4 |
| Suppression cookie au logout | ✅ §6.4, §6.8.2 |
| Pose cookie uniquement sur réponses HTML | ✅ §6.5 |
| Whitelist stricte (stinger + lab) : `url in allowed_urls` exact match, jamais `startswith` | ✅ §6.7 |
| URL Linky selon Host Odoo | ✅ §6.6 |
| Bypass `?force_login=1` | ✅ §6.8.1 |
| Périmètre : bases Linky uniquement | ✅ §8.1 |

---

## 4. Analyse critique et points de vigilance

### 4.1 Clarification logout : "cookie présent AVANT suppression"

**Spec §6.8.2 :** « si cookie présent AVANT suppression (ou user Linky) → redirect Linky »

Une fois `request.session.logout()` appelé, la session n'a plus d'utilisateur. **Ordre correct :**

```python
uid = request.session.uid
user = request.env.user if uid else None
is_linky = user and user.has_group('dorevia_session_guard.group_linky_users')
has_cookie = request.httprequest.cookies.get('dorevia_linky') == '1'

request.session.logout()  # seulement après les captures
# puis : supprimer cookie, redirect selon is_linky or has_cookie
```

Appeler `logout()` avant → on perd le contexte user → test `has_group()` impossible.

### 4.2 Pose du cookie — identification des réponses HTML (hook `ir.http`)

La spec exige de poser le cookie uniquement sur réponses HTML. En Odoo CE 18, le hook approprié est `ir.http._dispatch()` :

```python
class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'

    @classmethod
    def _dispatch(cls):
        response = super()._dispatch()
        # post-processing ici
        return response
```

**⚠️ Critère obligatoire :** `_dispatch()` peut retourner un `werkzeug.wrappers.Response` (HTML, redirect) **ou** un `dict` (JSON-RPC). Il faut filtrer :

```python
from werkzeug.wrappers import Response
if isinstance(response, Response) and response.mimetype == 'text/html':
    # poser le cookie
```

Sans ce contrôle → cookie posé sur réponses RPC → bug subtil.

### 4.3 Paramètre `dorevia_session_guard.linky_urls`

La spec mentionne `ir.config_parameter` pour `linky_urls` (JSON list) tout en autorisant le hardcode en v1.0. **Recommandation :** implémenter dès la v1.0 via `ir.config_parameter` avec valeurs par défaut en dur. Évite un rebuild/redeploy si l’URL change (spec §6.2).

### 4.4 Test T5 : bypass

Le test « T5 : bypass `?force_login=1` fonctionne » doit vérifier :

- Accès à `/web/login?force_login=1` avec cookie Linky présent → affichage du formulaire Odoo (pas de redirect)
- Possibilité de se connecter à Odoo après ce bypass

### 4.5 Interception /web/login — GET uniquement, jamais POST

La route Odoo reçoit GET (formulaire) et POST (soumission). Intercepter sur POST = casser le login. N'intercepter que si GET et pas force_login=1 et cookie Linky. Sinon super().

### 4.6 Ordre d'appel des contrôleurs Odoo CE 18 d’appel des contrôleurs Odoo CE 18

La structure des contrôleurs (`web.controllers.main`, `Session`, etc.) peut différer entre CE 17 et 18. **Action préalable :** auditer le code source Odoo CE 18 (`addons/web/controllers/`) pour confirmer les classes et méthodes à surcharger.

---

## 5. Décisions actées (spec v1.0.1)

| Question | Décision |
|----------|----------|
| Périmètre d’installation | Bases Linky uniquement (sarl-la-platine stinger/lab) |
| Durée cookie | 30 jours + suppression au logout |
| Bypass login Odoo | `?force_login=1` en v1.0 |
| Extension événements activité | Reportée en v1.1 |
| Journalisation | Log INFO minimal des redirects (sans données nominatives) |

---

## 6. Plan de déploiement

| Étape | Action | Statut |
|-------|--------|--------|
| 1 | Auditer contrôleurs Odoo CE 18 (logout, login) | À faire |
| 2 | Créer le module `dorevia_session_guard` | À faire |
| 3 | Installer `web_session_auto_close` sur Odoo stinger sarl-la-platine | À faire |
| 4 | Configurer `web_session_auto_close.timeout` (ex. 900 s) | À faire |
| 5 | Installer `dorevia_session_guard` | À faire |
| 6 | Assigner le groupe « Linky Users » aux utilisateurs concernés | À faire |
| 7 | Exécuter les tests DoD (T1–T5, §9) | À faire |
| 8 | Déployer sur Odoo lab sarl-la-platine si pertinent | À faire |

---

## 7. Checklist sécurité cookie

- `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`
- **Pas** d'info user ni d'ID tenant dans le cookie — `dorevia_linky=1` suffit.

---

## 8. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Whitelist avec `startswith` au lieu de `in` | Moyenne | Élevé | Exact match uniquement : `url in allowed_urls` — sinon `.evil.com` |
| Structure contrôleurs CE 18 différente | Moyenne | Moyen | Audit préalable du code Odoo |
| Cookie posé sur requêtes JSON par erreur | Faible | Faible | Filtrer explicitement réponses HTML |
| Conflit avec futur module OCA | Faible | Moyen | Nommage explicite, dépendance stricte |
| Utilisateur bloque les cookies | Faible | Faible | Comportement = non-Linky (login Odoo) |
| Multi-onglets : un seul onglet recharge après auto-close | Faible | Faible | Doc utilisateur si besoin |

---

## 9. Conclusion

La spec v1.0.1 est **cohérente et prête pour l’implémentation**. Les points à traiter en priorité sont :

1. **Audit Odoo CE 18** : confirmer les classes/méthodes à surcharger pour logout et login
2. **Ordre des opérations au logout** : lire cookie + groupe avant `logout()`, puis supprimer cookie et rediriger
3. **Filtrage des réponses** : ne poser le cookie que sur réponses HTML

Le rapport reste une référence pour le développement et les revues de code.
