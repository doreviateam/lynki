# Vault central : brancher toutes les instances Odoo

**Objectif** : créer **un Vault central** (et un **DVIG central**) pour y brancher **toutes les prochaines instances Odoo**, au lieu d’avoir une stack DVIG+Vault par tenant ou par environnement.

Dernière mise à jour : **2026-02**  
Répertoire : **ZeDocs/web11**

---

## 1. Principe

| Aujourd’hui (multi-stacks) | Cible (Vault central) |
|----------------------------|------------------------|
| Une stack platform par tenant/env (ex. core lab, core-stinger, sarl-la-platine) | **Une seule** stack platform « central » (DVIG + Vault) |
| Chaque Odoo pointe vers le DVIG/Vault de son tenant | **Toutes** les instances Odoo pointent vers le **même** DVIG et le **même** Vault |
| Tokens DVIG et JWT Vault par stack | **Un** fichier de tokens DVIG (un token **par tenant** / par Odoo) ; **un** JWT Vault partagé (ou par tenant si Vault le gère) |

Le **Vault** et le **DVIG** gèrent déjà le **tenant** dans les événements et les documents : un seul Vault peut stocker les preuves de tous les tenants ; un seul DVIG peut recevoir les ingest de tous les Odoo, à condition qu’un **token DVIG dédié** soit créé pour chaque tenant (source `odoo.<env>.<tenant>`).

---

## 2. Architecture cible

```
                    ┌─────────────────────────────────────────┐
                    │  Vault central (1 instance)              │
                    │  + DVIG central (1 instance)            │
                    │  + dvig-db (outbox multi-tenant)        │
                    │  + vault-db                             │
                    └─────────────────────────────────────────┘
                                        ▲
         ┌──────────────────────────────┼──────────────────────────────┐
         │                              │                              │
   Odoo lab A                     Odoo stinger B                 Odoo prod C
   (tenant core)                  (tenant sarl-la-platine)       (tenant xyz)
   source: odoo.lab.core          source: odoo.stinger.sarl-...  source: odoo.prod.xyz
   token DVIG: dédié core        token DVIG: dédié sarl-...     token DVIG: dédié xyz
```

- **Une seule URL DVIG** et **une seule URL Vault** (ex. `dvig.doreviateam.com`, `vault.doreviateam.com` ou `dvig.central.doreviateam.com`).
- Chaque instance Odoo a sa **source** (`odoo.<env>.<tenant>`) et son **token DVIG** (enregistré dans le fichier de tokens du DVIG central).
- **Un seul** `dorevia.dvig.internal.token` pour toutes les Odoos qui déclenchent le worker du DVIG central (même valeur dans le compose DVIG central et dans chaque Odoo).

---

## 3. Étapes pour créer le Vault central (une fois)

### 3.1 Décider du tenant / projet Docker

Deux options :

- **Option A** : Créer un tenant dédié **`central`** (recommandé).  
  - Manifest : `tenants/central/state/manifest.json` avec `tenant_id: "central"`, `units.platform: ["dvig", "vault"]`, etc.  
  - Conteneurs : `dvig-central`, `vault-central`, `dvig-db-central`, `vault-db-central`.  
  - URLs : ex. `dvig.central.doreviateam.com`, `vault.central.doreviateam.com`.

- **Option B** : Réutiliser une stack existante (ex. **core-stinger**) comme « central » pour toutes les nouvelles instances.  
  - Pas de nouveau tenant ; toutes les Odoos pointent déjà vers `dvig.core-stinger.doreviateam.com` et `vault.core-stinger.doreviateam.com`.  
  - À documenter clairement pour éviter de recréer des stacks par tenant.

On suppose **Option A** ci-dessous (tenant `central`).

### 3.2 Créer le tenant et le manifest

```bash
mkdir -p /opt/dorevia-plateform/tenants/central/state
mkdir -p /opt/dorevia-plateform/tenants/central/secrets
```

Créer `tenants/central/state/manifest.json` (sur le modèle de `tenants/core/state/manifest.json`) avec par exemple :

- `tenant_id`: `"central"`
- `environments`: `["lab", "stinger", "prod"]` (ou selon besoin)
- `units.platform`: `["dvig", "vault"]`
- `images.dvig`, `images.vault` : versions souhaitées

### 3.3 Générer et démarrer la platform central

```bash
cd /opt/dorevia-plateform
./bin/dorevia.sh render central --env lab
./bin/dorevia.sh platform up central
```

(Vous pouvez choisir un autre `env` pour le premier déploiement, ex. `stinger` si le central sert d’abord le stinger.)

### 3.4 Appliquer la migration outbox sur la base DVIG central

```bash
PGPASSWORD=dvig_password docker exec -i dvig-db-central psql -U dvig_user -d dvig_db < sources/dvig/migrations/006_create_outbox_events.sql
```

### 3.5 Configurer la gateway (Caddyfile)

Ajouter les blocs pour le DVIG et le Vault **central** :

```caddy
dvig.central.doreviateam.com {
  reverse_proxy dvig-central:8080
}
vault.central.doreviateam.com {
  reverse_proxy vault-central:8080
}
```

Recharger Caddy. Vérifier :

```bash
curl -s -o /dev/null -w "%{http_code}" https://dvig.central.doreviateam.com/health
curl -s -o /dev/null -w "%{http_code}" https://vault.central.doreviateam.com/health
```

