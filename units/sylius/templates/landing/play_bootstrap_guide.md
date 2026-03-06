# Guide d'intégration du template Play Bootstrap

## Assets à copier

Les assets du template Play Bootstrap doivent être copiés dans `/opt/dorevia-plateform/units/sylius/public/assets/`

### Commandes à exécuter :

```bash
cd /opt/dorevia-plateform/units/sylius
sudo mkdir -p public/assets
sudo chown -R dorevia:dorevia public/assets
cp -r /tmp/play-bootstrap/assets/* public/assets/
```

### Structure attendue :

```
public/assets/
├── css/
│   ├── bootstrap.min.css
│   ├── animate.css
│   ├── lineicons.css
│   └── ud-styles.css
├── js/
│   ├── bootstrap.bundle.min.js
│   ├── wow.min.js
│   └── main.js
└── images/
    └── ...
```

## Alternative : CDN

En attendant, le template utilise les assets via CDN (jsDelivr) pour Bootstrap 5.
