# 🔗 Intégration Odoo — Facturation MRR basée sur Vault

**Version** : 1.0  
**Date** : 2026-01-03  
**Contexte** : Odoo lab.core.doreviateam.com comme centre de gestion projets et facturation  
**Statut** : 📋 Complément à REFLECTION_FACTURATION_MRR_VAULT.md

---

## 📋 Vue d'Ensemble

Ce document complète la réflexion sur la facturation MRR basée sur Vault en intégrant **Odoo** comme système de facturation cible.

**Architecture** :
```
Vault (Source de vérité)
    ↓ (données documents)
Service Calcul MRR
    ↓ (MRR calculé)
Odoo (Facturation)
    ↓ (factures générées)
Clients
```

---

## 🎯 Objectif

Automatiser la création de factures Odoo à partir des données Vault, permettant une facturation MRR précise et traçable.

---

## 1. Architecture d'Intégration

### 1.1 Flux de Données

```
┌─────────────────┐
│      Vault      │  (Source de vérité)
│   PostgreSQL    │  - Documents stockés
│   + Métadonnées │  - total_ht, total_ttc
└────────┬────────┘
         │
         ↓ (lecture)
┌─────────────────┐
│ Service Calcul  │  (Service dédié)
│      MRR        │  - Agrégation par tenant/mois
│                 │  - Application règles
└────────┬────────┘
         │
         ↓ (MRR calculé)
┌─────────────────┐
│  Intégration    │  (Bridge Vault → Odoo)
│  Vault → Odoo   │  - Format données Odoo
│                 │  - API Odoo
└────────┬────────┘
         │
         ↓ (création factures)
┌─────────────────┐
│      Odoo       │  (Système de facturation)
│ lab.core...     │  - Factures clients
│                 │  - Gestion projets
└─────────────────┘
```

### 1.2 Composants

#### Composant 1 : Service Calcul MRR
- **Responsabilité** : Calculer MRR depuis données Vault
- **Technologie** : Go ou Python
- **Sortie** : Données MRR structurées (JSON)

#### Composant 2 : Bridge Vault → Odoo
- **Responsabilité** : Transformer données MRR en format Odoo
- **Technologie** : Python (intégration Odoo XML-RPC ou REST)
- **Sortie** : Factures Odoo créées

#### Composant 3 : Odoo (existant)
- **Responsabilité** : Gérer factures et projets
- **URL** : https://odoo.lab.core.doreviateam.com
- **Fonctionnalités** : Facturation, gestion projets, CRM

---

## 2. Modèle de Données Odoo

### 2.1 Structure Facture Odoo

**Modèle Odoo** : `account.move` (factures)

**Champs principaux** :
- `partner_id` : Client (tenant)
- `invoice_date` : Date facture
- `date_due` : Date échéance
- `invoice_line_ids` : Lignes de facture
- `amount_total` : Montant total TTC
- `amount_untaxed` : Montant HT
- `state` : État (draft, posted, paid)

### 2.2 Lignes de Facture

**Modèle Odoo** : `account.move.line`

**Champs principaux** :
- `product_id` : Produit/service facturé
- `name` : Description
- `quantity` : Quantité
- `price_unit` : Prix unitaire
- `price_subtotal` : Sous-total HT

### 2.3 Produits/Services à Créer dans Odoo

**Produits recommandés** :
1. **"Forfait Vault - Base"** : Forfait mensuel de base
2. **"Usage Vault - Document"** : Facturation par document
3. **"Usage Vault - Stockage"** : Facturation par volume (si applicable)

---

## 3. Format de Données MRR → Odoo

### 3.1 Structure Données MRR

```json
{
  "tenant": "rozas",
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "metrics": {
    "document_count": 1250,
    "total_amount_ht": 125000.00,
    "total_amount_ttc": 150000.00,
    "storage_bytes": 5368709120
  },
  "billing": {
    "base_fee": 65.00,
    "usage_fee": 225.00,
    "total_mrr": 290.00,
    "currency": "EUR"
  },
  "rules_applied": {
    "rule_type": "flat_plus_usage",
    "base_documents_included": 500,
    "price_per_document": 0.30
  }
}
```

### 3.2 Transformation Odoo

**Facture Odoo générée** :