### 3.6 Fichier de tokens DVIG central

Le fichier **`tenants/central/secrets/dvig.tokens.yml`** contiendra **un token par tenant** (une entrée par future instance Odoo). Au départ, vous pouvez n’y mettre aucun token et les ajouter au fur et à mesure des branchements (voir § 4).

### 3.7 Token interne DVIG central

Dans le compose rendu, la variable **`DVIG_INTERNAL_TOKEN`** a pour défaut `dvig_internal_central_lab` (ou selon env). **Noter cette valeur** : toutes les instances Odoo branchées au central devront avoir `dorevia.dvig.internal.token` = cette même valeur.

### 3.8 JWT Vault central

Obtenir **un** JWT valide pour le Vault central (procédure ou équipe plateforme). Ce JWT sera utilisé comme `dorevia.vault.token` sur **toutes** les instances Odoo branchées au central (sauf si vous mettez en place des JWT par tenant côté Vault).

---

## 4. Brancher une nouvelle instance Odoo au Vault central

Pour **chaque** nouvelle instance Odoo à connecter au central :

### 4.1 Côté DVIG central : ajouter un token pour le tenant

Sur la machine dépôt :

```bash
cd /opt/dorevia-plateform/sources/dvig
python -m dvig.cli.token_gen --tenant <TENANT> --univers odoo --output token
python -m dvig.cli.token_gen --tenant <TENANT> --univers odoo --output yaml
```

Remplacer `<TENANT>` par l’identifiant du tenant de cette Odoo (ex. `core`, `sarl-la-platine`, `nouveau-client`).  
Ajouter le bloc YAML dans **`tenants/central/secrets/dvig.tokens.yml`** (section `tokens:`).  
Recharger le DVIG central :

```bash
docker restart dvig-central
```

### 4.2 Côté Odoo : paramètres système

Sur l’instance Odoo : **Paramètres → Technique → Paramètres système**.  
Utiliser **les URLs du Vault central** et le **token interne central** :

| Clé | Valeur (exemple pour central) |
|-----|-------------------------------|
| `dorevia.dvig.url` | `https://dvig.central.doreviateam.com` |
| `dorevia.vault.url` | `https://vault.central.doreviateam.com` |
| `dorevia.dvig.source` | `odoo.<env>.<tenant>` (ex. `odoo.lab.core`, `odoo.stinger.nouveau-client`) |
| `dorevia.dvig.token` | Valeur `TOKEN=...` générée pour ce tenant (§ 4.1) |
| `dorevia.dvig.internal.token` | **Même valeur que `DVIG_INTERNAL_TOKEN`** du DVIG central (ex. `dvig_internal_central_lab`) |
| `dorevia.vault.token` | JWT du Vault central (§ 3.8) |

Optionnel : `dorevia.vault.max_attempts_proof`, `dorevia.vault.max_age_pending_proof_hours`, `dorevia.debug.actions`.

### 4.3 Vérification

Créer et valider une facture sur cette Odoo ; vérifier que le statut passe à **Protégée** (section Sécurité de la facture). En cas de blocage : « Dernière erreur » + dépannage de la procédure générale (`procédure_branchement_odoo_vault.md`).

---

## 5. Checklist : création du Vault central (une fois)

- [ ] Décider du tenant central (ex. `central`) et créer `tenants/central/state/manifest.json`
- [ ] `dorevia.sh render central --env <env>` puis `dorevia.sh platform up central`
- [ ] Migration 006 appliquée sur `dvig-db-central`
- [ ] Caddyfile : `dvig.central.doreviateam.com` → `dvig-central:8080`, `vault.central.doreviateam.com` → `vault-central:8080`
- [ ] Noter `DVIG_INTERNAL_TOKEN` du compose central (ex. `dvig_internal_central_lab`)
- [ ] Obtenir le JWT Vault central et le documenter (sécurisé)
- [ ] Créer / maintenir `tenants/central/secrets/dvig.tokens.yml` (vide au départ, puis un bloc par tenant branché)

---

## 6. Checklist : branchement d’une nouvelle Odoo au central

- [ ] Générer token DVIG pour le tenant : `token_gen --tenant <tenant> --univers odoo`
- [ ] Ajouter le bloc YAML dans `tenants/central/secrets/dvig.tokens.yml`
- [ ] Redémarrer DVIG central : `docker restart dvig-central`
- [ ] Sur Odoo : `dorevia.dvig.url` et `dorevia.vault.url` = URLs **central**
- [ ] Sur Odoo : `dorevia.dvig.source` = `odoo.<env>.<tenant>`, `dorevia.dvig.token` = token de ce tenant, `dorevia.dvig.internal.token` = token interne central, `dorevia.vault.token` = JWT central
- [ ] Tester : facture validée → statut **Protégée**

---

## 7. Références

- **procédure_branchement_odoo_vault.md** — Procédure détaillée (flux, prérequis, dépannage)
- **PROCEDURE_BRANCHEMENT_ODOO_DOREVIA_VAULT.md** — Procédure générique
- **lib/render/render_platform_compose.sh** — Génération du compose platform (DVIG, dvig-db, Vault, token interne)

---

*Document ZeDocs/web11. Vault central = une stack DVIG + Vault pour toutes les instances Odoo ; branchement = ajout d’un token par tenant dans le DVIG central + paramètres Odoo vers les URLs centrales.*
