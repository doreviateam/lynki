# 📚 Bibliothèque Phase 1 — Dorevia Platform

Ce répertoire contient les bibliothèques et outils pour la Phase 1 "Fondations".

## Structure

```
lib/
├── validate.sh          # Validateur de manifest (validation basique)
├── render/              # Moteur de rendu (Sprint 2)
│   ├── templates/      # Templates (Caddyfile, docker-compose.yml)
│   └── render.sh        # Script de rendu
└── preflight/          # Préflight technique (Sprint 4)
    └── preflight.sh     # Script de préflight
```

## validate.sh

Validateur de manifest Phase 1.

### Usage

```bash
./lib/validate.sh tenants/core/state/manifest.json
```

### Fonctionnalités

- Validation structure JSON
- Validation champs obligatoires
- Validation règles de nommage (slug tenant)
- Validation enums (env, univers, units)
- Validation cohérence (univers activé ⇒ unit requise)

### Dépendances

- `jq` : Pour parsing JSON
- (Optionnel) `ajv-cli` : Pour validation complète JSON Schema

### Installation ajv-cli (validation complète)

```bash
npm install -g ajv-cli
ajv validate -s schemas/manifest.schema.json -d tenants/core/state/manifest.json
```

## Templates (Sprint 2)

Les templates seront créés dans `lib/render/templates/` :
- `caddyfile.template` : Template Caddyfile
- `docker-compose-platform.template` : Template docker-compose.yml platform
- `docker-compose-app.template` : Template docker-compose.yml app

## Préflight (Sprint 4)

Le script de préflight sera créé dans `lib/preflight/preflight.sh` :
- Vérifications Docker/Compose
- Vérifications ports
- Vérifications DNS (optionnel)
- Vérifications registry

