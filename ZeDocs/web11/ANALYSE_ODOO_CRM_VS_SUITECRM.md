# Analyse technico-fonctionnelle : Odoo CRM vs SuiteCRM

Document d’aide à la décision pour comparer **Odoo CRM** et **SuiteCRM** sur les plans technique et fonctionnel.

Dernière mise à jour : **2026-02**  
Répertoire : **ZeDocs/web11**

**Contexte** : la plateforme Dorevia propose aujourd’hui les deux univers (Odoo et SuiteCRM) ; cette analyse vise à éclairer un choix ou un positionnement (CRM pur vs ERP/CRM intégré).

**Note** : la première version de cette analyse s’appuyait sur des connaissances générales (produits, écosystème). La **section « Analyse du code source dans la plateforme »** (§ 8) complète le document avec ce qui est **réellement présent dans le dépôt** (`units/odoo`, `units/suitecrm`).

---

## 1. Synthèse comparative

| Critère | Odoo CRM | SuiteCRM |
|--------|-----------|----------|
| **Positionnement** | Module CRM au sein d’une suite ERP/CRM modulaire | CRM standalone (fork communautaire de SugarCRM) |
| **Stack technique** | Python, PostgreSQL, XML (vues), JavaScript (OWL) | PHP, MySQL/MariaDB, JavaScript (côté client) |
| **Licence** | AGPL (Community) / Licence commerciale (Enterprise) | AGPL (open source) |
| **Déploiement** | Docker officiel (odoo), PostgreSQL | Docker (Bitnami, etc.), MySQL/MariaDB |
| **Intégration native** | Forte avec Facturation, Vente, Projet, Stock, etc. | CRM seul ; intégrations via connecteurs / API |
| **Personnalisation** | Modules Python + XML ; héritage de vues, champs calculés | Modules PHP, Studio (éditeur no-code), API REST |
| **Évolution produit** | Versions annuelles (17, 18…), roadmap Odoo S.A. | Versions communautaires (8.x), roadmap communautaire |
| **Support / éditeur** | Odoo S.A. (Enterprise), partenaires, communauté | Communauté, partenaires ; pas d’éditeur unique |

---

## 2. Analyse fonctionnelle

### 2.1 Périmètre CRM (lead → opportunité → vente)

| Fonction | Odoo CRM | SuiteCRM |
|----------|----------|----------|
| Leads / contacts | Oui (applications CRM, Contacts) | Oui (Leads, Contacts) |
| Pipeline opportunités | Oui (étapes personnalisables, kanban) | Oui (pipeline, étapes, kanban) |
| Activités / tâches / rendez-vous | Oui (liées aux opportunités, contacts) | Oui (Tasks, Meetings, Calls) |
| Email (envoi / réception) | Oui (intégration messagerie, templates) | Oui (campagnes, emails liés aux enregistrements) |
| Historique / suivi commercial | Chatter sur chaque enregistrement | Historique, notes, activités |
| Rapports / tableaux de bord | Rapports intégrés, dashboards (Odoo) | Rapports, dashboards, indicateurs |
| Workflows / automatisations | Automatisations (Odoo 16+), actions serveur | Workflows (logic hooks, scheduler) |
| Mobile | App Odoo (iOS/Android), interface responsive | Interface responsive, app communautaire possible |

**Points forts Odoo CRM** : intégration immédiate avec **Devis / Commandes / Facturation** (même base, même interface). Passage opportunité → devis → commande → facture sans re-saisie.

**Points forts SuiteCRM** : **CRM pur**, très orienté ventes et relation client ; fonctionnalités avancées (campagnes marketing, parcours leads) sans dépendre d’un ERP.

### 2.2 Au-delà du CRM (ERP, facturation, stock)

