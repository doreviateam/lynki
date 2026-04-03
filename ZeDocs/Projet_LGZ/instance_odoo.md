# Instance Odoo — Projet LGZ (lab)

**Base :** `odoo_lab_glz_rgl` — **URL :** `https://glz-rgl.doreviateam.com`

Ce document dresse l’**inventaire des modules installés** (état *installé* en base) et indique **à quoi ils servent**. Les libellés courts reprennent en priorité la fiche module Odoo (FR) ; une phrase complète est ajoutée lorsque c’est utile.

**État constaté :** **108** modules installés sur `odoo_lab_glz_rgl`.

*Dernière mise à jour de ce document : **2 avril 2026** (alignement inventaire + section historique).*

*Après installation / désinstallation de modules : exécuter les requêtes SQL en bas de page, mettre à jour le compteur, le tableau principal et la section « OCA / Dorevia » si besoin.*

---

## Légende « Source »

| Source | Signification |
|--------|----------------|
| **Odoo** | Module livré avec Odoo / localisation officielle (Community ou dépendances auto-installées). |
| **OCA** | Odoo Community Association (dépôt `sources/oca`, `addons-o19`, ou portage local). |
| **Dorevia** | Module maison sous `units/odoo/custom-addons`. |

---

## Modules OCA, Dorevia et portages (focus métier)

Ces modules ne font pas partie du cœur Odoo standard ; ils sont souvent ceux que l’on documente en priorité pour la recette LGZ.

| Module | Source | Rôle |
|--------|--------|------|
| `account_financial_report` | OCA | Rapports comptables type bilan / compte de résultat (OCA), menus sous Facturation. |
| `account_invoice_merge` | OCA | Assistant pour **fusionner** plusieurs factures ou avoirs en **brouillon** (même partenaire, journal, devise, etc.) ; accès réservé au groupe Facturation. |
| `base_multi_company` | OCA | Socle multi-sociétés pour certains modules OCA (champs `company_ids`, règles). |
| `date_range` | OCA | Périodes prédéfinies (exercices, trimestres) utilisées par les rapports et filtres. |
| `dms` | OCA | **Document Management System** : classement, droits, fichiers liés aux enregistrements. |
| `dorevia_partner_membership_fields` | Dorevia | Champs **adhérent** : type d’adhérent (configurable), **consentement** RGPD (case, date, note) ; onglet « Adhérence » sur le partenaire. |
| `mis_builder` | OCA | **MIS Builder** : tableaux de synthèse / indicateurs comptables paramétrables ; menus sous Facturation (rapports). |
| `partner_contact_personal_information_page` | OCA | Onglet **informations personnelles** sur la fiche contact (personnes physiques). |
| `partner_firstname` | OCA | **Prénom et nom** séparés sur les contacts personnes (non-sociétés) ; `name` recalculé. |
| `partner_stage` | OCA | **Étapes de cycle de vie** sur les partenaires (barre d’état, filtrage, suivi). |
| `queue_job` | OCA | **File d’attente de tâches asynchrones** pour les modules qui en dépendent ; nécessite `server_wide_modules` incluant `queue_job`. |
| `report_xlsx` | OCA | Moteur d’**export XLSX** pour les rapports (dont MIS / rapports OCA). |
| `web_responsive` | OCA | Amélioration de l’interface **responsive** (mobile / tablette) pour le backend. |

---

## Inventaire complet des modules installés

Table triée par **nom technique**. Colonne **Rôle** : résumé fonctionnel (tiré des métadonnées module + précision si besoin).

