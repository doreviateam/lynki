# 📋 Évaluation — SPEC Landing Page Dorevia-Vault (Sylius) v1.1

**Date** : 2026-01-15  
**Évaluateur** : Assistant IA  
**Statut SPEC** : Validée (post audit)  
**Cible** : `sylius.lab.core.doreviateam.com`

---

## 🎯 Résumé Exécutif

La spécification **v1.1** apporte des **clarifications importantes** par rapport à la v1.0, notamment sur le modèle économique, les valeurs des champs Lead, et l'intégration Odoo. Le périmètre reste **bien délimité** et les objectifs **réalistes**.

**Verdict global** : ✅ **FAISABLE** — Toutes les recommandations de la v1.0 ont été adressées.

**Améliorations v1.1** :
- ✅ Modèle économique clarifié (hybride : abonnement + usage)
- ✅ Liste de valeurs `role` définie (7 valeurs)
- ✅ Workflow `status` défini (5 états)
- ✅ Intégration Odoo spécifiée (création automatique `crm.lead`)
- ✅ PostgreSQL confirmé (cohérence plateforme)
- ✅ Variable `DEPLOY_ENV=lab` ajoutée
- ✅ Estimation incluse (18-27h)

**Points d'attention restants** :
- ⚠️ Détails techniques de l'intégration Odoo (API, authentification, gestion erreurs)
- ⚠️ Contenu détaillé des sections landing page (toujours manquant)

---

## 1. Analyse des Améliorations v1.1

### 1.1 Modèle Économique ✅ CLARIFIÉ

**v1.0** : Ambiguïté sur "abonnement mensuel fixe" + "0,60€/cycle"

**v1.1** : 
```
Modèle hybride : Abonnement mensuel + usage
Usage : 0,60 € par cycle complet de facture
```

**Analyse** :
- ✅ **Clarification parfaite** : Modèle hybride explicite
- ✅ **Détail du cycle** : validation → envoi → encaissement → réconciliation
- ✅ **Message clair** : "Vous payez ce que vous prouvez"

**Recommandation** : ✅ **AUCUNE** — Modèle économique maintenant clair.

### 1.2 Champ `role` ✅ DÉFINI

**v1.0** : À clarifier (liste de valeurs ?)

**v1.1** :
```
dirigeant
daf
comptable
cabinet
retail
it_integrateur
autre
```

**Analyse** :
- ✅ **7 valeurs** bien définies
- ✅ **Couvre** les cibles principales (dirigeants, comptables, intégrateurs)
- ✅ **Valeur "autre"** pour flexibilité

**Recommandation** : ✅ **AUCUNE** — Liste complète et pertinente.

### 1.3 Champ `status` ✅ DÉFINI

**v1.0** : À clarifier (workflow ?)

**v1.1** :
```
new
contacted
qualified
converted
archived
```

**Analyse** :
- ✅ **Workflow standard CRM** bien structuré
- ✅ **5 états** logiques et complets
- ✅ **État initial** : `new` (par défaut)

**Recommandation** : ✅ **AUCUNE** — Workflow cohérent avec bonnes pratiques CRM.

### 1.4 Base de Données ✅ POSTGRESQL CONFIRMÉ

**v1.0** : MariaDB ou PostgreSQL (choix à faire)

**v1.1** :
```
PostgreSQL
```

**Analyse** :
- ✅ **Cohérence** avec Odoo et Vault (PostgreSQL)
- ✅ **Stack unifiée** pour la plateforme
- ✅ **Performance** et fonctionnalités avancées

**Recommandation** : ✅ **AUCUNE** — Choix technique cohérent.

### 1.5 Variable Environnement ✅ AJOUTÉE

**v1.0** : `APP_ENV=prod` mais environnement = LAB (ambiguïté)

**v1.1** :
```
APP_ENV=prod
APP_DEBUG=0
DEPLOY_ENV=lab
```

**Analyse** :
- ✅ **Distinction claire** : `APP_ENV` (mode Symfony) vs `DEPLOY_ENV` (environnement déploiement)
- ✅ **Configuration production** pour performance
- ✅ **Traçabilité** environnement via `DEPLOY_ENV`

**Recommandation** : ✅ **AUCUNE** — Distinction bien faite.

---

## 2. Nouvelle Fonctionnalité : Intégration Odoo

### 2.1 Spécification ✅

**v1.1** :
```
À chaque création de lead Sylius :
- appel API Odoo
- création crm.lead
- utilisateur API dédié
```