| Fonction | Odoo CRM | SuiteCRM |
|----------|----------|----------|
| Facturation client / fournisseur | Oui (modules Comptabilité / Facturation) | Non natif ; à intégrer (ERP externe, connecteurs) |
| Gestion de stock / inventaire | Oui (module Stock) | Non natif |
| Achats / commandes fournisseurs | Oui | Non natif |
| Projet / tâches projet | Oui (module Projet) | Limité (tâches liées aux opportunités) |
| Comptabilité complète | Oui (Odoo Comptabilité) | Non |
| E-commerce (boutique) | Oui (Odoo eCommerce) | Non natif |

**Conclusion fonctionnelle** :  
- **Odoo CRM** est adapté si l’objectif est un **CRM + ERP intégré** (vente, facturation, stock, comptabilité dans la même plateforme).  
- **SuiteCRM** est adapté si l’on souhaite un **CRM dédié** (ventes, leads, opportunités) sans embarquer un ERP, éventuellement connecté à un ERP ou une facturation externe.

### 2.3 Ce que SuiteCRM apporte en plus qu’Odoo (hors interface)

En **couverture fonctionnelle CRM**, Odoo est **équivalent voire supérieur** à SuiteCRM sur la plupart des dimensions (pipeline, activités, contacts, devis, intégration facturation, projet, etc.). En revanche, SuiteCRM dispose de **quelques axes où il peut aller plus loin** que Odoo Community, **indépendamment de l’interface** :

| Domaine | SuiteCRM | Odoo (Community) |
|--------|----------|------------------|
| **Campagnes marketing / email** | Campagnes dédiées (email, tracking, objectifs, ROI), lead nurturing intégré, parcours campagnes. | Module Marketing plus léger en Community ; campagnes et automatisations plus poussées en Enterprise. |
| **Lead scoring / routing** | Lead scoring et règles d’affectation (round-robin, par territoire, par charge) configurables sans code. | Règles d’affectation possibles ; lead scoring et routing avancé plutôt côté Enterprise ou custom. |
| **Personnalisation sans code (Studio)** | **SuiteCRM Studio** inclus en open source : nouveaux champs, relations, mises en page, listes, sans développement. | **Odoo Studio** réservé à Enterprise ; en Community, personnalisation = développement (Python/XML). |
| **Rapports / Report Builder** | Report Builder no-code très souple (sélection champs, filtres, regroupements, graphiques) pour rapports ad hoc. | Moteur de rapports et vues pivot puissants ; création de rapports complexes souvent via vues techniques ou dev. |
| **Email entrant / distribution** | Gestion d’adresses email partagées, affectation automatique des leads/contacts (round-robin, règles), historique email centralisé. | Discussion (mail) et canaux ; la distribution automatique depuis des boîtes partagées est moins « prête à l’emploi » en Community. |

**En résumé** : au-delà d’une interface parfois perçue comme plus riche, SuiteCRM se distingue surtout par (1) **campagnes marketing / lead nurturing** plus complètes en open source, (2) **Studio no-code** pour personnaliser sans dev, (3) **Report Builder** pour rapports ad hoc sans code, (4) **lead scoring et routing** plus visibles et configurables, (5) **email entrant et distribution** (boîtes partagées, round-robin). Sur le reste du périmètre CRM (pipeline, opportunités, activités, devis, intégration back-office), Odoo est au moins équivalent et souvent supérieur, surtout dès que l’on sort du strict CRM (facturation, stock, projet, vaulting dans la plateforme Dorevia).

---

## 3. Analyse technique

### 3.1 Stack et hébergement

| Aspect | Odoo CRM | SuiteCRM |
|--------|----------|----------|
| Langage backend | Python 3 | PHP (7.4 / 8.x selon version) |
| Base de données | PostgreSQL | MySQL / MariaDB |
| Frontend | Templates QWeb, OWL (JavaScript), Bootstrap | Smarty (templates), JavaScript, thèmes |
| API | XML-RPC, JSON-RPC, API REST (Odoo 17+) | REST API (v8+) |
| Déploiement type | Docker (image officielle odoo), reverse proxy | Docker (Bitnami, etc.), LAMP / LEMP |
| Ressources (ordre de grandeur) | 1 instance : 2 Go RAM, 1 CPU ; + PostgreSQL | 1 instance : 1–2 Go RAM, 1 CPU ; + MySQL |

