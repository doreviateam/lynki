# 🔧 Résolution : Icône non visible pour dorevia_posted_lock

## ✅ Configuration actuelle

- ✅ Fichier icône : `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_posted_lock/static/description/icon.png`
- ✅ Manifest : `'icon': '/dorevia_posted_lock/static/description/icon.png'`
- ✅ Menu avec `web_icon` : `views/menus.xml` avec `web_icon="dorevia_posted_lock,static/description/icon.png"`
- ✅ Menu dans manifest : `'views/menus.xml'` dans `data`

## 🔍 Différence avec dorevia_billing_core

- `dorevia_billing_core` : `'application': True` → icône visible ✅
- `dorevia_posted_lock` : `'application': False` → icône peut nécessiter un rafraîchissement

## 🛠️ Solution : Étapes à suivre dans l'ordre

### 1. Mettre à jour le module

**Dans Odoo** :
1. Aller dans **Apps**
2. Rechercher "Dorevia Posted Lock"
3. Cliquer sur **Upgrade** (ou **Mettre à jour**)
4. Attendre la fin de la mise à jour

### 2. Mettre à jour la liste des Apps

**Dans Odoo** :
1. Dans **Apps**, cliquer sur **"Mettre à jour la liste des Apps"** (en haut à droite)
2. Attendre la fin de la mise à jour (peut prendre quelques secondes)

### 3. Vider le cache du navigateur

- Appuyer sur **Ctrl+F5** (ou **Cmd+Shift+R** sur Mac)
- Ou vider complètement le cache du navigateur

### 4. Vérifier l'URL de l'icône

L'icône devrait être accessible via :
```
http://odoo.lab.core.doreviateam.com/dorevia_posted_lock/static/description/icon.png
```

Tester cette URL dans le navigateur pour vérifier que l'icône est accessible.

### 5. Si l'icône n'apparaît toujours pas

**Option A : Redémarrer Odoo**
```bash
docker compose restart odoo
```

**Option B : Vérifier les logs Odoo**
```bash
docker logs odoo_lab_core | grep -i "dorevia_posted_lock\|icon"
```

**Option C : Vérifier que le module est bien installé**
- Dans Odoo, aller dans **Apps**
- Rechercher "Dorevia Posted Lock"
- Vérifier que le statut est **"Installé"** (pas seulement "Disponible")

## 📝 Note importante

Pour les modules avec `application: False`, l'icône peut nécessiter :
1. Une mise à jour du module
2. Une mise à jour de la liste des Apps
3. Un rafraîchissement du cache navigateur

Si après toutes ces étapes l'icône n'apparaît toujours pas, il peut s'agir d'un problème de cache Odoo persistant. Dans ce cas, redémarrer Odoo est généralement la solution.

