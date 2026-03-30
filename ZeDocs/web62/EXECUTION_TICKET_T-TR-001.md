# T-TR-001 — Alignement des états de la tuile Trésorerie sur la doctrine §6

**ID :** T-TR-001  
**Priorité :** P0  
**Statut :** En cours (code aligné mars 2026 — recette lab à confirmer)  
**Portée :** cockpit Pilotage — tuile **Trésorerie** (desktop / tablette / mobile si même agrégat)  
**Norme produit :** [`SPEC_TUILE_TRESO.md`](./SPEC_TUILE_TRESO.md) — **§6 États principaux**, **§10 Tooltips**, **Note de méthode** (assiette couverture probante)  
**Code principal :** `units/dorevia-linky/` — `app/api/dashboard-metrics/route.ts` (`computeCardStatuses`), `app/lib/cockpit/treasury-cockpit-tile.ts` (`treasuryCockpitPrimaryBadge`), vues cockpit (`CockpitDesktopView`, `CockpitTabletView`, `CockpitMobileView`) ; écran détail `/tresorerie` si badges ou tooltips dépendants du statut.

**Recette déploiement (réf.) :** `./scripts/deploy-linky-lab.sh` · pied de page **UI**.

**Écart connu (avant ticket) :** la doctrine **§6** fixe les seuils **10 % / 80 %** et le triptyque **À confirmer → Partiel → Fiable** avec couleurs **rouge / orange / vert**. L’implémentation actuelle de `computeCardStatuses` pour la trésorerie ne suit **pas** encore cette grille (logique historique basée sur d’autres bornes de « part non couverte »). Ce ticket fait **converger le code vers la spec**, pas l’inverse.

---

## 1. Objectif

Aligner l’**état principal** affiché sur la tuile Trésorerie (badge + cohérence visuelle) avec la **doctrine produit** du **§6** de `SPEC_TUILE_TRESO.md`, en s’appuyant sur la **couverture probante** comme assiette prioritaire.

---

## 2. Périmètre

**Inclus**

* `computeCardStatuses` : règles appliquées à `resp.treasury` (KPI tuile principale) et cohérence avec tout champ dérivé utilisé pour le même signal (ex. `treasury_position` si encore couplé à la même logique métier).
* Mapping des **libellés** vers le triptyque : **À confirmer**, **Partiel**, **Fiable** (`UI_STATE_LABELS` ou équivalent).
* **Couleurs** des badges cockpit alignées sur le §6 (rouge / orange / vert, y compris thème clair / sombre si pertinent).
* **Tooltips** ou `title` / `status_reason` : formulation métier **§10**, sans exposer les seuils en microcopy obligatoire sur la tuile.
* Vérification **tuile ↔ détail** Trésorerie : un même périmètre ne doit pas donner un sens d’état contradictoire sans raison documentée.

**Exclus (sauf collision)**

* Refonte du calcul Vault / agrégats sources.
* Changement des définitions **§4.4** / **§4.5** (bloc gouvernance : **Montant à rapprocher**, **Écart à confirmer**) hors impact direct sur le badge d’état — le ticket peut toutefois embarquer l’alignement libellés / ordre si fusionné avec la spec.

---

## 3. Règles

1. **Assiette prioritaire** : taux de **couverture probante** sur la période affichée (tel qu’exposé dans `_details.treasury.treasury_validated_pct` / équivalent — à valider en implémentation pour qu’il soit bien le même pourcentage que la barre « Couverture probante »).
2. **Fallback** : si la couverture n’est pas disponible, indicateur équivalent de **rapprochement en montant** cohérent avec le périmètre et la **Note de méthode** de la spec.
3. **Seuils (doctrine)** — basés sur la **couverture probante** (en %) :
   * **À confirmer** si `couverture probante ≤ 10 %`
   * **Partiel** si `> 10 % et ≤ 80 %`
   * **Fiable** si `> 80 %`
4. **Ordre produit** du triptyque : **À confirmer / Partiel / Fiable** (cf. spec, tooltips **§10.6–10.8**).
5. Les **États techniques** **En attente** / **Indisponible** restent gérés pour données absentes ou erreur ; pas de régression sur ces branches.

---

## 4. Implémentation (repères)

