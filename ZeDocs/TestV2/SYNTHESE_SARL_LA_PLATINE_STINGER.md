# 📋 Synthèse — sarl-la-platine STINGER

**Date** : 2026-01-10  
**Objectif** : Mettre en place une instance Odoo STINGER pour `sarl-la-platine` connectée au DVIG STINGER

---

## 🎯 Ce que nous avons fait

### 1. Infrastructure déployée ✅

**Ce qui tourne maintenant :**
- ✅ **DVIG STINGER** : `dvig.core-stinger.doreviateam.com` (service partagé pour tous les clients STINGER)
- ✅ **Vault STINGER** : `vault.core-stinger.doreviateam.com` (service partagé pour tous les clients STINGER)
- ✅ **Odoo STINGER sarl-la-platine** : `odoo.stinger.sarl-la-platine.doreviateam.com` (votre instance Odoo)

**Pourquoi STINGER ?**
- STINGER = environnement de pré-production
- Permet de tester sans impacter la PROD
- Simule exactement le comportement de la production

---

### 2. Configuration Odoo terminée ✅

**Dans Odoo, vous avez configuré 3 paramètres :**

| Paramètre | Valeur | À quoi ça sert ? |
|-----------|--------|------------------|
| `dorevia.dvig.url` | `https://dvig.core-stinger.doreviateam.com` | L'adresse du service DVIG STINGER |
| `dorevia.dvig.token` | `dvig_HbQGNFHO5mWN6NY5ohUs6My0HVOZDpcL3KCZD_prJ9g` | Votre clé d'authentification |
| `dorevia.dvig.source` | `odoo.stinger.sarl-la-platine` | Votre identifiant unique |

**Ces paramètres permettent à Odoo de :**
- Se connecter au DVIG STINGER
- S'authentifier avec votre token
- Envoyer des événements financiers vers le Vault STINGER

---

## 🔄 Comment ça fonctionne ?

### Flux normal (quand vous utilisez vos modules dorevia_*)

```
┌─────────────┐
│   Odoo      │  Vous créez/modifiez un document financier
│ sarl-la-    │  (facture, paiement, etc.)
│  platine    │
└──────┬──────┘
       │
       │ 1. Odoo envoie l'événement
       │    avec le token
       ▼
┌─────────────┐
│   DVIG      │  2. DVIG vérifie le token
│   STINGER   │  3. DVIG valide la source
└──────┬──────┘     (odoo.stinger.sarl-la-platine)
       │
       │ 4. DVIG transmet à Vault
       ▼
┌─────────────┐
│   Vault     │  5. Vault stocke l'événement
│   STINGER   │     dans la base de données
└─────────────┘
```

**Important :**
- Tout se passe dans l'environnement **STINGER** (pas en PROD)
- Votre PROD n'est **pas impactée**
- Vous pouvez tester en toute sécurité

---

## ✅ Ce qui est fait

- [x] Infrastructure STINGER déployée (DVIG + Vault)
- [x] Instance Odoo STINGER créée pour `sarl-la-platine`
- [x] Base de données Odoo créée : `odoo_stinger_sarl-la-platine`
- [x] Configuration DVIG dans Odoo terminée (3 paramètres)
- [x] HTTPS fonctionnel avec certificat SSL
- [ ] Module `dorevia_posted_lock` à activer (recommandé)

---

## ⏳ Ce qui reste à faire

### Module à activer : `dorevia_posted_lock` ✅

**Action** : Activer le module `dorevia_posted_lock` dans Odoo

**Rôle** : Verrouille les écritures comptables validées pour éviter les modifications

**Pourquoi l'activer ?**
- ✅ Protection comptable : Les factures validées ne peuvent plus être modifiées
- ✅ Garantit l'intégrité des données comptables
- ✅ Conforme à la Règle Fondatrice Dorevia #2 (Immutabilité)

**Comment activer ?**
1. Dans Odoo → Apps
2. Rechercher "Dorevia Posted Lock"
3. Cliquer sur "Activer"

**Note** : Ce module est indépendant de DVIG/Vault. Il fonctionne localement dans Odoo.

---

### Configuration DVIG (pour plus tard)

**État actuel** : ✅ Configuration DVIG terminée (3 paramètres configurés)

**Quand l'utiliser ?**
- Quand vous installerez un module qui envoie des événements vers DVIG
- Les paramètres `dorevia.dvig.*` sont prêts et seront utilisés automatiquement

---

## 📊 État actuel

### URLs disponibles

- **Odoo STINGER** : https://odoo.stinger.sarl-la-platine.doreviateam.com
- **DVIG STINGER** : https://dvig.core-stinger.doreviateam.com/health
- **Vault STINGER** : https://vault.core-stinger.doreviateam.com/health

### Containers actifs

- `odoo_stinger_sarl-la-platine` : Up
- `odoo_db_stinger_sarl-la-platine` : Up (healthy)
- `dvig-core-stinger` : Up (healthy)
- `vault-core-stinger` : Up (healthy)

---

## 🎯 Résumé en 3 points

1. **Infrastructure prête** : DVIG + Vault STINGER déployés et opérationnels
2. **Odoo configuré** : Votre instance Odoo STINGER est connectée au DVIG STINGER
3. **Prêt pour les tests** : Quand vous utiliserez vos modules `dorevia_*`, tout fonctionnera automatiquement

---

## ❓ Questions fréquentes

### "Pourquoi STINGER et pas PROD ?"
- STINGER = environnement de test/pré-production
- Permet de tester sans risque pour la PROD
- Une fois validé en STINGER, vous pourrez déployer en PROD

### "Où sont stockées mes données ?"
- **Odoo** : Base de données `odoo_stinger_sarl-la-platine` (container PostgreSQL)
- **Vault** : Base de données `dorevia_vault` (container PostgreSQL séparé)
- Toutes les données sont dans l'environnement STINGER (isolé de la PROD)

### "Comment passer en PROD ?"
- Quand vous serez prêt, vous pourrez :
  1. Créer une instance Odoo PROD pour `sarl-la-platine`
  2. Configurer les paramètres DVIG PROD (même principe)
  3. Migrer les données si nécessaire

---

**Version** : 1.0  
**Date** : 2026-01-10  
**Statut** : ✅ **Configuration terminée et opérationnelle**
