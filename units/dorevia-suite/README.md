# Dorevia Suite — Landing & Contact

Site marketing Dorevia (suite.doreviateam.com) : landing page + page contact.

**Stack** : Next.js 15, Tailwind 4, template Mainline (shadcnblocks).  
**Specs** : `ZeDocs/web41/` (éditoriale, contact, implémentation).

## Commandes

- `npm run dev` — serveur de dev (Turbopack)
- `npm run build` — build production
- `npm run start` — servir le build

## Docker

- `docker build -t dorevia/suite:latest .` — construire l’image
- `docker run -p 3000:3000 dorevia/suite:latest` — lancer le conteneur (site sur http://localhost:3000)

**Déploiement tenant (suite.doreviateam.com)** : voir `tenants/suite/` — `docker compose up -d` dans `tenants/suite/apps/suite/lab/` après build de l’image ; Caddy reverse_proxy vers `suite_lab:3000`.

## Structure

- **`/`** — Landing (Hero, Problème, Comment ça marche, Bénéfices, Voyez Dorevia en action)
- **`/contact`** — Page contact (formulaire → à connecter Odoo 19 CRM)

Navbar : 2 ancres (#comment-ca-marche, #voyez-dorevia) + CTA « Demander une démo » → `/contact`.

## Références

- Spec éditoriale : `ZeDocs/web41/spec_dorevia_landing_page.md`
- Spec contact : `ZeDocs/web41/spec_dorevia_landing_contact.md`
- Spec implémentation : `ZeDocs/web41/spec_dorevia_landing_implementation.md`
