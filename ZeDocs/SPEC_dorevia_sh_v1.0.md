# SPEC — `dorevia.sh` — Orchestrateur de Plateforme (tenant / univers / env)
**Version**: v1.0  
**Date**: 2025-12-28 (Europe/Paris)  
**Statut**: Spécification de référence (à committer)  
**Périmètre**: Orchestration locale/serveur de la plateforme Dorevia — tenant DNS `core` (et futurs tenants), services partagés (Caddy/DVIG/Vault), applications par univers (Odoo) et par environnement (`lab`, `stinger`, `prod`).

---

## 1. Objectif

`dorevia.sh` est l’outil d’orchestration qui rend **exécutable** la logique contractuelle :

- **Tenant** (DNS/contractuel)  
- **Univers** (application : `odoo`, futur `sylius`, …)  
- **Environnement** (`lab`, `stinger`, `prod`)  
- **Source** = `<univers>.<env>.<tenant>`

Son rôle principal est de **prévenir les erreurs humaines** en :
- générant automatiquement les identités (`source`), DB names, volumes, compose project names,
- appliquant les invariants de conformité,
- orchestrant les déploiements de façon reproductible (up/down/status/reset),
- gérant la génération/rotation des tokens DVIG.

> `dorevia.sh` n’est pas un script de confort : c’est le **gardien des invariants** définis dans la SPEC plateforme et la clarification contractuelle.

---

## 2. Références normatives

Ce document est normatif et s’appuie sur :
- **SPEC Plateforme CORE + Odoo LAB/STINGER/PROD** (v1.0)
- **Clarification contractuelle Tenant / Univers / Source** (v1.0)

En cas de conflit, la clarification contractuelle fait foi sur les définitions.

---

## 3. Définitions

### 3.1 Entités

- **Tenant**: identifiant DNS (ex: `core`, futur `laplatine`)  
- **Univers**: application fonctionnelle (ex: `odoo`)  
- **Environnement**: `lab` | `stinger` | `prod`  
- **Source**: `univers.env.tenant` (ex: `odoo.prod.core`)  
- **Plateforme**: services partagés + apps

### 3.2 Valeurs autorisées

- env ∈ `{lab, stinger, prod}`
- univers (v1.0) : `{odoo}` (extensible)
- tenant: slug DNS `[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?` (v1.0 recommandé)

---

## 4. Invariants (non négociables)

`dorevia.sh` doit refuser toute action qui viole un invariant.

### 4.1 Invariants contractuels (tenant/univers/source)

1. `source == <univers>.<env>.<tenant>`
2. `tenant` du token DVIG == tenant DNS de la plateforme ciblée
3. `univers` du token DVIG == univers ciblé
4. env ∈ `{lab, stinger, prod}`
5. `lab/stinger/prod` ne sont **jamais** des tenants

### 4.2 Invariants d’isolation Odoo

Pour chaque couple `(univers=odoo, env, tenant)` :
- DB **dédiée** (ou cluster dédié) : `odoo_<env>_<tenant>` (recommandé)  
- filestore/volume **dédié**
- compose project name **dédié**
- aucune ressource (DB/volume) ne doit être partagée entre env

### 4.3 Invariants de sécurité

- STINGER & PROD : déploiement sur images **taggées** (pas `latest`)
- secrets hors repo (fichiers montés/variables d’env)
- DVIG/Vault (services partagés) déployés en **release** (tag) si utilisés par PROD

---

## 5. Modèle d’architecture “plateforme” (orchestration)

### 5.1 Deux couches à orchestrer

1) **Platform services** (par tenant)  
- reverse proxy (Caddy)
- DVIG
- Vault
- (DB/stockage Vault si applicable)

2) **Applications** (par univers+env+tenant)  
- Odoo LAB
- Odoo STINGER
- Odoo PROD

`dorevia.sh` doit garantir :  
> impossible de démarrer une app si la platform n’est pas “up”.

---

## 6. Interface CLI (commande / sous-commandes)

### 6.1 Forme générale

```bash
dorevia.sh <command> <subcommand> [args...] [--flags]
```

### 6.2 Aide & validation

