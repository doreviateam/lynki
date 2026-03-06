# Procédure de branchement Odoo → Dorevia Vault

**Document dédié** : étapes détaillées pour connecter une instance **Odoo** au dispositif **Dorevia Vault** (**DVIG + Vault**) et faire fonctionner le scellement des factures de façon **reproductible**.

Dernière mise à jour : **2026-02**  
Répertoire de référence : **ZeDocs/web11**

---

## Objectif

Permettre à une instance Odoo (**lab**, **stinger** ou **prod**) de :

- **envoyer** les factures validées vers **DVIG**, puis vers **Vault**
- **récupérer** la **preuve** de scellement (receipt / proof)
- garantir que le statut passe à **Protégée** (et ne reste pas bloqué en **Protection en cours**) via **une procédure unique**, sans correctifs manuels

---

## Flux logique attendu

```
Odoo (invoice posted)
  → DVIG /ingest
      → outbox (DB DVIG)
          → Vault
              → proof generated
                  → Odoo (fetch proof)
```

> Tout incident correspond à une rupture de ce flux : **ingest**, **outbox**, **vault**, **fetch proof**.

---

## Conventions

- `<tenant>` : identifiant du tenant (ex. `core`, `sarl-la-platine`, `lglz`)
- `<env>` : environnement (`lab`, `stinger`, `prod`)
- **Source Odoo (canonique)** : `odoo.<env>.<tenant>` (ex. `odoo.lab.core`, `odoo.stinger.sarl-la-platine`)
- Racine projet : `/opt/dorevia-plateform` (à adapter si besoin)

⚠️ **Règle stricte** : la valeur `dorevia.dvig.source` **doit** être exactement `odoo.<env>.<tenant>` (sans alias, sans variantes).

---

## Prérequis (à valider avant de commencer)

| Prérequis | Vérification |
|---|---|
| Instance Odoo créée et accessible | URL type `odoo.<env>.<tenant>.doreviateam.com` (ou équivalent) |
| DNS en place pour Odoo, DVIG et Vault | Résolution des noms utilisés dans les paramètres |
| Module Facturation (`account`) installé | Apps Odoo → Facturation |
| Module `dorevia_vault_connector` installé | Apps Odoo → Mettre à jour la liste des applications → « Dorevia Vault Connector » |
| Module `dorevia_posted_lock` (recommandé) | Idem |
| Queue Job (optionnel) | Déclenchement immédiat après validation ; sinon CRON toutes les 1 min |
| Accès paramètres techniques Odoo | Paramètres → Technique → Paramètres système |
| Accès dépôt plateforme (render, DVIG, tokens) | Exécuter `dorevia.sh`, `token_gen`, éditer `tenants/<tenant>/secrets/dvig.tokens.yml` |
| Réseau Docker `dorevia-network` existant | `docker network ls | grep dorevia-network` |
| Gateway Caddy démarrée | Conteneur `gateway-caddy` (ou équivalent) sur le même réseau |

---

# Étape 1 — Déploiement platform (DVIG + Vault)

À faire **une fois par tenant / environnement**, côté serveur plateforme.

## 1.1 Générer le docker-compose platform depuis le manifest

```bash
cd /opt/dorevia-plateform
./bin/dorevia.sh render <tenant> --env <env>
```

Exemple (core lab) :

```bash
./bin/dorevia.sh render core --env lab
```

### Résultat attendu

Fichier généré :

```
tenants/<tenant>/rendered/<env>/platform/docker-compose.yml
```

Le compose contient les services `dvig`, `dvig-db`, `vault`, `vault-db` avec des noms de conteneurs **stables** :

- `dvig-<tenant_id>`
- `dvig-db-<tenant_id>`
- `vault-<tenant_id>`
- `vault-db-<tenant_id>`

---

## 1.2 Démarrer la platform

```bash
./bin/dorevia.sh platform up <tenant>
```

Exemple (core lab) :

```bash
./bin/dorevia.sh platform up core
```

### Vérification

```bash
./bin/dorevia.sh platform status core
```

Attendu : les conteneurs `dvig-core`, `dvig-db-core`, `vault-core`, `vault-db-core` doivent apparaître en **Up** / **healthy**.

