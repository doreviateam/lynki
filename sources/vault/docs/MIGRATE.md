# Appliquer les migrations Vault

Les migrations SQL sont appliquées automatiquement au **démarrage du serveur** lorsque `DATABASE_URL` est défini : `storage.NewDB()` appelle `RunMigrations()`.

Pour appliquer les migrations **sans démarrer le serveur** (par ex. en CI ou avant un déploiement) :

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dorevia_vault?sslmode=disable"
go run ./cmd/vault migrate
```

Ou après build :

```bash
./vault migrate
```

La commande `migrate` ouvre la connexion (ce qui exécute toutes les migrations non encore appliquées), puis quitte. Les versions appliquées sont enregistrées dans la table `schema_migrations`.
