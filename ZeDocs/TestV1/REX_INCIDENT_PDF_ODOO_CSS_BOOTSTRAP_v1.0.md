# 🧾 REX — Incident Impression PDF Odoo (CSS / Bootstrap non appliqué)

## TL;DR

Si les PDF Odoo sortent sans CSS alors que l'HTML est correct, vérifier immédiatement :

* ✅ `proxy_mode = True` dans `odoo.conf`
* ✅ `web.base.url` en **HTTPS**
* ✅ `report.url` en **HTTPS**

> **9 fois sur 10**, le problème vient de là derrière un reverse proxy.

---

## 🎯 Quand utiliser ce REX ?

Dès qu'un PDF Odoo sort **sans CSS** alors que l'HTML est correct, en particulier sur **LAB** ou **STINGER** derrière un reverse proxy HTTPS.

---

## 📌 Objectif du document

Ce document sert de **référence interne Dorevia** pour comprendre, diagnostiquer et résoudre un problème récurrent possible sur Odoo :

> **PDF générés sans styles CSS (Bootstrap, layout cassé), alors que le HTML et/ou la production fonctionnent correctement.**

Il est destiné à être relu **si le problème se reproduit** sur un autre tenant, environnement ou projet.

---

## 🧠 Symptôme observé

* Les documents PDF (devis, factures, avoirs) sont générés
* Le contenu est présent mais :

  * mise en page cassée
  * colonnes empilées
  * polices par défaut
  * absence apparente de Bootstrap / CSS
* Aucun message d'erreur explicite côté Odoo
* Le même report fonctionne sur un autre environnement (ex : PROD)

### Exemple concret observé

* **Environnement LAB** : PDF sans styles
* **Environnement PROD** : PDF correctement stylé
* **Version Odoo** : identique (**18.0-20250819**)
* **Template QWeb** : identique

---

## ❌ Fausses pistes écartées

### ⚠️ À ne PAS faire

Ne pas corriger ce problème en modifiant les templates QWeb ou le CSS tant que la configuration proxy/URL n'est pas validée.

Lors de l'analyse, plusieurs causes **n'étaient PAS responsables** :

* ❌ Version Odoo (CE vs EE) — **Vérifié** : même version 18.0-20250819
* ❌ Version wkhtmltopdf — **Vérifié** : 0.12.6.1 (patched qt) identique
* ❌ Polices système — **Vérifié** : fonts identiques
* ❌ Template QWeb standard — **Vérifié** : `sale.report_saleorder` correct
* ❌ Modules personnalisés — **Vérifié** : modules identiques entre LAB et PROD
* ❌ Cache Odoo — **Vérifié** : cache vidé, problème persiste

👉 Ces éléments ont été **explicitement vérifiés et exclus**.

---

## 🎯 Cause racine identifiée

Le problème provenait d'un **désalignement entre Odoo et le reverse proxy HTTPS (Caddy)**.

### Détails techniques

1. **Architecture** : Odoo est exposé derrière Caddy qui **force HTTP → HTTPS** (redirect 308)
2. **Configuration Odoo défaillante** :

   * `web.base.url` défini en **http://...** (au lieu de https://)
   * `report.url` **absent** (non configuré)
   * `proxy_mode` **désactivé** (absent dans `odoo.conf`)
3. **Conséquence** :

   * Odoo générait des URLs d'assets en HTTP
   * wkhtmltopdf suivait des redirects 308 (HTTP → HTTPS)
   * **wkhtmltopdf ne gère pas correctement les redirects complexes**
   * les assets CSS n'étaient pas chargés lors du rendu PDF

👉 **wkhtmltopdf n'est pas un navigateur** : il est très sensible aux redirects, aux URLs incohérentes et aux headers proxy.

### Pourquoi PROD fonctionnait ?

En PROD, la configuration était **fortuitement correcte** (probablement configurée manuellement auparavant), ce qui masquait le problème en LAB.

---

## 🔍 Indicateurs clés du problème

Les signes suivants doivent immédiatement orienter vers cette cause :

### 1) Vérification des paramètres Odoo

```bash
# Vérifier web.base.url et report.url
docker exec odoo_db_<env>_<tenant> psql -U odoo -d odoo_<env>_<tenant> -c "
SELECT key, value FROM ir_config_parameter
WHERE key IN ('web.base.url','report.url') ORDER BY key;"
```

**Signaux d'alerte** :

* `web.base.url` commence par `http://` alors que le site est servi en HTTPS
* `report.url` absent ou en HTTP

### 2) Vérification de la configuration

```bash
# Vérifier proxy_mode dans odoo.conf
grep -n "proxy_mode" tenants/<tenant>/apps/odoo/<env>/odoo.conf
```

**Signaux d'alerte** :

* `proxy_mode` absent dans `odoo.conf`
* `proxy_mode = False` ou commenté

### 3) Test de redirect

```bash
# Depuis le conteneur Odoo
docker exec odoo_<env>_<tenant> curl -I http://odoo.<env>.<tenant>.doreviateam.com/web/login
```

