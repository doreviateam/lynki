# Plan — Tout refaire pour que Linky / Vault / Odoo 19 marchent proprement

**Date :** 2026-03-07  
**Objectif :** Mise en service complète de la chaîne Odoo o19 → DVIG → Vault → Linky, dans l’ordre, avec vérifications à chaque étape. Pas de simple documentation : exécuter les étapes jusqu’à ce que la recette soit verte.

---

## Principe

On refait la mise en service **dans le bon ordre**. Chaque étape est vérifiable. Si une étape échoue, on la corrige avant de passer à la suivante.

---

## Étape 1 — Odoo 19 (instance lab o19)

**À faire :**

1. Vérifier que l’instance Odoo utilisée pour o19 (ex. `odoo.lab.o19.doreviateam.com` / conteneur `odoo_lab_o19`) a le **connecteur** `dorevia_vault_connector` installé et à jour.
2. **Paramètres système (Configuration → Paramètres techniques → Paramètres système)** :
   - `dorevia.tenant` = **o19**
   - `dorevia.dvig.base.url` = URL du DVIG (ex. `http://dvig-core-stinger:8080` depuis le même réseau Docker, ou l’URL exposée)
   - `dorevia.dvig.internal.token` = token DVIG valide pour le tenant o19 (même valeur que celle configurée côté DVIG pour o19)
3. **Crons actifs** (Configuration → Technique → Actions planifiées) :
   - **Vault Send DVIG** (factures) — actif, intervalle 1 min (ou selon spec)
   - **Vault Send Payments** — actif, intervalle 2 min
   - **Expected Counts Push** — actif, intervalle 2 min
   - **Vault Fetch Proof** / **Vault Fetch Proof Payments** — actifs si besoin pour les preuves

**Vérification :** Après 5–10 min, vérifier dans les logs Odoo qu’il n’y a pas d’erreur sur les crons (connexion DVIG refusée, 401, 404, etc.). Optionnel : lancer manuellement un cron « Vault Send Payments » et vérifier qu’une requête part vers DVIG (log ou réseau).

---

## Étape 2 — DVIG (tenant o19)

**À faire :**

1. S’assurer qu’un **token** (ou scope) existe pour le tenant **o19** dans la config DVIG (fichier tokens ou base DVIG selon l’implémentation).
2. Vérifier que les requêtes **POST** venant d’Odoo (événements, expected-counts) sont acceptées (pas de 401/403 pour le tenant o19).
3. Vérifier que le **worker DVIG** traite la file (outbox) et envoie bien au Vault (URL Vault configurée, pas d’erreur 4xx/5xx en boucle).

**Vérification :** Envoyer un événement test depuis Odoo (ou un script) et vérifier dans les logs DVIG qu’il est reçu puis transféré au Vault. Vérifier dans le Vault (ou sa base) qu’un document est créé pour le tenant o19.

---

## Étape 3 — Vault (URL Odoo o19)

**À faire :**

1. Le service Vault (ex. core-stinger) doit avoir la variable d’environnement **ODOO_BANK_RECONCILIATION_URL_O19** = `http://odoo_lab_o19:8069/dorevia/vault/linky_bank_reconciliation` (ou l’URL résolvable depuis le réseau où tourne le Vault).
2. Le conteneur **odoo_lab_o19** et le conteneur **vault-core-stinger** doivent être sur le **même réseau Docker** (ex. `dorevia-network`) pour que le Vault puisse appeler Odoo.

**Vérification :** Depuis l’hôte ou un conteneur du même réseau :  
`curl -s "http://vault-core-stinger:8080/ui/aggregations/treasury?tenant=o19&date_debut=2026-01-01&date_fin=2026-12-31"`  
La réponse doit contenir des montants (ex. `reconciled_balance`, `unreconciled_balance`) et non une erreur ou des zéros dus à une erreur de connexion Odoo.

---

## Étape 4 — Linky (instance o19)

**À faire :**

1. L’instance Linky qui sert **o19** (ex. `ui.lab.o19.doreviateam.com`) doit avoir **TENANT_ID=o19** dans son environnement (docker-compose ou env).
2. Utiliser une **image Linky** à jour (contenant les correctifs : poll 5 s, Rafraîchir, sealed_count total tenant, etc.), ex. `dorevia/linky:o19-recon-2026-03-07` ou un tag plus récent.
3. **VAULT_URL** doit pointer vers le Vault (ex. `http://vault-core-stinger:8080` sur le réseau interne).

