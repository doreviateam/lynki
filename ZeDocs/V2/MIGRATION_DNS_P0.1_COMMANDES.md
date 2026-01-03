# 🌐 Migration DNS — Commandes Prêtes à l'Emploi

**IP Serveur** : `85.215.206.213`  
**Date** : 2025-12-31

---

## 📋 Enregistrements à Créer (6)

### Tenant `core`

```
dvig.core.doreviateam.com    A    85.215.206.213    300
vault.core.doreviateam.com   A    85.215.206.213    300
```

### Tenant `dido`

```
dvig.dido.doreviateam.com    A    85.215.206.213    300
vault.dido.doreviateam.com   A    85.215.206.213    300
```

### Tenant `rozas`

```
dvig.rozas.doreviateam.com   A    85.215.206.213    300
vault.rozas.doreviateam.com  A    85.215.206.213    300
```

---

## 🗑️ Enregistrements à Supprimer (18)

### Tenant `core`

```
dvig.lab.core.doreviateam.com
dvig.stinger.core.doreviateam.com
dvig.prod.core.doreviateam.com
vault.lab.core.doreviateam.com
vault.stinger.core.doreviateam.com
vault.prod.core.doreviateam.com
```

### Tenant `dido`

```
dvig.lab.dido.doreviateam.com
dvig.stinger.dido.doreviateam.com
dvig.prod.dido.doreviateam.com
vault.lab.dido.doreviateam.com
vault.stinger.dido.doreviateam.com
vault.prod.dido.doreviateam.com
```

### Tenant `rozas`

```
dvig.lab.rozas.doreviateam.com
dvig.stinger.rozas.doreviateam.com
dvig.prod.rozas.doreviateam.com
vault.lab.rozas.doreviateam.com
vault.stinger.rozas.doreviateam.com
vault.prod.rozas.doreviateam.com
```

---

## ✅ Ordre d'Exécution

1. **Créer** les 6 nouveaux enregistrements (ci-dessus)
2. **Attendre** propagation DNS (5-15 minutes)
3. **Vérifier** avec : `dig +short dvig.core.doreviateam.com` (doit retourner `85.215.206.213`)
4. **Valider** avec l'équipe plateforme
5. **Supprimer** les 18 anciens enregistrements (ci-dessus)

---

## 🔍 Commandes de Vérification

```bash
# Vérifier résolution DNS pour chaque tenant
for tenant in core dido rozas; do
  echo "=== Tenant: $tenant ==="
  echo "DVIG: $(dig +short dvig.$tenant.doreviateam.com)"
  echo "Vault: $(dig +short vault.$tenant.doreviateam.com)"
done
```

**Résultat attendu** : Toutes les requêtes doivent retourner `85.215.206.213`

---

**Document détaillé** : `ZeDocs/V2/MIGRATION_DNS_P0.1.md`

