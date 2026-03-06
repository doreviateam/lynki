# Rapport MOA — Ventilation paiements espèces / virements (Cash Flow)

**Date :** 2026-02-28  
**Objet :** Distinction des paiements en espèces et par virement dans le Vault et Linky  
**Statut :** Implémenté (P0.2)

---

## 1. Contexte

La carte **Cash** (flux de trésorerie) de Linky affichait jusqu’à présent un total agrégé des encaissements et décaissements, sans distinguer :

- les **paiements en espèces** (journal caisse Odoo)
- les **paiements par virement / banque** (journal bancaire Odoo)

L’objectif métier est de permettre une **trésorerie en deux poches** :

| Poche | Définition | Confrontation |
|-------|-------------|---------------|
| **Espèces** | Encaissements cash − Décaissements cash | Procédures internes (comptage caisse) |
| **Virements** | Encaissements transfer − Décaissements transfer | Relevé bancaire / rapprochement |

Cette ventilation constitue un socle pour la **trésorerie probante** et le rapprochement bancaire.

---

## 2. Travail réalisé

### 2.1 Odoo — Connecteur Vault

Le connecteur Vault envoie désormais une **méthode de paiement** (`method`) basée sur le journal et la méthode de paiement Odoo :

| Source Odoo | Méthode Vault | Libellé Linky |
|-------------|---------------|---------------|
| Journal type « Caisse » | `cash` | Espèces |
| Journal type « Banque » ou « Général » | `transfer` | Virements |
| Méthode de paiement « Chèque » | `check` | Chèques |

- Les libellés **Espèces** et **Virements** sont utilisés (et non « Banque ») pour éviter toute ambiguïté.
- Les paiements par carte bancaire non identifiés explicitement sont classés en `transfer`.

### 2.2 Vault — Agrégation et normalisation

| Modification | Détail |
|-------------|--------|
| Agrégats paiements | Nouveau champ `by_method` dans les réponses `payments-in` et `payments-out` |
| Robustesse | Gestion des anciens paiements sans `method` (fallback `transfer`) |
| Normalisation | Casse et espaces normalisés à l’ingestion et dans les requêtes SQL |

### 2.3 Linky — Affichage

- La carte Cash affiche une ventilation **Espèces / Virements** (et Chèques si pertinent) sous les totaux Encaissements et Décaissements.
- En cas de données antérieures à la mise en place de la fonctionnalité (pas d’espèces historiques), un message indique :  
  *« Ventilation espèces/virements disponible pour les paiements postérieurs au 2026-02-28. »*

---

## 3. Rétroactivité des données

Les **paiements déjà enregistrés** avant cette mise à jour n’ont pas de `method` dans le Vault.  
Ils sont comptabilisés automatiquement en **virements** (`transfer`).  
Seuls les **nouveaux paiements** postés après le déploiement bénéficient de la ventilation correcte (cash / transfer / check).

---

## 4. Déploiement

| Composant | Image |
|-----------|-------|
| Vault | `dorevia/vault:cash-bank-method-2026-02-28` |
| Linky | `dorevia/linky:cash-bank-method-2026-02-28` |

**Odoo :** Redémarrer Odoo ou mettre à jour l’addon `dorevia_vault_connector` pour activer la dérivation de la méthode de paiement.

---

## 5. Vérifications (checklist MOA)

- [ ] Poster un paiement sur journal **Caisse** → le montant apparaît dans « Espèces » sur Linky
- [ ] Poster un paiement sur journal **Banque** → le montant apparaît dans « Virements » sur Linky
- [ ] Vérifier qu’un paiement ancien (sans `method`) ne provoque pas d’erreur et est bien compté dans le total
- [ ] Vérifier que le message de rétroactivité s’affiche lorsque des paiements existent mais qu’aucun n’est en espèces

---

## 6. Références

- Fiche technique : `ZeDocs/web34/IMPLEMENTATION_VAULT_ESPECES_BANQUE_2026-02-28.md`
- Spec backfill historique : `ZeDocs/web34/SPEC_BACKFILL_PAIEMENTS_ESPECES_BANQUE_v1.0.md`
- Plan d'implémentation backfill : `ZeDocs/web34/PLAN_IMPLEMENTATION_BACKFILL_ESPECES_BANQUE_2026-02-28.md`
- Rapport MOA Source unique Vault : `ZeDocs/web34/RAPPORT_MOA_VAULT_SINGLE_SOURCE_2026-02-28.md`
