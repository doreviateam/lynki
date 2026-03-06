# DNS OVH — n8n.lab.core.doreviateam.com

**Contexte** : Exposer n8n pour le tenant **core**, environnement **lab**, via le domaine **doreviateam.com** géré chez OVH.

---

## 1. Hostname cible

- **Sous-domaine** : `n8n.lab.core` (ou en FQDN : `n8n.lab.core.doreviateam.com`).
- **Convention plateforme** : `<service>.<env>.<tenant>.doreviateam.com` → ici service=n8n, env=lab, tenant=core.

---

## 2. Création du DNS chez OVH

1. Se connecter à l’espace client OVH (gestion du domaine **doreviateam.com**).
2. Aller dans **Web Cloud** → **Domaines** → **doreviateam.com** → **Zone DNS** (ou **Gestion de la zone**).
3. **Ajouter une entrée** :
   - **Type** : **A** (si vous pointez vers l’IP du serveur où tourne Caddy) **ou** **CNAME** (si vous pointez vers un autre nom déjà configuré).
   - **Sous-domaine** : `n8n.lab.core`  
     (OVH peut afficher « Sous-domaine » : saisir exactement `n8n.lab.core` ; le FQDN devient alors `n8n.lab.core.doreviateam.com`).
   - **Cible** :
     - **A** : IP publique du serveur (ex. `85.215.206.213`).
     - **CNAME** : nom cible (ex. `gateway.doreviateam.com` ou le hostname du serveur).
4. **TTL** : 300 ou 3600 selon votre usage.
5. Enregistrer / valider.

**Résultat** : `n8n.lab.core.doreviateam.com` résout vers l’IP (ou le CNAME) configuré.

**En cas d’erreur SSL** (ex. `SSL_ERROR_INTERNAL_ERROR_ALERT`) dans le navigateur : voir `ZeDocs/web11/TROUBLESHOOTING_SSL_N8N_LAB_CORE.md` (gateway Caddy sur le serveur, ports 80/443, certificat Let’s Encrypt).

---

## 3. Vérification

- **Dig** : `dig +short n8n.lab.core.doreviateam.com`
- **Ping** : `ping n8n.lab.core.doreviateam.com` (optionnel).
- Une fois Caddy et n8n démarrés pour le tenant **core** env **lab** : ouvrir `https://n8n.lab.core.doreviateam.com` dans un navigateur (TLS géré par Caddy).

---

## 4. Autres hostnames (optionnel)

Pour le même tenant **core** et l’env **lab**, vous pouvez créer en parallèle :

- `suitecrm.lab.core.doreviateam.com` (sous-domaine : `suitecrm.lab.core`, même type A ou CNAME vers la même IP).
- `odoo.lab.core.doreviateam.com` (idem).

Même procédure : ajouter une entrée A (ou CNAME) avec le sous-domaine correspondant.
