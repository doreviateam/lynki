# 🧱 DOREVIA — SPEC d’implémentation Phase 1 “Fondations” (v1.0)

**Statut :** Spécification d’implémentation (phase prioritaire)  
**Dépendance :** `SPEC_Dorevia_Reference_v2.0.md` (SPEC socle)  
**Audience :** Dev plateforme / Exploitation / AMOA technique  
**Objectif :** Aligner l’existant sur les invariants fondamentaux (config déclarative, génération, DNS/hostnames cohérents)

---

## 0. Rappel du pourquoi (une phrase)

Phase 1 vise à rendre la plateforme **cohérente avec ses propres principes** : une configuration déclarative complète et des artefacts générés de manière déterministe, avant tout enrichissement (alias, domaines clients, serveur client).

---

## 1. Portée de la Phase 1

### 1.1 Inclus (IN SCOPE)

1) **Configuration déclarative enrichie** (source de vérité)  
2) **Génération déterministe** des artefacts (Caddyfiles, compose, env files, etc.) à partir de la config  
3) **Normalisation des hostnames** (incluant `<env>` de façon cohérente)  
4) **Préflight technique** minimal (check non destructif) pour sécuriser l’exécution  
5) **Refactor `dorevia.sh`** : aucune décision implicite, uniquement lecture de config + génération/apply

### 1.2 Exclus (OUT OF SCOPE)

- CLI interactif complet (Phase 2)  
- Support complet des **domaines clients** (Phase 3)  
- Support **serveur client** (Phase 3)  
- Gestion avancée alias multi-services (Phase 3)  
- Audit bundle complet, backup/restore avancé (Phase 4)  
- Migration domain support `doreviateam.cmh-projects.fr` (hors sujet Phase 1)

---

## 2. Définition de “Fait” (Definition of Done)

La Phase 1 est considérée terminée si :

- une **config déclarative unique** décrit le tenant, les univers, les environnements, les domaines canoniques et les units activées
- tous les artefacts déployables sont **générés** depuis cette config (pas de logique hardcodée côté scripts)
- l’exécution “apply” est **non interactive** et **déterministe**
- les hostnames publiés sont **cohérents** et stables (incluant `<env>` selon le standard retenu)
- un préflight “check” détecte les problèmes sans modifier le système

---

## 3. Spécification — Configuration déclarative (v1.0)

### 3.1 Rôle
La configuration est la **source de vérité**. Toute exécution et génération en dépend exclusivement.

### 3.2 Contenu minimal requis
Pour chaque **tenant** :
- `tenant_id` (slug technique)
- `universes[]` : liste des univers fonctionnels (ex: odoo, pos, sylius)
- `environments[]` : `lab`, `stinger`, `prod` (actifs ou non)
- `domain_mode` : `saas` (Phase 1 uniquement)
- **hostnames canoniques** calculables depuis la config (ou explicités si nécessaire)
- `units[]` : liste des units techniques à déployer (dvig, vault, odoo, postgres, caddy…)
- `secrets_refs` : références vers secrets (chemins / variables), sans secrets en clair

> Note Phase 1 : `domain_mode = saas` uniquement, donc base domaine = `doreviateam.com`.

### 3.3 Validation
La config doit être validée via un validateur :
- champs obligatoires présents
- valeurs dans des enums (env, univers, units)
- règles de nommage (slug tenant, etc.)
- cohérence (univers activé ⇒ unit(s) requises)

---

## 4. Spécification — Hostnames canoniques (Phase 1)

### 4.1 Standard SaaS (cible Phase 1)
**Règle normative (référence v2.0)** :
```
<univers>.<env>.<tenant>.doreviateam.com
```

### 4.2 Services cœur (DVIG/Vault)
Pour Phase 1, les services cœur doivent respecter le même schéma incluant `<env>` :
```
dvig.<env>.<tenant>.doreviateam.com
vault.<env>.<tenant>.doreviateam.com
```

> Objectif Phase 1 : supprimer toute ambiguïté/exception côté hostnames.  
> Les exceptions historiques (dvig/vault sans env) sont traitées comme **tech debt** à résorber dans cette phase.

---

## 5. Spécification — Génération déterministe

### 5.1 Principe
Toute sortie déployable doit être **générée** à partir de la config :
- Caddyfiles
- docker-compose.yml par unit/env
- env files
- variables runtime
- mapping ports si requis

### 5.2 Interdits
- décisions implicites dans `dorevia.sh`
- valeurs hardcodées hors templates
- divergences manuelles entre Lab/Stinger/Prod

