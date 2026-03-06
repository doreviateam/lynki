# 🌐 Migration DNS — Résumé Exécutif (Infrastructure)

**Date** : 2025-12-31  
**Priorité** : 🔴 **HAUTE**  
**Durée estimée** : 1-2 heures

---

## 🎯 Action Requise

**Changement** : Hostnames DVIG/Vault passent de `dvig.<env>.<tenant>` à `dvig.<tenant>` (sans environnement).

**Impact** : 3 tenants (`core`, `dido`, `rozas`)

---

## 📋 Enregistrements DNS à Modifier

### À Créer (6 enregistrements)

```
dvig.core.doreviateam.com    A    85.215.206.213    300
vault.core.doreviateam.com   A    85.215.206.213    300

dvig.dido.doreviateam.com    A    85.215.206.213    300
vault.dido.doreviateam.com   A    85.215.206.213    300

dvig.rozas.doreviateam.com   A    85.215.206.213    300
vault.rozas.doreviateam.com  A    85.215.206.213    300
```

### À Supprimer (18 enregistrements)

**Tenant `core`** :
- `dvig.lab.core.doreviateam.com`
- `dvig.stinger.core.doreviateam.com`
- `dvig.prod.core.doreviateam.com`
- `vault.lab.core.doreviateam.com`
- `vault.stinger.core.doreviateam.com`
- `vault.prod.core.doreviateam.com`

**Tenant `dido`** :
- `dvig.lab.dido.doreviateam.com`
- `dvig.stinger.dido.doreviateam.com`
- `dvig.prod.dido.doreviateam.com`
- `vault.lab.dido.doreviateam.com`
- `vault.stinger.dido.doreviateam.com`
- `vault.prod.dido.doreviateam.com`

**Tenant `rozas`** :
- `dvig.lab.rozas.doreviateam.com`
- `dvig.stinger.rozas.doreviateam.com`
- `dvig.prod.rozas.doreviateam.com`
- `vault.lab.rozas.doreviateam.com`
- `vault.stinger.rozas.doreviateam.com`
- `vault.prod.rozas.doreviateam.com`

---

## ⚠️ Ordre d'Exécution

1. **Créer** les 6 nouveaux enregistrements
2. **Vérifier** propagation DNS (5-15 min)
3. **Valider** avec l'équipe plateforme
4. **Supprimer** les 18 anciens enregistrements (après validation)

---

## 📞 IP Serveur

**IP publique** : `85.215.206.213`

Tous les enregistrements A pointent vers cette IP.

---

**Document détaillé** : `ZeDocs/V2/MIGRATION_DNS_P0.1.md`

