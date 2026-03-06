# Tests E2E Linky (Playwright)

## Prérequis

```bash
cd units/dorevia-linky
npm install
npx playwright install   # Navigateurs (Chromium, Firefox, WebKit)
```

## Exécution

```bash
# Lancer les tests (démarre le serveur Next.js automatiquement)
npm run test:e2e

# Mode UI interactif
npm run test:e2e:ui

# Mode headed (voir le navigateur)
npm run test:e2e:headed
```

## Base URL

Par défaut : `http://localhost:3000`. Surcharger avec :

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
```

## Structure

- `tests/e2e/*.spec.ts` — Scénarios E2E (complétude, cartes, etc.)
