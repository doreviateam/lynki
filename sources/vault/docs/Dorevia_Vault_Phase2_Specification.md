# 📘 **Dorevia Vault — Spécifications Officielles Phase 2**

### **POS Z-Reports • Double Chaîne Cryptographique • Multi-Tenant**

**Version : 1.0 — Janvier 2025**

**Auteur : Doreviateam**

**Statut : OFFICIEL — DOCUMENT DE RÉFÉRENCE**

---

# 🏛️ 1. Scope & Objectifs

La Phase **2** du projet Dorevia Vault étend les capacités du système au-delà des tickets POS individuels en y ajoutant :

### ✔ **Z-Reports scellés cryptographiquement**

### ✔ **Chaînage vertical (Ticket-Chain) et horizontal (Z-Chain)**

### ✔ **Preuve JWS pour les clôtures de session POS**

### ✔ **Stockage certifiable dans un Ledger multi-tenant**

### ✔ **API stable, versionnée, auditable**

### ✔ **Compatibilité TSE / NF525-like**

### ✔ **Tolérance aux pannes + cohérence forte**

Ces spécifications définissent **toutes les exigences fonctionnelles, techniques, cryptographiques et organisationnelles** nécessaires pour donner à Dorevia Vault une dimension **conforme, souveraine, scalable et certifiable**.

---

# 🧩 2. Contexte Architecturel

### 2.1. Architecture existante (Sprint 5 — v1.3.0)

* Go / Fiber

* Multi-tenant via header `X-Tenant`

* Ledger JSON filesystem

* JWS pour factures et tickets POS

* Observabilité : logs étendus + Prometheus/metrics

* Versioning buildinfo.go

* Endpoints existants :

  * `/api/v1/invoices`

  * `/api/v1/pos/tickets`

  * `/api/v1/evidence/...`

### 2.2. Nouveaux besoins Phase 2

* Nouvelle entité : **Z-Report POS**

* Nouveau chaînage horizontal (Z-chain)

* Lien cryptographique obligatoire avec le dernier ticket validé

* Index mensuel pour chaque tenant

* Preuves JWS spécifiques aux Z‐Reports

* Endpoints robustes + validation renforcée

---

# 🧱 3. Exigences Fonctionnelles

### 3.1. Création d'un Z-Report

L'API doit permettre de :

* Recevoir un payload JSON complet

* Vérifier l'intégrité du payload

* Vérifier la cohérence multi-tenant

* Inscrire le Z dans le ledger

* Calculer le hash

* Générer une preuve JWS

* Retourner une réponse canonique

### 3.2. Chaînage cryptographique

Un Z-Report doit inclure :

1. **hash_prev**

   Hash du dernier Z du **même tenant** et du **même mois**

2. **last_ticket_hash**

   Hash SHA256 du dernier ticket vaulté de la session

3. **hash_current**

   Calculé par le Vault après canonicalisation

### 3.3. Validation du tenant

Le Vault doit refuser :

* Tenant manquant ou incorrect

* Incohérence entre X-Tenant et payload.tenant

* Incohérence entre tenant et company_id

### 3.4. Stockage Ledger

Un Z doit être enregistré dans :

```
ledger/
 └── tenants/<tenant_id>/pos/z/YYYY/MM/
      ├── <z_id>.json
      ├── index.json
      └── last.json   # le hash_current du dernier Z
```

### 3.5. Preuve cryptographique

Le Vault doit produire une preuve JWS contenant :

* z_id

* tenant

* hash_current

* hash_prev

* timestamp

* signature clé privée Vault

Endpoint de récupération :

```
GET /api/v1/evidence/<tenant>/<z_id>
```

---

# 📤 4. API — POST Z-Reports (spécification canonique)

## 4.1. Endpoint

```
POST /api/v1/pos/zreports
```

## 4.2. Headers obligatoires

```
Authorization: Bearer <JWT>
Content-Type: application/json
X-Tenant: <tenant_id>
```

## 4.3. Payload JSON détaillé

```json
{
  "z_id": "Z2025-11-15-01",
  "company_id": 1,
  "sequence": 1,
  "date_open": "2025-11-15T08:00:00Z",
  "date_close": "2025-11-15T18:00:00Z",
  "totals": {
    "amount_total": 2543.60,
    "amount_tax": 217.30,
    "amount_net": 2326.30
  },
  "payments": [
    {"method": "cash", "amount": 652.00},
    {"method": "card", "amount": 1490.30}
  ],
  "tickets": [
    "POS/2025/000145",
    "POS/2025/000146"
  ],
  "tickets_count": 142,
  "hash_prev": "aabbccddeeff...",
  "hash_current": null,
  "last_ticket_hash": "ff213ea9b2...",
  "chain_level": "z-report",
  "tenant": "1"
}
```

