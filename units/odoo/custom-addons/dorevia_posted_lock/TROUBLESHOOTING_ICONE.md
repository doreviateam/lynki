# 🔧 Dépannage : Icône non visible

## ✅ Vérifications effectuées

- ✅ Fichier présent : `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_posted_lock/static/description/icon.png`
- ✅ Format : PNG 1024x1024
- ✅ Taille : 773K
- ✅ Permissions : 644 (correctes)
- ✅ Menu créé avec `web_icon` : `views/menus.xml`
- ✅ Menu ajouté au manifest : `views/menus.xml` dans `data`

## 🔍 Problème identifié

Pour les modules techniques (`application: False`), l'icône peut ne pas s'afficher automatiquement dans la liste des Apps, même avec un menu et `web_icon`.

## 🛠️ Solutions à essayer

### Solution 1 : Mettre à jour le module ET la liste des Apps

1. **Mettre à jour le module** :
   - Aller dans **Apps**
   - Rechercher "Dorevia Posted Lock"
   - Cliquer sur **Upgrade** (ou **Mettre à jour**)

2. **Mettre à jour la liste des Apps** :
   - Dans **Apps**, cliquer sur **"Mettre à jour la liste des Apps"** (en haut à droite)
   - Attendre la fin de la mise à jour

3. **Vider le cache du navigateur** :
   - Appuyer sur **Ctrl+F5** (ou **Cmd+Shift+R** sur Mac)

### Solution 2 : Vérifier que le menu est chargé

1. Aller dans **Paramètres** → **Technique** → **Interface utilisateur** → **Menus**
2. Rechercher "Dorevia Posted Lock"
3. Si le menu existe, l'icône devrait être référencée

### Solution 3 : Redémarrer Odoo

```bash
# Redémarrer le conteneur Odoo
docker compose restart odoo
```

### Solution 4 : Vérifier l'URL de l'icône

L'icône devrait être accessible via :
```
http://odoo.lab.core.doreviateam.com/web/image/module/dorevia_posted_lock/static/description/icon.png
```

Ou via le chemin statique :
```
http://odoo.lab.core.doreviateam.com/dorevia_posted_lock/static/description/icon.png
```

### Solution 5 : Vérifier les logs Odoo

```bash
# Vérifier les logs Odoo pour des erreurs liées à l'icône
docker logs odoo_lab_core | grep -i icon
```

## 📝 Note importante

Pour les modules techniques (`application: False`), l'icône peut ne s'afficher que :
- Dans la liste des Apps (après mise à jour de la liste)
- Si un menu avec `web_icon` est défini (fait ✅)
- Après avoir vidé le cache Odoo

Si l'icône ne s'affiche toujours pas après toutes ces étapes, il peut s'agir d'un problème de cache Odoo persistant ou d'une configuration spécifique du serveur.

