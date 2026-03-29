# Exécution des tickets Web60 — Linky (Pilotage)

**Fichier canonique :** `EXECUTION_TICKETS_WEB60_LINKY.md`  
**Version :** 1.1.20 — mars 2026  
**Lot :** Web60  
**Statut :** guide d’exécution publié  

**Références :** [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) **v1.1.10** (vérité **W60-xxx**) · [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) **v1.1.24** · [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) **v1.1.3** · [`SPEC_CARTES_MAITRESSES_LINKY.md`](./SPEC_CARTES_MAITRESSES_LINKY.md) **v1.1.17** · [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) **v1.1.17** · **Web61 —** [`cdcf.md`](../web61/cdcf.md) (dont **§2.12.1** bandeau figé + pied **Dorevia-Vault** / **UI**+hash / **Tenant** portail ; **§2.13** marque **DL** + favicon) · [`ROADMAP_REFONTE_LINKY_STITCH_CAROLE_61.md`](../web61/ROADMAP_REFONTE_LINKY_STITCH_CAROLE_61.md) · [`TABLEAU_TRACE_CDCF6_TRESORERIE.md`](../web61/TABLEAU_TRACE_CDCF6_TRESORERIE.md) (registre §6 Trésorerie ↔ code)  

**Code applicatif principal :** `units/dorevia-linky/`

### Environnement prioritaire — build, déploiement, recette

Le cycle **build → déploiement → validation** pour Web60 vise en **priorité** l’instance **lab** avec le tenant **`laplatine2026`** :

