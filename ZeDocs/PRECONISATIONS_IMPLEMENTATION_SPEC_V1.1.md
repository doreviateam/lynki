# 📘 Préconisations d'Implémentation — SPEC v1.1 (server-driven PROD)

**Version** : v1.0  
**Date** : 2025-01-29 (Europe/Paris)  
**Base** : Rapport "Analyse d'Impact — Spécification v1.1" (synthèse appliquée)  
**Statut** : Préconisations validées — Prêt à implémenter

---

## 0) Positionnement (sans refonte)

La SPEC v1.1 est **compatible** avec l'existant : elle demande des **ajouts fonctionnels** (workflow + manifest + multi-domaine PROD), pas une refonte d'architecture.

**Principe de pilotage** :
- V1.1 = "LAB + STINGER chez Doreviateam" + "PROD décidée au Go/No-Go STINGER"
- Tout ce qui est "intention/exécution", "manifest complet", "render full infra" = vNext

---

## 1) Décision de simplification à acter (important)

### 1.1 "Site" = "serveur"

Pour éviter une couche conceptuelle inutile :
- **1 serveur = 1 gateway Caddy**
- Le "site" devient une propriété **documentaire** dans le manifest (qui héberge quoi), pas un composant logiciel supplémentaire.

✅ **Conséquence** : pas besoin de `gateway-caddy-client-<tenant>` côté Doreviateam, seulement une gateway sur chaque serveur.

**Implémentation** :
- Chaque serveur a sa propre gateway Caddy
- Pas de notion explicite de "site" dans le code
- Manifest documente où sont hébergés les environnements

---

## 2) Ajout minimal : enrichissement `manifest.json`

### 2.1 Schéma minimal recommandé

**Fichier** : `tenants/<tenant>/state/manifest.json`

```json
{
  "tenant": "rozas",
  "base_domain": "doreviateam.com",
  "enabled_envs": ["lab", "stinger"],
  "prod": {
    "target": "unknown",
    "server_name": null,
    "public_ip": null,
    "base_domain": null,
    "dns_aliases": []
  },
  "servers": {
    "doreviateam": {
      "server_name": "cmh-projects",
      "public_ip": "x.x.x.x",
      "environments": ["lab", "stinger"]
    },
    "client": {
      "server_name": null,
      "public_ip": null,
      "environments": ["prod"]
    }
  },
  "images": {
    "dvig": "dorevia/dvig:0.1.2-auth",
    "vault": "dorevia/vault:v1.3.0",
    "odoo": "odoo:18.0"
  }
}
```

### 2.2 Migration des tenants existants

**Tenants à migrer** : `core`, `dido`, `rozas`

**Valeurs par défaut** :
- `base_domain = "doreviateam.com"`
- `enabled_envs = ["lab", "stinger"]` (si PROD non déployée)
- `prod.target = "unknown"`
- `servers.doreviateam` : Renseigner avec serveur actuel
- `servers.client` : Laisser null (sera renseigné au Go/No-Go PROD)

**Action** : Script de migration ou migration manuelle

---

## 3) Workflow à documenter + (option) à automatiser

### 3.1 DoD "STINGER Ready" (à rendre non négociable)

**Checklist** :
- [ ] STINGER sur **image taggée** (pas `latest`)
- [ ] Vault persistant : volumes montés + test `--force-recreate` sans perte
- [ ] URLs OK (odoo stinger + dvig/vault)
- [ ] Tokens : mismatch refusés (validation source/token)
- [ ] Healthcheck : tous les services répondent (`/health` ou `/web/login`)

**Documentation** : `docs/Checklist_STINGER_Ready.md`

### 3.2 Go/No-Go PROD : check-list "PROD Ready"

**Checklist** :
- [ ] `prod.target` renseigné (`doreviateam` / `client` / `hybrid`)
- [ ] Serveur accessible (si `client`) : SSH, ports 22/80/443
- [ ] DNS OK + TLS OK : domaines propagés, certificats obtenus
- [ ] Backup STINGER effectué (minimum) et plan de backup PROD validé
- [ ] Images taggées (pas `latest`)
- [ ] Vault persistant configuré (volumes)

**Documentation** : `docs/Checklist_PROD_Ready.md`

### 3.3 Commande d'aide (optionnel v1.1)

Sans changer l'architecture, ajouter 2 commandes "audit" :
- `dorevia.sh workflow stinger-ready <tenant>`
- `dorevia.sh workflow prod-ready <tenant>`

**Fonctionnement** :
- Ces commandes ne déploient rien : elles **vérifient** et sortent un rapport
- Retour : liste des critères OK/KO avec détails

**Implémentation** :
```bash
cmd_workflow_stinger_ready() {
  local tenant="$1"
  # Vérifier image taggée
  # Vérifier volumes Vault
  # Vérifier URLs
  # Vérifier tokens
  # Afficher rapport
}
```

---

## 4) Support des domaines clients (PROD) : action prioritaire