**Analyse** :
- ✅ **Objectif clair** : Synchronisation automatique Sylius → Odoo
- ✅ **Modèle Odoo** : `crm.lead` (standard Odoo CRM)
- ✅ **Authentification** : Utilisateur API dédié (bonne pratique)

**Points à clarifier** :
- ⚠️ **URL Odoo** : Quelle instance ? (`odoo.lab.core.doreviateam.com` ?)
- ⚠️ **Méthode API** : XML-RPC ou REST API ?
- ⚠️ **Mapping champs** : Comment mapper les champs Sylius → Odoo ?
- ⚠️ **Gestion erreurs** : Que faire si Odoo indisponible ?
- ⚠️ **Idempotence** : Éviter doublons si appel échoue puis réussit ?

### 2.2 Architecture Technique Recommandée

**Option 1 : Service Symfony asynchrone (recommandé)**

```php
// App\Service\OdooLeadSyncService

class OdooLeadSyncService
{
    public function syncLeadToOdoo(Lead $lead): void
    {
        try {
            $odooClient = new OdooClient(
                getenv('ODOO_URL'),
                getenv('ODOO_DB'),
                getenv('ODOO_API_USER'),
                getenv('ODOO_API_PASSWORD')
            );
            
            $crmLeadData = $this->mapLeadToOdoo($lead);
            $crmLeadId = $odooClient->create('crm.lead', $crmLeadData);
            
            // Marquer lead comme synchronisé
            $lead->setOdooLeadId($crmLeadId);
            $lead->setOdooSyncedAt(new \DateTime());
            
        } catch (\Exception $e) {
            // Log erreur, mais ne pas bloquer la création du lead Sylius
            $this->logger->error('Erreur sync Odoo', [
                'lead_id' => $lead->getId(),
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function mapLeadToOdoo(Lead $lead): array
    {
        return [
            'name' => $lead->getEmail(),
            'email_from' => $lead->getEmail(),
            'description' => $this->buildDescription($lead),
            'type' => 'lead',
            'source_id' => $this->getSourceId($lead->getUtmSource()),
            'campaign_id' => $this->getCampaignId($lead->getUtmCampaign()),
            'user_id' => $this->getDefaultSalespersonId(),
            'team_id' => $this->getDefaultTeamId(),
        ];
    }
}
```

**Option 2 : Queue asynchrone (pour robustesse)**

```php
// Utiliser Symfony Messenger pour traitement asynchrone
// Avantage : Ne bloque pas la réponse HTTP si Odoo lent/indisponible

$messageBus->dispatch(new SyncLeadToOdooMessage($lead->getId()));
```

**Recommandation** : **Option 1** pour V1 (simple), **Option 2** pour V1.1+ (robustesse).

### 2.3 Mapping Champs Lead → crm.lead Odoo

**Mapping proposé** :

| Champ Sylius | Champ Odoo | Notes |
|--------------|-----------|-------|
| `email` | `email_from` | Obligatoire Odoo |
| `email` | `name` | Nom du lead = email (par défaut) |
| `role` | `function` | Fonction du contact |
| `message` | `description` | Message libre |
| `utm_source` | `source_id` | Source marketing (relation) |
| `utm_campaign` | `campaign_id` | Campagne marketing (relation) |
| `referrer` | `description` | Ajouté dans description |
| `stack` | `description` | Ajouté dans description |
| `volume` | `description` | Ajouté dans description |
| `status` | `stage_id` | Stage Odoo selon status Sylius |

**Recommandation** : Créer méthode `mapLeadToOdoo()` dans service dédié.

### 2.4 Gestion Erreurs

**Scénarios à gérer** :
1. **Odoo indisponible** : Log erreur, lead créé dans Sylius quand même
2. **Authentification échoue** : Log erreur critique, alerte admin
3. **Validation Odoo échoue** : Log erreur, lead créé dans Sylius
4. **Timeout** : Log erreur, lead créé dans Sylius

**Recommandation** : 
- ✅ **Ne jamais bloquer** la création du lead Sylius si Odoo échoue
- ✅ **Log toutes les erreurs** pour debugging
- ✅ **Marquer lead** avec `odoo_sync_status` (success, failed, pending)
- ✅ **Retry automatique** (optionnel V1.1+) via queue

### 2.5 Configuration Odoo

**Variables d'environnement nécessaires** :

```env
ODOO_URL=https://odoo.lab.core.doreviateam.com
ODOO_DB=odoo_db
ODOO_API_USER=sylius_api_user
ODOO_API_PASSWORD=secure_password
ODOO_DEFAULT_TEAM_ID=1
ODOO_DEFAULT_SALESPERSON_ID=1
```

