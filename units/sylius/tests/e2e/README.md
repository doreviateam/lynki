# Tests E2E Cypress - Hero Dorevia-Vault

## Installation

```bash
cd /opt/dorevia-plateform/units/sylius
npm install --save-dev cypress
```

## Configuration

Créer un fichier `cypress.config.js` à la racine de `units/sylius` :

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8000',
    viewportWidth: 1440,
    viewportHeight: 900,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

## Variables d'environnement

Créer un fichier `cypress.env.json` :

```json
{
  "BASE_URL": "http://localhost:8000"
}
```

## Lancement des tests

```bash
# Mode interactif
npx cypress open

# Mode headless
npx cypress run
```

## Tests disponibles

- `hero.cy.js` : Tests complets du Hero (visibilité, contenu, responsive, accessibilité, performance)

## Notes

- Les tests nécessitent que l'application soit accessible sur `http://localhost:8000`
- Ajuster `BASE_URL` selon votre environnement
- Les tests vérifient la conformité à la spécification v1.7
