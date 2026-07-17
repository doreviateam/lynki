# CK Option B — montage secret basic_auth (gateway mutualisée)

## Dépôt / branche

| Champ | Valeur |
|---|---|
| Dépôt | `doreviateam/lynki` |
| Worktree local | `/Users/doreviateam/Desktop/lynki_gateway_option_b_worktree` |
| Branche | `feat/gateway-restore-odoo19-network` (correctif réseaux) · historique Option B : `feat/ck-option-b-bo-secret-mount` |
| Fichier Compose | `units/gateway/docker-compose.yml` |

## Montage

```text
hôte:  ./secrets/ck-preprod-bo-basicauth.caddy
       (absolu: /opt/dorevia-plateform/units/gateway/secrets/ck-preprod-bo-basicauth.caddy)
conteneur: /etc/caddy/secrets/ck-preprod-bo-basicauth.caddy
mode: read-only
```

## Réseaux

La gateway mutualisée reste attachée à :

```text
dorevia-network          (external)
odoo19 → odoo-19_default (external, name: odoo-19_default)
```

Le réseau `odoo19` est requis pour préserver l’attachement live historique (ex. stacks demo Odoo 19). Ne pas le retirer lors d’un sync Compose.

## Impact autres vhosts

Aucun sur le Caddyfile — volume secret fichier unique + conservation des deux réseaux externes.

## Validation gateway (future, hors cette passe)

```bash
cd /opt/dorevia-plateform/units/gateway
# après création du secret réel + merge/deploy compose
docker compose config
docker exec gateway-caddy ls -l /etc/caddy/secrets/ck-preprod-bo-basicauth.caddy
docker exec gateway-caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

Aucun apply / recreate dans la passe de préparation CK.
