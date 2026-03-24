# Inventaire UX — état actuel Lynki (existant)

**Version :** 2.6 — mars 2026  
**Révision v2.6 :** **[SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md)** — **version document 0.5** (§2.1 sans lecture directe amont ; §11.2 période / périmètre / référentiel ; suite **v0.6** BG/GL).  
**Révision v2.5 :** spec écran **0.4** (Vault vs amont §2.1).  
**Révision v2.4 :** spec écran **0.3** (charnière BG, fraîcheur §11.1, §4 balances tiers).  
**Révision v2.3 :** spec écran Synthèse **fichier unique** (anciens `*_v0.1` / `*_v0.2` supprimés).  
**Révision v2.2 :** spec écran `*_v0.2.md` ; v0.1 en renvoi.  
**Révision v2.1 :** wireframes BF **fichier unique** **[WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md)** (anciens `*_v0.1` / `*_v0.2` supprimés).  
**Révision v2.0 :** wireframes BF canon v0.2 + spec d’écran ; références croisées doc **v2.0**.  
**Révision v1.9 :** wireframes BF enrichis (v0.1 fichier).  
**Révision v1.8 :** lien **§9** vers wireframes BF (structure initiale).  
**Révision v1.7 :** spec navigation unifiée **[SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md)** (fichier unique ; anciens `*_v0.1` / `*_v0.2` supprimés).  
**Révision v1.6 :** lien **§9** vers spec `*_v0.2.md`.  
**Révision v1.5 :** lien **§9** vers la spec navigation v0.1.  
**Révision v1.4 :** **semi-remplissage** des **§2–§6** à partir du code `units/dorevia-linky` ; bloc **Décisions provisoires** (3 arbitrages) ; *à compléter en atelier* (captures, mobile réel).  
**Révision v1.3 :** **§2** — ligne **layout / shell global** (`app/layout.tsx` vs chrome dans `DashboardWithFilters`) ; **§8** — **sortie attendue** sur **persistance de vue** (URL / state / hybride).  
**Révision v1.2 :** liens canoniques **[NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md)** et **[ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md)** (contenu v1.3.1) ; ligne **§6** sur persistance **Pilotage / Synthèse** (URL vs state) ; **§8.1** question associée.  
**Révision v1.1 :** colonnes **Preuve / source observée**, **Desktop / Mobile** (header), **Global / local** (contexte), ligne **modes d’affichage** explicite, **§8.1 Décisions de cadrage**, **ordre de remplissage** recommandé.  
**Statut :** Document de travail — à compléter après revue produit / design / dev  
**Objet :** répondre à la question posée par la [NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md) §11 : *ce que le header, les filtres et les patterns actuels savent déjà porter* avant de figer l’UX des entrées **Pilotage** / **Synthèse comptable**.

**Périmètre code principal :** `units/dorevia-linky/` (Lynki UI).

**Semi-remplissage (v1.4) :** les tableaux **§2–§6** ci-dessous intègrent des **constats vérifiables** dans le dépôt (fichiers cités). Les cellules encore vides ou marquées *atelier* attendent **captures d’écran**, tests sur **device réel**, ou arbitrage produit.

---

## 1. Pourquoi cet inventaire

La note design retient une **extension maîtrisée** (même chrome, surface centrale évolutive). L’inventaire permet de :

- lister ce qui est **réellement partagé** aujourd’hui (tenant, société, période, fraîcheur, navigation) ;
- repérer les **patterns réutilisables** (blocs, drill-down, statuts) ;
- identifier les **frictions** ou **plafonds** pour accueillir une seconde lecture majeure sans refonte ;
- alimenter une **mini spec UX de navigation**, puis des maquettes **Synthèse comptable**.

### 1.1 Ordre de remplissage recommandé

Pour répondre d’abord à : *où peut vivre le futur switch **Pilotage / Synthèse comptable** sans casser la structure actuelle ?*, remplir en priorité :

1. **§2** — points d’entrée code (repères + preuves fichier)  
2. **§3** — header (**Desktop** et **Mobile** séparément)  
3. **§4** — filtres et contexte (**Global / local**)  
4. **§6** — navigation et routing  

Ensuite : **§5** (patterns UI), **§7** (frictions), **§8** / **§8.1** (synthèse et arbitrages).

---

## 2. Points d’entrée code (repères)

