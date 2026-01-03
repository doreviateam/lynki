# 📋 Structure Domaines — Phase 3

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"

---

## Structure `domains` dans manifest.json

### Format

```json
{
  "domains": {
    "canonical": "<domain>",
    "aliases": {
      "global": ["<alias1>", "<alias2>"],
      "odoo": ["<alias-odoo>"],
      "dvig": ["<alias-dvig>"],
      "vault": ["<alias-vault>"]
    },
    "fallback": true
  }
}
```

### Règles Normatives

1. **Domaine canonique** :
   - Mode SaaS : `doreviateam.com` (canonique)
   - Mode Client : domaine client (canonique) + fallback obligatoire

2. **Alias** :
   - Un alias ne peut appartenir qu'à un seul scope
   - Priorité : alias par service > alias global
   - Collision = erreur bloquante

3. **Fallback** :
   - Mode SaaS : `fallback: false` (domaine client = alias uniquement)
   - Mode Client : `fallback: true` (obligatoire)

---

## Exemples

### Exemple 1 : Mode SaaS (domaine client en alias)

```json
{
  "domain_mode": "saas",
  "domains": {
    "canonical": "doreviateam.com",
    "aliases": {
      "global": ["erp.rozas.gp"]
    },
    "fallback": false
  }
}
```

### Exemple 2 : Mode Client (domaine client canonique)

```json
{
  "domain_mode": "client",
  "domains": {
    "canonical": "rozas.gp",
    "aliases": {
      "global": ["erp.rozas.gp"],
      "odoo": ["crm.rozas.gp"],
      "dvig": ["api.rozas.gp"]
    },
    "fallback": true
  }
}
```

---

**Dernière mise à jour** : 2026-01-02
