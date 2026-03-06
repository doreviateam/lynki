# 📘 Guide Phase 2 "Intention/Exécution" — Dorevia Platform

**Version** : 1.0  
**Date** : 2025-01-29  
**Phase** : Phase 2 "Intention/Exécution"  
**Audience** : Exploitants, développeurs plateforme  
**Prérequis** : Phase 1 "Fondations" complétée

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Nouvelles commandes Phase 2](#nouvelles-commandes-phase-2)
3. [Guide d'utilisation](#guide-dutilisation)
4. [Processus de mise en production](#processus-de-mise-en-production)
5. [Journalisation intentions](#journalisation-intentions)
6. [Exemples d'utilisation](#exemples-dutilisation)
7. [FAQ](#faq)
8. [Références](#références)

---

## Vue d'ensemble

La Phase 2 "Intention/Exécution" introduit la **séparation stricte entre l'intention humaine et l'exécution machine**. L'objectif est de garantir :

- ✅ **Capture d'intention structurée** : CLI interactif pour capturer les décisions opérateur
- ✅ **Configuration déclarative** : Fichier intention JSON généré avant exécution
- ✅ **Agrégation automatique gateway** : Caddyfile global généré et rechargé automatiquement
- ✅ **Processus de production structuré** : 5 phases documentées et automatisées
- ✅ **Traçabilité complète** : Journalisation de toutes les interactions

### Workflow Phase 2

```
1. prompt <tenant> [--env <env>]     → Capture intention (interactif)
2. gateway aggregate [--reload]      → Agrège Caddyfiles globaux
3. apply <tenant> --intent <file>     → Déploie depuis intention
4. production <tenant> [--phase <0|1|2|3|4|5|all>] → Processus production
```

---

## Nouvelles commandes Phase 2

### `prompt <tenant> [--env <env>]`

**Description** : CLI interactif pour capturer l'intention de déploiement d'un opérateur.

**Usage** :
```bash
dorevia.sh prompt <tenant> [--env <env>]
```

**Exemple** :
```bash
dorevia.sh prompt core --env prod
```

**Processus interactif (7 étapes)** :

1. **Contexte** : Tenant, environnement, confirmation
2. **Univers** : Sélection des univers à activer (ex: `odoo`)
3. **Mode de production** : SaaS Dorevia, domaine/serveur client, ou hybride
4. **Domaines** : Domaine canonique et calcul des FQDN
5. **Alias** : Alias optionnels par service
6. **Préflight** : Options de préflight et installation contrôlée
7. **Résumé** : Affichage final et confirmation

**Sorties** :
- `tenants/<tenant>/state/intents/intent-<timestamp>.json` : Fichier intention JSON
- `tenants/<tenant>/state/logs/intent-<timestamp>.log` : Journal des interactions

**Exemple de sortie** :
```
📋 Capture d'intention pour tenant: core
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Étape 1/7 : Contexte
Tenant: core
Environnement: prod
...
✅ Capture d'intention terminée
📄 Fichier intention: tenants/core/state/intents/intent-20250129T120000Z.json
```

---

### `gateway aggregate [--reload]`

**Description** : Agrège tous les Caddyfiles générés par tenant/environnement en un Caddyfile global.

**Usage** :
```bash
dorevia.sh gateway aggregate [--reload]
```

**Exemple** :
```bash
dorevia.sh gateway aggregate --reload
```

**Fonctionnement** :
- Collecte tous les Caddyfiles dans `tenants/*/rendered/*/caddy/Caddyfile`
- Génère un Caddyfile global dans `units/gateway/Caddyfile`
- Option `--reload` : Recharge Caddy après agrégation

**Exemple de sortie** :
```
✅ Caddyfile global agrégé: units/gateway/Caddyfile
   - 3 Caddyfile(s) collecté(s)
   - 6 hostname(s) unique(s)
✅ Gateway rechargée
```

---

### `apply <tenant> --env <env> [--intent <file>] [--auto-gateway]`

**Description** : Déploie les services depuis fichiers rendus ou depuis un fichier intention.

**Usage** :
```bash
# Mode classique (depuis fichiers rendus)
dorevia.sh apply <tenant> --env <env> [--auto-gateway]

# Mode Phase 2 (depuis intention)
dorevia.sh apply <tenant> --intent <file> [--auto-gateway]
```

**Exemple** :
```bash
# Déploiement depuis intention
dorevia.sh apply core --intent tenants/core/state/intents/intent-20250129T120000Z.json --auto-gateway
```

**Fonctionnement avec `--intent`** :
1. Lit le fichier intention
2. Met à jour le manifest depuis l'intention
3. Génère les fichiers rendus (appelle `render`)
4. Déploie les services (comme mode classique)
5. Option `--auto-gateway` : Agrège et recharge la gateway

**Exemple de sortie** :
```
📄 Mode apply depuis intention: tenants/core/state/intents/intent-20250129T120000Z.json
🔧 Génération fichiers rendus depuis intention...
✅ Fichiers rendus générés
🚀 Déploiement Phase 1 pour tenant: core, env: prod
...
✅ Déploiement terminé
```

---

### `production <tenant> [--phase <0|1|2|3|4|5|all>]`

**Description** : Processus structuré de mise en production en 5 phases.

**Usage** :
```bash
# Toutes les phases
dorevia.sh production <tenant>

# Phase spécifique
dorevia.sh production <tenant> --phase <0|1|2|3|4|5>
```

**Exemple** :
```bash
dorevia.sh production core --phase all
```

**Phases** :

- **Phase 0** : Préconditions (validation tenant, stinger, mode)
- **Phase 1** : Go/No-Go (décision humaine documentée)
- **Phase 2** : Préflight Production (vérifications techniques)
- **Phase 3** : Génération Configuration (depuis intention)
- **Phase 4** : Apply Prod (déploiement non interactif)
- **Phase 5** : Validation Post-Prod (rapport de validation)

**Exemple de sortie** :
```
🚀 Début processus de production pour tenant: core (Phase: all)

🔍 Phase 0 : Préconditions
============================================================
✅ Tenant existe
✅ Manifest présent
✅ Environnement stinger rendu
...

📋 Phase 1 : Go/No-Go
============================================================
Validation fonctionnelle (STINGER OK) ? [O/n]: o
...
✅ Compte-rendu Go/No-Go généré

🔍 Phase 2 : Préflight Production
============================================================
✅ Docker installé
✅ Docker Compose installé
...

🔧 Phase 3 : Génération Configuration
============================================================
📄 Fichier intention: tenants/core/state/intents/intent-...
✅ Manifest mis à jour
✅ Fichiers rendus générés

🚀 Phase 4 : Apply Prod
============================================================
✅ Platform déployée
✅ App (odoo) déployée

🔍 Phase 5 : Validation Post-Prod
============================================================
✅ Container DVIG actif
✅ Container Vault actif
...
✅ Phase 5 : Validation Post-Prod réussie
```

---

## Guide d'utilisation

### Scénario A : Déploiement Lab avec Prompt

**Objectif** : Déployer un environnement Lab en utilisant le prompt interactif.

**Étapes** :

1. **Capturer l'intention** :
   ```bash
   dorevia.sh prompt core --env lab
   ```
   Répondre aux questions interactives.

2. **Vérifier l'intention générée** :
   ```bash
   cat tenants/core/state/intents/intent-*.json | jq .
   ```

3. **Déployer depuis l'intention** :
   ```bash
   dorevia.sh apply core --intent tenants/core/state/intents/intent-<timestamp>.json --auto-gateway
   ```

4. **Vérifier le déploiement** :
   ```bash
   dorevia.sh platform status core
   dorevia.sh app status odoo lab core
   ```

---

### Scénario B : Processus de mise en production

**Objectif** : Mettre en production un tenant via le processus structuré.

**Étapes** :

1. **Phase 0 : Préconditions** :
   ```bash
   dorevia.sh production core --phase 0
   ```
   Vérifie que le tenant existe, que stinger est déployé, etc.

2. **Phase 1 : Go/No-Go** :
   ```bash
   dorevia.sh production core --phase 1
   ```
   Capture la décision humaine (validation fonctionnelle, technique, contractuelle).

3. **Phase 2 : Préflight Production** :
   ```bash
   dorevia.sh production core --phase 2
   ```
   Vérifie les prérequis techniques (Docker, Docker Compose, accès serveur, DNS, etc.).

4. **Phase 3 : Génération Configuration** :
   ```bash
   dorevia.sh production core --phase 3
   ```
   Génère la configuration depuis l'intention (met à jour manifest, génère fichiers rendus).

5. **Phase 4 : Apply Prod** :
   ```bash
   dorevia.sh production core --phase 4
   ```
   Déploie les services en production (non interactif).

6. **Phase 5 : Validation Post-Prod** :
   ```bash
   dorevia.sh production core --phase 5
   ```
   Valide le déploiement et génère un rapport.

**Ou en une seule commande** :
```bash
dorevia.sh production core --phase all
```

---

### Scénario C : Agrégation Gateway

**Objectif** : Agréger tous les Caddyfiles et recharger la gateway.

**Étapes** :

1. **Agréger sans recharger** :
   ```bash
   dorevia.sh gateway aggregate
   ```
   Génère le Caddyfile global sans recharger Caddy.

2. **Agréger et recharger** :
   ```bash
   dorevia.sh gateway aggregate --reload
   ```
   Génère le Caddyfile global et recharge Caddy.

3. **Vérifier le Caddyfile global** :
   ```bash
   cat units/gateway/Caddyfile
   ```

**Note** : L'option `--auto-gateway` de `apply` fait automatiquement l'agrégation et le rechargement.

---

## Processus de mise en production

### Vue d'ensemble

Le processus de mise en production est structuré en **5 phases** :

```
Phase 0: Préconditions
    ↓
Phase 1: Go/No-Go (décision humaine)
    ↓
Phase 2: Préflight Production
    ↓
Phase 3: Génération Configuration
    ↓
Phase 4: Apply Prod
    ↓
Phase 5: Validation Post-Prod
```

### Phase 0 : Préconditions

**Objectif** : Vérifier que les préconditions sont remplies avant de démarrer le processus.

**Vérifications** :
- ✅ Tenant existe
- ✅ Manifest présent
- ✅ Environnement stinger rendu
- ✅ Platform stinger déployée
- ✅ App stinger déployée
- ⚠️ Mode de production défini (avertissement si absent)

**Script** : `lib/production/phase0_preconditions.sh`

**Exemple** :
```bash
dorevia.sh production core --phase 0
```

---

### Phase 1 : Go/No-Go

**Objectif** : Capturer la décision humaine de mise en production.

**Questions** :
1. Validation fonctionnelle (STINGER OK) ?
2. Validation technique (conforme SPEC v1.3) ?
3. Validation contractuelle (mode prod, domaines, alias) ?

**Sortie** :
- Rapport Markdown : `tenants/<tenant>/state/production_reports/gonogo-<timestamp>.md`

**Script** : `lib/production/phase1_gonogo.sh`

**Exemple** :
```bash
dorevia.sh production core --phase 1
```

**Mode automatique (tests)** :
```bash
bash lib/production/phase1_gonogo.sh core --auto-yes
```

---

### Phase 2 : Préflight Production

**Objectif** : Vérifier les prérequis techniques pour un déploiement en production.

**Vérifications locales** :
- ✅ Docker installé
- ✅ Docker Compose installé
- ✅ Réseau Docker `dorevia-network`

**Vérifications serveur cible (si client/hybrid)** :
- ✅ Accès SSH
- ✅ Docker sur serveur cible
- ✅ Docker Compose sur serveur cible
- ⚠️ Ports 80/443 disponibles
- ✅ DNS résout vers le bon serveur

**Script** : `lib/production/phase2_preflight_prod.sh`

**Exemple** :
```bash
dorevia.sh production core --phase 2
```

---

### Phase 3 : Génération Configuration

**Objectif** : Générer la configuration déclarative depuis l'intention.

**Actions** :
1. Lit le fichier intention le plus récent (ou `--intent <file>`)
2. Met à jour le manifest depuis l'intention
3. Génère les fichiers rendus (appelle `render`)

**Sorties** :
- Manifest mis à jour : `tenants/<tenant>/state/manifest.json`
- Fichiers rendus : `tenants/<tenant>/rendered/<env>/*`

**Script** : `lib/production/phase3_config.sh`

**Exemple** :
```bash
dorevia.sh production core --phase 3
```

---

### Phase 4 : Apply Prod

**Objectif** : Déployer les services en production (exécution non interactive).

**Actions** :
1. Vérifie les fichiers rendus
2. Déploie la platform (DVIG, Vault)
3. Déploie les apps (Odoo, etc.)
4. Option `--auto-gateway` : Agrège et recharge la gateway

**Script** : `lib/production/phase4_apply_prod.sh`

**Exemple** :
```bash
dorevia.sh production core --phase 4
```

---

### Phase 5 : Validation Post-Prod

**Objectif** : Valider le déploiement en production et générer un rapport.

**Vérifications** :
- ✅ Containers platform actifs (DVIG, Vault)
- ✅ Containers apps actifs (Odoo, etc.)
- ⚠️ URLs accessibles (si DNS configuré)
- ✅ Healthchecks Docker

**Sortie** :
- Rapport Markdown : `tenants/<tenant>/state/prod-validation-<timestamp>.md`

**Script** : `lib/production/phase5_validation.sh`

**Exemple** :
```bash
dorevia.sh production core --phase 5
```

---

## Journalisation intentions

### Format du journal

Chaque interaction du prompt est journalisée dans un fichier log structuré :

**Fichier** : `tenants/<tenant>/state/logs/intent-<timestamp>.log`

**Format** :
```
# Journal d'intention - 20250129T120000Z
# Tenant: core
# Généré par: operator@doreviateam.com
# Format: timestamp|step|question|answer|operator

2025-01-29T12:00:01Z|1|Tenant|core|operator@doreviateam.com
2025-01-29T12:00:02Z|1|Environnement|prod|operator@doreviateam.com
2025-01-29T12:00:05Z|2|Univers odoo activé|oui|operator@doreviateam.com
...
```

### Consultation des journaux

**Lister les journaux** :
```bash
ls -lht tenants/core/state/logs/intent-*.log
```

**Consulter un journal** :
```bash
cat tenants/core/state/logs/intent-20250129T120000Z.log
```

**Rechercher dans les journaux** :
```bash
grep "Univers odoo" tenants/core/state/logs/intent-*.log
```

---

## Exemples d'utilisation

### Exemple 1 : Déploiement Lab complet

```bash
# 1. Capturer l'intention
dorevia.sh prompt core --env lab

# 2. Déployer depuis l'intention
LATEST_INTENT=$(ls -1t tenants/core/state/intents/intent-*.json | head -1)
dorevia.sh apply core --intent "$LATEST_INTENT" --auto-gateway

# 3. Vérifier
dorevia.sh platform status core
dorevia.sh app status odoo lab core
```

---

### Exemple 2 : Processus de production complet

```bash
# Processus complet en une commande
dorevia.sh production core --phase all

# Ou phase par phase
dorevia.sh production core --phase 0
dorevia.sh production core --phase 1
dorevia.sh production core --phase 2
dorevia.sh production core --phase 3
dorevia.sh production core --phase 4
dorevia.sh production core --phase 5
```

---

### Exemple 3 : Agrégation gateway manuelle

```bash
# Après avoir rendu plusieurs tenants
dorevia.sh render core --env lab
dorevia.sh render dido --env lab
dorevia.sh render rozas --env lab

# Agréger et recharger
dorevia.sh gateway aggregate --reload
```

---

### Exemple 4 : Consultation des intentions

```bash
# Lister les intentions
ls -lht tenants/core/state/intents/intent-*.json

# Consulter la dernière intention
LATEST_INTENT=$(ls -1t tenants/core/state/intents/intent-*.json | head -1)
cat "$LATEST_INTENT" | jq .

# Consulter le journal associé
LATEST_LOG=$(ls -1t tenants/core/state/logs/intent-*.log | head -1)
cat "$LATEST_LOG"
```

---

## FAQ

### Q1 : Puis-je utiliser `apply` sans `prompt` ?

**R** : Oui, vous pouvez utiliser `apply` en mode classique (Phase 1) :
```bash
dorevia.sh render core --env lab
dorevia.sh apply core --env lab
```

Le mode `--intent` est optionnel et permet de déployer depuis une intention capturée.

---

### Q2 : Que se passe-t-il si je relance `prompt` plusieurs fois ?

**R** : Chaque exécution de `prompt` génère un nouveau fichier intention avec un timestamp unique. Les anciennes intentions sont conservées pour l'audit.

---

### Q3 : Comment choisir quelle intention utiliser avec `apply --intent` ?

**R** : Par défaut, `apply --intent` utilise la dernière intention (la plus récente). Vous pouvez aussi spécifier explicitement :
```bash
dorevia.sh apply core --intent tenants/core/state/intents/intent-20250129T120000Z.json
```

---

### Q4 : Le processus de production est-il obligatoire ?

**R** : Non, le processus de production est une **aide structurée** pour les mises en production. Vous pouvez toujours utiliser les commandes individuelles :
- `prompt` pour capturer l'intention
- `apply --intent` pour déployer
- `gateway aggregate` pour agréger

---

### Q5 : Que contient le fichier intention JSON ?

**R** : Le fichier intention contient :
- Métadonnées : `version`, `tenant_id`, `environment`, `created_at`, `created_by`
- Intention : `universes`, `mode`, `domains` (canonical, aliases), `preflight`, `server` (si client/hybrid)

Exemple :
```json
{
  "version": "2.0",
  "tenant_id": "core",
  "environment": "prod",
  "created_at": "2025-01-29T12:00:00Z",
  "created_by": "operator@doreviateam.com",
  "intention": {
    "universes": ["odoo"],
    "mode": "saas",
    "domains": {
      "canonical": "doreviateam.com",
      "aliases": []
    },
    "preflight": {
      "enabled": true,
      "auto_install": false
    }
  }
}
```

---

### Q6 : Comment valider un fichier intention ?

**R** : Utilisez le schéma JSON Schema :
```bash
jq . tenants/core/state/intents/intent-*.json  # Vérifier syntaxe JSON
# Validation complète via le schéma (à implémenter si nécessaire)
```

---

### Q7 : Les journaux d'intention sont-ils versionnés ?

**R** : Les journaux sont stockés dans `tenants/<tenant>/state/logs/` et peuvent être versionnés avec Git si souhaité. Les fichiers intention sont dans `tenants/<tenant>/state/intents/`.

---

### Q8 : Que faire si le processus de production échoue à une phase ?

**R** : Vous pouvez relancer le processus à partir de la phase qui a échoué :
```bash
# Si Phase 2 échoue, relancer à partir de Phase 2
dorevia.sh production core --phase 2
```

Les phases précédentes ne sont pas rejouées.

---

## Références

### Documents Phase 2

- **Spécification** : `ZeDocs/V2/SPEC_Dorevia_Phase2_Intention_Execution_v1.0.md`
- **Plan d'implémentation** : `ZeDocs/V2/PLAN_IMPLEMENTATION_PHASE2_SCRUM.md`
- **État d'avancement** : `ZeDocs/V2/ETAT_IMPLEMENTATION_PHASE2_SCRUM.md`

### Documents Phase 1

- **Guide Phase 1** : `ZeDocs/V2/GUIDE_PHASE1.md`
- **Spécification Phase 1** : `ZeDocs/V2/SPEC_Dorevia_Phase1_Fondations_v1.0.md`

### Schémas

- **Schéma intention** : `schemas/intent.schema.json`
- **Schéma manifest** : `schemas/manifest.schema.json`

### Scripts

- **Prompt** : `lib/prompt/prompt.py`
- **Production** : `lib/production/phase*.sh`
- **Gateway aggregate** : `bin/dorevia.sh` (fonction `cmd_gateway_aggregate`)

---

**Dernière mise à jour** : 2025-01-29  
**Version** : 1.0

