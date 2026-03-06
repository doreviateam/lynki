# SPEC — Footer stratégique Dorevia Linky

**Version :** v1.0  
**Date :** 2026-03-03  
**Scope :** Linky (UI) — Footer uniquement  
**Référence :** Mini-SPEC Footer stratégique v0.1  
**Objectif :** Rendre visible l'infrastructure de preuve et créer un pont vers Dorevia-Vault.

---

## 1. Contexte et objectifs produit

Le footer de Dorevia Linky doit remplir **trois fonctions stratégiques** :

| Fonction | Description |
|----------|-------------|
| **Rassurer** | Montrer que les données sont scellées et vérifiables. |
| **Expliquer la source** | Indiquer les systèmes alimentant le cockpit. |
| **Créer un pont** | Permettre de comprendre que Linky est alimenté par Dorevia-Vault. |

Le footer devient ainsi un **indicateur vivant de la preuve financière** et établit la hiérarchie produit :

```
Linky (cockpit visible)
        ↓
Dorevia Vault (infrastructure de preuve)
```

---

## 2. Structure du footer

### 2.1 Disposition

- **Ligne principale** : indicateurs de preuve + sources
- **Ligne secondaire** : lien vers l'infrastructure
- **Alignement** : centré
- **Style** : discret (opacité 70 %), hover 100 % + underline

### 2.2 Ligne principale

Format proposé :

```
Preuves scellées : 496 ✓   |   Dernier scellé : 42 s   |   Sources : Odoo ✓ POS ✓
```

Séparateurs : `|` ou `·` (point médian) selon cohérence design existant.

### 2.3 Ligne secondaire

```
Powered by Dorevia Vault — données financières vérifiables
```

- **Comportement** : lien cliquable
- **Cible** : `https://sylius.lab.core.doreviateam.com/accueil` (ou URL configurable par environnement)
- **Ouverture** : nouvel onglet (`target="_blank"`, `rel="noopener noreferrer"`)

---

## 3. Composants détaillés

### 3.1 Indicateur « Preuves scellées »

| Attribut | Valeur |
|----------|--------|
| **Libellé** | Preuves scellées : {N} ✓ |
| **Source API** | `sealed_count` (completeness-snapshot ou dashboard-metrics) |
| **Objectif** | Montrer que la preuve est active et rendre visible l'infrastructure |

**Périmètre — Total tenant (pas la période) :**

Le compteur du footer affiche la **totalité des preuves pour le tenant**, et non la période sélectionnée dans le header. Raisons :

- Le footer est un indicateur **global** de l'infrastructure (« le système de preuve est vivant »)
- La période du header concerne les cartes et graphiques — pas la crédibilité du footer
- Un changement de période ne doit pas faire varier le compteur du footer (évite confusion)
- Un total tenant (ex. « 12 496 preuves ») rassure plus qu'un « 496 » limité au mois affiché

**Implémentation actuelle (à corriger) :**  
`sealed_count` provient de `dashboard-metrics` ou `completeness-snapshot` avec `date_debut`/`date_fin` = période du header → **donc filtré par période**. Pour le footer, il faut une source **sans filtre de période** (ou période très large type 2000-2030).

**Mapping technique cible :**

- Nouveau champ ou endpoint : `sealed_count_total` (tenant) sans filtre date
- Ou : appel `completeness-snapshot` avec `date_debut=2000-01-01`, `date_fin=2030-12-31` (période maximale)
- Somme des événements scellés sur les 5 sources : sales, purchases, paymentsIn, paymentsOut, pos

**Cas limites :**

- Si `sealed_count` indisponible : afficher « — » ou masquer le bloc
- Si `sealed_count_complete === false` : afficher le count avec indicateur partiel (ex. « 496 (partiel) »)

### 3.2 Indicateur « Dernier scellé »

| Attribut | Valeur |
|----------|--------|
| **Libellé** | Dernier scellé : {X} s |
| **Source API** | `last_seal_at` ou dérivé (timestamp du dernier événement scellé) |
| **Objectif** | Montrer que le système est vivant, renforcer la notion de temps réel |

**Calcul :**

- Si `last_seal_at` (ISO 8601) disponible : `now - last_seal_at` → affichage en secondes (< 60 s), minutes (< 60 min), ou heures
- Exemples : « 42 s », « 3 min », « 1 h »

**Évolution API :**

- Le Vault ou le dashboard-metrics doit exposer `last_seal_at` (ou équivalent : `last_sync`, `generated_at` du snapshot)
- Référence existante : `last_sync_formatted` dans `GET /api/platform/status` — à réutiliser ou étendre

### 3.3 Indicateur « Sources »

