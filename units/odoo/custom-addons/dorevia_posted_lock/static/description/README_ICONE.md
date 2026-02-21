# Icône du Module Dorevia Posted Lock

## 📍 Emplacement

L'icône du module est placée ici :
```
static/description/icon.png
```

## ✅ Vérification

- **Fichier présent** : ✅ `/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_posted_lock/static/description/icon.png`
- **Format** : PNG 1024x1024
- **Taille** : 773K
- **Permissions** : ✅ Correctes

## 🔄 Pour que l'icône s'affiche dans Odoo

Odoo détecte automatiquement l'icône depuis `static/description/icon.png`, mais parfois il faut forcer le rafraîchissement :

### Méthode 1 : Mettre à jour la liste des Apps (Recommandé)

1. Aller dans **Apps** (menu principal)
2. Cliquer sur **"Mettre à jour la liste des Apps"** (en haut à droite)
3. Attendre la fin de la mise à jour
4. L'icône devrait maintenant apparaître

### Méthode 2 : Vider le cache du navigateur

1. Appuyer sur **Ctrl+F5** (ou **Cmd+Shift+R** sur Mac) pour forcer le rechargement
2. Ou vider le cache du navigateur manuellement

### Méthode 3 : Redémarrer Odoo

Si les méthodes précédentes ne fonctionnent pas :

```bash
# Redémarrer le conteneur Odoo
docker compose restart odoo
```

### Méthode 4 : Vérifier les permissions

```bash
# Vérifier que l'icône est accessible
ls -lh /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_posted_lock/static/description/icon.png

# Si nécessaire, corriger les permissions
chmod 644 /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_posted_lock/static/description/icon.png
```

## 🎨 Description de l'icône

L'icône représente un cube/boîte bleu clair, symbolisant la **protection** et l'**immutabilité** des documents comptables.

---

**Note** : Après avoir ajouté l'icône, il est généralement nécessaire de mettre à jour la liste des Apps dans Odoo pour que l'icône soit visible.

