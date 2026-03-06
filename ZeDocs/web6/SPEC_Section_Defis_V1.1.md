# 📘 SPEC — Section Défis / Problème — Dorevia-Vault

**Version :** v1.1  
**Date :** 2026-01-21  
**Cible :** CFO / RAF / Dirigeant financier  
**Statut :** Spécification validée (Copy + Organisation UX)  
**Auteur :** Équipe produit Dorevia-Vault  

---

## 🎯 Objectif

Créer une section UX qui :
1. Provoque l’identification immédiate (*« c’est moi »*)
2. Explique clairement la cause du problème
3. Génère le besoin d’une solution

Structure basée sur la **règle des 3 groupes** :
- **Ce que vous vivez**  
- **Pourquoi ça arrive**  
- **Ce que ça vous coûte**  

---

## 🧱 Organisation UX ciblée

### 🧭 Intentions UX (CFO-first)
- **Lecture rapide** : compréhension < 10 secondes + approfondissement possible
- **Hiérarchie évidente** : Intro (tension) → Cartes (preuves) → Cause (racine) → Impact (urgence) → Transition (solution)
- **Crédibilité** : chiffres mis en avant, ton factuel, absence de jargon technique
- **Émotion contrôlée** : stress et responsabilité CFO, sans culpabilisation

### 🧩 Structure visuelle (desktop)
1. **Header de section**
   - Titre (H2)
   - Intro (4–6 lignes max)
   - Quote “responsabilité CFO” (bloc citation)
2. **Grille 2×2 des 4 cartes** (pilier de section)
   - Chaque carte : titre court + 3 lignes max + quote + stat (chiffre “hero”)
3. **Bloc “Pourquoi ça arrive”** (cause racine)
   - Largeur plus étroite que la grille pour favoriser la lecture (ex. 680–760px)
   - 3 bullets max + une punchline
4. **Bloc “Ce que ça vous coûte”** (impact CFO)
   - Format “liste à puces” + mini-quote
5. **Transition vers solution + CTA**
   - 2–3 lignes max
   - CTA principal + optionnel CTA secondaire (voir ci-dessous)

### 📱 Structure mobile
- Header + intro (inchangé)
- Cartes en **colonne** (1 par 1) avec :
  - Stat visible sans scroller (stat au-dessus ou alignée à droite)
  - Hauteur de carte homogène (éviter “cartes accordéon”)
- Cause racine → Impact → Transition → CTA
- CTA toujours **visible** (en bas de section, sans “zone grise”)

### 🧠 Hiérarchie typographique (recommandations)
- **H2** : 36–44px (desktop) / 26–32px (mobile)
- **Intro** : 16–18px, interligne 1.5
- **Titres cartes** : 16–18px, gras
- **Quotes** : style “italique / gris”, 14–15px
- **Stats** : 28–40px (desktop) / 22–30px (mobile) + label court
- Longueur max : **65–80 caractères** par ligne pour la lisibilité

### 🎛️ Spacing & densité
- Objectif : **respiration premium** (CFO = sérieux, pas brouillon)
- Marges verticales :
  - Header → Cartes : 24–40px
  - Cartes → Cause : 32–48px
  - Cause → Impact : 24–40px
  - Impact → Transition/CTA : 24–40px
- Cartes : padding interne 18–24px

### ✅ Comportements (micro-UX)
- Sur les cartes :
  - Hover léger (ombre / translation subtile) pour “engagement”
  - Pas de liens multiples (éviter distraction)
- CTA :
  - **Un seul CTA principal** (clarté)
  - CTA secondaire optionnel en lien texte

### 🎯 CTA (recommandations)
- **CTA principal** (bouton) :  
  - “Voir comment fiabiliser mes chiffres” **ou** “Comprendre la méthode”
- **CTA secondaire** (texte) :  
  - “Parler à un expert (15 min)”

---

## 🧱 TITRE DE SECTION

**Pourquoi vos chiffres ne sont pas fiables aujourd’hui**

---

## 🧱 INTRO (Accroche émotionnelle)

Vous avez des outils.  
Vous avez des équipes.

Pourtant…  
👉 **vous doutez encore de vos chiffres.**

Ce n’est pas un problème d’ERP.  
Ce n’est pas un problème de comptable.

👉 Le vrai problème,  
c’est le **délai** et la **fragilité**  
entre ce qui se passe réellement  
et ce que vous voyez dans vos tableaux de bord.

> *Quand les chiffres sont faux,  
> c’est vous qu’on regarde.*

---

## 🧱 GROUPE 1 — CE QUE VOUS VIVEZ (4 cartes)

### CARTE 1 — Retard
**Vous pilotez avec du retard**  
Clôtures mensuelles à J+15, J+30, parfois J+45.  
Vous prenez des décisions **sur le passé**.  
> "Vous pilotez en regardant dans le rétroviseur."  
**15–45 jours** — Délai moyen de disponibilité

### CARTE 2 — Excel
**Excel est au cœur des processus**  
Exports manuels. Versions multiples. Corrections à la main.  
Dépendance à une personne clé.  
> "Le moindre écart peut vous coûter cher."  
**73%** — des PME utilisent encore Excel

### CARTE 3 — Ajustements
**Les chiffres sont ajustés après coup**  
Recalculs. Corrections manuelles. La confiance s’effondre.  
> "Même vous, vous n’y croyez plus."  
**68%** — des dirigeants doutent de leurs chiffres

### CARTE 4 — Justificatifs
**Les justificatifs restent difficiles à produire**  
Impossible de fournir une preuve immédiate.  
Temps perdu à expliquer, reconstruire, justifier.  
> "Vous gérez dans l’urgence."  
**+10 Md€** — de redressements par an

---

## 🧱 GROUPE 2 — POURQUOI ÇA ARRIVE (cause racine)

Ce n’est pas votre outil.  
Ce n’est pas votre équipe.

👉 Le problème est structurel :

- Les événements réels (vente, paiement, stock) arrivent **trop tard** dans vos reportings  
- Les données sont **exportées**, **manipulées**, **retraitées**  
- La vérité devient **fragile**, **discutable**, dépendante d’une personne  

> *La finance ne devrait pas être une enquête.*

---

## 🧱 GROUPE 3 — CE QUE ÇA VOUS COÛTE (impact CFO)

Ce flou vous coûte :

- des **mauvaises décisions**
- du **stress en clôture**
- une **perte de crédibilité**
- une dépendance à une personne clé
- un **risque fiscal réel**

> *Vous ne devriez jamais croiser les doigts  
> en fin de mois.*

---

## 🎯 TRANSITION VERS LA SOLUTION

La bonne nouvelle ?

👉 **Ce problème n’est pas une fatalité.**

Il existe un moyen de produire :

- une vérité **immédiate**
- des chiffres **non modifiables**
- des preuves **opposables**

➡️ **Découvrez comment Dorevia-Vault sécurise enfin vos chiffres.**

---

## 🏁 Résumé

- Persona CFO respecté  
- Structure persuasive claire  
- Cartes = pilier UX, cause racine + impact en blocs dédiés  
- Transition naturelle vers solution + CTA  

---

**Fin de document**
