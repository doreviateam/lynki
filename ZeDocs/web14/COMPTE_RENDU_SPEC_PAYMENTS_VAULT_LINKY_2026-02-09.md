# Compte rendu — Spec Payments v1.1, Vault, Linky (session 2026-02-09)

**Date** : 2026-02-09  
**Périmètre** : Connecteur Odoo paiements, Vault (agrégations Décaissements), spec SPEC_DOREVIA_PAYMENTS_v1.1, card Linky Décaissements.

---

## 1) Résumé des réalisations

### 1.1 Connecteur Odoo (dorevia_vault_connector)

- **Bouton « Remettre en brouillon »**  
  Masqué lorsque le paiement est en `in_process` ou `paid` (en plus du blocage côté serveur si `vaulted`). Alignement avec la règle R3 (append-only) et la cohérence métier (pas de retour en brouillon dès que le paiement est validé ou réglé).

- **Éligibilité au vault**  
  Les états `posted`, `paid` et `in_process` sont acceptés pour l’envoi au Vault (prise en compte des différences Odoo POS / Compta).

- **Cron de rattrapage paiements**  
  Nouveau cron `cron_vault_send_payments` (toutes les 5 min) : envoie au Vault les paiements déjà validés (posted/paid/in_process) mais pas encore vaultés. Permet d’alimenter les cards Linky pour les paiements créés avant la mise en place du vault ou non envoyés à la validation.

### 1.2 Spec SPEC_DOREVIA_PAYMENTS_v1.1

- **§10.1** — Constat sur les états Odoo (POS / Account) : différence `in_process` vs `paid` selon le flux, sans la qualifier de « problème ».
- **§10.2** — Pourquoi on masque « Remettre en brouillon » : cohérence métier, R3 append-only, UX.
- **§10.3** — POS : paiements en compta à la fermeture de session (pas de comptabilisation tant que la session n’est pas fermée).
- **§10.4** — Auditer les constats : paramètre `list=1` sur `GET /ui/aggregations/payments-out` pour obtenir le tableau `events` (source_id, amount, payment_date) et comparer avec la source.
- **§7.2** — Card Décaissements : exclusion des remboursements / avoirs (`is_refund = false`), une card dédiée Avoirs/Remboursements étant prévue.

### 1.3 Vault

- **Paramètre `list=1`**  
  Sur `GET /ui/aggregations/payments-in` et `payments-out` : la réponse inclut un tableau `events` (document_id, source_id, amount, payment_date, created_at) pour audit sans calcul côté Vault.

- **Card Décaissements : exclusion des remboursements**  
  Pour `direction = outbound`, les documents avec `is_refund = true` sont exclus de l’agrégation et de la liste. La card Décaissements ne compte plus les paiements d’avoirs / remboursements (ex. 6,84 €), qui seront pris en compte dans une future card Avoirs/Remboursements.

- **Déploiements**  
  - **v1.6.1-payments** : prise en charge de `list=1` (liste des constats).  
  - **v1.6.2-payments** : exclusion des remboursements de la card Décaissements.

### 1.4 Outils / scripts

- **Script** `scripts/list_payments_out_events.sh` : appel à l’API payments-out avec `list=1` (URL par défaut : `https://vault.core-stinger.doreviateam.com`).
- **Proxy Linky** : le paramètre `list` est transmis à l’API Vault dans la route `api/payments-out`.

---

## 2) Vérifications effectuées

- **Card Décaissements** : après correction, affichage de 2 paiements (480 104,02 €) au lieu de 3 ; le paiement d’avoir de 6,84 € (source_id 6, PBNK1/2026/00006) est exclu.
- **Identification du 3ᵉ constat** : requête en base Odoo (`account.payment` id 6) — montant 6,84 €, outbound, paid, date d’enregistrement 2026-01-28 17:34:42 ; confirmé comme paiement d’un avoir.
- **URL Vault** : utilisation de `https://vault.core-stinger.doreviateam.com` pour les appels depuis l’extérieur (Caddy reverse proxy).

---

## 3) Fichiers modifiés ou créés

| Fichier | Action |
|--------|--------|
| `units/odoo/custom-addons/dorevia_vault_connector/views/account_payment_views.xml` | Masquage bouton « Remettre en brouillon » si `state in ('in_process', 'paid')` |
| `units/odoo/custom-addons/dorevia_vault_connector/models/account_payment.py` | `_should_vault_payment` : accepte `in_process` ; ajout `cron_vault_send_payments` ; docstrings §10.1 |
| `units/odoo/custom-addons/dorevia_vault_connector/data/ir_cron.xml` | Enregistrement du cron `ir_cron_vault_send_payments` |
| `units/dorevia-linky/app/api/payments-out/route.ts` | Transmission du paramètre `list` au Vault |
| `sources/vault/internal/models/aggregations.go` | Struct `PaymentEventItem`, champ `Events` dans la réponse |
| `sources/vault/internal/storage/aggregations_payments.go` | `ListPaymentEvents` ; filtre `is_refund = false` pour outbound (agrégation + liste) |
| `sources/vault/internal/handlers/aggregations_payments.go` | Prise en charge de `list=1` et remplissage de `resp.Events` |
| `tenants/core-stinger/platform/docker-compose.yml` | Image Vault : v1.6.1-payments puis v1.6.2-payments |
| `ZeDocs/web14/SPEC_DOREVIA_PAYMENTS_v1.1.md` | §7.2, §10.1 à §10.4 |
| `scripts/list_payments_out_events.sh` | Création (appel payments-out avec list=1) |

---

## 4) Documentation à jour

- **Spec** : SPEC_DOREVIA_PAYMENTS_v1.1.md à jour (§7.2, §10.1–§10.4).
- **Connecteur** : __manifest__.py et README.md à mettre à jour (voir section 5).
- **Vault** : comportement documenté dans la spec ; pas de README Vault modifié dans cette session.

---

## 5) Suite recommandée

- Mettre à jour la version du module Odoo (ex. 1.2.2) et la description dans __manifest__.py / README.
- Lors de la mise en place de la card **Avoirs / Remboursements** dans Linky : filtrer côté Vault (ou Linky) sur `is_refund = true` et éventuellement `direction = outbound` (remboursements clients) pour alimenter cette card.
- Conserver le cron `cron_vault_send_payments` comme filet de sécurité pour les paiements non envoyés à la validation.

---

## 6) Références

- Spec : `ZeDocs/web14/SPEC_DOREVIA_PAYMENTS_v1.1.md`
- Amendements : `ZeDocs/web14/AMENDEMENTS_SPEC_DOREVIA_PAYMENTS_v1.1.md`
- Rapport conséquences : `ZeDocs/web14/RAPPORT_CONSEQUENCES_SPEC_PAYMENTS_v1.1_SUR_EXISTANT.md`
