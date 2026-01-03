# 🚀 Guide Rapide — Migration DNS (Étapes dans l'Ordre)

**Date** : 2025-12-31  
**IP Serveur** : `85.215.206.213`

---

## ✅ ÉTAPE 1 : Créer les 2 enregistrements manquants

**Action** : Via votre interface DNS/Registrar

### Enregistrement 1
```
Type:  A
Name:  dvig.core.doreviateam.com
Value: 85.215.206.213
TTL:   300
```

### Enregistrement 2
```
Type:  A
Name:  vault.core.doreviateam.com
Value: 85.215.206.213
TTL:   300
```

**Vérification** (après création) :
```bash
dig +short dvig.core.doreviateam.com
# Doit retourner: 85.215.206.213

dig +short vault.core.doreviateam.com
# Doit retourner: 85.215.206.213
```

---

## ⏱️ ÉTAPE 2 : Attendre propagation DNS

**Durée** : 5-15 minutes (selon TTL)

**Vérification** :
```bash
./scripts/migration_dns_verification.sh
```

**Résultat attendu** : Les 2 nouveaux enregistrements doivent être OK ✅

---

## 🗑️ ÉTAPE 3 : Supprimer les 2 anciens enregistrements

**Action** : Via votre interface DNS/Registrar

### À supprimer :
- `dvig.lab.core.doreviateam.com`
- `vault.lab.core.doreviateam.com`

**Vérification** (après suppression) :
```bash
dig +short dvig.lab.core.doreviateam.com
# Doit retourner: (vide ou NXDOMAIN)

dig +short vault.lab.core.doreviateam.com
# Doit retourner: (vide ou NXDOMAIN)
```

---

## ✅ ÉTAPE 4 : Validation finale

```bash
./scripts/migration_dns_verification.sh
```

**Résultat attendu** :
- ✅ Tous les nouveaux hostnames OK (6/6)
- ✅ Tous les anciens hostnames supprimés
- ✅ Tests HTTP/HTTPS OK (si services démarrés)

---

## 🔄 ÉTAPE 5 : Recharger la Gateway

```bash
dorevia.sh gateway aggregate --reload
```

---

## 📞 En cas de problème

1. Vérifier avec le script : `./scripts/migration_dns_verification.sh`
2. Consulter : `ZeDocs/V2/MIGRATION_DNS_P0.1.md`
3. Plan de rollback disponible dans le document détaillé

