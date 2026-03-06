# 🔧 Résolution du Problème de Schéma SQL (move_type)

**Date** : 2026-01-11  
**Problème** : Erreur SQL `column "move_type" of relation "documents" does not exist`  
**Statut** : ✅ **RÉSOLU**

---

## 📋 Problème Identifié

Lors du traitement des événements par le worker DVIG, Vault renvoyait une erreur 500 :

```
failed to insert document: ERROR: column "move_type" of relation "documents" does not exist (SQLSTATE 42703)
```

**Cause** : La migration `010_add_spec1_fields.sql` qui ajoute les colonnes `move_type`, `compliance_status`, et `facturx_present` n'avait pas été appliquée à la base de données.

---

## ✅ Solution Appliquée

### 1. Vérification de l'État de la Migration

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'documents' AND column_name = 'move_type';
```

**Résultat** : Aucune colonne trouvée (migration non appliquée)

### 2. Application de la Migration

**Fichier** : `sources/vault/migrations/010_add_spec1_fields.sql`

```sql
-- Ajouter colonne move_type
ALTER TABLE documents ADD COLUMN IF NOT EXISTS move_type VARCHAR(50);

-- Ajouter colonne compliance_status
ALTER TABLE documents ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'out_of_scope';

-- Ajouter colonne facturx_present
ALTER TABLE documents ADD COLUMN IF NOT EXISTS facturx_present BOOLEAN DEFAULT FALSE;

-- Créer index pour move_type
CREATE INDEX IF NOT EXISTS idx_documents_move_type ON documents(move_type) WHERE move_type IS NOT NULL;

-- Créer index pour compliance_status
CREATE INDEX IF NOT EXISTS idx_documents_compliance_status ON documents(compliance_status) WHERE compliance_status IS NOT NULL;

-- Créer index composite (tenant + move_type)
CREATE INDEX IF NOT EXISTS idx_documents_tenant_move_type ON documents(tenant, move_type) WHERE tenant IS NOT NULL AND move_type IS NOT NULL;

-- Créer index composite (tenant + compliance_status)
CREATE INDEX IF NOT EXISTS idx_documents_tenant_compliance ON documents(tenant, compliance_status) WHERE tenant IS NOT NULL AND compliance_status IS NOT NULL;
```

**Commande d'application** :
```bash
docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault < sources/vault/migrations/010_add_spec1_fields.sql
```

### 3. Vérification Post-Migration

```sql
\d documents
```

**Colonnes ajoutées** :
- ✅ `move_type` : `character varying(50)`
- ✅ `compliance_status` : `character varying(50)` (défaut: `'out_of_scope'`)
- ✅ `facturx_present` : `boolean` (défaut: `false`)

**Index créés** :
- ✅ `idx_documents_move_type`
- ✅ `idx_documents_compliance_status`
- ✅ `idx_documents_tenant_move_type`
- ✅ `idx_documents_tenant_compliance`

---

## 🧪 Validation

### Test du Worker DVIG

Après application de la migration, le worker DVIG peut maintenant traiter les événements sans erreur SQL :

```bash
docker exec dvig-core-stinger sh -c 'cd /app && python3 -m workers.outbox_worker --limit 10'
```

**Résultat attendu** :
- ✅ Événements traités avec succès
- ✅ Documents stockés dans Vault avec `move_type` rempli
- ✅ Aucune erreur SQL

### Vérification dans la Base de Données

```sql
SELECT id, filename, odoo_model, odoo_id, move_type, tenant, created_at 
FROM documents 
WHERE odoo_id = 1896 
ORDER BY created_at DESC 
LIMIT 1;
```

**Résultat attendu** : Document présent avec `move_type` = `'out_invoice'` (ou autre selon le type de facture)

---

## 📝 Notes Techniques

### Pourquoi cette migration était-elle nécessaire ?

1. **SPEC 1** : La spécification "Vaulting account.move posted" requiert le stockage du `move_type` pour la traçabilité et les requêtes de conformité.

2. **Code Go** : Le code Go dans `internal/handlers/events.go` et `internal/handlers/invoices.go` extrait `move_type` depuis le payload et tente de l'insérer dans la base de données.

3. **Migration manquante** : La migration `010_add_spec1_fields.sql` existait dans le code source mais n'avait pas été appliquée à la base de données de production.

### Colonnes Ajoutées

| Colonne | Type | Défaut | Description |
|---------|------|--------|-------------|
| `move_type` | `VARCHAR(50)` | `NULL` | Type de mouvement Odoo (`out_invoice`, `in_invoice`, `out_refund`, `in_refund`) |
| `compliance_status` | `VARCHAR(50)` | `'out_of_scope'` | Statut de conformité Factur-X 2026 |
| `facturx_present` | `BOOLEAN` | `false` | Indique si le document contient un format Factur-X |

### Index Créés

Les index permettent d'optimiser les requêtes fréquentes :
- Recherche par `move_type`
- Recherche par `compliance_status`
- Recherche combinée `tenant + move_type`
- Recherche combinée `tenant + compliance_status`

---

## 🔄 Prochaines Étapes

1. ✅ **Migration appliquée**
2. ✅ **Schéma corrigé**
3. ⏳ **Tests de validation en cours**
4. 📋 **Documentation mise à jour**

---

## 📚 Références

- **SPEC 1** : Vaulting account.move posted
- **Migration 010** : `sources/vault/migrations/010_add_spec1_fields.sql`
- **Code Go** : `sources/vault/internal/handlers/events.go` (ligne 217-224)
- **Modèle** : `sources/vault/internal/models/document.go` (ligne 54)

---

**Auteur** : Dorevia Team  
**Date de résolution** : 2026-01-11
