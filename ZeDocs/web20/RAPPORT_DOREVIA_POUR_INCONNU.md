# Dorevia — Pitch Business Angel

**Date :** 15 février 2026  
**Public :** Business Angel / investisseur early-stage  
**Durée de lecture :** 10–15 min

> **Un instrument de maîtrise financière en temps réel fondé sur la preuve.**

---

## 1. Résumé exécutif

**Dorevia** construit l’infrastructure de preuve pour les PME françaises. Nous transformons chaque opération financière (facture, vente, encaissement) en **preuve cryptographique irréfutable**, permettant aux dirigeants de **piloter avec des données attestées** en temps réel.

- **Problème :** Les PME prennent des décisions sur des chiffres non vérifiables. En cas de contrôle ou litige, elles manquent de preuves d’intégrité.
- **Solution :** Une plateforme B2B SaaS qui scelle automatiquement les documents financiers (signature JWS + ledger) et fournit un tableau de bord de maîtrise fondé sur la preuve.
- **Modèle :** Abonnement MRR (30 € à 150 €/mois) + usage au-delà des paliers. Cible : 500 000+ PME en France.
- **Traction :** Produit opérationnel, client-pilote déployé (sarl-la-platine), pricing validé.
- **Demande :** [À compléter : montant, usage des fonds, round]

---

## 2. Le problème

### 2.1 On ne peut pas maîtriser ce que l'on ne peut pas prouver

Des milliers d'entreprises font face à des difficultés **non par fraude, mais par manque de preuve** :

- **Contrôle fiscal** : justificatifs demandés, données Excel/PDF modifiables
- **Litiges** : « Qu’avons-nous fait exactement à cette date ? » — la mémoire est floue
- **Décisions stratégiques** : pilotage sur des chiffres non attestés, risque d’erreur
- **Conformité** : PDP/PPF 2026, NF525 — les normes exigent de la traçabilité

Aujourd'hui : **aucune solution simple** ne produit des preuves d'intégrité cryptographique pour l’ensemble des flux financiers d’une PME.

### 2.2 Taille du marché (ordre de grandeur)

| Segment | Volumétrie (France) | Potentiel |
|---------|---------------------|-----------|
| TPE / Artisans | ~4 M | Entrée 30 €/mois |
| PME 1–50 salariés | ~150 000 | Cœur 80–150 €/mois |
| Scale / Enterprise | ~20 000 | 150 €+ et sur devis |

**TAM raisonnable** : plusieurs centaines de milliers d’entreprises sensibles à la conformité et à la maîtrise financière.

---

## 3. La solution

### 3.1 Proposition de valeur

Dorevia est un **instrument de maîtrise financière en temps réel fondé sur la preuve** : chaque fait économique (facture validée, vente enregistrée, paiement reçu) est **scellé cryptographiquement** et restitué dans un tableau de bord fiable. Le dirigeant pilote avec des indicateurs **attestés** — trésorerie, ventes, encaissements, points de vente — sans estimation ni approximation.

### 3.2 Comment ça marche (règle des 3 V)

| Étape | Ce qui se passe |
|-------|------------------|
| **Validé** | Le document est officiel dans l’ERP (Odoo) |
| **Vaulté** | Dorevia le reçoit et le scelle (signature JWS + ledger immuable) |
| **Vérifiable** | Preuve d’intégrité disponible à tout moment |

**Flux :** L’entreprise travaille normalement → Dorevia scelle en arrière-plan → Le dirigeant consulte des indicateurs fondés sur la preuve.

### 3.3 Architecture produit (simplifiée)

```
ERP (Odoo)  ──►  DVIG (passerelle)  ──►  Vault (cœur cryptographique)
                                                     │
Linky (tableau de bord)  ◄───────────────────────────┘
```

- **Vault** (Go) : stockage, scellement JWS, ledger hash-chaîné
- **DVIG** (Python/FastAPI) : passerelle ERP → Vault
- **Linky** (Next.js) : interface de maîtrise (ventes, trésorerie, points de vente, etc.)

---

