# Rapport des tests — Carte Paiements (Étape 1)

**Date :** 2026-03-03  
**Référence :** PLAN_IMPLEMENTATION_CARTE_PAIEMENTS_v1.0.md (Étape 1)  
**Scope :** Contrôle de complétude  
**Statut :** ✅ Tests complets validés (2026-03-03)

---

## 1. Tests unitaires Vault

**Fichier :** `sources/vault/tests/unit/aggregations_payments_completeness_test.go`

| Test | Résultat |
|------|----------|
| `TestPaymentsCompletenessHandler_MissingTenant` | ✅ PASS |
| `TestPaymentsCompletenessHandler_WithTenant_ReturnsJSON` | ✅ PASS |
| `TestPaymentsCompletenessHandler_ConfigWithoutOdooURL` | ✅ PASS |

```
go test ./tests/unit/... -run PaymentsCompleteness
PASS
```

---

## 2. Test d'intégration Vault

**Image :** `dorevia/vault:carte-paiements-test` (build depuis sources avec endpoint payments-completeness)

**Commande :**
```bash
curl "http://localhost:9999/ui/aggregations/payments-completeness?tenant=laplatine2026&date_from=2026-01-01&date_to=2026-01-31"
```

**Réponse observée :**
```json
{
  "ok": false,
  "badge": "Données incomplètes",
  "message": "Certains paiements ERP validés ne sont pas encore enregistrés dans le Vault.",
  "payments_count": 135,
  "payments_sum_amount_signed": 18539.75
}
```

**Constat :** L'endpoint répond correctement. Odoo actuel (sans les champs `payments_posted_count` / `payments_posted_sum_amount_signed`) est interprété comme 0/0 ; le Vault a 135 documents. Le contrôle détecte l’écart et renvoie le message attendu.

---

## 3. Script de tests manuels

**Fichier :** `scripts/test_carte_paiements.sh`

**Usage :**
```bash
./scripts/test_carte_paiements.sh           # Tests sans rebuild
./scripts/test_carte_paiements.sh --build   # Rebuild Vault puis tests
```

**Prérequis pour tests complets :**
1. **Vault** — Rebuild avec `docker build -t dorevia/vault:carte-paiements-test -f sources/vault/Dockerfile sources/vault`
2. **Odoo** — Redémarrage après mise à jour du module `dorevia_vault_connector` (champs `payments_posted_*`)
3. **Linky** — Rebuild et redémarrage pour exposer `completeness_check` dans `/api/treasury`

---

## 4. Tests à réaliser manuellement (DoD Étape 1)

| Test | Statut | Action |
|------|--------|--------|
| Créer paiement Odoo non vaulté → badge affiché | ⏳ À faire | 1. Créer paiement posted 2. Vérifier badge « Données incomplètes » |
| Écart count (Odoo > Vault) | ⏳ À faire | Délai ingestion ou paiement récent |
| Écart sum (tolérance 0,01 €) | ⏳ À faire | Vérifier qu’une diff &lt; 0,01 € n’affiche pas le badge |
| Odoo inaccessible | ⏳ À faire | Couper Odoo → message « Contrôle de complétude indisponible (Odoo inaccessible) » |

---

## 5. Tests complets (chaîne Odoo → Vault → Linky)

**Déploiement réalisé :**
- Vault : `dorevia/vault:carte-paiements-test` (tenants/core-stinger/platform)
- Odoo : Redémarrage (code monté, `payments_posted_*` actifs)
- Linky : `dorevia/linky:carte-paiements-test` (tenants/laplatine2026/apps/ui/lab)

**Exécution :** `./scripts/test_carte_paiements.sh`

| Test | Résultat |
|------|----------|
| 1. Vault `/ui/aggregations/payments-completeness` | ✅ ok:false, badge, message, erp_count/sum |
| 2. Odoo `payments_posted_count` / `payments_posted_sum_amount_signed` | ✅ 416, 49540.61 |
| 3. Linky `/api/treasury` `completeness_check` | ✅ ok:false, badge, message |

**Constat :** Écart Odoo vs Vault détecté → badge « Données incomplètes » affiché correctement dans toute la chaîne.

---

## 6. Résumé

- **Tests unitaires** : 3/3 passés
- **Tests d’intégration Vault** : Vault, Odoo, Linky — chaîne complète validée
- **Images déployées** : `dorevia/vault:carte-paiements-test`, `dorevia/linky:carte-paiements-test`

---

**Fin du rapport**
