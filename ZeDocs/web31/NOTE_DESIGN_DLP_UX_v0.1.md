# Note de design — DLP UX v0.1

**Date :** 24 février 2026  
**Statut :** Réflexion / proposition  
**Référence :** SPEC_DLP_v0.3.md, échanges 24/02/2026

---

## 1. Diagnostic

Le sentiment « usine à gaz » ne vient pas du modèle DLP.  
**Il vient de l’UX actuelle.**

Aujourd’hui, la page `/dlp` expose la **plomberie** :
- Sociétés
- Périmètres métier
- DLP actives
- Mapping projet Odoo → périmètre

C’est une **page d’administration technique**.  
Pas un outil de gouvernance.

Un dirigeant ne veut pas voir :
- des mappings
- des `project_id`
- des synchronisations
- des prérequis « obligatoires »

Il veut écrire une phrase :

> *« On réduit notre dépendance au diesel. »*

**Point.**

---

## 2. Principe : séparer deux mondes

### 2.1 Monde Admin (rare, technique)

Déplacer tout le paramétrage dans une zone admin :

**Route :** `/admin/dlp-config`

- Sociétés
- Périmètres
- Mapping projet → périmètre

**Accessible uniquement aux admins.**

### 2.2 Monde Gouvernance (fréquent, évident)

La création d’une DLP doit être un **geste naturel** dans le cockpit.

Juste après le rapport Diva :

```
🧠 Nouvelle décision
[ champ texte unique ]
(Enregistrer)
```

**Et c’est tout.**

---

## 3. Vocabulaire côté UX

On ne doit pas exposer le mot « DLP » si ça ajoute de la friction.

| Interne (technique) | Côté utilisateur |
|---------------------|------------------|
| DLP                 | Décision         |
| DLP actives         | Décisions actives |
| Créer une DLP       | Nouvelle décision |

Le terme « DLP » reste interne / technique.

---

## 4. Conclusion

- **La DLP n’est pas une configuration.**  
  C’est un acte de gouvernance.

- **Le paramétrage doit devenir invisible.**  
  Les sociétés, périmètres et mapping restent nécessaires pour le fonctionnement technique, mais ils n’ont pas leur place dans le parcours du dirigeant.

---

## 5. Point à trancher : scope par défaut

Pour que les hits comptent, une DLP a besoin d’un scope (sociétés + périmètres ciblés).

| Option | Description |
|--------|-------------|
| **A** | Scope implicite = tout le tenant (toutes sociétés, tous périmètres) |
| **B** | Scope par défaut défini une fois au niveau tenant (config admin) |
| **C** | Scope défini dans l’admin, appliqué à toutes les « nouvelles décisions » |

---

## 6. Synthèse

| Concept | Actuel | Proposé |
|--------|--------|---------|
| Paramétrage | Page /dlp, 4 sections mélangées | /admin/dlp-config, admin uniquement |
| Création | Formulaire multi-champs + scope | Champ texte unique, cockpit, après Diva |
| Vocabulaire | DLP, périmètres, mapping | Décision, Décisions actives, Nouvelle décision |
| Visibilité plomberie | Visible pour tous | Invisible (admin only) |

---

## 7. À venir

- Validation de la proposition par la MOA
- Décision sur le scope par défaut
- Évolution de la spec et de l’implémentation si acté

---

*Document de réflexion — non opposable tant que non validé*