## 4. Différenciation et barrières à l'entrée

| Concurrent / alternative | Limite | Dorevia |
|--------------------------|--------|---------|
| TPE / logiciels de caisse | Pas de preuve cryptographique, données modifiables | Chaque document scellé JWS + ledger |
| Archivage classique | Stockage uniquement, pas de preuve d’intégrité | Signature + chaîne de hash immuable |
| Solutions conformité génériques | Complexité, coût, lock-in | Intégration légère sur Odoo, pricing accessible |
| Excel / Google Sheets | Aucune traçabilité | Infrastructure dédiée à la preuve |

**Atouts :**

- **Technique** : stack souveraine (Go, Python, hébergement France), pas de dépendance à un hyperscaler
- **Normatif** : aligné PDP/PPF 2026, NF525, Factur-X
- **Produit** : positionnement clair — « preuve de bonne foi », pas un simple logiciel

---

## 5. Modèle économique

### 5.1 Offres (pricing validé — spec v1.1)

| Offre | Prix | Cible | Inclus (ex.) |
|-------|------|-------|--------------|
| **Starter** | 30 €/mois | Artisans, TPE, indépendants | 500 factures/mois, preuve JWS, ledger, portail |
| **Business** | 80 €/mois | PME, structures en croissance | 1500 factures/mois, réconciliation, exports, support prioritaire |
| **Scale** | 150 €/mois | Entreprises structurées, groupes | 5000 factures/mois, reporting avancé, SLA 99,9 % |

**Usage au-delà** : facturation à la facture (0,10 € à 0,15 € selon palier). **Enterprise** : sur devis au-delà de 5000 factures/mois.

### 5.2 Logique du modèle

- **Entrée low-friction** : 30 €/mois = prix d’un TPE, décision facile
- **Montée en gamme** : évolution naturelle Starter → Business → Scale
- **MRR + usage** : revenus récurrents stables + croissance avec le volume client

---

## 6. Traction et preuve de concept

- **Produit opérationnel** : Vault, DVIG, Linky déployés (lab + stinger)
- **Client-pilote** : sarl-la-platine (tenant actif, multi-sociétés)
- **Pricing défini** : spec validée, implémentation Sylius/Odoo en cours
- **Stack éprouvée** : Go, Python, Next.js, PostgreSQL, Caddy, Docker

---

## 7. Vision et roadmap (ordre de grandeur)

**Court terme (6–12 mois)**  
- Commercialisation des offres Starter/Business  
- Acquisition early adopters (objectif : X clients payants)  
- Renforcement des intégrations Odoo (POS, factures, paiements)

**Moyen terme (12–24 mois)**  
- Extension à d’autres ERP (au-delà d’Odoo)  
- Conformité PDP/PPF 2026, NF525  
- Croissance B2B via partenaires (experts-comptables, intégrateurs)

**Long terme**  
- Référent européen pour la preuve documentaire des PME  
- Déploiement à l’international (marchés réglementés similaires)

---

## 8. Équipe et exécution

[À compléter : fondateurs, compétences clés, parcours pertinent]

---

## 9. Demande d'investissement

[À compléter]

| Élément | Détail |
|---------|--------|
| **Montant recherché** | € |
| **Round** | Seed / Pré-seed / Autre |
| **Usage des fonds** | Commercialisation, produit, équipe, etc. |
| **Pre-money / Post-money** | Si applicable |

---

## 10. Annexe technique (crédibilité)

Pour les investisseurs souhaitant valider la solidité technique :

| Composant | Technologie |
|-----------|-------------|
| Vault | Go, Fiber, PostgreSQL |
| DVIG | Python, FastAPI |
| Linky | Next.js 14, TypeScript |
| Sécurité | JWS RS256, ledger hash-chaîné, RBAC |
| Infra | Docker, Caddy (HTTPS), hébergement France |

**Références produit :**  
- Site : https://doreviateam.com  
- Documentation technique : `ZeDocs/TestV0/DESCRIPTION_DETAILLEE_PROJET_DOREVIA_PLATEFORM.md`

---

**Fin du document**
