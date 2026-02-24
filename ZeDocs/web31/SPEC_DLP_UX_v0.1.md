# SPEC — DLP UX v0.1 (séparation Admin / Gouvernance)

**Date :** 24 février 2026  
**Statut :** Validé — prêt pour implémentation  
**Source :** NOTE_DESIGN_DLP_UX_v0.1.md  
**Référence modèle :** SPEC_DLP_v0.3.md (inchangé)

---

## 1. Objectif

Séparer deux parcours utilisateur :
- **Admin** : paramétrage technique (sociétés, périmètres, mapping) — rare, réservé aux admins
- **Gouvernance** : création d’une décision stratégique — fréquent, geste simple dans le cockpit

Le modèle de données (DLP, companies, business_perimeters, hits, project_perimeter_map) reste inchangé (SPEC_DLP_v0.3).

---

## 2. Vocabulaire côté utilisateur

| Technique (interne) | Affiché à l’utilisateur |
|---------------------|-------------------------|
| DLP                 | Décision                |
| DLP actives         | Décisions actives       |
| Créer une DLP       | Nouvelle décision       |
| Gérer les DLP       | Paramétrage (admin) ou retirer |

Le terme « DLP » ne doit pas apparaître dans le parcours gouvernance.

---

## 3. Monde Admin

### 3.1 Route

**`/admin/dlp-config`**

Contenu actuel de `/dlp` (paramétrage uniquement) :
- Sociétés (liste + synchroniser depuis config + ajouter)
- Périmètres métier (liste + créer)
- Mapping projet Odoo → périmètre (liste + ajouter)

**Ne pas inclure** : création de DLP. La création de DLP se fait uniquement dans le cockpit (monde gouvernance).

### 3.2 Accès

- Réservé aux **admins** du tenant
- Navigation : via le menu burger (cf. §9)
- Mécanisme d’accès : à définir (rôle, paramètre, ou contrôle à implémenter en P0)
- Si l’utilisateur n’est pas admin : 403 ou redirection vers le cockpit

### 3.3 Libellés

- Titre de page : « Paramétrage DLP » ou « Configuration des décisions » (à valider)
- Sections inchangées fonctionnellement, libellés techniques conservés pour l’admin (Sociétés, Périmètres, Mapping)

---

## 4. Monde Gouvernance (cockpit)

### 4.1 Emplacement

**Juste après le bloc Diva** (DivaFlashBlock), dans la vue « all » du cockpit.

Structure actuelle :
```
[ IconGrid (tuiles) ]
[ DivaFlashBlock ]
```

Structure cible :
```
[ IconGrid (tuiles) ]
[ DivaFlashBlock ]
[ Bloc Nouvelle décision + Décisions actives ]
```

### 4.2 Bloc « Décisions actives »

**Titre :** « Décisions actives » (cliquable pour déplier/replier)

**Comportement :** Replié par défaut. Clic sur le titre affiche ou masque la liste.

**Contenu (quand déplié) :**
- Liste des DLP actives du tenant (lecture seule dans ce bloc)
- Chaque item affiche : le message (title ou intention selon mapping — cf. §5)
- Lien ou action pour archiver (optionnel en v0.1)

**Absence de données :** « Aucune décision enregistrée. Saisissez une nouvelle décision ci-dessous. »

### 4.3 Bloc « Nouvelle décision »

**Titre :** « Nouvelle décision » (avec icône 🧠 ou équivalent)

**Champ unique :** zone de texte (textarea ou input multiligne)
- Placeholder : « Ex. : On réduit notre dépendance au diesel »
- **Limite : 140 caractères** — Compteur visible en bas à droite (ex. : 87 / 140). Bouton « Enregistrer » désactivé si > 140. En cas de dépassement : message discret « La décision doit tenir en 140 caractères maximum. »
- Pas de champs supplémentaires : pas de scope, pas de société, pas de périmètre

**Micro-texte sous le champ :**  
*« Cette décision sera automatiquement suivie à partir des projets validés. »*  
(Comprendre que ce n’est pas juste une note.)

**Bouton :** « Enregistrer »

**Comportement :**
1. L’utilisateur saisit un message
2. Clique « Enregistrer »
3. Création d’une DLP côté service (cf. §5)
4. Le bloc se vide, la liste « Décisions actives » se met à jour
5. Message de confirmation discret (toast ou inline)

**Gestion des erreurs :**
- Champ vide : désactiver le bouton ou afficher un message
- Erreur API : afficher un message lisible (ex. « Impossible d’enregistrer. Réessayez. »)

---

## 5. Mapping message utilisateur → modèle DLP

Le message saisi par l’utilisateur doit alimenter le modèle DLP existant.

**Règles :**
- `title` = les 80 premiers caractères du message (ou message entier si ≤ 80)
- `intention` = message complet
- `hypothesis` = **NULL** (pas de copie de `intention` — Intention ≠ Hypothèse ; éviter de polluer le modèle)
- `scope_companies` = scope par défaut (cf. §6)
- `scope_perimeters` = scope par défaut (cf. §6)
- `created_by` = « linky » ou identifiant utilisateur si auth disponible
- `status` = « active »

**Garde-fou :** Si aucune société ou aucun périmètre n’existe dans le tenant → **refuser la création** et afficher :  
*« Le paramétrage initial n’est pas configuré. Contactez un administrateur. »*  
Cela évite une DLP créée sans scope réel, des hits impossibles et un comportement silencieux.

