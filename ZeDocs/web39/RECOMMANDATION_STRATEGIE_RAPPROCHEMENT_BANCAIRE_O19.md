# Recommandation — Stratégie de rapprochement bancaire Odoo 19 (tenant o19)

**Date :** 2026-03-07  
**Contexte :** Odoo 19 — tenant laboratoire o19 — intégration Vault / DVIG / Linky  
**Objectif :** Garantir un rapprochement bancaire efficace pour la comptable tout en maintenant la cohérence de l'architecture Dorevia.  
**Décision (2026-03-07) :** Port complet account_reconcile_oca en 19.0 — budget accordé par la comptable. Voir `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`.

---

## 1. Principe directeur

Le rapprochement bancaire est une opération comptable critique réalisée par la comptable. Il constitue un point clé du processus de fiabilisation des données financières.

Dans l'architecture Dorevia :

```
ERP (Odoo)
    ↓
opérations comptables validées
    ↓
Vault (preuves scellées)
    ↓
Linky (cockpit de pilotage)
```

La qualité des données affichées dans Linky dépend directement de la qualité du travail comptable effectué dans l'ERP.

Il est donc stratégique de **faciliter le travail de la comptable en priorité**, plutôt que de chercher à automatiser prématurément le rapprochement bancaire.

---

## 2. Constat technique

En Odoo 19 :

- le module OCA `account_reconcile_oca` n'est pas encore disponible ;
- l'API programmatique standard pour le rapprochement bancaire est limitée ;
- le fallback actuellement implémenté dans `dorevia_vault_connector` fonctionne mais repose sur :
  - détection changement `is_reconciled`
  - backfill
  - lettrage manuel dans l'interface Odoo

Cette solution est techniquement viable, mais ne fournit pas encore les outils ergonomiques avancés utilisés par les comptables (widget OCA, règles automatiques, suggestions).

---

## 3. Besoin prioritaire : ergonomie pour la comptable

Le rapprochement bancaire doit rester :

- **rapide**
- **visuel**
- **simple**

Le workflow attendu par une comptable est généralement :

```
ligne de relevé bancaire
       ↓
facture suggérée
       ↓
clic "rapprocher"
       ↓
ligne suivante
```

Les outils facilitant ce travail sont :

- interface de rapprochement avancée
- suggestions automatiques
- règles de rapprochement
- gestion des écarts / write-off

Ces fonctionnalités sont historiquement fournies par OCA `account_reconcile_oca`.

### Contrainte critique (MOA)

> **Pour la comptable, il est crucial de ne pas perdre cet avantage en Odoo 19.**

Une régression ergonomique (interface standard uniquement) serait inacceptable pour un passage en production sur Odoo 19. L'adoption d'Odoo 19 en environnement comptable opérationnel est donc **conditionnée** à la disponibilité des outils de rapprochement avancés (widget OCA, suggestions, règles).

---

## 4. Analyse des options

| Option | Description | Impact comptable | Effort |
|--------|-------------|------------------|--------|
| **Option A** | Port complet OCA vers Odoo 19 | ⭐⭐⭐⭐ | élevé |
| **Option B** | API minimale custom | ⭐ | faible |
| **Option C** | Contribution OCA | ⭐⭐⭐⭐ | moyen |
| **Option D** | Attente OCA + fallback actuel | ⭐⭐⭐ | très faible |

---

## 5. Recommandation

### Court terme (immédiat)

**Maintenir la solution actuelle sur o19 (laboratoire uniquement) :**

- lettrage manuel via interface standard Odoo
- détection des changements par `dorevia_vault_connector`
- émission des événements vers DVIG / Vault

Cette solution est fonctionnelle pour le **tenant laboratoire** o19.  
**Attention :** elle ne répond pas au besoin ergonomique critique de la comptable. Un passage en production Odoo 19 pour un usage comptable intensif nécessite account_reconcile_oca (ou équivalent).

### Moyen terme

**Adopter `account_reconcile_oca` dès disponibilité en 19.0 — prérequis pour production comptable.**

Objectifs :

- **garantir** l'ergonomie pour la comptable (contrainte critique)
- bénéficier du widget OCA de rapprochement
- disposer d'une API stable pour automatisation future

Cette approche permet :

- d'éviter de maintenir une solution interne complexe
- de rester aligné avec l'écosystème OCA

**Si OCA tarde :** évaluer un port interne (Option A) ou une contribution OCA (Option C) pour débloquer l'adoption Odoo 19 en production.

### Long terme

**Limiter les développements spécifiques.**

Dorevia n'a pas vocation à devenir un moteur de rapprochement bancaire complet. Le rôle de la plateforme est de :

```
collecter les événements financiers
    ↓
les sceller (Vault)
    ↓
les exploiter pour la gouvernance (Linky)
```

Le rapprochement bancaire reste une fonction métier de l'ERP.

---

## 6. Décision proposée

| Élément | Décision |
|--------|----------|
| Rapprochement bancaire | Maintenu dans Odoo |
| Interface avancée | **Port complet account_reconcile_oca** (budget accordé) |
| Option retenue | Option A — Port complet OCA vers 19.0 |
| Spécification | `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md` |
| Développements Dorevia | Connecteur Vault + port account_reconcile_oca |

---

## 7. Impact sur l'architecture Dorevia

Cette stratégie garantit :

- un travail comptable fluide
- des données financières fiables
- une intégration stable avec Vault et Linky

et renforce la séparation des rôles :

| Composant | Rôle |
|-----------|------|
| **Odoo** | production et validation comptable |
| **Vault** | preuve et traçabilité |
| **Linky** | pilotage de l'entreprise |

---

## 8. Conclusion

La priorité doit rester **l'efficacité du travail comptable**.

La stratégie retenue est donc :

1. **maintenir** le rapprochement dans Odoo
2. **porter** account_reconcile_oca en 19.0 (budget accordé par la comptable)
3. **spécifier** le port via `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md`

Cette approche garantit :

- une adoption naturelle par les comptables
- une maintenance technique maîtrisée
- une architecture Dorevia cohérente et durable

---

## Références

- `SPEC_PORT_ACCOUNT_RECONCILE_OCA_O19.md` — spécification du port (budget accordé)
- `PROPOSITION_ACCOUNT_RECONCILE_OCA_O19.md` — options techniques détaillées
- `RUNBOOK_ACCOUNT_RECONCILE_OCA_O19.md` — état OCA 19.0
- `RAPPORT_MOA_INSTALLATION_O19_2026-03-07.md` — rapport d'installation
