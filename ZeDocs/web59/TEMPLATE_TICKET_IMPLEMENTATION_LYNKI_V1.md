# Template de ticket — implémentation Lynki V1

*À copier-coller dans Jira, Linear, GitHub Issues ou équivalent. Adapter les champs personnalisés de l’outil.*

---

## Titre

`[Lynki][Lot X] <BL-xx-yy> — <résumé court>`

*Exemple :* `[Lynki][Lot 2] <BL-02-04> — Tuile Trésorerie mobile (maîtresse)`

---

## Métadonnées recommandées

| Champ outil | Valeur type |
|-------------|-------------|
| **ID backlog** | `BL-xx-yy` |
| **Lot** | 0 … 6 |
| **Priorité** | P0 / P1 / P2 |
| **Owner** | @… |
| **Écran canon** | ex. `stitch/.../pilotage_mobile_max_canon_v5` |
| **Bloquant** | oui / non |
| **Dépend de** | liste d’IDs `BL-…` ou #numéros tickets outil |

---

## Description

### Contexte

* Pourquoi ce ticket existe (ligne du [backlog](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md), lot, écran).

### Périmètre

* Composant(s) ou page concerné(s).
* Comportement attendu en **une** lecture.

### Références design

* `ZeDocs/web59/stitch_carole_61/stitch/<dossier_canon>/code.html`
* Capture : `screen.png` du même dossier

### Données

* **Source visée** : (endpoint, agrégat, mock — **pas de `TBD` au démarrage** sans décision produit / annexe)
* **États de donnée** à couvrir :
* **États d’interface** à couvrir :

---

## Definition of Done

* [ ] Revue code
* [ ] États donnée + UI conformes au périmètre
* [ ] Hiérarchie lecture (KPI > graphe si applicable)
* [ ] Canon design contrôlé
* [ ] Ligne checklist lot associée : OK ou écart tracé
* [ ] Items **[Critique]** checklist : pas de KO sans arbitrage produit

---

## Sortie de recette (à la clôture)

* Statut global : OK / OK avec réserve / KO
* Si réserve : description + action + owner

---

*Template V1 — Lynki. Document parent : [`BACKLOG_IMPLEMENTATION_LYNKI_V1.md`](./BACKLOG_IMPLEMENTATION_LYNKI_V1.md).*
