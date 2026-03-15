# Spécification d’implémentation front — Landing Dorevia

*Document dédié au passage de la spec éditoriale au build. Référence éditoriale : `spec_dorevia_landing_page.md`. Page contact : `spec_dorevia_landing_contact.md`. Dernière mise à jour : v1.0 consolidée.*

**Règle :** ne pas modifier le contenu de suite.doreviateam.com (landing + page contact) — la spec éditoriale fait référence.

---

## 1. Périmètre

- **Landing** : page d’accueil (suite.doreviateam.com).
- **Contact** : page « Contactez-nous » (formulaire → Odoo 19 CRM, création lead). *La page `/contact` n’est pas une page corporate générique* ; elle est orientée conversion commerciale Dorevia (prise de contact / demande de démo).
- **Stack** : Next.js 15 + Mainline (Tailwind 4, shadcn/ui).

---

## 2. Principes d’architecture front

- **Le site est statique / marketing-first** : pas de dépendance Odoo côté rendu.
- **Next.js porte le rendu complet** de `/` et `/contact`.
- **Odoo 19 CRM** est uniquement cible de création de lead.
- **Aucune logique métier lourde** dans le front.
- **Les composants du template Mainline sont réutilisés de manière sélective** ; le template n’impose pas la structure finale.
- **Rendu recommandé** : pages marketing servies en mode statique / pré-rendu, avec seules les soumissions de formulaire passant par une route serveur.
- **Principe de sobriété éditoriale** : ne pas ajouter de sections ou de textes hors spec sans décision explicite ; la clarté prime sur la quantité.

---

## 3. Routes et structure

| Route | Rôle | Spec éditoriale |
|-------|------|------------------|
| `/` | Landing (Hero, Problème, Comment ça marche, Bénéfices, Voyez Dorevia en action, Footer) | § 2 et 3 de `spec_dorevia_landing_page.md` |
| `/contact` | Page Contact — formulaire, réassurance, projection | `spec_dorevia_landing_contact.md` |

- **Header** : présent sur `/` et `/contact` (logo, 2 ancres sur `/`, CTA « Demander une démo » → `/contact`).
- **Footer** : idem ; « Nous contacter » → `/contact`.

---

## 4. Mapping Mainline → sections Dorevia

*Audit initial réalisé — template `shadcnblocks/mainline-nextjs-template` dans `units/dorevia-suite`.*

| Section spec (bloc) | Équivalent / composant Mainline | Action |
|---------------------|----------------------------------|--------|
| 3.0 Header | `src/components/blocks/navbar.tsx` | Adapter (2 ancres + CTA) |
| 3.1 Hero | `src/components/blocks/hero.tsx` | Adapter |
| 3.2 Le problème | — | Créer `problem-section.tsx` |
| 3.3 Comment ça marche | `resource-allocation` ou structure steps | Adapter / créer `how-it-works.tsx` |
| 3.4 Bénéfices | `src/components/blocks/features.tsx` | Adapter → `benefits-section.tsx` |
| 3.5 Voyez Dorevia en action | — | Créer `voyez-dorevia-section.tsx` |
| 3.6 Footer | `src/components/blocks/footer.tsx` | Adapter |
| Page Contact | `src/app/contact/page.tsx` + `blocks/contact.tsx` | Adapté (Hero, Intro, formulaire spec, réassurance, projection) |

---

## 5. Composants à garder / adapter / supprimer / créer

*Hypothèses — à confirmer à l’audit Mainline.*

- **À garder** : layout global, système de containers, navbar, footer, composants de cartes, boutons.
- **À adapter** : Hero, sections de features, blocs CTA, typographie, visuels, couleurs (contenu + style Dorevia / Akurateco).
- **À supprimer** : sections hors périmètre du template (pricing, testimonials génériques, blog preview, stats artificielles, logos fake, FAQ non cadrée).
- **À créer** :
  - bloc « Le problème » si absent ou trop faible dans Mainline ;
  - bloc « Capturer / Sceller / Piloter » si le composant existant ne convient pas ;
  - page `/contact` selon la spec Dorevia ;
  - intégration formulaire → Odoo CRM.

---

## 6. Navigation

- **Logo** : lien vers `/`.
- **Ancres (sur `/`)** : maximum 2 liens en navbar — « Comment ça marche » → `#comment-ca-marche` ; « Voyez Dorevia en action » → `#voyez-dorevia`. Voir § 7 pour les IDs complets.
- **CTA principal « Demander une démo »** : **recommandation retenue — pointe vers `/contact`.** Le bloc 3.5 peut contenir des CTA internes plus spécifiques (Voir le cockpit, Découvrir les cas d’usage, Demander une démo) selon les destinations disponibles.
- **Footer « Nous contacter »** : lien vers `/contact`.

---

## 7. IDs d’ancrage

À utiliser sur la page `/` pour la navigation et les ancres navbar :

- `#comment-ca-marche` — bloc 3.3 Comment ça marche
- `#benefices` — bloc 3.4 Bénéfices
- `#voyez-dorevia` — bloc 3.5 Voyez Dorevia en action