---

# 🔐 5. Validation cryptographique

## 5.1. Canonicalisation JSON

Avant hash :

* suppression du champ `hash_current`

* tri alphabétique des clés

* représentation JSON stable RFC8785 (canonical JSON)

## 5.2. Calcul du Hash

```
hash_current = SHA256(canonical_json)
```

Sortie hexadécimale en minuscules.

## 5.3. Preuve JWS

Structure interne du JWS :

```json
{
  "z_id": "Z2025-11-15-01",
  "tenant": "1",
  "hash_current": "abf23e...",
  "hash_prev": "xyz789...",
  "iat": 1736965273,
  "iss": "dorevia-vault"
}
```

Algorithmie :

* ES256 ou EdDSA (selon ta clé)

* clé privée signée au build ou injectée via env

---

# 🗄️ 6. Ledger — Format de stockage

### 6.1. Structure des répertoires

```
ledger/
 └── tenants/<tenant>/pos/z/<year>/<month>/
      ├── Z2025-11-15-01.json
      ├── Z2025-11-16-01.json
      ├── last.json
      └── index.json
```

### 6.2. Format d'un fichier Z

```json
{
  "payload": { ... payload complet ... },
  "hash_current": "abcd1234...",
  "hash_prev": "789eff...",
  "timestamp": "2025-11-15T18:00:00Z",
  "proof_url": "/api/v1/evidence/1/Z2025-11-15-01"
}
```

### 6.3. Fichier `index.json`

```json
{
  "last_z_id": "Z2025-11-15-01",
  "last_hash": "abcd1234...",
  "count": 23,
  "z_reports": [
    "Z2025-11-10-01",
    "Z2025-11-11-01",
    ...
  ]
}
```

---

# 🧪 7. Tests d'intégration obligatoires

## 7.1. Tests API

* Z simple sans hash_prev (premier du mois)

* Z avec hash_prev correct

* Z rejeté (hash_prev incorrect)

* Z rejeté (tenant incorrect)

* Z rejeté si tickets_count < len(tickets)

* Z accepté + preuve consultable via /evidence

## 7.2. Tests de chaînage

* Construction 30 jours de suite

* Reconstruction ledger complète

* Vérification absence de trous

## 7.3. Tests de performances

* Hash < 20ms

* Écriture fichier < 10ms

* 500 Z/minute par tenant

---

# 🛡️ 8. SLA internes & sécurité

## 8.1. Multi-tenant strict

* Aucun mélange de ledger

* Contrôle systématique tenant ↔ company_id

* Contrôle JWS par tenant

## 8.2. Durabilité

* Écritures fsync

* Aucune suppression possible (append-only)

## 8.3. Logs

* Log entrée API (tenant, z_id)

* Log hash_current

* Log preuve générée

* Log stockage dans ledger

---

# 🚦 9. Routes à implémenter

```
POST /api/v1/pos/zreports
GET  /api/v1/evidence/:tenant/:z_id
GET  /api/health/zreports
```

---

# 🧩 10. Structure du code Go attendue

## 10.1. Nouveau handler

```
internal/handlers/pos_zreports.go
```

## 10.2. Nouveau service

```
internal/services/ledger/zreports.go
```

## 10.3. Nouveau validateur

```
internal/validators/zreport.go
```

## 10.4. Mise à jour du router

```
routes/v1_pos.go
```

## 10.5. Mise à jour JWS

```
internal/signature/jws.go
```

---

# 📦 11. Schéma de données final (canonique)

### Z-Report canonical key order :

1. chain_level

2. company_id

3. date_close

4. date_open

5. hash_prev

6. hash_current

7. last_ticket_hash

8. payments

9. sequence

10. tickets

11. tickets_count

12. totals

13. z_id

14. tenant

---

# 📝 12. Versioning & compatibilité

### API version : `v1.0-zreports`

### Compatibilité : `dorevia-vault >= 1.3.0`

### Ruptures : aucune

### Backward compatible : oui (ajout uniquement)

---

# 🎯 13. Finalité & conformité

Grâce à cette Phase 2 :

* ✔ tu as une chaîne blockchain interne double-niveau

* ✔ conforme à l'esprit TSE / NF525

* ✔ immuabilité certifiable

* ✔ multi-tenant souverain

* ✔ compatible PME & multi-magasins

* ✔ prêt pour future certification

---

# 🏁 **FIN DU DOCUMENT OFFICIEL — Phase 2**

**Document de référence officiel pour l'implémentation de la Phase 2 : Z-Reports avec double chaîne cryptographique.**

---

**Version : 1.0 — Janvier 2025**

**Auteur : Doreviateam**

**Statut : OFFICIEL — DOCUMENT DE RÉFÉRENCE**