### 4.1 Caddy : alias multi-domaines

**Objectif** : Supporter un domaine client **en plus** du fallback Doreviateam.

**Exemple** :
```caddy
odoo.prod.rozas.doreviateam.com, odoo.prod.rozas.rozas.gp {
  reverse_proxy odoo_prod_rozas:8069
}

dvig.rozas.doreviateam.com, dvig.rozas.rozas.gp {
  reverse_proxy dvig-rozas:8080
}

vault.rozas.doreviateam.com, vault.rozas.rozas.gp {
  reverse_proxy vault-rozas:8080
}
```

### 4.2 Où stocker les alias ?

Dans `manifest.json` :
- `prod.base_domain = "rozas.gp"` (domaine client principal)
- `prod.dns_aliases = ["rozas.gp"]` (liste des alias)
- Règle : alias appliqués **uniquement en PROD**

### 4.3 Stratégie TLS

**Caddy gère multi-domaines automatiquement**, mais prévoir :
- Validation DNS avant de "promouvoir" le domaine client
- Plan B : garder le fallback `*.doreviateam.com` tant que contractuellement OK

**Implémentation** :
1. Lire `manifest.json` pour extraire alias PROD
2. Générer Caddyfile avec alias (manuel ou via `gateway render`)
3. Validation DNS avant déploiement

---

## 5) PROD sur serveur client : ce que tu supportes (v1.1)

### 5.1 Données minimales à obtenir

- IP publique
- Accès SSH (clé) + user sudo
- Domaine + gestion DNS (chez qui)
- Ports : 22, 80, 443

### 5.2 Règle d'architecture (simple)

**En PROD, sur un serveur client** :
- Gateway (Caddy) sur ce serveur
- DVIG + Vault + Odoo PROD sur ce serveur
- Patch persistance Vault **obligatoire** (volumes)

✅ **Avantage** : responsabilités claires, pas de dépendance inter-site.

### 5.3 Processus de déploiement

**Sur le serveur client** :
1. Prérequis : Docker, Docker Compose, réseau `dorevia-network`
2. `gateway up` (Caddy sur serveur client)
3. `platform up <tenant>` (DVIG/Vault + volumes persistants)
4. `token issue odoo prod <tenant>`
5. `app up odoo prod <tenant>`
6. Tests : healthcheck + login + persistance (force-recreate)

**Documentation** : `docs/Guide_Deploiement_Prod_Serveur_Client.md`

---

## 6) Backup/Restore : décomposition pragmatique

### 6.1 Pré-prod (Doreviateam)

- Backups "sécurité" (surtout STINGER)
- Restore testé sur une sandbox (au moins 1 fois)

### 6.2 PROD (client)

- Backups réguliers (cron) : Odoo DB + filestore + Vault DB + volumes Vault
- Restore testé (procédure signée)

> **Règle d'or** : Un backup n'est valide que si un restore a été déjà testé.

**Implémentation** : Finaliser Phase 6 (scripts backup/restore)

---

## 7) Plan d'implémentation (ordre conseillé)

### Sprint A — Manifest + Docs (1–2 jours)

**Tâches** :
1. Enrichir manifests (`core`, `dido`, `rozas`)
2. Documenter "STINGER Ready" + "PROD Ready"
3. Ajouter pages "PROD serveur client" (procédure)

**Livrables** :
- `tenants/*/state/manifest.json` enrichis
- `docs/Checklist_STINGER_Ready.md`
- `docs/Checklist_PROD_Ready.md`
- `docs/Guide_Deploiement_Prod_Serveur_Client.md`

### Sprint B — Domaines clients (1–2 jours)

**Tâches** :
1. Ajouter support alias multi-domaines dans Caddy (PROD)
2. Checklist "DNS OK"
3. (option) `gateway render` basé sur manifest

**Livrables** :
- Caddyfile avec alias (exemple pour tenant avec domaine client)
- `docs/Guide_Configuration_Domaine_Client.md`
- Script validation DNS (optionnel)

### Sprint C — Backup/Restore PROD (Phase 6) (2–4 jours)

**Tâches** :
1. Finaliser scripts backup/restore (incluant volumes Vault)
2. Exécuter un restore complet sur sandbox (preuve)
3. Documenter procédure et critères d'acceptation

**Livrables** :
- Scripts `backup.sh` et `restore.sh` (Phase 6)
- Documentation backup/restore PROD
- Preuve restore testé (log + validation)

### Sprint D — Commandes workflow (optionnel) (1–2 jours)

**Tâches** :
1. Implémenter `dorevia.sh workflow stinger-ready <tenant>`
2. Implémenter `dorevia.sh workflow prod-ready <tenant>`

**Livrables** :
- Commandes workflow dans `dorevia.sh`
- Documentation utilisation

---

## 8) Ce que tu n'implémentes pas en v1.1 (à noter explicitement)

