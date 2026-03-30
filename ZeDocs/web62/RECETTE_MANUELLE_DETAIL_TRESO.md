# Recette manuelle — `/tresorerie`

**Écran :** détail Trésorerie (Lynki)  
**Usage :** cocher au fil des tests sur **desktop**, **tablette**, **mobile**.  
**Réf. produit :** [`SPEC_DETAIL_TRESO.md`](./SPEC_DETAIL_TRESO.md) · [`EXECUTION_TICKETS_DETAIL_TRESO.md`](./EXECUTION_TICKETS_DETAIL_TRESO.md)  
**Intégration V1 :** ticket **T-TR-DETAIL-008** — cette checklist reflète l’écran tel que livré (sprints détail trésorerie).

---

## 1. Tuile cockpit → écran détail

Ouvrir le pilotage, noter les valeurs sur la **tuile Trésorerie**, puis aller sur **Détail : Trésorerie** (`/tresorerie`) avec le **même périmètre** (tenant, société, période).

- [ ] **Solde validé** (montant principal) identique à la tuile
- [ ] **Badge d’état** (À confirmer / Partiel / Fiable / …) identique (libellé + famille de couleur)
- [ ] **Couverture probante** (%) identique
- [ ] **Montant à rapprocher** identique
- [ ] **Écart à confirmer** (valeur absolue) identique
- [ ] Aucune contradiction visuelle « Fiable » sur la tuile vs **vigilance majeure** (critique / à surveiller) sur le détail sans lien avec les chiffres

---

## 2. Bloc A — Bandeau de synthèse

- [ ] Libellé **Solde validé** sous le montant principal
- [ ] **Euro** visible dans le montant (format cockpit)
- [ ] Ordre du triptyque : **Couverture probante** → **Montant à rapprocher** → **Écart à confirmer**
- [ ] Barre de couverture cohérente avec le statut (couleur / remplissage)
- [ ] Infobulles (au survol) alignées avec la tuile sur les lignes concernées
- [ ] **Écart à confirmer** en **valeur absolue** dans le bandeau (pas de signe ici)

---

## 3. Bloc D — Écart à confirmer

- [ ] Titre **Écart à confirmer** (pas de titre technique type « ERP − Vault »)
- [ ] **Absolu** lisible en synthèse
- [ ] **Solde ERP** et **Position validée** affichés ou « — » si indisponibles (pas de mélange confus)
- [ ] **Écart signé** présent uniquement dans ce bloc (détail), avec mention **(ERP − position validée)**
- [ ] Pas de jargon parasite en premier niveau

---

## 4. Bloc C — Rapprochement (V1)

- [ ] Synthèse (taux, rapproché, à rapprocher, journaux) cohérente avec le bandeau
- [ ] Message explicite si détail indisponible (périmètre / mode instruments)
- [ ] Ancienneté la plus ancienne affichée si fournie
- [ ] Complément **santé bancaire** (proxy `/api/bank-reconciliation-health`) affiché si la route répond
- [ ] Tableau **mouvements non rapprochés** : données projection Vault (`/api/treasury-unreconciled-lines`) ou message vide honnête ; pas de libellé relevé Odoo dans ce tableau (**T-TR-DETAIL-003** V1)
- [ ] **Compteurs d’ancienneté** globaux (0–7 j / 8–30 j / &gt;30 j) cohérents avec la projection affichée
- [ ] **Pagination** (50 lignes, Précédent / Suivant) et remise à zéro du décalage au changement de tenant / société
- [ ] Mention honnête sur l’absence de **tranches d’aging** 0–7 / 8–30 / &gt;30 j tant que l’agrégat ne les expose pas

---

## 5. Bloc F — Vigilances et actions (V1)

- [ ] **Trois niveaux** visuels distincts (critique · à surveiller · information) + légende
- [ ] Règles alignées sur **`treasury.status`** : pas de contradiction **Fiable** vs alerte **critique** sans signal métier associé
- [ ] Bandeau **« Lecture fiable »** lorsque le statut carte est **ok** et qu’il n’y a **pas** de vigilance majeure (critique / important)
- [ ] Limite **5** vigilances puis **« Afficher … supplémentaires »** si besoin
- [ ] **Actions** : **Retour au pilotage** (lien interne) + **Ouvrir le rapprochement** (Odoo, nouvel onglet) — les deux **actifs** (plus de CTA fantôme)
- [ ] **Exporter** (en-tête) : snapshot CSV des indicateurs affichés une fois les métriques chargées

