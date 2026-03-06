# 📘 Spécification Socle : Dispositif Dorevia-Vault

**Version :** 1.0  
**Date :** 24 janvier 2026  
**Statut :** Document de Référence Produit & Conformité  
**Portée :** Conceptuelle, Réglementaire et UX (Non technique)

---

## 🎯 1. Objectif et portée de la SPEC

### 1.1 Objectif du document
Ce document définit le **Socle de Vérité** du dispositif Dorevia-Vault. Il a pour but de :
*   Formaliser Dorevia-Vault comme une **infrastructure souveraine de preuve financière**.
*   Établir les principes non négociables qui garantissent l'immuabilité et l'opposabilité des preuves.
*   Servir de référentiel unique pour le développement produit, la stratégie UX, et les futurs audits de certification (LNE 2026 / NF525).

### 1.2 Portée
La présente spécification couvre les aspects conceptuels, les exigences de conformité par design et les parcours utilisateurs de haut niveau. Elle ne traite pas du choix des langages de programmation, des bases de données spécifiques ou de l'implémentation détaillée des APIs.

### 1.3 Documents de référence
Ce socle intègre et consolide les travaux suivants :
*   *Audit UX (Diagnostic à froid)* : Focus sur la clarté et la réduction de la charge cognitive.
*   *Stratégie V2 (Analogie Linky)* : Pivot narratif séparant la capture (Vault) de la lecture (UI).
*   *Copywriting & Conformité* : Intégration des exigences LNE 2026 et NF525.

---

## 🧭 2. Problème traité et intention du dispositif

### 2.1 Le problème métier
Dans les systèmes d'information actuels (ERP, POS), il existe un décalage critique entre la création d'une donnée financière et sa valeur de preuve. Les chiffres sont "fragiles" :
*   **Modifiabilité** : Les données sources peuvent être altérées, supprimées ou reconstituées a posteriori.
*   **Dispersion** : La vérité financière est souvent éparpillée entre des exports Excel, des PDFs et des bases de données disparates.
*   **Stress de l'audit** : La production d'une preuve opposable en cas de contrôle fiscal ou de litige est un processus lent, coûteux et incertain.

### 2.2 Intention de Dorevia-Vault
L'intention première du dispositif est de **désolidariser la preuve de la donnée de gestion**. Dorevia-Vault n'est pas un outil de gestion, c'est un **compteur de vérité** qui :
1.  **Capture** l'événement à la source dès sa naissance.
2.  **Scelle** l'événement pour le rendre immuable.
3.  **Restitue** l'événement sous forme de preuve indiscutable et opposable.

---

## 🧠 3. Principes fondateurs (non négociables)

Pour garantir sa mission de tiers de confiance, Dorevia-Vault repose sur huit piliers immuables :

1.  **Capture Automatique** : Aucune intervention humaine n'est requise pour l'envoi de l'événement vers le Vault.
2.  **Zéro Manipulation** : Le dispositif ne possède aucune fonction de modification ou de suppression d'une preuve une fois scellée.
3.  **Horodatage Certifié** : Chaque événement est marqué temporellement de manière précise et non modifiable.
4.  **Scellage Cryptographique** : Utilisation d'empreintes numériques (hachage) pour garantir l'intégrité absolue du contenu.
5.  **Immuabilité** : La preuve survit à toute modification ou suppression de la donnée source dans l'ERP.
6.  **Lecture Seule (Read-Only)** : L'interface de consultation (Dorevia UI) est strictement séparée des fonctions de capture et ne peut altérer les preuves.
7.  **Souveraineté** : Hébergement et juridiction exclusivement français pour garantir la protection légale des données.
8.  **Certification by Design** : Architecture nativement alignée sur les exigences LNE 2026 et NF525.

---

## 🧩 4. Définition du périmètre fonctionnel

### 4.1 Événements concernés
Dorevia-Vault traite prioritairement les flux financiers suivants :
*   **Facturation** : Création, validation et annulation de factures (Ventes/Achats).
*   **Paiements** : Flux de trésorerie entrants et sortants.
*   **Ventes POS** : Tickets de caisse et clôtures journalières.
*   **Écritures Comptables** : Validation d'écritures dans le grand livre.