Dans le contexte **Dorevia** : les deux sont déployés en conteneurs (Odoo + PostgreSQL ; SuiteCRM + MariaDB), avec gateway Caddy et réseau Docker partagé.

### 3.2 Extensibilité et personnalisation

| Aspect | Odoo CRM | SuiteCRM |
|--------|----------|----------|
| Modèle de données | Modèles Python (ORM), champs définis en Python/XML | Beans PHP, base MySQL ; champs personnalisables via Studio |
| Nouveaux champs / écrans | Modules (Python + XML) ; héritage de modèles et vues | Studio (no-code) pour champs et mises en page ; modules PHP pour logique |
| Développement custom | Courbe d’apprentissage Python + architecture Odoo (modèles, vues, actions) | Courbe d’apprentissage PHP + structure Sugar/SuiteCRM (logic hooks, API) |
| Intégrations (API) | XML-RPC / JSON-RPC / REST ; nombreux connecteurs (n8n, etc.) | REST API ; connecteurs communautaires ou custom |

### 3.3 Sécurité et conformité

| Aspect | Odoo CRM | SuiteCRM |
|--------|----------|----------|
| Authentification | Utilisateurs Odoo, LDAP/OAuth possibles (modules) | Utilisateurs, LDAP, SAML (extensions) |
| Rôles / droits | Groupes et droits par modèle et par champ (règles d’accès) | Rôles, équipes, droits par module et par enregistrement |
| Audit / traçabilité | Logs, chatter, historique des changements | Logs, historique des modifications |
| RGPD | Outils de confidentialité, export/suppression (modules ou Enterprise) | Fonctions d’export/suppression ; à compléter selon déploiement |

Les deux sont exploitables en conformité avec des exigences raisonnables (sécurité, RGPD) sous réserve de configuration et de processus adaptés.

### 3.4 Performance et montée en charge

| Aspect | Odoo CRM | SuiteCRM |
|--------|----------|----------|
| Volume (ordre de grandeur) | Des dizaines de milliers d’enregistrements CRM sans souci avec PostgreSQL et indexation | Idem avec MySQL/MariaDB bien configuré |
| Montée en charge | Multi-worker (Gunicorn, etc.), scaling horizontal possible ; PostgreSQL scalable | PHP-FPM, scaling horizontal ; MySQL réplication possible |
| Cache | Cache Odoo (assets, session), cache PostgreSQL | Cache PHP, cache MySQL/Redis selon mise en œuvre |

Pour des usages CRM « classiques » (équipes de 5 à 100 utilisateurs, milliers de leads/opportunités), les deux solutions sont capables de tenir la charge avec une infrastructure adaptée.

---

## 4. Écosystème et coûts

### 4.1 Licence et coûts logiciel

| Aspect | Odoo CRM | SuiteCRM |
|--------|----------|----------|
| Licence de base | AGPL (Community) gratuite | AGPL gratuite |
| Version payante | Odoo Enterprise (hébergement, support, modules propriétaires) | Pas de version éditeur payante ; support et services via partenaires |
| Coût total de possession | Community : coût = hébergement + mise en œuvre + éventuel support partenaire. Enterprise : licence + hébergement/support Odoo. | Coût = hébergement + mise en œuvre + support partenaire ou interne |

### 4.2 Communauté et support

| Aspect | Odoo CRM | SuiteCRM |
|--------|----------|----------|
| Communauté | Très active (forum, GitHub, partenaires) | Active (forum, GitHub, fork SugarCRM) |
| Documentation | Documentation officielle Odoo (modules, API) | Documentation communautaire, wiki |
| Éditeur | Odoo S.A. (roadmap, Enterprise) | Pas d’éditeur unique (projet communautaire) |

---

## 5. Critères de choix recommandés

