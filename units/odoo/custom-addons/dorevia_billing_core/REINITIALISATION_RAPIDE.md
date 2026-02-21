# 🔄 Réinitialisation Rapide — Dorevia Billing CORE

Guide pour réinitialiser complètement le module après une réinitialisation d'Odoo.

## 📋 Checklist de Réinitialisation

### ✅ Étape 1 : Installer le Module

1. **Connectez-vous à Odoo** : https://odoo.lab.core.doreviateam.com
2. **Menu** : `Apps` (ou `Applications`)
3. **Recherchez** : `Dorevia Billing CORE`
4. **Cliquez sur** : `Installer`
5. **Attendez** la fin de l'installation

---

### ✅ Étape 2 : Configurer le Token API

1. **Menu** : `Paramètres` → `Technique` → `Paramètres` → `Paramètres Système`
2. **Recherchez** : `dorevia_billing.core_api_token`
3. **Valeur** : `sk_test_abc123xyz789` (ou générez un nouveau token)
4. **Cliquez sur** : `Enregistrer`

**Alternative (via interface)** :
- **Menu** : `Dorevia Billing` → `Paramètres` (si disponible)
- Configurez le token API

---

### ✅ Étape 3 : Créer le Tenant de Test

1. **Menu** : `Contacts` → `Créer`
2. **Remplissez** :
   - **Nom** : `Client Test Premium`
   - **Référence** (champ `ref`) : `test-tenant-1` ⚠️ **IMPORTANT**
   - **Type** : `Entreprise`
   - **Email** : `test@example.com` (optionnel)
3. **Cliquez sur** : `Enregistrer`

**Vérification** :
- Le champ **Référence** doit être `test-tenant-1`
- Le partenaire doit apparaître dans la liste

---

### ✅ Étape 4 : Créer le Contrat de Test

1. **Menu** : `Dorevia Billing` → `Contrats` → `Créer`
2. **Remplissez** :
   - **Nom** : `Contrat Premium Test`
   - **Tenant** : Sélectionnez `Client Test Premium`
   - **Date de début** : `2026-01-01`
   - **Date de fin** : (laisser vide pour contrat illimité)
   - **Actif** : ✅ Cocher
   - **Taux TVA (%)** : `20.0`
   - **Exonéré de TVA** : ❌ Décocher
3. **Cliquez sur** : `Enregistrer`

---

### ✅ Étape 5 : Créer les Règles Tarifaires

Pour chaque type de mouvement (`out_invoice`, `in_invoice`, `out_refund`, `in_refund`), créez 3 paliers :

#### 5.1 Paliers pour `out_invoice` (Facture Client)

1. **Menu** : `Dorevia Billing` → `Contrats` → Ouvrez `Contrat Premium Test`
2. Dans l'onglet **Règles Tarifaires**, cliquez sur **Ajouter une ligne**

**Palier 1** :
- **Type de Mouvement** : `Facture Client`
- **Prix Unitaire HT** : `0.50`
- **Volume Min** : `0`
- **Volume Max** : `100`
- **Remise (%)** : `0`
- **Séquence** : `10`

**Palier 2** :
- **Type de Mouvement** : `Facture Client`
- **Prix Unitaire HT** : `0.40`
- **Volume Min** : `100`
- **Volume Max** : `1000`
- **Remise (%)** : `0`
- **Séquence** : `20`

**Palier 3** :
- **Type de Mouvement** : `Facture Client`
- **Prix Unitaire HT** : `0.30`
- **Volume Min** : `1000`
- **Volume Max** : (laisser vide pour illimité)
- **Remise (%)** : `0`
- **Séquence** : `30`

#### 5.2 Paliers pour `in_invoice` (Facture Fournisseur)

Répétez les mêmes paliers avec :
- **Type de Mouvement** : `Facture Fournisseur`
- **Prix Unitaire HT** : `0.25` (exemple)

