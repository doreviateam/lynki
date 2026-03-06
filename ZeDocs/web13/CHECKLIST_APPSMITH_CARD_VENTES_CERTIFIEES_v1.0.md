# Checklist Appsmith — Card « Ventes certifiées » (SPEC_DOREVIA_UI_CARD_SALES_v1.0)

**Tenant** : sarl-la-platine.

---

## ✅ Déjà fait (côté plateforme)

- [x] Image Vault `dorevia/vault:v1.4.0-card-sales` construite.
- [x] **vault-core** recréé avec la nouvelle image (core platform).
- [x] **vault-sarl-la-platine** + **vault-db-sarl-la-platine** démarrés (tenant sarl-la-platine/platform).
- [x] Test API : les deux Vault répondent en JSON sur `/ui/aggregations/sales` (total, series, verifiable).

**Test depuis un conteneur sur le réseau** :  
`docker run --rm --network dorevia-network curlimages/curl -sS "http://vault-sarl-la-platine:8080/ui/aggregations/sales?tenant=sarl-la-platine&date_debut=2026-01-01&date_fin=2026-02-06&granularity=month"`

---

## 1. Prérequis

- [x] Endpoint `GET /ui/aggregations/sales` déployé et accessible (Vault sarl-la-platine et core).
- [ ] Appsmith ouvert sur https://ui.lab.sarl-la-platine.doreviateam.com (ou tenant cible).
- [ ] Auth Vault configurée si l’endpoint est protégé (token / header pour Appsmith).

---

## 2. API dans Appsmith

- [ ] Créer une **REST API** (ou réutiliser une existante) :
  - **URL** : `https://vault.sarl-la-platine.doreviateam.com/ui/aggregations/sales` (ou URL réelle du Vault).
  - **Méthode** : GET.
  - **Query params** :
    - `date_debut` : `{{DatePicker_Debut.selectedDate}}` ou format YYYY-MM-DD.
    - `date_fin` : `{{DatePicker_Fin.selectedDate}}` ou format YYYY-MM-DD.
    - `granularity` : `{{Dropdown_Granularite.selectedOptionValue}}` (day / week / month).
    - `tenant` : `sarl-la-platine` (ou binding depuis config).
- [ ] Tester l’appel (Run) : vérifier que la réponse contient `total`, `series`, `currency`, `from`, `to`, `verifiable`.

---

## 3. Widgets

- [ ] **Titre** : texte « Ventes certifiées » (ou icône + titre).
- [ ] **Montant** : texte lié à `{{Api_Sales.data.total}}`, formaté en devise (ex. `{{Api_Sales.data.currency}} {{Api_Sales.data.total.toFixed(2)}}` ou format français 914 093,53 €).
- [ ] **Période** : libellé du type « Du {{Api_Sales.data.from}} au {{Api_Sales.data.to}} » ou « Janvier → Février 2026 ».
- [ ] **Badge** : « Données certifiées » (toujours affiché si `Api_Sales.data.verifiable === true`).
- [ ] **Dernier scellement** (optionnel) : « Dernier scellement : {{Api_Sales.data.last_seal_at}} » ou « il y a X min » si vous formatez en relatif.
- [ ] **Sélecteur date_debut** : DatePicker → valeur liée à `date_debut` de l’API (ou state).
- [ ] **Sélecteur date_fin** : DatePicker → valeur liée à `date_fin` de l’API.
- [ ] **Sélecteur granularité** : Dropdown options Jour (day) / Semaine (week) / Mois (month), valeur envoyée en `granularity`.
- [ ] **Rafraîchir** : bouton qui appelle `Api_Sales.run()` ou re-run au changement des filtres (onDateSelected / onOptionChange).

---

## 4. Comportement

- [ ] Au chargement de la page (ou onPageLoad), exécuter l’API avec des valeurs par défaut (ex. mois en cours pour date_debut / date_fin, granularity = month).
- [ ] Changer la période ou la granularité déclenche un nouvel appel et la card se met à jour.
- [ ] Aucun calcul côté Appsmith : tout vient de l’API (total, series).

---

## 5. Definition of Done (rappel)

- [ ] Endpoint `/ui/aggregations/sales` opérationnel.
- [ ] Appsmith affiche la card sans erreur.
- [ ] Les filtres période fonctionnent.
- [ ] La granularité modifie l’agrégation (séries).
- [ ] Le badge « Données certifiées » est visible.

---

Version : v1.0
