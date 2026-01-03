# Configuration Intention Phase 2

## Vue d'Ensemble

Les configurations intention sont générées par le CLI interactif (`dorevia.sh prompt`) et représentent les décisions opérateur capturées avant exécution.

## Structure

### Répertoires

- `tenants/<tenant>/state/intents/` : Fichiers intention (`intent-<timestamp>.json`)
- `tenants/<tenant>/state/logs/` : Journaux d'intention (`intent-<timestamp>.log`)

### Format

**Fichier intention** : `intent-<timestamp>.json`
- Format JSON
- Validé contre `schemas/intent.schema.json`
- Versionnable (Git)

**Fichier journal** : `intent-<timestamp>.log`
- Format structuré (timestamp|step|question|answer|operator)
- Traçabilité complète

## Utilisation

### Génération

```bash
dorevia.sh prompt core --env lab
# Génère : tenants/core/state/intents/intent-20250129T120000Z.json
# Génère : tenants/core/state/logs/intent-20250129T120000Z.log
```

### Validation

```bash
# Validation basique (structure JSON)
jq empty tenants/core/state/intents/intent-*.json

# Validation complète (schéma)
ajv validate -s schemas/intent.schema.json -d tenants/core/state/intents/intent-*.json
```

### Utilisation pour déploiement

```bash
# Déployer depuis intention
dorevia.sh apply core --env lab --intent tenants/core/state/intents/intent-20250129T120000Z.json
```

## Exemple

Voir `tenants/core/state/intents/intent.example.json`

---

**Dernière mise à jour** : 2025-01-29

