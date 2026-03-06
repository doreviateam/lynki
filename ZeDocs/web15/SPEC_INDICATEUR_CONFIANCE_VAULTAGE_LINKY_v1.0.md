# SPEC — Indicateur de Confiance Vaultage (Linky)

**Version** : 1.0  
**Date** : 11 février 2026  
**Produit** : Dorevia Linky  
**Objectif** : Afficher un indicateur global de santé du vaultage, discret, fiable et hiérarchisé.

---

## 1. Objectif Fonctionnel

Afficher un indicateur global 🔒 dans le header permettant de visualiser la santé du vaultage des événements financiers.

Cet indicateur :

- Est **global au tenant**
- Ne dépend pas d'une card spécifique
- Reflète la santé système
- Ne surcharge pas l'interface

---

## 2. Position UX

### 2.1 Placement

- **Emplacement** : Header, à droite du badge tenant
- **Alignement** : Sur la même ligne que le badge tenant et le menu hamburger
- **Ordre** : `[Badge tenant] [Icône vault] [Menu hamburger]`

### 2.2 Règles visuelles (Direction Artistique)

Référence : `DIRECTION_ARTISTIQUE_LINKY.md` v1.3

| Règle | Application |
|-------|-------------|
| Icône | Outline uniquement, stroke 1,5 px |
| Couleur | Sémantique selon statut (exception à la règle « iconographie toujours `--text-secondary` ») |
| Interaction | Hover : tooltip ; Clic : popover détail |

---

## 3. Définition du Taux de Vaultage

### 3.1 Formule

```
Taux = (événements vaultés avec succès / événements à vaulter) × 100
```

### 3.2 Événements concernés

**Inclut** :

- `account.move` (factures)
- `account.payment`
- `pos.payment` (quand actif)
- `adjustments` (avoir, remboursements)

**Exclut** :

- Événements explicitement ignorés
- Événements hors scope configuré

### 3.3 Source de données

Le calcul repose sur la table **DVIG `outbox_events`** :

| Statut DVIG | Interprétation |
|-------------|----------------|
| `forwarded` | Événement vaulté avec succès |
| `accepted`, `forwarding`, `failed_soft` | En attente |
| `failed_hard` | Échec définitif |

- **événements vaultés avec succès** = `COUNT(status = 'forwarded')`
- **événements à vaulter** = Total des événements reçus = vaultés + pending + failed
- **pending_events** = `accepted` + `forwarding` + `failed_soft`
- **failed_events** = `failed_hard`

---

## 4. Règles de Couleur

| Statut | Seuil | Couleur | Variable CSS | Signification |
|--------|-------|---------|--------------|---------------|
| 🟢 Vert | 99–100 % | Vert | `--positive` | Fonctionnement normal |
| 🟠 Orange | 95–99 % | Orange | `--warning` | Retard temporaire |
| 🔴 Rouge | &lt;95 % | Rouge | `--negative` | Incident |

**Règles** :

- 100 % n'est pas requis en permanence
- &lt;95 % est considéré critique
- Si **aucune donnée** disponible : icône en `--text-secondary`, état neutre

---

## 5. Comportement UX

### 5.1 État Normal (Vert)

- Icône verte discrète
- Pas de badge texte
- Opacité 80 %

### 5.2 État Orange

- Icône orange
- Tooltip au hover : *« Retard de vaultage détecté »*
- Animation légère possible (pulse très subtil, optionnel)

### 5.3 État Rouge

- Icône rouge
- Tooltip : *« Incident de vaultage — Certaines données peuvent ne pas être sécurisées »*
- Badge visuel légèrement plus présent (opacité 100 %)

### 5.4 État Indisponible

- Icône grise (`--text-secondary`)
- Tooltip : *« Indicateur temporairement indisponible »*
- Clic : popover avec message d’indisponibilité

---

## 6. Détail au Clic

### 6.1 Popover / Modal

Au clic sur l’icône, ouverture d’un popover affichant :

```
Vaultage : 97,8 %
Événements en attente : 4
Échecs : 0
Dernier incident : aucun
Dernière synchronisation : 08:42
```

### 6.2 Format des libellés