> **Important** : ne pas éditer à la main `tenants/<tenant>/platform/docker-compose.yml` sans réaligner le rendu.  
> Pour toute modification : adapter le manifest ou `lib/render/render_platform_compose.sh`, puis relancer **1.1** et **1.2**.

---

## 1.3 Appliquer la migration outbox sur la base DVIG (première fois uniquement)

Une fois par tenant, après le premier `platform up` qui crée `dvig-db`.

```bash
cd /opt/dorevia-plateform
PGPASSWORD=dvig_password docker exec -i dvig-db-<tenant_id> psql -U dvig_user -d dvig_db < sources/dvig/migrations/006_create_outbox_events.sql
```

Exemple (tenant core) :

```bash
PGPASSWORD=dvig_password docker exec -i dvig-db-core psql -U dvig_user -d dvig_db < sources/dvig/migrations/006_create_outbox_events.sql
```

### Résultat attendu

Sortie de type `CREATE TABLE`, `CREATE INDEX`, `COMMENT` **sans erreur**.

---

## 1.4 Vérifier la gateway (Caddyfile)

Les blocs qui routent vers DVIG et Vault doivent utiliser **exactement** les noms de conteneurs générés :

- DVIG : `reverse_proxy dvig-<tenant_id>:8080`
- Vault : `reverse_proxy vault-<tenant_id>:8080`

Exemple (tenant core) :

```caddy
dvig.core.doreviateam.com {
  reverse_proxy dvig-core:8080
}
vault.core.doreviateam.com {
  reverse_proxy vault-core:8080
}
```

Si les noms de conteneurs diffèrent (ex. préfixe de projet Docker), le routage échoue :

- soit corriger le Caddyfile pour utiliser le **nom réel du conteneur**
- soit redéployer la platform (étape **1.1–1.2**) pour retrouver les noms attendus

### Test rapide

```bash
curl -s -o /dev/null -w "%{http_code}" https://dvig.<tenant>.doreviateam.com/health
curl -s -o /dev/null -w "%{http_code}" https://vault.<tenant>.doreviateam.com/health
```

(Adapter les hostnames au schéma DNS réel, ex. `dvig.core.doreviateam.com` pour tenant core.)

---

# Étape 2 — Côté DVIG : token pour le tenant

Chaque instance Odoo doit utiliser un **token DVIG** dont le `tenant` correspond **exactement** à la source (`odoo.<env>.<tenant>`).  
Ne pas réutiliser le token d'une autre instance (risque **403 TENANT_MISMATCH**).

## 2.1 Générer le token

Sur la machine où se trouve le dépôt (ou un environnement Python avec le module `dvig`) :

```bash
cd /opt/dorevia-plateform/sources/dvig
python -m dvig.cli.token_gen --tenant <TENANT> --univers odoo --output token
```

Exemple (tenant core) :

```bash
python -m dvig.cli.token_gen --tenant core --univers odoo --output token
```

Noter la ligne affichée :