```bash
dorevia.sh help
dorevia.sh version
dorevia.sh doctor
```

- `doctor` vérifie : docker, compose, droits, présence des fichiers essentiels, DNS local optionnel.

---

## 7. Commandes — Platform (services partagés)

### 7.1 `platform up <tenant>`

Démarre (ou converge vers up) :
- `caddy`
- `dvig`
- `vault`
- dépendances (DB vault, volumes, networks)

**Exigences**
- tenant valide (slug DNS)
- `COMPOSE_PROJECT_NAME` déterministe : `dorevia_platform_<tenant>`

**Sorties**
- status global + URLs recommandées (ex: `dvig.<tenant>…`, `vault.<tenant>…`)

### 7.2 `platform status <tenant>`

Affiche :
- conteneurs up/down
- health checks (si disponibles)
- versions (tags) des images DVIG/Vault
- chemins volumes (optionnel)

### 7.3 `platform down <tenant>`

Stoppe les services partagés (sans détruire données par défaut).

### 7.4 `platform destroy <tenant>`

Destruction contrôlée :
- stop
- suppression containers/networks
- suppression volumes (flag requis `--purge`)
- suppression secrets (flag requis `--purge-secrets`)

---

## 8. Commandes — App (univers/env/tenant)

### 8.1 `app up <univers> <env> <tenant>`

Exemple :
```bash
dorevia.sh app up odoo lab core
dorevia.sh app up odoo stinger core
dorevia.sh app up odoo prod core
```

**Pré-conditions**
- `platform status <tenant>` OK (DVIG/Vault + proxy up)
- env autorisé
- univers autorisé

**Actions**
- génère/valide la `source` = `odoo.<env>.<tenant>`
- assure l’existence des secrets/config (`.env`, odoo.conf)
- démarre Postgres Odoo (ou DB dédiée)
- démarre Odoo + volumes dédiés

**Invariants**
- DB name déterministe : `odoo_<env>_<tenant>`
- volumes déterministes : `odoo_<env>_<tenant>_data`, `odoo_<env>_<tenant>_db` (selon pattern)
- compose project name : `dorevia_<univers>_<env>_<tenant>`

### 8.2 `app status <univers> <env> <tenant>`

Affiche :
- containers + ports internes
- DB name / volumes
- source attendue
- URL attendue `https://<univers>.<env>.<tenant>.doreviateam.com`

### 8.3 `app down <univers> <env> <tenant>`

Stoppe l’app (sans purge données).

### 8.4 `app reset <univers> <env> <tenant>`

Reset contrôlé (démo/dev) :
- stop app
- drop DB + filestore (flag requis `--purge`)
- (optionnel) import dataset démo `--demo <profile>`

> `reset` est recommandé pour STINGER afin de régénérer un showroom propre.

### 8.5 `app destroy <univers> <env> <tenant>`

Suppression containers/networks + purge volumes si flag `--purge`.

---

## 9. Commandes — Token (DVIG)

### 9.1 `token issue <univers> <env> <tenant>`

Crée un token DVIG compatible avec les invariants :
- `tenant=<tenant>`
- `univers=<univers>`
- `source` attendue : `<univers>.<env>.<tenant>`

Stockage :
- écrit dans `tenants/<tenant>/secrets/dvig.tokens.yml` (par défaut)
- ou un path configuré

Sorties :
- token clair (affiché une seule fois) + token_id
- rappel de la source associée

### 9.2 `token list <tenant>`

Liste tokens (id, univers, status, created_at, last_used_at si dispo).

### 9.3 `token revoke <tenant> <token_id>`

Désactive un token (status=revoked) et déclenche reload DVIG si supporté.

### 9.4 `token rotate <univers> <env> <tenant>`

Alias sécurisé :
- issue nouveau token
- revoke ancien (optionnel `--revoke-old`)

---

## 10. Structure de répertoires (normative)

`dorevia.sh` gère une arborescence déterministe.

### 10.1 Root repo

```
dorevia-platform/
  bin/
    dorevia.sh
  tenants/
    <tenant>/
      platform/                  # compose + conf services partagés
      apps/
        odoo/
          lab/
          stinger/
          prod/
      secrets/
        dvig.tokens.yml
      state/
        manifest.json            # état calculé (ports internes, versions, etc.)
  sources/
  units/
  ZeDocs/
```

