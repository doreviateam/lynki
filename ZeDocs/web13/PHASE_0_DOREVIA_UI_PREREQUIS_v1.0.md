# PHASE_0\_DOREVIA_UI_PREREQUIS_v1.0

Tenant cible : sarl-la-platine

## Objectif

Préparer proprement Dorevia-UI avant toute construction de cards : -
Vérifier les prérequis techniques - Valider la disponibilité des données
Vault - Décider l'architecture de l'API Dorevia-UI

------------------------------------------------------------------------

## 1. Checklist prérequis

### A) Infrastructure

-   [ ] Appsmith opérationnel (unit appsmith)
-   [ ] Volumes persistants OK
-   [ ] Gateway Caddy active
-   [ ] URL UI disponible :
    https://ui.lab.core.doreviateam.com et
    https://ui.lab.sarl-la-platine.doreviateam.com
-   [ ] HTTPS fonctionnel

**Activer les URLs UI (sur le serveur)** : après déploiement du repo, exécuter sur la machine où tourne la gateway :
`./bin/dorevia.sh gateway aggregate --reload`
Cela agrège les Caddyfiles rendus (dont les blocs `ui.lab.<tenant>.doreviateam.com`) dans le Caddyfile global et recharge Caddy. Let's Encrypt délivre alors les certificats pour ces hostnames ; les URLs répondent en HTTPS une fois les conteneurs Appsmith démarrés.

**Vérifications locales (avant déploiement)** :
- `./bin/dorevia.sh render core --env lab` et `./bin/dorevia.sh render sarl-la-platine --env lab` → OK
- `./bin/dorevia.sh gateway aggregate` → Caddyfile global dans `units/gateway/Caddyfile` contient les blocs `ui.lab.core` et `ui.lab.sarl-la-platine`
- Validation Caddy : `docker run --rm -v $(pwd)/units/gateway/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2 caddy validate --config /etc/caddy/Caddyfile` → "Valid configuration"

### B) Données Vault

-   [ ] Événements `invoice.posted` présents pour sarl-la-platine
-   [ ] Champs requis disponibles :
    -   tenant_id
    -   event_type
    -   occurred_at
    -   amount_total
    -   currency
    -   scale
-   [ ] Convention paiements validée : `payment.posted`

### C) Sécurité

-   [ ] API UI en lecture seule
-   [ ] Token tenant-scoped
-   [ ] Aucun accès direct Appsmith → DB Vault
-   [ ] Signup Appsmith contrôlé
-   [ ] Secrets hors git

### D) Contrat API minimal

Endpoint attendu :

GET /ui/aggregations\
Paramètres : - scope - date_debut - date_fin - granularity (day \| week
\| month)

------------------------------------------------------------------------

## 2. Décision d'architecture API

### Option retenue : Service dédié Dorevia-UI API

Motifs : - séparation claire des responsabilités - sécurité renforcée -
évolutivité (POS, logistique, futurs usages) - respect de la philosophie
Vault = source de vérité

Structure proposée :

units/dorevia-ui-api/

Service read-only consommant Vault et exposant les endpoints UI.

------------------------------------------------------------------------

## 3. Livrable Phase 0 (Definition of Done)

-   [ ] API Dorevia-UI déployée (service dédié)
-   [ ] Endpoint `/ui/aggregations` accessible pour sarl-la-platine
-   [ ] Appsmith consomme l'API
-   [ ] Première card "Ventes certifiées" affichée

------------------------------------------------------------------------

## 4. Suite logique

Phase 1 : - Card Ventes certifiées - filtres période - granularité
temporelle

Puis : - impayés - ratios - cash brut - cash net

------------------------------------------------------------------------

Version : v1.0