* Brancher le calcul d’état sur le **pourcentage de couverture probante** (pas seulement sur la « part non couverte » ou des seuils 5 % historiques sans arbitrage).
* Harmoniser `treasuryCockpitPrimaryBadge` : sévérités / classes pour **rouge / orange / vert** alignées §6 (au besoin étendre au-delà de `ok` / `watch` si le modèle `CardStatusValue` impose une évolution — **à trancher** dans la PR).
* Documenter en commentaire court dans `dashboard-metrics` le renvoi **SPEC_TUILE_TRESO §6** pour éviter un re-glissement de seuils silencieux.

---

## 5. Definition of Done

* Le code applique les seuils **10 % / 80 %** sur l’assiette définie en **§3** (ou fallback validé).
* Le badge affiché sur la tuile est **cohérent** avec ce calcul sur les trois plages + cas sans donnée.
* Les **couleurs** respectent la doctrine **§6** (À confirmer rouge, Partiel orange, Fiable vert).
* **Non-régression** : états **En attente** / **Indisponible** ; pas de régression sur les autres cartes du dashboard hors périmètre trésorerie (revue des effets de bord dans `computeCardStatuses`).
* Recette manuelle ou e2e ciblée documentée (cf. **§6** ci-dessous).

---

## 6. Recette

| Cas | Couverture probante (indicatif) | État attendu | Couleur |
|-----|---------------------------------|-------------|---------|
| Très faible couverture | ≤ 10 % | À confirmer | Rouge |
| Intermédiaire | > 10 % et ≤ 80 % | Partiel | Orange |
| Forte couverture | > 80 % | Fiable | Vert |
| Données absentes | non calculable | En attente ou Indisponible (selon règles existantes) | selon spec états techniques |
| Fallback montant | si pas de % | conforme **Note de méthode** + règle §3.1 | idem grille ci-dessus |

Contrôler sur au moins un tenant lab : **même périmètre** tuile cockpit et page **Trésorerie** détail.

---

## 7. Journal — formulation courte

> T-TR-001 aligne les états visibles de la tuile Trésorerie sur la doctrine `SPEC_TUILE_TRESO.md` §6 (seuils 10 % / 80 %, triptyque À confirmer / Partiel / Fiable, couleurs), en s’appuyant sur la couverture probante en priorité, sans diluer les états techniques En attente / Indisponible.

### 7.1 Implémentation (mars 2026)

* **`CardStatusValue`** : ajout de **`critical`** (À confirmer / rouge), distinct de **`alert`** (Indisponible).
* **`computeCardStatuses`** : trésorerie et `treasury_position` calés sur **tPct** (couverture probante) — ≤ 10 % `critical`, > 10 % et ≤ 80 % `watch`, > 80 % `ok`, absent `neutral`.
* **`treasuryCockpitPrimaryBadge`** / **`treasuryMasterCardOutlineClass`** / **`IconGrid`** / **`alerts-adapter`** : prise en charge de `critical`.

---

## 8. Vigilance produit (à valider en lab — hors périmètre fermé de T-TR-001)

**Garde-fou actuel** : en l’absence de paiements scellés sur la période, l’agrégat peut poser un **reste à rapprocher à 0**, d’où une **couverture affichée à 100 %** et un état **Fiable** par mécanisme de calcul — ce qui **n’implique pas** nécessairement une **couverture probante réelle** au sens métier.

* **Observer en recette lab** si ce cas donne une lecture **trompeuse** (faux sentiment de fiabilité).
* **Ne pas rouvrir** T-TR-001 tant que la recette ne tranche pas ; si besoin, traiter par **mini-ticket** dédié (règle produit + éventuel ajustement de `treasury_validated_pct` / statut quand « pas de matière »).

### Recette lab — contrôles recommandés (checklist)

1. **~8 %** couverture → **À confirmer** + rouge ; tooltip / `status_reason` cohérents.
2. **~45 %** → **Partiel** + orange.
3. **~85 %** → **Fiable** + vert.
4. **Pas de couverture exploitable** → **En attente** (`neutral`).
5. **Erreur / métrique impossible** (ex. flux cockpit) → **Indisponible** (`alert` où applicable).
6. **Cohérence** : tuile **Trésorerie** et tuile / KPI **Paiements** (`treasury_position`) — même doctrine sans divergence incohérente.
7. **Cas « 100 % par absence de matière »** : documenter le ressenti produit ; arbitrer ensuite.

---

*Document créé pour exécution Lynki — mars 2026.*
