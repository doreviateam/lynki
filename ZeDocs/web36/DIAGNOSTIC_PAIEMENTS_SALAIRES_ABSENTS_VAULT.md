# Diagnostic — Paiements salaires Jan/Fév absents du Vault

**Date :** 2026-03-03  
**Tenant :** laplatine2026  
**Constat :** Aucun paiement de 7 000 €, 3 750 € ou 10 750 € dans le Vault

---

## 1. Cause identifiée

**Les 4 paiements salaires n'ont jamais été créés dans Odoo.**

| Vérification | Résultat |
|--------------|----------|
| Vault `payments-out` (7 000, 3 750, 10 750 €) | **0** paiement |
| Odoo `account_payment` (montants 3 700–3 800, 6 950–7 100, 10 700–10 800) | **0** paiement |
| Connecteur vault (`dorevia_*` sur `account_payment`) | ✅ Présent |

---

## 2. Chaîne de causalité

```
OD créées (Jan, Fév) ✅
        ↓
Paiements 421 + 431 à créer ❌ (jamais faits)
        ↓
Pas de paiements → pas d'envoi DVIG → pas de Vault
        ↓
Position validée / Couverture salariale non impactées
```

---

## 3. Pourquoi les paiements n'ont pas été créés

### 3.1 Accès au menu Paiements

L'utilisateur a rencontré une **erreur "Action manquante"** en accédant à l'URL directe des paiements fournisseurs. Causes possibles :

- **ID d'action incorrect** : L'action 228 (Paiements fournisseurs) peut ne pas exister ou avoir un autre ID dans cette base.
- **Module account_voucher_killer** : Peut restreindre l'accès au menu Paiements à certains groupes (`invoice_payment_user`).
- **Structure de menu différente** : Odoo 17/18 peut organiser les menus autrement (Facturation vs Comptabilité).

### 3.2 Méthode alternative non utilisée

Les paiements auraient pu être créés depuis l'OD :

- En cliquant sur une **ligne 421 ou 431** dans l'OD et en utilisant **Réconcilier** / **Payer**.
- Ou via **Comptabilité → Grand livre** → filtre compte 421/431 → Réconcilier.

Cette voie n'a pas été explorée ou n'a pas abouti.

---

## 4. Actions correctives

### 4.1 Créer les 4 paiements dans Odoo

**Option A — Depuis l'OD (recommandé)**

1. Ouvrir l'OD janvier (MISC/2026/01/0001).
2. Dans les lignes, repérer la ligne **421 — Personnel** (7 000 € crédit).
3. Cliquer sur le montant ou la ligne → chercher **Réconcilier**, **Payer** ou **Créer un paiement**.
4. Renseigner : Journal Banque, Date, Valider.
5. Répéter pour la ligne **431** (3 750 €).
6. Répéter pour l'OD février.

**Option B — Menu Paiements**

1. Rechercher dans les menus : **« paiement »** ou **« paiements fournisseurs »**.
2. Ou : **Facturation → Fournisseurs → Paiements**.
3. **+ Nouveau** : Type = Paiement sortant, Partenaire = Équipage La Platine (421) ou URSSAF (431), Montant, Journal Banque.
4. Dans **Réconcilier avec** : sélectionner la ligne correspondante de l'OD.

### 4.2 Vérifier la configuration DVIG/Vault

Si les paiements existent mais ne partent pas :

```bash
# Dans Odoo (Paramètres → Technique → Paramètres système)
dorevia.dvig.url      # ex. http://dvig-core-stinger:8080
dorevia.dvig.token    # Token ingest
dorevia.vault.tenant  # laplatine2026
```

### 4.3 Backfill si paiements créés mais non vaultés

Si les paiements existent en Odoo avec `dorevia_vault_status` vide ou en échec :

```bash
echo "exec(open('/mnt/tenant-scripts/scripts/backfill_all_payments_to_vault.py').read())" | \
  docker exec -i odoo_lab_laplatine2026 odoo shell -d laplatine2026 --no-http
```

---

## 5. Synthèse

| Élément | Statut |
|--------|--------|
| OD Jan/Fév | ✅ Créées |
| Paiements 421 + 431 | ❌ Non créés |
| Menu Paiements accessible | ❌ Erreur "Action manquante" |
| Connecteur vault | ✅ Opérationnel |
| Vault (autres paiements) | ✅ 123 décaissements présents |

**Conclusion :** Le blocage vient de l'absence des 4 paiements dans Odoo, liée à la difficulté d'accéder au menu Paiements. Une fois les paiements créés et validés, ils seront envoyés au Vault par le connecteur (automatiquement ou via backfill).

---

**Fin du diagnostic**