### Choisir **Odoo CRM** si :

- Vous voulez **CRM + facturation + stock (et éventuellement comptabilité, projet)** dans une seule plateforme.
- Vous privilégiez une **même base de données** et une **même interface** pour vente et back-office.
- Vous êtes prêt à investir sur l’écosystème **Python / PostgreSQL** et la logique modulaire Odoo.
- Vous envisagez à terme d’ajouter d’autres briques Odoo (e-commerce, RH, etc.).

### Choisir **SuiteCRM** si :

- Vous voulez un **CRM pur** (leads, opportunités, ventes) sans ERP intégré.
- Vous avez déjà un **ERP ou une facturation** externe et souhaitez un CRM qui s’y connecte via API.
- Vous privilégiez une stack **PHP / MySQL** et une approche **CRM-first**.
- Vous misez sur un produit **100 % open source** sans version éditeur payante.

### Cas particuliers

- **Plateforme Dorevia** : aujourd’hui, **Odoo** est le socle pour le **vaultage des factures** (DVIG + Vault) ; SuiteCRM n’est pas branché à ce flux. Si la preuve de scellement des documents (factures) est un besoin fort, Odoo est aligné avec l’existant.
- **Multi-tenant** : les deux peuvent être déployés par tenant (comme dans le manifest actuel : univers `odoo`, univers `suitecrm`). Le choix peut être fait **par tenant** (un tenant en Odoo CRM, un autre en SuiteCRM) selon le besoin métier.

---

## 6. Synthèse (tableau de bord)

| Dimension | Odoo CRM | SuiteCRM |
|-----------|----------|----------|
| **CRM pur (lead → vente)** | ★★★★ | ★★★★★ |
| **Intégration ERP / facturation** | ★★★★★ | ★★ (via intégrations) |
| **Simplicité de déploiement (Docker)** | ★★★★★ | ★★★★ |
| **Personnalisation (no-code / low-code)** | ★★★ (Studio limité en Community) | ★★★★ (SuiteCRM Studio) |
| **Évolution produit / éditeur** | ★★★★★ (Odoo S.A.) | ★★★ (communautaire) |
| **Coût licence** | ★★★★★ (Community) / variable (Enterprise) | ★★★★★ (toujours open source) |
| **Alignement avec Dorevia (Vault, factures)** | ★★★★★ | ★★ (non branché aujourd’hui) |

---

## 8. Analyse du code source dans la plateforme Dorevia

Cette section s’appuie sur le **code et la configuration réellement présents** dans le dépôt (`units/odoo`, `units/suitecrm`, `tenants/*/state/manifest.json`) pour préciser comment Odoo et SuiteCRM sont utilisés dans la plateforme.

### 8.1 Odoo dans la plateforme

**Emplacements analysés** : `units/odoo/`, `units/odoo/custom-addons/`, `units/odoo/conf/`.

| Élément | Contenu dans la plateforme |
|--------|----------------------------|
| **Custom-addons** | Sept modules Dorevia **spécifiques à la plateforme** (pas de module CRM custom) : |
| | • **dorevia_vault_connector** — Connecteur vaulting des factures vers DVIG/Vault (queue_job, CRON, machine d’état todo → pending_proof → vaulted). Dépend de `account`, `dorevia_posted_lock`, `queue_job`. |
| | • **dorevia_posted_lock** — Verrouillage des factures à l’état « posted » (immutabilité). |
| | • **dorevia_billing_core** — Réception des constats mensuels (Vault) et facturation MRR. |
| | • **dorevia_sale_reports** / **dorevia_sale_report_fix** / **dorevia_sale_proforma_report_fix** — Corrections et mises en page des rapports PDF (devis, commandes, pro forma). |
| | • **dorevia_report_pdf_layout_fix** — Fix mise en page PDF (Bootstrap col-*) pour Sale/Account. |
| **Configuration (ex. odoo.lab.conf)** | `addons_path` inclut `/mnt/custom-addons` ; `queue_job` avec canaux dédiés vaulting ; `workers = 2` ; `proxy_mode = True`. |
| **CRM dans la plateforme** | Aucun module CRM custom dans le dépôt. Le CRM utilisé est le **CRM standard Odoo** (applications CRM, Ventas) + les addons Dorevia ci-dessus (vaulting, facturation, rapports). |

