# ADR-001 — Linky : Vault comme gateway unique (ERP-agnostique)

**Type :** Architecture Decision Record  
**Statut :** Accepted  
**Date :** 2026-03-15  
**Décisionnaire :** Équipe plateforme Dorevia

---

## Engagement

**Nous nous engageons à ce que Linky reste entièrement ERP-agnostique en ne consommant qu’un seul contrat d’interface : le Vault, gateway unique de la plateforme.**

---

## Décision d’architecture

**Principe normatif :** Linky ne consomme jamais directement un ERP, DLP, DIVA ou tout autre service métier ; il consomme exclusivement des endpoints exposés par le Vault, qui constitue l’unique gateway applicative et le contrat d’interface stable de la plateforme.

Le Vault peut :

- **servir directement** des données qu’il agrège et expose,
- **proxifier / orchestrer** des services aval (Odoo, DLP, DIVA, etc.),

sans que cela modifie le contrat d’intégration de Linky.

---

## Nuance importante

- **« Gateway unique »** ne signifie pas **« le Vault produit ou calcule tout lui-même »**.
- Cela signifie : **« le Vault expose tout à Linky »** — toute donnée **consommée** par Linky **transite exclusivement par le Vault**.

Certaines données peuvent rester **produites** par Odoo, **produites** par DLP, **générées** par DIVA ; elles sont **consommées par Linky uniquement via le Vault**. Le fait qu’une donnée transite par le Vault ne préjuge pas de sa source métier d’origine ; il définit uniquement le contrat d’accès consommé par Linky. Cette formulation protège :

1. **L’architecture** : Vault = contrat unique d’accès.  
2. **Le positionnement** : Dorevia n’est pas « lié à Odoo ».  
3. **La crédibilité** : on ne laisse pas entendre que le Vault calcule ou crée absolument tout.

---

## Trois natures de données — un seul contrat

Quelle que soit leur nature, toutes les données consommées par Linky **transitent par le même contrat d’accès : le Vault**.

| Nature | Exemples | Rôle du Vault |
|--------|----------|----------------|
| **Données financières / KPI** | Trésorerie, ventes, achats, EBE, flux, encours, BFR, POS, ratio certifié | Agrégées et exposées par le Vault (source unique d’exposition pour Linky). |
| **Données de services spécialisés** | DLP (énergie stratégique), DIVA (flash, insights) | À terme : exposées par le Vault (proxy vers DLP/DIVA) ; aujourd’hui encore appel direct Linky → DLP/DIVA (écart à corriger). |
| **Données de santé / métadonnées de connecteurs** | Bank reconciliation health, complétude, preuves scellées | Exposées ou proxifiées par le Vault (ex. Vault → Odoo pour bank-reconciliation-health). |

**Le Vault n’est pas seulement un coffre de preuve ; c’est aussi la façade d’exposition unifiée de la donnée consommée par Linky.**

---

## Conséquences

| Conséquence | Détail |
|-------------|--------|
| **Suppression des dépendances directes Linky** | À l’issue de la mise en œuvre : suppression de `DLP_URL` et `DIVA_URL` côté Linky. Linky ne connaît que `VAULT_URL`. |
| **Dépendances directes interdites** | Toute dépendance directe de Linky à un service aval (ERP, DLP, DIVA, etc.) est interdite par cette décision d’architecture. DLP et DIVA constituent des écarts actuels à corriger par mise en place des proxies côté Vault. |
| **Contrat stable** | L’ajout ou le remplacement de services derrière le Vault (autre ERP, autre moteur DLP, autre modèle DIVA) ne modifie pas le contrat Linky ↔ Vault. |

---

## ERP-agnosticisme — au-delà du « on peut brancher autre chose qu’Odoo »

L’ERP-agnosticisme ne se limite pas à « on peut brancher un autre ERP ». Il implique :

- **Pas de dépendance directe** de Linky à Odoo (ni à aucun ERP).
- **Pas de logique front** spécifique à un ERP dans Linky.
- **Pas de multiplication des contrats techniques** côté UI : un seul client (Linky), un seul fournisseur d’API (Vault).

La proposition de faire transiter DLP et DIVA par le Vault va exactement dans ce sens.

---

## Contexte et état des lieux

### Données déjà conformes (Linky → Vault uniquement)

Les domaines suivants sont déjà consommés par Linky **exclusivement via le Vault** :

- Trésorerie, ventes, achats, business (synthèse), paie/EBE, paiements, encours/BFR, AP, notes de crédit/remboursements, POS, companies, complétude/preuves, évolutions (séries), bank-reconciliation-health (Vault proxy Odoo).

### Écarts actuels (à corriger)

| Écart | Détail | Action cible |
|-------|--------|--------------|
| **DLP** | Linky appelle directement `DLP_URL` (tuile Énergie stratégique, dashboard-metrics). | Vault expose `GET /ui/dlp/energy-summary` (proxy vers DLP). Linky supprime `DLP_URL`. |
| **DIVA** | Linky appelle directement `DIVA_URL` (explain, generate, insights, jobs). | Vault expose routes `/ui/diva/*` (proxy vers DIVA). Linky supprime `DIVA_URL`. |

---

## Proposition technique (résumé)

- **Vault** : ajout de routes proxy vers DLP et DIVA ; configuration `DLP_URL`, `DIVA_URL` (et timeouts) côté Vault uniquement.
- **Linky** : tous les appels actuellement faits à DLP ou DIVA sont redirigés vers `VAULT_URL + /ui/dlp/...` ou `VAULT_URL + /ui/diva/...` ; suppression des variables d’environnement `DLP_URL` et `DIVA_URL` dans Linky.

Détail des routes et fichiers concernés : voir *NOTE_LINKY_VAULT_GATEWAY_UNIQUE_ERP_AGNOSTIQUE.md* (état des lieux détaillé, proposition DLP/DIVA, ordre de grandeur des chantiers).

---

## Références

- ZeDocs/web51/NOTE_LINKY_VAULT_GATEWAY_UNIQUE_ERP_AGNOSTIQUE.md — note d’analyse et proposition technique détaillée.
- Code : `units/dorevia-linky/app/api/*`, `sources/vault/internal/handlers/*`.

---

*ZeDocs/web51 — ADR-001 Linky Vault gateway unique — 2026-03-15.*
