# Backfill company_id sur les documents Vault (legacy)

**Contexte** : Les documents existants ont `company_id` NULL. Pour que le filtre Company Linky affiche des options, on peut mettre à jour ces enregistrements.

**Format normatif** (SPEC_VAULT_LINKY_COMPANY v1.1) : `company_id` = `<source_system>:<source_company_id>`, ex. `odoo:1`.

---

## Option 1 — Un seul company par tenant (recommandé si applicable)

Si tous les documents du tenant appartiennent à une seule société (ex. Odoo company_id = 1) :

```sql
-- Exemple : tenant sarl-la-platine, société Odoo = 1
UPDATE documents
SET company_id = 'odoo:1'
WHERE tenant = 'sarl-la-platine'
  AND (company_id IS NULL OR company_id = '');
```

À exécuter sur la base **vault** (conteneur `vault-db-core-stinger` ou équivalent) :

```bash
docker exec -i vault-db-core-stinger psql -U vault -d dorevia_vault -c "
UPDATE documents
SET company_id = 'odoo:1'
WHERE tenant = 'sarl-la-platine'
  AND (company_id IS NULL OR company_id = '');
"
```

Vérifier le nombre de lignes mises à jour, puis recharger Linky : le sélecteur Company doit afficher « Tout » + une option (ex. `odoo:1 (30)`).

---

## Option 2 — Dériver company_id depuis le payload (si disponible)

Si le champ `payload_json` (ou les métadonnées stockées) contient une info de société (ex. `company_id` ou `company_id.id`), un script peut :

1. Lire les documents avec `company_id IS NULL`
2. Parser le JSON et extraire la company
3. Mettre à jour `company_id` au format normatif

À implémenter selon la structure réelle du payload (Odoo/DVIG).

---

## Option 3 — Nouveaux enregistrements uniquement (US-V2)

Sans toucher au legacy : s’assurer que **tous les nouveaux events** (DVIG → Vault) envoient `company_id` dans le payload. Le handler `events.go` lit déjà `payload.Payload["company_id"]`. Côté Odoo/DVIG : envoyer ce champ au format `<source_system>:<source_company_id>` pour chaque event.

Les anciens documents restent sans company ; le sélecteur ne les inclura qu’après backfill (option 1 ou 2).

---

## Vérification après backfill

```bash
# Depuis l’hôte (ou un conteneur sur le même réseau)
curl -s "http://vault-core-stinger:8080/ui/companies?tenant=sarl-la-platine"
# Attendu : [{"company_id":"odoo:1","documents_count":30}] (ou équivalent)
```