### 4.2 Définition d'une « Preuve »
Une preuve dans Dorevia-Vault est un objet autonome contenant :
*   **L'Identifiant Unique Universel de Preuve (IUUP)** : Le numéro de série indépendant de la vérité financière, généré à la capture, permettant de tracer la preuve indépendamment de l'ERP.
*   **Le Corps de l'Événement** : Les données métier brutes capturées.
*   **Le Sceau de Confiance** : L'empreinte cryptographique, l'horodatage et la signature du Vault.
*   **La Métadonnée de Source** : Identifiant du système émetteur (ex: Instance Odoo v15).

### 4.3 Hors périmètre volontaire
*   Dorevia-Vault **ne corrige pas** les erreurs de saisie dans l'ERP.
*   Dorevia-Vault **ne remplace pas** les fonctions de pilotage ou de reporting de l'ERP.
*   Dorevia-Vault **n'est pas** un outil de stockage de fichiers (GED), mais un coffre d'événements.

---

## 🔁 5. Cycle de vie d'une preuve

1.  **Capture** : L'événement est intercepté à la source (via connecteur ou API).
2.  **Ingestion (DVIG)** : Normalisation et validation de l'intégrité initiale.
3.  **Scellage (Vault)** : Génération de l'IUUP, horodatage et hachage.
4.  **Conservation** : Stockage immuable avec réplication sécurisée.
5.  **Consultation (UI)** : Visualisation via l'interface en lecture seule, assistée par l'IA DIVA.
6.  **Exportation** : Génération d'un "Dossier de Preuve" certifié pour les tiers (auditeurs, administration).

---

## 🏗️ 6. Architecture conceptuelle (Vue Logique)

L'architecture suit l'analogie du **Compteur Linky** :
*   **La Source (ERP)** : L'appareil qui consomme/produit la donnée.
*   **Le Compteur (Vault + DVIG)** : Le dispositif scellé qui mesure et enregistre de manière irréfutable.
*   **L'Écran (Dorevia UI)** : L'interface qui permet à l'abonné (le CFO) de consulter sa consommation sans pouvoir modifier le compteur.
*   **L'Expert (IA DIVA)** : L'assistant qui aide à interpréter les mesures pour optimiser la gestion.

---

## 🛡️ 7. Exigences de conformité et de certification

### 7.1 LNE 2026 & NF525
Le dispositif est conçu pour la conformité LNE 2026 / NF525, dans une démarche de certification by design. Il satisfait les quatre exigences fondamentales :
*   **Inaltérabilité** : Garantie par le scellage cryptographique.
*   **Sécurisation** : Garantie par l'infrastructure souveraine et la séparation des rôles.
*   **Conservation** : Garantie par le stockage immuable.
*   **Archivage** : Garantie par la traçabilité continue et la capacité d'exportation certifiée.

### 7.2 Posture de certification
Dorevia-Vault est un **dispositif certifiable**. Les spécifications techniques découlant de ce socle doivent inclure le maintien d'un journal d'audit (Audit Trail) non modifiable, enregistrant toutes les actions du système.

---

## 🧘 8. Cas d'usage critiques

### 8.1 Contrôle fiscal et Audit
En cas de contrôle, le CFO n'extrait pas des données de son ERP ; il présente le **Dossier de Preuve** de Dorevia-Vault. L'auditeur peut vérifier l'IUUP et la signature cryptographique, rendant la contestation impossible.

### 8.2 Continuité de la preuve (Migration ERP)
Lors d'un changement d'ERP (ex: passage de Sage à Odoo), la vérité financière des années précédentes reste accessible et opposable dans Dorevia-Vault. **La preuve est décorrélée de la survie technique de l'outil métier.**

### 8.3 Litige Commercial
En cas de contestation sur une facture ou un paiement, Dorevia-Vault fournit la chronologie exacte et certifiée de l'événement, servant de preuve juridique opposable.

---

## ⚠️ 9. Hypothèses et limites
*   Le dispositif suppose l'intégrité de la connexion entre l'ERP et le système d'ingestion (DVIG).
*   La valeur juridique de la preuve repose sur le maintien des clés privées de signature dans un environnement sécurisé (HSM ou équivalent).

---

**Approuvé par l'Expert Stratégie Produit.**  
*Document de référence pour les phases de conception technique et d'implémentation UI.*
