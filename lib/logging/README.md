# Journalisation Dorevia (Phase 1)

## Vue d'ensemble

Le système de journalisation structurée permet de tracer toutes les opérations de `dorevia.sh` de manière standardisée.

## Format des logs

Format structuré (texte, facilement parseable) :
```
timestamp|level|tenant|env|unit|action|message
```

**Exemple** :
```
2025-12-31T15:04:26Z|INFO|core|lab|render|platform|docker-compose.yml platform généré
```

### Champs

- **timestamp** : Date/heure UTC au format ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)
- **level** : Niveau de log (`INFO`, `WARN`, `ERROR`)
- **tenant** : Identifiant du tenant (peut être vide)
- **env** : Environnement (`lab`, `stinger`, `prod`, ou vide)
- **unit** : Unité concernée (`render`, `apply`, `platform`, `app`, `validate`, `preflight`, etc.)
- **action** : Action effectuée (`start`, `complete`, `platform`, `app`, `caddyfile`, etc.)
- **message** : Message descriptif

## Utilisation

### Activation des logs dans un fichier

Définir la variable d'environnement `DOREVIA_LOG_FILE` :

```bash
export DOREVIA_LOG_FILE=/var/log/dorevia/dorevia.log
./bin/dorevia.sh render core --env lab
```

Les logs sont écrits dans le fichier ET affichés sur stdout/stderr.

### Sans fichier (par défaut)

Si `DOREVIA_LOG_FILE` n'est pas défini, les logs sont uniquement affichés sur stdout/stderr (comportement normal).

## Niveaux de log

- **INFO** : Opérations normales (génération, déploiement réussi, etc.)
- **WARN** : Avertissements (fichier manquant mais non bloquant, etc.)
- **ERROR** : Erreurs (échec de déploiement, fichier introuvable, etc.)

## Commandes instrumentées

Les commandes suivantes utilisent la journalisation structurée :

- `dorevia.sh validate <tenant>`
- `dorevia.sh render <tenant> --env <env>`
- `dorevia.sh preflight <tenant> --env <env>`
- `dorevia.sh apply <tenant> --env <env>`

## Exemples

### Exemple 1 : Génération avec logs

```bash
export DOREVIA_LOG_FILE=/tmp/dorevia.log
./bin/dorevia.sh render core --env lab
cat /tmp/dorevia.log
```

### Exemple 2 : Déploiement avec logs

```bash
export DOREVIA_LOG_FILE=/var/log/dorevia/deploy.log
./bin/dorevia.sh apply core --env lab
```

### Exemple 3 : Parsing des logs

```bash
# Extraire tous les logs d'erreur
grep "^.*|ERROR|" /var/log/dorevia/dorevia.log

# Extraire les logs pour un tenant spécifique
grep "^.*|.*|core|" /var/log/dorevia/dorevia.log

# Extraire les logs de déploiement
grep "^.*|.*|.*|.*|apply|" /var/log/dorevia/dorevia.log
```

## Phase 2 (futur)

- Format JSON optionnel
- Rotation automatique des logs
- Intégration avec systèmes de monitoring (Prometheus, ELK, etc.)
- Logs d'audit séparés (actions critiques)

