# Procédure de branchement d’une instance Odoo au dispositif Dorevia Vault

Cette procédure permet de connecter une **nouvelle instance Odoo** (lab, stinger ou prod) au dispositif Dorevia Vault (DVIG + Vault) pour le scellement des factures. Elle est générique : à adapter selon l’environnement (`lab`, `stinger`, `prod`) et le **tenant** (identifiant de l’instance, ex. `lglz`, `sarl-la-platine`, `core`).

**Référence** : le Dorevia-Vault de référence (DVIG + Vault) est en **environnement stinger** : `dvig.core-stinger.doreviateam.com` et `vault.core-stinger.doreviateam.com`. Les instances Odoo (lab, stinger, prod) peuvent pointer vers ce même couple DVIG/Vault stinger en utilisant chacune un **token dédié** pour leur tenant.

**Important — Core lab vs stinger** : l’instance **odoo.lab.core** (`odoo.lab.core.doreviateam.com`) a son **propre** DVIG et Vault (conteneurs `dvig-core`, `vault-core`). Elle doit donc utiliser les URLs **core** et le token interne **core lab**, et non les URLs ni le token stinger. Si les paramètres Odoo lab core pointent vers stinger (ou si le token interne est celui du stinger), le vaultage sur odoo.lab.core ne fonctionnera pas. Voir le tableau ci‑dessous (§ 3) pour les valeurs à utiliser sur **odoo.lab.core**.

---

## Procédure reproductible (déploiement platform + Odoo)

Pour que le vaultage fonctionne à chaque déploiement sans correctifs manuels :

1. **Rendu et déploiement platform** (une seule source de vérité)  
   - Toujours générer le compose depuis le manifest :  
     `dorevia.sh render <tenant> --env <env>`  
   - Puis démarrer la platform :  
     `dorevia.sh platform up <tenant>`  
   - Ne pas éditer à la main `tenants/<tenant>/platform/docker-compose.yml` sans réaligner le rendu (sinon la prochaine génération écrasera ou divergera).  
   - Les conteneurs doivent s’appeler **`dvig-<tenant_id>`** et **`vault-<tenant_id>`** (ex. `dvig-core`, `vault-core`) pour que la gateway Caddy puisse les joindre. Si les noms diffèrent (ex. préfixe de projet), le routage vers DVIG/Vault échoue.

2. **Première fois après `platform up` (tenant avec DVIG)**  
   - Appliquer la migration outbox sur la base DVIG (une fois par tenant) :  
     `PGPASSWORD=dvig_password docker exec -i dvig-db-<tenant_id> psql -U dvig_user -d dvig_db < sources/dvig/migrations/006_create_outbox_events.sql`  
   - Exemple pour core : remplacer `<tenant_id>` par `core`.

3. **Gateway (Caddyfile)**  
   - Les blocs `reverse_proxy` pour DVIG et Vault doivent utiliser exactement les noms de conteneurs générés :  
     `dvig-<tenant_id>:8080` et `vault-<tenant_id>:8080`  
   - Exemple pour le tenant core : `dvig-core:8080`, `vault-core:8080`.

4. **Odoo : checklist complète des paramètres**  
   - Pour que le statut passe à **Protégée** (et pas seulement « Protection en cours »), **tous** les paramètres ci‑dessous doivent être renseignés. En particulier **`dorevia.vault.token`** est **obligatoire** pour la récupération de preuve ; sans lui, le vaultage reste bloqué côté Odoo.

| Paramètre | Obligatoire | Rôle |
|-----------|-------------|------|
| `dorevia.dvig.url` | Oui | URL de l’API DVIG |
| `dorevia.dvig.source` | Oui | `odoo.<env>.<tenant>` |
| `dorevia.dvig.token` | Oui | Token Bearer DVIG (ingest) |
| `dorevia.dvig.internal.token` | Oui | Token pour `/internal/outbox/process` (même valeur que `DVIG_INTERNAL_TOKEN` du compose DVIG) |
| `dorevia.vault.url` | Oui | URL de l’API Vault |
| `dorevia.vault.token` | **Oui** | JWT Vault pour récupération de preuve (sans lui : statut reste « Protection en cours ») |
| `dorevia.vault.max_attempts_proof` | Optionnel | Défaut 20 |
| `dorevia.vault.max_age_pending_proof_hours` | Optionnel | Défaut 24 |
| `dorevia.debug.actions` | Optionnel | 1 = boutons manuels sur les factures |

