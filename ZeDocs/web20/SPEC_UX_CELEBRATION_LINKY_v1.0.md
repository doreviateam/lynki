# SPEC_UX_CELEBRATION_LINKY_v1.0

**Produit :** Dorevia Linky
**Carte concernée :** Trésorerie validée
**Événement déclencheur :** Donut = 100 % rapproché
**Date :** 15 février 2026
**Statut :** Spécification UX officielle

---

# 1. Intention

La célébration n’est **pas festive**.

Elle est :

* Un signal de maîtrise
* Une confirmation de cohérence bancaire
* Une validation silencieuse
* Une récompense cognitive sobre

Linky n’est pas un outil ludique.
C’est un cockpit financier.

La célébration doit refléter cette posture.

---

# 2. Déclencheur

Condition :

```
fiabilite_bancaire === 100%
```

ET

```
etat_precedent < 100%
```

→ L’animation ne doit se déclencher que lors du passage effectif à 100 %, pas à chaque re-render.

---

# 3. Animation visuelle du donut

## 3.1 Transition couleur

Lorsque le statut passe de :

Orange → Vert

### Paramètres

* Durée : 300–400 ms
* Courbe : ease-out
* Transition progressive (pas instantanée)

```
transition: stroke 350ms ease-out;
```

Objectif : fluidité maîtrisée.

---

## 3.2 Micro-luminosité (impulsion de validation)

Après passage au vert :

* Augmentation légère luminosité : +8 % max
* Durée impulsion : 800 ms
* Retour progressif à la teinte normale

Exemple conceptuel :

```
filter: brightness(1.08);
transition: filter 800ms ease-out;
```

⚠ Pas de glow.
⚠ Pas d’ombre portée.
⚠ Pas de halo lumineux.

C’est une confirmation, pas un feu d’artifice.

---

# 4. Texte contextualisé

Lorsque 100 % atteint :

Remplacer :

```
En attente 100 %
```

Par :

```
100 % rapproché
✔ Cohérence bancaire confirmée
```

## 4.1 Typographie

* Ligne 1 : poids 600
* Ligne 2 : poids 500
* Couleur : vert principal (--positive)
* Icône : ✔ minimal, stroke simple

⚠ Pas d’emoji.
⚠ Pas de 🎉.
⚠ Pas d’animation texte.

---

# 5. Son (optionnel — OFF par défaut)

Aucun son par défaut.

Si un jour activable :

* Micro “tick” discret
* Durée < 150 ms
* Volume faible

Mais par défaut : silence.

---

# 6. Ce qui est interdit

* Confettis
* Particules
* Explosion visuelle
* Shake / bounce
* Scale animation
* Glow pulsé
* Animation répétée en boucle
* Message auto-disparaissant

La confirmation doit rester stable à l’écran.

---

# 7. Lecture utilisateur attendue

En 2 secondes :

1. Le donut est entièrement vert.
2. Le texte confirme la cohérence bancaire.
3. Le cerveau comprend : “C’est propre.”

Aucune distraction.

---

# 8. Cohérence produit

Cette célébration incarne :

* La promesse Dorevia
* La synchronisation banque ↔ opérationnel
* La fin du doute ERP estimatif

Ce n’est pas une victoire émotionnelle.

C’est une preuve.

---

# 9. Résumé exécutif

Quand le donut passe 100 % vert :

✔ Transition douce (350 ms)
✔ Micro-luminosité 800 ms
✔ Message clair : “100 % rapproché”
✔ Aucun effet gadget

Sobre.
Pro.
Stable.

---

**Fin — SPEC_UX_CELEBRATION_LINKY_v1.0**