#### 5.3 Paliers pour `out_refund` et `in_refund`

Répétez avec les mêmes valeurs ou des valeurs différentes selon vos besoins.

---

### ✅ Étape 6 : Tester l'API

Une fois tout configuré, testez l'API :

```bash
curl -X POST https://odoo.lab.core.doreviateam.com/api/v1/constats \
  -H "Authorization: api_key sk_test_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "constat_id": "550e8400-e29b-41d4-a716-446655440000",
    "tenant": "test-tenant-1",
    "period": "2026-01",
    "generated_at": "2026-02-01T00:05:23Z",
    "vault_id": "vault-test",
    "volumes": {
      "out_invoice": 150,
      "in_invoice": 0,
      "out_refund": 0,
      "in_refund": 0
    },
    "compliance": {
      "compliant": 120,
      "non_compliant_2026": 20,
      "out_of_scope": 10
    },
    "proofs": {
      "jws": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test",
      "ledger_hash": "abc123def456",
      "documents_count": 150
    }
  }'
```

**Réponse attendue** :
```json
{
  "status": "received",
  "constat_id": "550e8400-e29b-41d4-a716-446655440000",
  "tenant": "test-tenant-1",
  "period": "2026-01",
  "processed_at": "2026-01-04T08:45:00Z",
  "invoice_id": null
}
```

---

## 🔍 Vérifications

### Vérifier que le module est installé

1. **Menu** : `Apps` → Recherchez `Dorevia Billing CORE`
2. **Statut** : Doit être `Installé` (pas `À installer`)

### Vérifier que le tenant existe

1. **Menu** : `Contacts` → Recherchez `test-tenant-1`
2. **Vérifiez** : Le champ **Référence** = `test-tenant-1`

### Vérifier que le contrat existe

1. **Menu** : `Dorevia Billing` → `Contrats`
2. **Vérifiez** : `Contrat Premium Test` existe et est actif

### Vérifier que les règles tarifaires existent

1. **Menu** : `Dorevia Billing` → `Contrats` → Ouvrez `Contrat Premium Test`
2. **Onglet** : `Règles Tarifaires`
3. **Vérifiez** : Au moins 3 paliers pour `out_invoice`

---

## ⚠️ Problèmes Courants

### Erreur 404 sur l'API

**Cause** : Module non installé ou contrôleurs non chargés

**Solution** :
1. Vérifiez que le module est `Installé` dans `Apps`
2. Si nécessaire, `Mettre à jour` ou `Réinstaller` le module
3. Redémarrez Odoo si nécessaire

### Erreur "Tenant non trouvé"

**Cause** : Le champ `ref` du partenaire n'est pas `test-tenant-1`

**Solution** :
1. Allez dans `Contacts` → Ouvrez le partenaire
2. Vérifiez que le champ **Référence** = `test-tenant-1`
3. Si absent, ajoutez-le et enregistrez

### Erreur "dorevia.pricing.rule not found"

**Cause** : Module non complètement chargé

**Solution** :
1. Allez dans `Apps` → `Dorevia Billing CORE`
2. Cliquez sur `Mettre à jour`
3. Attendez la fin de la mise à jour
4. Rafraîchissez la page

---

## 📝 Notes

- Le champ **Référence** (`ref`) est utilisé pour identifier le tenant, pas le nom
- Les règles tarifaires sont liées au contrat, pas au tenant directement
- Le module doit être `Installé` (pas juste `À installer`) pour que les routes API fonctionnent
- Après chaque modification, attendez quelques secondes que Odoo recharge les modules

---

## 🎯 Prochaines Étapes

Une fois tout configuré et testé :

1. ✅ Module installé
2. ✅ Token API configuré
3. ✅ Tenant créé
4. ✅ Contrat créé
5. ✅ Règles tarifaires créées
6. ✅ API testée et fonctionnelle

Vous pouvez maintenant utiliser l'API pour recevoir des constats depuis le Vault !

