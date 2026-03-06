# 📘 Proposition de plan — SPEC SOCLE DOREVIA‑VAULT

**Objet :** définir la structure de la **SPEC SOCLE** du dispositif Dorevia‑Vault, conçue comme document de référence produit, réglementaire et conceptuel.

Cette spec ne décrit pas l’implémentation technique détaillée.
Elle formalise **ce que Dorevia‑Vault est**, **ce qu’il garantit**, et **sur quels principes non négociables il repose**.

---

## 🎯 1. Objectif et portée de la SPEC

### 1.1 Objectif du document

* Formaliser le dispositif Dorevia‑Vault comme **infrastructure de preuve financière**.
* Servir de référence commune : produit, UX, conformité, partenaires, certification.
* Poser un cadre stable avant déclinaisons techniques.

### 1.2 Portée

* Ce que couvre la spec
* Ce que la spec ne couvre volontairement pas (implémentation, choix technos détaillés).

### 1.3 Documents de référence

Cette spec s’appuie explicitement sur :

* Audit UX (diagnostic à froid)
* Note de stratégie V2 (pivot « compteur Linky »)
* Arborescence UX (Hero + Sections 1 à 3)
* Catalogue des visuels (P0 à P2)
* Copywriting consolidé + micro‑amendements LNE / NF525

---

## 🧭 2. Problème traité et intention du dispositif

### 2.1 Le problème métier

* Décalage entre événement financier et preuve exploitable
* Fragilité des chiffres (reconstructions, fichiers modifiables)
* Stress des contrôles, audits, litiges

### 2.2 Intention de Dorevia‑Vault

* Garantir la **capture immédiate et fiable** des événements
* Transformer un événement en **preuve opposable**
* Sécuriser le pilotage financier et la conformité

---

## 🧠 3. Principes fondateurs (non négociables)

Cette section constitue le **cœur de la certification by design**.

* Capture automatique, sans ressaisie
* Zéro manipulation humaine
* Horodatage précis
* Scellage cryptographique
* Immutabilité des preuves
* Lecture seule (consultation sans altération)
* Séparation stricte des rôles (source / preuve / lecture)
* Dispositif conçu pour certification LNE 2026 / NF525

---

## 🧩 4. Définition du périmètre fonctionnel

### 4.1 Événements concernés

* Factures
* Paiements
* Tickets / ventes
* Autres événements financiers (à préciser)

### 4.2 Définition d’une « preuve »

* Contenu minimal
* Métadonnées essentielles
* Ce qui rend la preuve vérifiable et opposable

### 4.3 Hors périmètre volontaire

* Pas de modification des données sources
* Pas de stockage fonctionnel ERP
* Pas de pilotage opérationnel

---

## 🔁 5. Cycle de vie d’une preuve

### 5.1 Capture

* Origine de l’événement
* Instant de capture

### 5.2 Scellage

* Horodatage
* Empreinte
* Signature

### 5.3 Conservation

* Stockage sécurisé
* Chaîne de traçabilité

### 5.4 Consultation

* Accès en lecture seule
* Interface utilisateur
* IA DIVA (explication, jamais modification)

### 5.5 Présentation

* Contrôle fiscal
* Audit
* Litige

---

## 🧱 6. Architecture conceptuelle (vue logique)

### 6.1 Rôles des composants

* ERP / Source
* DVIG (ingestion)
* Vault (preuve)
* UI (lecture)
* IA DIVA

### 6.2 Frontières de responsabilité

* Ce que chaque brique garantit
* Ce que chaque brique ne fait pas

---

## 🛡️ 7. Exigences de conformité et de certification

### 7.1 LNE 2026

* Principes adressés par le dispositif

### 7.2 NF525

* Exigences couvertes par conception

### 7.3 Posture de certification

* Dispositif certifiable
* Démarche d’obtention
* Limites et hypothèses

---

## 🧘 8. Cas d’usage critiques

* Contrôle fiscal
* Audit
* Litige
* Clôture financière

Lien explicite avec la Section 3 de la landing (projection réelle).

---

## ⚠️ 9. Hypothèses, limites et points ouverts

* Hypothèses actuelles
* Points à arbitrer
* Dépendances externes (organismes, réglementation)

---

## 📎 10. Annexes

* Glossaire
* Références réglementaires
* Liens vers specs techniques futures

---

**Statut :** Plan proposé pour validation avant rédaction de la SPEC SOCLE
**Niveau :** Produit / conformité / UX — non technique
