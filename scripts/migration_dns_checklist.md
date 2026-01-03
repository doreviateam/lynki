# ✅ Checklist Migration DNS — Actions Manuelles

**Date** : 2025-12-31  
**IP Serveur** : `85.215.206.213`

---

## 📊 État Actuel (Vérifié)

### ✅ Déjà Créés (4/6)

- ✅ `dvig.dido.doreviateam.com` → `85.215.206.213`
- ✅ `vault.dido.doreviateam.com` → `85.215.206.213`
- ✅ `dvig.rozas.doreviateam.com` → `85.215.206.213`
- ✅ `vault.rozas.doreviateam.com` → `85.215.206.213`

### ⏳ À Créer (2/6)

- ⏳ `dvig.core.doreviateam.com` → `85.215.206.213`
- ⏳ `vault.core.doreviateam.com` → `85.215.206.213`

### ⚠️ Anciens Encore Actifs (2/18)

- ⚠️ `dvig.lab.core.doreviateam.com` → `85.215.206.213` (à supprimer)
- ⚠️ `vault.lab.core.doreviateam.com` → `85.215.206.213` (à supprimer)

---

## ✅ Actions à Effectuer

### Étape 1 : Créer les 2 enregistrements manquants

**Via votre interface DNS/Registrar** :

```
Type: A
Name: dvig.core.doreviateam.com
Value: 85.215.206.213
TTL: 300

Type: A
Name: vault.core.doreviateam.com
Value: 85.215.206.213
TTL: 300
```

**Vérification** :
```bash
dig +short dvig.core.doreviateam.com
# Doit retourner: 85.215.206.213

dig +short vault.core.doreviateam.com
# Doit retourner: 85.215.206.213
```

### Étape 2 : Attendre propagation DNS (5-15 minutes)

### Étape 3 : Vérifier avec le script

```bash
./scripts/migration_dns_verification.sh
```

**Résultat attendu** : Tous les nouveaux hostnames doivent pointer vers `85.215.206.213`

### Étape 4 : Supprimer les 2 anciens enregistrements

**Via votre interface DNS/Registrar** :

- Supprimer : `dvig.lab.core.doreviateam.com`
- Supprimer : `vault.lab.core.doreviateam.com`

**Vérification** :
```bash
dig +short dvig.lab.core.doreviateam.com
# Doit retourner: (vide ou NXDOMAIN)

dig +short vault.lab.core.doreviateam.com
# Doit retourner: (vide ou NXDOMAIN)
```

### Étape 5 : Validation finale

```bash
./scripts/migration_dns_verification.sh
```

**Résultat attendu** :
- ✅ Tous les nouveaux hostnames OK
- ✅ Tous les anciens hostnames supprimés
- ✅ Tests HTTP/HTTPS OK (si services démarrés)

---

## 🔄 Recharger la Gateway

Après validation DNS complète :

```bash
dorevia.sh gateway aggregate --reload
```

---

## 📞 Support

Si problème détecté :
1. Vérifier avec `./scripts/migration_dns_verification.sh`
2. Consulter `ZeDocs/V2/MIGRATION_DNS_P0.1.md`
3. Plan de rollback disponible dans le document détaillé