| Zone | Fichiers / composants (indicatif) | Questions à trancher | Preuve / source observée |
|------|-------------------------------------|----------------------|---------------------------|
| Layout racine Next.js | `app/layout.tsx` | Shell **minimal** (html/body, polices, `globals.css`) : pas de chrome métier ici aujourd’hui. Un futur switch **Pilotage / Synthèse** vit-il plutôt au **niveau page** (`page` + enfants) ou faut-il **remonter** une partie du chrome au layout ? | **Constat :** aucun provider métier dans le layout ; tout le chrome est sous **`DashboardWithFilters`**. Un switch de vue peut rester **au niveau page** (`DashboardWithFilters` + `searchParams`) sans toucher `layout.tsx` dans un premier temps. |
| Page racine | `app/page.tsx` → `DashboardWithFilters` | Point d’entrée unique : contenu cockpit = **page**. C’est le niveau naturel pour un état de vue + sync URL (`searchParams`). | `app/page.tsx` : `searchParams.tenant`, `initialShowTenantChoice` si lab sans tenant. |
| Shell cockpit (chrome métier) | `components/DashboardWithFilters.tsx` | Structure colonnes, filtres, header de rapport, contenu central — **c’est ici** que vit aujourd’hui le « cadre » Lynki ; capacité d’accueillir un 2ᵉ « mode » sans dupliquer le chrome. | **~700+ lignes** : `useSearchParams`, `useRouter`, états `period`, `viewMode`, `focusedCardId`, fetch métriques ; `ReportHeader` + `<main>` cartes / `IconGrid` / `DivaFlashBlock`. |
| Header / rapport | `ReportHeader.tsx`, `ReportHeaderContentBody.tsx` | Zone disponible pour onglets ou segmented control ; contraintes responsive | `ReportHeader.tsx` : props `viewMode` / `onViewModeChange`, `ViewMode` typé. `ReportHeaderContentBody.tsx` : **menu hamburger** (lignes 62–120) avec sections *Comptabilité* / *Point de vente* / *Applications*. |
| Chrome / mobile | `ChromeTriggerBar.tsx`, `ChromeAdaptiveContext.tsx` | Comportement petit écran vs desktop pour filtres + futures entrées | `chromeCompact`, `revealChrome`, `ChromeAdaptiveProvider` dans `DashboardWithFilters` ; *détail UX mobile : atelier + captures*. |
| Tenant / gate | `TenantSelector.tsx`, `TenantLoadingGate.tsx`, `TenantContext.tsx` | Ce qui est déjà global et stable entre vues | `TenantProvider` enveloppe le contenu dans `DashboardWithFilters` (export default). `TenantChoiceView` si lab sans `?tenant=`. |
| Grille cartes | `IconGrid.tsx`, cartes `*Card*.tsx` | Patterns de tuile réutilisables pour blocs comptables ? | `IconGrid` + `onSelect` → `focusedCardId` ; cartes instrument avec `onBackToCockpit` — pattern **synthèse → détail** réutilisable pour rubriques comptables. |
| Insights | `DivaFlashBlock.tsx`, routes `app/api/diva/*` | Séparation visuelle / logique si 2ᵉ vue — pas de mélange grille KPI / restitutions | `DivaFlashBlock` rendu sous `IconGrid` quand `viewMode === "all"` && pas de focus carte. |
| Config tenant | `app/lib/tenant-config-*.ts`, `app/api/tenant-config/` | Feature flags possibles pour exposer Synthèse comptable par tenant | `tenantConfig?.chrome?.header` (ex. `showCompanyFilter`) — extension possible pour masquer/afficher vues. |

*Compléments possibles :* `app/layout.tsx` (polices uniquement), autres routes `app/admin/*`.

**Colonne « Preuve » :** indiquer au minimum le **fichier** ou composant vérifié ; idéalement une **capture** (desktop / mobile) stockée côté équipe ou lien interne — pour éviter un inventaire uniquement déclaratif.

---

## 3. Grille d’inventaire — Header

Un switch **Pilotage / Synthèse comptable** peut être simple en **desktop** et problématique en **mobile** : documenter les deux.

