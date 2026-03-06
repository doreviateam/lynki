# SPEC — LINKY LAYOUT (HEADER & FOOTER)

Version: v1.5  
Date: 2026-02-11 — Mise à jour: 2026-02-16 (footer fixe ; §6.1–6.2 alignés avec LinkyFooter.tsx)  
Owner: Plateforme / UI  
Scope: UI uniquement (aucune modification métier)  
**État : Implémentée (2026-02-11) — Badge intégrité, footer fixe compact (2026-02-16)**

---

# 1. CONTEXTE

Linky est le cockpit décisionnel de Dorevia, fondé exclusivement sur des données financières scellées.

Le header et le footer doivent :

- Renforcer la perception institutionnelle
- Rendre visible l'intégrité consolidée
- Matérialiser la résilience plateforme
- Exposer les sources connectées
- Éviter toute dépendance visuelle à un ERP
- Supprimer tout élément marketing inutile

---

# 2. DÉCISIONS STRUCTURANTES

## 2.1 Tagline

La tagline :

> "BUILT ON SEALED FINANCIAL TRUTH"

est retirée.

Motif :
- Élément marketing
- Non repris dans la spec
- Redondant avec le badge d'intégrité

La confiance repose sur le badge consolidé, pas sur un slogan.

---

# 3. INTEGRITY STATE MACHINE (v1 intégrée)

Cette section rend le badge implémentable immédiatement.

---

## 3.1 Environnement PROD (Mode STRICT)

### STATE_OK

Conditions cumulatives :

- pending_events = 0
- sealed_ratio = 1.0
- critical_sources_down = 0
- vault_status = ok

Affichage :

✔ Données scellées

---

### STATE_PARTIAL

Si une des conditions suivantes est vraie :

- pending_events > 0
- sealed_ratio < 1.0
- non_critical_source_down > 0

Affichage :

⚠ Données partielles

Tooltip obligatoire :
Indique la cause dominante.

---

### STATE_ALERT

Si une des conditions suivantes est vraie :

- vault_status != ok
- critical_sources_down > 0

Affichage :

✖ Intégrité non conforme

---

## 3.2 Environnement LAB (Mode GRADUÉ)

STATE_OK autorisé si :

- sealed_ratio >= 0.98
- pending_events faible (< seuil configurable)

Objectif :
Ne pas bloquer les environnements de développement.

---

# 4. HEADER

---

## 4.1 Desktop

### Ligne 1 — Identité

Gauche :
- Logo Dorevia
- Nom produit : Linky

Droite :
- Badge tenant
- Menu utilisateur

---

### Ligne 2 — Contexte opérationnel

Gauche :
- Société sélectionnée
- Module actif

Centre :
- Sélecteur Mois
- Sélecteur Année

Droite :
- Badge intégrité consolidé

---

## 4.2 Mobile

### Ligne 1

Logo + Linky                     ☰

### Ligne 2

- Société
- Période

Badge intégrité affiché en format compact.

---

## 4.3 Contraintes UI

- Pas de slogan
- Pas de logo ERP
- Accent couleur réservé aux statuts
- Desktop < 110px hauteur
- Mobile optimisé 2 lignes max

---

# 5. RÉSILIENCE VISIBLE

Définition :

La plateforme continue d'afficher les données scellées même si une source est temporairement indisponible.

La résilience est visible dans le footer uniquement.

---

# 6. FOOTER

**Position** : footer **fixe** en bas de l'écran (`fixed bottom-0 left-0 right-0 z-20`). Il reste visible lors du scroll. La zone principale a un `padding-bottom` suffisant (ex. `pb-16`) pour ne pas cacher le contenu.

**Style compact** : `py-2`, texte 10px, une ligne sur desktop. Fond : `bg-[var(--card)]/95 backdrop-blur-sm`.

---

## 6.1 Structure Desktop

Format (une ligne compacte, `flex-wrap`, `gap-x-4`) :

```
Vault ✔ · DVIG ✔   Sources : odoo ✔ · pos ✔   Sync : 16/02/26 07:42:00   v1.5.1
```

*Note* : Pas de préfixe « Infrastructure : » ; les noms de sources viennent de l’API (`status.sources[].name`).

---

## 6.2 Structure Mobile

```
Vault ✔ · DVIG ✔   Odoo ✔ · POS ✔   Sync 16/02/26 07:42   v1.5.1
```

*Note* : Sur mobile, les sources sont en dur (Odoo, POS) si l’API ne répond pas ; sinon `status.sources`.

---

## 6.3 Règles Sources

- Affichage obligatoire si source active.
- Sources cliquables (nouvel onglet).
- États possibles :
  - ✔ Connectée
  - ⚠ Retard
  - ✖ Non connectée