```
TOKEN=dvig_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Cette valeur sera utilisée dans Odoo pour `dorevia.dvig.token`.

---

## 2.2 Ajouter l'entrée au fichier de tokens DVIG

```bash
python -m dvig.cli.token_gen --tenant <TENANT> --univers odoo --output yaml
```

Copier le bloc YAML affiché et l'ajouter dans la section `tokens:` du fichier de tokens de l'instance DVIG concernée.

Emplacements typiques :

- Core lab : `tenants/core/secrets/dvig.tokens.yml`
- Core stinger : `tenants/core-stinger/secrets/dvig.tokens.yml`

Le fichier est monté en lecture seule dans le conteneur DVIG (ex. `/etc/dvig/tokens.yml`).

---

## 2.3 Recharger DVIG

Redémarrer le conteneur DVIG pour prendre en compte le nouveau token :

```bash
docker restart dvig-<tenant_id>
```

Ou attendre le rechargement automatique si configuré (ex. `DVIG_TOKENS_RELOAD_INTERVAL=60`).

---

# Étape 3 — Côté Odoo : paramètres système

Sur l'instance Odoo à brancher :

**Paramètres → Technique → Paramètres → Paramètres système**  
Rechercher **« dorevia »** pour retrouver les paramètres existants.

---

## 3.1 Paramètres obligatoires

| Clé | Description | Exemple (core lab) | Exemple (stinger sarl-la-platine) |
|---|---|---|---|
| `dorevia.dvig.url` | URL de l'API DVIG | `https://dvig.core.doreviateam.com` | `https://dvig.core-stinger.doreviateam.com` |
| `dorevia.dvig.source` | Source au format `odoo.<env>.<tenant>` | `odoo.lab.core` | `odoo.stinger.sarl-la-platine` |
| `dorevia.dvig.token` | Token Bearer DVIG (étape 2.1) | `TOKEN=...` (tenant core) | `TOKEN=...` (tenant sarl-la-platine) |
| `dorevia.dvig.internal.token` | Token pour `/internal/outbox/process` ; identique à `DVIG_INTERNAL_TOKEN` du compose DVIG | `dvig_internal_core_lab` | valeur définie dans le compose core-stinger |
| `dorevia.vault.url` | URL de l'API Vault | `https://vault.core.doreviateam.com` | `https://vault.core-stinger.doreviateam.com` |
| `dorevia.vault.token` | JWT Vault pour récupération de preuve (**obligatoire**) | JWT émis par Vault core | JWT émis par Vault core-stinger |

⚠️ **Point bloquant connu** : sans `dorevia.vault.token`, le document peut être envoyé à Vault mais Odoo ne récupère jamais la preuve → statut bloqué en **« Protection en cours »**.

---

## 3.2 Paramètres optionnels

| Clé | Description | Valeur type |
|---|---|---|
| `dorevia.vault.max_attempts_proof` | Nombre max de tentatives de récupération de preuve | `20` |
| `dorevia.vault.max_age_pending_proof_hours` | Âge max (heures) pour une facture en attente de preuve | `24` |
| `dorevia.debug.actions` | Afficher les boutons manuels sur les factures (Trigger DVIG Worker Now, Refresh Proof Now) | `1` (debug) ou `0` |
| `dorevia_posted_lock.enabled` | Activer le verrouillage des écritures validées | `True / False` |
| `dorevia_posted_lock.allow_chatter` | Autoriser le chatter sur écritures verrouillées | `True / False` |
| `dorevia_posted_lock.allow_draft` | Autoriser le passage en brouillon | `True / False` |
| `dorevia_posted_lock.apply_to_entries` | Appliquer le verrou aux écritures comptables | `True / False` |

---

## 3.3 Où trouver le token interne DVIG (`dorevia.dvig.internal.token`)

Ce token n'est pas délivré par un service : il est défini au déploiement et doit être le **même** dans le compose DVIG et dans Odoo.

- Compose DVIG : variable d'environnement `DVIG_INTERNAL_TOKEN` (générée par `render_platform_compose.sh` avec défaut `dvig_internal_<tenant_id>_<env>`)
- Odoo : paramètre `dorevia.dvig.internal.token`

Pour core lab, la valeur par défaut est :

- `dvig_internal_core_lab` (voir compose rendu ou `tenants/core/platform/docker-compose.yml`)

---

## 3.4 Où trouver le JWT Vault (`dorevia.vault.token`)

Obtenir un JWT valide pour l'instance Vault utilisée (même programme Go, URL différente selon l'environnement) :

- auprès de l'équipe plateforme **ou**
- via la procédure d'émission de tokens Vault

⚠️ Ne pas versionner ce token en clair.

---

# Étape 4 — Vérification du branchement

1. Créer et valider une facture client sur l'instance Odoo
2. Ouvrir la fiche de la facture → section **Sécurité de la facture**

### Comportement attendu

Sous quelques minutes (selon CRON ou `queue_job`) :

- Statut : **À protéger → Protection en cours → Protégée**
- Détails techniques renseignés (référence, clé unique, etc.)

### Déclenchement manuel si besoin

- Paramètres → Technique → Automation → Actions planifiées  
  - **Vault Send DVIG** → Exécuter maintenant  
  - **Vault Fetch Proof** → Exécuter maintenant  

