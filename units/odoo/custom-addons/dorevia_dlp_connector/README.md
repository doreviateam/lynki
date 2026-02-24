# Dorevia DLP Connector

Connecteur Odoo → service DLP (Decision Link Performance).  
Envoie un événement au service DLP lors de la création d'une ligne de timesheet sur un projet.

## Dépendances

- `project`
- `hr_timesheet`

## Configuration

**Paramètres système** (Paramètres > Technique > Paramètres système) :

| Clé | Description | Exemple |
|-----|-------------|---------|
| `dorevia.dlp.service.url` | URL du service DLP | `http://dlp:8020` |
| `dorevia.dlp.tenant.id` | Tenant (slug ou UUID) | `sarl-la-platine` |

## Réseau

Le conteneur Odoo doit pouvoir joindre le service DLP. Les deux doivent être sur le même réseau Docker (`dorevia-network`).

## Comportement

À chaque **création** d'une ligne `account.analytic.line` avec `project_id` :
- POST vers `{DLP_URL}/api/v1/timesheet-validated`
- Payload : tenant_id, source_system=odoo, company_id (odoo:X), project_external_id, time_entry_external_id
- En cas d'erreur : log uniquement, pas de blocage du workflow Odoo