**Recommandation** : Créer utilisateur Odoo dédié avec droits `crm.lead` (create, write).

---

## 3. Tests Mise à Jour

### 3.1 Scénarios Ajoutés ✅

**v1.1** :
```
- POST /lead → création Odoo
```

**Tests à ajouter** :

```php
// tests/Functional/LeadControllerTest.php

public function testLeadCreationSyncsToOdoo(): void
{
    // Mock Odoo client
    $odooClient = $this->createMock(OdooClient::class);
    $odooClient->expects($this->once())
        ->method('create')
        ->with('crm.lead', $this->anything())
        ->willReturn(123);
    
    // Soumettre formulaire
    $this->client->request('POST', '/lead', [
        'email' => 'test@example.com',
        'role' => 'comptable',
    ]);
    
    // Vérifier lead créé dans Sylius
    $lead = $this->leadRepository->findOneBy(['email' => 'test@example.com']);
    $this->assertNotNull($lead);
    $this->assertEquals(123, $lead->getOdooLeadId());
}

public function testLeadCreationHandlesOdooFailure(): void
{
    // Mock Odoo client qui échoue
    $odooClient = $this->createMock(OdooClient::class);
    $odooClient->expects($this->once())
        ->method('create')
        ->willThrowException(new \Exception('Odoo unavailable'));
    
    // Soumettre formulaire
    $this->client->request('POST', '/lead', [
        'email' => 'test@example.com',
        'role' => 'comptable',
    ]);
    
    // Vérifier lead créé dans Sylius quand même
    $lead = $this->leadRepository->findOneBy(['email' => 'test@example.com']);
    $this->assertNotNull($lead);
    $this->assertNull($lead->getOdooLeadId());
    $this->assertEquals('failed', $lead->getOdooSyncStatus());
}
```

**Recommandation** : ✅ Tests bien définis — À implémenter.

---

## 4. Architecture Technique Finale

### 4.1 Structure Recommandée

```
units/sylius/
  docker-compose.yml          # postgres, php-fpm, nginx
  nginx.conf                  # Configuration Nginx
  .env.example                # Variables d'environnement
  README.md                   # Documentation
  src/
    Entity/
      Lead.php                # Entity Doctrine
    Controller/
      LandingController.php   # GET /
      LeadController.php      # POST /lead
      PrivacyController.php   # GET /privacy
      HealthController.php    # GET /healthz
    Form/
      LeadType.php            # Formulaire Symfony
    Service/
      OdooLeadSyncService.php # Intégration Odoo
    Command/
      CleanupLeadsCommand.php # CRON RGPD (24 mois)
  config/
    routes.yaml               # Routes Symfony
    services.yaml             # Services Symfony
    packages/
      doctrine.yaml           # Configuration Doctrine
      security.yaml           # CSRF, rate limiting
```

### 4.2 Modèle Entity Lead

```php
// src/Entity/Lead.php

class Lead
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    
    #[ORM\Column(type: 'datetime')]
    private \DateTime $createdAt;
    
    #[ORM\Column(length: 255)]
    private string $email;
    
    #[ORM\Column(length: 50)]
    private string $role; // dirigeant, daf, comptable, etc.
    
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $stack = null;
    
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $volume = null;
    
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $message = null;
    
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $utmSource = null;
    
    #[ORM\Column(length: 255, nullable: true)]
    private ?string $utmCampaign = null;
    
    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $referrer = null;
    
    #[ORM\Column(length: 50)]
    private string $status = 'new'; // new, contacted, qualified, converted, archived
    
    // Intégration Odoo
    #[ORM\Column(nullable: true)]
    private ?int $odooLeadId = null;
    
    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTime $odooSyncedAt = null;
    
    #[ORM\Column(length: 20, nullable: true)]
    private ?string $odooSyncStatus = null; // success, failed, pending
}
```

---

## 5. Checklist Pré-Implémentation v1.1

### 5.1 Clarifications ✅ RÉSOLUES

- [x] Clarifier liste valeurs `role` (Lead) → ✅ **FAIT** (7 valeurs)
- [x] Définir workflow `status` (Lead) → ✅ **FAIT** (5 états)
- [x] Choisir PostgreSQL → ✅ **FAIT** (PostgreSQL confirmé)
- [x] Clarifier modèle économique → ✅ **FAIT** (hybride : abonnement + usage)
- [x] Ajouter variable `DEPLOY_ENV` → ✅ **FAIT** (`DEPLOY_ENV=lab`)

### 5.2 Nouveaux Points à Clarifier

