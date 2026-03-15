# Direction Artistique — Linky Cockpit

**Version : 1.1**

---

# Objectif

Définir une direction visuelle claire pour la refonte du cockpit **Dorevia Linky**, afin d'obtenir une interface :

- crédible pour dirigeants / CFO
- cohérente avec le positionnement **données financières vérifiables**
- lisible malgré une forte densité d'information
- **premium sans être ostentatoire**

---

# 1. Positionnement visuel

Linky doit évoquer :

- un **cockpit financier de contrôle**

Pas :

- un ERP
- un dashboard marketing
- un produit startup flashy

## Références implicites

- Bloomberg Terminal (sobriété)
- cockpit fintech moderne
- interfaces de supervision

## Sensation recherchée

- calme
- maîtrise
- précision
- confiance

---

# 2. ADN visuel

## 2.1 Dark premium

### Base visuelle

**fond bleu nuit profond**

### Pourquoi

- met la donnée en valeur
- fatigue visuelle réduite
- cohérent avec produits financiers

### Palette base

| Élément | Couleur |
|-------|--------|
| fond principal | `#0F1B2D` |
| fond secondaire | `#14243A` |
| surface carte | `#1A2E47` |
| bordure carte | `#223B5B` |
| texte principal | `#E6EEF8` |
| texte secondaire | `#9FB3C8` |

---

## 2.2 Couleurs fonctionnelles

La couleur sert uniquement à **signaler**.

| Couleur | Signification | Hex |
|------|------|------|
| bleu | information structurelle | `#3B82F6` |
| vert | validation / santé financière | `#22C55E` |
| orange | attention / couverture partielle | `#F59E0B` |
| rouge | alerte / risque | `#EF4444` |

### Exemple

- vert → marge positive  
- orange → flux non couverts  
- rouge → client à risque  

**Jamais utiliser ces couleurs comme décoration.**

---

## 2.3 Mode clair (option)

Pour impressions et présentations, une variante claire peut être proposée :

| Élément | Couleur |
|------|------|
| fond principal | `#F8FAFC` |
| fond secondaire | `#F1F5F9` |
| surface carte | `#FFFFFF` |
| texte principal | `#0F172A` |
| texte secondaire | `#64748B` |

Conserver la même logique fonctionnelle (**vert / orange / rouge**) pour les signaux.

---

# 3. Typographie

La typographie doit inspirer :

- sérieux
- modernité
- précision

## Choix

- **Police principale** : IBM Plex Sans  
- **Police secondaire (optionnelle)** : Source Sans Pro

## Principes

- chiffres lisibles
- hiérarchie forte
- peu de styles différents

## Structure

| Élément | Taille |
|------|------|
| KPI principal | 40–48px |
| titre bloc | 16–18px |
| label | 12–14px |
| table | 14px |

Les **chiffres doivent être visuellement dominants**.

---

## Grille & espacement

Base : **8px**

| Élément | Valeur |
|------|------|
| padding cartes | 16px / 24px |
| gouttière entre cartes | 16px |
| espace entre blocs | 24px |
| marges de page | 24px minimum |

---

# 4. Structure de page

Chaque écran doit suivre une **logique stable**.

## Structure recommandée

1. Header contexte  
2. Insight principal  
3. KPI synthèse  
4. Analyse graphique  
5. Détails actionnables  

---

## Règles de densité

- Maximum **3 niveaux d'information visibles sans scroll par bloc**
- Ratio blanc / contenu : **au moins 30 % d'espace vide**
- **Une seule action principale par carte**

---

## 4.1 Header

Contient :

- tenant
- périmètre
- période
- statut données
- preuves scellées

**Objectif :** donner immédiatement le **contexte analytique**.

---

## 4.2 Insight principal

Une phrase qui explique la situation.

### Exemple

> Risque élevé : 43,9 % du retard concentré sur un client majeur

ou

> Trésorerie partiellement validée — couverture probante insuffisante

Ce bloc doit **guider la lecture**.

---

## 4.3 KPI Cards