**Signaux d'alerte** :

* Réponse `308 Permanent Redirect` (au lieu de `200 OK`)
* Redirect vers HTTPS visible

### 4) Environnements concernés

Le problème n'apparaît généralement que sur certains environnements :

* ✅ **LAB** : souvent affecté (configuration par défaut)
* ✅ **STINGER** : souvent affecté
* ❌ **PROD** : parfois déjà corrigé manuellement

---

## ✅ Résolution appliquée

La résolution a consisté à **aligner explicitement Odoo avec le reverse proxy**.

### 1️⃣ Activer le mode proxy

Dans tous les fichiers `odoo.conf` (lab / stinger / prod / templates) :

```ini
# Reverse proxy (Caddy)
proxy_mode = True
```

**Fichiers modifiés** (exemple tenant `core`) :

* `tenants/core/apps/odoo/lab/odoo.conf`
* `tenants/core/apps/odoo/stinger/odoo.conf`
* `tenants/core/apps/odoo/prod/odoo.conf`
* `tenants/core/apps/odoo/lab/odoo.conf.template`
* `units/odoo/conf/odoo.lab.conf`
* `units/odoo/conf/odoo.prod.conf`

**Total** : 15 fichiers de configuration mis à jour (tous les tenants : core, dido, rozas)

---

### 2️⃣ Corriger les URLs Odoo en HTTPS

Dans la base de données concernée, utiliser le **hostname canonique** selon la convention Dorevia :

```text
<univers>.<environnement>.<tenant>.doreviateam.com
```

#### LAB core

```bash
docker exec odoo_db_lab_core psql -U odoo -d odoo_lab_core -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('web.base.url', 'https://odoo.lab.core.doreviateam.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"

docker exec odoo_db_lab_core psql -U odoo -d odoo_lab_core -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('report.url', 'https://odoo.lab.core.doreviateam.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"
```

#### PROD core

```bash
docker exec odoo_db_prod_core psql -U odoo -d odoo_prod_core -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('web.base.url', 'https://odoo.prod.core.doreviateam.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"

docker exec odoo_db_prod_core psql -U odoo -d odoo_prod_core -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('report.url', 'https://odoo.prod.core.doreviateam.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"
```

#### STINGER core

```bash
docker exec odoo_db_stinger_core psql -U odoo -d odoo_stinger_core -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('web.base.url', 'https://odoo.stinger.core.doreviateam.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"

docker exec odoo_db_stinger_core psql -U odoo -d odoo_stinger_core -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('report.url', 'https://odoo.stinger.core.doreviateam.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"
```

**Note** : Pour les autres tenants (dido, rozas), utiliser le même pattern avec le tenant approprié.

Ces paramètres garantissent que :

* les assets sont générés avec le bon schéma (HTTPS)
* **`report.url` est la référence utilisée par wkhtmltopdf pour charger les assets lors du rendu PDF** (paramètre le plus critique)
* wkhtmltopdf accède directement aux ressources sans redirect
* les URLs sont cohérentes avec l'exposition via Caddy

---

### 3️⃣ Redémarrer les conteneurs Odoo

Après modification :

```bash
# Redémarrer le conteneur concerné
docker restart odoo_<env>_<tenant>

# Vérifier que le conteneur démarre correctement
docker ps | grep odoo_<env>_<tenant>
```

**Important** : le redémarrage est nécessaire pour que :

* `proxy_mode = True` soit pris en compte
* les nouveaux paramètres DB soient chargés

---

## 🧪 Vérifications post-correctif

### 1) Vérifier les paramètres Odoo

```bash
docker exec odoo_db_<env>_<tenant> psql -U odoo -d odoo_<env>_<tenant> -c "
SELECT key, value FROM ir_config_parameter
WHERE key IN ('web.base.url','report.url') ORDER BY key;"
```

**Résultat attendu** :

```text
report.url   | https://odoo.<env>.<tenant>.doreviateam.com
web.base.url | https://odoo.<env>.<tenant>.doreviateam.com
```

### 2) Vérifier la configuration

```bash
grep -n "proxy_mode" tenants/<tenant>/apps/odoo/<env>/odoo.conf
```

### 3) Test d'accès direct

```bash
curl -I https://odoo.<env>.<tenant>.doreviateam.com/web/login
```

**Résultat attendu** : `HTTP/2 200`

### 4) Test d'accès aux assets

```bash
# Remplacer <hash> par un hash réel
curl -I https://odoo.<env>.<tenant>.doreviateam.com/web/assets/<hash>/web.assets_backend.css
```

**Résultat attendu** :

* `HTTP/2 200`
* `Content-Type: text/css`

### 5) Test de rendu PDF

1. Générer un PDF (devis, facture) depuis l'interface Odoo
2. Vérifier que :

   * les styles CSS sont appliqués
   * la mise en page est correcte
   * le rendu est cohérent entre LAB / STINGER / PROD

---

## 🧠 Leçon d'architecture (à retenir)