Référence : **AUDIT_VAULTAGE_CORE_LAB_VS_STINGER.md** (écarts core lab / stinger et corrections).

---

## En amont (hors scope de cette procédure)

Avant d’appliquer cette procédure, les étapes suivantes sont **déjà réalisées** :

- Une **instance Odoo** a été créée dans l’un des environnements **LAB**, **STINGER** ou **PROD**.
- Le **DNS** de cette instance est en place (ex. `odoo.lab.lglz.doreviateam.com`, `odoo.stinger.sarl-la-platine.doreviateam.com`).

Cette procédure ne décrit **pas** la création de l’instance Odoo ni la configuration DNS ; elle couvre uniquement le **branchement** de cette instance au dispositif Dorevia Vault.

---

## 1. Prérequis

- **Odoo** : instance déjà créée et opérationnelle (version supportée par le module dorevia_vault_connector).
- **Modules Odoo installés** :
  - **Facturation** (`account`) — **obligatoire** : le Dorevia Vault Connector en dépend (il scelle les factures `account.move`). Correspond à l’app Odoo « Facturation » / Comptabilité de base.
  - **Queue Job** (`queue_job`) — **optionnel** : le Dorevia Vault Connector ne dépend pas de queue_job. Sans queue_job, le scellement est assuré par les CRONs (toutes les 1 min). Avec queue_job, le déclenchement est immédiat après validation de la facture.
  - **Modules Dorevia\*** (addons personnalisés à installer) :
    - **`dorevia_vault_connector`** — obligatoire pour le branchement au Dorevia Vault (scellement des factures).
    - **`dorevia_posted_lock`** — recommandé : verrouillage des écritures validées (paramètres `dorevia_posted_lock.*`).
    - *Optionnels selon besoin métier* : `dorevia_billing_core`, `dorevia_report_pdf_layout_fix`, `dorevia_sale_proforma_report_fix`, `dorevia_sale_report_fix`, `dorevia_sale_reports` (rapports, facturation, mises en page).
- **Accès** :
  - Paramètres technique sur Odoo (Paramètres → Technique → Paramètres système).
  - Serveur ou conteneur **DVIG** (fichier de tokens, ex. `/etc/dvig/tokens.yml` ou `conf/tokens.yml`).
- **Convention de nommage** : la **source** envoyée à DVIG doit être au format **`univers.env.tenant`** avec :
  - `univers` = `odoo` (pour Odoo)
  - `env` = `lab` | `stinger` | `prod`
  - `tenant` = identifiant court de l’instance (ex. `lglz`, `sarl-la-platine`, `core`)

Exemple : instance lab du tenant LGLZ → source = **`odoo.lab.lglz`**.

---

## 2. Côté DVIG : créer un token pour le tenant

Chaque instance Odoo doit utiliser un **token DVIG dont le tenant correspond exactement** à la source. Une instance qui envoie `odoo.lab.lglz` doit avoir un token enregistré avec **tenant = `lglz`** dans le fichier de tokens DVIG. Ne pas réutiliser le token d’une autre instance (ex. La Platine) pour une nouvelle instance, sinon DVIG renverra **403 TENANT_MISMATCH**.

**À faire sur le serveur DVIG** (ou la machine où se trouve le dépôt `sources/dvig`) :

### 2.1 Générer le token

```bash
cd /opt/dorevia-plateform/sources/dvig
python -m dvig.cli.token_gen --tenant <TENANT> --univers odoo --output token
```

Remplacer `<TENANT>` par l’identifiant du tenant (ex. `lglz`, `sarl-la-platine`).  
**Noter la ligne `TOKEN=...`** : cette valeur sera utilisée dans Odoo (paramètre `dorevia.dvig.token`).

### 2.2 Ajouter l’entrée au fichier de tokens DVIG

```bash
python -m dvig.cli.token_gen --tenant <TENANT> --univers odoo --output yaml
```

Copier le bloc YAML affiché et l’ajouter dans la section **`tokens:`** du fichier de tokens DVIG (ex. `/etc/dvig/tokens.yml` ou `conf/tokens.yml` sur l’instance DVIG concernée : core-stinger, core-lab, etc.).

### 2.3 Recharger DVIG

Redémarrer le service/conteneur DVIG ou attendre le rechargement automatique des tokens (selon la configuration). Vérifier que le fichier est bien chargé (logs DVIG au démarrage).

---

## 3. Côté Odoo : paramètres système