Maximum **3 à 4 cartes**

### Structure recommandée

- Titre
- Valeur principale
- Informations secondaires
- État

### Exemple

**Marge**

58.4 %

Ventes : 94k  
Achats : 39k

---

# 5. Graphiques

Les graphiques doivent rester **sobres et lisibles**.

## Types privilégiés

- bar charts
- lignes simples
- répartitions

## À éviter

- 3D
- gradients lourds
- animations inutiles

---

## Règles d'animation

| Élément | Valeur |
|------|------|
| durée | 150–200 ms |
| easing | ease-out |

Autoriser :

- transitions hover
- chargement progressif des graphiques

Éviter :

- animations décoratives
- parallax
- effets crypto / gaming

---

## Style

| Élément | Couleur |
|------|------|
| ventes | vert |
| achats | orange |
| axes | gris léger |
| fond | transparent |

Lecture **simple et immédiate**.

---

# 6. Tables décisionnelles

Les tableaux sont des **outils d'action**.

## Principes

- lignes aérées
- colonnes alignées
- valeurs importantes visibles
- badges de criticité

### Exemple

| Partenaire | Encours | Retard |
|------|------|------|
| EMD | 10 703 € | 37 % |
| EXPORT MY ISLAND | 12 589 € | 43 % |

### Amélioration possible

Barres visuelles dans la cellule pour montrer l'intensité.

---

# 7. Cartes analytiques

Les cartes doivent avoir :

- coins arrondis modérés
- bordure subtile
- fond légèrement différencié

### Style recommandé

```
border-radius: 12px
border: 1px solid #223B5B
background: #1A2E47
```

### Ombres

Très légères.

Pas de look **Dribbble concept**.

---

# 8. Signature visuelle Linky

Trois éléments doivent toujours apparaître.

## Source des données

Source : Vault  
Sources : Odoo + POS

## Fiabilité

- Flux couverts
- Couverture probante
- Validation

## Traçabilité

- Preuves scellées

C'est la **différence majeure avec un simple dashboard.**

---

# 9. Éléments signature

Composants typiques :

- badge validation
- badge alerte
- badge couverture

### Exemples

- Validation partielle
- Marge exposée
- Risque client

Ces éléments créent **l'identité Linky**.

---

## Design des badges

| Propriété | Valeur |
|------|------|
| padding | 4px 8px ou 6px 12px |
| border-radius | 6px |
| police | 12px semi-bold |
| fond | rgba couleur fonctionnelle |

Exemple :

```
background: rgba(34,197,94,0.15)
```

---

# 10. Icônes

Style :

- outline
- stroke 1.5–2px

Taille :

| usage | taille |
|------|------|
| labels | 16px |
| actions | 20–24px |

Sets recommandés :

- Lucide
- Heroicons
- Phosphor

---

# 11. Accessibilité

- Contraste texte / fond : **WCAG AA (4.5:1)**
- Taille minimale texte : **14px**
- Labels : **12px minimum**
- États **focus visibles**
- Ne jamais transmettre l'information **uniquement par la couleur**

---

# 12. Anti-patterns

À éviter absolument :

- trop de cadres → effet ERP lourd
- trop de couleurs → perte de crédibilité
- trop de texte → préférer signaux visuels
- effets visuels excessifs → éviter crypto / gaming
- surdensité → laisser respirer l'information

---

# 13. Ton visuel

Linky doit évoquer :

- pilotage
- maîtrise
- fiabilité

Pas :

- fun
- startup
- gadget

---

# 14. Résumé direction artistique

Linky est :

**un cockpit financier premium dark mode**

qui met en valeur :

- la preuve
- le risque
- la décision

grâce à :

- une hiérarchie claire
- une palette fonctionnelle
- des composants analytiques lisibles

---

# Annexe — Références visuelles (moodboard)

À documenter :

- 3–5 captures ou maquettes de référence (Bloomberg, fintech, supervision)
- 1–2 contre-exemples à éviter (dashboards marketing, look startup)

Lien possible :

- board **Figma**
- board **Pinterest**
