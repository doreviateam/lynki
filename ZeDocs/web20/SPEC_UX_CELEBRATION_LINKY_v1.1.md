# SPEC_UX_CELEBRATION_LINKY_v1.1 (Consolidée)

**Produit :** Dorevia Linky
**Carte concernée :** Trésorerie validée
**Référence :** SPEC_UX_CELEBRATION_LINKY_v1.0
**Date :** 15 février 2026
**Statut :** Spécification UX officielle consolidée — prête implémentation

---

# 1. Intention

La célébration n'est **pas festive**.

Elle est :

* Un signal de maîtrise
* Une confirmation de cohérence bancaire
* Une validation silencieuse
* Une récompense cognitive sobre

Linky n'est pas un outil ludique.
C'est un cockpit financier.

La célébration doit refléter cette posture.

---

# 2. Déclencheur — Règles complètes

## 2.1 Condition principale

```
fiabilite_bancaire === 100
```

ET

```
etat_precedent < 100
```

## 2.2 Condition supplémentaire (cas limite)

```
total > 0
```

⚠ Si `total === 0`, la célébration ne doit pas se déclencher.

Justification :
Une structure vide n'est pas une réussite opérationnelle.

---

# 3. Gestion de l'état précédent

Implémentation recommandée :

```ts
const prevRateRef = useRef<number | null>(null)

useEffect(() => {
  if (
    rate === 100 &&
    prevRateRef.current !== null &&
    prevRateRef.current < 100 &&
    total > 0
  ) {
    triggerCelebration()
  }

  prevRateRef.current = rate
}, [rate, total])
```

Objectif :

* Éviter re-déclenchement à chaque polling
* Éviter déclenchement au premier render
* Garantir déclenchement uniquement lors d'un passage effectif

---

# 4. Animation visuelle du donut

## 4.1 Périmètre exact

UNIQUEMENT :

* Le segment SVG du donut (Pie/Cell)
* Pas la carte entière
* Pas le texte
* Pas la ligne d'interprétation

---

## 4.2 Transition couleur

### Cas A — Deux segments (orange + vert)

* Disparition progressive du segment orange (fade-out 350 ms)
* Remplissage complet du cercle vert

### Cas B — Un seul segment

* Transition fill/stroke orange → vert
* Durée : 350 ms
* easing : ease-out

```
transition: stroke 350ms ease-out;
```

Objectif : fluidité maîtrisée.

---

## 4.3 Micro-luminosité (impulsion maîtrisée)

Après passage au vert :

* Augmentation légère luminosité : +8 % max
* Durée impulsion : 800 ms
* Retour progressif à la teinte normale

```
filter: brightness(1.08);
transition: filter 800ms ease-out;
```

⚠ Pas de glow.
⚠ Pas d'ombre portée.
⚠ Pas de halo lumineux.

C'est une confirmation, pas un feu d'artifice.

---

## 4.4 Accessibilité

Respect obligatoire :

```css
@media (prefers-reduced-motion: reduce) {
  animation: none;
  transition: none;
}
```

* Désactiver micro-luminosité si `prefers-reduced-motion`
* Vérifier contraste WCAG AA

---

# 5. Texte contextualisé

## 5.1 Emplacement officiel

Sous le donut, à la place de la ligne d'interprétation standard.

Exemple normal :

```
Lecture : répartition sur la période sélectionnée
```

En cas 100 % :

```
100 % rapproché
✔ Cohérence bancaire confirmée
```

---

## 5.2 Règles typographiques

* Ligne 1 : font-weight 600
* Ligne 2 : font-weight 500
* Couleur : --positive
* Icône : ✔ minimal, stroke simple
* Pas d'emoji
* Pas d'animation texte

---

# 6. Persistance visuelle

La confirmation :

* Ne disparaît pas automatiquement
* Reste affichée tant que la fiabilité reste à 100 %
* Disparaît uniquement si fiabilité repasse < 100 %

---

# 7. Cas de retour arrière (100 → 95 %)

Si fiabilité redescend :

* Retour au donut segmenté vert/orange
* Ligne standard réaffichée
* Aucune animation dramatique inverse

Pas de sanction visuelle.

---

# 8. Son (rappel)

Toujours OFF par défaut.

Si implémenté un jour :

* Tick < 150 ms
* Volume faible
* Activable uniquement dans paramètres

---

# 9. Ce qui est interdit

* Confettis
* Particules
* Explosion visuelle
* Shake / bounce
* Scale animation
* Glow pulsé
* Animation répétée en boucle
* Message auto-disparaissant

La confirmation doit rester stable à l'écran.

---

# 10. Lecture utilisateur attendue

En 2 secondes :

1. Le donut est entièrement vert.
2. Le texte confirme la cohérence bancaire.
3. Le cerveau comprend : "C'est propre."

Aucune distraction.

---

# 11. Checklist d'implémentation

| Élément                         | Statut |
| ------------------------------- | ------ |
| Condition total > 0             | ☑      |
| useRef prevRate                 | ☑      |
| Transition 350ms ease-out       | ☑      |
| Micro-luminosité ciblée         | ☑      |
| prefers-reduced-motion respecté | ☑      |
| Texte contextualisé sous donut  | ☑      |
| Pas d'effet interdit            | ☑      |

---

# 12. Résumé exécutif

Quand le donut passe 100 % vert :

✔ Transition douce (350 ms)
✔ Micro-luminosité 800 ms
✔ Message clair : "100 % rapproché"
✔ Aucun effet gadget

Sobre.
Pro.
Stable.

---

**Fin — SPEC_UX_CELEBRATION_LINKY_v1.1**