Sur l’instance Odoo à brancher : **Paramètres** → **Technique** → **Paramètres** → **Paramètres système**.

Créer ou modifier les paramètres suivants (recherche « dorevia » pour les retrouver).

### 3.1 Paramètres obligatoires DVIG

- **`dorevia.dvig.url`** — URL de l’API DVIG (selon env). Exemple : `https://dvig.core-stinger.doreviateam.com`
- **`dorevia.dvig.source`** — **`odoo.<env>.<tenant>`** (voir § 1). Exemple : `odoo.lab.lglz` ou `odoo.stinger.sarl-la-platine`
- **`dorevia.dvig.token`** — Token généré à l’étape 2.1 (tenant = même que dans la source). Valeur : `TOKEN=...` notée au § 2.1

**Valeurs pour odoo.lab.core.doreviateam.com (core lab)** — à utiliser **uniquement** sur cette instance (ne pas copier les valeurs stinger) :

| Paramètre | Valeur à mettre sur **odoo.lab.core** |
|-----------|--------------------------------------|
| `dorevia.dvig.url` | `https://dvig.core.doreviateam.com` |
| `dorevia.vault.url` | `https://vault.core.doreviateam.com` |
| `dorevia.dvig.source` | `odoo.lab.core` |
| `dorevia.dvig.internal.token` | `dvig_internal_core_lab` |
| `dorevia.dvig.token` | Token généré pour le tenant **core** (fichier `tenants/core/secrets/dvig.tokens.yml`) |

Si ces paramètres pointent vers stinger (`dvig.core-stinger...`, `vault.core-stinger...`) ou si le token interne est celui du stinger, le vaultage sur odoo.lab.core **ne fonctionnera pas**.

### 3.2 Paramètres optionnels DVIG (usage avancé)

- **`dorevia.dvig.internal.token`** — Token interne (si utilisé par le connecteur). À définir si l’instance utilise l’endpoint interne DVIG ; peut être partagé ou dédié selon la config. Pour **core lab** : valeur **`dvig_internal_core_lab`** (voir tableau ci‑dessus).

### 3.3 Paramètres Vault (recommandés pour le scellement)

- **`dorevia.vault.url`** — URL de l’API Vault. Exemple : `https://vault.core-stinger.doreviateam.com` (stinger) ; pour **core lab** : `https://vault.core.doreviateam.com`
- **`dorevia.vault.token`** — Token JWT Vault (obtenir côté Vault/équipe plateforme). Long JWT
- **`dorevia.vault.max_attempts_proof`** — Nombre max de tentatives de récupération de preuve. Exemple : `20`
- **`dorevia.vault.max_age_pending_proof_hours`** — Âge max (heures) pour une facture « en attente de preuve ». Exemple : `24`

### 3.4 Paramètres optionnels (debug / verrouillage)

- **`dorevia.debug.actions`** — `1` ou `0`. `1` = afficher les boutons « Trigger DVIG Worker Now » / « Refresh Proof Now » sur les factures.
- **`dorevia_posted_lock.enabled`** — `True` / `False`. Activer le verrouillage des écritures validées (module dorevia_posted_lock).
- **`dorevia_posted_lock.allow_chatter`** — `True` / `False`. Autoriser le chatter sur écritures verrouillées.
- **`dorevia_posted_lock.allow_draft`** — `True` / `False`. Autoriser le passage en brouillon.
- **`dorevia_posted_lock.apply_to_entries`** — `True` / `False`. Appliquer le verrou aux écritures comptables.

Les valeurs des tokens (**dorevia.dvig.token**, **dorevia.vault.token**) ne doivent **pas** être versionnées en clair dans le dépôt ; les obtenir depuis un secret manager ou une instance de référence (ex. La Platine) et les saisir manuellement dans Odoo.

---

## 4. Vérification du branchement

1. **Créer et valider une facture client** sur l’instance Odoo.
2. Sur la fiche facture, vérifier la section **Sécurité de la facture** :
   - Statut attendu après quelques instants : **Protection en cours** puis **Protégée** (ou un message d’erreur explicite dans « Dernière erreur »).
3. **Déclencher manuellement** si besoin :
   - **Paramètres** → **Technique** → **Automation** → **Actions planifiées**
   - Rechercher **« Vault Send DVIG »** → **Exécuter maintenant**
   - Puis **« Vault Fetch Proof »** → **Exécuter maintenant**
