# 🔍 Divergences Mineures : Code vs Documentation

**Date** : 2026-01-04  
**Statut** : ⚠️ **Divergences mineures identifiées (non bloquantes)**

---

## 📋 Résumé

Ces divergences sont **mineures** et n'affectent pas le fonctionnement du système. Elles concernent principalement :
- Des cas limites (valeurs nulles)
- Des formats de messages légèrement différents
- Des détails d'implémentation non documentés

**Aucune divergence majeure détectée.**

---

## 1️⃣ `invoice_origin` avec valeur par défaut "N/A"

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** (ligne 402) :
```
invoice_origin : "Constat 2026-01 - Vault vault-rozas"
```

### Code

**`dorevia_constat.py`** (ligne 405) :
```python
'invoice_origin': f'Constat {self.period} - Vault {self.vault_id or "N/A"}',
```

### Divergence

Le code gère le cas où `vault_id` est `None` ou vide en affichant `"N/A"`, alors que la documentation montre toujours un `vault_id` réel.

**Impact** : ⚠️ **Mineur**
- Cas limite : Si un constat est créé sans `vault_id` (peu probable en production)
- Comportement : Affiche `"Constat 2026-01 - Vault N/A"` au lieu d'un identifiant

**Recommandation** : 
- Option 1 : Documenter ce comportement dans `THE_BIG_DETAILED_PICTURE.md`
- Option 2 : Modifier le code pour toujours exiger un `vault_id` (validation)

---

## 2️⃣ Format de période : bornes temporelles

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** (ligne 204-206) :
```
- Les documents inclus sont ceux dont created_at ∈ [start_of_period, end_of_period], en UTC
- start_of_period : Premier jour du mois à 00:00:00 UTC
- end_of_period : Dernier jour du mois à 23:59:59 UTC
```

### Code

**`constat.go`** (ligne 91-92, 124-125) :
```go
AND created_at >= $2
AND created_at <= $3
```

Avec `parsePeriod()` (ligne 157-162) :
```go
startOfPeriod := time.Date(parsedTime.Year(), parsedTime.Month(), 1, 0, 0, 0, 0, time.UTC)
nextMonth := startOfPeriod.AddDate(0, 1, 0)
endOfPeriod := nextMonth.Add(-time.Second) // = 23:59:59 UTC du dernier jour
```

### Divergence

**Aucune divergence réelle** : Le code implémente exactement ce qui est documenté.

**Note** : Le code utilise `>=` et `<=` ce qui est correct pour inclure les bornes. La documentation utilise `∈ [start, end]` ce qui est mathématiquement équivalent.

**Impact** : ✅ **Aucun** (conforme)

---

## 3️⃣ Messages d'erreur de validation

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** (ligne 93-99) :
```
1. model = "account.move" → Rejet si différent
2. state = "posted" → Rejet si différent
3. move_type présent dans meta → Rejet si absent
4. Cohérence source ↔ move_type
5. meta.tenant présent et non vide → Rejet si absent
```

### Code

**`invoices.go`** (ligne 543-599) :

| Validation | Message d'erreur code | Message documenté | Statut |
|------------|----------------------|-------------------|--------|
| 1. model | `"validation failed: model must be 'account.move', got '%s'"` | ✅ Conforme | ✅ |
| 2. state | `"validation failed: state must be 'posted', got '%s'"` | ✅ Conforme | ✅ |
| 3. move_type | `"validation failed: meta.move_type is required"` ou `"validation failed: meta.move_type must be a non-empty string"` | ✅ Conforme | ✅ |
| 4. source ↔ move_type | `"validation failed: source '%s' does not match move_type '%s' (expected source: '%s')"` | ✅ Conforme | ✅ |
| 5. tenant | `"validation failed: meta.tenant is required"` ou `"validation failed: meta.tenant must be a non-empty string"` | ✅ Conforme | ✅ |

### Divergence

**Aucune divergence** : Les messages d'erreur sont exactement comme documentés dans `REPONSES_INTEGRATION_API.md`.

**Impact** : ✅ **Aucun** (conforme)

---

## 4️⃣ Gestion des cas edge : `meta` null

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** : Ne mentionne pas explicitement le cas où `meta` est `null`.

### Code

**`invoices.go`** (ligne 553-555) :
```go
if payload.Meta == nil {
    return fmt.Errorf("validation failed: meta is required for account.move")
}
```

### Divergence

Le code gère explicitement le cas `meta == nil` avec un message d'erreur spécifique, alors que la documentation ne mentionne que `meta.move_type` et `meta.tenant` manquants.

**Impact** : ⚠️ **Mineur**
- Cas limite : Payload avec `meta: null` au lieu de `meta: {}`
- Comportement : Message d'erreur plus explicite que nécessaire

**Recommandation** : 
- Documenter ce cas dans `THE_BIG_DETAILED_PICTURE.md` (section validations)

---

## 5️⃣ Calcul `endOfPeriod` : méthode utilisée

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** (ligne 206) :
```
end_of_period : Dernier jour du mois à 23:59:59 UTC
```

### Code

**`constat.go`** (ligne 161-162) :
```go
nextMonth := startOfPeriod.AddDate(0, 1, 0)
endOfPeriod := nextMonth.Add(-time.Second)
```

### Divergence

**Aucune divergence réelle** : Le code calcule correctement `endOfPeriod` en ajoutant un mois puis soustrayant une seconde, ce qui donne bien `23:59:59 UTC` du dernier jour du mois.

**Note** : La méthode est différente de ce qu'on pourrait attendre (utiliser `time.Date(year, month+1, 0, ...)`), mais le résultat est identique.