### 10.2 Règles

- `secrets/` n’est jamais committé (gitignore), sauf gabarits.
- `state/manifest.json` peut être committé ou non selon stratégie; recommandé : non.

---

## 11. Génération des identifiants (déterministe)

### 11.1 Compose project names

- Platform : `dorevia_platform_<tenant>`
- App : `dorevia_<univers>_<env>_<tenant>`

### 11.2 DB names

- Odoo : `odoo_<env>_<tenant>`

### 11.3 Volumes

- Odoo data : `odoo_<env>_<tenant>_data`
- Odoo db : `odoo_<env>_<tenant>_db` (si Postgres séparé par app)
- Vault : `vault_<tenant>_data`, etc. (selon implémentation)

> Objectif : zéro collision, lisible, diffable.

---

## 12. Ports (principe)

### 12.1 Principe normatif

- **En STINGER/PROD** : aucun port hôte exposé pour Odoo/DVIG/Vault (DNS via Caddy uniquement)
- **En LAB** : un mode “dev” peut exposer des ports hôte optionnels (flag `--dev-ports`), mais ce n’est pas le mode par défaut.

### 12.2 Mode `--dev-ports` (optionnel)

- Expose des ports hôte déterministes sur un range réservé (ex: 18000+).
- Le calcul doit être déterministe à partir de `(univers, env, tenant, service)` avec détection de collision.

---

## 13. Gestion des versions (images/tagging)

### 13.1 Règles par env

- LAB : autorise `dev`/`edge` (mais recommandé de tagger aussi)
- STINGER : uniquement tags (ex: `dvig:0.1.2-auth`, `vault:v1.6.2`)
- PROD : uniquement tags + rollback possible (conserver N-1)

### 13.2 Implémentation

`dorevia.sh` doit :
- refuser `latest` en stinger/prod
- afficher la version déployée (status)
- permettre un `platform set-version dvig <tag>` (optionnel v1.1)

---

## 14. Gestion des erreurs (normative)

### 14.1 Codes d’erreur (recommandé)

- `E01` : paramètre invalide (env/univers/tenant)
- `E02` : invariant violé (source/token mismatch)
- `E03` : dépendance manquante (docker/compose)
- `E04` : platform down (tentative app up)
- `E05` : ressource occupée (collision noms/volumes)
- `E06` : opération destructive sans flag `--purge`

### 14.2 Messages

Doivent être :
- courts
- actionnables
- inclure la commande corrective

---

## 15. Critères d’acceptation (v1.0)

La SPEC `dorevia.sh` est considérée implémentée quand :

1. `platform up core` démarre Caddy + DVIG + Vault, et `platform status core` est OK.
2. `app up odoo lab core` démarre Odoo LAB avec DB+filestore dédiés.
3. `app up odoo stinger core` démarre Odoo STINGER avec DB+filestore dédiés.
4. `app up odoo prod core` démarre Odoo PROD avec DB+filestore dédiés.
5. `token issue odoo stinger core` produit un token et écrit dans `tenants/core/secrets/dvig.tokens.yml`.
6. `token issue odoo prod core` produit un token différent; un token lab ne passe pas sur une requête source prod (validation DVIG).
7. Toute tentative d’utiliser un env non autorisé (ex: `prd`) échoue avec `E01`.
8. Toute tentative de déployer STINGER/PROD avec image `latest` échoue avec `E02` (ou `E01` selon implémentation).

---

## 16. Évolutions prévues (hors v1.0)

- Multi-univers (`sylius`, etc.)
- Multi-tenants (clients)
- Gestion DNS automatisée (OVH) **optionnelle** et séparée
- Promote pipeline (LAB → STINGER → PROD) automatisé
- `platform backup/restore`, `app backup/restore`

---

## 17. Historique

- v1.0 (2025-12-28) : première version normative — orchestration tenant/univers/env + services partagés + Odoo LAB/STINGER/PROD + tokens DVIG.

---

**Fin de SPEC**