| Élément observé | Présent ? | Desktop — comportement / remarque | Mobile — comportement / remarque | Réutilisable tel quel pour 2 entrées ? | Preuve / source observée |
|-----------------|-----------|-------------------------------------|-----------------------------------|----------------------------------------|---------------------------|
| Titre / marque Lynki | Oui | `h1` + lien `/` ; nom produit depuis `tenantConfig.chrome.branding` | Idem (barre du haut) | Oui (à conserver) | `ReportHeaderContentBody.tsx` L47–59 |
| Sélecteur tenant | Oui (si >1 tenant) | Dans le **menu** hamburger, pas en bandeau permanent | Même menu | Oui ; encombrement si **+** switch Pilotage/Synthèse → prévoir **2ᵉ rangée** ou **segmented** dédié | `TenantSelector variant="menu"` dans le nav |
| Sélecteur société | Oui | Grille `sm:grid` : select société **visible** (`hidden sm:grid` sur le bloc filtres) | **Masqué** dans ce bloc — accès via **chrome compact** / *atelier à confirmer* (`ChromeTriggerBar`) | Partiel | `ReportHeaderContentBody.tsx` L124–135 |
| Filtres période / année | Oui | Deux `<select>` centrés | Même remarque **masquage sm** | Partiel | idem |
| **Modes d’affichage actuels** (tout / cash / business / corrections / POS — ou équivalent dans `ReportHeader`) | Oui | **Pas** d’onglets visibles : modes dans **menu** *Comptabilité* + *Point de vente* (`all`, `cash`, `business`, `corrections`, `pos_shops`, `pos_z`) | Même menu hamburger | Futur **Pilotage / Synthèse** : risque de **surcharge menu** si tout reste en hamburger — à arbitrer | `ReportHeader.tsx` `ViewMode` ; `ReportHeaderContentBody.tsx` L74–80, L103–109 |
| Zone d’actions (refresh, etc.) | Partiel | `IntegrityBadge` / refresh scellés ; liens Odoo, DLP, pin chrome | Idem menu | Oui | Menu + `IntegrityBadge` |
| Footer / métadonnées (fraîcheur, P95) | Oui | `LinkyFooter` | *À confirmer* | Oui | `DashboardWithFilters.tsx` |
| *Autre* | | | | | |

#### Question clé — modes existants vs Pilotage / Synthèse comptable

À trancher **tôt** (impact direct sur le header) :

> Les **modes** actuels (cash, business, …) sont-ils **remplacés** par Pilotage / Synthèse, **englobés** (ex. sous Pilotage uniquement), ou **coexistants** (orthogonalité) ?

| Hypothèse | Implication UX (esquisse) |
|-----------|---------------------------|
| Remplacent | Redéfinir toute la logique « mode » dans le header |
| Englobés sous **Pilotage** | Synthèse comptable sans ces modes, ou modes masqués hors Pilotage |
| Coexistent | Deux dimensions : (1) Pilotage/Synthèse (2) cash/business/… — risque de surcharge |

*Réponse provisoire après inventaire :* **hypothèse de travail** — les modes **cash / business / corrections / POS** restent des filtres **du pilotage KPI** (ils pilotent quelles cartes / sections s’affichent). La **Synthèse comptable** est une **autre surface** : soit **sans** ces modes, soit avec **filtres comptables dédiés** (à spécifier). **À valider en atelier** (voir **§6.1**).

---

## 4. Grille d’inventaire — Filtres et contexte global

**Global** = partagé entre toute la page / toutes les sous-vues au même niveau. **Local** = propre à une zone (ex. drill-down, panneau).

| Donnée / état | Source (state, URL, context) | **Global / local** | Partagé sur toute la page ? | Risque si 2ᵉ vue (Synthèse comptable) | Preuve / source observée |
|---------------|------------------------------|--------------------|-----------------------------|----------------------------------------|---------------------------|
| Tenant | URL `?tenant=` (lab) ou **host** `ui.lab.<tenant>…` ou state + `/api/tenant` | **Global** | Oui | Faible : déjà stable | `DashboardWithFilters.tsx` L145–171, `onSetTenantNavigate` |
| Société | `useState` `selectedCompanyId` | **Global** (page) | Oui | Nouvelle vue doit **réutiliser** le même state ou le même contrat API | L183, L205–206 reset au changement tenant |
| Période | `useState` `period` (`PeriodRange`) | **Global** | Oui | Idem | L184, `getDefaultPeriod` |
| Année / exercice | Dérivée de `period` (clé + année dans `ReportHeader`) | **Global** | Oui | Idem | `ReportHeader` + `period-utils` |
| **Modes** (cash, business, …) | `useState` `viewMode` | **Global** (page) | Oui | **Risque** : si Synthèse = autre route, décider si `viewMode` **s’applique** au pilotage uniquement | L185, `setViewMode` passé au header |
| Fraîcheur affichée | Données `dashboardMetrics` / footer | **Global** | Oui | Synthèse devra exposer **sa** fraîcheur ou réutiliser la même | API métriques |
| Permissions tenant | `TenantContext` / config | **Global** | Oui | Contrôle d’affichage Synthèse | `TenantContext` |
| Drill-down carte → instrument | `useState` `focusedCardId` | **Local** (sous-état pilotage) | Non (remplace la grille) | **Ne pas mélanger** avec navigation « Synthèse » au même niveau d’état | L186, L399–403 |