**Impact** : ✅ **Aucun** (conforme, méthode alternative valide)

---

## 6️⃣ Libellés des lignes de facture

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** (ligne 386, 392) :
```
Libellé : "Factures clients - Période 2026-01 - Montant fixe"
Libellé : "Factures clients - Période 2026-01 - Part variable (150 documents)"
```

### Code

**`dorevia_constat.py`** (ligne 375, 393) :
```python
'name': f"{move_type_labels[move_type]} - Période {self.period} - Montant fixe",
'name': f"{move_type_labels[move_type]} - Période {self.period} - Part variable ({volume} documents)",
```

Avec `move_type_labels` (ligne 334-339) :
```python
move_type_labels = {
    'out_invoice': 'Factures clients',
    'in_invoice': 'Factures fournisseurs (usage plateforme)',
    'out_refund': 'Avoirs clients',
    'in_refund': 'Avoirs fournisseurs (usage plateforme)',
}
```

### Divergence

**Aucune divergence** : Le code génère exactement les libellés documentés, avec en plus la gestion de tous les `move_type` (pas seulement `out_invoice`).

**Impact** : ✅ **Aucun** (conforme, plus complet que documenté)

---

## 7️⃣ Ordre des validations : fail-fast

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** (ligne 93-99) :
```
1. model = "account.move"
2. state = "posted"
3. move_type présent dans meta
4. Cohérence source ↔ move_type
5. meta.tenant présent et non vide
```

### Code

**`invoices.go`** (ligne 541-599) :
```go
// Validation 1 : model
// Validation 2 : state
// Validation 3 : meta.move_type
// Validation 4 : source ↔ move_type
// Validation 5 : meta.tenant
```

### Divergence

**Aucune divergence** : L'ordre est exactement le même.

**Note** : Le code vérifie `meta == nil` avant de vérifier `meta.move_type`, ce qui est logique et conforme.

**Impact** : ✅ **Aucun** (conforme)

---

## 8️⃣ Gestion des erreurs de transmission

### Documentation

**`THE_BIG_DETAILED_PICTURE.md`** (ligne 231-233) :
```
- Retry avec backoff exponentiel pour erreurs temporaires (429, 5xx)
- Pas de retry pour erreurs permanentes (400, 401, 403)
- Statut de transmission stocké dans la DB (transmitted, failed, pending)
```

### Code

**`constat.go`** (ligne 567-650) :
```go
maxRetries := 5
backoffBase := 1 // secondes

// Erreurs permanentes (400, 401, 403) - ne pas retry
if statusCode == 400 || statusCode == 401 || statusCode == 403 {
    return s.markTransmissionFailed(ctx, constat, errorMsg)
}

// Erreurs temporaires (429, 5xx) - retry
if statusCode == 429 || (statusCode >= 500 && statusCode < 600) {
    waitTime := time.Duration(backoffBase * (1 << uint(attempt))) * time.Second
    // Retry avec backoff exponentiel
}
```

### Divergence

**Aucune divergence** : Le code implémente exactement ce qui est documenté :
- ✅ Backoff exponentiel : `1 << attempt` = 1s, 2s, 4s, 8s, 16s
- ✅ Pas de retry pour 400, 401, 403
- ✅ Retry pour 429 et 5xx
- ✅ Statut stocké en DB (`transmitted`, `failed`, `pending`)

**⚠️ DIVERGENCE RÉELLE (CORRIGÉE)** : 
- **Vault envoyait** : `Authorization: Bearer <token>` (ligne 579 de `constat.go`)
- **Odoo CORE attend** : `Authorization: api_key <token>` (ligne 58 de `constat_controller.py`)

**Impact** : ⚠️ **Moyen** (causerait des erreurs 401 en production)

**✅ Action effectuée** : Code corrigé dans `constat.go` ligne 579 : `Bearer` remplacé par `api_key`

---

## 📊 Résumé des divergences

| # | Divergence | Impact | Priorité | Action recommandée |
|---|------------|--------|----------|-------------------|
| 1 | `invoice_origin` avec "N/A" | ⚠️ Mineur | Basse | Documenter ou valider `vault_id` |
| 2 | Format période | ✅ Aucun | - | Aucune |
| 3 | Messages d'erreur | ✅ Aucun | - | Aucune |
| 4 | Gestion `meta` null | ⚠️ Mineur | Basse | Documenter dans validations |
| 5 | Calcul `endOfPeriod` | ✅ Aucun | - | Aucune |
| 6 | Libellés facture | ✅ Aucun | - | Aucune |
| 7 | Ordre validations | ✅ Aucun | - | Aucune |
| 8 | Retry transmission | ✅ Corrigé | - | **Corrigé** : Vault utilise maintenant `api_key` |

---

## ✅ Conclusion

**3 divergences identifiées** :
1. `invoice_origin` avec "N/A" (cas limite) - ⚠️ Mineur
2. Gestion `meta` null (non documenté) - ⚠️ Mineur
3. **Format header Authorization (Bearer vs api_key)** - ✅ **Corrigé**

**Aucune divergence majeure.**

**Recommandations** :
- ✅ **CORRIGÉ** : Format d'en-tête Authorization dans `constat.go` ligne 579 : `Bearer` remplacé par `api_key`
- Documenter le comportement de `invoice_origin` avec `vault_id` null
- Documenter la validation `meta == nil` dans la section validations

**Le système reste conforme et prêt pour la production.**

---

**Date de l'analyse** : 2026-01-04  
**Analyste** : Auto (AI Assistant)

