# Attestation Dorevia Vault — usage comptable et fiscal

Ce document décrit le contenu du fichier **attestation** téléchargeable depuis une facture protégée (bouton « Télécharger l'attestation »), et ce qu’il apporte aux **comptables**, **responsables financiers** et **contrôleurs fiscaux**.

---

## 0. Payload canonique CFO (`canonical_cfo`)

Le fichier inclut un bloc **`canonical_cfo`** conforme à la **SPEC Canonical Payload CFO (Invoice Posted) v1.0** : format ERP-agnostique, stable, exploitable par UI/BI pour les KPIs CFO (facturé, encours, échéances, aging).  
Voir `ZeDocs/web11/SPEC_Canonical_Payload_CFO_Invoice_Posted_v1.0.md` pour la spécification complète (champs `invoice_direction`, `invoice_kind`, `counterparty_*`, `issuer_*`, preuve, etc.).

## 1. Contenu du fichier attestation (JSON)

Le fichier `attestation_<numero>.json` contient les blocs : **document**, **preuve**, **canonical_cfo**, **usage_comptable_et_fiscal**, et champs annexes.

### 1.1 Bloc `document` (identification et montants)

| Champ | Description | Utile pour |
|-------|-------------|------------|
| `numero` | Numéro de la facture / avoir | Comptable, contrôle |
| `date_facture` | Date d’émission (ISO) | Comptable, fiscal |
| `type` | Facture client, facture fournisseur, avoir client, avoir fournisseur | Comptable |
| `client_ou_fournisseur` | Nom du partenaire | Comptable, rapprochement |
| `montant_ht`, `montant_tva`, `montant_ttc` | Montants en devise | Comptable, financier, fiscal |
| `devise` | Code devise (ex. EUR) | Comptable, financier |
| `societe_emettrice` | Nom de la société émettrice | Comptable, fiscal |
| `journal_comptable` | Journal (ex. Vente, Achat) | Comptable |
| `date_echeance` | Date d’échéance de paiement | Comptable, trésorerie |
| `etat_paiement` | État du paiement (ex. not_paid, paid, partial) | Comptable, financier |
| `montant_restant_du` | Montant restant à payer | Comptable, trésorerie |
| `reference_piece` | Référence / numéro de pièce | Comptable |
| `origine` | Origine (ex. commande) | Comptable |
| `numero_tva_client_ou_fournisseur` | N° TVA partenaire | Fiscal, contrôle |
| `siret_client_ou_fournisseur` | SIRET partenaire | Fiscal, contrôle |
| `tva_societe_emettrice` | N° TVA de la société | Fiscal |
| `siret_societe_emettrice` | SIRET de la société | Fiscal |

### 1.2 Bloc `preuve` (scellement et intégrité)

| Champ | Description | Utile pour |
|-------|-------------|------------|
| `facture` | Numéro facture | Vérification croisée |
| `date_securisation` | Date/heure du scellement (ISO) | Fiscal, audit |
| `reference_preuve` | Identifiant unique de la preuve | Traçabilité |
| `empreinte_numerique` / `attestation_jws` | Preuve cryptographique (JWS) | Vérification d’intégrité |
| `journal_preuve` | Hash du journal de preuves | Chaîne de confiance |

### 1.3 Bloc `usage_comptable_et_fiscal`

Court texte par profil :

- **comptable** : usage pour dossier comptable, archivage, traçabilité.
- **responsable_financier** : usage pour rapprochement, reporting, preuve d’existence.
- **controleur_fiscal** : opposabilité, conservation (art. L102 B LPF, 6 ans / 10 ans), vérification via empreinte JWS.

---

## 2. Comptable

- **Identification** : numéro, date, type, partenaire, journal, référence, origine.
- **Montants** : HT, TVA, TTC, devise, montant restant dû.
- **Trésorerie** : date d’échéance, état de paiement.
- **Usage** : pièce justificative d’intégrité à joindre au dossier ou à archiver ; la date de scellement et l’empreinte (JWS) permettent de prouver que le document n’a pas été modifié après cette date.

---

## 3. Responsable financier

- **Reporting** : mêmes montants et devise, société émettrice, partenaire.
- **Rapprochement** : numéro, date, type, partenaire, montants.
- **Preuve** : l’attestation prouve l’existence et le contenu de la facture au moment du scellement.

---

## 4. Contrôleur fiscal

- **Identification fiscale** : SIRET et TVA de la société émettrice, SIRET et TVA du client/fournisseur.
- **Dates** : date de facture, date de scellement (horodatage de la preuve).
- **Opposabilité** : le JWS est une preuve cryptographique opposable ; toute modification ultérieure du document serait détectée.
- **Conservation** : le fichier peut être conservé avec les pièces (art. L102 B LPF : 6 ans minimum ; 10 ans souvent recommandé) et utilisé pour une vérification ultérieure via l’empreinte.

---

## 5. Références

- **Garanties** décrites dans le champ `garanties` du JSON : intégrité (hash SHA-256), horodatage, JWS opposable.
- **Infrastructure** : Dorevia-Vault (champ `infrastructure`).

Pour toute question sur le format ou l’usage, se référer au README du module et à la documentation technique (SPEC v1.1 / v1.1.1).