```python
invoice_data = {
    'partner_id': partner_id,  # ID client Odoo (tenant)
    'invoice_date': '2026-02-01',  # Date facture (mois suivant)
    'date_due': '2026-02-15',  # Échéance (15 jours)
    'invoice_line_ids': [
        # Ligne 1 : Forfait de base
        (0, 0, {
            'product_id': product_base_fee_id,
            'name': 'Forfait Vault - Base (Janvier 2026)',
            'quantity': 1,
            'price_unit': 65.00,  # Moyenne entre 50€ et 80€
        }),
        # Ligne 2 : Usage supplémentaire
        (0, 0, {
            'product_id': product_usage_document_id,
            'name': f'Usage Vault - Documents (750 documents × 0.30€)',
            'quantity': 750,
            'price_unit': 0.30,  # Moyenne entre 0.15€ et 0.50€
        }),
    ],
    'ref': f'VAULT-{tenant}-{period_start}',  # Référence
}
```

---

## 4. Intégration Technique

### 4.1 API Odoo

**Méthode 1 : XML-RPC (classique)**

```python
import xmlrpc.client

# Connexion
url = "https://odoo.lab.core.doreviateam.com"
db = "odoo_db"
username = "admin"
password = "password"

common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')
uid = common.authenticate(db, username, password, {})

models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

# Créer facture
invoice_id = models.execute_kw(
    db, uid, password,
    'account.move', 'create',
    [invoice_data]
)
```

**Méthode 2 : REST API (moderne, si disponible)**

```python
import requests

url = "https://odoo.lab.core.doreviateam.com/api/v1/invoices"
headers = {
    'Authorization': 'Bearer <token>',
    'Content-Type': 'application/json'
}

response = requests.post(url, json=invoice_data, headers=headers)
invoice_id = response.json()['id']
```

### 4.2 Service Bridge Vault → Odoo

**Structure proposée** :

```python
# services/billing_odoo_bridge.py

class OdooBillingBridge:
    def __init__(self, odoo_url, odoo_db, odoo_user, odoo_password):
        self.odoo = OdooClient(odoo_url, odoo_db, odoo_user, odoo_password)
    
    def create_invoice_from_mrr(self, mrr_data: MRRData) -> int:
        """
        Crée une facture Odoo à partir de données MRR.
        
        Returns:
            invoice_id: ID de la facture créée dans Odoo
        """
        # 1. Récupérer ou créer client Odoo (tenant)
        partner_id = self.get_or_create_partner(mrr_data.tenant)
        
        # 2. Préparer données facture
        invoice_data = self.prepare_invoice_data(mrr_data, partner_id)
        
        # 3. Créer facture dans Odoo
        invoice_id = self.odoo.create_invoice(invoice_data)
        
        # 4. Valider facture (post)
        self.odoo.post_invoice(invoice_id)
        
        return invoice_id
    
    def get_or_create_partner(self, tenant: str) -> int:
        """Récupère ou crée un client Odoo pour un tenant."""
        # Recherche existant
        partner_id = self.odoo.search_partner_by_name(tenant)
        if partner_id:
            return partner_id
        
        # Création nouveau
        partner_data = {
            'name': f'Client {tenant}',
            'customer_rank': 1,
            'is_company': True,
        }
        return self.odoo.create_partner(partner_data)
    
    def prepare_invoice_data(self, mrr_data: MRRData, partner_id: int) -> dict:
        """Prépare les données de facture Odoo depuis MRR."""
        # Lignes de facture
        invoice_lines = []
        
        # Ligne forfait
        if mrr_data.billing.base_fee > 0:
            invoice_lines.append({
                'product_id': self.get_product_id('base_fee'),
                'name': f'Forfait Vault - Base ({mrr_data.period.start})',
                'quantity': 1,
                'price_unit': mrr_data.billing.base_fee,
            })
        
        # Ligne usage
        if mrr_data.billing.usage_fee > 0:
            invoice_lines.append({
                'product_id': self.get_product_id('usage_document'),
                'name': f'Usage Vault - {mrr_data.metrics.document_count} documents',
                'quantity': mrr_data.metrics.document_count - mrr_data.rules_applied.base_documents_included,
                'price_unit': mrr_data.rules_applied.price_per_document,
            })
        
        # Facture
        invoice_date = self.get_invoice_date(mrr_data.period.end)
        
        return {
            'partner_id': partner_id,
            'invoice_date': invoice_date,
            'date_due': self.get_due_date(invoice_date),
            'invoice_line_ids': [(0, 0, line) for line in invoice_lines],
            'ref': f'VAULT-{mrr_data.tenant}-{mrr_data.period.start}',
        }
```

