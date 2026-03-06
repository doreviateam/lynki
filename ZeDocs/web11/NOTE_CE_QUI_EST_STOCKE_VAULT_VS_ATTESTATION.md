# Ce qui est stocké dans le Vault vs contenu du fichier attestation

## À propos du fichier attestation (JSON téléchargé)

Le fichier que vous téléchargez (bouton « Télécharger l'attestation ») contient :

- **`document`** : données facture (numéro, dates, montants, partenaire, société émettrice, etc.) — **stockées dans Odoo** (ERP).
- **`preuve`** : métadonnées de scellage (facture, date_securisation, reference_preuve, empreinte_numerique, journal_preuve, attestation_jws) — les **valeurs de preuve** (proof_id, sealed_at, ledger_hash, JWS) **proviennent du Vault** ; le bloc est **assemblé par Odoo** au moment du téléchargement.
- **`canonical_cfo`** : payload canonique CFO (SPEC v1.0) — **construit par Odoo** à partir de la facture + des champs de preuve stockés sur la facture.
- **`infrastructure`**, **`garanties`**, **`id_odoo`**, **`usage_comptable_et_fiscal`** : **générés par Odoo** au téléchargement.

---

## Où est stocké quoi ?

| Donnée | Stockée où | Remarque |
|--------|------------|----------|
| Données facture (numero, date, montants, partenaire, etc.) | **Odoo** (base `account.move`) | Jamais envoyées en clair au Vault pour stockage long terme. |
| Proof ID, date de scellage, ledger_hash, JWS | **Vault** (service Dorevia-Vault) **et** **Odoo** | Le Vault enregistre la preuve ; Odoo garde une copie (dorevia_vault_id, dorevia_vault_date, dorevia_vault_ledger_hash, dorevia_vault_evidence_jws) pour affichage et attestation. |
| Blocs `document`, `canonical_cfo`, notices d’usage | **Odoo** uniquement | Construits au moment du **téléchargement** à partir de la facture + des champs de preuve. |

En résumé : **dans le Vault** (le service), on stocke uniquement la **preuve de scellage** (identifiant, horodatage, hash, JWS, entrée registre). Les blocs **document** et **canonical_cfo** du fichier attestation ne sont **pas** stockés tels quels dans le Vault ; ils sont **générés par Odoo** à partir de la facture et des infos de preuve.

---

## Formulation recommandée

Pour être précis, on peut dire :

- **« Ce fichier attestation contient les données de la facture (document, canonical_cfo) et la preuve de scellage délivrée par Dorevia-Vault (preuve). »**
- **« Les métadonnées de preuve (proof_id, sealed_at, ledger_hash, attestation_jws) sont enregistrées côté Vault ; les données facture et le payload canonical_cfo sont enregistrées dans l’ERP et assemblés dans ce fichier au téléchargement. »**

On évite donc de dire que « tout le JSON est stocké dans le Vault » : seul le **cœur de la preuve** l’est ; le reste est côté Odoo + assemblé à la demande.