| Module | Source | Rôle |
|--------|--------|------|
| `account` | Odoo | **Facturation / comptabilité client-fournisseur** : factures, paiements, rapports de base. |
| `account_add_gln` | Odoo | Ajout du **GLN** (identifiant logistique) sur le partenaire pour les flux EDI / traçabilité. |
| `account_edi_proxy_client` | Odoo | Client pour le **proxy EDI** (services tiers de délivrance de factures électroniques). |
| `account_edi_ubl_cii` | Odoo | **Facturation électronique** : import / export **UBL / CII** (normes européennes). |
| `account_financial_report` | OCA | Voir section ci-dessus. |
| `account_invoice_merge` | OCA | Voir section ci-dessus. |
| `account_payment` | Odoo | **Paiements en ligne** : passerelles et transactions liées aux factures. |
| `account_peppol` | Odoo | Réseau **Peppol** pour l’échange de factures électroniques. |
| `account_qr_code_sepa` | Odoo | **QR-code SEPA** sur les factures pour faciliter le virement (Europe). |
| `analytic` | Odoo | **Comptabilité analytique** : axes et répartition analytique sur les lignes. |
| `api_doc` | Odoo | **Documentation de l’API** (référence pour intégrations externes). |
| `auth_signup` | Odoo | **Inscription** des utilisateurs (création de compte portail). |
| `auth_totp` | Odoo | **2FA TOTP** (application d’authentification). |
| `auth_totp_mail` | Odoo | Invitations / e-mails liés à la **double authentification**. |
| `auth_totp_portal` | Odoo | TOTP pour le **portail**. |
| `barcodes` | Odoo | Gestion des **codes-barres** (modèles de base). |
| `barcodes_gs1_nomenclature` | Odoo | **Nomenclature GS1** pour codes-barres standardisés. |
| `base` | Odoo | **Noyau** : utilisateurs, sociétés, menus techniques, sécurité de base. |
| `base_iban` | Odoo | Validation et saisie des **IBAN**. |
| `base_import` | Odoo | **Import de fichiers** (CSV, etc.) dans les listes. |
| `base_import_module` | Odoo | Import de **modules** packagés (fichiers ZIP). |
| `base_install_request` | Odoo | **Demandes d’installation** de modules (flux administrateur). |
| `base_multi_company` | OCA | Voir section ci-dessus. |
| `base_setup` | Odoo | **Assistant de configuration** initiale (paramètres de démarrage). |
| `base_sparse_field` | Odoo | **Champs clé-valeur** (sparse) pour extensions légères ; requis par certains modules OCA. |
| `base_vat` | Odoo | **Vérification TVA** intracommunautaire (VIES, etc.). |
| `board` | Odoo | **Tableaux de bord** personnalisables (widgets sur l’accueil). |
| `bus` | Odoo | **Bus temps réel** (notifications live, discuss). |
| `calendar` | Odoo | **Calendrier** : rendez-vous, synchronisation, invitations. |
| `certificate` | Odoo | Gestion des **certificats** (signature, EDI, sécurité). |
| `contacts` | Odoo | **Contacts** : fiches partenaires, adresses, catégories. |
| `crm` | Odoo | **CRM** : pipeline, opportunités, activités commerciales. |
| `date_range` | OCA | Voir section ci-dessus. |
| `digest` | Odoo | **E-mails récapitulatifs** (KPI périodiques). |
| `dms` | OCA | Voir section ci-dessus. |
| `dorevia_partner_membership_fields` | Dorevia | Voir section ci-dessus. |
| `google_address_autocomplete` | Odoo | **Saisie d’adresses** assistée par Google. |
| `google_gmail` | Odoo | Connexion **Gmail** pour l’envoi / réception mail. |
| `hr` | Odoo | **RH** : employés, contrats de base, structure. |
| `hr_calendar` | Odoo | **Heures de travail** des employés dans le calendrier. |
| `hr_homeworking` | Odoo | **Télétravail** : jours / lieux de travail. |
| `hr_homeworking_calendar` | Odoo | Intégration télétravail avec le **calendrier**. |
| `hr_hourly_cost` | Odoo | **Coût horaire** des employés (pour marges, feuilles de temps). |
| `hr_org_chart` | Odoo | **Organigramme** RH. |
| `hr_timesheet` | Odoo | **Feuilles de temps** sur les tâches / projets. |
| `html_editor` | Odoo | **Éditeur HTML** (e-mails, contenus riches). |
| `http_routing` | Odoo | **Routage HTTP** (sites, contrôleurs, multibase). |
| `iap` | Odoo | **In-App Purchases** : crédits et services cloud Odoo. |
| `iap_crm` | Odoo | Liaison **IAP** avec le CRM. |
| `iap_mail` | Odoo | Liaison **IAP** avec le courrier / enrichissement. |
| `iot_base` | Odoo | Socle **IoT** (connexion appareils, point de vente, etc.). |
| `l10n_fr` | Odoo | **Localisation France** : plan comptable, taux TVA, formats de base. |
| `l10n_fr_account` | Odoo | **Comptabilité France** : spécificités légales et fiscales. |
| `l10n_fr_pos_cert` | Odoo | **Conformité loi anti-fraude TVA** pour le point de vente en France. |
| `mail` | Odoo | **Messagerie interne**, suiveurs, pièces jointes, notifications. |
| `mail_bot` | Odoo | **OdooBot** (assistant / messages automatiques). |
| `mail_bot_hr` | Odoo | OdooBot dans le contexte **RH**. |
| `microsoft_outlook` | Odoo | Connexion **Outlook / Microsoft 365** pour le courrier. |
| `mis_builder` | OCA | Voir section ci-dessus. |
| `onboarding` | Odoo | **Parcours d’accueil** et étapes de prise en main. |
| `partner_autocomplete` | Odoo | **Auto-complétion** des sociétés (données externes). |
| `partner_contact_personal_information_page` | OCA | Voir section ci-dessus. |
| `partner_firstname` | OCA | Voir section ci-dessus. |
| `partner_stage` | OCA | Voir section ci-dessus. |
| `payment` | Odoo | **Moteur de paiement** (providers, transactions). |
| `phone_validation` | Odoo | **Validation / format** des numéros de téléphone. |
| `point_of_sale` | Odoo | **Point de vente** (caisse, tickets, sessions). |
| `portal` | Odoo | **Portail client** : accès sécurisé aux documents (factures, projets, etc.). |
| `portal_rating` | Odoo | **Évaluations** depuis le portail. |
| `pos_hr` | Odoo | **Employés** connectés au PDV (connexion caissier). |
| `pos_online_payment` | Odoo | **Paiement en ligne** depuis le point de vente. |
| `privacy_lookup` | Odoo | Outils **RGPD** : recherche / export des données personnelles. |
| `product` | Odoo | **Produits**, variantes, listes de prix. |
| `project` | Odoo | **Projets** : tâches, feuilles de temps, planning. |
| `project_account` | Odoo | Lien **projet ↔ facturation / analytique**. |
| `project_purchase` | Odoo | Lien **projet ↔ commandes d’achat**. |
| `project_purchase_stock` | Odoo | Projet, **achats** et **stock** intégrés. |
| `project_stock` | Odoo | **Mouvements de stock** liés aux tâches projet. |
| `project_stock_account` | Odoo | **Valorisation comptable** du stock sur les projets. |
| `project_todo` | Odoo | **To-do** intégré au projet (tâches personnelles / équipe). |
| `purchase` | Odoo | **Achats** : demandes de prix, bons de commande fournisseurs. |
| `purchase_edi_ubl_bis3` | Odoo | **Commandes d’achat** en **UBL Bis 3** (échange électronique). |
| `purchase_stock` | Odoo | **Réceptions stock** depuis les achats. |
| `queue_job` | OCA | Voir section ci-dessus. |
| `rating` | Odoo | **Notes / satisfaction** (tickets, tâches, portail). |
| `report_xlsx` | OCA | Voir section ci-dessus. |
| `resource` | Odoo | **Ressources** : calendriers de travail, disponibilités. |
| `resource_mail` | Odoo | Notifications **mail** liées aux ressources / réservations. |
| `rpc` | Odoo | **API JSON-RPC** exposée (accès distant standard Odoo). |
| `sales_team` | Odoo | **Équipes commerciales** et attribution des ventes. |
| `sms` | Odoo | Envoi de **SMS** (passerelle Odoo / crédits). |
| `spreadsheet` | Odoo | **Feuilles de calcul** intégrées (données dynamiques). |
| `spreadsheet_account` | Odoo | Formules et données **comptables** dans les feuilles. |
| `spreadsheet_dashboard` | Odoo | **Tableaux de bord** type spreadsheet. |
| `spreadsheet_dashboard_account` | Odoo | Tableaux de bord spreadsheet **comptabilité**. |
| `spreadsheet_dashboard_hr_timesheet` | Odoo | Tableaux de bord **feuilles de temps**. |
| `spreadsheet_dashboard_pos_hr` | Odoo | Tableaux de bord **PDV / RH**. |
| `spreadsheet_dashboard_stock_account` | Odoo | Tableaux de bord **stock / compta**. |
| `stock` | Odoo | **Stock** : entrepôts, mouvements, inventaires. |
| `stock_account` | Odoo | **Valorisation comptable** des stocks. |
| `stock_sms` | Odoo | **SMS** pour alertes stock / livraisons. |
| `uom` | Odoo | **Unités de mesure** (pièces, kg, heures…). |
| `utm` | Odoo | **Campagnes UTM** (tracking marketing). |
| `web` | Odoo | Interface **web** backend (framework UI). |
| `web_hierarchy` | Odoo | Vues **hiérarchiques** (arbres nested). |
| `web_responsive` | OCA | Voir section ci-dessus. |
| `web_tour` | Odoo | **Tours guidés** dans l’interface (onboarding). |
| `web_unsplash` | Odoo | Images **Unsplash** dans le studio / médias. |