Si `dorevia.debug.actions = 1` :

- boutons **Trigger DVIG Worker Now**
- puis **Refresh Proof Now**

### Succès

- statut **Protégée**
- détails de preuve présents

### Échec

- consulter **Dernière erreur** sur la facture
- puis la section **Dépannage** ci-dessous

---

# Dépannage

| Symptôme | Cause probable | Action |
|---|---|---|
| Rien ne se passe (0 tentative, statut « À protéger ») | Paramètres DVIG/Vault manquants ou vides | Vérifier tous les paramètres obligatoires (§ 3.1), surtout `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.dvig.source` |
| 403 `TENANT_MISMATCH` sur `.../ingest` | Token DVIG d'un autre tenant ou source incorrecte | Créer un token dédié (§ 2) ; vérifier `dorevia.dvig.source = odoo.<env>.<tenant>` avec le même `<tenant>` |
| 401 sur DVIG ou Vault | Token invalide, expiré ou révoqué | Vérifier les tokens côté DVIG et Vault ; régénérer / mettre à jour Odoo |
| 500 sur `.../ingest` | Erreur côté DVIG (base absente, table outbox manquante) | Logs DVIG ; vérifier migration 006 appliquée sur `dvig-db-<tenant_id>` (§ 1.3) |
| Connexion / timeout vers DVIG ou Vault | Réseau, firewall, DNS | Vérifier que l'instance Odoo peut joindre `dorevia.dvig.url` et `dorevia.vault.url` (curl depuis le serveur Odoo si besoin) |
| Caddy ne joint pas DVIG (connexion refusée) | Conteneur DVIG mal nommé (préfixe de projet) | Déployer via procédure (§ 1) ; ou `docker rename <nom_actuel> dvig-<tenant_id>` puis redémarrer ; vérifier Caddyfile (§ 1.4) |
| Statut reste « Protection en cours » sans erreur visible | `dorevia.vault.token` manquant ; preuve jamais récupérée | Ajouter `dorevia.vault.token` (JWT valide) (§ 3.1) |

---

# Checklist finale (reproductible)

## Côté plateforme (une fois par tenant / env)

- [ ] `dorevia.sh render <tenant> --env <env>` exécuté
- [ ] `dorevia.sh platform up <tenant>` exécuté
- [ ] Migration 006 appliquée sur `dvig-db-<tenant_id>` (première fois)
- [ ] Caddyfile : `reverse_proxy dvig-<tenant_id>:8080` et `reverse_proxy vault-<tenant_id>:8080`
- [ ] `curl .../health` sur DVIG et Vault OK

## Côté DVIG

- [ ] Token généré pour le tenant (`token_gen --tenant <tenant> --univers odoo`)
- [ ] Bloc YAML ajouté dans le fichier de tokens DVIG du **bon environnement**
- [ ] DVIG rechargé (redémarrage ou rechargement automatique)

## Côté Odoo

- [ ] `dorevia.dvig.url`, `dorevia.dvig.source`, `dorevia.dvig.token` renseignés
- [ ] `dorevia.dvig.internal.token` = même valeur que `DVIG_INTERNAL_TOKEN` du compose DVIG
- [ ] `dorevia.vault.url` et **`dorevia.vault.token`** renseignés
- [ ] Optionnel : `dorevia.vault.max_attempts_proof`, `dorevia.vault.max_age_pending_proof_hours`, `dorevia.debug.actions`

## Vérification

- [ ] Facture validée → statut **Protégée** (ou exécution manuelle « Vault Send DVIG » + « Vault Fetch Proof »)
- [ ] En cas d'échec : « Dernière erreur » sur la facture + section Dépannage

---

# Références

- `PROCEDURE_BRANCHEMENT_ODOO_DOREVIA_VAULT.md` — Procédure générique et dépannage
- `AUDIT_VAULTAGE_CORE_LAB_VS_STINGER.md` — Écarts core lab / stinger et corrections
- `lib/render/render_platform_compose.sh` — Génération docker-compose platform (DVIG, dvig-db, Vault, token interne)
- `sources/dvig/migrations/006_create_outbox_events.sql` — Migration outbox DVIG