| Attribut | Valeur |
|----------|--------|
| **Libellé** | Sources : Odoo ✓ POS ✓ |
| **Source API** | `sources` dans `GET /api/platform/status` |
| **Objectif** | Lister les systèmes connectés alimentant le cockpit |

**Règles d'affichage :**

- Afficher chaque source avec son statut : ✔ (ok), ⚠ (warn/delay), ✖ (error)
- **Tooltip recommandé** : « Sources des données utilisées pour ce cockpit. »

**Format :** `Sources : {name1} {icon} {name2} {icon}` — noms capitalisés (Odoo, POS).

### 3.4 Lien vers l'infrastructure

| Attribut | Valeur |
|----------|--------|
| **Texte** | Powered by Dorevia Vault — données financières vérifiables |
| **URL** | `https://sylius.lab.core.doreviateam.com/accueil` (ou variable d'environnement) |
| **Comportement** | Lien discret, underline au hover, ouverture nouvel onglet |

---

## 4. UX / UI

### 4.1 Style discret

| État | Opacité | Effet |
|------|---------|-------|
| **Par défaut** | 70 % | Texte secondaire |

### 4.2 Hover (lien)

| État | Effet |
|------|-------|
| **Hover** | opacity 100 %, underline |

### 4.3 Objectif UX

- Rester discret pour ne pas distraire
- Intriguer les utilisateurs curieux sur la preuve

---

## 5. Flux utilisateur stratégique

```
Exploration cockpit
        ↓
Curiosité sur la preuve
        ↓
Lien vers Vault (site Sylius)
        ↓
Compréhension de l'infrastructure
```

---

## 6. APIs et données

### 6.1 Données existantes (réutilisables)

| Champ | Source | Usage |
|-------|--------|-------|
| `sealed_count` | `GET /api/dashboard-metrics` ou `GET /ui/completeness-snapshot` | Preuves scellées |
| `sealed_count_sources` | idem | Validation sources (sales, purchases, paymentsIn, paymentsOut, pos) |
| `sources` | `GET /api/platform/status` | Liste Odoo, POS, etc. |
| `last_sync_formatted` | `GET /api/platform/status` | Proche de « Dernier scellé » — à valider sémantique |

### 6.2 Évolutions API possibles

| Champ | Description | Priorité |
|-------|-------------|----------|
| `last_seal_at` | Timestamp ISO 8601 du dernier événement scellé | P1 si « Dernier scellé » en secondes requis |
| `events_count` | Alias ou synonyme de `sealed_count` | Optionnel |

---

## 7. Évolutions futures (hors scope v1.0)

| Évolution | Description |
|-----------|-------------|
| **Indicateur d'intégrité** | `Integrity : 100 %` |
| **Indicateur de complétude** | `Couverture probante : 87 %` |
| **Lien audit** | `Voir les preuves →` |

---

## 8. Définition of Done

- [ ] Footer affiche : Preuves scellées, Dernier scellé, Sources
- [ ] Lien « Powered by Dorevia Vault » vers URL configurable
- [ ] Style discret (opacité 70 %), hover 100 % + underline
- [ ] Ouverture lien en nouvel onglet
- [ ] Tooltip sur Sources
- [ ] Compatible desktop et mobile (format compact)

---

## 9. Résultat attendu

Le footer permet à l'utilisateur de comprendre :

1. **Que les chiffres sont scellés** — indicateur « Preuves scellées »
2. **Que les données sont vérifiables** — « Dernier scellé » + lien « données financières vérifiables »
3. **Qu'un moteur de preuve existe** — lien vers Dorevia Vault

Linky devient ainsi un **cockpit de gouvernance basé sur des données prouvables**.

---

## 10. Compatibilité avec le footer existant

Le footer actuel (SPEC_LINKY_LAYOUT_HEADER_FOOTER_v0.1) affiche :

```
Vault ✔ · DVIG ✔   Données Vault · Alimenté par : odoo ✔ · pos ✔   Sync : 16/02/26 07:42:00   v1.5.1
```

La présente spec **enrichit** ce footer en :

- Ajoutant « Preuves scellées : N ✓ »
- Remplaçant ou complétant « Sync » par « Dernier scellé : X s » (si API disponible)
- Ajoutant une ligne secondaire avec le lien « Powered by Dorevia Vault »

**Option d'implémentation :** Extension de `LinkyFooter.tsx` sans rupture avec l'existant.

---

## 11. Amendements — Organisation du footer

### 11.1 Problèmes identifiés sur le footer actuel

| Problème | Impact |
|----------|--------|
| **Redondance** | « Vault » et « Données Vault » répètent le même concept |
| **Mélange de niveaux** | Infrastructure (Vault, DVIG) et sources métier (Odoo, POS) sur le même plan — deux sémantiques distinctes |
| **Acronyme opaque** | « DVIG » n'est pas parlant pour un utilisateur métier (CFO) |
| **Pas de hiérarchie** | Tout sur une ligne sans regroupement logique — difficile à scanner |
| **Sync technique** | « 16/02/26 07:42:00 » est une date brute — « Dernier scellé : 42 s » est plus parlant |
| **Pas de preuve chiffrée** | Aucun indicateur du volume de preuves (sealed_count) — élément le plus rassurant |
| **Version en première ligne** | Utile pour le support mais secondaire pour l'utilisateur métier |

### 11.2 Principes d'organisation proposés

**Principe 1 — Regroupement sémantique**

Organiser le footer en **blocs distincts** selon la question que l'utilisateur pose :

| Bloc | Question | Contenu |
|------|----------|---------|
| **Preuve** | « Les données sont-elles scellées ? » | Preuves scellées : N ✓ · Dernier scellé : X s |
| **Sources** | « D'où viennent les données ? » | Sources : Odoo ✓ POS ✓ |
| **Infrastructure** | « Le système est-il opérationnel ? » | Vault ✓ (optionnel, tooltip ou ligne 2) |
| **Pont** | « Où en savoir plus ? » | Powered by Dorevia Vault |

**Principe 2 — Hiérarchie visuelle**

- **Ligne 1** : Preuve + Sources (priorité métier — rassurer et expliquer)
- **Ligne 2** : Lien Dorevia Vault + version (discret, pour les curieux et le support)

**Principe 3 — Simplification**

- Retirer « Données Vault » (redondant avec « Preuves scellées »)
- Retirer ou masquer « DVIG » en affichage principal — le garder en tooltip sur « Vault ✓ » si besoin (ex. : « Vault et DVIG opérationnels »)
- Unifier « Alimenté par » et « Sources » → libellé unique « Sources : »

**Principe 4 — Ordre de lecture**

Ordre recommandé (gauche → droite) :

1. **Preuve** (rassurer en premier)
2. **Sources** (expliquer l'origine)
3. **Infra** (optionnel : Vault ✓, version)

### 11.3 Structure cible amendée

**Desktop — Ligne 1 :**

```
Preuves scellées : 496 ✓   ·   Dernier scellé : 42 s   ·   Sources : Odoo ✓ POS ✓
```

**Desktop — Ligne 2 :**

```
Powered by Dorevia Vault — données financières vérifiables   ·   v1.5.1
```

**Mobile — Ligne 1 (compact) :**

```
496 preuves ✓   ·   Odoo ✓ POS ✓   ·   il y a 42 s
```

**Mobile — Ligne 2 :**

```
Dorevia Vault   ·   v1.5.1
```

### 11.4 Règles de priorité

| Élément | Priorité | Masquage si indisponible |
|---------|----------|---------------------------|
| Preuves scellées | P0 | Afficher « — » |
| Sources | P0 | Fallback : Odoo ✓ POS ✓ (statut par défaut) |
| Dernier scellé | P1 | Masquer le bloc ou afficher last_sync_formatted en fallback |
| Lien Dorevia Vault | P1 | Toujours afficher (lien statique) |
| Version | P2 | Masquer si vide |
| Vault ✓ / DVIG ✓ | P2 | Optionnel — tooltip sur « Preuves scellées » ou ligne 2 |

### 11.5 Données requises par le footer

Le footer doit consommer **une seule API** pour limiter les requêtes :

| Option | API | Champs utilisés |
|--------|-----|-----------------|
| **A** | `GET /api/platform/status` étendu | + `sealed_count_total` (tenant, sans période), `last_seal_at` |
| **B** | `GET /api/dashboard-metrics` + `platform/status` | ⚠️ sealed_count actuel = période header — pas adapté |
| **C** | Nouvelle route `GET /api/footer-status` | Agrège platform/status + completeness-snapshot (période large 2000-2030) |

**Recommandation :** Option A — étendre `platform/status` avec `sealed_count_total` (total tenant, hors période) pour que le footer reste autonome et affiche un indicateur stable.

**Important :** Ne pas réutiliser `sealed_count` de dashboard-metrics tel quel — il est filtré par la période du header. Le footer doit afficher le **total tenant**.

---

## 12. Références

| Document | Chemin |
|----------|--------|
| Mini-SPEC Footer stratégique | Source du présent document |
| SPEC Layout Header Footer | `ZeDocs/web21/SPEC_LINKY_LAYOUT_HEADER_FOOTER_v0.1.md` |
| Composant footer actuel | `units/dorevia-linky/components/LinkyFooter.tsx` |
| API platform/status | `units/dorevia-linky/app/api/platform/status/route.ts` |
| API dashboard-metrics | `units/dorevia-linky/app/api/dashboard-metrics/route.ts` |

---

**Fin de la spécification**