| Champ | Libellé UI | Source |
|-------|------------|--------|
| Taux | Vaultage : X,X % | `vault_rate` |
| En attente | Événements en attente : N | `pending_events` |
| Échecs | Échecs : N | `failed_events` |
| Dernier incident | Dernier incident : aucun / date | `last_incident_at` (optionnel) |
| Sync | Dernière synchronisation : HH:mm | `last_sync_at` |

---

## 7. Contract API

### 7.1 Route Vault

**Méthode** : `GET`  
**Chemin** : `/ui/system/vault-health`  
**Paramètres** : `tenant` (requis)

**Exemple** :
```
GET /ui/system/vault-health?tenant=sarl-la-platine
```

### 7.2 Réponse JSON attendue

```json
{
  "vault_rate": 99.6,
  "pending_events": 2,
  "failed_events": 0,
  "last_sync_at": "2026-02-11T08:42:00Z"
}
```

**Champs** :

| Champ | Type | Description |
|-------|------|-------------|
| `vault_rate` | `number \| null` | Taux en % (0–100), ou `null` si indisponible |
| `pending_events` | `number` | Événements en attente (accepted, forwarding, failed_soft) |
| `failed_events` | `number` | Événements en échec définitif (failed_hard) |
| `last_sync_at` | `string \| null` | ISO 8601 du dernier événement traité, ou `null` |

### 7.3 Codes HTTP

| Code | Signification |
|------|---------------|
| 200 | Données disponibles |
| 503 | Service indisponible (DVIG down, etc.) — client interprète comme état indisponible |

### 7.4 RBAC

Référence : `internal/auth/rbac.go`

- Permission : `PermissionReadDocuments` (alignement avec les autres routes `/ui/*`)
- JWT requis si l’authentification est activée

---

## 8. Architecture Technique

### 8.1 Chaîne de données

```
Odoo → DVIG (outbox_events) → Vault (documents)
         ↑
         Source de vérité pour vault health
```

### 8.2 Implémentation Vault

**Option A (cible)** : Vault appelle DVIG en interne

- Variable d’environnement : `DVIG_URL` (ex. `http://dvig:8000`)
- Vault implémente `GET /ui/system/vault-health` et appelle `GET {DVIG_URL}/internal/vault-health?tenant={tenant}`
- DVIG expose cette route et interroge `outbox_events`

**Option B (fallback)** : Stub temporaire

- Si `DVIG_URL` non configuré ou DVIG injoignable : Vault retourne `vault_rate: null`, `pending_events: 0`, `failed_events: 0`, `last_sync_at: null`
- Le client affiche l’état « indisponible »

### 8.3 Route Linky

Linky appelle Vault via son proxy existant :

- **Chemin Linky** : `GET /api/vault-health?tenant={tenant}`
- **Proxy** : Forward vers `{VAULT_URL}/ui/system/vault-health?tenant={tenant}`
- **Cache** : `revalidate: 0`, `dynamic: "force-dynamic"` (pas de cache)

---

## 9. Règles Importantes

- Aucun affichage de pourcentage sur l’écran principal
- Le pourcentage n’est visible qu’au clic (dans le popover)
- L’indicateur ne doit pas concurrencer la Trésorerie
- Si vert → discret
- Si orange/rouge → plus visible
- Si indisponible → neutre, pas d’alarme

---

## 10. Philosophie Produit

Le vaultage est une **propriété système**, pas un KPI métier.

Le dirigeant doit :

- Être rassuré
- Ne pas surveiller le système

En cas d’incident, la visibilité devient nécessaire.

---

## 11. Non-Objectifs

- Pas d’indicateur par card
- Pas d’affichage permanent du pourcentage
- Pas de monitoring DevOps visible
- Pas d’intégration dans la Trésorerie ou les KPIs métier

---

## 12. Références

| Document | Usage |
|----------|-------|
| `DIRECTION_ARTISTIQUE_LINKY.md` v1.3 | Couleurs, icônes, placement header |
| `nav_linky.md` | Navigation Linky, philosophie produit |
| `sources/dvig/migrations/006_create_outbox_events.sql` | Modèle outbox_events |
| `sources/vault/internal/auth/rbac.go` | RBAC routes `/ui/*` |

---

## 13. Statut attendu après implémentation

Linky reste lisible, premium, orienté maîtrise.  
La confiance devient un signal discret mais rigoureux.