> Derrière un reverse proxy HTTPS, Odoo **DOIT** être explicitement configuré.

### Règle Dorevia à retenir

🔒 **Reverse proxy + Odoo =**

* `proxy_mode = True` dans `odoo.conf`
* `web.base.url` en HTTPS (hostname canonique)
* `report.url` en HTTPS (hostname canonique)

Sans ces trois éléments, les impressions PDF sont **instables par nature**.

### Pourquoi c'est critique ?

* **wkhtmltopdf n'est pas un navigateur** :

  * ne gère pas les redirects complexes
  * ne suit pas les cookies de session comme un navigateur
  * ne supporte pas JavaScript moderne
  * sensible aux URLs incohérentes
  * utilise `report.url` comme base pour charger tous les assets CSS/JS

* **Reverse proxy HTTPS** :

  * force des redirects HTTP → HTTPS (308)
  * modifie les headers (`X-Forwarded-*`)
  * nécessite une configuration explicite côté application

* **Odoo sans `proxy_mode`** :

  * ne lit pas les headers `X-Forwarded-*`
  * génère des URLs basées sur la requête reçue (HTTP interne)
  * crée des incohérences entre l'URL réelle (HTTPS) et l'URL générée (HTTP)

---

## 🛡️ Prévention — Checklist pour nouveaux déploiements

### Configuration Odoo

* [ ] `proxy_mode = True` présent dans `odoo.conf`
* [ ] `proxy_mode = True` présent dans `odoo.conf.template`
* [ ] `web.base.url` configuré en HTTPS (hostname canonique)
* [ ] `report.url` configuré en HTTPS (hostname canonique)

### Hostname canonique

Convention Dorevia :

```text
<univers>.<environnement>.<tenant>.doreviateam.com
```

Exemples :

* `odoo.lab.core.doreviateam.com`
* `odoo.stinger.core.doreviateam.com`
* `odoo.prod.core.doreviateam.com`

### Vérification post-déploiement

* [ ] Test de génération PDF réussi
* [ ] Styles CSS appliqués dans le PDF
* [ ] Rendu cohérent entre environnements
* [ ] Aucun redirect 308 visible

---

## 📋 Application aux autres tenants

Ce correctif doit être appliqué à **tous les tenants** et **tous les environnements**.

### Tenants

* ✅ **core** — corrigé (LAB, PROD)
* ⚠️ **dido** — configuration prête (`proxy_mode` ajouté), paramètres DB à mettre à jour si besoin
* ⚠️ **rozas** — configuration prête (`proxy_mode` ajouté), paramètres DB à mettre à jour si besoin

### Script de correction automatique

```bash
#!/bin/bash
# Script : fix_odoo_pdf_config.sh
# Usage : ./fix_odoo_pdf_config.sh <tenant> <env>

TENANT=$1
ENV=$2
HOSTNAME="odoo.${ENV}.${TENANT}.doreviateam.com"

# Mettre à jour web.base.url
docker exec odoo_db_${ENV}_${TENANT} psql -U odoo -d odoo_${ENV}_${TENANT} -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('web.base.url', 'https://${HOSTNAME}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"

# Mettre à jour report.url
docker exec odoo_db_${ENV}_${TENANT} psql -U odoo -d odoo_${ENV}_${TENANT} -c "
INSERT INTO ir_config_parameter(key, value)
VALUES ('report.url', 'https://${HOSTNAME}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"

# Redémarrer Odoo
docker restart odoo_${ENV}_${TENANT}

echo "✅ Configuration corrigée pour ${TENANT} ${ENV}"
```

---

## 🏁 Conclusion

Cet incident a mis en évidence un point critique de configuration plateforme.

Grâce à une correction **globale, documentée et reproductible**, le système est désormais :

* ✅ **Robuste** : configuration explicite et cohérente
* ✅ **Homogène** : même configuration entre environnements
* ✅ **Prêt multi-tenant** : templates et script standardisés
* ✅ **Documenté** : REX disponible pour référence future

### Impact

* 15 fichiers de configuration mis à jour
* 2 environnements corrigés (LAB core, PROD core)
* 3 paramètres critiques identifiés et documentés
* 0 régression observée

### Prochaines étapes

* ✅ Appliquer aux autres tenants (dido, rozas) si nécessaire
* ✅ Intégrer dans la checklist de déploiement
* ✅ Ajouter des tests automatisés de génération PDF

---

## 📎 Références

### Documents liés

* `DIAGNOSTIC_PDF_TOTAUX_TASSES.md` — diagnostic initial
* `SPEC_Dorevia_Reference_v2.0.md` — conventions de nommage

### Fichiers modifiés

* `tenants/*/apps/odoo/*/odoo.conf`
* `tenants/*/apps/odoo/*/odoo.conf.template`
* `units/odoo/conf/odoo.*.conf`

---

**Version** : 1.0
**Date** : 2026-01-08
**Statut** : ✅ Validé
**Auteur** : Dorevia Team
**Révision** : Post-incident LAB core
