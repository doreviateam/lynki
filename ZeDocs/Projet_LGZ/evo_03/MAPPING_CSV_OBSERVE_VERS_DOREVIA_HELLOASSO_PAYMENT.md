# Mapping CSV observé → `dorevia.helloasso.payment`

## Statut

Base de mapping concrète à partir de l'export HelloAsso observé :

`export-paiements-testdorevia-03_04_2026-06_04_2026.csv`

## Objet

Traduire les colonnes réellement présentes dans l'export CSV HelloAsso vers le modèle Odoo :

`dorevia.helloasso.payment`

Ce document sert de base très concrète pour coder un premier mapper MVP.

## Colonnes observées dans l'export

Colonnes présentes dans le fichier :

- `Référence commande`
- `Référence paiement`
- `Montant total`
- `Date du paiement`
- `Statut du paiement`
- `Versé`
- `Date du versement`
- `Nom payeur`
- `Prénom payeur`
- `Email payeur`
- `Campagne`
- `Type de campagne`
- `Type`
- `Montant du tarif`
- `Montant des options`
- `Don supplémentaire`
- `Code Promo`
- `Montant du code promo`
- `Moyen de paiement`
- `Attestation`
- `Commentaire`

## Mapping cible MVP

| Colonne CSV HelloAsso | Champ Odoo | Transformation MVP | Requis MVP |
|---|---|---|---|
| `Référence paiement` | `helloasso_payment_ref` | texte brut trimé | oui |
| `Référence commande` | `helloasso_order_ref` | texte brut trimé | oui |
| contexte de synchro | `helloasso_account_id` | fourni par le contexte, pas par le CSV seul | oui |
| compte HelloAsso | `company_id` | déduit de `helloasso_account_id.company_id` | oui |
| `Campagne` | `campaign_name` | texte brut trimé | oui |
| `Type de campagne` | `campaign_type` | texte brut trimé | oui |
| `Statut du paiement` | `payment_status_raw` | valeur brute CSV | oui |
| `Statut du paiement` | `payment_status` | normalisation MVP | oui |
| `Versé` | `payout_status_raw` | valeur brute CSV | oui |
| `Versé` | `payout_status` | normalisation MVP | oui |
| `Date du paiement` | `payment_date` | conversion date/datetime FR vers datetime Odoo | oui |
| `Date du versement` | `payout_date` | conversion date FR si non vide | utile |
| `Moyen de paiement` | `payment_method_raw` | valeur brute CSV | oui |
| `Moyen de paiement` | `payment_method` | normalisation MVP | oui |
| `Montant total` | `amount_total` | conversion `"45,00"` → `45.00` | oui |
| `Montant du tarif` | `amount_tariff` | conversion `"40,00"` → `40.00` | utile |
| `Montant des options` | `amount_options` | conversion décimale ; vide → `False` dans le MVP | utile |
| `Don supplémentaire` | `amount_extra_donation` | conversion `"5,00"` → `5.00` | utile |
| `Montant du code promo` | `amount_discount` | conversion décimale ; vide → `False` dans le MVP | utile |
| `Prénom payeur` | `payer_firstname` | trim simple | oui |
| `Nom payeur` | `payer_lastname` | trim simple | oui |
| `Email payeur` | `payer_email` | trim + lowercase | oui |
| nom + prénom + email | `payer_display_name` | champ calculé Odoo : prénom + nom, sinon email | utile |
| ligne CSV complète | `source_payload` | sérialisation fidèle de la ligne source | oui |
| `Code Promo` | hors modèle MVP actuel | ignoré dans ce lot ; à revoir plus tard si besoin métier | non |
| `Commentaire` | hors modèle MVP actuel | à garder pour lot suivant si besoin | non |

## Champs dérivés