**Vérification :** Ouvrir Linky en tenant o19 ; la carte Trésorerie/PAIEMENTS doit afficher des montants cohérents avec Odoo (et non « Odoo inaccessible » ou 0 partout). Clic sur « Rafraîchir » doit mettre à jour l’horodatage.

---

## Étape 5 — Vaulting effectif (paiements et factures o19)

**À faire :**

1. Laisser les crons Odoo tourner (Vault Send DVIG, Vault Send Payments) pendant au moins 30 min à 1 h, ou lancer un **rattrapage manuel** :
   - Dans Odoo : Exécuter plusieurs fois le cron « Vault Send Payments » (et si besoin « Vault Send DVIG »).
   - Ou exécuter un **script de backfill** (sur le modèle de `tenants/laplatine2026/scripts/backfill_all_payments_to_vault.py` ou `resend_missing_payments_to_vault.py`) adapté à l’instance o19 (même DB, même société).
2. Vérifier côté Vault (ou base) que des documents **source = 'payment'** et **tenant = o19** (ou équivalent) sont bien présents.

**Vérification :** Appel Vault `GET /ui/completeness-snapshot?tenant=o19&date_debut=2000-01-01&date_fin=2030-12-31` : le champ **sealed_count** doit augmenter (au moins quelques unités si des paiements existent dans Odoo). Dans Linky, le badge « X preuves scellées » doit refléter ce nombre.

---

## Étape 6 — Expected counts (X / Y preuves, Dernière synchronisation)

**À faire :**

1. S’assurer que le cron **Expected Counts Push** est actif dans Odoo o19 (étape 1).
2. Vérifier que DVIG accepte et transmet au Vault les **expected-counts** (POST vers le Vault).
3. Après un cycle de crons, le Vault doit avoir stocké des expected counts pour le tenant o19 (et optionnellement company_id, période).

**Vérification :** Dans Linky, si l’UI affiche « X / Y preuves » ou « Dernière synchronisation », ces champs doivent être renseignés. Sinon, vérifier les logs Odoo (push expected counts) et DVIG → Vault.

---

## Étape 7 — Recette utilisateur (MOA)

**À faire :**

1. Passer en revue avec la MOA / utilisateur sur **Linky (tenant o19)** :
   - Trésorerie : solde comptable et position validée cohérents avec Odoo.
   - Paiements : Total période, Rapproché, À rapprocher cohérents avec Odoo ; pas de « DONNÉES PARTIELLES » bloquant si la source est Odoo.
   - Preuves scellées : nombre affiché ≥ nombre réel dans le Vault pour o19 ; pas de valeur artificiellement basse.
   - Pas d’informations critiques manquantes (Dernier relevé importé si des relevés existent, etc.).
2. Si un point échoue, revenir à l’étape concernée (1 à 6) et corriger avant de refaire la recette.

---

## Ordre récap

| Ordre | Étape | Blocage si non fait |
|-------|--------|----------------------|
| 1 | Odoo o19 : tenant, DVIG URL, token, crons | Rien ne part vers DVIG/Vault. |
| 2 | DVIG : token o19, envoi au Vault | Événements et expected counts ne remontent pas. |
| 3 | Vault : URL Odoo o19, réseau | Linky affiche « Odoo inaccessible » ou mauvais montants. |
| 4 | Linky : TENANT_ID=o19, image à jour | Mauvais tenant ou ancienne logique. |
| 5 | Vaulting effectif (crons / backfill) | Preuves scellées = 0 ou très bas, cartes Vault vides. |
| 6 | Expected counts (cron + DVIG → Vault) | Pas de « X / Y preuves » ni « Dernière synchronisation ». |
| 7 | Recette MOA | Pas de validation métier. |

---

## En cas d’échec

- **Odoo n’envoie pas** : revoir étape 1 (paramètres, crons, logs).
- **DVIG rejette ou n’envoie pas au Vault** : revoir étape 2 (tokens, config, logs).
- **Vault n’a pas les données Odoo** : revoir étape 3 (URL, réseau, santé Odoo).
- **Linky affiche faux ou vide** : revoir étapes 3, 4 et 5 (Vault + Linky + vaulting).
- **Tout est vert mais la MOA refuse** : revoir étape 7 (critères métier, données de test).

Ce plan remplace « noter » par **faire** : exécuter les étapes une par une, vérifier, corriger, puis passer à la recette.
