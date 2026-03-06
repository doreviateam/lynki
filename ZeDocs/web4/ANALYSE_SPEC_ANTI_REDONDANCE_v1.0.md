# 🔍 Analyse — SPEC Anti-Redondance Section "Comment ça fonctionne"

**Date** : 2026-01-19  
**Analyse de** : SPEC Anti-Redondance v1.0  
**Section** : Comment ça fonctionne

---

## 📊 État actuel vs SPEC

### Titre
**Actuel** : "Comment ça fonctionne ?"  
**SPEC** : "Comment ça fonctionne"  
**Différence** : Point d'interrogation à supprimer ✅

---

### Sous-titre
**Actuel** :
> Un processus automatique, en arrière-plan,  
> sans changer vos habitudes.

**SPEC** :
> Automatique. En arrière-plan. Sans rien changer pour vous.

**Différence** :
- ✅ Plus concis (3 phrases courtes)
- ✅ Même message mais plus percutant
- ✅ "Sans rien changer pour vous" au lieu de "sans changer vos habitudes"

**Action** : Remplacer par version SPEC ✅

---

### Carte 1 — VALIDER

**Actuel** :
- Titre : "VALIDER"
- Sous-titre : "Depuis vos outils habituels"
- Liste :
  - Vous validez une facture
  - Vous encaissez un paiement
  - Vous continuez à travailler normalement
- Message : "👉 Rien ne change pour vous"

**SPEC** :
- Titre : "VALIDER"
- Sous-titre : "(dans votre ERP)"
- Liste :
  - Facture validée
  - Paiement encaissé
- Micro-ligne : *Comme d'habitude.*

**Différences** :
- ❌ Sous-titre différent : "Depuis vos outils habituels" vs "(dans votre ERP)"
- ❌ Liste : 3 items vs 2 items (plus concis dans SPEC)
- ❌ Message : "👉 Rien ne change pour vous" vs "*Comme d'habitude.*" (plus court)
- ❌ "Vous continuez à travailler normalement" → redondant avec message

**Action** : Appliquer version SPEC ✅

---

### Carte 2 — SCELLER

**Actuel** :
- Titre : "SCELLER"
- Sous-titre : "Dorevia-Vault agit automatiquement"
- Liste :
  - Horodatage précis
  - Empreinte cryptographique
  - Enregistrement dans un journal immuable
- Message : "👉 Les données deviennent inaltérables"

**SPEC** :
- Titre : "SCELLER"
- Sous-titre : "(Dorevia-Vault agit)"
- Liste :
  - Horodatage
  - Empreinte cryptographique
  - Journal immuable
- Micro-ligne : *Les données deviennent inaltérables.*

**Différences** :
- ❌ Sous-titre : "Dorevia-Vault agit automatiquement" → "automatiquement" redondant (déjà dans sous-titre section)
- ❌ Liste : "Horodatage précis" → "Horodatage" (plus concis)
- ❌ Liste : "Enregistrement dans un journal immuable" → "Journal immuable" (plus concis)
- ✅ Message identique

**Action** : Appliquer version SPEC ✅

---

### Carte 3 — PROUVER

**Actuel** :
- Titre : "PROUVER"
- Sous-titre : "À tout moment"
- Liste :
  - Export d'une preuve
  - Vérification indépendante
  - Utilisable en cas de contrôle
- Message : "👉 Vous pouvez démontrer ce qui s'est passé"

**SPEC** :
- Titre : "PROUVER"
- Sous-titre : "(quand vous voulez)"
- Liste :
  - Export de preuve
  - Vérification indépendante
  - Opposable en cas de contrôle
- Micro-ligne : *Vous démontrez ce qui s'est passé.*

**Différences** :
- ❌ Sous-titre : "À tout moment" vs "(quand vous voulez)" (même sens, SPEC plus personnel)
- ❌ Liste : "Export d'une preuve" vs "Export de preuve" (plus concis)
- ❌ Liste : "Utilisable en cas de contrôle" vs "Opposable en cas de contrôle" (plus précis juridiquement)
- ❌ Message : "👉 Vous pouvez démontrer" vs "*Vous démontrez*" (plus direct, présent)

**Action** : Appliquer version SPEC ✅

---

### Message central / Conclusion

**Actuel** :
> **Vous continuez à travailler normalement.**  
> Dorevia-Vault travaille pour vous.