---

## 5. Grille d’inventaire — Patterns UI réutilisables

*(Constats rapides — approfondir après validation atelier.)*

| Pattern | Où c’est utilisé aujourd’hui | Applicable à des blocs « bilan / balances / CCR » ? | Preuve / source observée |
|---------|------------------------------|-----------------------------------------------------|---------------------------|
| Carte synthèse (valeur, variation, statut) | Cartes `*CardWithPolling`, `KpiMetric` | Oui — même **grammaire** de carte pour rubriques comptables | `InstrumentCardChrome`, métriques dashboard |
| Drill-down carte → instrument | `focusedCardId`, `onBackToCockpit` | Oui — modèle **liste → détail** pour rubrique → compte → balance / GL | `DashboardWithFilters.tsx` |
| Tooltips / aide contextuelle | `TILE_HELP`, `tile-help.ts` | Oui | *fichiers `app/lib/tile-help.ts`* |
| Couleurs sémantiques (ok / watch / alert) | `ValueKind`, statuts cartes | Oui | Cartes trésorerie, etc. |
| Listes / tableaux denses | Partiel (cartes, listes dans instruments) | À valider pour **tableaux** type balance / grand livre | *maquette future* |
| États vide / erreur / chargement | `metricsLoading`, `metricsError`, `SyncInProgress` | Oui — réutiliser les mêmes **états** | `DashboardWithFilters.tsx` |

---

## 6. Grille d’inventaire — Navigation et routing

| Sujet | État actuel | Commentaire | Preuve / source observée |
|-------|-------------|-------------|---------------------------|
| URL et query params (`tenant`, etc.) | **`tenant`** en query quand choix explicite (`router.push(pathname?tenant=…)`) ; page lit `searchParams.get("tenant")` | Bon candidat pour ajouter **`view=`** ou **`section=`** au même endroit | `DashboardWithFilters.tsx` L145–178 |
| **Vue active** (`pilotage` / `synthese` ou équivalent) : **persistée dans l’URL** (query / segment) ou **state interne / storage** seulement ? | **Aujourd’hui : aucune** — une seule « vue » cockpit ; `viewMode` et `focusedCardId` sont **uniquement en state React** (pas dans l’URL) | Pour **partage / deep link**, il faudra **étendre** l’URL (recommandation probable en **§8** point 5). | L185–186, pas de `searchParams.get("view")` |
| Navigation interne (cartes, onglets implicites) | **Grille** `IconGrid` → `focusedCardId` ; **pas** d’URL pour la carte focalisée | Retour arrière = **state** (`onBackToCockpit`) | L399–403, L470–479 |
| Historique / deep link vers un indicateur | **Non** (pas de `?card=treasury` etc. au moment de l’audit code) | À ajouter si besoin produit | *atelier* |
| Ce qu’il faudrait pour deep link « vue Synthèse + rubrique » | *Non implémenté* | Schéma possible : `?tenant=&view=synthese&rubric=…` + règles de synchro avec state | **§8.1 #5** |

### 6.1 Décisions provisoires (constat code + proposition produit)

*Non figées — à valider en atelier.*

| # | Question | Décision provisoire | Fondement |
|---|----------|---------------------|-----------|
| 1 | **Pilotage / Synthèse comptable** vit-il dans le **header** ? | **Oui, dans la zone chrome** (`ReportHeader` / même bandeau que titre + filtres), sous forme **d’onglets** ou **segmented control** plutôt que d’empiler un 4ᵉ niveau dans le **menu hamburger** (déjà chargé). | Le header est le lieu naturel du contexte ; le menu sature (tenant, modes, Odoo, DLP, POS…). |
| 2 | Les modes **cash / business / corrections / POS** restent-ils **dans le pilotage** uniquement ? | **Oui (hypothèse)** : ils continuent de piloter **l’affichage des cartes KPI** ; la **Synthèse comptable** est une **autre surface** (pas la même grille), donc **hors** de ces modes sauf arbitrage contraire. | `viewMode` contrôle `showCash`, `showIconGrid`, etc. (`DashboardWithFilters`). |
| 3 | **Persistance** `?view=synthese` (ou équivalent) ? | **MVP :** garder **state** pour itérer vite ; **cible :** **URL** pour partage et alignement avec la note **persistance §8** — implémentation **`searchParams` + `router`** comme pour `tenant`. | Aujourd’hui `viewMode` n’est **pas** dans l’URL ; `tenant` **l’est**. |

