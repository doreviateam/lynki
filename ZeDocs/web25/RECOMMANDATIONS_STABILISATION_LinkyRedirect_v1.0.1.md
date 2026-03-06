# RECOMMANDATIONS DÉTAILLÉES — Stabilisation Linky Redirect + web_session_auto_close

**Date :** 2026-02-21  
**Contexte :** Stabilisation post-implémentation sur environnement stinger (Odoo CE 18)

---

## 1. OBJECTIF

Assurer une stabilité complète et prévisible du mécanisme :

- Expiration session Odoo (OCA web_session_auto_close)
- Redirection conditionnelle vers Linky
- Sécurité cookie (`dorevia_linky`)
- Absence d'effet de bord sur RPC / JSON / autres routes

Ce document formalise les vérifications finales à effectuer avant clôture définitive du chantier.

---

## 2. CHECKLIST DE STABILISATION FONCTIONNELLE (S5)

### 2.1 Tests logout immédiat

#### T1 — Utilisateur NON-Linky

- Logout
- Attendu : redirection vers `/web/login`
- Aucun redirect Linky

#### T2 — Utilisateur Linky

- Aller sur `/web` (pose cookie)
- Logout
- Attendu : redirection vers UI Linky

---

### 2.2 Tests expiration session (critique)

**Temporairement :** `web_session_auto_close.timeout = 60`

#### T3 — Non-Linky

- Attendre > 60s
- Refresh
- Attendu : écran login Odoo

#### T4 — Linky

- Attendre > 60s
- Refresh
- Attendu :
  1. Passage `/web/login`
  2. Redirection automatique Linky

**Ensuite remettre timeout à 900s.**

---

## 3. TESTS DE ROBUSTESSE

### 3.1 Restart container Odoo

- Redémarrer service
- Tester T1 + T2
- Tester expiration rapide

Objectif : vérifier absence de comportement non déterministe après restart.

---

### 3.2 Multi-onglet navigateur

Utilisateur Linky :

- Onglet A : `/web`
- Onglet B : autre menu
- Attendre expiration
- Refresh un seul onglet

Attendu : comportement cohérent, pas de boucle ni état intermédiaire.

---

### 3.3 Utilisateur non-admin

Créer utilisateur Linky simple :

- Tester T2 + T4
- Vérifier que le comportement ne dépend pas des droits superuser

---

## 4. AUDIT SÉCURITÉ FINAL

### 4.1 Cookie `dorevia_linky`

Vérifier dans DevTools :

- Secure = true (en HTTPS)
- HttpOnly = true
- SameSite = Lax
- Path = /
- Domain conforme (ou absent si vide en config)

Aucune donnée nominative stockée dans le cookie.

---

### 4.2 Anti open-redirect

Modifier temporairement host_map vers URL non whitelist :

- Logout Linky
- Attendu : refus redirect, retour `/web/login`

Validation stricte `target_url in allowed_urls`.

---

## 5. RECOMMANDATIONS STRUCTURELLES

### 5.1 Normalisation host

Toujours utiliser :

```python
host = request.httprequest.host.split(':')[0]
```

---

### 5.2 Convention URL

- `allowed_urls` sans slash final
- `host_map` sans slash final
- Exact match uniquement

---

### 5.3 HTTPS obligatoire

Le flag `Secure` du cookie nécessite HTTPS. Tests finaux doivent être réalisés sur environnement HTTPS (stinger/lab).

---

### 5.4 Tests automatisés (S5 bis)

```bash
cd units/odoo
docker compose run --rm -v "$(pwd)/conf/odoo.test.conf:/etc/odoo/odoo.conf:ro" \
  odoo odoo -c /etc/odoo/odoo.conf -d odoo_test -i dorevia_session_guard \
  --test-enable --test-tags=/dorevia_session_guard --stop-after-init
```

6 tests HttpCase (T1–T5 + whitelist). Prérequis : `web_session_auto_close` dans addons_path.

---

## 6. RUNBOOK MINIMAL (S6)

### Installation / Upgrade

```bash
docker compose -p dorevia_odoo_stinger_sarl-la-platine run --rm --no-deps odoo \
  sh -c "/mnt/custom-addons/bin/oca_flatten.sh && odoo -c /etc/odoo/odoo.conf \
  -d odoo_stinger_sarl-la-platine -u dorevia_session_guard --stop-after-init"
docker restart odoo_stinger_sarl-la-platine
```

### Paramètres requis

- `web_session_auto_close.timeout = 900`
- `dorevia_session_guard.cookie_domain = .doreviateam.com` (prod)
- `allowed_urls` strictement définies

### Rollback simple

- Désinstaller module via UI (Applications)
- OU retirer module de addons_path + restart

### Choix volontaire — Admin par défaut

Le fichier `data/res_users_linky.xml` utilise **`noupdate=0`** : à chaque upgrade du module, l'admin Odoo (`base.user_admin`) est ré-ajouté au groupe Linky Users. C'est un **choix volontaire** cohérent avec le modèle plateforme (admin toujours considéré Linky par défaut). Sinon un retrait manuel du groupe ne serait pas préservé après upgrade — ce comportement est assumé.

---

## 6 bis. POINT CRITIQUE EN PROD — HTTPS + Reverse Proxy

Le flag `Secure` du cookie nécessite HTTPS. **Si Odoo est derrière un reverse proxy** (Caddy, nginx, etc.) :

1. **X-Forwarded-Proto = https** : le proxy doit transmettre cet en-tête pour que Odoo sache que la requête client est en HTTPS.
2. **proxy_mode = True** dans la config Odoo : Odoo fait confiance aux en-têtes du proxy (Host, X-Forwarded-*).

Sans cela, le cookie `Secure` peut avoir des comportements inattendus (refus de pose, cookie ignoré). C'est le **seul point externe** à notre code — vérifier la config du proxy et d'Odoo.

```ini
# odoo.conf
proxy_mode = True
```

---

## 7. CRITÈRE DE CLÔTURE DU CHANTIER

Le chantier est considéré stabilisé lorsque :

- T1 à T5 validés
- Expiration stable
- Aucun open redirect possible
- Comportement identique après restart
- Runbook rédigé

---

## 8. CONCLUSION

La brique Linky Redirect n'est pas une simple redirection. C'est une séparation propre entre :

- ERP transactionnel (Odoo)
- Cockpit décisionnel (Linky)

La stabilité de cette couche est un prérequis fondamental avant tout développement stratégique futur.

---

**Fin du document**
