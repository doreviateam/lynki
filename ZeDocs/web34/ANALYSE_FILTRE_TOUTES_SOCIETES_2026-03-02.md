# Analyse — Filtre « Toutes les sociétés » (zéro affiché)

**Date :** 2026-03-02  
**Constat :** Avec « Toutes les sociétés » sélectionné, le dashboard affiche des totaux à zéro et 0 preuves scellées. Avec « SARL La Platine », les données s’affichent correctement.

---

## 1. Flux actuel

### 1.1 Linky

| Élément | Comportement |
|---------|--------------|
| **Sélection société** | `ReportHeader` : option `value=""` = « Toutes les sociétés » → `selectedCompanyId = null` |
| **Appels API** | `...(companyId && { company_id: companyId })` → si `companyId` null, `company_id` **n’est pas envoyé** |
| **dashboard-metrics** | `company_id = searchParams.get("company_id") ?? ""` → chaîne vide si absent |
| **commonParams** | `...(company_id && { company_id })` → `company_id` absent des requêtes Vault |

### 1.2 Vault

| Agrégation | Comportement si `company_id` vide |
|------------|-----------------------------------|
| **payments-in / payments-out** | Aucun filtre `company_id` → tous les documents |
| **sales / purchases** | Idem |
| **treasury** | Idem |
| **bank_reconciliation** | Idem |

**Conclusion :** Sans `company_id`, Vault doit renvoyer toutes les données (aucun filtre société).

---

## 2. Causes possibles des zéros

### 2.1 Auto-sélection par défaut

```ts
// DashboardWithFilters.tsx (l.92-98)
const hasVaultData = list.some((c) => c.documents_count > 0);
if (list.length > 0 && hasVaultData) {
  setSelectedCompanyId((prev) => (prev === null ? list[0].company_id : prev));
}
```

- Si au moins une société a des documents → sélection par défaut de la première société.
- Si toutes ont `documents_count: 0` → on garde `null` (« Toutes les sociétés »).

### 2.2 Scénarios probables

| Scénario | Effet |
|----------|-------|
| **Vault indisponible** | `/api/companies` en fallback manifest → `documents_count: 0` partout → « Toutes les sociétés » par défaut. Puis `dashboard-metrics` appelle Vault → échec → totaux à zéro. |
| **Sélection manuelle** | L’utilisateur choisit « Toutes les sociétés » → `company_id` non envoyé → Vault devrait renvoyer toutes les données. Si zéros, soit Vault échoue, soit autre cause. |
| **Cache sessionStorage** | Clé = `tenant + company + period`. Changement de société invalide le cache → nouvel appel API. |

### 2.3 Hypothèse principale

Avec « Toutes les sociétés », les appels partent sans `company_id`. Si Vault répond correctement, les totaux devraient être au moins égaux à ceux d’une société seule. Des zéros indiquent plutôt :

1. **Vault injoignable** depuis Linky au moment de la requête.
2. **Erreur côté API** (timeout, 500) non gérée → réponses `null` → totaux à 0.
3. **Problème de période** (dates différentes selon le filtre) — peu probable si la période reste « Exercice à date 2026 ».

---

## 3. Vérifications recommandées

### 3.1 Côté Linky

1. **Logs navigateur** : Onglet Network, requêtes vers `/api/dashboard-metrics` avec et sans `company_id`. Vérifier statut HTTP et corps de réponse.
2. **Gestion d’erreur** : En cas d’échec de `fetch`, les réponses sont souvent traitées en `null` → totaux à 0. Vérifier si des erreurs sont loguées ou remontées.

### 3.2 Côté Vault

1. **Test direct** :
   ```bash
   # Avec company_id (SARL La Platine)
   curl "http://vault-core-stinger:8080/ui/aggregations/payments-in?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-03-02&granularity=month&company_id=odoo:1"

   # Sans company_id (Toutes les sociétés)
   curl "http://vault-core-stinger:8080/ui/aggregations/payments-in?tenant=laplatine2026&date_debut=2026-01-01&date_fin=2026-03-02&granularity=month"
   ```
   Les deux doivent renvoyer des totaux cohérents (sans `company_id` ≥ avec).

2. **Logs Vault** : Vérifier s’il y a des erreurs ou timeouts lors des requêtes sans `company_id`.

### 3.3 Réseau

- Linky et Vault sur le même réseau Docker (`dorevia-network`).
- Vérifier que `VAULT_URL` dans Linky pointe bien vers le bon hôte (ex. `http://vault-core-stinger:8080`).

---

## 4. Pistes de correction

### 4.1 Renforcer la robustesse (optionnel)

Si le problème vient d’un fallback trop silencieux :

- Logger les erreurs de `fetch` vers Vault dans `dashboard-metrics`.
- Afficher un message explicite (« Données indisponibles ») au lieu de totaux à 0 quand les réponses sont vides ou en erreur.

### 4.2 Comportement par défaut

- Si `hasVaultData = false` (toutes les sociétés à 0 documents), le mode « Toutes les sociétés » est logique.
- S’assurer que dans ce cas les agrégations Vault sont bien appelées sans `company_id` et que les erreurs éventuelles sont visibles (logs, UI).

### 4.3 Pas de changement côté Vault

La logique Vault est cohérente : `company_id` vide = pas de filtre société. Aucune modification nécessaire côté agrégations.

---

## 5. Références

- `units/dorevia-linky/components/DashboardWithFilters.tsx` (l.92-98, 111-114)
- `units/dorevia-linky/app/api/dashboard-metrics/route.ts` (l.255-265)
- `sources/vault/internal/storage/aggregations_payments.go` (l.64-75)
- `sources/vault/internal/storage/companies.go` (ListCompanies)