---

## 6. Bloc B — Décomposition (V1)

- [ ] **Volumes agrégés** (rapproché / à rapprocher / total) lisibles
- [ ] Si le Vault expose **`account_volume_breakdown`** : tableau **par compte** (id Odoo), tri contribution, poids et couverture ligne ; mise en évidence **poids ≥ 50 %** et **couverture &lt; 70 %**
- [ ] Si pas de breakdown : message clair sur la **source** attendue (pas de vide confus)

---

## 7. Bloc E — Évolution (V1)

- [ ] Courbe principale **position validée** ou message **« historique non disponible »**
- [ ] **Trois fenêtres** d’affichage : période cockpit · 30 derniers points · 7 derniers points
- [ ] Bandeau synthèse (plage affichée, min → max, dernier point, variation sur la fenêtre)
- [ ] **Vélocité** à rapprocher / couverture libellée **« fenêtre affichée »** ; en période complète, ligne **vélocité 7 derniers points** si assez de points
- [ ] Mini-courbes **à rapprocher** et **couverture %** si séries renseignées
- [ ] **Volume rapproché** (série) si la série est informative
- [ ] Encart **série partielle** si l’API renvoie **`partial_reason`**
- [ ] Pas de promesse trompeuse sur les données futures (Vault partiel acceptable)

---

## 8. Responsive & navigation

### Mobile (ordre attendu : A → F → C → D → B → E)

- [ ] Ordre des sections respecté en défilant
- [ ] Bandeau et boutons en-tête **Exporter / Actualiser** : zone tactile confortable (**min. ~44 px** sur petit écran)
- [ ] Bloc évolution : boutons de fenêtre tactiles ; graphique scrollable horizontalement si besoin

### Tablette

- [ ] Pas de chevauchement illisible, pas de colonne coupée bizarrement

### Desktop

- [ ] **A** occupe toute la largeur en haut
- [ ] **B** et **C** visibles côte à côte sur grand écran (grille 2 colonnes)
- [ ] **D** (écart) et **E** (évolution) distincts, sans chevauchement ; le graphique **E** a une largeur lisible
- [ ] **F** (vigilances) en bas, pleine largeur

*(La grille exacte peut évoluer avec le backlog — en cas de doute, vérifier le rendu réel dans le navigateur.)*

---

## 9. États techniques

- [ ] **Chargement** : skeleton ou équivalent sans flash incohérent
- [ ] **Erreur** API principale : message clair + **Actualiser**
- [ ] **Erreur** ou indisponibilité **séries évolution** : message dédié sans casser le reste de la page
- [ ] **Mode instruments** (`NEXT_PUBLIC_LINKY_USE_METRIC_ENGINE=1`) : bannière explicative si détail partiel

---

## 10. Écarts V1 connus vs spec cible (traçabilité T-TR-DETAIL-008)

À traiter dans des tickets / chantiers ultérieurs si la spec §7–§12 l’exige encore :

| Sujet | Statut V1 |
|-------|-----------|
| Filtres, tri colonnes, libellés Odoo sur les lignes ouvertes | **T-TR-DETAIL-003** suite — au-delà de la projection Vault (offset max 10 000, tri fixe) |
| Buckets d’aging 0–7 / 8–30 / &gt;30 j | Compteurs backend non exposés |
| Décomposition avec libellés métier comptes | Idem référentiel / API noms |
| Fenêtres temporelles serveur (7j / 30j / full) | V1 = **recadrage client** sur la période cockpit |
| Lazy-load du bloc E sur mobile | Non implémenté (option perf §007) |
| Tests auto RGAA / cross-navigateur | À planifier côté QA |

---

## Synthèse

| Résultat | Action |
|----------|--------|
| Tous les points OK sur un périmètre « nominal » | **Gate 008** : prêt pour mise en prod V1 écran détail (sous réserve politique release) |
| Écart tuile ↔ détail | Bloquer : revoir agrégats / même hook / périmètre |
| Écart badge vs vigilances | Revoir `TreasuryDetailVigilancesBlock` / `treasury.status` |

**Date de passage :** _______________  
**Testeur :** _______________  
**Environnement :** _______________
