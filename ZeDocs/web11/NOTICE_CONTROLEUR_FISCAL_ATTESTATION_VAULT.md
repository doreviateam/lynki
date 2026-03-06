# Notice à l’usage du contrôleur fiscal — Attestation Dorevia-Vault

**Objet** : Acceptabilité du fichier attestation (preuve de scellage de facture) dans le cadre d’un contrôle fiscal et de la conservation des pièces.

---

## 1. En résumé : un contrôleur fiscal peut-il accepter ce document ?

**Oui**, sous réserve que les points suivants soient compris et, le cas échéant, vérifiés :

1. **Preuve de scellage** : Le bloc **`preuve`** du fichier attestation contient une preuve cryptographique (JWS) délivrée par Dorevia-Vault. Elle atteste qu’à la date **`date_securisation`** / **`sealed_at`**, un document identifié par **`reference_preuve`** / **`proof_id`** a été scellé (empreinte SHA-256, horodatage, signature).

2. **Données facture** : Les blocs **`document`** et **`canonical_cfo`** décrivent la facture (numéro, dates, montants, émetteur, contrepartie, TVA, etc.). Ils sont issus de l’ERP au moment du téléchargement et sont cohérents avec la facture concernée par la preuve (même numéro, même `proof_id`).

3. **Conservation** : Le fichier attestation peut être conservé avec les pièces justificatives pour répondre aux obligations de conservation (art. L102 B du Livre des procédures fiscales — 6 ans minimum ; 10 ans souvent recommandé).

4. **Vérification** : Le contrôleur peut, si besoin, vérifier la signature JWS (clé publique, algorithme RS256) et le lien entre `proof_id`, `sealed_at` et l’empreinte signée.

---

## 2. Ce que le contrôleur doit retenir

| Élément | Explication |
|--------|-------------|
| **Preuve (bloc `preuve`)** | Métadonnées de scellage **enregistrées côté Dorevia-Vault** : identifiant de preuve (`reference_preuve` / `proof_id`), date de scellage (`date_securisation` / `sealed_at`), empreinte numérique (JWS), hash du registre (`journal_preuve` / `ledger_hash`). La **signature JWS** garantit l’intégrité et l’horodatage : toute modification ultérieure du contenu scellé serait détectée. |
| **Données facture (`document`, `canonical_cfo`)** | Données métier (numéro, date, montants, émetteur, contrepartie, TVA, etc.) **issues de l’ERP** et assemblées dans ce fichier au téléchargement. Elles correspondent à la facture dont la preuve est identifiée par `reference_preuve` / `proof_id`. |
| **Valeur probante** | La preuve JWS atteste qu’**à la date de scellage**, un document (identifié et hashé) a été enregistré de manière irréversible. Le fichier attestation fournit à la fois cette preuve et les données facture pour lecture humaine et contrôle. |

---

## 3. Références juridiques et conservation

- **Conservation des pièces** : art. **L102 B** du Livre des procédures fiscales (LPF) — conservation des livres, registres et pièces justificatives pendant **6 ans** (délai de reprise de l’administration). Une conservation de **10 ans** est souvent recommandée en pratique.
- **Preuve numérique** : la preuve cryptographique (JWS, horodatage, hash) est opposable et permet de démontrer qu’un document n’a pas été modifié après scellage.

---

## 4. Vérification technique (si le contrôleur le souhaite)

- **Signature JWS** : algorithme **RS256**, clé identifiée par `kid` dans l’en-tête du JWS. La vérification s’effectue avec la clé publique correspondante (procédure et endpoint selon déploiement Dorevia-Vault / DVIG).
- **Contenu signé** : le JWS signe au minimum l’identifiant du document (`document_id`), l’empreinte **SHA-256** du contenu scellé et l’**horodatage** (UTC). La cohérence entre `proof_id`, `sealed_at` et les champs du bloc `preuve` / `canonical_cfo` peut être vérifiée.

---

## 5. Formulation type pour le contribuable

Le contribuable peut remettre au contrôleur le fichier attestation en indiquant par exemple :

> « Ce fichier attestation contient les données de la facture (blocs `document` et `canonical_cfo`) et la preuve de scellage délivrée par Dorevia-Vault (bloc `preuve`). La preuve cryptographique (JWS) atteste que la facture a été scellée à la date indiquée (`date_securisation` / `sealed_at`) et que toute modification ultérieure serait détectable. Ce document est conservé au titre de l’article L102 B LPF. »

---

## 6. Limites et précisions

- **Source des données facture** : les blocs `document` et `canonical_cfo` sont générés à partir de l’ERP au moment du téléchargement. En cas de litige sur le contenu métier, l’ERP et les pièces d’origine (facture PDF, enregistrements comptables) restent la référence ; l’attestation apporte la **preuve de scellage** (existence et intégrité à une date donnée).
- **Vérification de la signature** : pour une vérification complète du JWS, le contrôleur peut demander l’accès à la procédure et aux clés publiques (ou endpoint de vérification) prévus par l’éditeur de la solution Dorevia-Vault.

---

**En pratique** : un contrôleur fiscal peut accepter ce fichier attestation comme **preuve de scellage et d’intégrité** de la facture à la date indiquée, et comme **élément de justification** conservé avec les pièces au titre de l’article L102 B LPF, en comprenant que les données facture proviennent de l’ERP et que la preuve JWS garantit le scellage à la date indiquée.