**Note sur le champ unique :** Le message peut être une intention (ex. « On réduit notre dépendance au diesel ») ou une décision/action (ex. « On met en place un suivi mensuel diesel »). En v0.1 : accepter tout, ne contraindre rien.

---

## 6. Scope par défaut

**Décision validée : Option A.**

| Option | Description | Statut |
|--------|-------------|--------|
| **A** | Toutes les sociétés et tous les périmètres du tenant | **Choisi pour v0.1** |
| **B** | Scope défini une fois dans l’admin, réutilisé | Plus propre à long terme, prématuré en v0.1 |
| **C** | Scope vide ; pas de hits tant qu’un admin configure | Catastrophique en UX — ne pas bloquer la création |

**Implémentation Option A :** Au moment de la création : récupérer la liste des sociétés et périmètres du tenant, affecter à `scope_companies` et `scope_perimeters`. Zéro friction, zéro config, hits immédiats dès que le mapping existe.

---

## 7. Carte « Énergie stratégique »

- Conserver la carte telle quelle (StrategicEnergyCard)
- **Supprimer le lien « Gérer les DLP »** ; l’accès au paramétrage se fait via le menu burger (cf. §12)
- **Affichage du nombre de décisions :** Afficher seulement le nombre, sans le mot « actives ». Exemple : **3 décisions**. Simple, humain, évident.

---

## 8. Route `/dlp` actuelle

**Comportement :**
- Redirection vers `/admin/dlp-config` (pour compatibilité liens existants)
- Ou : suppression de la route et mise à jour des liens

---

## 9. Accès au paramétrage (navigation)

### 9.1 Principe

Le cockpit est un espace de pilotage stratégique. Le paramétrage technique ne doit pas apparaître dans le parcours principal de l’utilisateur.

L’accès à la configuration DLP (sociétés, périmètres, mapping projet → périmètre) est positionné dans une section dédiée à l’administration.

### 9.2 Emplacement

Dans le menu burger :

```
⚙️ Administration
    └── Paramétrage des décisions
```

ou

```
⚙️ Paramètres
    └── Décisions (configuration)
```

Le terme « DLP » ne doit pas apparaître dans le menu utilisateur.

### 9.3 Visibilité

- L’entrée « Paramétrage des décisions » est **visible uniquement pour les admins** du tenant.
- Pour les utilisateurs non-admin :
  - Le lien n’est pas affiché dans le menu
  - L’accès direct à `/admin/dlp-config` retourne 403 ou redirige vers le cockpit

### 9.4 Cohérence produit

Ce positionnement garantit :
- Une séparation claire entre acte de gouvernance (cockpit) et configuration technique (admin)
- Une réduction de la friction et de la perception de complexité
- Une meilleure lisibilité du produit pour les dirigeants

---

## 10. Critères d’acceptation

| # | Critère | Vérification |
|---|---------|--------------|
| A1 | Un admin peut accéder à `/admin/dlp-config` et gérer sociétés, périmètres, mapping | Navigation manuelle |
| A2 | Un utilisateur (cockpit) peut saisir un message dans « Nouvelle décision » et cliquer Enregistrer | Scénario nominal |
| A3 | Une DLP est créée avec title/intention dérivés du message, scope par défaut | Vérifier en BDD ou via API |
| A3b | Si aucune société/périmètre : refus + message « Le paramétrage initial n'est pas configuré. Contactez un administrateur. » | Scénario edge case |
| A4 | La liste « Décisions actives » affiche les DLP créées | Rafraîchissement après création |
| A5 | Le terme « DLP » n’apparaît pas dans le bloc gouvernance (nouvelle décision, décisions actives) | Revue UX |
| A6 | La carte Énergie stratégique affiche « X décisions » (ex. : 3 décisions), sans « actives » | Revue UX |
| A7 | L’accès au paramétrage est dans le menu burger (Administration / Paramètres), visible admins uniquement | Navigation |
| A8 | Le lien « Gérer les DLP » est supprimé de la carte Énergie stratégique | Revue UX |

---

## 11. Hors scope v0.1

- Auth / contrôle d’accès admin (peut être simulé ou basé sur un flag simple)
- Édition ou archivage d’une décision depuis le cockpit (restera dans l’admin ou P1)
- Scope personnalisé par décision à la création (reste scope par défaut)

---

## 12. Annexes

### A. Références

- Note de design : `NOTE_DESIGN_DLP_UX_v0.1.md`
- Spec modèle : `SPEC_DLP_v0.3.md`
- Implémentation actuelle : `units/dorevia-linky/app/dlp/page.tsx`, `DashboardWithFilters.tsx`, `StrategicEnergyCard.tsx`

### B. Ordre d’implémentation suggéré

1. Créer `/admin/dlp-config` (déplacer le contenu de `/dlp` sans la section création DLP)
2. Créer le composant « Nouvelle décision + Décisions actives » et l’intégrer dans `DashboardWithFilters` après DivaFlashBlock
3. Adapter l’API de création DLP (ou créer une route simplifiée) pour accepter un message unique + scope par défaut
4. Mettre à jour les libellés (DLP → Décision)
5. Rediriger `/dlp` vers `/admin/dlp-config`
6. Supprimer le lien « Gérer les DLP » dans StrategicEnergyCard
7. Ajouter l’entrée « Paramétrage des décisions » dans le menu burger (section Administration / Paramètres), visible admins uniquement
