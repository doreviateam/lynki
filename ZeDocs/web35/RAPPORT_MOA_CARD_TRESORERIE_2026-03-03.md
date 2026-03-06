# Rapport MOA — Card 1/9 TRÉSORERIE (Position)

**Date :** 2026-03-03  
**Objet :** Mise en place de la carte Trésorerie (Position) comme ancre du cockpit Linky  
**Statut :** Réalisé et déployé

---

## 1. Contexte

### 1.1 Constat initial

La carte **Cash** existante représente un **flux** (variation nette encaissements − décaissements sur une période), pas une **position**. Les dirigeants ouvrent Linky et voient des montants de flux (+8 103 €, +55 260 €, etc.) sans réponse à la question centrale :

> « Combien ai-je réellement en banque ? »

### 1.2 Objectif

Introduire une **carte Trésorerie (Position)** qui répond en moins de 3 secondes à :

> « Où en est ma position réelle ? »

Sans projection, estimation ni données non scellées. Source unique : Vault + ERP.

---

## 2. Solution livrée

### 2.1 Carte Trésorerie (Position)

**Emplacement :** En tête du cockpit Linky, au-dessus de la grille des tuiles et des autres cartes.

**Contenu affiché :**

| Métrique | Libellé | Source |
|----------|---------|--------|
| Solde comptable | 💰 Solde comptable (ERP) | Odoo (via Vault) |
| Position validée | 🔐 Position validée (Vault) | Vault (projection RECONCIL) |
| Taux de rapprochement | 📊 Taux de rapprochement | Vault |

**Mention obligatoire :** « Au {date} » ou « Dernière mise à jour : {date} » — la position se lit au présent.

### 2.2 États d'affichage

| État | Condition | Indicateur |
|------|-----------|------------|
| **NO_DATA** | Aucune donnée (validated, exposure, rate tous vides) | « Aucune donnée disponible » + valeurs `—` |
| **Tension** | Taux &lt; 70 % | Badge « Validation partielle » |
| **Vigilance** | Écart ERP/Vault &gt; 5 % ou 70 % ≤ taux &lt; 90 % | Badge « Écart à analyser » |
| **Normal** | Sinon | Affichage neutre |

**Règle produit :** La carte ne doit jamais créer d'alarme artificielle.

### 2.3 Mode dégradé

Si le solde ERP n'est pas disponible (tenant sans configuration bank reconciliation) :

- Masquage de la ligne « Solde comptable (ERP) »
- Mention : « Solde comptable : non configuré »
- Affichage conservé : Position validée (Vault) et Taux de rapprochement

### 2.4 ERP-agnostic

Libellés neutres : « Solde comptable (ERP) » et « Solde comptable : non configuré » — aucune référence à un ERP spécifique.

---

## 3. Intégration DIVA

La carte Trésorerie (Position) est prise en compte par **DIVA** (lecture assistée) :

| Élément | Intégration |
|---------|-------------|
| **treasury_position** | Nouvelle métrique cockpit (position validée en EUR) |
| **_details.treasury** | Enrichi avec `validated_balance`, `erp_balance` |
| **Prewarm / Refresh / Explain** | Mapping DIVA mis à jour |

DIVA peut désormais intégrer la position trésorerie dans ses analyses et synthèses.

---

## 4. Travail technique réalisé

### 4.1 Composants créés

| Fichier | Rôle |
|---------|------|
| `TresoreriePositionCard.tsx` | Carte présentant les 3 métriques + états UI |
| `TresoreriePositionCardWithPolling.tsx` | Polling 10 min + bouton Rafraîchir |

### 4.2 Modifications

| Fichier | Modification |
|---------|--------------|
| `DashboardWithFilters.tsx` | Insertion de la carte en tête (vue grille + vue cartes) |
| `dashboard-metrics/route.ts` | Enrichissement avec `treasury_position`, `_details.treasury` |
| `cockpit/cards/route.ts` | Ajout carte `treasury_position` |
| `diva/prewarm`, `refresh`, `explain` | Mapping `treasury_position` |
| `DivaFlashBlock.tsx` | Mapping `treasury_position` |
| `IconGrid.tsx` | Type `CardId` étendu |

### 4.3 Backend

**Aucune modification Vault.** Réutilisation de l'endpoint existant `/ui/aggregations/treasury` qui expose déjà `position.validated_balance`, `position.erp_balance`, `reconciliation_rate`.

---

## 5. Déploiement

**Date :** 2026-03-03

| Élément | Action |
|---------|--------|
| **Image Linky** | `dorevia/linky:card-tresorerie-2026-03-03` |
| **Tenants** | laplatine2026 (lab), sarl-la-platine (lab, stinger) |
| **Conteneurs** | 3 conteneurs Linky recréés |

**Vault :** Aucun redéploiement requis.

---

## 6. Ordre des cartes (cockpit)

1. **TRÉSORERIE** (Position) — ancre fixe
2. Paiements (Process)
3. Cash (Flux)
4. Business
5. Taxes
6. Notes de crédit, Remboursements, POS, Z

Règle : *Position d'abord, explication ensuite.*

---

## 7. Documents de référence

| Document | Rôle |
|----------|------|
| `SPEC_CARD_TRESO.md` | Spécification fonctionnelle |
| `PLAN_IMPLEMENTATION_CARD_TRESO_2026-03-03.md` | Plan d'implémentation v1.2 |
| `BIG_PICTURE_TRESO.md` | Vision produit (position vs flux) |
| `AVIS_EXPERT_BIG_PICTURE_TRESO_2026-03-03.md` | Avis d'expert |
| `RAPPORT_AVIS_EXPERT_SPEC_CARD_TRESO_2026-03-03.md` | Avis d'expert SPEC |

---

## 8. Synthèse

La carte **Trésorerie (Position)** est opérationnelle et déployée. Elle répond au besoin « Où en est ma position réelle ? » en s'appuyant uniquement sur des données Vault et ERP, sans projection ni estimation. L'intégration DIVA permet d'enrichir les analyses assistées par IA.

---

**Fin du rapport MOA**
