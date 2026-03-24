# Note : Header, footer et preuves scellées — Linky (web52)

**Date** : mars 2026  
**Contexte** : Évolutions UX du cockpit Linky (header/footer, affichage des preuves scellées, masquage automatique du header).

---

## 1. Différenciation header / footer pour les preuves scellées

### Besoin
- **Header** (badge « X preuves scellées ») : doit afficher le nombre de preuves scellées **pour la période sélectionnée** (tenant + société + filtre période).
- **Footer** (« Preuves scellées : X ✓ ») : doit afficher le **total** des preuves scellées **pour le tenant et la société** (toutes périodes confondues).

### Réalisation
- **API `dashboard-metrics`**  
  - Nouvel appel : `fetchCompletenessSnapshotTotalForCompany()` — snapshot complétude sur période large (2000-01-01 → 2030-12-31) **avec `company_id`** quand une société est sélectionnée.  
  - Nouveau champ de réponse : **`sealed_count_total`** (total tenant + société, toutes périodes).  
  - **`sealed_count`** inchangé : reste le nombre pour la période (et société) sélectionnée (badge header).

- **Dashboard**  
  - Le footer reçoit **`sealed_count_total`** (au lieu de `sealed_count`).  
  - Le header continue d’utiliser **`sealed_count`**.

- **Fichiers concernés**  
  - `units/dorevia-linky/app/api/dashboard-metrics/route.ts`  
  - `units/dorevia-linky/components/DashboardWithFilters.tsx`  
  - `units/dorevia-linky/components/LinkyFooter.tsx` (commentaire de prop mis à jour).

---

## 2. Masquage automatique du header (footer toujours visible)

### Besoin
- Masquer le **header** après X secondes d’inactivité pour libérer de l’espace.
- **Réafficher** le header au scroll ou au survol de la zone du haut.
- **Footer** : laissé **toujours affiché** (pas de masquage).

### Réalisation
- **État et timer** dans `DashboardWithFilters` :  
  - `chromeVisible` (header visible ou non).  
  - Timer qui passe `chromeVisible` à `false` après **3 secondes** (configurable via `NEXT_PUBLIC_LINKY_CHROME_HIDE_AFTER_MS`).

- **Réapparition du header** :  
  - **Scroll** : uniquement quand la position de scroll est **proche du haut** (≤ 100 px), pour éviter que le scroll dans une grande card ne réaffiche en permanence le header.  
  - **Souris** : survol de la zone haute (72 px) ou du bandeau transparent en haut quand le header est masqué.

- **Footer** : rendu direct, sans wrapper ni logique de masquage.

- **Constantes** :  
  - `CHROME_HIDE_AFTER_MS` (défaut 3000).  
  - `CHROME_TRIGGER_ZONE_PX` = 72 (zone haut/bas pour le mousemove).  
  - Seuil scroll « en haut » = 100 px (réaffichage uniquement dans ce cas).

---

## 3. Place du contenu quand le header disparaît

### Besoin
- Quand le header est **masqué** : le contenu doit **prendre sa place**, avec une **légère marge en haut**.
- Quand le header **réapparaît** : il ne doit **pas chevaucher** le contenu (contenu décalé sous le header).

### Réalisation
- **Wrapper du header** :  
  - En masqué : **`maxHeight: 0`** (plus de place réservée dans le flux) + `transform: translateY(-100%)`.  
  - En visible : **`maxHeight: 120px`** + `translateY(0)`.  
  - Transition sur `transform` et `max-height` (300 ms).

- **Zone principale (`main`)** :  
  - Header visible : `pt-6`.  
  - Header masqué : `pt-4` (légère marge en haut).

---

## 4. Comportement sur les « grandes cards »

### Problème
Sur une vue avec une grande card (ex. Exposition de marge / Encours client), le header ne disparaissait pas : chaque scroll relançait le timer et réaffichait le header.

### Correction
Le handler de scroll ne **réaffiche** le header que lorsque la position de scroll est **proche du haut** (≤ 100 px). En scrollant dans le contenu de la grande card, le timer n’est plus réinitialisé, le header peut donc se masquer après ~3 s.

---

## 5. Fichiers modifiés (résumé)

| Fichier | Modifications |
|--------|----------------|
| `app/api/dashboard-metrics/route.ts` | `fetchCompletenessSnapshotTotalForCompany()`, `sealed_count_total` en réponse, interface `DashboardMetricsResponse` |
| `components/DashboardWithFilters.tsx` | État/timer header, scroll (seuil haut), mousemove, wrappers header/main, passage de `sealed_count_total` au footer |
| `components/LinkyFooter.tsx` | Commentaire de la prop `sealedCountTotal` (total tenant + société) |

---

## 6. Déploiement

Build et déploiement effectués via :

```bash
./scripts/build_deploy_vault_laplatine_o19.sh
```

Environnements concernés : **Vault (core-stinger)**, **Linky laplatine2026**, **Linky o19**.