| Source CSV | Champ Odoo | Règle MVP |
|---|---|---|
| `Statut du paiement` + `Moyen de paiement` | `payment_kind` | `online` ou `offline` |
| `Statut du paiement` + `Moyen de paiement` | `is_platform_payment` | vrai si paiement plateforme |
| `Statut du paiement` + `Moyen de paiement` | `is_offline_payment` | vrai si paiement hors ligne |

## Règles de transformation détaillées

### 1. Références

- `Référence paiement` et `Référence commande` sont stockées comme chaînes ;
- ne pas caster en entier ;
- elles servent à la traçabilité et à l'idempotence.

## 2. Montants

Format observé :

- `45,00`
- `10,00`
- `5,00`

Règle MVP :

- remplacer la virgule par un point ;
- convertir en décimal ;
- stocker dans `amount_total` ;
- appliquer la même règle à `Montant du tarif`, `Montant des options`, `Don supplémentaire` et `Montant du code promo`.

## 3. Dates

Formats observés :

- `03/04/2026 18:23:13`
- `03/04/2026`

Règle MVP recommandée :

- accepter les deux formats ;
- si heure absente, fixer `00:00:00` en heure locale Odoo ;
- conserver une conversion stable et documentée.

## 4. Statut du paiement

Valeurs observées :

- `Payé`
- `Hors Ligne`

Règle MVP de normalisation :

- `Payé` → `paid`
- `Hors Ligne` → `offline`
- autre valeur → `unknown`

## 5. Statut de versement

Valeurs observées :

- `Non`
- `Hors Ligne`

Règle MVP de normalisation :

- `Oui` → `paid_out`
- `Non` → `not_paid_out`
- `Hors Ligne` → `offline`
- vide → `unknown`

## 6. Moyen de paiement

Valeurs observées :

- `Carte bancaire`
- `Virement bancaire`
- `Espèce`

Règle MVP de normalisation :

- `Carte bancaire` → `card`
- `Virement bancaire` → `bank_transfer_offline`
- `Espèce` → `cash`
- autre valeur → valeur source nettoyée ou `unknown`

## 7. Qualification métier MVP

### Cas 1 — Paiement plateforme

Exemple observé :

- `Statut du paiement = Payé`
- `Moyen de paiement = Carte bancaire`
- `Versé = Non`

Résultat Odoo :

- `payment_kind = online`
- `is_platform_payment = True`
- `is_offline_payment = False`
- `payment_status = paid`
- `payout_status = not_paid_out`

### Cas 2 — Paiement hors ligne par virement

Exemple observé :

- `Statut du paiement = Hors Ligne`
- `Moyen de paiement = Virement bancaire`
- `Versé = Hors Ligne`

Résultat Odoo :

- `payment_kind = offline`
- `is_platform_payment = False`
- `is_offline_payment = True`
- `payment_status = offline`
- `payout_status = offline`

### Cas 3 — Paiement hors ligne en espèce

Exemple observé :

- `Statut du paiement = Hors Ligne`
- `Moyen de paiement = Espèce`
- `Versé = Hors Ligne`

Résultat Odoo :

- `payment_kind = offline`
- `is_platform_payment = False`
- `is_offline_payment = True`
- `payment_status = offline`
- `payout_status = offline`

## Politique MVP de sélection

Dans le premier lot paiements HelloAsso :

- ne retenir que les lignes qualifiées `is_platform_payment = True`
- exclure les lignes `is_offline_payment = True`

Donc, sur l'export observé :

- la ligne `Payé + Carte bancaire` entre dans le MVP ;
- les lignes `Hors Ligne + Virement bancaire` et `Hors Ligne + Espèce` restent hors du flux MVP.

## Décision pratique

Le premier mapper peut être développé directement à partir de cet export CSV observé, avec les règles simples suivantes :

1. parser la ligne CSV ;
2. remplir les champs bruts ;
3. normaliser statut, versement et moyen de paiement ;
4. calculer `payment_kind`, `is_platform_payment`, `is_offline_payment` ;
5. ne conserver dans le flux MVP que les paiements plateforme.