* **URL de référence (seule vérité recette « produit visible ») :** [https://lab.linky.doreviateam.com/?tenant=laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026) — c’est **cette** page qui permet de juger l’avancement côté utilisateur, pas un build local isolé.  
* **Commande unique de déploiement (même script partout) :** depuis la racine du dépôt, **`./scripts/deploy-linky-lab.sh`** — rebuild **deux** images Docker Linky puis `compose up` : (1) **`linky_generic`** servi par **`lab.linky.doreviateam.com`** (`units/gateway/Caddyfile` → `reverse_proxy linky_generic:3000`, compose `tenants/linky-generic`) ; (2) **`linky_lab_laplatine2026`** pour **`ui.lab.laplatine2026.doreviateam.com`**. Équivalent : `make deploy` dans `tenants/laplatine2026/apps/ui/lab` (délègue au même script).  
* **Où l’exécuter :** sur la **machine qui sert réellement** le nom `lab.linky.doreviateam.com` (serveur d’équipe, stack derrière Caddy, etc.). Lancer le script **uniquement** sur un poste de développement ne met pas à jour l’URL publique : l’**hôte du lab** doit exécuter le script après `git pull`.  
* **Preuve de version déployée :** en pied de page Linky (desktop), la barre affiche la **version** plateforme puis le segment **UI** + **hash court git** — les deux doivent correspondre au déploiement attendu (`NEXT_PUBLIC_LINKY_UI_BUILD_REF` au build Docker). Le libellé du lien coffre de preuves est **Dorevia-Vault** (`vaultLinkLabel` dans `GET /api/tenant-config`). Si l’UI ou les libellés ne matchent pas le dépôt après déploiement : vérifier que Caddy pointe vers **`linky_generic`** pour `lab.linky` (`units/gateway/Caddyfile`) et que ce conteneur a été reconstruit (écart typique : seul `linky_lab_laplatine2026` rebuildé).  
* Les PR sur le cockpit **Pilotage** doivent être vérifiables sur l’URL ci-dessus **après** ce déploiement ; les autres stacks / tenants restent utiles en complément, pas comme filet principal de recette.

### Régimes d’usage de référence

Les tickets Web60 sont exécutés et validés à travers trois **régimes d’usage** distincts :

* **Max** = utilisateur **Pilotage** sur **téléphone mobile**  
* **Véréna** = usage principalement **desktop** pour le **pilotage finance**  
* **Esther** = usage orienté **reporting financier**

Conséquences d’exécution :

* pour **Max**, priorité à la lisibilité immédiate, à la hiérarchie visuelle et à la compacité utile ;  
* pour **Véréna**, priorité à la robustesse de pilotage desktop et à la continuité cockpit → détail ;  
* pour **Esther**, priorité à la cohérence méthodologique, à la stabilité sémantique et à la capacité de restitution.

---

## 1. Objet

Ce document organise la **fermeture par blocs** du lot Web60 : chaque **Passe** regroupe des tickets d’exécution **T-W60-xxx** en miroir strict des **W60-xxx** du [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md).

* **W60-xxx** = item normatif dans le backlog (constat, décision, statut produit).  
* **T-W60-xxx** = même identifiant numérique, préfixe **T-** pour le **suivi d’exécution** (PR, code, recette) dans ce guide.

Le dossier **Web60** compte **six pièces maîtresses** :

1. [`PLAN_WEB60_LINKY_UI.md`](./PLAN_WEB60_LINKY_UI.md) — cadre  
2. [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) — norme d’états  
3. [`SPEC_CARTES_MAITRESSES_LINKY.md`](./SPEC_CARTES_MAITRESSES_LINKY.md) — spec T / B / F  
4. [`BACKLOG_WEB60_LINKY.md`](./BACKLOG_WEB60_LINKY.md) — arbitrages et statuts  
5. [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md) — protocole **R60-xxx** ([§10](./RECETTE_WEB60_LINKY.md))  
6. **Ce fichier** — séquence de passes et tickets **T-W60-xxx**

### Raccord exécution ↔ recette (**R60-xxx**)

Les contrôles **R60-001 … R60-010** sont définis dans la [recette §10](./RECETTE_WEB60_LINKY.md). Chaque **critère de fin** de passe ci-dessous indique quels **R60** doivent être **OK** (ou **N/A** justifié) une fois la passe bouclée — sans remplacer le tableau canonique (libellés et colonnes **Réf. backlog** restent dans la recette).

---

## 2. Séquence courte d’attaque (5 passes + recette)

1. **Passe 1 — États visibles** (T-W60-001 … T-W60-010) — *premier bloc opérationnel recommandé*  
2. **Passe 2 — Trésorerie** (T-W60-101 … T-W60-108)  
3. **Passe 3 — Business** (T-W60-201 … T-W60-208)  
4. **Passe 4 — Flux net** (T-W60-301 … T-W60-308)  
5. **Passe 5 — Second rang & ensemble** (T-W60-401 … T-W60-406)  
6. **Fermeture recette** (T-W60-501 … T-W60-506) — après stabilisation des passes 1–5 ; protocole [`RECETTE_WEB60_LINKY.md`](./RECETTE_WEB60_LINKY.md)

---

## 3. Tickets les plus structurants (P0 backlog)

À traiter en priorité dans l’ordre du [backlog §11](./BACKLOG_WEB60_LINKY.md) ; la **Passe 1** couvre notamment **T-W60-001**, **T-W60-003** avant de considérer les passes suivantes comme « gelées ».

| T-W60 (exé.) | W60 | Zone | Titre rappel |
|--------------|-----|------|--------------|
| **T-W60-001** | W60-001 | Global | Normaliser le lexique d’état visible *(Fait mars 2026)* |
| **T-W60-003** | W60-003 | Global | Principal / secondaire / global |
| **T-W60-101** | W60-101 | Trésorerie | Dominance visuelle |
| **T-W60-102** | W60-102 | Trésorerie | Pas « Synchro OK » seul en lecture principale |
| **T-W60-103** | W60-103 | Trésorerie | État principal de qualité cohérent |
| **T-W60-201** | W60-201 | Business | Carte plus habitée |
| **T-W60-203** | W60-203 | Business | « Certifié » en secondaire |
| **T-W60-301** | W60-301 | Flux net | Libellé **Proxy** |
| **T-W60-302** | W60-302 | Flux net | Badge sans domination sur le montant |
| **T-W60-402** | W60-402 | Second rang | Sortir du couple « — » + Fiable |

---

## 4. Passe 1 — États visibles

**Cap de passe :** la grammaire d’état **à l’écran** sur le Pilotage et le chrome est alignée sur la doctrine : lexique unique, niveaux (principal / secondaire / global) lisibles, pas de synonymes concurrents ni sur-badging évident.

**Critère de fin :** les **R60-001**, **R60-002** et **R60-003** de la [recette §10](./RECETTE_WEB60_LINKY.md) sont **OK** (ou **Assumé** documenté **W60-505**) ; les **W60-001**, **W60-002**, **W60-003** du backlog sont **Fait** ou arbitrés.

*Alignement : **R60-001** (chrome), **R60-002** (synonymes), **R60-003** (principal / secondaire / global) couvrent le périmètre « états visibles » du tableau recette.*

*Découpage utile : la clôture **lexique** **T-W60-001** / **W60-001** (smoke **desktop + mobile**, **R60-001/002**) peut précéder **R60-003**, porté surtout par **T-W60-003** — voir **§4.1** et **§13.1**.*

| T-W60 | Réf. backlog | P | Titre court (aligné backlog) | Statut exé. |
|-------|--------------|---|------------------------------|-------------|
| T-W60-001 | [W60-001](./BACKLOG_WEB60_LINKY.md) §5 | P0 | Normaliser le lexique d’état visible | Fait |
| T-W60-002 | [W60-002](./BACKLOG_WEB60_LINKY.md) §5 | P0 | Supprimer les synonymes concurrents d’état | À faire |
| T-W60-003 | [W60-003](./BACKLOG_WEB60_LINKY.md) §5 | P0 | Distinguer principal, secondaire et global | À faire |
| T-W60-004 | [W60-004](./BACKLOG_WEB60_LINKY.md) §5 | P1 | Répartir états cartes vs système global | À faire |
| T-W60-005 | [W60-005](./BACKLOG_WEB60_LINKY.md) §5 | P1 | Preuves / scellés barre haute vs trust bar | Fait |
| T-W60-006 | [W60-006](./BACKLOG_WEB60_LINKY.md) §5 | P1 | Mapping centralisé des états UI | À faire |
| T-W60-007 | [W60-007](./BACKLOG_WEB60_LINKY.md) §5 | P1 | Ordre de précédence visuelle des états | À faire |
| T-W60-008 | [W60-008](./BACKLOG_WEB60_LINKY.md) §5 | P2 | Ton coloriel des états de vigilance | À faire |
| T-W60-009 | [W60-009](./BACKLOG_WEB60_LINKY.md) §5 | P1 | Réduire le sur-badging positif | À faire |
| T-W60-010 | [W60-010](./BACKLOG_WEB60_LINKY.md) §5 | P2 | Barre haute : arrêté / fraîcheur explicites | À faire |

**Repères code :** `TopBar`, `ReportHeader`, `ChromeTriggerBar`, `CockpitDesktopView`, `InstrumentCardChrome`, états partagés — voir **§9** ci-dessous.

**Statut Passe 1 :** **ouverte.** **T-W60-001** **Fait** ; enchaîner **T-W60-002** → **T-W60-003** pour synonymes puis **R60-003** / niveaux d’état. Mode PR détaillé : **§14**.

### 4.1 Clôture — T-W60-001 / W60-001 *(2026-03-25)*

* **Lab** [`laplatine2026`](https://lab.linky.doreviateam.com/?tenant=laplatine2026) : lexique Pilotage normalisé ; « Proxy data » → **Proxy** (desktop) ; **R60-001** / **R60-002** **OK** ; contrôle **desktop Véréna** + **smoke mobile Max** validés ; pied de page **UI** + hash.
* **Statuts :** **T-W60-001** et **W60-001** → **Fait** ; ligne **journal §13** renseignée.
* **Suite :** **T-W60-002** (synonymes) → **T-W60-003** pour **R60-003** et critère de fin Passe 1 (**§4**).

### 4.2 Clôture — T-W60-005 / W60-005 *(25 mars 2026)*

#### W60-005 — Clarification des preuves (vue vs cumulées)

**Statut :** Fait  
**Date :** 25/03/2026

**Décision appliquée**

* Clarification microcopy uniquement, sans changement backend.
* Distinction explicite entre :
  * **preuves de la vue** = preuves correspondant au périmètre et à la période affichés ;
  * **preuves cumulées** = total des preuves scellées disponibles pour le tenant (et la société affichée si filtre), toutes périodes confondues.

**Implémentation**

* `IntegrityBadge`
  * libellé cockpit : `N preuves de la vue` ;
  * suffixe `(partiel)` conservé si besoin ;
  * fallback honnête en `N preuves cumulées` si seule la source total est disponible ;
  * tooltip vue : `Preuves scellées correspondant au périmètre et à la période affichés.`
* `LinkyFooter`
  * desktop : `Preuves cumulées : N ✓`
  * mobile : `N cumulées ✓` / `— cumulées`
  * `title` aligné sur le sens cumulatif (tenant + société affichée si filtre, toutes périodes)
* `SyncInProgress`
  * libellé aligné sur la sémantique cockpit : `preuves de la vue`

**Résultat**

* L’ambiguïté perçue entre badge haut et footer est levée sans modifier les agrégats.
* La lecture trust devient plus explicite et plus robuste côté produit.

**Validation**

* `npm run build` OK dans `units/dorevia-linky`.

---

## 5. Passe 2 — Trésorerie

**Cap de passe :** la carte **Trésorerie** est la lecture cardinale du cockpit ; état de **qualité** en principal ; **Synchro OK** au plus en secondaire ; matière et dégradés conformes à la [spec §5](./SPEC_CARTES_MAITRESSES_LINKY.md).

**Critère de fin :** **R60-004** recette **OK** ([§10](./RECETTE_WEB60_LINKY.md)) ; **W60-101** à **W60-103** backlog **Fait** (ou arbitrage documenté).

| T-W60 | Réf. backlog | P | Titre court | Statut exé. |
|-------|--------------|---|-------------|-------------|
| T-W60-101 | W60-101 | P0 | Densification Trésorerie (carte A) | Fait |
| T-W60-102 | W60-102 | P0 | Remplacer « Synchro OK » comme lecture principale | Fait |
| T-W60-103 | W60-103 | P0 | État principal de qualité cohérent | Fait |
| T-W60-104 | W60-104 | P1 | « Synchro OK » en secondaire (arbitrage) | À faire |
| T-W60-105 | W60-105 | P1 | Matière visuelle sans nuire au chiffre | À faire |
| T-W60-106 | W60-106 | P1 | Clic → détail stable | À faire |
| T-W60-107 | W60-107 | P1 | États dégradés partiel / attente / indispo | À faire |
| T-W60-108 | W60-108 | P1 | Lecture instantanée Max | À faire |

**Statut (bloc P0 Trésorerie W60-101–103) :** **Fait** — **R60-004** **OK** en [recette §10](./RECETTE_WEB60_LINKY.md) ; la suite Passe 2 (**T-W60-104…108**) reste ouverte selon priorité backlog.

### 5.1 W60-101 — Densification Trésorerie maîtresse

**Statut :** Fait *(densification + polish composition §5.1.2 validés côté produit sur **lab** ; contour / liseré portés par **W60-103** / §5.3.1)*  
**Priorité :** P1  
**Date d’ouverture :** 25/03/2026

#### 5.1.1 Avancement code *(≠ clôture lab)*

* **Fichiers :** `app/lib/cockpit/treasury-cockpit-tile.ts`, `components/CockpitDesktopView.tsx`, `components/CockpitMobileView.tsx`.  
* **Suite :** **W60-103** / **T-W60-103** clôturés (**§13**, **R60-004**) ; prochain focus Passe 2 : **W60-104** (secondaire « Synchro OK ») si arbitré.

#### 5.1.2 Polish composition — desktop *(arbitrage produit, sans geler le ticket)*

* Badge **qualité** : plus en `absolute bottom-right` (évitait chevauchement avec **Volume à rapprocher**) → **flux**, colonne droite de l’en-tête, au-dessus de l’icône wallet.  
* Bloc **couverture + barre + écarts** : suppression du `mt-auto` (fin du « trou » vide au milieu) ; zone inférieure en `flex-1` + `justify-center` pour **répartir** le groupe dans la hauteur utile de la tuile `row-span-2`.  
* **Écart ERP − Vault** : léger séparateur (`border-t`) avant la paire de lignes chiffrées pour structurer la lecture.

**Intention produit**  
Faire passer la carte Trésorerie du statut de **coque crédible** à celui de **véritable instrument de pilotage**.  
La carte doit rester sobre, premium et lisible, tout en portant une matière métier plus explicite.

**Problème adressé**  
À l’issue de la Passe 1, la carte Trésorerie remplit bien son rôle de tuile maîtresse A, mais son corps reste trop vide et sa zone centrale ne raconte pas encore suffisamment l’état de trésorerie.  
Le montant principal est bien posé, mais la carte n’offre pas encore assez de sous-lecture immédiate pour une lecture cockpit crédible côté RAF / pilotage.

**Décision de lot**

* Conserver la structure générale de la carte maîtresse.
* Conserver la valeur principale et le statut de confiance.
* Densifier la carte par **2 à 3 sous-lectures métier stables**.
* Remplacer la matière visuelle encore trop abstraite par une zone centrale ayant une fonction de lecture claire.
* Ne pas transformer la carte en mini page détail.
* Ne pas introduire de dépendance backend nouvelle dans ce ticket si l’existant permet déjà une première passe crédible.

**Attendus fonctionnels**

* La carte doit faire apparaître clairement :

  * le **solde principal** ;
  * une **lecture de gouvernance / qualité** ;
  * une ou deux **sous-informations utiles** à la compréhension immédiate.
* La zone centrale doit devenir lisible comme élément métier et non comme simple remplissage visuel.
* La carte doit rester compatible avec la hiérarchie A du cockpit.

**Périmètre recommandé — passe 1**

* Valeur principale inchangée.
* Statut de confiance conservé.
* Ajout de sous-lectures candidates selon disponibilité et stabilité des données :

  * `Solde validé`
  * `Écart ERP` ou indicateur de rapprochement
  * `Couverture` / `Synchro`
* Refonte légère de la zone centrale pour lui donner une fonction explicite :

  * mini lecture d’évolution ;
  * ou structuration banque / espèces / rapprochement ;
  * ou bloc visuel équivalent sobre et lisible.

**Hors périmètre**

* Refonte complète de la page détail Trésorerie.
* Nouveau backend dédié.
* Multiplication de micro-indicateurs qui surchargeraient la carte.
* Animation ou effets décoratifs non porteurs de sens.

**Critères de réussite**

* La carte Trésorerie paraît immédiatement plus habitée.
* La lecture de trésorerie gagne en densité sans perdre en sobriété.
* La zone centrale devient compréhensible comme support de lecture métier.
* La carte prépare naturellement les passes suivantes W60-102 / W60-103.
* Le cockpit reste visuellement stable à l’échelle de l’écran.

**Implémentation attendue**

* Ajustements côté `CockpitDesktopView` / composition de la carte maîtresse Trésorerie.
* Réutilisation prioritaire des données déjà disponibles dans `dashboard-metrics`.
* Alignement avec la spec cartes maîtresses en vigueur, sans ouvrir un écart documentaire inutile.

**Validation**

* Relecture visuelle desktop cockpit.
* Vérification de non-régression sur la hiérarchie A/B/C.
* Build applicatif OK.

**Repères code (exécution) :** `TresoreriePositionCard`, `TreasuryCardWithPolling`, `tresorerie/page` — voir **§9** ; [spec Trésorerie §5](./SPEC_CARTES_MAITRESSES_LINKY.md).  
**Branche / PR (type) :** `web60-w60-101-tresorerie-densification` · `[Web60][T-W60-101][W60-101] Trésorerie — densification carte maîtresse (passe 1)`

### 5.2 W60-102 — Lecture principale : qualité (Fiable)

**Statut :** Fait *(badge **Fiable** / **Partiel** / etc. via `treasuryCockpitPrimaryBadge` ; preuve **lab**)*  
**Repères code :** `treasuryCockpitPrimaryBadge`. La question « **Synchro OK** en secondaire » relève de **W60-104** / **T-W60-104**.

### 5.3 W60-103 — État principal de qualité cohérent (spec §5.4)

**Statut :** Fait *(badge + **contour fin** desktop et mobile ; déploiement **`./scripts/deploy-linky-lab.sh`** ; build **`LINKY_UI_BUILD_REF=d013f91d`** (HEAD au rebuild ; code cockpit **1f6cd569**) ; **R60-004** **OK**)*  

**Mapping** (`metrics.treasury.status` → badge unique) :

| Statut API | Libellé canonique | Rôle spec §5.4 |
|------------|-------------------|----------------|
| `ok` | **Fiable** | Lecture pleinement exploitable |
| `watch` | **Partiel** | Périmètre / couverture incomplets |
| `neutral` | **En attente** | Donnée ou couverture non stabilisée |
| `alert` ou défaut | **Indisponible** | Lecture impossible ou inconnue |

#### 5.3.1 Contour fin, liseré supprimé, Trésorerie honnête *(doctrine §5.4)*

* **Doctrine figée** : [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) **v1.1.3** — **§5.4.7** (implémentation).  
* **Code :** `app/lib/cockpit/cockpit-master-card-outline.ts` ; `CockpitDesktopView.tsx` — cartes **Trésorerie**, **Business**, **Flux net** : plus de **liseré haut** vert ; **contour** selon état principal (Trésorerie : **Partiel** ⇒ **neutre**, pas de vert dominant) ; barre **couverture probante** en ton **neutre** si statut ≠ `ok` ; pastille **wallet** sans vert si ≠ `ok`.  
* **Branche / PR :** `web60-w60-103-tresorerie-contour-etat` · PR GitHub : [créer / suivre la PR](https://github.com/doreviateam/lynki/pull/new/web60-w60-103-tresorerie-contour-etat) · titre **`[Web60][T-W60-103][W60-103] Trésorerie — contour fin et état principal cohérent`**.

**Repères code :** `treasury-cockpit-tile.ts` (`treasuryCockpitPrimaryBadge`), `cockpit-master-card-outline.ts`, `CockpitDesktopView.tsx`, `CockpitMobileView.tsx`.

---

## 6. Passe 3 — Business

**Cap de passe :** carte **Business** habitée, état principal de lecture clair, **Certifié** repositionné en secondaire si présent — [spec §6](./SPEC_CARTES_MAITRESSES_LINKY.md).

**Critère de fin :** **R60-005** recette **OK** ; **W60-201**, **W60-203** **Fait**.

| T-W60 | Réf. backlog | P | Titre court | Statut exé. |
|-------|--------------|---|-------------|-------------|
| T-W60-201 | W60-201 | P0 | Enrichir la carte trop vide | À faire |
| T-W60-202 | W60-202 | P1 | État principal de lecture si nécessaire | À faire |
| T-W60-203 | W60-203 | P0 | « Certifié » en secondaire | À faire |
| T-W60-204 | W60-204 | P1 | Repère contextuel court (arbitrage) | À faire |
| T-W60-205 | W60-205 | P1 | Éviter carte décorativement vide | À faire |
| T-W60-206 | W60-206 | P1 | Détail cohérent avec l’activité | À faire |
| T-W60-207 | W60-207 | P1 | Partiel / à confirmer / indispo | À faire |
| T-W60-208 | W60-208 | P1 | Lecture « activité » pour Max | À faire |

---

## 7. Passe 4 — Flux net

**Cap de passe :** libellé **Proxy**, badge non dominant vs montant, pas de confusion signe du flux / ton d’état — [spec §7](./SPEC_CARTES_MAITRESSES_LINKY.md).

**Critère de fin :** **R60-006** recette **OK** ; **W60-301**, **W60-302** **Fait**.

| T-W60 | Réf. backlog | P | Titre court | Statut exé. |
|-------|--------------|---|-------------|-------------|
| T-W60-301 | W60-301 | P0 | « Proxy data » → **Proxy** | À faire |
| T-W60-302 | W60-302 | P0 | Réduire dominance visuelle badge proxy | À faire |
| T-W60-303 | W60-303 | P1 | Honnêteté méthodo sans dramatiser | À faire |
| T-W60-304 | W60-304 | P1 | Cas futur Fiable vs Proxy | À faire |
| T-W60-305 | W60-305 | P1 | Signe du flux ≠ ton d’état | À faire |
| T-W60-306 | W60-306 | P1 | Détail : méthode de calcul | À faire |
| T-W60-307 | W60-307 | P1 | Partiel / indisponible | À faire |
| T-W60-308 | W60-308 | P2 | Max comprend « Proxy » | À faire |

---

## 8. Passe 5 — Second rang & ensemble

**Cap de passe :** second rang **B vs C** lisible ; plus de couple **« — » + Fiable** ambigu là où il faut **Indisponible** / **Vide utile** ; lecture **A / B / C** perceptible.

**Critère de fin :** **R60-007**, **R60-008**, **R60-009** et **R60-010** recette **OK** ; **W60-402** **Fait**.

| T-W60 | Réf. backlog | P | Titre court | Statut exé. |
|-------|--------------|---|-------------|-------------|
| T-W60-401 | W60-401 | P1 | Hiérarchie B vs C | À faire |
| T-W60-402 | W60-402 | P0 | Sortir couple « — » + Fiable | À faire |
| T-W60-403 | W60-403 | P1 | Cas « vide utile » | À faire |
| T-W60-404 | W60-404 | P2 | Réduire badges inutiles | À faire |
| T-W60-405 | W60-405 | P1 | Lecture A / B / C un coup d’œil | À faire |
| T-W60-406 | W60-406 | P2 | Continuité Synthèse comptable | À faire |

---

## 9. Renvois code ↔ tickets (repères)

Chemins relatifs à `units/dorevia-linky/`.

| Plage T-W60 / W60 | Zone | Repères code (indicatifs) |
|-------------------|------|---------------------------|
| 001–010 | Global, chrome | `TopBar`, `ReportHeader`, `ChromeTriggerBar`, `CockpitDesktopView`, `InstrumentCardChrome` |
| 101–108 | Trésorerie | `TresoreriePositionCard`, `TreasuryCardWithPolling`, `tresorerie/page`, `cockpitTreasuryStates` |
| 201–208 | Business | `BusinessCard`, `BusinessCardWithPolling`, `business/page`, `cockpitBusinessStates` |
| 301–308 | Flux net | `FluxCashCard`, `FluxCashCardWithPolling`, `flux-net/page`, `cockpitFluxNetStates` |
| 401–406 | Second rang | `WorkingCapitalCard`, `EncoursCard`, `TaxesCard`, `EbeCard`, `RefundsCard`, `CreditNotesCard`, vues cockpit |

---

## 10. Fermeture recette — T-W60-501 … T-W60-506

**Cap :** preuves et verdict **version montrable** selon [recette §11](./RECETTE_WEB60_LINKY.md) (critères de sortie) et alignement [§12](./RECETTE_WEB60_LINKY.md) (**W60-501 … W60-506**).

**Critère de fin :** **W60-501 … W60-506** **Fait** ; synthèse [recette §16](./RECETTE_WEB60_LINKY.md) complétée.

| T-W60 | Réf. backlog | Titre court | Statut exé. |
|-------|--------------|-------------|-------------|
| T-W60-501 | W60-501 | Mini-recette par persona | À faire |
| T-W60-502 | W60-502 | Lisibilité à distance | À faire |
| T-W60-503 | W60-503 | Cohérence cockpit → détail | À faire |
| T-W60-504 | W60-504 | Positif vs vigilance | À faire |
| T-W60-505 | W60-505 | Arbitrages assumés documentés | À faire |
| T-W60-506 | W60-506 | Passe « version montrable » | À faire |

---

## 11. Règles de nommage et de traçabilité

### 11.1 Branches et PR

* Branche : `web60-` + sujet court.  
* **Titre PR** : `[Web60][T-W60-xxx][W60-xxx]` ex. `[Web60][T-W60-001][W60-001] Lexique états Pilotage`.

### 11.2 Commits

* Mentionner **W60-xxx** (vérité backlog) ; **T-W60-xxx** optionnel mais utile pour corrélation avec ce guide.

### 11.3 Description de PR (minimum)

* **W60-xxx** / **T-W60-xxx** ; constat ; renvois doctrine / spec ; **R60-xxx** rejoués ([recette §10](./RECETTE_WEB60_LINKY.md)) ; captures si UI (préciser viewport : mobile Max / desktop Véréna si pertinent).

---

## 12. Définition de fini (DoD) pour un T-W60 / W60

1. Conformité doctrine + spec ou **Assumé** (**W60-505**).  
2. Pas de régression sur les **R60** voisins ([recette §10](./RECETTE_WEB60_LINKY.md)).  
3. Libellés : annexe / mapping doctrine à jour si touché.  
4. Backlog : statut **W60-xxx** à jour ; journal backlog §12.3 si besoin.  
5. **Statut exé.** dans ce fichier : **Fait** quand le **W60** est **Fait**.  
6. Mapping centralisé des états (pas de duplication dispersée).  
7. **Vérification persona / viewport effectuée** :  

   * **Max** : lecture **mobile** Pilotage (lab / `laplatine2026`) ;  
   * **Véréna** : lecture **desktop** Pilotage (même URL) ;  
   * **Esther** : cohérence **reporting** / restitution (parcours concerné, smoke si touché).

---

## 13. Journal d’exécution (optionnel)

| Date | T-W60 / W60 | Note (PR, capture, arbitrage) |
|------|-------------|------------------------------|
| 25 mars 2026 | T-W60-001 / W60-001 | Lab `laplatine2026` validé. Lexique d’état visible normalisé sur Pilotage. « Proxy data » a disparu au profit de **Proxy**. R60-001 OK, R60-002 OK. Contrôle desktop Véréna validé ; smoke mobile Max validé. T-W60-001 / W60-001 passés **Fait**. |
| 25 mars 2026 | T-W60-005 / W60-005 | Microcopy preuves **vue** vs **cumulées** : `IntegrityBadge`, `LinkyFooter`, `SyncInProgress`. Pas de changement backend ; `npm run build` OK. Voir **§4.2**. |
| 25 mars 2026 | T-W60-103 / W60-103 *(rappel W60-101 / W60-102)* | Bloc P0 Trésorerie : badge qualité unique (`treasuryCockpitPrimaryBadge`) + **contour fin** / pas de vert trompeur en **Partiel** (`cockpit-master-card-outline`, `CockpitDesktopView`, `CockpitMobileView`). Branche **`web60-w60-103-tresorerie-contour-etat`** poussée **`origin`** ; commit cockpit **1f6cd569** ; commits doc / scripts **1fd8df08**, **d013f91d**. Déploiement **`./scripts/deploy-linky-lab.sh`** sur l’hôte lab → **`LINKY_UI_BUILD_REF=d013f91d`**. **R60-004** **OK** ([recette §10](./RECETTE_WEB60_LINKY.md)). **T-W60-103** / **W60-103** → **Fait** *(DoD **§12.7** : garder une passe **desktop Véréna** + **smoke mobile Max** sur [lab `laplatine2026`](https://lab.linky.doreviateam.com/?tenant=laplatine2026) en routine avant bascule prod)*. |

**Règle :** ne pas renseigner ce tableau ni passer les statuts **§4** / backlog en **Fait** tant que la validation **lab** ([`laplatine2026`](https://lab.linky.doreviateam.com/?tenant=laplatine2026)) et les **R60** indiqués ne sont pas **OK** (la doc reste vérité **après** preuve, pas intention seule).

**§13 et §13.1 — rôles distincts (éviter toute ambiguïté d’équipe) :**

* **§13** = le **journal réel** (tableau ci-dessus : historique des clôtures validées).  
* **§13.1** (et sous-sections analogues le cas échéant) = **gabarit opératoire** / procédure de saisie et ligne type ; ce n’est **pas** un journal vivant.  
* Après validation **lab** + **R60**, on **renseigne uniquement le tableau du §13** en s’appuyant sur la ligne type décrite en **§13.1**.  
* **§13.1** lui-même **ne bouge pas** au fil des tickets, sauf **évolution de procédure** (changement de méthode, pas accumulation des entrées « fait »).

<a id="gabarit-post-lab-t-w60-001"></a>

### 13.1 Gabarit — clôture **T-W60-001** après lab *(référence — premier passage effectué 2026-03-25)*

**Nature :** procédure + **ligne type** pour alimenter le **tableau §13** ; ne pas y recopier les entrées définitives du journal (risque de confondre gabarit et journal).

À **appliquer** une fois : PR mergée, déploiement lab effectué, **R60-001** et **R60-002** validés sur lab, **smoke mobile Max** (DoD **§12.7**) validé. **R60-003** n’est **pas** requis pour clôturer **seul** **T-W60-001** — il reste porté par **T-W60-003** et par le **critère de fin** global de la Passe 1 (**§4**).

**Checklist avant mise à jour des statuts**

1. Déploiement sur [lab.linky — tenant laplatine2026](https://lab.linky.doreviateam.com/?tenant=laplatine2026).  
2. [Recette §10](./RECETTE_WEB60_LINKY.md) : **R60-001** OK · **R60-002** OK ; **persona Max** : smoke **mobile** Pilotage OK (**§12.7**).  
3. Mettre **T-W60-001** → **Fait** dans le [tableau §4](#4-passe-1--états-visibles) ci-dessus.  
4. Mettre **W60-001** → **Fait** dans le [backlog §5](./BACKLOG_WEB60_LINKY.md) (ligne synthèse + détail §5).  
5. **Insérer une ligne dans le tableau du §13** (journal réel), pas dans le texte du §13.1 ; ajouter si besoin une entrée datée **backlog §12.3**.  
6. **R60-003** : à boucler avec **T-W60-003** pour fermer la Passe 1 au sens **§4** (ne pas mélanger avec la seule clôture lexique **W60-001**).

**Ligne type pour le tableau §13** *(compléter date, PR, captures)* :

| Date | T-W60 / W60 | Note (PR, capture, arbitrage) |
|------|-------------|------------------------------|
| *AAAA-MM-JJ* | **T-W60-001** / **W60-001** | Lab `laplatine2026` : lexique Pilotage normalisé (« Proxy data » → **Proxy**). `ui-state-labels.ts`, `normalizeUiStateLabel`. **PR :** *lien* · **R60-001** *OK* · **R60-002** *OK* · desktop **Véréna** OK · smoke **mobile Max** OK · **UI** *hash* pied de page |

**Références code utiles (revue / recette)** : branche cible **`web60-lexique-etats-pilotage`** ; PR **`[Web60][T-W60-001][W60-001] Normaliser le lexique d’état visible Pilotage`**.

---

## 14. PR ultra-opérationnel — trio d’ouverture Passe 1 (T-W60-001 → T-W60-003)

Une **PR par ticket** (ou commits atomiques dans une même PR si équipe préfère, mais un **critère de revue** par **T-W60**). Déployer sur [lab / `laplatine2026`](https://lab.linky.doreviateam.com/?tenant=laplatine2026) avant de cocher **R60** correspondants en [recette §10](./RECETTE_WEB60_LINKY.md).

### T-W60-001 — Normaliser le lexique d’état visible ([W60-001](./BACKLOG_WEB60_LINKY.md) §5)

| Élément | Détail |
|--------|--------|
| **But** | Un seul libellé canonique par sens sur le Pilotage, aligné sur [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) (lexique + Annexe A). |
| **Portée code** | Chaînes UI, composants de badge / état partagés, éventuel mapping clé → label (cf. `InstrumentCardChrome`, cartes cockpit, chrome). |
| **Branche** | `web60-lexique-etats-pilotage` |
| **Titre PR** | `[Web60][T-W60-001][W60-001] Normaliser le lexique d’état visible Pilotage` |
| **Description** | Liste des remplacements (avant → après) ; lien doctrine §… / Annexe A ; **R60-001** à rejouer après deploy. |
| **DoD** | §12 ; pas de régression sur libellés hors périmètre assumé ; capture **desktop** + **mobile** si surface visible. |
| **Recette** | Cocher **R60-001** quand barre haute / signaux globaux restent lisibles avec le nouveau lexique. |
| **Après lab** | Saisie **tableau §13** selon [§13.1 — gabarit](#gabarit-post-lab-t-w60-001) ; statuts **Fait** (§4 + backlog) après **R60-001**, **R60-002** et **smoke mobile Max** ; **R60-003** avec **T-W60-003** pour la Passe 1 complète (**§4**). |

### T-W60-002 — Supprimer les synonymes concurrents ([W60-002](./BACKLOG_WEB60_LINKY.md) §5)

**Angle (post T-W60-001) :** **T-W60-001** a figé le **vocabulaire canonique** à l’écran ; **T-W60-002** vise les **alias / synonymes encore tolérés** (chemins transitoires, entrées API ou chaînes résiduelles) — pas la redéfinition du lexique, mais le **nettoyage** pour qu’**aucun concurrent** ne soit plus visible ni inutilement accepté.

| Élément | Détail |
|--------|--------|
| **But** | Plus aucun **synonyme concurrent** du canon doctrine : tout ce qui passait par tolérance ou doublon est **retiré du rendu** ou **réduit** à une compatibilité **minimale** documentée (backend / mocks / vieux payloads). |
| **Portée code** | `app/lib/cockpit/ui-state-labels.ts` (**`normalizeUiStateLabel`**, branches et `return trimmed` risqués) ; grep chaînes d’état dans `units/dorevia-linky` (composants badges, cartes, chrome, réponses API mappées en UI). |
| **Branche** | ex. `web60-w60-002-synonymes-etats` |
| **Titre PR** | `[Web60][T-W60-002][W60-002] Pilotage — synonymes d’état supprimés` |
| **Plan de PR (checklist)** | 1. **Lister** toutes les variantes encore tolérées dans **`normalizeUiStateLabel()`** (et tout autre mapping clé → libellé). 2. **Classer** : *compat transitoire* (garder court terme si backend / données réelles) vs *à supprimer* (plus de raison d’être après T-W60-001). 3. **Supprimer du visible** tout chemin qui affiche encore un alias ; aligner les sources (props, API) sur le canon si possible. 4. **Documenter en commentaire court** toute entrée de compatibilité **volontairement** conservée (et date de retrait cible si utile). |
| **Description PR** | Tableau **avant → après** (synonymes retirés ou absorbés) ; lien [`DOCTRINE_ETATS_UI_LINKY.md`](./DOCTRINE_ETATS_UI_LINKY.md) Annexe A si touché ; **R60-002** à rejouer sur [lab / `laplatine2026`](https://lab.linky.doreviateam.com/?tenant=laplatine2026) **desktop + mobile Max**. |
| **DoD** | §12 ; **après T-W60-001** (canon posé) ; pas de régression **R60-001** ; captures ou note grep sur **absence** de libellés concurrents sur Pilotage. |
| **Recette** | **R60-002** **OK** : grille Pilotage + chrome sans double formulation pour un même sens métier. |
| **Sortie attendue** | Surface prête pour **T-W60-003** (principal / secondaire / global) sans bruit lexical résiduel. |
| **Après lab** | Ligne **§13** (journal) + **W60-002** / **T-W60-002** → **Fait** (§4 + backlog) selon la même rigueur que **T-W60-001** (preuve avant statut). |

### T-W60-003 — Distinguer principal / secondaire / global ([W60-003](./BACKLOG_WEB60_LINKY.md) §5)

| Élément | Détail |
|--------|--------|
| **But** | Hiérarchie visuelle et sémantique claire : état **principal** vs **secondaire** vs signal **global** (doctrine §9.4, précédence). |
| **Portée** | Styles (taille, poids, placement), composants badges, zones chrome vs cartes. |
| **Branche** | ex. `web60-w60-003-niveaux-etats` |
| **Titre PR** | `[Web60][T-W60-003][W60-003] Pilotage — principal / secondaire / global` |
| **Description** | Schéma ou captures annotées ; **R60-003** à rejouer. |
| **DoD** | §12 ; **après T-W60-001 et T-W60-002** pour éviter de recoller la hiérarchie sur un lexique encore instable. |
| **Recette** | **R60-003** OK ; puis vérifier ensemble **R60-001, R60-002, R60-003** pour clôturer le **critère de fin** de la Passe 1 (§4). |

**Après le trio :** enchaîner **T-W60-004 … T-W60-010** dans la même Passe 1, ou traiter **W60-006 / W60-007** (mapping / précédence) en parallèle si l’équipe le juge sans conflit de PR.

---

## 15. Formule de cap

> **Fermer Web60, ce n’est pas disperser des correctifs : c’est boucler chaque passe jusqu’au critère de fin, puis recetter.**

---

## 16. Raccord Web61 — CDCF et registre Trésorerie

Les passes Web60 (états, cartes maîtresses, recette **R60-xxx**) restent le **cadre d’exécution ticketé** du lot courant. Pour toute **refonte** ou **granularité fonctionnelle** au-delà (header, deux vues, grammaire tuile §5, fiche Trésorerie §6), la **norme de fond** est le [`cdcf.md`](../web61/cdcf.md) : l’implémentation vise à **coller au CDCF** ; Stitch et le plan [`ROADMAP_REFONTE_LINKY_STITCH_CAROLE_61.md`](../web61/ROADMAP_REFONTE_LINKY_STITCH_CAROLE_61.md) orientent le **rendu**.

* **Registre vivant (Trésorerie)** : [`TABLEAU_TRACE_CDCF6_TRESORERIE.md`](../web61/TABLEAU_TRACE_CDCF6_TRESORERIE.md) — exigences **§6** et blocs **§7.2** (lignes S7-xx) ; colonnes **Décision / arbitrage** et **Ticket / PR** pour les écarts CDCF ↔ code.
* **Recette** : après changement structurant §6, mettre à jour le registre et rejouer les **R60** pertinents sur le **lab** (`./scripts/deploy-linky-lab.sh`).

---

## Historique des versions

| Version | Contenu |
|---------|---------|
| **1.0** | Conventions PR/commit, DoD, repères code, ordre d’attaque, lien R60. |
| **1.1** | **Cinq passes** + recette **T-W60-501…506** ; **T-W60-001…406** ; cap et **critère de fin** par passe ; **P0 structurants** ; **six pièces** dossier ; liens backlog. |
| **1.1.1** | **Environnement prioritaire** : lab + tenant `laplatine2026` (URL canonique build / deploy / recette). |
| **1.1.2** | **Régimes d’usage** (Max mobile, Véréna desktop, Esther reporting) ; **raccord exécution ↔ R60** (§10 recette) ; **critères de fin** par passe alignés sur le tableau **R60-001…010** ; DoD **persona / viewport** ; liens recette **§10 / §11 / §12 / §16**. |
| **1.1.3** | **Passe 1 ouverte** ; **§14 PR ultra-opérationnel** pour **T-W60-001 → T-W60-003** (trio lexique). |
| **1.1.4** | **§13.1** brouillon post-lab **T-W60-001** (checklist **R60-001…003**, ligne journal type) ; **§14** aligné branche / titre PR ; règle : pas de **Fait** avant validation lab. |
| **1.1.5** | Règle **§13** = journal réel, **§13.1** = gabarit / procédure (ne pas transformer le gabarit en journal vivant) ; §13.1 renommé en *Gabarit* ; en-tête références dossier alignées. |
| **1.1.6** | **§4.1** avancement **T-W60-001** (lab desktop + **R60-001/002** ; **R60-003** → **T-W60-003**) ; **§13.1** : **smoke mobile Max** requis avant **Fait** ; dissociation clôture **W60-001** vs **R60-003** / fin de Passe 1. |
| **1.1.7** | **T-W60-001** / **W60-001** → **Fait** ; **§13** journal : première ligne (lab, R60-001/002, Véréna + Max) ; **§4.1** requalifié en *clôture* ; en-tête backlog **v1.1.0**. |
| **1.1.8** | **§14** : trame **PR ultra-opérationnelle** **T-W60-002** (audit `normalizeUiStateLabel`, compat minimale, sortie vers **T-W60-003**). |
| **1.1.9** | **T-W60-005** / **W60-005** **Fait** — microcopy preuves vue vs cumulées (**§4.2**) ; journal **§13** ; références backlog **v1.1.1**. |
| **1.1.10** | **T-W60-101** / **W60-101** **En cours** — **§5.1** ouverture densification Trésorerie ; backlog **v1.1.2**. |
| **1.1.11** | **§5.1** : fiche canonique **W60-101** (texte produit intégral, statut **À faire**) ; **T-W60-101** tableau **À faire** ; backlog **v1.1.3**. |
| **1.1.12** | **Environnement** : commande unique de référence **`./scripts/deploy-linky-lab.sh`** (déploiement lab Linky depuis la racine du dépôt). |
| **1.1.13** | **Lab public vs local** : URL canonique = vérité recette ; déploiement à exécuter sur **l’hôte qui sert** `lab.linky.doreviateam.com` ; preuve **UI + hash git** ; lien avec écarts UI perçus. |
| **1.1.14** | **`deploy-linky-lab.sh`** : rebuild **linky_generic** (URL **lab.linky**) **et** **linky_lab_laplatine2026** ; commentaire **Caddyfile** ; **Makefile** lab aligné. |
| **1.1.15** | **Passe 2** : **§5.1.1** avancement **W60-101** ; **§5.2** **W60-102** badge **Fiable** ; tableaux **T-W60-101/102** **En cours** ; backlog **v1.1.6**. |
| **1.1.16** | **§5.3** **W60-103** : `treasuryCockpitPrimaryBadge` (Fiable / Partiel / En attente / Indisponible) ; **T-W60-103** **En cours** ; backlog **v1.1.7**. |
| **1.1.17** | **§5.3.1** contour fin cockpit (`cockpit-master-card-outline`) ; **W60-101** / **W60-102** / **T-W60-101** / **T-W60-102** **Fait** ; **T-W60-103** **En cours** (capture **lab**) ; doctrine **v1.1.2** ; parité **desktop + mobile** (`CockpitMobileView`). |
| **1.1.18** | Clôture **T-W60-103** / **W60-103** : push branche, **`deploy-linky-lab.sh`**, **`LINKY_UI_BUILD_REF=d013f91d`** ; scripts lab versionnés ; **§13** journal ; **R60-004** **OK** ; bloc P0 Trésorerie **W60-101–103** **Fait** ; backlog **v1.1.9**, recette **v1.1.16**, plan **v1.1.20**, spec **v1.1.17**. |
| **1.1.19** | **§16** raccord **Web61** : références [`cdcf.md`](../web61/cdcf.md), roadmap refonte Stitch, registre [`TABLEAU_TRACE_CDCF6_TRESORERIE.md`](../web61/TABLEAU_TRACE_CDCF6_TRESORERIE.md) ; principe **refonte au plus près du CDCF**. |
| **1.1.20** | **CDCF** §2.12.1 / §2.13 alignés code : pied **Dorevia-Vault**, **UI**+hash visible, **TenantSelector** portail ; rail **DL** + favicon `app/icon.png` ; **recette** **v1.1.17** §5 chrome ; **plan** **v1.1.24**. |

---

**Fin du document**