**Conclusion (code source)** : Odoo est **fortement intégré** à la chaîne Dorevia (Vault, DVIG, facturation, rapports). Le CRM Odoo est le CRM standard ; la valeur ajoutée plateforme est dans les modules **Comptabilité / Facturation / Vault** (dorevia_vault_connector, dorevia_posted_lock, dorevia_billing_core) et les correctifs de rapports.

### 8.2 SuiteCRM dans la plateforme

**Emplacements analysés** : `units/suitecrm/`.

| Élément | Contenu dans la plateforme |
|--------|----------------------------|
| **Code source custom** | **Aucun** : pas de code PHP ou de personnalisation SuiteCRM dans le dépôt. |
| **Fichiers présents** | `docker-compose.yml` (référence pour le render), `.env.example`, `README.md`. |
| **Image / stack** | Image Bitnami `bitnami/suitecrm:8` (ou `bitnamilegacy/suitecrm:8` selon tenant), base MariaDB. |
| **Rôle dans la chaîne** | D’après `units/suitecrm/README.md` : **Site/Formulaires → SuiteCRM → n8n → Odoo → DVIG → Vault**. SuiteCRM est en **amont** (capture leads / formulaires) ; **Odoo** est la brique connectée à DVIG/Vault (facturation, vaulting). |

**Conclusion (code source)** : SuiteCRM est déployé en **image standard** (Bitnami), sans développement custom dans la plateforme. Il sert de **CRM de capture** (leads, formulaires) ; la facturation et le vaultage restent côté **Odoo**.

### 8.3 Impact sur la comparaison Odoo CRM vs SuiteCRM

| Critère | Odoo (dans la plateforme) | SuiteCRM (dans la plateforme) |
|--------|----------------------------|-------------------------------|
| **Code custom dans le dépôt** | Oui (7 modules Dorevia : vault, facturation, rapports, verrouillage) | Non (uniquement déploiement Docker) |
| **Intégration DVIG/Vault** | Oui (dorevia_vault_connector) | Non (hors périmètre actuel) |
| **Rôle métier** | CRM + Facturation + Vaulting (chaîne complète jusqu’à la preuve) | CRM de capture (leads) ; chaîne poursuivie via n8n puis Odoo |
| **Évolution / personnalisation** | Forte (modules Python, conf, queue_job) | Standard (image + env) ; pas de personnalisation versionnée dans le dépôt |

L’analyse des sections 1 à 7 reste valable pour une **comparaison produit** (Odoo CRM vs SuiteCRM en général). La présente section **8** la complète en indiquant ce qui est **réellement implémenté** dans la plateforme Dorevia : Odoo y est le socle de la chaîne facturation/vaulting ; SuiteCRM y est un CRM de capture sans code custom ni intégration directe au Vault.

---

## 9. Références (et ressources dépôt)

- [Odoo CRM](https://www.odoo.com/app/crm) (présentation officielle)
- [SuiteCRM](https://suitecrm.com/) (site officiel)
- Documentation Odoo (modules CRM, Ventas, Facturation)
- Documentation SuiteCRM (administration, API, Studio)
- Manifests et déploiements Dorevia : `tenants/*/state/manifest.json`, `units/odoo/`, `units/suitecrm/`
- Code source analysé pour la section 8 : `units/odoo/custom-addons/`, `units/odoo/conf/`, `units/suitecrm/` (docker-compose, README)

---

*Document d’analyse — ZeDocs/web11. Objectif : éclairer un choix Odoo CRM vs SuiteCRM dans un contexte technique et fonctionnel, y compris plateforme Dorevia.*