- ❌ Déploiement remote automatique via SSH (possible plus tard)
- ❌ "Promotion" automatisée depuis STINGER vers PROD (au sens CI/CD)
- ❌ "Manifest complet" & logs intention/exécution façon v1.3
- ❌ Génération automatique complète Caddyfile (optionnel : `gateway render` basique)
- ❌ Gestion multi-sites complexe (simplifié : 1 serveur = 1 gateway)

---

## 9) Livrables "commit-ready"

### 9.1 Documents

- ✅ `docs/SPEC_Dorevia_Platform_LAB_STINGER_PROD_ServerDriven_v1.1.md` (déjà fourni)
- ✅ `docs/Preconisations_Implementation_SPEC_v1.1.md` (ce document)
- ⏳ `docs/Checklist_STINGER_Ready.md` (à créer)
- ⏳ `docs/Checklist_PROD_Ready.md` (à créer)
- ⏳ `docs/Guide_Deploiement_Prod_Serveur_Client.md` (à créer)
- ⏳ `docs/Guide_Configuration_Domaine_Client.md` (à créer)

### 9.2 Code/Configuration

- ⏳ `tenants/*/state/manifest.json` enrichis (à migrer)
- ⏳ Commandes workflow dans `dorevia.sh` (optionnel)
- ⏳ Scripts backup/restore (Phase 6)

### 9.3 Validation

- ⏳ Manifest enrichi pour tous les tenants
- ⏳ Checklist STINGER Ready validée sur au moins un tenant
- ⏳ Exemple Caddyfile avec alias domaine client
- ⏳ Restore testé (preuve)

---

## 10) Critères d'acceptation v1.1

### 10.1 Manifest

- [ ] Tous les tenants ont un `manifest.json` enrichi (structure v1.1)
- [ ] Valeurs par défaut correctes (`enabled_envs`, `prod.target = "unknown"`)
- [ ] Serveur Doreviateam renseigné

### 10.2 Documentation

- [ ] Checklist STINGER Ready documentée
- [ ] Checklist PROD Ready documentée
- [ ] Guide déploiement serveur client documenté
- [ ] Guide configuration domaine client documenté

### 10.3 Domaines clients

- [ ] Exemple Caddyfile avec alias (domaine client + fallback)
- [ ] Documentation processus DNS
- [ ] Validation DNS avant déploiement (checklist)

### 10.4 Backup/Restore

- [ ] Scripts backup/restore finalisés (Phase 6)
- [ ] Support volumes Vault dans backup
- [ ] Restore testé sur sandbox (preuve)

### 10.5 Workflow (optionnel)

- [ ] Commandes `workflow stinger-ready` et `workflow prod-ready` implémentées
- [ ] Documentation utilisation

---

## 11) Ordre d'exécution recommandé

### Étape 1 : Manifest (priorité haute)

1. Créer structure `manifest.json` v1.1
2. Migrer `core` (tenant de test)
3. Valider structure
4. Migrer `dido`, `rozas`

### Étape 2 : Documentation (priorité haute)

1. Créer `Checklist_STINGER_Ready.md`
2. Créer `Checklist_PROD_Ready.md`
3. Créer `Guide_Deploiement_Prod_Serveur_Client.md`
4. Créer `Guide_Configuration_Domaine_Client.md`

### Étape 3 : Domaines clients (priorité moyenne)

1. Exemple Caddyfile avec alias
2. Documentation processus
3. (Optionnel) `gateway render` basique

### Étape 4 : Backup/Restore (priorité moyenne)

1. Finaliser Phase 6
2. Tester restore sur sandbox
3. Documenter procédure

### Étape 5 : Commandes workflow (priorité basse, optionnel)

1. Implémenter `workflow stinger-ready`
2. Implémenter `workflow prod-ready`
3. Documenter utilisation

---

## 12) Notes importantes

### 12.1 Compatibilité ascendante

- Les commandes existantes (`platform up`, `app up`, etc.) restent identiques
- Les manifests enrichis sont rétrocompatibles (valeurs par défaut)
- Pas de breaking change

### 12.2 Approche progressive

- Implémentation par sprints (pas de big bang)
- Validation à chaque étape
- Documentation en parallèle

### 12.3 Focus v1.1

- **Stabilisation** : Pas de refonte
- **Opérationnel** : Workflow clair, documentation complète
- **Pragmatique** : Ajouts fonctionnels minimaux

---

## 13) Conclusion

Les préconisations v1.1 sont **pragmatiques** et **compatibles** avec l'existant. Elles demandent des **ajouts fonctionnels** (manifest, documentation, domaines clients) sans refonte majeure.

**Prochaines étapes** :
1. Enrichir manifests (Sprint A)
2. Documenter workflow (Sprint A)
3. Support domaines clients (Sprint B)
4. Finaliser backup/restore (Sprint C)
5. Commandes workflow (Sprint D, optionnel)

---

**Document généré le** : 2025-01-29  
**Version** : v1.0  
**Statut** : Préconisations validées — Prêt à implémenter

