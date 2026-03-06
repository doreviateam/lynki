# ADR-0009 : Stratégie d'Isolation STINGER (Tenant `core`)

**Statut** : ✅ **Accepté**  
**Date** : 2026-01-10  
**Décideurs** : Dorevia Team  
**Contexte** : Isolation environnement STINGER pour simulation PROD-like

---

## Contexte

### Problème

Comment isoler complètement l'environnement STINGER pour simulation PROD-like sans refonte plateforme prématurée ?

**Besoin réel** : Empêcher toute confusion STINGER/PROD lors des opérations Vault (écriture + lecture + constats), même en cas d'erreur humaine ou bug de filtre.

### Alternatives évaluées

1. **Alternative 1** : Architecture actuelle (DVIG/Vault partagés, isolation logique)
2. **Alternative 1.5** : Architecture actuelle + garde-fous techniques (enforcement env, namespace Vault)
3. **Alternative 2** : Isolation partielle (DVIG partagé, Vault séparé)
4. **Alternative 3** : Séparation complète (DVIG/Vault séparés par environnement)

Voir `COMPARAISON_ALTERNATIVES_DVIG_VAULT_v1.0.md` pour détails.

---

## Décision

**Alternative retenue** : ✅ **Alternative 1.5 — Architecture actuelle + garde-fous techniques**

### Principe

- **DVIG/Vault partagés** : Conserver architecture actuelle (1 instance par tenant)
- **Enforcement environnement** : DVIG valide que `token_env == request_env` (403 si mismatch)
- **Namespace Vault** : Vault stocke et lit dans namespace par environnement (`env=<env>`)
- **Tests automatisés** : Validation continue de l'isolation

### Justification

**Court terme** :
- ✅ Avance rapide sans chantier plateforme
- ✅ Sécurise l'essentiel (zéro mélange STINGER/PROD)
- ✅ Garde la porte ouverte à Alt 3 plus tard
- ✅ Pas de migration lourde
- ✅ Pas de DNS supplémentaires
- ✅ Pas de x3 DB/volumes

**Isolation opérationnelle forte** :
- ✅ Enforcement technique (contrainte) plutôt que déduction logique
- ✅ Zéro mélange possible même en cas d'erreur humaine
- ✅ Tests automatisés garantissent l'isolation

**Compromis optimal** :
- ✅ Isolation opérationnelle sans complexité infrastructure
- ✅ Pas de breaking changes majeurs
- ✅ Maintenance simple (architecture actuelle)

---

## Conséquences

### Positives

1. **Isolation opérationnelle garantie** : Enforcement technique empêche tout mélange
2. **Pas de migration** : Architecture actuelle conservée
3. **Ressources minimales** : Pas de x3 infra
4. **Simplicité** : Pas de DVIG routeur, pas de DNS supplémentaires
5. **Porte ouverte** : Migration vers Alt 3 possible plus tard si besoin

### Négatives

1. **Modifications code** : Enforcement env dans DVIG, namespace dans Vault
2. **Tests obligatoires** : Tests automatisés requis pour valider isolation
3. **Documentation** : Guide utilisation avec garde-fous nécessaire

### Neutres

1. **Hostnames inchangés** : `dvig.core.doreviateam.com` (sans env)
2. **Tokens unifiés** : 1 fichier `dvig.tokens.yml` (inchangé)
3. **Bases de données** : 1 base Vault partagée (avec namespace)

---

## Implémentation

### Règles techniques minimales

Voir `SPEC_GARDEFOUS_ENV_DVIG_VAULT_v1.0.md` pour détails.

**Résumé** :
1. **DVIG** : Validation `token_env == request_env` (403 si mismatch)
2. **Vault** : Stockage et lecture dans namespace `env=<env>`
3. **Tests** : Validation automatisée de l'isolation

### Phases

1. **Phase 1** : DVIG — Enforcement environnement
2. **Phase 2** : Vault — Namespace par environnement
3. **Phase 3** : Tests automatisés

---

## Quand basculer vers Alternative 3 ?

**Basculer vers Alt 3 (séparation complète) si** :
- Tests destructifs réels (migration DB, charge lourde, purge/retention ledger)
- Montée en charge + ops déléguées
- Exigences audit/compliance/SLA plus fortes
- Besoin de hostnames explicites avec environnement

**Avantage Alternative 1.5** : Migration vers Alt 3 reste possible plus tard sans perte d'investissement.

---

## Références

- `ZeDocs/TestV2/COMPARAISON_ALTERNATIVES_DVIG_VAULT_v1.0.md` — Comparaison alternatives
- `ZeDocs/TestV2/SPEC_GARDEFOUS_ENV_DVIG_VAULT_v1.0.md` — Spécification garde-fous
- `ZeDocs/TestV2/SPEC_STINGER_v1.0.md` — Spécification STINGER

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : ✅ **Accepté**
