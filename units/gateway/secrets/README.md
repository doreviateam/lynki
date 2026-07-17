# Secrets gateway Caddy (hors Git)

## CK préprod — Option B

| Élément | Valeur |
|---|---|
| Fichier hôte | `units/gateway/secrets/ck-preprod-bo-basicauth.caddy` |
| Chemin conteneur | `/etc/caddy/secrets/ck-preprod-bo-basicauth.caddy` |
| Montage | fichier unique, `:ro` |
| Utilisateur conteneur | `root` (image `caddy:2`) |
| Permissions minimales | `0400` (ou `0440`) — jamais world-writable / `0644` |

Contenu attendu (exemple de forme, **pas** de secret réel) :

```caddyfile
basic_auth @ck_bo_surface {
	<user> $<bcrypt-or-argon2-hash>
}
```

### Comportement si fichier absent

- `docker compose up` / recreate peut échouer (bind mount fichier manquant).
- `install-preprod-caddy.sh --apply` refuse (secret introuvable).
- Les autres virtual hosts du `Caddyfile` ne sont pas modifiés par ce montage.

### Retrait du montage

1. Retirer la ligne de volume dans `docker-compose.yml`.
2. Recréer le service `caddy` (mandat ops distinct).
3. Restaurer le profil P4 deny côté CK si besoin (`--restore-p4`).