---

## 5. Processus Automatisé

### 5.1 Workflow Mensuel

```
Jour 1 du mois (ex: 1er Février)
    ↓
1. Calculer MRR pour mois précédent (Janvier)
    - Service Calcul MRR lit données Vault
    - Agrège par tenant
    - Applique règles de facturation
    ↓
2. Générer factures Odoo
    - Bridge Vault → Odoo transforme données
    - Crée factures dans Odoo
    - Valide factures (post)
    ↓
3. Notifications
    - Email clients (si configuré)
    - Webhook (si configuré)
    ↓
4. Archivage
    - Snapshot MRR sauvegardé
    - Traçabilité complète
```

### 5.2 Déclenchement

**Option A : Cron/Scheduler**

```python
# Tâche cron quotidienne (vérifie si 1er du mois)
@cron.daily
def check_monthly_billing():
    today = date.today()
    if today.day == 1:  # 1er du mois
        previous_month = today - timedelta(days=1)
        generate_monthly_billing(previous_month)
```

**Option B : API Manuelle**

```bash
# Déclenchement manuel
POST /api/v1/billing/generate
{
  "period": {
    "start": "2026-01-01",
    "end": "2026-01-31"
  },
  "tenants": ["rozas", "dido"]  # Optionnel, tous si vide
}
```

---

## 6. Gestion des Clients Odoo

### 6.1 Mapping Tenant → Client Odoo

**Table de correspondance** :

| Tenant | Client Odoo | Partner ID |
|--------|-------------|------------|
| `core` | Doreviateam (interne) | 1 |
| `rozas` | Client Rozas | 42 |
| `dido` | Client Dido | 43 |

**Gestion** :
- ✅ Création automatique si client n'existe pas
- ✅ Mapping configurable (table ou fichier JSON)
- ✅ Synchronisation nom/email si nécessaire

### 6.2 Produits Odoo

**Produits à créer dans Odoo** :

1. **"Forfait Vault - Base"**
   - Type : Service
   - Prix : 50€ à 80€ par mois (configurable par tenant)
   - Prix moyen recommandé : 65€
   - Compte : 706000 (Ventes de services)

2. **"Usage Vault - Document"**
   - Type : Service
   - Prix : 0.15€ à 0.50€ par document (configurable par tenant)
   - Prix moyen recommandé : 0.30€
   - Compte : 706000 (Ventes de services)

3. **"Usage Vault - Stockage"** (si applicable)
   - Type : Service
   - Prix : Variable (par GB)
   - Compte : 706000

---

## 7. Traçabilité et Audit

### 7.1 Lien Vault → Odoo

**Champ de référence dans facture Odoo** :
- `ref` : `VAULT-{tenant}-{period_start}`
- `invoice_origin` : Lien vers snapshot MRR

**Champ de référence dans snapshot MRR** :
- `odoo_invoice_id` : ID facture Odoo créée
- `odoo_invoice_number` : Numéro facture Odoo

### 7.2 Audit Trail

**Logs à conserver** :
- ✅ Date/heure calcul MRR
- ✅ Données sources (documents Vault)
- ✅ Règles appliquées
- ✅ Facture Odoo créée (ID, numéro)
- ✅ Erreurs éventuelles

---

## 8. Gestion des Erreurs

### 8.1 Scénarios d'Erreur

**Erreur 1 : Client Odoo introuvable**
- ✅ Création automatique du client
- ✅ Log de création

**Erreur 2 : Produit Odoo introuvable**
- ✅ Création automatique du produit
- ✅ Log de création

**Erreur 3 : Échec création facture Odoo**
- ✅ Retry avec backoff exponentiel
- ✅ Notification administrateur
- ✅ Log détaillé de l'erreur

**Erreur 4 : Données Vault incomplètes**
- ✅ Avertissement dans logs
- ✅ Facturation partielle si possible
- ✅ Notification administrateur

### 8.2 Stratégie de Retry