**Navbar** : seulement 2 ancres — `#comment-ca-marche` et `#voyez-dorevia`.

---

## 8. Formulaire contact → Odoo 19 CRM

### 8.1 Objectif

Créer un **lead** dans Odoo 19 CRM à partir de la page `/contact`.

### 8.2 Contraintes

- Pas de création d’opportunité automatique.
- Pas de logique commerciale complexe côté front.
- Validation des champs côté client et côté serveur.
- Retour utilisateur clair après soumission.

### 8.3 Intégration cible

- Route API Next.js dédiée ou webhook sécurisé.
- Transformation du payload vers le modèle Odoo CRM.
- Journalisation minimale des erreurs.
- Protection anti-spam à prévoir.

### 8.4 Champs

- Nom
- Société (entreprise)
- Email
- Téléphone
- Message
- Source = « Landing Page Dorevia »
- Canal = « Contact page »

*Détail complet des champs (ex. fonction, sujet) : `spec_dorevia_landing_contact.md`.*

**Connexion Odoo 19 CRM** : prévue ultérieurement ; le formulaire peut être livré en v1 sans création de lead (ou avec un envoi email de secours), la route API / webhook sera ajoutée quand la stratégie d’intégration sera arbitrée.

---

## 9. Règles UI (inspirées Akurateco / § 1.6 spec éditoriale)

- **Hiérarchie** : typo nette, titres / sous-titres / corps bien différenciés.
- **Fond** : clair, rendu premium ; sections aérées.
- **CTAs** : visibles, sobres (pas de surcharge).
- **Cartes** : bien séparées (bloc 3.4 Bénéfices, bloc 3.5 trois cartes).
- **Preuves produit** : écrans Linky intégrés (Hero, éventuellement ailleurs).
- **À éviter** : surcharge visuelle, effets « startup flashy », jargon fintech, trop de sections secondaires, rendu template générique.
- **Palette** : sobre, fintech / gouvernance ; confiance, lisibilité, pilotage. Mise en avant de la structure **Capturer / Sceller / Piloter**.
- **Responsive** : lecture fluide sur desktop, tablette et mobile ; conserver la clarté des titres, des cartes et des CTAs ; éviter la densité excessive sur mobile.

---

## 10. Actifs visuels à préparer

- Logo Dorevia
- Capture Hero Linky (cockpit financier)
- Éventuelle capture secondaire du cockpit
- Éventuels pictos / icônes pour Capturer / Sceller / Piloter
- Éventuels visuels pour la page contact

*À préciser en design ; évite que l’intégration bloque sur « on met quoi ici ? ».*

---

## 11. Definition of Done

La v1 de la landing est considérée comme livrable lorsque :

- `/` est intégré avec les 6 blocs prévus ;
- `/contact` est intégré selon la spec dédiée ;
- la navbar fonctionne avec 2 ancres max ;
- le CTA principal pointe vers `/contact` ;
- le formulaire crée bien un **lead** dans Odoo 19 CRM *(connexion Odoo prévue ultérieurement ; v1 publiable sans)* ;
- les captures Linky principales sont intégrées ;
- le rendu respecte les règles UI définies en § 9 ;
- aucune section hors périmètre Mainline inutile n’est conservée.

---

## 12. Points ouverts / risques

- Audit réel du template Mainline à confirmer ;
- destination exacte du CTA « Voir le cockpit » à préciser ;
- destination exacte de « Découvrir les cas d’usage » à préciser ;
- connexion formulaire → Odoo 19 CRM prévue ultérieurement (API Next.js ou webhook à arbitrer) ;
- captures Linky de qualité production à préparer ;
- palette et détails UI à figer en design.

---

## 13. Ordre de build recommandé

1. Audit du template Mainline
2. Validation du mapping Mainline → sections Dorevia
3. Intégration du layout global (`/`, header, footer)
4. Intégration de la landing `/`
5. Intégration de la page `/contact`
6. Intégration du formulaire → Odoo CRM
7. Intégration des actifs visuels Linky
8. Ajustements UI / responsive / finitions
9. Vérification de la Definition of Done

---

## 14. Références

- **Spec éditoriale** : `ZeDocs/web41/spec_dorevia_landing_page.md`
- **Spec page Contact** : `ZeDocs/web41/spec_dorevia_landing_contact.md`
- **URL** : suite.doreviateam.com (DNS activé)
- **Docker** : image `units/dorevia-suite/Dockerfile` ; déploiement tenant `tenants/suite/apps/suite/lab/docker-compose.yml` (réseau `dorevia-network`, reverse proxy Caddy vers `suite_lab:3000`).
- **Caddy** : `units/gateway/Caddyfile` — bloc `suite.doreviateam.com { reverse_proxy suite_lab:3000 }`.
- **Périmètre routes** : seules `/` et `/contact` sont publiées ; about, pricing, faq, login, signup, privacy ont été supprimées.
- **Look & feel** : § 1.6 de la spec éditoriale + référence [Akurateco](https://akurateco.com)

---

*Document v1.0 consolidé — à affiner au fil de l’audit Mainline et du build.*