---

## 7. Frictions et questions ouvertes (à alimenter)

- **Modes existants** (cash, business, corrections, POS) vs **Synthèse comptable** : voir **§3 — question clé** (orthogonalité, masquage, coexistence).
- **Densité informationnelle** : la vue comptable sera plus dense — le layout actuel le supporte-t-il (scroll, colonnes) ?
- **Grand livre** : confirmé comme drill-down uniquement — impact sur breadcrumbs / retour arrière.
- **Accessibilité** : focus, contrastes, tableaux (à valider avec design system).
- **Bloc insights** en **Synthèse comptable** : présent, absent, ou variante — à traiter en **§8.1**.

---

## 8. Synthèse à produire (sortie de l’inventaire)

À rédiger en fin de travail :

1. **Liste des éléments réutilisables sans modification** (green list).  
2. **Liste des adaptations mineures** (amber list).  
3. **Blocages ou sujets nécessitant une décision** (red list).  
4. **Recommandation** : faisabilité des **2 entrées header** avec l’architecture actuelle — oui / oui sous conditions / non sans chantier structurel.  
5. **Recommandation de persistance de vue** (`pilotage` / `synthese` ou équivalent) : **URL** (query / segment, deep linkable, partageable) **ou** **state local / storage** (MVP plus léger) **ou** **hybride** (ex. URL + hydration) — **orientation explicite** issue de l’atelier, cohérente avec **§6**, **§8.1 #5** et le niveau **layout / page** retenu (**§2**).

### 8.1 Décisions de cadrage à arbitrer (produit / design)

*À séparer de l’observation brute : ce sont des choix, pas des constats.*

| # | Question | Options / notes |
|---|----------|------------------|
| 1 | Le switch **Pilotage / Synthèse comptable** est-il un **onglet**, un **segmented control**, ou un **mode de vue** au sens navigation ? | |
| 2 | Les **modes actuels** (cash, business, …) restent-ils **visibles dans Pilotage seulement** ? Masqués en Synthèse ? | |
| 3 | La **Synthèse comptable** a-t-elle **son propre bloc insights** (Diva), un encart réduit, ou **pas d’insights** dans un premier temps ? | |
| 4 | Le **grand livre** reste-t-il **hors navigation primaire** (drill-down uniquement) dans **tous** les cas de figure ? | |
| 5 | La lecture **Pilotage / Synthèse comptable** doit-elle être **dans l’URL** (partageable, deep linkable) ou **état local** acceptable au MVP ? (voir **§6**.) | ex. `?view=synthese` vs state React uniquement |
| 6 | Autres arbitrages (ex. feature flag tenant, droits RAF/DAF) | |

---

## 9. Liens documentaires (alignement)

- [SPEC_UX_NAVIGATION_LYNKI.md](SPEC_UX_NAVIGATION_LYNKI.md) — **spec navigation** (switch header, `appView` / `kpiMode`, persistance `?view=`, défauts, fallback, historique, surfaces, mobile, grand livre).  
- [WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md](WIREFRAMES_BF_LYNKI_NAVIGATION_PILOTAGE_SYNTHESE.md) — **wireframes basse fidélité** (référence BF navigation).  
- [SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md](SPEC_ECRAN_SYNTHESE_COMPTABLE_LYNKI.md) — **spec d’écran** Synthèse comptable (doc **0.5** : Vault §2.1, §11.2 preuve, charnière BG, blocs, GL, états).  
- [NOTE_DESIGN_MASTER_LYNKI.md](NOTE_DESIGN_MASTER_LYNKI.md) — intention Pilotage / Synthèse comptable.  
- [CDC_MASTER_LYNKI.md](CDC_MASTER_LYNKI.md) — §4.1.1 restitutions structurantes, §10 UI.  
- [DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md](DICTIONNAIRE_RESTITUTIONS_COMPTABLES_LYNKI.md) — identifiants `lynki.accounting.*`.  
- [ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md](ALIGNEMENT_CDC_IMPLEMENTATION_LYNKI.md) — état implémentation (version du contenu : voir en-tête du fichier, ex. 1.3.1).

---

*Document vivant — compléter après atelier UX + revue code courte.*
