# Vision — Synchronisation SuiteCRM ↔ Odoo

**Objectif global** : que **SuiteCRM** (CRM commercial) et **Odoo** (ERP / ventes) restent alignés, avec **n8n** au milieu pour orchestrer les échanges.

---

## 1. Schéma cible

```
                    ┌─────────────┐
   Formulaires      │  SuiteCRM   │      Opportunités,
   / Site           │  (Leads,    │      Contacts,
        │           │   Contacts, │      Comptes
        │           │   Opportun.)│
        ▼           └──────┬──────┘
   ┌─────────┐             │
   │   n8n   │◄────────────┤
   │(workflows)            │
   └────┬────┘             │
        │                  │
        │                  │  (optionnel : Odoo → SuiteCRM)
        ▼                  ▼
   ┌─────────┐       ┌─────────────┐
   │  Odoo   │──────►│  SuiteCRM   │
   │(Partner,│       │  (Contact,   │
   │ Quotation)      │   Account)   │
   └─────────┘       └─────────────┘
```

- **SuiteCRM → Odoo** : ce qui est prévu aujourd’hui (opportunité gagnée → partenaire + devis brouillon).
- **Odoo → SuiteCRM** : optionnel (partenaire ou commande créés dans Odoo → mise à jour Contact/Compte ou statut dans SuiteCRM).

---

## 2. Sens déjà prévus (SPEC v1.0)

| Sens | Flow | Rôle |
|-----|------|------|
| **Site → SuiteCRM** | Web-to-lead | Formulaire / webhook → n8n → création Lead (puis Contact/Compte) dans SuiteCRM. |
| **SuiteCRM → Odoo** | Opportunity won → Odoo | Opportunité gagnée → n8n → création/màj `res.partner` + `sale.order` (brouillon) dans Odoo, `origin=suitecrm`. |

Avec ces deux flows, on a déjà une **synchro** : les leads arrivent dans SuiteCRM, et les opportunités gagnées alimentent Odoo. C’est la base « SuiteCRM et Odoo synchro » côté commercial → ventes.

---

## 3. Complément possible (synchro inverse)

Pour une synchro **vraiment bidirectionnelle** :

| Sens | Flow possible | Rôle |
|------|----------------|------|
| **Odoo → SuiteCRM** | Partner/Contact sync | Création ou mise à jour d’un `res.partner` dans Odoo → n8n → création/màj Contact ou Account dans SuiteCRM (pour garder le même référentiel clients). |
| **Odoo → SuiteCRM** | Commande confirmée → statut opportunité | `sale.order` passé en « confirmé » ou « livré » dans Odoo → n8n → mise à jour du statut de l’Opportunity dans SuiteCRM (optionnel). |

Ces flows sont **hors scope SPEC v1.0** ; à planifier en v1.1 ou après selon besoin.

---

## 4. Où on en est (implémentation)

- **Infra** : n8n et SuiteCRM core/lab déployés, Odoo déployable par tenant.
- **Flow A (web-to-lead)** : webhook n8n en place ; **à compléter** : appel API SuiteCRM pour créer le Lead/Contact.
- **Flow B (opportunity → Odoo)** : **à faire** : workflow n8n (webhook ou schedule) → récupération opportunité → création Partner + Quotation dans Odoo.

Une fois A et B opérationnels, la **synchro de base** (SuiteCRM ↔ Odoo via n8n) est en place ; on pourra ajouter Odoo → SuiteCRM si besoin.

---

## 5. Résumé en une phrase

**Objectif** : SuiteCRM et Odoo synchronisés — **déjà prévus** : leads vers SuiteCRM (web-to-lead) et opportunités gagnées vers Odoo (Partner + devis) ; **optionnel ensuite** : mises à jour Odoo → SuiteCRM (contacts/comptes, statuts).
