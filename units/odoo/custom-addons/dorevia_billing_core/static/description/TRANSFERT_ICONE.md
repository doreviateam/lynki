# 📤 Transfert de l'icône vers le serveur

## Commande SCP

Depuis votre **machine locale**, exécutez :

```bash
scp ~/Desktop/NOM_FICHIER.png dorevia@doreviateam:/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core/static/description/icon.png
```

**OU** si votre bureau est en français :

```bash
scp ~/Bureau/NOM_FICHIER.png dorevia@doreviateam:/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core/static/description/icon.png
```

## Remplacez

- `NOM_FICHIER.png` par le nom réel de votre fichier icône
- `dorevia@doreviateam` par votre utilisateur@hôte si différent

## Exemples

Si votre fichier s'appelle `dorevia-icon.png` :

```bash
scp ~/Desktop/dorevia-icon.png dorevia@doreviateam:/opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core/static/description/icon.png
```

## Vérification

Après le transfert, vérifiez sur le serveur :

```bash
ls -lh /opt/dorevia-plateform/units/odoo/custom-addons/dorevia_billing_core/static/description/icon.png
```

## Format recommandé

- **Format** : PNG
- **Taille** : 128x128 ou 256x256 pixels
- **Nom final** : `icon.png` (obligatoire pour Odoo)

## Après le transfert

1. ✅ Vérifiez que le fichier existe
2. ✅ Mettez à jour le module dans Odoo (`Apps` → `Dorevia Billing CORE` → `Mettre à jour`)
3. ✅ L'icône apparaîtra automatiquement dans la liste des modules