---

## Historique récent (lab)

| Date | Élément |
|------|---------|
| Avril 2026 | Installation **`partner_firstname`** (OCA) : prénom / nom séparés sur les contacts personnes. |
| Avril 2026 | Désinstallations : IAP CRM enrich/mine, SMS calendrier/CRM/projet, courrier `snailmail*`, `auth_passkey*`, `hr_skills` + `project_hr_skills`. |

---

## Modules volontairement désinstallés (hors inventaire)

Ces modules ne sont **pas** dans le tableau ci-dessus ; ils ont été retirés du lab LGZ (historique de recette).

| Module | Motif typique |
|--------|----------------|
| `crm_iap_enrich`, `crm_iap_mine` | Services IAP (enrichissement / génération de pistes) non souhaités. |
| `calendar_sms`, `crm_sms`, `project_sms` | SMS par application ; le module générique `sms` peut rester pour d’autres usages. |
| `snailmail`, `snailmail_account` | Courrier postal via Odoo. |
| `auth_passkey`, `auth_passkey_portal` | Connexion WebAuthn / clés d’accès. |
| `hr_skills` | Compétences RH ; **`project_hr_skills`** a été désinstallé en même temps (dépendance). |

---

## Référence rapide (hors inventaire)

- **Note de cadrage projet LGZ / RGL / CCC (v1.9) :** [`NOTE_CADRAGE_PROJET_ODOO.md`](./NOTE_CADRAGE_PROJET_ODOO.md)
- **Configuration serveur lab :** `tenants/glz-rgl/apps/odoo/lab/odoo.conf` et `docker-compose.yml`.
- **Lister les modules installés :**  
  `docker exec odoo_db_lab_glz-rgl psql -U odoo -d odoo_lab_glz_rgl -c "SELECT name FROM ir_module_module WHERE state='installed' ORDER BY name;"`
- **Compter les modules installés :**  
  `docker exec odoo_db_lab_glz-rgl psql -U odoo -d odoo_lab_glz_rgl -t -c "SELECT count(*) FROM ir_module_module WHERE state='installed';"`
- **Exporter la liste brute (fichier) pour diff :**  
  `docker exec odoo_db_lab_glz-rgl psql -U odoo -d odoo_lab_glz_rgl -t -A -c "SELECT name FROM ir_module_module WHERE state='installed' ORDER BY name;" > /tmp/modules_lab_glz_rgl.txt`

**Rappel :** le dépôt OCA **`sources/oca/partner-contact`** alimente notamment `partner_contact_personal_information_page`, `partner_stage`, **`partner_firstname`**. Le script **`oca_flatten`** (au démarrage du conteneur ou manuellement) doit être exécuté après ajout de modules sous `sources/oca`.
