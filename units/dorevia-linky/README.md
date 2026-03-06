# Dorevia Linky

Interface de consultation d’indicateurs certifiés (ventes, encaissements, trésorerie). Lecture seule, alimentée par le **Dorevia Vault** via proxy serveur.

- **Spec** : `ZeDocs/web14/SPEC_DOREVIA_LINKY_UI_v2.0.md`
- **Stack** : Next.js 14 (App Router), TypeScript, Tailwind CSS. PWA prévue en v2.

## Prérequis

- Node.js 18+
- Vault accessible (variable `VAULT_URL`)

## Installation

```bash
cp .env.example .env
# Éditer .env : VAULT_URL, TENANT_ID
npm install
```

## Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). La page d’accueil affiche la carte **Ventes certifiées** (données du Vault). Les cartes Encaissements et Trésorerie sont en placeholder tant que les endpoints Vault correspondants n’existent pas.

## Build / production

```bash
npm run build
npm start
```

## Variables d’environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VAULT_URL` | URL du Vault (appelée côté serveur uniquement) | `http://localhost:8080` |
| `TENANT_ID` | Tenant pour les agrégations | `core` |
| `NEXT_PUBLIC_APP_URL` | URL publique de l’app (optionnel) | — |

## API exposée (proxy)

- `GET /api/sales?date_debut=YYYY-MM-DD&date_fin=YYYY-MM-DD&granularity=month`  
  Proxie vers `GET /ui/aggregations/sales` du Vault. Paramètre optionnel : `tenant`.

## Déploiement

En environnement Docker / plateforme Dorevia, monter l’unité derrière Caddy (univers `ui`) avec `VAULT_URL` pointant vers le service Vault du tenant (ex. `http://vault-<tenant>:8080`).