### 5.3 Artefacts attendus (minimum)
Pour un tenant `X` :
- `tenants/X/manifest.(json|yml)` (source)
- `tenants/X/rendered/<env>/...` (sorties générées)
- `tenants/X/rendered/<env>/caddy/Caddyfile`
- `tenants/X/rendered/<env>/<unit>/docker-compose.yml`

---

## 6. Spécification — `dorevia.sh` (refactor Phase 1)

### 6.1 Rôle
`dorevia.sh` devient un orchestrateur **thin** :
- charge la config
- valide
- génère
- (optionnel) applique

### 6.2 Commandes minimales Phase 1
- `dorevia.sh validate <tenant>`
- `dorevia.sh render <tenant> --env <env>`
- `dorevia.sh preflight <tenant> --env <env>`
- `dorevia.sh apply <tenant> --env <env>`

> Phase 1 : pas de prompt interactif. Le mode interactif appartient à la Phase 2.

### 6.3 Idempotence
- `render` est idempotent (mêmes inputs ⇒ mêmes outputs)
- `apply` doit être relançable sans casser l’état (au minimum : pas d’erreurs “bloquantes” si déjà déployé)

---

## 7. Préflight minimal (Phase 1)

### 7.1 Objectif
Détecter avant apply :
- docker présent et accessible
- compose présent
- ports 80/443 disponibles (si reverse proxy local)
- résolution DNS (optionnel en Phase 1, mais au moins cohérence hostnames)
- accès registry si pull requis

### 7.2 Propriétés
- non destructif
- sortie lisible
- code retour exploitable (CI)

---

## 8. Backlog technique Phase 1 (priorisé)

### P0 — Must have
1. **Schéma de config v1.0** + validateur (JSON schema ou équivalent)
2. **Rendu (render)** : génération Caddyfile canonique depuis config
3. **Rendu compose** : génération `docker-compose.yml` par unit/env
4. **Normalisation hostnames** (incluant `<env>` pour DVIG/Vault)
5. **`apply` non interactif** : `docker compose up -d` sur les sorties rendues
6. **Préflight minimal** (docker/compose/ports)

### P1 — Should have
7. Journalisation standard (log structuré : tenant/env/unit/action)
8. Organisation des dossiers `rendered/` stable et documentée
9. `status` : vérifier services up + health endpoints basiques

### P2 — Nice to have
10. Détection “drift” (diff config vs rendered vs running)
11. Export “report” de rendu (résumé domaines, units, versions)

---

## 9. Critères d’acceptation (tests de conformité)

### Scénario A — Tenant “dorevia” en Lab
- `validate` OK
- `render --env lab` produit les artefacts attendus
- `apply --env lab` démarre les units
- `odoo.lab.dorevia.doreviateam.com` (ou endpoint local) répond
- `dvig.lab.dorevia.doreviateam.com` répond (health)
- `vault.lab.dorevia.doreviateam.com` répond (health)

### Scénario B — Passage Stinger (même tenant)
- `render --env stinger` produit un rendu distinct
- `apply --env stinger` ne casse pas lab
- hostnames stinger incluent `<env>` et sont cohérents

---

## 10. Risques & mitigations

- **Risque :** refactor `dorevia.sh` trop large  
  **Mitigation :** implémenter d’abord `validate` + `render`, puis `apply`.

- **Risque :** divergence historique DVIG/Vault sans env  
  **Mitigation :** normaliser maintenant (Phase 1), garder une compat “alias legacy” seulement si nécessaire (temporaire).

- **Risque :** dépendance DNS (OVH) bloque les tests  
  **Mitigation :** tests d’abord via hosts/loopback et Caddy local, DNS automatisé reporté.

---

## 11. Sorties livrables (à committer)

- `docs/SPEC_Dorevia_Phase1_Fondations_v1.0.md` (ce document)
- `schemas/manifest.schema.json` (ou équivalent)
- `bin/dorevia.sh` (refactor minimal)
- `lib/render/*` (templates et rendu)
- `lib/preflight/*`
- `tenants/<tenant>/manifest.*` (exemple : `dorevia`)

---

## 12. Conclusion

La Phase 1 ne vise pas à “ajouter des features”, mais à **rendre la plateforme gouvernable** :  
une vérité déclarative unique, un rendu déterministe, et un apply non interactif — base indispensable avant la prod client, les alias avancés et le CLI interactif.