- [ ] **URL Odoo** : Confirmer `odoo.lab.core.doreviateam.com` ?
- [ ] **Méthode API Odoo** : XML-RPC ou REST API ?
- [ ] **Mapping champs** : Valider mapping proposé (Lead → crm.lead)
- [ ] **Utilisateur API Odoo** : Créer utilisateur dédié avec droits
- [ ] **Gestion erreurs** : Définir stratégie (log, retry, alertes)
- [ ] **Contenu sections landing** : Rédiger contenu détaillé (hero, problème, etc.)

### 5.3 Actions Techniques

- [ ] Créer répertoire `units/sylius/`
- [ ] Préparer `docker-compose.yml` (postgres, php-fpm, nginx)
- [ ] Configurer `nginx.conf`
- [ ] Créer `.env.example` avec toutes les variables
- [ ] Ajouter route Caddy (`sylius.lab.core.doreviateam.com`)
- [ ] Créer DNS record A (`sylius.lab.core`)
- [ ] Implémenter Entity `Lead` (Doctrine)
- [ ] Implémenter `OdooLeadSyncService`
- [ ] Implémenter `CleanupLeadsCommand` (CRON RGPD)
- [ ] Créer templates Twig (landing, privacy)
- [ ] Implémenter tests (PHPUnit)

---

## 6. Estimation Effort v1.1

### 6.1 Comparaison v1.0 vs v1.1

**v1.0** : 18-27h  
**v1.1** : **20-30h** (+2-3h pour intégration Odoo)

**Détail v1.1** :
- **Backend** (Entity, Controller, Forms) : 4-6h
- **Intégration Odoo** (Service, mapping, tests) : 2-3h ⭐ **NOUVEAU**
- **Frontend** (Twig templates, CSS) : 8-12h
- **Docker** (Compose, Nginx) : 2-3h
- **Caddy** (Configuration) : 1h
- **Tests** (PHPUnit, intégration Odoo) : 3-4h (+1h pour Odoo)
- **Documentation** : 1-2h

**Total estimé** : **20-30h** (2.5-4 jours développeur)

---

## 7. Risques et Mitigation

### 7.1 Risques Identifiés

**Risques faibles** :
- ✅ Architecture standard Sylius
- ✅ Intégration Odoo simple (API existante)
- ✅ Pas de complexité technique majeure

**Risques moyens** :
- ⚠️ **Premier déploiement Sylius** dans la plateforme (apprentissage)
- ⚠️ **Intégration Odoo** : Gestion erreurs, timeouts, indisponibilité
- ⚠️ **Génération Caddyfile** : Ajout manuel ou adaptation script ?

**Mitigation** :
- Utiliser image Sylius officielle (moins de custom)
- Implémenter gestion erreurs robuste pour Odoo (ne pas bloquer création lead)
- Ajout manuel Caddyfile pour V1 (rapide)
- Tests en local avant déploiement LAB
- Monitoring logs Odoo sync pour détecter problèmes

---

## 8. Conclusion

### 8.1 Verdict Final

✅ **SPEC v1.1 VALIDÉE** — Toutes les recommandations v1.0 adressées.

**Points forts** :
- ✅ Clarifications importantes (modèle économique, champs Lead)
- ✅ Intégration Odoo bien pensée (création automatique crm.lead)
- ✅ Architecture cohérente avec plateforme
- ✅ Sécurité et RGPD pris en compte
- ✅ Estimation réaliste (20-30h)

**Actions avant implémentation** :
1. Clarifier détails techniques intégration Odoo (URL, méthode API, mapping)
2. Créer utilisateur API Odoo dédié
3. Rédiger contenu détaillé sections landing page
4. Préparer configuration Caddy et DNS

**Faisabilité** : ✅ **EXCELLENTE** (2.5-4 jours développeur)

---

## 9. Comparaison v1.0 → v1.1

| Aspect | v1.0 | v1.1 | Statut |
|--------|------|------|--------|
| Modèle économique | Ambigu | Hybride clarifié | ✅ Résolu |
| Champ `role` | À clarifier | 7 valeurs définies | ✅ Résolu |
| Champ `status` | À clarifier | 5 états définis | ✅ Résolu |
| Base de données | MariaDB/PostgreSQL | PostgreSQL | ✅ Résolu |
| Variable environnement | Ambigu | `DEPLOY_ENV=lab` | ✅ Résolu |
| Intégration Odoo | Non mentionnée | Spécifiée | ⭐ Nouveau |
| Estimation | 18-27h | 20-30h | ✅ Mise à jour |

**Progression** : ✅ **+6 points clarifiés** / **+1 fonctionnalité majeure**

---

**Fin du rapport d'évaluation v1.1**
