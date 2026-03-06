# Avis et amendements — SPEC Filtres Linky (FILTRE_LINKY.md)

**Réf.** : FILTRE_LINKY.md v1.0  
**Date** : 2026-02  
**Dernière révision** : après ajout des §5 à §8 dans la spec.

---

## 1. Avis global

La spec pose un **principe fort et pertinent** : *« Un chiffre sans son contexte n’est pas un chiffre »*.  
Le découpage en 3 axes (Tenant / Company / Période) est cohérent avec un usage « rapport financier opposable » et évite l’ambiguïté.

**Points forts**
- Alignement avec le positionnement Dorevia (preuve, traçabilité).
- Filtres en en-tête, jamais cachés : bon pour l’audit et la confiance.
- Distinction claire entre périmètre de vérité (tenant), juridique (company) et temporel (période).
- **§5 Héritage du contexte** et **§6 Périmètre v1** clarifient les règles et le scope.
- **§7 Roadmap** et **§8 Phrase de référence** donnent une vision produit lisible.

**État actuel de la spec (après mise à jour)**
- **§4.1 Tenant** : complet (rôle, comportement, défaut, affichage recommandé).
- **§4.2 Company** : absent — à rédiger pour alignement avec §6 (company affichée, sélectionnable si multi-company).
- **§4.3 Période** : absent — à rédiger (défaut, presets, format, lien API).
- **§5–§8** : en place (héritage, périmètre v1, roadmap, phrase de référence).

**Point d’attention**
- **Company** : le §6 inclut « company ancrée dans la donnée vaultée, affichée, sélectionnable si multi-company ». Aujourd’hui le Vault/Linky ne portent pas encore la notion company (multi-société Odoo). L’implémentation v1 devra soit faire évoluer le modèle de données, soit afficher « N/A » / masquer le filtre company tant que la donnée n’est pas disponible.

---

## 2. Amendements encore pertinents

### 2.1 Compléter la spec (détails manquants)

- **§4.2 Filtre Company** (à ajouter) :
  - Rôle : périmètre juridique / comptable (entité légale).
  - Comportement : ancrée dans la donnée vaultée ; affichée ; sélectionnable si le tenant a plusieurs companies.
  - Préciser : *« Si la donnée vaultée ne contient pas d’information company, le filtre est masqué ou affiché en lecture seule (ex. « Non applicable ») en v1. »*
- **§4.3 Filtre Période** (à ajouter) :
  - Rôle : périmètre temporel de lecture.
  - Comportement : affichée et sélectionnable (§6).
  - Valeur par défaut explicite : ex. « Toutes périodes » ou « Année en cours » (à trancher produit).
  - Presets suggérés : Mois courant, Trimestre, Année, Toutes périodes.
  - Format d’affichage : ex. « 01/01/2026 – 31/12/2026 » ou « Janv. 2026 ».
  - Lien technique : même période pour toutes les cartes ; passage de `date_debut` / `date_fin` aux API Vault (déjà supporté).

### 2.2 Cohérence avec l’existant technique

- **Tenant** : en v1, valeur = `TENANT_ID` (env) au déploiement ; affichage en en-tête informatif, non modifiable. La spec est alignée.
- **Période** : aujourd’hui en dur (2000–2030) dans le code. Pour respecter la spec, il faudra : (1) afficher la période effective en en-tête, (2) permettre de la modifier (sélecteur ou presets) et (3) appliquer la même période à Ventes et Achats.

### 2.3 Traçabilité (recommandation toujours valable)

- Prévoir que les **valeurs des filtres** (tenant, company si présent, période) soient reproductibles : ex. reflétées dans l’URL (query params) ou dans un résumé imprimable / export, pour opposabilité du rapport. Peut être ajouté en fin de §4 ou en §5.

---

## 3. Alignement avec la spec actuelle (§5–§8)

| Élément spec | Avis / amendement |
|--------------|-------------------|
| **§5 Héritage** | Bien : « cartes sans filtre propre » évite les incohérences. À rappeler en §4.3 (période unique pour toutes les cartes). |
| **§6 Périmètre v1** | Clair. Company « sélectionnable si multi-company » implique de définir la source de la donnée company (Vault vs Odoo) avant implémentation. |
| **§7 Roadmap** | Logique. Phase 2 (multi-company, consolidation) et Phase 4 (signature de rapport) renforcent l’opposabilité. |
| **§8 Phrase de référence** | Forte et réutilisable (com, doc, formation). |

---

## 4. Plan d’action recommandé (pour la spec)

1. **Rédiger §4.2** (Filtre Company) : rôle, comportement, cas « donnée non disponible ».
2. **Rédiger §4.3** (Filtre Période) : rôle, valeur par défaut, presets, format, lien avec les API.
3. **Optionnel** : ajouter une phrase en §4 ou §5 sur la **reproductibilité du contexte** (URL ou résumé) pour traçabilité.

---

## 5. Synthèse

- **Verdict** : La spec est **structurée et utilisable** ; les §5–§8 (héritage, périmètre v1, roadmap, phrase de référence) la rendent opérationnelle. Il reste à **détailler §4.2 (Company) et §4.3 (Période)** pour guider l’implémentation sans ambiguïté.
- **Amendement prioritaire** : compléter §4.2 et §4.3 ; préciser le comportement company lorsque la donnée n’est pas encore présente dans le Vault.