```python
def create_invoice_with_retry(mrr_data, max_retries=3):
    for attempt in range(max_retries):
        try:
            return bridge.create_invoice_from_mrr(mrr_data)
        except OdooAPIError as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)  # Backoff exponentiel
                continue
            raise  # Dernière tentative échouée
```

---

## 9. Configuration

### 9.1 Fichier de Configuration

```yaml
# config/billing_odoo.yaml

odoo:
  url: "https://odoo.lab.core.doreviateam.com"
  database: "odoo_db"
  username: "billing_service"
  password: "${ODOO_PASSWORD}"  # Variable d'environnement
  
  products:
    base_fee: "Forfait Vault - Base"
    usage_document: "Usage Vault - Document"
    usage_storage: "Usage Vault - Stockage"
  
  defaults:
    payment_terms: 15  # Jours d'échéance
    invoice_type: "out_invoice"  # Facture client

vault:
  database_url: "${VAULT_DB_URL}"
  query_timeout: 30  # secondes

billing:
  schedule:
    day_of_month: 1  # 1er du mois
    time: "02:00"  # 2h du matin
```

---

## 10. Roadmap d'Implémentation

### Phase 1 : MVP — Intégration Basique (2 semaines)

**Objectifs** :
- ✅ Connexion Odoo (XML-RPC ou REST)
- ✅ Création facture simple (forfait fixe)
- ✅ Mapping tenant → client Odoo

**Livrables** :
- Service Bridge Vault → Odoo
- Script de test création facture
- Documentation connexion Odoo

### Phase 2 : Automatisation (1-2 semaines)

**Objectifs** :
- ✅ Calcul MRR depuis Vault
- ✅ Génération automatique factures
- ✅ Gestion produits Odoo

**Livrables** :
- Service Calcul MRR
- Intégration complète Vault → Odoo
- Cron/Scheduler mensuel

### Phase 3 : Robustesse (1 semaine)

**Objectifs** :
- ✅ Gestion erreurs et retry
- ✅ Traçabilité complète
- ✅ Notifications

**Livrables** :
- Gestion erreurs robuste
- Audit trail complet
- Notifications email/webhook

---

## 11. Questions à Résoudre

### 11.1 Technique

- ❓ **API Odoo** : XML-RPC ou REST API ? (Vérifier version Odoo)
- ❓ **Authentification** : User/password ou API key ?
- ❓ **Produits Odoo** : Création manuelle ou automatique ?

### 11.2 Métier

- ❓ **Validation factures** : Automatique (post) ou manuelle ?
- ❓ **Notifications clients** : Email automatique depuis Odoo ?
- ❓ **Période facturation** : Mois calendaire ou glissant ?

### 11.3 Configuration

- ❓ **Mapping tenants** : Table configurée ou création auto ?
- ❓ **Produits** : IDs fixes ou recherche par nom ?
- ❓ **Comptes comptables** : Configuration par tenant ?

---

## 12. Prochaines Étapes

### Immédiat

1. **Tester connexion Odoo** : Vérifier API disponible (XML-RPC ou REST)
2. **Créer produits Odoo** : Forfait et Usage dans Odoo
3. **Créer clients Odoo** : Mapping tenants → clients

### Court terme

1. **Prototype Bridge** : Script Python test création facture
2. **Intégration Calcul MRR** : Lier service calcul avec bridge Odoo
3. **Tests end-to-end** : Vault → MRR → Odoo

### Moyen terme

1. **Automatisation complète** : Cron mensuel
2. **Robustesse** : Gestion erreurs, retry, notifications
3. **Documentation** : Guide utilisateur et technique

---

## 13. Conclusion

L'intégration **Vault → Odoo** pour la facturation MRR permet :

- ✅ **Automatisation complète** : De la collecte données à la facture client
- ✅ **Traçabilité** : Chaque facture liée aux documents Vault
- ✅ **Cohérence** : Un seul système de facturation (Odoo)
- ✅ **Évolutivité** : Facile d'ajouter nouveaux modèles de facturation

**Recommandation** : Démarrer avec un **MVP simple** (facture forfait fixe) puis évoluer vers calcul MRR complet.

**Effort estimé** : 4-5 semaines pour intégration complète (Phase 1 + Phase 2 + Phase 3).

---

**Fin du document d'intégration Odoo**

*Complément à REFLECTION_FACTURATION_MRR_VAULT.md*