4. Si les boutons debug sont activés (`dorevia.debug.actions` = `1`), vous pouvez aussi utiliser **« Trigger DVIG Worker Now »** puis **« Refresh Proof Now »** sur la facture.

**Succès** : le statut passe à **Protégée** et les détails techniques (référence, clé unique) sont renseignés.  
**Échec** : consulter « Dernière erreur » et la section 5 (dépannage).

---

## 5. Dépannage rapide

- **Rien ne se passe** (0 tentative, statut « À protéger ») — Cause : paramètres DVIG/Vault manquants ou vides. Action : vérifier que `dorevia.dvig.url`, `dorevia.dvig.token`, `dorevia.dvig.source` sont bien renseignés (Paramètres système).
- **403** (TENANT_MISMATCH) sur `.../ingest` — Cause : token utilisé = token d’une autre instance (tenant différent de la source). Action : créer un **token dédié** pour le tenant de cette instance sur DVIG (§ 2) et le mettre dans `dorevia.dvig.token` ; vérifier que `dorevia.dvig.source` = `odoo.<env>.<tenant>` avec le même `<tenant>`.
- **401** sur DVIG ou Vault — Cause : token invalide, expiré ou révoqué. Action : vérifier les tokens dans le fichier DVIG et côté Vault ; régénérer si besoin et mettre à jour les paramètres Odoo.
- **500** sur `.../ingest` — Cause : erreur côté DVIG (ex. persistance outbox). Action : consulter les logs DVIG (`ingest_event_error`), vérifier que la table `outbox_events` existe (migration `006_create_outbox_events.sql`).
- **Connexion / timeout** — Cause : réseau, firewall, DNS. Action : s’assurer que l’instance Odoo peut joindre les URLs `dorevia.dvig.url` et `dorevia.vault.url`.
- **Caddy ne joint pas DVIG** (connexion refusée vers `dvig.core...`) — Cause : le conteneur DVIG n’a pas le nom attendu par le Caddyfile (ex. `71fba4ce77b1_dvig-core` au lieu de `dvig-core`). Action : déployer avec la procédure reproductible (§ « Procédure reproductible ») ; ou renommer le conteneur : `docker rename <nom_actuel> dvig-<tenant_id>` puis redémarrer. Vérifier que la gateway référence bien `dvig-<tenant_id>:8080`.
- **Statut reste « Protection en cours »** (aucune erreur visible) — Cause : `dorevia.vault.token` manquant dans Odoo ; la preuve n’est jamais récupérée. Action : ajouter le paramètre avec un JWT Vault valide pour l’instance Vault utilisée.

Pour plus de détails (CRONs, file queue_job, erreurs spécifiques lab LGLZ) : **VAULT_LAB_LGLZ_DIAGNOSTIC.md** et **LAB_LGLZ_500_DVIG_RECAP.md**.

---

## 6. Résumé (checklist reproductible)

**Côté plateforme (une fois par tenant / env)**  
- [ ] `dorevia.sh render <tenant> --env <env>` puis `dorevia.sh platform up <tenant>` (ne pas éditer le compose à la main sans réaligner le rendu).
- [ ] Première fois : appliquer la migration 006 sur `dvig-db-<tenant_id>` (voir § « Procédure reproductible »).
- [ ] Gateway Caddy : `reverse_proxy dvig-<tenant_id>:8080` et `vault-<tenant_id>:8080`.

**Côté Odoo (par instance)**  
- [ ] Prérequis Odoo (modules account, queue_job si utilisé, dorevia_vault_connector).
- [ ] Choisir `env` et `tenant` ; source = **`odoo.<env>.<tenant>`**.
- [ ] **DVIG** : générer un token pour ce tenant (`token_gen --tenant <tenant> --univers odoo`), l’ajouter au fichier de tokens DVIG, recharger DVIG.
- [ ] **Odoo** : créer **tous** les paramètres système (voir tableau § « Procédure reproductible »), en particulier `dorevia.dvig.url`, `dorevia.dvig.source`, `dorevia.dvig.token`, **`dorevia.dvig.internal.token`**, `dorevia.vault.url`, **`dorevia.vault.token`**.
- [ ] Tester : facture validée → exécution manuelle « Vault Send DVIG » + « Vault Fetch Proof » → statut **Protégée** ou message d’erreur explicite.
- [ ] En cas d’erreur : consulter « Dernière erreur » sur la facture et la section 5 (dépannage).

---

*Document de référence : ZeDocs/web11. Dernière mise à jour : 2026-01.*
