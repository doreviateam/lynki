# 💰 Réflexion — Facturation MRR basée sur Vault

**Version** : 1.1  
**Date** : 2026-01-03  
**Auteur** : Équipe Dorevia  
**Statut** : 🔄 En réflexion  
**Contexte** : Odoo lab.core.doreviateam.com comme système de facturation cible

---

## 📋 Table des Matières

1. [Contexte et Objectif](#contexte-et-objectif)
2. [État Actuel — Données Vault](#état-actuel--données-vault)
3. [Définition du MRR basé sur Vault](#définition-du-mrr-basé-sur-vault)
4. [Modèles de Facturation Possibles](#modèles-de-facturation-possibles)
5. [Défis Techniques](#défis-techniques)
6. [Approche Proposée](#approche-proposée)
7. [Architecture Technique](#architecture-technique)
8. [Intégration Odoo](#intégration-odoo)
9. [Roadmap d'Implémentation](#roadmap-dimplémentation)
10. [Questions Ouvertes](#questions-ouvertes)

---

## 🔗 Documents Complémentaires

- **[INTEGRATION_ODOO_FACTURATION_MRR.md](INTEGRATION_ODOO_FACTURATION_MRR.md)** : Détails de l'intégration Vault → Odoo

---

## 1. Contexte et Objectif

### 1.1 Problématique

Nous prévoyons que la facturation des clients Dorevia sera basée sur :
- **Modèle forfaitaire** : Abonnement fixe par tenant (entre 50 et 80 euros)
- **Modèle usage estimé** : Basé sur des estimations ou des métriques indirectes (entre 0.15 et 0.50 euros suivant le document)
- **Modèle manuel** : Facturation basée sur des accords contractuels non automatisés

**Limitation** : Aucune facturation basée sur l'**usage réel** des services, mesuré par les documents réellement stockés dans Vault.

**Contexte Odoo** : Odoo lab.core.doreviateam.com est utilisé comme **centre de gestion de projets et de facturation**. L'intégration Vault → Odoo permettra d'automatiser la création de factures Odoo à partir des données Vault.

### 1.2 Opportunité

**Vault est la source de vérité** pour les documents clients :
- ✅ Stocke tous les documents (factures, tickets POS, etc.)
- ✅ Métadonnées riches (montants, dates, tenant, source)
- ✅ Traçabilité complète (ledger, JWS)
- ✅ Isolation multi-tenant

**Objectif** : Implémenter un système de **facturation MRR (Monthly Recurring Revenue)** basé sur les documents réellement stockés dans Vault, permettant une facturation précise et automatisée.

### 1.3 Bénéfices Attendus

- ✅ **Facturation précise** : Basée sur l'usage réel, pas sur des estimations
- ✅ **Automatisation** : Calcul et génération automatiques de factures
- ✅ **Traçabilité** : Chaque facture client peut être tracée jusqu'aux documents Vault
- ✅ **Flexibilité** : Modèles de facturation adaptables (par document, par montant, par volume)
- ✅ **Transparence** : Clients peuvent voir exactement ce pour quoi ils sont facturés

---

## 2. État Actuel — Données Vault

### 2.1 Structure des Documents

Vault stocke des documents avec les métadonnées suivantes :

```go
type Document struct {
    // Identifiants
    ID          uuid.UUID
    Tenant      *string  // Isolation multi-tenant
    
    // Métadonnées facture
    InvoiceNumber *string
    InvoiceDate   *time.Time
    TotalHT       *float64  // Montant HT
    TotalTTC      *float64  // Montant TTC
    Currency      *string   // EUR, USD, etc.
    
    // Métadonnées Odoo
    Source    *string  // sales|purchase|pos|stock|sale
    OdooModel *string  // account.move, pos.order, etc.
    OdooID    *int
    OdooState *string  // posted, paid, done, etc.
    
    // Métadonnées POS
    PosSession *string
    Cashier    *string
    Location   *string
    
    // Timestamps
    CreatedAt time.Time  // Date de création dans Vault
}
```

### 2.2 Types de Documents Disponibles

| Type | Source | OdooModel | Métadonnées Disponibles |
|------|--------|-----------|-------------------------|
| **Facture client** | `sales` | `account.move` | `total_ht`, `total_ttc`, `invoice_date`, `invoice_number` |
| **Facture fournisseur** | `purchase` | `account.move` | `total_ht`, `total_ttc`, `invoice_date` |
| **Ticket POS** | `pos` | `pos.order` | `total_ttc` (dans `payload_json`), `pos_session` |
| **Autres** | `stock`, `sale` | Variable | Métadonnées limitées |

### 2.3 Données Disponibles pour Facturation

**Données quantitatives** :
- ✅ Nombre de documents par tenant/mois
- ✅ Montants totaux (HT/TTC) par tenant/mois
- ✅ Volume de stockage (taille fichiers) par tenant/mois
- ✅ Types de documents (factures, POS, etc.)

**Données qualitatives** :
- ✅ Dates de création (période de facturation)
- ✅ États des documents (posted, paid, etc.)
- ✅ Sources (sales, pos, purchase, etc.)

**Limitations actuelles** :
- ⚠️ Pas de distinction factures clients vs fournisseurs dans le calcul (à définir)
- ⚠️ Pas de distinction factures payées vs non payées (à définir)
- ⚠️ Pas de gestion des remises/abonnements (à définir)

---

## 3. Définition du MRR basé sur Vault

### 3.1 MRR Classique vs MRR Vault

**MRR Classique (SaaS)** :
- Revenu récurrent mensuel basé sur des abonnements
- Exemple : 10 clients × 100€/mois = 1000€ MRR

**MRR Vault (Usage-based)** :
- Revenu récurrent mensuel basé sur l'**usage réel** des services Vault
- Exemple : 1000 factures stockées × 0.30€/facture (moyenne) = 300€ MRR

### 3.2 Métriques Possibles

#### Option A : Facturation par Document
- **Unité** : Nombre de documents stockés dans Vault
- **Calcul** : `MRR = Nombre documents/mois × Prix unitaire`
- **Exemple** : 1000 factures/mois × 0.30€ (moyenne entre 0.15€ et 0.50€) = 300€/mois

#### Option B : Facturation par Montant Traité
- **Unité** : Montant total des factures stockées (HT ou TTC)
- **Calcul** : `MRR = Montant total/mois × Pourcentage`
- **Exemple** : 100 000€ de factures/mois × 0.1% = 100€/mois

#### Option C : Facturation par Volume de Stockage
- **Unité** : Taille totale des fichiers stockés (GB)
- **Calcul** : `MRR = Volume/mois × Prix/GB`
- **Exemple** : 10 GB/mois × 10€/GB = 100€/mois

#### Option D : Facturation Hybride
- **Combinaison** : Plusieurs métriques avec poids différents
- **Calcul** : `MRR = (Documents × P1) + (Montant × P2) + (Volume × P3)`
- **Exemple** : (1000 × 0.05€) + (100k€ × 0.05%) + (10GB × 5€) = 50€ + 50€ + 50€ = 150€/mois

### 3.3 Recommandation Initiale

**Option recommandée** : **Option A (Facturation par Document)** avec possibilité d'évolution vers Option D.

**Justification** :
- ✅ Simple à comprendre et expliquer aux clients
- ✅ Facile à calculer (COUNT documents)
- ✅ Évolutif (peut ajouter d'autres métriques plus tard)
- ✅ Prévisible pour les clients (nombre de factures connu)

---

## 4. Modèles de Facturation Possibles

### 4.1 Modèle 1 : Forfait + Usage

**Structure** :
- **Forfait de base** : X€/mois (inclut Y documents)
- **Usage supplémentaire** : Z€ par document au-delà de Y

**Exemple** :
- Forfait : 65€/mois (moyenne entre 50€ et 80€, inclut 500 documents)
- Supplément : 0.30€ par document au-delà de 500 (moyenne entre 0.15€ et 0.50€)
- Client avec 800 documents : 65€ + (300 × 0.30€) = 65€ + 90€ = 155€/mois

**Avantages** :
- ✅ Revenu garanti (forfait)
- ✅ Scalabilité (usage supplémentaire)
- ✅ Prévisibilité pour clients (forfait connu)

### 4.2 Modèle 2 : Usage Pur

**Structure** :
- **Prix unitaire** : X€ par document
- **Pas de forfait** : Facturation uniquement sur usage

**Exemple** :
- Prix : 0.30€ par document (moyenne entre 0.15€ et 0.50€)
- Client avec 1000 documents : 1000 × 0.30€ = 300€/mois

**Avantages** :
- ✅ Simple et transparent
- ✅ Pay-as-you-go
- ✅ Pas de coût fixe pour clients

**Inconvénients** :
- ⚠️ Revenu variable (pas de garantie)
- ⚠️ Peut être imprévisible pour clients

### 4.3 Modèle 3 : Tiers (Tiered Pricing)

**Structure** :
- **Tier 1** : 0-500 documents → 0.50€/document (prix max)
- **Tier 2** : 501-2000 documents → 0.30€/document (moyenne)
- **Tier 3** : 2001+ documents → 0.15€/document (prix min)

**Exemple** :
- Client avec 2500 documents :
  - Tier 1 : 500 × 0.50€ = 250€
  - Tier 2 : 1500 × 0.30€ = 450€
  - Tier 3 : 500 × 0.15€ = 75€
  - **Total** : 775€/mois

**Avantages** :
- ✅ Incite à l'usage (prix dégressif)
- ✅ Équitable (gros clients payent moins par unité)

### 4.4 Modèle 4 : Abonnement + Usage Optionnel

**Structure** :
- **Abonnement mensuel** : X€/mois (service de base)
- **Usage optionnel** : Y€ par document (si client veut facturation basée usage)

**Exemple** :
- Abonnement : 65€/mois (moyenne entre 50€ et 80€)
- Usage optionnel : 0.30€ par document (moyenne)
- Client avec usage : 65€ + (1000 × 0.30€) = 365€/mois

**Avantages** :
- ✅ Flexibilité (client choisit modèle)
- ✅ Revenu garanti (abonnement)

### 4.5 Recommandation Initiale

**Modèle recommandé** : **Modèle 1 (Forfait + Usage)** pour démarrer, avec possibilité d'évolution vers Modèle 3 (Tiers).

**Justification** :
- ✅ Équilibre entre revenu garanti et scalabilité
- ✅ Prévisible pour clients (forfait connu)
- ✅ Évolutif (peut ajouter tiers plus tard)

---

## 5. Défis Techniques

### 5.1 Calcul du MRR

**Défi** : Comment calculer le MRR de manière précise et performante ?

**Considérations** :
- ⚠️ **Performance** : Calculer MRR pour tous les tenants peut être coûteux
- ⚠️ **Période** : MRR mensuel (mois calendaire ? mois glissant ?)
- ⚠️ **Déduplication** : Éviter de compter deux fois le même document
- ⚠️ **Filtrage** : Quels documents compter ? (posted seulement ? payés seulement ?)

**Solutions possibles** :
- ✅ **Agrégation pré-calculée** : Table de synthèse mise à jour périodiquement
- ✅ **Cache** : Résultats mis en cache avec TTL
- ✅ **Index** : Index sur `tenant`, `created_at`, `source`, `odoo_state`

### 5.2 Isolation Multi-Tenant

**Défi** : S'assurer que le calcul MRR respecte l'isolation des tenants.

**Considérations** :
- ✅ **Isolation** : Chaque tenant ne voit que ses propres documents
- ✅ **Sécurité** : Empêcher un tenant d'accéder aux données d'un autre
- ✅ **Performance** : Requêtes optimisées par tenant

**Solutions** :
- ✅ **Filtre tenant** : Toujours filtrer par `tenant` dans les requêtes
- ✅ **Permissions** : Vérifier les permissions d'accès aux données
- ✅ **Index** : Index sur `tenant` pour performance

### 5.3 Gestion des Périodes

**Défi** : Comment gérer les périodes de facturation (mois calendaire, mois glissant) ?

**Considérations** :
- ⚠️ **Mois calendaire** : 1er au dernier jour du mois (simple mais peut être inéquitable)
- ⚠️ **Mois glissant** : 30 jours glissants (équitable mais plus complexe)
- ⚠️ **Date de référence** : `created_at` (date Vault) ou `invoice_date` (date facture) ?

**Solutions** :
- ✅ **Paramétrable** : Permettre de choisir la période (calendaire vs glissant)
- ✅ **Date de référence** : Utiliser `invoice_date` si disponible, sinon `created_at`
- ✅ **Documentation** : Documenter clairement la logique de calcul

### 5.4 Filtrage des Documents

**Défi** : Quels documents doivent être comptés dans le MRR ?

**Questions** :
- ❓ **Factures clients seulement** ? (exclure factures fournisseurs ?)
- ❓ **Factures postées seulement** ? (exclure brouillons ?)
- ❓ **Factures payées seulement** ? (exclure impayées ?)
- ❓ **Tous les types** ? (factures + POS + autres ?)

**Solutions** :
- ✅ **Paramétrable par tenant** : Permettre de configurer les filtres
- ✅ **Par défaut** : Factures clients (`source='sales'`) postées (`odoo_state='posted'`)
- ✅ **Documentation** : Documenter les règles de filtrage

### 5.5 Historique et Rétroactivité

**Défi** : Comment gérer l'historique et les recalculs rétroactifs ?

**Considérations** :
- ⚠️ **Recalculs** : Si un document est modifié, faut-il recalculer le MRR ?
- ⚠️ **Historique** : Conserver l'historique des calculs MRR
- ⚠️ **Rétroactivité** : Recalculer les mois passés si nécessaire ?

**Solutions** :
- ✅ **Snapshots** : Conserver des snapshots mensuels du MRR
- ✅ **Immutabilité** : Une fois facturé, ne pas modifier (créer une facture d'avoir)
- ✅ **Audit trail** : Logs de tous les calculs MRR

### 5.6 Intégration Système de Facturation

**Défi** : Comment intégrer avec le système de facturation externe ?

**Considérations** :
- ⚠️ **Format** : Quel format pour exporter les données de facturation ?
- ⚠️ **Fréquence** : Facturation mensuelle ? hebdomadaire ? à la demande ?
- ⚠️ **API** : Intégration via API ou export fichier ?

**Solutions** :
- ✅ **Export CSV/JSON** : Format simple pour intégration
- ✅ **API REST** : Endpoint pour récupérer données de facturation
- ✅ **Webhook** : Notification automatique lors de calcul MRR

---

## 6. Approche Proposée

### 6.1 Architecture en 3 Couches

```
┌─────────────────────────────────────────┐
│  Couche 1 : Collecte Données (Vault)   │
│  - Documents stockés dans PostgreSQL    │
│  - Métadonnées disponibles              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Couche 2 : Calcul MRR (Service)         │
│  - Agrégation par tenant/mois           │
│  - Application règles de facturation    │
│  - Cache et optimisation                │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Couche 3 : Facturation (Export/API)    │
│  - Génération factures                  │
│  - Export vers système externe          │
│  - API pour consultation                │
└─────────────────────────────────────────┘
```

### 6.2 Composants Techniques

#### Composant 1 : Service de Calcul MRR

**Responsabilités** :
- Calculer MRR par tenant/mois
- Appliquer règles de facturation (forfait, usage, tiers)
- Gérer cache et agrégations

**Technologies** :
- **Langage** : Go (cohérent avec Vault) ou Python (si intégration DVIG)
- **Base de données** : PostgreSQL (même DB que Vault ou séparée ?)
- **Cache** : Redis (optionnel, pour performance)

#### Composant 2 : API de Consultation

**Responsabilités** :
- Exposer API REST pour consulter MRR
- Endpoints : `/api/v1/billing/mrr`, `/api/v1/billing/invoices`
- Authentification et autorisation

**Technologies** :
- **Framework** : FastAPI (Python) ou Fiber (Go)
- **Authentification** : JWT ou API Key (cohérent avec DVIG)

#### Composant 3 : Export Facturation

**Responsabilités** :
- Générer exports (CSV, JSON, PDF)
- Intégration avec système de facturation externe
- Notifications (webhook, email)

**Technologies** :
- **Format** : CSV, JSON, PDF
- **Intégration** : API REST, Webhook, Email

### 6.3 Modèle de Données

#### Table : `billing_mrr_snapshots`

```sql
CREATE TABLE billing_mrr_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant TEXT NOT NULL,
    period_start DATE NOT NULL,  -- Début période (ex: 2026-01-01)
    period_end DATE NOT NULL,     -- Fin période (ex: 2026-01-31)
    
    -- Métriques
    document_count INTEGER NOT NULL,      -- Nombre de documents
    total_amount_ht DECIMAL(12,2),       -- Montant total HT
    total_amount_ttc DECIMAL(12,2),      -- Montant total TTC
    storage_bytes BIGINT,                 -- Volume stockage (bytes)
    
    -- Calcul MRR
    base_fee DECIMAL(10,2) DEFAULT 0,    -- Forfait de base
    usage_fee DECIMAL(10,2) DEFAULT 0,   -- Frais d'usage
    total_mrr DECIMAL(10,2) NOT NULL,    -- MRR total
    
    -- Métadonnées
    calculation_date TIMESTAMP NOT NULL DEFAULT NOW(),
    calculation_version TEXT,             -- Version des règles de calcul
    filters_applied JSONB,               -- Filtres appliqués (source, state, etc.)
    
    -- Index
    CONSTRAINT unique_tenant_period UNIQUE (tenant, period_start, period_end)
);

CREATE INDEX idx_billing_mrr_tenant ON billing_mrr_snapshots(tenant);
CREATE INDEX idx_billing_mrr_period ON billing_mrr_snapshots(period_start, period_end);
```

#### Table : `billing_rules`

```sql
CREATE TABLE billing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant TEXT,  -- NULL = règle globale
    rule_type TEXT NOT NULL,  -- 'flat', 'usage', 'tiered', 'hybrid'
    rule_config JSONB NOT NULL,  -- Configuration de la règle
    
    -- Période de validité
    valid_from DATE NOT NULL,
    valid_to DATE,  -- NULL = indéfini
    
    -- Métadonnées
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_billing_rules_tenant ON billing_rules(tenant);
CREATE INDEX idx_billing_rules_validity ON billing_rules(valid_from, valid_to);
```

### 6.4 Algorithme de Calcul MRR

```python
def calculate_mrr(tenant: str, period_start: date, period_end: date) -> MRRResult:
    """
    Calcule le MRR pour un tenant sur une période donnée.
    """
    # 1. Récupérer les règles de facturation
    rules = get_billing_rules(tenant, period_start)
    
    # 2. Compter les documents dans la période
    filters = {
        'tenant': tenant,
        'date_from': period_start,
        'date_to': period_end,
        'source': 'sales',  # Factures clients seulement
        'odoo_state': 'posted'  # Postées seulement
    }
    
    documents = vault_query_documents(filters)
    
    # 3. Calculer métriques
    metrics = {
        'document_count': len(documents),
        'total_amount_ht': sum(doc.total_ht or 0 for doc in documents),
        'total_amount_ttc': sum(doc.total_ttc or 0 for doc in documents),
        'storage_bytes': sum(doc.size_bytes for doc in documents)
    }
    
    # 4. Appliquer règles de facturation
    mrr = apply_billing_rules(rules, metrics)
    
    # 5. Sauvegarder snapshot
    save_mrr_snapshot(tenant, period_start, period_end, metrics, mrr)
    
    return mrr
```

---

## 8. Intégration Odoo

### 8.1 Contexte

**Odoo lab.core.doreviateam.com** est utilisé comme système de facturation pour :
- ✅ Gestion de projets
- ✅ Facturation clients
- ✅ Suivi des revenus

**Intégration proposée** : Vault (source de vérité) → Service Calcul MRR → Odoo (facturation)

### 8.2 Architecture d'Intégration

```
Vault (Source de vérité)
    ↓ (données documents)
Service Calcul MRR
    ↓ (MRR calculé)
Bridge Vault → Odoo
    ↓ (factures créées)
Odoo (Facturation)
    ↓ (factures générées)
Clients
```

### 8.3 Flux Automatisé

1. **Calcul MRR** : Service lit données Vault, calcule MRR par tenant/mois
2. **Transformation** : Bridge transforme données MRR en format Odoo
3. **Création factures** : Factures Odoo créées automatiquement via API
4. **Validation** : Factures validées (posted) dans Odoo
5. **Notifications** : Clients notifiés (email, webhook)

### 8.4 Détails Techniques

Voir **[INTEGRATION_ODOO_FACTURATION_MRR.md](INTEGRATION_ODOO_FACTURATION_MRR.md)** pour :
- Format de données MRR → Odoo
- Code d'exemple (Python/XML-RPC)
- Gestion clients et produits Odoo
- Workflow automatisé mensuel
- Gestion erreurs et retry

---

## 7. Architecture Technique

### 7.1 Option A : Service Dédié (Recommandé)

**Architecture** :
```
┌─────────────┐
│   Vault     │  (Source de vérité)
│ PostgreSQL  │
└──────┬──────┘
       │ (lecture seule)
       ↓
┌─────────────┐
│ Billing API │  (Service dédié)
│   (Go/Py)   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Export/    │  (Facturation)
│  Intégration│
└─────────────┘
```

**Avantages** :
- ✅ Séparation des responsabilités
- ✅ Scalabilité indépendante
- ✅ Pas d'impact sur Vault

**Inconvénients** :
- ⚠️ Service supplémentaire à maintenir

### 7.2 Option B : Extension Vault

**Architecture** :
```
┌─────────────┐
│   Vault     │  (Service unifié)
│ + Billing   │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Export/    │  (Facturation)
│  Intégration│
└─────────────┘
```

**Avantages** :
- ✅ Service unique
- ✅ Accès direct aux données

**Inconvénients** :
- ⚠️ Couplage fort
- ⚠️ Impact sur Vault

### 7.3 Recommandation

**Option A (Service Dédié)** recommandée pour :
- Séparation des responsabilités
- Scalabilité
- Maintenabilité

---

## 9. Roadmap d'Implémentation

### Phase 1 : MVP — Calcul MRR Basique (2-3 semaines)

**Objectifs** :
- ✅ Calcul MRR simple (par document)
- ✅ API de consultation basique
- ✅ Export CSV

**Livrables** :
- Service de calcul MRR
- API REST `/api/v1/billing/mrr`
- Export CSV mensuel

### Phase 2 : Règles de Facturation (2-3 semaines)

**Objectifs** :
- ✅ Support forfait + usage
- ✅ Configuration par tenant
- ✅ Historique et snapshots

**Livrables** :
- Table `billing_rules`
- Table `billing_mrr_snapshots`
- API de configuration

### Phase 3 : Intégration et Export (1-2 semaines)

**Objectifs** :
- ✅ Export JSON/PDF
- ✅ Intégration système externe
- ✅ Notifications (webhook, email)

**Livrables** :
- Export multi-format
- Webhook notifications
- Documentation intégration

### Phase 4 : Évolutions (Backlog)

**Objectifs** :
- ✅ Modèle tiers (tiered pricing)
- ✅ Facturation par montant/volume
- ✅ Dashboard de visualisation

---

## 10. Questions Ouvertes

### 10.1 Métier

- ✅ **Modèle de facturation** : Forfait + Usage (recommandé et validé)
- ✅ **Prix forfait** : 50€ à 80€/mois (configurable par tenant)
- ✅ **Prix usage** : 0.15€ à 0.50€ par document (configurable par tenant)
- ❓ **Quels documents compter** ? (Factures clients postées recommandé)
- ❓ **Quelle période** ? (Mois calendaire recommandé)
- ❓ **Nombre de documents inclus dans forfait** ? (500 recommandé, à valider)

### 10.2 Technique

- ❓ **Service dédié ou extension Vault** ? (Service dédié recommandé)
- ❓ **Base de données séparée** ? (Même DB Vault ou séparée ?)
- ❓ **Langage** ? (Go pour cohérence Vault, Python pour intégration DVIG)
- ❓ **Cache** ? (Redis recommandé pour performance)

### 10.3 Intégration

- ❓ **Système de facturation externe** : Odoo lab.core.doreviateam.com (✅ identifié)
- ❓ **API Odoo** : XML-RPC ou REST API ? (À vérifier version Odoo)
- ❓ **Authentification Odoo** : User/password ou API key ?

- ❓ **Système de facturation externe** ? (Quel système ? Format ?)
- ❓ **Fréquence de facturation** ? (Mensuelle recommandée)
- ❓ **Notifications** ? (Email, webhook, les deux ?)

---

## 11. Prochaines Étapes

### Immédiat (Cette semaine)

1. ✅ **Modèle de facturation validé** : Forfait + Usage
2. ✅ **Prix définis** : Forfait 50-80€, Usage 0.15-0.50€/document
3. **Tester connexion Odoo** : Vérifier API disponible (XML-RPC ou REST) sur lab.core.doreviateam.com
4. **Créer produits Odoo** : "Forfait Vault - Base" (50-80€) et "Usage Vault - Document" (0.15-0.50€)
5. **Définir nombre documents inclus** : Valider 500 documents dans forfait (ou autre)
6. **Choisir architecture technique** (service dédié recommandé)

### Court terme (2-4 semaines)

1. **Spécification détaillée** du service de facturation
2. **Prototype MVP** : Calcul MRR basique
3. **Prototype Bridge Odoo** : Script Python test création facture
4. **Tests avec données réelles** (tenants existants)
5. **Intégration complète** : Vault → MRR → Odoo

### Moyen terme (1-2 mois)

1. **Implémentation complète** Phase 1 + Phase 2
2. **Intégration système externe** Phase 3
3. **Documentation et formation** équipes

---

## 12. Conclusion

La **facturation MRR basée sur Vault** est une opportunité majeure pour :
- ✅ Automatiser la facturation
- ✅ Facturer sur l'usage réel
- ✅ Améliorer la traçabilité

**Recommandation** : Démarrer avec un **MVP simple** (facturation par document, forfait + usage) et évoluer progressivement.

**Intégration Odoo** : L'utilisation d'Odoo lab.core.doreviateam.com comme système de facturation permet une intégration naturelle et automatisée. Voir [INTEGRATION_ODOO_FACTURATION_MRR.md](INTEGRATION_ODOO_FACTURATION_MRR.md) pour les détails.

**Effort estimé** : 6-8 semaines pour MVP complet (Phase 1 + Phase 2), incluant intégration Odoo.

---

**Fin du document de réflexion**

*Document à mettre à jour au fur et à mesure des décisions prises.*