**SPEC** :
> **Vous ne changez rien. Vous gagnez une preuve.**

**Différences** :
- ❌ Actuel : 2 phrases, reformule le sous-titre ("normalement" = "sans rien changer")
- ✅ SPEC : 2 phrases courtes, message unique (gain = preuve)
- ✅ SPEC : Plus percutant, pas de redondance avec sous-titre

**Action** : Remplacer par version SPEC ✅

---

### CTA

**Actuel** :
```html
<a href="{{ path('contact') }}" 
   class="ud-main-btn"
   aria-label="Voir un exemple de preuve Dorevia-Vault">
    👉 Voir un exemple de preuve
</a>
```

**SPEC** :
```html
<a href="#" class="cta-button">
  👉 Voir la démo
</a>
```

**Différences** :
- ❌ Texte : "Voir un exemple de preuve" vs "Voir la démo"
- ❌ Lien : `path('contact')` vs `href="#"`
- ⚠️ SPEC : `href="#"` semble être un placeholder (à confirmer)

**Action** : Appliquer texte SPEC, garder `path('contact')` si `href="#"` est placeholder

---

## 🔍 Redondances identifiées

### R1 — Promesse répétée ❌

**Problème** :
- Sous-titre : "automatique, en arrière-plan, sans changer"
- Carte 2 : "Dorevia-Vault agit **automatiquement**" → Redondant
- Conclusion actuelle : "Vous continuez à travailler **normalement**" → Redondant avec "sans changer"

**Solution SPEC** :
- Sous-titre : "Automatique. En arrière-plan. Sans rien changer pour vous."
- Carte 2 : "(Dorevia-Vault agit)" → Supprime "automatiquement"
- Conclusion : "Vous ne changez rien. Vous gagnez une preuve." → Pas de redondance

---

### R2 — Informations uniques ✅

**Actuel** :
- VALIDER : Action utilisateur ✅
- SCELLER : Action système ✅
- PROUVER : Résultat ✅

**SPEC** : Même logique, mais contenu plus concis ✅

---

### R3 — Conclusion unique ❌

**Problème actuel** :
- Conclusion : "Vous continuez à travailler normalement" → Reformule le sous-titre

**Solution SPEC** :
- Conclusion : "Vous ne changez rien. Vous gagnez une preuve." → Message unique (gain)

---

### R4 — CTA unique ✅

**Actuel** : Un seul CTA ✅  
**SPEC** : Un seul CTA ✅

---

## ✅ Checklist de validation

### Avant corrections
- [ ] "Automatique" présent une seule fois ❌ (sous-titre + carte 2)
- [ ] "En arrière-plan" présent une seule fois ✅
- [ ] Aucune carte ne répète la promesse ❌ (carte 2 répète "automatique")
- [ ] Une seule phrase de conclusion ❌ (redondante avec sous-titre)
- [ ] Un seul CTA ✅

### Après corrections (selon SPEC)
- [x] "Automatique" présent une seule fois ✅ (sous-titre uniquement)
- [x] "En arrière-plan" présent une seule fois ✅
- [x] Aucune carte ne répète la promesse ✅
- [x] Une seule phrase de conclusion ✅ (message unique)
- [x] Un seul CTA ✅

---

## 🎯 Recommandations

### Appliquer SPEC v1.0 ✅

**Avantages** :
- ✅ Suppression de toutes les redondances
- ✅ Message plus percutant
- ✅ Lecture plus fluide
- ✅ Impact renforcé

**Actions** :
1. Modifier sous-titre
2. Modifier contenu des 3 cartes
3. Modifier conclusion
4. Modifier CTA (texte, garder `path('contact')` si `href="#"` est placeholder)

---

## 📝 Notes techniques

### CTA href="#"
La SPEC indique `href="#"` mais cela semble être un placeholder.  
**Recommandation** : Garder `href="{{ path('contact') }}"` pour fonctionnalité réelle.

### Format micro-ligne
La SPEC utilise *italique* pour les micro-lignes.  
**Implémentation** : Utiliser `<em>` ou classe CSS `comment-block-message` avec style italic.

---

## ✅ Conclusion

La SPEC v1.0 est **excellente** et résout tous les problèmes de redondance identifiés.  
**Recommandation** : Appliquer intégralement.

---

**Fin de l'analyse**
