# 🌐 Runbook Domaines Clients — Phase 3

**Version** : 1.0  
**Date** : 2026-01-02  
**Phase** : Phase 3 "Domaines & Serveurs Clients"

---

## Vue d'Ensemble

Ce document décrit les processus opérationnels pour la gestion des domaines clients dans la plateforme Dorevia.

---

## 1. Configuration Domaine Client

### 1.1 Via `prompt`

```bash
dorevia.sh prompt <tenant> --env prod
```

**Étapes** :
1. Sélectionner mode "Client" ou "Hybride"
2. Saisir domaine client (ex: `rozas.gp`)
3. Confirmer fallback `doreviateam.com` (recommandé)
4. Configurer alias optionnels

**Résultat** :
- Fichier `intent-*.json` avec configuration domaines
- Manifest mis à jour

### 1.2 Configuration Manuelle

Éditer `tenants/<tenant>/state/manifest.json` :

```json
{
  "domains": {
    "canonical": "rozas.gp",
    "fallback": {
      "enabled": true,
      "domain": "doreviateam.com"
    },
    "aliases": {
      "global": ["api.rozas.gp"],
      "odoo": ["erp.rozas.gp"]
    }
  }
}
```

---

## 2. Génération Caddyfile

```bash
dorevia.sh render <tenant> --env prod
```

**Résultat** :
- Caddyfile avec hostnames : `canonique, fallback, alias1, alias2 { ... }`
- Format multi-hostname supporté par Caddy

---

## 3. Validation DNS

```bash
dorevia.sh preflight <tenant> --env prod --check-dns
```

**Vérifications** :
- Résolution DNS pour tous les hostnames
- Cohérence IP (même IP pour tous)
- TTL acceptable

**Action en cas d'échec** :
- Corriger enregistrements DNS
- Relancer validation

---

## 4. Certificats SSL

Les certificats SSL sont obtenus automatiquement par Caddy via Let's Encrypt.

**Prérequis** :
- DNS propagé
- Ports 80/443 ouverts
- Caddy accessible depuis Internet

**Vérification** :
```bash
dorevia.sh gateway status
```

**Troubleshooting** :
Voir `RUNBOOK_CERTIFICATS_SSL_PHASE3.md`

---

## 5. Checklist Opérationnelle

### Avant Déploiement

- [ ] Domaine client configuré dans manifest
- [ ] DNS propagé (validation `--check-dns` OK)
- [ ] Ports 80/443 ouverts
- [ ] Caddyfile généré avec domaines clients

### Après Déploiement

- [ ] Certificats SSL obtenus
- [ ] URLs accessibles (canonique + fallback)
- [ ] Alias fonctionnels (si configurés)
- [ ] Healthchecks OK

---

## 6. Troubleshooting

### Problème : Certificat SSL non obtenu

**Causes possibles** :
- DNS non propagé
- Ports 80/443 fermés
- Caddy non accessible depuis Internet

**Solution** :
1. Vérifier DNS : `dorevia.sh preflight <tenant> --env prod --check-dns`
2. Vérifier ports : `netstat -tulpn | grep -E ':(80|443)'`
3. Vérifier logs Caddy : `docker logs caddy`

### Problème : Alias non accessibles

**Causes possibles** :
- Alias non dans Caddyfile
- DNS alias non configuré

**Solution** :
1. Vérifier Caddyfile : `grep alias tenants/<tenant>/rendered/prod/caddy/Caddyfile`
2. Vérifier DNS alias : `dig <alias_hostname>`
3. Régénérer Caddyfile : `dorevia.sh render <tenant> --env prod`

---

**Dernière mise à jour** : 2026-01-02

