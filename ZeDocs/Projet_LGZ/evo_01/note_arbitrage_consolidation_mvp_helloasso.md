# Note d’arbitrage — Consolidation MVP HelloAsso → Odoo

| | |
|---|---|
| **Objet** | Consolider les **deux flux MVP** (adhérents, billetterie) après **recette terrain**, avant toute extension majeure (participants `res.partner`, événements, etc.) |
| **Doctrine** | [Note de cadrage](./note_cadrage.md) |
| **Vue d’ensemble** | [Cartographie des flux](./cartographie_flux_helloasso_odoo.md) |
| **Détail billetterie** | [Fiche flux — billetterie](./fiche_flux_billetterie.md) |
| **Recettes** | [Adhérents (compact)](../HelloAsso_adhérent/RECETTE_MVP_HELLOASSO_COMPACT.md) · [Billetterie (compact)](../HelloAsso_billetterie/RECETTE_MVP_HELLOASSO_BILLETTERIE_COMPACT.md) |

**Question directrice (post-recette) :** *qu’est-ce que les payloads HelloAsso réels obligent à ajuster dans le MVP ?*

---

## 1. Constats — recette adhérents

*À remplir après exécution de la recette sur environnement lab / sandbox (ou prod si périmètre validé).*

### 1.1. Scénarios exécutés

| Scénario (cf. recette) | Date | Environnement | Résultat (OK / KO / partiel) | Réf. commande / capture | Preuve / source |
|------------------------|------|----------------|------------------------------|-------------------------|-----------------|
| | | | | | |
| | | | | | |

*Preuve / source (exemples) : capture d’écran, extrait de log Odoo, payload API anonymisé, ID fiche `res.partner` créée ou mise à jour, lien vers ticket.*

### 1.2. Observations techniques

* Statuts HelloAsso observés sur les paiements éligibles / non éligibles :
* Comportement du filtre MVP (Membership, `Registered`, items) :
* Rapprochement `helloasso_external_id` / e-mail :
* Cas ignorés rencontrés (doublons, sans e-mail, etc.) :

### 1.3. Synthèse adhérents (une phrase)

---

## 2. Constats — recette billetterie

### 2.1. Scénarios exécutés

| Scénario (cf. recette) | Date | Environnement | Résultat (OK / KO / partiel) | Réf. commande / capture | Preuve / source |
|------------------------|------|----------------|------------------------------|-------------------------|-----------------|
| | | | | | |
| | | | | | |

*Preuve / source (exemples) : capture, log, payload anonymisé, ID `dorevia.helloasso.billetterie.order`, fiche payeur `res.partner`.*

### 2.2. Observations techniques

* **formType** / **formSlug** retenus pour le test :
* Structure réelle des **commandes** (champs présents, montants en centimes ou autre) :
* Structure des **`items`** / participants (blocs `user`, etc.) :
* Statuts commande observés vs filtre `_BAD_ORDER_STATES` :
* Rapprochement payeur (e-mail ambigu, création partenaire) :

### 2.3. Synthèse billetterie (une phrase)

---

## 3. Écarts par rapport à la documentation

| Document de référence | Écart constaté | Gravité (faible / moyenne / forte) |
|----------------------|----------------|-------------------------------------|
| SPEC / ADR adhérent | | |
| SPEC / ADR billetterie | | |
| [Fiche flux billetterie](./fiche_flux_billetterie.md) | | |
| [Cartographie](./cartographie_flux_helloasso_odoo.md) | | |

---

## 4. Décisions immédiates (à prendre après recette)

*Décisions sur ce qui est **corrigé ou précisé dans le MVP** avant le lot suivant.*

| ID | Sujet | Décision | Responsable | Échéance |
|----|--------|----------|-------------|----------|
| D1 | | | | |
| D2 | | | | |
| D3 | | | | |

---

## 5. Points reportés (lots suivants)

*Ce qui **n’est pas** traité dans cette consolidation ; renvoi vers Option B (participants), C (exploitation), ou ADR.*

| ID | Sujet | Lot cible (B / C / autre) | Réf. doc à mettre à jour |
|----|--------|---------------------------|--------------------------|
| R1 | | | |
| R2 | | | |
| R3 | | | |

---

## 6. Actions de suivi (code / doc)

| Action | Type (code / doc / config) | Module ou fichier | Statut |
|--------|----------------------------|-------------------|--------|
| | | | |
| | | | |

---

## 7 bis. Lecture finale de consolidation

*À remplir une fois les §1 à 6 alimentés ; lecture unique pour clôturer le cycle recette → arbitrage.*

| Flux | Lecture finale | Commentaire |
|------|----------------|-------------|
| Adhérents | *Conforme MVP / conforme avec ajustements / non conforme* | |
| Billetterie | *Conforme MVP / conforme avec ajustements / non conforme* | |

### Conclusion générale

Cocher **une** option :

* [ ] **MVP consolidé en l’état** — aucun correctif bloquant ; poursuite possible vers lot suivant (B ou C selon arbitrage).
* [ ] **MVP consolidé sous réserve de correctifs ciblés** — la liste des actions est dans §6 ; le lot suivant attend la livraison de ces correctifs.
* [ ] **MVP non consolidé, reprise nécessaire avant lot suivant** — écarts majeurs (§3) non résolus ou recette incomplète.

---

## 8. Validation

| Rôle | Nom | Date | Signature / commentaire |
|------|-----|------|-------------------------|
| Métier / MOA | | | |
| Technique | | | |

---

## Historique des versions du document

| Version | Date | Auteur | Résumé |
|---------|------|--------|--------|
| 0.1 (squelette) | | | Création — sections à compléter après recette terrain |
| 0.2 | | | Colonne *Preuve / source* (§1.1, §2.1) ; §7 bis *Lecture finale de consolidation* et conclusion générale ; §8 Validation |
