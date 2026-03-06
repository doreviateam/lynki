# SPEC_DOREVIA_LINKY_UI_v2.0

## Préambule — Pourquoi ce choix technologique

Ce document remplace et étend les spécifications initiales basées sur un outil low‑code (Appsmith).

Après exploration, le choix a été fait d’orienter l’interface **Dorevia UI** vers une **application web dédiée**, construite avec **Next.js / React (ou SvelteKit)**, exposant directement les données certifiées issues de **Dorevia Vault**.

Ce choix est motivé par les constats suivants :

1. **Nature du produit**
   Dorevia UI n’est pas un back‑office interne ni un outil d’administration. C’est un **produit exposé**, destiné à des dirigeants, CFO/RAF et tiers de confiance.

2. **Métaphore produit claire : le compteur Linky**
   L’interface doit se comporter comme un compteur :

   * lecture seule
   * chiffre central incontestable
   * très peu d’interactions
   * confiance immédiate

3. **Limites structurelles du low‑code pour un produit final**
   Les outils low‑code sont adaptés au prototypage et aux outils internes, mais introduisent :

   * une dépendance forte à l’outil
   * des contraintes UX
   * des difficultés de branding et de performance

4. **Volonté de souveraineté et de maîtrise**
   La promesse Dorevia repose sur la preuve, l’auditabilité et la stabilité dans le temps. Le front‑end doit être aussi maîtrisé que le Vault.

👉 **Décision** :

* Low‑code = outil de labo / AMOA / prototypage
* Next.js / React (ou SvelteKit) = **produit Dorevia Linky**

---

## 1. Vision produit

**Dorevia Linky** est une application web (PWA) de consultation financière **en lecture seule**, exposant des indicateurs **certifiés**, **scellés** et **opposables**.

> « Ici, je ne corrige pas, je ne simule pas. Je constate une vérité financière. »

Caractéristiques clés :

* aucune saisie
* aucun calcul côté UI
* aucune dépendance à l’ERP
* une seule source de vérité : **Vault**

---

## 2. Cible & usages

### Personas

* Dirigeant de PME
* CFO / RAF
* Auditeur / tiers de confiance

### Contextes d’usage

* Consultation rapide (30–60 secondes)
* Mobile (PWA installée) ou desktop
* Partage d’un chiffre fiable lors d’un échange

---

## 3. Principes non négociables

* Lecture seule stricte
* Données certifiées uniquement
* Aucune transformation UI des données
* ERP‑agnostique
* UX minimaliste, lisible, stable
* Temps de chargement < 1 seconde
* Fonctionnement dégradé hors ligne (dernier snapshot)

---

## 4. Architecture technique

### Frontend

* Next.js (App Router) + TypeScript
* Tailwind CSS
* PWA (service worker, cache read‑only)

### Backend

* Dorevia Vault (API `/ui/*`)
* Accès **uniquement via proxy serveur Next.js**

```
Browser
  → Next.js (ui.<tenant>)
      → Vault (vault-<tenant>:8080)
```

Avantages :

* pas de CORS
* Vault non exposé publiquement
* sécurité, logs et filtrage centralisés

---

## 5. Contrat API (figé)

### Exemple — Ventes certifiées

Endpoint frontend :

```
GET /api/sales
```

Proxy interne vers :

```
GET /ui/aggregations/sales
```

#### Paramètres

* `tenant`
* `date_debut` (YYYY‑MM‑DD)
* `date_fin` (YYYY‑MM‑DD)
* `granularity` (day | week | month)

#### Réponse attendue

```json
{
  "total": 914093.53,
  "currency": "EUR",
  "from": "2026-01-01",
  "to": "2026-02-06",
  "granularity": "month",
  "series": [],
  "verifiable": true,
  "last_seal_at": "2026-02-06T22:14:03Z"
}
```

⚠️ Le frontend n’interprète jamais les données.

---

## 6. Écrans (MVP)

### Écran 1 — Home (compteur)

* Carte « Ventes certifiées »
* Carte « Encaissements certifiés »
* Carte « Trésorerie probante »

Chaque carte affiche :

* montant principal
* période
* badge « Données certifiées »
* date du dernier scellement

### Écran 2 — Détail (v2)

* Série temporelle
* Liste des derniers événements scellés

---

## 7. UX / UI guidelines

* Chiffre central dominant
* Lisible à distance
* Peu de couleurs
* Badge de certification toujours visible
* Aucun jargon technique exposé
* Aucune distraction

---

## 8. Hors périmètre explicite

* Édition
* Simulation
* Prévision
* Export comptable
* Rapprochement bancaire
* Workflow

---

## 9. Definition of Done

* Application installable (PWA)
* Une carte affiche un chiffre certifié réel
* L’UI fonctionne avec le Vault indisponible (snapshot)
* Aucun appel direct navigateur → Vault
* Démo possible sans explication préalable

---

## 10. Positionnement stratégique

* Dorevia Vault = infrastructure de vérité
* Dorevia Linky = surface de constat
* L’ERP reste un outil d’exécution

Ce découplage est intentionnel et structurant pour l’ensemble de l’écosystème Dorevia.
