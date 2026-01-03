
Ces services :
- supportent plusieurs hostnames
- peuvent exposer des alias
- ne sont pas directement liés à un univers métier

---

## 8. Modèle de déploiement — CLI d’intention

### 8.1 Principe

Le déploiement Dorevia repose sur un **assistant CLI interactif** dont le rôle est de :

- capturer l’intention de l’opérateur
- poser des questions structurées
- générer une **configuration déclarative**

La CLI **ne réalise jamais le déploiement effectif**.

---

### 8.2 Séparation des phases

#### Phase A — Intention (interactive)
- exécutée par un humain
- sans effet de bord
- produit un fichier de configuration versionnable

#### Phase B — Exécution (non interactive)
- déterministe
- reproductible
- automatisable (CI/CD)
- auditable

---

## 9. Configuration déclarative

La configuration générée :
- est la **source de vérité**
- décrit explicitement tenants, univers, environnements, domains, units
- ne contient aucune logique implicite

Toute exécution repose **exclusivement** sur cette configuration.

---

## 10. Invariants de déploiement

- ❌ aucun déploiement interactif
- ❌ aucune décision cachée
- ❌ aucune dépendance implicite
- ✔️ toute exécution est rejouable
- ✔️ tout état est explicable a posteriori

---

## 11. Conclusion

Cette spécification définit un cadre :

- stable mais extensible
- SaaS par défaut
- compatible domaine et serveur client
- lisible pour l’AMOA comme pour l’exploitant
- orienté audit et durabilité

Elle constitue la base de toutes les implémentations futures de la plateforme Dorevia.