- Linky ne bloque jamais si une source est down.

---

# 7. API REQUISE

```
GET /api/platform/status
```

Exemple :

```json
{
  "environment": "prod",
  "integrity_state": "STATE_OK",
  "vault_status": "ok",
  "dvig_status": "ok",
  "sealed_ratio": 1.0,
  "pending_events": 0,
  "sources": [
    {"name": "odoo", "status": "ok"},
    {"name": "pos", "status": "ok"}
  ],
  "last_sync": "2026-02-16T07:42:00Z",
  "last_sync_formatted": "16/02/26 07:42:00",
  "version": "1.5.1"
}
```

---

# 8. CAS LIMITES

## Source down mais données scellées disponibles

- Integrity = ✔ ou ⚠ selon ratio
- Source affichée ⚠
- Tooltip : "Données historiques disponibles"

---

## Vault down

- Integrity = ✖
- Infrastructure = ✖
- UI stable, lecture possible si cache existant

---

# 9. DEFINITION OF DONE

✔ Tagline supprimée  
✔ Integrity State Machine intégrée  
✔ Badge consolidé implémentable  
✔ Footer institutionnel actif  
✔ Sources dynamiques  
✔ États cohérents PROD / LAB  
✔ Aucun impact performance  

---

# 10. IMPACT PRODUIT

Cette spec :

- Renforce la crédibilité CFO
- Clarifie la gouvernance d'intégrité
- Matérialise la résilience
- Supprime le marketing superflu
- Stabilise la perception institutionnelle

---

# 11. ÉTAT D'IMPLÉMENTATION

Implémentée le 2026-02-11. Fichiers concernés :

| Fichier | Rôle |
|---------|------|
| `components/ReportHeader.tsx` | Header 2 lignes (desktop/mobile), badge tenant, menu, société, période, module actif, IntegrityBadge |
| `components/IntegrityBadge.tsx` | Badge consolidé (✔ / ⚠ / ✖) avec tooltip, appel GET `/api/platform/status` |
| `components/LinkyFooter.tsx` | Footer Infrastructure, Sources, Sync, version |
| `components/DashboardWithFilters.tsx` | Intègre ReportHeader + LinkyFooter |

*Tous les chemins sont relatifs à `units/dorevia-linky/`.*
| `app/api/platform/status/route.ts` | API GET `/api/platform/status` — agrège vault-health, calcule `integrity_state` |

## Mapping viewMode → module actif

| viewMode | Label |
|----------|-------|
| `all` | Tout |
| `cash` | Cash |
| `business` | Business |
| `corrections` | Corrections |
| `pos_shops` | Points de vente |
| `pos_z` | Z de caisse |

## API platform/status

- **URL prioritaire** : `{VAULT_URL}/ui/system/vault-health?tenant=...`
- **Fallback** : si Vault 404 ou erreur → `{DVIG_URL}/internal/vault-health?tenant=...` (avec `Authorization: Bearer DVIG_INTERNAL_TOKEN`)
- **Champs retournés** : `environment`, `integrity_state`, `vault_status`, `sealed_ratio`, `pending_events`, `tooltip_cause`, `sources`, `last_sync_formatted`, `version`
- **Format `last_sync_formatted`** : `dd/mm/yy hh:mm:ss` (ex. `16/02/26 07:42:00`)
- **Variables** : `VAULT_URL`, `DVIG_URL`, `DVIG_INTERNAL_TOKEN`, `LINKY_VERSION`, `TENANT_ID`
- **Documentation déploiement** : `sources/vault/docs/PATCH_ROUTE_VAULT_HEALTH_LINKY.md`

## Contraintes respectées

- Header desktop max 110px (`max-h-[110px]`)
- Badge intégrité sur ligne 2 desktop (droite) et mobile (compact = icône seule)
- Footer **fixe** en bas de l'écran (`fixed bottom-0 left-0 right-0 z-20`), toujours visible
- Zone principale `pb-16` pour éviter que le footer masque le contenu

## Déploiement – Badge intégrité

Pour que le badge affiche ✔ Données scellées :

1. **Manifest** : `linky_dvig_url` (ex. `http://dvig-core-stinger:8080`)
2. **Compose Linky** : `DVIG_URL`, `DVIG_INTERNAL_TOKEN` (même valeur que le compose platform)
3. **Persistance** : `.env` avec `DVIG_INTERNAL_TOKEN` dans `apps/ui/<env>/`
4. **Image** : `dorevia/linky:v1.3-layout` (fallback Vault → DVIG intégré)

Réf. : `sources/vault/docs/PATCH_ROUTE_VAULT_HEALTH_LINKY.md` (sections 7 et 8)

---

**Fin de la spécification**
