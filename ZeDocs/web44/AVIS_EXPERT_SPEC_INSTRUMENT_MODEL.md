# Avis d'expert — SPEC Linky Instrument Model v1.0

**Document d'évaluation**

Date : 13 mars 2026  
Document évalué : `SPEC_LINKY_INSTRUMENT_MODEL_v1.0.md`

---

## 1. Synthèse

La spec Instrument Model est **solide et exploitable**. Elle formalise un modèle technique clair (Metric, Aggregation, Time Window, Source Events) et fournit des définitions YAML pour les 12 instruments. Elle complète bien la spec Cockpit Instruments (fonctionnelle) en apportant la couche **structure de données** nécessaire à l’implémentation.

---

## 2. Points forts

### 2.1 Modèle conceptuel

Le flux **Vault Events → Aggregation Engine → Metric → Instrument → Cockpit Tile → Detailed Card** est :

- **Lisible** : chaîne de valeur bien délimitée
- **Implémentable** : chaque étape correspond à un composant ou service
- **Aligné** avec l’architecture Vault-centric (SPEC Cockpit Instruments)

### 2.2 Structure d’un instrument

La table des champs (instrument_id, label, metric, aggregation, time_window, source_events, unit, card_view) est **complète** et couvre les besoins pour :

- le rendu cockpit (tuile + card)
- le calcul (metric, aggregation, source_events)
- la temporalité (time_window)

### 2.3 Définitions YAML

Les 12 blocs YAML sont **homogènes** et **parsables**. Ils peuvent servir de base à :

- un schéma de configuration
- une génération de code
- une documentation API

### 2.4 Taxonomie des agrégations

Les types (sum, difference, ratio, balance, distribution, formula) couvrent les cas métier identifiés. Le type `formula` pour BFR et EBE est pertinent.

---

## 3. Points d’attention et lacunes

### 3.1 Source Events : nomenclature non vérifiée

Les événements listés (`invoice.posted`, `payment.received`, `pos.session.closed`, etc.) sont **conventionnels** mais ne sont pas explicitement rattachés au modèle d’événements du Vault/DVIG.

**Recommandation :** Croiser avec le schéma réel des événements Vault (ou DVIG) et aligner la nomenclature. Si les noms diffèrent, ajouter une section « Mapping événements Vault ↔ source_events » ou un glossaire.

### 3.2 Champ `card_view` absent des définitions

La structure (section 3) inclut `card_view`, mais les 12 définitions YAML ne le précisent pas.

**Recommandation :** Soit ajouter `card_view` dans chaque bloc (ex. `card_view: treasury_detail`), soit indiquer en note que ce champ est dérivé de `instrument_id` par convention.

### 3.3 `label` manquant

Le champ `label` est dans la structure mais absent des YAML. Les libellés (TRÉSORERIE, BUSINESS, etc.) sont implicites dans les titres de section.

**Recommandation :** Ajouter `label` dans chaque définition pour avoir une spec auto-suffisante et exploitable par l’UI.

### 3.4 Multi-devises

Tous les instruments ont `unit: EUR`. La spec ne traite pas le multi-devises.

**Recommandation :** Soit documenter que la v1 est mono-devise (EUR), soit introduire un champ `currency_mode` (tenant_default, instrument_specific, etc.) pour une évolution future.

### 3.5 Position de l’Aggregation Engine

Le schéma place un « Aggregation Engine » entre Vault Events et Metric. La spec Cockpit Instruments indique que les calculs peuvent être faits :

- dans le Vault
- dans les services analytiques Linky

**Recommandation :** Clarifier où se situe l’Aggregation Engine : Vault, service Linky dédié, ou les deux selon le type d’instrument. Une phrase du type « L’Aggregation Engine peut être implémenté côté Vault (agrégations temps réel) ou côté Linky (agrégations à la demande) » suffirait.

### 3.6 Événements manquants ou incertains

| Instrument | source_events | Question |
|------------|---------------|----------|
| TRÉSORERIE | `bank.transaction` | Ce type existe-t-il dans le Vault ? Souvent la trésorerie est dérivée des paiements + rapprochement. |
| BFR | `stock.valuation` | Les stocks sont-ils dans le périmètre Vault actuel ? |
| EBE | `expense.recorded` | Les charges opérationnelles passent-elles par un événement dédié ou par des factures fournisseurs ? |

**Recommandation :** Valider avec l’équipe Vault/DVIG la disponibilité réelle de ces événements. Sinon, marquer certains instruments comme « à venir » ou « sous réserve de disponibilité des événements ».

---

## 4. Cohérence avec les autres specs

### 4.1 SPEC Cockpit Instruments

| Aspect | Cockpit Instruments | Instrument Model | Cohérence |
|--------|---------------------|------------------|-----------|
| Nombre d’instruments | 12 | 12 | ✓ |
| Noms (TRÉSORERIE, BUSINESS, etc.) | Oui | Oui (titres de section) | ✓ |
| Source unique Vault | Oui | Implicite (Vault Events) | ✓ |
| Calcul (Vault vs Linky) | Détaillé | Aggregation Engine (non précisé) | À clarifier |

### 4.2 Implémentation actuelle (IconGrid)

L’IconGrid expose 8 tuiles. Les `instrument_id` du modèle peuvent servir de base pour un mapping :

| instrument_id (spec) | Implémentation actuelle |
|----------------------|--------------------------|
| treasury | TresoreriePositionCard + TreasuryCard (Paiements) |
| business | BusinessCard |
| cash_flow | FluxCashCard |
| working_capital | — (non implémenté) |
| payments | Intégré dans treasury / flux |
| receivables | ArByPartner dans BusinessCard |
| taxes | TaxesCard |
| pos_activity | PosShopsView |
| credit_notes | CreditNotesCard |
| refunds | RefundsCard |
| pos_closure | PosComingSoonView (Z caisse) |
| ebitda | — (non implémenté) |

**Recommandation :** Ajouter une section « Mapping spec ↔ implémentation » ou un tableau de traçabilité pour faciliter la convergence.

---

## 5. Recommandations prioritaires

| Priorité | Action |
|----------|--------|
| P1 | Valider la nomenclature des `source_events` avec l’équipe Vault/DVIG |
| P2 | Ajouter `label` (et éventuellement `card_view`) dans les 12 définitions YAML |
| P3 | Clarifier la position de l’Aggregation Engine (Vault vs Linky) |
| P4 | Documenter les événements « à confirmer » (bank.transaction, stock.valuation, expense.recorded) |
| P5 | Créer un mapping spec Instrument Model ↔ code Linky (CardId, composants) |

---

## 6. Verdict

> **La spec Instrument Model v1.0 est prête pour une utilisation en conception et développement**, sous réserve de valider la nomenclature des événements et de compléter les champs `label` (et `card_view`) dans les définitions. Elle constitue une base solide pour l’architecture logicielle des instruments Linky.

---

*Document rédigé à des fins d’évaluation technique. À partager avec l’équipe produit et l’équipe Vault/DVIG.*
